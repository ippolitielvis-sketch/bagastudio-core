import type {
  ProductionReadinessGateV1Item,
  ProductionReadinessGateV1Report,
  ProductionReadinessGateV1Status,
} from "./productionReadinessGateV10";

type MeshLike = {
  meshName?: string;
  displayName?: string;
  panelThickness?: number | string | null;
  [key: string]: any;
};

type CsvRegenerationV1ReportLike = {
  rows: Array<{
    name: string;
    originalWidth?: number | string | null;
    originalThickness?: number | string | null;
    regeneratedThickness?: number | string | null;
    status: "updated" | "unchanged" | "skipped";
    [key: string]: any;
  }>;
};

type ResolveStablePartId = (mesh: any, index: number) => string;

function parseBagaStudioJsonField<T>(value: string | undefined, fallback: T): T {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return fallback;

  try {
    return JSON.parse(cleanValue) as T;
  } catch {
    return fallback;
  }
}

function readCollisionNumberV1(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const cleaned = value.replace(",", ".").replace(/[^\d.-]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeCsvRegenerationKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type ParametricEditV1Status = "ready" | "review" | "blocked" | "skipped";

export type ParametricEditV1Item = {
  componentId: string;
  displayName: string;
  status: ParametricEditV1Status;
  productionGate: ProductionReadinessGateV1Status | null;
  csvStatus: "updated" | "unchanged" | "skipped" | null;
  originalThickness: number | null;
  targetThickness: number | null;
  externalDimensionsLocked: boolean;
  needsInternalRecalculation: boolean;
  note: string;
};

export type ParametricEditV1Report = {
  schema: "bagastudio-parametric-edit-v1";
  version: 1;
  generatedAt: string;
  targetThickness: number | null;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    externalDimensionsLocked: number;
    internalRecalculationRequired: number;
  };
  items: ParametricEditV1Item[];
};

export function buildParametricEditV1Report(
  productionGateReport: ProductionReadinessGateV1Report,
  csvReport: CsvRegenerationV1ReportLike,
  meshes: MeshLike[],
  targetThicknessValue: string,
  resolveStablePartId: ResolveStablePartId
): ParametricEditV1Report {
  const productionByComponent = new Map<string, ProductionReadinessGateV1Item>();
  productionGateReport.items.forEach((item) => productionByComponent.set(item.componentId, item));

  const csvByName = new Map<string, CsvRegenerationV1Report["rows"][number]>();
  csvReport.rows.forEach((row) => csvByName.set(normalizeCsvRegenerationKey(row.name), row));

  const targetThickness = readCollisionNumberV1(targetThicknessValue);

  const items: ParametricEditV1Item[] = meshes.map((mesh, index) => {
    const componentId = buildStablePartId(mesh, index);
    const displayName = mesh.displayName || mesh.meshName || componentId;
    const production = productionByComponent.get(componentId) || null;
    const meshAny = mesh as any;
    const csvRow = csvByName.get(normalizeCsvRegenerationKey(meshAny.csvSource || displayName || mesh.meshName)) || null;
    const parametricData = parseBagaStudioJsonField(meshAny.parametricData, {}) as Record<string, unknown>;
    const manufacturingOverrideData = parseBagaStudioJsonField(meshAny.manufacturingOverrideData, {}) as Record<string, unknown>;

    const originalThickness = readCollisionNumberV1(parametricData.originalThickness, csvRow?.originalThickness, mesh.panelThickness);
    const effectiveTargetThickness = readCollisionNumberV1(
      parametricData.currentThickness,
      manufacturingOverrideData.targetThickness,
      csvRow?.regeneratedThickness,
      targetThickness
    );

    const externalDimensionsLocked = Boolean(
      parametricData.externalDimensionsLocked ||
      manufacturingOverrideData.externalDimensionsLocked ||
      readCollisionNumberV1(parametricData.originalWidth, csvRow?.originalWidth) !== null
    );

    const changedThickness = Boolean(
      originalThickness !== null &&
      effectiveTargetThickness !== null &&
      Math.abs(originalThickness - effectiveTargetThickness) > 0.001
    );

    const needsInternalRecalculation = changedThickness && externalDimensionsLocked;

    let status: ParametricEditV1Status = "ready";
    let note = "Componente pronto per Parametric Edit V1 con ingombro esterno bloccato.";

    if (production?.status === "blocked") {
      status = "blocked";
      note = "Bloccato dal Production Readiness Gate V1: correggere errori prima dell'edit parametrico.";
    } else if (production?.status === "review") {
      status = "review";
      note = "Richiede review dal Production Readiness Gate V1 prima dell'edit parametrico.";
    } else if (!externalDimensionsLocked) {
      status = "review";
      note = "Ingombro esterno non ancora bloccato: controllare dimensioni prima del ricalcolo interno.";
    } else if (csvRow?.status === "skipped") {
      status = "skipped";
      note = "Riga CSV esclusa o non modificabile dalle regole produttive attuali.";
    } else if (needsInternalRecalculation) {
      status = "ready";
      note = "Pronto: cambio spessore rilevato, ingombro esterno bloccato e ricalcolo interno richiesto.";
    }

    return {
      componentId,
      displayName,
      status,
      productionGate: production?.status || null,
      csvStatus: csvRow?.status || null,
      originalThickness,
      targetThickness: effectiveTargetThickness,
      externalDimensionsLocked,
      needsInternalRecalculation,
      note,
    };
  });

  return {
    schema: "bagastudio-parametric-edit-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    targetThickness,
    totals: {
      components: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review: items.filter((item) => item.status === "review").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      skipped: items.filter((item) => item.status === "skipped").length,
      externalDimensionsLocked: items.filter((item) => item.externalDimensionsLocked).length,
      internalRecalculationRequired: items.filter((item) => item.needsInternalRecalculation).length,
    },
    items,
  };
}
