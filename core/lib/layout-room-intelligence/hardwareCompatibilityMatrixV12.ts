// @ts-nocheck
import {
  EXCLUDED_HARDWARE_PROFILES_V12,
  HARDWARE_KNOWLEDGE_BASE_V11,
  TRUSTED_HARDWARE_PROFILES_V1,
  chooseTrustedHardwareProfileV1,
  getHardwareKnowledgeProfileV11,
  isThicknessSupportedByKnowledgeProfileV11,
  resolveHardwareProductionGateV12,
  type HardwareKnowledgeProfileV11,
} from "@/lib/layout-room-intelligence/hardwareKnowledgeBaseV11";

export type HardwareCompatibilityV1Status = "compatible" | "warning" | "incompatible" | "unknown";
export type HardwareProductionGateV12 = "pass" | "review" | "blocked";

export type HardwareCompatibilityV1Item = {
  componentId: string;
  displayName: string;
  hardwareLabel: string;
  patternType: any;
  status: HardwareCompatibilityV1Status;
  currentThickness: number | null;
  trustedProfile: string | null;
  verifiedProfile: boolean;
  reliabilityScore: number;
  profilePriority: number;
  supportedThicknesses: number[];
  thicknessToleranceMm?: number;
  thicknessSupported?: boolean;
  productionGate?: HardwareProductionGateV12;
  matchReason?: string;
  excludedProfiles?: string[];
  note: string;
};

export type HardwareCompatibilityMatrixV1Report = {
  schema: "bagastudio-hardware-compatibility-matrix-v1-2";
  version: 1.2;
  generatedAt: string;
  trustedProfiles: string[];
  knowledgeBase: HardwareKnowledgeProfileV11[];
  totals: {
    components: number;
    items: number;
    compatible: number;
    warning: number;
    incompatible: number;
    unknown: number;
  };
  items: HardwareCompatibilityV1Item[];
};

function parseBagaStudioJsonField<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readCollisionNumberV1(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
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

function buildStablePartId(mesh: any, index: number) {
  if (mesh?.partId?.trim()) return mesh.partId.trim();

  const base = slugifyBagaStudioId(
    mesh?.displayName || mesh?.meshName || `component_${index + 1}`,
    `component_${index + 1}`
  );

  return `part_${String(index + 1).padStart(3, "0")}_${base}`;
}

function readCollisionDimensionsV1(mesh: any) {
  const dimensions = parseBagaStudioJsonField(mesh?.dimensions, {}) as Record<string, unknown>;
  const manufacturingData = parseBagaStudioJsonField(mesh?.manufacturingData, {}) as Record<string, unknown>;

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
    mesh?.panelThickness,
    dimensions.panelThickness,
    dimensions.thickness,
    dimensions.t,
    manufacturingData.panelThickness,
    manufacturingData.thickness
  );

  return { width, height, depth, panelThickness };
}

export function buildHardwareCompatibilityMatrixV1Report(
  patternReport: any,
  meshes: any[]
): HardwareCompatibilityMatrixV1Report {
  const meshByComponentId = new Map<string, any>();
  meshes.forEach((mesh, index) => {
    meshByComponentId.set(buildStablePartId(mesh, index), mesh);
  });

  const items: HardwareCompatibilityV1Item[] = patternReport.items.map((pattern: any) => {
    const mesh = meshByComponentId.get(pattern.componentId);
    const thickness = mesh ? readCollisionDimensionsV1(mesh).panelThickness : null;
    const trustedProfile = chooseTrustedHardwareProfileV1(pattern, thickness);

    if (pattern.patternType === "unknown") {
      return {
        componentId: pattern.componentId,
        displayName: pattern.displayName,
        hardwareLabel: pattern.label,
        patternType: pattern.patternType,
        status: "unknown",
        currentThickness: thickness,
        trustedProfile,
        verifiedProfile: false,
        reliabilityScore: 0,
        profilePriority: 99,
        supportedThicknesses: [],
        note: "Pattern non classificato: servirà Knowledge Base V1.1/V2 o profilo custom.",
      };
    }

    if (thickness === null) {
      return {
        componentId: pattern.componentId,
        displayName: pattern.displayName,
        hardwareLabel: pattern.label,
        patternType: pattern.patternType,
        status: "warning",
        currentThickness: null,
        trustedProfile,
        verifiedProfile: Boolean(getHardwareKnowledgeProfileV11(trustedProfile)?.verified),
        reliabilityScore: getHardwareKnowledgeProfileV11(trustedProfile)?.reliabilityScore || 0,
        profilePriority: getHardwareKnowledgeProfileV11(trustedProfile)?.profilePriority || 99,
        supportedThicknesses: getHardwareKnowledgeProfileV11(trustedProfile)?.supportedThicknesses || [],
        note: "Spessore componente non disponibile: compatibilità da confermare.",
      };
    }

    if (trustedProfile === "Cabineo_Singolo") {
      const compatible = thickness >= 17.8 && thickness <= 19;
      return {
        componentId: pattern.componentId,
        displayName: pattern.displayName,
        hardwareLabel: pattern.label,
        patternType: pattern.patternType,
        status: compatible ? "compatible" : "warning",
        currentThickness: thickness,
        trustedProfile,
        verifiedProfile: true,
        reliabilityScore: 95,
        profilePriority: 2,
        supportedThicknesses: [17.8, 18.3, 19],
        note: compatible ? "Cabineo_Singolo compatibile con range operativo 17.8-19 mm." : "Cabineo_Singolo fuori range base: verificare profilo o alternativa.",
      };
    }

    if (trustedProfile === "Ferramenta_17.8") {
      const compatible = Math.abs(thickness - 17.8) <= 0.25;
      return {
        componentId: pattern.componentId,
        displayName: pattern.displayName,
        hardwareLabel: pattern.label,
        patternType: pattern.patternType,
        status: compatible ? "compatible" : "warning",
        currentThickness: thickness,
        trustedProfile,
        verifiedProfile: true,
        reliabilityScore: 100,
        profilePriority: 1,
        supportedThicknesses: [17.8, 18.3],
        note: compatible ? "Profilo Ferramenta_17.8 allineato allo spessore componente." : "Profilo Ferramenta_17.8 non perfettamente allineato: verificare prima di produzione.",
      };
    }

    if (trustedProfile === "Ferramenta_18.3") {
      const compatible = Math.abs(thickness - 18.3) <= 0.35 || Math.abs(thickness - 17.8) <= 0.35;
      return {
        componentId: pattern.componentId,
        displayName: pattern.displayName,
        hardwareLabel: pattern.label,
        patternType: pattern.patternType,
        status: compatible ? "compatible" : "warning",
        currentThickness: thickness,
        trustedProfile,
        verifiedProfile: true,
        reliabilityScore: 100,
        profilePriority: 1,
        supportedThicknesses: [17.8, 18.3],
        note: compatible ? "Profilo Ferramenta_18.3 compatibile con il comportamento attuale 17.8/18.3." : "Profilo Ferramenta_18.3 fuori range previsto: verificare.",
      };
    }

    return {
      componentId: pattern.componentId,
      displayName: pattern.displayName,
      hardwareLabel: pattern.label,
      patternType: pattern.patternType,
      status: "unknown",
      currentThickness: thickness,
      trustedProfile,
      verifiedProfile: Boolean(getHardwareKnowledgeProfileV11(trustedProfile)?.verified),
      reliabilityScore: getHardwareKnowledgeProfileV11(trustedProfile)?.reliabilityScore || 0,
      profilePriority: getHardwareKnowledgeProfileV11(trustedProfile)?.profilePriority || 99,
      supportedThicknesses: getHardwareKnowledgeProfileV11(trustedProfile)?.supportedThicknesses || [],
      note: "Nessun profilo affidabile associato in Matrix V1. Profili Divario generici esclusi: usare solo divario_elvis se verificato.",
    };
  });

  const enrichedItems: HardwareCompatibilityV1Item[] = items.map((item) => {
    const profile = getHardwareKnowledgeProfileV11(item.trustedProfile);
    const tolerance = profile?.id === "Ferramenta_17.8" ? 0.25 : 0.35;
    const thicknessSupported = Boolean(
      profile &&
      item.currentThickness !== null &&
      isThicknessSupportedByKnowledgeProfileV11(profile, item.currentThickness, tolerance)
    );
    const enrichedItem: HardwareCompatibilityV1Item = {
      ...item,
      thicknessToleranceMm: tolerance,
      thicknessSupported,
      matchReason: profile
        ? thicknessSupported
          ? "Spessore entro tolleranza Knowledge Base V1.1 / Matrix V1.2."
          : "Spessore fuori tolleranza Knowledge Base V1.1 / Matrix V1.2: richiede review."
        : "Profilo non presente nella Knowledge Base V1.1: richiede review.",
      excludedProfiles: EXCLUDED_HARDWARE_PROFILES_V12,
    };

    return {
      ...enrichedItem,
      productionGate: resolveHardwareProductionGateV12(enrichedItem),
    };
  });

  return {
    schema: "bagastudio-hardware-compatibility-matrix-v1-2",
    version: 1.2,
    generatedAt: new Date().toISOString(),
    trustedProfiles: TRUSTED_HARDWARE_PROFILES_V1,
    knowledgeBase: HARDWARE_KNOWLEDGE_BASE_V11,
    totals: {
      components: meshes.length,
      items: enrichedItems.length,
      compatible: enrichedItems.filter((item) => item.status === "compatible").length,
      warning: enrichedItems.filter((item) => item.status === "warning").length,
      incompatible: enrichedItems.filter((item) => item.status === "incompatible").length,
      unknown: enrichedItems.filter((item) => item.status === "unknown").length,
    },
    items: enrichedItems,
  };
}
