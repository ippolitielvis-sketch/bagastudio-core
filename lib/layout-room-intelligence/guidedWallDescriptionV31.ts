export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type WallIntelligenceV30CheckStatus = "ready" | "review" | "blocked";
export type WallIntelligenceV30WallType = "unknown" | "drywall" | "masonry" | "concrete" | "wood" | "technical";
export type WallIntelligenceV30Confidence = "unknown" | "low" | "medium" | "high";

export type WallIntelligenceV30Profile = {
  id: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  thicknessMm?: number | null;
  estimatedMaxLoadKg?: number | null;
  confidence: WallIntelligenceV30Confidence;
  futureEvidenceSlots: string[];
  requiresInstallerVerification: boolean;
  acceptedForPreliminaryLayout: boolean;
};

export type WallIntelligenceEngineV30Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  wallProfiles: WallIntelligenceV30Profile[];
};

export type WallIntelligenceV31QuestionType = "select" | "number" | "text" | "boolean" | "evidence";
export type WallIntelligenceV31AnswerStatus = "answered" | "missing" | "needs_confirmation";

export type WallIntelligenceV31GuidedQuestion = {
  id: string;
  label: string;
  questionType: WallIntelligenceV31QuestionType;
  required: boolean;
  defaultValue: string;
  status: WallIntelligenceV31AnswerStatus;
  validatorHint: string;
};

export type WallIntelligenceV31ClientWallCard = {
  id: string;
  sourceWallId: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  confidence: WallIntelligenceV30Confidence;
  completionPercent: number;
  missingRequiredFields: string[];
  guidedQuestions: WallIntelligenceV31GuidedQuestion[];
  evidenceSlots: {
    clientDescription: boolean;
    photoFuture: boolean;
    dwgDxfFuture: boolean;
    installerNoteFuture: boolean;
  };
  validatorDecision: WallIntelligenceV30CheckStatus;
  note: string;
};

export type WallIntelligenceGuidedDescriptionV31Report = {
  schema: "bagastudio-wall-intelligence-guided-description-v3-1";
  version: "3.1";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceWallEngineSchema: WallIntelligenceEngineV30Report["schema"];
  principle: {
    clientDescriptionFirst: boolean;
    photoDwgAsEvidenceLater: boolean;
    unknownAllowedForPreliminaryLayout: boolean;
    installerVerificationRequiredForCriticalFixings: boolean;
  };
  clientWallCards: WallIntelligenceV31ClientWallCard[];
  totals: {
    cards: number;
    completed: number;
    incomplete: number;
    questions: number;
    missingRequired: number;
    review: number;
    blocked: number;
  };
  nextActions: string[];
};

export function buildWallIntelligenceGuidedDescriptionV31Report(params: {
  wallEngineV30: WallIntelligenceEngineV30Report;
}): WallIntelligenceGuidedDescriptionV31Report {
  const buildQuestions = (wall: WallIntelligenceV30Profile): WallIntelligenceV31GuidedQuestion[] => {
    const isUnknown = wall.wallType === "unknown";
    return [
      {
        id: `${wall.id}-q-wall-type`,
        label: "Che tipo di parete è?",
        questionType: "select",
        required: true,
        defaultValue: wall.wallType === "unknown" ? "Da scegliere: muratura / cartongesso / legno / calcestruzzo / parete tecnica" : wall.wallType,
        status: isUnknown ? "missing" : "answered",
        validatorHint: "Serve per scegliere ferramenta, fissaggi, soglie carico e livello di confidenza.",
      },
      {
        id: `${wall.id}-q-thickness`,
        label: "Spessore parete stimato o conosciuto",
        questionType: "number",
        required: false,
        defaultValue: wall.thicknessMm ? `${wall.thicknessMm} mm` : "Non dichiarato",
        status: wall.thicknessMm ? "answered" : "needs_confirmation",
        validatorHint: "Dato utile ma non sempre disponibile: se manca il sistema resta in review tecnica.",
      },
      {
        id: `${wall.id}-q-load`,
        label: "Carico massimo stimato o presenza rinforzi/montanti",
        questionType: "text",
        required: true,
        defaultValue: wall.estimatedMaxLoadKg ? `${wall.estimatedMaxLoadKg} kg stimati` : "Da descrivere dal cliente/installatore",
        status: wall.estimatedMaxLoadKg ? "answered" : "missing",
        validatorHint: "Necessario per specchi, mensole, pensili e mobili sospesi.",
      },
      {
        id: `${wall.id}-q-obstacles`,
        label: "Ci sono impianti, prese, tubazioni o ostacoli sulla parete?",
        questionType: "text",
        required: false,
        defaultValue: "Da compilare in scheda cliente",
        status: "needs_confirmation",
        validatorHint: "Alimenta punti tecnici, collisioni, forature e schede parete.",
      },
      {
        id: `${wall.id}-q-evidence`,
        label: "Foto/pianta/DWG disponibili per conferma futura",
        questionType: "evidence",
        required: false,
        defaultValue: wall.futureEvidenceSlots.join(" · "),
        status: "needs_confirmation",
        validatorHint: "Non sostituisce la descrizione cliente: la conferma o la corregge.",
      },
    ];
  };

  const clientWallCards = params.wallEngineV30.wallProfiles.map((wall) => {
    const guidedQuestions = buildQuestions(wall);
    const missingRequiredFields = guidedQuestions
      .filter((question) => question.required && question.status !== "answered")
      .map((question) => question.label);
    const answered = guidedQuestions.filter((question) => question.status === "answered").length;
    const completionPercent = Math.round((answered / guidedQuestions.length) * 100);
    const validatorDecision: WallIntelligenceV30CheckStatus = missingRequiredFields.length > 1
      ? "review"
      : wall.acceptedForPreliminaryLayout
        ? "ready"
        : "blocked";

    return {
      id: `v3-1-client-wall-card-${wall.id}`,
      sourceWallId: wall.id,
      label: wall.label,
      wallType: wall.wallType,
      confidence: wall.confidence,
      completionPercent,
      missingRequiredFields,
      guidedQuestions,
      evidenceSlots: {
        clientDescription: true,
        photoFuture: wall.futureEvidenceSlots.some((slot) => slot.toLowerCase().includes("foto")),
        dwgDxfFuture: wall.futureEvidenceSlots.some((slot) => slot.toLowerCase().includes("dwg") || slot.toLowerCase().includes("dxf")),
        installerNoteFuture: wall.requiresInstallerVerification,
      },
      validatorDecision,
      note: missingRequiredFields.length
        ? "Scheda parete utilizzabile per layout preliminare, ma non ancora sufficiente per confermare fissaggi critici."
        : "Scheda parete compilata in modo sufficiente per pre-validazione tecnica.",
    };
  });

  const missingRequired = clientWallCards.reduce((sum, card) => sum + card.missingRequiredFields.length, 0);
  const blocked = clientWallCards.filter((card) => card.validatorDecision === "blocked").length;
  const review = clientWallCards.filter((card) => card.validatorDecision === "review").length;
  const completed = clientWallCards.filter((card) => card.missingRequiredFields.length === 0).length;

  return {
    schema: "bagastudio-wall-intelligence-guided-description-v3-1",
    version: "3.1",
    generatedAt: new Date().toISOString(),
    status: params.wallEngineV30.status === "LAYOUT_V2_BLOCKED" || blocked > 0
      ? "LAYOUT_V2_BLOCKED"
      : review > 0 || missingRequired > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceWallEngineSchema: params.wallEngineV30.schema,
    principle: {
      clientDescriptionFirst: true,
      photoDwgAsEvidenceLater: true,
      unknownAllowedForPreliminaryLayout: true,
      installerVerificationRequiredForCriticalFixings: true,
    },
    clientWallCards,
    totals: {
      cards: clientWallCards.length,
      completed,
      incomplete: clientWallCards.length - completed,
      questions: clientWallCards.reduce((sum, card) => sum + card.guidedQuestions.length, 0),
      missingRequired,
      review,
      blocked,
    },
    nextActions: [
      "Trasformare le domande guida in campi editabili dell'Admin/Room Editor.",
      "Salvare le risposte cliente nel Product Package e nel progetto layout.",
      "Collegare ogni scheda parete agli elementi installati su quella parete.",
      "Preparare V3.2: Wall Evidence Bridge per collegare foto, pianta, DWG/DXF e note installatore come prove di conferma.",
    ],
  };
}