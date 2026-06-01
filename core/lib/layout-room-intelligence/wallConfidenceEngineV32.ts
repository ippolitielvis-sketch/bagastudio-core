export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type WallIntelligenceV30CheckStatus = "ready" | "review" | "blocked";
export type WallIntelligenceV30WallType = "unknown" | "drywall" | "masonry" | "concrete" | "wood" | "technical";

type WallIntelligenceV31GuidedQuestion = {
  required: boolean;
  status: "answered" | "missing" | "future_evidence" | string;
};

type WallIntelligenceV31EvidenceSlots = {
  clientDescription?: boolean;
  photoFuture?: boolean;
  dwgDxfFuture?: boolean;
  installerNoteFuture?: boolean;
};

type WallIntelligenceV31ClientWallCard = {
  id: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  guidedQuestions: WallIntelligenceV31GuidedQuestion[];
  evidenceSlots: WallIntelligenceV31EvidenceSlots;
  validatorDecision: WallIntelligenceV30CheckStatus;
  missingRequiredFields: string[];
};

export type WallIntelligenceGuidedDescriptionV31Report = {
  schema: string;
  clientWallCards: WallIntelligenceV31ClientWallCard[];
};

export type WallIntelligenceV32ConfidenceLevel = "bassa" | "media" | "alta";
export type WallIntelligenceV32VerificationAlertSeverity = "info" | "warning" | "error";

export type WallIntelligenceV32VerificationAlert = {
  id: string;
  severity: WallIntelligenceV32VerificationAlertSeverity;
  label: string;
  reason: string;
};

export type WallIntelligenceV32ConfidenceCard = {
  id: string;
  sourceWallCardId: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  confidenceScore: number;
  confidenceLevel: WallIntelligenceV32ConfidenceLevel;
  needsVerification: boolean;
  verificationReason: string;
  positiveSignals: string[];
  missingSignals: string[];
  alerts: WallIntelligenceV32VerificationAlert[];
  validatorDecision: WallIntelligenceV30CheckStatus;
};

export type WallIntelligenceConfidenceEngineV32Report = {
  schema: "bagastudio-wall-intelligence-confidence-engine-v3-2";
  version: "3.2";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceGuidedDescriptionSchema: WallIntelligenceGuidedDescriptionV31Report["schema"];
  thresholds: {
    lowMax: number;
    mediumMax: number;
    highMin: number;
  };
  confidenceCards: WallIntelligenceV32ConfidenceCard[];
  totals: {
    cards: number;
    high: number;
    medium: number;
    low: number;
    needsVerification: number;
    alerts: number;
    warnings: number;
    errors: number;
  };
  nextActions: string[];
};

export function buildWallIntelligenceConfidenceEngineV32Report(params: {
  guidedDescriptionV31: WallIntelligenceGuidedDescriptionV31Report;
}): WallIntelligenceConfidenceEngineV32Report {
  const getConfidenceLevel = (score: number): WallIntelligenceV32ConfidenceLevel => {
    if (score <= 40) return "bassa";
    if (score <= 70) return "media";
    return "alta";
  };

  const confidenceCards: WallIntelligenceV32ConfidenceCard[] = params.guidedDescriptionV31.clientWallCards.map((card) => {
    const answeredRequired = card.guidedQuestions.filter((question) => question.required && question.status === "answered").length;
    const totalRequired = Math.max(1, card.guidedQuestions.filter((question) => question.required).length);
    const answeredOptional = card.guidedQuestions.filter((question) => !question.required && question.status === "answered").length;
    const evidenceSignals = [
      card.evidenceSlots.clientDescription,
      card.evidenceSlots.photoFuture,
      card.evidenceSlots.dwgDxfFuture,
      card.evidenceSlots.installerNoteFuture,
    ].filter(Boolean).length;

    let score = 20;
    score += Math.round((answeredRequired / totalRequired) * 40);
    score += Math.min(15, answeredOptional * 5);
    score += Math.min(20, evidenceSignals * 5);
    if (card.wallType !== "unknown") score += 10;
    if (card.validatorDecision === "blocked") score -= 20;
    if (card.validatorDecision === "review") score -= 8;
    score = Math.max(0, Math.min(100, score));

    const confidenceLevel = getConfidenceLevel(score);
    const missingSignals: string[] = [];
    const positiveSignals: string[] = [];
    const alerts: WallIntelligenceV32VerificationAlert[] = [];

    if (card.wallType === "unknown") {
      missingSignals.push("Tipo parete non dichiarato");
      alerts.push({
        id: `${card.id}-unknown-wall-type`,
        severity: "error",
        label: "Tipo parete non verificato",
        reason: "Senza tipo parete il sistema non può confermare fissaggi, carichi e ferramenta.",
      });
    } else {
      positiveSignals.push("Tipo parete dichiarato");
    }

    if (card.missingRequiredFields.length > 0) {
      missingSignals.push(...card.missingRequiredFields);
      alerts.push({
        id: `${card.id}-missing-required-fields`,
        severity: "warning",
        label: "Dati insufficienti",
        reason: `Campi richiesti mancanti: ${card.missingRequiredFields.join(" · ")}`,
      });
    } else {
      positiveSignals.push("Campi richiesti compilati");
    }

    if (!card.evidenceSlots.photoFuture && !card.evidenceSlots.dwgDxfFuture && !card.evidenceSlots.installerNoteFuture) {
      missingSignals.push("Nessuna prova futura collegata");
      alerts.push({
        id: `${card.id}-no-evidence`,
        severity: "info",
        label: "Verifica installatore consigliata",
        reason: "Foto, DWG/DXF o nota installatore potranno aumentare la confidenza senza rifare il profilo parete.",
      });
    } else {
      positiveSignals.push("Evidenza futura predisposta");
    }

    if (confidenceLevel === "bassa") {
      alerts.push({
        id: `${card.id}-low-confidence`,
        severity: "error",
        label: "Confidenza bassa",
        reason: "Usare solo per layout preliminare; bloccare conferma fissaggi critici finché mancano dati affidabili.",
      });
    }

    const needsVerification = confidenceLevel !== "alta" || alerts.some((alert) => alert.severity === "error");
    const verificationReason = needsVerification
      ? missingSignals.length
        ? missingSignals.join(" · ")
        : "Verifica consigliata prima di generare scheda tecnica definitiva."
      : "Dati sufficienti per pre-validazione tecnica ad alta confidenza.";

    return {
      id: `v3-2-confidence-${card.id}`,
      sourceWallCardId: card.id,
      label: card.label,
      wallType: card.wallType,
      confidenceScore: score,
      confidenceLevel,
      needsVerification,
      verificationReason,
      positiveSignals,
      missingSignals,
      alerts,
      validatorDecision: alerts.some((alert) => alert.severity === "error")
        ? "blocked"
        : alerts.some((alert) => alert.severity === "warning") || card.validatorDecision === "review"
          ? "review"
          : "ready",
    };
  });

  const errors = confidenceCards.reduce((sum, card) => sum + card.alerts.filter((alert) => alert.severity === "error").length, 0);
  const warnings = confidenceCards.reduce((sum, card) => sum + card.alerts.filter((alert) => alert.severity === "warning").length, 0);

  return {
    schema: "bagastudio-wall-intelligence-confidence-engine-v3-2",
    version: "3.2",
    generatedAt: new Date().toISOString(),
    status: errors > 0
      ? "LAYOUT_V2_BLOCKED"
      : warnings > 0 || confidenceCards.some((card) => card.needsVerification)
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceGuidedDescriptionSchema: params.guidedDescriptionV31.schema,
    thresholds: {
      lowMax: 40,
      mediumMax: 70,
      highMin: 71,
    },
    confidenceCards,
    totals: {
      cards: confidenceCards.length,
      high: confidenceCards.filter((card) => card.confidenceLevel === "alta").length,
      medium: confidenceCards.filter((card) => card.confidenceLevel === "media").length,
      low: confidenceCards.filter((card) => card.confidenceLevel === "bassa").length,
      needsVerification: confidenceCards.filter((card) => card.needsVerification).length,
      alerts: confidenceCards.reduce((sum, card) => sum + card.alerts.length, 0),
      warnings,
      errors,
    },
    nextActions: [
      "Collegare il confidenceScore ai gate di schede tecniche PDF/DXF/CAD.",
      "Permettere ad Admin/cliente di aggiungere foto, note installatore e DWG/DXF come evidenze progressive.",
      "Preparare V3.3: Wall Load Analyzer con carichi, pesi, fissaggi e soglie parete.",
    ],
  };
}
