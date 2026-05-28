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

type MeshConfig = {
  meshName: string;
  displayName: string;
  category: string;
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

const SPACE3D_SUPPORTED_FORMATS = ".s3d,.s3dbak";

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

function buildRuntimeComponentV2(mesh: MeshConfig, index: number) {
  const category = normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName);
  const partId = buildStablePartId({ ...mesh, category }, index);
  const runtimeRole = mesh.runtimeRole || guessRuntimeRole(mesh.displayName || mesh.meshName || partId, category);
  const componentType = mesh.componentType || (category === "panel" ? "configurable-panel" : `${category}-component`);
  const tags = buildRuntimeTags(mesh, category, runtimeRole);

  const normalizeCsv = (value: string, fallback: string[] = []) => {
    const items = value
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : fallback;
    return Array.from(new Set(items));
  };

  const materialSlots = normalizeCsv(mesh.materialSlots, ["main"]);
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
        technicalPoints: false,
      },
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
  const ext = fileName.split(".").pop()?.toLowerCase();

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
useEffect(() => {
  if (!selectedMeshName) return;

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

  const components = meshList.map((mesh, index) => buildRuntimeComponentV2(mesh, index));

  const componentCategories = Array.from(new Set(components.map((component) => component.category))).sort();
  const runtimeMetadata = {
    schema: "bagastudio-runtime-metadata",
    version: 2,
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
      packageVersion: packageVersion || "2.0.0",
      productPackageVersion: 2,
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
        supportsStablePartIds: true,
        supportsComponentCategories: true,
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
        runtimeMetadataVersion: 2,
        packageSource: space3DAnalyzerReport ? "space3d-analyzer" : "admin-model-importer",
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
      componentCategories,
      components,
      parts: components,
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
        runtimeTargets: ["materials", "visibility", "led", "insert", "accessories", "pricing", "bom"],
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
  const daeKeys = new Set(
    daeMeshes.flatMap((mesh) => [
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
      new ColladaLoader().load(
        url,
        (collada) => {
          const daeScene = collada?.scene;
          if (!daeScene) {
            applyError(new Error("DAE scene not found"));
            return;
          }
          applyMeshes(extractMeshesFromObject(daeScene));
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
                    <p className="text-xs text-slate-500">Prime 40 voci</p>
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
                    {space3DAnalyzerReport.materials.slice(0, 40).map((material) => (
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
                onClick={buildSpace3DProductPackageDraft}
                className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Genera Product Package draft
              </button>
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                onClick={detectMissingSpace3DParts}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Rileva parti mancanti
              </button>
              <button
                type="button"
                disabled={geometryCompletionReport.missingParts.length === 0}
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
    </main>
);
}
