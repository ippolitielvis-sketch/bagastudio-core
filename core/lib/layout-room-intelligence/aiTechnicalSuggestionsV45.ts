export type AiTechnicalSuggestionV45Severity = "info" | "warning" | "critical";
export type AiTechnicalSuggestionV45Category =
  | "wall"
  | "evidence"
  | "fixing"
  | "installation"
  | "render_ar"
  | "approval";

export type AiTechnicalSuggestionV45Item = {
  id: string;
  category: AiTechnicalSuggestionV45Category;
  severity: AiTechnicalSuggestionV45Severity;
  wallId: string;
  wallLabel: string;
  title: string;
  reason: string;
  suggestedAction: string;
  blocksApproval: boolean;
  exportTargets: string[];
};

export type AiTechnicalSuggestionsV45Report = {
  schema: "bagastudio-ai-technical-suggestions-v4-5";
  version: "4.5";
  generatedAt: string;
  suggestionStatus: "SUGGESTIONS_READY" | "SUGGESTIONS_REVIEW_REQUIRED" | "SUGGESTIONS_BLOCKED";
  policy: {
    assistiveOnly: boolean;
    customerInputRemainsPrimary: boolean;
    noAutomaticApproval: boolean;
    photoEnvironmentBridgeEnabled: boolean;
  };
  totals: {
    suggestions: number;
    critical: number;
    warning: number;
    info: number;
    blockedWalls: number;
    renderArReadyWalls: number;
  };
  suggestions: AiTechnicalSuggestionV45Item[];
  executiveSummary: string[];
  nextActions: string[];
};

type AiTechnicalSuggestionsV45ClassificationItem = {
  wallId: string;
  wallLabel: string;
  status: "CLASSIFICATION_READY" | "CLASSIFICATION_REVIEW_REQUIRED" | "CLASSIFICATION_BLOCKED" | string;
  reviewRequired?: boolean;
  finalConfidence: number;
  declaredWallType?: string;
  classifiedWallType?: string;
};

type AiTechnicalSuggestionsV45FusionConflict = {
  severity: AiTechnicalSuggestionV45Severity | string;
};

type AiTechnicalSuggestionsV45FusionItem = {
  wallId: string;
  conflicts?: AiTechnicalSuggestionsV45FusionConflict[];
};

type AiTechnicalSuggestionsV45PhotoEvidenceItem = {
  linkedWallId: string;
  status: "PHOTO_READY" | "PHOTO_MISSING" | "PHOTO_BLOCKED" | string;
};

type AiTechnicalSuggestionsV45DrawingEvidenceItem = {
  linkedWallId: string;
  status: "DWG_READY" | "DWG_MISSING" | "DWG_BLOCKED" | string;
};

type AiTechnicalSuggestionsV45BuildParams = {
  classificationV44: { items: AiTechnicalSuggestionsV45ClassificationItem[] };
  fusionV43: { items: AiTechnicalSuggestionsV45FusionItem[] };
  photoEvidenceV41: { items: AiTechnicalSuggestionsV45PhotoEvidenceItem[] };
  drawingEvidenceV42: { items: AiTechnicalSuggestionsV45DrawingEvidenceItem[] };
  technicalApprovalV39: {
    approvalStatus?: string;
    installAllowed?: boolean;
  };
  installerChecklistV38: {
    installChecklistStatus?: string;
  };
};

export function pushAiTechnicalSuggestionV45(
  suggestions: AiTechnicalSuggestionV45Item[],
  item: Omit<AiTechnicalSuggestionV45Item, "id">
) {
  const id = `ai-v4-5-${item.wallId}-${item.category}-${suggestions.length + 1}`;
  suggestions.push({ id, ...item });
}

export function resolveAiTechnicalSuggestionsV45Status(suggestions: AiTechnicalSuggestionV45Item[]) {
  if (suggestions.some((item) => item.blocksApproval || item.severity === "critical")) return "SUGGESTIONS_BLOCKED" as const;
  if (suggestions.some((item) => item.severity === "warning")) return "SUGGESTIONS_REVIEW_REQUIRED" as const;
  return "SUGGESTIONS_READY" as const;
}

export function buildAiTechnicalSuggestionsV45Report(params: AiTechnicalSuggestionsV45BuildParams): AiTechnicalSuggestionsV45Report {
  const suggestions: AiTechnicalSuggestionV45Item[] = [];
  const fusionByWall = new Map<string, AiTechnicalSuggestionsV45FusionItem>(
    params.fusionV43.items.map((item: AiTechnicalSuggestionsV45FusionItem) => [item.wallId, item])
  );
  const photoByWall = new Map<string, AiTechnicalSuggestionsV45PhotoEvidenceItem>(
    params.photoEvidenceV41.items.map((item: AiTechnicalSuggestionsV45PhotoEvidenceItem) => [item.linkedWallId, item])
  );
  const drawingByWall = new Map<string, AiTechnicalSuggestionsV45DrawingEvidenceItem>(
    params.drawingEvidenceV42.items.map((item: AiTechnicalSuggestionsV45DrawingEvidenceItem) => [item.linkedWallId, item])
  );

  params.classificationV44.items.forEach((classification: AiTechnicalSuggestionsV45ClassificationItem) => {
    const fusion = fusionByWall.get(classification.wallId) || null;
    const photo = photoByWall.get(classification.wallId) || null;
    const drawing = drawingByWall.get(classification.wallId) || null;
    const wallExportTargets = [
      "Technical Wall Report",
      "Installer Checklist",
      "Technical Approval",
      "Photo Environment Intelligence",
    ];

    if (classification.status === "CLASSIFICATION_BLOCKED") {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "wall",
        severity: "critical",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Classificazione parete bloccata",
        reason: "La classificazione V4.4 contiene conflitti critici o dati non utilizzabili per approvazione tecnica.",
        suggestedAction: "Richiedere sopralluogo o evidenza tecnica più affidabile prima di procedere con installazione, PDF finale o AR commerciale.",
        blocksApproval: true,
        exportTargets: wallExportTargets,
      });
    }

    if (classification.reviewRequired && classification.status !== "CLASSIFICATION_BLOCKED") {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "wall",
        severity: "warning",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Conferma tecnica parete richiesta",
        reason: "Il motore V4.4 richiede review perché confidence, conflitti o suggerimenti assistiti non sono ancora definitivi.",
        suggestedAction: "Far confermare la parete da cliente/installatore e salvare la nota prima dell'approvazione tecnica.",
        blocksApproval: false,
        exportTargets: ["Technical Approval Workflow", "Technical Wall Report"],
      });
    }

    if (classification.finalConfidence < 70) {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "evidence",
        severity: classification.finalConfidence < 45 ? "critical" : "warning",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Confidence evidenze insufficiente",
        reason: `Confidence classificazione ${classification.finalConfidence}% sotto soglia tecnica consigliata.`,
        suggestedAction: "Richiedere almeno una foto frontale nitida, una foto laterale/angolo e, se possibile, pianta PDF/DXF quotata.",
        blocksApproval: classification.finalConfidence < 45,
        exportTargets: ["Photo Evidence Intake V4.1", "DWG/DXF Evidence Intake V4.2"],
      });
    }

    if (!photo || photo.status === "PHOTO_MISSING" || photo.status === "PHOTO_BLOCKED") {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "render_ar",
        severity: "info",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Foto ambiente consigliata per render e AR",
        reason: "La parete non ha ancora un set foto sufficiente per Photo Environment Intelligence.",
        suggestedAction: "Richiedere foto locale pulita e ben illuminata per inserire il mobile configurato nel locale reale del cliente.",
        blocksApproval: false,
        exportTargets: ["Photo Environment Intelligence", "Render contestualizzato", "AR mobile"],
      });
    }

    if (!drawing || drawing.status === "DWG_MISSING" || drawing.status === "DWG_BLOCKED") {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "evidence",
        severity: "info",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Pianta/DWG consigliata per quote tecniche",
        reason: "DWG/DXF/PDF non disponibile o non abbastanza leggibile per confermare aperture, ingombri e punti tecnici.",
        suggestedAction: "Richiedere pianta quotata o file DXF/DWG quando il progetto prevede installazione complessa o più mobili sulla stessa parete.",
        blocksApproval: false,
        exportTargets: ["DWG/DXF Evidence Intake V4.2", "Technical Wall Elevation Sheets"],
      });
    }

    if (classification.declaredWallType === "drywall" || classification.classifiedWallType === "drywall") {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "fixing",
        severity: "warning",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Parete cartongesso: fissaggio da verificare",
        reason: "Cartongesso richiede montanti, tasselli idonei o barra di distribuzione carico per specchi, mensole e pensili.",
        suggestedAction: "Segnalare in scheda tecnica: individuare montanti, usare fissaggi idonei e vietare installazione pesante senza verifica.",
        blocksApproval: false,
        exportTargets: ["Fixing Recommendation Engine V3.4", "Installer Checklist V3.8"],
      });
    }

    if (fusion?.conflicts?.length) {
      pushAiTechnicalSuggestionV45(suggestions, {
        category: "evidence",
        severity: fusion.conflicts.some((conflict: AiTechnicalSuggestionsV45FusionConflict) => conflict.severity === "critical") ? "critical" : "warning",
        wallId: classification.wallId,
        wallLabel: classification.wallLabel,
        title: "Conflitto tra evidenze rilevato",
        reason: "Evidence Fusion V4.3 ha rilevato incoerenze tra descrizione cliente, foto, DWG/DXF o approvazione tecnica.",
        suggestedAction: "Aprire review tecnica e risolvere il conflitto prima di generare PDF finale o approvazione installazione.",
        blocksApproval: fusion.conflicts.some((conflict: AiTechnicalSuggestionsV45FusionConflict) => conflict.severity === "critical"),
        exportTargets: ["Evidence Fusion V4.3", "Technical Approval Workflow V3.9"],
      });
    }
  });

  if (params.technicalApprovalV39.approvalStatus === "rejected" || params.technicalApprovalV39.installAllowed === false) {
    pushAiTechnicalSuggestionV45(suggestions, {
      category: "approval",
      severity: "critical",
      wallId: "global-approval",
      wallLabel: "Approvazione tecnica",
      title: "Installazione non approvata",
      reason: "Il Technical Approval Workflow V3.9 non consente l'installazione nello stato attuale.",
      suggestedAction: "Bloccare preventivo/installazione finale finché non vengono risolti i punti tecnici e completato eventuale sopralluogo.",
      blocksApproval: true,
      exportTargets: ["Technical Approval Workflow", "Preventivo installazione", "PDF finale"],
    });
  }

  if (params.installerChecklistV38.installChecklistStatus === "INSTALL_BLOCKED") {
    pushAiTechnicalSuggestionV45(suggestions, {
      category: "installation",
      severity: "critical",
      wallId: "global-checklist",
      wallLabel: "Checklist installatore",
      title: "Checklist installatore bloccata",
      reason: "La checklist V3.8 contiene passaggi bloccanti non risolti.",
      suggestedAction: "Completare checklist, evidenze e note installatore prima di generare scheda approvata.",
      blocksApproval: true,
      exportTargets: ["Installer Checklist", "Technical Wall Report"],
    });
  }

  const critical = suggestions.filter((item: AiTechnicalSuggestionV45Item) => item.severity === "critical").length;
  const warning = suggestions.filter((item: AiTechnicalSuggestionV45Item) => item.severity === "warning").length;
  const info = suggestions.filter((item: AiTechnicalSuggestionV45Item) => item.severity === "info").length;
  const blockedWalls = new Set(suggestions.filter((item: AiTechnicalSuggestionV45Item) => item.blocksApproval).map((item: AiTechnicalSuggestionV45Item) => item.wallId)).size;
  const renderArReadyWalls = params.classificationV44.items.filter((item: AiTechnicalSuggestionsV45ClassificationItem) => {
    const photo = photoByWall.get(item.wallId);
    return item.status === "CLASSIFICATION_READY" && Boolean(photo && photo.status === "PHOTO_READY");
  }).length;

  return {
    schema: "bagastudio-ai-technical-suggestions-v4-5",
    version: "4.5",
    generatedAt: new Date().toISOString(),
    suggestionStatus: resolveAiTechnicalSuggestionsV45Status(suggestions),
    policy: {
      assistiveOnly: true,
      customerInputRemainsPrimary: true,
      noAutomaticApproval: true,
      photoEnvironmentBridgeEnabled: true,
    },
    totals: {
      suggestions: suggestions.length,
      critical,
      warning,
      info,
      blockedWalls,
      renderArReadyWalls,
    },
    suggestions,
    executiveSummary: [
      critical > 0 ? "Sono presenti suggerimenti critici: non approvare automaticamente l'installazione." : "Nessun suggerimento critico automatico rilevato.",
      warning > 0 ? "Sono presenti warning tecnici da revisionare prima del PDF finale." : "Nessun warning tecnico rilevante rilevato.",
      renderArReadyWalls > 0 ? "Almeno una parete è pronta per bridge render/AR con foto ambiente." : "Per render/AR servono foto ambiente migliori o classificazione pronta.",
    ],
    nextActions: [
      "V4.6 Technical Evidence Approval: trasformare suggerimenti AI in approvazioni/review tracciate.",
      "V4.7 Photo Environment Bridge: collegare foto locale a render contestualizzato e AR.",
      "V4.8 Final Technical Package: unire PDF, DXF, checklist, evidenze e approvazione.",
    ],
  };
}
