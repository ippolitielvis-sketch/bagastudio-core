type CsvRegenerationV1ReportLike = {
  rows: Array<{
    name: string;
    [key: string]: any;
  }>;
};

type MeshConfigLike = {
  meshName?: string;
  displayName?: string;
  partId?: string;
  drillings?: unknown;
  drillingLinks?: unknown;
  [key: string]: any;
};

export type DrillingInspectorV1Item = {
  componentId: string;
  displayName: string;
  source: "csvRegeneration" | "meshList";
  drillings: number;
  diameters: string[];
  depths: string[];
  status: "present" | "missing";
};

export type DrillingInspectorV1Report = {
  schema: "bagastudio-drilling-inspector-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    componentsWithDrillings: number;
    componentsWithoutDrillings: number;
    drillings: number;
  };
  items: DrillingInspectorV1Item[];
  readiness: "DRILLING_DATA_READY" | "DRILLING_DATA_MISSING";
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
  if (mesh.partId?.trim()) return mesh.partId.trim();

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

function normalizeCollisionArrayV1(value: unknown): any[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return [value];
  return [];
}

function readCollisionNumberV1(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const normalized = value.replace(",", ".").replace(/[^0-9.+-]/g, "");
      if (!normalized) continue;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readDrillingNumberLabelV1(value: unknown): string | null {
  const parsed = readCollisionNumberV1(value);
  return parsed === null ? null : String(parsed);
}

export function buildDrillingInspectorV1Report(
  csvReport: CsvRegenerationV1ReportLike,
  meshes: MeshConfigLike[]
): DrillingInspectorV1Report {
  const meshRows: DrillingInspectorV1Item[] = meshes.map((mesh, index) => {
    const displayName = mesh.displayName || mesh.meshName || `Componente ${index + 1}`;
    const drillingItems = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
    );

    const diameters = Array.from(
      new Set(
        drillingItems
          .map((item) => readDrillingNumberLabelV1(item?.diameter ?? item?.diametro ?? item?.d))
          .filter((item): item is string => Boolean(item))
      )
    );

    const depths = Array.from(
      new Set(
        drillingItems
          .map((item) => readDrillingNumberLabelV1(item?.depth ?? item?.profondita ?? item?.z))
          .filter((item): item is string => Boolean(item))
      )
    );

    return {
      componentId: buildStablePartId(mesh, index),
      displayName,
      source: "meshList",
      drillings: drillingItems.length,
      diameters,
      depths,
      status: drillingItems.length > 0 ? "present" : "missing",
    };
  });

  const csvFallbackRows: DrillingInspectorV1Item[] = meshRows.length > 0
    ? []
    : csvReport.rows.map((row, index) => ({
        componentId: `csv-${index}-${row.name}`,
        displayName: row.name,
        source: "csvRegeneration",
        drillings: 0,
        diameters: [],
        depths: [],
        status: "missing",
      }));

  const items = meshRows.length > 0 ? meshRows : csvFallbackRows;
  const totalDrillings = items.reduce((sum, item) => sum + item.drillings, 0);

  return {
    schema: "bagastudio-drilling-inspector-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: items.length,
      componentsWithDrillings: items.filter((item) => item.drillings > 0).length,
      componentsWithoutDrillings: items.filter((item) => item.drillings <= 0).length,
      drillings: totalDrillings,
    },
    items,
    readiness: totalDrillings > 0 ? "DRILLING_DATA_READY" : "DRILLING_DATA_MISSING",
  };
}
