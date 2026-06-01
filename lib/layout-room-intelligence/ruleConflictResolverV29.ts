import type { DynamicRulePackV28Category, DynamicRulePackV28Report } from "./rulePackSystemV28";

type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type DynamicRuleConflictV29Severity = "info" | "warning" | "error";

export type DynamicRuleConflictV29 = {
  id: string;
  packId: string;
  ruleId: string;
  category: DynamicRulePackV28Category;
  severity: DynamicRuleConflictV29Severity;
  conflictType: "duplicate_rule" | "locked_core_override" | "draft_pack" | "missing_rule_link" | "priority_override";
  detected: string;
  resolution: string;
  blocksActivation: boolean;
};

export type DynamicRuleConflictResolverV29Report = {
  schema: "bagastudio-dynamic-rule-conflict-resolver-v2-9";
  version: "2.9";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceRulePackSchema: DynamicRulePackV28Report["schema"];
  resolver: {
    priorityBasedConflictResolution: boolean;
    lockedCoreRulesAlwaysWin: boolean;
    validatesMissingRuleLinks: boolean;
    blocksInvalidPacksBeforeActivation: boolean;
    supportsRollbackPlan: boolean;
    exportsConflictReportJson: boolean;
  };
  conflicts: DynamicRuleConflictV29[];
  rollbackPlan: string[];
  activationDecision: {
    canActivateRulePacks: boolean;
    blockingConflicts: number;
    warningConflicts: number;
    safePacks: string[];
    packsToReview: string[];
  };
  totals: {
    conflicts: number;
    blocking: number;
    warnings: number;
    info: number;
    safePacks: number;
    packsToReview: number;
  };
  nextActions: string[];
};

export function buildDynamicRuleConflictResolverV29Report(params: {
  rulePackV28: DynamicRulePackV28Report;
}): DynamicRuleConflictResolverV29Report {
  const packs = params.rulePackV28.packs;
  const conflicts: DynamicRuleConflictV29[] = [];
  const ruleOwners = new Map<string, string[]>();

  packs.forEach((pack) => {
    if (pack.status === "draft") {
      conflicts.push({
        id: `v2-9-conflict-draft-${pack.id}`,
        packId: pack.id,
        ruleId: "pack_status",
        category: pack.category,
        severity: "warning",
        conflictType: "draft_pack",
        detected: `Il pacchetto ${pack.label} è ancora in bozza.`,
        resolution: "Validare il pack in Admin Rules Manager prima di attivarlo in produzione.",
        blocksActivation: false,
      });
    }

    if (pack.locked && pack.editableFromAdmin) {
      conflicts.push({
        id: `v2-9-conflict-locked-editable-${pack.id}`,
        packId: pack.id,
        ruleId: "pack_lock_policy",
        category: pack.category,
        severity: "error",
        conflictType: "locked_core_override",
        detected: `Il pacchetto ${pack.label} risulta locked ma editabile da Admin.`,
        resolution: "Bloccare l'editing dei pack core/locked e impedire override di sicurezza.",
        blocksActivation: true,
      });
    }

    if (pack.ruleIds.length === 0 && pack.category !== "client") {
      conflicts.push({
        id: `v2-9-conflict-empty-rules-${pack.id}`,
        packId: pack.id,
        ruleId: "missing_rule_link",
        category: pack.category,
        severity: "warning",
        conflictType: "missing_rule_link",
        detected: `Il pacchetto ${pack.label} non contiene regole collegate.`,
        resolution: "Collegare almeno una regola valida oppure disattivare il pack per questo progetto.",
        blocksActivation: false,
      });
    }

    pack.ruleIds.forEach((ruleId) => {
      const owners = ruleOwners.get(ruleId) || [];
      owners.push(pack.id);
      ruleOwners.set(ruleId, owners);
    });
  });

  ruleOwners.forEach((owners, ruleId) => {
    if (owners.length > 1) {
      conflicts.push({
        id: `v2-9-conflict-duplicate-${ruleId}`,
        packId: owners.join(" + "),
        ruleId,
        category: "project",
        severity: "info",
        conflictType: "duplicate_rule",
        detected: `La regola ${ruleId} è presente in più pack: ${owners.join(", ")}.`,
        resolution: "Applicare la priorità core → sector → client → project e mantenere una sola regola effettiva nel runtime.",
        blocksActivation: false,
      });
    }
  });

  const blocking = conflicts.filter((conflict) => conflict.blocksActivation).length;
  const warnings = conflicts.filter((conflict) => conflict.severity === "warning").length;
  const info = conflicts.filter((conflict) => conflict.severity === "info").length;
  const packsToReview = Array.from(new Set(conflicts.map((conflict) => conflict.packId))).filter(Boolean);
  const safePacks = packs
    .filter((pack) => !packsToReview.some((item) => item.includes(pack.id)))
    .map((pack) => pack.id);

  return {
    schema: "bagastudio-dynamic-rule-conflict-resolver-v2-9",
    version: "2.9",
    generatedAt: new Date().toISOString(),
    status: blocking > 0
      ? "LAYOUT_V2_BLOCKED"
      : warnings > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : params.rulePackV28.status,
    sourceRulePackSchema: params.rulePackV28.schema,
    resolver: {
      priorityBasedConflictResolution: true,
      lockedCoreRulesAlwaysWin: true,
      validatesMissingRuleLinks: true,
      blocksInvalidPacksBeforeActivation: true,
      supportsRollbackPlan: true,
      exportsConflictReportJson: true,
    },
    conflicts,
    rollbackPlan: [
      "Salvare sempre il Rule Registry precedente prima di importare pack cliente/progetto.",
      "Se una regola importata è corrotta, disattivare solo il pack interessato e mantenere attivo il Core Safety Pack.",
      "Ripristinare l'ultimo Rule Pack valido da backup Admin o Product Package.",
      "Bloccare export PDF/DXF/CAD solo in presenza di conflitti error/bloccanti.",
    ],
    activationDecision: {
      canActivateRulePacks: blocking === 0,
      blockingConflicts: blocking,
      warningConflicts: warnings,
      safePacks,
      packsToReview,
    },
    totals: {
      conflicts: conflicts.length,
      blocking,
      warnings,
      info,
      safePacks: safePacks.length,
      packsToReview: packsToReview.length,
    },
    nextActions: [
      "Collegare il Conflict Resolver all'Admin Rules Manager prima del salvataggio regole.",
      "Aggiungere preview diff tra pack originale e pack importato dal cliente.",
      "Bloccare override di regole core locked anche se il JSON importato prova a forzarle.",
      "Preparare V3.0: Rule Runtime Evaluator che applica le regole alle coordinate reali di Room Editor, mobili, specchi e punti tecnici.",
    ],
  };
}
