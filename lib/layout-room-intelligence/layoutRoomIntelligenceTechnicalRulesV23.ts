type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV22Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  totals: {
    exportBlockingGates: number;
    blocked: number;
  };
  wallSheetGates: Array<{
    id: string;
    passed: boolean;
  }>;
};

export type LayoutRoomIntelligenceV23RuleSeverity = "info" | "warning" | "critical";

export type LayoutRoomIntelligenceV23WallRule = {
  id: string;
  label: string;
  category: "dimensions" | "plumbing" | "electrical" | "fixing" | "baseboard" | "clearance";
  severity: LayoutRoomIntelligenceV23RuleSeverity;
  passed: boolean;
  requiredData: string[];
  action: string;
  exportLayer: string;
};

export type LayoutRoomIntelligenceV23Report = {
  schema: "bagastudio-layout-room-intelligence-v2-3";
  version: "2.3";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV22Schema: LayoutRoomIntelligenceV22Report["schema"];
  sourceLayoutRoomIntelligenceV22Status: LayoutRoomIntelligenceV2Status;
  technicalWallRulesEngine: {
    parametricWallRules: boolean;
    sinkHeightAutoRules: boolean;
    technicalPointLayerRouting: boolean;
    fixingSupportValidation: boolean;
    baseboardCutoutValidation: boolean;
    pdfDxfLayerPreRouting: boolean;
  };
  totals: {
    rules: number;
    passed: number;
    warnings: number;
    critical: number;
    exportBlockedRules: number;
  };
  wallRules: LayoutRoomIntelligenceV23WallRule[];
  sinkHeightRules: Array<{
    id: string;
    sinkType: "appoggio" | "incasso";
    topHeightCm: number;
    appliesTo: string;
    note: string;
  }>;
  exportRouting: Array<{
    id: string;
    layer: string;
    target: "PDF" | "DXF" | "CAD" | "Viewer Overlay";
    content: string;
  }>;
  nextActions: string[];
};

export function buildLayoutRoomIntelligenceV23Report(params: {
  layoutV22: LayoutRoomIntelligenceV22Report;
}): LayoutRoomIntelligenceV23Report {
  const hasBlockingGates = params.layoutV22.totals.exportBlockingGates > 0;
  const hasBlockedElevations = params.layoutV22.totals.blocked > 0;
  const technicalPointsGate = params.layoutV22.wallSheetGates.find((gate) => gate.id === "v2-2-gate-technical-points");
  const smartValidatorGate = params.layoutV22.wallSheetGates.find((gate) => gate.id === "v2-2-gate-smart-validator");
  const scaledRoomGate = params.layoutV22.wallSheetGates.find((gate) => gate.id === "v2-2-gate-scaled-room-shell");

  const wallRules: LayoutRoomIntelligenceV23WallRule[] = [
    {
      id: "v2-3-rule-scaled-wall-dimensions",
      label: "Quote parete e ingombro mobile parametrici",
      category: "dimensions",
      severity: scaledRoomGate?.passed ? "info" : "critical",
      passed: Boolean(scaledRoomGate?.passed),
      requiredData: ["larghezza parete", "altezza parete", "posizione mobile", "quota sospensione", "profondità mobile"],
      action: scaledRoomGate?.passed ? "Usare le quote come base per prospetti e DXF." : "Bloccare export tecnico finché scala e guscio stanza non sono approvati.",
      exportLayer: "layer-dimensions",
    },
    {
      id: "v2-3-rule-plumbing-sink-height",
      label: "Regola lavandino appoggio/incasso",
      category: "plumbing",
      severity: technicalPointsGate?.passed ? "warning" : "critical",
      passed: Boolean(technicalPointsGate?.passed),
      requiredData: ["tipo lavandino", "quota piano", "scarico", "acqua calda", "acqua fredda"],
      action: "Applicare piano a 85 cm per lavandino da appoggio e 93 cm per lavandino da incasso, poi riallineare punti idraulici.",
      exportLayer: "layer-plumbing",
    },
    {
      id: "v2-3-rule-electrical-services",
      label: "Prese, LED, specchi e passacavi quotati",
      category: "electrical",
      severity: technicalPointsGate?.passed ? "info" : "warning",
      passed: Boolean(technicalPointsGate?.passed),
      requiredData: ["presa", "alimentazione LED", "alimentazione specchio", "passacavi", "quota da terra"],
      action: "Separare elettrico in layer dedicato e mantenere quote modificabili prima di PDF/DXF.",
      exportLayer: "layer-electrical",
    },
    {
      id: "v2-3-rule-wall-fixing-support",
      label: "Fissaggi coerenti con tipo parete",
      category: "fixing",
      severity: smartValidatorGate?.passed ? "warning" : "critical",
      passed: Boolean(smartValidatorGate?.passed),
      requiredData: ["tipo parete", "carico pensile/mensola", "ferramenta fissaggio", "punti staffa", "note montaggio"],
      action: smartValidatorGate?.passed ? "Generare punti fissaggio e note montaggio." : "Richiedere validazione supporto parete prima di autorizzare scheda tecnica finale.",
      exportLayer: "layer-fixing",
    },
    {
      id: "v2-3-rule-baseboard-cutout",
      label: "Battiscopa e scassi mobile",
      category: "baseboard",
      severity: hasBlockedElevations ? "warning" : "info",
      passed: !hasBlockedElevations,
      requiredData: ["altezza battiscopa", "spessore battiscopa", "scasso richiesto", "distanza da parete"],
      action: "Segnalare scassi necessari sul prospetto e nei dati di montaggio.",
      exportLayer: "layer-alerts",
    },
    {
      id: "v2-3-rule-openings-clearance",
      label: "Aperture, ante, cassetti e passaggi minimi",
      category: "clearance",
      severity: hasBlockingGates ? "warning" : "info",
      passed: !hasBlockingGates,
      requiredData: ["porte", "finestre", "ingombro apertura", "passaggio minimo", "ostacoli fissi"],
      action: "Generare alert se aperture o passaggi interferiscono con mobile, cassetti, ante o montaggio.",
      exportLayer: "layer-alerts",
    },
  ];

  const critical = wallRules.filter((rule) => rule.severity === "critical" && !rule.passed).length;
  const warnings = wallRules.filter((rule) => rule.severity === "warning" && !rule.passed).length;
  const passed = wallRules.filter((rule) => rule.passed).length;
  const exportBlockedRules = wallRules.filter((rule) => !rule.passed && rule.severity === "critical").length;

  return {
    schema: "bagastudio-layout-room-intelligence-v2-3",
    version: "2.3",
    generatedAt: new Date().toISOString(),
    status: exportBlockedRules > 0 ? "LAYOUT_V2_BLOCKED" : warnings > 0 ? "LAYOUT_V2_REVIEW_REQUIRED" : "LAYOUT_V2_READY",
    sourceLayoutRoomIntelligenceV22Schema: params.layoutV22.schema,
    sourceLayoutRoomIntelligenceV22Status: params.layoutV22.status,
    technicalWallRulesEngine: {
      parametricWallRules: true,
      sinkHeightAutoRules: true,
      technicalPointLayerRouting: true,
      fixingSupportValidation: true,
      baseboardCutoutValidation: true,
      pdfDxfLayerPreRouting: true,
    },
    totals: {
      rules: wallRules.length,
      passed,
      warnings,
      critical,
      exportBlockedRules,
    },
    wallRules,
    sinkHeightRules: [
      {
        id: "v2-3-sink-countertop-appoggio",
        sinkType: "appoggio",
        topHeightCm: 85,
        appliesTo: "lavandino da appoggio",
        note: "Piano a 85 cm da terra come quota tecnica base per mobile con lavabo da appoggio.",
      },
      {
        id: "v2-3-sink-countertop-incasso",
        sinkType: "incasso",
        topHeightCm: 93,
        appliesTo: "lavandino da incasso",
        note: "Piano a 93 cm da terra come quota tecnica base per mobile con lavabo da incasso.",
      },
    ],
    exportRouting: [
      { id: "v2-3-route-dimensions", layer: "layer-dimensions", target: "PDF", content: "quote principali, quote da terra, altezza piano, ingombri mobili" },
      { id: "v2-3-route-plumbing", layer: "layer-plumbing", target: "DXF", content: "scarico, acqua calda, acqua fredda, quote lavandino" },
      { id: "v2-3-route-electrical", layer: "layer-electrical", target: "DXF", content: "prese, LED, specchi, passacavi, alimentazioni" },
      { id: "v2-3-route-fixing", layer: "layer-fixing", target: "CAD", content: "punti staffa, tasselli, supporto parete, note ferramenta" },
      { id: "v2-3-route-alerts", layer: "layer-alerts", target: "Viewer Overlay", content: "battiscopa, collisioni, passaggi, aperture, criticità montaggio" },
    ],
    nextActions: [
      "Convertire queste regole V2.3 in campi editabili per ogni parete del progetto.",
      "Collegare tipo lavandino e quota piano ai Product Package bagno/lavaggio per generare punti idraulici automatici.",
      "Usare exportRouting per creare layer PDF/DXF/CAD realmente separati nel futuro Technical Sheet Generator.",
      "Preparare il passaggio successivo: Room Trace / Wall Editor V1 per tracciare pareti e aperture dalla piantina caricata.",
    ],
  };
}
