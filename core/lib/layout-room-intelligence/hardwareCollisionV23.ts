type MeshConfigLike = {
  meshName?: string;
  displayName?: string;
  partId?: string;
  drillingLinks?: unknown;
  drillings?: unknown;
  [key: string]: any;
};

export type HardwareCollisionV23Issue = {
  componentId: string;
  displayName: string;
  firstIndex: number;
  secondIndex: number;
  status: "warning" | "error";
  code: string;
  message: string;
  distance: number;
  safeDistance: number;
};

export type HardwareCollisionV23Report = {
  schema: "bagastudio-hardware-analyzer-v2-3-collision-check";
  version: 23;
  generatedAt: string;
  collisionStatus: "COLLISION_READY" | "COLLISION_WARNING" | "COLLISION_BLOCKED";
  totals: {
    components: number;
    drillings: number;
    checkedPairs: number;
    warnings: number;
    errors: number;
  };
  issues: HardwareCollisionV23Issue[];
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
    const parsed = parseBagaStudioJsonField<unknown[] | null>(value, null);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    const csvValues = parseBagaStudioCsvField(value);
    return csvValues.map((item) => ({ label: item, name: item }));
  }

  if (value && typeof value === "object") return [value];

  return [];
}

export function buildHardwareCollisionV23Report(meshes: MeshConfigLike[]): HardwareCollisionV23Report {
  const issues: HardwareCollisionV23Issue[] = [];
  let drillings = 0;
  let checkedPairs = 0;

  meshes.forEach((mesh, meshIndex) => {
    const componentId = buildStablePartId(mesh, meshIndex);
    const displayName = mesh.displayName || mesh.meshName || `Componente ${meshIndex + 1}`;
    const drillingItems = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
    ).map((item, drillingIndex) => ({
      drillingIndex,
      x: readCollisionNumberV1(item?.x, item?.X),
      y: readCollisionNumberV1(item?.y, item?.Y),
      diameter: readCollisionNumberV1(item?.diameter, item?.dia, item?.DIA),
    })).filter((item) => item.x !== null && item.y !== null);

    drillings += drillingItems.length;

    for (let firstIndex = 0; firstIndex < drillingItems.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < drillingItems.length; secondIndex += 1) {
        const first = drillingItems[firstIndex];
        const second = drillingItems[secondIndex];
        const dx = Number(first.x) - Number(second.x);
        const dy = Number(first.y) - Number(second.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const firstRadius = (first.diameter || 0) / 2;
        const secondRadius = (second.diameter || 0) / 2;
        const collisionDistance = firstRadius + secondRadius;
        const warningDistance = Math.max(collisionDistance + 3, Math.max(first.diameter || 0, second.diameter || 0));

        checkedPairs += 1;

        if (distance <= 0.01) {
          issues.push({
            componentId,
            displayName,
            firstIndex: first.drillingIndex,
            secondIndex: second.drillingIndex,
            status: "error",
            code: "DUPLICATE_DRILLING",
            message: "Fori duplicati o sovrapposti sulle stesse coordinate.",
            distance: Number(distance.toFixed(3)),
            safeDistance: Number(collisionDistance.toFixed(3)),
          });
          continue;
        }

        if (distance < collisionDistance) {
          issues.push({
            componentId,
            displayName,
            firstIndex: first.drillingIndex,
            secondIndex: second.drillingIndex,
            status: "error",
            code: "DRILLING_COLLISION",
            message: "Collisione geometrica tra due forature.",
            distance: Number(distance.toFixed(3)),
            safeDistance: Number(collisionDistance.toFixed(3)),
          });
          continue;
        }

        if (distance < warningDistance) {
          issues.push({
            componentId,
            displayName,
            firstIndex: first.drillingIndex,
            secondIndex: second.drillingIndex,
            status: "warning",
            code: "DRILLING_DISTANCE_WARNING",
            message: "Distanza ridotta tra due forature: controllare compatibilità ferramenta.",
            distance: Number(distance.toFixed(3)),
            safeDistance: Number(warningDistance.toFixed(3)),
          });
        }
      }
    }
  });

  const errors = issues.filter((issue) => issue.status === "error").length;
  const warnings = issues.filter((issue) => issue.status === "warning").length;
  const collisionStatus =
    errors > 0 ? "COLLISION_BLOCKED" : warnings > 0 ? "COLLISION_WARNING" : "COLLISION_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-3-collision-check",
    version: 23,
    generatedAt: new Date().toISOString(),
    collisionStatus,
    totals: {
      components: meshes.length,
      drillings,
      checkedPairs,
      warnings,
      errors,
    },
    issues,
  };
}
