export type AutoMappingEngineV2ReviewItem = {
  severity: "info" | "warning" | "critical";
  label: string;
  reason: string;
  suggestedAction: string;
};

export type AutoMappingEngineV2QualityLevel = "excellent" | "good" | "warning" | "critical";

export type AutoMappingEngineV2ReportState = {
  schema: "bagastudio-auto-mapping-engine-report";
  version: 2 | 2.3 | 2.4 | 2.5;
  totalMatches: number;
  eligibleMatches: number;
  appliedMatches: number;
  createdPlaceholders: number;
  skippedLowConfidence: number;
  averageConfidence: number;
  confidenceThreshold: number;
  qualityScore: number;
  qualityLevel: AutoMappingEngineV2QualityLevel;
  recommendedActions: string[];
  riskyMatches: string[];
  lowConfidenceMatches: string[];
  reviewQueue: AutoMappingEngineV2ReviewItem[];
  classificationSummary?: AutoMappingEngineV25ClassificationSummary;
  classifiedComponents?: AutoMappingEngineV25ClassifiedComponent[];
  meshCountBefore: number;
  meshCountAfter: number;
  updatedComponents: string[];
  placeholderComponents: string[];
  generatedAt: string;
  notes: string[];
};

export type AutoMappingEngineV25ComponentCategory =
  | "top"
  | "bottom"
  | "back"
  | "side_panel"
  | "shelf"
  | "door"
  | "drawer_front"
  | "drawer_box"
  | "divider"
  | "mirror"
  | "countertop"
  | "baseboard"
  | "leg"
  | "hardware"
  | "lighting"
  | "insert"
  | "panel"
  | "unknown";

export type AutoMappingEngineV25ClassifiedComponent = {
  meshName: string;
  displayName: string;
  componentCategory: AutoMappingEngineV25ComponentCategory;
  confidence: number;
  reason: string;
};

export type AutoMappingEngineV25ClassificationSummary = {
  version: "2.5";
  totalComponents: number;
  classifiedComponents: number;
  unknownComponents: number;
  categories: Record<string, number>;
  generatedAt: string;
};

export type AutoMappingEngineV2QualityResult = Pick<
  AutoMappingEngineV2ReportState,
  "qualityScore" | "qualityLevel" | "recommendedActions"
>;

export const AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE = 60;
export const AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE = 85;
export const AUTO_MAPPING_ENGINE_V2_SAFE_QUALITY_SCORE = 80;

export type AutoMappingMeshLike = {
  meshName?: string;
  displayName?: string;
  category?: string;
  componentCategory?: string;
  runtimeRole?: string;
  tags?: string;
  [key: string]: unknown;
};

export function inferAutoMappingEngineV25ComponentCategory(
  name: string,
  fallbackCategory = ""
): AutoMappingEngineV25ClassifiedComponent {
  const source = `${name} ${fallbackCategory}`.toLowerCase();
  const has = (...words: string[]) => words.some((word) => source.includes(word));

  const make = (
    componentCategory: AutoMappingEngineV25ComponentCategory,
    confidence: number,
    reason: string
  ): AutoMappingEngineV25ClassifiedComponent => ({
    meshName: "",
    displayName: name,
    componentCategory,
    confidence,
    reason,
  });

  if (has("specchio", "mirror")) return make("mirror", 96, "keyword specchio/mirror");
  if (has("led", "strip", "luce")) return make("lighting", 95, "keyword LED/luce");
  if (has("maniglia", "cerniera", "ferramenta", "vite", "basetta", "handle", "hinge")) return make("hardware", 93, "keyword ferramenta");
  if (has("piede", "gamba", "leg")) return make("leg", 90, "keyword piede/gamba");
  if (has("zoccolo", "plinth", "baseboard")) return make("baseboard", 92, "keyword zoccolo");
  if (has("schiena", "retro", "back")) return make("back", 94, "keyword schiena/retro");
  if (has("fianco sinistro", "fianco sx", "left side", "side left")) return make("side_panel", 95, "keyword fianco sinistro");
  if (has("fianco destro", "fianco dx", "right side", "side right")) return make("side_panel", 95, "keyword fianco destro");
  if (has("fianco", "side panel", "side_panel")) return make("side_panel", 90, "keyword fianco");
  if (has("fondo", "bottom")) return make("bottom", 93, "keyword fondo/bottom");
  if (has("cielo", "top panel")) return make("top", 92, "keyword cielo/top panel");
  if (has("piano", "top", "countertop")) return make("countertop", 88, "keyword piano/top");
  if (has("ripiano", "mensola", "shelf")) return make("shelf", 94, "keyword ripiano/mensola");
  if (has("divisorio", "tramezzo", "separator", "divider")) return make("divider", 92, "keyword divisorio");
  if (has("frontale cassetto", "drawer front")) return make("drawer_front", 96, "keyword frontale cassetto");
  if (has("cassetto", "drawer box", "cassettone")) return make("drawer_box", 86, "keyword cassetto");
  if (has("anta", "door")) return make("door", 94, "keyword anta/door");
  if (has("frontale", "front")) return make("drawer_front", 78, "keyword frontale generico");
  if (has("inserto", "marmo", "insert")) return make("insert", 86, "keyword inserto/marmo");
  if (has("pannello", "panel")) return make("panel", 70, "keyword pannello generico");

  return make("unknown", 0, "nessuna regola V2.5 riconosciuta");
}

export function classifyAutoMappingEngineV25Mesh<T extends AutoMappingMeshLike>(mesh: T): T {
  const classified = inferAutoMappingEngineV25ComponentCategory(
    String(mesh.displayName || mesh.meshName || ""),
    String(mesh.category || "")
  );

  return {
    ...mesh,
    componentCategory: mesh.componentCategory || classified.componentCategory,
    runtimeRole:
      mesh.runtimeRole && mesh.runtimeRole !== "component"
        ? mesh.runtimeRole
        : classified.componentCategory === "side_panel"
        ? "side"
        : classified.componentCategory,
    tags: Array.from(
      new Set(
        [String(mesh.tags || ""), "auto-mapping-v2.5", `class:${classified.componentCategory}`]
          .join(",")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ).join(", "),
  } as T;
}

export function buildAutoMappingEngineV25ClassificationReport<T extends AutoMappingMeshLike>(meshes: T[]) {
  const classifiedComponents = meshes.map((mesh) => {
    const classified = inferAutoMappingEngineV25ComponentCategory(
      String(mesh.displayName || mesh.meshName || ""),
      String(mesh.category || "")
    );

    return {
      ...classified,
      meshName: String(mesh.meshName || ""),
      displayName: String(mesh.displayName || mesh.meshName || ""),
      componentCategory: (mesh.componentCategory || classified.componentCategory) as AutoMappingEngineV25ComponentCategory,
    };
  });

  const categories = classifiedComponents.reduce<Record<string, number>>((acc, item) => {
    acc[item.componentCategory] = (acc[item.componentCategory] || 0) + 1;
    return acc;
  }, {});

  const summary: AutoMappingEngineV25ClassificationSummary = {
    version: "2.5",
    totalComponents: classifiedComponents.length,
    classifiedComponents: classifiedComponents.filter((item) => item.componentCategory !== "unknown").length,
    unknownComponents: classifiedComponents.filter((item) => item.componentCategory === "unknown").length,
    categories,
    generatedAt: new Date().toISOString(),
  };

  return { summary, classifiedComponents };
}

export function normalizeAutoMappingV2Key(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^[0-9]+[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildAutoMappingEngineV2ReviewQueue(params: {
  riskyMatches: string[];
  lowConfidenceMatches: string[];
  placeholderComponents: string[];
  qualityLevel: AutoMappingEngineV2QualityLevel;
}) {
  const reviewQueue: AutoMappingEngineV2ReviewItem[] = [];

  params.placeholderComponents.slice(0, 25).forEach((component) => {
    reviewQueue.push({
      severity: "warning",
      label: component,
      reason: "Pezzo trovato in CSV/CIX ma non collegato a una mesh geometrica esistente.",
      suggestedAction: "Controllare se il componente deve essere creato come placeholder metadata o se manca una mesh nel modello importato.",
    });
  });

  params.riskyMatches.slice(0, 25).forEach((match) => {
    reviewQueue.push({
      severity: "warning",
      label: match,
      reason: "Match sopra soglia ma con confidenza non alta.",
      suggestedAction: "Verificare nome componente, categoria e collegamento CIX prima del salvataggio definitivo.",
    });
  });

  params.lowConfidenceMatches.slice(0, 25).forEach((match) => {
    reviewQueue.push({
      severity: "critical",
      label: match,
      reason: "Match sotto soglia minima Auto Mapping V2.",
      suggestedAction: "Correggere nomi CSV/CIX o completare manualmente il mapping.",
    });
  });

  if (reviewQueue.length === 0) {
    reviewQueue.push({
      severity: "info",
      label: "Auto Mapping V2.3",
      reason: "Nessun elemento critico rilevato nella coda di revisione.",
      suggestedAction: params.qualityLevel === "excellent" || params.qualityLevel === "good"
        ? "Procedere con controllo visivo e salvataggio Product Package."
        : "Controllare comunque il mapping prima di usare il prodotto in catalogo.",
    });
  }

  return reviewQueue;
}

export function evaluateAutoMappingEngineV2Quality(params: {
  totalMatches: number;
  eligibleMatches: number;
  appliedMatches: number;
  createdPlaceholders: number;
  skippedLowConfidence: number;
  averageConfidence: number;
  riskyMatches: string[];
}): AutoMappingEngineV2QualityResult {
  const totalMatches = Math.max(1, params.totalMatches);
  const eligibilityRatio = params.eligibleMatches / totalMatches;
  const appliedRatio = params.appliedMatches / totalMatches;
  const placeholderPenalty = params.createdPlaceholders > 0 ? Math.min(18, params.createdPlaceholders * 2) : 0;
  const lowConfidencePenalty = params.skippedLowConfidence > 0 ? Math.min(22, params.skippedLowConfidence * 2) : 0;
  const riskyPenalty = params.riskyMatches.length > 0 ? Math.min(20, params.riskyMatches.length * 3) : 0;

  const qualityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        params.averageConfidence * 0.45 +
          eligibilityRatio * 25 +
          appliedRatio * 30 -
          placeholderPenalty -
          lowConfidencePenalty -
          riskyPenalty
      )
    )
  );

  const qualityLevel: AutoMappingEngineV2QualityLevel =
    qualityScore >= 90
      ? "excellent"
      : qualityScore >= AUTO_MAPPING_ENGINE_V2_SAFE_QUALITY_SCORE
      ? "good"
      : qualityScore >= 60
      ? "warning"
      : "critical";

  const recommendedActions: string[] = [];

  if (params.skippedLowConfidence > 0) {
    recommendedActions.push("Controllare i match sotto soglia: alcuni pezzi CSV/CIX non sono stati applicati automaticamente.");
  }

  if (params.createdPlaceholders > 0) {
    recommendedActions.push("Verificare i placeholder metadata: indicano pezzi di produzione senza mesh geometrica trovata nel modello.");
  }

  if (params.riskyMatches.length > 0) {
    recommendedActions.push("Verificare manualmente i match ambigui prima di salvare il prodotto in catalogo.");
  }

  if (qualityLevel === "excellent" || qualityLevel === "good") {
    recommendedActions.push("Mapping idoneo per generare Product Package, mantenendo comunque controllo visivo componenti.");
  }

  if (qualityLevel === "critical") {
    recommendedActions.push("Non considerare il mapping definitivo: servono nomi mesh più coerenti o un mapping manuale di supporto.");
  }

  return {
    qualityScore,
    qualityLevel,
    recommendedActions,
  };
}
