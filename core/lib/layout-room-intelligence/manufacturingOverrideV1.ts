type MeshConfig = Record<string, any>;

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

function readCollisionDimensionsV1(mesh: MeshConfig) {
  const dimensions = parseBagaStudioJsonField(mesh.dimensions, {}) as Record<string, unknown>;
  const manufacturingData = parseBagaStudioJsonField(mesh.manufacturingData, {}) as Record<string, unknown>;

  const width = readCollisionNumberV1(
    dimensions.width,
    dimensions.w,
    dimensions.x,
    dimensions.length,
    manufacturingData.width,
    manufacturingData.length
  );

  const height = readCollisionNumberV1(
    dimensions.height,
    dimensions.h,
    dimensions.y,
    manufacturingData.height
  );

  const depth = readCollisionNumberV1(
    dimensions.depth,
    dimensions.d,
    dimensions.z,
    manufacturingData.depth
  );

  const panelThickness = readCollisionNumberV1(
    mesh.panelThickness,
    dimensions.panelThickness,
    dimensions.thickness,
    dimensions.t,
    manufacturingData.panelThickness,
    manufacturingData.thickness
  );

  return { width, height, depth, panelThickness };
}

function slugifyBagaStudioId(value: string, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  return slug || fallback;
}

function buildStablePartId(mesh: Partial<MeshConfig>, index: number) {
  if (typeof mesh.partId === "string" && mesh.partId.trim()) return mesh.partId.trim();

  const base = slugifyBagaStudioId(
    String(mesh.displayName || mesh.meshName || `component_${index + 1}`),
    `component_${index + 1}`
  );

  return `part_${String(index + 1).padStart(3, "0")}_${base}`;
}

export type ManufacturingOverrideV1Report = {
  schema: "bagastudio-manufacturing-override-v1";
  version: 1;
  generatedAt: string;
  targetThickness: number | null;
  totals: {
    components: number;
    editableComponents: number;
    changedComponents: number;
    lockedExternalDimensions: number;
    skippedComponents: number;
  };
  items: Array<{
    componentId: string;
    meshName: string;
    displayName: string;
    originalThickness: number | null;
    targetThickness: number | null;
    deltaThickness: number | null;
    lockExternalDimensions: boolean;
    status: "ready" | "changed" | "skipped";
    note: string;
  }>;
};

export function buildManufacturingOverrideV1Report(meshes: MeshConfig[], targetThicknessValue: string): ManufacturingOverrideV1Report {
  const targetThickness = readCollisionNumberV1(targetThicknessValue);
  const items = meshes.map((mesh, index) => {
    const dimensions = readCollisionDimensionsV1(mesh);
    const originalThickness = dimensions.panelThickness;
    const isEditable = originalThickness !== null && targetThickness !== null;
    const deltaThickness = isEditable ? Number((targetThickness - originalThickness).toFixed(3)) : null;
    const changed = Boolean(isEditable && Math.abs(deltaThickness || 0) > 0.001);

    return {
      componentId: buildStablePartId(mesh, index),
      meshName: mesh.meshName,
      displayName: mesh.displayName || mesh.meshName || `Componente ${index + 1}`,
      originalThickness,
      targetThickness,
      deltaThickness,
      lockExternalDimensions: true,
      status: !isEditable ? "skipped" as const : changed ? "changed" as const : "ready" as const,
      note: !isEditable
        ? "Spessore non disponibile: componente saltato."
        : changed
          ? "Override pronto: ingombro esterno bloccato, quote interne da ricalcolare negli step successivi."
          : "Spessore già allineato al valore richiesto.",
    };
  });

  return {
    schema: "bagastudio-manufacturing-override-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    targetThickness,
    totals: {
      components: meshes.length,
      editableComponents: items.filter((item) => item.status !== "skipped").length,
      changedComponents: items.filter((item) => item.status === "changed").length,
      lockedExternalDimensions: items.filter((item) => item.lockExternalDimensions).length,
      skippedComponents: items.filter((item) => item.status === "skipped").length,
    },
    items,
  };
}

export function applyManufacturingOverrideV1(meshes: MeshConfig[], targetThicknessValue: string): MeshConfig[] {
  const targetThickness = readCollisionNumberV1(targetThicknessValue);
  if (targetThickness === null) return meshes;

  return meshes.map((mesh, index) => {
    const dimensions = readCollisionDimensionsV1(mesh);
    const originalThickness = dimensions.panelThickness;
    if (originalThickness === null) return mesh;

    const existingManufacturingData = parseBagaStudioJsonField(mesh.manufacturingData, {}) as Record<string, unknown>;
    const existingParametricData = parseBagaStudioJsonField(mesh.parametricData, {}) as Record<string, unknown>;

    const parametricData = {
      ...existingParametricData,
      originalWidth: readCollisionNumberV1(existingParametricData.originalWidth, dimensions.width),
      originalHeight: readCollisionNumberV1(existingParametricData.originalHeight, dimensions.height),
      originalDepth: readCollisionNumberV1(existingParametricData.originalDepth, dimensions.depth),
      originalThickness: readCollisionNumberV1(existingParametricData.originalThickness, originalThickness),
      currentWidth: readCollisionNumberV1(existingParametricData.currentWidth, dimensions.width),
      currentHeight: readCollisionNumberV1(existingParametricData.currentHeight, dimensions.height),
      currentDepth: readCollisionNumberV1(existingParametricData.currentDepth, dimensions.depth),
      currentThickness: targetThickness,
      lockExternalDimensions: true,
      parametricVersion: 1,
      lastOverrideAt: new Date().toISOString(),
    };

    const manufacturingOverrideData = {
      schema: "bagastudio-manufacturing-override-v1",
      version: 1,
      appliedAt: new Date().toISOString(),
      componentId: buildStablePartId(mesh, index),
      originalThickness,
      targetThickness,
      deltaThickness: Number((targetThickness - originalThickness).toFixed(3)),
      lockExternalDimensions: true,
      externalDimensionsLocked: {
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
      },
      nextSteps: [
        "recalculate-internal-quotes",
        "recalculate-drillings",
        "validate-collision-engine-v1-5",
        "prepare-csv-regeneration",
      ],
    };

    return {
      ...mesh,
      panelThickness: String(targetThickness),
      manufacturingData: JSON.stringify({
        ...existingManufacturingData,
        panelThickness: targetThickness,
        thickness: targetThickness,
        manufacturingOverrideV1Ready: true,
        externalDimensionsLocked: true,
      }),
      parametricData: JSON.stringify(parametricData),
      manufacturingOverrideData: JSON.stringify(manufacturingOverrideData),
    };
  });
}
