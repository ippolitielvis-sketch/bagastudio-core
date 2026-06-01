// @ts-nocheck
export type WallEvidenceFusionV43Source = "customer" | "photo" | "dwg_dxf" | "technical_approval" | "installer_note";
export type WallEvidenceFusionV43Status = "FUSION_READY" | "FUSION_REVIEW_REQUIRED" | "FUSION_BLOCKED";
export type WallEvidenceFusionV43ConflictSeverity = "info" | "warning" | "critical";

export type WallEvidenceFusionV43SourceScore = {
  source: WallEvidenceFusionV43Source;
  score: number;
  weight: number;
  contribution: number;
  status: string;
  note: string;
};

export type WallEvidenceFusionV43Conflict = {
  id: string;
  wallId: string;
  severity: WallEvidenceFusionV43ConflictSeverity;
  sourceA: WallEvidenceFusionV43Source;
  sourceB: WallEvidenceFusionV43Source;
  code: string;
  message: string;
  requiredAction: string;
};

export type WallEvidenceFusionV43Item = {
  wallId: string;
  wallLabel: string;
  declaredWallType: WallIntelligenceV30WallType;
  fusedConfidence: number;
  confidenceLevel: "low" | "medium" | "high";
  status: WallEvidenceFusionV43Status;
  customerRemainsPrimary: boolean;
  sourceScores: WallEvidenceFusionV43SourceScore[];
  conflicts: WallEvidenceFusionV43Conflict[];
  finalRecommendation: string;
};

export type WallEvidenceFusionV43Report = {
  schema: "bagastudio-wall-evidence-fusion-engine-v4-3";
  version: "4.3";
  generatedAt: string;
  fusionStatus: WallEvidenceFusionV43Status;
  sourceRecognitionSchema: WallAssistedRecognitionV40Report["schema"];
  sourcePhotoSchema: WallPhotoEvidenceV41Report["schema"];
  sourceDrawingSchema: WallDwgDxfEvidenceV42Report["schema"];
  fusionPolicy: {
    customerInputRemainsPrimary: boolean;
    evidenceCanIncreaseConfidence: boolean;
    conflictsForceReview: boolean;
    criticalInstallCannotBeAutoApproved: boolean;
    photoEnvironmentReadyForRenderArBridge: boolean;
  };
  items: WallEvidenceFusionV43Item[];
  totals: {
    walls: number;
    ready: number;
    review: number;
    blocked: number;
    conflicts: number;
    criticalConflicts: number;
    averageFusedConfidence: number;
  };
  requiredActions: string[];
  exportTargets: string[];
  nextActions: string[];
};

function clampWallEvidenceFusionV43(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveWallEvidenceFusionV43Level(score: number): "low" | "medium" | "high" {
  if (score >= 76) return "high";
  if (score >= 51) return "medium";
  return "low";
}

function resolveWallEvidenceFusionV43Status(params: {
  baseRecognitionStatus: WallAssistedRecognitionV40Report["recognitionStatus"];
  technicalApprovalStatus: TechnicalApprovalWorkflowV39Report["approvalStatus"];
  fusedConfidence: number;
  conflicts: WallEvidenceFusionV43Conflict[];
}): WallEvidenceFusionV43Status {
  if (params.baseRecognitionStatus === "ASSISTED_RECOGNITION_BLOCKED") return "FUSION_BLOCKED";
  if (params.technicalApprovalStatus === "rejected") return "FUSION_BLOCKED";
  if (params.conflicts.some((conflict) => conflict.severity === "critical")) return "FUSION_BLOCKED";
  if (params.conflicts.length > 0) return "FUSION_REVIEW_REQUIRED";
  if (params.fusedConfidence < 70) return "FUSION_REVIEW_REQUIRED";
  if (params.technicalApprovalStatus === "review") return "FUSION_REVIEW_REQUIRED";
  return "FUSION_READY";
}

export function buildWallEvidenceFusionV43Report(params: {
  assistedRecognitionV40: WallAssistedRecognitionV40Report;
  photoEvidenceV41: WallPhotoEvidenceV41Report;
  drawingEvidenceV42: WallDwgDxfEvidenceV42Report;
  technicalApprovalV39: TechnicalApprovalWorkflowV39Report;
}): WallEvidenceFusionV43Report {
  const photoByWall = new Map(params.photoEvidenceV41.items.map((item) => [item.linkedWallId, item]));
  const drawingByWall = new Map(params.drawingEvidenceV42.items.map((item) => [item.linkedWallId, item]));

  const items: WallEvidenceFusionV43Item[] = params.assistedRecognitionV40.confidenceFusion.map((fusion) => {
    const photo = photoByWall.get(fusion.wallId) || null;
    const drawing = drawingByWall.get(fusion.wallId) || null;
    const conflicts: WallEvidenceFusionV43Conflict[] = [];

    const customerScore = clampWallEvidenceFusionV43(fusion.customerScore || 0);
    const photoScore = photo
      ? photo.status === "PHOTO_READY"
        ? 82
        : photo.status === "PHOTO_REVIEW"
          ? 58
          : photo.status === "PHOTO_BLOCKED"
            ? 18
            : 35
      : 0;
    const drawingScore = drawing
      ? drawing.status === "DWG_READY"
        ? 88
        : drawing.status === "DWG_REVIEW"
          ? 62
          : drawing.status === "DWG_BLOCKED"
            ? 15
            : 32
      : 0;
    const approvalScore = params.technicalApprovalV39.approvalStatus === "approved"
      ? 92
      : params.technicalApprovalV39.approvalStatus === "review"
        ? 55
        : params.technicalApprovalV39.approvalStatus === "rejected"
          ? 0
          : 45;

    if (photo?.status === "PHOTO_BLOCKED") {
      conflicts.push({
        id: `v4-3-conflict-photo-${fusion.wallId}`,
        wallId: fusion.wallId,
        severity: "critical",
        sourceA: "customer",
        sourceB: "photo",
        code: "PHOTO_EVIDENCE_BLOCKED",
        message: "La foto collegata alla parete è bloccata o non utilizzabile per confermare il profilo tecnico.",
        requiredAction: "Richiedere nuova foto o review installatore prima di procedere.",
      });
    }

    if (drawing?.status === "DWG_BLOCKED") {
      conflicts.push({
        id: `v4-3-conflict-drawing-${fusion.wallId}`,
        wallId: fusion.wallId,
        severity: "critical",
        sourceA: "customer",
        sourceB: "dwg_dxf",
        code: "DRAWING_EVIDENCE_BLOCKED",
        message: "L'elaborato tecnico collegato è bloccato o incoerente con il workflow di approvazione.",
        requiredAction: "Verificare scala/layer/quote o richiedere elaborato corretto.",
      });
    }

    if (photo && drawing && photo.status === "PHOTO_REQUIRED" && drawing.status === "DWG_REQUIRED") {
      conflicts.push({
        id: `v4-3-conflict-missing-evidence-${fusion.wallId}`,
        wallId: fusion.wallId,
        severity: "warning",
        sourceA: "photo",
        sourceB: "dwg_dxf",
        code: "EVIDENCE_MISSING",
        message: "Mancano sia foto sia elaborato tecnico utilizzabile per confermare la descrizione cliente.",
        requiredAction: "Procedere solo in review o richiedere almeno una evidenza tecnica aggiuntiva.",
      });
    }

    if (customerScore < 55 && (photoScore < 50 || drawingScore < 50)) {
      conflicts.push({
        id: `v4-3-conflict-low-confidence-${fusion.wallId}`,
        wallId: fusion.wallId,
        severity: "warning",
        sourceA: "customer",
        sourceB: photoScore >= drawingScore ? "photo" : "dwg_dxf",
        code: "LOW_CONFIDENCE_FUSION",
        message: "La descrizione cliente ha confidenza bassa e le evidenze disponibili non la compensano.",
        requiredAction: "Richiedere sopralluogo, foto migliori o DWG/DXF quotato prima dell'approvazione.",
      });
    }

    const sourceScores: WallEvidenceFusionV43SourceScore[] = [
      {
        source: "customer",
        score: customerScore,
        weight: 0.45,
        contribution: customerScore * 0.45,
        status: "PRIMARY_SOURCE",
        note: "La descrizione cliente resta fonte primaria del profilo parete.",
      },
      {
        source: "photo",
        score: photoScore,
        weight: 0.2,
        contribution: photoScore * 0.2,
        status: photo?.status || "PHOTO_NOT_AVAILABLE",
        note: "La foto conferma o apre review, ma non approva da sola installazioni critiche.",
      },
      {
        source: "dwg_dxf",
        score: drawingScore,
        weight: 0.25,
        contribution: drawingScore * 0.25,
        status: drawing?.status || "DRAWING_NOT_AVAILABLE",
        note: "DWG/DXF conferma geometrie, quote, aperture e punti tecnici se coerente.",
      },
      {
        source: "technical_approval",
        score: approvalScore,
        weight: 0.1,
        contribution: approvalScore * 0.1,
        status: params.technicalApprovalV39.approvalStatus,
        note: "Il workflow tecnico blocca comunque i casi rejected/critical.",
      },
    ];

    const rawFusedConfidence = sourceScores.reduce((sum, source) => sum + source.contribution, 0);
    const conflictPenalty = conflicts.some((conflict) => conflict.severity === "critical") ? 28 : conflicts.length > 0 ? 12 : 0;
    const fusedConfidence = clampWallEvidenceFusionV43(rawFusedConfidence - conflictPenalty);
    const status = resolveWallEvidenceFusionV43Status({
      baseRecognitionStatus: params.assistedRecognitionV40.recognitionStatus,
      technicalApprovalStatus: params.technicalApprovalV39.approvalStatus,
      fusedConfidence,
      conflicts,
    });

    return {
      wallId: fusion.wallId,
      wallLabel: fusion.wallLabel,
      declaredWallType: fusion.declaredWallType,
      fusedConfidence,
      confidenceLevel: resolveWallEvidenceFusionV43Level(fusedConfidence),
      status,
      customerRemainsPrimary: true,
      sourceScores,
      conflicts,
      finalRecommendation: status === "FUSION_READY"
        ? "Profilo parete pronto per alimentare Technical Wall Report, preventivo e workflow installazione."
        : status === "FUSION_BLOCKED"
          ? "Profilo parete bloccato: correggere conflitti critici o completare sopralluogo prima dell'approvazione."
          : "Profilo parete da revisionare: servono evidenze migliori o conferma tecnica.",
    };
  });

  const allConflicts = items.flatMap((item) => item.conflicts);
  const blocked = items.filter((item) => item.status === "FUSION_BLOCKED").length;
  const review = items.filter((item) => item.status === "FUSION_REVIEW_REQUIRED").length;
  const ready = items.filter((item) => item.status === "FUSION_READY").length;
  const averageFusedConfidence = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.fusedConfidence, 0) / items.length)
    : 0;

  return {
    schema: "bagastudio-wall-evidence-fusion-engine-v4-3",
    version: "4.3",
    generatedAt: new Date().toISOString(),
    fusionStatus: blocked > 0
      ? "FUSION_BLOCKED"
      : review > 0
        ? "FUSION_REVIEW_REQUIRED"
        : "FUSION_READY",
    sourceRecognitionSchema: params.assistedRecognitionV40.schema,
    sourcePhotoSchema: params.photoEvidenceV41.schema,
    sourceDrawingSchema: params.drawingEvidenceV42.schema,
    fusionPolicy: {
      customerInputRemainsPrimary: true,
      evidenceCanIncreaseConfidence: true,
      conflictsForceReview: true,
      criticalInstallCannotBeAutoApproved: true,
      photoEnvironmentReadyForRenderArBridge: true,
    },
    items,
    totals: {
      walls: items.length,
      ready,
      review,
      blocked,
      conflicts: allConflicts.length,
      criticalConflicts: allConflicts.filter((conflict) => conflict.severity === "critical").length,
      averageFusedConfidence,
    },
    requiredActions: [
      ...(blocked > 0 ? ["Risolvere conflitti critici prima di approvare parete/installazione."] : []),
      ...(review > 0 ? ["Revisionare profili parete con confidence bassa/media o evidenze mancanti."] : []),
      "Mantenere la descrizione cliente come fonte primaria e usare foto/DWG come conferma o apertura review.",
      "Collegare il risultato V4.3 ai prossimi step di classificazione automatica e render/AR da foto ambiente.",
    ],
    exportTargets: [
      "JSON Evidence Fusion Engine V4.3",
      "Technical Wall Report aggiornato con confidence fusa",
      "Bridge verso Automatic Wall Classification V4.4",
      "Bridge verso Photo Environment Intelligence / Render / AR",
    ],
    nextActions: [
      "V4.4 Automatic Wall Classification: classificazione assistita parete con review obbligatoria.",
      "V4.5 Photo Environment Intelligence Bridge: usare foto locale anche per render e AR contestualizzati.",
      "V4.6 Technical Evidence Approval: approvazione evidenze prima del PDF finale.",
    ],
  };
}
