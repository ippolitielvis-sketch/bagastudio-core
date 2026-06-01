export type EvidenceToRenderArBridgeV47Status = "RENDER_AR_READY" | "RENDER_AR_REVIEW_REQUIRED" | "RENDER_AR_BLOCKED";
export type EvidenceToRenderArBridgeV47Quality = "missing" | "low" | "medium" | "high";

export type EvidenceToRenderArBridgeV47Item = {
  id: string;
  wallId: string;
  wallLabel: string;
  photoQuality: EvidenceToRenderArBridgeV47Quality;
  photoRenderReady: boolean;
  arPreviewReady: boolean;
  environmentConstraints: string[];
  warnings: string[];
  recommendedAction: string;
};

export type EvidenceToRenderArBridgeV47Report = {
  schema: "bagastudio-evidence-to-render-ar-bridge-v4-7";
  version: "4.7";
  generatedAt: string;
  bridgeStatus: EvidenceToRenderArBridgeV47Status;
  totals: {
    walls: number;
    photoRenderReady: number;
    arPreviewReady: number;
    reviewRequired: number;
    blocked: number;
  };
  policy: {
    customerPhotoCanBeUsedForRender: boolean;
    technicalApprovalStillRequiredForInstallation: boolean;
    renderArDoesNotOverrideWallApproval: boolean;
    privacyAndConsentRequired: boolean;
  };
  items: EvidenceToRenderArBridgeV47Item[];
  renderPipeline: string[];
  arPipeline: string[];
  nextActions: string[];
};

export function normalizeEvidenceToRenderArV47Quality(value: unknown): EvidenceToRenderArBridgeV47Quality {
  const quality = String(value || "missing").toLowerCase();
  if (quality === "high" || quality === "medium" || quality === "low") return quality as EvidenceToRenderArBridgeV47Quality;
  return "missing";
}

export function buildEvidenceToRenderArBridgeV47Report(params: {
  photoEvidenceReport: any;
  fusionReport: any;
  approvalReport: any;
}): EvidenceToRenderArBridgeV47Report {
  const blockedByApproval = params.approvalReport.approvalStatus === "EVIDENCE_BLOCKED";

  const items: EvidenceToRenderArBridgeV47Item[] = params.photoEvidenceReport.items.map((photoItem: any) => {
    const fusionItem = params.fusionReport.items?.find((item: any) => item.wallId === photoItem.linkedWallId) || null;
    const photoQuality = normalizeEvidenceToRenderArV47Quality(photoItem.quality);
    const hasUsablePhoto = photoQuality === "medium" || photoQuality === "high" || photoItem.status === "PHOTO_READY";
    const hasReviewPhoto = photoQuality === "low" || photoItem.status === "PHOTO_REVIEW";
    const photoRenderReady = Boolean(hasUsablePhoto && !blockedByApproval);
    const arPreviewReady = Boolean(photoRenderReady && params.approvalReport.approvalGate.canProceedToRenderAr);

    const warnings = [
      ...(blockedByApproval ? ["Evidenze tecniche bloccate: render/AR commerciale sospeso fino a review."] : []),
      ...(hasReviewPhoto ? ["Foto utilizzabile solo come bozza: qualità o completezza da migliorare."] : []),
      ...(!hasUsablePhoto && !hasReviewPhoto ? ["Foto ambiente mancante o non sufficiente per render contestualizzato."] : []),
      ...(fusionItem?.fusionStatus === "FUSION_CONFLICT" ? ["Conflitto evidenze: il render non deve nascondere problemi tecnici di parete."] : []),
    ];

    return {
      id: `evidence-render-ar-v4-7-${photoItem.linkedWallId}`,
      wallId: photoItem.linkedWallId,
      wallLabel: photoItem.wallLabel,
      photoQuality,
      photoRenderReady,
      arPreviewReady,
      environmentConstraints: [
        "Verificare prospettiva foto e punto di fuga prima dell'inserimento mobile.",
        "Rilevare pavimento/parete/aperture come riferimenti visivi per scala e posizione.",
        "Mantenere separato il risultato estetico render/AR dall'approvazione tecnica installazione.",
      ],
      warnings,
      recommendedAction: photoRenderReady
        ? "Foto pronta per workflow Photo Environment Intelligence: inserimento mobile e preview AR."
        : blockedByApproval
          ? "Completare approvazione evidenze V4.6 prima di usare la foto per render/AR cliente."
          : "Richiedere foto più completa/luminosa con parete intera e riferimento scala.",
    };
  });

  const blocked = blockedByApproval ? Math.max(1, items.length) : 0;
  const reviewRequired = items.filter((item) => item.warnings.length > 0 && !item.photoRenderReady).length;
  const photoRenderReady = items.filter((item) => item.photoRenderReady).length;
  const arPreviewReady = items.filter((item) => item.arPreviewReady).length;
  const bridgeStatus: EvidenceToRenderArBridgeV47Status = blocked > 0
    ? "RENDER_AR_BLOCKED"
    : reviewRequired > 0
      ? "RENDER_AR_REVIEW_REQUIRED"
      : "RENDER_AR_READY";

  return {
    schema: "bagastudio-evidence-to-render-ar-bridge-v4-7",
    version: "4.7",
    generatedAt: new Date().toISOString(),
    bridgeStatus,
    totals: {
      walls: items.length,
      photoRenderReady,
      arPreviewReady,
      reviewRequired,
      blocked,
    },
    policy: {
      customerPhotoCanBeUsedForRender: true,
      technicalApprovalStillRequiredForInstallation: true,
      renderArDoesNotOverrideWallApproval: true,
      privacyAndConsentRequired: true,
    },
    items,
    renderPipeline: [
      "Acquisizione foto locale cliente",
      "Controllo qualità foto e riferimenti scala",
      "Riconoscimento assistito parete/pavimento/aperture",
      "Inserimento mobile configurato nella foto",
      "Render contestualizzato e allegato a preventivo",
    ],
    arPipeline: [
      "Preparazione modello configurato in formato AR",
      "Controllo scala e ingombri rispetto alla parete",
      "Preview WebXR / AR Quick Look / Scene Viewer",
      "Conferma cliente separata dall'approvazione tecnica installazione",
    ],
    nextActions: [
      "V4.8 Final Technical + Visual Package: unire evidenze tecniche, render/AR readiness e approvazione.",
      "V5.0 Photo Environment Intelligence: inserire realmente il mobile nella foto del locale.",
      "V5.1 AR Preview Workflow: generare esperienza mobile/tablet per cliente finale.",
    ],
  };
}
