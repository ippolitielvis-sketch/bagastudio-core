type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV21Readiness = "ready" | "review" | "blocked";

type LayoutRoomIntelligenceV21Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  wallElevationPreflight: {
    canGenerateWallElevations: boolean;
    needsScaledRoomShell: boolean;
    needsOpeningsApproval: boolean;
    needsTechnicalPointsApproval: boolean;
    needsSmartValidatorClearance: boolean;
  };
  exportGate: {
    pdfReady: boolean;
    dxfCadReady: boolean;
    customerPreviewReady: boolean;
    reason: string;
  };
};

export type LayoutRoomIntelligenceV22WallPriority = "low" | "medium" | "high" | "critical";

export type LayoutRoomIntelligenceV22WallElevation = {
  id: string;
  title: string;
  sourceZoneId: string;
  priority: LayoutRoomIntelligenceV22WallPriority;
  requiredLayers: string[];
  technicalChecks: string[];
  outputTargets: Array<"pdf" | "dxf" | "cad" | "viewer_overlay">;
  status: LayoutRoomIntelligenceV21Readiness;
  note: string;
};

export type LayoutRoomIntelligenceV22WallSheetGate = {
  id: string;
  label: string;
  passed: boolean;
  blocking: boolean;
  reason: string;
};

export type LayoutRoomIntelligenceV22Report = {
  schema: "bagastudio-layout-room-intelligence-v2-2";
  version: "2.2";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV21Schema: LayoutRoomIntelligenceV21Report["schema"];
  sourceLayoutRoomIntelligenceV21Status: LayoutRoomIntelligenceV2Status;
  wallElevationEngine: {
    generatesWallSheets: boolean;
    separatesTechnicalLayers: boolean;
    supportsSinkHeightRules: boolean;
    supportsBaseboardCutoutAlerts: boolean;
    supportsWallSupportWarnings: boolean;
    supportsFurnitureFootprintProjection: boolean;
  };
  totals: {
    wallElevations: number;
    ready: number;
    review: number;
    blocked: number;
    criticalPriorities: number;
    exportBlockingGates: number;
  };
  wallElevations: LayoutRoomIntelligenceV22WallElevation[];
  wallSheetGates: LayoutRoomIntelligenceV22WallSheetGate[];
  layerLegend: Array<{
    id: string;
    label: string;
    output: string;
  }>;
  nextActions: string[];
};

export function buildLayoutRoomIntelligenceV22Report(params: {
  layoutV21: LayoutRoomIntelligenceV21Report;
}): LayoutRoomIntelligenceV22Report {
  const preflight = params.layoutV21.wallElevationPreflight;
  const exportGate = params.layoutV21.exportGate;

  const wallElevations: LayoutRoomIntelligenceV22WallElevation[] = [
    {
      id: "v2-2-wall-shell-elevation",
      title: "Prospetto parete con mobile e ingombri reali",
      sourceZoneId: "v2-wall-elevations",
      priority: preflight.needsScaledRoomShell ? "critical" : "high",
      requiredLayers: ["contorno parete", "quota pavimento", "ingombro mobile", "altezza sospensione", "quote principali"],
      technicalChecks: ["scala stanza approvata", "dimensioni esterne mobile bloccate", "posizione parete confermata"],
      outputTargets: ["pdf", "dxf", "cad", "viewer_overlay"],
      status: preflight.needsScaledRoomShell ? "blocked" : "review",
      note: "Base grafica per generare prospetti tecnici leggibili e coerenti con la piantina caricata.",
    },
    {
      id: "v2-2-technical-points-elevation",
      title: "Layer punti elettrici, idraulici e servizi",
      sourceZoneId: "v2-technical-points-map",
      priority: preflight.needsTechnicalPointsApproval ? "critical" : "high",
      requiredLayers: ["prese", "LED/specchi", "carico acqua calda", "carico acqua fredda", "scarico", "passacavi"],
      technicalChecks: ["quote da terra", "distanza da mobile", "compatibilità con scheda tecnica", "Smart Validator pulito"],
      outputTargets: ["pdf", "dxf", "cad"],
      status: preflight.needsTechnicalPointsApproval ? "blocked" : "review",
      note: "Trasforma i punti tecnici in layer separati esportabili, non in semplici note testuali.",
    },
    {
      id: "v2-2-baseboard-support-elevation",
      title: "Battiscopa, scassi e supporto parete",
      sourceZoneId: "v2-baseboard-wall-support",
      priority: preflight.needsSmartValidatorClearance ? "high" : "medium",
      requiredLayers: ["battiscopa", "scassi mobile", "tipo parete", "punti fissaggio", "note ferramenta"],
      technicalChecks: ["altezza battiscopa", "spessore battiscopa", "supporto muratura/cartongesso", "carichi mensole/pensili"],
      outputTargets: ["pdf", "dxf", "cad"],
      status: preflight.needsSmartValidatorClearance ? "blocked" : "review",
      note: "Prepara gli alert per scassi e fissaggi prima di mandare in produzione o montaggio.",
    },
    {
      id: "v2-2-openings-clearance-elevation",
      title: "Aperture, ingombri e passaggi funzionali",
      sourceZoneId: "v2-openings-obstacles",
      priority: preflight.needsOpeningsApproval ? "high" : "medium",
      requiredLayers: ["porte", "finestre", "ostacoli", "ingombro apertura frontali", "passaggi minimi"],
      technicalChecks: ["nessuna collisione con aperture", "spazio cassetti/ante", "accessibilità montaggio", "vincoli ambiente"],
      outputTargets: ["pdf", "viewer_overlay"],
      status: preflight.needsOpeningsApproval ? "blocked" : "review",
      note: "Serve a evitare errori progettuali prima di produrre tavole tecniche e preventivi definitivi.",
    },
  ];

  const wallSheetGates: LayoutRoomIntelligenceV22WallSheetGate[] = [
    {
      id: "v2-2-gate-scaled-room-shell",
      label: "Scala e guscio stanza approvati",
      passed: !preflight.needsScaledRoomShell,
      blocking: true,
      reason: preflight.needsScaledRoomShell ? "Manca una base quotata affidabile per generare prospetti tecnici." : "Base stanza utilizzabile per prospetti e layer tecnici.",
    },
    {
      id: "v2-2-gate-openings",
      label: "Aperture e ostacoli approvati",
      passed: !preflight.needsOpeningsApproval,
      blocking: false,
      reason: preflight.needsOpeningsApproval ? "Serve conferma di porte, finestre, pilastri, nicchie e ostacoli fissi." : "Aperture/ostacoli già compatibili con preflight.",
    },
    {
      id: "v2-2-gate-technical-points",
      label: "Punti tecnici validati",
      passed: !preflight.needsTechnicalPointsApproval,
      blocking: true,
      reason: preflight.needsTechnicalPointsApproval ? "Punti elettrici/idraulici/fissaggi non ancora pronti per PDF/DXF/CAD." : "Punti tecnici pronti per layer export.",
    },
    {
      id: "v2-2-gate-smart-validator",
      label: "Smart Technical Validator pulito",
      passed: !preflight.needsSmartValidatorClearance,
      blocking: true,
      reason: preflight.needsSmartValidatorClearance ? "Restano verifiche tecniche da risolvere prima dell'export tecnico finale." : "Gate tecnico superato.",
    },
    {
      id: "v2-2-gate-export",
      label: "Export tecnico finale abilitabile",
      passed: exportGate.pdfReady && exportGate.dxfCadReady,
      blocking: true,
      reason: exportGate.reason,
    },
  ];

  const blocked = wallElevations.filter((item) => item.status === "blocked").length;
  const review = wallElevations.filter((item) => item.status === "review").length;
  const ready = wallElevations.filter((item) => item.status === "ready").length;
  const exportBlockingGates = wallSheetGates.filter((gate) => gate.blocking && !gate.passed).length;

  return {
    schema: "bagastudio-layout-room-intelligence-v2-2",
    version: "2.2",
    generatedAt: new Date().toISOString(),
    status: exportBlockingGates > 0 || blocked > 0 ? "LAYOUT_V2_BLOCKED" : review > 0 ? "LAYOUT_V2_REVIEW_REQUIRED" : "LAYOUT_V2_READY",
    sourceLayoutRoomIntelligenceV21Schema: params.layoutV21.schema,
    sourceLayoutRoomIntelligenceV21Status: params.layoutV21.status,
    wallElevationEngine: {
      generatesWallSheets: true,
      separatesTechnicalLayers: true,
      supportsSinkHeightRules: true,
      supportsBaseboardCutoutAlerts: true,
      supportsWallSupportWarnings: true,
      supportsFurnitureFootprintProjection: true,
    },
    totals: {
      wallElevations: wallElevations.length,
      ready,
      review,
      blocked,
      criticalPriorities: wallElevations.filter((item) => item.priority === "critical").length,
      exportBlockingGates,
    },
    wallElevations,
    wallSheetGates,
    layerLegend: [
      { id: "layer-furniture", label: "Contorno mobile", output: "linea continua principale per PDF/DXF" },
      { id: "layer-dimensions", label: "Quote", output: "quote orizzontali/verticali e altezze da terra" },
      { id: "layer-electrical", label: "Punti elettrici", output: "prese, alimentazioni LED/specchi, passacavi" },
      { id: "layer-plumbing", label: "Idraulica", output: "carico acqua calda/fredda e scarico" },
      { id: "layer-fixing", label: "Fissaggi", output: "staffe, tasselli, supporto parete e note montaggio" },
      { id: "layer-alerts", label: "Alert tecnici", output: "battiscopa, collisioni, passaggi, errori bloccanti" },
    ],
    nextActions: [
      "Collegare le pareti reali del progetto al generatore di prospetti V2.2.",
      "Trasformare layerLegend in layer PDF/DXF effettivi con colori/stili distinti.",
      "Agganciare altezza lavandino appoggio/incasso e punti idraulici alle regole della Knowledge Base tecnica.",
      "Preparare il futuro editor visuale per tracciare pareti, aperture e punti tecnici direttamente sulla piantina.",
    ],
  };
}
