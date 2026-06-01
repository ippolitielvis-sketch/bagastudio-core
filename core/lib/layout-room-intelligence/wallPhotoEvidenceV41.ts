// @ts-nocheck

export type WallPhotoEvidenceV41Quality = "missing" | "low" | "medium" | "high";
export type WallPhotoEvidenceV41Status = "PHOTO_REQUIRED" | "PHOTO_REVIEW" | "PHOTO_READY" | "PHOTO_BLOCKED";

export type WallPhotoEvidenceV41Item = {
  id: string;
  linkedWallId: string;
  wallLabel: string;
  expectedWallType: WallIntelligenceV30WallType;
  photoSlotLabel: string;
  quality: WallPhotoEvidenceV41Quality;
  status: WallPhotoEvidenceV41Status;
  confidenceImpact: number;
  requiredShots: string[];
  metadataChecklist: string[];
  detectedHints: string[];
  conflictPolicy: string;
  note: string;
};

export type WallPhotoEvidenceV41Report = {
  schema: "bagastudio-wall-photo-evidence-intake-v4-1";
  version: "4.1";
  generatedAt: string;
  intakeStatus: "PHOTO_INTAKE_READY" | "PHOTO_INTAKE_REVIEW_REQUIRED" | "PHOTO_INTAKE_BLOCKED";
  sourceRecognitionSchema: WallAssistedRecognitionV40Report["schema"];
  photoPolicy: {
    customerInputRemainsPrimary: boolean;
    photoCanConfirm: boolean;
    photoCanOpenReview: boolean;
    photoCannotAutoApproveCriticalInstall: boolean;
  };
  items: WallPhotoEvidenceV41Item[];
  totals: {
    photoSlots: number;
    missing: number;
    ready: number;
    review: number;
    blocked: number;
    potentialConfidenceBoost: number;
  };
  requiredActions: string[];
  exportTargets: string[];
  nextActions: string[];
};

function resolveWallPhotoEvidenceV41Status(quality: WallPhotoEvidenceV41Quality, recognitionStatus: WallAssistedRecognitionV40Report["recognitionStatus"]): WallPhotoEvidenceV41Status {
  if (recognitionStatus === "ASSISTED_RECOGNITION_BLOCKED") return "PHOTO_BLOCKED";
  if (quality === "high") return "PHOTO_READY";
  if (quality === "medium") return "PHOTO_REVIEW";
  return "PHOTO_REQUIRED";
}

export function buildWallPhotoEvidenceV41Report(params: {
  assistedRecognitionV40: WallAssistedRecognitionV40Report;
}): WallPhotoEvidenceV41Report {
  const photoSlots = params.assistedRecognitionV40.evidences.filter((evidence) => evidence.source === "photo");

  const items: WallPhotoEvidenceV41Item[] = photoSlots.map((slot, index) => {
    const fusion = params.assistedRecognitionV40.confidenceFusion.find((item) => item.wallId === slot.linkedWallId);
    const customerScore = fusion?.customerScore ?? 0;
    const quality: WallPhotoEvidenceV41Quality = customerScore >= 80 ? "medium" : customerScore >= 55 ? "low" : "missing";
    const status = resolveWallPhotoEvidenceV41Status(quality, params.assistedRecognitionV40.recognitionStatus);
    const confidenceImpact = quality === "high" ? 18 : quality === "medium" ? 10 : quality === "low" ? 5 : 0;

    return {
      id: `v4-1-photo-intake-${index + 1}-${slot.linkedWallId}`,
      linkedWallId: slot.linkedWallId,
      wallLabel: slot.label.replace(" · slot foto parete", ""),
      expectedWallType: slot.declaredWallType,
      photoSlotLabel: slot.label,
      quality,
      status,
      confidenceImpact,
      requiredShots: [
        "Foto frontale parete completa con riferimento scala/metri.",
        "Foto dettagliata zona fissaggi prevista per specchi, mensole o pensili.",
        "Foto eventuali prese, scarichi, ostacoli, battiscopa e passaggi tecnici.",
        slot.declaredWallType === "drywall" ? "Foto o nota su montanti/cartongesso, se disponibili." : "Foto superficie e supporto parete per confermare tipologia.",
      ],
      metadataChecklist: [
        "Parete collegata al profilo cliente corretto.",
        "Foto non sfocata e non troppo scura.",
        "Inquadratura utile per capire altezza, larghezza e ostacoli.",
        "Presenza note cliente/installatore dove la foto non basta.",
      ],
      detectedHints: [
        "V4.1 è intake strutturato: non esegue ancora classificazione automatica pesante.",
        "Le foto preparano V4.4 Automatic Wall Classification e V4.5 AI Technical Suggestions.",
      ],
      conflictPolicy: "Se la foto suggerisce una parete diversa da quella dichiarata, il profilo entra in review e non viene approvato automaticamente.",
      note: status === "PHOTO_BLOCKED"
        ? "Recognition V4.0 bloccato: le foto servono come evidenza ma non sbloccano senza review tecnica."
        : status === "PHOTO_READY"
          ? "Foto/slot considerabile pronto per alimentare confidence fusion."
          : "Foto richiesta o da revisionare prima dell'approvazione tecnica definitiva.",
    };
  });

  const blocked = items.filter((item) => item.status === "PHOTO_BLOCKED").length;
  const review = items.filter((item) => item.status === "PHOTO_REVIEW").length;
  const missing = items.filter((item) => item.status === "PHOTO_REQUIRED").length;
  const ready = items.filter((item) => item.status === "PHOTO_READY").length;

  return {
    schema: "bagastudio-wall-photo-evidence-intake-v4-1",
    version: "4.1",
    generatedAt: new Date().toISOString(),
    intakeStatus: blocked > 0
      ? "PHOTO_INTAKE_BLOCKED"
      : review > 0 || missing > 0
        ? "PHOTO_INTAKE_REVIEW_REQUIRED"
        : "PHOTO_INTAKE_READY",
    sourceRecognitionSchema: params.assistedRecognitionV40.schema,
    photoPolicy: {
      customerInputRemainsPrimary: true,
      photoCanConfirm: true,
      photoCanOpenReview: true,
      photoCannotAutoApproveCriticalInstall: true,
    },
    items,
    totals: {
      photoSlots: items.length,
      missing,
      ready,
      review,
      blocked,
      potentialConfidenceBoost: items.reduce((sum, item) => sum + item.confidenceImpact, 0),
    },
    requiredActions: [
      ...(missing > 0 ? ["Caricare o richiedere foto parete per gli slot ancora mancanti."] : []),
      ...(review > 0 ? ["Revisionare foto con qualità media/bassa prima di approvare la parete."] : []),
      ...(blocked > 0 ? ["Risolvere prima i blocchi V4.0/V3.9: la foto non deve forzare l'approvazione automatica."] : []),
      "Usare le foto come conferma/correzione della descrizione cliente, non come unica fonte decisionale.",
    ],
    exportTargets: [
      "JSON Photo Evidence Intake V4.1",
      "PDF scheda parete con checklist foto richieste",
      "Archivio evidenze cliente/installatore",
      "Bridge futuro verso Automatic Wall Classification V4.4",
    ],
    nextActions: [
      "V4.2 DWG/DXF Evidence Intake: struttura per elaborati tecnici allegati.",
      "V4.3 Evidence Fusion Engine: ricalcolo pesato con cliente, foto, DWG/DXF e note installatore.",
      "V4.4 Automatic Wall Classification: lettura assistita della tipologia parete con review obbligatoria.",
    ],
  };
}
