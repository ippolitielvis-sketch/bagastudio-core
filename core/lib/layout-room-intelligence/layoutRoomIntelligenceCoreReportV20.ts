type LayoutRoomIntelligenceV1Status = "ROOM_READY" | "ROOM_REVIEW_REQUIRED" | "ROOM_BLOCKED" | string;

type LayoutRoomIntelligenceV1Report = {
  schema: string;
  status: LayoutRoomIntelligenceV1Status;
};

type SmartTechnicalValidatorV1Status = "TECHNICAL_VALIDATION_READY" | "TECHNICAL_VALIDATION_REVIEW_REQUIRED" | "TECHNICAL_VALIDATION_BLOCKED" | string;

type SmartTechnicalValidatorV1Issue = {
  status: "ready" | "review" | "blocked" | string;
  severity: "error" | "warning" | "info" | string;
};

type SmartTechnicalValidatorV1Report = {
  schema: string;
  status: SmartTechnicalValidatorV1Status;
  issues: SmartTechnicalValidatorV1Issue[];
  totals: { checks: number };
};

type FactoryProductionPackageV1Status = "READY" | "REVIEW_REQUIRED" | "BLOCKED" | string;

type FactoryProductionPackageV1Report = {
  schema: string;
  status: FactoryProductionPackageV1Status;
  totals: { components: number };
};

export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type LayoutRoomIntelligenceV2ItemStatus = "ready" | "review" | "blocked";

export type LayoutRoomIntelligenceV2ZoneType =
  | "room_shell"
  | "wall_elevation"
  | "opening"
  | "furniture_footprint"
  | "clearance"
  | "technical_point"
  | "mounting";

export type LayoutRoomIntelligenceV2Zone = {
  id: string;
  label: string;
  type: LayoutRoomIntelligenceV2ZoneType;
  status: LayoutRoomIntelligenceV2ItemStatus;
  requiredInput: string[];
  validationTarget: string;
  linkedOutput: string;
  note: string;
};

export type LayoutRoomIntelligenceV2Report = {
  schema: "bagastudio-layout-room-intelligence-v2";
  version: 2;
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutV1Schema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutV1Status: LayoutRoomIntelligenceV1Status;
  sourceSmartValidatorSchema: SmartTechnicalValidatorV1Report["schema"];
  sourceSmartValidatorStatus: SmartTechnicalValidatorV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  roomModel: {
    inputModes: Array<"manual_trace" | "image_pdf_reference" | "dxf_dwg_future">;
    scaleApprovalRequired: boolean;
    wallElevationGeneration: boolean;
    preserveExternalFurnitureFootprints: boolean;
    supportMultipleFurnitureItems: boolean;
  };
  validationRules: {
    requireClosedRoomShell: boolean;
    requireScaledReference: boolean;
    requireOpeningsBeforeFurnitureApproval: boolean;
    requireBaseboardAndWallSupport: boolean;
    requireClearanceValidation: boolean;
    requireSmartTechnicalValidatorGate: boolean;
    blockTechnicalExportOnCriticalIssues: boolean;
  };
  totals: {
    zones: number;
    ready: number;
    review: number;
    blocked: number;
    linkedFurnitureItems: number;
    smartValidatorIssues: number;
    criticalTechnicalIssues: number;
  };
  zones: LayoutRoomIntelligenceV2Zone[];
  nextActions: string[];
  recommendations: string[];
};

export function buildLayoutRoomIntelligenceV2Report(params: {
  layoutV1: LayoutRoomIntelligenceV1Report;
  smartValidator: SmartTechnicalValidatorV1Report;
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutRoomIntelligenceV2Report {
  const layoutBlocked = params.layoutV1.status === "ROOM_BLOCKED";
  const factoryBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const smartBlocked = params.smartValidator.status === "TECHNICAL_VALIDATION_BLOCKED";
  const smartReview = params.smartValidator.status === "TECHNICAL_VALIDATION_REVIEW_REQUIRED";
  const criticalTechnicalIssues = params.smartValidator.issues.filter(
    (issue) => issue.status === "blocked" || (issue.status === "review" && issue.severity === "error")
  ).length;

  const zones: LayoutRoomIntelligenceV2Zone[] = [
    {
      id: "v2-room-shell-scaled-trace",
      label: "Guscio stanza quotato",
      type: "room_shell",
      status: layoutBlocked ? "blocked" : "review",
      requiredInput: ["piantina immagine/PDF o tracciamento manuale", "scala reale", "muri perimetrali", "misure principali"],
      validationTarget: "closedRoomShell+scaledReference",
      linkedOutput: "base pianta quotata per PDF/DXF/CAD e controllo ingombri",
      note: "V2 rende esplicito il modello stanza: prima si approva scala e guscio, poi si posizionano mobili e punti tecnici.",
    },
    {
      id: "v2-wall-elevations",
      label: "Prospetti parete generabili",
      type: "wall_elevation",
      status: layoutBlocked || smartBlocked ? "blocked" : "review",
      requiredInput: ["pareti nominate", "altezza ambiente", "lato mobile", "quote da pavimento", "tipo lavandino se presente"],
      validationTarget: "wallElevationReference+sinkHeightRules",
      linkedOutput: "prospetti parete con mobile, quote, elettrico, idraulico, fissaggi e note montaggio",
      note: "Collega Layout Intelligence alle schede parete: lavandino da appoggio 850 mm, incasso 930 mm e punti tecnici coerenti.",
    },
    {
      id: "v2-openings-obstacles",
      label: "Aperture, porte, finestre e ostacoli",
      type: "opening",
      status: "review",
      requiredInput: ["porte", "finestre", "pilastri", "nicchie", "zone non finestrabili", "ostacoli fissi"],
      validationTarget: "openings+obstacles+noWindowWalls",
      linkedOutput: "alert collisioni ambiente e vincoli parete prima del posizionamento definitivo",
      note: "Serve per evitare mobili davanti ad aperture, interferenze con ante/cassetti e vincoli architettonici non rispettati.",
    },
    {
      id: "v2-furniture-footprints",
      label: "Ingombri mobili Product Package",
      type: "furniture_footprint",
      status: factoryBlocked ? "blocked" : "review",
      requiredInput: ["Product Package", "ingombro esterno bloccato", "posizione in pianta", "rotazione", "lato parete"],
      validationTarget: "productPackageFootprint+lockedExternalDimensions",
      linkedOutput: "mobili posizionati in pianta senza deformare dimensioni esterne e collegati a Factory Engine",
      note: "Gli ingombri devono restare parametrici ma con misura esterna bloccata, coerente con le regole Manufacturing Override.",
    },
    {
      id: "v2-clearance-collision",
      label: "Passaggi, apertura frontali e collisioni",
      type: "clearance",
      status: factoryBlocked || smartBlocked ? "blocked" : "review",
      requiredInput: ["passaggi minimi", "ingombro apertura ante/cassetti", "spazio montaggio", "collisioni con muri e ostacoli"],
      validationTarget: "clearance+frontOpening+roomCollision",
      linkedOutput: "warning montabilità locale e blocco export tecnico se il mobile non è installabile",
      note: "V2 prepara il controllo funzionale del locale, non solo la presenza del mobile in pianta.",
    },
    {
      id: "v2-baseboard-wall-support",
      label: "Battiscopa, supporto parete e fissaggi",
      type: "mounting",
      status: smartBlocked ? "blocked" : "review",
      requiredInput: ["presenza battiscopa", "altezza/spessore battiscopa", "tipo parete", "fissaggi previsti", "carico mensole/pensili"],
      validationTarget: "baseboardCutout+wallSupport+fixingProfile",
      linkedOutput: "scassi, distanziali, fissaggi e avvisi strutturali su scheda tecnica",
      note: "Integra le regole della Knowledge Base: cartongesso, muratura, mensole, pensili e scassi diventano gate tecnici.",
    },
    {
      id: "v2-technical-points-map",
      label: "Mappa punti tecnici",
      type: "technical_point",
      status: smartBlocked ? "blocked" : smartReview ? "review" : "ready",
      requiredInput: ["prese", "alimentazioni LED/specchi", "scarichi", "carico acqua calda/fredda", "passacavi", "punti fissaggio"],
      validationTarget: "technicalPoints+smartValidatorRules",
      linkedOutput: "layer tecnici per prospetti parete, PDF, DXF/CAD e distinta installazione",
      note: "I punti tecnici vengono letti come dati strutturati e validati dal futuro motore tecnico, non come note libere.",
    },
  ];

  const blocked = zones.filter((zone) => zone.status === "blocked").length;
  const review = zones.filter((zone) => zone.status === "review").length;
  const ready = zones.filter((zone) => zone.status === "ready").length;

  const status: LayoutRoomIntelligenceV2Status =
    blocked > 0 || criticalTechnicalIssues > 0
      ? "LAYOUT_V2_BLOCKED"
      : review > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY";

  return {
    schema: "bagastudio-layout-room-intelligence-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutV1Schema: params.layoutV1.schema,
    sourceLayoutV1Status: params.layoutV1.status,
    sourceSmartValidatorSchema: params.smartValidator.schema,
    sourceSmartValidatorStatus: params.smartValidator.status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    roomModel: {
      inputModes: ["manual_trace", "image_pdf_reference", "dxf_dwg_future"],
      scaleApprovalRequired: true,
      wallElevationGeneration: true,
      preserveExternalFurnitureFootprints: true,
      supportMultipleFurnitureItems: true,
    },
    validationRules: {
      requireClosedRoomShell: true,
      requireScaledReference: true,
      requireOpeningsBeforeFurnitureApproval: true,
      requireBaseboardAndWallSupport: true,
      requireClearanceValidation: true,
      requireSmartTechnicalValidatorGate: true,
      blockTechnicalExportOnCriticalIssues: true,
    },
    totals: {
      zones: zones.length,
      ready,
      review,
      blocked,
      linkedFurnitureItems: params.factoryProductionPackage.totals.components,
      smartValidatorIssues: params.smartValidator.totals.checks,
      criticalTechnicalIssues,
    },
    zones,
    nextActions: [
      "Creare input guidato per stanza: scala, muri, aperture e altezza ambiente.",
      "Collegare ogni mobile Product Package a posizione/rotazione/lato parete senza alterare le dimensioni esterne.",
      "Portare battiscopa, tipo parete, fissaggi e punti tecnici dentro un modello dati strutturato e validabile.",
      "Usare Smart Technical Validator V1 come gate prima di export PDF/DXF/CAD e schede parete definitive.",
    ],
    recommendations: [
      "Layout / Room Intelligence V2 deve diventare il ponte operativo tra piantina cliente, Product Package, Factory Engine e schede tecniche parete.",
      "La prima versione resta conservativa: report e gate diagnostici, senza modificare ancora geometrie, viewer o pipeline import.",
      "Gli step successivi potranno aggiungere editor visuale stanza, riconoscimento guidato da immagine/PDF e export tecnico con layer reali.",
    ],
  };
}

