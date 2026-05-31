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



type HardwareCompatibilityV1Status = "compatible" | "warning" | "incompatible" | "unknown";

type HardwareCompatibilityV1Item = {
  componentId: string;
  displayName: string;
  hardwareLabel: string;
  patternType: HardwarePatternRecognitionV1Type;
  status: HardwareCompatibilityV1Status;
  currentThickness: number | null;
  trustedProfile: string | null;
  note: string;
};

type HardwareCompatibilityMatrixV1Report = {
  schema: "bagastudio-hardware-compatibility-matrix-v1";
  version: 1;
  generatedAt: string;
  trustedProfiles: string[];
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

const TRUSTED_HARDWARE_PROFILES_V1 = [
  "Ferramenta_17.8",
  "Ferramenta_18.3",
  "Cabineo_Singolo",
  "divario_elvis",
];

function chooseTrustedHardwareProfileV1(pattern: HardwarePatternRecognitionV1Item, thickness: number | null): string | null {
  if (pattern.patternType === "hinge") return "Ferramenta_18.3";
  if (pattern.patternType === "shelfPin") return thickness !== null && thickness <= 18 ? "Ferramenta_17.8" : "Ferramenta_18.3";
  if (pattern.patternType === "minifix") return "Cabineo_Singolo";
  return null;
}

function buildHardwareCompatibilityMatrixV1Report(
  patternReport: HardwarePatternRecognitionV1Report,
  meshes: MeshConfig[]
): HardwareCompatibilityMatrixV1Report {
  const meshByComponentId = new Map<string, MeshConfig>();
  meshes.forEach((mesh, index) => {
    meshByComponentId.set(buildStablePartId(mesh, index), mesh);
  });

  const items: HardwareCompatibilityV1Item[] = patternReport.items.map((pattern) => {
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
      note: "Nessun profilo affidabile associato in Matrix V1.",
    };
  });

  return {
    schema: "bagastudio-hardware-compatibility-matrix-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    trustedProfiles: TRUSTED_HARDWARE_PROFILES_V1,
    totals: {
      components: meshes.length,
      items: items.length,
      compatible: items.filter((item) => item.status === "compatible").length,
      warning: items.filter((item) => item.status === "warning").length,
      incompatible: items.filter((item) => item.status === "incompatible").length,
      unknown: items.filter((item) => item.status === "unknown").length,
    },
    items,
  };
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
  downloadJsonFile(`bagastudio-hardware-compatibility-matrix-v1-${Date.now()}.json`, hardwareCompatibilityMatrixV1Report);
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
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">Hardware Compatibility Matrix V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Matrice compatibilità ferramenta</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Incrocia Pattern Recognition V1 con gli spessori e usa solo profili affidabili: Ferramenta_17.8, Ferramenta_18.3, Cabineo_Singolo e divario_elvis.
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
            <div className="grid grid-cols-[1fr_0.7fr_0.7fr_0.6fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Profilo</span>
              <span>Stato</span>
              <span>Nota</span>
            </div>

            {hardwareCompatibilityMatrixV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun pattern disponibile per la matrice compatibilità.</div>
            ) : (
              hardwareCompatibilityMatrixV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${index}`} className="grid grid-cols-[1fr_0.7fr_0.7fr_0.6fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Spessore: {item.currentThickness ?? "-"} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-teal-100">{item.trustedProfile || "-"}</span>
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
