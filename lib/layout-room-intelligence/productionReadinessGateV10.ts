import type {
  HardwareCompatibilityMatrixV1Report,
  HardwareCompatibilityV1Item,
  HardwareCompatibilityV1Status,
  HardwareProductionGateV12,
} from "./hardwareCompatibilityMatrixV12";

export type ProductionReadinessGateV1Status = "pass" | "review" | "blocked";

export type ProductionReadinessGateV1Item = {
  componentId: string;
  displayName: string;
  status: ProductionReadinessGateV1Status;
  compatibilityGate: HardwareProductionGateV12 | null;
  compatibilityStatus: HardwareCompatibilityV1Status | null;
  constraintErrors: number;
  constraintWarnings: number;
  collisionCritical: number;
  collisionWarnings: number;
  reasons: string[];
};

export type ProductionReadinessGateV1Report = {
  schema: "bagastudio-production-readiness-gate-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    pass: number;
    review: number;
    blocked: number;
    compatibilityBlocked: number;
    constraintErrors: number;
    collisionCritical: number;
  };
  items: ProductionReadinessGateV1Item[];
};

type ConstraintEngineV1ItemLike = {
  componentId: string;
  status: "ok" | "warning" | "error" | string;
};

type ConstraintEngineV1ReportLike = {
  totals: {
    errors: number;
  };
  items: ConstraintEngineV1ItemLike[];
};

type CollisionEngineV1IssueLike = {
  componentId: string;
  severity: "critical" | "warning" | string;
};

type CollisionEngineV1ReportLike = {
  totals: {
    critical: number;
  };
  issues: CollisionEngineV1IssueLike[];
};

type MeshLike = {
  meshName?: string;
  displayName?: string;
};

type ResolveStablePartId = (mesh: any, index: number) => string;

function resolveProductionReadinessGateV1Status(
  compatibilityGate: HardwareProductionGateV12 | null,
  constraintErrors: number,
  constraintWarnings: number,
  collisionCritical: number,
  collisionWarnings: number
): ProductionReadinessGateV1Status {
  if (compatibilityGate === "blocked" || constraintErrors > 0 || collisionCritical > 0) return "blocked";
  if (compatibilityGate === "review" || constraintWarnings > 0 || collisionWarnings > 0) return "review";
  return "pass";
}

export function buildProductionReadinessGateV1Report(
  compatibilityReport: HardwareCompatibilityMatrixV1Report,
  constraintReport: ConstraintEngineV1ReportLike,
  collisionReport: CollisionEngineV1ReportLike,
  meshes: MeshLike[],
  resolveStablePartId: ResolveStablePartId
): ProductionReadinessGateV1Report {
  const compatibilityByComponent = new Map<string, HardwareCompatibilityV1Item[]>();
  compatibilityReport.items.forEach((item) => {
    const list = compatibilityByComponent.get(item.componentId) || [];
    list.push(item);
    compatibilityByComponent.set(item.componentId, list);
  });

  const constraintsByComponent = new Map<string, ConstraintEngineV1ItemLike[]>();
  constraintReport.items.forEach((item) => {
    const list = constraintsByComponent.get(item.componentId) || [];
    list.push(item);
    constraintsByComponent.set(item.componentId, list);
  });

  const collisionsByComponent = new Map<string, CollisionEngineV1IssueLike[]>();
  collisionReport.issues.forEach((issue) => {
    const list = collisionsByComponent.get(issue.componentId) || [];
    list.push(issue);
    collisionsByComponent.set(issue.componentId, list);
  });

  const items: ProductionReadinessGateV1Item[] = meshes.map((mesh, index) => {
    const componentId = resolveStablePartId(mesh, index);
    const displayName = mesh.displayName || mesh.meshName || componentId;
    const compatibilityItems = compatibilityByComponent.get(componentId) || [];
    const constraintItems = constraintsByComponent.get(componentId) || [];
    const collisionItems = collisionsByComponent.get(componentId) || [];

    const compatibilityGate: HardwareProductionGateV12 | null = compatibilityItems.some((item) => item.productionGate === "blocked")
      ? "blocked"
      : compatibilityItems.some((item) => item.productionGate === "review")
        ? "review"
        : compatibilityItems.some((item) => item.productionGate === "pass")
          ? "pass"
          : null;

    const compatibilityStatus: HardwareCompatibilityV1Status | null = compatibilityItems.some((item) => item.status === "incompatible")
      ? "incompatible"
      : compatibilityItems.some((item) => item.status === "warning")
        ? "warning"
        : compatibilityItems.some((item) => item.status === "unknown")
          ? "unknown"
          : compatibilityItems.some((item) => item.status === "compatible")
            ? "compatible"
            : null;

    const constraintErrors = constraintItems.filter((item) => item.status === "error").length;
    const constraintWarnings = constraintItems.filter((item) => item.status === "warning").length;
    const collisionCritical = collisionItems.filter((item) => item.severity === "critical").length;
    const collisionWarnings = collisionItems.filter((item) => item.severity === "warning").length;
    const status = resolveProductionReadinessGateV1Status(
      compatibilityGate,
      constraintErrors,
      constraintWarnings,
      collisionCritical,
      collisionWarnings
    );

    const reasons: string[] = [];
    if (compatibilityGate === "blocked") reasons.push("Compatibility Matrix V1.2: profilo o spessore bloccante.");
    if (compatibilityGate === "review") reasons.push("Compatibility Matrix V1.2: richiesta revisione manuale.");
    if (constraintErrors > 0) reasons.push(`Constraint Engine V1: ${constraintErrors} errore/i non producibili.`);
    if (constraintWarnings > 0) reasons.push(`Constraint Engine V1: ${constraintWarnings} warning da verificare.`);
    if (collisionCritical > 0) reasons.push(`Collision Engine V1.5: ${collisionCritical} criticità.`);
    if (collisionWarnings > 0) reasons.push(`Collision Engine V1.5: ${collisionWarnings} warning.`);
    if (reasons.length === 0) reasons.push("Componente senza blocchi rilevati dal Production Readiness Gate V1.");

    return {
      componentId,
      displayName,
      status,
      compatibilityGate,
      compatibilityStatus,
      constraintErrors,
      constraintWarnings,
      collisionCritical,
      collisionWarnings,
      reasons,
    };
  });

  return {
    schema: "bagastudio-production-readiness-gate-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: items.length,
      pass: items.filter((item) => item.status === "pass").length,
      review: items.filter((item) => item.status === "review").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      compatibilityBlocked: items.filter((item) => item.compatibilityGate === "blocked").length,
      constraintErrors: constraintReport.totals.errors,
      collisionCritical: collisionReport.totals.critical,
    },
    items,
  };
}
