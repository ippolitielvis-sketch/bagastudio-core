// @ts-nocheck

type WallIntelligenceV30WallType = any;
type WallAssistedRecognitionV40Report = any;
type WallPhotoEvidenceV41Report = any;

export type WallDwgDxfEvidenceV42Quality = "missing" | "low" | "medium" | "high";
export type WallDwgDxfEvidenceV42Status = "DWG_REQUIRED" | "DWG_REVIEW" | "DWG_READY" | "DWG_BLOCKED";
export type WallDwgDxfEvidenceV42Source = "dwg" | "dxf" | "pdf_plan" | "image_plan";

export type WallDwgDxfEvidenceV42Item = {
  id: string;
  linkedWallId: string;
  wallLabel: string;
  source: WallDwgDxfEvidenceV42Source;
  expectedWallType: WallIntelligenceV30WallType;
  quality: WallDwgDxfEvidenceV42Quality;
  status: WallDwgDxfEvidenceV42Status;
  confidenceImpact: number;
  technicalLayers: string[];
  extractionTargets: string[];
  requiredChecks: string[];
  conflictPolicy: string;
  note: string;
};

export type WallDwgDxfEvidenceV42Report = {
  schema: "bagastudio-wall-dwg-dxf-evidence-intake-v4-2";
  version: "4.2";
  generatedAt: string;
  intakeStatus: "DWG_DXF_INTAKE_READY" | "DWG_DXF_INTAKE_REVIEW_REQUIRED" | "DWG_DXF_INTAKE_BLOCKED";
  sourceRecognitionSchema: WallAssistedRecognitionV40Report["schema"];
  sourcePhotoSchema: WallPhotoEvidenceV41Report["schema"];
  drawingPolicy: {
    customerInputRemainsPrimary: boolean;
    dwgDxfCanConfirmGeometry: boolean;
    dwgDxfCanOpenReview: boolean;
    dwgDxfCannotAutoApproveCriticalInstall: boolean;
    photoAndDwgCanBeCrossChecked: boolean;
  };
  items: WallDwgDxfEvidenceV42Item[];
  totals: {
    drawingSlots: number;
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

function resolveWallDwgDxfEvidenceV42Status(
  quality: WallDwgDxfEvidenceV42Quality,
  recognitionStatus: WallAssistedRecognitionV40Report["recognitionStatus"]
): WallDwgDxfEvidenceV42Status {
  if (recognitionStatus === "ASSISTED_RECOGNITION_BLOCKED") return "DWG_BLOCKED";
  if (quality === "high") return "DWG_READY";
  if (quality === "medium") return "DWG_REVIEW";
  return "DWG_REQUIRED";
}

export function buildWallDwgDxfEvidenceV42Report(params: {
  assistedRecognitionV40: WallAssistedRecognitionV40Report;
  photoEvidenceV41: WallPhotoEvidenceV41Report;
}): WallDwgDxfEvidenceV42Report {
  const drawingSlots = params.assistedRecognitionV40.evidences.filter((evidence) => evidence.source === "dwg" || evidence.source === "dxf");
  const photoByWall = new Map(params.photoEvidenceV41.items.map((item) => [item.linkedWallId, item]));

  const items: WallDwgDxfEvidenceV42Item[] = drawingSlots.map((slot, index) => {
    const fusion = params.assistedRecognitionV40.confidenceFusion.find((item) => item.wallId === slot.linkedWallId);
    const photo = photoByWall.get(slot.linkedWallId);
    const customerScore = fusion?.customerScore ?? 0;
    const photoScore = photo?.confidenceImpact ?? 0;
    const quality: WallDwgDxfEvidenceV42Quality = customerScore >= 82 && photoScore >= 10 ? "medium" : customerScore >= 65 ? "low" : "missing";
    const status = resolveWallDwgDxfEvidenceV42Status(quality, params.assistedRecognitionV40.recognitionStatus);
    const confidenceImpact = quality === "high" ? 22 : quality === "medium" ? 14 : quality === "low" ? 6 : 0;

    return {
      id: `v4-2-dwg-dxf-intake-${index + 1}-${slot.linkedWallId}`,
      linkedWallId: slot.linkedWallId,
      wallLabel: slot.label.replace(" · slot DWG/DXF", ""),
      source: "dwg",
      expectedWallType: slot.declaredWallType,
      quality,
      status,
      confidenceImpact,
      technicalLayers: [
        "WALLS / PARETI",
        "OPENINGS / APERTURE",
        "FURNITURE_FOOTPRINTS / INGOMBRI MOBILI",
        "ELECTRICAL_POINTS / PUNTI ELETTRICI",
        "PLUMBING_POINTS / PUNTI IDRAULICI",
        "FIXING_POINTS / PUNTI FISSAGGIO",
        "DIMENSIONS / QUOTE",
      ],
      extractionTargets: [
        "quote parete e lunghezze utili",
        "spessori e tipologia parete quando indicati",
        "aperture porte/finestre e ingombri anta",
        "posizione mobili e passaggi minimi",
        "punti elettrici/idraulici collegabili al prospetto parete",
        "vincoli battiscopa, nicchie, colonne e ostacoli",
      ],
      requiredChecks: [
        "Verificare scala/dimensione reale del DWG/DXF prima di usare quote tecniche.",
        "Controllare che i layer siano leggibili o mappabili in Admin.",
        "Confrontare pianta/prospetto con descrizione cliente e foto V4.1.",
        "Aprire review se DWG/DXF contraddice tipo parete, aperture o ingombri dichiarati.",
      ],
      conflictPolicy: "DWG/DXF può aumentare confidence solo se coerente con descrizione cliente e foto; se contraddice quote o parete, blocca approvazione automatica e apre review tecnica.",
      note: status === "DWG_BLOCKED"
        ? "Recognition V4.0 bloccato: elaborato tecnico utilizzabile solo come evidenza per review."
        : status === "DWG_READY"
          ? "Elaborato tecnico pronto per alimentare quote, prospetti e fusion engine."
          : "DWG/DXF richiesto o da revisionare prima della generazione tecnica definitiva.",
    };
  });

  const blocked = items.filter((item) => item.status === "DWG_BLOCKED").length;
  const review = items.filter((item) => item.status === "DWG_REVIEW").length;
  const missing = items.filter((item) => item.status === "DWG_REQUIRED").length;
  const ready = items.filter((item) => item.status === "DWG_READY").length;

  return {
    schema: "bagastudio-wall-dwg-dxf-evidence-intake-v4-2",
    version: "4.2",
    generatedAt: new Date().toISOString(),
    intakeStatus: blocked > 0
      ? "DWG_DXF_INTAKE_BLOCKED"
      : review > 0 || missing > 0
        ? "DWG_DXF_INTAKE_REVIEW_REQUIRED"
        : "DWG_DXF_INTAKE_READY",
    sourceRecognitionSchema: params.assistedRecognitionV40.schema,
    sourcePhotoSchema: params.photoEvidenceV41.schema,
    drawingPolicy: {
      customerInputRemainsPrimary: true,
      dwgDxfCanConfirmGeometry: true,
      dwgDxfCanOpenReview: true,
      dwgDxfCannotAutoApproveCriticalInstall: true,
      photoAndDwgCanBeCrossChecked: true,
    },
    items,
    totals: {
      drawingSlots: items.length,
      missing,
      ready,
      review,
      blocked,
      potentialConfidenceBoost: items.reduce((sum, item) => sum + item.confidenceImpact, 0),
    },
    requiredActions: [
      ...(missing > 0 ? ["Caricare DWG/DXF/PDF pianta o indicare che il rilievo tecnico non è disponibile."] : []),
      ...(review > 0 ? ["Revisionare elaborati con qualità bassa/media prima dell'approvazione tecnica definitiva."] : []),
      ...(blocked > 0 ? ["Risolvere blocchi V4.0/V3.9: DWG/DXF non deve forzare approvazioni automatiche."] : []),
      "Usare DWG/DXF per quote, aperture, layer tecnici e controllo incrociato con foto/descrizione cliente.",
    ],
    exportTargets: [
      "JSON DWG/DXF Evidence Intake V4.2",
      "PDF scheda parete con elenco layer richiesti",
      "DXF/CAD con mapping layer tecnico",
      "Bridge verso Evidence Fusion Engine V4.3 e Technical Wall Elevation Sheets",
    ],
    nextActions: [
      "V4.3 Evidence Fusion Engine: fusione pesata tra cliente, foto, DWG/DXF e nota installatore.",
      "V4.4 Automatic Wall Classification: classificazione assistita parete con review obbligatoria.",
      "V4.5 Photo Environment Intelligence Bridge: collegare foto locale a render e AR del mobile nel locale reale.",
    ],
  };
}