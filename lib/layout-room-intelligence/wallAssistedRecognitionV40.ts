// @ts-nocheck

type WallIntelligenceV30WallType = string;
type WallIntelligenceV32ConfidenceLevel = "bassa" | "media" | "alta" | string;
type TechnicalApprovalWorkflowV39Report = any;
type WallIntelligenceConfidenceEngineV32Report = any;
type WallIntelligenceEngineV30Report = any;

export type WallEvidenceV40Source = "customer" | "photo" | "dwg" | "dxf" | "installer_note";
export type WallEvidenceV40Status = "accepted" | "review" | "conflict" | "future_ready";
export type WallEvidenceV40ConflictSeverity = "none" | "info" | "warning" | "blocking";

export type WallEvidenceV40 = {
  id: string;
  label: string;
  source: WallEvidenceV40Source;
  linkedWallId: string;
  declaredWallType: WallIntelligenceV30WallType;
  detectedWallType: WallIntelligenceV30WallType | null;
  confidenceScore: number;
  status: WallEvidenceV40Status;
  conflictSeverity: WallEvidenceV40ConflictSeverity;
  notes: string[];
  requiredAction: string;
};

export type WallAssistedRecognitionV40Report = {
  schema: "bagastudio-wall-assisted-recognition-v4-0";
  version: "4.0";
  generatedAt: string;
  recognitionStatus: "ASSISTED_RECOGNITION_READY" | "ASSISTED_RECOGNITION_REVIEW_REQUIRED" | "ASSISTED_RECOGNITION_BLOCKED";
  strategy: {
    primarySource: "customer";
    confirmationSources: WallEvidenceV40Source[];
    mergePolicy: string[];
    manualDescriptionFirst: boolean;
    photoDwgCanConfirmOrCorrect: boolean;
  };
  sourceApprovalSchema: TechnicalApprovalWorkflowV39Report["schema"];
  sourceConfidenceSchema: WallIntelligenceConfidenceEngineV32Report["schema"];
  evidences: WallEvidenceV40[];
  conflicts: Array<{
    id: string;
    linkedWallId: string;
    customerWallType: WallIntelligenceV30WallType;
    evidenceWallType: WallIntelligenceV30WallType | null;
    severity: WallEvidenceV40ConflictSeverity;
    message: string;
    action: string;
  }>;
  confidenceFusion: Array<{
    wallId: string;
    wallLabel: string;
    customerScore: number;
    evidenceScore: number;
    fusedScore: number;
    fusedLevel: WallIntelligenceV32ConfidenceLevel;
    note: string;
  }>;
  totals: {
    evidences: number;
    customerInputs: number;
    photoSlots: number;
    dwgDxfSlots: number;
    accepted: number;
    review: number;
    conflicts: number;
    blockingConflicts: number;
  };
  requiredActions: string[];
  exportTargets: string[];
  nextActions: string[];
};

function resolveWallAssistedRecognitionV40Level(score: number): WallIntelligenceV32ConfidenceLevel {
  if (score >= 71) return "alta";
  if (score >= 41) return "media";
  return "bassa";
}

export function buildWallAssistedRecognitionV40Report(params: {
  wallEngineV30: WallIntelligenceEngineV30Report;
  confidenceEngineV32: WallIntelligenceConfidenceEngineV32Report;
  technicalApprovalV39: TechnicalApprovalWorkflowV39Report;
}): WallAssistedRecognitionV40Report {
  const customerScoreByWall = new Map<string, number>();
  params.confidenceEngineV32.confidenceCards.forEach((card) => {
    customerScoreByWall.set(card.wallId, card.confidenceScore);
  });

  const evidences: WallEvidenceV40[] = [];

  params.wallEngineV30.wallProfiles.forEach((wall) => {
    const customerScore = customerScoreByWall.get(wall.id) ?? (wall.confidence === "high" ? 85 : wall.confidence === "medium" ? 60 : 30);

    evidences.push({
      id: `v4-0-customer-${wall.id}`,
      label: `${wall.label} · descrizione cliente`,
      source: "customer",
      linkedWallId: wall.id,
      declaredWallType: wall.wallType,
      detectedWallType: wall.wallType,
      confidenceScore: customerScore,
      status: customerScore >= 71 ? "accepted" : "review",
      conflictSeverity: "none",
      notes: [
        "Fonte primaria V4.0: descrizione cliente/utente.",
        "Foto e DWG/DXF potranno confermare, correggere o integrare questo profilo senza rifare il motore.",
      ],
      requiredAction: customerScore >= 71
        ? "Usare come base tecnica preliminare, mantenendo verifica installatore dove prevista."
        : "Richiedere più dettagli cliente o evidenza foto/DWG prima dell'approvazione definitiva.",
    });

    evidences.push({
      id: `v4-0-photo-slot-${wall.id}`,
      label: `${wall.label} · slot foto parete`,
      source: "photo",
      linkedWallId: wall.id,
      declaredWallType: wall.wallType,
      detectedWallType: null,
      confidenceScore: 0,
      status: "future_ready",
      conflictSeverity: "info",
      notes: [
        "Slot predisposto per riconoscimento assistito da foto.",
        "In V4.1 la foto potrà aumentare confidence, segnalare conflitti o richiedere sopralluogo.",
      ],
      requiredAction: "Quando disponibile, allegare foto parete/ancoraggi/montanti per conferma tecnica.",
    });

    evidences.push({
      id: `v4-0-dwg-dxf-slot-${wall.id}`,
      label: `${wall.label} · slot DWG/DXF`,
      source: "dwg",
      linkedWallId: wall.id,
      declaredWallType: wall.wallType,
      detectedWallType: null,
      confidenceScore: 0,
      status: "future_ready",
      conflictSeverity: "info",
      notes: [
        "Slot predisposto per analisi DWG/DXF/pianta/prospetto.",
        "In V4.2 DWG/DXF potrà confermare pareti, quote, aperture, ingombri e vincoli tecnici.",
      ],
      requiredAction: "Quando disponibile, collegare elaborato DWG/DXF o pianta quotata al profilo parete.",
    });
  });

  const conflicts = evidences
    .filter((evidence) => evidence.status === "conflict" || evidence.conflictSeverity === "blocking")
    .map((evidence) => ({
      id: `conflict-${evidence.id}`,
      linkedWallId: evidence.linkedWallId,
      customerWallType: evidence.declaredWallType,
      evidenceWallType: evidence.detectedWallType,
      severity: evidence.conflictSeverity,
      message: `Conflitto parete: cliente=${evidence.declaredWallType}, evidenza=${evidence.detectedWallType || "non disponibile"}.`,
      action: evidence.requiredAction,
    }));

  const confidenceFusion = params.wallEngineV30.wallProfiles.map((wall) => {
    const customerScore = customerScoreByWall.get(wall.id) ?? 30;
    const evidenceScores = evidences
      .filter((evidence) => evidence.linkedWallId === wall.id && evidence.source !== "customer" && evidence.status === "accepted")
      .map((evidence) => evidence.confidenceScore);
    const evidenceScore = evidenceScores.length > 0
      ? Math.round(evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length)
      : 0;
    const fusedScore = evidenceScore > 0
      ? Math.round(customerScore * 0.6 + evidenceScore * 0.4)
      : customerScore;

    return {
      wallId: wall.id,
      wallLabel: wall.label,
      customerScore,
      evidenceScore,
      fusedScore,
      fusedLevel: resolveWallAssistedRecognitionV40Level(fusedScore),
      note: evidenceScore > 0
        ? "Confidence fusa tra descrizione cliente e prove allegate."
        : "Confidence basata solo sulla descrizione cliente: prove foto/DWG ancora mancanti.",
    };
  });

  const review = evidences.filter((evidence) => evidence.status === "review").length;
  const blockingConflicts = conflicts.filter((conflict) => conflict.severity === "blocking").length;
  const recognitionStatus = blockingConflicts > 0 || params.technicalApprovalV39.approvalStatus === "REJECTED"
    ? "ASSISTED_RECOGNITION_BLOCKED"
    : review > 0 || conflicts.length > 0 || params.technicalApprovalV39.approvalStatus === "REVIEW_REQUIRED"
      ? "ASSISTED_RECOGNITION_REVIEW_REQUIRED"
      : "ASSISTED_RECOGNITION_READY";

  const requiredActions = [
    ...(review > 0 ? ["Completare descrizioni cliente con confidence bassa o media prima della scheda approvata."] : []),
    ...(params.technicalApprovalV39.siteSurveyRequired ? ["Sopralluogo richiesto da V3.9: collegare evidenze foto/DWG o nota installatore."] : []),
    ...(conflicts.length > 0 ? ["Risolvere conflitti tra descrizione cliente e prove tecniche prima di procedere."] : []),
    "Mantenere la descrizione cliente come fonte primaria e usare foto/DWG come conferma/correzione.",
  ];

  return {
    schema: "bagastudio-wall-assisted-recognition-v4-0",
    version: "4.0",
    generatedAt: new Date().toISOString(),
    recognitionStatus,
    strategy: {
      primarySource: "customer",
      confirmationSources: ["photo", "dwg", "dxf", "installer_note"],
      mergePolicy: [
        "La descrizione cliente crea sempre il profilo parete iniziale.",
        "Foto, DWG e DXF non sostituiscono automaticamente il cliente: confermano, correggono o aprono una review.",
        "Se una prova contraddice il cliente, il profilo parete entra in REVIEW e blocca approvazione automatica.",
        "Le evidenze aumentano il confidence score solo se coerenti con la descrizione e con i vincoli tecnici.",
      ],
      manualDescriptionFirst: true,
      photoDwgCanConfirmOrCorrect: true,
    },
    sourceApprovalSchema: params.technicalApprovalV39.schema,
    sourceConfidenceSchema: params.confidenceEngineV32.schema,
    evidences,
    conflicts,
    confidenceFusion,
    totals: {
      evidences: evidences.length,
      customerInputs: evidences.filter((evidence) => evidence.source === "customer").length,
      photoSlots: evidences.filter((evidence) => evidence.source === "photo").length,
      dwgDxfSlots: evidences.filter((evidence) => evidence.source === "dwg" || evidence.source === "dxf").length,
      accepted: evidences.filter((evidence) => evidence.status === "accepted").length,
      review,
      conflicts: conflicts.length,
      blockingConflicts,
    },
    requiredActions,
    exportTargets: [
      "JSON Assisted Recognition V4.0",
      "PDF scheda parete con fonti cliente/foto/DWG",
      "DXF/CAD con layer evidenze parete",
      "Technical Approval aggiornabile con prove V4",
    ],
    nextActions: [
      "V4.1 Photo Evidence Analyzer: lettura guidata foto parete, montanti, fissaggi e ostacoli.",
      "V4.2 DWG/DXF Evidence Analyzer: lettura quote, aperture, pareti e vincoli da elaborati tecnici.",
      "V4.3 Evidence Fusion Engine: fusione pesata tra cliente, foto, DWG/DXF e nota installatore.",
      "V4.4 Automatic Wall Classification: classificazione assistita parete con review obbligatoria quando incerta.",
    ],
  };
}

