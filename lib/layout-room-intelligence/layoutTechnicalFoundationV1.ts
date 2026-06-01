import type { FactoryProductionPackageV1Report, FactoryProductionPackageV1Status } from "@/lib/factory/factoryPipelineReportsV1";

export type LayoutRoomIntelligenceV1Status = "ROOM_READY" | "ROOM_REVIEW_REQUIRED" | "ROOM_BLOCKED";

export type LayoutRoomIntelligenceV1CheckStatus = "pass" | "review" | "blocked";

export type LayoutRoomIntelligenceV1Check = {
  id: string;
  label: string;
  status: LayoutRoomIntelligenceV1CheckStatus;
  category: "layout" | "baseboard" | "wall_support" | "clearance" | "technical_sheets";
  note: string;
  recommendation: string;
};

export type LayoutRoomIntelligenceV1Report = {
  schema: "bagastudio-layout-room-intelligence-v1";
  version: 1;
  generatedAt: string;
  status: LayoutRoomIntelligenceV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  assumptions: {
    planInputMode: "manual_trace" | "image_pdf_reference" | "dxf_future";
    baseboardDataRequired: boolean;
    wallMaterialDataRequired: boolean;
    furnitureFootprintValidationRequired: boolean;
    technicalSheetGenerationReady: boolean;
  };
  totals: {
    checks: number;
    pass: number;
    review: number;
    blocked: number;
    furnitureItemsLinked: number;
  };
  checks: LayoutRoomIntelligenceV1Check[];
  recommendations: string[];
};

export function buildLayoutRoomIntelligenceV1Report(params: {
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutRoomIntelligenceV1Report {
  const productionBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const productionReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const checks: LayoutRoomIntelligenceV1Check[] = [
    {
      id: "layout-plan-input",
      label: "Piantina locale / ingombri mobili",
      status: "review",
      category: "layout",
      note: "Modulo predisposto per piantina caricata e tracciamento guidato di muri, aperture, quote e ingombri mobili.",
      recommendation: "Prima fase: usare tracciamento manuale controllato; DXF/DWG e riconoscimento automatico arriveranno come step successivi.",
    },
    {
      id: "baseboard-clearance-check",
      label: "Battiscopa e scasso mobili",
      status: "review",
      category: "baseboard",
      note: "Richiede dati battiscopa: presenza, altezza, spessore e posizione rispetto ai mobili a parete.",
      recommendation: "Se il battiscopa è presente, verificare sempre scasso, distacco o zoccolo tecnico prima di confermare produzione.",
    },
    {
      id: "wall-support-check",
      label: "Tipologia parete e ferramenta fissaggio",
      status: "review",
      category: "wall_support",
      note: "Richiede indicazione parete: muratura, cartongesso, cemento o supporto non idoneo.",
      recommendation: "La scelta ferramenta deve dipendere dal supporto; mensole e pensili su cartongesso richiedono verifica strutturale e fissaggi dedicati.",
    },
    {
      id: "clearance-and-opening-check",
      label: "Passaggi, aperture e collisioni ambiente",
      status: productionBlocked ? "blocked" : "review",
      category: "clearance",
      note: productionBlocked
        ? "Il pacchetto produzione è bloccato: non validare passaggi e montabilità locale prima di risolvere i blocchi factory."
        : "Modulo predisposto per verificare passaggi, apertura ante/cassetti, porte, pilastri e interferenze con pareti.",
      recommendation: "Integrare quote minime di passaggio, area apertura frontali e collisioni con ingombri reali della piantina.",
    },
    {
      id: "technical-sheets-from-layout",
      label: "Schede tecniche da layout",
      status: productionBlocked ? "blocked" : productionReview ? "review" : "pass",
      category: "technical_sheets",
      note: productionBlocked
        ? "Schede tecniche non rilasciabili finché il Factory Production Package è bloccato."
        : "Predisposizione per schede tecniche con punti fissaggio, battiscopa, pareti, quote ambiente e distinta ferramenta.",
      recommendation: "Le schede tecniche devono includere alert montaggio, punti elettrici/idraulici/fissaggio e note parete/battiscopa.",
    },
  ];

  const blocked = checks.filter((check) => check.status === "blocked").length;
  const review = checks.filter((check) => check.status === "review").length;
  const pass = checks.filter((check) => check.status === "pass").length;

  const status: LayoutRoomIntelligenceV1Status = blocked > 0
    ? "ROOM_BLOCKED"
    : review > 0
      ? "ROOM_REVIEW_REQUIRED"
      : "ROOM_READY";

  return {
    schema: "bagastudio-layout-room-intelligence-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    assumptions: {
      planInputMode: "manual_trace",
      baseboardDataRequired: true,
      wallMaterialDataRequired: true,
      furnitureFootprintValidationRequired: true,
      technicalSheetGenerationReady: status !== "ROOM_BLOCKED",
    },
    totals: {
      checks: checks.length,
      pass,
      review,
      blocked,
      furnitureItemsLinked: params.factoryProductionPackage.totals.components,
    },
    checks,
    recommendations: [
      "Layout Intelligence V1 deve partire con input guidato: piantina caricata, tracciamento muri/aperture e conferma manuale degli ingombri mobili.",
      "Battiscopa, tipo parete e punti tecnici devono diventare dati obbligatori prima della generazione schede tecniche definitive.",
      "Questo modulo prepara il ponte tra piantina, Product Package, Factory Engine, Viewer Sync e schede tecniche PDF/DXF.",
    ],
  };
}

export type LayoutTechnicalSheetGeneratorV1Status = "SHEETS_READY" | "SHEETS_REVIEW_REQUIRED" | "SHEETS_BLOCKED";

export type LayoutTechnicalSheetGeneratorV1SectionStatus = "ready" | "review" | "blocked";

export type LayoutTechnicalSheetGeneratorV1Section = {
  id: string;
  title: string;
  status: LayoutTechnicalSheetGeneratorV1SectionStatus;
  source: "layout" | "factory" | "mounting" | "technical_points";
  requiredData: string[];
  output: string;
  note: string;
};

export type LayoutTechnicalSheetGeneratorV1Report = {
  schema: "bagastudio-layout-technical-sheet-generator-v1";
  version: 1;
  generatedAt: string;
  status: LayoutTechnicalSheetGeneratorV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  totals: {
    sections: number;
    ready: number;
    review: number;
    blocked: number;
    furnitureItemsLinked: number;
  };
  generationRules: {
    requireLayoutTraceApproval: boolean;
    requireBaseboardData: boolean;
    requireWallSupportData: boolean;
    requireFactoryPackageNotBlocked: boolean;
    includeMountingWarnings: boolean;
    includeFixingHardwareNotes: boolean;
  };
  sections: LayoutTechnicalSheetGeneratorV1Section[];
  recommendations: string[];
};

export function buildLayoutTechnicalSheetGeneratorV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutTechnicalSheetGeneratorV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const factoryBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const factoryReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const sections: LayoutTechnicalSheetGeneratorV1Section[] = [
    {
      id: "sheet-room-layout-reference",
      title: "Riferimento piantina e ingombri",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      requiredData: ["piantina caricata", "quote ambiente", "muri/aperture tracciati", "ingombri mobili confermati"],
      output: "Tavola layout con muri, aperture, mobili, quote principali e aree di passaggio.",
      note: layoutBlocked
        ? "La scheda layout resta bloccata finché Layout Intelligence segnala errori critici."
        : "Predisposta per generare la prima tavola tecnica partendo da pianta e ingombri mobili approvati.",
    },
    {
      id: "sheet-baseboard-and-clearance",
      title: "Battiscopa, scassi e distacchi",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      requiredData: ["presenza battiscopa", "altezza battiscopa", "spessore battiscopa", "tipo scasso mobile"],
      output: "Alert su scassi mancanti, distacchi necessari, zoccoli tecnici e interferenze con parete.",
      note: "Questa scheda deve impedire produzione/installazione se il mobile non prevede scasso con battiscopa dichiarato.",
    },
    {
      id: "sheet-wall-support-and-fixings",
      title: "Pareti, supporti e fissaggi",
      status: layoutBlocked || factoryBlocked ? "blocked" : "review",
      source: "mounting",
      requiredData: ["tipo parete", "carichi previsti", "ferramenta fissaggio", "punti ancoraggio"],
      output: "Indicazioni di montaggio per muratura/cartongesso/cemento e avvisi su mensole o pensili non idonei.",
      note: "La ferramenta di fissaggio deve dipendere dal supporto reale e dalle regole del Factory Engine.",
    },
    {
      id: "sheet-factory-production-summary",
      title: "Riepilogo produzione e BOM",
      status: factoryBlocked ? "blocked" : factoryReview || layoutReview ? "review" : "ready",
      source: "factory",
      requiredData: ["Factory Production Package", "BOM", "CSV/CIX pipeline", "Hardware Reposition"],
      output: "Riepilogo componenti, ferramenta, lavorazioni, warning e stato produzione.",
      note: "Questa scheda collega layout e produzione, senza sostituire ancora l'export CSV/CIX finale reale.",
    },
    {
      id: "sheet-technical-points",
      title: "Punti tecnici e predisposizioni",
      status: layoutBlocked ? "blocked" : "review",
      source: "technical_points",
      requiredData: ["prese", "scarichi", "carichi acqua", "passacavi", "fori tecnici"],
      output: "Tavola predisposizioni tecniche con punti elettrici/idraulici/fissaggio e note montaggio.",
      note: "È il ponte verso il modulo punti tecnici parametrico già previsto nella roadmap BagaStudio Core.",
    },
  ];

  const blocked = sections.filter((section) => section.status === "blocked").length;
  const review = sections.filter((section) => section.status === "review").length;
  const ready = sections.filter((section) => section.status === "ready").length;

  const status: LayoutTechnicalSheetGeneratorV1Status = blocked > 0
    ? "SHEETS_BLOCKED"
    : review > 0
      ? "SHEETS_REVIEW_REQUIRED"
      : "SHEETS_READY";

  return {
    schema: "bagastudio-layout-technical-sheet-generator-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    totals: {
      sections: sections.length,
      ready,
      review,
      blocked,
      furnitureItemsLinked: params.layout.totals.furnitureItemsLinked,
    },
    generationRules: {
      requireLayoutTraceApproval: true,
      requireBaseboardData: true,
      requireWallSupportData: true,
      requireFactoryPackageNotBlocked: true,
      includeMountingWarnings: true,
      includeFixingHardwareNotes: true,
    },
    sections,
    recommendations: [
      "Generare schede tecniche solo dopo approvazione manuale del tracciamento piantina e degli ingombri mobili.",
      "Battiscopa, pareti e fissaggi devono essere dati obbligatori prima della consegna al montaggio.",
      "La prima versione produce report diagnostico; gli step successivi genereranno PDF/DXF con tavole quotate e simboli tecnici.",
    ],
  };
}

export type LayoutDxfCadExportPrepV1Status = "CAD_READY" | "CAD_REVIEW_REQUIRED" | "CAD_BLOCKED";

export type LayoutDxfCadExportPrepV1LayerStatus = "ready" | "review" | "blocked";

export type LayoutDxfCadExportPrepV1Layer = {
  id: string;
  layerName: string;
  status: LayoutDxfCadExportPrepV1LayerStatus;
  source: "layout" | "technical_sheet" | "factory" | "mounting";
  entities: string[];
  outputTarget: "DXF" | "PDF" | "DXF_PDF";
  note: string;
};

export type LayoutDxfCadExportPrepV1Report = {
  schema: "bagastudio-layout-dxf-cad-export-prep-v1";
  version: 1;
  generatedAt: string;
  status: LayoutDxfCadExportPrepV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceTechnicalSheetSchema: LayoutTechnicalSheetGeneratorV1Report["schema"];
  sourceTechnicalSheetStatus: LayoutTechnicalSheetGeneratorV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  totals: {
    layers: number;
    ready: number;
    review: number;
    blocked: number;
    dxfTargets: number;
    pdfTargets: number;
  };
  exportRules: {
    requireApprovedLayoutTrace: boolean;
    requireScaledRoomReference: boolean;
    requireWallAndOpeningLayers: boolean;
    requireFurnitureFootprintLayers: boolean;
    requireTechnicalPointLayers: boolean;
    requireMountingAndFixingNotes: boolean;
    preserveProductPackageIds: boolean;
  };
  layers: LayoutDxfCadExportPrepV1Layer[];
  recommendations: string[];
};

export function buildLayoutDxfCadExportPrepV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  technicalSheets: LayoutTechnicalSheetGeneratorV1Report;
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutDxfCadExportPrepV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const sheetsBlocked = params.technicalSheets.status === "SHEETS_BLOCKED";
  const factoryBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const sheetsReview = params.technicalSheets.status === "SHEETS_REVIEW_REQUIRED";
  const factoryReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const layers: LayoutDxfCadExportPrepV1Layer[] = [
    {
      id: "cad-layer-room-walls-openings",
      layerName: "BGS_ROOM_WALLS_OPENINGS",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      entities: ["muri", "porte", "finestre", "quote ambiente", "aree non finestrabili"],
      outputTarget: "DXF_PDF",
      note: "Layer base per esportare piantina, aperture e riferimenti ambiente. Richiede scala e tracciamento approvati.",
    },
    {
      id: "cad-layer-furniture-footprints",
      layerName: "BGS_FURNITURE_FOOTPRINTS",
      status: layoutBlocked || factoryBlocked ? "blocked" : layoutReview || factoryReview ? "review" : "ready",
      source: "factory",
      entities: ["ingombri mobili", "productPackageId", "componenti principali", "quote esterne bloccate"],
      outputTarget: "DXF_PDF",
      note: "Layer degli ingombri mobili collegato al Product Package e al Factory Production Package.",
    },
    {
      id: "cad-layer-baseboard-clearance",
      layerName: "BGS_BASEBOARD_CLEARANCE",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      entities: ["battiscopa", "scassi", "distacchi parete", "zoccoli tecnici"],
      outputTarget: "DXF_PDF",
      note: "Layer dedicato a battiscopa e scassi per evitare errori in produzione e montaggio.",
    },
    {
      id: "cad-layer-technical-points",
      layerName: "BGS_TECHNICAL_POINTS",
      status: sheetsBlocked ? "blocked" : "review",
      source: "technical_sheet",
      entities: ["prese", "scarichi", "carichi acqua", "passacavi", "punti fissaggio"],
      outputTarget: "DXF_PDF",
      note: "Predisposizione per punti tecnici elettrici, idraulici e fissaggi con futura esportazione quotata.",
    },
    {
      id: "cad-layer-mounting-fixings",
      layerName: "BGS_MOUNTING_FIXINGS",
      status: factoryBlocked || sheetsBlocked ? "blocked" : "review",
      source: "mounting",
      entities: ["tipo parete", "ferramenta fissaggio", "ancoraggi", "warning montaggio"],
      outputTarget: "PDF",
      note: "Layer/note per montaggio: muratura, cartongesso, supporti deboli, mensole e pensili.",
    },
  ];

  const blocked = layers.filter((layer) => layer.status === "blocked").length;
  const review = layers.filter((layer) => layer.status === "review").length;
  const ready = layers.filter((layer) => layer.status === "ready").length;
  const dxfTargets = layers.filter((layer) => layer.outputTarget === "DXF" || layer.outputTarget === "DXF_PDF").length;
  const pdfTargets = layers.filter((layer) => layer.outputTarget === "PDF" || layer.outputTarget === "DXF_PDF").length;

  const status: LayoutDxfCadExportPrepV1Status = blocked > 0
    ? "CAD_BLOCKED"
    : review > 0
      ? "CAD_REVIEW_REQUIRED"
      : "CAD_READY";

  return {
    schema: "bagastudio-layout-dxf-cad-export-prep-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceTechnicalSheetSchema: params.technicalSheets.schema,
    sourceTechnicalSheetStatus: params.technicalSheets.status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    totals: {
      layers: layers.length,
      ready,
      review,
      blocked,
      dxfTargets,
      pdfTargets,
    },
    exportRules: {
      requireApprovedLayoutTrace: true,
      requireScaledRoomReference: true,
      requireWallAndOpeningLayers: true,
      requireFurnitureFootprintLayers: true,
      requireTechnicalPointLayers: true,
      requireMountingAndFixingNotes: true,
      preserveProductPackageIds: true,
    },
    layers,
    recommendations: [
      "Prima dell'export DXF reale serve una pianta in scala approvata o un riferimento quotato certo.",
      "Ogni ingombro mobile deve mantenere productPackageId e componentId per restare sincronizzato con Viewer e Factory Engine.",
      "Le prime esportazioni saranno diagnostiche; la fase successiva dovrà generare entità DXF reali con layer e quote tecniche.",
    ],
  };
}

export type TechnicalWallElevationSheetsV1Status = "ELEVATIONS_READY" | "ELEVATIONS_REVIEW_REQUIRED" | "ELEVATIONS_BLOCKED";

export type TechnicalWallElevationSheetsV1LayerStatus = "ready" | "review" | "blocked";

export type TechnicalWallElevationSheetsV1LayerKind =
  | "furniture_outline"
  | "dimensions"
  | "electrical"
  | "plumbing"
  | "fixing"
  | "mounting_notes";

export type TechnicalWallElevationSheetsV1Layer = {
  id: string;
  layerName: string;
  label: string;
  kind: TechnicalWallElevationSheetsV1LayerKind;
  status: TechnicalWallElevationSheetsV1LayerStatus;
  colorHint: string;
  entities: string[];
  requiredForPdf: boolean;
  requiredForDxf: boolean;
  note: string;
};

export type TechnicalWallElevationSheetsV1Report = {
  schema: "bagastudio-technical-wall-elevation-sheets-v1";
  version: 1;
  generatedAt: string;
  status: TechnicalWallElevationSheetsV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceTechnicalSheetSchema: LayoutTechnicalSheetGeneratorV1Report["schema"];
  sourceTechnicalSheetStatus: LayoutTechnicalSheetGeneratorV1Status;
  sourceCadExportSchema: LayoutDxfCadExportPrepV1Report["schema"];
  sourceCadExportStatus: LayoutDxfCadExportPrepV1Status;
  totals: {
    layers: number;
    ready: number;
    review: number;
    blocked: number;
    pdfLayers: number;
    dxfLayers: number;
    technicalPointLayers: number;
  };
  wallElevationRules: {
    drawFurnitureFrontElevations: boolean;
    requireHotColdWaterPoints: boolean;
    requireDrainPoints: boolean;
    requireDrawerIntegratedSockets: boolean;
    requireWallFixingPoints: boolean;
    requireColorSeparatedLayers: boolean;
    preserveProductPackageIds: boolean;
  };
  layers: TechnicalWallElevationSheetsV1Layer[];
  recommendations: string[];
};

export function buildTechnicalWallElevationSheetsV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  technicalSheets: LayoutTechnicalSheetGeneratorV1Report;
  cadExport: LayoutDxfCadExportPrepV1Report;
}): TechnicalWallElevationSheetsV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const sheetsBlocked = params.technicalSheets.status === "SHEETS_BLOCKED";
  const cadBlocked = params.cadExport.status === "CAD_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const sheetsReview = params.technicalSheets.status === "SHEETS_REVIEW_REQUIRED";
  const cadReview = params.cadExport.status === "CAD_REVIEW_REQUIRED";

  const baseBlocked = layoutBlocked || sheetsBlocked || cadBlocked;
  const baseReview = layoutReview || sheetsReview || cadReview;

  const layers: TechnicalWallElevationSheetsV1Layer[] = [
    {
      id: "wall-elevation-furniture-outline",
      layerName: "BGS_WALL_ELEVATION_FURNITURE_OUTLINE",
      label: "Contorno mobile in prospetto",
      kind: "furniture_outline",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "ready",
      colorHint: "mobile-outline",
      entities: ["prospetto mobile", "contorno mobile", "ingombro frontale", "productPackageId", "componentId"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Disegna i mobili in prospetto parete mantenendo ID prodotto e componenti per sincronizzazione con Viewer e Factory.",
    },
    {
      id: "wall-elevation-dimensions",
      layerName: "BGS_WALL_ELEVATION_DIMENSIONS",
      label: "Quote tecniche",
      kind: "dimensions",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "dimension-lines",
      entities: ["quote generali", "quote mobili", "quote punti tecnici", "distanze da pareti", "quote da pavimento"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Layer dedicato alle quote con colore separato per rendere leggibili prospetti e tavole tecniche.",
    },
    {
      id: "wall-elevation-electrical-points",
      layerName: "BGS_WALL_ELEVATION_ELECTRICAL_POINTS",
      label: "Punti elettrici e prese",
      kind: "electrical",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "electrical-points",
      entities: ["prese parete", "prese integrate nelle cassettiere", "passacavi", "punti alimentazione LED", "punti quadro"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Predispone prese e punti elettrici, incluse prese nelle cassettiere e alimentazioni accessori/LED.",
    },
    {
      id: "wall-elevation-plumbing-hot-cold-drain",
      layerName: "BGS_WALL_ELEVATION_PLUMBING",
      label: "Idraulica acqua calda/fredda/scarico",
      kind: "plumbing",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "plumbing-points",
      entities: ["carico acqua fredda", "carico acqua calda", "scarico", "sifone", "distanze tecniche", "quote da pavimento"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Layer per carico/scarico acqua con punti distinti e quotati per mobili tecnici, lavaggi e impianti.",
    },
    {
      id: "wall-elevation-fixing-points",
      layerName: "BGS_WALL_ELEVATION_FIXING_POINTS",
      label: "Punti fissaggio e supporto parete",
      kind: "fixing",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "fixing-points",
      entities: ["punti fissaggio", "tipo parete", "tasselli/ferramenta", "mensole", "pensili", "zone rinforzo"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Collega prospetto parete alla verifica muratura/cartongesso e alla ferramenta corretta per fissaggi e mensole.",
    },
    {
      id: "wall-elevation-mounting-notes",
      layerName: "BGS_WALL_ELEVATION_MOUNTING_NOTES",
      label: "Note montaggio e controlli",
      kind: "mounting_notes",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "mounting-notes",
      entities: ["note installatore", "avvisi battiscopa", "scassi", "errori locale", "vincoli montaggio"],
      requiredForPdf: true,
      requiredForDxf: false,
      note: "Note operative per montaggio, battiscopa, scassi e criticità rilevate da Layout Intelligence.",
    },
  ];

  const blocked = layers.filter((layer) => layer.status === "blocked").length;
  const review = layers.filter((layer) => layer.status === "review").length;
  const ready = layers.filter((layer) => layer.status === "ready").length;
  const pdfLayers = layers.filter((layer) => layer.requiredForPdf).length;
  const dxfLayers = layers.filter((layer) => layer.requiredForDxf).length;
  const technicalPointLayers = layers.filter((layer) => layer.kind === "electrical" || layer.kind === "plumbing" || layer.kind === "fixing").length;

  const status: TechnicalWallElevationSheetsV1Status = blocked > 0
    ? "ELEVATIONS_BLOCKED"
    : review > 0
      ? "ELEVATIONS_REVIEW_REQUIRED"
      : "ELEVATIONS_READY";

  return {
    schema: "bagastudio-technical-wall-elevation-sheets-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceTechnicalSheetSchema: params.technicalSheets.schema,
    sourceTechnicalSheetStatus: params.technicalSheets.status,
    sourceCadExportSchema: params.cadExport.schema,
    sourceCadExportStatus: params.cadExport.status,
    totals: {
      layers: layers.length,
      ready,
      review,
      blocked,
      pdfLayers,
      dxfLayers,
      technicalPointLayers,
    },
    wallElevationRules: {
      drawFurnitureFrontElevations: true,
      requireHotColdWaterPoints: true,
      requireDrainPoints: true,
      requireDrawerIntegratedSockets: true,
      requireWallFixingPoints: true,
      requireColorSeparatedLayers: true,
      preserveProductPackageIds: true,
    },
    layers,
    recommendations: [
      "Ogni prospetto parete deve mostrare mobili frontali, contorno mobile, quote e punti tecnici su layer/colore separato.",
      "I punti acqua calda/fredda/scarico devono essere quotati da pavimento e riferiti alla parete corretta prima dell'export PDF/DXF.",
      "Le prese integrate nelle cassettiere devono restare collegate al componente e al Product Package per evitare errori in produzione e montaggio.",
      "I punti fissaggio devono dipendere dal tipo parete dichiarato: muratura, cartongesso, cemento o supporto debole.",
    ],
  };
}

export type WallTechnicalPointsValidationV1Status = "TECHNICAL_POINTS_READY" | "TECHNICAL_POINTS_REVIEW_REQUIRED" | "TECHNICAL_POINTS_BLOCKED";

export type WallTechnicalPointsValidationV1Severity = "info" | "warning" | "error";

export type WallTechnicalPointsValidationV1RuleKind =
  | "sink_height"
  | "hot_cold_water"
  | "drain"
  | "electrical_socket"
  | "drawer_socket"
  | "wall_fixing"
  | "baseboard_cutout"
  | "sheet_layer_quality";

export type WallTechnicalPointsValidationV1Rule = {
  id: string;
  label: string;
  kind: WallTechnicalPointsValidationV1RuleKind;
  severity: WallTechnicalPointsValidationV1Severity;
  status: "passed" | "review" | "blocked";
  expected: string;
  actual: string;
  note: string;
};

export type WallTechnicalPointsValidationV1Report = {
  schema: "bagastudio-wall-technical-points-validation-v1";
  version: 1;
  generatedAt: string;
  status: WallTechnicalPointsValidationV1Status;
  sourceElevationSchema: TechnicalWallElevationSheetsV1Report["schema"];
  sourceElevationStatus: TechnicalWallElevationSheetsV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sinkRules: {
    countertopSinkTopHeightMm: 850;
    insetSinkTopHeightMm: 930;
    requireSinkTypeBeforeFinalSheet: boolean;
    propagateHeightToPlumbingPoints: boolean;
    propagateHeightToWallElevations: boolean;
  };
  totals: {
    rules: number;
    passed: number;
    review: number;
    blocked: number;
    errors: number;
    warnings: number;
  };
  rules: WallTechnicalPointsValidationV1Rule[];
  recommendations: string[];
};

export function buildWallTechnicalPointsValidationV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  elevations: TechnicalWallElevationSheetsV1Report;
}): WallTechnicalPointsValidationV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const elevationBlocked = params.elevations.status === "ELEVATIONS_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const elevationReview = params.elevations.status === "ELEVATIONS_REVIEW_REQUIRED";

  const baseBlocked = layoutBlocked || elevationBlocked;
  const baseReview = layoutReview || elevationReview;

  const rules: WallTechnicalPointsValidationV1Rule[] = [
    {
      id: "sink-height-countertop",
      label: "Quota piano lavandino da appoggio",
      kind: "sink_height",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Piano a 850 mm da pavimento finito",
      actual: "Da validare in base al tipo lavandino selezionato nel Product Package",
      note: "Quando il cliente sceglie lavandino da appoggio, il prospetto deve fissare piano, quote idrauliche e note montaggio su 850 mm.",
    },
    {
      id: "sink-height-inset",
      label: "Quota piano lavandino da incasso",
      kind: "sink_height",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Piano a 930 mm da pavimento finito",
      actual: "Da validare in base al tipo lavandino selezionato nel Product Package",
      note: "Quando il cliente sceglie lavandino da incasso, il prospetto deve fissare piano, quote idrauliche e note montaggio su 930 mm.",
    },
    {
      id: "plumbing-hot-cold-water",
      label: "Carico acqua calda/fredda",
      kind: "hot_cold_water",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Punti caldo/freddo distinti, quotati e associati alla parete corretta",
      actual: "Predisposizione layer tecnica presente; coordinate finali da validare sul layout reale",
      note: "Il sistema dovrà evitare inversioni caldo/freddo e quote non coerenti con mobile, sifone e rubinetteria.",
    },
    {
      id: "plumbing-drain",
      label: "Scarico idraulico",
      kind: "drain",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Scarico quotato, centrato o dichiarato decentrato, senza collisioni con cassetti/fianchi",
      actual: "Da calcolare sul mobile e sul tipo lavabo selezionato",
      note: "Lo scarico deve essere verificato rispetto a cassetti, divisori, fondo mobile e accessibilità manutenzione.",
    },
    {
      id: "electrical-wall-sockets",
      label: "Prese elettriche parete",
      kind: "electrical_socket",
      severity: "warning",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "passed",
      expected: "Prese quotate, non nascoste da mobili o cassetti non accessibili",
      actual: baseReview ? "Layout da verificare" : "Predisposizione validabile",
      note: "Le prese devono essere leggibili in prospetto e collegate alla parete corretta.",
    },
    {
      id: "drawer-integrated-sockets",
      label: "Prese nelle cassettiere",
      kind: "drawer_socket",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Prese integrate collegate a componente/cassetto e alimentazione dedicata",
      actual: "Da associare a Product Package e distinta accessori",
      note: "Le prese nelle cassettiere devono comparire in scheda tecnica, distinta accessori e istruzioni montaggio.",
    },
    {
      id: "wall-fixing-support",
      label: "Fissaggi in base alla parete",
      kind: "wall_fixing",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Ferramenta distinta per muratura, cartongesso, cemento o supporto debole",
      actual: "Tipo parete da confermare in Layout Intelligence",
      note: "Mensole e pensili devono essere bloccati o messi in review se la parete non supporta il carico previsto.",
    },
    {
      id: "baseboard-cutout",
      label: "Battiscopa e scasso mobile",
      kind: "baseboard_cutout",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Se battiscopa presente, scasso o distanziale mobile dichiarato e quotato",
      actual: "Da validare su rilievo cliente/utente",
      note: "La scheda deve avvisare quando il battiscopa esiste ma il mobile non prevede scasso corretto.",
    },
    {
      id: "sheet-layer-quality",
      label: "Qualità grafica scheda tecnica",
      kind: "sheet_layer_quality",
      severity: "info",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "passed",
      expected: "Layer/colori separati per mobile, quote, elettrico, idraulico, fissaggi e note",
      actual: "Technical Wall Elevation Sheets V1 predisposto",
      note: "Le schede BagaStudio devono essere più pulite e professionali del DXF standard importato.",
    },
  ];

  const blocked = rules.filter((rule) => rule.status === "blocked").length;
  const review = rules.filter((rule) => rule.status === "review").length;
  const passed = rules.filter((rule) => rule.status === "passed").length;
  const errors = rules.filter((rule) => rule.severity === "error").length;
  const warnings = rules.filter((rule) => rule.severity === "warning").length;

  const status: WallTechnicalPointsValidationV1Status = blocked > 0
    ? "TECHNICAL_POINTS_BLOCKED"
    : review > 0
      ? "TECHNICAL_POINTS_REVIEW_REQUIRED"
      : "TECHNICAL_POINTS_READY";

  return {
    schema: "bagastudio-wall-technical-points-validation-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceElevationSchema: params.elevations.schema,
    sourceElevationStatus: params.elevations.status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sinkRules: {
      countertopSinkTopHeightMm: 850,
      insetSinkTopHeightMm: 930,
      requireSinkTypeBeforeFinalSheet: true,
      propagateHeightToPlumbingPoints: true,
      propagateHeightToWallElevations: true,
    },
    totals: {
      rules: rules.length,
      passed,
      review,
      blocked,
      errors,
      warnings,
    },
    rules,
    recommendations: [
      "Prima della scheda finale il tipo lavandino deve essere esplicito: appoggio = piano 850 mm, incasso = piano 930 mm.",
      "Carico acqua calda/fredda e scarico devono essere quotati nel prospetto parete e verificati contro cassetti, divisori e fianchi.",
      "Le prese nelle cassettiere devono essere trattate come accessori tecnici collegati a componente, alimentazione e distinta accessori.",
      "La validazione parete deve scegliere ferramenta e fissaggi in base a muratura/cartongesso/cemento/supporto debole.",
    ],
  };
}

export type TechnicalKnowledgeBaseV1Category =
  | "plumbing"
  | "electrical"
  | "wall"
  | "baseboard"
  | "shelf"
  | "sink"
  | "technical_sheet";

export type TechnicalKnowledgeBaseV1Severity = "info" | "warning" | "error";

export type TechnicalKnowledgeBaseV1Rule = {
  id: string;
  category: TechnicalKnowledgeBaseV1Category;
  label: string;
  severity: TechnicalKnowledgeBaseV1Severity;
  appliesTo: string[];
  valueMm?: number;
  expected: string;
  validationTarget: string;
  note: string;
};

export type TechnicalKnowledgeBaseV1Report = {
  schema: "bagastudio-technical-knowledge-base-v1";
  version: 1;
  generatedAt: string;
  status: "KNOWLEDGE_BASE_READY" | "KNOWLEDGE_BASE_REVIEW_REQUIRED";
  sourceWallValidationSchema: WallTechnicalPointsValidationV1Report["schema"];
  sourceWallValidationStatus: WallTechnicalPointsValidationV1Status;
  totals: {
    rules: number;
    plumbing: number;
    electrical: number;
    wall: number;
    baseboard: number;
    shelf: number;
    sink: number;
    technicalSheet: number;
    errors: number;
    warnings: number;
    info: number;
  };
  sinkHeights: {
    countertopSinkTopHeightMm: 850;
    insetSinkTopHeightMm: 930;
  };
  rules: TechnicalKnowledgeBaseV1Rule[];
  recommendations: string[];
};

export const TECHNICAL_KNOWLEDGE_BASE_V1_RULES: TechnicalKnowledgeBaseV1Rule[] = [
  {
    id: "sink-countertop-top-height-850",
    category: "sink",
    label: "Lavandino da appoggio",
    severity: "error",
    appliesTo: ["technical-wall-elevation", "plumbing-points", "layout-validation"],
    valueMm: 850,
    expected: "Piano mobile a 850 mm da terra per lavandino da appoggio.",
    validationTarget: "sinkType=countertop",
    note: "La quota deve propagarsi a prospetto parete, carico acqua calda/fredda, scarico e quote installatore.",
  },
  {
    id: "sink-inset-top-height-930",
    category: "sink",
    label: "Lavandino da incasso",
    severity: "error",
    appliesTo: ["technical-wall-elevation", "plumbing-points", "layout-validation"],
    valueMm: 930,
    expected: "Piano mobile a 930 mm da terra per lavandino da incasso.",
    validationTarget: "sinkType=inset",
    note: "La quota deve aggiornare prospetto, idraulica, scarico e schema tecnico PDF/DXF/CAD.",
  },
  {
    id: "plumbing-hot-cold-water-required",
    category: "plumbing",
    label: "Carico acqua calda/fredda",
    severity: "error",
    appliesTo: ["washbasin", "technical-wall-elevation"],
    expected: "Ogni lavabo deve avere carico acqua calda e fredda quotato e distinguibile.",
    validationTarget: "hotWaterPoint+coldWaterPoint",
    note: "Le schede devono separare graficamente acqua calda e fredda con layer/colori dedicati.",
  },
  {
    id: "plumbing-drain-required",
    category: "plumbing",
    label: "Scarico lavabo",
    severity: "error",
    appliesTo: ["washbasin", "technical-wall-elevation"],
    expected: "Ogni lavabo deve avere scarico quotato, leggibile e non in conflitto con cassetti o struttura.",
    validationTarget: "drainPoint",
    note: "Il controllo deve evidenziare conflitti con schiene, cassetti, divisori e ferramenta.",
  },
  {
    id: "electrical-drawer-socket-clearance",
    category: "electrical",
    label: "Prese nelle cassettiere",
    severity: "warning",
    appliesTo: ["drawer", "electrical-point", "technical-wall-elevation"],
    expected: "Le prese integrate in cassettiera devono evitare guide, schiene, cassetti e zone di scorrimento.",
    validationTarget: "drawerSocket",
    note: "Il futuro Smart Validator dovrà segnalare prese dietro cassetti o in conflitto con guide.",
  },
  {
    id: "electrical-led-mirror-power",
    category: "electrical",
    label: "Alimentazione specchio LED",
    severity: "warning",
    appliesTo: ["mirror", "led", "technical-wall-elevation"],
    expected: "Specchi LED e accessori elettrici devono avere punto alimentazione dedicato e quotato.",
    validationTarget: "mirrorLedPowerPoint",
    note: "Il punto deve essere esportabile in PDF/DXF/CAD e collegato alla configurazione cliente.",
  },
  {
    id: "wall-type-fixing-selection",
    category: "wall",
    label: "Tipo parete e fissaggio",
    severity: "error",
    appliesTo: ["wall", "shelf", "wall-cabinet", "technical-sheet"],
    expected: "La ferramenta di fissaggio deve cambiare in base a muratura, cartongesso, cemento o parete tecnica.",
    validationTarget: "wallType+fixingProfile",
    note: "Cartongesso e pareti deboli devono generare warning o blocco per mensole/pensili pesanti.",
  },
  {
    id: "baseboard-cutout-required",
    category: "baseboard",
    label: "Battiscopa e scasso mobile",
    severity: "warning",
    appliesTo: ["floor-cabinet", "layout", "technical-wall-elevation"],
    expected: "Se il battiscopa è presente, il mobile deve avere scasso, distanziale o nota tecnica.",
    validationTarget: "baseboardPresence+baseboardCutout",
    note: "BagaStudio deve avvisare se il rilievo indica battiscopa ma il mobile non prevede scasso.",
  },
  {
    id: "shelf-structural-check",
    category: "shelf",
    label: "Mensole e pensili",
    severity: "error",
    appliesTo: ["shelf", "wall-cabinet", "fixing"],
    expected: "Mensole e pensili devono validare parete, peso previsto, ferramenta e punti fissaggio.",
    validationTarget: "wallLoadCapacity+fittingProfile",
    note: "Il sistema deve indicare se una mensola è montabile o se serve supporto/ferramenta alternativa.",
  },
  {
    id: "technical-sheet-layer-quality",
    category: "technical_sheet",
    label: "Qualità prospetto tecnico",
    severity: "info",
    appliesTo: ["technical-wall-elevation", "pdf", "dxf", "cad"],
    expected: "Prospetti più puliti e professionali dello standard DXF: mobile, quote, elettrico, idraulico e fissaggi separati.",
    validationTarget: "sheetLayerStyle",
    note: "Ogni tavola deve essere leggibile da installatore, elettricista, idraulico e cliente.",
  },
];

export function buildTechnicalKnowledgeBaseV1Report(
  wallValidationReport: WallTechnicalPointsValidationV1Report
): TechnicalKnowledgeBaseV1Report {
  const rules = TECHNICAL_KNOWLEDGE_BASE_V1_RULES;
  const countByCategory = (category: TechnicalKnowledgeBaseV1Category) =>
    rules.filter((rule) => rule.category === category).length;

  const status: TechnicalKnowledgeBaseV1Report["status"] =
    wallValidationReport.status === "TECHNICAL_POINTS_BLOCKED"
      ? "KNOWLEDGE_BASE_REVIEW_REQUIRED"
      : "KNOWLEDGE_BASE_READY";

  return {
    schema: "bagastudio-technical-knowledge-base-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceWallValidationSchema: wallValidationReport.schema,
    sourceWallValidationStatus: wallValidationReport.status,
    totals: {
      rules: rules.length,
      plumbing: countByCategory("plumbing"),
      electrical: countByCategory("electrical"),
      wall: countByCategory("wall"),
      baseboard: countByCategory("baseboard"),
      shelf: countByCategory("shelf"),
      sink: countByCategory("sink"),
      technicalSheet: countByCategory("technical_sheet"),
      errors: rules.filter((rule) => rule.severity === "error").length,
      warnings: rules.filter((rule) => rule.severity === "warning").length,
      info: rules.filter((rule) => rule.severity === "info").length,
    },
    sinkHeights: {
      countertopSinkTopHeightMm: 850,
      insetSinkTopHeightMm: 930,
    },
    rules,
    recommendations: [
      "Usare questa Knowledge Base come sorgente unica per Layout Intelligence, prospetti parete e Smart Technical Validator.",
      "Collegare ogni regola a Product Package e Factory Production Package prima dell'export finale PDF/DXF/CAD.",
      "Aggiungere progressivamente regole reali Morini su quote idrauliche, prese, fissaggi, scassi battiscopa e portate mensole.",
    ],
  };
}
