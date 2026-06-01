// @ts-nocheck
import { type HardwareLinksEngineV1Report } from "@/lib/layout-room-intelligence/hardwareLinksEngineV1";

export type ConstraintEngineV1Status = "ok" | "warning" | "error";

export type ConstraintEngineV1Item = {
  componentId: string;
  displayName: string;
  hardwareLabel: string;
  drillingIndex: number;
  status: ConstraintEngineV1Status;
  rule: "blind_depth_margin" | "through_depth_max" | "missing_data";
  thickness: number | null;
  depth: number | null;
  requiredThickness: number | null;
  maxThroughDepth: number | null;
  message: string;
};

export type ConstraintEngineV1Report = {
  schema: "bagastudio-constraint-engine-v1";
  version: 1;
  generatedAt: string;
  safetyMarginMm: number;
  throughToleranceMm: number;
  totals: {
    links: number;
    drillingsChecked: number;
    ok: number;
    warnings: number;
    errors: number;
    missingData: number;
  };
  items: ConstraintEngineV1Item[];
};

type MeshConfigLike = {
  meshName?: string;
  displayName?: string;
  partId?: string;
  dimensions?: unknown;
  manufacturingData?: unknown;
  panelThickness?: unknown;
  drillingLinks?: unknown;
  drillings?: unknown;
  [key: string]: any;
};

type CsvRegenerationV1ReportLike = {
  rows?: Array<{
    name?: string;
    regeneratedThickness?: number | string | null;
    originalThickness?: number | string | null;
    [key: string]: any;
  }>;
};

const CONSTRAINT_ENGINE_V1_SAFETY_MARGIN_MM = 2;
const CONSTRAINT_ENGINE_V1_THROUGH_TOLERANCE_MM = 0.1;

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

function normalizeCsvRegenerationKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function readThicknessFromCsvRegenerationBridgeV1(
  displayName: string,
  csvReport?: CsvRegenerationV1ReportLike
): number | null {
  if (!csvReport?.rows?.length) return null;

  const targetKey = normalizeCsvRegenerationKey(displayName);
  const exactRow = csvReport.rows.find((row) => normalizeCsvRegenerationKey(row.name) === targetKey);
  const looseRow = exactRow || csvReport.rows.find((row) => {
    const rowKey = normalizeCsvRegenerationKey(row.name);
    return Boolean(rowKey && targetKey && (rowKey.includes(targetKey) || targetKey.includes(rowKey)));
  });

  return readCollisionNumberV1(
    looseRow?.regeneratedThickness,
    looseRow?.originalThickness
  );
}

function readConstraintEngineV1DrillingItems(mesh: MeshConfigLike) {
  return normalizeCollisionArrayV1(
    parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
  ).map((item, drillingIndex) => ({
    drillingIndex,
    depth: readCollisionNumberV1(item?.depth, item?.dp, item?.DP, item?.drillingDepth),
    type: String(item?.type || item?.drillingType || item?.operation || "").toLowerCase(),
    isThrough: Boolean(item?.through || item?.passante || item?.isThrough) ||
      String(item?.type || item?.drillingType || item?.operation || "").toLowerCase().includes("through") ||
      String(item?.type || item?.drillingType || item?.operation || "").toLowerCase().includes("pass"),
  }));
}

export function buildConstraintEngineV1Report(
  linksReport: HardwareLinksEngineV1Report,
  meshes: MeshConfigLike[],
  csvReport?: CsvRegenerationV1ReportLike
): ConstraintEngineV1Report {
  const meshByComponentId = new Map<string, MeshConfigLike>();
  meshes.forEach((mesh, index) => {
    meshByComponentId.set(buildStablePartId(mesh, index), mesh);
  });

  const items: ConstraintEngineV1Item[] = [];

  linksReport.items
    .filter((link) => link.status === "linked")
    .forEach((link) => {
      const mesh = meshByComponentId.get(link.componentId);
      const meshThickness = mesh ? readCollisionDimensionsV1(mesh).panelThickness : null;
      const csvBridgeThickness = readThicknessFromCsvRegenerationBridgeV1(link.displayName, csvReport);
      const thickness = meshThickness !== null ? meshThickness : csvBridgeThickness;
      const drillings = mesh ? readConstraintEngineV1DrillingItems(mesh) : [];

      link.drillingIndexes.forEach((drillingIndex) => {
        const drilling = drillings.find((item) => item.drillingIndex === drillingIndex);
        const depth = drilling?.depth ?? null;

        if (thickness === null || depth === null) {
          items.push({
            componentId: link.componentId,
            displayName: link.displayName,
            hardwareLabel: link.hardwareLabel,
            drillingIndex,
            status: "warning",
            rule: "missing_data",
            thickness,
            depth,
            requiredThickness: null,
            maxThroughDepth: null,
            message: "Dati insufficienti: spessore o profondità foro mancanti.",
          });
          return;
        }

        const maxThroughDepth = Number((thickness + CONSTRAINT_ENGINE_V1_THROUGH_TOLERANCE_MM).toFixed(3));
        if (drilling?.isThrough) {
          const isOk = depth <= maxThroughDepth;
          items.push({
            componentId: link.componentId,
            displayName: link.displayName,
            hardwareLabel: link.hardwareLabel,
            drillingIndex,
            status: isOk ? "ok" : "error",
            rule: "through_depth_max",
            thickness,
            depth,
            requiredThickness: null,
            maxThroughDepth,
            message: isOk
              ? `Lavorazione passante OK: ${depth} mm <= ${maxThroughDepth} mm.`
              : `ERRORE: lavorazione passante ${depth} mm oltre massimo ${maxThroughDepth} mm.`,
          });
          return;
        }

        const requiredThickness = Number((depth + CONSTRAINT_ENGINE_V1_SAFETY_MARGIN_MM).toFixed(3));
        const isOk = requiredThickness <= thickness;
        const isNear = !isOk && requiredThickness <= thickness + 0.5;

        items.push({
          componentId: link.componentId,
          displayName: link.displayName,
          hardwareLabel: link.hardwareLabel,
          drillingIndex,
          status: isOk ? "ok" : isNear ? "warning" : "error",
          rule: "blind_depth_margin",
          thickness,
          depth,
          requiredThickness,
          maxThroughDepth,
          message: isOk
            ? `Foro cieco OK: profondità ${depth} mm + margine 2 mm = ${requiredThickness} mm <= pannello ${thickness} mm.`
            : isNear
              ? `WARNING: foro quasi al limite. Richiesti ${requiredThickness} mm, pannello ${thickness} mm.`
              : `ERRORE: foro non producibile. Richiesti ${requiredThickness} mm, pannello ${thickness} mm.`,
        });
      });
    });

  return {
    schema: "bagastudio-constraint-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    safetyMarginMm: CONSTRAINT_ENGINE_V1_SAFETY_MARGIN_MM,
    throughToleranceMm: CONSTRAINT_ENGINE_V1_THROUGH_TOLERANCE_MM,
    totals: {
      links: linksReport.totals.links,
      drillingsChecked: items.length,
      ok: items.filter((item) => item.status === "ok").length,
      warnings: items.filter((item) => item.status === "warning").length,
      errors: items.filter((item) => item.status === "error").length,
      missingData: items.filter((item) => item.rule === "missing_data").length,
    },
    items,
  };
}
