// @ts-nocheck
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Bounds } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { resolveDaeHierarchy } from "@/lib/importer/daeHierarchyResolver";
import { buildImporterReport } from "@/lib/importer/importerReportBuilder";
import { convertDaeToRuntimeGlb } from "@/lib/importer/runtimeGlbConverter";
import { parseCixFiles, type CixPart } from "@/lib/importer/cixParser";
import {
  buildCsvCixMatcherReport,
  matchCsvPartsToCixParts,
  parseSpazio3DCsv,
  type CsvCixMatch,
  type CsvPart,
} from "@/lib/importer/csvCixMatcher";
import { buildEvidenceToRenderArBridgeV47Report } from "@/lib/layout-room-intelligence/evidenceToRenderArBridgeV47";
import { buildTechnicalEvidenceApprovalV46Report } from "@/lib/layout-room-intelligence/technicalEvidenceApprovalV46";
import { buildAiTechnicalSuggestionsV45Report } from "@/lib/layout-room-intelligence/aiTechnicalSuggestionsV45";
import { buildAutomaticWallClassificationV44Report } from "@/lib/layout-room-intelligence/automaticWallClassificationV44";
import { buildWallEvidenceFusionV43Report } from "@/lib/layout-room-intelligence/wallEvidenceFusionV43";
import { buildWallDwgDxfEvidenceV42Report } from "@/lib/layout-room-intelligence/wallDwgDxfEvidenceV42";
import { buildWallPhotoEvidenceV41Report } from "@/lib/layout-room-intelligence/wallPhotoEvidenceV41";
import { buildWallAssistedRecognitionV40Report } from "@/lib/layout-room-intelligence/wallAssistedRecognitionV40";
import { buildTechnicalApprovalWorkflowV39Report } from "@/lib/layout-room-intelligence/technicalApprovalWorkflowV39";
import { buildInstallerChecklistEngineV38Report } from "@/lib/layout-room-intelligence/installerChecklistEngineV38";
import { buildInstallationRiskEngineV37Report } from "@/lib/layout-room-intelligence/installationRiskEngineV37";
import { buildWallTechnicalReportV36Report } from "@/lib/layout-room-intelligence/technicalWallReportV36";
import { buildWallIntelligenceMirrorShelfValidatorV35Report } from "@/lib/layout-room-intelligence/mirrorShelfValidatorV35";
import { buildWallIntelligenceFixingRecommendationV34Report } from "@/lib/layout-room-intelligence/fixingRecommendationEngineV34";
import { buildWallIntelligenceLoadAnalyzerV33Report } from "@/lib/layout-room-intelligence/wallLoadAnalyzerV33";
import { buildWallIntelligenceConfidenceEngineV32Report } from "@/lib/layout-room-intelligence/wallConfidenceEngineV32";
import { buildWallIntelligenceGuidedDescriptionV31Report } from "@/lib/layout-room-intelligence/guidedWallDescriptionV31";
import { buildDynamicRuleRegistryV26Report } from "@/lib/layout-room-intelligence/dynamicRuleRegistryV26";
import { buildDynamicRuleAdminBridgeV27Report } from "@/lib/layout-room-intelligence/dynamicRuleAdminBridgeV27";
import { buildDynamicRulePackV28Report } from "@/lib/layout-room-intelligence/rulePackSystemV28";
import { buildDynamicRuleConflictResolverV29Report } from "@/lib/layout-room-intelligence/ruleConflictResolverV29";
import { buildWallIntelligenceEngineV30Report } from "@/lib/layout-room-intelligence/wallIntelligenceEngineV30";
import { buildLayoutRoomIntelligenceV25Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCoreRulesV25";
import { buildLayoutRoomIntelligenceV24Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCollisionChecksV24";
import { buildLayoutRoomIntelligenceV22Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceWallElevationV22";
import { buildLayoutRoomIntelligenceV23Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceTechnicalRulesV23";
import { buildLayoutRoomIntelligenceV21Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceChecklistRiskV21";
import { buildLayoutRoomIntelligenceV2Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCoreReportV20";
import {
  buildHardwareCompatibilityMatrixV1Report,
  type HardwareCompatibilityMatrixV1Report,
  type HardwareCompatibilityV1Item,
  type HardwareCompatibilityV1Status,
  type HardwareProductionGateV12,
} from "@/lib/layout-room-intelligence/hardwareCompatibilityMatrixV12";
import { buildSmartTechnicalValidatorV1Report } from "@/lib/layout-room-intelligence/smartTechnicalValidatorV10";
import {
  buildProductionReadinessGateV1Report,
  type ProductionReadinessGateV1Item,
  type ProductionReadinessGateV1Report,
  type ProductionReadinessGateV1Status,
} from "@/lib/layout-room-intelligence/productionReadinessGateV10";
import {
  buildParametricEditV1Report,
  type ParametricEditV1Item,
  type ParametricEditV1Report,
  type ParametricEditV1Status,
} from "@/lib/layout-room-intelligence/parametricEditV10";

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


type ManufacturingOverrideV1Report = {
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

function buildManufacturingOverrideV1Report(meshes: MeshConfig[], targetThicknessValue: string): ManufacturingOverrideV1Report {
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

function applyManufacturingOverrideV1(meshes: MeshConfig[], targetThicknessValue: string): MeshConfig[] {
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

function AdminGLBModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;

        gltf.scene.updateMatrixWorld(true);

        const previewGroup = new THREE.Group();
        let meshIndex = 0;

        gltf.scene.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;

          const sourceMesh = child as THREE.Mesh;
          const geometry = sourceMesh.geometry?.clone();
          if (!geometry) return;

          const meshName = getStableMeshName(sourceMesh.name, meshIndex);
          const isSelected = selectedMeshName === meshName;

          // Bake world transform into the geometry.
          // This avoids invisible GLB previews caused by nested groups, odd scales,
          // negative transforms, original material transparency, or camera fit issues.
          geometry.applyMatrix4(sourceMesh.matrixWorld);
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();

          const previewMesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: isSelected ? "#ffffff" : "#d9d9d9",
              roughness: 0.45,
              metalness: 0.05,
              side: THREE.DoubleSide,
              emissive: isSelected ? new THREE.Color("#2563eb") : new THREE.Color("#000000"),
              emissiveIntensity: isSelected ? 0.7 : 0,
            })
          );

          previewMesh.name = meshName;
          previewMesh.userData.bagastudioMeshName = meshName;
          previewMesh.castShadow = true;
          previewMesh.receiveShadow = true;
          previewMesh.frustumCulled = false;

          previewGroup.add(previewMesh);
          meshIndex += 1;
        });

        previewGroup.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(previewGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = Number.isFinite(maxDim) && maxDim > 0 ? 3 / maxDim : 1;

        if (meshIndex > 0 && !box.isEmpty()) {
          const debugBoxGeometry = new THREE.BoxGeometry(size.x || 0.01, size.y || 0.01, size.z || 0.01);
          const debugBoxMaterial = new THREE.MeshBasicMaterial({
            color: "#00e5ff",
            wireframe: true,
            transparent: true,
            opacity: 0.75,
          });
          const debugBox = new THREE.Mesh(debugBoxGeometry, debugBoxMaterial);
          debugBox.name = "BagaStudio_Runtime_GLB_Debug_Bounds";
          debugBox.position.copy(center);
          debugBox.userData.bagastudioDebugBounds = true;
          previewGroup.add(debugBox);

          const centerMarker = new THREE.Mesh(
            new THREE.SphereGeometry(Math.max(maxDim * 0.015, 0.01), 12, 12),
            new THREE.MeshBasicMaterial({ color: "#ff3b30" })
          );
          centerMarker.name = "BagaStudio_Runtime_GLB_Debug_Center";
          centerMarker.position.copy(center);
          centerMarker.userData.bagastudioDebugBounds = true;
          previewGroup.add(centerMarker);
        }

        if (meshIndex === 0) {
          console.warn("BagaStudio Admin GLB preview loaded without visible meshes", { url });
        }

        // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
        // This avoids imported FBX/OBJ/GLB models floating above or sinking below the grid
        // when their original pivot/origin comes from external 3D software.
        previewGroup.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale
        );
        previewGroup.scale.setScalar(scale);
        previewGroup.rotation.y = modelRotationY;
        previewGroup.updateMatrixWorld(true);

        console.log("BagaStudio Admin GLB preview loaded", {
          meshes: meshIndex,
          size: size.toArray(),
          center: center.toArray(),
          scale,
        });

        setObject(previewGroup);
      },
      undefined,
      (error) => {
        console.error("BagaStudio Admin GLB preview load error:", error);
        if (!cancelled) setObject(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}

function AdminSTLModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new STLLoader();

    loader.load(url, (loadedGeometry) => {
      loadedGeometry.computeVertexNormals();
      loadedGeometry.computeBoundingBox();

      const box = loadedGeometry.boundingBox;

      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;

        loadedGeometry.center();
        loadedGeometry.scale(scale, scale, scale);
        loadedGeometry.computeBoundingSphere();
      }

      setGeometry(loadedGeometry);
    });
  }, [url]);

  if (!geometry) return null;

  const meshName = "STL_Mesh";

  return (
    <mesh
      geometry={geometry}
      rotation={[0, modelRotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectMesh(meshName);
      }}
    >
      <meshStandardMaterial
        color={selectedMeshName === meshName ? "#ffffff" : "#ffcc66"}
        roughness={0.45}
        metalness={0.05}
        side={THREE.DoubleSide}
        emissive={selectedMeshName === meshName ? "#2563eb" : "#000000"}
        emissiveIntensity={selectedMeshName === meshName ? 0.7 : 0}
      />
    </mesh>
  );
}

function AdminOBJModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();

    loader.load(url, (loadedObject) => {
      let meshIndex = 0;
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const stableMeshName = getStableMeshName(mesh.name, meshIndex);
          mesh.name = stableMeshName;
          mesh.userData.bagastudioMeshName = stableMeshName;
          mesh.frustumCulled = false;

          mesh.material = new THREE.MeshStandardMaterial({
            color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
          });

          meshIndex += 1;
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
      loadedObject.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale
      );

      loadedObject.rotation.y = modelRotationY;
      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}
function AdminFBXModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new FBXLoader();

    loader.load(url, (loadedObject) => {
      let meshIndex = 0;
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const stableMeshName = getStableMeshName(mesh.name, meshIndex);
          mesh.name = stableMeshName;
          mesh.userData.bagastudioMeshName = stableMeshName;
          mesh.frustumCulled = false;

          mesh.material = new THREE.MeshStandardMaterial({
            color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
          });

          meshIndex += 1;
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
      loadedObject.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale
      );

      loadedObject.rotation.y = modelRotationY;
      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}


function AdminDAEModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new ColladaLoader();

    loader.load(
      url,
      (collada) => {
        if (cancelled) return;

        const daeScene = collada?.scene;
        if (!daeScene) {
          console.error("BagaStudio Admin DAE preview load error: scene not found");
          setObject(null);
          return;
        }

        let meshIndex = 0;

        daeScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const stableMeshName = getStableMeshName(mesh.name, meshIndex);
            mesh.name = stableMeshName;
            mesh.userData.bagastudioMeshName = stableMeshName;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;

            mesh.material = new THREE.MeshStandardMaterial({
              color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
              roughness: 0.45,
              metalness: 0.05,
              side: THREE.DoubleSide,
              emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
              emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
            });

            meshIndex += 1;
          }
        });

        const box = new THREE.Box3().setFromObject(daeScene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = Number.isFinite(maxDim) && maxDim > 0 ? 3 / maxDim : 1;

        daeScene.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale
        );

        daeScene.rotation.y = modelRotationY;
        daeScene.scale.setScalar(scale);
        daeScene.updateMatrixWorld(true);

        console.log("BagaStudio Admin DAE preview loaded", {
          meshes: meshIndex,
          size: size.toArray(),
          center: center.toArray(),
          scale,
        });

        const daeGroup = new THREE.Group();
daeGroup.name = daeScene.name || "DAE Preview";
daeGroup.position.copy(daeScene.position);
daeGroup.rotation.copy(daeScene.rotation);
daeGroup.scale.copy(daeScene.scale);
daeGroup.add(...daeScene.children);

setObject(daeGroup);
      },
      undefined,
      (error) => {
        console.error("BagaStudio Admin DAE preview load error:", error);
        if (!cancelled) setObject(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}


function AdminModelRouter({
  url,
  fileName,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  fileName: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const runtimeGlbObjectUrl =
    typeof window !== "undefined"
      ? (window as any)?.bagastudioLastRuntimeGlb?.objectUrl
      : null;

  const ext =
    runtimeGlbObjectUrl && runtimeGlbObjectUrl === url
      ? "glb"
      : fileName.split(".").pop()?.toLowerCase();

 if (ext === "glb" || ext === "gltf") {
  return (
   <AdminGLBModel
  url={url}
  selectedMeshName={selectedMeshName}
  onSelectMesh={onSelectMesh}
  modelRotationY={modelRotationY}
/>
  );
}

  if (ext === "stl") {
    return (
      <AdminSTLModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
        modelRotationY={modelRotationY}
      />
    );
  }

  if (ext === "obj") {
    return (
      <AdminOBJModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
        modelRotationY={modelRotationY}
      />
    );
  }
if (ext === "fbx") {
  return (
    <AdminFBXModel
      url={url}
      selectedMeshName={selectedMeshName}
      onSelectMesh={onSelectMesh}
      modelRotationY={modelRotationY}
    />
  );
}

if (ext === "dae") {
  return (
    <AdminDAEModel
      url={url}
      selectedMeshName={selectedMeshName}
      onSelectMesh={onSelectMesh}
      modelRotationY={modelRotationY}
    />
  );
}
  return null;
}
type AdminLanguage = "it" | "en";

const ADMIN_I18N = {
  it: {
    adminPanel: "Admin Panel",
    subtitle: "Importa modelli, configura componenti, materiali, accessori e genera il package JSON prodotto.",
    backViewer: "Torna al Viewer",
    downloadBackup: "Scarica backup",
    importer: "Importer",
    productCatalog: "Catalogo prodotti",
    materials: "Materiali",
    accessoriesPricing: "Accessori / Pricing",
    controlCenter: "Control Center",
    adminTools: "Admin Tools",
    toolsDesc: "Strumenti tecnici separati dal viewer cliente. Qui prepari package prodotto, mapping componenti e backup.",
    stepImport: "01 · Import modello",
    stepMapping: "02 · Mapping componenti",
    stepPackage: "03 · Product package",
    autosave: "Autosave",
    backupProject: "Backup progetto",
    backupDesc: "Autosave locale attivo. Usa backup manuale prima di modifiche importanti o prima di sostituire file.",
    restoreAutosave: "Ripristina autosave",
    importBackup: "Importa backup",
    import3d: "1. Importa modello 3D",
    formats: "Formati supportati: GLB, GLTF, DAE, FBX, OBJ, STL. GLB resta il formato finale consigliato per catalogo e configuratore.",
    rotation: "Rotazione",
    preview3d: "Preview 3D",
    mapping: "2. Mapping componenti",
    emptyMesh: "Qui comparirà la lista mesh del modello importato.",
    selectable: "Selezionabile",
    visible: "Visibile",
    ledCompatible: "Compatibile LED",
    insertCompatible: "Compatibile Inserto",
    ledPosition: "LED posizione",
    ledFrontOffset: "LED front offset",
    ledSideMargin: "LED side margin",
    ledYOffset: "LED Y offset",
    materialSlots: "Slot materiali",
    compatibleAccessories: "Accessori compatibili",
    componentCategory: "Categoria componente",
    supportsAccessories: "Supporta accessori",
    generatePackage: "3. Genera product package",
    productInfo: "Informazioni prodotto",
    productId: "ID prodotto",
    productName: "Nome prodotto",
    category: "Categoria",
    widthMin: "Larghezza min",
    widthDefault: "Larghezza default",
    widthMax: "Larghezza max",
    heightMin: "Altezza min",
    heightDefault: "Altezza default",
    heightMax: "Altezza max",
    depthMin: "Profondità min",
    depthDefault: "Profondità default",
    depthMax: "Profondità max",
    generateJson: "Genera JSON prodotto",
    noAutosaveLoaded: "Nessun autosave caricato",
    restoreCompleted: "Ripristino completato",
    dateUnavailable: "data non disponibile",
    autosaveAvailable: "Autosave disponibile",
    autosaveUnreadable: "Autosave presente ma non leggibile",
    noAutosaveAvailable: "Nessun autosave disponibile",
    noAutosaveToRestore: "Nessun autosave da ripristinare",
    autosaveError: "Errore: autosave non leggibile",
    backupFileError: "Errore: file backup non valido",
    chooseFile: "Scegli file",
    noFileSelected: "Nessun file selezionato",
    language: "Lingua",
    productLibrary: "Libreria prodotti",
    libraryDesc: "Salva e richiama package prodotto preparati nell’Admin.",
    saveToLibrary: "Salva in libreria",
    loadProduct: "Carica prodotto",
    deleteProduct: "Elimina",
    emptyLibrary: "Nessun prodotto salvato nella libreria.",
    librarySaved: "Prodotto salvato in libreria.",
  },
  en: {
    adminPanel: "Admin Panel",
    subtitle: "Import models, configure components, materials, accessories and generate the product JSON package.",
    backViewer: "Back to Viewer",
    downloadBackup: "Download backup",
    importer: "Importer",
    productCatalog: "Product catalog",
    materials: "Materials",
    accessoriesPricing: "Accessories / Pricing",
    controlCenter: "Control Center",
    adminTools: "Admin Tools",
    toolsDesc: "Technical tools separated from the client viewer. Here you prepare product packages, component mapping and backups.",
    stepImport: "01 · Import model",
    stepMapping: "02 · Component mapping",
    stepPackage: "03 · Product package",
    autosave: "Autosave",
    backupProject: "Project backup",
    backupDesc: "Local autosave is active. Use manual backup before important changes or before replacing files.",
    restoreAutosave: "Restore autosave",
    importBackup: "Import backup",
    import3d: "1. Import 3D model",
    formats: "Supported formats: GLB, GLTF, DAE, FBX, OBJ, STL. GLB remains the recommended final format for catalog and configurator.",
    rotation: "Rotation",
    preview3d: "3D Preview",
    mapping: "2. Component mapping",
    emptyMesh: "The imported model mesh list will appear here.",
    selectable: "Selectable",
    visible: "Visible",
    ledCompatible: "LED compatible",
    insertCompatible: "Insert compatible",
    ledPosition: "LED position",
    ledFrontOffset: "LED front offset",
    ledSideMargin: "LED side margin",
    ledYOffset: "LED Y offset",
    materialSlots: "Material slots",
    compatibleAccessories: "Compatible accessories",
    componentCategory: "Component category",
    supportsAccessories: "Supports accessories",
    generatePackage: "3. Generate product package",
    productInfo: "Product information",
    productId: "Product ID",
    productName: "Product name",
    category: "Category",
    widthMin: "Min width",
    widthDefault: "Default width",
    widthMax: "Max width",
    heightMin: "Min height",
    heightDefault: "Default height",
    heightMax: "Max height",
    depthMin: "Min depth",
    depthDefault: "Default depth",
    depthMax: "Max depth",
    generateJson: "Generate product JSON",
    noAutosaveLoaded: "No autosave loaded",
    restoreCompleted: "Restore completed",
    dateUnavailable: "date unavailable",
    autosaveAvailable: "Autosave available",
    autosaveUnreadable: "Autosave found but unreadable",
    noAutosaveAvailable: "No autosave available",
    noAutosaveToRestore: "No autosave to restore",
    autosaveError: "Error: autosave unreadable",
    backupFileError: "Error: invalid backup file",
    chooseFile: "Choose file",
    noFileSelected: "No file selected",
    language: "Language",
    productLibrary: "Product library",
    libraryDesc: "Save and recall product packages prepared in the Admin.",
    saveToLibrary: "Save to library",
    loadProduct: "Load product",
    deleteProduct: "Delete",
    emptyLibrary: "No products saved in the library.",
    librarySaved: "Product saved to library.",
  },
} as const;

export default function AdminPage() {

const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>("it");
const adminT = ADMIN_I18N[adminLanguage];

const [meshList, setMeshList] = useState<MeshConfig[]>([]);
const [importerDiagnostic, setImporterDiagnostic] = useState<AdminImporterDiagnostic>(() => createAdminImporterDiagnostic());
const [generatedJson, setGeneratedJson] = useState("");
const [productId, setProductId] = useState("new-product");
const [productName, setProductName] = useState("Nuovo prodotto");
const [productCategory, setProductCategory] = useState("custom");
const [productBrand, setProductBrand] = useState("BagaStudio Core");
const [packageVersion, setPackageVersion] = useState("2.0.0");
const [widthDefault, setWidthDefault] = useState(180);
const [widthMin, setWidthMin] = useState(100);
const [widthMax, setWidthMax] = useState(350);

const [heightDefault, setHeightDefault] = useState(100);
const [heightMin, setHeightMin] = useState(70);
const [heightMax, setHeightMax] = useState(150);

const [depthDefault, setDepthDefault] = useState(60);
const [depthMin, setDepthMin] = useState(40);
const [depthMax, setDepthMax] = useState(100);
const [modelFileName, setModelFileName] = useState("");
const [modelExtension, setModelExtension] = useState("glb");
const [modelPreviewUrl, setModelPreviewUrl] = useState("");
const [modelDataUrl, setModelDataUrl] = useState("");
const [selectedMeshName, setSelectedMeshName] = useState("");
const [selectedMeshPulse, setSelectedMeshPulse] = useState(0);
const [mapperSearch, setMapperSearch] = useState("");
const [mapperCategoryFilter, setMapperCategoryFilter] = useState("all");
const [modelRotationY, setModelRotationY] = useState(0);
const [meshThumbnails, setMeshThumbnails] = useState<Record<string, string>>({});
const [backupStatus, setBackupStatus] = useState<string>(ADMIN_I18N.it.noAutosaveLoaded);
const [productLibrary, setProductLibrary] = useState<ProductLibraryItem[]>([]);
const [librarySearch, setLibrarySearch] = useState("");
const [selectedLibraryProductId, setSelectedLibraryProductId] = useState("");
const [space3DFileName, setSpace3DFileName] = useState("");
const [space3DAnalyzerReport, setSpace3DAnalyzerReport] = useState<Space3DAnalyzerReport | null>(null);
const [space3DStatus, setSpace3DStatus] = useState("S3D analyzer in attesa");
const [space3DCsvFileName, setSpace3DCsvFileName] = useState("");
const [space3DCsvParts, setSpace3DCsvParts] = useState<CsvPart[]>([]);
const [space3DCixFileNames, setSpace3DCixFileNames] = useState<string[]>([]);
const [space3DCixParts, setSpace3DCixParts] = useState<CixPart[]>([]);
const [csvCixMatcherReport, setCsvCixMatcherReport] = useState<CsvCixMatcherReportState | null>(null);
const [csvCixStatus, setCsvCixStatus] = useState("CSV/CIX matcher in attesa");
const [autoMappingV2Report, setAutoMappingV2Report] = useState<AutoMappingEngineV2ReportState | null>(null);
const [autoMappingV2Status, setAutoMappingV2Status] = useState("Auto Mapping Engine V2 in attesa");
const [autoMappingV2LastSnapshot, setAutoMappingV2LastSnapshot] = useState<MeshConfig[] | null>(null);
const [autoMappingV2ReviewedLabels, setAutoMappingV2ReviewedLabels] = useState<Record<string, boolean>>({});
const [geometryCompletionReport, setGeometryCompletionReport] = useState<GeometryCompletionReport>({
  status: "idle",
  daeMeshCount: 0,
  s3dComponentCount: 0,
  matchedCount: 0,
  missingCount: 0,
  missingParts: [],
  generatedAt: "",
});
const autosaveHydratedRef = useRef(false);
const meshCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
const meshInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
const suppressNextMeshAutoScrollRef = useRef(false);

useEffect(() => {
  if (!selectedMeshName) return;

  if (suppressNextMeshAutoScrollRef.current) {
    suppressNextMeshAutoScrollRef.current = false;
    return;
  }

  meshCardRefs.current[selectedMeshName]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  setTimeout(() => {
    meshInputRefs.current[selectedMeshName]?.focus();
    meshInputRefs.current[selectedMeshName]?.select();
  }, 80);
}, [selectedMeshName, selectedMeshPulse]);

function selectMeshCard(meshName: string) {
  if (!meshName) return;

  flushSync(() => {
    setSelectedMeshName(meshName);
    setSelectedMeshPulse((value) => value + 1);
  });

  requestAnimationFrame(() => {
    meshCardRefs.current[meshName]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
}


function updateMeshConfig(meshName: string, patch: Partial<MeshConfig>) {
  if (!meshName) return;

  setMeshList((current) =>
    current.map((item) =>
      item.meshName === meshName ? { ...item, ...patch } : item
    )
  );
}

const mapperCategories = useMemo(() => {
  const categories = Array.from(
    new Set<string>(meshList.map((mesh) => mesh.category || "component"))
  );
  return categories.sort((a, b) => a.localeCompare(b));
}, [meshList]);

const filteredMapperMeshes = useMemo(() => {
  const query = mapperSearch.trim().toLowerCase();

  return meshList
    .map((mesh, index) => ({ mesh, index }))
    .filter(({ mesh }) => {
      const category = mesh.category || "component";
      const matchesCategory =
        mapperCategoryFilter === "all" || category === mapperCategoryFilter;

      const matchesSearch =
        query.length === 0 ||
        mesh.meshName.toLowerCase().includes(query) ||
        mesh.displayName.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
}, [meshList, mapperSearch, mapperCategoryFilter]);

const groupedMapperMeshes = useMemo(() => {
  const groups = new Map<string, Array<{ mesh: MeshConfig; index: number }>>();

  filteredMapperMeshes.forEach((item) => {
    const category = item.mesh.category || "component";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)?.push(item);
  });

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}, [filteredMapperMeshes]);

const filteredProductLibrary = useMemo(() => {
  const query = librarySearch.trim().toLowerCase();

  if (!query) return productLibrary;

  return productLibrary.filter((item) => {
    const haystack = [
      item.id,
      item.name,
      item.category,
      item.brand,
      item.sourceFileName,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}, [productLibrary, librarySearch]);

const selectedLibraryProduct = useMemo(() => {
  return productLibrary.find((item) => item.id === selectedLibraryProductId) || productLibrary[0] || null;
}, [productLibrary, selectedLibraryProductId]);

const adminDashboardStats = useMemo(() => {
  const ledReady = meshList.filter((mesh) => mesh.compatibleLed).length;
  const insertReady = meshList.filter((mesh) => mesh.compatibleInsert).length;
  const accessoryReady = meshList.filter((mesh) => mesh.supportsAccessories).length;
  const hiddenParts = meshList.filter((mesh) => !mesh.visible).length;
  const selectableParts = meshList.filter((mesh) => mesh.selectable).length;

  return {
    products: productLibrary.length,
    components: meshList.length,
    selectableParts,
    hiddenParts,
    ledReady,
    insertReady,
    accessoryReady,
    hasModel: Boolean(modelPreviewUrl || modelDataUrl),
    hasJson: Boolean(generatedJson),
  };
}, [productLibrary, meshList, modelPreviewUrl, modelDataUrl, generatedJson]);


const selectedMapperMesh = useMemo(() => {
  return meshList.find((mesh) => mesh.meshName === selectedMeshName) || null;
}, [meshList, selectedMeshName]);

const importerReadiness = useMemo(() => {
  const hasSupportedFormat = ["glb", "gltf", "dae", "fbx", "obj", "stl"].includes(modelExtension);
  const hasComponents = meshList.length > 0;
  const hasMappedNames = meshList.every((mesh) => Boolean(mesh.displayName?.trim()));

  return {
    hasSupportedFormat,
    hasComponents,
    hasMappedNames,
    packageReady: Boolean(hasSupportedFormat && hasComponents && hasMappedNames),
  };
}, [modelExtension, meshList]);

const collisionEngineV1Report = useMemo(() => {
  return buildCollisionEngineV1Report(meshList);
}, [meshList]);

const [manufacturingOverrideThickness, setManufacturingOverrideThickness] = useState("17.8");

const manufacturingOverrideV1Report = useMemo(() => {
  return buildManufacturingOverrideV1Report(meshList, manufacturingOverrideThickness);
}, [meshList, manufacturingOverrideThickness]);

function downloadCollisionEngineV1Report() {
  downloadJsonFile(`bagastudio-collision-engine-v1-5-${Date.now()}.json`, collisionEngineV1Report);
}

function downloadManufacturingOverrideV1Report() {
  downloadJsonFile(`bagastudio-manufacturing-override-v1-${Date.now()}.json`, manufacturingOverrideV1Report);
}

function applyManufacturingOverrideThicknessV1() {
  setMeshList((current) => applyManufacturingOverrideV1(current, manufacturingOverrideThickness));
}


const csvRegenerationV1Report = useMemo(() => {
  return buildCsvRegenerationV1Report(
    space3DCsvParts,
    csvCixMatcherReport?.matches || [],
    meshList,
    manufacturingOverrideThickness,
    space3DCsvFileName
  );
}, [space3DCsvParts, csvCixMatcherReport, meshList, manufacturingOverrideThickness, space3DCsvFileName]);

function downloadCsvRegenerationV1Report() {
  downloadJsonFile(`bagastudio-csv-regeneration-v1-${Date.now()}.json`, csvRegenerationV1Report);
}

function downloadRegeneratedCsvV1() {
  downloadCsvTextFile(`bagastudio-rigenerato-${Date.now()}.csv`, buildCsvRegenerationV1Csv(csvRegenerationV1Report));
}



type HardwareAnalyzerV2ThicknessItem = {
  componentId: string;
  displayName: string;
  originalThickness: number | null;
  targetThickness: number | null;
  status: "compatible" | "incompatible" | "skipped" | "missing";
  severity: "ok" | "warning" | "error";
  note: string;
};

type HardwareAnalyzerV2ThicknessReport = {
  schema: "bagastudio-hardware-analyzer-v2-thickness";
  version: 2;
  generatedAt: string;
  productionStatus: "PRODUCTION_READY" | "PRODUCTION_BLOCKED";
  targetThickness: number | null;
  totals: {
    analyzed: number;
    compatible: number;
    incompatible: number;
    skipped: number;
    missing: number;
  };
  items: HardwareAnalyzerV2ThicknessItem[];
};

function buildHardwareAnalyzerV2ThicknessReport(
  csvReport: CsvRegenerationV1Report,
  targetThickness: number | null
): HardwareAnalyzerV2ThicknessReport {
  const items: HardwareAnalyzerV2ThicknessItem[] = csvReport.rows.map((row, index) => {
    const originalThickness = readCollisionNumberV1(row.originalThickness);
    const regeneratedThickness = readCollisionNumberV1(row.regeneratedThickness, targetThickness);

    if (originalThickness === null) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: regeneratedThickness,
        status: "missing",
        severity: "warning",
        note: "Spessore originale non rilevato: controllo compatibilità non eseguibile.",
      };
    }

    if (row.status === "skipped") {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "skipped",
        severity: "ok",
        note: "Componente escluso dalle regole produttive: spessore mantenuto invariato.",
      };
    }

    const isThinPanel = originalThickness <= 6;
    const isManualCheck = originalThickness > 6 && originalThickness < 12;

    if (isThinPanel) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "skipped",
        severity: "ok",
        note: "Pannello sottile protetto: non deve seguire l'override spessore.",
      };
    }

    if (isManualCheck) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "incompatible",
        severity: "warning",
        note: "Spessore intermedio 6-12 mm: richiede controllo manuale prima della produzione.",
      };
    }

    if (regeneratedThickness === null) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: null,
        status: "missing",
        severity: "warning",
        note: "Spessore target non disponibile.",
      };
    }

    return {
      componentId: `${index}-${row.name}`,
      displayName: row.name,
      originalThickness,
      targetThickness: regeneratedThickness,
      status: "compatible",
      severity: "ok",
      note: "Compatibile con override spessore e regole produttive.",
    };
  });

  const totals = {
    analyzed: items.length,
    compatible: items.filter((item) => item.status === "compatible").length,
    incompatible: items.filter((item) => item.status === "incompatible").length,
    skipped: items.filter((item) => item.status === "skipped").length,
    missing: items.filter((item) => item.status === "missing").length,
  };

  const productionStatus =
    totals.incompatible > 0 || totals.missing > 0
      ? "PRODUCTION_BLOCKED"
      : "PRODUCTION_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-thickness",
    version: 2,
    generatedAt: new Date().toISOString(),
    productionStatus,
    targetThickness,
    totals,
    items,
  };
}


const manufacturingDataInspectorV1Report = useMemo(() => {
  return buildManufacturingDataInspectorV1Report(meshList);
}, [meshList]);

function downloadManufacturingDataInspectorV1Report() {
  downloadJsonFile(`bagastudio-manufacturing-data-inspector-v1-${Date.now()}.json`, manufacturingDataInspectorV1Report);
}



type ConstraintInspectorV1Item = {
  componentId: string;
  displayName: string;
  role: string | null;
  source: "csvRegeneration" | "meshList" | "unknown";
  status: "present" | "missing";
};

type ConstraintInspectorV1Report = {
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

function inferConstraintRoleV1(name: unknown): string | null {
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

function buildConstraintInspectorV1Report(
  csvReport: CsvRegenerationV1Report,
  meshes: MeshConfig[]
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


const hardwareAnalyzerV2ThicknessReport = useMemo(() => {
  return buildHardwareAnalyzerV2ThicknessReport(csvRegenerationV1Report, readCollisionNumberV1(manufacturingOverrideThickness));
}, [csvRegenerationV1Report, manufacturingOverrideThickness]);

function downloadHardwareAnalyzerV2ThicknessReport() {
  downloadJsonFile(`bagastudio-hardware-analyzer-v2-thickness-${Date.now()}.json`, hardwareAnalyzerV2ThicknessReport);
}



type ConstraintValidationV21Item = {
  componentId: string;
  displayName: string;
  role: string | null;
  status: "valid" | "missing" | "invalid";
  severity: "ok" | "warning" | "error";
  note: string;
};

type ConstraintValidationV21Report = {
  schema: "bagastudio-hardware-analyzer-v2-1-constraint-validation";
  version: 21;
  generatedAt: string;
  validationStatus: "CONSTRAINT_READY" | "CONSTRAINT_BLOCKED";
  allowedRoles: string[];
  totals: {
    analyzed: number;
    valid: number;
    missing: number;
    invalid: number;
  };
  items: ConstraintValidationV21Item[];
};

const ALLOWED_CONSTRAINT_ROLES_V21 = [
  "externalPanel",
  "internalPanel",
  "backPanel",
  "shelf",
  "door",
  "topPanel",
  "bottomPanel",
  "plinth",
];

function buildConstraintValidationV21Report(
  inspectorReport: ConstraintInspectorV1Report
): ConstraintValidationV21Report {
  const items: ConstraintValidationV21Item[] = inspectorReport.items.map((item) => {
    const role = item.role ? String(item.role).trim() : null;

    if (!role) {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        role: null,
        status: "missing",
        severity: "warning",
        note: "Ruolo produttivo mancante: assegnare o correggere il constraintRole prima della validazione completa.",
      };
    }

    if (!ALLOWED_CONSTRAINT_ROLES_V21.includes(role)) {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        role,
        status: "invalid",
        severity: "error",
        note: `Ruolo non valido: "${role}". Usare uno dei ruoli ammessi.`,
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      role,
      status: "valid",
      severity: "ok",
      note: "Ruolo produttivo valido.",
    };
  });

  const totals = {
    analyzed: items.length,
    valid: items.filter((item) => item.status === "valid").length,
    missing: items.filter((item) => item.status === "missing").length,
    invalid: items.filter((item) => item.status === "invalid").length,
  };

  const validationStatus =
    totals.missing > 0 || totals.invalid > 0
      ? "CONSTRAINT_BLOCKED"
      : "CONSTRAINT_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-1-constraint-validation",
    version: 21,
    generatedAt: new Date().toISOString(),
    validationStatus,
    allowedRoles: ALLOWED_CONSTRAINT_ROLES_V21,
    totals,
    items,
  };
}


const constraintInspectorV1Report = useMemo(() => {
  return buildConstraintInspectorV1Report(csvRegenerationV1Report, meshList);
}, [csvRegenerationV1Report, meshList]);

function downloadConstraintInspectorV1Report() {
  downloadJsonFile(`bagastudio-constraint-inspector-v1-${Date.now()}.json`, constraintInspectorV1Report);
}



type DrillingInspectorV1Item = {
  componentId: string;
  displayName: string;
  source: "csvRegeneration" | "meshList";
  drillings: number;
  diameters: string[];
  depths: string[];
  status: "present" | "missing";
};

type DrillingInspectorV1Report = {
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

function readDrillingNumberLabelV1(value: unknown): string | null {
  const parsed = readCollisionNumberV1(value);
  return parsed === null ? null : String(parsed);
}

function buildDrillingInspectorV1Report(
  csvReport: CsvRegenerationV1Report,
  meshes: MeshConfig[]
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


const constraintValidationV21Report = useMemo(() => {
  return buildConstraintValidationV21Report(constraintInspectorV1Report);
}, [constraintInspectorV1Report]);

function downloadConstraintValidationV21Report() {
  downloadJsonFile(`bagastudio-constraint-validation-v2-1-${Date.now()}.json`, constraintValidationV21Report);
}



type DrillingValidationV22Status = "valid" | "warning" | "error";

type DrillingValidationV22Issue = {
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

type DrillingValidationV22Report = {
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

function buildDrillingValidationV22Report(meshes: MeshConfig[]): DrillingValidationV22Report {
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


const drillingInspectorV1Report = useMemo(() => {
  return buildDrillingInspectorV1Report(csvRegenerationV1Report, meshList);
}, [csvRegenerationV1Report, meshList]);

function downloadDrillingInspectorV1Report() {
  downloadJsonFile(`bagastudio-drilling-inspector-v1-${Date.now()}.json`, drillingInspectorV1Report);
}



type HardwareCollisionV23Issue = {
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

type HardwareCollisionV23Report = {
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

function buildHardwareCollisionV23Report(meshes: MeshConfig[]): HardwareCollisionV23Report {
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


const drillingValidationV22Report = useMemo(() => {
  return buildDrillingValidationV22Report(meshList);
}, [meshList]);

function downloadDrillingValidationV22Report() {
  downloadJsonFile(`bagastudio-drilling-validation-v2-2-${Date.now()}.json`, drillingValidationV22Report);
}



type HardwarePatternRecognitionV1Type = "hinge" | "minifix" | "shelfPin" | "unknown";

type HardwarePatternRecognitionV1Item = {
  componentId: string;
  displayName: string;
  patternType: HardwarePatternRecognitionV1Type;
  label: string;
  confidence: number;
  drillingIndexes: number[];
  reason: string;
};

type HardwarePatternRecognitionV1Report = {
  schema: "bagastudio-hardware-pattern-recognition-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    patterns: number;
    hinges: number;
    minifix: number;
    shelfPins: number;
    unknown: number;
  };
  items: HardwarePatternRecognitionV1Item[];
};

function buildHardwarePatternRecognitionV1Report(meshes: MeshConfig[]): HardwarePatternRecognitionV1Report {
  const items: HardwarePatternRecognitionV1Item[] = [];

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
      depth: readCollisionNumberV1(item?.depth, item?.dp, item?.DP, item?.drillingDepth),
    })).filter((item) => item.x !== null && item.y !== null && item.diameter !== null);

    const usedIndexes = new Set<number>();

    drillingItems.filter((item) => Number(item.diameter) === 35).forEach((mainHole) => {
      const nearSmallHoles = drillingItems.filter((item) => {
        if (item.drillingIndex === mainHole.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        if (![5, 8, 10].includes(Number(item.diameter))) return false;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(mainHole.x), 2) + Math.pow(Number(item.y) - Number(mainHole.y), 2));
        return distance >= 15 && distance <= 60;
      });

      if (nearSmallHoles.length >= 1) {
        const drillingIndexes = [mainHole.drillingIndex, ...nearSmallHoles.slice(0, 2).map((item) => item.drillingIndex)];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "hinge",
          label: "Cerniera",
          confidence: nearSmallHoles.length >= 2 ? 90 : 78,
          drillingIndexes,
          reason: "Foro Ø35 con fori ausiliari vicini: probabile cerniera.",
        });
      }
    });

    drillingItems.filter((item) => Number(item.diameter) === 15 && !usedIndexes.has(item.drillingIndex)).forEach((mainHole) => {
      const linkedHole = drillingItems.find((item) => {
        if (item.drillingIndex === mainHole.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        if (![8, 10].includes(Number(item.diameter))) return false;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(mainHole.x), 2) + Math.pow(Number(item.y) - Number(mainHole.y), 2));
        return distance >= 20 && distance <= 45;
      });

      if (linkedHole) {
        const drillingIndexes = [mainHole.drillingIndex, linkedHole.drillingIndex];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "minifix",
          label: "Minifix / giunzione",
          confidence: 82,
          drillingIndexes,
          reason: "Foro Ø15 con foro collegato vicino: probabile minifix o giunzione pannello.",
        });
      }
    });

    const diameter5 = drillingItems.filter((item) => Number(item.diameter) === 5 && !usedIndexes.has(item.drillingIndex));
    for (let firstIndex = 0; firstIndex < diameter5.length; firstIndex += 1) {
      const first = diameter5[firstIndex];
      if (usedIndexes.has(first.drillingIndex)) continue;

      const aligned = diameter5.filter((item) => {
        if (item.drillingIndex === first.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        const sameX = Math.abs(Number(item.x) - Number(first.x)) <= 1.5;
        const sameY = Math.abs(Number(item.y) - Number(first.y)) <= 1.5;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(first.x), 2) + Math.pow(Number(item.y) - Number(first.y), 2));
        return (sameX || sameY) && distance >= 16 && distance <= 96;
      });

      if (aligned.length >= 1) {
        const drillingIndexes = [first.drillingIndex, ...aligned.slice(0, 3).map((item) => item.drillingIndex)];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "shelfPin",
          label: "Reggipiano / foro serie",
          confidence: aligned.length >= 2 ? 86 : 72,
          drillingIndexes,
          reason: "Fori Ø5 allineati: probabile reggipiano o serie tecnica.",
        });
      }
    }

    const remaining = drillingItems.filter((item) => !usedIndexes.has(item.drillingIndex));
    if (remaining.length > 0) {
      items.push({
        componentId,
        displayName,
        patternType: "unknown",
        label: "Forature non classificate",
        confidence: 0,
        drillingIndexes: remaining.map((item) => item.drillingIndex),
        reason: "Forature presenti ma non riconosciute da Hardware Pattern Recognition V1.",
      });
    }
  });

  return {
    schema: "bagastudio-hardware-pattern-recognition-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: meshes.length,
      patterns: items.filter((item) => item.patternType !== "unknown").length,
      hinges: items.filter((item) => item.patternType === "hinge").length,
      minifix: items.filter((item) => item.patternType === "minifix").length,
      shelfPins: items.filter((item) => item.patternType === "shelfPin").length,
      unknown: items.filter((item) => item.patternType === "unknown").length,
    },
    items,
  };
}


const hardwareCollisionV23Report = useMemo(() => {
  return buildHardwareCollisionV23Report(meshList);
}, [meshList]);

function downloadHardwareCollisionV23Report() {
  downloadJsonFile(`bagastudio-hardware-collision-v2-3-${Date.now()}.json`, hardwareCollisionV23Report);
}





const hardwarePatternRecognitionV1Report = useMemo(() => {
  return buildHardwarePatternRecognitionV1Report(meshList);
}, [meshList]);

function downloadHardwarePatternRecognitionV1Report() {
  downloadJsonFile(`bagastudio-hardware-pattern-recognition-v1-${Date.now()}.json`, hardwarePatternRecognitionV1Report);
}



type HardwareLinkV1Item = {
  componentId: string;
  displayName: string;
  hardwareType: HardwarePatternRecognitionV1Type;
  hardwareLabel: string;
  trustedProfile: string | null;
  drillingIndexes: number[];
  confidence: number;
  compatibilityStatus: HardwareCompatibilityV1Status;
  status: "linked" | "ignored";
  note: string;
};

type HardwareLinksEngineV1Report = {
  schema: "bagastudio-hardware-links-engine-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    links: number;
    linkedComponents: number;
    validPatterns: number;
    ignoredPatterns: number;
  };
  items: HardwareLinkV1Item[];
};

function buildHardwareLinksEngineV1Report(
  patternReport: HardwarePatternRecognitionV1Report,
  compatibilityReport: HardwareCompatibilityMatrixV1Report
): HardwareLinksEngineV1Report {
  const compatibilityByKey = new Map<string, HardwareCompatibilityV1Item>();
  compatibilityReport.items.forEach((item) => {
    compatibilityByKey.set(`${item.componentId}__${item.hardwareLabel}`, item);
  });

  const items: HardwareLinkV1Item[] = patternReport.items.map((pattern) => {
    const compatibility = compatibilityByKey.get(`${pattern.componentId}__${pattern.label}`) || null;
    const isRecognized = pattern.patternType !== "unknown";
    const canLink = isRecognized && pattern.confidence > 0;

    return {
      componentId: pattern.componentId,
      displayName: pattern.displayName,
      hardwareType: pattern.patternType,
      hardwareLabel: pattern.label,
      trustedProfile: compatibility?.trustedProfile || null,
      drillingIndexes: pattern.drillingIndexes,
      confidence: pattern.confidence,
      compatibilityStatus: compatibility?.status || "unknown",
      status: canLink ? "linked" : "ignored",
      note: canLink
        ? "Link componente-ferramenta-forature creato da Pattern Recognition V1."
        : "Pattern non classificato: link non creato in Hardware Links Engine V1.",
    };
  });

  const linkedItems = items.filter((item) => item.status === "linked");
  const linkedComponents = new Set(linkedItems.map((item) => item.componentId)).size;

  return {
    schema: "bagastudio-hardware-links-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: patternReport.totals.components,
      links: linkedItems.length,
      linkedComponents,
      validPatterns: linkedItems.length,
      ignoredPatterns: items.filter((item) => item.status === "ignored").length,
    },
    items,
  };
}


const hardwareCompatibilityMatrixV1Report = useMemo(() => {
  return buildHardwareCompatibilityMatrixV1Report(hardwarePatternRecognitionV1Report, meshList);
}, [hardwarePatternRecognitionV1Report, meshList]);

function downloadHardwareCompatibilityMatrixV1Report() {
  downloadJsonFile(`bagastudio-hardware-compatibility-matrix-v1-2-${Date.now()}.json`, hardwareCompatibilityMatrixV1Report);
}



type ConstraintEngineV1Status = "ok" | "warning" | "error";

type ConstraintEngineV1Item = {
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

type ConstraintEngineV1Report = {
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

const CONSTRAINT_ENGINE_V1_SAFETY_MARGIN_MM = 2;
const CONSTRAINT_ENGINE_V1_THROUGH_TOLERANCE_MM = 0.1;

function readConstraintEngineV1DrillingItems(mesh: MeshConfig) {
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

function buildConstraintEngineV1Report(
  linksReport: HardwareLinksEngineV1Report,
  meshes: MeshConfig[],
  csvReport?: CsvRegenerationV1Report
): ConstraintEngineV1Report {
  const meshByComponentId = new Map<string, MeshConfig>();
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


const hardwareLinksEngineV1Report = useMemo(() => {
  return buildHardwareLinksEngineV1Report(hardwarePatternRecognitionV1Report, hardwareCompatibilityMatrixV1Report);
}, [hardwarePatternRecognitionV1Report, hardwareCompatibilityMatrixV1Report]);

function downloadHardwareLinksEngineV1Report() {
  downloadJsonFile(`bagastudio-hardware-links-engine-v1-${Date.now()}.json`, hardwareLinksEngineV1Report);
}


const constraintEngineV1Report = useMemo(() => {
  return buildConstraintEngineV1Report(hardwareLinksEngineV1Report, meshList, csvRegenerationV1Report);
}, [hardwareLinksEngineV1Report, meshList, csvRegenerationV1Report]);

function downloadConstraintEngineV1Report() {
  downloadJsonFile(`bagastudio-constraint-engine-v1-${Date.now()}.json`, constraintEngineV1Report);
}


const productionReadinessGateV1Report = useMemo(() => {
  return buildProductionReadinessGateV1Report(
    hardwareCompatibilityMatrixV1Report,
    constraintEngineV1Report,
    collisionEngineV1Report,
    meshList,
    buildStablePartId
  );
}, [hardwareCompatibilityMatrixV1Report, constraintEngineV1Report, collisionEngineV1Report, meshList]);

function downloadProductionReadinessGateV1Report() {
  downloadJsonFile(`bagastudio-production-readiness-gate-v1-${Date.now()}.json`, productionReadinessGateV1Report);
}


const parametricEditV1Report = useMemo(() => {
  return buildParametricEditV1Report(
    productionReadinessGateV1Report,
    csvRegenerationV1Report,
    meshList,
    manufacturingOverrideThickness,
    buildStablePartId
  );
}, [productionReadinessGateV1Report, csvRegenerationV1Report, meshList, manufacturingOverrideThickness]);

function downloadParametricEditV1Report() {
  downloadJsonFile(`bagastudio-parametric-edit-v1-${Date.now()}.json`, parametricEditV1Report);
}


type CsvRegenerationGuardV1Status = "ready" | "review" | "blocked";

type CsvRegenerationGuardV1Item = {
  rowIndex: number;
  name: string;
  status: CsvRegenerationGuardV1Status;
  csvStatus: "updated" | "unchanged" | "skipped";
  productionGate: ProductionReadinessGateV1Status | null;
  parametricStatus: ParametricEditV1Status | null;
  originalThickness: number | null;
  regeneratedThickness: number | null;
  externalDimensionsLocked: boolean;
  note: string;
};

type CsvRegenerationGuardV1Report = {
  schema: "bagastudio-csv-regeneration-guard-v1";
  version: 1;
  generatedAt: string;
  readiness: "CSV_READY" | "CSV_REVIEW_REQUIRED" | "CSV_BLOCKED";
  totals: {
    rows: number;
    ready: number;
    review: number;
    blocked: number;
    updatedRows: number;
    skippedRows: number;
    externalDimensionsLocked: number;
  };
  items: CsvRegenerationGuardV1Item[];
};

function buildCsvRegenerationGuardV1Report(
  csvReport: CsvRegenerationV1Report,
  parametricReport: ParametricEditV1Report,
  productionGateReport: ProductionReadinessGateV1Report
): CsvRegenerationGuardV1Report {
  const parametricByName = new Map<string, ParametricEditV1Item>();
  parametricReport.items.forEach((item) => {
    parametricByName.set(normalizeCsvRegenerationKey(item.displayName), item);
  });

  const productionByName = new Map<string, ProductionReadinessGateV1Item>();
  productionGateReport.items.forEach((item) => {
    productionByName.set(normalizeCsvRegenerationKey(item.displayName), item);
  });

  const items = csvReport.rows.map((row) => {
    const rowKey = normalizeCsvRegenerationKey(row.name);
    const parametric = parametricByName.get(rowKey) || null;
    const production = productionByName.get(rowKey) || null;

    let status: CsvRegenerationGuardV1Status = "ready";
    let note = "CSV rigenerabile: riga collegata e controlli produttivi senza blocchi.";

    if (production?.status === "blocked" || parametric?.status === "blocked") {
      status = "blocked";
      note = "Bloccato: Production Readiness Gate o Parametric Edit segnala errori da correggere prima della rigenerazione CSV.";
    } else if (row.status === "skipped") {
      status = "review";
      note = "Review richiesta: riga CSV saltata o non modificabile dalle regole correnti.";
    } else if (production?.status === "review" || parametric?.status === "review") {
      status = "review";
      note = "Review richiesta: controllare warning produttivi prima dell'export CSV definitivo.";
    } else if (!parametric?.externalDimensionsLocked) {
      status = "review";
      note = "Review richiesta: ingombro esterno non confermato/bloccato sul componente collegato.";
    }

    return {
      rowIndex: row.rowIndex,
      name: row.name,
      status,
      csvStatus: row.status,
      productionGate: production?.status || null,
      parametricStatus: parametric?.status || null,
      originalThickness: row.originalThickness,
      regeneratedThickness: row.regeneratedThickness,
      externalDimensionsLocked: Boolean(parametric?.externalDimensionsLocked),
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;

  return {
    schema: "bagastudio-csv-regeneration-guard-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness: blocked > 0 ? "CSV_BLOCKED" : review > 0 ? "CSV_REVIEW_REQUIRED" : "CSV_READY",
    totals: {
      rows: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      updatedRows: csvReport.totals.updatedRows,
      skippedRows: csvReport.totals.skippedRows,
      externalDimensionsLocked: items.filter((item) => item.externalDimensionsLocked).length,
    },
    items,
  };
}

const csvRegenerationGuardV1Report = useMemo(() => {
  return buildCsvRegenerationGuardV1Report(
    csvRegenerationV1Report,
    parametricEditV1Report,
    productionReadinessGateV1Report
  );
}, [csvRegenerationV1Report, parametricEditV1Report, productionReadinessGateV1Report]);

function downloadCsvRegenerationGuardV1Report() {
  downloadJsonFile(`bagastudio-csv-regeneration-guard-v1-${Date.now()}.json`, csvRegenerationGuardV1Report);
}

type FactoryExportPackageV1Readiness = "FACTORY_READY" | "FACTORY_REVIEW_REQUIRED" | "FACTORY_BLOCKED";

type FactoryExportPackageV1Report = {
  schema: "bagastudio-factory-export-package-v1";
  version: 1;
  generatedAt: string;
  readiness: FactoryExportPackageV1Readiness;
  product: {
    id: string;
    name: string;
    category: string;
    brand: string;
    packageVersion: string;
  };
  sources: {
    csvFileName: string | null;
    targetThickness: number | null;
    componentCount: number;
  };
  gates: {
    compatibilityMatrix: typeof hardwareCompatibilityMatrixV1Report;
    productionReadiness: ProductionReadinessGateV1Report;
    parametricEdit: ParametricEditV1Report;
    csvRegeneration: CsvRegenerationV1Report;
    csvGuard: CsvRegenerationGuardV1Report;
  };
  exports: {
    regeneratedCsv: string;
  };
  summary: {
    csvRows: number;
    csvUpdatedRows: number;
    csvBlockedRows: number;
    csvReviewRows: number;
    productionBlockedComponents: number;
    parametricBlockedComponents: number;
  };
  notes: string[];
};

function buildFactoryExportPackageV1Report(params: {
  productId: string;
  productName: string;
  productCategory: string;
  productBrand: string;
  packageVersion: string;
  componentCount: number;
  compatibilityMatrix: typeof hardwareCompatibilityMatrixV1Report;
  productionReadiness: ProductionReadinessGateV1Report;
  parametricEdit: ParametricEditV1Report;
  csvRegeneration: CsvRegenerationV1Report;
  csvGuard: CsvRegenerationGuardV1Report;
}): FactoryExportPackageV1Report {
  const readiness: FactoryExportPackageV1Readiness =
    params.csvGuard.readiness === "CSV_BLOCKED" || params.productionReadiness.totals.blocked > 0
      ? "FACTORY_BLOCKED"
      : params.csvGuard.readiness === "CSV_REVIEW_REQUIRED" || params.productionReadiness.totals.review > 0
        ? "FACTORY_REVIEW_REQUIRED"
        : "FACTORY_READY";

  const notes = [
    readiness === "FACTORY_READY"
      ? "Pacchetto pronto per export factory diagnostico."
      : readiness === "FACTORY_BLOCKED"
        ? "Export factory bloccato: correggere gli errori segnalati prima della produzione."
        : "Export factory richiede revisione tecnica prima della produzione.",
    "Il CSV rigenerato mantiene gli ingombri esterni e segnala righe saltate o non collegate.",
    "Questo pacchetto V1 è diagnostico: prima dell'uso in produzione serve validazione manuale su casi reali.",
  ];

  return {
    schema: "bagastudio-factory-export-package-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    product: {
      id: params.productId,
      name: params.productName,
      category: params.productCategory,
      brand: params.productBrand,
      packageVersion: params.packageVersion,
    },
    sources: {
      csvFileName: params.csvRegeneration.sourceCsvFileName,
      targetThickness: params.csvRegeneration.targetThickness,
      componentCount: params.componentCount,
    },
    gates: {
      compatibilityMatrix: params.compatibilityMatrix,
      productionReadiness: params.productionReadiness,
      parametricEdit: params.parametricEdit,
      csvRegeneration: params.csvRegeneration,
      csvGuard: params.csvGuard,
    },
    exports: {
      regeneratedCsv: buildCsvRegenerationV1Csv(params.csvRegeneration),
    },
    summary: {
      csvRows: params.csvRegeneration.totals.csvRows,
      csvUpdatedRows: params.csvRegeneration.totals.updatedRows,
      csvBlockedRows: params.csvGuard.totals.blocked,
      csvReviewRows: params.csvGuard.totals.review,
      productionBlockedComponents: params.productionReadiness.totals.blocked,
      parametricBlockedComponents: params.parametricEdit.totals.blocked,
    },
    notes,
  };
}

const factoryExportPackageV1Report = useMemo(() => {
  return buildFactoryExportPackageV1Report({
    productId,
    productName,
    productCategory,
    productBrand,
    packageVersion,
    componentCount: meshList.length,
    compatibilityMatrix: hardwareCompatibilityMatrixV1Report,
    productionReadiness: productionReadinessGateV1Report,
    parametricEdit: parametricEditV1Report,
    csvRegeneration: csvRegenerationV1Report,
    csvGuard: csvRegenerationGuardV1Report,
  });
}, [
  productId,
  productName,
  productCategory,
  productBrand,
  packageVersion,
  meshList.length,
  hardwareCompatibilityMatrixV1Report,
  productionReadinessGateV1Report,
  parametricEditV1Report,
  csvRegenerationV1Report,
  csvRegenerationGuardV1Report,
]);

function downloadFactoryExportPackageV1Report() {
  downloadJsonFile(`bagastudio-factory-export-package-v1-${Date.now()}.json`, factoryExportPackageV1Report);
}


type BomRegenerationV1Status = "ready" | "review" | "blocked";

type BomRegenerationV1Item = {
  key: string;
  material: string | null;
  thickness: number | null;
  quantity: number;
  componentNames: string[];
  sourceRows: number[];
  status: BomRegenerationV1Status;
  note: string;
};

type BomRegenerationV1Report = {
  schema: "bagastudio-bom-regeneration-v1";
  version: 1;
  generatedAt: string;
  readiness: "BOM_READY" | "BOM_REVIEW_REQUIRED" | "BOM_BLOCKED";
  sourceCsvFileName: string | null;
  targetThickness: number | null;
  totals: {
    bomItems: number;
    components: number;
    ready: number;
    review: number;
    blocked: number;
    totalQuantity: number;
  };
  items: BomRegenerationV1Item[];
  notes: string[];
};

function buildBomRegenerationV1Report(
  csvReport: CsvRegenerationV1Report,
  csvGuardReport: CsvRegenerationGuardV1Report
): BomRegenerationV1Report {
  const guardByRow = new Map<number, CsvRegenerationGuardV1Report["items"][number]>();
  csvGuardReport.items.forEach((item) => guardByRow.set(item.rowIndex, item));

  const grouped = new Map<string, BomRegenerationV1Item>();

  csvReport.rows.forEach((row) => {
    const guard = guardByRow.get(row.rowIndex) || null;
    const materialKey = String(row.material || "materiale-non-definito").trim().toLowerCase();
    const thicknessKey = row.regeneratedThickness === null ? "spessore-non-definito" : `${row.regeneratedThickness}`;
    const key = `${materialKey}__${thicknessKey}`;
    const rowQuantity = row.quantity && row.quantity > 0 ? row.quantity : 1;
    const rowStatus: BomRegenerationV1Status = guard?.status === "blocked"
      ? "blocked"
      : guard?.status === "review" || row.status === "skipped"
        ? "review"
        : "ready";

    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += rowQuantity;
      existing.componentNames.push(row.name);
      existing.sourceRows.push(row.rowIndex);
      if (rowStatus === "blocked") existing.status = "blocked";
      else if (rowStatus === "review" && existing.status !== "blocked") existing.status = "review";
      return;
    }

    grouped.set(key, {
      key,
      material: row.material,
      thickness: row.regeneratedThickness,
      quantity: rowQuantity,
      componentNames: [row.name],
      sourceRows: [row.rowIndex],
      status: rowStatus,
      note: rowStatus === "blocked"
        ? "Voce BOM bloccata da CSV Guard: correggere prima dell'export produttivo."
        : rowStatus === "review"
          ? "Voce BOM da revisionare: riga CSV saltata/non collegata o richiesta verifica tecnica."
          : "Voce BOM pronta per distinta diagnostica V1.",
    });
  });

  const items = Array.from(grouped.values()).sort((a, b) => {
    const materialCompare = String(a.material || "").localeCompare(String(b.material || ""));
    if (materialCompare !== 0) return materialCompare;
    return (a.thickness || 0) - (b.thickness || 0);
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness = blocked > 0 ? "BOM_BLOCKED" : review > 0 ? "BOM_REVIEW_REQUIRED" : "BOM_READY";

  return {
    schema: "bagastudio-bom-regeneration-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    sourceCsvFileName: csvReport.sourceCsvFileName,
    targetThickness: csvReport.targetThickness,
    totals: {
      bomItems: items.length,
      components: csvReport.rows.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    },
    items,
    notes: [
      "BOM Regeneration V1 raggruppa il CSV rigenerato per materiale e spessore.",
      "La quantità è diagnostica e deriva dalle righe CSV, senza ancora ottimizzazione taglio o nesting.",
      "Le voci review/blocked devono essere corrette prima della futura pipeline Factory Engine.",
    ],
  };
}

const bomRegenerationV1Report = useMemo(() => {
  return buildBomRegenerationV1Report(csvRegenerationV1Report, csvRegenerationGuardV1Report);
}, [csvRegenerationV1Report, csvRegenerationGuardV1Report]);

function downloadBomRegenerationV1Report() {
  downloadJsonFile(`bagastudio-bom-regeneration-v1-${Date.now()}.json`, bomRegenerationV1Report);
}


type HardwareRepositionEngineV1Status = "ready" | "review" | "blocked" | "skipped";

type HardwareRepositionEngineV1Item = {
  componentId: string;
  displayName: string;
  status: HardwareRepositionEngineV1Status;
  originalThickness: number | null;
  targetThickness: number | null;
  thicknessDelta: number | null;
  drillingOffsetRule: string;
  hardwareOffsetRule: string;
  linkedCsvRow: number | null;
  constraintStatus: "ok" | "warning" | "error" | null;
  note: string;
};

type HardwareRepositionEngineV1Report = {
  schema: "bagastudio-hardware-reposition-engine-v1";
  version: 1;
  generatedAt: string;
  readiness: "REPOSITION_READY" | "REPOSITION_REVIEW_REQUIRED" | "REPOSITION_BLOCKED";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    repositionRequired: number;
  };
  items: HardwareRepositionEngineV1Item[];
  notes: string[];
};

function buildHardwareRepositionEngineV1Report(
  parametricReport: ParametricEditV1Report,
  csvReport: CsvRegenerationV1Report,
  constraintReport: ConstraintEngineV1Report
): HardwareRepositionEngineV1Report {
  const csvByName = new Map<string, CsvRegenerationV1Report["rows"][number]>();
  csvReport.rows.forEach((row) => csvByName.set(normalizeCsvRegenerationKey(row.name), row));

  const constraintsByComponent = new Map<string, ConstraintEngineV1Item[]>();
  constraintReport.items.forEach((item) => {
    const list = constraintsByComponent.get(item.componentId) || [];
    list.push(item);
    constraintsByComponent.set(item.componentId, list);
  });

  const items: HardwareRepositionEngineV1Item[] = parametricReport.items.map((item) => {
    const linkedCsvRow = csvByName.get(normalizeCsvRegenerationKey(item.displayName)) || null;
    const constraints = constraintsByComponent.get(item.componentId) || [];
    const hasConstraintError = constraints.some((constraint) => constraint.status === "error");
    const hasConstraintWarning = constraints.some((constraint) => constraint.status === "warning");
    const thicknessDelta = item.originalThickness !== null && item.targetThickness !== null
      ? Number((item.targetThickness - item.originalThickness).toFixed(3))
      : null;
    const repositionRequired = Boolean(thicknessDelta !== null && Math.abs(thicknessDelta) > 0.001);

    let status: HardwareRepositionEngineV1Status = "ready";
    let note = "Ferramenta pronta: nessun riposizionamento richiesto dalle regole V1.";

    if (item.status === "blocked" || hasConstraintError) {
      status = "blocked";
      note = "Riposizionamento bloccato: correggere prima errori Parametric Edit o Constraint Engine.";
    } else if (item.status === "skipped") {
      status = "skipped";
      note = "Componente saltato: nessuna regola di riposizionamento applicata in V1.";
    } else if (item.status === "review" || hasConstraintWarning || !linkedCsvRow) {
      status = "review";
      note = "Riposizionamento da revisionare: dati CSV/constraint incompleti o warning presenti.";
    } else if (repositionRequired) {
      status = "ready";
      note = "Riposizionamento V1 pronto: mantenere riferimenti parametrici a bordo/asse e aggiornare quote interne.";
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status,
      originalThickness: item.originalThickness,
      targetThickness: item.targetThickness,
      thicknessDelta,
      drillingOffsetRule: repositionRequired ? "edge/axis references preserved; internal drilling offsets recalculated" : "no drilling offset change",
      hardwareOffsetRule: repositionRequired ? "hardware anchors stay parametric; depth/margins revalidated" : "no hardware offset change",
      linkedCsvRow: linkedCsvRow?.rowIndex ?? null,
      constraintStatus: hasConstraintError ? "error" : hasConstraintWarning ? "warning" : constraints.length > 0 ? "ok" : null,
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness = blocked > 0
    ? "REPOSITION_BLOCKED"
    : review > 0
      ? "REPOSITION_REVIEW_REQUIRED"
      : "REPOSITION_READY";

  return {
    schema: "bagastudio-hardware-reposition-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    totals: {
      components: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped: items.filter((item) => item.status === "skipped").length,
      repositionRequired: items.filter((item) => item.thicknessDelta !== null && Math.abs(item.thicknessDelta) > 0.001).length,
    },
    items,
    notes: [
      "Hardware Reposition Engine V1 prepara il riposizionamento parametrico di ferramenta e forature dopo cambio spessore.",
      "Le quote restano diagnostiche: edge/axis references devono essere validate su CSV/CIX reali prima della produzione.",
      "Gli elementi blocked/review devono essere risolti prima della futura CSV/CIX Regeneration Pipeline.",
    ],
  };
}

const hardwareRepositionEngineV1Report = useMemo(() => {
  return buildHardwareRepositionEngineV1Report(
    parametricEditV1Report,
    csvRegenerationV1Report,
    constraintEngineV1Report
  );
}, [parametricEditV1Report, csvRegenerationV1Report, constraintEngineV1Report]);

function downloadHardwareRepositionEngineV1Report() {
  downloadJsonFile(`bagastudio-hardware-reposition-engine-v1-${Date.now()}.json`, hardwareRepositionEngineV1Report);
}


type CsvCixRegenerationPipelineV1Status = "ready" | "review" | "blocked" | "skipped";
type CsvCixRegenerationPipelineV1Readiness = "PIPELINE_READY" | "PIPELINE_REVIEW_REQUIRED" | "PIPELINE_BLOCKED";

type CsvCixRegenerationPipelineV1Item = {
  componentId: string;
  displayName: string;
  status: CsvCixRegenerationPipelineV1Status;
  csvRow: number | null;
  csvStatus: CsvRegenerationV1Report["rows"][number]["status"] | null;
  csvGuardStatus: CsvRegenerationGuardV1Status | null;
  bomStatus: BomRegenerationV1Status | null;
  hardwareRepositionStatus: HardwareRepositionEngineV1Status | null;
  outputTargets: Array<"CSV" | "CIX" | "BOM" | "HARDWARE_MAP">;
  note: string;
};

type CsvCixRegenerationPipelineV1Report = {
  schema: "bagastudio-csv-cix-regeneration-pipeline-v1";
  version: 1;
  generatedAt: string;
  readiness: CsvCixRegenerationPipelineV1Readiness;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    csvRowsReady: number;
    cixTargetsPlanned: number;
    bomLinkedItems: number;
  };
  items: CsvCixRegenerationPipelineV1Item[];
  notes: string[];
};

function buildCsvCixRegenerationPipelineV1Report(
  csvReport: CsvRegenerationV1Report,
  csvGuardReport: CsvRegenerationGuardV1Report,
  bomReport: BomRegenerationV1Report,
  hardwareReport: HardwareRepositionEngineV1Report
): CsvCixRegenerationPipelineV1Report {
  const guardByRow = new Map<number, CsvRegenerationGuardV1Report["items"][number]>();
  csvGuardReport.items.forEach((item) => guardByRow.set(item.rowIndex, item));

  const hardwareByName = new Map<string, HardwareRepositionEngineV1Item>();
  hardwareReport.items.forEach((item) => hardwareByName.set(normalizeCsvRegenerationKey(item.displayName), item));

  const bomByComponentName = new Map<string, BomRegenerationV1Item>();
  bomReport.items.forEach((item) => {
    item.componentNames.forEach((componentName) => {
      bomByComponentName.set(normalizeCsvRegenerationKey(componentName), item);
    });
  });

  const items: CsvCixRegenerationPipelineV1Item[] = csvReport.rows.map((row) => {
    const key = normalizeCsvRegenerationKey(row.name);
    const guard = guardByRow.get(row.rowIndex) || null;
    const hardware = hardwareByName.get(key) || null;
    const bom = bomByComponentName.get(key) || null;
    const outputTargets: CsvCixRegenerationPipelineV1Item["outputTargets"] = ["CSV"];

    if (bom) outputTargets.push("BOM");
    if (hardware && hardware.status !== "skipped") outputTargets.push("HARDWARE_MAP", "CIX");

    let status: CsvCixRegenerationPipelineV1Status = "ready";
    let note = "Pipeline pronta: CSV rigenerabile, BOM collegata e CIX pianificabile in modalità diagnostica V1.";

    if (guard?.status === "blocked" || hardware?.status === "blocked" || bom?.status === "blocked") {
      status = "blocked";
      note = "Pipeline bloccata: correggere CSV Guard, BOM o Hardware Reposition prima della rigenerazione CSV/CIX.";
    } else if (row.status === "skipped" || hardware?.status === "skipped") {
      status = "skipped";
      note = "Pipeline saltata: riga o ferramenta non gestita dalle regole V1.";
    } else if (guard?.status === "review" || hardware?.status === "review" || bom?.status === "review" || !hardware || !bom) {
      status = "review";
      note = "Pipeline da revisionare: collegamenti incompleti o warning presenti prima dell'export produttivo.";
    }

    return {
      componentId: hardware?.componentId || `csv-row-${row.rowIndex}`,
      displayName: row.name,
      status,
      csvRow: row.rowIndex,
      csvStatus: row.status,
      csvGuardStatus: guard?.status || null,
      bomStatus: bom?.status || null,
      hardwareRepositionStatus: hardware?.status || null,
      outputTargets,
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness: CsvCixRegenerationPipelineV1Readiness = blocked > 0
    ? "PIPELINE_BLOCKED"
    : review > 0
      ? "PIPELINE_REVIEW_REQUIRED"
      : "PIPELINE_READY";

  return {
    schema: "bagastudio-csv-cix-regeneration-pipeline-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    totals: {
      components: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped: items.filter((item) => item.status === "skipped").length,
      csvRowsReady: csvReport.rows.filter((row) => row.status === "updated" || row.status === "unchanged").length,
      cixTargetsPlanned: items.filter((item) => item.outputTargets.includes("CIX")).length,
      bomLinkedItems: items.filter((item) => item.bomStatus !== null).length,
    },
    items,
    notes: [
      "CSV/CIX Regeneration Pipeline V1 collega CSV rigenerato, CSV Guard, BOM e Hardware Reposition.",
      "Il CIX in V1 è pianificato come target diagnostico: la scrittura reale dei file .cix richiederà mapping lavorazioni macchina.",
      "Gli stati review/blocked impediscono l'export produttivo automatico e richiedono controllo tecnico.",
    ],
  };
}

const csvCixRegenerationPipelineV1Report = useMemo(() => {
  return buildCsvCixRegenerationPipelineV1Report(
    csvRegenerationV1Report,
    csvRegenerationGuardV1Report,
    bomRegenerationV1Report,
    hardwareRepositionEngineV1Report
  );
}, [csvRegenerationV1Report, csvRegenerationGuardV1Report, bomRegenerationV1Report, hardwareRepositionEngineV1Report]);

function downloadCsvCixRegenerationPipelineV1Report() {
  downloadJsonFile(`bagastudio-csv-cix-regeneration-pipeline-v1-${Date.now()}.json`, csvCixRegenerationPipelineV1Report);
}

type FactoryEngineV1Status = "READY" | "REVIEW" | "BLOCKED";

type FactoryEngineV1Report = {
  schema: "bagastudio-factory-engine-v1";
  version: 1;
  generatedAt: string;
  factoryStatus: FactoryEngineV1Status;
  factoryScore: number;
  summary: {
    components: number;
    productionBlocked: number;
    productionReview: number;
    parametricBlocked: number;
    csvBlocked: number;
    bomBlocked: number;
    hardwareBlocked: number;
    pipelineBlocked: number;
    exportReadiness: FactoryExportPackageV1Readiness;
  };
  inputs: {
    productionReadinessSchema: ProductionReadinessGateV1Report["schema"];
    parametricEditSchema: ParametricEditV1Report["schema"];
    csvGuardSchema: CsvRegenerationGuardV1Report["schema"];
    factoryExportSchema: FactoryExportPackageV1Report["schema"];
    bomSchema: BomRegenerationV1Report["schema"];
    hardwareRepositionSchema: HardwareRepositionEngineV1Report["schema"];
    csvCixPipelineSchema: CsvCixRegenerationPipelineV1Report["schema"];
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
};

function buildFactoryEngineV1Report(params: {
  productionReadiness: ProductionReadinessGateV1Report;
  parametricEdit: ParametricEditV1Report;
  csvGuard: CsvRegenerationGuardV1Report;
  factoryExport: FactoryExportPackageV1Report;
  bom: BomRegenerationV1Report;
  hardwareReposition: HardwareRepositionEngineV1Report;
  csvCixPipeline: CsvCixRegenerationPipelineV1Report;
}): FactoryEngineV1Report {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (params.productionReadiness.totals.blocked > 0) {
    blockers.push(`${params.productionReadiness.totals.blocked} componenti bloccati dal Production Readiness Gate.`);
  }
  if (params.productionReadiness.totals.review > 0) {
    warnings.push(`${params.productionReadiness.totals.review} componenti richiedono revisione produttiva.`);
  }

  if (params.parametricEdit.totals.blocked > 0) {
    blockers.push(`${params.parametricEdit.totals.blocked} componenti bloccati nel Parametric Edit.`);
  }
  if (params.parametricEdit.totals.review > 0) {
    warnings.push(`${params.parametricEdit.totals.review} componenti parametrici richiedono controllo tecnico.`);
  }

  if (params.csvGuard.totals.blocked > 0) {
    blockers.push(`${params.csvGuard.totals.blocked} righe CSV non rigenerabili in sicurezza.`);
  }
  if (params.csvGuard.totals.review > 0) {
    warnings.push(`${params.csvGuard.totals.review} righe CSV richiedono revisione prima dell'export.`);
  }

  if (params.bom.totals.blocked > 0) {
    blockers.push(`${params.bom.totals.blocked} righe BOM bloccate.`);
  }
  if (params.bom.totals.review > 0) {
    warnings.push(`${params.bom.totals.review} righe BOM richiedono revisione.`);
  }

  if (params.hardwareReposition.totals.blocked > 0) {
    blockers.push(`${params.hardwareReposition.totals.blocked} riposizionamenti ferramenta bloccati.`);
  }
  if (params.hardwareReposition.totals.review > 0) {
    warnings.push(`${params.hardwareReposition.totals.review} riposizionamenti ferramenta richiedono revisione.`);
  }

  if (params.csvCixPipeline.totals.blocked > 0) {
    blockers.push(`${params.csvCixPipeline.totals.blocked} elementi bloccati nella pipeline CSV/CIX.`);
  }
  if (params.csvCixPipeline.totals.review > 0) {
    warnings.push(`${params.csvCixPipeline.totals.review} elementi pipeline CSV/CIX richiedono controllo.`);
  }

  if (params.factoryExport.readiness === "FACTORY_BLOCKED") {
    blockers.push("Factory Export Package V1 segnala export produttivo bloccato.");
  }
  if (params.factoryExport.readiness === "FACTORY_REVIEW_REQUIRED") {
    warnings.push("Factory Export Package V1 richiede revisione prima dell'export.");
  }

  if (blockers.length === 0 && warnings.length === 0) {
    recommendations.push("Progetto pronto per il prossimo step: Product Package Regeneration e Viewer Sync.");
  } else {
    recommendations.push("Correggere prima i blocchi critici, poi rieseguire CSV Guard, BOM, Hardware Reposition e Pipeline CSV/CIX.");
  }
  if (params.csvCixPipeline.totals.cixTargetsPlanned > 0) {
    recommendations.push("Prima dell'export CIX reale serve mapping lavorazioni macchina per ogni target CIX pianificato.");
  }

  const factoryStatus: FactoryEngineV1Status = blockers.length > 0 ? "BLOCKED" : warnings.length > 0 ? "REVIEW" : "READY";
  const totalSignals = blockers.length + warnings.length;
  const factoryScore = Math.max(0, Math.min(100, 100 - blockers.length * 18 - warnings.length * 7 - Math.max(0, totalSignals - 4) * 2));

  return {
    schema: "bagastudio-factory-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    factoryStatus,
    factoryScore,
    summary: {
      components: params.productionReadiness.totals.components,
      productionBlocked: params.productionReadiness.totals.blocked,
      productionReview: params.productionReadiness.totals.review,
      parametricBlocked: params.parametricEdit.totals.blocked,
      csvBlocked: params.csvGuard.totals.blocked,
      bomBlocked: params.bom.totals.blocked,
      hardwareBlocked: params.hardwareReposition.totals.blocked,
      pipelineBlocked: params.csvCixPipeline.totals.blocked,
      exportReadiness: params.factoryExport.readiness,
    },
    inputs: {
      productionReadinessSchema: params.productionReadiness.schema,
      parametricEditSchema: params.parametricEdit.schema,
      csvGuardSchema: params.csvGuard.schema,
      factoryExportSchema: params.factoryExport.schema,
      bomSchema: params.bom.schema,
      hardwareRepositionSchema: params.hardwareReposition.schema,
      csvCixPipelineSchema: params.csvCixPipeline.schema,
    },
    blockers,
    warnings,
    recommendations,
  };
}

const factoryEngineV1Report = useMemo(() => {
  return buildFactoryEngineV1Report({
    productionReadiness: productionReadinessGateV1Report,
    parametricEdit: parametricEditV1Report,
    csvGuard: csvRegenerationGuardV1Report,
    factoryExport: factoryExportPackageV1Report,
    bom: bomRegenerationV1Report,
    hardwareReposition: hardwareRepositionEngineV1Report,
    csvCixPipeline: csvCixRegenerationPipelineV1Report,
  });
}, [
  productionReadinessGateV1Report,
  parametricEditV1Report,
  csvRegenerationGuardV1Report,
  factoryExportPackageV1Report,
  bomRegenerationV1Report,
  hardwareRepositionEngineV1Report,
  csvCixRegenerationPipelineV1Report,
]);

function downloadFactoryEngineV1Report() {
  downloadJsonFile(`bagastudio-factory-engine-v1-${Date.now()}.json`, factoryEngineV1Report);
}


type ProductPackageRegenerationV1Status = "READY_TO_SYNC" | "REVIEW_REQUIRED" | "BLOCKED";

type ProductPackageRegenerationV1Component = {
  componentId: string;
  displayName: string;
  status: "ready" | "review" | "blocked" | "skipped";
  parametricStatus: ParametricEditV1Status | null;
  bomStatus: BomRegenerationV1Status | null;
  hardwareStatus: HardwareRepositionEngineV1Status | null;
  pipelineStatus: CsvCixRegenerationPipelineV1Status | null;
  targetThickness: number | null;
  externalDimensionsLocked: boolean;
  viewerSyncReady: boolean;
  note: string;
};

type ProductPackageRegenerationV1Report = {
  schema: "bagastudio-product-package-regeneration-v1";
  version: 1;
  generatedAt: string;
  status: ProductPackageRegenerationV1Status;
  sourceFactoryStatus: FactoryEngineV1Status;
  currentPackageSchema: string;
  nextPackageVersion: number;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    viewerSyncReady: number;
    packageComponents: number;
  };
  components: ProductPackageRegenerationV1Component[];
  packagePatch: {
    mode: "diagnostic_patch_v1";
    keepsOriginalGeometry: boolean;
    keepsExternalDimensions: boolean;
    updatesParametricMetadata: boolean;
    updatesBomMetadata: boolean;
    updatesHardwareMetadata: boolean;
    updatesCsvCixMetadata: boolean;
  };
  recommendations: string[];
};

function buildProductPackageRegenerationV1Report(params: {
  factory: FactoryEngineV1Report;
  currentPackage: any;
  parametric: ParametricEditV1Report;
  bom: BomRegenerationV1Report;
  hardware: HardwareRepositionEngineV1Report;
  csvCix: CsvCixRegenerationPipelineV1Report;
}): ProductPackageRegenerationV1Report {
  const bomByComponentName = new Map<string, BomRegenerationV1Item>();
  params.bom.items.forEach((item) => {
    item.componentNames.forEach((componentName) => {
      bomByComponentName.set(normalizeCsvRegenerationKey(componentName), item);
    });
  });

  const hardwareById = new Map<string, HardwareRepositionEngineV1Item>();
  params.hardware.items.forEach((item) => hardwareById.set(item.componentId, item));

  const pipelineById = new Map<string, CsvCixRegenerationPipelineV1Item>();
  params.csvCix.items.forEach((item) => pipelineById.set(item.componentId, item));

  const components: ProductPackageRegenerationV1Component[] = params.parametric.items.map((item) => {
    const bomItem = bomByComponentName.get(normalizeCsvRegenerationKey(item.displayName)) || null;
    const hardwareItem = hardwareById.get(item.componentId) || null;
    const pipelineItem = pipelineById.get(item.componentId) || null;

    const hasBlock = item.status === "blocked" || bomItem?.status === "blocked" || hardwareItem?.status === "blocked" || pipelineItem?.status === "blocked";
    const hasReview = item.status === "review" || bomItem?.status === "review" || hardwareItem?.status === "review" || pipelineItem?.status === "review";
    const isSkipped = item.status === "skipped" || pipelineItem?.status === "skipped";

    let status: ProductPackageRegenerationV1Component["status"] = "ready";
    let note = "Componente pronto per patch Product Package e futura sincronizzazione Viewer.";

    if (hasBlock) {
      status = "blocked";
      note = "Bloccato: Factory/Parametric/BOM/Hardware/Pipeline segnala errori da correggere prima di rigenerare il Product Package.";
    } else if (hasReview) {
      status = "review";
      note = "Review richiesta: il Product Package può essere preparato solo come bozza controllata.";
    } else if (isSkipped) {
      status = "skipped";
      note = "Componente saltato dalla pipeline produttiva: non viene incluso nella patch automatica V1.";
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status,
      parametricStatus: item.status,
      bomStatus: bomItem?.status || null,
      hardwareStatus: hardwareItem?.status || null,
      pipelineStatus: pipelineItem?.status || null,
      targetThickness: item.targetThickness,
      externalDimensionsLocked: item.externalDimensionsLocked,
      viewerSyncReady: status === "ready" && item.externalDimensionsLocked,
      note,
    };
  });

  const blocked = components.filter((item) => item.status === "blocked").length;
  const review = components.filter((item) => item.status === "review").length;
  const skipped = components.filter((item) => item.status === "skipped").length;

  const status: ProductPackageRegenerationV1Status =
    params.factory.factoryStatus === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.factory.factoryStatus === "REVIEW" || review > 0
        ? "REVIEW_REQUIRED"
        : "READY_TO_SYNC";

  const packageComponents = Array.isArray(params.currentPackage?.components)
    ? params.currentPackage.components.length
    : Array.isArray(params.currentPackage?.parts)
      ? params.currentPackage.parts.length
      : 0;

  return {
    schema: "bagastudio-product-package-regeneration-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryStatus: params.factory.factoryStatus,
    currentPackageSchema: String(params.currentPackage?.schema || params.currentPackage?.productPackageSchema || "unknown"),
    nextPackageVersion: Number(params.currentPackage?.version || params.currentPackage?.packageVersion || 3) + 1,
    totals: {
      components: components.length,
      ready: components.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped,
      viewerSyncReady: components.filter((item) => item.viewerSyncReady).length,
      packageComponents,
    },
    components,
    packagePatch: {
      mode: "diagnostic_patch_v1",
      keepsOriginalGeometry: true,
      keepsExternalDimensions: true,
      updatesParametricMetadata: true,
      updatesBomMetadata: true,
      updatesHardwareMetadata: true,
      updatesCsvCixMetadata: true,
    },
    recommendations: [
      status === "READY_TO_SYNC"
        ? "Product Package pronto per Viewer Sync V1: applicare patch metadata senza alterare geometria originale."
        : "Correggere blocchi/review prima di usare il Product Package rigenerato come base cliente.",
      "V1 genera una patch diagnostica: la rigenerazione geometrica reale arriverà con Viewer Sync e Structure Editor.",
      "Mantenere sempre ingombro esterno bloccato durante cambio spessore, ferramenta e quote interne.",
    ],
  };
}

const productPackageRegenerationV1Report = useMemo(() => {
  return buildProductPackageRegenerationV1Report({
    factory: factoryEngineV1Report,
    currentPackage: buildCurrentProductPackageJson(),
    parametric: parametricEditV1Report,
    bom: bomRegenerationV1Report,
    hardware: hardwareRepositionEngineV1Report,
    csvCix: csvCixRegenerationPipelineV1Report,
  });
}, [
  factoryEngineV1Report,
  parametricEditV1Report,
  bomRegenerationV1Report,
  hardwareRepositionEngineV1Report,
  csvCixRegenerationPipelineV1Report,
  generatedJson,
  meshList,
  productId,
  productName,
]);

function downloadProductPackageRegenerationV1Report() {
  downloadJsonFile(`bagastudio-product-package-regeneration-v1-${Date.now()}.json`, productPackageRegenerationV1Report);
}


type ViewerSyncV1Status = "SYNC_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type ViewerSyncV1Component = {
  componentId: string;
  displayName: string;
  status: "ready" | "review" | "blocked" | "skipped";
  sourceProductPackageStatus: ProductPackageRegenerationV1Component["status"];
  viewerSyncReady: boolean;
  geometryMode: "metadata_only" | "geometry_regeneration_required" | "skipped";
  syncTargets: string[];
  note: string;
};

type ViewerSyncV1Report = {
  schema: "bagastudio-viewer-sync-v1";
  version: 1;
  generatedAt: string;
  status: ViewerSyncV1Status;
  sourceProductPackageSchema: ProductPackageRegenerationV1Report["schema"];
  sourceProductPackageStatus: ProductPackageRegenerationV1Status;
  syncMode: "diagnostic_viewer_sync_v1";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    metadataOnly: number;
    geometryRequired: number;
  };
  components: ViewerSyncV1Component[];
  viewerPatch: {
    keepsCurrentModelGeometry: boolean;
    updatesComponentMetadata: boolean;
    updatesFactoryMetadata: boolean;
    updatesBomMetadata: boolean;
    updatesHardwareMetadata: boolean;
    updatesCsvCixMetadata: boolean;
    readyForMaterialAccessoryLedWorkflow: boolean;
  };
  recommendations: string[];
};

function buildViewerSyncV1Report(params: {
  productPackage: ProductPackageRegenerationV1Report;
}): ViewerSyncV1Report {
  const components: ViewerSyncV1Component[] = params.productPackage.components.map((item) => {
    const syncTargets = ["componentMetadata", "factoryState", "bomMetadata", "hardwareMetadata", "csvCixMetadata"];

    if (item.status === "blocked") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "blocked",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "geometry_regeneration_required",
        syncTargets,
        note: "Bloccato: il componente non deve essere sincronizzato nel Viewer finché Product Package/Factory non sono corretti.",
      };
    }

    if (item.status === "skipped") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "skipped",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "skipped",
        syncTargets: [],
        note: "Componente saltato: nessuna patch Viewer automatica in V1.",
      };
    }

    if (!item.viewerSyncReady || item.status === "review") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "review",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "geometry_regeneration_required",
        syncTargets,
        note: "Review richiesta: servono controlli prima di aggiornare il Viewer o rigenerare geometria/struttura.",
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status: "ready",
      sourceProductPackageStatus: item.status,
      viewerSyncReady: true,
      geometryMode: "metadata_only",
      syncTargets,
      note: "Pronto: il Viewer può ricevere metadata factory mantenendo geometria attuale e workflow materiali/accessori/LED.",
    };
  });

  const blocked = components.filter((item) => item.status === "blocked").length;
  const review = components.filter((item) => item.status === "review").length;
  const skipped = components.filter((item) => item.status === "skipped").length;
  const geometryRequired = components.filter((item) => item.geometryMode === "geometry_regeneration_required").length;

  const status: ViewerSyncV1Status =
    params.productPackage.status === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.productPackage.status === "REVIEW_REQUIRED" || review > 0
        ? "REVIEW_REQUIRED"
        : "SYNC_READY";

  return {
    schema: "bagastudio-viewer-sync-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceProductPackageSchema: params.productPackage.schema,
    sourceProductPackageStatus: params.productPackage.status,
    syncMode: "diagnostic_viewer_sync_v1",
    totals: {
      components: components.length,
      ready: components.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped,
      metadataOnly: components.filter((item) => item.geometryMode === "metadata_only").length,
      geometryRequired,
    },
    components,
    viewerPatch: {
      keepsCurrentModelGeometry: true,
      updatesComponentMetadata: true,
      updatesFactoryMetadata: true,
      updatesBomMetadata: true,
      updatesHardwareMetadata: true,
      updatesCsvCixMetadata: true,
      readyForMaterialAccessoryLedWorkflow: status === "SYNC_READY",
    },
    recommendations: [
      status === "SYNC_READY"
        ? "Viewer Sync V1 pronto: applicare metadata produttivi al Product Package senza perdere materiali, accessori, LED e configurazione cliente."
        : "Correggere review/blocchi prima di usare il Viewer come anteprima commerciale del prodotto rigenerato.",
      "V1 è metadata-only: la modifica geometrica reale dei componenti arriverà con Structure Editor/Product Package Regeneration V2.",
      "Mantenere separati dati factory e dati cliente, così texture/accessori/LED restano applicabili anche dopo la rigenerazione.",
    ],
  };
}

const viewerSyncV1Report = useMemo(() => {
  return buildViewerSyncV1Report({
    productPackage: productPackageRegenerationV1Report,
  });
}, [productPackageRegenerationV1Report]);

function downloadViewerSyncV1Report() {
  downloadJsonFile(`bagastudio-viewer-sync-v1-${Date.now()}.json`, viewerSyncV1Report);
}


type ParametricStructureEditorV1Status = "STRUCTURE_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type ParametricStructureEditorV1Action = {
  componentId: string;
  displayName: string;
  actionType: "preserve_geometry" | "update_metadata" | "requires_structure_regeneration" | "blocked";
  status: "ready" | "review" | "blocked";
  sourceViewerStatus: ViewerSyncV1Component["status"];
  keepsExternalDimensions: boolean;
  editableTargets: string[];
  note: string;
};

type ParametricStructureEditorV1Report = {
  schema: "bagastudio-parametric-structure-editor-v1";
  version: 1;
  generatedAt: string;
  status: ParametricStructureEditorV1Status;
  sourceViewerSyncSchema: ViewerSyncV1Report["schema"];
  sourceViewerSyncStatus: ViewerSyncV1Status;
  editorMode: "diagnostic_structure_editor_v1";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    preserveGeometry: number;
    requiresRegeneration: number;
    metadataUpdates: number;
  };
  actions: ParametricStructureEditorV1Action[];
  structureRules: {
    keepExternalEnvelopeLocked: boolean;
    allowInternalRepartition: boolean;
    allowThicknessDrivenRecalculation: boolean;
    allowHardwareDrivenReposition: boolean;
    allowViewerMaterialWorkflowAfterEdit: boolean;
  };
  recommendations: string[];
};

function buildParametricStructureEditorV1Report(params: {
  viewerSync: ViewerSyncV1Report;
}): ParametricStructureEditorV1Report {
  const actions: ParametricStructureEditorV1Action[] = params.viewerSync.components.map((item) => {
    const editableTargets = [
      "thicknessMetadata",
      "internalOffsets",
      "hardwareReferences",
      "bomReferences",
      "viewerComponentMetadata",
    ];

    if (item.status === "blocked") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        actionType: "blocked",
        status: "blocked",
        sourceViewerStatus: item.status,
        keepsExternalDimensions: true,
        editableTargets: [],
        note: "Bloccato: non modificare la struttura finché Viewer Sync/Product Package non sono corretti.",
      };
    }

    if (item.geometryMode === "geometry_regeneration_required" || item.status === "review") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        actionType: "requires_structure_regeneration",
        status: "review",
        sourceViewerStatus: item.status,
        keepsExternalDimensions: true,
        editableTargets,
        note: "Richiede rigenerazione struttura: V1 prepara il piano di modifica mantenendo l'ingombro esterno bloccato.",
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      actionType: item.viewerSyncReady ? "update_metadata" : "preserve_geometry",
      status: "ready",
      sourceViewerStatus: item.status,
      keepsExternalDimensions: true,
      editableTargets,
      note: "Pronto: struttura modificabile a livello metadata/parametri, con Viewer ancora pronto per texture, accessori e LED.",
    };
  });

  const blocked = actions.filter((item) => item.status === "blocked").length;
  const review = actions.filter((item) => item.status === "review").length;
  const requiresRegeneration = actions.filter((item) => item.actionType === "requires_structure_regeneration").length;

  const status: ParametricStructureEditorV1Status =
    params.viewerSync.status === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.viewerSync.status === "REVIEW_REQUIRED" || review > 0
        ? "REVIEW_REQUIRED"
        : "STRUCTURE_READY";

  return {
    schema: "bagastudio-parametric-structure-editor-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceViewerSyncSchema: params.viewerSync.schema,
    sourceViewerSyncStatus: params.viewerSync.status,
    editorMode: "diagnostic_structure_editor_v1",
    totals: {
      components: actions.length,
      ready: actions.filter((item) => item.status === "ready").length,
      review,
      blocked,
      preserveGeometry: actions.filter((item) => item.actionType === "preserve_geometry").length,
      requiresRegeneration,
      metadataUpdates: actions.filter((item) => item.actionType === "update_metadata").length,
    },
    actions,
    structureRules: {
      keepExternalEnvelopeLocked: true,
      allowInternalRepartition: true,
      allowThicknessDrivenRecalculation: true,
      allowHardwareDrivenReposition: true,
      allowViewerMaterialWorkflowAfterEdit: status !== "BLOCKED",
    },
    recommendations: [
      status === "STRUCTURE_READY"
        ? "Structure Editor V1 pronto: applicare modifiche parametriche interne senza cambiare ingombro esterno del mobile."
        : "Correggere review/blocchi prima di generare una nuova struttura usabile nel Viewer.",
      "Questo step prepara il futuro editor reale: aggiunta divisori, modifica spessori, riallineamento ferramenta e mantenimento del workflow materiali/accessori/LED.",
      "Le geometrie reali non vengono ancora riscritte in V1: il report crea un piano controllato per Product Package Regeneration V2.",
    ],
  };
}

const parametricStructureEditorV1Report = useMemo(() => {
  return buildParametricStructureEditorV1Report({
    viewerSync: viewerSyncV1Report,
  });
}, [viewerSyncV1Report]);

function downloadParametricStructureEditorV1Report() {
  downloadJsonFile(`bagastudio-parametric-structure-editor-v1-${Date.now()}.json`, parametricStructureEditorV1Report);
}


type FactoryEngineV2Status = "FACTORY_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type FactoryEngineV2PhaseStatus = "ready" | "review" | "blocked";

type FactoryEngineV2Phase = {
  id: string;
  label: string;
  status: FactoryEngineV2PhaseStatus;
  sourceSchema: string;
  note: string;
};

type FactoryEngineV2Report = {
  schema: "bagastudio-factory-engine-v2";
  version: 2;
  generatedAt: string;
  status: FactoryEngineV2Status;
  sourceFactoryEngineSchema: FactoryEngineV1Report["schema"];
  sourceFactoryEngineStatus: FactoryEngineV1Status;
  sourceStructureEditorSchema: ParametricStructureEditorV1Report["schema"];
  sourceStructureEditorStatus: ParametricStructureEditorV1Status;
  factoryScore: number;
  phases: FactoryEngineV2Phase[];
  totals: {
    phases: number;
    ready: number;
    review: number;
    blocked: number;
    structureActions: number;
    structureReady: number;
    structureReview: number;
    structureBlocked: number;
  };
  viewerBridge: {
    productPackageRegenerationReady: boolean;
    viewerSyncReady: boolean;
    structureEditorReady: boolean;
    keepsExternalEnvelopeLocked: boolean;
    materialAccessoryLedWorkflowPreserved: boolean;
  };
  nextSteps: string[];
  recommendations: string[];
};

function buildFactoryEngineV2Report(params: {
  factory: FactoryEngineV1Report;
  productPackage: ProductPackageRegenerationV1Report;
  viewerSync: ViewerSyncV1Report;
  structureEditor: ParametricStructureEditorV1Report;
}): FactoryEngineV2Report {
  const toPhaseStatus = (blocked: boolean, review: boolean): FactoryEngineV2PhaseStatus => {
    if (blocked) return "blocked";
    if (review) return "review";
    return "ready";
  };

  const phases: FactoryEngineV2Phase[] = [
    {
      id: "factory-engine-v1",
      label: "Factory Engine V1",
      status: toPhaseStatus(params.factory.factoryStatus === "BLOCKED", params.factory.factoryStatus === "REVIEW"),
      sourceSchema: params.factory.schema,
      note: `Stato sorgente: ${params.factory.factoryStatus}. Score ${params.factory.factoryScore}.`,
    },
    {
      id: "product-package-regeneration-v1",
      label: "Product Package Regeneration V1",
      status: toPhaseStatus(params.productPackage.status === "BLOCKED", params.productPackage.status === "REVIEW_REQUIRED"),
      sourceSchema: params.productPackage.schema,
      note: "Verifica patch Product Package e mantenimento dei riferimenti factory.",
    },
    {
      id: "viewer-sync-v1",
      label: "Viewer Sync V1",
      status: toPhaseStatus(params.viewerSync.status === "BLOCKED", params.viewerSync.status === "REVIEW_REQUIRED"),
      sourceSchema: params.viewerSync.schema,
      note: "Verifica ponte verso Viewer per texture, accessori, LED e configurazione cliente.",
    },
    {
      id: "parametric-structure-editor-v1",
      label: "Parametric Structure Editor V1",
      status: toPhaseStatus(params.structureEditor.status === "BLOCKED", params.structureEditor.status === "REVIEW_REQUIRED"),
      sourceSchema: params.structureEditor.schema,
      note: "Verifica modifiche struttura con ingombro esterno bloccato.",
    },
  ];

  const blocked = phases.filter((item) => item.status === "blocked").length;
  const review = phases.filter((item) => item.status === "review").length;
  const ready = phases.filter((item) => item.status === "ready").length;

  const status: FactoryEngineV2Status = blocked > 0 ? "BLOCKED" : review > 0 ? "REVIEW_REQUIRED" : "FACTORY_READY";

  const factoryScore = Math.max(
    0,
    Math.min(100, Math.round(params.factory.factoryScore - blocked * 18 - review * 7)),
  );

  return {
    schema: "bagastudio-factory-engine-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineSchema: params.factory.schema,
    sourceFactoryEngineStatus: params.factory.factoryStatus,
    sourceStructureEditorSchema: params.structureEditor.schema,
    sourceStructureEditorStatus: params.structureEditor.status,
    factoryScore,
    phases,
    totals: {
      phases: phases.length,
      ready,
      review,
      blocked,
      structureActions: params.structureEditor.totals.components,
      structureReady: params.structureEditor.totals.ready,
      structureReview: params.structureEditor.totals.review,
      structureBlocked: params.structureEditor.totals.blocked,
    },
    viewerBridge: {
      productPackageRegenerationReady: params.productPackage.status === "READY_TO_SYNC",
      viewerSyncReady: params.viewerSync.status === "SYNC_READY",
      structureEditorReady: params.structureEditor.status === "STRUCTURE_READY",
      keepsExternalEnvelopeLocked: params.structureEditor.structureRules.keepExternalEnvelopeLocked,
      materialAccessoryLedWorkflowPreserved: params.viewerSync.viewerPatch.readyForMaterialAccessoryLedWorkflow,
    },
    nextSteps: [
      "Product Package Regeneration V2 con geometria/componenti aggiornabili.",
      "Viewer Sync V2 con applicazione reale della patch al Product Package.",
      "CSV/CIX Regeneration reale con output produttivo scaricabile.",
    ],
    recommendations: [
      status === "FACTORY_READY"
        ? "Factory Engine V2 pronto: il flusso factory è coerente e può alimentare i prossimi step Product Package V2 / Viewer Sync V2."
        : "Correggere i blocchi/review indicati prima di procedere con rigenerazione reale della geometria o output macchina.",
      "Mantenere separati dati produttivi e configurazione cliente per non perdere materiali, texture, accessori e LED nel Viewer.",
      "Il prossimo step consigliato è Viewer Sync V2 o Product Package Regeneration V2, non una nuova feature laterale.",
    ],
  };
}

const factoryEngineV2Report = useMemo(() => {
  return buildFactoryEngineV2Report({
    factory: factoryEngineV1Report,
    productPackage: productPackageRegenerationV1Report,
    viewerSync: viewerSyncV1Report,
    structureEditor: parametricStructureEditorV1Report,
  });
}, [factoryEngineV1Report, productPackageRegenerationV1Report, viewerSyncV1Report, parametricStructureEditorV1Report]);

function downloadFactoryEngineV2Report() {
  downloadJsonFile(`bagastudio-factory-engine-v2-${Date.now()}.json`, factoryEngineV2Report);
}

type ProductPackageRegenerationV2Status = "PACKAGE_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type ProductPackageRegenerationV2PatchStatus = "ready" | "review" | "blocked";

type ProductPackageRegenerationV2Patch = {
  id: string;
  componentId: string;
  displayName: string;
  patchType: "preserve_geometry" | "update_metadata" | "regenerate_structure" | "review_required";
  status: ProductPackageRegenerationV2PatchStatus;
  keepsCustomerConfiguration: boolean;
  keepsExternalEnvelopeLocked: boolean;
  viewerSyncHint: string;
  note: string;
};

type ProductPackageRegenerationV2Report = {
  schema: "bagastudio-product-package-regeneration-v2";
  version: 2;
  generatedAt: string;
  status: ProductPackageRegenerationV2Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  sourceProductPackageV1Schema: ProductPackageRegenerationV1Report["schema"];
  sourceViewerSyncV1Schema: ViewerSyncV1Report["schema"];
  sourceStructureEditorV1Schema: ParametricStructureEditorV1Report["schema"];
  totals: {
    patches: number;
    ready: number;
    review: number;
    blocked: number;
    preserveGeometry: number;
    metadataUpdates: number;
    structureRegeneration: number;
  };
  packageRules: {
    preserveMaterials: boolean;
    preserveAccessories: boolean;
    preserveLedConfiguration: boolean;
    preserveCustomerConfiguration: boolean;
    keepExternalEnvelopeLocked: boolean;
    regenerateComponentsMetadataOnly: boolean;
  };
  patches: ProductPackageRegenerationV2Patch[];
  recommendations: string[];
};

function buildProductPackageRegenerationV2Report(params: {
  factoryV2: FactoryEngineV2Report;
  productPackageV1: ProductPackageRegenerationV1Report;
  viewerSyncV1: ViewerSyncV1Report;
  structureEditorV1: ParametricStructureEditorV1Report;
}): ProductPackageRegenerationV2Report {
  const v1Components = params.productPackageV1.components ?? [];
  const structureActions = params.structureEditorV1.actions ?? [];
  const actionByComponentId = new Map(structureActions.map((item) => [item.componentId, item]));

  const patches: ProductPackageRegenerationV2Patch[] = v1Components.map((component) => {
    const structureAction = actionByComponentId.get(component.componentId);
    const hasFactoryBlock = params.factoryV2.status === "BLOCKED" || component.status === "blocked" || structureAction?.status === "blocked";
    const requiresReview = params.factoryV2.status === "REVIEW_REQUIRED" || component.status === "review" || structureAction?.status === "review";
    const requiresStructureRegeneration = structureAction?.actionType === "requires_structure_regeneration";

    const status: ProductPackageRegenerationV2PatchStatus = hasFactoryBlock ? "blocked" : requiresReview ? "review" : "ready";

    const patchType: ProductPackageRegenerationV2Patch["patchType"] = hasFactoryBlock
      ? "review_required"
      : requiresStructureRegeneration
        ? "regenerate_structure"
        : component.viewerSyncReady
          ? "update_metadata"
          : "preserve_geometry";

    return {
      id: `pp-v2-${component.componentId}`,
      componentId: component.componentId,
      displayName: component.displayName,
      patchType,
      status,
      keepsCustomerConfiguration: status !== "blocked",
      keepsExternalEnvelopeLocked: structureAction?.keepsExternalDimensions ?? true,
      viewerSyncHint: status === "blocked"
        ? "Non sincronizzare nel Viewer finché i blocchi factory non sono risolti."
        : requiresStructureRegeneration
          ? "Preparare geometria/metadata aggiornati per Viewer Sync V2 mantenendo materiali, accessori e LED."
          : "Sincronizzazione metadata-only compatibile con Viewer Sync V2.",
      note: structureAction?.note ?? component.note,
    };
  });

  const blocked = patches.filter((item) => item.status === "blocked").length;
  const review = patches.filter((item) => item.status === "review").length;
  const ready = patches.filter((item) => item.status === "ready").length;

  const status: ProductPackageRegenerationV2Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "PACKAGE_READY";

  return {
    schema: "bagastudio-product-package-regeneration-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    sourceProductPackageV1Schema: params.productPackageV1.schema,
    sourceViewerSyncV1Schema: params.viewerSyncV1.schema,
    sourceStructureEditorV1Schema: params.structureEditorV1.schema,
    totals: {
      patches: patches.length,
      ready,
      review,
      blocked,
      preserveGeometry: patches.filter((item) => item.patchType === "preserve_geometry").length,
      metadataUpdates: patches.filter((item) => item.patchType === "update_metadata").length,
      structureRegeneration: patches.filter((item) => item.patchType === "regenerate_structure").length,
    },
    packageRules: {
      preserveMaterials: true,
      preserveAccessories: true,
      preserveLedConfiguration: true,
      preserveCustomerConfiguration: true,
      keepExternalEnvelopeLocked: params.structureEditorV1.structureRules.keepExternalEnvelopeLocked,
      regenerateComponentsMetadataOnly: status !== "BLOCKED",
    },
    patches,
    recommendations: [
      status === "PACKAGE_READY"
        ? "Product Package Regeneration V2 pronto: il pacchetto può alimentare Viewer Sync V2 senza perdere materiali, accessori e LED del cliente."
        : "Correggere review/blocchi prima di applicare la patch Product Package al Viewer.",
      "Mantenere separata la configurazione cliente dal layer produttivo: materiali, texture, accessori, LED e Kelvin non devono essere sovrascritti dalle modifiche factory.",
      "Questo step resta diagnostico: la riscrittura reale della geometria/componenti arriverà con Product Package Regeneration V3 / Viewer Sync V2 applicativo.",
    ],
  };
}

const productPackageRegenerationV2Report = useMemo(() => {
  return buildProductPackageRegenerationV2Report({
    factoryV2: factoryEngineV2Report,
    productPackageV1: productPackageRegenerationV1Report,
    viewerSyncV1: viewerSyncV1Report,
    structureEditorV1: parametricStructureEditorV1Report,
  });
}, [factoryEngineV2Report, productPackageRegenerationV1Report, viewerSyncV1Report, parametricStructureEditorV1Report]);

function downloadProductPackageRegenerationV2Report() {
  downloadJsonFile(`bagastudio-product-package-regeneration-v2-${Date.now()}.json`, productPackageRegenerationV2Report);
}


type ViewerSyncV2Status = "VIEWER_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type ViewerSyncV2SyncMode = "metadata_only" | "geometry_patch" | "structure_regeneration" | "blocked";

type ViewerSyncV2ItemStatus = "ready" | "review" | "blocked";

type ViewerSyncV2Item = {
  id: string;
  componentId: string;
  displayName: string;
  syncMode: ViewerSyncV2SyncMode;
  status: ViewerSyncV2ItemStatus;
  preservesMaterials: boolean;
  preservesAccessories: boolean;
  preservesLedConfiguration: boolean;
  preservesCustomerConfiguration: boolean;
  requiresViewerRefresh: boolean;
  requiresGeometryRebuild: boolean;
  note: string;
};

type ViewerSyncV2Report = {
  schema: "bagastudio-viewer-sync-v2";
  version: 2;
  generatedAt: string;
  status: ViewerSyncV2Status;
  sourceProductPackageV2Schema: ProductPackageRegenerationV2Report["schema"];
  sourceProductPackageV2Status: ProductPackageRegenerationV2Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    metadataOnly: number;
    geometryPatch: number;
    structureRegeneration: number;
  };
  viewerRules: {
    preserveExistingMaterials: boolean;
    preserveExistingAccessories: boolean;
    preserveExistingLedAndKelvin: boolean;
    preserveCustomerSelections: boolean;
    allowMetadataOnlySync: boolean;
    requireManualReviewBeforeGeometryRebuild: boolean;
  };
  items: ViewerSyncV2Item[];
  recommendations: string[];
};

function buildViewerSyncV2Report(params: {
  productPackageV2: ProductPackageRegenerationV2Report;
  factoryV2: FactoryEngineV2Report;
}): ViewerSyncV2Report {
  const items: ViewerSyncV2Item[] = params.productPackageV2.patches.map((patch) => {
    const requiresGeometryRebuild = patch.patchType === "regenerate_structure";
    const isBlocked = patch.status === "blocked" || params.factoryV2.status === "BLOCKED";
    const requiresReview = patch.status === "review" || params.factoryV2.status === "REVIEW_REQUIRED" || requiresGeometryRebuild;

    const syncMode: ViewerSyncV2SyncMode = isBlocked
      ? "blocked"
      : requiresGeometryRebuild
        ? "structure_regeneration"
        : patch.patchType === "update_metadata"
          ? "metadata_only"
          : "geometry_patch";

    const status: ViewerSyncV2ItemStatus = isBlocked ? "blocked" : requiresReview ? "review" : "ready";

    return {
      id: `viewer-sync-v2-${patch.componentId}`,
      componentId: patch.componentId,
      displayName: patch.displayName,
      syncMode,
      status,
      preservesMaterials: patch.keepsCustomerConfiguration,
      preservesAccessories: patch.keepsCustomerConfiguration,
      preservesLedConfiguration: patch.keepsCustomerConfiguration,
      preservesCustomerConfiguration: patch.keepsCustomerConfiguration,
      requiresViewerRefresh: status !== "blocked",
      requiresGeometryRebuild,
      note: status === "blocked"
        ? "Bloccato: risolvere prima gli errori factory o Product Package."
        : requiresGeometryRebuild
          ? "Review richiesta: struttura modificata, sincronizzare nel Viewer solo dopo conferma geometria/Product Package."
          : "Sincronizzazione Viewer V2 pronta senza sovrascrivere materiali, accessori, LED e configurazione cliente.",
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const ready = items.filter((item) => item.status === "ready").length;

  const status: ViewerSyncV2Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "VIEWER_READY";

  return {
    schema: "bagastudio-viewer-sync-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceProductPackageV2Schema: params.productPackageV2.schema,
    sourceProductPackageV2Status: params.productPackageV2.status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    totals: {
      components: items.length,
      ready,
      review,
      blocked,
      metadataOnly: items.filter((item) => item.syncMode === "metadata_only").length,
      geometryPatch: items.filter((item) => item.syncMode === "geometry_patch").length,
      structureRegeneration: items.filter((item) => item.syncMode === "structure_regeneration").length,
    },
    viewerRules: {
      preserveExistingMaterials: true,
      preserveExistingAccessories: true,
      preserveExistingLedAndKelvin: true,
      preserveCustomerSelections: true,
      allowMetadataOnlySync: status !== "BLOCKED",
      requireManualReviewBeforeGeometryRebuild: true,
    },
    items,
    recommendations: [
      status === "VIEWER_READY"
        ? "Viewer Sync V2 pronto: il Viewer può ricevere la patch Product Package preservando materiali, accessori e LED scelti dal cliente."
        : "Prima della sincronizzazione Viewer risolvere blocchi/review segnalati da Product Package V2 e Factory Engine V2.",
      "Separare sempre il layer factory dal layer commerciale: la rigenerazione produttiva non deve cancellare texture, accessori, LED, Kelvin e configurazione cliente.",
      "Le modifiche strutturali richiedono conferma manuale prima del rebuild geometrico completo nel Viewer.",
    ],
  };
}

const viewerSyncV2Report = useMemo(() => {
  return buildViewerSyncV2Report({
    productPackageV2: productPackageRegenerationV2Report,
    factoryV2: factoryEngineV2Report,
  });
}, [productPackageRegenerationV2Report, factoryEngineV2Report]);

function downloadViewerSyncV2Report() {
  downloadJsonFile(`bagastudio-viewer-sync-v2-${Date.now()}.json`, viewerSyncV2Report);
}


type FactoryProductionPackageV1Status = "PRODUCTION_READY" | "REVIEW_REQUIRED" | "BLOCKED";

type FactoryProductionPackageV1ItemStatus = "ready" | "review" | "blocked";

type FactoryProductionPackageV1Item = {
  id: string;
  componentId: string;
  displayName: string;
  status: FactoryProductionPackageV1ItemStatus;
  includeInFactoryPackage: boolean;
  includeInViewerPackage: boolean;
  includeInCsvCixExport: boolean;
  includeInBom: boolean;
  preservesCustomerConfiguration: boolean;
  note: string;
};

type FactoryProductionPackageV1Report = {
  schema: "bagastudio-factory-production-package-v1";
  version: 1;
  generatedAt: string;
  status: FactoryProductionPackageV1Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  sourceProductPackageV2Schema: ProductPackageRegenerationV2Report["schema"];
  sourceProductPackageV2Status: ProductPackageRegenerationV2Status;
  sourceViewerSyncV2Schema: ViewerSyncV2Report["schema"];
  sourceViewerSyncV2Status: ViewerSyncV2Status;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    factoryIncluded: number;
    viewerIncluded: number;
    csvCixIncluded: number;
    bomIncluded: number;
  };
  packageRules: {
    requireFactoryReady: boolean;
    requireViewerSyncReady: boolean;
    preserveCustomerMaterialsAccessoriesLed: boolean;
    includeCsvCixPayload: boolean;
    includeBomPayload: boolean;
    requireManualApprovalOnReview: boolean;
  };
  items: FactoryProductionPackageV1Item[];
  recommendations: string[];
};

function buildFactoryProductionPackageV1Report(params: {
  factoryV2: FactoryEngineV2Report;
  productPackageV2: ProductPackageRegenerationV2Report;
  viewerSyncV2: ViewerSyncV2Report;
}): FactoryProductionPackageV1Report {
  const items: FactoryProductionPackageV1Item[] = params.viewerSyncV2.items.map((viewerItem) => {
    const productPatch = params.productPackageV2.patches.find((patch) => patch.componentId === viewerItem.componentId);
    const isBlocked = viewerItem.status === "blocked" || params.factoryV2.status === "BLOCKED" || params.productPackageV2.status === "BLOCKED";
    const requiresReview = viewerItem.status === "review" || params.factoryV2.status === "REVIEW_REQUIRED" || params.productPackageV2.status === "REVIEW_REQUIRED";
    const status: FactoryProductionPackageV1ItemStatus = isBlocked ? "blocked" : requiresReview ? "review" : "ready";

    return {
      id: `factory-production-package-v1-${viewerItem.componentId}`,
      componentId: viewerItem.componentId,
      displayName: viewerItem.displayName,
      status,
      includeInFactoryPackage: status !== "blocked",
      includeInViewerPackage: status !== "blocked" && viewerItem.requiresViewerRefresh,
      includeInCsvCixExport: status !== "blocked" && !!productPatch,
      includeInBom: status !== "blocked",
      preservesCustomerConfiguration: viewerItem.preservesCustomerConfiguration,
      note: status === "blocked"
        ? "Componente escluso dal pacchetto produzione: risolvere blocchi factory/Product Package/Viewer Sync."
        : status === "review"
          ? "Componente inseribile solo dopo approvazione tecnica manuale."
          : "Componente pronto per pacchetto produzione con configurazione cliente preservata.",
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const ready = items.filter((item) => item.status === "ready").length;

  const status: FactoryProductionPackageV1Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "PRODUCTION_READY";

  return {
    schema: "bagastudio-factory-production-package-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    sourceProductPackageV2Schema: params.productPackageV2.schema,
    sourceProductPackageV2Status: params.productPackageV2.status,
    sourceViewerSyncV2Schema: params.viewerSyncV2.schema,
    sourceViewerSyncV2Status: params.viewerSyncV2.status,
    totals: {
      components: items.length,
      ready,
      review,
      blocked,
      factoryIncluded: items.filter((item) => item.includeInFactoryPackage).length,
      viewerIncluded: items.filter((item) => item.includeInViewerPackage).length,
      csvCixIncluded: items.filter((item) => item.includeInCsvCixExport).length,
      bomIncluded: items.filter((item) => item.includeInBom).length,
    },
    packageRules: {
      requireFactoryReady: true,
      requireViewerSyncReady: true,
      preserveCustomerMaterialsAccessoriesLed: true,
      includeCsvCixPayload: true,
      includeBomPayload: true,
      requireManualApprovalOnReview: true,
    },
    items,
    recommendations: [
      status === "PRODUCTION_READY"
        ? "Factory Production Package V1 pronto: il progetto può essere consegnato al flusso produzione mantenendo il ponte Viewer/Product Package."
        : "Prima della consegna produzione risolvere i blocchi o approvare manualmente gli elementi in review.",
      "Il pacchetto produzione deve includere CSV/CIX, BOM, report factory, Product Package rigenerato e istruzioni Viewer Sync senza cancellare la configurazione cliente.",
      "Questo step resta diagnostico: la generazione fisica dei file finali arriverà con Factory Production Package V2 / Export Bundle reale.",
    ],
  };
}

const factoryProductionPackageV1Report = useMemo(() => {
  return buildFactoryProductionPackageV1Report({
    factoryV2: factoryEngineV2Report,
    productPackageV2: productPackageRegenerationV2Report,
    viewerSyncV2: viewerSyncV2Report,
  });
}, [factoryEngineV2Report, productPackageRegenerationV2Report, viewerSyncV2Report]);

function downloadFactoryProductionPackageV1Report() {
  downloadJsonFile(`bagastudio-factory-production-package-v1-${Date.now()}.json`, factoryProductionPackageV1Report);
}


type LayoutRoomIntelligenceV1Status = "ROOM_READY" | "ROOM_REVIEW_REQUIRED" | "ROOM_BLOCKED";

type LayoutRoomIntelligenceV1CheckStatus = "pass" | "review" | "blocked";

type LayoutRoomIntelligenceV1Check = {
  id: string;
  label: string;
  status: LayoutRoomIntelligenceV1CheckStatus;
  category: "layout" | "baseboard" | "wall_support" | "clearance" | "technical_sheets";
  note: string;
  recommendation: string;
};

type LayoutRoomIntelligenceV1Report = {
  schema: "bagastudio-layout-room-intelligence-v1";
  version: 1;
  generatedAt: string;
  status: LayoutRoomIntelligenceV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  assumptions: {
    planInputMode: "manual_trace" | "image_pdf_reference" | "dxf_future";
    baseboardDataRequired: boolean;
    wallMaterialDataRequired: boolean;
    furnitureFootprintValidationRequired: boolean;
    technicalSheetGenerationReady: boolean;
  };
  totals: {
    checks: number;
    pass: number;
    review: number;
    blocked: number;
    furnitureItemsLinked: number;
  };
  checks: LayoutRoomIntelligenceV1Check[];
  recommendations: string[];
};

function buildLayoutRoomIntelligenceV1Report(params: {
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutRoomIntelligenceV1Report {
  const productionBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const productionReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const checks: LayoutRoomIntelligenceV1Check[] = [
    {
      id: "layout-plan-input",
      label: "Piantina locale / ingombri mobili",
      status: "review",
      category: "layout",
      note: "Modulo predisposto per piantina caricata e tracciamento guidato di muri, aperture, quote e ingombri mobili.",
      recommendation: "Prima fase: usare tracciamento manuale controllato; DXF/DWG e riconoscimento automatico arriveranno come step successivi.",
    },
    {
      id: "baseboard-clearance-check",
      label: "Battiscopa e scasso mobili",
      status: "review",
      category: "baseboard",
      note: "Richiede dati battiscopa: presenza, altezza, spessore e posizione rispetto ai mobili a parete.",
      recommendation: "Se il battiscopa è presente, verificare sempre scasso, distacco o zoccolo tecnico prima di confermare produzione.",
    },
    {
      id: "wall-support-check",
      label: "Tipologia parete e ferramenta fissaggio",
      status: "review",
      category: "wall_support",
      note: "Richiede indicazione parete: muratura, cartongesso, cemento o supporto non idoneo.",
      recommendation: "La scelta ferramenta deve dipendere dal supporto; mensole e pensili su cartongesso richiedono verifica strutturale e fissaggi dedicati.",
    },
    {
      id: "clearance-and-opening-check",
      label: "Passaggi, aperture e collisioni ambiente",
      status: productionBlocked ? "blocked" : "review",
      category: "clearance",
      note: productionBlocked
        ? "Il pacchetto produzione è bloccato: non validare passaggi e montabilità locale prima di risolvere i blocchi factory."
        : "Modulo predisposto per verificare passaggi, apertura ante/cassetti, porte, pilastri e interferenze con pareti.",
      recommendation: "Integrare quote minime di passaggio, area apertura frontali e collisioni con ingombri reali della piantina.",
    },
    {
      id: "technical-sheets-from-layout",
      label: "Schede tecniche da layout",
      status: productionBlocked ? "blocked" : productionReview ? "review" : "pass",
      category: "technical_sheets",
      note: productionBlocked
        ? "Schede tecniche non rilasciabili finché il Factory Production Package è bloccato."
        : "Predisposizione per schede tecniche con punti fissaggio, battiscopa, pareti, quote ambiente e distinta ferramenta.",
      recommendation: "Le schede tecniche devono includere alert montaggio, punti elettrici/idraulici/fissaggio e note parete/battiscopa.",
    },
  ];

  const blocked = checks.filter((check) => check.status === "blocked").length;
  const review = checks.filter((check) => check.status === "review").length;
  const pass = checks.filter((check) => check.status === "pass").length;

  const status: LayoutRoomIntelligenceV1Status = blocked > 0
    ? "ROOM_BLOCKED"
    : review > 0
      ? "ROOM_REVIEW_REQUIRED"
      : "ROOM_READY";

  return {
    schema: "bagastudio-layout-room-intelligence-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    assumptions: {
      planInputMode: "manual_trace",
      baseboardDataRequired: true,
      wallMaterialDataRequired: true,
      furnitureFootprintValidationRequired: true,
      technicalSheetGenerationReady: status !== "ROOM_BLOCKED",
    },
    totals: {
      checks: checks.length,
      pass,
      review,
      blocked,
      furnitureItemsLinked: params.factoryProductionPackage.totals.components,
    },
    checks,
    recommendations: [
      "Layout Intelligence V1 deve partire con input guidato: piantina caricata, tracciamento muri/aperture e conferma manuale degli ingombri mobili.",
      "Battiscopa, tipo parete e punti tecnici devono diventare dati obbligatori prima della generazione schede tecniche definitive.",
      "Questo modulo prepara il ponte tra piantina, Product Package, Factory Engine, Viewer Sync e schede tecniche PDF/DXF.",
    ],
  };
}

const layoutRoomIntelligenceV1Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV1Report({
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [factoryProductionPackageV1Report]);

function downloadLayoutRoomIntelligenceV1Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v1-${Date.now()}.json`, layoutRoomIntelligenceV1Report);
}


type LayoutTechnicalSheetGeneratorV1Status = "SHEETS_READY" | "SHEETS_REVIEW_REQUIRED" | "SHEETS_BLOCKED";

type LayoutTechnicalSheetGeneratorV1SectionStatus = "ready" | "review" | "blocked";

type LayoutTechnicalSheetGeneratorV1Section = {
  id: string;
  title: string;
  status: LayoutTechnicalSheetGeneratorV1SectionStatus;
  source: "layout" | "factory" | "mounting" | "technical_points";
  requiredData: string[];
  output: string;
  note: string;
};

type LayoutTechnicalSheetGeneratorV1Report = {
  schema: "bagastudio-layout-technical-sheet-generator-v1";
  version: 1;
  generatedAt: string;
  status: LayoutTechnicalSheetGeneratorV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  totals: {
    sections: number;
    ready: number;
    review: number;
    blocked: number;
    furnitureItemsLinked: number;
  };
  generationRules: {
    requireLayoutTraceApproval: boolean;
    requireBaseboardData: boolean;
    requireWallSupportData: boolean;
    requireFactoryPackageNotBlocked: boolean;
    includeMountingWarnings: boolean;
    includeFixingHardwareNotes: boolean;
  };
  sections: LayoutTechnicalSheetGeneratorV1Section[];
  recommendations: string[];
};

function buildLayoutTechnicalSheetGeneratorV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutTechnicalSheetGeneratorV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const factoryBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const factoryReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const sections: LayoutTechnicalSheetGeneratorV1Section[] = [
    {
      id: "sheet-room-layout-reference",
      title: "Riferimento piantina e ingombri",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      requiredData: ["piantina caricata", "quote ambiente", "muri/aperture tracciati", "ingombri mobili confermati"],
      output: "Tavola layout con muri, aperture, mobili, quote principali e aree di passaggio.",
      note: layoutBlocked
        ? "La scheda layout resta bloccata finché Layout Intelligence segnala errori critici."
        : "Predisposta per generare la prima tavola tecnica partendo da pianta e ingombri mobili approvati.",
    },
    {
      id: "sheet-baseboard-and-clearance",
      title: "Battiscopa, scassi e distacchi",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      requiredData: ["presenza battiscopa", "altezza battiscopa", "spessore battiscopa", "tipo scasso mobile"],
      output: "Alert su scassi mancanti, distacchi necessari, zoccoli tecnici e interferenze con parete.",
      note: "Questa scheda deve impedire produzione/installazione se il mobile non prevede scasso con battiscopa dichiarato.",
    },
    {
      id: "sheet-wall-support-and-fixings",
      title: "Pareti, supporti e fissaggi",
      status: layoutBlocked || factoryBlocked ? "blocked" : "review",
      source: "mounting",
      requiredData: ["tipo parete", "carichi previsti", "ferramenta fissaggio", "punti ancoraggio"],
      output: "Indicazioni di montaggio per muratura/cartongesso/cemento e avvisi su mensole o pensili non idonei.",
      note: "La ferramenta di fissaggio deve dipendere dal supporto reale e dalle regole del Factory Engine.",
    },
    {
      id: "sheet-factory-production-summary",
      title: "Riepilogo produzione e BOM",
      status: factoryBlocked ? "blocked" : factoryReview || layoutReview ? "review" : "ready",
      source: "factory",
      requiredData: ["Factory Production Package", "BOM", "CSV/CIX pipeline", "Hardware Reposition"],
      output: "Riepilogo componenti, ferramenta, lavorazioni, warning e stato produzione.",
      note: "Questa scheda collega layout e produzione, senza sostituire ancora l'export CSV/CIX finale reale.",
    },
    {
      id: "sheet-technical-points",
      title: "Punti tecnici e predisposizioni",
      status: layoutBlocked ? "blocked" : "review",
      source: "technical_points",
      requiredData: ["prese", "scarichi", "carichi acqua", "passacavi", "fori tecnici"],
      output: "Tavola predisposizioni tecniche con punti elettrici/idraulici/fissaggio e note montaggio.",
      note: "È il ponte verso il modulo punti tecnici parametrico già previsto nella roadmap BagaStudio Core.",
    },
  ];

  const blocked = sections.filter((section) => section.status === "blocked").length;
  const review = sections.filter((section) => section.status === "review").length;
  const ready = sections.filter((section) => section.status === "ready").length;

  const status: LayoutTechnicalSheetGeneratorV1Status = blocked > 0
    ? "SHEETS_BLOCKED"
    : review > 0
      ? "SHEETS_REVIEW_REQUIRED"
      : "SHEETS_READY";

  return {
    schema: "bagastudio-layout-technical-sheet-generator-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    totals: {
      sections: sections.length,
      ready,
      review,
      blocked,
      furnitureItemsLinked: params.layout.totals.furnitureItemsLinked,
    },
    generationRules: {
      requireLayoutTraceApproval: true,
      requireBaseboardData: true,
      requireWallSupportData: true,
      requireFactoryPackageNotBlocked: true,
      includeMountingWarnings: true,
      includeFixingHardwareNotes: true,
    },
    sections,
    recommendations: [
      "Generare schede tecniche solo dopo approvazione manuale del tracciamento piantina e degli ingombri mobili.",
      "Battiscopa, pareti e fissaggi devono essere dati obbligatori prima della consegna al montaggio.",
      "La prima versione produce report diagnostico; gli step successivi genereranno PDF/DXF con tavole quotate e simboli tecnici.",
    ],
  };
}

const layoutTechnicalSheetGeneratorV1Report = useMemo(() => {
  return buildLayoutTechnicalSheetGeneratorV1Report({
    layout: layoutRoomIntelligenceV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, factoryProductionPackageV1Report]);

function downloadLayoutTechnicalSheetGeneratorV1Report() {
  downloadJsonFile(`bagastudio-layout-technical-sheet-generator-v1-${Date.now()}.json`, layoutTechnicalSheetGeneratorV1Report);
}


type LayoutDxfCadExportPrepV1Status = "CAD_READY" | "CAD_REVIEW_REQUIRED" | "CAD_BLOCKED";

type LayoutDxfCadExportPrepV1LayerStatus = "ready" | "review" | "blocked";

type LayoutDxfCadExportPrepV1Layer = {
  id: string;
  layerName: string;
  status: LayoutDxfCadExportPrepV1LayerStatus;
  source: "layout" | "technical_sheet" | "factory" | "mounting";
  entities: string[];
  outputTarget: "DXF" | "PDF" | "DXF_PDF";
  note: string;
};

type LayoutDxfCadExportPrepV1Report = {
  schema: "bagastudio-layout-dxf-cad-export-prep-v1";
  version: 1;
  generatedAt: string;
  status: LayoutDxfCadExportPrepV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceTechnicalSheetSchema: LayoutTechnicalSheetGeneratorV1Report["schema"];
  sourceTechnicalSheetStatus: LayoutTechnicalSheetGeneratorV1Status;
  sourceFactoryProductionPackageSchema: FactoryProductionPackageV1Report["schema"];
  sourceFactoryProductionPackageStatus: FactoryProductionPackageV1Status;
  totals: {
    layers: number;
    ready: number;
    review: number;
    blocked: number;
    dxfTargets: number;
    pdfTargets: number;
  };
  exportRules: {
    requireApprovedLayoutTrace: boolean;
    requireScaledRoomReference: boolean;
    requireWallAndOpeningLayers: boolean;
    requireFurnitureFootprintLayers: boolean;
    requireTechnicalPointLayers: boolean;
    requireMountingAndFixingNotes: boolean;
    preserveProductPackageIds: boolean;
  };
  layers: LayoutDxfCadExportPrepV1Layer[];
  recommendations: string[];
};

function buildLayoutDxfCadExportPrepV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  technicalSheets: LayoutTechnicalSheetGeneratorV1Report;
  factoryProductionPackage: FactoryProductionPackageV1Report;
}): LayoutDxfCadExportPrepV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const sheetsBlocked = params.technicalSheets.status === "SHEETS_BLOCKED";
  const factoryBlocked = params.factoryProductionPackage.status === "BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const sheetsReview = params.technicalSheets.status === "SHEETS_REVIEW_REQUIRED";
  const factoryReview = params.factoryProductionPackage.status === "REVIEW_REQUIRED";

  const layers: LayoutDxfCadExportPrepV1Layer[] = [
    {
      id: "cad-layer-room-walls-openings",
      layerName: "BGS_ROOM_WALLS_OPENINGS",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      entities: ["muri", "porte", "finestre", "quote ambiente", "aree non finestrabili"],
      outputTarget: "DXF_PDF",
      note: "Layer base per esportare piantina, aperture e riferimenti ambiente. Richiede scala e tracciamento approvati.",
    },
    {
      id: "cad-layer-furniture-footprints",
      layerName: "BGS_FURNITURE_FOOTPRINTS",
      status: layoutBlocked || factoryBlocked ? "blocked" : layoutReview || factoryReview ? "review" : "ready",
      source: "factory",
      entities: ["ingombri mobili", "productPackageId", "componenti principali", "quote esterne bloccate"],
      outputTarget: "DXF_PDF",
      note: "Layer degli ingombri mobili collegato al Product Package e al Factory Production Package.",
    },
    {
      id: "cad-layer-baseboard-clearance",
      layerName: "BGS_BASEBOARD_CLEARANCE",
      status: layoutBlocked ? "blocked" : "review",
      source: "layout",
      entities: ["battiscopa", "scassi", "distacchi parete", "zoccoli tecnici"],
      outputTarget: "DXF_PDF",
      note: "Layer dedicato a battiscopa e scassi per evitare errori in produzione e montaggio.",
    },
    {
      id: "cad-layer-technical-points",
      layerName: "BGS_TECHNICAL_POINTS",
      status: sheetsBlocked ? "blocked" : "review",
      source: "technical_sheet",
      entities: ["prese", "scarichi", "carichi acqua", "passacavi", "punti fissaggio"],
      outputTarget: "DXF_PDF",
      note: "Predisposizione per punti tecnici elettrici, idraulici e fissaggi con futura esportazione quotata.",
    },
    {
      id: "cad-layer-mounting-fixings",
      layerName: "BGS_MOUNTING_FIXINGS",
      status: factoryBlocked || sheetsBlocked ? "blocked" : "review",
      source: "mounting",
      entities: ["tipo parete", "ferramenta fissaggio", "ancoraggi", "warning montaggio"],
      outputTarget: "PDF",
      note: "Layer/note per montaggio: muratura, cartongesso, supporti deboli, mensole e pensili.",
    },
  ];

  const blocked = layers.filter((layer) => layer.status === "blocked").length;
  const review = layers.filter((layer) => layer.status === "review").length;
  const ready = layers.filter((layer) => layer.status === "ready").length;
  const dxfTargets = layers.filter((layer) => layer.outputTarget === "DXF" || layer.outputTarget === "DXF_PDF").length;
  const pdfTargets = layers.filter((layer) => layer.outputTarget === "PDF" || layer.outputTarget === "DXF_PDF").length;

  const status: LayoutDxfCadExportPrepV1Status = blocked > 0
    ? "CAD_BLOCKED"
    : review > 0
      ? "CAD_REVIEW_REQUIRED"
      : "CAD_READY";

  return {
    schema: "bagastudio-layout-dxf-cad-export-prep-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceTechnicalSheetSchema: params.technicalSheets.schema,
    sourceTechnicalSheetStatus: params.technicalSheets.status,
    sourceFactoryProductionPackageSchema: params.factoryProductionPackage.schema,
    sourceFactoryProductionPackageStatus: params.factoryProductionPackage.status,
    totals: {
      layers: layers.length,
      ready,
      review,
      blocked,
      dxfTargets,
      pdfTargets,
    },
    exportRules: {
      requireApprovedLayoutTrace: true,
      requireScaledRoomReference: true,
      requireWallAndOpeningLayers: true,
      requireFurnitureFootprintLayers: true,
      requireTechnicalPointLayers: true,
      requireMountingAndFixingNotes: true,
      preserveProductPackageIds: true,
    },
    layers,
    recommendations: [
      "Prima dell'export DXF reale serve una pianta in scala approvata o un riferimento quotato certo.",
      "Ogni ingombro mobile deve mantenere productPackageId e componentId per restare sincronizzato con Viewer e Factory Engine.",
      "Le prime esportazioni saranno diagnostiche; la fase successiva dovrà generare entità DXF reali con layer e quote tecniche.",
    ],
  };
}

const layoutDxfCadExportPrepV1Report = useMemo(() => {
  return buildLayoutDxfCadExportPrepV1Report({
    layout: layoutRoomIntelligenceV1Report,
    technicalSheets: layoutTechnicalSheetGeneratorV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, layoutTechnicalSheetGeneratorV1Report, factoryProductionPackageV1Report]);

function downloadLayoutDxfCadExportPrepV1Report() {
  downloadJsonFile(`bagastudio-layout-dxf-cad-export-prep-v1-${Date.now()}.json`, layoutDxfCadExportPrepV1Report);
}


type TechnicalWallElevationSheetsV1Status = "ELEVATIONS_READY" | "ELEVATIONS_REVIEW_REQUIRED" | "ELEVATIONS_BLOCKED";

type TechnicalWallElevationSheetsV1LayerStatus = "ready" | "review" | "blocked";

type TechnicalWallElevationSheetsV1LayerKind =
  | "furniture_outline"
  | "dimensions"
  | "electrical"
  | "plumbing"
  | "fixing"
  | "mounting_notes";

type TechnicalWallElevationSheetsV1Layer = {
  id: string;
  layerName: string;
  label: string;
  kind: TechnicalWallElevationSheetsV1LayerKind;
  status: TechnicalWallElevationSheetsV1LayerStatus;
  colorHint: string;
  entities: string[];
  requiredForPdf: boolean;
  requiredForDxf: boolean;
  note: string;
};

type TechnicalWallElevationSheetsV1Report = {
  schema: "bagastudio-technical-wall-elevation-sheets-v1";
  version: 1;
  generatedAt: string;
  status: TechnicalWallElevationSheetsV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sourceTechnicalSheetSchema: LayoutTechnicalSheetGeneratorV1Report["schema"];
  sourceTechnicalSheetStatus: LayoutTechnicalSheetGeneratorV1Status;
  sourceCadExportSchema: LayoutDxfCadExportPrepV1Report["schema"];
  sourceCadExportStatus: LayoutDxfCadExportPrepV1Status;
  totals: {
    layers: number;
    ready: number;
    review: number;
    blocked: number;
    pdfLayers: number;
    dxfLayers: number;
    technicalPointLayers: number;
  };
  wallElevationRules: {
    drawFurnitureFrontElevations: boolean;
    requireHotColdWaterPoints: boolean;
    requireDrainPoints: boolean;
    requireDrawerIntegratedSockets: boolean;
    requireWallFixingPoints: boolean;
    requireColorSeparatedLayers: boolean;
    preserveProductPackageIds: boolean;
  };
  layers: TechnicalWallElevationSheetsV1Layer[];
  recommendations: string[];
};

function buildTechnicalWallElevationSheetsV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  technicalSheets: LayoutTechnicalSheetGeneratorV1Report;
  cadExport: LayoutDxfCadExportPrepV1Report;
}): TechnicalWallElevationSheetsV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const sheetsBlocked = params.technicalSheets.status === "SHEETS_BLOCKED";
  const cadBlocked = params.cadExport.status === "CAD_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const sheetsReview = params.technicalSheets.status === "SHEETS_REVIEW_REQUIRED";
  const cadReview = params.cadExport.status === "CAD_REVIEW_REQUIRED";

  const baseBlocked = layoutBlocked || sheetsBlocked || cadBlocked;
  const baseReview = layoutReview || sheetsReview || cadReview;

  const layers: TechnicalWallElevationSheetsV1Layer[] = [
    {
      id: "wall-elevation-furniture-outline",
      layerName: "BGS_WALL_ELEVATION_FURNITURE_OUTLINE",
      label: "Contorno mobile in prospetto",
      kind: "furniture_outline",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "ready",
      colorHint: "mobile-outline",
      entities: ["prospetto mobile", "contorno mobile", "ingombro frontale", "productPackageId", "componentId"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Disegna i mobili in prospetto parete mantenendo ID prodotto e componenti per sincronizzazione con Viewer e Factory.",
    },
    {
      id: "wall-elevation-dimensions",
      layerName: "BGS_WALL_ELEVATION_DIMENSIONS",
      label: "Quote tecniche",
      kind: "dimensions",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "dimension-lines",
      entities: ["quote generali", "quote mobili", "quote punti tecnici", "distanze da pareti", "quote da pavimento"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Layer dedicato alle quote con colore separato per rendere leggibili prospetti e tavole tecniche.",
    },
    {
      id: "wall-elevation-electrical-points",
      layerName: "BGS_WALL_ELEVATION_ELECTRICAL_POINTS",
      label: "Punti elettrici e prese",
      kind: "electrical",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "electrical-points",
      entities: ["prese parete", "prese integrate nelle cassettiere", "passacavi", "punti alimentazione LED", "punti quadro"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Predispone prese e punti elettrici, incluse prese nelle cassettiere e alimentazioni accessori/LED.",
    },
    {
      id: "wall-elevation-plumbing-hot-cold-drain",
      layerName: "BGS_WALL_ELEVATION_PLUMBING",
      label: "Idraulica acqua calda/fredda/scarico",
      kind: "plumbing",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "plumbing-points",
      entities: ["carico acqua fredda", "carico acqua calda", "scarico", "sifone", "distanze tecniche", "quote da pavimento"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Layer per carico/scarico acqua con punti distinti e quotati per mobili tecnici, lavaggi e impianti.",
    },
    {
      id: "wall-elevation-fixing-points",
      layerName: "BGS_WALL_ELEVATION_FIXING_POINTS",
      label: "Punti fissaggio e supporto parete",
      kind: "fixing",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "fixing-points",
      entities: ["punti fissaggio", "tipo parete", "tasselli/ferramenta", "mensole", "pensili", "zone rinforzo"],
      requiredForPdf: true,
      requiredForDxf: true,
      note: "Collega prospetto parete alla verifica muratura/cartongesso e alla ferramenta corretta per fissaggi e mensole.",
    },
    {
      id: "wall-elevation-mounting-notes",
      layerName: "BGS_WALL_ELEVATION_MOUNTING_NOTES",
      label: "Note montaggio e controlli",
      kind: "mounting_notes",
      status: baseBlocked ? "blocked" : "review",
      colorHint: "mounting-notes",
      entities: ["note installatore", "avvisi battiscopa", "scassi", "errori locale", "vincoli montaggio"],
      requiredForPdf: true,
      requiredForDxf: false,
      note: "Note operative per montaggio, battiscopa, scassi e criticità rilevate da Layout Intelligence.",
    },
  ];

  const blocked = layers.filter((layer) => layer.status === "blocked").length;
  const review = layers.filter((layer) => layer.status === "review").length;
  const ready = layers.filter((layer) => layer.status === "ready").length;
  const pdfLayers = layers.filter((layer) => layer.requiredForPdf).length;
  const dxfLayers = layers.filter((layer) => layer.requiredForDxf).length;
  const technicalPointLayers = layers.filter((layer) => layer.kind === "electrical" || layer.kind === "plumbing" || layer.kind === "fixing").length;

  const status: TechnicalWallElevationSheetsV1Status = blocked > 0
    ? "ELEVATIONS_BLOCKED"
    : review > 0
      ? "ELEVATIONS_REVIEW_REQUIRED"
      : "ELEVATIONS_READY";

  return {
    schema: "bagastudio-technical-wall-elevation-sheets-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sourceTechnicalSheetSchema: params.technicalSheets.schema,
    sourceTechnicalSheetStatus: params.technicalSheets.status,
    sourceCadExportSchema: params.cadExport.schema,
    sourceCadExportStatus: params.cadExport.status,
    totals: {
      layers: layers.length,
      ready,
      review,
      blocked,
      pdfLayers,
      dxfLayers,
      technicalPointLayers,
    },
    wallElevationRules: {
      drawFurnitureFrontElevations: true,
      requireHotColdWaterPoints: true,
      requireDrainPoints: true,
      requireDrawerIntegratedSockets: true,
      requireWallFixingPoints: true,
      requireColorSeparatedLayers: true,
      preserveProductPackageIds: true,
    },
    layers,
    recommendations: [
      "Ogni prospetto parete deve mostrare mobili frontali, contorno mobile, quote e punti tecnici su layer/colore separato.",
      "I punti acqua calda/fredda/scarico devono essere quotati da pavimento e riferiti alla parete corretta prima dell'export PDF/DXF.",
      "Le prese integrate nelle cassettiere devono restare collegate al componente e al Product Package per evitare errori in produzione e montaggio.",
      "I punti fissaggio devono dipendere dal tipo parete dichiarato: muratura, cartongesso, cemento o supporto debole.",
    ],
  };
}

const technicalWallElevationSheetsV1Report = useMemo(() => {
  return buildTechnicalWallElevationSheetsV1Report({
    layout: layoutRoomIntelligenceV1Report,
    technicalSheets: layoutTechnicalSheetGeneratorV1Report,
    cadExport: layoutDxfCadExportPrepV1Report,
  });
}, [layoutRoomIntelligenceV1Report, layoutTechnicalSheetGeneratorV1Report, layoutDxfCadExportPrepV1Report]);

function downloadTechnicalWallElevationSheetsV1Report() {
  downloadJsonFile(`bagastudio-technical-wall-elevation-sheets-v1-${Date.now()}.json`, technicalWallElevationSheetsV1Report);
}


type WallTechnicalPointsValidationV1Status = "TECHNICAL_POINTS_READY" | "TECHNICAL_POINTS_REVIEW_REQUIRED" | "TECHNICAL_POINTS_BLOCKED";

type WallTechnicalPointsValidationV1Severity = "info" | "warning" | "error";

type WallTechnicalPointsValidationV1RuleKind =
  | "sink_height"
  | "hot_cold_water"
  | "drain"
  | "electrical_socket"
  | "drawer_socket"
  | "wall_fixing"
  | "baseboard_cutout"
  | "sheet_layer_quality";

type WallTechnicalPointsValidationV1Rule = {
  id: string;
  label: string;
  kind: WallTechnicalPointsValidationV1RuleKind;
  severity: WallTechnicalPointsValidationV1Severity;
  status: "passed" | "review" | "blocked";
  expected: string;
  actual: string;
  note: string;
};

type WallTechnicalPointsValidationV1Report = {
  schema: "bagastudio-wall-technical-points-validation-v1";
  version: 1;
  generatedAt: string;
  status: WallTechnicalPointsValidationV1Status;
  sourceElevationSchema: TechnicalWallElevationSheetsV1Report["schema"];
  sourceElevationStatus: TechnicalWallElevationSheetsV1Status;
  sourceLayoutSchema: LayoutRoomIntelligenceV1Report["schema"];
  sourceLayoutStatus: LayoutRoomIntelligenceV1Status;
  sinkRules: {
    countertopSinkTopHeightMm: 850;
    insetSinkTopHeightMm: 930;
    requireSinkTypeBeforeFinalSheet: boolean;
    propagateHeightToPlumbingPoints: boolean;
    propagateHeightToWallElevations: boolean;
  };
  totals: {
    rules: number;
    passed: number;
    review: number;
    blocked: number;
    errors: number;
    warnings: number;
  };
  rules: WallTechnicalPointsValidationV1Rule[];
  recommendations: string[];
};

function buildWallTechnicalPointsValidationV1Report(params: {
  layout: LayoutRoomIntelligenceV1Report;
  elevations: TechnicalWallElevationSheetsV1Report;
}): WallTechnicalPointsValidationV1Report {
  const layoutBlocked = params.layout.status === "ROOM_BLOCKED";
  const elevationBlocked = params.elevations.status === "ELEVATIONS_BLOCKED";
  const layoutReview = params.layout.status === "ROOM_REVIEW_REQUIRED";
  const elevationReview = params.elevations.status === "ELEVATIONS_REVIEW_REQUIRED";

  const baseBlocked = layoutBlocked || elevationBlocked;
  const baseReview = layoutReview || elevationReview;

  const rules: WallTechnicalPointsValidationV1Rule[] = [
    {
      id: "sink-height-countertop",
      label: "Quota piano lavandino da appoggio",
      kind: "sink_height",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Piano a 850 mm da pavimento finito",
      actual: "Da validare in base al tipo lavandino selezionato nel Product Package",
      note: "Quando il cliente sceglie lavandino da appoggio, il prospetto deve fissare piano, quote idrauliche e note montaggio su 850 mm.",
    },
    {
      id: "sink-height-inset",
      label: "Quota piano lavandino da incasso",
      kind: "sink_height",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Piano a 930 mm da pavimento finito",
      actual: "Da validare in base al tipo lavandino selezionato nel Product Package",
      note: "Quando il cliente sceglie lavandino da incasso, il prospetto deve fissare piano, quote idrauliche e note montaggio su 930 mm.",
    },
    {
      id: "plumbing-hot-cold-water",
      label: "Carico acqua calda/fredda",
      kind: "hot_cold_water",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Punti caldo/freddo distinti, quotati e associati alla parete corretta",
      actual: "Predisposizione layer tecnica presente; coordinate finali da validare sul layout reale",
      note: "Il sistema dovrà evitare inversioni caldo/freddo e quote non coerenti con mobile, sifone e rubinetteria.",
    },
    {
      id: "plumbing-drain",
      label: "Scarico idraulico",
      kind: "drain",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Scarico quotato, centrato o dichiarato decentrato, senza collisioni con cassetti/fianchi",
      actual: "Da calcolare sul mobile e sul tipo lavabo selezionato",
      note: "Lo scarico deve essere verificato rispetto a cassetti, divisori, fondo mobile e accessibilità manutenzione.",
    },
    {
      id: "electrical-wall-sockets",
      label: "Prese elettriche parete",
      kind: "electrical_socket",
      severity: "warning",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "passed",
      expected: "Prese quotate, non nascoste da mobili o cassetti non accessibili",
      actual: baseReview ? "Layout da verificare" : "Predisposizione validabile",
      note: "Le prese devono essere leggibili in prospetto e collegate alla parete corretta.",
    },
    {
      id: "drawer-integrated-sockets",
      label: "Prese nelle cassettiere",
      kind: "drawer_socket",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Prese integrate collegate a componente/cassetto e alimentazione dedicata",
      actual: "Da associare a Product Package e distinta accessori",
      note: "Le prese nelle cassettiere devono comparire in scheda tecnica, distinta accessori e istruzioni montaggio.",
    },
    {
      id: "wall-fixing-support",
      label: "Fissaggi in base alla parete",
      kind: "wall_fixing",
      severity: "error",
      status: baseBlocked ? "blocked" : "review",
      expected: "Ferramenta distinta per muratura, cartongesso, cemento o supporto debole",
      actual: "Tipo parete da confermare in Layout Intelligence",
      note: "Mensole e pensili devono essere bloccati o messi in review se la parete non supporta il carico previsto.",
    },
    {
      id: "baseboard-cutout",
      label: "Battiscopa e scasso mobile",
      kind: "baseboard_cutout",
      severity: "warning",
      status: baseBlocked ? "blocked" : "review",
      expected: "Se battiscopa presente, scasso o distanziale mobile dichiarato e quotato",
      actual: "Da validare su rilievo cliente/utente",
      note: "La scheda deve avvisare quando il battiscopa esiste ma il mobile non prevede scasso corretto.",
    },
    {
      id: "sheet-layer-quality",
      label: "Qualità grafica scheda tecnica",
      kind: "sheet_layer_quality",
      severity: "info",
      status: baseBlocked ? "blocked" : baseReview ? "review" : "passed",
      expected: "Layer/colori separati per mobile, quote, elettrico, idraulico, fissaggi e note",
      actual: "Technical Wall Elevation Sheets V1 predisposto",
      note: "Le schede BagaStudio devono essere più pulite e professionali del DXF standard importato.",
    },
  ];

  const blocked = rules.filter((rule) => rule.status === "blocked").length;
  const review = rules.filter((rule) => rule.status === "review").length;
  const passed = rules.filter((rule) => rule.status === "passed").length;
  const errors = rules.filter((rule) => rule.severity === "error").length;
  const warnings = rules.filter((rule) => rule.severity === "warning").length;

  const status: WallTechnicalPointsValidationV1Status = blocked > 0
    ? "TECHNICAL_POINTS_BLOCKED"
    : review > 0
      ? "TECHNICAL_POINTS_REVIEW_REQUIRED"
      : "TECHNICAL_POINTS_READY";

  return {
    schema: "bagastudio-wall-technical-points-validation-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceElevationSchema: params.elevations.schema,
    sourceElevationStatus: params.elevations.status,
    sourceLayoutSchema: params.layout.schema,
    sourceLayoutStatus: params.layout.status,
    sinkRules: {
      countertopSinkTopHeightMm: 850,
      insetSinkTopHeightMm: 930,
      requireSinkTypeBeforeFinalSheet: true,
      propagateHeightToPlumbingPoints: true,
      propagateHeightToWallElevations: true,
    },
    totals: {
      rules: rules.length,
      passed,
      review,
      blocked,
      errors,
      warnings,
    },
    rules,
    recommendations: [
      "Prima della scheda finale il tipo lavandino deve essere esplicito: appoggio = piano 850 mm, incasso = piano 930 mm.",
      "Carico acqua calda/fredda e scarico devono essere quotati nel prospetto parete e verificati contro cassetti, divisori e fianchi.",
      "Le prese nelle cassettiere devono essere trattate come accessori tecnici collegati a componente, alimentazione e distinta accessori.",
      "La validazione parete deve scegliere ferramenta e fissaggi in base a muratura/cartongesso/cemento/supporto debole.",
    ],
  };
}

const wallTechnicalPointsValidationV1Report = useMemo(() => {
  return buildWallTechnicalPointsValidationV1Report({
    layout: layoutRoomIntelligenceV1Report,
    elevations: technicalWallElevationSheetsV1Report,
  });
}, [layoutRoomIntelligenceV1Report, technicalWallElevationSheetsV1Report]);

function downloadWallTechnicalPointsValidationV1Report() {
  downloadJsonFile(`bagastudio-wall-technical-points-validation-v1-${Date.now()}.json`, wallTechnicalPointsValidationV1Report);
}


type TechnicalKnowledgeBaseV1Category =
  | "plumbing"
  | "electrical"
  | "wall"
  | "baseboard"
  | "shelf"
  | "sink"
  | "technical_sheet";

type TechnicalKnowledgeBaseV1Severity = "info" | "warning" | "error";

type TechnicalKnowledgeBaseV1Rule = {
  id: string;
  category: TechnicalKnowledgeBaseV1Category;
  label: string;
  severity: TechnicalKnowledgeBaseV1Severity;
  appliesTo: string[];
  valueMm?: number;
  expected: string;
  validationTarget: string;
  note: string;
};

type TechnicalKnowledgeBaseV1Report = {
  schema: "bagastudio-technical-knowledge-base-v1";
  version: 1;
  generatedAt: string;
  status: "KNOWLEDGE_BASE_READY" | "KNOWLEDGE_BASE_REVIEW_REQUIRED";
  sourceWallValidationSchema: WallTechnicalPointsValidationV1Report["schema"];
  sourceWallValidationStatus: WallTechnicalPointsValidationV1Status;
  totals: {
    rules: number;
    plumbing: number;
    electrical: number;
    wall: number;
    baseboard: number;
    shelf: number;
    sink: number;
    technicalSheet: number;
    errors: number;
    warnings: number;
    info: number;
  };
  sinkHeights: {
    countertopSinkTopHeightMm: 850;
    insetSinkTopHeightMm: 930;
  };
  rules: TechnicalKnowledgeBaseV1Rule[];
  recommendations: string[];
};

const TECHNICAL_KNOWLEDGE_BASE_V1_RULES: TechnicalKnowledgeBaseV1Rule[] = [
  {
    id: "sink-countertop-top-height-850",
    category: "sink",
    label: "Lavandino da appoggio",
    severity: "error",
    appliesTo: ["technical-wall-elevation", "plumbing-points", "layout-validation"],
    valueMm: 850,
    expected: "Piano mobile a 850 mm da terra per lavandino da appoggio.",
    validationTarget: "sinkType=countertop",
    note: "La quota deve propagarsi a prospetto parete, carico acqua calda/fredda, scarico e quote installatore.",
  },
  {
    id: "sink-inset-top-height-930",
    category: "sink",
    label: "Lavandino da incasso",
    severity: "error",
    appliesTo: ["technical-wall-elevation", "plumbing-points", "layout-validation"],
    valueMm: 930,
    expected: "Piano mobile a 930 mm da terra per lavandino da incasso.",
    validationTarget: "sinkType=inset",
    note: "La quota deve aggiornare prospetto, idraulica, scarico e schema tecnico PDF/DXF/CAD.",
  },
  {
    id: "plumbing-hot-cold-water-required",
    category: "plumbing",
    label: "Carico acqua calda/fredda",
    severity: "error",
    appliesTo: ["washbasin", "technical-wall-elevation"],
    expected: "Ogni lavabo deve avere carico acqua calda e fredda quotato e distinguibile.",
    validationTarget: "hotWaterPoint+coldWaterPoint",
    note: "Le schede devono separare graficamente acqua calda e fredda con layer/colori dedicati.",
  },
  {
    id: "plumbing-drain-required",
    category: "plumbing",
    label: "Scarico lavabo",
    severity: "error",
    appliesTo: ["washbasin", "technical-wall-elevation"],
    expected: "Ogni lavabo deve avere scarico quotato, leggibile e non in conflitto con cassetti o struttura.",
    validationTarget: "drainPoint",
    note: "Il controllo deve evidenziare conflitti con schiene, cassetti, divisori e ferramenta.",
  },
  {
    id: "electrical-drawer-socket-clearance",
    category: "electrical",
    label: "Prese nelle cassettiere",
    severity: "warning",
    appliesTo: ["drawer", "electrical-point", "technical-wall-elevation"],
    expected: "Le prese integrate in cassettiera devono evitare guide, schiene, cassetti e zone di scorrimento.",
    validationTarget: "drawerSocket",
    note: "Il futuro Smart Validator dovrà segnalare prese dietro cassetti o in conflitto con guide.",
  },
  {
    id: "electrical-led-mirror-power",
    category: "electrical",
    label: "Alimentazione specchio LED",
    severity: "warning",
    appliesTo: ["mirror", "led", "technical-wall-elevation"],
    expected: "Specchi LED e accessori elettrici devono avere punto alimentazione dedicato e quotato.",
    validationTarget: "mirrorLedPowerPoint",
    note: "Il punto deve essere esportabile in PDF/DXF/CAD e collegato alla configurazione cliente.",
  },
  {
    id: "wall-type-fixing-selection",
    category: "wall",
    label: "Tipo parete e fissaggio",
    severity: "error",
    appliesTo: ["wall", "shelf", "wall-cabinet", "technical-sheet"],
    expected: "La ferramenta di fissaggio deve cambiare in base a muratura, cartongesso, cemento o parete tecnica.",
    validationTarget: "wallType+fixingProfile",
    note: "Cartongesso e pareti deboli devono generare warning o blocco per mensole/pensili pesanti.",
  },
  {
    id: "baseboard-cutout-required",
    category: "baseboard",
    label: "Battiscopa e scasso mobile",
    severity: "warning",
    appliesTo: ["floor-cabinet", "layout", "technical-wall-elevation"],
    expected: "Se il battiscopa è presente, il mobile deve avere scasso, distanziale o nota tecnica.",
    validationTarget: "baseboardPresence+baseboardCutout",
    note: "BagaStudio deve avvisare se il rilievo indica battiscopa ma il mobile non prevede scasso.",
  },
  {
    id: "shelf-structural-check",
    category: "shelf",
    label: "Mensole e pensili",
    severity: "error",
    appliesTo: ["shelf", "wall-cabinet", "fixing"],
    expected: "Mensole e pensili devono validare parete, peso previsto, ferramenta e punti fissaggio.",
    validationTarget: "wallLoadCapacity+fittingProfile",
    note: "Il sistema deve indicare se una mensola è montabile o se serve supporto/ferramenta alternativa.",
  },
  {
    id: "technical-sheet-layer-quality",
    category: "technical_sheet",
    label: "Qualità prospetto tecnico",
    severity: "info",
    appliesTo: ["technical-wall-elevation", "pdf", "dxf", "cad"],
    expected: "Prospetti più puliti e professionali dello standard DXF: mobile, quote, elettrico, idraulico e fissaggi separati.",
    validationTarget: "sheetLayerStyle",
    note: "Ogni tavola deve essere leggibile da installatore, elettricista, idraulico e cliente.",
  },
];

function buildTechnicalKnowledgeBaseV1Report(
  wallValidationReport: WallTechnicalPointsValidationV1Report
): TechnicalKnowledgeBaseV1Report {
  const rules = TECHNICAL_KNOWLEDGE_BASE_V1_RULES;
  const countByCategory = (category: TechnicalKnowledgeBaseV1Category) =>
    rules.filter((rule) => rule.category === category).length;

  const status: TechnicalKnowledgeBaseV1Report["status"] =
    wallValidationReport.status === "TECHNICAL_POINTS_BLOCKED"
      ? "KNOWLEDGE_BASE_REVIEW_REQUIRED"
      : "KNOWLEDGE_BASE_READY";

  return {
    schema: "bagastudio-technical-knowledge-base-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceWallValidationSchema: wallValidationReport.schema,
    sourceWallValidationStatus: wallValidationReport.status,
    totals: {
      rules: rules.length,
      plumbing: countByCategory("plumbing"),
      electrical: countByCategory("electrical"),
      wall: countByCategory("wall"),
      baseboard: countByCategory("baseboard"),
      shelf: countByCategory("shelf"),
      sink: countByCategory("sink"),
      technicalSheet: countByCategory("technical_sheet"),
      errors: rules.filter((rule) => rule.severity === "error").length,
      warnings: rules.filter((rule) => rule.severity === "warning").length,
      info: rules.filter((rule) => rule.severity === "info").length,
    },
    sinkHeights: {
      countertopSinkTopHeightMm: 850,
      insetSinkTopHeightMm: 930,
    },
    rules,
    recommendations: [
      "Usare questa Knowledge Base come sorgente unica per Layout Intelligence, prospetti parete e Smart Technical Validator.",
      "Collegare ogni regola a Product Package e Factory Production Package prima dell'export finale PDF/DXF/CAD.",
      "Aggiungere progressivamente regole reali Morini su quote idrauliche, prese, fissaggi, scassi battiscopa e portate mensole.",
    ],
  };
}

const technicalKnowledgeBaseV1Report = useMemo(() => {
  return buildTechnicalKnowledgeBaseV1Report(wallTechnicalPointsValidationV1Report);
}, [wallTechnicalPointsValidationV1Report]);

function downloadTechnicalKnowledgeBaseV1Report() {
  downloadJsonFile(`bagastudio-technical-knowledge-base-v1-${Date.now()}.json`, technicalKnowledgeBaseV1Report);
}


const smartTechnicalValidatorV1Report = useMemo(() => {
  return buildSmartTechnicalValidatorV1Report({
    knowledgeBase: technicalKnowledgeBaseV1Report,
    wallValidation: wallTechnicalPointsValidationV1Report,
  });
}, [technicalKnowledgeBaseV1Report, wallTechnicalPointsValidationV1Report]);

function downloadSmartTechnicalValidatorV1Report() {
  downloadJsonFile(`bagastudio-smart-technical-validator-v1-${Date.now()}.json`, smartTechnicalValidatorV1Report);
}


const layoutRoomIntelligenceV2Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV2Report({
    layoutV1: layoutRoomIntelligenceV1Report,
    smartValidator: smartTechnicalValidatorV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, smartTechnicalValidatorV1Report, factoryProductionPackageV1Report]);

function downloadLayoutRoomIntelligenceV2Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-${Date.now()}.json`, layoutRoomIntelligenceV2Report);
}



const layoutRoomIntelligenceV21Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV21Report({
    layoutV2: layoutRoomIntelligenceV2Report,
  });
}, [layoutRoomIntelligenceV2Report]);

function downloadLayoutRoomIntelligenceV21Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-1-${Date.now()}.json`, layoutRoomIntelligenceV21Report);
}




const layoutRoomIntelligenceV22Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV22Report({
    layoutV21: layoutRoomIntelligenceV21Report,
  });
}, [layoutRoomIntelligenceV21Report]);

function downloadLayoutRoomIntelligenceV22Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-2-${Date.now()}.json`, layoutRoomIntelligenceV22Report);
}




const layoutRoomIntelligenceV23Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV23Report({
    layoutV22: layoutRoomIntelligenceV22Report,
  });
}, [layoutRoomIntelligenceV22Report]);

function downloadLayoutRoomIntelligenceV23Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-3-${Date.now()}.json`, layoutRoomIntelligenceV23Report);
}


const layoutRoomIntelligenceV24Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV24Report({
    layoutV23: layoutRoomIntelligenceV23Report,
  });
}, [layoutRoomIntelligenceV23Report]);

function downloadLayoutRoomIntelligenceV24Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-4-${Date.now()}.json`, layoutRoomIntelligenceV24Report);
}

const layoutRoomIntelligenceV25Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV25Report({
    layoutV24: layoutRoomIntelligenceV24Report,
  });
}, [layoutRoomIntelligenceV24Report]);

function downloadLayoutRoomIntelligenceV25Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-5-${Date.now()}.json`, layoutRoomIntelligenceV25Report);
}


const dynamicRuleRegistryV26Report = useMemo(() => {
  return buildDynamicRuleRegistryV26Report({
    layoutV25: layoutRoomIntelligenceV25Report,
  });
}, [layoutRoomIntelligenceV25Report]);

function downloadDynamicRuleRegistryV26Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-registry-v2-6-${Date.now()}.json`, dynamicRuleRegistryV26Report);
}


const dynamicRuleAdminBridgeV27Report = useMemo(() => {
  return buildDynamicRuleAdminBridgeV27Report({
    registryV26: dynamicRuleRegistryV26Report,
  });
}, [dynamicRuleRegistryV26Report]);

function downloadDynamicRuleAdminBridgeV27Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-admin-bridge-v2-7-${Date.now()}.json`, dynamicRuleAdminBridgeV27Report);
}


const dynamicRulePackV28Report = useMemo(() => {
  return buildDynamicRulePackV28Report({
    adminBridgeV27: dynamicRuleAdminBridgeV27Report,
  });
}, [dynamicRuleAdminBridgeV27Report]);

function downloadDynamicRulePackV28Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-pack-system-v2-8-${Date.now()}.json`, dynamicRulePackV28Report);
}


const dynamicRuleConflictResolverV29Report = useMemo(() => {
  return buildDynamicRuleConflictResolverV29Report({
    rulePackV28: dynamicRulePackV28Report,
  });
}, [dynamicRulePackV28Report]);

function downloadDynamicRuleConflictResolverV29Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-conflict-resolver-v2-9-${Date.now()}.json`, dynamicRuleConflictResolverV29Report);
}


const wallIntelligenceEngineV30Report = useMemo(() => {
  return buildWallIntelligenceEngineV30Report({
    conflictResolverV29: dynamicRuleConflictResolverV29Report,
  });
}, [dynamicRuleConflictResolverV29Report]);

function downloadWallIntelligenceEngineV30Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-engine-v3-0-${Date.now()}.json`, wallIntelligenceEngineV30Report);
}




const wallIntelligenceGuidedDescriptionV31Report = useMemo(() => {
  return buildWallIntelligenceGuidedDescriptionV31Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
  });
}, [wallIntelligenceEngineV30Report]);

function downloadWallIntelligenceGuidedDescriptionV31Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-guided-description-v3-1-${Date.now()}.json`, wallIntelligenceGuidedDescriptionV31Report);
}



const wallIntelligenceConfidenceEngineV32Report = useMemo(() => {
  return buildWallIntelligenceConfidenceEngineV32Report({
    guidedDescriptionV31: wallIntelligenceGuidedDescriptionV31Report,
  });
}, [wallIntelligenceGuidedDescriptionV31Report]);

function downloadWallIntelligenceConfidenceEngineV32Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-confidence-engine-v3-2-${Date.now()}.json`, wallIntelligenceConfidenceEngineV32Report);
}


const wallIntelligenceLoadAnalyzerV33Report = useMemo(() => {
  return buildWallIntelligenceLoadAnalyzerV33Report({
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    wallEngineV30: wallIntelligenceEngineV30Report,
  });
}, [wallIntelligenceConfidenceEngineV32Report, wallIntelligenceEngineV30Report]);

function downloadWallIntelligenceLoadAnalyzerV33Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-load-analyzer-v3-3-${Date.now()}.json`, wallIntelligenceLoadAnalyzerV33Report);
}


const wallIntelligenceFixingRecommendationV34Report = useMemo(() => {
  return buildWallIntelligenceFixingRecommendationV34Report({
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
  });
}, [wallIntelligenceLoadAnalyzerV33Report, wallIntelligenceConfidenceEngineV32Report]);

function downloadWallIntelligenceFixingRecommendationV34Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-fixing-recommendation-v3-4-${Date.now()}.json`, wallIntelligenceFixingRecommendationV34Report);
}


const wallIntelligenceMirrorShelfValidatorV35Report = useMemo(() => {
  return buildWallIntelligenceMirrorShelfValidatorV35Report({
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    spacingV25: layoutRoomIntelligenceV25Report,
  });
}, [wallIntelligenceFixingRecommendationV34Report, layoutRoomIntelligenceV25Report]);

function downloadWallIntelligenceMirrorShelfValidatorV35Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-mirror-shelf-validator-v3-5-${Date.now()}.json`, wallIntelligenceMirrorShelfValidatorV35Report);
}


const wallTechnicalReportV36Report = useMemo(() => {
  return buildWallTechnicalReportV36Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    mirrorShelfValidatorV35: wallIntelligenceMirrorShelfValidatorV35Report,
  });
}, [
  wallIntelligenceEngineV30Report,
  wallIntelligenceConfidenceEngineV32Report,
  wallIntelligenceLoadAnalyzerV33Report,
  wallIntelligenceFixingRecommendationV34Report,
  wallIntelligenceMirrorShelfValidatorV35Report,
]);

function downloadWallTechnicalReportV36Report() {
  downloadJsonFile(`bagastudio-wall-technical-report-v3-6-${Date.now()}.json`, wallTechnicalReportV36Report);
}



const installationRiskEngineV37Report = useMemo(() => {
  return buildInstallationRiskEngineV37Report({
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    mirrorShelfValidatorV35: wallIntelligenceMirrorShelfValidatorV35Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [
  wallIntelligenceConfidenceEngineV32Report,
  wallIntelligenceLoadAnalyzerV33Report,
  wallIntelligenceFixingRecommendationV34Report,
  wallIntelligenceMirrorShelfValidatorV35Report,
  wallTechnicalReportV36Report,
]);

function downloadInstallationRiskEngineV37Report() {
  downloadJsonFile(`bagastudio-installation-risk-engine-v3-7-${Date.now()}.json`, installationRiskEngineV37Report);
}



const installerChecklistEngineV38Report = useMemo(() => {
  return buildInstallerChecklistEngineV38Report({
    installationRiskV37: installationRiskEngineV37Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [installationRiskEngineV37Report, wallTechnicalReportV36Report]);

function downloadInstallerChecklistEngineV38Report() {
  downloadJsonFile(`bagastudio-installer-checklist-engine-v3-8-${Date.now()}.json`, installerChecklistEngineV38Report);
}


const technicalApprovalWorkflowV39Report = useMemo(() => {
  return buildTechnicalApprovalWorkflowV39Report({
    installationRiskV37: installationRiskEngineV37Report,
    installerChecklistV38: installerChecklistEngineV38Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [installationRiskEngineV37Report, installerChecklistEngineV38Report, wallTechnicalReportV36Report]);

function downloadTechnicalApprovalWorkflowV39Report() {
  downloadJsonFile(`bagastudio-technical-approval-workflow-v3-9-${Date.now()}.json`, technicalApprovalWorkflowV39Report);
}


const wallAssistedRecognitionV40Report = useMemo(() => {
  return buildWallAssistedRecognitionV40Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
  });
}, [wallIntelligenceEngineV30Report, wallIntelligenceConfidenceEngineV32Report, technicalApprovalWorkflowV39Report]);

function downloadWallAssistedRecognitionV40Report() {
  downloadJsonFile(`bagastudio-wall-assisted-recognition-v4-0-${Date.now()}.json`, wallAssistedRecognitionV40Report);
}


const wallPhotoEvidenceV41Report = useMemo(() => {
  return buildWallPhotoEvidenceV41Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
  });
}, [wallAssistedRecognitionV40Report]);

function downloadWallPhotoEvidenceV41Report() {
  downloadJsonFile(`bagastudio-wall-photo-evidence-intake-v4-1-${Date.now()}.json`, wallPhotoEvidenceV41Report);
}


const wallDwgDxfEvidenceV42Report = useMemo(() => {
  return buildWallDwgDxfEvidenceV42Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
  });
}, [wallAssistedRecognitionV40Report, wallPhotoEvidenceV41Report]);

function downloadWallDwgDxfEvidenceV42Report() {
  downloadJsonFile(`bagastudio-wall-dwg-dxf-evidence-intake-v4-2-${Date.now()}.json`, wallDwgDxfEvidenceV42Report);
}



const wallEvidenceFusionV43Report = useMemo(() => {
  return buildWallEvidenceFusionV43Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
  });
}, [wallAssistedRecognitionV40Report, wallPhotoEvidenceV41Report, wallDwgDxfEvidenceV42Report, technicalApprovalWorkflowV39Report]);

function downloadWallEvidenceFusionV43Report() {
  downloadJsonFile(`bagastudio-wall-evidence-fusion-engine-v4-3-${Date.now()}.json`, wallEvidenceFusionV43Report);
}


const automaticWallClassificationV44Report = useMemo(() => {
  return buildAutomaticWallClassificationV44Report({
    fusionV43: wallEvidenceFusionV43Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
  });
}, [wallEvidenceFusionV43Report, wallPhotoEvidenceV41Report, wallDwgDxfEvidenceV42Report]);

function downloadAutomaticWallClassificationV44Report() {
  downloadJsonFile(`bagastudio-automatic-wall-classification-v4-4-${Date.now()}.json`, automaticWallClassificationV44Report);
}

const aiTechnicalSuggestionsV45Report = useMemo(() => {
  return buildAiTechnicalSuggestionsV45Report({
    classificationV44: automaticWallClassificationV44Report,
    fusionV43: wallEvidenceFusionV43Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
    installerChecklistV38: installerChecklistEngineV38Report,
  });
}, [
  automaticWallClassificationV44Report,
  wallEvidenceFusionV43Report,
  wallPhotoEvidenceV41Report,
  wallDwgDxfEvidenceV42Report,
  technicalApprovalWorkflowV39Report,
  installerChecklistEngineV38Report,
]);

function downloadAiTechnicalSuggestionsV45Report() {
  downloadJsonFile(`bagastudio-ai-technical-suggestions-v4-5-${Date.now()}.json`, aiTechnicalSuggestionsV45Report);
}


const technicalEvidenceApprovalV46Report = useMemo(() => {
  return buildTechnicalEvidenceApprovalV46Report(aiTechnicalSuggestionsV45Report);
}, [aiTechnicalSuggestionsV45Report]);

function downloadTechnicalEvidenceApprovalV46Report() {
  downloadJsonFile(`bagastudio-technical-evidence-approval-v4-6-${Date.now()}.json`, technicalEvidenceApprovalV46Report);
}



const evidenceToRenderArBridgeV47Report = useMemo(() => {
  return buildEvidenceToRenderArBridgeV47Report({
    photoEvidenceReport: wallPhotoEvidenceV41Report,
    fusionReport: wallEvidenceFusionV43Report,
    approvalReport: technicalEvidenceApprovalV46Report,
  });
}, [wallPhotoEvidenceV41Report, wallEvidenceFusionV43Report, technicalEvidenceApprovalV46Report]);

function downloadEvidenceToRenderArBridgeV47Report() {
  downloadJsonFile(`bagastudio-evidence-to-render-ar-bridge-v4-7-${Date.now()}.json`, evidenceToRenderArBridgeV47Report);
}

const buildAdminBackup = (includeHeavyModelData = true) => ({
  schema: "bagastudio-admin-backup",
  version: 1,
  savedAt: new Date().toISOString(),
  state: {
    productId,
    productName,
    productCategory,
    productBrand,
    packageVersion,
    widthDefault,
    widthMin,
    widthMax,
    heightDefault,
    heightMin,
    heightMax,
    depthDefault,
    depthMin,
    depthMax,
    modelFileName,
    modelExtension,
    modelDataUrl: includeHeavyModelData ? modelDataUrl : "",
    selectedMeshName,
    modelRotationY,
    meshList,
    generatedJson: includeHeavyModelData ? generatedJson : "",
    importerDiagnostic,
    space3DFileName,
    space3DAnalyzerReport,
    space3DStatus,
    geometryCompletionReport,
    autoMappingV2Report,
    autoMappingV2Status,
    autoMappingV2ReviewedLabels,
  },
});

const restoreAdminBackup = (backup: any) => {
  const state = backup?.state ?? backup;
  if (!state) return;

  setProductId(state.productId ?? "new-product");
  setProductName(state.productName ?? "Nuovo prodotto");
  setProductCategory(state.productCategory ?? "custom");
  setProductBrand(state.productBrand ?? "BagaStudio Core");
  setPackageVersion(state.packageVersion ?? "2.0.0");

  setWidthDefault(Number(state.widthDefault ?? 180));
  setWidthMin(Number(state.widthMin ?? 100));
  setWidthMax(Number(state.widthMax ?? 350));

  setHeightDefault(Number(state.heightDefault ?? 100));
  setHeightMin(Number(state.heightMin ?? 70));
  setHeightMax(Number(state.heightMax ?? 150));

  setDepthDefault(Number(state.depthDefault ?? 60));
  setDepthMin(Number(state.depthMin ?? 40));
  setDepthMax(Number(state.depthMax ?? 100));

  setModelFileName(state.modelFileName ?? "");
  setModelExtension(state.modelExtension ?? "glb");
  setModelDataUrl(state.modelDataUrl ?? "");
  setSelectedMeshName(state.selectedMeshName ?? "");
  setModelRotationY(Number(state.modelRotationY ?? 0));
  setMeshList(
    Array.isArray(state.meshList)
      ? state.meshList.map((mesh: any, index: number) => ({
          ...mesh,
          category: normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName || ""),
          partId: mesh.partId || buildStablePartId(mesh, index),
          componentType: mesh.componentType || "",
          runtimeRole: mesh.runtimeRole || guessRuntimeRole(mesh.displayName || mesh.meshName || "", mesh.category || "component"),
          tags: mesh.tags || "",
          supportsAccessories:
            typeof mesh.supportsAccessories === "boolean"
              ? mesh.supportsAccessories
              : Boolean(mesh.compatibleAccessories),
        }))
      : []
  );
  setGeneratedJson(state.generatedJson ?? "");
  setImporterDiagnostic(state.importerDiagnostic || createAdminImporterDiagnostic());
  setSpace3DFileName(state.space3DFileName || "");
  setSpace3DAnalyzerReport(state.space3DAnalyzerReport || null);
  setSpace3DStatus(state.space3DStatus || "S3D analyzer in attesa");
  setGeometryCompletionReport(state.geometryCompletionReport || {
    status: "idle",
    daeMeshCount: 0,
    s3dComponentCount: 0,
    matchedCount: 0,
    missingCount: 0,
    missingParts: [],
    generatedAt: "",
  });
  setAutoMappingV2Report(state.autoMappingV2Report || null);
  setAutoMappingV2Status(state.autoMappingV2Status || "Auto Mapping Engine V2 in attesa");
  setAutoMappingV2ReviewedLabels(state.autoMappingV2ReviewedLabels || {});

  setBackupStatus(`${adminT.restoreCompleted}: ${new Date().toLocaleString()}`);
};

useEffect(() => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const savedAt = parsed?.savedAt
        ? new Date(parsed.savedAt).toLocaleString()
        : adminT.dateUnavailable;
      setBackupStatus(`${adminT.autosaveAvailable}: ${savedAt}`);
    } catch {
      setBackupStatus(adminT.autosaveUnreadable);
    }
  } else {
    setBackupStatus(adminT.noAutosaveAvailable);
  }

  autosaveHydratedRef.current = true;
}, [adminLanguage]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!autosaveHydratedRef.current) return;

  const timer = window.setTimeout(() => {
    try {
      const backup = buildAdminBackup(false);
      window.localStorage.setItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY, JSON.stringify(backup));
      setBackupStatus(`${adminT.autosave}: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.warn("BagaStudio Admin autosave skipped", error);
      setBackupStatus("Autosave saltato: package troppo pesante");
    }
  }, 700);

  return () => window.clearTimeout(timer);
}, [
  productId,
  productName,
  productCategory,
  productBrand,
  packageVersion,
  widthDefault,
  widthMin,
  widthMax,
  heightDefault,
  heightMin,
  heightMax,
  depthDefault,
  depthMin,
  depthMax,
  modelFileName,
  modelExtension,
  modelDataUrl,
  selectedMeshName,
  modelRotationY,
  meshList,
  generatedJson,
  importerDiagnostic,
  space3DFileName,
  space3DAnalyzerReport,
  space3DStatus,
  adminLanguage,
]);

const downloadAdminBackup = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJsonFile(`bagastudio-admin-backup-${stamp}.json`, buildAdminBackup());
};

const restoreLastAutosave = () => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (!saved) {
    setBackupStatus(adminT.noAutosaveToRestore);
    return;
  }

  try {
    restoreAdminBackup(JSON.parse(saved));
  } catch {
    setBackupStatus(adminT.autosaveError);
  }
};

const importBackupFile = async (file: File | undefined) => {
  if (!file) return;

  try {
    const text = await file.text();
    restoreAdminBackup(JSON.parse(text));
  } catch {
    setBackupStatus(adminT.backupFileError);
  }
};

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const saved = window.localStorage.getItem(BAGASTUDIO_PRODUCT_LIBRARY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    setProductLibrary(Array.isArray(parsed) ? parsed : []);
  } catch {
    setProductLibrary([]);
  }
}, []);

function persistProductLibrary(nextLibrary: ProductLibraryItem[]) {
  setProductLibrary(nextLibrary);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      BAGASTUDIO_PRODUCT_LIBRARY_KEY,
      JSON.stringify(nextLibrary)
    );
  } catch (error) {
    console.warn("BagaStudio product library save skipped", error);
  }
}

function downloadProductLibraryJson() {
  const payload = {
    schema: "bagastudio-product-library",
    version: 1,
    exportedAt: new Date().toISOString(),
    total: productLibrary.length,
    products: productLibrary,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bagastudio-product-library-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadSelectedLibraryProductPackage(item: ProductLibraryItem) {
  const blob = new Blob([item.packageJson], {
    type: "application/json",
  });

  const safeName = (item.name || item.id || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName || "bagastudio-product"}-package.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProductPackageToLibrary(file?: File | null) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const packageJson = String(reader.result || "");
      const parsed = JSON.parse(packageJson);

      const item: ProductLibraryItem = {
        id: parsed.id || parsed.metadata?.id || `product-${Date.now()}`,
        name: parsed.name || parsed.metadata?.name || file.name.replace(/\.json$/i, ""),
        category: parsed.category || parsed.metadata?.productCategory || "custom",
        brand: parsed.brand || parsed.metadata?.brand || "BagaStudio Core",
        sourceFileName: parsed.model?.fileName || parsed.modelFileName || file.name,
        savedAt: new Date().toISOString(),
        packageJson,
      };

      persistProductLibrary([
        item,
        ...productLibrary.filter((product) => product.id !== item.id),
      ]);
      setSelectedLibraryProductId(item.id);
      setBackupStatus(adminT.librarySaved);
    } catch (error) {
      console.error("BagaStudio product package import error", error);
      setBackupStatus(adminT.backupFileError);
    }
  };

  reader.readAsText(file);
}

function buildCurrentProductPackageJson() {
  const normalizeCsv = (value: string, fallback: string[] = []) => {
    const items = value
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : fallback;
    return Array.from(new Set(items));
  };

  const isCanonicalGlb = ["glb", "gltf"].includes(modelExtension);
  const isSpace3DSource = ["s3d", "s3dbak"].includes(modelExtension) || Boolean(space3DAnalyzerReport);
  const safeModelName = modelFileName || (isSpace3DSource ? (space3DFileName || "space3d-source.s3d") : "imported-model.glb");
  // S3D è metadata: se è stato caricato anche un modello reale DAE/GLB/OBJ/STL,
  // il package deve usare quella geometria embedded invece di restare metadata-only.
  const hasEmbeddedRuntimeGeometry = Boolean(modelDataUrl);
  const primaryModelUrl = hasEmbeddedRuntimeGeometry ? modelDataUrl : isSpace3DSource ? null : `/models/${safeModelName}`;
  const convertedModelUrl = isCanonicalGlb && primaryModelUrl ? primaryModelUrl : null;

  const packageId =
    productId ||
    productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") ||
    "new-product";
  const now = new Date().toISOString();

  const normalizeProductionMatchKey = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/^[0-9]+[-_\s]*/, "")
      .replace(/[-_]+/g, " ")
      .replace(/[^\w\sàèéìòù]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const findProductionMatchForMesh = (mesh: MeshConfig) => {
    const meshKeys = [
      mesh.displayName,
      mesh.meshName,
      mesh.partId || "",
      mesh.runtimeRole || "",
    ]
      .map(normalizeProductionMatchKey)
      .filter(Boolean);

    return (
      csvCixMatcherReport?.matches?.find((match) => {
        const csvKey = normalizeProductionMatchKey(match.csvPart.name);
        const cixKey = normalizeProductionMatchKey(match.cixPart?.partName || "");

        return meshKeys.some(
          (key) =>
            key === csvKey ||
            key === cixKey ||
            csvKey.includes(key) ||
            cixKey.includes(key) ||
            key.includes(csvKey) ||
            key.includes(cixKey)
        );
      }) || null
    );
  };

  const components = meshList.map((mesh, index) => {
    const runtimeComponent = buildRuntimeComponentV2(mesh, index);
    const productionMatch = findProductionMatchForMesh(mesh);

    return {
      ...runtimeComponent,

      productionReady: Boolean(productionMatch?.cixPart),
      csvSource: productionMatch?.csvPart?.name || null,
      cixSource: productionMatch?.cixPart?.fileName || null,
      productionMaterial: productionMatch?.csvPart?.material || null,
      productionQuantity: productionMatch?.csvPart?.quantity || null,
      productionConfidence: productionMatch?.confidence || 0,

      productionDimensions: productionMatch
        ? {
            width: productionMatch.csvPart.width,
            depth: productionMatch.csvPart.depth,
            thickness: productionMatch.csvPart.thickness,
          }
        : null,

      parametricData: (() => {
        const existingParametricData = parseBagaStudioJsonField(mesh.parametricData, {}) as Record<string, unknown>;
        return {
          originalWidth: readCollisionNumberV1(existingParametricData.originalWidth, productionMatch?.csvPart?.width) ?? null,
          originalHeight: readCollisionNumberV1(existingParametricData.originalHeight) ?? null,
          originalDepth: readCollisionNumberV1(existingParametricData.originalDepth, productionMatch?.csvPart?.depth) ?? null,
          originalThickness: readCollisionNumberV1(existingParametricData.originalThickness, productionMatch?.csvPart?.thickness) ?? null,

          currentWidth: readCollisionNumberV1(existingParametricData.currentWidth, productionMatch?.csvPart?.width) ?? null,
          currentHeight: readCollisionNumberV1(existingParametricData.currentHeight) ?? null,
          currentDepth: readCollisionNumberV1(existingParametricData.currentDepth, productionMatch?.csvPart?.depth) ?? null,
          currentThickness: readCollisionNumberV1(existingParametricData.currentThickness, mesh.panelThickness, productionMatch?.csvPart?.thickness) ?? null,

          lockExternalDimensions: true,
          parametricVersion: 1,
        };
      })(),

      manufacturingOverrideData: parseBagaStudioJsonField(mesh.manufacturingOverrideData, null),
    };
  });

  const componentCategories = Array.from(new Set(components.map((component) => component.category))).sort();
  const productPackageV3Summary = {
    schema: "bagastudio-product-package-v3-summary",
    version: 3.1,
    componentCount: components.length,
    componentCategories: Array.from(new Set(components.map((component: any) => component.componentCategory || component.category))).sort(),
    manufacturingReadyComponents: components.filter((component: any) => Boolean(component.productPackageV3?.csvRegenerationReady)).length,
    manufacturingMetadataReadyComponents: components.filter((component: any) => Boolean(component.manufacturingMetadataV31?.readiness?.hasThickness || component.manufacturingMetadataV31?.readiness?.hasHardware || component.manufacturingMetadataV31?.readiness?.hasDrillings)).length,
    panelThicknessComponents: components.filter((component: any) => component.panelThickness !== null && component.panelThickness !== undefined).length,
    hardwareLinkedComponents: components.filter((component: any) => Array.isArray(component.hardware) && component.hardware.length > 0).length,
    constraintRoles: components.reduce((acc: Record<string, number>, component: any) => {
      const role = component.constraintRole || "UNKNOWN";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {}),
    hardwareAnalyzerReadyComponents: components.filter((component: any) => Boolean(component.hardwareAnalyzerV1)).length,
    hardwareLinkedComponentsV1: components.filter((component: any) => Array.isArray(component.hardwareLinks) && component.hardwareLinks.length > 0).length,
    drillingLinkedComponentsV1: components.filter((component: any) => Array.isArray(component.drillingLinks) && component.drillingLinks.length > 0).length,
    dependencyGraphReadyComponents: components.filter((component: any) => Boolean(component.dependencyGraph)).length,
    parametricEditReady: true,
    futureModules: {
      parametricEdit: "prepared",
      manufacturingOverride: "prepared",
      csvRegeneration: "prepared",
      bomEngine: "prepared",
      assemblyEngine: "prepared",
      technicalSheets: "prepared",
    },
  };
  const runtimeMetadata = {
    schema: "bagastudio-runtime-metadata",
    version: 3,
    generatedAt: now,
    componentCount: components.length,
    categories: componentCategories,
    partIdStrategy: "stable-index-plus-display-name-slug",
    bridge: {
      viewer: true,
      configurator: true,
      materials: true,
      led: true,
      inserts: true,
      accessories: true,
      visibility: true,
      pricing: true,
      bom: true,
      cadExport: "prepared",
      technicalPoints: "prepared",
    },
  };

  return JSON.stringify(
    {
      schema: "bagastudio-product-package",
      packageVersion: packageVersion || "3.1.0",
      productPackageVersion: 3,
      generatedAt: now,
      viewerCompatible: true,
      engine: {
        name: "BagaStudio Core",
        minViewerVersion: "1.0.0",
        canonicalModelFormat: "glb",
        supportsEmbeddedModelDataUrl: true,
        supportsRuntimeMaterials: true,
        supportsComponentVisibility: true,
        supportsAccessories: true,
        supportsRuntimeMetadataV2: true,
        supportsAutoMappingEngineV2QualityGate: true,
        supportsStablePartIds: true,
        supportsComponentCategories: true,
        supportsProductPackageV3: true,
        supportsParametricEditData: true,
        supportsManufacturingOverrideData: true,
        supportsManufacturingMetadataV31: true,
        supportsEdgeBandingData: true,
        supportsHardwareAnalyzerV1: true,
        supportsManufacturingConstraintsV1: true,
        supportsDependencyGraphV1: true,
        supportsParametricDrillingRules: true,
      },
      metadata: {
        id: packageId,
        name: productName,
        brand: productBrand || "BagaStudio Core",
        productCategory,
        sourceFileName: safeModelName,
        originalFormat: modelExtension,
        componentCount: components.length,
        componentCategories,
        runtimeMetadataVersion: 3,
        productPackageV3Summary,
        packageSource: space3DAnalyzerReport ? "space3d-analyzer" : "admin-model-importer",
        productionReady: Boolean(csvCixMatcherReport?.matchedParts),
      },
      id: packageId,
      name: productName,
      brand: productBrand || "BagaStudio Core",
      category: productCategory,
      version: packageVersion || "2.0.0",
      assets: {
        modelUrl: primaryModelUrl,
        embeddedModelDataUrl: hasEmbeddedRuntimeGeometry ? modelDataUrl : null,
        originalFileUrl: isSpace3DSource ? null : `/models/${safeModelName}`,
        originalFormat: modelExtension,
        sourceFileName: safeModelName,
        convertedModelUrl,
        requiresConversion: !isCanonicalGlb || isSpace3DSource,
        conversionTargetFormat: "glb",
        hasRuntimeGeometry: Boolean(primaryModelUrl || convertedModelUrl || hasEmbeddedRuntimeGeometry),
        geometrySource: isSpace3DSource
          ? hasEmbeddedRuntimeGeometry
            ? "space3d-metadata-plus-admin-model-importer"
            : "space3d-analyzer-only"
          : "admin-model-importer",
      },
      dimensions: {
        width: { min: widthMin, max: widthMax, step: 10, default: widthDefault },
        height: { min: heightMin, max: heightMax, step: 10, default: heightDefault },
        depth: { min: depthMin, max: depthMax, step: 5, default: depthDefault },
      },
      defaultConfiguration: {
        dimensions: {
          width: widthDefault,
          height: heightDefault,
          depth: depthDefault,
        },
        activeViewId: "iso",
      },
      runtimeMetadata,
      productPackageV3: productPackageV3Summary,
      componentCategories,
      components,
      parts: components,
      productionData: {
        schema: "bagastudio-production-data",
        version: 1,
        source: "space3d-csv-cix",
        csvFileName: space3DCsvFileName || null,
        cixFileNames: space3DCixFileNames,
        csvParts: space3DCsvParts.length,
        cixParts: space3DCixParts.length,
        matchedParts: csvCixMatcherReport?.matchedParts || 0,
        unmatchedParts: csvCixMatcherReport?.unmatchedParts || 0,
        averageConfidence: csvCixMatcherReport?.averageConfidence || 0,
        matches: csvCixMatcherReport?.matches || [],
        autoMappingEngineV2: autoMappingV2Report,
        autoMappingClassificationV25: autoMappingV2Report?.classificationSummary || null,
        autoMappingClassifiedComponents: autoMappingV2Report?.classifiedComponents || [],
        productPackageV3: {
          panelThicknessReady: components.some((component: any) => component.panelThickness !== null),
          hardwareReady: components.some((component: any) => Array.isArray(component.hardware) && component.hardware.length > 0),
          drillingsReady: components.some((component: any) => Array.isArray(component.drillings) && component.drillings.length > 0),
          manufacturingDataReady: components.some((component: any) => component.manufacturingData && Object.keys(component.manufacturingData).length > 0),
          manufacturingMetadataV31Ready: components.some((component: any) => Boolean(component.manufacturingMetadataV31)),
          edgeBandingReady: components.some((component: any) => Boolean(component.edgeBanding)),
          materialCodesReady: components.some((component: any) => Boolean(component.materialCode)),
          hardwareAnalyzerV1Ready: components.some((component: any) => Boolean(component.hardwareAnalyzerV1)),
          dependencyGraphReady: components.some((component: any) => Boolean(component.dependencyGraph)),
          manufacturingConstraintsV1Ready: components.some((component: any) => Boolean(component.constraintRole)),
        },
        autoMappingQualityGate: autoMappingV2Report
          ? {
              score: autoMappingV2Report.qualityScore,
              level: autoMappingV2Report.qualityLevel,
              recommendedActions: autoMappingV2Report.recommendedActions,
              riskyMatches: autoMappingV2Report.riskyMatches,
              reviewSummary: getAutoMappingEngineV2ReviewSummary(),
              reviewedLabels: autoMappingV2ReviewedLabels,
            }
          : null,
      },
      materials: DEFAULT_PRODUCT_MATERIALS,
      options: [],
      accessories: [
        { id: "insert", name: "Inserto", stateType: "insert" },
        { id: "led", name: "LED", stateType: "accessory" },
      ],
      pricing: {
        basePrice: 900,
        margin: 0,
        vat: 22,
      },
      views: DEFAULT_PRODUCT_VIEWS,
      bridge: {
        schema: "bagastudio-viewer-configurator-bridge",
        version: 2,
        partIdField: "partId",
        meshNameField: "meshName",
        categoryField: "category",
        metadataField: "runtimeMetadata",
        runtimeTargets: ["materials", "visibility", "led", "insert", "accessories", "pricing", "bom", "technicalPoints", "manufacturingData", "hardwareAnalyzer", "constraints", "dependencyGraph"],
        productPackageV3: true,
        hardwareAnalyzerV1: true,
        manufacturingConstraintsV1: true,
      },
      geometryRuntime: {
        status: isSpace3DSource ? "metadata-only-requires-geometry-conversion" : ["glb", "gltf"].includes(modelExtension) ? "ready" : "requires-conversion-to-glb",
        originalFormat: modelExtension,
        preparedForViewer: Boolean(primaryModelUrl || convertedModelUrl),
        hasRuntimeGeometry: Boolean(primaryModelUrl || convertedModelUrl || hasEmbeddedRuntimeGeometry),
        preventViewerFallback: true,
        notes: space3DAnalyzerReport
          ? ["S3D analyzer package: solo metadata/componenti. Nessun modello 3D viene forzato nel Viewer finché non esiste una conversione geometria/GLB reale."]
          : [],
      },
    },
    null,
    2
  );
}

function saveCurrentProductToLibrary() {
  const packageJson = generatedJson || buildCurrentProductPackageJson();

  const item: ProductLibraryItem = {
    id: productId || `product-${Date.now()}`,
    name: productName || "Nuovo prodotto",
    category: productCategory || "custom",
    brand: productBrand || "BagaStudio Core",
    sourceFileName: modelFileName || "",
    savedAt: new Date().toISOString(),
    packageJson,
  };

  const nextLibrary = [
    item,
    ...productLibrary.filter((product) => product.id !== item.id),
  ];

  persistProductLibrary(nextLibrary);
  setGeneratedJson(packageJson);
  setSelectedLibraryProductId(item.id);
  setBackupStatus(adminT.librarySaved);
}

function loadProductFromLibrary(item: ProductLibraryItem) {
  try {
    const parsed = JSON.parse(item.packageJson);

    setProductId(parsed.id || parsed.metadata?.id || item.id);
    setProductName(parsed.name || parsed.metadata?.name || item.name);
    setProductCategory(parsed.category || parsed.metadata?.productCategory || item.category);
    setProductBrand(parsed.brand || parsed.metadata?.brand || item.brand);
    setPackageVersion(parsed.packageVersion || parsed.version || "2.0.0");

    setWidthMin(Number(parsed.dimensions?.width?.min ?? widthMin));
    setWidthDefault(Number(parsed.dimensions?.width?.default ?? widthDefault));
    setWidthMax(Number(parsed.dimensions?.width?.max ?? widthMax));
    setHeightMin(Number(parsed.dimensions?.height?.min ?? heightMin));
    setHeightDefault(Number(parsed.dimensions?.height?.default ?? heightDefault));
    setHeightMax(Number(parsed.dimensions?.height?.max ?? heightMax));
    setDepthMin(Number(parsed.dimensions?.depth?.min ?? depthMin));
    setDepthDefault(Number(parsed.dimensions?.depth?.default ?? depthDefault));
    setDepthMax(Number(parsed.dimensions?.depth?.max ?? depthMax));

    setModelFileName(parsed.assets?.sourceFileName || item.sourceFileName || "");
    setModelExtension(parsed.assets?.originalFormat || "glb");
    setModelDataUrl(parsed.assets?.embeddedModelDataUrl || parsed.assets?.modelUrl || "");
    setModelPreviewUrl(parsed.assets?.embeddedModelDataUrl || parsed.assets?.modelUrl || "");

    const parts = Array.isArray(parsed.parts) ? parsed.parts : parsed.components || [];
    setMeshList(
      parts.map((part: any, index: number) => ({
        meshName: part.meshName || part.originalName || part.id,
        partId: part.partId || part.id || buildStablePartId(part, index),
        componentType: part.componentType || part.runtimeMetadata?.componentType || "",
        runtimeRole: part.runtimeRole || part.runtimeMetadata?.runtimeRole || guessRuntimeRole(part.name || part.meshName || part.id || "", part.category || "component"),
        tags: Array.isArray(part.tags) ? part.tags.join(", ") : part.tags || "",
        displayName: part.customerName || part.label || part.name || part.meshName || part.id,
        category: part.category || "component",
        selectable: part.selectable !== false,
        visible: part.visible !== false,
        compatibleLed: Boolean(part.compatibleLed),
        compatibleInsert: Boolean(part.compatibleInsert),
        supportsAccessories: part.supportsAccessories !== false,
        materialSlots: Array.isArray(part.materialSlots)
          ? part.materialSlots.join(", ")
          : part.materialSlots || "main",
        compatibleAccessories: Array.isArray(part.compatibleAccessories)
          ? part.compatibleAccessories.join(", ")
          : part.compatibleAccessories || "",
        dimensions: part.productPackageV3?.dimensions ? JSON.stringify(part.productPackageV3.dimensions) : part.dimensions ? JSON.stringify(part.dimensions) : "",
        technicalPoints: part.productPackageV3?.technicalPoints ? JSON.stringify(part.productPackageV3.technicalPoints) : part.technicalPoints ? JSON.stringify(part.technicalPoints) : "",
        assemblyOrder: String(part.productPackageV3?.assemblyOrder ?? part.assemblyOrder ?? ""),
        panelThickness: String(part.productPackageV3?.panelThickness ?? part.manufacturingMetadataV31?.panelThickness ?? part.panelThickness ?? ""),
        materialCode: String(part.productPackageV3?.materialCode ?? part.manufacturingMetadataV31?.materialCode ?? part.materialCode ?? ""),
        edgeBanding: part.productPackageV3?.edgeBanding ? JSON.stringify(part.productPackageV3.edgeBanding) : part.manufacturingMetadataV31?.edgeBanding ? JSON.stringify(part.manufacturingMetadataV31.edgeBanding) : part.edgeBanding ? JSON.stringify(part.edgeBanding) : "",
        hardware: Array.isArray(part.productPackageV3?.hardware)
          ? part.productPackageV3.hardware.join(", ")
          : Array.isArray(part.hardware)
          ? part.hardware.join(", ")
          : part.hardware || "",
        drillings: part.productPackageV3?.drillings ? JSON.stringify(part.productPackageV3.drillings) : part.drillings ? JSON.stringify(part.drillings) : "",
        manufacturingData: part.productPackageV3?.manufacturingData ? JSON.stringify(part.productPackageV3.manufacturingData) : part.manufacturingData ? JSON.stringify(part.manufacturingData) : "",
        constraintRole: String(part.constraintRole || part.hardwareAnalyzerV1?.constraintRole || ""),
        hardwareLinks: part.hardwareAnalyzerV1?.hardwareLinks ? JSON.stringify(part.hardwareAnalyzerV1.hardwareLinks) : part.hardwareLinks ? JSON.stringify(part.hardwareLinks) : "",
        drillingLinks: part.hardwareAnalyzerV1?.drillingLinks ? JSON.stringify(part.hardwareAnalyzerV1.drillingLinks) : part.drillingLinks ? JSON.stringify(part.drillingLinks) : "",
        dependencyParents: Array.isArray(part.hardwareAnalyzerV1?.dependencyGraph?.parents)
          ? part.hardwareAnalyzerV1.dependencyGraph.parents.join(", ")
          : Array.isArray(part.dependencyGraph?.parents)
          ? part.dependencyGraph.parents.join(", ")
          : "",
        dependencyChildren: Array.isArray(part.hardwareAnalyzerV1?.dependencyGraph?.children)
          ? part.hardwareAnalyzerV1.dependencyGraph.children.join(", ")
          : Array.isArray(part.dependencyGraph?.children)
          ? part.dependencyGraph.children.join(", ")
          : "",
        ledPosition: part.mountPoints?.led?.position || "front",
        ledFrontOffset: String(part.mountPoints?.led?.frontOffset ?? "4"),
        ledSideMargin: String(part.mountPoints?.led?.sideMargin ?? "5"),
        ledYOffset: String(part.mountPoints?.led?.yOffset ?? "0"),
        insertPosition: Array.isArray(part.mountPoints?.insert?.position)
          ? part.mountPoints.insert.position.join(", ")
          : part.mountPoints?.insert?.position || "front",
        insertOffsetX: String(part.mountPoints?.insert?.offset?.x ?? "0"),
        insertOffsetY: String(part.mountPoints?.insert?.offset?.y ?? "0"),
        insertOffsetZ: String(part.mountPoints?.insert?.offset?.z ?? "1"),
      }))
    );

    setGeneratedJson(item.packageJson);
    setSelectedMeshName("");
  } catch (error) {
    console.error("BagaStudio product library load error", error);
  }
}

function deleteProductFromLibrary(productIdToDelete: string) {
  persistProductLibrary(
    productLibrary.filter((product) => product.id !== productIdToDelete)
  );
}

function updateCsvCixMatcherReport(nextCsvParts = space3DCsvParts, nextCixParts = space3DCixParts) {
  if (nextCsvParts.length === 0 || nextCixParts.length === 0) {
    setCsvCixMatcherReport(null);
    setCsvCixStatus(
      nextCsvParts.length === 0
        ? "Carica prima il CSV Space3D."
        : "Carica almeno un file CIX."
    );
    return;
  }

  const matches = matchCsvPartsToCixParts(nextCsvParts, nextCixParts);
  const report = buildCsvCixMatcherReport(matches);

  setCsvCixMatcherReport(report);
  setCsvCixStatus(
    `Match CSV/CIX: ${report.matchedParts}/${report.totalCsvParts} pezzi collegati · confidenza media ${report.averageConfidence}%`
  );
}

async function handleSpace3DCsvImport(file?: File | null) {
  if (!file) return;

  try {
    const text = await file.text();
    const csvParts = parseSpazio3DCsv(text);

    setSpace3DCsvFileName(file.name);
    setSpace3DCsvParts(csvParts);
    updateCsvCixMatcherReport(csvParts, space3DCixParts);
  } catch (error) {
    console.error("BagaStudio CSV import error:", error);
    setCsvCixStatus(error instanceof Error ? `Errore CSV: ${error.message}` : "Errore CSV sconosciuto.");
  }
}

async function handleSpace3DCixImport(files?: FileList | null) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return;

  try {
    const cixFiles = await Promise.all(
      fileList.map(async (file) => ({
        fileName: file.name,
        content: await file.text(),
      }))
    );

    const cixDrillingsByFileName = Object.fromEntries(
      cixFiles.map((file) => [file.fileName, extractCixDrillingsV1(file.fileName, file.content)])
    );
    const parsedCixParts = parseCixFiles(cixFiles);
    const cixParts = parsedCixParts.map((part, index) => {
      const partFileName = String((part as { fileName?: string }).fileName || cixFiles[index]?.fileName || "");
      const drillingLinks = cixDrillingsByFileName[partFileName] || [];

      return {
        ...part,
        drillingLinks: drillingLinks.length > 0 ? JSON.stringify(drillingLinks) : "",
      } as CixPart & { drillingLinks?: string };
    });
    const extractedDrillings = Object.values(cixDrillingsByFileName).reduce((sum, items) => sum + items.length, 0);

    setSpace3DCixFileNames(fileList.map((file) => file.name));
    setSpace3DCixParts(cixParts);
    updateCsvCixMatcherReport(space3DCsvParts, cixParts);
    setCsvCixStatus(`CIX Drilling Extractor V1: ${extractedDrillings} forature rilevate da ${fileList.length} file CIX.`);
  } catch (error) {
    console.error("BagaStudio CIX import error:", error);
    setCsvCixStatus(error instanceof Error ? `Errore CIX: ${error.message}` : "Errore CIX sconosciuto.");
  }
}

function downloadCsvCixMatcherReport() {
  if (!csvCixMatcherReport) return;

  downloadJsonFile(`bagastudio-csv-cix-matcher-${Date.now()}.json`, {
    schema: "bagastudio-csv-cix-matcher-report",
    version: 1,
    csvFileName: space3DCsvFileName,
    cixFileNames: space3DCixFileNames,
    report: csvCixMatcherReport,
  });
}

function applyAutoMappingEngineV2() {
  if (!csvCixMatcherReport || csvCixMatcherReport.matches.length === 0) {
    setAutoMappingV2Report(null);
    setAutoMappingV2Status("Carica CSV e CIX prima di eseguire Auto Mapping Engine V2.");
    return;
  }

  const eligibleMatches = csvCixMatcherReport.matches.filter(
    (match) => Boolean(match.cixPart) && Number(match.confidence || 0) >= AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE
  );

  if (eligibleMatches.length === 0) {
    setAutoMappingV2Report(null);
    setAutoMappingV2Status("Auto Mapping V2 non applicato: nessun match sopra la soglia minima di confidenza.");
    return;
  }

  setMeshList((current) => {
    const usedMatchIndexes = new Set<number>();
    const updatedComponents: string[] = [];
    let appliedMatches = 0;

    setAutoMappingV2LastSnapshot(current);

    const nextMeshes = current.map((mesh) => {
      const meshKeys = [mesh.meshName, mesh.displayName, mesh.partId || "", mesh.runtimeRole || ""]
        .map(normalizeAutoMappingV2Key)
        .filter(Boolean);

      const matchIndex = eligibleMatches.findIndex((match, index) => {
        if (usedMatchIndexes.has(index)) return false;

        const matchKeys = [
          match.csvPart?.name || "",
          match.cixPart?.partName || "",
          match.cixPart?.fileName || "",
        ]
          .map(normalizeAutoMappingV2Key)
          .filter(Boolean);

        return meshKeys.some((meshKey) =>
          matchKeys.some((matchKey) =>
            meshKey === matchKey ||
            meshKey.includes(matchKey) ||
            matchKey.includes(meshKey)
          )
        );
      });

      if (matchIndex === -1) return mesh;

      usedMatchIndexes.add(matchIndex);
      appliedMatches += 1;
      updatedComponents.push(mesh.displayName || mesh.meshName || `Componente ${appliedMatches}`);
      return mergeAutoMappingV2MatchIntoMesh(mesh, eligibleMatches[matchIndex], matchIndex);
    });

    const placeholders = eligibleMatches
      .filter((_, index) => !usedMatchIndexes.has(index))
      .map((match, index) => buildAutoMappingV2MeshFromMatch(match, current.length + index));

    const finalMeshes = normalizeAdminMeshList([...nextMeshes, ...placeholders].map(classifyAutoMappingEngineV25Mesh));
    const classificationV25 = buildAutoMappingEngineV25ClassificationReport(finalMeshes);
    const placeholderComponents = placeholders.map((mesh) => mesh.displayName || mesh.meshName || "Placeholder metadata");
    const riskyMatches = eligibleMatches
      .filter((match) => Number(match.confidence || 0) < AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE)
      .slice(0, 20)
      .map((match) => `${match.csvPart?.name || "CSV senza nome"} → ${match.cixPart?.partName || match.cixPart?.fileName || "CIX senza nome"} (${match.confidence || 0}%)`);
    const lowConfidenceMatches = csvCixMatcherReport.matches
      .filter((match) => !match.cixPart || Number(match.confidence || 0) < AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE)
      .slice(0, 30)
      .map((match) => `${match.csvPart?.name || "CSV senza nome"} → ${match.cixPart?.partName || match.cixPart?.fileName || "CIX non collegato"} (${match.confidence || 0}%)`);
    const meshCountAfter = finalMeshes.length;
    const quality = evaluateAutoMappingEngineV2Quality({
      totalMatches: csvCixMatcherReport.matches.length,
      eligibleMatches: eligibleMatches.length,
      appliedMatches,
      createdPlaceholders: placeholders.length,
      skippedLowConfidence: csvCixMatcherReport.matches.length - eligibleMatches.length,
      averageConfidence: csvCixMatcherReport.averageConfidence,
      riskyMatches,
    });
    const reviewQueue = buildAutoMappingEngineV2ReviewQueue({
      riskyMatches,
      lowConfidenceMatches,
      placeholderComponents,
      qualityLevel: quality.qualityLevel,
    });

    setAutoMappingV2ReviewedLabels({});

    const report: AutoMappingEngineV2ReportState = {
      schema: "bagastudio-auto-mapping-engine-report",
      version: 2.5,
      totalMatches: csvCixMatcherReport.matches.length,
      eligibleMatches: eligibleMatches.length,
      appliedMatches,
      createdPlaceholders: placeholders.length,
      skippedLowConfidence: csvCixMatcherReport.matches.length - eligibleMatches.length,
      averageConfidence: csvCixMatcherReport.averageConfidence,
      confidenceThreshold: AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE,
      qualityScore: quality.qualityScore,
      qualityLevel: quality.qualityLevel,
      recommendedActions: quality.recommendedActions,
      riskyMatches,
      lowConfidenceMatches,
      reviewQueue,
      classificationSummary: classificationV25.summary,
      classifiedComponents: classificationV25.classifiedComponents,
      meshCountBefore: current.length,
      meshCountAfter,
      updatedComponents,
      placeholderComponents,
      generatedAt: new Date().toISOString(),
      notes: [
        "Auto Mapping Engine V2 applicato in modo conservativo: nessuna mesh esistente viene rimossa.",
        `Soglia minima confidenza: ${AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE}%.`,
        "Snapshot locale creato prima dell'applicazione per ripristino rapido in sessione.",
        placeholders.length > 0
          ? "I match senza mesh geometrica corrispondente sono stati aggiunti come placeholder metadata."
          : "Tutti i match eleggibili sono stati collegati a componenti esistenti.",
        `Quality gate V2.2: ${quality.qualityLevel} (${quality.qualityScore}/100).`,
        `Review Queue V2.3: ${reviewQueue.length} elementi generati per controllo tecnico.`,
        `Component Classification V2.5: ${classificationV25.summary.classifiedComponents}/${classificationV25.summary.totalComponents} componenti classificati.`,
        "Review Actions V2.4: coda revisionabile con stato verificato/non verificato ed export dedicato.",
      ],
    };

    setAutoMappingV2Report(report);
    setAutoMappingV2Status(
      `Auto Mapping V2 completato: ${appliedMatches} componenti aggiornati, ${placeholders.length} placeholder creati · qualità ${quality.qualityScore}/100.`
    );

    return finalMeshes;
  });
}

function restoreAutoMappingEngineV2Snapshot() {
  if (!autoMappingV2LastSnapshot) {
    setAutoMappingV2Status("Nessuno snapshot Auto Mapping V2 disponibile in questa sessione.");
    return;
  }

  setMeshList(normalizeAdminMeshList(autoMappingV2LastSnapshot));
  setAutoMappingV2Report(null);
  setAutoMappingV2LastSnapshot(null);
  setAutoMappingV2ReviewedLabels({});
  setAutoMappingV2Status("Ripristino Auto Mapping V2 completato: mesh tornate allo stato precedente.");
}

function downloadAutoMappingEngineV2Report() {
  if (!autoMappingV2Report) return;

  downloadJsonFile(`bagastudio-auto-mapping-engine-v2-${Date.now()}.json`, {
    schema: "bagastudio-auto-mapping-engine-export",
    version: 2.4,
    csvFileName: space3DCsvFileName,
    cixFileNames: space3DCixFileNames,
    productId,
    productName,
    reviewedLabels: autoMappingV2ReviewedLabels,
    reviewSummary: getAutoMappingEngineV2ReviewSummary(),
    report: autoMappingV2Report,
  });
}

function buildAutoMappingEngineV2ReviewKey(item: AutoMappingEngineV2ReviewItem, index: number) {
  return `${item.severity}|${item.label}|${index}`;
}

function getAutoMappingEngineV2ReviewSummary() {
  if (!autoMappingV2Report) {
    return { total: 0, reviewed: 0, pending: 0, criticalPending: 0, warningPending: 0 };
  }

  const total = autoMappingV2Report.reviewQueue.length;
  const reviewed = autoMappingV2Report.reviewQueue.filter((item, index) =>
    Boolean(autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)])
  ).length;
  const pendingItems = autoMappingV2Report.reviewQueue.filter((item, index) =>
    !autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)]
  );

  return {
    total,
    reviewed,
    pending: Math.max(0, total - reviewed),
    criticalPending: pendingItems.filter((item) => item.severity === "critical").length,
    warningPending: pendingItems.filter((item) => item.severity === "warning").length,
  };
}

function toggleAutoMappingEngineV2ReviewItem(item: AutoMappingEngineV2ReviewItem, index: number) {
  const key = buildAutoMappingEngineV2ReviewKey(item, index);
  setAutoMappingV2ReviewedLabels((current) => ({
    ...current,
    [key]: !current[key],
  }));
}

function markAllAutoMappingEngineV2ReviewItemsReviewed() {
  if (!autoMappingV2Report) return;

  const next: Record<string, boolean> = {};
  autoMappingV2Report.reviewQueue.forEach((item, index) => {
    next[buildAutoMappingEngineV2ReviewKey(item, index)] = true;
  });
  setAutoMappingV2ReviewedLabels(next);
  setAutoMappingV2Status("Review Queue V2.4 marcata come verificata in sessione.");
}

function resetAutoMappingEngineV2ReviewActions() {
  setAutoMappingV2ReviewedLabels({});
  setAutoMappingV2Status("Review Queue V2.4 riportata a stato non verificato.");
}

function downloadAutoMappingEngineV2ReviewQueue() {
  if (!autoMappingV2Report) return;

  downloadJsonFile(`bagastudio-auto-mapping-review-queue-v2-${Date.now()}.json`, {
    schema: "bagastudio-auto-mapping-review-queue",
    version: 2.4,
    productId,
    productName,
    summary: getAutoMappingEngineV2ReviewSummary(),
    reviewedLabels: autoMappingV2ReviewedLabels,
    items: autoMappingV2Report.reviewQueue.map((item, index) => ({
      ...item,
      reviewed: Boolean(autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)]),
    })),
  });
}

async function handleSpace3DImport(file?: File | null) {
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["s3d", "s3dbak"].includes(ext)) {
    setSpace3DStatus("Formato non supportato: usa .s3d o .s3dbak");
    return;
  }

  setSpace3DFileName(file.name);
  setSpace3DStatus(`Analisi Space3D in corso: ${file.name}`);

  // S3D Analyzer: il file .s3d NON è una geometria 3D caricabile direttamente nel preview.
  // Se esiste già una geometria reale importata prima (DAE/GLB/OBJ/STL), la manteniamo
  // e usiamo il .s3d solo come sorgente metadata/mapping. Se non esiste geometria,
  // il package resta metadata-only e il Viewer lo bloccherà correttamente.
  if (!modelDataUrl) {
    setModelPreviewUrl("");
    setModelFileName(file.name);
    setModelExtension(ext);
  }

  try {
    const buffer = await file.arrayBuffer();
    let text = "";

    try {
      text = new TextDecoder("windows-1252").decode(buffer);
    } catch {
      text = new TextDecoder("utf-8").decode(buffer);
    }

    const report = buildSpace3DAnalyzerReport(file.name, file.size, text);
    const mappedMeshes = normalizeAdminMeshList(space3DReportToMeshConfigs(report));

    setSpace3DAnalyzerReport(report);
    setSpace3DStatus(
      `Analisi completata: ${report.stats.components} componenti / ${report.stats.materials} materiali rilevati`
    );

    if (mappedMeshes.length > 0) {
      setMeshList(mappedMeshes);
      suppressNextMeshAutoScrollRef.current = true;
      setSelectedMeshName(mappedMeshes[0]?.meshName || "");
    }

    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, mappedMeshes, [
        "Import Space3D Analyzer V1: geometria 3D non ancora convertita, mapping componenti/materiali pronto.",
        ...report.warnings,
      ])
    );
  } catch (error) {
    console.error("BagaStudio Space3D analyzer error", error);
    setSpace3DStatus("Errore durante analisi Space3D");
    setSpace3DAnalyzerReport(null);
    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, [], [], [
        error instanceof Error ? error.message : "Errore analisi file Space3D.",
      ])
    );
  }
}

function downloadSpace3DAnalyzerReport() {
  if (!space3DAnalyzerReport) return;

  downloadJsonFile(
    `bagastudio-space3d-analyzer-${Date.now()}.json`,
    space3DAnalyzerReport
  );
}

function normalizeGeometryMatchKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectMissingSpace3DParts() {
  if (!space3DAnalyzerReport) {
    setSpace3DStatus("Carica prima un file .s3d per confrontare i componenti.");
    return;
  }

  const daeMeshes = meshList.filter((mesh) => !mesh.meshName.startsWith("s3d_component_"));
  const daeKeys = new Set<string>(
    daeMeshes.flatMap((mesh): string[] => [
      normalizeGeometryMatchKey(mesh.meshName),
      normalizeGeometryMatchKey(mesh.displayName),
      normalizeGeometryMatchKey(mesh.partId || ""),
    ])
  );

  const missingParts = space3DAnalyzerReport.components
    .filter((component) => {
      const componentKey = normalizeGeometryMatchKey(component.name);
      if (!componentKey) return false;
      return !Array.from(daeKeys).some((key) => key && (componentKey.includes(key) || key.includes(componentKey)));
    })
    .map((component, index): MeshConfig => ({
      meshName: `reconstructed_${component.id}`,
      displayName: component.name || `Parte ricostruita ${index + 1}`,
      category: component.category || "component",
      partId: `reconstructed_${String(index + 1).padStart(3, "0")}_${slugifyBagaStudioId(component.name, "space3d_part")}`,
      componentType: "reconstructed-placeholder",
      runtimeRole: guessRuntimeRole(component.name, component.category || "component"),
      tags: "reconstructed, missing-from-dae, space3d, geometry-completion-v1",
      selectable: true,
      visible: true,
      compatibleLed: component.category === "panel" || component.name.toLowerCase().includes("led"),
      compatibleInsert: component.category === "panel",
      supportsAccessories: component.category !== "lighting",
      materialSlots: "main",
      compatibleAccessories: component.category === "hardware" ? "hardware" : "",
      dimensions: "",
      technicalPoints: "",
      assemblyOrder: "",
      panelThickness: "",
      hardware: component.category === "hardware" ? component.name : "",
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
    }));

  setGeometryCompletionReport({
    status: "ready",
    daeMeshCount: daeMeshes.length,
    s3dComponentCount: space3DAnalyzerReport.components.length,
    matchedCount: Math.max(space3DAnalyzerReport.components.length - missingParts.length, 0),
    missingCount: missingParts.length,
    missingParts,
    generatedAt: new Date().toISOString(),
  });

  setSpace3DStatus(
    `Geometry Completion V1: ${missingParts.length} parti mancanti rilevate su ${space3DAnalyzerReport.components.length} componenti S3D.`
  );
}

function applyMissingPartsAsPlaceholders() {
  if (geometryCompletionReport.missingParts.length === 0) {
    setSpace3DStatus("Nessuna parte mancante da aggiungere come placeholder.");
    return;
  }

  setMeshList((current) => {
    const existing = new Set(current.map((mesh) => mesh.meshName));
    const nextMissing = geometryCompletionReport.missingParts.filter(
      (mesh) => !existing.has(mesh.meshName)
    );

    return normalizeAdminMeshList([...current, ...nextMissing]);
  });

  setSpace3DStatus(
    `Placeholder metadata aggiunti: ${geometryCompletionReport.missingParts.length} parti ricostruite.`
  );
}

function buildSpace3DProductPackageDraft() {
  if (!space3DAnalyzerReport) return;

  const packageDraft = {
    schema: "bagastudio-product-package-from-space3d",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      type: "space3d",
      fileName: space3DAnalyzerReport.fileName,
      analyzerVersion: space3DAnalyzerReport.version,
    },
    product: {
      id: productId,
      name: productName,
      category: productCategory,
      brand: productBrand,
    },
    dimensions: {
      width: { default: widthDefault, min: widthMin, max: widthMax },
      height: { default: heightDefault, min: heightMin, max: heightMax },
      depth: { default: depthDefault, min: depthMin, max: depthMax },
    },
    components: meshList,
    materials: space3DAnalyzerReport.materials,
    analyzerReport: space3DAnalyzerReport,
    geometryCompletion: {
      schema: "bagastudio-geometry-completion-report",
      version: 1,
      ...geometryCompletionReport,
    },
    reconstructedParts: geometryCompletionReport.missingParts,
    geometryStatus: geometryCompletionReport.missingParts.length > 0 ? "metadata-placeholders-ready" : "pending-geometry-bridge",
  };

  const jsonString = JSON.stringify(packageDraft, null, 2);
  setGeneratedJson(jsonString);
  downloadJsonFile("space3d-product-package-draft.json", jsonString);
}

async function handleAdminModelImport(file?: File | null) {
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "glb";
  const supported = ["glb", "gltf", "dae", "fbx", "obj", "stl"];

  setImporterDiagnostic(
    createAdminImporterDiagnostic({
      status: "loading",
      fileName: file.name,
      extension: ext,
      message: `Import ${file.name} in corso...`,
    })
  );

  setModelFileName(file.name);
  const url = URL.createObjectURL(file);
  setModelPreviewUrl(url);

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    setModelDataUrl(dataUrl);
    setModelExtension(ext);
    setSelectedMeshName("");
    setMeshList([]);

    if (!supported.includes(ext)) {
      const diagnostic = createAdminImporterDiagnostic({
        status: "error",
        fileName: file.name,
        extension: ext,
        message: "Formato non supportato dall'importer Admin.",
        errors: [`Formato .${ext} non supportato. Usa GLB, GLTF, DAE, FBX, OBJ o STL.`],
      });
      setImporterDiagnostic(diagnostic);
      return;
    }

    const applyMeshes = (meshes: MeshConfig[], warnings: string[] = []) => {
      const normalizedMeshes = normalizeAdminMeshList(meshes);
      setMeshList(normalizedMeshes);
      setImporterDiagnostic(buildAdminImporterDiagnostic(file.name, ext, normalizedMeshes, warnings));

      if (normalizedMeshes[0]?.meshName) {
        suppressNextMeshAutoScrollRef.current = true;
        setSelectedMeshName(normalizedMeshes[0].meshName);
      }
    };

    const applyError = (error: unknown) => {
      console.error("BagaStudio Admin model import error:", error);
      setMeshList([]);
      setImporterDiagnostic(
        buildAdminImporterDiagnostic(file.name, ext, [], [], [
          error instanceof Error ? error.message : "Errore sconosciuto durante import modello.",
        ])
      );
    };

    if (ext === "stl") {
      applyMeshes([
        {
          meshName: "STL_Mesh",
          displayName: "Componente STL",
          category: "component",
          supportsAccessories: true,
          selectable: true,
          visible: true,
          compatibleLed: false,
          compatibleInsert: false,
          materialSlots: "main",
          compatibleAccessories: "",
          ledPosition: "front",
          ledFrontOffset: "4",
          ledSideMargin: "5",
          ledYOffset: "0",
          insertPosition: "front",
          insertOffsetX: "0",
          insertOffsetY: "0",
          insertOffsetZ: "1",
        },
      ]);
      return;
    }

    if (ext === "obj") {
      new OBJLoader().load(
        url,
        (loadedObject) => applyMeshes(extractMeshesFromObject(loadedObject)),
        undefined,
        applyError
      );
      return;
    }

    if (ext === "fbx") {
      new FBXLoader().load(
        url,
        (loadedObject) => applyMeshes(extractMeshesFromObject(loadedObject)),
        undefined,
        applyError
      );
      return;
    }

    if (ext === "dae") {
      let daeHierarchyWarnings: string[] = [];

      try {
        const daeText = await file.text();
        const daeHierarchyReport = resolveDaeHierarchy(daeText);
        const importerReport = buildImporterReport({
          fileName: file.name,
          sourceFormat: daeHierarchyReport.sourceFormat,
          nodeCount: daeHierarchyReport.nodeCount,
          instanceNodeCount: daeHierarchyReport.instanceNodeCount,
          geometryCount: daeHierarchyReport.geometryCount,
          warnings: daeHierarchyReport.warnings,
        });

        daeHierarchyWarnings = [
          ...daeHierarchyReport.warnings,
          `Importer Report: ${importerReport.status}`,
          `DAE nodes: ${importerReport.statistics.nodes}`,
          `DAE instance nodes: ${importerReport.statistics.instanceNodes}`,
          `DAE geometries: ${importerReport.statistics.geometries}`,
        ];

        console.log("BagaStudio DAE Hierarchy Report:", daeHierarchyReport);
        console.log("BagaStudio Importer Report:", importerReport);

        try {
          const runtimeGlb = await convertDaeToRuntimeGlb({
            daeText,
            fileName: file.name,
            bakeTransforms: true,
            centerModel: true,
            normalizeScale: false,
          });

          const runtimeGlbObjectUrl = URL.createObjectURL(runtimeGlb.glbBlob);

          (window as any).bagastudioLastRuntimeGlb = {
            ...runtimeGlb,
            objectUrl: runtimeGlbObjectUrl,
            sourceFileName: file.name,
          };

          setModelFileName(runtimeGlb.fileName);
          setModelPreviewUrl(runtimeGlbObjectUrl);

          daeHierarchyWarnings.push(
            `Runtime GLB ready: ${runtimeGlb.fileName}`,
            `Runtime GLB meshes: ${runtimeGlb.meshCount}`,
            `Runtime GLB objects: ${runtimeGlb.objectCount}`,
            ...runtimeGlb.warnings
          );

          new GLTFLoader().load(
            runtimeGlbObjectUrl,
            (gltf) => {
              applyMeshes(extractMeshesFromObject(gltf.scene), daeHierarchyWarnings);
            },
            undefined,
            applyError
          );

          console.log("BagaStudio Runtime GLB V1:", {
            fileName: runtimeGlb.fileName,
            objectCount: runtimeGlb.objectCount,
            meshCount: runtimeGlb.meshCount,
            objectUrl: runtimeGlbObjectUrl,
            warnings: runtimeGlb.warnings,
            naming: runtimeGlb.naming,
          });

          return;
        } catch (runtimeGlbError) {
          const message =
            runtimeGlbError instanceof Error
              ? runtimeGlbError.message
              : "errore sconosciuto conversione GLB runtime.";

          daeHierarchyWarnings.push(`Runtime GLB V1 skipped: ${message}`);
          console.warn("BagaStudio Runtime GLB V1 skipped:", runtimeGlbError);
        }
      } catch (error) {
        console.warn("BagaStudio DAE Hierarchy Report skipped:", error);
        daeHierarchyWarnings = [
          error instanceof Error
            ? `DAE hierarchy analyzer: ${error.message}`
            : "DAE hierarchy analyzer: errore sconosciuto durante analisi.",
        ];
      }

      new ColladaLoader().load(
        url,
        (collada) => {
          const daeScene = collada?.scene;
          if (!daeScene) {
            applyError(new Error("DAE scene not found"));
            return;
          }
          applyMeshes(extractMeshesFromObject(daeScene), daeHierarchyWarnings);
        },
        undefined,
        applyError
      );
      return;
    }

    new GLTFLoader().load(
      url,
      (gltf) => applyMeshes(extractMeshesFromObject(gltf.scene)),
      undefined,
      applyError
    );
  } catch (error) {
    console.error("BagaStudio Admin file read error:", error);
    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, [], [], [
        error instanceof Error ? error.message : "Errore lettura file modello.",
      ])
    );
  }
}

function downloadImporterDiagnosticJson() {
  downloadJsonFile(`bagastudio-importer-diagnostic-${Date.now()}.json`, {
    schema: "bagastudio-admin-importer-diagnostic",
    version: 1,
    diagnostic: importerDiagnostic,
    readiness: importerReadiness,
    selectedComponent: selectedMapperMesh,
    components: meshList,
  });
}


  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_28%),#02070d] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[34px] border border-cyan-400/20 bg-gradient-to-r from-[#061827]/95 via-[#07131f]/95 to-[#02070d]/95 shadow-[0_30px_120px_rgba(14,165,233,0.16)] backdrop-blur-2xl">
          <div className="flex flex-col gap-5 border-b border-cyan-400/10 px-6 py-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <img
                src="/bagastudio-core-brand.png"
                alt="BagaStudio Core"
                className="h-28 w-auto rounded-3xl object-contain shadow-[0_0_45px_rgba(14,165,233,0.18)]"
              />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.48em] text-cyan-300/90">
                  BAGASTUDIO CORE
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {adminT.adminPanel}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  {adminT.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                {adminT.language}
                <select
                  value={adminLanguage}
                  onChange={(e) => setAdminLanguage(e.target.value as AdminLanguage)}
                  className="rounded-2xl border border-cyan-400/30 bg-slate-950 px-4 py-3 text-sm font-black normal-case text-white outline-none"
                >
                  <option className="bg-slate-950 text-white" value="it">Italiano</option>
                  <option className="bg-slate-950 text-white" value="en">English</option>
                </select>
              </label>
              <a
                href="/"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 shadow-[0_0_22px_rgba(14,165,233,0.10)] transition hover:border-cyan-300/50 hover:bg-cyan-400/20"
              >
                {adminT.backViewer}
              </a>
              <button
                type="button"
                onClick={downloadAdminBackup}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.30)] transition hover:bg-cyan-400"
              >
                {adminT.downloadBackup}
              </button>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 px-6 py-4 md:grid-cols-4">
            <div className="rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.30)]">
              {adminT.importer}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.productCatalog}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.materials}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.accessoriesPricing}
            </div>
          </nav>
        </header>

        {/* bagastudio-admin-sticky-toolbar-v1 */}
        <div className="sticky top-0 z-[80] mb-4 rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.scrollTo({top:0,behavior:"smooth"})} className="rounded-xl border px-3 py-2 text-xs font-black">
              ↑ Torna su
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="detect-missing-parts"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Rileva mancanti
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="apply-placeholder-metadata"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Placeholder
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="generate-product-package"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Genera Package
            </button>
          </div>
        </div>


        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Prodotti</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.products}</p>
            <p className="mt-1 text-xs text-slate-400">salvati nella libreria locale</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Componenti</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.components}</p>
            <p className="mt-1 text-xs text-slate-400">{adminDashboardStats.selectableParts} selezionabili · {adminDashboardStats.hiddenParts} nascosti</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Configurabilità</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.ledReady + adminDashboardStats.insertReady}</p>
            <p className="mt-1 text-xs text-slate-400">LED {adminDashboardStats.ledReady} · Inserti {adminDashboardStats.insertReady} · Accessori {adminDashboardStats.accessoryReady}</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Stato package</p>
            <p className="mt-2 text-lg font-black text-white">{adminDashboardStats.hasJson ? "JSON pronto" : "Da generare"}</p>
            <p className="mt-1 text-xs text-slate-400">{adminDashboardStats.hasModel ? "Modello caricato" : "Nessun modello caricato"}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-[30px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                {adminT.controlCenter}
              </p>
              <h2 className="mt-2 text-2xl font-black">{adminT.adminTools}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {adminT.toolsDesc}
              </p>
            </div>

            <div className="grid gap-2">
              <button type="button" className="rounded-2xl bg-cyan-500 px-4 py-3 text-left text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.25)]">
                {adminT.stepImport}
              </button>
              <button type="button" className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
                {adminT.stepMapping}
              </button>
              <button type="button" className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
                {adminT.stepPackage}
              </button>
            </div>

            <div className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4 shadow-inner shadow-cyan-950/20">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{adminT.autosave}</p>
              <p className="mt-2 text-sm text-slate-300">{backupStatus}</p>
            </div>
          </aside>

          <div className="space-y-6">

        <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_20px_70px_rgba(14,165,233,0.10)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {adminT.backupProject}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {adminT.backupDesc}
              </p>
              <p className="mt-2 text-xs text-cyan-300">
                {backupStatus}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadAdminBackup}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
              >
                {adminT.downloadBackup}
              </button>

              <button
                type="button"
                onClick={restoreLastAutosave}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100"
              >
                {adminT.restoreAutosave}
              </button>

              <label className="cursor-pointer rounded-xl border border-cyan-400/25 bg-white/5 px-4 py-2 text-sm font-bold text-white">
                {adminT.importBackup}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => importBackupFile(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-orange-400/15 bg-[#120b05]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Collision Engine V1.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo collisioni produzione</h2>
              <p className="mt-1 text-sm text-slate-400">
                Verifica ferramenta fuori pannello, fori fuori pezzo, distanze minime dai bordi, incompatibilità spessori e sovrapposizioni tecniche.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCollisionEngineV1Report}
              className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
            >
              Esporta report collisioni
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{collisionEngineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Verificati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{collisionEngineV1Report.totals.checkedComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltati</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{collisionEngineV1Report.totals.skippedComponents}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{collisionEngineV1Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{collisionEngineV1Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-blue-400/15 bg-blue-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200">Info</p>
              <p className="mt-1 text-2xl font-black text-blue-100">{collisionEngineV1Report.totals.info}</p>
            </div>
          </div>

          <div className="mt-5 max-h-80 space-y-3 overflow-auto pr-2">
            {collisionEngineV1Report.issues.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-100">
                Nessuna collisione rilevata sui dati tecnici attualmente compilati.
              </div>
            ) : (
              collisionEngineV1Report.issues.slice(0, 30).map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-orange-400/10 bg-black/25 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{issue.displayName}</p>
                      <p className="mt-1 text-xs text-slate-400">{issue.code} · {issue.targetLabel}</p>
                    </div>
                    <span className={
                      issue.severity === "critical"
                        ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                        : issue.severity === "warning"
                          ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                          : "rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-blue-100"
                    }>
                      {issue.severity}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-200">{issue.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{issue.recommendation}</p>
                  {(issue.value !== undefined || issue.limit !== undefined) && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Valore: {issue.value ?? "-"} · Limite: {issue.limit ?? "-"}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {collisionEngineV1Report.issues.length > 30 && (
            <p className="mt-3 text-xs text-slate-500">
              Mostrate le prime 30 anomalie. Esporta il report JSON per vedere l'elenco completo.
            </p>
          )}
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#0d071a]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Manufacturing Data Inspector V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Ispezione dati produttivi importati</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla quali dati tecnici sono realmente disponibili prima di attivare Hardware Analyzer V2: spessori, ferramenta, forature e constraint.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                manufacturingDataInspectorV1Report.readiness === "READY_FOR_HARDWARE_ANALYZER_V2"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {manufacturingDataInspectorV1Report.readiness === "READY_FOR_HARDWARE_ANALYZER_V2"
                  ? "Ready for Analyzer V2"
                  : "Dati mancanti"}
              </span>

              <button
                type="button"
                onClick={downloadManufacturingDataInspectorV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta inspector
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{manufacturingDataInspectorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con spessore</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{manufacturingDataInspectorV1Report.totals.componentsWithThickness}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Hardware links</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{manufacturingDataInspectorV1Report.totals.hardwareLinks}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Forature</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{manufacturingDataInspectorV1Report.totals.drillingLinks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Thickness Inspector</p>
              <p className="mt-1 text-xs text-slate-500">
                Senza spessore: {manufacturingDataInspectorV1Report.totals.componentsWithoutThickness}
              </p>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-2">
                {manufacturingDataInspectorV1Report.thicknessRows.slice(0, 24).map((row) => (
                  <div key={row.componentId} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-200">{row.displayName}</span>
                    <span className={row.status === "ready" ? "font-black text-emerald-100" : "font-black text-red-100"}>
                      {row.thickness ?? "n/d"} mm
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Production Readiness</p>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Thickness Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.componentsWithThickness > 0 ? "font-black text-emerald-100" : "font-black text-red-100"}>
                    {manufacturingDataInspectorV1Report.totals.componentsWithThickness > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Hardware Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.hardwareLinks > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.hardwareLinks > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Drilling Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.drillingLinks > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.drillingLinks > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Constraint Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
              </div>

              {manufacturingDataInspectorV1Report.missingData.length > 0 && (
                <div className="mt-4 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-yellow-100">Dati mancanti</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                    {manufacturingDataInspectorV1Report.missingData.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Hardware Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con hardware: {manufacturingDataInspectorV1Report.totals.componentsWithHardware}</p>
              <div className="mt-3 space-y-2">
                {manufacturingDataInspectorV1Report.hardwareSummary.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna ferramenta rilevata.</p>
                ) : manufacturingDataInspectorV1Report.hardwareSummary.slice(0, 8).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-black text-orange-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Drilling Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con forature: {manufacturingDataInspectorV1Report.totals.componentsWithDrillings}</p>
              <div className="mt-3 space-y-2">
                {manufacturingDataInspectorV1Report.drillingSummary.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna foratura rilevata.</p>
                ) : manufacturingDataInspectorV1Report.drillingSummary.slice(0, 8).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-black text-cyan-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Constraint Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con ruolo: {manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole}</p>
              <div className="mt-3 space-y-2">
                {Object.entries(manufacturingDataInspectorV1Report.constraintRoles).length === 0 ? (
                  <p className="text-xs text-slate-500">Nessun constraint rilevato.</p>
                ) : Object.entries(manufacturingDataInspectorV1Report.constraintRoles).slice(0, 8).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{role}</span>
                    <span className="font-black text-violet-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06121a]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Manufacturing Override Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Override spessori pannelli</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Applica un nuovo spessore tecnico mantenendo bloccate le dimensioni esterne. Questo step prepara il ricalcolo di quote interne, forature, ferramenta e CSV senza deformare il modulo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Nuovo spessore mm</span>
                <input
                  value={manufacturingOverrideThickness}
                  onChange={(event) => setManufacturingOverrideThickness(event.target.value)}
                  className="w-36 rounded-2xl border border-cyan-400/25 bg-black/30 px-4 py-3 text-sm font-black text-white outline-none focus:border-cyan-300"
                  placeholder="17.8"
                />
              </label>

              <button
                type="button"
                onClick={applyManufacturingOverrideThicknessV1}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                Applica override
              </button>

              <button
                type="button"
                onClick={downloadManufacturingOverrideV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta report
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{manufacturingOverrideV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{manufacturingOverrideV1Report.totals.editableComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Da cambiare</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{manufacturingOverrideV1Report.totals.changedComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Esterno bloccato</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{manufacturingOverrideV1Report.totals.lockedExternalDimensions}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltati</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{manufacturingOverrideV1Report.totals.skippedComponents}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 space-y-3 overflow-auto pr-2">
            {manufacturingOverrideV1Report.items.slice(0, 20).map((item) => (
              <div key={item.componentId} className="rounded-2xl border border-cyan-400/10 bg-black/25 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Originale: {item.originalThickness ?? "n/d"} mm · Nuovo: {item.targetThickness ?? "n/d"} mm · Delta: {item.deltaThickness ?? "n/d"}
                    </p>
                  </div>
                  <span className={
                    item.status === "changed"
                      ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      : item.status === "skipped"
                        ? "rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-200"
                        : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                  }>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061a14]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">CSV Regeneration Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione CSV produzione</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Genera una prima versione CSV aggiornata dopo l'override spessore. Le dimensioni esterne restano bloccate; le righe non collegate vengono mantenute e segnalate come saltate.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadRegeneratedCsvV1}
                disabled={csvRegenerationV1Report.totals.csvRows === 0}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Scarica CSV rigenerato
              </button>

              <button
                type="button"
                onClick={downloadCsvRegenerationV1Report}
                disabled={csvRegenerationV1Report.totals.csvRows === 0}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta report
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe CSV</p>
              <p className="mt-1 text-2xl font-black text-white">{csvRegenerationV1Report.totals.csvRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Collegate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvRegenerationV1Report.totals.linkedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Aggiornate</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvRegenerationV1Report.totals.updatedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Invariate</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{csvRegenerationV1Report.totals.unchangedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltate</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvRegenerationV1Report.totals.skippedRows}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071611] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Pezzo</th>
                  <th className="px-3 py-3">Materiale</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {csvRegenerationV1Report.rows.slice(0, 30).map((row, index) => (
                  <tr key={`${index}-${row.name}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{row.name}</td>
                    <td className="px-3 py-2">{row.material || "-"}</td>
                    <td className="px-3 py-2">{row.originalThickness ?? "n/d"} → {row.regeneratedThickness ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        row.status === "updated"
                          ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                          : row.status === "skipped"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06141a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">CSV Regeneration Guard V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo finale rigenerazione CSV</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica che le righe CSV rigenerate siano coerenti con Production Readiness Gate e Parametric Edit prima dell'export produttivo definitivo.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                csvRegenerationGuardV1Report.readiness === "CSV_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : csvRegenerationGuardV1Report.readiness === "CSV_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {csvRegenerationGuardV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadCsvRegenerationGuardV1Report}
                disabled={csvRegenerationGuardV1Report.totals.rows === 0}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta guard
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe</p>
              <p className="mt-1 text-2xl font-black text-white">{csvRegenerationGuardV1Report.totals.rows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvRegenerationGuardV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvRegenerationGuardV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvRegenerationGuardV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Ingombri bloccati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{csvRegenerationGuardV1Report.totals.externalDimensionsLocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#07161a] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Riga</th>
                  <th className="px-3 py-3">Pezzo</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Gate</th>
                  <th className="px-3 py-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {csvRegenerationGuardV1Report.items.slice(0, 30).map((item) => (
                  <tr key={`${item.rowIndex}-${item.name}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 text-slate-500">{item.rowIndex}</td>
                    <td className="px-3 py-2 font-semibold text-white">{item.name}</td>
                    <td className="px-3 py-2">{item.originalThickness ?? "n/d"} → {item.regeneratedThickness ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1a0617]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Export Package V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pacchetto export factory</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Matrix, Production Readiness, Parametric Edit, CSV rigenerato e Guard in un unico pacchetto JSON diagnostico per il flusso Factory.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryExportPackageV1Report.readiness === "FACTORY_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryExportPackageV1Report.readiness === "FACTORY_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryExportPackageV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryExportPackageV1Report}
                disabled={factoryExportPackageV1Report.summary.csvRows === 0}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta factory package
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryExportPackageV1Report.sources.componentCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe CSV</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryExportPackageV1Report.summary.csvRows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Aggiornate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryExportPackageV1Report.summary.csvUpdatedRows}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review CSV</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryExportPackageV1Report.summary.csvReviewRows}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked CSV</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryExportPackageV1Report.summary.csvBlockedRows}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Spessore target</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{factoryExportPackageV1Report.sources.targetThickness ?? "n/d"}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Note export</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {factoryExportPackageV1Report.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
        </section>



        <section className="rounded-[28px] border border-lime-400/15 bg-[#0f1a06]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">BOM Regeneration V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Distinta base rigenerata</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raggruppa le righe del CSV rigenerato per materiale e spessore, preparando la futura distinta componenti/ferramenta del Factory Engine.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                bomRegenerationV1Report.readiness === "BOM_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : bomRegenerationV1Report.readiness === "BOM_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {bomRegenerationV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadBomRegenerationV1Report}
                disabled={bomRegenerationV1Report.totals.bomItems === 0}
                className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta BOM V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Voci BOM</p>
              <p className="mt-1 text-2xl font-black text-white">{bomRegenerationV1Report.totals.bomItems}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{bomRegenerationV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{bomRegenerationV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{bomRegenerationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{bomRegenerationV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#101a07] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Materiale</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Q.tà</th>
                  <th className="px-3 py-3">Componenti</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {bomRegenerationV1Report.items.slice(0, 30).map((item) => (
                  <tr key={item.key} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.material || "n/d"}</td>
                    <td className="px-3 py-2">{item.thickness ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2 text-slate-500">{item.componentNames.slice(0, 4).join(", ")}{item.componentNames.length > 4 ? "…" : ""}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06151a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Hardware Reposition Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Riposizionamento ferramenta parametrico</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il ricalcolo diagnostico di ferramenta e forature dopo cambio spessore, mantenendo riferimenti parametrici a bordo/asse e ingombro esterno bloccato.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareRepositionEngineV1Report.readiness === "REPOSITION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : hardwareRepositionEngineV1Report.readiness === "REPOSITION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {hardwareRepositionEngineV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadHardwareRepositionEngineV1Report}
                disabled={hardwareRepositionEngineV1Report.totals.components === 0}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta Reposition V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareRepositionEngineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Da riposizionare</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwareRepositionEngineV1Report.totals.repositionRequired}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareRepositionEngineV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareRepositionEngineV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareRepositionEngineV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071a1d] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Componente</th>
                  <th className="px-3 py-3">Delta</th>
                  <th className="px-3 py-3">CSV</th>
                  <th className="px-3 py-3">Constraint</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {hardwareRepositionEngineV1Report.items.slice(0, 30).map((item) => (
                  <tr key={item.componentId} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.displayName}</td>
                    <td className="px-3 py-2">{item.thicknessDelta ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.linkedCsvRow ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.constraintStatus ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#06111f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">CSV/CIX Regeneration Pipeline V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pipeline rigenerazione CSV / CIX</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega CSV rigenerato, Guard, BOM e riposizionamento ferramenta per preparare la futura esportazione produttiva CSV/CIX senza modificare ancora i file macchina reali.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                csvCixRegenerationPipelineV1Report.readiness === "PIPELINE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : csvCixRegenerationPipelineV1Report.readiness === "PIPELINE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {csvCixRegenerationPipelineV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadCsvCixRegenerationPipelineV1Report}
                disabled={csvCixRegenerationPipelineV1Report.totals.components === 0}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta Pipeline CSV/CIX V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{csvCixRegenerationPipelineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Target CIX</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{csvCixRegenerationPipelineV1Report.totals.cixTargetsPlanned}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvCixRegenerationPipelineV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvCixRegenerationPipelineV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvCixRegenerationPipelineV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071a2a] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Componente</th>
                  <th className="px-3 py-3">CSV</th>
                  <th className="px-3 py-3">BOM</th>
                  <th className="px-3 py-3">Hardware</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {csvCixRegenerationPipelineV1Report.items.slice(0, 30).map((item) => (
                  <tr key={`${item.componentId}-${item.csvRow ?? item.displayName}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.displayName}</td>
                    <td className="px-3 py-2">{item.csvGuardStatus || item.csvStatus || "n/d"}</td>
                    <td className="px-3 py-2">{item.bomStatus || "n/d"}</td>
                    <td className="px-3 py-2">{item.hardwareRepositionStatus || "n/d"}</td>
                    <td className="px-3 py-2 text-slate-500">{item.outputTargets.join(" / ")}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#16071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Motore centrale produzione</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raccoglie Production Gate, Parametric Edit, CSV Guard, BOM, Hardware Reposition e Pipeline CSV/CIX per produrre un unico stato Factory Ready / Review / Blocked.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryEngineV1Report.factoryStatus === "READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryEngineV1Report.factoryStatus === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryEngineV1Report.factoryStatus}
              </span>

              <button
                type="button"
                onClick={downloadFactoryEngineV1Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Factory Engine V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV1Report.factoryScore}/100</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV1Report.summary.components}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryEngineV1Report.blockers.length}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryEngineV1Report.warnings.length}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Export</p>
              <p className="mt-1 text-sm font-black text-fuchsia-100">{factoryEngineV1Report.summary.exportReadiness.replace(/_/g, " ")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Blocchi critici</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(factoryEngineV1Report.blockers.length ? factoryEngineV1Report.blockers : ["Nessun blocco critico rilevato."]).map((item, index) => (
                  <li key={`factory-blocker-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-yellow-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-yellow-200">Revisioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(factoryEngineV1Report.warnings.length ? factoryEngineV1Report.warnings : ["Nessuna revisione obbligatoria."]).map((item, index) => (
                  <li key={`factory-warning-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {factoryEngineV1Report.recommendations.map((item, index) => (
                  <li key={`factory-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Product Package Regeneration V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione Product Package</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara una patch diagnostica del Product Package collegando Factory Engine, Parametric Edit, BOM, Hardware Reposition e Pipeline CSV/CIX. È il ponte verso Viewer Sync V1.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                productPackageRegenerationV1Report.status === "READY_TO_SYNC"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : productPackageRegenerationV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {productPackageRegenerationV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadProductPackageRegenerationV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Product Package V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{productPackageRegenerationV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Viewer Sync Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productPackageRegenerationV1Report.totals.viewerSyncReady}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{productPackageRegenerationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productPackageRegenerationV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Next package</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">v{productPackageRegenerationV1Report.nextPackageVersion}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Componente</th>
                  <th className="px-4 py-3">Spessore</th>
                  <th className="px-4 py-3">Viewer</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productPackageRegenerationV1Report.components.slice(0, 18).map((item) => (
                  <tr key={`product-package-regeneration-${item.componentId}`}>
                    <td className="px-4 py-3">
                      <p className="font-black text-white">{item.displayName}</p>
                      <p className="mt-1 text-slate-500">{item.note}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.targetThickness ?? "n/d"} mm</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.viewerSyncReady ? "ready" : "review"}</td>
                    <td className="px-4 py-3">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#061525]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Viewer Sync V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Sincronizzazione Viewer</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara la sincronizzazione metadata-only dal Product Package rigenerato al Viewer, preservando geometria attuale, materiali, accessori, LED e configurazione cliente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                viewerSyncV1Report.status === "SYNC_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : viewerSyncV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {viewerSyncV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadViewerSyncV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Viewer Sync V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{viewerSyncV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{viewerSyncV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{viewerSyncV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{viewerSyncV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata only</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{viewerSyncV1Report.totals.metadataOnly}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Modalità</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewerSyncV1Report.components.slice(0, 18).map((item) => (
                    <tr key={`viewer-sync-v1-${item.componentId}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.geometryMode.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.viewerSyncReady ? "sync" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : item.status === "skipped"
                                ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                                : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {viewerSyncV1Report.recommendations.map((item, index) => (
                  <li key={`viewer-sync-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-violet-400/15 bg-[#130b24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Parametric Structure Editor V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Editor struttura parametrica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il piano diagnostico per modificare struttura, spessori, divisori e riferimenti ferramenta mantenendo bloccato l'ingombro esterno e preservando il futuro workflow Viewer.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                parametricStructureEditorV1Report.status === "STRUCTURE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : parametricStructureEditorV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {parametricStructureEditorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadParametricStructureEditorV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Structure Editor V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{parametricStructureEditorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{parametricStructureEditorV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{parametricStructureEditorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{parametricStructureEditorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Rigenerazione</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{parametricStructureEditorV1Report.totals.requiresRegeneration}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{parametricStructureEditorV1Report.totals.metadataUpdates}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Azione</th>
                    <th className="px-4 py-3">Ingombro</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parametricStructureEditorV1Report.actions.slice(0, 18).map((item) => (
                    <tr key={`parametric-structure-editor-${item.componentId}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.actionType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.keepsExternalDimensions ? "bloccato" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {parametricStructureEditorV1Report.recommendations.map((item, index) => (
                  <li key={`parametric-structure-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#18071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Engine V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Orchestratore factory avanzato</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Factory Engine, Product Package Regeneration, Viewer Sync e Structure Editor in un unico stato operativo pronto per i prossimi step Viewer Sync V2 e rigenerazione reale Product Package.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryEngineV2Report.status === "FACTORY_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryEngineV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryEngineV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryEngineV2Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Factory Engine V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV2Report.factoryScore}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fasi</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV2Report.totals.phases}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryEngineV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryEngineV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryEngineV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Viewer Bridge</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{factoryEngineV2Report.viewerBridge.viewerSyncReady ? "OK" : "Review"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[280px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fase</th>
                    <th className="px-4 py-3">Schema</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factoryEngineV2Report.phases.map((item) => (
                    <tr key={`factory-engine-v2-${item.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.sourceSchema}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Viewer Bridge</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Product Package: {factoryEngineV2Report.viewerBridge.productPackageRegenerationReady ? "ready" : "review"}</p>
                  <p>Viewer Sync: {factoryEngineV2Report.viewerBridge.viewerSyncReady ? "ready" : "review"}</p>
                  <p>Ingombro esterno: {factoryEngineV2Report.viewerBridge.keepsExternalEnvelopeLocked ? "bloccato" : "review"}</p>
                  <p>Materiali/accessori/LED: {factoryEngineV2Report.viewerBridge.materialAccessoryLedWorkflowPreserved ? "preservati" : "review"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {factoryEngineV2Report.recommendations.map((item, index) => (
                    <li key={`factory-engine-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061820]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Product Package V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione pacchetto prodotto V2</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara la patch Product Package collegata a Factory Engine V2, mantenendo separati dati produttivi e configurazione cliente per preservare texture, accessori, LED e Kelvin nel Viewer.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                productPackageRegenerationV2Report.status === "PACKAGE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : productPackageRegenerationV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {productPackageRegenerationV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadProductPackageRegenerationV2Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Product Package V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Patch</p>
              <p className="mt-1 text-2xl font-black text-white">{productPackageRegenerationV2Report.totals.patches}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productPackageRegenerationV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{productPackageRegenerationV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productPackageRegenerationV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Geometria</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{productPackageRegenerationV2Report.totals.preserveGeometry}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{productPackageRegenerationV2Report.totals.metadataUpdates}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Struttura</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{productPackageRegenerationV2Report.totals.structureRegeneration}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Patch</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productPackageRegenerationV2Report.patches.slice(0, 18).map((item) => (
                    <tr key={`product-package-v2-${item.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.patchType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-300">{item.viewerSyncHint}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Regole pacchetto</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Materiali: {productPackageRegenerationV2Report.packageRules.preserveMaterials ? "preservati" : "review"}</p>
                  <p>Accessori: {productPackageRegenerationV2Report.packageRules.preserveAccessories ? "preservati" : "review"}</p>
                  <p>LED/Kelvin: {productPackageRegenerationV2Report.packageRules.preserveLedConfiguration ? "preservati" : "review"}</p>
                  <p>Ingombro esterno: {productPackageRegenerationV2Report.packageRules.keepExternalEnvelopeLocked ? "bloccato" : "review"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {productPackageRegenerationV2Report.recommendations.map((item, index) => (
                    <li key={`product-package-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071421]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Viewer Sync V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Sincronizzazione Viewer V2</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il ponte tra Product Package V2 e Viewer, mantenendo separata la configurazione cliente dal layer produttivo per preservare texture, accessori, LED e Kelvin.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                viewerSyncV2Report.status === "VIEWER_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : viewerSyncV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {viewerSyncV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadViewerSyncV2Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Viewer Sync V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{viewerSyncV2Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{viewerSyncV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{viewerSyncV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{viewerSyncV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{viewerSyncV2Report.totals.metadataOnly}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Geometry</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{viewerSyncV2Report.totals.geometryPatch}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Structure</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{viewerSyncV2Report.totals.structureRegeneration}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Sync</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewerSyncV2Report.items.slice(0, 18).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.syncMode.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.preservesCustomerConfiguration ? "preservata" : "review"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole Viewer</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Materiali: {viewerSyncV2Report.viewerRules.preserveExistingMaterials ? "preservati" : "review"}</p>
                  <p>Accessori: {viewerSyncV2Report.viewerRules.preserveExistingAccessories ? "preservati" : "review"}</p>
                  <p>LED/Kelvin: {viewerSyncV2Report.viewerRules.preserveExistingLedAndKelvin ? "preservati" : "review"}</p>
                  <p>Geometria: {viewerSyncV2Report.viewerRules.requireManualReviewBeforeGeometryRebuild ? "review manuale" : "automatica"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {viewerSyncV2Report.recommendations.map((item, index) => (
                    <li key={`viewer-sync-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>


        <section className="rounded-[28px] border border-orange-400/15 bg-[#1b1207]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Factory Production Package V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pacchetto produzione finale</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Factory Engine V2, Product Package V2 e Viewer Sync V2 in un report unico per preparare produzione, Viewer e configurazione cliente senza perdita dati.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryProductionPackageV1Report.status === "PRODUCTION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryProductionPackageV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryProductionPackageV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryProductionPackageV1Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta Production Package
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryProductionPackageV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryProductionPackageV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryProductionPackageV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryProductionPackageV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Factory</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{factoryProductionPackageV1Report.totals.factoryIncluded}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Viewer</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{factoryProductionPackageV1Report.totals.viewerIncluded}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">CSV/CIX</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{factoryProductionPackageV1Report.totals.csvCixIncluded}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">BOM</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{factoryProductionPackageV1Report.totals.bomIncluded}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Factory</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">CSV/CIX</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factoryProductionPackageV1Report.items.slice(0, 18).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInFactoryPackage ? "incluso" : "bloccato"}</td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInViewerPackage ? "incluso" : "review"}</td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInCsvCixExport ? "incluso" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Regole pacchetto</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Factory ready: {factoryProductionPackageV1Report.packageRules.requireFactoryReady ? "richiesto" : "non richiesto"}</p>
                  <p>Viewer sync: {factoryProductionPackageV1Report.packageRules.requireViewerSyncReady ? "richiesto" : "non richiesto"}</p>
                  <p>Config cliente: {factoryProductionPackageV1Report.packageRules.preserveCustomerMaterialsAccessoriesLed ? "preservata" : "review"}</p>
                  <p>Export CSV/CIX: {factoryProductionPackageV1Report.packageRules.includeCsvCixPayload ? "incluso" : "escluso"}</p>
                  <p>BOM: {factoryProductionPackageV1Report.packageRules.includeBomPayload ? "inclusa" : "esclusa"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {factoryProductionPackageV1Report.recommendations.map((item, index) => (
                    <li key={`factory-production-package-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06171b]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Intelligenza locale da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il controllo tecnico da piantina caricata: ingombri mobili, battiscopa, supporto pareti, passaggi, montabilità e schede tecniche.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV1Report.status === "ROOM_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV1Report.status === "ROOM_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Layout Intelligence
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Controlli</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV1Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV1Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Mobili collegati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV1Report.totals.furnitureItemsLinked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV1Report.checks.map((check) => (
                    <tr key={check.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{check.label}</p>
                        <p className="mt-1 text-slate-500">{check.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{check.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          check.status === "pass"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : check.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {check.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Dati richiesti</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Input pianta: {layoutRoomIntelligenceV1Report.assumptions.planInputMode.replace(/_/g, " ")}</p>
                  <p>Battiscopa: {layoutRoomIntelligenceV1Report.assumptions.baseboardDataRequired ? "obbligatorio" : "non richiesto"}</p>
                  <p>Tipo parete: {layoutRoomIntelligenceV1Report.assumptions.wallMaterialDataRequired ? "obbligatorio" : "non richiesto"}</p>
                  <p>Validazione ingombri: {layoutRoomIntelligenceV1Report.assumptions.furnitureFootprintValidationRequired ? "richiesta" : "non richiesta"}</p>
                  <p>Schede tecniche: {layoutRoomIntelligenceV1Report.assumptions.technicalSheetGenerationReady ? "predisposte" : "bloccate"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV1Report.recommendations.map((item, index) => (
                    <li key={`layout-room-intelligence-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-400/15 bg-[#090f24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Motore stanza, pareti e vincoli tecnici</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega piantina, muri, aperture, ingombri mobili, battiscopa, supporti parete, punti tecnici e Smart Technical Validator.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV2Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV2Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV2Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Layout Intelligence V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Zone V2</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV2Report.totals.zones}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Mobili</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{layoutRoomIntelligenceV2Report.totals.linkedFurnitureItems}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Critici tecnici</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV2Report.totals.criticalTechnicalIssues}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Zona / controllo</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV2Report.zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{zone.label}</p>
                        <p className="mt-1 text-slate-500">{zone.note}</p>
                        <p className="mt-1 text-violet-200">Output: {zone.linkedOutput}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{zone.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          zone.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : zone.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {zone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Regole V2 attive</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Guscio stanza chiuso: {layoutRoomIntelligenceV2Report.validationRules.requireClosedRoomShell ? "richiesto" : "non richiesto"}</p>
                  <p>Scala reale approvata: {layoutRoomIntelligenceV2Report.validationRules.requireScaledReference ? "richiesta" : "non richiesta"}</p>
                  <p>Aperture prima dei mobili: {layoutRoomIntelligenceV2Report.validationRules.requireOpeningsBeforeFurnitureApproval ? "sì" : "no"}</p>
                  <p>Gate Smart Validator: {layoutRoomIntelligenceV2Report.validationRules.requireSmartTechnicalValidatorGate ? "attivo" : "non attivo"}</p>
                  <p>Blocco export su critici: {layoutRoomIntelligenceV2Report.validationRules.blockTechnicalExportOnCriticalIssues ? "attivo" : "non attivo"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Prossime azioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV2Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#12071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Checklist automatica, rischi stanza ed export gate</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raffina il V2 trasformando zone e vincoli in priorità operative, preflight prospetti parete e blocco export tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV21Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV21Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV21Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV21Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Layout Intelligence V2.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Checklist</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV21Report.totals.checklistItems}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Azioni P1</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV21Report.totals.p1Actions}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Azioni P2</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV21Report.totals.p2Actions}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Azioni P3</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV21Report.totals.p3Actions}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Rischi alti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV21Report.totals.highRisks}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Rischi medi</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV21Report.totals.mediumRisks}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Preview cliente</p>
              <p className="mt-1 text-sm font-black text-fuchsia-100">{layoutRoomIntelligenceV21Report.exportGate.customerPreviewReady ? "READY" : "BLOCCATA"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Priorità</th>
                    <th className="px-4 py-3">Checklist operativa</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV21Report.checklist.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-black text-white">{item.priority}</td>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-slate-500">{item.action}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.readiness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Preflight prospetti parete</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Prospetti generabili: {layoutRoomIntelligenceV21Report.wallElevationPreflight.canGenerateWallElevations ? "sì" : "no"}</p>
                  <p>Serve scala/guscio stanza: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsScaledRoomShell ? "sì" : "no"}</p>
                  <p>Serve approvazione aperture: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsOpeningsApproval ? "sì" : "no"}</p>
                  <p>Serve approvazione punti tecnici: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsTechnicalPointsApproval ? "sì" : "no"}</p>
                  <p>Serve Smart Validator pulito: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsSmartValidatorClearance ? "sì" : "no"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Export gate</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>PDF tecnico: {layoutRoomIntelligenceV21Report.exportGate.pdfReady ? "pronto" : "bloccato"}</p>
                  <p>DXF/CAD: {layoutRoomIntelligenceV21Report.exportGate.dxfCadReady ? "pronto" : "bloccato"}</p>
                  <p className="text-slate-400">{layoutRoomIntelligenceV21Report.exportGate.reason}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Matrice rischi</p>
                <ul className="mt-3 max-h-[150px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV21Report.risks.map((risk) => (
                    <li key={risk.id}>• <span className="font-black text-white">{risk.level.toUpperCase()}</span> — {risk.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-purple-400/15 bg-[#10061d]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">Layout / Room Intelligence V2.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prospetti parete tecnici e layer export</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida il V2.1 creando una struttura per prospetti parete, layer PDF/DXF/CAD, gate tecnici e legenda operativa.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV22Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV22Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV22Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV22Report}
                className="rounded-2xl border border-purple-400/25 bg-purple-400/10 px-5 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-400/20"
              >
                Esporta Layout Intelligence V2.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Prospetti</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV22Report.totals.wallElevations}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV22Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV22Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV22Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-purple-400/15 bg-purple-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200">Priorità critiche</p>
              <p className="mt-1 text-2xl font-black text-purple-100">{layoutRoomIntelligenceV22Report.totals.criticalPriorities}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Gate bloccanti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV22Report.totals.exportBlockingGates}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[330px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Prospetto / layer</th>
                    <th className="px-4 py-3">Priorità</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV22Report.wallElevations.map((wall) => (
                    <tr key={wall.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{wall.title}</p>
                        <p className="mt-1 text-slate-500">{wall.note}</p>
                        <p className="mt-1 text-purple-200">Layer: {wall.requiredLayers.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-white">{wall.priority.toUpperCase()}</td>
                      <td className="px-4 py-3 text-slate-300">{wall.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Gate scheda parete</p>
                <ul className="mt-3 max-h-[165px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.wallSheetGates.map((gate) => (
                    <li key={gate.id}>• <span className="font-black text-white">{gate.passed ? "OK" : gate.blocking ? "BLOCK" : "REVIEW"}</span> — {gate.label}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Legenda layer export</p>
                <ul className="mt-3 max-h-[165px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.layerLegend.map((layer) => (
                    <li key={layer.id}>• <span className="font-black text-white">{layer.label}</span> — {layer.output}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Prossime azioni V2.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-2-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#211407]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V2.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Regole tecniche parete parametriche</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida quote parete, lavandino appoggio/incasso, punti elettrici/idraulici, battiscopa, fissaggi e routing layer PDF/DXF/CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV23Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV23Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV23Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV23Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Layout Intelligence V2.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV23Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV23Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warnings</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV23Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV23Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Export bloccati</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{layoutRoomIntelligenceV23Report.totals.exportBlockedRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[330px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Regola tecnica</th>
                    <th className="px-4 py-3">Layer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV23Report.wallRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.action}</p>
                        <p className="mt-1 text-amber-200">Dati: {rule.requiredData.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{rule.exportLayer}</td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.passed
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : rule.severity === "critical"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {rule.passed ? "passed" : rule.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Quote lavandino</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.sinkHeightRules.map((rule) => (
                    <li key={rule.id}>• <span className="font-black text-white">{rule.sinkType}</span>: piano a {rule.topHeightCm} cm — {rule.note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Routing layer export</p>
                <ul className="mt-3 max-h-[150px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.exportRouting.map((route) => (
                    <li key={route.id}>• <span className="font-black text-white">{route.layer}</span> → {route.target}: {route.content}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V2.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-3-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061c1f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V2.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Collisioni layout e passaggi minimi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla passaggi, aperture, compatibilità parete/mobile, punti tecnici, battiscopa e area montatore prima dell'export tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV24Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV24Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV24Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV24Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Layout Intelligence V2.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Check</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV24Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV24Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV24Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV24Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV24Report.totals.exportBlockingChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo layout</th>
                    <th className="px-4 py-3">Requisito</th>
                    <th className="px-4 py-3">Impatto export</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV24Report.collisionChecks.map((check) => (
                    <tr key={check.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{check.label}</p>
                        <p className="mt-1 text-slate-500">{check.detectedRisk}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{check.minimumRequirement}</td>
                      <td className="px-4 py-3 text-cyan-100">{check.exportImpact}</td>
                      <td className="px-4 py-3">
                        <span className={
                          check.passed
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : check.severity === "critical"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {check.passed ? "passed" : check.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Soglie operative V2.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Passaggio principale: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumMainPassageCm} cm</span></li>
                  <li>• Accesso tecnico: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumServiceAccessCm} cm</span></li>
                  <li>• Apertura cassetti: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumDrawerOpeningCm} cm</span></li>
                  <li>• Area montatore: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumInstallerWorkingAreaCm} cm</span></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni layer export</p>
                <ul className="mt-3 max-h-[145px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV24Report.exportLayerActions.map((action) => (
                    <li key={action.id}>• <span className="font-black text-white">{action.targetLayer}</span>: {action.action}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossime azioni V2.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV24Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-4-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1b0b24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Interassi postazioni e specchi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Inserisce le regole minime per postazioni barber ed estetista: le poltrone e gli specchi collegati devono rispettare lo stesso interasse tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV25Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV25Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV25Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV25Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Layout Intelligence V2.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV25Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV25Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV25Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV25Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{layoutRoomIntelligenceV25Report.totals.exportBlockingChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Regole interasse</p>
              <div className="mt-3 grid gap-3">
                {layoutRoomIntelligenceV25Report.stationSpacingRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{rule.appliesTo}</p>
                      </div>
                      <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-fuchsia-100">
                        {rule.stationType}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Poltrone/postazioni: <span className="font-black text-white">{rule.minimumCenterDistanceCm} cm</span></p>
                      <p>Specchi collegati: <span className="font-black text-white">{rule.mirrorCenterDistanceCm} cm</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Check automatici V2.5</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-300">
                  {layoutRoomIntelligenceV25Report.stationSpacingChecks.map((check) => (
                    <li key={check.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="font-black text-white">{check.label}</p>
                      <p className="mt-1 text-slate-400">{check.minimumRequirement}</p>
                      <p className="mt-1 text-slate-400">{check.mirrorRequirement}</p>
                      <p className="mt-2 text-xs text-fuchsia-100">{check.correctiveAction}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V2.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV25Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-5-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061a13]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Layout / Room Intelligence V2.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Dynamic Rule Registry</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il Rule Engine JSON-driven: le regole tecniche potranno essere aggiunte, esportate e gestite nel tempo senza inserirle solo come codice hardcoded.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleRegistryV26Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleRegistryV26Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleRegistryV26Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleRegistryV26Report}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta Rule Registry V2.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleRegistryV26Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Abilitate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleRegistryV26Report.totals.enabled}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Admin editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleRegistryV26Report.totals.adminEditable}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleRegistryV26Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleRegistryV26Report.totals.exportBlockingRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Rule set JSON-driven</p>
              <p className="mt-2 text-sm text-slate-400">{dynamicRuleRegistryV26Report.ruleSet.description}</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleRegistryV26Report.ruleSet.rules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{rule.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{rule.id}</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                        {rule.source}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Target: <span className="font-black text-white">{rule.target}</span></p>
                      <p>Tipo: <span className="font-black text-white">{rule.type}</span></p>
                      <p>Layer: <span className="font-black text-white">{rule.exportLayer}</span></p>
                      <p>Admin: <span className="font-black text-white">{rule.editableFromAdmin ? "editabile" : "core locked"}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Valutazioni V2.6</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-300">
                  {dynamicRuleRegistryV26Report.evaluations.map((evaluation) => (
                    <li key={evaluation.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="font-black text-white">{evaluation.ruleId}</p>
                      <p className="mt-1 text-slate-400">Atteso: {evaluation.expected}</p>
                      <p className="mt-1 text-slate-400">Rilevato: {evaluation.detected}</p>
                      <p className="mt-2 text-xs text-emerald-100">{evaluation.action}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Prossime azioni V2.6</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleRegistryV26Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-registry-v2-6-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-amber-400/15 bg-[#1f1605]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V2.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Admin Bridge</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega il Dynamic Rule Registry al futuro Admin Rules Manager: import/export JSON, blocco regole core, validazione prima del salvataggio e profili cliente/settore.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleAdminBridgeV27Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleAdminBridgeV27Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleAdminBridgeV27Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleAdminBridgeV27Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Rule Admin Bridge V2.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Draft regole</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleAdminBridgeV27Report.totals.drafts}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleAdminBridgeV27Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleAdminBridgeV27Report.totals.needsReview}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Core locked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleAdminBridgeV27Report.totals.lockedCore}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Importabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleAdminBridgeV27Report.totals.importable}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Export</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{dynamicRuleAdminBridgeV27Report.totals.exportable}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Bozze regole Admin</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleAdminBridgeV27Report.drafts.map((draft) => (
                  <div key={draft.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{draft.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{draft.sourceRuleId}</p>
                      </div>
                      <span className={
                        draft.adminStatus === "ready"
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                          : draft.adminStatus === "locked_core"
                            ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {draft.adminStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Modulo: <span className="font-black text-white">{draft.module}</span></p>
                      <p>Tipo: <span className="font-black text-white">{draft.type}</span></p>
                      <p>Target: <span className="font-black text-white">{draft.target}</span></p>
                      <p>Valore cm: <span className="font-black text-white">{draft.numericValueCm ?? "n/d"}</span></p>
                    </div>
                    <p className="mt-3 text-xs text-amber-100">{draft.validationMessage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Contratto import/export</p>
                <p className="mt-2 text-sm text-slate-300">Schema accettato: <span className="font-black text-white">{dynamicRuleAdminBridgeV27Report.importExportContract.acceptedSchema}</span></p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Campi richiesti</p>
                <p className="mt-1 text-sm text-slate-300">{dynamicRuleAdminBridgeV27Report.importExportContract.requiredFields.join(", ")}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Operazioni bloccate</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {dynamicRuleAdminBridgeV27Report.importExportContract.blockedOperations.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V2.7</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleAdminBridgeV27Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-admin-bridge-v2-7-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1b0620]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.8</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Pack System</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Organizza le regole tecniche in pacchetti attivabili per core, settore, cliente e progetto, così le nuove regole possono crescere senza modificare il codice principale.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRulePackV28Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRulePackV28Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRulePackV28Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRulePackV28Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Rule Pack V2.8
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pack</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRulePackV28Report.totals.packs}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Attivi</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRulePackV28Report.totals.active}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Bozze</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRulePackV28Report.totals.draft}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Locked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRulePackV28Report.totals.locked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRulePackV28Report.totals.editable}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Regole collegate</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{dynamicRulePackV28Report.totals.linkedRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Pacchetti regole</p>
              <div className="mt-3 grid gap-3">
                {dynamicRulePackV28Report.packs.map((pack) => (
                  <div key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{pack.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{pack.id} · {pack.profile}</p>
                      </div>
                      <span className={
                        pack.status === "active"
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                          : pack.status === "locked"
                            ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {pack.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{pack.description}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                      <p>Categoria: <span className="font-black text-white">{pack.category}</span></p>
                      <p>Scope: <span className="font-black text-white">{pack.exportScope}</span></p>
                      <p>Regole: <span className="font-black text-white">{pack.ruleIds.length}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Ordine attivazione</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRulePackV28Report.activationOrder.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Policy conflitti</p>
                <p className="mt-2 text-sm text-slate-300">Priorità: <span className="font-black text-white">{dynamicRulePackV28Report.conflictPolicy.priority.join(" → ")}</span></p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Regole core locked sempre prevalenti</li>
                  <li>• Override ammesso solo su regole editabili</li>
                  <li>• Pack non valido blocca attivazione</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V2.8</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRulePackV28Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-pack-v2-8-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-rose-400/15 bg-[#21070e]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Layout / Room Intelligence V2.9</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Conflict Resolver</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla conflitti tra Rule Pack, protegge le regole core bloccate e prepara rollback sicuro prima di attivare regole cliente/progetto.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleConflictResolverV29Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleConflictResolverV29Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleConflictResolverV29Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleConflictResolverV29Report}
                className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
              >
                Esporta Conflict Resolver V2.9
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Conflitti</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleConflictResolverV29Report.totals.conflicts}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bloccanti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleConflictResolverV29Report.totals.blocking}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleConflictResolverV29Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Info</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleConflictResolverV29Report.totals.info}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pack sicuri</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleConflictResolverV29Report.totals.safePacks}</p>
            </div>
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-rose-200">Da rivedere</p>
              <p className="mt-1 text-2xl font-black text-rose-100">{dynamicRuleConflictResolverV29Report.totals.packsToReview}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Conflitti rilevati</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleConflictResolverV29Report.conflicts.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-100">
                    Nessun conflitto rilevato: i Rule Pack possono essere attivati secondo la priorità configurata.
                  </div>
                ) : dynamicRuleConflictResolverV29Report.conflicts.map((conflict) => (
                  <div key={conflict.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{conflict.conflictType.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs text-slate-500">{conflict.packId} · {conflict.ruleId}</p>
                      </div>
                      <span className={
                        conflict.severity === "error"
                          ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                          : conflict.severity === "warning"
                            ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-100"
                      }>
                        {conflict.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{conflict.detected}</p>
                    <p className="mt-2 text-sm text-slate-400">Risoluzione: <span className="text-slate-200">{conflict.resolution}</span></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Decisione attivazione</p>
                <p className="mt-2 text-sm text-slate-300">
                  Attivazione pack: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.canActivateRulePacks ? "CONSENTITA" : "BLOCCATA"}</span>
                </p>
                <p className="mt-2 text-sm text-slate-300">Bloccanti: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.blockingConflicts}</span></p>
                <p className="mt-1 text-sm text-slate-300">Warning: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.warningConflicts}</span></p>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Rollback sicuro</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleConflictResolverV29Report.rollbackPlan.map((item, index) => (
                    <li key={`dynamic-rule-conflict-v2-9-rollback-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Prossime azioni V2.9</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleConflictResolverV29Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-conflict-v2-9-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061b16]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Layout / Room Intelligence V3.0</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Intelligence Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prima fase basata sulla descrizione guidata del cliente. Foto e DWG/DXF restano predisposti come prove future per confermare o correggere il profilo parete.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceEngineV30Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceEngineV30Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceEngineV30Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceEngineV30Report}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta Wall Intelligence V3.0
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceEngineV30Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Sconosciute</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceEngineV30Report.totals.unknownWalls}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Elementi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallIntelligenceEngineV30Report.totals.targets}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceEngineV30Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceEngineV30Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceEngineV30Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Profili parete da descrizione cliente</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceEngineV30Report.wallProfiles.map((wall) => (
                  <div key={wall.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{wall.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{wall.wallType} · fonte: {wall.inputSource.replace(/_/g, " ")} · confidenza: {wall.confidence}</p>
                      </div>
                      <span className={
                        wall.wallType === "unknown"
                          ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                          : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {wall.acceptedForPreliminaryLayout ? "Layout preliminare" : "Bloccata"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{wall.customerDescription}</p>
                    <p className="mt-2 text-xs text-slate-500">Spessore: {wall.thicknessMm ? `${wall.thicknessMm} mm` : "da definire"} · Carico stimato: {wall.estimatedMaxLoadKg ? `${wall.estimatedMaxLoadKg} kg` : "da verificare"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Strategia V3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceEngineV30Report.strategy.mergePolicy.map((item, index) => (
                    <li key={`wall-intelligence-v3-merge-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Fissaggi e ferramenta suggerita</p>
                <div className="mt-3 grid gap-3">
                  {wallIntelligenceEngineV30Report.fixingTargets.map((target) => (
                    <div key={target.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{target.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{target.category.replace(/_/g, " ")} · {target.estimatedWeightKg} kg · fissaggi min. {target.minimumRecommendedFixingPoints}</p>
                        </div>
                        <span className={
                          target.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : target.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {target.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{target.warning}</p>
                      <p className="mt-2 text-xs text-slate-500">Hardware: {target.suggestedHardware.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Prossime azioni V3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceEngineV30Report.nextActions.map((item, index) => (
                    <li key={`wall-intelligence-v3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>




        <section className="rounded-[28px] border border-lime-400/15 bg-[#101b06]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">Layout / Room Intelligence V3.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Guided Wall Description</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Struttura la descrizione cliente della parete in una scheda guidata: tipo parete, spessore, carico, ostacoli e prove future foto/DWG.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceGuidedDescriptionV31Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceGuidedDescriptionV31Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceGuidedDescriptionV31Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceGuidedDescriptionV31Report}
                className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20"
              >
                Esporta Wall Description V3.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Schede</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceGuidedDescriptionV31Report.totals.cards}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Complete</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceGuidedDescriptionV31Report.totals.completed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Incomplete</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceGuidedDescriptionV31Report.totals.incomplete}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Domande</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallIntelligenceGuidedDescriptionV31Report.totals.questions}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceGuidedDescriptionV31Report.totals.missingRequired}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceGuidedDescriptionV31Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Schede parete cliente</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceGuidedDescriptionV31Report.clientWallCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{card.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.wallType} · confidenza {card.confidence} · completamento {card.completionPercent}%</p>
                      </div>
                      <span className={
                        card.validatorDecision === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : card.validatorDecision === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {card.validatorDecision}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{card.note}</p>
                    {card.missingRequiredFields.length > 0 && (
                      <p className="mt-2 text-xs text-yellow-100">Campi richiesti mancanti: {card.missingRequiredFields.join(" · ")}</p>
                    )}
                    <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                      {card.guidedQuestions.map((question) => (
                        <div key={question.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="font-black text-white">{question.label}</p>
                          <p className="mt-1">Default: {question.defaultValue}</p>
                          <p className="mt-1 text-lime-100">{question.status.replace(/_/g, " ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-lime-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Principio V3.1</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Descrizione cliente come fonte primaria iniziale</li>
                  <li>• Foto e DWG/DXF come prove successive</li>
                  <li>• Parete sconosciuta ammessa solo per layout preliminare</li>
                  <li>• Fissaggi critici sempre soggetti a verifica installatore</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-lime-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Prossime azioni V3.1</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceGuidedDescriptionV31Report.nextActions.map((item, index) => (
                    <li key={`wall-guided-description-v3-1-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#1d1405]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V3.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Confidence Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Calcola quanto è affidabile la descrizione cliente della parete e decide se servono verifiche prima di fissaggi, mensole, specchi o pensili.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceConfidenceEngineV32Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceConfidenceEngineV32Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceConfidenceEngineV32Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceConfidenceEngineV32Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Confidence V3.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Schede</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceConfidenceEngineV32Report.totals.cards}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Alta</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceConfidenceEngineV32Report.totals.high}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Media</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceConfidenceEngineV32Report.totals.medium}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bassa</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceConfidenceEngineV32Report.totals.low}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Verifiche</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceConfidenceEngineV32Report.totals.needsVerification}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceConfidenceEngineV32Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceConfidenceEngineV32Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Confidenza pareti</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceConfidenceEngineV32Report.confidenceCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{card.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.wallType} · score {card.confidenceScore}% · confidenza {card.confidenceLevel}</p>
                      </div>
                      <span className={
                        card.confidenceLevel === "alta"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : card.confidenceLevel === "media"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {card.confidenceLevel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{card.verificationReason}</p>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                      <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3 text-emerald-100">
                        <p className="font-black uppercase tracking-[0.12em]">Segnali positivi</p>
                        <p className="mt-1 text-slate-300">{card.positiveSignals.length ? card.positiveSignals.join(" · ") : "Nessun segnale forte"}</p>
                      </div>
                      <div className="rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Mancanze</p>
                        <p className="mt-1 text-slate-300">{card.missingSignals.length ? card.missingSignals.join(" · ") : "Nessuna mancanza critica"}</p>
                      </div>
                    </div>
                    {card.alerts.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {card.alerts.map((alert) => (
                          <div key={alert.id} className={
                            alert.severity === "error"
                              ? "rounded-xl border border-red-400/10 bg-red-400/5 p-3 text-xs text-red-100"
                              : alert.severity === "warning"
                                ? "rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100"
                                : "rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3 text-xs text-cyan-100"
                          }>
                            <p className="font-black">{alert.label}</p>
                            <p className="mt-1 text-slate-300">{alert.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Soglie V3.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• 0–40%: confidenza bassa</li>
                  <li>• 41–70%: confidenza media</li>
                  <li>• 71–100%: confidenza alta</li>
                  <li>• Foto/DWG/note aumentano la confidenza senza sostituire la descrizione cliente</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V3.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceConfidenceEngineV32Report.nextActions.map((item, index) => (
                    <li key={`wall-confidence-v3-2-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-rose-400/15 bg-[#210914]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Layout / Room Intelligence V3.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Load Analyzer</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Analizza carichi, peso stimato, punti fissaggio e capacità parete prima di confermare specchi, mensole e pensili.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceLoadAnalyzerV33Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceLoadAnalyzerV33Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceLoadAnalyzerV33Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceLoadAnalyzerV33Report}
                className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
              >
                Esporta Load Analyzer V3.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Target</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceLoadAnalyzerV33Report.totals.targets}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Safe</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceLoadAnalyzerV33Report.totals.safe}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceLoadAnalyzerV33Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critical</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceLoadAnalyzerV33Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceLoadAnalyzerV33Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceLoadAnalyzerV33Report.totals.warnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Analisi carichi parete</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceLoadAnalyzerV33Report.loadTargets.slice(0, 9).map((target) => (
                  <div key={target.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{target.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {target.category} · peso {target.estimatedWeightKg} kg · proiezione {target.projectedLoadKg} kg · {target.fixingPoints} fissaggi
                        </p>
                      </div>
                      <span className={
                        target.risk === "safe"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : target.risk === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {target.risk}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Carico/fissaggio</p>
                        <p className="mt-1">{target.loadPerFixingKg} kg</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Capacità parete</p>
                        <p className="mt-1">{target.wallCapacityKg === null ? "sconosciuta" : `${target.wallCapacityKg} kg`}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Confidenza</p>
                        <p className="mt-1">{target.confidenceScore}%</p>
                      </div>
                    </div>
                    {target.warnings.length > 0 && (
                      <div className="mt-3 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Warning</p>
                        <p className="mt-1 text-slate-300">{target.warnings.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Principi V3.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• La descrizione cliente resta la fonte primaria iniziale</li>
                  <li>• Il confidence score influenza il rischio carico</li>
                  <li>• Carichi critici richiedono verifica installatore</li>
                  <li>• Il sistema non certifica la sicurezza strutturale, ma blocca errori evidenti</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Prossime azioni V3.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceLoadAnalyzerV33Report.nextActions.map((item, index) => (
                    <li key={`wall-load-analyzer-v3-3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-orange-400/15 bg-[#211008]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Layout / Room Intelligence V3.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Fixing Recommendation Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Suggerisce ferramenta, strategia di fissaggio e verifica installatore incrociando parete, carico, punti fissaggio e confidence score.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceFixingRecommendationV34Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceFixingRecommendationV34Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceFixingRecommendationV34Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceFixingRecommendationV34Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta Fixing V3.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Raccomandazioni</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceFixingRecommendationV34Report.totals.recommendations}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Safe</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceFixingRecommendationV34Report.totals.safe}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceFixingRecommendationV34Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critical</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceFixingRecommendationV34Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Installatore</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceFixingRecommendationV34Report.totals.installerRequired}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Cartongesso</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{wallIntelligenceFixingRecommendationV34Report.totals.drywallWarnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Suggerimenti fissaggio</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceFixingRecommendationV34Report.recommendations.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Parete {item.wallType} · {item.recommendedFixingPoints} fissaggi consigliati · {item.loadPerFixingKg} kg/fissaggio
                        </p>
                      </div>
                      <span className={
                        item.status === "safe"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "warning"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl border border-orange-400/10 bg-orange-400/5 p-3 text-xs text-orange-50">
                      <p className="font-black uppercase tracking-[0.12em]">Ferramenta suggerita</p>
                      <p className="mt-1 text-slate-300">{item.suggestedHardware.join(" · ")}</p>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">{item.fixingStrategy}</p>

                    {item.warnings.length > 0 && (
                      <div className="mt-3 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Warning</p>
                        <p className="mt-1 text-slate-300">{item.warnings.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Principi V3.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• La descrizione cliente resta la base iniziale</li>
                  <li>• Il tipo parete condiziona la ferramenta suggerita</li>
                  <li>• Cartongesso e pareti sconosciute richiedono verifica</li>
                  <li>• Il suggerimento è preliminare, non certificazione strutturale</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Prossime azioni V3.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceFixingRecommendationV34Report.nextActions.map((item, index) => (
                    <li key={`fixing-recommendation-v3-4-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17081f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V3.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Mirror & Shelf Validator</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valida specchi, mensole e pensili usando interassi postazioni, parete, carichi, fissaggi e livello di confidenza.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceMirrorShelfValidatorV35Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceMirrorShelfValidatorV35Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceMirrorShelfValidatorV35Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceMirrorShelfValidatorV35Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Validator V3.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Elementi</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceMirrorShelfValidatorV35Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Specchi</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.mirrorItems}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Mensole</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.shelfItems}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Check KO</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.failedChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Validazione elementi sospesi</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceMirrorShelfValidatorV35Report.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.mountingClass} · parete {item.wallType} · {item.recommendedFixingPoints} fissaggi · confidence {item.confidenceScore}%
                        </p>
                      </div>
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                      {item.checks.slice(0, 4).map((check) => (
                        <div key={`${item.id}-${check.code}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                          <p className="font-black text-white">{check.label}</p>
                          <p className={check.passed ? "mt-1 text-emerald-200" : check.severity === "error" ? "mt-1 text-red-200" : "mt-1 text-yellow-200"}>
                            {check.passed ? "OK" : "DA VERIFICARE"}
                          </p>
                          <p className="mt-1 text-slate-500">{check.message}</p>
                        </div>
                      ))}
                    </div>

                    {item.installationNotes.length > 0 && (
                      <div className="mt-3 rounded-xl border border-fuchsia-400/10 bg-fuchsia-400/5 p-3 text-xs text-fuchsia-100">
                        <p className="font-black uppercase tracking-[0.12em]">Note installazione</p>
                        <p className="mt-1 text-slate-300">{item.installationNotes.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Regole V3.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Gli specchi seguono l’interasse della postazione collegata</li>
                  <li>• Barber: interasse minimo 150 cm</li>
                  <li>• Estetista: interasse minimo 120 cm</li>
                  <li>• Mensole e pensili richiedono controllo carico, profondità e parete</li>
                  <li>• Cartongesso/sconosciuto attivano verifica installatore</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V3.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceMirrorShelfValidatorV35Report.nextActions.map((item, index) => (
                    <li key={`mirror-shelf-validator-v3-5-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V3.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Wall Report</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Report tecnico parete per installatore: descrizione cliente, confidence, carichi, fissaggi, specchi, mensole, pensili e output PDF/DXF/CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallTechnicalReportV36Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallTechnicalReportV36Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallTechnicalReportV36Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallTechnicalReportV36Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Report V3.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sezioni</p>
              <p className="mt-1 text-2xl font-black text-white">{wallTechnicalReportV36Report.totals.sections}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallTechnicalReportV36Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallTechnicalReportV36Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalReportV36Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Layer export</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallTechnicalReportV36Report.totals.exportLayers}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Checklist</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{wallTechnicalReportV36Report.totals.installerNotes}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Sezioni report parete</p>
              <div className="mt-3 grid gap-3">
                {wallTechnicalReportV36Report.sections.map((section) => (
                  <div key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Layer {section.exportLayer.toUpperCase()} · {section.summary}</p>
                      </div>
                      <span className={
                        section.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : section.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {section.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {section.items.map((item, index) => (
                        <li key={`${section.id}-item-${index}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Checklist installatore</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.installerChecklist.map((item, index) => (
                    <li key={`wall-report-v3-6-check-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.exportTargets.map((item, index) => (
                    <li key={`wall-report-v3-6-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossime azioni V3.6</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.nextActions.map((item, index) => (
                    <li key={`wall-report-v3-6-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-red-400/15 bg-[#21070b]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-200">Layout / Room Intelligence V3.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Installation Risk Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valuta rischio reale di installazione usando confidence parete, carichi, fissaggi, validator specchi/mensole/pensili e report tecnico parete.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                installationRiskEngineV37Report.installRiskLevel === "LOW"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : installationRiskEngineV37Report.installRiskLevel === "MEDIUM"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : installationRiskEngineV37Report.installRiskLevel === "HIGH"
                      ? "rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-100"
                      : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {installationRiskEngineV37Report.installRiskLevel} · {installationRiskEngineV37Report.status}
              </span>

              <button
                type="button"
                onClick={downloadInstallationRiskEngineV37Report}
                className="rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/20"
              >
                Esporta Risk V3.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Risk score</p>
              <p className="mt-1 text-2xl font-black text-white">{installationRiskEngineV37Report.riskScore}/100</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installationRiskEngineV37Report.installBlocked ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Installatore</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{installationRiskEngineV37Report.installerRequired ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Sopralluogo</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{installationRiskEngineV37Report.siteSurveyRequired ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fattori</p>
              <p className="mt-1 text-2xl font-black text-white">{installationRiskEngineV37Report.totals.factors}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installationRiskEngineV37Report.totals.critical}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Fattori di rischio installazione</p>
              <div className="mt-3 grid gap-3">
                {installationRiskEngineV37Report.factors.map((factor) => (
                  <div key={factor.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{factor.label}</p>
                        <p className="mt-1 text-xs text-slate-400">Impatto {factor.impact} · {factor.reason}</p>
                      </div>
                      <span className={
                        factor.level === "LOW"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : factor.level === "MEDIUM"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : factor.level === "HIGH"
                              ? "rounded-full bg-orange-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-100"
                              : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {factor.level}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {factor.recommendedAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Azioni consigliate</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.recommendedActions.map((item, index) => (
                    <li key={`risk-v3-7-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Checklist installazione</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.installerChecklist.map((item, index) => (
                    <li key={`risk-v3-7-check-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Prossime azioni V3.7</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.nextActions.map((item, index) => (
                    <li key={`risk-v3-7-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#221407]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V3.8</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Installer Checklist Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Trasforma il rischio installazione e il report tecnico parete in una checklist operativa per installatore, PDF, DXF e CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                installerChecklistEngineV38Report.checklistStatus === "INSTALL_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : installerChecklistEngineV38Report.checklistStatus === "INSTALL_REVIEW_REQUIRED"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {installerChecklistEngineV38Report.checklistStatus}
              </span>

              <button
                type="button"
                onClick={downloadInstallerChecklistEngineV38Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Checklist V3.8
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Voci</p>
              <p className="mt-1 text-2xl font-black text-white">{installerChecklistEngineV38Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bloccate</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installerChecklistEngineV38Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{installerChecklistEngineV38Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pronte</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{installerChecklistEngineV38Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Obbligatorie</p>
              <p className="mt-1 text-2xl font-black text-white">{installerChecklistEngineV38Report.totals.mandatory}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Evidenze</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{installerChecklistEngineV38Report.totals.evidenceRequired}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Checklist operativa installatore</p>
              <div className="mt-3 grid gap-3">
                {installerChecklistEngineV38Report.items.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.phase} · {item.reason}</p>
                      </div>
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status} · {item.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Output: {item.outputTarget} · Evidenza richiesta: {item.evidenceRequired ? "SI" : "NO"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Sezioni stampabili</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.printableSections.map((item, index) => (
                    <li key={`installer-v3-8-print-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.exportTargets.map((item, index) => (
                    <li key={`installer-v3-8-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V3.8</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.nextActions.map((item, index) => (
                    <li key={`installer-v3-8-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#140722]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V3.9</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Approval Workflow</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Chiude il ciclo tecnico parete: rischio, checklist, report installatore e stato finale approvato/non approvato per installazione.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalApprovalWorkflowV39Report.approvalStatus === "APPROVED"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalApprovalWorkflowV39Report.approvalStatus === "REVIEW_REQUIRED"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : technicalApprovalWorkflowV39Report.approvalStatus === "REJECTED"
                      ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200"
              }>
                {technicalApprovalWorkflowV39Report.approvalStatus}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalApprovalWorkflowV39Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Approval V3.9
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Gate</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalApprovalWorkflowV39Report.totals.gates}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalApprovalWorkflowV39Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalApprovalWorkflowV39Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalApprovalWorkflowV39Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Installazione</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{technicalApprovalWorkflowV39Report.installAllowed ? "OK" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sopralluogo</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalApprovalWorkflowV39Report.siteSurveyRequired ? "SI" : "NO"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Gate approvazione tecnica</p>
              <div className="mt-3 grid gap-3">
                {technicalApprovalWorkflowV39Report.gates.map((gate) => (
                  <div key={gate.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{gate.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{gate.source} · {gate.reason}</p>
                      </div>
                      <span className={
                        gate.gate === "pass"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : gate.gate === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {gate.gate}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {gate.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.requiredActions.map((item, index) => (
                    <li key={`approval-v3-9-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.workflowSteps.map((item, index) => (
                    <li key={`approval-v3-9-step-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.exportTargets.map((item, index) => (
                    <li key={`approval-v3-9-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.0</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Photo / DWG Assisted Recognition Framework</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il passaggio alle prove reali: descrizione cliente come fonte primaria, foto/DWG/DXF come conferma, correzione o review tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallAssistedRecognitionV40Report.recognitionStatus === "ASSISTED_RECOGNITION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallAssistedRecognitionV40Report.recognitionStatus === "ASSISTED_RECOGNITION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallAssistedRecognitionV40Report.recognitionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallAssistedRecognitionV40Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Recognition V4.0
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Evidenze</p>
              <p className="mt-1 text-2xl font-black text-white">{wallAssistedRecognitionV40Report.totals.evidences}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Cliente</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallAssistedRecognitionV40Report.totals.customerInputs}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Foto</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{wallAssistedRecognitionV40Report.totals.photoSlots}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">DWG/DXF</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">{wallAssistedRecognitionV40Report.totals.dwgDxfSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Accepted</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallAssistedRecognitionV40Report.totals.accepted}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallAssistedRecognitionV40Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Conflitti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallAssistedRecognitionV40Report.totals.conflicts}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Evidenze parete V4.0</p>
              <div className="mt-3 grid gap-3">
                {wallAssistedRecognitionV40Report.evidences.slice(0, 8).map((evidence) => (
                  <div key={evidence.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{evidence.label}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Fonte {evidence.source} · dichiarato {evidence.declaredWallType} · rilevato {evidence.detectedWallType || "non disponibile"}
                        </p>
                      </div>
                      <span className={
                        evidence.status === "accepted"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : evidence.status === "conflict"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : evidence.status === "review"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                      }>
                        {evidence.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {evidence.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Fusion confidence</p>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.confidenceFusion.map((item) => (
                    <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{item.wallLabel}</span>
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">{item.fusedScore}% · {item.fusedLevel}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Cliente {item.customerScore}% · Evidenze {item.evidenceScore}% · {item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.requiredActions.map((item, index) => (
                    <li key={`recognition-v4-0-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.nextActions.map((item, index) => (
                    <li key={`recognition-v4-0-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071827]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Layout / Room Intelligence V4.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Photo Evidence Intake</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Registra le foto parete come evidenze guidate: la descrizione cliente resta primaria, mentre la foto conferma, integra o apre una review tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallPhotoEvidenceV41Report.intakeStatus === "PHOTO_INTAKE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallPhotoEvidenceV41Report.intakeStatus === "PHOTO_INTAKE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallPhotoEvidenceV41Report.intakeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallPhotoEvidenceV41Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Photo Evidence V4.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Slot foto</p>
              <p className="mt-1 text-2xl font-black text-white">{wallPhotoEvidenceV41Report.totals.photoSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallPhotoEvidenceV41Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallPhotoEvidenceV41Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallPhotoEvidenceV41Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Boost potenziale</p>
              <p className="mt-1 text-2xl font-black text-sky-100">+{wallPhotoEvidenceV41Report.totals.potentialConfidenceBoost}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Checklist foto parete</p>
              <div className="mt-3 grid gap-3">
                {wallPhotoEvidenceV41Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">Tipo atteso {item.expectedWallType} · qualità {item.quality} · impatto confidence +{item.confidenceImpact}</p>
                      </div>
                      <span className={
                        item.status === "PHOTO_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "PHOTO_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "PHOTO_REVIEW"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                      }>
                        {item.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.requiredShots.slice(0, 3).map((shot, index) => (
                        <li key={`${item.id}-shot-${index}`}>• {shot}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Policy foto</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Descrizione cliente primaria: {wallPhotoEvidenceV41Report.photoPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Foto può confermare: {wallPhotoEvidenceV41Report.photoPolicy.photoCanConfirm ? "sì" : "no"}</li>
                  <li>• Foto può aprire review: {wallPhotoEvidenceV41Report.photoPolicy.photoCanOpenReview ? "sì" : "no"}</li>
                  <li>• Foto non approva criticità da sola: {wallPhotoEvidenceV41Report.photoPolicy.photoCannotAutoApproveCriticalInstall ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallPhotoEvidenceV41Report.requiredActions.map((item, index) => (
                    <li key={`photo-v4-1-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallPhotoEvidenceV41Report.nextActions.map((item, index) => (
                    <li key={`photo-v4-1-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-indigo-400/15 bg-[#081426]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200">Layout / Room Intelligence V4.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">DWG / DXF Evidence Intake</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Registra elaborati tecnici DWG/DXF/PDF come evidenze di conferma: quote, aperture, layer tecnici e vincoli restano collegati alla descrizione cliente e alle foto V4.1.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallDwgDxfEvidenceV42Report.intakeStatus === "DWG_DXF_INTAKE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallDwgDxfEvidenceV42Report.intakeStatus === "DWG_DXF_INTAKE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallDwgDxfEvidenceV42Report.intakeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallDwgDxfEvidenceV42Report}
                className="rounded-2xl border border-indigo-400/25 bg-indigo-400/10 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-400/20"
              >
                Esporta DWG/DXF Evidence V4.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Slot elaborati</p>
              <p className="mt-1 text-2xl font-black text-white">{wallDwgDxfEvidenceV42Report.totals.drawingSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallDwgDxfEvidenceV42Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallDwgDxfEvidenceV42Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallDwgDxfEvidenceV42Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">Boost potenziale</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">+{wallDwgDxfEvidenceV42Report.totals.potentialConfidenceBoost}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Layer e controlli elaborati</p>
              <div className="mt-3 grid gap-3">
                {wallDwgDxfEvidenceV42Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">Fonte {item.source.toUpperCase()} · qualità {item.quality} · impatto confidence +{item.confidenceImpact}</p>
                      </div>
                      <span className={
                        item.status === "DWG_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "DWG_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "DWG_REVIEW"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-indigo-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100"
                      }>
                        {item.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.technicalLayers.slice(0, 4).map((layer, index) => (
                        <li key={`${item.id}-layer-${index}`}>• {layer}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Policy DWG/DXF</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente resta fonte primaria: {wallDwgDxfEvidenceV42Report.drawingPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• DWG/DXF conferma geometrie: {wallDwgDxfEvidenceV42Report.drawingPolicy.dwgDxfCanConfirmGeometry ? "sì" : "no"}</li>
                  <li>• Può aprire review: {wallDwgDxfEvidenceV42Report.drawingPolicy.dwgDxfCanOpenReview ? "sì" : "no"}</li>
                  <li>• Cross-check con foto: {wallDwgDxfEvidenceV42Report.drawingPolicy.photoAndDwgCanBeCrossChecked ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallDwgDxfEvidenceV42Report.requiredActions.map((item, index) => (
                    <li key={`dwg-v4-2-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallDwgDxfEvidenceV42Report.nextActions.map((item, index) => (
                    <li key={`dwg-v4-2-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>




        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#14081f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V4.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Evidence Fusion Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Fonde descrizione cliente, foto, DWG/DXF e approvazione tecnica. La descrizione cliente resta primaria; le evidenze possono aumentare confidence o aprire review/blocco.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallEvidenceFusionV43Report.fusionStatus === "FUSION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallEvidenceFusionV43Report.fusionStatus === "FUSION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallEvidenceFusionV43Report.fusionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallEvidenceFusionV43Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Evidence Fusion V4.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{wallEvidenceFusionV43Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallEvidenceFusionV43Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallEvidenceFusionV43Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallEvidenceFusionV43Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Conflicts</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{wallEvidenceFusionV43Report.totals.conflicts}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Confidence media</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallEvidenceFusionV43Report.totals.averageFusedConfidence}%</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Fusione evidenze per parete</p>
              <div className="mt-3 grid gap-3">
                {wallEvidenceFusionV43Report.items.slice(0, 6).map((item) => (
                  <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Parete {item.declaredWallType} · confidence fusa {item.fusedConfidence}% · livello {item.confidenceLevel}
                        </p>
                      </div>
                      <span className={
                        item.status === "FUSION_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "FUSION_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {item.sourceScores.map((source) => (
                        <div key={`${item.wallId}-${source.source}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{source.source.replace(/_/g, " ")}</p>
                          <p className="mt-1 text-lg font-black text-white">{source.score}%</p>
                          <p className="text-[10px] text-slate-500">peso {Math.round(source.weight * 100)}%</p>
                        </div>
                      ))}
                    </div>

                    {item.conflicts.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-yellow-100">
                        {item.conflicts.map((conflict) => (
                          <li key={conflict.id}>• {conflict.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Policy V4.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente fonte primaria: {wallEvidenceFusionV43Report.fusionPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Evidenze aumentano confidence: {wallEvidenceFusionV43Report.fusionPolicy.evidenceCanIncreaseConfidence ? "sì" : "no"}</li>
                  <li>• Conflitti forzano review: {wallEvidenceFusionV43Report.fusionPolicy.conflictsForceReview ? "sì" : "no"}</li>
                  <li>• Bridge render/AR da foto: {wallEvidenceFusionV43Report.fusionPolicy.photoEnvironmentReadyForRenderArBridge ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallEvidenceFusionV43Report.requiredActions.map((item, index) => (
                    <li key={`fusion-v4-3-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallEvidenceFusionV43Report.nextActions.map((item, index) => (
                    <li key={`fusion-v4-3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>



        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061825]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Automatic Wall Classification</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Classificazione assistita della parete basata su descrizione cliente, foto, DWG/DXF ed Evidence Fusion V4.3. Il cliente resta fonte primaria: i suggerimenti automatici aprono review, non sovrascrivono da soli.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                automaticWallClassificationV44Report.classificationStatus === "CLASSIFICATION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : automaticWallClassificationV44Report.classificationStatus === "CLASSIFICATION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {automaticWallClassificationV44Report.classificationStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadAutomaticWallClassificationV44Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Classification V4.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{automaticWallClassificationV44Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{automaticWallClassificationV44Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{automaticWallClassificationV44Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{automaticWallClassificationV44Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Suggerimenti diversi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{automaticWallClassificationV44Report.totals.changedSuggestions}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Confidence media</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{automaticWallClassificationV44Report.totals.averageConfidence}%</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Classificazione assistita per parete</p>
              <div className="mt-3 grid gap-3">
                {automaticWallClassificationV44Report.items.slice(0, 6).map((item) => (
                  <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          dichiarata {item.declaredWallType} · classificata {item.classifiedWallType} · confidence {item.finalConfidence}%
                        </p>
                      </div>
                      <span className={
                        item.status === "CLASSIFICATION_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "CLASSIFICATION_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {item.candidates.slice(0, 4).map((candidate, index) => (
                        <div key={`${item.wallId}-${candidate.source}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{candidate.source.replace(/_/g, " ")}</p>
                          <p className="mt-1 text-sm font-black text-white">{candidate.wallType}</p>
                          <p className="text-[10px] text-slate-500">confidence {candidate.confidence}%</p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.classificationNotes.map((note, index) => (
                        <li key={`${item.wallId}-classification-note-${index}`}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Policy V4.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente fonte primaria: {automaticWallClassificationV44Report.policy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Classificazione assistita: {automaticWallClassificationV44Report.policy.automaticClassificationIsAssistive ? "sì" : "no"}</li>
                  <li>• Conflitti forzano review: {automaticWallClassificationV44Report.policy.conflictsForceReview ? "sì" : "no"}</li>
                  <li>• Foto/DWG suggeriscono senza sovrascrivere: {automaticWallClassificationV44Report.policy.photoDwgCanSuggestButNotOverwrite ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {automaticWallClassificationV44Report.requiredActions.map((item, index) => (
                    <li key={`classification-v4-4-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {automaticWallClassificationV44Report.nextActions.map((item, index) => (
                    <li key={`classification-v4-4-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#120b22]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V4.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">AI Technical Suggestions</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Suggerimenti tecnici assistiti basati su classificazione parete, evidenze foto/DWG, fissaggi, checklist installatore e approvazione tecnica. Il motore suggerisce e blocca i casi critici, ma non approva automaticamente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                aiTechnicalSuggestionsV45Report.suggestionStatus === "SUGGESTIONS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : aiTechnicalSuggestionsV45Report.suggestionStatus === "SUGGESTIONS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {aiTechnicalSuggestionsV45Report.suggestionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadAiTechnicalSuggestionsV45Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Suggestions V4.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Suggerimenti</p>
              <p className="mt-1 text-2xl font-black text-white">{aiTechnicalSuggestionsV45Report.totals.suggestions}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{aiTechnicalSuggestionsV45Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{aiTechnicalSuggestionsV45Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Info</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{aiTechnicalSuggestionsV45Report.totals.info}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{aiTechnicalSuggestionsV45Report.totals.blockedWalls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Render/AR ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{aiTechnicalSuggestionsV45Report.totals.renderArReadyWalls}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Suggerimenti tecnici</p>
              <div className="mt-3 grid gap-3">
                {aiTechnicalSuggestionsV45Report.suggestions.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.wallLabel} · {item.category.replace(/_/g, " ")}</p>
                      </div>
                      <span className={
                        item.severity === "critical"
                          ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                          : item.severity === "warning"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                      }>
                        {item.severity}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">{item.reason}</p>
                    <p className="mt-2 text-sm font-semibold text-violet-100">Azione: {item.suggestedAction}</p>
                    <p className="mt-2 text-xs text-slate-500">Blocca approvazione: {item.blocksApproval ? "sì" : "no"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Policy V4.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Assistivo: {aiTechnicalSuggestionsV45Report.policy.assistiveOnly ? "sì" : "no"}</li>
                  <li>• Cliente fonte primaria: {aiTechnicalSuggestionsV45Report.policy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Nessuna approvazione automatica: {aiTechnicalSuggestionsV45Report.policy.noAutomaticApproval ? "sì" : "no"}</li>
                  <li>• Bridge render/AR foto: {aiTechnicalSuggestionsV45Report.policy.photoEnvironmentBridgeEnabled ? "attivo" : "non attivo"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Executive summary</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {aiTechnicalSuggestionsV45Report.executiveSummary.map((item, index) => (
                    <li key={`ai-v4-5-summary-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {aiTechnicalSuggestionsV45Report.nextActions.map((item, index) => (
                    <li key={`ai-v4-5-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#19091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V4.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Evidence Approval</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Trasforma i suggerimenti tecnici V4.5 in un gate di approvazione tracciabile: cosa è approvato, cosa richiede review e cosa blocca PDF finale, installazione o render/AR.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalEvidenceApprovalV46Report.approvalStatus === "EVIDENCE_APPROVED"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalEvidenceApprovalV46Report.approvalStatus === "EVIDENCE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalEvidenceApprovalV46Report.approvalStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalEvidenceApprovalV46Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Approval V4.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Elementi</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalEvidenceApprovalV46Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Approved</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalEvidenceApprovalV46Report.totals.approved}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalEvidenceApprovalV46Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalEvidenceApprovalV46Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Approval richiesti</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{technicalEvidenceApprovalV46Report.totals.approvalRequired}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Gate approvazione</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• PDF finale: {technicalEvidenceApprovalV46Report.approvalGate.canGenerateFinalPdf ? "consentito" : "bloccato"}</li>
                <li>• Installazione: {technicalEvidenceApprovalV46Report.approvalGate.canApproveInstallation ? "approvabile" : "non approvabile"}</li>
                <li>• Render/AR da foto: {technicalEvidenceApprovalV46Report.approvalGate.canProceedToRenderAr ? "consentito" : "in attesa"}</li>
              </ul>

              {technicalEvidenceApprovalV46Report.approvalGate.blockerReasons.length > 0 && (
                <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/5 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-200">Blocchi rilevati</p>
                  <ul className="mt-2 space-y-1 text-xs text-red-100">
                    {technicalEvidenceApprovalV46Report.approvalGate.blockerReasons.slice(0, 5).map((item, index) => (
                      <li key={`approval-v4-6-blocker-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Decisioni evidence</p>
              <div className="mt-3 grid gap-2">
                {technicalEvidenceApprovalV46Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-white">{item.wallLabel}</p>
                      <span className={
                        item.decision === "blocked"
                          ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                          : item.decision === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {item.decision}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{item.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061c24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Evidence-to-Render / AR Bridge</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega foto e approvazioni tecniche al futuro Photo Environment Intelligence: render del mobile nel locale cliente e preview AR senza confondere estetica e installabilità.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                evidenceToRenderArBridgeV47Report.bridgeStatus === "RENDER_AR_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : evidenceToRenderArBridgeV47Report.bridgeStatus === "RENDER_AR_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {evidenceToRenderArBridgeV47Report.bridgeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadEvidenceToRenderArBridgeV47Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Render/AR Bridge V4.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{evidenceToRenderArBridgeV47Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Render ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{evidenceToRenderArBridgeV47Report.totals.photoRenderReady}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">AR ready</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{evidenceToRenderArBridgeV47Report.totals.arPreviewReady}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{evidenceToRenderArBridgeV47Report.totals.reviewRequired}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{evidenceToRenderArBridgeV47Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Pipeline render foto</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {evidenceToRenderArBridgeV47Report.renderPipeline.map((item, index) => (
                  <li key={`render-pipeline-v4-7-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Pipeline AR</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {evidenceToRenderArBridgeV47Report.arPipeline.map((item, index) => (
                  <li key={`ar-pipeline-v4-7-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {evidenceToRenderArBridgeV47Report.items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-white">{item.wallLabel}</p>
                  <span className={
                    item.arPreviewReady
                      ? "rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                      : item.photoRenderReady
                        ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                        : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                  }>
                    {item.arPreviewReady ? "AR READY" : item.photoRenderReady ? "RENDER READY" : "REVIEW"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.recommendedAction}</p>
                {item.warnings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-yellow-100">
                    {item.warnings.map((warning, index) => (
                      <li key={`${item.id}-warning-${index}`}>• {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071422]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Layout Technical Sheet Generator V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Schede tecniche da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara le tavole tecniche da Layout Intelligence: piantina, battiscopa, pareti, fissaggi, punti tecnici, BOM e note montaggio.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutTechnicalSheetGeneratorV1Report.status === "SHEETS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutTechnicalSheetGeneratorV1Report.status === "SHEETS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutTechnicalSheetGeneratorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutTechnicalSheetGeneratorV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta schede tecniche layout
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sezioni</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutTechnicalSheetGeneratorV1Report.totals.sections}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutTechnicalSheetGeneratorV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutTechnicalSheetGeneratorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutTechnicalSheetGeneratorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Mobili collegati</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{layoutTechnicalSheetGeneratorV1Report.totals.furnitureItemsLinked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Scheda</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutTechnicalSheetGeneratorV1Report.sections.map((section) => (
                    <tr key={section.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{section.title}</p>
                        <p className="mt-1 text-slate-500">{section.output}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{section.source.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          section.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : section.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {section.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole generazione</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Tracciamento layout: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireLayoutTraceApproval ? "approvazione richiesta" : "non richiesto"}</p>
                  <p>Battiscopa: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireBaseboardData ? "dato obbligatorio" : "facoltativo"}</p>
                  <p>Supporto parete: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireWallSupportData ? "dato obbligatorio" : "facoltativo"}</p>
                  <p>Factory package: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireFactoryPackageNotBlocked ? "non deve essere bloccato" : "non vincolante"}</p>
                  <p>Warning montaggio: {layoutTechnicalSheetGeneratorV1Report.generationRules.includeMountingWarnings ? "inclusi" : "esclusi"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutTechnicalSheetGeneratorV1Report.recommendations.map((item, index) => (
                    <li key={`layout-technical-sheet-generator-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-indigo-400/15 bg-[#0b1022]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200">Layout DXF / CAD Export Prep V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Preparazione export CAD da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara layer, dati e controlli per esportare piantina, ingombri mobili, battiscopa, punti tecnici e note montaggio verso DXF/PDF.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutDxfCadExportPrepV1Report.status === "CAD_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutDxfCadExportPrepV1Report.status === "CAD_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutDxfCadExportPrepV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutDxfCadExportPrepV1Report}
                className="rounded-2xl border border-indigo-400/25 bg-indigo-400/10 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-400/20"
              >
                Esporta preparazione CAD
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Layer</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutDxfCadExportPrepV1Report.totals.layers}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutDxfCadExportPrepV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutDxfCadExportPrepV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutDxfCadExportPrepV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">DXF / PDF</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">{layoutDxfCadExportPrepV1Report.totals.dxfTargets}/{layoutDxfCadExportPrepV1Report.totals.pdfTargets}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Layer</th>
                    <th className="px-4 py-3">Output</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutDxfCadExportPrepV1Report.layers.map((layer) => (
                    <tr key={layer.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{layer.layerName}</p>
                        <p className="mt-1 text-slate-500">{layer.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{layer.outputTarget.replace(/_/g, " + ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          layer.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : layer.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {layer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Regole export</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Traccia layout: {layoutDxfCadExportPrepV1Report.exportRules.requireApprovedLayoutTrace ? "approvata richiesta" : "non richiesta"}</p>
                  <p>Scala ambiente: {layoutDxfCadExportPrepV1Report.exportRules.requireScaledRoomReference ? "obbligatoria" : "facoltativa"}</p>
                  <p>Layer muri/aperture: {layoutDxfCadExportPrepV1Report.exportRules.requireWallAndOpeningLayers ? "obbligatori" : "facoltativi"}</p>
                  <p>Layer mobili: {layoutDxfCadExportPrepV1Report.exportRules.requireFurnitureFootprintLayers ? "obbligatori" : "facoltativi"}</p>
                  <p>ID Product Package: {layoutDxfCadExportPrepV1Report.exportRules.preserveProductPackageIds ? "preservati" : "non preservati"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutDxfCadExportPrepV1Report.recommendations.map((item, index) => (
                    <li key={`layout-dxf-cad-export-prep-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061720]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Technical Wall Elevation Sheets V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prospetti parete tecnici</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara prospetti parete con mobili disegnati frontalmente, quote, punti elettrici, punti idraulici, carico acqua calda/fredda, scarico, prese nelle cassettiere e punti fissaggio.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalWallElevationSheetsV1Report.status === "ELEVATIONS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalWallElevationSheetsV1Report.status === "ELEVATIONS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalWallElevationSheetsV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalWallElevationSheetsV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta prospetti parete
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Layer</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalWallElevationSheetsV1Report.totals.layers}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalWallElevationSheetsV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalWallElevationSheetsV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalWallElevationSheetsV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">PDF/DXF</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{technicalWallElevationSheetsV1Report.totals.pdfLayers}/{technicalWallElevationSheetsV1Report.totals.dxfLayers}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Punti tecnici</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{technicalWallElevationSheetsV1Report.totals.technicalPointLayers}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Layer prospetto</th>
                    <th className="px-4 py-3">Colore</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {technicalWallElevationSheetsV1Report.layers.map((layer) => (
                    <tr key={layer.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{layer.label}</p>
                        <p className="mt-1 text-slate-500">{layer.note}</p>
                        <p className="mt-1 text-[11px] text-cyan-200">{layer.layerName}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{layer.colorHint}</td>
                      <td className="px-4 py-3">
                        <span className={
                          layer.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : layer.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {layer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Regole prospetti</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Mobili in prospetto: {technicalWallElevationSheetsV1Report.wallElevationRules.drawFurnitureFrontElevations ? "obbligatori" : "facoltativi"}</p>
                  <p>Acqua calda/fredda: {technicalWallElevationSheetsV1Report.wallElevationRules.requireHotColdWaterPoints ? "obbligatoria" : "facoltativa"}</p>
                  <p>Scarico: {technicalWallElevationSheetsV1Report.wallElevationRules.requireDrainPoints ? "obbligatorio" : "facoltativo"}</p>
                  <p>Prese cassettiere: {technicalWallElevationSheetsV1Report.wallElevationRules.requireDrawerIntegratedSockets ? "obbligatorie" : "facoltative"}</p>
                  <p>Colori/layer separati: {technicalWallElevationSheetsV1Report.wallElevationRules.requireColorSeparatedLayers ? "attivi" : "non attivi"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalWallElevationSheetsV1Report.recommendations.map((item, index) => (
                    <li key={`technical-wall-elevation-sheets-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#06111f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Wall Technical Points Validation V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Validazione punti tecnici parete</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla prospetti parete, quote lavandino, acqua calda/fredda, scarico, prese nelle cassettiere, fissaggi, battiscopa e qualità grafica della scheda tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallTechnicalPointsValidationV1Report.status === "TECHNICAL_POINTS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallTechnicalPointsValidationV1Report.status === "TECHNICAL_POINTS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallTechnicalPointsValidationV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallTechnicalPointsValidationV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta validazione punti
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{wallTechnicalPointsValidationV1Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallTechnicalPointsValidationV1Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallTechnicalPointsValidationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalPointsValidationV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallTechnicalPointsValidationV1Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalPointsValidationV1Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Atteso</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {wallTechnicalPointsValidationV1Report.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.note}</p>
                        <p className="mt-1 text-[11px] text-sky-200">{rule.kind} / {rule.severity}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{rule.expected}</p>
                        <p className="mt-1 text-slate-500">{rule.actual}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.status === "passed"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : rule.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole lavandino</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Lavandino da appoggio: piano a <span className="font-black text-white">{wallTechnicalPointsValidationV1Report.sinkRules.countertopSinkTopHeightMm} mm</span></p>
                  <p>Lavandino da incasso: piano a <span className="font-black text-white">{wallTechnicalPointsValidationV1Report.sinkRules.insetSinkTopHeightMm} mm</span></p>
                  <p>Propaga quote a idraulica: {wallTechnicalPointsValidationV1Report.sinkRules.propagateHeightToPlumbingPoints ? "sì" : "no"}</p>
                  <p>Propaga quote a prospetti: {wallTechnicalPointsValidationV1Report.sinkRules.propagateHeightToWallElevations ? "sì" : "no"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalPointsValidationV1Report.recommendations.map((item, index) => (
                    <li key={`wall-technical-points-validation-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-400/15 bg-[#13091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Technical Knowledge Base V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Knowledge Base tecnica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Centralizza le regole tecniche BagaStudio per lavabi, idraulica, elettrico, pareti, battiscopa, mensole e qualità delle schede tecniche.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalKnowledgeBaseV1Report.status === "KNOWLEDGE_BASE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalKnowledgeBaseV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalKnowledgeBaseV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Knowledge Base V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalKnowledgeBaseV1Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Idraulica</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{technicalKnowledgeBaseV1Report.totals.plumbing}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Elettrico</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalKnowledgeBaseV1Report.totals.electrical}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Pareti</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{technicalKnowledgeBaseV1Report.totals.wall}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalKnowledgeBaseV1Report.totals.errors}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{technicalKnowledgeBaseV1Report.totals.warnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Regola</th>
                    <th className="px-4 py-3">Atteso</th>
                    <th className="px-4 py-3">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {technicalKnowledgeBaseV1Report.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.note}</p>
                        <p className="mt-1 text-[11px] text-violet-200">{rule.validationTarget}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{rule.expected}</p>
                        {typeof rule.valueMm === "number" && (
                          <p className="mt-1 text-[11px] font-black text-white">{rule.valueMm} mm</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.severity === "error"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : rule.severity === "warning"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                        }>
                          {rule.category} / {rule.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Quote lavabi</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Lavandino da appoggio: <span className="font-black text-white">{technicalKnowledgeBaseV1Report.sinkHeights.countertopSinkTopHeightMm} mm</span></p>
                  <p>Lavandino da incasso: <span className="font-black text-white">{technicalKnowledgeBaseV1Report.sinkHeights.insetSinkTopHeightMm} mm</span></p>
                  <p className="text-slate-500">Le quote alimentano prospetti parete, idraulica, scarico, PDF/DXF/CAD e validazioni tecniche.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalKnowledgeBaseV1Report.recommendations.map((item, index) => (
                    <li key={`technical-knowledge-base-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#071821]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Smart Technical Validator V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Validatore tecnico intelligente</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Usa la Knowledge Base tecnica per trasformare regole, quote e punti tecnici in controlli automatici prima di PDF, DXF e CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                smartTechnicalValidatorV1Report.status === "TECHNICAL_VALIDATION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : smartTechnicalValidatorV1Report.status === "TECHNICAL_VALIDATION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {smartTechnicalValidatorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadSmartTechnicalValidatorV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Smart Validator V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Controlli</p>
              <p className="mt-1 text-2xl font-black text-white">{smartTechnicalValidatorV1Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{smartTechnicalValidatorV1Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{smartTechnicalValidatorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{smartTechnicalValidatorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Appoggio</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{smartTechnicalValidatorV1Report.sinkHeights.countertopSinkTopHeightMm} mm</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Incasso</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{smartTechnicalValidatorV1Report.sinkHeights.insetSinkTopHeightMm} mm</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Rilevato</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {smartTechnicalValidatorV1Report.issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{issue.label}</p>
                        <p className="mt-1 text-slate-500">{issue.expected}</p>
                        <p className="mt-1 text-[11px] text-cyan-200">{issue.category} / {issue.sourceRuleId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{issue.detected}</p>
                        <p className="mt-1 text-slate-500">{issue.recommendation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          issue.status === "passed"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : issue.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {issue.status} / {issue.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Fonti collegate</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Knowledge Base: <span className="font-black text-white">{smartTechnicalValidatorV1Report.sourceKnowledgeBaseStatus.replace(/_/g, " ")}</span></p>
                  <p>Wall Validation: <span className="font-black text-white">{smartTechnicalValidatorV1Report.sourceWallValidationStatus.replace(/_/g, " ")}</span></p>
                  <p className="text-slate-500">Il validatore è il gate tecnico prima della scheda esecutiva finale.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {smartTechnicalValidatorV1Report.recommendations.map((item, index) => (
                    <li key={`smart-technical-validator-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-400/15 bg-[#071a13]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Hardware Analyzer V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Thickness Compatibility Check</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Primo validatore produttivo: verifica se gli spessori rigenerati sono compatibili con le regole produttive prima delle validazioni ferramenta/forature.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareAnalyzerV2ThicknessReport.productionStatus === "PRODUCTION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {hardwareAnalyzerV2ThicknessReport.productionStatus === "PRODUCTION_READY"
                  ? "Production Ready"
                  : "Production Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadHardwareAnalyzerV2ThicknessReport}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta analyzer
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareAnalyzerV2ThicknessReport.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Compatibili</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareAnalyzerV2ThicknessReport.totals.compatible}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Incompatibili</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareAnalyzerV2ThicknessReport.totals.incompatible}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Saltati</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareAnalyzerV2ThicknessReport.totals.skipped}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{hardwareAnalyzerV2ThicknessReport.totals.missing}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Originale</span>
              <span>Target</span>
              <span>Stato</span>
            </div>

            {hardwareAnalyzerV2ThicknessReport.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Hardware Analyzer V2.</div>
            ) : (
              hardwareAnalyzerV2ThicknessReport.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.originalThickness ?? "n/d"} mm</span>
                  <span className="font-semibold text-slate-200">{item.targetThickness ?? "n/d"} mm</span>
                  <span className={
                    item.status === "compatible"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "skipped"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-purple-400/15 bg-[#12071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">Constraint Inspector V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo ruoli produttivi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica preliminare dei ruoli componente prima del Constraint Validation: fianco, schiena, ripiano, anta, cielo, fondo e zoccolo.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadConstraintInspectorV1Report}
              className="rounded-2xl border border-purple-400/25 bg-purple-400/10 px-5 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-400/20"
            >
              Esporta constraint
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintInspectorV1Report.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con ruolo</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintInspectorV1Report.totals.withRole}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Senza ruolo</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintInspectorV1Report.totals.withoutRole}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <div className="grid grid-cols-[1.3fr_0.8fr_0.6fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                <span>Componente</span>
                <span>Ruolo</span>
                <span>Stato</span>
              </div>

              {constraintInspectorV1Report.items.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Constraint Inspector.</div>
              ) : (
                constraintInspectorV1Report.items.map((item) => (
                  <div key={item.componentId} className="grid grid-cols-[1.3fr_0.8fr_0.6fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                    <div>
                      <p className="font-black text-white">{item.displayName}</p>
                      <p className="mt-1 text-slate-500">Sorgente: {item.source}</p>
                    </div>
                    <span className="font-semibold text-slate-200">{item.role || "-"}</span>
                    <span className={
                      item.status === "present"
                        ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                        : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                    }>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-black text-white">Ruoli rilevati</p>
              <div className="mt-3 space-y-2">
                {Object.entries(constraintInspectorV1Report.roles).length === 0 ? (
                  <p className="text-xs text-slate-500">Nessun ruolo rilevato.</p>
                ) : (
                  Object.entries(constraintInspectorV1Report.roles).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                      <span className="text-slate-300">{role}</span>
                      <span className="font-black text-purple-100">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Hardware Analyzer V2.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Constraint Validation</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valida i ruoli produttivi rilevati dal Constraint Inspector: presenza ruolo e conformità ai valori ammessi.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                constraintValidationV21Report.validationStatus === "CONSTRAINT_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {constraintValidationV21Report.validationStatus === "CONSTRAINT_READY"
                  ? "Constraint Ready"
                  : "Constraint Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadConstraintValidationV21Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta validation
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintValidationV21Report.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Validi</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintValidationV21Report.totals.valid}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintValidationV21Report.totals.missing}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Invalidi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{constraintValidationV21Report.totals.invalid}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.3fr_0.7fr_0.6fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ruolo</span>
              <span>Stato</span>
            </div>

            {constraintValidationV21Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Constraint Validation.</div>
            ) : (
              constraintValidationV21Report.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.3fr_0.7fr_0.6fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.role || "-"}</span>
                  <span className={
                    item.status === "valid"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "missing"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#07131a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Hardware Analyzer V2.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Drilling Inspector V1</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica preliminare delle forature importate da CIX/CSV/modello prima di costruire il Drilling Validation.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                drillingInspectorV1Report.readiness === "DRILLING_DATA_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {drillingInspectorV1Report.readiness === "DRILLING_DATA_READY"
                  ? "Drilling Data Ready"
                  : "Drilling Data Missing"}
              </span>

              <button
                type="button"
                onClick={downloadDrillingInspectorV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta drilling
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{drillingInspectorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con forature</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{drillingInspectorV1Report.totals.componentsWithDrillings}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Senza forature</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{drillingInspectorV1Report.totals.componentsWithoutDrillings}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Fori rilevati</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{drillingInspectorV1Report.totals.drillings}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.2fr_0.45fr_0.65fr_0.65fr_0.55fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Fori</span>
              <span>Diametri</span>
              <span>Profondità</span>
              <span>Stato</span>
            </div>

            {drillingInspectorV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Drilling Inspector.</div>
            ) : (
              drillingInspectorV1Report.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.2fr_0.45fr_0.65fr_0.65fr_0.55fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Sorgente: {item.source}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.drillings}</span>
                  <span className="font-semibold text-slate-200">{item.diameters.length ? item.diameters.join(" / ") : "-"}</span>
                  <span className="font-semibold text-slate-200">{item.depths.length ? item.depths.join(" / ") : "-"}</span>
                  <span className={
                    item.status === "present"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-orange-400/15 bg-[#1a1007]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Hardware Analyzer V2.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Hardware Collision Check</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla sovrapposizioni, duplicazioni e distanze critiche tra forature sullo stesso componente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareCollisionV23Report.collisionStatus === "COLLISION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : hardwareCollisionV23Report.collisionStatus === "COLLISION_WARNING"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {hardwareCollisionV23Report.collisionStatus === "COLLISION_READY"
                  ? "Collision Ready"
                  : hardwareCollisionV23Report.collisionStatus === "COLLISION_WARNING"
                    ? "Collision Warning"
                    : "Collision Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadHardwareCollisionV23Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta collision
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Forature</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareCollisionV23Report.totals.drillings}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Coppie controllate</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{hardwareCollisionV23Report.totals.checkedPairs}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareCollisionV23Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareCollisionV23Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.65fr_0.6fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Fori</span>
              <span>Stato</span>
              <span>Messaggio</span>
            </div>

            {hardwareCollisionV23Report.issues.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">
                Nessuna collisione rilevata tra le forature disponibili.
              </div>
            ) : (
              hardwareCollisionV23Report.issues.slice(0, 80).map((issue, index) => (
                <div key={`${issue.componentId}-${issue.code}-${index}`} className="grid grid-cols-[1fr_0.65fr_0.6fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{issue.displayName}</p>
                    <p className="mt-1 text-slate-500">Distanza {issue.distance} mm · soglia {issue.safeDistance} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">#{issue.firstIndex + 1} ↔ #{issue.secondIndex + 1}</span>
                  <span className={
                    issue.status === "error"
                      ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                      : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                  }>
                    {issue.status}
                  </span>
                  <span className="text-slate-300">{issue.message}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-lime-400/15 bg-[#101a07]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">Hardware Pattern Recognition V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Riconoscimento pattern ferramenta</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prima classificazione automatica delle forature: cerniere, minifix/giunzioni, reggipiani e pattern non riconosciuti.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwarePatternRecognitionV1Report}
              className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20"
            >
              Esporta pattern
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pattern</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwarePatternRecognitionV1Report.totals.patterns}</p>
            </div>
            <div className="rounded-2xl border border-lime-400/15 bg-lime-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-lime-200">Cerniere</p>
              <p className="mt-1 text-2xl font-black text-lime-100">{hardwarePatternRecognitionV1Report.totals.hinges}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Minifix</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwarePatternRecognitionV1Report.totals.minifix}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Reggipiani</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwarePatternRecognitionV1Report.totals.shelfPins}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Sconosciuti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwarePatternRecognitionV1Report.totals.unknown}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.75fr_0.55fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Pattern</span>
              <span>Conf.</span>
              <span>Motivo</span>
            </div>

            {hardwarePatternRecognitionV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">
                Nessuna foratura disponibile per il riconoscimento pattern.
              </div>
            ) : (
              hardwarePatternRecognitionV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.patternType}-${index}`} className="grid grid-cols-[1fr_0.75fr_0.55fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Fori: {item.drillingIndexes.map((idx) => `#${idx + 1}`).join(", ")}</p>
                  </div>
                  <span className={item.patternType === "unknown" ? "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100" : "h-fit rounded-full bg-lime-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-lime-100"}>
                    {item.label}
                  </span>
                  <span className="font-black text-slate-200">{item.confidence}%</span>
                  <span className="text-slate-300">{item.reason}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-teal-400/15 bg-[#071a16]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">Hardware Compatibility Matrix V1.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Matrice compatibilità ferramenta</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Incrocia Pattern Recognition V1 con la Knowledge Base V1.1: profili verificati, priorità, reliability score, production gate e blocco dei Divario generici non affidabili.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwareCompatibilityMatrixV1Report}
              className="rounded-2xl border border-teal-400/25 bg-teal-400/10 px-5 py-3 text-sm font-black text-teal-100 transition hover:bg-teal-400/20"
            >
              Esporta matrix
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Compatibili</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareCompatibilityMatrixV1Report.totals.compatible}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareCompatibilityMatrixV1Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Non compatibili</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareCompatibilityMatrixV1Report.totals.incompatible}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Sconosciuti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwareCompatibilityMatrixV1Report.totals.unknown}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.65fr_0.65fr_0.4fr_0.55fr_0.5fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Profilo</span>
              <span>Score</span>
              <span>Stato</span>
              <span>Gate</span>
              <span>Nota</span>
            </div>

            {hardwareCompatibilityMatrixV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun pattern disponibile per la matrice compatibilità.</div>
            ) : (
              hardwareCompatibilityMatrixV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${index}`} className="grid grid-cols-[1fr_0.65fr_0.65fr_0.4fr_0.55fr_0.5fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Spessore: {item.currentThickness ?? "-"} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-teal-100">{item.trustedProfile || "-"}</span>
                  <span className="font-black text-slate-100">{item.reliabilityScore || "-"}</span>
                  <span className={
                    item.status === "compatible"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "warning"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : item.status === "incompatible"
                          ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                          : "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"
                  }>
                    {item.status}
                  </span>
                  <span className={
                    item.productionGate === "pass"
                      ? "h-fit rounded-full bg-cyan-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100"
                      : item.productionGate === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.productionGate || "review"}
                  </span>
                  <span className="text-slate-300">{item.note}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#07131f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Production Readiness Gate V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Semaforo produzione componenti</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Incrocia Compatibility Matrix V1.2, Constraint Engine V1 e Collision Engine V1.5 per classificare ogni componente come pass, review o blocked.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadProductionReadinessGateV1Report}
              className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
            >
              Esporta production gate
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productionReadinessGateV1Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Review</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{productionReadinessGateV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productionReadinessGateV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Componenti</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{productionReadinessGateV1Report.totals.components}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.55fr_0.55fr_0.7fr_1.4fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Gate</span>
              <span>Matrix</span>
              <span>Problemi</span>
              <span>Motivazioni</span>
            </div>

            {productionReadinessGateV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun componente disponibile per il Production Readiness Gate.</div>
            ) : (
              productionReadinessGateV1Report.items.slice(0, 80).map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1fr_0.55fr_0.55fr_0.7fr_1.4fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.componentId}</p>
                  </div>
                  <span className={
                    item.status === "pass"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.status}
                  </span>
                  <span className="font-semibold text-sky-100">{item.compatibilityGate || "-"}</span>
                  <span className="text-slate-300">
                    C:{item.collisionCritical}/{item.collisionWarnings} · V:{item.constraintErrors}/{item.constraintWarnings}
                  </span>
                  <span className="text-slate-300">{item.reasons.slice(0, 2).join(" ")}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#12091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Parametric Edit V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prontezza modifica parametrica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla quali componenti possono entrare nel Parametric Edit mantenendo l'ingombro esterno bloccato e preparando il ricalcolo interno.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadParametricEditV1Report}
              className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
            >
              Esporta parametric edit
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{parametricEditV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{parametricEditV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Review</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{parametricEditV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{parametricEditV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Esterni bloccati</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{parametricEditV1Report.totals.externalDimensionsLocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Ricalcolo interno</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{parametricEditV1Report.totals.internalRecalculationRequired}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            {parametricEditV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun componente disponibile per Parametric Edit V1.</div>
            ) : (
              parametricEditV1Report.items.slice(0, 80).map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1fr_0.55fr_0.7fr_0.7fr_1.4fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.componentId}</p>
                  </div>
                  <span className={
                    item.status === "ready"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : item.status === "skipped"
                          ? "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"
                          : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.status}
                  </span>
                  <span className="text-slate-300">{item.originalThickness ?? "n/d"} → {item.targetThickness ?? "n/d"} mm</span>
                  <span className="text-slate-300">Ext: {item.externalDimensionsLocked ? "lock" : "review"}</span>
                  <span className="text-slate-300">{item.note}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Hardware Links Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Collegamenti ferramenta-forature</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Crea il primo collegamento strutturato tra componente, ferramenta riconosciuta e fori usati dal pattern.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwareLinksEngineV1Report}
              className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
            >
              Esporta links
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Link creati</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{hardwareLinksEngineV1Report.totals.links}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Componenti collegati</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareLinksEngineV1Report.totals.linkedComponents}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Pattern validi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwareLinksEngineV1Report.totals.validPatterns}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Ignorati</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwareLinksEngineV1Report.totals.ignoredPatterns}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.75fr_0.65fr_0.55fr_1.05fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Fori</span>
              <span>Conf.</span>
              <span>Stato</span>
            </div>

            {hardwareLinksEngineV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun pattern disponibile per creare hardware links.</div>
            ) : (
              hardwareLinksEngineV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${index}`} className="grid grid-cols-[1fr_0.75fr_0.65fr_0.55fr_1.05fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Profilo: {item.trustedProfile || "-"}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-fuchsia-100">{item.drillingIndexes.map((idx) => `#${idx + 1}`).join(", ")}</span>
                  <span className="font-black text-slate-200">{item.confidence}%</span>
                  <div>
                    <span className={item.status === "linked" ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100" : "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"}>
                      {item.status}
                    </span>
                    <p className="mt-2 text-slate-400">{item.note}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-rose-400/15 bg-[#1a0710]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Constraint Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controlli geometrici produttivi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica profondità foro, margine sicurezza 2 mm e limite lavorazioni passanti pari a spessore + 0.1 mm.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadConstraintEngineV1Report}
              className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
            >
              Esporta constraints
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fori controllati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintEngineV1Report.totals.drillingsChecked}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">OK</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintEngineV1Report.totals.ok}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintEngineV1Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{constraintEngineV1Report.totals.errors}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Dati mancanti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{constraintEngineV1Report.totals.missingData}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.7fr_0.55fr_0.55fr_1.2fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Foro</span>
              <span>Stato</span>
              <span>Messaggio</span>
            </div>

            {constraintEngineV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun hardware link disponibile per i controlli constraint.</div>
            ) : (
              constraintEngineV1Report.items.slice(0, 100).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${item.drillingIndex}-${index}`} className="grid grid-cols-[1fr_0.7fr_0.55fr_0.55fr_1.2fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Spessore {item.thickness ?? "-"} mm · profondità {item.depth ?? "-"} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-rose-100">#{item.drillingIndex + 1}</span>
                  <span className={
                    item.status === "ok"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "warning"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                  <span className="text-slate-300">{item.message}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{adminT.productLibrary}</h2>
              <p className="mt-1 text-sm text-slate-400">{adminT.libraryDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveCurrentProductToLibrary}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.24)] transition hover:bg-cyan-400"
              >
                {adminT.saveToLibrary}
              </button>

              <button
                type="button"
                onClick={downloadProductLibraryJson}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta libreria
              </button>

              <label className="cursor-pointer rounded-2xl border border-cyan-400/25 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Importa package
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(event) => importProductPackageToLibrary(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <input
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder="Cerca prodotto, categoria, brand, file..."
              className="rounded-2xl border border-cyan-400/20 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
            />

            <div className="rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
              {filteredProductLibrary.length} / {productLibrary.length} prodotti visibili
            </div>
          </div>

          {productLibrary.length === 0 ? (
            <p className="rounded-2xl border border-cyan-400/10 bg-black/30 p-4 text-sm text-slate-400">
              {adminT.emptyLibrary}
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-3">
                {filteredProductLibrary.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedLibraryProductId(item.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      selectedLibraryProduct?.id === item.id
                        ? "border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_28px_rgba(14,165,233,0.16)]"
                        : "border-cyan-400/15 bg-black/30 hover:border-cyan-300/35 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.brand} · {item.category} · {item.sourceFileName || "package JSON"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {new Date(item.savedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            loadProductFromLibrary(item);
                          }}
                          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          {adminT.loadProduct}
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            downloadSelectedLibraryProductPackage(item);
                          }}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/20"
                        >
                          Scarica JSON
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteProductFromLibrary(item.id);
                          }}
                          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20"
                        >
                          {adminT.deleteProduct}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                  Product Inspector
                </p>

                {selectedLibraryProduct ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Nome</p>
                      <p className="font-black text-white">{selectedLibraryProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID</p>
                      <p className="break-all font-mono text-xs text-cyan-100">{selectedLibraryProduct.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                        <p className="text-xs text-slate-500">Categoria</p>
                        <p className="font-bold text-white">{selectedLibraryProduct.category}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                        <p className="text-xs text-slate-500">Brand</p>
                        <p className="font-bold text-white">{selectedLibraryProduct.brand}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Sorgente</p>
                      <p className="break-all text-slate-300">{selectedLibraryProduct.sourceFileName || "package JSON"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => loadProductFromLibrary(selectedLibraryProduct)}
                        className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white transition hover:bg-cyan-400"
                      >
                        Apri prodotto
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSelectedLibraryProductPackage(selectedLibraryProduct)}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                      >
                        Esporta package
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Seleziona un prodotto dalla libreria.</p>
                )}
              </aside>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">
            {adminT.import3d}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
              {adminT.chooseFile}
<input
  type="file"
  accept={BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMATS}
  onChange={(e) => {
    void handleAdminModelImport(e.target.files?.[0]);
  }}
  className="hidden"
/>
            </label>
            <span className="text-sm text-slate-300">{modelFileName || adminT.noFileSelected}</span>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            {adminT.formats}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Importer UI V2 attivo · {BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMAT_LABEL}
          </p>

          <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-400/15 bg-black/25 p-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                    importerDiagnostic.status === "ready"
                      ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : importerDiagnostic.status === "warning"
                      ? "border border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : importerDiagnostic.status === "error"
                      ? "border border-red-400/40 bg-red-400/10 text-red-200"
                      : importerDiagnostic.status === "loading"
                      ? "border border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border border-slate-400/20 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  {importerDiagnostic.status}
                </span>
                <span className="text-sm font-bold text-white">{importerDiagnostic.message}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Mesh</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.meshCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Selezionabili</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.selectableCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">LED ready</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.ledReadyCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Inserti</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.insertReadyCount}</p>
                </div>
              </div>

              {(importerDiagnostic.warnings.length > 0 || importerDiagnostic.errors.length > 0) && (
                <div className="mt-3 space-y-2 text-xs">
                  {importerDiagnostic.errors.map((error) => (
                    <p key={error} className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200">
                      Errore: {error}
                    </p>
                  ))}
                  {importerDiagnostic.warnings.map((warning) => (
                    <p key={warning} className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                      Avviso: {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Package readiness</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className={importerReadiness.hasSupportedFormat ? "text-emerald-200" : "text-red-200"}>
                  Formato supportato: {importerReadiness.hasSupportedFormat ? "Sì" : "No"}
                </p>
                <p className={importerReadiness.hasComponents ? "text-emerald-200" : "text-amber-200"}>
                  Componenti rilevati: {importerReadiness.hasComponents ? "Sì" : "No"}
                </p>
                <p className={importerReadiness.hasMappedNames ? "text-emerald-200" : "text-amber-200"}>
                  Nomi mapping: {importerReadiness.hasMappedNames ? "Completi" : "Da completare"}
                </p>
                <p className={importerReadiness.packageReady ? "text-emerald-300" : "text-slate-400"}>
                  Product Package: {importerReadiness.packageReady ? "Pronto" : "Non pronto"}
                </p>
              </div>
              <button
                type="button"
                onClick={downloadImporterDiagnosticJson}
                className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Scarica diagnostica importer
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Space3D Import Runtime V1</p>
                <h3 className="mt-1 text-lg font-black text-white">S3D Analyzer / Bridge</h3>
                <p className="mt-1 text-xs text-slate-400">Carica file .s3d o .s3dbak per estrarre componenti, materiali e metadata da Space3D.</p>
              </div>

              <label className="cursor-pointer rounded-xl bg-violet-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
                Importa .s3d
                <input
                  type="file"
                  accept={SPACE3D_SUPPORTED_FORMATS}
                  onChange={(event) => {
                    void handleSpace3DImport(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                Importa CSV
                <input
                  type="file"
                  accept={SPACE3D_CSV_SUPPORTED_FORMATS}
                  onChange={(event) => {
                    void handleSpace3DCsvImport(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-400">
                Importa CIX
                <input
                  type="file"
                  accept={SPACE3D_CIX_SUPPORTED_FORMATS}
                  multiple
                  onChange={(event) => {
                    void handleSpace3DCixImport(event.target.files);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">File Space3D</p>
                <p className="mt-1 break-all text-sm font-bold text-white">{space3DFileName || "Nessun file caricato"}</p>
                <p className="mt-2 text-xs text-violet-200">{space3DStatus}</p>
              </div>

              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">Componenti rilevati</p>
                <p className="mt-1 text-2xl font-black text-white">{space3DAnalyzerReport?.stats.components ?? 0}</p>
                <p className="text-xs text-slate-400">Mapping automatico verso componenti BagaStudio</p>
              </div>

              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">Materiali rilevati</p>
                <p className="mt-1 text-2xl font-black text-white">{space3DAnalyzerReport?.stats.materials ?? 0}</p>
                <p className="text-xs text-slate-400">Material Extractor V1</p>
              </div>
            </div>

            {space3DAnalyzerReport && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">Componenti Space3D</p>
                    <p className="text-xs text-slate-500">Prime 40 voci filtrate</p>
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                    {space3DAnalyzerReport.components.slice(0, 40).map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => selectMeshCard(component.id)}
                        className="w-full rounded-lg border border-violet-400/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-violet-300/40 hover:bg-violet-400/10"
                      >
                        <p className="text-xs font-bold text-white">{component.name}</p>
                        <p className="text-[11px] text-slate-500">{component.category} · {component.id}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">Materiali Space3D</p>
                    <p className="text-xs text-slate-500">Prime 40 voci</p>
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                    {(space3DAnalyzerReport?.materials || []).slice(0, 40).map((material) => (
                      <div key={material.id} className="rounded-lg border border-violet-400/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-xs font-bold text-white">{material.name}</p>
                        <p className="text-[11px] text-slate-500">{material.category} · {material.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                onClick={downloadSpace3DAnalyzerReport}
                className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Scarica report S3D
              </button>
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                data-bagastudio-action="generate-product-package"
                onClick={buildSpace3DProductPackageDraft}
                className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Genera Product Package draft
              </button>
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                data-bagastudio-action="detect-missing-parts"
                onClick={detectMissingSpace3DParts}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Rileva parti mancanti
              </button>
              <button
                type="button"
                disabled={geometryCompletionReport.missingParts.length === 0}
                data-bagastudio-action="apply-placeholder-metadata"
                onClick={applyMissingPartsAsPlaceholders}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aggiungi placeholder metadata
              </button>
            </div>

            {geometryCompletionReport.status === "ready" && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-50">
                <p className="font-black uppercase tracking-[0.2em] text-amber-200">Geometry Completion V1</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">DAE mesh: {geometryCompletionReport.daeMeshCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">S3D componenti: {geometryCompletionReport.s3dComponentCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">Match stimati: {geometryCompletionReport.matchedCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">Mancanti: {geometryCompletionReport.missingCount}</div>
                </div>
                {geometryCompletionReport.missingParts.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                    {geometryCompletionReport.missingParts.slice(0, 12).map((part) => (
                      <p key={part.meshName} className="truncate text-[11px] text-amber-100">
                        {part.displayName} · {part.category} · {part.partId}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => setModelRotationY(0)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 0°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY(Math.PI / 2)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 90°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY(Math.PI)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 180°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY((Math.PI * 3) / 2)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 270°
  </button>
</div>
        
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">CSV ↔ CIX Matcher V1</p>
                  <h3 className="mt-1 text-lg font-black text-white">Dati produzione Space3D</h3>
                  <p className="mt-1 text-xs text-slate-400">{csvCixStatus}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyAutoMappingEngineV2}
                    disabled={!csvCixMatcherReport}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Applica Auto Mapping V2
                  </button>

                  <button
                    type="button"
                    onClick={restoreAutoMappingEngineV2Snapshot}
                    disabled={!autoMappingV2LastSnapshot}
                    className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ripristina Auto Mapping
                  </button>

                  <button
                    type="button"
                    onClick={downloadAutoMappingEngineV2Report}
                    disabled={!autoMappingV2Report}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica report Auto Mapping
                  </button>

                  <button
                    type="button"
                    onClick={downloadAutoMappingEngineV2ReviewQueue}
                    disabled={!autoMappingV2Report}
                    className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica Review Queue
                  </button>

                  <button
                    type="button"
                    onClick={downloadCsvCixMatcherReport}
                    disabled={!csvCixMatcherReport}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica report CSV/CIX
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">CSV</p>
                  <p className="mt-1 break-all text-sm font-bold text-white">{space3DCsvFileName || "Nessun CSV"}</p>
                  <p className="mt-2 text-xs text-emerald-200">{space3DCsvParts.length} pezzi letti</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">CIX</p>
                  <p className="mt-1 text-sm font-bold text-white">{space3DCixFileNames.length} file caricati</p>
                  <p className="mt-2 text-xs text-emerald-200">{space3DCixParts.length} pezzi CNC letti</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">Match</p>
                  <p className="mt-1 text-2xl font-black text-white">{csvCixMatcherReport?.matchedParts ?? 0}/{csvCixMatcherReport?.totalCsvParts ?? 0}</p>
                  <p className="mt-2 text-xs text-emerald-200">CSV collegati a CIX</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">Confidenza media</p>
                  <p className="mt-1 text-2xl font-black text-white">{csvCixMatcherReport?.averageConfidence ?? 0}%</p>
                  <p className="mt-2 text-xs text-emerald-200">Matching V1</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Auto Mapping Engine V2</p>
                    <p className="mt-1 text-xs text-slate-300">{autoMappingV2Status}</p>
                  </div>
                  {autoMappingV2Report && (
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Applicati {autoMappingV2Report.appliedMatches}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Placeholder {autoMappingV2Report.createdPlaceholders}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Eleggibili {autoMappingV2Report.eligibleMatches}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Saltati {autoMappingV2Report.skippedLowConfidence}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Qualità {autoMappingV2Report.qualityScore}/100</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Gate {autoMappingV2Report.qualityLevel}</span>
                      <span className="rounded-full border border-violet-300/20 bg-black/20 px-3 py-2 text-center text-violet-100">Review {getAutoMappingEngineV2ReviewSummary().reviewed}/{getAutoMappingEngineV2ReviewSummary().total}</span>
                      <span className="rounded-full border border-violet-300/20 bg-black/20 px-3 py-2 text-center text-violet-100">Pending {getAutoMappingEngineV2ReviewSummary().pending}</span>
                    </div>
                  )}
                </div>

                {autoMappingV2Report && (
                  <div className="mt-3 grid gap-3 text-xs lg:grid-cols-2">
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Componenti aggiornati</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.updatedComponents.length > 0
                          ? autoMappingV2Report.updatedComponents.slice(0, 10).join(", ")
                          : "Nessun componente geometrico aggiornato direttamente."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Placeholder metadata</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.placeholderComponents.length > 0
                          ? autoMappingV2Report.placeholderComponents.slice(0, 10).join(", ")
                          : "Nessun placeholder creato."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Azioni consigliate</p>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {autoMappingV2Report.recommendedActions.slice(0, 4).map((action) => (
                          <li key={action}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Match da verificare</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.riskyMatches.length > 0
                          ? autoMappingV2Report.riskyMatches.slice(0, 6).join(", ")
                          : "Nessun match ambiguo rilevato sopra soglia."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3 lg:col-span-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Review Queue V2.4</p>
                          <p className="mt-1 text-slate-400">
                            Verificati {getAutoMappingEngineV2ReviewSummary().reviewed}/{getAutoMappingEngineV2ReviewSummary().total} · Critici pending {getAutoMappingEngineV2ReviewSummary().criticalPending} · Warning pending {getAutoMappingEngineV2ReviewSummary().warningPending}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={markAllAutoMappingEngineV2ReviewItemsReviewed}
                            className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-[11px] font-black text-violet-100 transition hover:bg-violet-400/20"
                          >
                            Segna tutto verificato
                          </button>
                          <button
                            type="button"
                            onClick={resetAutoMappingEngineV2ReviewActions}
                            className="rounded-lg border border-slate-300/20 bg-white/[0.04] px-3 py-2 text-[11px] font-black text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            Reset review
                          </button>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-2 text-slate-300">
                        {autoMappingV2Report.reviewQueue.slice(0, 8).map((item, index) => {
                          const reviewKey = buildAutoMappingEngineV2ReviewKey(item, index);
                          const reviewed = Boolean(autoMappingV2ReviewedLabels[reviewKey]);

                          return (
                            <li key={reviewKey} className="rounded-lg border border-white/10 bg-black/20 p-2">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <span className="font-bold text-cyan-100">[{item.severity}] {item.label}</span>
                                  <span className="block text-slate-400">{item.reason}</span>
                                  <span className="block text-slate-300">{item.suggestedAction}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleAutoMappingEngineV2ReviewItem(item, index)}
                                  className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black transition ${
                                    reviewed
                                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20"
                                      : "border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                                  }`}
                                >
                                  {reviewed ? "Verificato" : "Da verificare"}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {csvCixMatcherReport && (
                <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-emerald-400/10 bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#06111d] text-emerald-200">
                      <tr>
                        <th className="px-3 py-2">CSV</th>
                        <th className="px-3 py-2">CIX</th>
                        <th className="px-3 py-2">Conf.</th>
                        <th className="px-3 py-2">Motivi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvCixMatcherReport.matches.slice(0, 30).map((match) => (
                        <tr key={`${match.csvPart.rowIndex}-${match.csvPart.name}`} className="border-t border-white/5 text-slate-300">
                          <td className="px-3 py-2">{match.csvPart.name}</td>
                          <td className="px-3 py-2">{match.cixPart?.fileName || "—"}</td>
                          <td className="px-3 py-2 font-bold text-white">{match.confidence}%</td>
                          <td className="px-3 py-2">{match.reasons.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

</section>
<section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
  <h2 className="text-xl font-semibold mb-4">
    {adminT.preview3d}
  </h2>

  <div className="h-[600px] overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[#030a12] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
    <Canvas
  camera={{ position: [4, 3, 6], fov: 45 }}
  style={{ background: "linear-gradient(180deg, #07111c 0%, #02070d 100%)" }}
>
  <ambientLight intensity={3} />
<directionalLight position={[5, 8, 5]} intensity={4} />
<directionalLight position={[-5, 3, -5]} intensity={2} />

  <gridHelper args={[10, 10]} />
  <axesHelper args={[3]} />

 <OrbitControls target={[0, 1.2, 0]} />

  {modelPreviewUrl ? (
 <AdminModelRouter
  url={modelPreviewUrl}
  fileName={modelFileName}
  selectedMeshName={selectedMeshName}
  onSelectMesh={(meshName) => {
    selectMeshCard(meshName);
  }}
  modelRotationY={modelRotationY}
/>
) : (
  <Html center>
    <div className="rounded-2xl border border-violet-400/30 bg-slate-950/90 px-5 py-4 text-center text-xs text-slate-200 shadow-2xl">
      <p className="font-black text-violet-200">Preview 3D non disponibile</p>
      <p className="mt-1 max-w-[260px] text-slate-400">Il file .s3d è stato analizzato come metadata. Serve conversione geometria reale prima del preview Viewer.</p>
    </div>
  </Html>
)}
</Canvas>
  </div>
</section>
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {adminT.mapping}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {filteredMapperMeshes.length} / {meshList.length} componenti visibili
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto]">
              <input
                value={mapperSearch}
                onChange={(event) => setMapperSearch(event.target.value)}
                placeholder="Cerca mesh, nome o categoria"
                className="rounded-xl border border-cyan-400/20 bg-[#02070d] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />

              <select
                value={mapperCategoryFilter}
                onChange={(event) => setMapperCategoryFilter(event.target.value)}
                className="rounded-xl border border-cyan-400/20 bg-[#02070d] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                <option value="all">Tutte le categorie</option>
                {mapperCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setMapperSearch("");
                  setMapperCategoryFilter("all");
                }}
                className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
              >
                Reset
              </button>
            </div>
          </div>

          {selectedMapperMesh && (
            <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Componente selezionato</p>
                  <h3 className="mt-1 text-lg font-black text-white">{selectedMapperMesh.displayName}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-cyan-100">{selectedMapperMesh.meshName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">{selectedMapperMesh.category}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">{selectedMapperMesh.materialSlots || "main"}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">LED {selectedMapperMesh.compatibleLed ? "ON" : "OFF"}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Inserto {selectedMapperMesh.compatibleInsert ? "ON" : "OFF"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4">
  {meshList.length === 0 ? (
    <p className="text-slate-400">
      {adminT.emptyMesh}
    </p>
  ) : filteredMapperMeshes.length === 0 ? (
    <p className="text-slate-400">
      Nessun componente trovato con i filtri attuali.
    </p>
  ) : (
    <div className="space-y-4">
      {groupedMapperMeshes.map(([category, items]) => (
        <div key={category} className="rounded-2xl border border-cyan-400/10 bg-white/[0.02] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-200">
              {category}
            </span>
            <span className="text-xs text-slate-500">
              {items.length} componenti
            </span>
          </div>

          <div className="space-y-2">
            {items.map(({ mesh, index }) => (
 <div
  key={index}
  ref={(el) => {
    meshCardRefs.current[mesh.meshName] = el;
  }}
  onClick={() => {
    selectMeshCard(mesh.meshName);
  }}
  className={`rounded-lg border p-3 space-y-2 ${
    selectedMeshName === mesh.meshName
      ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-sky-500/10"
      : "border-cyan-400/20"
  }`}
>
    {meshThumbnails[mesh.meshName] && (
  <img
    src={meshThumbnails[mesh.meshName]}
    alt={mesh.displayName}
    className="mb-2 h-20 w-full rounded-lg border border-cyan-400/20 object-contain bg-neutral-950"
  />
)}

<div className="flex items-center justify-between gap-3 text-xs text-slate-500">
  <span>Mesh: {mesh.meshName}</span>
  {selectedMeshName === mesh.meshName && (
    <span className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
      Selezionato
    </span>
  )}
</div>

    <input
  ref={(el) => {
    meshInputRefs.current[mesh.meshName] = el;
  }}
  value={mesh.displayName}
      onChange={(e) => {
        const nextDisplayName = e.target.value;
        updateMeshConfig(mesh.meshName, {
          displayName: nextDisplayName,
          category: mesh.category || guessComponentCategory(nextDisplayName),
        });
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />

    <div className="grid grid-cols-2 gap-3 mt-3">
      <div>
        <label className="text-xs text-slate-400">{adminT.componentCategory}</label>
        <select
          value={mesh.category || "component"}
          onChange={(e) => {
            updateMeshConfig(mesh.meshName, { category: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
        >
          <option value="panel">Panel</option>
          <option value="front">Front</option>
          <option value="top">Top</option>
          <option value="side">Side</option>
          <option value="back">Back</option>
          <option value="drawer">Drawer</option>
          <option value="door">Door</option>
          <option value="shelf">Shelf</option>
          <option value="mirror">Mirror</option>
          <option value="hardware">Hardware</option>
          <option value="lighting">Lighting</option>
          <option value="insert">Insert</option>
          <option value="component">Component</option>
        </select>
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mesh.supportsAccessories !== false}
          onChange={(e) => {
            updateMeshConfig(mesh.meshName, { supportsAccessories: e.target.checked });
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {adminT.supportsAccessories}
      </label>
    </div>

    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.selectable}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { selectable: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.selectable}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.visible}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { visible: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.visible}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.compatibleLed}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { compatibleLed: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.ledCompatible}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.compatibleInsert}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { compatibleInsert: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.insertCompatible}
  </label>
</div>
{mesh.compatibleLed && (
  <div className="grid grid-cols-4 gap-3 mt-3">
    <div>
      <label className="text-xs text-slate-400">{adminT.ledPosition}</label>
      <select
        value={mesh.ledPosition}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledPosition: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      >
        <option value="front">Front</option>
        <option value="top">Top</option>
        <option value="side">Side</option>
      </select>
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledFrontOffset}</label>
      <input
        type="number"
        value={mesh.ledFrontOffset}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledFrontOffset: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledSideMargin}</label>
      <input
        type="number"
        value={mesh.ledSideMargin}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledSideMargin: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledYOffset}</label>
      <input
        type="number"
        value={mesh.ledYOffset}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledYOffset: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>
  </div>
)}
<div className="grid grid-cols-2 gap-3 mt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.materialSlots}</label>
    <input
      value={mesh.materialSlots}
      onChange={(e) => {
        updateMeshConfig(mesh.meshName, { materialSlots: e.target.value });
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="main, top, frontale"
      className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.compatibleAccessories}</label>
    <input
      value={mesh.compatibleAccessories}
      onChange={(e) => {
        updateMeshConfig(mesh.meshName, { compatibleAccessories: e.target.value });
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="led, inserto, maniglia"
      className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
</div>

<div className="mt-3 rounded-xl border border-cyan-400/10 bg-black/20 p-3">
  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Product Package V3 / Produzione</p>
  <div className="grid grid-cols-2 gap-3">
    <input
      value={mesh.panelThickness || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { panelThickness: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Spessore pannello es. 18.3"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.assemblyOrder || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { assemblyOrder: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Ordine montaggio"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.hardware || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { hardware: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Ferramenta es. cerniera, vite, basetta"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.materialCode || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { materialCode: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Codice materiale es. BAROK / NERO / ANGEL_WHITE"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.dimensions || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { dimensions: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder='Dimensioni JSON es. {"width":600,"height":720,"depth":18.3}'
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
  <textarea
    value={mesh.edgeBanding || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { edgeBanding: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Bordatura JSON es. {"top":"ABS 1mm","bottom":"ABS 1mm","left":"ABS 1mm","right":"ABS 1mm"}'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.technicalPoints || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { technicalPoints: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Punti tecnici JSON: prese, scarichi, fori, passacavi'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.drillings || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { drillings: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Forature JSON future da CSV/CIX'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.manufacturingData || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { manufacturingData: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Manufacturing data JSON per Parametric Edit / CSV regeneration'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />

  <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/5 p-3">
    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Hardware Analyzer V1 / Constraints</p>
    <div className="grid grid-cols-2 gap-3">
      <select
        value={mesh.constraintRole || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { constraintRole: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      >
        <option value="">Auto constraint role</option>
        <option value="STRUCTURAL">STRUCTURAL</option>
        <option value="DERIVED">DERIVED</option>
        <option value="ACCESSORY">ACCESSORY</option>
        <option value="HARDWARE">HARDWARE</option>
        <option value="UNKNOWN">UNKNOWN</option>
      </select>
      <input
        value={mesh.dependencyParents || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { dependencyParents: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Parents dependencyGraph es. fianco_sx"
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
      <input
        value={mesh.dependencyChildren || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { dependencyChildren: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Children dependencyGraph es. ripiano_1, cassetto_1"
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
      <input
        value={mesh.hardwareLinks || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { hardwareLinks: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder='Hardware links JSON o vuoto'
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
    </div>
    <textarea
      value={mesh.drillingLinks || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { drillingLinks: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder='Drilling links JSON parametrico: x=leftEdge+32, z=thickness/2'
      className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
</div>
  </div>
))}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">
            {adminT.generatePackage}
          </h2>
<div className="space-y-3 rounded-xl border border-cyan-400/20 p-4">
  <h3 className="text-sm font-semibold text-white">{adminT.productInfo}</h3>

  <input
    type="text"
    value={productId}
    onChange={(e) => setProductId(e.target.value)}
    placeholder={adminT.productId}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <input
    type="text"
    value={productName}
    onChange={(e) => setProductName(e.target.value)}
    placeholder={adminT.productName}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <input
    type="text"
    value={productCategory}
    onChange={(e) => setProductCategory(e.target.value)}
    placeholder={adminT.category}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <div className="grid grid-cols-2 gap-3">
    <input
      type="text"
      value={productBrand}
      onChange={(e) => setProductBrand(e.target.value)}
      placeholder="Brand"
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />

    <input
      type="text"
      value={packageVersion}
      onChange={(e) => setPackageVersion(e.target.value)}
      placeholder="Package version"
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
  <div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.widthMin}</label>
    <input
      type="number"
      value={widthMin}
      onChange={(e) => setWidthMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.widthDefault}</label>
    <input
      type="number"
      value={widthDefault}
      onChange={(e) => setWidthDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.widthMax}</label>
    <input
      type="number"
      value={widthMax}
      onChange={(e) => setWidthMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
</div>
<div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.heightMin}</label>
    <input
      type="number"
      value={heightMin}
      onChange={(e) => setHeightMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.heightDefault}</label>
    <input
      type="number"
      value={heightDefault}
      onChange={(e) => setHeightDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.heightMax}</label>
    <input
      type="number"
      value={heightMax}
      onChange={(e) => setHeightMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
  </div>
<div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.depthMin}</label>
    <input
      type="number"
      value={depthMin}
      onChange={(e) => setDepthMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.depthDefault}</label>
    <input
      type="number"
      value={depthDefault}
      onChange={(e) => setDepthDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.depthMax}</label>
    <input
      type="number"
      value={depthMax}
      onChange={(e) => setDepthMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
</div>
</div>
          <button
  onClick={() => {
    const jsonString = buildCurrentProductPackageJson();

    setGeneratedJson(jsonString);
    downloadJsonFile("product-package.json", jsonString);
  }}
  className="rounded-2xl bg-cyan-500 px-5 py-3 font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.28)] transition hover:bg-cyan-400"
>
  {adminT.generateJson}
</button>
{generatedJson && (
  <pre className="mt-4 max-h-[400px] overflow-auto rounded-2xl border border-cyan-400/15 bg-black/30 p-4 text-xs text-green-300">
    {generatedJson}
  </pre>
)}
 </section>
          </div>
        </div>
      </div>
    
      {/* bagastudio-admin-back-to-top-safe-v2 */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="fixed bottom-5 right-5 z-[9999] rounded-full border border-cyan-300/30 bg-slate-950/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-cyan-400/20"
        aria-label="Torna su"
      >
        ↑ Su
      </button>
</main>
);
}
