// @ts-nocheck
import * as THREE from "three";
import type { CsvCixMatch, CsvPart } from "@/lib/importer/csvCixMatcher";

type MeshConfig = {
  meshName: string;
  displayName: string;
  category: string;
  componentCategory?: string;
  partId?: string;
  componentType?: string;
  runtimeRole?: string;
  tags?: string;
  selectable: boolean;
  visible: boolean;
  compatibleLed: boolean;
  compatibleInsert: boolean;
  supportsAccessories: boolean;
  materialSlots: string;
  compatibleAccessories: string;

  dimensions?: string;
  technicalPoints?: string;
  assemblyOrder?: string;
  panelThickness?: string;
  materialCode?: string;
  edgeBanding?: string;
  hardware?: string;
  drillings?: string;
  manufacturingData?: string;
  constraintRole?: string;
  hardwareLinks?: string;
  drillingLinks?: string;
  dependencyParents?: string;
  dependencyChildren?: string;
  parametricData?: string;
  manufacturingOverrideData?: string;
  csvRegenerationData?: string;

  ledFrontOffset: string;
ledSideMargin: string;
ledYOffset: string;

insertPosition: string;
insertOffsetX: string;
insertOffsetY: string;
insertOffsetZ: string;
ledPosition: string;
};


const BAGASTUDIO_ADMIN_AUTOSAVE_KEY = "bagastudio_core_admin_autosave_v1";
const BAGASTUDIO_PRODUCT_LIBRARY_KEY = "bagastudio_core_product_library_v1";

const BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMATS = [".glb", ".gltf", ".dae", ".fbx", ".obj", ".stl"].join(",");
const BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMAT_LABEL = "GLB, GLTF, DAE, FBX, OBJ, STL";


type ProductLibraryItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  sourceFileName: string;
  savedAt: string;
  packageJson: string;
};


type AdminImporterDiagnostic = {
  status: "idle" | "loading" | "ready" | "warning" | "error";
  fileName: string;
  extension: string;
  meshCount: number;
  selectableCount: number;
  visibleCount: number;
  ledReadyCount: number;
  insertReadyCount: number;
  accessoryReadyCount: number;
  message: string;
  warnings: string[];
  errors: string[];
  updatedAt: string;
};

const createAdminImporterDiagnostic = (patch: Partial<AdminImporterDiagnostic> = {}): AdminImporterDiagnostic => ({
  status: patch.status || "idle",
  fileName: patch.fileName || "",
  extension: patch.extension || "",
  meshCount: patch.meshCount || 0,
  selectableCount: patch.selectableCount || 0,
  visibleCount: patch.visibleCount || 0,
  ledReadyCount: patch.ledReadyCount || 0,
  insertReadyCount: patch.insertReadyCount || 0,
  accessoryReadyCount: patch.accessoryReadyCount || 0,
  message: patch.message || "Importer in attesa",
  warnings: patch.warnings || [],
  errors: patch.errors || [],
  updatedAt: patch.updatedAt || new Date().toISOString(),
});


type Space3DAnalyzerComponent = {
  id: string;
  name: string;
  category: string;
  source: "keyword" | "candidate";
};

type Space3DAnalyzerMaterial = {
  id: string;
  name: string;
  category: string;
};

type Space3DAnalyzerReport = {
  schema: "bagastudio-space3d-analyzer-report";
  version: number;
  fileName: string;
  fileSize: number;
  analyzedAt: string;
  format: {
    detected: boolean;
    header: string;
    software: string;
  };
  stats: {
    readableStrings: number;
    components: number;
    materials: number;
  };
  components: Space3DAnalyzerComponent[];
  materials: Space3DAnalyzerMaterial[];
  previewStrings: string[];
  warnings: string[];
};

type GeometryCompletionReport = {
  status: "idle" | "ready";
  daeMeshCount: number;
  s3dComponentCount: number;
  matchedCount: number;
  missingCount: number;
  missingParts: MeshConfig[];
  generatedAt: string;
};

type CsvCixMatcherReportState = {
  totalCsvParts: number;
  matchedParts: number;
  unmatchedParts: number;
  averageConfidence: number;
  matches: CsvCixMatch[];
};

type AutoMappingEngineV2ReviewItem = {
  severity: "info" | "warning" | "critical";
  label: string;
  reason: string;
  suggestedAction: string;
};

type AutoMappingEngineV2ReportState = {
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
  qualityLevel: "excellent" | "good" | "warning" | "critical";
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

type AutoMappingEngineV25ComponentCategory =
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

type AutoMappingEngineV25ClassifiedComponent = {
  meshName: string;
  displayName: string;
  componentCategory: AutoMappingEngineV25ComponentCategory;
  confidence: number;
  reason: string;
};

type AutoMappingEngineV25ClassificationSummary = {
  version: "2.5";
  totalComponents: number;
  classifiedComponents: number;
  unknownComponents: number;
  categories: Record<string, number>;
  generatedAt: string;
};

const SPACE3D_SUPPORTED_FORMATS = ".s3d,.s3dbak";
const SPACE3D_CSV_SUPPORTED_FORMATS = ".csv";
const SPACE3D_CIX_SUPPORTED_FORMATS = ".cix";

const SPACE3D_COMPONENT_KEYWORDS = [
  "fianco",
  "fondo",
  "cielo",
  "schiena",
  "zoccolo",
  "ripiano",
  "mensola",
  "anta",
  "cassetto",
  "frontale",
  "maniglia",
  "cerniera",
  "basetta",
  "piede",
  "pannello",
  "top",
  "base",
  "specchio",
  "led",
];

const SPACE3D_MATERIAL_KEYWORDS = [
  "nero",
  "bianco",
  "venato",
  "china",
  "mdf",
  "bilaminato",
  "laminato",
  "ferramenta",
  "legno",
  "wood",
  "marmo",
  "oro",
  "acciaio",
  "cemento",
  "truciolato",
];

function normalizeSpace3DToken(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueByLowercase(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const clean = normalizeSpace3DToken(value);
    if (clean.length < 3) return;

    const key = clean.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    result.push(clean);
  });

  return result;
}

function guessSpace3DCategory(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("maniglia") || lower.includes("cerniera") || lower.includes("basetta") || lower.includes("ferramenta")) return "hardware";
  if (lower.includes("cassetto")) return "drawer";
  if (lower.includes("zoccolo")) return "plinth";
  if (lower.includes("ripiano") || lower.includes("mensola")) return "shelf";
  if (lower.includes("fianco") || lower.includes("schiena") || lower.includes("fondo") || lower.includes("cielo") || lower.includes("pannello")) return "panel";
  if (lower.includes("led")) return "lighting";
  if (lower.includes("specchio")) return "mirror";

  return "component";
}

function guessSpace3DMaterialCategory(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("ferramenta") || lower.includes("acciaio") || lower.includes("oro")) return "metal";
  if (lower.includes("marmo") || lower.includes("cemento")) return "stone";
  if (lower.includes("mdf") || lower.includes("bilaminato") || lower.includes("laminato") || lower.includes("legno") || lower.includes("wood") || lower.includes("truciolato")) return "wood";

  return "material";
}

function buildSpace3DAnalyzerReport(fileName: string, fileSize: number, rawText: string): Space3DAnalyzerReport {
  const readableStrings = uniqueByLowercase(rawText.match(/[A-Za-zÀ-ÿ0-9_\-.\/\\: ]{3,}/g) || []);
  const lowerText = rawText.toLowerCase();
  const detected = lowerText.includes("advanceds3d") || lowerText.includes("brainsoftware") || lowerText.includes("spazio");

  const componentNames = readableStrings.filter((item) => {
    const lower = item.toLowerCase();
    return SPACE3D_COMPONENT_KEYWORDS.some((keyword) => lower.includes(keyword));
  });

  const materialNames = readableStrings.filter((item) => {
    const lower = item.toLowerCase();
    const looksLikeMaterial = SPACE3D_MATERIAL_KEYWORDS.some((keyword) => lower.includes(keyword));
    const tooMuchPathNoise = lower.includes("c:\\") || lower.includes("program files") || lower.includes("appdata");
    return looksLikeMaterial && !tooMuchPathNoise && item.length <= 90;
  });

  const components = componentNames.slice(0, 250).map((name, index) => ({
    id: `s3d_component_${String(index + 1).padStart(3, "0")}`,
    name,
    category: guessSpace3DCategory(name),
    source: "keyword" as const,
  }));

  const materials = materialNames.slice(0, 200).map((name, index) => ({
    id: `s3d_material_${String(index + 1).padStart(3, "0")}`,
    name,
    category: guessSpace3DMaterialCategory(name),
  }));

  return {
    schema: "bagastudio-space3d-analyzer-report",
    version: 1,
    fileName,
    fileSize,
    analyzedAt: new Date().toISOString(),
    format: {
      detected,
      header: detected ? "AdvancedS3D / Space3D candidate" : "Unknown",
      software: lowerText.includes("brainsoftware") ? "BrainSoftware / Spazio3D" : "Unknown",
    },
    stats: {
      readableStrings: readableStrings.length,
      components: components.length,
      materials: materials.length,
    },
    components,
    materials,
    previewStrings: readableStrings.slice(0, 120),
    warnings: [
      ...(detected ? [] : ["Formato Space3D non confermato: analyzer eseguito in modalità euristica."]),
      ...(components.length === 0 ? ["Nessun componente riconosciuto dai nomi leggibili."] : []),
      "Analyzer V1: estrae componenti/materiali leggibili, ma non converte ancora geometrie 3D.",
    ],
  };
}

function space3DReportToMeshConfigs(report: Space3DAnalyzerReport): MeshConfig[] {
  return report.components.map((component, index) => ({
    meshName: component.id,
    displayName: component.name || `Componente Space3D ${index + 1}`,
    category: component.category || "component",
    selectable: true,
    visible: true,
    compatibleLed: component.category === "panel" || component.name.toLowerCase().includes("led"),
    compatibleInsert: component.category === "panel",
    supportsAccessories: !["lighting"].includes(component.category),
    materialSlots: "main",
    compatibleAccessories: component.category === "hardware" ? "hardware" : "",
    dimensions: "",
    technicalPoints: "",
    assemblyOrder: "",
    panelThickness: "",
    materialCode: "",
    edgeBanding: "",
    hardware: component.category === "hardware" ? component.name : "",
    drillings: "",
    manufacturingData: "",
    constraintRole: "",
    hardwareLinks: "",
    drillingLinks: "",
    dependencyParents: "",
    dependencyChildren: "",
    ledFrontOffset: "4",
    ledSideMargin: "5",
    ledYOffset: "0",
    insertPosition: "front",
    insertOffsetX: "0",
    insertOffsetY: "0",
    insertOffsetZ: "1",
    ledPosition: "front",
  }));
}


const DEFAULT_PRODUCT_MATERIALS = [
  { id: "acciaio_ossidato", name: "Acciaio Ossidato", category: "metal", textureUrl: "/textures/Acciaio_Ossidato.webp", roughness: 0.55, metalness: 0.8 },
  { id: "acciaio_ossidato_truciolato", name: "Acciaio Ossidato Truciolato", category: "wood", textureUrl: "/textures/Acciaio_Ossidato_Truciolato.webp", roughness: 0.55, metalness: 0 },
  { id: "angel_white", name: "Angel White", category: "wood", textureUrl: "/textures/Angel_White.webp", roughness: 0.45, metalness: 0 },
  { id: "barok", name: "Barok", category: "wood", textureUrl: "/textures/Barok.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_liscio_china", name: "Bianco Liscio China", category: "wood", textureUrl: "/textures/Bianco_Liscio_China.webp", roughness: 0.4, metalness: 0 },
  { id: "bianco_liscio_truciolato", name: "Bianco Liscio Truciolato", category: "wood", textureUrl: "/textures/Bianco_Liscio_Truciolato.webp", roughness: 0.4, metalness: 0 },
  { id: "bianco_sporco_bilaminato", name: "Bianco Sporco Bilaminato", category: "wood", textureUrl: "/textures/Bianco_Sporco_Bilaminato.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_sporco_china", name: "Bianco Sporco China", category: "wood", textureUrl: "/textures/Bianco_Sporco_China.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_sporco_truciolato", name: "Bianco Sporco Truciolato", category: "wood", textureUrl: "/textures/Bianco_Sporco_Truciolato.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_venato", name: "Bianco Venato", category: "wood", textureUrl: "/textures/Bianco_Venato.webp", roughness: 0.45, metalness: 0 },
  { id: "cemento_chiaro", name: "Cemento Chiaro", category: "stone", textureUrl: "/textures/Cemento_Chiaro.webp", roughness: 0.7, metalness: 0 },
  { id: "confortable_coffe", name: "Confortable Coffe", category: "wood", textureUrl: "/textures/Confortable_Coffe.webp", roughness: 0.45, metalness: 0 },
  { id: "marmo", name: "Marmo", category: "marble", textureUrl: "/textures/Marmo.webp", roughness: 0.2, metalness: 0 },
  { id: "mdf_bianco", name: "MDF Bianco", category: "wood", textureUrl: "/textures/MDF_Bianco.webp", roughness: 0.5, metalness: 0 },
  { id: "mdf_nero", name: "MDF Nero", category: "wood", textureUrl: "/textures/MDF_Nero.webp", roughness: 0.5, metalness: 0 },
  { id: "nero_venato_china", name: "Nero Venato China", category: "wood", textureUrl: "/textures/Nero_Venato_China.webp", roughness: 0.5, metalness: 0 },
  { id: "noce_canaletto", name: "Noce Canaletto", category: "wood", textureUrl: "/textures/Noce_canaletto.webp", roughness: 0.45, metalness: 0 },
  { id: "oro", name: "Oro", category: "metal", textureUrl: "/textures/Oro.webp", roughness: 0.2, metalness: 1 },
  { id: "oro_satinato", name: "Oro Satinato", category: "metal", textureUrl: "/textures/Oro_Satinato.webp", roughness: 0.35, metalness: 1 },
  { id: "rovere_cadiz", name: "Rovere Cadiz", category: "wood", textureUrl: "/textures/Rovere_Cadiz.webp", roughness: 0.45, metalness: 0 },
  { id: "wood_7040", name: "Wood 7040", category: "wood", textureUrl: "/textures/Wood_7040.webp", roughness: 0.45, metalness: 0 },
  { id: "youth_fleeting", name: "Youth Fleeting", category: "wood", textureUrl: "/textures/Youth_Fleeting.webp", roughness: 0.45, metalness: 0 }
];

const DEFAULT_PRODUCT_VIEWS = [
  { id: "front", name: "Frontale" },
  { id: "back", name: "Retro" },
  { id: "left", name: "Sinistra" },
  { id: "right", name: "Destra" },
  { id: "top", name: "Alto" },
  { id: "iso", name: "3D" },
];

function downloadJsonFile(fileName: string, payload: unknown) {
  const jsonString = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function guessPartName(mesh: THREE.Mesh, index: number) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();

  box.getSize(size);

  const width = size.x;
  const height = size.y;
  const depth = size.z;
  const name = mesh.name.toLowerCase();

  if (name.includes("top") || name.includes("piano")) return "Piano";
if (name.includes("bottom") || name.includes("base") || name.includes("zoccolo")) return "Base";
if (name.includes("front") || name.includes("frontale")) return "Frontale";
if (name.includes("back") || name.includes("schiena") || name.includes("retro")) return "Schiena";
if (name.includes("left") || name.includes("sx") || name.includes("sinistro")) return "Fianco SX";
if (name.includes("right") || name.includes("dx") || name.includes("destro")) return "Fianco DX";
if (name.includes("side") || name.includes("fianco")) return "Fianco";
if (name.includes("door") || name.includes("anta")) return "Anta";
if (name.includes("drawer") || name.includes("cassetto")) return "Cassetto";
if (name.includes("shelf") || name.includes("mensola")) return "Mensola";
if (name.includes("mirror") || name.includes("specchio")) return "Specchio";
if (name.includes("handle") || name.includes("maniglia")) return "Maniglia";
if (name.includes("led")) return "LED strip";
if (name.includes("insert") || name.includes("inserto") || name.includes("marmo")) return "Inserto";

if (height < width * 0.18 && height < depth * 0.35) return "Piano";
if (height > width * 2 && depth < width * 0.5) return "Fianco";
if (width > depth * 2 && height > depth * 2) return "Frontale";
if (width < depth * 0.4 && height > depth * 1.2) return "Fianco";
  return mesh.name || `Componente ${index + 1}`;
}

function guessComponentCategory(displayName: string) {
  const name = displayName.toLowerCase();

  if (name.includes("specchio") || name.includes("mirror")) return "mirror";
  if (name.includes("maniglia") || name.includes("handle")) return "hardware";
  if (name.includes("led")) return "lighting";
  if (name.includes("inserto") || name.includes("marmo") || name.includes("insert")) return "insert";
  if (
    name.includes("piano") ||
    name.includes("top") ||
    name.includes("base") ||
    name.includes("fianco") ||
    name.includes("schiena") ||
    name.includes("frontale") ||
    name.includes("anta") ||
    name.includes("cassetto") ||
    name.includes("mensola") ||
    name.includes("ripiano")
  ) {
    return "panel";
  }

  return "component";
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
  if (mesh.partId?.trim()) return mesh.partId.trim();

  const base = slugifyBagaStudioId(
    mesh.displayName || mesh.meshName || `component_${index + 1}`,
    `component_${index + 1}`
  );

  return `part_${String(index + 1).padStart(3, "0")}_${base}`;
}

function guessRuntimeRole(displayName: string, category: string) {
  const name = `${displayName} ${category}`.toLowerCase();

  if (name.includes("top") || name.includes("piano")) return "top";
  if (name.includes("frontale") || name.includes("front")) return "front";
  if (name.includes("schiena") || name.includes("retro") || name.includes("back")) return "back";
  if (name.includes("fianco") || name.includes("side") || name.includes("sx") || name.includes("dx")) return "side";
  if (name.includes("zoccolo") || name.includes("plinth")) return "plinth";
  if (name.includes("mensola") || name.includes("ripiano") || name.includes("shelf")) return "shelf";
  if (name.includes("cassetto") || name.includes("drawer")) return "drawer";
  if (name.includes("anta") || name.includes("door")) return "door";
  if (category === "mirror") return "mirror";
  if (category === "hardware") return "hardware";
  if (category === "lighting") return "lighting";
  if (category === "insert") return "insert";

  return "component";
}

function buildRuntimeTags(mesh: Partial<MeshConfig>, category: string, role: string) {
  const rawTags = typeof mesh.tags === "string" ? mesh.tags.split(",") : [];
  return Array.from(
    new Set(
      [category, role, ...rawTags]
        .map((tag) => String(tag || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizeComponentCategory(category: string, displayName = "") {
  const value = String(category || "").trim().toLowerCase();
  if (value && value !== "component") return value;
  return guessComponentCategory(displayName || "");
}


function parseBagaStudioCsvField(value?: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBagaStudioJsonField<T>(value: string | undefined, fallback: T): T {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return fallback;

  try {
    return JSON.parse(cleanValue) as T;
  } catch {
    return fallback;
  }
}



type ManufacturingConstraintRoleV1 = "STRUCTURAL" | "DERIVED" | "ACCESSORY" | "HARDWARE" | "UNKNOWN";

function inferManufacturingConstraintRoleV1(componentCategory: string, category: string, displayName = ""): ManufacturingConstraintRoleV1 {
  const value = `${componentCategory} ${category} ${displayName}`.toLowerCase();

  if (
    value.includes("minifix") ||
    value.includes("spina") ||
    value.includes("basetta") ||
    value.includes("cerniera") ||
    value.includes("guida") ||
    value.includes("ferramenta") ||
    value.includes("hardware")
  ) {
    return "HARDWARE";
  }

  if (
    value.includes("maniglia") ||
    value.includes("led") ||
    value.includes("specchio") ||
    value.includes("accessory") ||
    value.includes("accessorio") ||
    componentCategory === "mirror"
  ) {
    return "ACCESSORY";
  }

  if (
    componentCategory === "side_panel" ||
    componentCategory === "divider" ||
    componentCategory === "top" ||
    componentCategory === "bottom" ||
    value.includes("fianco") ||
    value.includes("divisorio") ||
    value.includes("cielo") ||
    value.includes("fondo")
  ) {
    return "STRUCTURAL";
  }

  if (
    componentCategory === "shelf" ||
    componentCategory === "back" ||
    componentCategory === "drawer_front" ||
    componentCategory === "drawer_box" ||
    componentCategory === "door" ||
    value.includes("ripiano") ||
    value.includes("schiena") ||
    value.includes("cassetto") ||
    value.includes("anta")
  ) {
    return "DERIVED";
  }

  return "UNKNOWN";
}

type CollisionEngineV1Severity = "critical" | "warning" | "info";

type CollisionEngineV1Issue = {
  id: string;
  componentId: string;
  meshName: string;
  displayName: string;
  code: string;
  severity: CollisionEngineV1Severity;
  message: string;
  targetType: "hardware" | "drilling" | "component";
  targetLabel: string;
  axis?: "x" | "y" | "z" | "edge" | "thickness" | "pair";
  value?: number | null;
  limit?: number | null;
  recommendation: string;
};

type CollisionEngineV1Report = {
  schema: "bagastudio-collision-engine-v1-5";
  version: 1.5;
  generatedAt: string;
  totals: {
    components: number;
    checkedComponents: number;
    skippedComponents: number;
    critical: number;
    warning: number;
    info: number;
    issues: number;
  };
  issues: CollisionEngineV1Issue[];
};

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
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const parsed = parseBagaStudioJsonField(value, null);
    if (Array.isArray(parsed)) return parsed;
    const csvValues = parseBagaStudioCsvField(value);
    return csvValues.map((item) => ({ label: item, name: item }));
  }

  return [];
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


type CsvRegenerationV1Report = {
  schema: "bagastudio-csv-regeneration-v1";
  version: 1;
  generatedAt: string;
  targetThickness: number | null;
  sourceCsvFileName: string | null;
  totals: {
    csvRows: number;
    linkedRows: number;
    updatedRows: number;
    unchangedRows: number;
    skippedRows: number;
  };
  rows: Array<{
    rowIndex: number;
    name: string;
    material: string | null;
    quantity: number | null;
    originalWidth: number | null;
    originalDepth: number | null;
    originalThickness: number | null;
    regeneratedWidth: number | null;
    regeneratedDepth: number | null;
    regeneratedThickness: number | null;
    cixSource: string | null;
    status: "updated" | "unchanged" | "skipped";
    note: string;
  }>;
};

function normalizeCsvRegenerationKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function csvRegenerationEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (/[";,\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function buildCsvRegenerationV1Report(
  csvParts: CsvPart[],
  matches: CsvCixMatch[],
  meshes: MeshConfig[],
  targetThicknessValue: string,
  sourceCsvFileName?: string
): CsvRegenerationV1Report {
  const targetThickness = readCollisionNumberV1(targetThicknessValue);

  const meshByCsvKey = new Map<string, MeshConfig>();
  meshes.forEach((mesh) => {
    const meshAny = mesh as any;
    [meshAny.csvSource, mesh.displayName, mesh.meshName, mesh.partId]
      .filter(Boolean)
      .forEach((key) => meshByCsvKey.set(normalizeCsvRegenerationKey(key), mesh));
  });

  const matchByCsvKey = new Map<string, CsvCixMatch>();
  matches.forEach((match) => {
    if (match?.csvPart?.name) matchByCsvKey.set(normalizeCsvRegenerationKey(match.csvPart.name), match);
  });

  const rows = csvParts.map((part) => {
    const csvKey = normalizeCsvRegenerationKey(part.name);
    const linkedMesh = meshByCsvKey.get(csvKey) || null;
    const linkedMatch = matchByCsvKey.get(csvKey) || null;
    const meshAny = linkedMesh as any;
    const overrideData = parseBagaStudioJsonField(meshAny?.manufacturingOverrideData, {}) as Record<string, unknown>;
    const parametricData = parseBagaStudioJsonField(meshAny?.parametricData, {}) as Record<string, unknown>;

    const originalWidth = readCollisionNumberV1(part.width, parametricData.originalWidth);
    const originalDepth = readCollisionNumberV1(part.depth, parametricData.originalDepth);
    const originalThickness = readCollisionNumberV1(part.thickness, parametricData.originalThickness);

    const isThinPanel = originalThickness !== null && originalThickness <= 6;
    const isManualCheck = originalThickness !== null && originalThickness > 6 && originalThickness < 12;

    const requestedThickness = readCollisionNumberV1(
      parametricData.currentThickness,
      overrideData.targetThickness,
      targetThickness,
      originalThickness
    );

    const regeneratedThickness =
      isThinPanel || isManualCheck ? originalThickness : requestedThickness;

    const isLinked = Boolean(linkedMesh || linkedMatch);
    const changed = Boolean(
      isLinked &&
      !isThinPanel &&
      !isManualCheck &&
      regeneratedThickness !== null &&
      originalThickness !== null &&
      Math.abs(regeneratedThickness - originalThickness) > 0.001
    );

    const status: "updated" | "unchanged" | "skipped" = !isLinked
      ? "skipped"
      : isThinPanel
        ? "skipped"
        : isManualCheck
          ? "skipped"
          : changed
            ? "updated"
            : "unchanged";

    return {
      rowIndex: part.rowIndex,
      name: part.name,
      material: part.material || null,
      quantity: readCollisionNumberV1(part.quantity),
      originalWidth,
      originalDepth,
      originalThickness,
      regeneratedWidth: originalWidth,
      regeneratedDepth: originalDepth,
      regeneratedThickness,
      cixSource: linkedMatch?.cixPart?.fileName || linkedMatch?.cixPart?.partName || meshAny?.cixSource || null,
      status,
      note: !isLinked
        ? "Riga CSV non collegata a un componente/match CIX: mantenuta invariata."
        : isThinPanel
          ? "Manufacturing Rules Engine V1.2: pannello sottile <= 6 mm, spessore mantenuto invariato."
          : isManualCheck
            ? "Manufacturing Rules Engine V1.2: spessore tra 6 e 12 mm, controllo manuale richiesto."
            : changed
              ? "Riga pronta per CSV rigenerato: spessore aggiornato e ingombro esterno bloccato."
              : "Riga collegata ma senza variazioni di spessore.",
    };
  });

  return {
    schema: "bagastudio-csv-regeneration-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    targetThickness,
    sourceCsvFileName: sourceCsvFileName || null,
    totals: {
      csvRows: rows.length,
      linkedRows: rows.filter((row) => row.status !== "skipped").length,
      updatedRows: rows.filter((row) => row.status === "updated").length,
      unchangedRows: rows.filter((row) => row.status === "unchanged").length,
      skippedRows: rows.filter((row) => row.status === "skipped").length,
    },
    rows,
  };
}

function buildCsvRegenerationV1Csv(report: CsvRegenerationV1Report) {
  const header = [
    "rowIndex",
    "name",
    "material",
    "quantity",
    "width",
    "depth",
    "thickness",
    "cixSource",
    "status",
    "note",
  ];

  const body = report.rows.map((row) => [
    row.rowIndex,
    row.name,
    row.material,
    row.quantity,
    row.regeneratedWidth,
    row.regeneratedDepth,
    row.regeneratedThickness,
    row.cixSource,
    row.status,
    row.note,
  ]);

  return [header, ...body]
    .map((line) => line.map(csvRegenerationEscape).join(";"))
    .join("\n");
}

function downloadCsvTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}


type ManufacturingDataInspectorV1Report = {
  schema: "bagastudio-manufacturing-data-inspector-v1";
  version: 1;
  generatedAt: string;
  readiness: "READY_FOR_HARDWARE_ANALYZER_V2" | "MISSING_DATA_FOR_HARDWARE_ANALYZER_V2";
  totals: {
    components: number;
    componentsWithThickness: number;
    componentsWithoutThickness: number;
    hardwareLinks: number;
    componentsWithHardware: number;
    drillingLinks: number;
    componentsWithDrillings: number;
    componentsWithConstraintRole: number;
  };
  constraintRoles: Record<string, number>;
  thicknessRows: Array<{
    componentId: string;
    displayName: string;
    thickness: number | null;
    status: "ready" | "missing";
  }>;
  hardwareSummary: Array<{
    label: string;
    count: number;
  }>;
  drillingSummary: Array<{
    label: string;
    count: number;
  }>;
  missingData: string[];
};

function incrementInspectorCounterV1(counter: Record<string, number>, label: unknown) {
  const key = String(label || "unknown").trim() || "unknown";
  counter[key] = (counter[key] || 0) + 1;
}

function readThicknessFromCsvRegenerationBridgeV1(
  displayName: string,
  csvReport?: CsvRegenerationV1Report
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

function buildManufacturingDataInspectorV1Report(meshes: MeshConfig[]): ManufacturingDataInspectorV1Report {
  const hardwareCounter: Record<string, number> = {};
  const drillingCounter: Record<string, number> = {};
  const constraintRoles: Record<string, number> = {};

  let componentsWithThickness = 0;
  let componentsWithHardware = 0;
  let componentsWithDrillings = 0;
  let componentsWithConstraintRole = 0;
  let hardwareLinks = 0;
  let drillingLinks = 0;

  const thicknessRows = meshes.map((mesh, index) => {
    const componentId = buildStablePartId(mesh, index);
    const displayName = mesh.displayName || mesh.meshName || `Componente ${index + 1}`;
    const dimensions = readCollisionDimensionsV1(mesh);
    const thickness = dimensions.panelThickness;

    if (thickness !== null) componentsWithThickness += 1;

    const hardwareItems = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(
        mesh.hardwareLinks,
        parseBagaStudioCsvField(mesh.hardware).map((hardwareType) => ({ hardwareType }))
      )
    );

    const drillingItems = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
    );

    if (hardwareItems.length > 0) componentsWithHardware += 1;
    if (drillingItems.length > 0) componentsWithDrillings += 1;

    hardwareLinks += hardwareItems.length;
    drillingLinks += drillingItems.length;

    hardwareItems.forEach((item) => {
      incrementInspectorCounterV1(
        hardwareCounter,
        item?.hardwareType || item?.type || item?.name || item?.label || item?.code
      );
    });

    drillingItems.forEach((item) => {
      incrementInspectorCounterV1(
        drillingCounter,
        item?.drillingType || item?.type || item?.name || item?.label || item?.code
      );
    });

    const role = String(mesh.constraintRole || "").trim();
    if (role) {
      componentsWithConstraintRole += 1;
      incrementInspectorCounterV1(constraintRoles, role);
    }

    return {
      componentId,
      displayName,
      thickness,
      status: thickness !== null ? "ready" as const : "missing" as const,
    };
  });

  const missingData: string[] = [];
  if (meshes.length === 0) missingData.push("Nessun componente disponibile per l'ispezione.");
  if (componentsWithThickness === 0) missingData.push("Spessori pannelli mancanti.");
  if (hardwareLinks === 0) missingData.push("Hardware links non rilevati.");
  if (drillingLinks === 0) missingData.push("Drilling links / forature non rilevati.");
  if (componentsWithConstraintRole === 0) missingData.push("Constraint role non rilevati.");

  const readiness =
    meshes.length > 0 &&
    componentsWithThickness > 0 &&
    hardwareLinks > 0 &&
    drillingLinks > 0 &&
    componentsWithConstraintRole > 0
      ? "READY_FOR_HARDWARE_ANALYZER_V2"
      : "MISSING_DATA_FOR_HARDWARE_ANALYZER_V2";

  return {
    schema: "bagastudio-manufacturing-data-inspector-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    totals: {
      components: meshes.length,
      componentsWithThickness,
      componentsWithoutThickness: meshes.length - componentsWithThickness,
      hardwareLinks,
      componentsWithHardware,
      drillingLinks,
      componentsWithDrillings,
      componentsWithConstraintRole,
    },
    constraintRoles,
    thicknessRows,
    hardwareSummary: Object.entries(hardwareCounter)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    drillingSummary: Object.entries(drillingCounter)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    missingData,
  };
}

function readCollisionPointV1(item: any) {
  return {
    x: readCollisionNumberV1(item?.x, item?.posX, item?.positionX, item?.left, item?.fromLeft, item?.offsetX, item?.position?.x),
    y: readCollisionNumberV1(item?.y, item?.posY, item?.positionY, item?.top, item?.fromTop, item?.offsetY, item?.position?.y),
    z: readCollisionNumberV1(item?.z, item?.posZ, item?.positionZ, item?.depth, item?.fromFace, item?.offsetZ, item?.position?.z),
    diameter: readCollisionNumberV1(item?.diameter, item?.dia, item?.radius ? Number(item.radius) * 2 : null),
    length: readCollisionNumberV1(item?.length, item?.hardwareLength, item?.depth, item?.drillingDepth),
    minThickness: readCollisionNumberV1(item?.minThickness, item?.requiredThickness, item?.minimumPanelThickness),
    label: String(item?.name || item?.label || item?.type || item?.hardwareType || item?.drillingType || item?.code || "elemento tecnico"),
  };
}

function readCollisionFootprintV15(point: ReturnType<typeof readCollisionPointV1>) {
  const diameter = point.diameter || 0;
  const length = point.length || 0;
  const radius = diameter > 0 ? diameter / 2 : Math.max(length / 2, 4);

  return Math.max(radius, 4);
}

function pushCollisionIssueV1(
  issues: CollisionEngineV1Issue[],
  issue: Omit<CollisionEngineV1Issue, "id">
) {
  const issueKey = [
    issue.componentId,
    issue.code,
    issue.targetType,
    issue.targetLabel,
    issue.axis || "none",
    issue.value ?? "none",
    issue.limit ?? "none",
  ].join("|");

  const alreadyExists = issues.some((existingIssue) => (
    [
      existingIssue.componentId,
      existingIssue.code,
      existingIssue.targetType,
      existingIssue.targetLabel,
      existingIssue.axis || "none",
      existingIssue.value ?? "none",
      existingIssue.limit ?? "none",
    ].join("|") === issueKey
  ));

  if (alreadyExists) return;

  issues.push({
    ...issue,
    id: `${issue.componentId}-${issue.code}-${issues.length + 1}`,
  });
}

function buildCollisionEngineV1Report(meshes: MeshConfig[]): CollisionEngineV1Report {
  const issues: CollisionEngineV1Issue[] = [];
  const minimumEdgeDistance = 5;
  const minimumHardwareDistance = 8;
  let checkedComponents = 0;
  let skippedComponents = 0;

  meshes.forEach((mesh, meshIndex) => {
    const componentId = mesh.partId || mesh.meshName || `component-${meshIndex + 1}`;
    const displayName = mesh.displayName || mesh.meshName || componentId;
    const dimensions = readCollisionDimensionsV1(mesh);
    const hasPanelBounds = dimensions.width !== null && dimensions.height !== null;

    const hardwareLinks = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.hardwareLinks, parseBagaStudioCsvField(mesh.hardware).map((hardwareType) => ({ hardwareType })))
    );

    const drillingLinks = normalizeCollisionArrayV1(
      parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []))
    );

    if (!hasPanelBounds) {
      skippedComponents += 1;

      if (hardwareLinks.length > 0 || drillingLinks.length > 0 || mesh.panelThickness) {
        pushCollisionIssueV1(issues, {
          componentId,
          meshName: mesh.meshName,
          displayName,
          code: "DIMENSIONS_MISSING",
          severity: "info",
          message: "Dimensioni pannello mancanti o incomplete: il controllo collisioni è stato preparato ma non può validare i limiti del pezzo.",
          targetType: "component",
          targetLabel: displayName,
          recommendation: "Compila il campo Dimensioni JSON con width/height/depth in mm per attivare i controlli geometrici.",
        });
      }

      return;
    }

    checkedComponents += 1;

    const checkTechnicalItem = (item: any, targetType: "hardware" | "drilling", index: number) => {
      const point = readCollisionPointV1(item);
      const targetLabel = `${point.label} #${index + 1}`;
      const footprint = readCollisionFootprintV15(point);
      const edgeLimit = Math.max(minimumEdgeDistance, footprint);

      ([
        ["x", point.x, dimensions.width],
        ["y", point.y, dimensions.height],
        ["z", point.z, dimensions.depth],
      ] as const).forEach(([axis, value, limit]) => {
        if (value === null || limit === null) return;

        if (value < 0 || value > limit) {
          pushCollisionIssueV1(issues, {
            componentId,
            meshName: mesh.meshName,
            displayName,
            code: targetType === "hardware" ? "HARDWARE_OUTSIDE_PANEL" : "DRILLING_OUTSIDE_PANEL",
            severity: "critical",
            message: `${targetLabel}: quota ${axis.toUpperCase()} fuori dal pannello.`,
            targetType,
            targetLabel,
            axis,
            value,
            limit,
            recommendation: "Correggi la quota o collega l'elemento a un riferimento parametrico valido prima dell'export produzione.",
          });
        }
      });

      if (point.x !== null && dimensions.width !== null && point.x >= 0 && point.x <= dimensions.width) {
        const edgeDistanceX = Math.min(point.x, dimensions.width - point.x);

        if (edgeDistanceX < edgeLimit) {
          pushCollisionIssueV1(issues, {
            componentId,
            meshName: mesh.meshName,
            displayName,
            code: "EDGE_CLEARANCE_VIOLATION",
            severity: "warning",
            message: `${targetLabel}: distanza dal bordo X inferiore alla soglia minima.`,
            targetType,
            targetLabel,
            axis: "edge",
            value: Number(edgeDistanceX.toFixed(2)),
            limit: edgeLimit,
            recommendation: "Aumenta la distanza dal bordo o modifica la regola parametrica del foro/ferramenta.",
          });
        }
      }

      if (point.y !== null && dimensions.height !== null && point.y >= 0 && point.y <= dimensions.height) {
        const edgeDistanceY = Math.min(point.y, dimensions.height - point.y);

        if (edgeDistanceY < edgeLimit) {
          pushCollisionIssueV1(issues, {
            componentId,
            meshName: mesh.meshName,
            displayName,
            code: "EDGE_CLEARANCE_VIOLATION",
            severity: "warning",
            message: `${targetLabel}: distanza dal bordo Y inferiore alla soglia minima.`,
            targetType,
            targetLabel,
            axis: "edge",
            value: Number(edgeDistanceY.toFixed(2)),
            limit: edgeLimit,
            recommendation: "Aumenta la distanza dal bordo o modifica la regola parametrica del foro/ferramenta.",
          });
        }
      }

      const requiredThickness = point.minThickness || point.length;
      if (requiredThickness !== null && dimensions.panelThickness !== null && requiredThickness > dimensions.panelThickness) {
        pushCollisionIssueV1(issues, {
          componentId,
          meshName: mesh.meshName,
          displayName,
          code: "THICKNESS_COMPATIBILITY_WARNING",
          severity: "warning",
          message: `${targetLabel}: elemento tecnico più profondo/spesso dello spessore pannello disponibile.`,
          targetType,
          targetLabel,
          axis: "thickness",
          value: requiredThickness,
          limit: dimensions.panelThickness,
          recommendation: "Verifica ferramenta, profondità foro o spessore pannello prima della rigenerazione CSV/CIX.",
        });
      }
    };

    hardwareLinks.forEach((item, index) => checkTechnicalItem(item, "hardware", index));
    drillingLinks.forEach((item, index) => checkTechnicalItem(item, "drilling", index));

    const technicalPointItems = [
      ...hardwareLinks.map((item, index) => ({ item, index, targetType: "hardware" as const, point: readCollisionPointV1(item) })),
      ...drillingLinks.map((item, index) => ({ item, index, targetType: "drilling" as const, point: readCollisionPointV1(item) })),
    ].filter(({ point }) => point.x !== null && point.y !== null);

    for (let firstIndex = 0; firstIndex < technicalPointItems.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < technicalPointItems.length; secondIndex += 1) {
        const first = technicalPointItems[firstIndex];
        const second = technicalPointItems[secondIndex];
        const dx = Number(first.point.x) - Number(second.point.x);
        const dy = Number(first.point.y) - Number(second.point.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const firstFootprint = readCollisionFootprintV15(first.point);
        const secondFootprint = readCollisionFootprintV15(second.point);
        const safeDistance = Math.max(minimumHardwareDistance, firstFootprint + secondFootprint);
        const isHardwareToHardware = first.targetType === "hardware" && second.targetType === "hardware";

        if (distance < safeDistance) {
          pushCollisionIssueV1(issues, {
            componentId,
            meshName: mesh.meshName,
            displayName,
            code: isHardwareToHardware ? "HARDWARE_HARDWARE_COLLISION" : "TECHNICAL_ITEM_COLLISION",
            severity: isHardwareToHardware ? "critical" : "warning",
            message: `${first.point.label} e ${second.point.label}: distanza tecnica insufficiente sul pannello.`,
            targetType: "component",
            targetLabel: `${first.point.label} ↔ ${second.point.label}`,
            axis: "pair",
            value: Number(distance.toFixed(2)),
            limit: Number(safeDistance.toFixed(2)),
            recommendation: isHardwareToHardware
              ? "Sposta una delle due ferramenta: la collisione può impedire montaggio, foratura o assemblaggio."
              : "Distanzia gli elementi o assegna regole parametriche separate per evitare sovrapposizioni in produzione.",
          });
        }
      }
    }
  });

  const totals = {
    components: meshes.length,
    checkedComponents,
    skippedComponents,
    critical: issues.filter((issue) => issue.severity === "critical").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
    issues: issues.length,
  };

  return {
    schema: "bagastudio-collision-engine-v1-5",
    version: 1.5,
    generatedAt: new Date().toISOString(),
    totals,
    issues,
  };
}

function buildHardwareAnalyzerV1(mesh: MeshConfig, partId: string, componentCategory: AutoMappingEngineV25ComponentCategory, runtimeRole: string) {
  const constraintRole = (mesh.constraintRole as ManufacturingConstraintRoleV1) || inferManufacturingConstraintRoleV1(componentCategory, mesh.category || "", mesh.displayName || mesh.meshName);
  const hardwareLinks = parseBagaStudioJsonField(mesh.hardwareLinks, parseBagaStudioCsvField(mesh.hardware).map((hardwareType) => ({
    hardwareType,
    quantity: 1,
    source: "hardware-field",
  })));
  const drillingLinks = parseBagaStudioJsonField(mesh.drillingLinks, parseBagaStudioJsonField(mesh.drillings, []));
  const dependencyParents = parseBagaStudioCsvField(mesh.dependencyParents);
  const dependencyChildren = parseBagaStudioCsvField(mesh.dependencyChildren);

  return {
    schema: "bagastudio-hardware-analyzer-v1",
    version: 1,
    componentId: partId,
    meshName: mesh.meshName,
    componentCategory,
    runtimeRole,
    constraintRole,
    dependencyGraph: {
      parents: dependencyParents,
      children: dependencyChildren,
    },
    hardwareLinks,
    drillingLinks,
    parametricRules: {
      preserveExternalDimensions: true,
      recalculateInternalDimensions: constraintRole === "STRUCTURAL" || constraintRole === "DERIVED",
      drillingReferenceMode: "parametric-prepared",
      defaultZRule: mesh.panelThickness ? "thickness / 2" : null,
    },
    validationTargets: {
      checkHardwareOutsidePanel: true,
      checkDrillingsOutsidePanel: true,
      checkMinimumEdgeDistance: true,
      checkHardwareCollisions: true,
      checkThicknessCompatibility: true,
    },
  };
}

function buildDefaultEdgeBanding(componentCategory: AutoMappingEngineV25ComponentCategory, runtimeRole: string) {
  const isPanelLike = ["top", "bottom", "back", "side_panel", "shelf", "door", "drawer_front", "divider", "countertop", "baseboard"].includes(componentCategory);
  if (!isPanelLike) {
    return {
      top: null,
      bottom: null,
      left: null,
      right: null,
      source: "not-panel",
    };
  }

  return {
    top: "ABS 1mm",
    bottom: "ABS 1mm",
    left: "ABS 1mm",
    right: "ABS 1mm",
    source: runtimeRole || "default-panel-rule",
  };
}

function buildManufacturingMetadataV31(mesh: MeshConfig, componentCategory: AutoMappingEngineV25ComponentCategory, runtimeRole: string) {
  const panelThickness = mesh.panelThickness ? Number(mesh.panelThickness) : null;
  const edgeBanding = parseBagaStudioJsonField(
    mesh.edgeBanding,
    buildDefaultEdgeBanding(componentCategory, runtimeRole)
  );
  const hardware = parseBagaStudioCsvField(mesh.hardware);
  const drillings = parseBagaStudioJsonField(mesh.drillings, []);
  const technicalPoints = parseBagaStudioJsonField(mesh.technicalPoints, []);
  const manufacturingData = parseBagaStudioJsonField(mesh.manufacturingData, {});

  return {
    schema: "bagastudio-manufacturing-metadata",
    version: "3.1",
    panelThickness,
    materialCode: String(mesh.materialCode || "").trim() || null,
    edgeBanding,
    hardware,
    drillings,
    technicalPoints,
    manufacturingData,
    source: "admin-panel-v3-1",
    readiness: {
      hasThickness: panelThickness !== null && Number.isFinite(panelThickness),
      hasMaterialCode: Boolean(String(mesh.materialCode || "").trim()),
      hasEdgeBanding: Boolean(edgeBanding),
      hasHardware: hardware.length > 0,
      hasDrillings: Array.isArray(drillings) && drillings.length > 0,
      hasTechnicalPoints: Array.isArray(technicalPoints) && technicalPoints.length > 0,
    },
  };
}

function buildProductPackageV3ComponentData(mesh: MeshConfig, componentCategory: AutoMappingEngineV25ComponentCategory, runtimeRole: string) {
  const dimensions = parseBagaStudioJsonField(mesh.dimensions, {
    width: null,
    height: null,
    depth: null,
    unit: "mm",
    source: "admin-manual-or-space3d-future",
  });

  const technicalPoints = parseBagaStudioJsonField(mesh.technicalPoints, []);
  const hardware = parseBagaStudioCsvField(mesh.hardware);
  const drillings = parseBagaStudioJsonField(mesh.drillings, []);
  const manufacturingData = parseBagaStudioJsonField(mesh.manufacturingData, {});
  const manufacturingMetadataV31 = buildManufacturingMetadataV31(mesh, componentCategory, runtimeRole);

  return {
    schema: "bagastudio-component-v3-data",
    version: 3.1,
    componentCategory,
    runtimeRole,
    dimensions,
    materialSlots: parseBagaStudioCsvField(mesh.materialSlots || "main"),
    compatibleAccessories: parseBagaStudioCsvField(mesh.compatibleAccessories),
    technicalPoints,
    assemblyOrder: Number(mesh.assemblyOrder || 0),
    panelThickness: mesh.panelThickness ? Number(mesh.panelThickness) : null,
    materialCode: String(mesh.materialCode || "").trim() || null,
    edgeBanding: manufacturingMetadataV31.edgeBanding,
    hardware,
    drillings,
    manufacturingData,
    manufacturingMetadata: manufacturingMetadataV31,
    manufacturingMetadataV31,
    parametricEditReady: true,
    csvRegenerationReady: Boolean(mesh.panelThickness || mesh.dimensions || mesh.hardware || mesh.drillings),
  };
}

function buildRuntimeComponentV2(mesh: MeshConfig, index: number) {
  const category = normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName);
  const partId = buildStablePartId({ ...mesh, category }, index);
  const runtimeRole = mesh.runtimeRole || guessRuntimeRole(mesh.displayName || mesh.meshName || partId, category);
  const componentCategory = (mesh.componentCategory || inferAutoMappingEngineV25ComponentCategory(mesh.displayName || mesh.meshName || partId, category).componentCategory) as AutoMappingEngineV25ComponentCategory;
  const componentType = mesh.componentType || (category === "panel" ? "configurable-panel" : `${category}-component`);
  const tags = buildRuntimeTags({ ...mesh, tags: `${mesh.tags || ""}, class:${componentCategory}` }, category, runtimeRole);

  const normalizeCsv = (value: string, fallback: string[] = []) => {
    const items = value
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : fallback;
    return Array.from(new Set(items));
  };

  const materialSlots = normalizeCsv(mesh.materialSlots, ["main"]);
  const componentV3Data = buildProductPackageV3ComponentData(mesh, componentCategory, runtimeRole);
  const hardwareAnalyzerV1 = buildHardwareAnalyzerV1(mesh, partId, componentCategory, runtimeRole);
  const compatibleAccessories =
    mesh.supportsAccessories === false
      ? []
      : normalizeCsv(mesh.compatibleAccessories, [
          ...(mesh.compatibleInsert ? ["insert"] : []),
          ...(mesh.compatibleLed ? ["led"] : []),
        ]);

  const isTop = runtimeRole === "top";
  const isSide = runtimeRole === "side";

  return {
    id: partId,
    partId,
    name: mesh.displayName,
    label: mesh.displayName,
    customerName: mesh.displayName,
    originalName: mesh.meshName,
    meshName: mesh.meshName,
    category,
    componentCategory,
    componentType,
    runtimeRole,
    tags,
    selectable: mesh.selectable !== false,
    visible: mesh.visible !== false,
    supportsMaterials: true,
    supportsVisibility: true,
    supportsAccessories: mesh.supportsAccessories !== false,
    compatibleLed: Boolean(mesh.compatibleLed),
    compatibleInsert: Boolean(mesh.compatibleInsert),
    materialSlots,
    dimensions: componentV3Data.dimensions,
    technicalPoints: componentV3Data.technicalPoints,
    assemblyOrder: componentV3Data.assemblyOrder,
    panelThickness: componentV3Data.panelThickness,
    materialCode: componentV3Data.materialCode,
    edgeBanding: componentV3Data.edgeBanding,
    hardware: componentV3Data.hardware,
    drillings: componentV3Data.drillings,
    manufacturingData: componentV3Data.manufacturingData,
    manufacturingMetadata: componentV3Data.manufacturingMetadataV31,
    manufacturingMetadataV31: componentV3Data.manufacturingMetadataV31,
    constraintRole: hardwareAnalyzerV1.constraintRole,
    dependencyGraph: hardwareAnalyzerV1.dependencyGraph,
    hardwareLinks: hardwareAnalyzerV1.hardwareLinks,
    drillingLinks: hardwareAnalyzerV1.drillingLinks,
    hardwareAnalyzerV1,
    productPackageV3: componentV3Data,
    allowedMaterialCategories:
      category === "mirror"
        ? ["mirror"]
        : category === "hardware"
        ? ["metal"]
        : ["wood", "marble", "metal", "mirror"],
    compatibleAccessories: Array.from(
      new Set([
        ...compatibleAccessories,
        ...(mesh.compatibleInsert ? ["insert"] : []),
        ...(mesh.compatibleLed ? ["led"] : []),
      ])
    ),
    runtimeMetadata: {
      schema: "bagastudio-runtime-component-metadata",
      version: 2,
      partId,
      meshName: mesh.meshName,
      displayName: mesh.displayName,
      category,
      componentCategory,
      componentType,
      runtimeRole,
      tags,
      bridgeTargets: {
        materials: true,
        visibility: true,
        led: Boolean(mesh.compatibleLed),
        insert: Boolean(mesh.compatibleInsert),
        accessories: mesh.supportsAccessories !== false,
        pricing: true,
        bom: true,
        technicalPoints: true,
        productPackageV3: true,
        hardwareAnalyzerV1: true,
        manufacturingConstraintsV1: true,
        parametricEdit: "prepared",
        csvRegeneration: "prepared",
      },
      productPackageV3: componentV3Data,
      manufacturingMetadataV31: componentV3Data.manufacturingMetadataV31,
      hardwareAnalyzerV1,
      constraintRole: hardwareAnalyzerV1.constraintRole,
      dependencyGraph: hardwareAnalyzerV1.dependencyGraph,
    },
    mountPoints: {
      ...(mesh.compatibleLed && {
        led: {
          frontOffset: Number(mesh.ledFrontOffset || 0),
          sideMargin: Number(mesh.ledSideMargin || 0),
          yOffset: Number(mesh.ledYOffset || 0),
          position: mesh.ledPosition || "front",
        },
      }),
      ...(mesh.compatibleInsert && {
        insert: {
          position: isTop
            ? ["top"]
            : isSide
            ? ["side"]
            : mesh.insertPosition
            ? mesh.insertPosition.split(",").map((item) => item.trim()).filter(Boolean)
            : ["front"],
          offset: {
            x: Number(mesh.insertOffsetX || 0),
            y: isTop ? 0.08 : Number(mesh.insertOffsetY || 0),
            z: isTop ? 0 : Number(mesh.insertOffsetZ || 1),
          },
        },
      }),
    },
  };
}


function getStableMeshName(rawName: string | undefined, index: number) {
  const cleanName = String(rawName || "").trim();
  return cleanName === "" || /^\d+$/.test(cleanName)
    ? `Mesh_${index + 1}`
    : cleanName;
}

function extractMeshesFromObject(object: THREE.Object3D) {
  const meshes: MeshConfig[] = [];

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      const rawName = mesh.name?.trim() || "";
      const meshName = getStableMeshName(rawName, meshes.length);

      const guessedName = guessPartName(mesh, meshes.length);

      meshes.push({
        meshName,
        displayName: guessedName,
        category: guessComponentCategory(guessedName),
        selectable: true,
        visible: true,
        compatibleLed: guessedName.includes("LED"),
        compatibleInsert: guessedName.includes("Inserto"),
        supportsAccessories: !["mirror", "lighting"].includes(guessComponentCategory(guessedName)),
        materialSlots:
          guessedName === "Piano"
            ? "top"
            : guessedName === "Frontale"
            ? "front"
            : guessedName === "Specchio"
            ? "mirror"
            : guessedName === "Maniglia"
            ? "metal"
            : "main",
        compatibleAccessories:
          guessedName.includes("LED")
            ? "led"
            : guessedName.includes("Inserto")
            ? "inserto"
            : "",
        dimensions: "",
        technicalPoints: "",
        assemblyOrder: "",
        panelThickness: "",
        materialCode: "",
        edgeBanding: "",
        hardware: guessedName === "Maniglia" ? guessedName : "",
        drillings: "",
        manufacturingData: "",
        constraintRole: "",
        hardwareLinks: "",
        drillingLinks: "",
        dependencyParents: "",
        dependencyChildren: "",
            ledPosition: "front",
            ledFrontOffset: "4",
ledSideMargin: "5",
ledYOffset: "0",

insertPosition: "front",
insertOffsetX: "0",
insertOffsetY: "0",
insertOffsetZ: "1",
      });
    }
  });

  return meshes;
}


function buildAdminImporterDiagnostic(
  fileName: string,
  extension: string,
  meshes: MeshConfig[],
  extraWarnings: string[] = [],
  extraErrors: string[] = []
): AdminImporterDiagnostic {
  const duplicateNames = Array.from(
    meshes.reduce((map, mesh) => {
      map.set(mesh.meshName, (map.get(mesh.meshName) || 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  const warnings = [
    ...extraWarnings,
    ...(meshes.length === 0 ? ["Nessuna mesh rilevata nel file importato."] : []),
    ...(extension === "stl"
      ? ["STL rilevato come singolo blocco: lo split geometrico avanzato resta una fase futura."]
      : []),
    ...(duplicateNames.length > 0
      ? [`Nomi mesh duplicati rilevati: ${duplicateNames.join(", ")}`]
      : []),
  ];

  const errors = [...extraErrors];
  const status: AdminImporterDiagnostic["status"] =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ready";

  return createAdminImporterDiagnostic({
    status,
    fileName,
    extension,
    meshCount: meshes.length,
    selectableCount: meshes.filter((mesh) => mesh.selectable).length,
    visibleCount: meshes.filter((mesh) => mesh.visible).length,
    ledReadyCount: meshes.filter((mesh) => mesh.compatibleLed).length,
    insertReadyCount: meshes.filter((mesh) => mesh.compatibleInsert).length,
    accessoryReadyCount: meshes.filter((mesh) => mesh.supportsAccessories !== false).length,
    message:
      status === "ready"
        ? "Import completato: componenti rilevati e mapping pronto."
        : status === "warning"
        ? "Import completato con avvisi: controlla mapping e componenti."
        : "Import non completato: controlla errori e formato file.",
    warnings,
    errors,
  });
}

function normalizeAdminMeshList(meshes: MeshConfig[]) {
  return meshes.map((mesh, index) => ({
    ...mesh,
    meshName: mesh.meshName || `Mesh_${index + 1}`,
    displayName: mesh.displayName || mesh.meshName || `Componente ${index + 1}`,
    category: normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName || ""),
    componentCategory: mesh.componentCategory || inferAutoMappingEngineV25ComponentCategory(mesh.displayName || mesh.meshName || "", mesh.category).componentCategory,
    partId: buildStablePartId(mesh, index),
    componentType: mesh.componentType || "",
    runtimeRole: mesh.runtimeRole || guessRuntimeRole(mesh.displayName || mesh.meshName || "", normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName || "")),
    tags: mesh.tags || "",
    selectable: mesh.selectable !== false,
    visible: mesh.visible !== false,
    supportsAccessories: mesh.supportsAccessories !== false,
    compatibleLed: Boolean(mesh.compatibleLed),
    compatibleInsert: Boolean(mesh.compatibleInsert),
    materialSlots: mesh.materialSlots || "main",
    compatibleAccessories: mesh.compatibleAccessories || "",
    ledPosition: mesh.ledPosition || "front",
    ledFrontOffset: mesh.ledFrontOffset || "4",
    ledSideMargin: mesh.ledSideMargin || "5",
    ledYOffset: mesh.ledYOffset || "0",
    insertPosition: mesh.insertPosition || "front",
    insertOffsetX: mesh.insertOffsetX || "0",
    insertOffsetY: mesh.insertOffsetY || "0",
    insertOffsetZ: mesh.insertOffsetZ || "1",
  }));
}


function inferAutoMappingEngineV25ComponentCategory(name: string, fallbackCategory = ""): AutoMappingEngineV25ClassifiedComponent {
  const source = `${name} ${fallbackCategory}`.toLowerCase();
  const has = (...words: string[]) => words.some((word) => source.includes(word));

  const make = (componentCategory: AutoMappingEngineV25ComponentCategory, confidence: number, reason: string): AutoMappingEngineV25ClassifiedComponent => ({
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

function classifyAutoMappingEngineV25Mesh(mesh: MeshConfig): MeshConfig {
  const classified = inferAutoMappingEngineV25ComponentCategory(
    mesh.displayName || mesh.meshName || "",
    mesh.category || ""
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
        [mesh.tags || "", "auto-mapping-v2.5", `class:${classified.componentCategory}`]
          .join(",")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ).join(", "),
  };
}

function buildAutoMappingEngineV25ClassificationReport(meshes: MeshConfig[]) {
  const classifiedComponents = meshes.map((mesh) => {
    const classified = inferAutoMappingEngineV25ComponentCategory(
      mesh.displayName || mesh.meshName || "",
      mesh.category || ""
    );

    return {
      ...classified,
      meshName: mesh.meshName,
      displayName: mesh.displayName || mesh.meshName,
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


const AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE = 60;
const AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE = 85;
const AUTO_MAPPING_ENGINE_V2_SAFE_QUALITY_SCORE = 80;

function normalizeAutoMappingV2Key(value: string) {
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

function inferAutoMappingV2Category(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("specchio") || lower.includes("mirror")) return "mirror";
  if (lower.includes("led")) return "lighting";
  if (lower.includes("maniglia") || lower.includes("cerniera") || lower.includes("basetta") || lower.includes("piede")) return "hardware";
  if (lower.includes("inserto") || lower.includes("marmo")) return "insert";
  if (
    lower.includes("fianco") ||
    lower.includes("fondo") ||
    lower.includes("cielo") ||
    lower.includes("schiena") ||
    lower.includes("ripiano") ||
    lower.includes("mensola") ||
    lower.includes("anta") ||
    lower.includes("cassetto") ||
    lower.includes("frontale") ||
    lower.includes("zoccolo") ||
    lower.includes("pannello") ||
    lower.includes("top") ||
    lower.includes("base")
  ) {
    return "panel";
  }

  return guessComponentCategory(name);
}

function inferAutoMappingV2MaterialSlots(name: string, category: string) {
  const lower = name.toLowerCase();

  if (category === "mirror") return "mirror";
  if (category === "hardware") return "metal";
  if (lower.includes("piano") || lower.includes("top")) return "top";
  if (lower.includes("frontale") || lower.includes("anta") || lower.includes("cassetto")) return "front";

  return "main";
}


type CixDrillingExtractorV1Item = {
  sourceFileName: string;
  macro: string;
  index: number;
  side: number | null;
  x: number | null;
  y: number | null;
  z: number | null;
  depth: number | null;
  diameter: number | null;
  repeatIndex: number;
  repeatCount: number;
};

function readCixParamNumberV1(value: unknown): number | null {
  const parsed = Number(String(value ?? "").replace(/\"/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCixMacroParamsV1(block: string): Record<string, string> {
  const params: Record<string, string> = {};
  const paramRegex = /PARAM,NAME=([^,\r\n]+),VALUE=([^\r\n]*)/g;
  let match: RegExpExecArray | null;

  while ((match = paramRegex.exec(block))) {
    const key = String(match[1] || "").trim();
    const rawValue = String(match[2] || "").trim();
    params[key] = rawValue.replace(/^\"|\"$/g, "");
  }

  return params;
}

function extractCixDrillingsV1(fileName: string, content: string): CixDrillingExtractorV1Item[] {
  const drillings: CixDrillingExtractorV1Item[] = [];
  const macroRegex = /NAME=(BV|BH)\s*([\s\S]*?)(?=\n\s*BEGIN MACRO|\n\s*END MACRO|$)/g;
  let match: RegExpExecArray | null;
  let macroIndex = 0;

  while ((match = macroRegex.exec(content))) {
    const macro = String(match[1] || "").trim();
    const block = String(match[2] || "");
    const params = parseCixMacroParamsV1(block);

    const x = readCixParamNumberV1(params.X);
    const y = readCixParamNumberV1(params.Y);
    const z = readCixParamNumberV1(params.Z);
    const dx = readCixParamNumberV1(params.DX) ?? 0;
    const dy = readCixParamNumberV1(params.DY) ?? 0;
    const side = readCixParamNumberV1(params.SIDE);
    const depth = readCixParamNumberV1(params.DP);
    const diameter = readCixParamNumberV1(params.DIA);
    const repeatRaw = readCixParamNumberV1(params.NRP);
    const repeatCount = repeatRaw && repeatRaw > 0 ? Math.max(1, Math.round(repeatRaw)) : 1;

    for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
      drillings.push({
        sourceFileName: fileName,
        macro,
        index: macroIndex,
        side,
        x: x === null ? null : x + dx * repeatIndex,
        y: y === null ? null : y + dy * repeatIndex,
        z,
        depth,
        diameter,
        repeatIndex,
        repeatCount,
      });
    }

    macroIndex += 1;
  }

  return drillings;
}

function readCixDrillingLinksFromPartV1(cixPart: unknown): string {
  const raw = (cixPart as { drillingLinks?: unknown })?.drillingLinks;
  const serializedRaw = typeof raw === "string" ? raw : raw ? JSON.stringify(raw) : undefined;
  const links = normalizeCollisionArrayV1(parseBagaStudioJsonField(serializedRaw, []));
  return links.length > 0 ? JSON.stringify(links) : "";
}

function buildAutoMappingV2MeshFromMatch(match: CsvCixMatch, index: number): MeshConfig {
  const csvName = match.csvPart?.name || `Componente CSV ${index + 1}`;
  const cixName = match.cixPart?.partName || match.cixPart?.fileName || csvName;
  const displayName = csvName || cixName;
  const category = normalizeComponentCategory(inferAutoMappingV2Category(displayName), displayName);
  const componentCategory = inferAutoMappingEngineV25ComponentCategory(displayName, category).componentCategory;
  const runtimeRole = guessRuntimeRole(displayName, category);
  const isPanel = category === "panel";

  return {
    meshName: `auto_v2_${String(index + 1).padStart(3, "0")}_${slugifyBagaStudioId(cixName, "part")}`,
    displayName,
    category,
    componentCategory,
    partId: `auto_v2_${String(index + 1).padStart(3, "0")}_${slugifyBagaStudioId(displayName, "part")}`,
    componentType: isPanel ? "configurable-panel" : `${category}-component`,
    runtimeRole,
    tags: [
      "auto-mapping-v2",
      "space3d",
      match.cixPart ? "cix-linked" : "csv-only",
      runtimeRole,
      category,
    ].filter(Boolean).join(", "),
    selectable: true,
    visible: true,
    compatibleLed: isPanel || displayName.toLowerCase().includes("led"),
    compatibleInsert: isPanel,
    supportsAccessories: !["mirror", "lighting"].includes(category),
    materialSlots: inferAutoMappingV2MaterialSlots(displayName, category),
    compatibleAccessories: isPanel ? "led, insert" : category === "hardware" ? "hardware" : "",
    drillingLinks: readCixDrillingLinksFromPartV1(match.cixPart),
    ledPosition: "front",
    ledFrontOffset: "4",
    ledSideMargin: "5",
    ledYOffset: "0",
    insertPosition: runtimeRole === "top" ? "top" : runtimeRole === "side" ? "side" : "front",
    insertOffsetX: "0",
    insertOffsetY: runtimeRole === "top" ? "0.08" : "0",
    insertOffsetZ: runtimeRole === "top" ? "0" : "1",
  };
}

function mergeAutoMappingV2MatchIntoMesh(mesh: MeshConfig, match: CsvCixMatch, index: number): MeshConfig {
  const mapped = buildAutoMappingV2MeshFromMatch(match, index);
  const nextTags = Array.from(
    new Set(
      [mesh.tags || "", mapped.tags, "production-linked"]
        .join(",")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).join(", ");

  return {
    ...mesh,
    displayName: mesh.displayName?.trim() ? mesh.displayName : mapped.displayName,
    category: normalizeComponentCategory(mesh.category || mapped.category, mesh.displayName || mapped.displayName),
    componentCategory: mesh.componentCategory || mapped.componentCategory,
    partId: mesh.partId || mapped.partId,
    componentType: mesh.componentType || mapped.componentType,
    runtimeRole: mesh.runtimeRole || mapped.runtimeRole,
    tags: nextTags,
    selectable: mesh.selectable !== false,
    visible: mesh.visible !== false,
    compatibleLed: Boolean(mesh.compatibleLed || mapped.compatibleLed),
    compatibleInsert: Boolean(mesh.compatibleInsert || mapped.compatibleInsert),
    supportsAccessories: mesh.supportsAccessories !== false,
    materialSlots: mesh.materialSlots || mapped.materialSlots,
    compatibleAccessories: mesh.compatibleAccessories || mapped.compatibleAccessories,
    drillingLinks: mesh.drillingLinks || mapped.drillingLinks,
    ledPosition: mesh.ledPosition || mapped.ledPosition,
    ledFrontOffset: mesh.ledFrontOffset || mapped.ledFrontOffset,
    ledSideMargin: mesh.ledSideMargin || mapped.ledSideMargin,
    ledYOffset: mesh.ledYOffset || mapped.ledYOffset,
    insertPosition: mesh.insertPosition || mapped.insertPosition,
    insertOffsetX: mesh.insertOffsetX || mapped.insertOffsetX,
    insertOffsetY: mesh.insertOffsetY || mapped.insertOffsetY,
    insertOffsetZ: mesh.insertOffsetZ || mapped.insertOffsetZ,
  };
}


function buildAutoMappingEngineV2ReviewQueue(params: {
  riskyMatches: string[];
  lowConfidenceMatches: string[];
  placeholderComponents: string[];
  qualityLevel: AutoMappingEngineV2ReportState["qualityLevel"];
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

function evaluateAutoMappingEngineV2Quality(params: {
  totalMatches: number;
  eligibleMatches: number;
  appliedMatches: number;
  createdPlaceholders: number;
  skippedLowConfidence: number;
  averageConfidence: number;
  riskyMatches: string[];
}): Pick<AutoMappingEngineV2ReportState, "qualityScore" | "qualityLevel" | "recommendedActions"> {
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

  const qualityLevel =
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

export {
  MeshConfig,
  BAGASTUDIO_ADMIN_AUTOSAVE_KEY,
  BAGASTUDIO_PRODUCT_LIBRARY_KEY,
  BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMATS,
  BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMAT_LABEL,
  ProductLibraryItem,
  AdminImporterDiagnostic,
  createAdminImporterDiagnostic,
  Space3DAnalyzerComponent,
  Space3DAnalyzerMaterial,
  Space3DAnalyzerReport,
  GeometryCompletionReport,
  CsvCixMatcherReportState,
  AutoMappingEngineV2ReviewItem,
  AutoMappingEngineV2ReportState,
  AutoMappingEngineV25ComponentCategory,
  AutoMappingEngineV25ClassifiedComponent,
  AutoMappingEngineV25ClassificationSummary,
  SPACE3D_SUPPORTED_FORMATS,
  SPACE3D_CSV_SUPPORTED_FORMATS,
  SPACE3D_CIX_SUPPORTED_FORMATS,
  SPACE3D_COMPONENT_KEYWORDS,
  SPACE3D_MATERIAL_KEYWORDS,
  normalizeSpace3DToken,
  uniqueByLowercase,
  guessSpace3DCategory,
  guessSpace3DMaterialCategory,
  buildSpace3DAnalyzerReport,
  space3DReportToMeshConfigs,
  DEFAULT_PRODUCT_MATERIALS,
  DEFAULT_PRODUCT_VIEWS,
  downloadJsonFile,
  guessPartName,
  guessComponentCategory,
  slugifyBagaStudioId,
  buildStablePartId,
  guessRuntimeRole,
  buildRuntimeTags,
  normalizeComponentCategory,
  parseBagaStudioCsvField,
  parseBagaStudioJsonField,
  ManufacturingConstraintRoleV1,
  inferManufacturingConstraintRoleV1,
  CollisionEngineV1Severity,
  CollisionEngineV1Issue,
  CollisionEngineV1Report,
  readCollisionNumberV1,
  normalizeCollisionArrayV1,
  readCollisionDimensionsV1,
  CsvRegenerationV1Report,
  normalizeCsvRegenerationKey,
  csvRegenerationEscape,
  buildCsvRegenerationV1Report,
  buildCsvRegenerationV1Csv,
  downloadCsvTextFile,
  ManufacturingDataInspectorV1Report,
  incrementInspectorCounterV1,
  readThicknessFromCsvRegenerationBridgeV1,
  buildManufacturingDataInspectorV1Report,
  readCollisionPointV1,
  readCollisionFootprintV15,
  pushCollisionIssueV1,
  buildCollisionEngineV1Report,
  buildHardwareAnalyzerV1,
  buildDefaultEdgeBanding,
  buildManufacturingMetadataV31,
  buildProductPackageV3ComponentData,
  buildRuntimeComponentV2,
  getStableMeshName,
  extractMeshesFromObject,
  buildAdminImporterDiagnostic,
  normalizeAdminMeshList,
  inferAutoMappingEngineV25ComponentCategory,
  classifyAutoMappingEngineV25Mesh,
  buildAutoMappingEngineV25ClassificationReport,
  AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE,
  AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE,
  AUTO_MAPPING_ENGINE_V2_SAFE_QUALITY_SCORE,
  normalizeAutoMappingV2Key,
  inferAutoMappingV2Category,
  inferAutoMappingV2MaterialSlots,
  CixDrillingExtractorV1Item,
  readCixParamNumberV1,
  parseCixMacroParamsV1,
  extractCixDrillingsV1,
  readCixDrillingLinksFromPartV1,
  buildAutoMappingV2MeshFromMatch,
  mergeAutoMappingV2MatchIntoMesh,
  buildAutoMappingEngineV2ReviewQueue,
  evaluateAutoMappingEngineV2Quality
};
