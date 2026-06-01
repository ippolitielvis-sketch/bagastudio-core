type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV25Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
};

export type DynamicRuleRegistryV26RuleType =
  | "min_center_distance"
  | "linked_center_distance"
  | "minimum_clearance"
  | "technical_export_gate";

export type DynamicRuleRegistryV26Severity = "info" | "warning" | "error";

export type DynamicRuleRegistryV26Scope =
  | "layout_room_intelligence"
  | "wall_elevation"
  | "technical_points"
  | "factory_export";

export type DynamicRuleRegistryV26Rule = {
  id: string;
  enabled: boolean;
  module: DynamicRuleRegistryV26Scope;
  type: DynamicRuleRegistryV26RuleType;
  target: string;
  linkedTarget?: string;
  minDistanceCm?: number;
  minClearanceCm?: number;
  severity: DynamicRuleRegistryV26Severity;
  message: string;
  editableFromAdmin: boolean;
  exportLayer: string;
  source: "core_default" | "admin_custom" | "client_profile";
};

export type DynamicRuleRegistryV26Evaluation = {
  id: string;
  ruleId: string;
  enabled: boolean;
  passed: boolean;
  severity: DynamicRuleRegistryV26Severity;
  target: string;
  linkedTarget?: string;
  expected: string;
  detected: string;
  action: string;
  exportLayer: string;
};

export type DynamicRuleRegistryV26Report = {
  schema: "bagastudio-dynamic-rule-registry-v2-6";
  version: "2.6";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV25Schema: LayoutRoomIntelligenceV25Report["schema"];
  sourceLayoutRoomIntelligenceV25Status: LayoutRoomIntelligenceV2Status;
  registryEngine: {
    jsonDrivenRules: boolean;
    adminEditableRules: boolean;
    clientProfileOverridesReady: boolean;
    supportsProgressiveRuleAdditions: boolean;
    canExportRuleSet: boolean;
    canBlockTechnicalExport: boolean;
  };
  ruleSet: {
    id: string;
    label: string;
    description: string;
    rules: DynamicRuleRegistryV26Rule[];
  };
  evaluations: DynamicRuleRegistryV26Evaluation[];
  totals: {
    rules: number;
    enabled: number;
    adminEditable: number;
    passed: number;
    warnings: number;
    errors: number;
    exportBlockingRules: number;
  };
  nextActions: string[];
};

export function buildDefaultDynamicRuleRegistryV26Rules(): DynamicRuleRegistryV26Rule[] {
  return [
    {
      id: "rule-layout-barber-chair-spacing",
      enabled: true,
      module: "layout_room_intelligence",
      type: "min_center_distance",
      target: "barber_chair",
      linkedTarget: "barber_mirror",
      minDistanceCm: 150,
      severity: "error",
      message: "Interasse minimo barber: 150 cm tra poltrone e specchi collegati.",
      editableFromAdmin: true,
      exportLayer: "layer-mirrors",
      source: "core_default",
    },
    {
      id: "rule-layout-esthetician-chair-spacing",
      enabled: true,
      module: "layout_room_intelligence",
      type: "min_center_distance",
      target: "esthetician_chair",
      linkedTarget: "esthetician_mirror",
      minDistanceCm: 120,
      severity: "error",
      message: "Interasse minimo estetista: 120 cm tra poltrone e specchi collegati.",
      editableFromAdmin: true,
      exportLayer: "layer-mirrors",
      source: "core_default",
    },
    {
      id: "rule-layout-main-passage",
      enabled: true,
      module: "layout_room_intelligence",
      type: "minimum_clearance",
      target: "main_passage",
      minClearanceCm: 80,
      severity: "warning",
      message: "Passaggio principale consigliato: minimo 80 cm nelle zone operative.",
      editableFromAdmin: true,
      exportLayer: "layer-alerts",
      source: "core_default",
    },
    {
      id: "rule-layout-installer-working-area",
      enabled: true,
      module: "factory_export",
      type: "minimum_clearance",
      target: "installer_working_area",
      minClearanceCm: 70,
      severity: "warning",
      message: "Area utile montatore consigliata: minimo 70 cm davanti al mobile.",
      editableFromAdmin: true,
      exportLayer: "layer-alerts",
      source: "core_default",
    },
    {
      id: "rule-layout-technical-export-gate",
      enabled: true,
      module: "factory_export",
      type: "technical_export_gate",
      target: "technical_export",
      severity: "error",
      message: "Blocca PDF/DXF/CAD se esistono errori tecnici non risolti.",
      editableFromAdmin: false,
      exportLayer: "layer-alerts",
      source: "core_default",
    },
  ];
}

export function buildDynamicRuleRegistryV26Report(params: {
  layoutV25: LayoutRoomIntelligenceV25Report;
}): DynamicRuleRegistryV26Report {
  const rules = buildDefaultDynamicRuleRegistryV26Rules();
  const inheritedBlocked = params.layoutV25.status === "LAYOUT_V2_BLOCKED";
  const inheritedReview = params.layoutV25.status === "LAYOUT_V2_REVIEW_REQUIRED";

  const evaluations: DynamicRuleRegistryV26Evaluation[] = rules.map((rule) => {
    const passed = !inheritedBlocked;
    const expected =
      rule.type === "min_center_distance"
        ? `Distanza centro-centro minima ${rule.minDistanceCm ?? 0} cm`
        : rule.type === "minimum_clearance"
          ? `Luce/passaggio minimo ${rule.minClearanceCm ?? 0} cm`
          : "Nessun errore tecnico bloccante prima dell'export";

    return {
      id: `v2-6-eval-${rule.id}`,
      ruleId: rule.id,
      enabled: rule.enabled,
      passed,
      severity: rule.severity,
      target: rule.target,
      linkedTarget: rule.linkedTarget,
      expected,
      detected: passed
        ? "Regola registrata e pronta per coordinate reali del Room Editor."
        : "Layout precedente bloccato: la regola resta attiva ma non può validare dati affidabili.",
      action: rule.editableFromAdmin
        ? "Esporre questa regola nel futuro Admin Rules Manager con import/export JSON."
        : "Mantenere questa regola come gate core non disattivabile senza permesso tecnico.",
      exportLayer: rule.exportLayer,
    };
  });

  const exportBlockingRules = evaluations.filter(
    (evaluation) => evaluation.enabled && !evaluation.passed && evaluation.severity === "error"
  ).length;
  const warnings = evaluations.filter(
    (evaluation) => evaluation.enabled && !evaluation.passed && evaluation.severity === "warning"
  ).length;
  const errors = evaluations.filter(
    (evaluation) => evaluation.enabled && !evaluation.passed && evaluation.severity === "error"
  ).length;

  return {
    schema: "bagastudio-dynamic-rule-registry-v2-6",
    version: "2.6",
    generatedAt: new Date().toISOString(),
    status: exportBlockingRules > 0
      ? "LAYOUT_V2_BLOCKED"
      : inheritedReview || warnings > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceLayoutRoomIntelligenceV25Schema: params.layoutV25.schema,
    sourceLayoutRoomIntelligenceV25Status: params.layoutV25.status,
    registryEngine: {
      jsonDrivenRules: true,
      adminEditableRules: true,
      clientProfileOverridesReady: true,
      supportsProgressiveRuleAdditions: true,
      canExportRuleSet: true,
      canBlockTechnicalExport: true,
    },
    ruleSet: {
      id: "bagastudio-core-layout-rules-v2-6",
      label: "BagaStudio Core Layout Rules V2.6",
      description: "Registro regole JSON-driven per aggiungere nel tempo controlli layout, pareti, interassi, passaggi e gate export senza hardcoding diretto nel modulo principale.",
      rules,
    },
    evaluations,
    totals: {
      rules: rules.length,
      enabled: rules.filter((rule) => rule.enabled).length,
      adminEditable: rules.filter((rule) => rule.editableFromAdmin).length,
      passed: evaluations.filter((evaluation) => evaluation.passed).length,
      warnings,
      errors,
      exportBlockingRules,
    },
    nextActions: [
      "Creare Admin Rules Manager: lista regole, toggle abilitato, soglia cm, severità e messaggio cliente/tecnico.",
      "Salvare ruleSet in Product Package, profilo cliente o profilo settore, mantenendo regole core non disattivabili.",
      "Collegare le valutazioni V2.6 alle coordinate reali del Room Editor e ai prospetti parete.",
      "Aggiungere import/export JSON delle regole per barber, estetica, retail, bagno, cucina e profili custom.",
    ],
  };
}

