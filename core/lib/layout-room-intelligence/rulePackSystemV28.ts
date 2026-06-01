type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type DynamicRuleAdminBridgeV27Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  totals: { needsReview: number };
  drafts: Array<{
    adminStatus: string;
    sourceRuleId: string;
    editable: boolean;
    target: string;
    linkedTarget?: string;
  }>;
};

export type DynamicRulePackV28Category = "core" | "sector" | "client" | "project";

export type DynamicRulePackV28Status = "active" | "draft" | "locked";

export type DynamicRulePackV28 = {
  id: string;
  label: string;
  category: DynamicRulePackV28Category;
  status: DynamicRulePackV28Status;
  profile: string;
  description: string;
  ruleIds: string[];
  locked: boolean;
  editableFromAdmin: boolean;
  exportScope: "global" | "tenant" | "product-package" | "single-project";
};

export type DynamicRulePackV28Report = {
  schema: "bagastudio-dynamic-rule-pack-system-v2-8";
  version: "2.8";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceAdminBridgeSchema: DynamicRuleAdminBridgeV27Report["schema"];
  rulePackSystem: {
    packsEnabled: boolean;
    supportsCorePacks: boolean;
    supportsSectorPacks: boolean;
    supportsClientPacks: boolean;
    supportsProjectOverrides: boolean;
    preventsCoreRuleDeletion: boolean;
    exportsPacksAsJson: boolean;
  };
  packs: DynamicRulePackV28[];
  activationOrder: string[];
  conflictPolicy: {
    priority: string[];
    lockedCoreRulesAlwaysWin: boolean;
    sameRuleIdOverrideAllowedOnlyIfEditable: boolean;
    invalidPackBlocksActivation: boolean;
  };
  totals: {
    packs: number;
    active: number;
    draft: number;
    locked: number;
    editable: number;
    linkedRules: number;
  };
  nextActions: string[];
};

export function buildDynamicRulePackV28Report(params: {
  adminBridgeV27: DynamicRuleAdminBridgeV27Report;
}): DynamicRulePackV28Report {
  const drafts = params.adminBridgeV27.drafts;
  const coreRuleIds = drafts.filter((draft) => draft.adminStatus === "locked_core").map((draft) => draft.sourceRuleId);
  const editableRuleIds = drafts.filter((draft) => draft.editable).map((draft) => draft.sourceRuleId);
  const barberRuleIds = drafts
    .filter((draft) => draft.target.includes("barber") || draft.linkedTarget?.includes("barber"))
    .map((draft) => draft.sourceRuleId);
  const estheticianRuleIds = drafts
    .filter((draft) => draft.target.includes("esthetician") || draft.linkedTarget?.includes("esthetician"))
    .map((draft) => draft.sourceRuleId);

  const packs: DynamicRulePackV28[] = [
    {
      id: "v2-8-pack-core-safety",
      label: "Core Safety Rules",
      category: "core",
      status: "locked",
      profile: "bagastudio-core",
      description: "Pacchetto regole tecniche non disattivabili: passaggi minimi, fissaggi, punti tecnici e controlli bloccanti export.",
      ruleIds: coreRuleIds,
      locked: true,
      editableFromAdmin: false,
      exportScope: "global",
    },
    {
      id: "v2-8-pack-barber-layout",
      label: "Barber Layout Pack",
      category: "sector",
      status: "active",
      profile: "barber",
      description: "Regole settore barber: interasse poltrone/specchi 150 cm e predisposizione controllo postazioni.",
      ruleIds: barberRuleIds,
      locked: false,
      editableFromAdmin: true,
      exportScope: "tenant",
    },
    {
      id: "v2-8-pack-esthetician-layout",
      label: "Estetica Layout Pack",
      category: "sector",
      status: "active",
      profile: "esthetician",
      description: "Regole settore estetica: interasse poltrone/specchi 120 cm e controlli collegati ai prospetti tecnici.",
      ruleIds: estheticianRuleIds,
      locked: false,
      editableFromAdmin: true,
      exportScope: "tenant",
    },
    {
      id: "v2-8-pack-client-overrides",
      label: "Client Custom Overrides",
      category: "client",
      status: editableRuleIds.length > 0 ? "draft" : "active",
      profile: "client-custom",
      description: "Pacchetto futuro per regole personalizzate del cliente, caricabili da Admin senza modificare il codice.",
      ruleIds: editableRuleIds,
      locked: false,
      editableFromAdmin: true,
      exportScope: "product-package",
    },
  ];

  const invalidDrafts = params.adminBridgeV27.totals.needsReview;
  const active = packs.filter((pack) => pack.status === "active").length;
  const draft = packs.filter((pack) => pack.status === "draft").length;
  const locked = packs.filter((pack) => pack.locked || pack.status === "locked").length;
  const editable = packs.filter((pack) => pack.editableFromAdmin).length;
  const linkedRules = packs.reduce((total, pack) => total + pack.ruleIds.length, 0);

  return {
    schema: "bagastudio-dynamic-rule-pack-system-v2-8",
    version: "2.8",
    generatedAt: new Date().toISOString(),
    status: params.adminBridgeV27.status === "LAYOUT_V2_BLOCKED"
      ? "LAYOUT_V2_BLOCKED"
      : invalidDrafts > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : params.adminBridgeV27.status,
    sourceAdminBridgeSchema: params.adminBridgeV27.schema,
    rulePackSystem: {
      packsEnabled: true,
      supportsCorePacks: true,
      supportsSectorPacks: true,
      supportsClientPacks: true,
      supportsProjectOverrides: true,
      preventsCoreRuleDeletion: true,
      exportsPacksAsJson: true,
    },
    packs,
    activationOrder: [
      "1. Core Safety Rules sempre attivo e non modificabile.",
      "2. Sector Pack attivo in base al settore progetto: barber, estetica, retail, bagno, cucina, ecc.",
      "3. Client Custom Overrides applicati solo su regole editabili.",
      "4. Project Overrides salvati nel Product Package e validati prima dell'export tecnico.",
    ],
    conflictPolicy: {
      priority: ["core", "sector", "client", "project"],
      lockedCoreRulesAlwaysWin: true,
      sameRuleIdOverrideAllowedOnlyIfEditable: true,
      invalidPackBlocksActivation: true,
    },
    totals: {
      packs: packs.length,
      active,
      draft,
      locked,
      editable,
      linkedRules,
    },
    nextActions: [
      "Creare Admin Rules Pack Manager con attiva/disattiva pacchetti, duplicazione profilo e import/export JSON.",
      "Collegare il settore del Product Package al pack corretto, evitando regole non pertinenti nel progetto.",
      "Permettere override cliente solo su regole editabili, lasciando bloccate le regole core di sicurezza tecnica.",
      "Preparare V2.9: Rule Conflict Resolver con priorità, diff tra pacchetti e rollback se una regola importata è corrotta.",
    ],
  };
}
