import type {
  DynamicRuleRegistryV26Report,
  DynamicRuleRegistryV26RuleType,
  DynamicRuleRegistryV26Scope,
  DynamicRuleRegistryV26Severity,
} from "./dynamicRuleRegistryV26";

type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type DynamicRuleAdminBridgeV27RuleDraft = {
  id: string;
  sourceRuleId?: string;
  label: string;
  module: DynamicRuleRegistryV26Scope;
  type: DynamicRuleRegistryV26RuleType;
  target: string;
  linkedTarget?: string;
  numericValueCm?: number;
  severity: DynamicRuleRegistryV26Severity;
  editable: boolean;
  lockedReason?: string;
  adminStatus: "ready" | "needs_review" | "locked_core";
  validationMessage: string;
};

export type DynamicRuleAdminBridgeV27Report = {
  schema: "bagastudio-dynamic-rule-admin-bridge-v2-7";
  version: "2.7";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceRegistrySchema: DynamicRuleRegistryV26Report["schema"];
  adminBridge: {
    adminRulesManagerReady: boolean;
    importRulesJsonReady: boolean;
    exportRulesJsonReady: boolean;
    coreRulesLockReady: boolean;
    profileOverridesReady: boolean;
    ruleValidationBeforeSave: boolean;
  };
  drafts: DynamicRuleAdminBridgeV27RuleDraft[];
  importExportContract: {
    acceptedSchema: string;
    requiredFields: string[];
    optionalFields: string[];
    blockedOperations: string[];
  };
  totals: {
    drafts: number;
    ready: number;
    needsReview: number;
    lockedCore: number;
    importable: number;
    exportable: number;
  };
  nextActions: string[];
};

export function buildDynamicRuleAdminBridgeV27Report(params: {
  registryV26: DynamicRuleRegistryV26Report;
}): DynamicRuleAdminBridgeV27Report {
  const drafts: DynamicRuleAdminBridgeV27RuleDraft[] = params.registryV26.ruleSet.rules.map((rule) => {
    const numericValueCm = rule.minDistanceCm ?? rule.minClearanceCm;
    const isLockedCore = !rule.editableFromAdmin;
    const needsReview = rule.enabled && numericValueCm !== undefined && numericValueCm <= 0;

    return {
      id: `v2-7-draft-${rule.id}`,
      sourceRuleId: rule.id,
      label: rule.message,
      module: rule.module,
      type: rule.type,
      target: rule.target,
      linkedTarget: rule.linkedTarget,
      numericValueCm,
      severity: rule.severity,
      editable: rule.editableFromAdmin,
      lockedReason: isLockedCore
        ? "Regola core: non disattivabile da Admin perché protegge export tecnico e affidabilità del progetto."
        : undefined,
      adminStatus: isLockedCore ? "locked_core" : needsReview ? "needs_review" : "ready",
      validationMessage: isLockedCore
        ? "Mostrare in Admin come regola bloccata con sola lettura."
        : needsReview
          ? "Richiede valore numerico valido prima del salvataggio."
          : "Regola pronta per modifica controllata da Admin Rules Manager.",
    };
  });

  const needsReview = drafts.filter((draft) => draft.adminStatus === "needs_review").length;
  const lockedCore = drafts.filter((draft) => draft.adminStatus === "locked_core").length;
  const ready = drafts.filter((draft) => draft.adminStatus === "ready").length;

  return {
    schema: "bagastudio-dynamic-rule-admin-bridge-v2-7",
    version: "2.7",
    generatedAt: new Date().toISOString(),
    status: params.registryV26.status === "LAYOUT_V2_BLOCKED"
      ? "LAYOUT_V2_BLOCKED"
      : needsReview > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : params.registryV26.status,
    sourceRegistrySchema: params.registryV26.schema,
    adminBridge: {
      adminRulesManagerReady: true,
      importRulesJsonReady: true,
      exportRulesJsonReady: true,
      coreRulesLockReady: true,
      profileOverridesReady: true,
      ruleValidationBeforeSave: true,
    },
    drafts,
    importExportContract: {
      acceptedSchema: "bagastudio-layout-rule-set-v1",
      requiredFields: ["id", "module", "type", "target", "severity", "message", "enabled"],
      optionalFields: ["linkedTarget", "minDistanceCm", "minClearanceCm", "exportLayer", "clientProfile", "sectorProfile"],
      blockedOperations: [
        "Disattivazione regole core locked",
        "Soglie numeriche uguali o inferiori a zero",
        "Import con module/type non riconosciuti",
        "Sovrascrittura ID core senza permesso tecnico",
      ],
    },
    totals: {
      drafts: drafts.length,
      ready,
      needsReview,
      lockedCore,
      importable: drafts.filter((draft) => draft.editable && draft.adminStatus !== "needs_review").length,
      exportable: drafts.length,
    },
    nextActions: [
      "Creare schermata Admin Rules Manager con elenco regole, filtri per modulo, severità e profilo settore.",
      "Aggiungere form controllato per soglie cm, target, linkedTarget, messaggio tecnico e livello di severità.",
      "Validare ogni import JSON prima dell'applicazione, mantenendo rollback se una regola è corrotta.",
      "Salvare regole custom dentro Product Package o profilo cliente, senza toccare il codice principale.",
    ],
  };
}

