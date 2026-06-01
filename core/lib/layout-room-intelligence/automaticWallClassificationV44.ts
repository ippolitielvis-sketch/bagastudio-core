// @ts-nocheck
export type AutomaticWallClassificationV44Status = "CLASSIFICATION_READY" | "CLASSIFICATION_REVIEW_REQUIRED" | "CLASSIFICATION_BLOCKED";
export type AutomaticWallClassificationV44CandidateSource = "customer" | "photo" | "dwg_dxf" | "fusion" | "technical_rule";

export type AutomaticWallClassificationV44Candidate = {
  wallType: any;
  source: AutomaticWallClassificationV44CandidateSource;
  confidence: number;
  reason: string;
};

export type AutomaticWallClassificationV44Item = {
  wallId: string;
  wallLabel: string;
  declaredWallType: any;
  classifiedWallType: any;
  finalConfidence: number;
  status: AutomaticWallClassificationV44Status;
  reviewRequired: boolean;
  customerInputRemainsPrimary: boolean;
  candidates: AutomaticWallClassificationV44Candidate[];
  conflicts: any[];
  classificationNotes: string[];
  requiredAction: string;
};

export type AutomaticWallClassificationV44Report = {
  schema: "bagastudio-automatic-wall-classification-v4-4";
  version: "4.4";
  generatedAt: string;
  classificationStatus: AutomaticWallClassificationV44Status;
  policy: {
    customerInputRemainsPrimary: boolean;
    automaticClassificationIsAssistive: boolean;
    conflictsForceReview: boolean;
    criticalFusionBlocksAutoClassification: boolean;
    photoDwgCanSuggestButNotOverwrite: boolean;
  };
  items: AutomaticWallClassificationV44Item[];
  totals: {
    walls: number;
    ready: number;
    review: number;
    blocked: number;
    changedSuggestions: number;
    averageConfidence: number;
  };
  requiredActions: string[];
  exportTargets: string[];
  nextActions: string[];
};

function normalizeAutomaticWallClassificationV44Score(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreAutomaticWallCandidateV44(params: {
  declaredWallType: any;
  candidateWallType: any;
  source: AutomaticWallClassificationV44CandidateSource;
  baseConfidence: number;
}) {
  const sameTypeBonus = params.declaredWallType === params.candidateWallType ? 8 : -18;
  const sourceWeight =
    params.source === "customer" ? 1 :
    params.source === "dwg_dxf" ? 0.92 :
    params.source === "photo" ? 0.82 :
    params.source === "fusion" ? 0.96 :
    0.74;

  return normalizeAutomaticWallClassificationV44Score(params.baseConfidence * sourceWeight + sameTypeBonus);
}

function inferAutomaticWallTypeFromEvidenceV44(params: {
  fusionItem: any;
  photoItem?: any;
  drawingItem?: any;
}): AutomaticWallClassificationV44Candidate[] {
  const candidates: AutomaticWallClassificationV44Candidate[] = [];
  const declaredWallType = params.fusionItem.declaredWallType;

  candidates.push({
    wallType: declaredWallType,
    source: "customer",
    confidence: scoreAutomaticWallCandidateV44({
      declaredWallType,
      candidateWallType: declaredWallType,
      source: "customer",
      baseConfidence: params.fusionItem.sourceScores.find((source) => source.source === "customer")?.score || params.fusionItem.fusedConfidence,
    }),
    reason: "Tipo parete dichiarato dal cliente/utente: resta la fonte primaria del workflow V4.4.",
  });

  if (params.photoItem) {
    const photoCandidateConfidence = params.photoItem.status === "PHOTO_READY" ? 74 : params.photoItem.status === "PHOTO_REVIEW" ? 52 : 28;
    candidates.push({
      wallType: declaredWallType,
      source: "photo",
      confidence: scoreAutomaticWallCandidateV44({
        declaredWallType,
        candidateWallType: declaredWallType,
        source: "photo",
        baseConfidence: photoCandidateConfidence,
      }),
      reason: "Foto collegata: in V4.4 conferma o apre review, senza sovrascrivere automaticamente la descrizione cliente.",
    });
  }

  if (params.drawingItem) {
    const drawingCandidateConfidence = params.drawingItem.status === "DWG_READY" ? 82 : params.drawingItem.status === "DWG_REVIEW" ? 58 : 24;
    candidates.push({
      wallType: declaredWallType,
      source: "dwg_dxf",
      confidence: scoreAutomaticWallCandidateV44({
        declaredWallType,
        candidateWallType: declaredWallType,
        source: "dwg_dxf",
        baseConfidence: drawingCandidateConfidence,
      }),
      reason: "DWG/DXF/PDF collegato: conferma quote/layer/geometria e aumenta la confidenza se coerente.",
    });
  }

  candidates.push({
    wallType: declaredWallType,
    source: "fusion",
    confidence: scoreAutomaticWallCandidateV44({
      declaredWallType,
      candidateWallType: declaredWallType,
      source: "fusion",
      baseConfidence: params.fusionItem.fusedConfidence,
    }),
    reason: "Evidence Fusion V4.3 combina cliente, foto, DWG/DXF e workflow tecnico.",
  });

  if (declaredWallType === "unknown") {
    candidates.push({
      wallType: "masonry",
      source: "technical_rule",
      confidence: 32,
      reason: "Parete sconosciuta: suggerimento tecnico debole, da confermare con foto/DWG o sopralluogo.",
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

function resolveAutomaticWallClassificationV44Status(params: {
  fusionStatus: any;
  finalConfidence: number;
  conflicts: any[];
  declaredWallType: any;
}): AutomaticWallClassificationV44Status {
  if (params.fusionStatus === "FUSION_BLOCKED") return "CLASSIFICATION_BLOCKED";
  if (params.conflicts.some((conflict) => conflict.severity === "critical")) return "CLASSIFICATION_BLOCKED";
  if (params.declaredWallType === "unknown") return "CLASSIFICATION_REVIEW_REQUIRED";
  if (params.conflicts.length > 0) return "CLASSIFICATION_REVIEW_REQUIRED";
  if (params.finalConfidence < 72) return "CLASSIFICATION_REVIEW_REQUIRED";
  if (params.fusionStatus === "FUSION_REVIEW_REQUIRED") return "CLASSIFICATION_REVIEW_REQUIRED";
  return "CLASSIFICATION_READY";
}

export function buildAutomaticWallClassificationV44Report(params: {
  fusionV43: any;
  photoEvidenceV41: any;
  drawingEvidenceV42: any;
}): AutomaticWallClassificationV44Report {
  const photoByWall = new Map(params.photoEvidenceV41.items.map((item) => [item.linkedWallId, item]));
  const drawingByWall = new Map(params.drawingEvidenceV42.items.map((item) => [item.linkedWallId, item]));

  const items: AutomaticWallClassificationV44Item[] = params.fusionV43.items.map((fusionItem) => {
    const candidates = inferAutomaticWallTypeFromEvidenceV44({
      fusionItem,
      photoItem: photoByWall.get(fusionItem.wallId) || null,
      drawingItem: drawingByWall.get(fusionItem.wallId) || null,
    });

    const bestCandidate = candidates[0];
    const classifiedWallType = bestCandidate?.wallType || fusionItem.declaredWallType;
    const changedSuggestion = classifiedWallType !== fusionItem.declaredWallType;
    const conflictPenalty = fusionItem.conflicts.some((conflict) => conflict.severity === "critical") ? 22 : fusionItem.conflicts.length > 0 ? 9 : 0;
    const finalConfidence = normalizeAutomaticWallClassificationV44Score((bestCandidate?.confidence || fusionItem.fusedConfidence) - conflictPenalty);
    const status = resolveAutomaticWallClassificationV44Status({
      fusionStatus: fusionItem.status,
      finalConfidence,
      conflicts: fusionItem.conflicts,
      declaredWallType: fusionItem.declaredWallType,
    });

    const classificationNotes = [
      "Classificazione automatica assistita: non sovrascrive il profilo cliente senza review.",
      changedSuggestion
        ? "Il motore suggerisce un tipo parete diverso: serve conferma tecnica prima di applicarlo."
        : "Il motore conferma il tipo parete dichiarato come ipotesi principale.",
      finalConfidence < 72
        ? "Confidence sotto soglia: richiedere evidenza migliore, sopralluogo o conferma installatore."
        : "Confidence sufficiente per alimentare i prossimi report tecnici, salvo blocchi installazione.",
    ];

    return {
      wallId: fusionItem.wallId,
      wallLabel: fusionItem.wallLabel,
      declaredWallType: fusionItem.declaredWallType,
      classifiedWallType,
      finalConfidence,
      status,
      reviewRequired: status !== "CLASSIFICATION_READY" || changedSuggestion,
      customerInputRemainsPrimary: true,
      candidates,
      conflicts: fusionItem.conflicts,
      classificationNotes,
      requiredAction: status === "CLASSIFICATION_READY"
        ? "Classificazione pronta: usare per Technical Wall Report e prossimi step foto/render/AR."
        : status === "CLASSIFICATION_BLOCKED"
          ? "Classificazione bloccata: risolvere conflitti critici o completare sopralluogo."
          : "Classificazione da revisionare: confermare parete con cliente, foto, DWG/DXF o tecnico.",
    };
  });

  const blocked = items.filter((item) => item.status === "CLASSIFICATION_BLOCKED").length;
  const review = items.filter((item) => item.status === "CLASSIFICATION_REVIEW_REQUIRED").length;
  const ready = items.filter((item) => item.status === "CLASSIFICATION_READY").length;
  const changedSuggestions = items.filter((item) => item.classifiedWallType !== item.declaredWallType).length;
  const averageConfidence = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.finalConfidence, 0) / items.length)
    : 0;

  return {
    schema: "bagastudio-automatic-wall-classification-v4-4",
    version: "4.4",
    generatedAt: new Date().toISOString(),
    classificationStatus: blocked > 0
      ? "CLASSIFICATION_BLOCKED"
      : review > 0
        ? "CLASSIFICATION_REVIEW_REQUIRED"
        : "CLASSIFICATION_READY",
    policy: {
      customerInputRemainsPrimary: true,
      automaticClassificationIsAssistive: true,
      conflictsForceReview: true,
      criticalFusionBlocksAutoClassification: true,
      photoDwgCanSuggestButNotOverwrite: true,
    },
    items,
    totals: {
      walls: items.length,
      ready,
      review,
      blocked,
      changedSuggestions,
      averageConfidence,
    },
    requiredActions: [
      ...(blocked > 0 ? ["Risolvere classificazioni bloccate prima di generare approvazione tecnica finale."] : []),
      ...(review > 0 ? ["Revisionare pareti con tipo sconosciuto, confidence bassa o suggerimento diverso dal dichiarato."] : []),
      "Non sovrascrivere automaticamente la descrizione cliente: applicare suggerimenti solo dopo conferma tecnica.",
      "Usare classificazione V4.4 come base per Photo Environment Intelligence e render/AR contestualizzati.",
    ],
    exportTargets: [
      "JSON Automatic Wall Classification V4.4",
      "Technical Wall Report con classificazione assistita",
      "Bridge verso Photo Environment Intelligence / Render / AR",
      "Bridge verso Technical Evidence Approval V4.6",
    ],
    nextActions: [
      "V4.5 Photo Environment Intelligence Bridge: utilizzare foto locale per render e AR del mobile configurato.",
      "V4.6 Technical Evidence Approval: approvazione evidenze e classificazione prima del PDF finale.",
      "V4.7 Automatic Wall Report Update: aggiornare prospetti e schede con confidence/classificazione finale.",
    ],
  };
}


