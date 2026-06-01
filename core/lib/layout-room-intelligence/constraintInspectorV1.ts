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
  constraintRole?: string;
  category?: string;
  [key: string]: any;
};

export type ConstraintInspectorV1Item = {
  componentId: string;
  displayName: string;
  role: string | null;
  source: "csvRegeneration" | "meshList" | "unknown";
  status: "present" | "missing";
};

export type ConstraintInspectorV1Report = {
  schema: "bagastudio-constraint-inspector-v1";
  version: 1;
  generatedAt: string;
  totals: {
    analyzed: number;
    withRole: number;
    withoutRole: number;
  };
  roles: Record<string, number>;
  items: ConstraintInspectorV1Item[];
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

export function inferConstraintRoleV1(name: unknown): string | null {
  const value = String(name || "").toLowerCase();

  if (value.includes("schiena") || value.includes("back")) return "backPanel";
  if (value.includes("fianco") || value.includes("side")) return "externalPanel";
  if (value.includes("ripiano") || value.includes("shelf")) return "shelf";
  if (value.includes("anta") || value.includes("door")) return "door";
  if (value.includes("cielo") || value.includes("top")) return "topPanel";
  if (value.includes("fondo") || value.includes("bottom")) return "bottomPanel";
  if (value.includes("zoccolo") || value.includes("plinth")) return "plinth";

  return null;
}

export function buildConstraintInspectorV1Report(
  csvReport: CsvRegenerationV1ReportLike,
  meshes: MeshConfigLike[]
): ConstraintInspectorV1Report {
  const roles: Record<string, number> = {};

  const csvItems: ConstraintInspectorV1Item[] = csvReport.rows.map((row, index) => {
    const inferredRole = inferConstraintRoleV1(row.name);

    if (inferredRole) {
      roles[inferredRole] = (roles[inferredRole] || 0) + 1;
    }

    return {
      componentId: `csv-${index}-${row.name}`,
      displayName: row.name,
      role: inferredRole,
      source: "csvRegeneration",
      status: inferredRole ? "present" : "missing",
    };
  });

  const meshItems: ConstraintInspectorV1Item[] = csvItems.length > 0
    ? []
    : meshes.map((mesh, index) => {
        const displayName = mesh.displayName || mesh.meshName || `Componente ${index + 1}`;
        const explicitRole = String(mesh.constraintRole || "").trim();
        const inferredRole = explicitRole || inferConstraintRoleV1(displayName);

        if (inferredRole) {
          roles[inferredRole] = (roles[inferredRole] || 0) + 1;
        }

        return {
          componentId: buildStablePartId(mesh, index),
          displayName,
          role: inferredRole || null,
          source: "meshList",
          status: inferredRole ? "present" : "missing",
        };
      });

  const items = csvItems.length > 0 ? csvItems : meshItems;

  return {
    schema: "bagastudio-constraint-inspector-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      analyzed: items.length,
      withRole: items.filter((item) => item.status === "present").length,
      withoutRole: items.filter((item) => item.status === "missing").length,
    },
    roles,
    items,
  };
}
