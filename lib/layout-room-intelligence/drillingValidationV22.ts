type MeshConfigLike = {
  meshName?: string;
  displayName?: string;
  partId?: string;
  dimensions?: unknown;
  manufacturingData?: unknown;
  panelThickness?: unknown;
  drillings?: unknown;
  drillingLinks?: unknown;
  [key: string]: any;
};

function slugifyBagaStudioId(value: unknown, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  return slug || fallback;
}

function buildStablePartId(mesh: Partial<MeshConfigLike>, index: number) {
  if (typeof mesh.partId === "string" && mesh.partId.trim()) return mesh.partId.trim();

  const base = slugifyBagaStudioId(
    mesh.displayName || mesh.meshName || `component_${index + 1}`,
    `component_${index + 1}`
  );

  return `part_${String(index + 1).padStart(3, "0")}_${base}`;
}

function parseBagaStudioJsonField<T = any>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseBagaStudioCsvField(value?: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function normalizeCollisionArrayV1(value: unknown): any[] {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const parsed = parseBagaStudioJsonField(value, null);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    const csvValues = parseBagaStudioCsvField(value);
    return csvValues.map((item) => ({ label: item, name: item }));
  }

  if (value && typeof value === "object") return [value];

  return [];
}

function readCollisionDimensionsV1(mesh: MeshConfigLike) {
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

export type DrillingValidationV22Status = "valid" | "warning" | "error";

export type DrillingValidationV22Issue = {
  componentId: string;
  displayName: string;
  drillingIndex: number;
  status: DrillingValidationV22Status;
  code: string;
  message: string;
  x: number | null;
  y: number | null;
  z: number | null;
  diameter: number | null;
  depth: number | null;
};

export type DrillingValidationV22Report = {
  schema: "bagastudio-hardware-analyzer-v2-2-drilling-validation";
  version: 22;
  generatedAt: string;
  validationStatus: "DRILLING_READY" | "DRILLING_WARNING" | "DRILLING_BLOCKED";
  totals: {
    components: number;
    drillings: number;
    valid: number;
    warnings: number;
    errors: number;
  };
  allowedDiameters: number[];
  issues: DrillingValidationV22Issue[];
};

const ALLOWED_DRILLING_DIAMETERS_V22 = [3, 5, 8, 10, 15, 20, 25, 35];

export function buildDrillingValidationV22Report(meshes: MeshConfigLike[]): DrillingValidationV22Report {
  const issues: DrillingValidationV22Issue[] = [];
  let drillings = 0;
  let valid = 0;
  let warnings = 0;
  let errors = 0;

  meshes.forEach((mesh, meshIndex) => {
    const componentId = buildStablePartId(mesh, meshIndex);
    const displayName = mesh.displayName || mesh.meshName || `Componente ${meshIndex + 1}`;
    const dimensions = readCollisionDimensionsV1(mesh);
    const drillingItems = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
    );

    drillingItems.forEach((item, drillingIndex) => {
      drillings += 1;

      const x = readCollisionNumberV1(item?.x, item?.X);
      const y = readCollisionNumberV1(item?.y, item?.Y);
      const z = readCollisionNumberV1(item?.z, item?.Z);
      const diameter = readCollisionNumberV1(item?.diameter, item?.dia, item?.DIA);
      const depth = readCollisionNumberV1(item?.depth, item?.dp, item?.DP, item?.drillingDepth);
      const issueBase = { componentId, displayName, drillingIndex, x, y, z, diameter, depth };

      let hasIssue = false;

      if (x === null || y === null || diameter === null) {
        warnings += 1;
        hasIssue = true;
        issues.push({
          ...issueBase,
          status: "warning",
          code: "DRILLING_DATA_INCOMPLETE",
          message: "Foratura con coordinate o diametro incompleti.",
        });
      }

      if (diameter !== null && !ALLOWED_DRILLING_DIAMETERS_V22.includes(Number(diameter))) {
        warnings += 1;
        hasIssue = true;
        issues.push({
          ...issueBase,
          status: "warning",
          code: "DRILLING_DIAMETER_NOT_STANDARD",
          message: `Diametro non nella whitelist base: ${diameter} mm.`,
        });
      }

      if (dimensions.width !== null && x !== null && (x < 0 || x > dimensions.width)) {
        errors += 1;
        hasIssue = true;
        issues.push({
          ...issueBase,
          status: "error",
          code: "DRILLING_X_OUTSIDE_PANEL",
          message: `Quota X fuori pannello: ${x} mm su larghezza ${dimensions.width} mm.`,
        });
      }

      if (dimensions.height !== null && y !== null && (y < 0 || y > dimensions.height)) {
        errors += 1;
        hasIssue = true;
        issues.push({
          ...issueBase,
          status: "error",
          code: "DRILLING_Y_OUTSIDE_PANEL",
          message: `Quota Y fuori pannello: ${y} mm su altezza ${dimensions.height} mm.`,
        });
      }

      if (dimensions.panelThickness !== null && depth !== null && depth > dimensions.panelThickness) {
        warnings += 1;
        hasIssue = true;
        issues.push({
          ...issueBase,
          status: "warning",
          code: "DRILLING_DEPTH_OVER_THICKNESS",
          message: `Profondità foro ${depth} mm superiore allo spessore pannello ${dimensions.panelThickness} mm.`,
        });
      }

      const edgeLimit = diameter !== null ? Math.max(3, diameter / 2) : 3;

      if (dimensions.width !== null && x !== null && x >= 0 && x <= dimensions.width) {
        const edgeDistanceX = Math.min(x, dimensions.width - x);
        if (edgeDistanceX < edgeLimit) {
          warnings += 1;
          hasIssue = true;
          issues.push({
            ...issueBase,
            status: "warning",
            code: "DRILLING_EDGE_DISTANCE_X_WARNING",
            message: `Distanza dal bordo X ridotta: ${Number(edgeDistanceX.toFixed(2))} mm.`,
          });
        }
      }

      if (dimensions.height !== null && y !== null && y >= 0 && y <= dimensions.height) {
        const edgeDistanceY = Math.min(y, dimensions.height - y);
        if (edgeDistanceY < edgeLimit) {
          warnings += 1;
          hasIssue = true;
          issues.push({
            ...issueBase,
            status: "warning",
            code: "DRILLING_EDGE_DISTANCE_Y_WARNING",
            message: `Distanza dal bordo Y ridotta: ${Number(edgeDistanceY.toFixed(2))} mm.`,
          });
        }
      }

      if (!hasIssue) valid += 1;
    });
  });

  const validationStatus =
    errors > 0 ? "DRILLING_BLOCKED" : warnings > 0 ? "DRILLING_WARNING" : "DRILLING_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-2-drilling-validation",
    version: 22,
    generatedAt: new Date().toISOString(),
    validationStatus,
    totals: { components: meshes.length, drillings, valid, warnings, errors },
    allowedDiameters: ALLOWED_DRILLING_DIAMETERS_V22,
    issues,
  };
}

