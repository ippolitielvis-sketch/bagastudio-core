"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Center,
  Environment,
  Edges,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { useConfigStore } from "@/core/state/config.state";
import { MATERIAL_LIBRARY } from "@/core/data/materials";
import { createLedBar } from "@/lib/engine/ledEngine";
import {
  createUsbAccessory,
  createSocketAccessory,
  createHairdryerHolderAccessory,
  createToolHolderAccessory,
  createWirelessChargerAccessory,
  createMirrorLedAccessory,
} from "@/core/accessories/accessoryRenderer";
import { getDefaultInsertConfig } from "@/core/engines/insertEngine";

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const textureWaiters = new Map<string, Array<(texture: THREE.Texture) => void>>();
let bagastudioRendererMaxAnisotropy = 8;

function configureBagastudioTexture(texture: THREE.Texture, options?: {
  repeatX?: number;
  repeatY?: number;
  rotate?: boolean;
}) {
  texture.colorSpace = THREE.SRGBColorSpace;

  // Recovery Texture V2: default uniform texture on each part.
  // RepeatWrapping + automatic repeat caused visible "quadrati/piastrelle" on panels.
  // ClampToEdge keeps the texture stretched uniformly over the component surface.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.max(8, bagastudioRendererMaxAnisotropy || 8);

  // Forced 1:1. No runtime tiling in Viewer client; texture must be visually uniform on the part.
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.center.set(0.5, 0.5);
  // Wood direction is handled by UV coordinates, not by rotating the bitmap texture.
  // Rotating both UVs and texture caused the direction toggle to look like a mirror/flip.
  texture.rotation = 0;
  texture.needsUpdate = true;
}

function getBagastudioTextureRepeat(mesh: THREE.Mesh, materialData: any, rotateWood = false) {
  const explicitRepeatX = Number(materialData?.repeatX ?? materialData?.scaleX);
  const explicitRepeatY = Number(materialData?.repeatY ?? materialData?.scaleY);

  // Only use tiling when the material explicitly asks for it.
  // The safe default must be uniform, otherwise Spazio3D panels show square repetition.
  if (Number.isFinite(explicitRepeatX) && explicitRepeatX > 0 && Number.isFinite(explicitRepeatY) && explicitRepeatY > 0) {
    return { repeatX: explicitRepeatX, repeatY: explicitRepeatY, rotate: false };
  }

  return { repeatX: 1, repeatY: 1, rotate: false };
}

type Viewer3DProps = {
  width?: number;
  height?: number;
  depth?: number;
  materials?: Record<string, string>;
  productMaterials?: any[];
 accessories: Record<string, Record<string, boolean>>;
  inserts?: Record<string, boolean>;
 insertMaterials?: Record<string, string>;
 insertSizes?: Record<string, {
  width?: number;
  depth?: number;
  offsetX?: number;
  offsetZ?: number;
}>;
  visibility?: Record<string, boolean>;
  productModel: string;
  productModelFormat?: string;
  activeViewId?: string | null;
 ledKelvin?: Record<string, number>;
 ledIntensity?: Record<string, number>;
 woodDirection?: Record<string, "x" | "z">;
 xRayEnabled?: boolean;
 xRayOpacity?: number;
  views?: {
  id: string;
  name: string;
  camera: {
    position: number[];
    target: number[];
  };
}[];
productParts?: {
  id: string;
  name: string;
  meshName: string;
  defaultMaterialId?: string;
 mountPoints?: {
led?: {
  position?: string;
  frontOffset: number;
  sideMargin: number;
  yOffset: number;
};
  insert?: {
  position?: string[];
  offset?: {
    x: number;
    y: number;
    z: number;
  };
};
};
led?: boolean;
}[];
};


function sniffDataUrlModelFormat(url: string): string {
  if (!url.startsWith("data:")) return "";

  const lower = url.slice(0, 512).toLowerCase();
  if (lower.includes("model/gltf") || lower.includes("model/glb")) return "glb";
  if (lower.includes("model/stl")) return "stl";
  if (lower.includes("model/obj")) return "obj";
  if (lower.includes("model/fbx")) return "fbx";
  if (lower.includes("model/vnd.collada") || lower.includes("model/dae") || lower.includes("collada")) return "dae";

  try {
    const commaIndex = url.indexOf(",");
    if (commaIndex < 0) return "";
    const metadata = url.slice(0, commaIndex).toLowerCase();
    const payload = url.slice(commaIndex + 1, commaIndex + 12000);

    let sample = "";
    if (metadata.includes(";base64")) {
      const paddedPayload = payload.slice(0, payload.length - (payload.length % 4));
      sample = typeof atob === "function" ? atob(paddedPayload) : "";
    } else {
      sample = decodeURIComponent(payload);
    }

    const textSample = sample.slice(0, 4096).toLowerCase();
    if (textSample.startsWith("gltf") || textSample.includes("glb")) return "glb";
    if (textSample.includes("<collada") || textSample.includes("colladaschema")) return "dae";
    if (textSample.includes("<library_geometries") || textSample.includes("<library_nodes")) return "dae";
    if (textSample.includes("solid ") || textSample.includes("facet normal")) return "stl";
    if (textSample.includes("\nv ") && textSample.includes("\nf ")) return "obj";
  } catch {
    return "";
  }

  return "";
}

function inferModelFormat(url: string, explicitFormat?: string) {
  const sniffedDataUrlFormat = sniffDataUrlModelFormat(url);
  if (sniffedDataUrlFormat) return sniffedDataUrlFormat;

  const format = String(explicitFormat || "").toLowerCase().replace(".", "");
  if (format) return format;

  if (url.startsWith("data:")) return "glb";

  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.split(".").pop() || "glb";
}

function createBagastudioNeutralImportMaterial() {
  return new THREE.MeshStandardMaterial({
    name: "BagaStudio_Neutral_Import_Material",
    color: "#c8c8c8",
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
}

function hasUsableMaterial(material: THREE.Material | THREE.Material[] | undefined | null) {
  if (!material) return false;
  if (Array.isArray(material)) return material.length > 0 && material.every(Boolean);
  return Boolean(material);
}

function shouldUseNeutralImportMaterial(format?: string | null) {
  const normalizedFormat = String(format || "").toLowerCase();
  return ["dae", "obj", "fbx", "stl"].includes(normalizedFormat);
}

function materialLooksInvisible(material: THREE.Material | THREE.Material[] | undefined | null) {
  if (!material) return true;

  const materials = Array.isArray(material) ? material : [material];

  if (materials.length === 0) return true;

  return materials.some((mat: any) => {
    if (!mat) return true;
    if (typeof mat.opacity === "number" && mat.opacity <= 0.02) return true;
    if (mat.visible === false) return true;
    return false;
  });
}

function prepareBagastudioImportedObject(root: THREE.Object3D, format?: string | null) {
  const forceNeutral = shouldUseNeutralImportMaterial(format);

  root.visible = true;
  root.updateMatrixWorld(true);

  root.traverse((child) => {
    child.visible = true;
    child.frustumCulled = false;
    child.updateMatrixWorld(true);

    const mesh = child as THREE.Mesh;

    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.visible = true;

    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();

      if (!mesh.geometry.attributes.normal) {
        mesh.geometry.computeVertexNormals();
      }
    }

    if (forceNeutral || !hasUsableMaterial(mesh.material) || materialLooksInvisible(mesh.material)) {
      mesh.material = createBagastudioNeutralImportMaterial();
    }

    const apply = (mat: THREE.Material) => {
      mat.side = THREE.DoubleSide;
      mat.visible = true;
      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else if (mesh.material) apply(mesh.material as THREE.Material);
  });

  root.updateMatrixWorld(true);
}

function forcePreviewMaterials(root: THREE.Object3D, format?: string | null) {
  prepareBagastudioImportedObject(root, format);
}


function buildBagastudioColladaRuntimeRoot(colladaScene: THREE.Object3D) {
  // BagaStudio V6.8 - Spazio3D DAE Hierarchy Loader
  // Spazio3D exports a real COLLADA node hierarchy (Cabinet -> panels -> hardware groups).
  // Do NOT bake each mesh with matrixWorld and do NOT reset transforms: that destroys
  // parent/child offsets, pivots, instance_node placement and makes the furniture appear
  // as a few overlapping boards. Keep the original hierarchy and only tag meshes.
  const daeRoot = colladaScene.clone(true);
  daeRoot.name = colladaScene.name || "Imported_DAE";
  daeRoot.visible = true;
  daeRoot.userData = {
    ...colladaScene.userData,
    bagastudioImportedFormat: "dae",
    bagastudioSourceType: "collada",
    bagastudioTransformMode: "hierarchy-preserved",
    bagastudioPreserveHierarchy: true,
  };

  let meshIndex = 0;

  daeRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    meshIndex += 1;
    mesh.visible = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    if (!mesh.name || mesh.name.trim() === "") {
      mesh.name = mesh.parent?.name || `dae_part_${meshIndex}`;
    }

    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    const originalName = mesh.name || "";
    const parentName = mesh.parent?.name || "";
    const normalizedName = `${originalName} ${parentName}`.toLowerCase();
    const isRuntimeHardware =
      normalizedName.includes("cerniera") ||
      normalizedName.includes("basetta") ||
      normalizedName.includes("maniglia") ||
      normalizedName.includes("cerchio") ||
      normalizedName.includes("hardware") ||
      normalizedName.includes("ironware");

    mesh.userData = {
      ...mesh.userData,
      bagastudioImportedFormat: "dae",
      bagastudioSelectable: true,
      bagastudioRuntimeComponent: true,
      bagastudioRuntimeKind: isRuntimeHardware ? "hardware" : "panel",
      bagastudioOriginalName: originalName,
      bagastudioParentName: parentName,
      bagastudioPreservedLocalTransform: true,
    };

    if (!hasUsableMaterial(mesh.material) || materialLooksInvisible(mesh.material)) {
      mesh.material = createBagastudioNeutralImportMaterial();
    }

    const apply = (mat: THREE.Material) => {
      mat.side = THREE.DoubleSide;
      mat.visible = true;
      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else if (mesh.material) apply(mesh.material as THREE.Material);
  });

  daeRoot.updateMatrixWorld(true);
  return daeRoot;
}

function getBagastudioImportedDisplayScale(root: THREE.Object3D | null, format?: string | null) {
  if (!root) return 1;

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return 1;

  // BagaStudio Viewer UX V6.5:
  // GLB generati da DAE/Spazio3D arrivano spesso già normalizzati oppure in unità non coerenti.
  // Prima i GLB venivano forzati a 0.01 e il prodotto risultava praticamente invisibile.
  const targetDimension = 8;
  const scale = targetDimension / maxDimension;

  return THREE.MathUtils.clamp(scale, 0.01, 100);
}


type BagaStudioRuntimeComponent = {
  id: string;
  partId?: string;
  index: number;
  meshName: string;
  originalName: string;
  displayName: string;
  materialGroup: string;
  category?: string;
  componentType?: string;
  tags?: string[];
  runtimeMetadata?: Record<string, any>;
  configuratorBridge?: Record<string, any>;
  supportsMaterial: boolean;
  supportsLED: boolean;
  supportsInsert: boolean;
  supportsAccessories?: boolean;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
};



type BagaStudioAdminMappingEntry = {
  partId: string;
  meshName: string;
  originalName: string;
  displayName: string;
  customerName: string;
  materialGroup: string;
  category: string;
  supportsMaterial: boolean;
  supportsLED: boolean;
  supportsInsert: boolean;
  supportsAccessories: boolean;
  visible: boolean;
  locked: boolean;
};

type BagaStudioAdminMappingPackage = {
  schema: "bagastudio.adminMapping.v1";
  createdAt: string;
  sourceFormat: string;
  componentCount: number;
  mappings: BagaStudioAdminMappingEntry[];
};

type BagaStudioProductPackage = {
  schema: "bagastudio.productPackage.v1";
  createdAt: string;
  sourceFormat: string;
  product: {
    id: string;
    name: string;
    modelFile: string;
  };
  importer: {
    canExportGlb: boolean;
    normalized: boolean;
    componentCount: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  components: BagaStudioRuntimeComponent[];
  reconstructedParts?: BagaStudioRuntimeComponent[];
  geometryCompletion?: {
    status?: string;
    daeMeshCount?: number;
    s3dComponentCount?: number;
    matchedCount?: number;
    missingCount?: number;
    missingParts?: BagaStudioRuntimeComponent[];
    reconstructedParts?: BagaStudioRuntimeComponent[];
  };
  materials: Record<string, string>;
  accessories: Record<string, unknown[]>;
  led: Record<string, { enabled: boolean; kelvin?: number; intensity?: number }>;
  inserts: Record<string, unknown>;
};

type BagaStudioValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  partId?: string;
};

type BagaStudioValidationResult = {
  valid: boolean;
  errors: BagaStudioValidationIssue[];
  warnings: BagaStudioValidationIssue[];
  componentCount: number;
  checkedAt: string;
};


type BagaStudioImporterReport = {
  schema: "bagastudio.importerReport.v1";
  createdAt: string;
  sourceFormat: string;
  status: "ready" | "warning" | "error";
  summary: {
    componentCount: number;
    errorCount: number;
    warningCount: number;
    canExportGlb: boolean;
    normalized: boolean;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  components: Array<{
    partId: string;
    meshName: string;
    displayName: string;
    materialGroup: string;
    supportsMaterial: boolean;
    supportsLED: boolean;
    supportsInsert: boolean;
    bounds: {
      width: number;
      height: number;
      depth: number;
    };
  }>;
  issues: BagaStudioValidationIssue[];
  recommendedActions: string[];
};

type BagaStudioImporterHistoryEntry = {
  id: string;
  createdAt: string;
  sourceFormat: string;
  status: "ready" | "warning" | "error";
  componentCount: number;
  productPackage?: BagaStudioProductPackage;
  adminMapping?: BagaStudioAdminMappingPackage;
  importerReport?: BagaStudioImporterReport;
};


type BagaStudioCompatibilityGuardResult = {
  schema: "bagastudio.importerCompatibilityGuard.v1";
  checkedAt: string;
  status: "ready" | "warning" | "error";
  canApply: boolean;
  sceneComponentCount: number;
  packageComponentCount: number;
  adminMappingCount: number;
  matchedComponentCount: number;
  unmatchedPackagePartIds: string[];
  unmatchedScenePartIds: string[];
  missingAdminMappingPartIds: string[];
  duplicateScenePartIds: string[];
  issues: BagaStudioValidationIssue[];
};

type BagaStudioSafeApplyResult = {
  schema: "bagastudio.importerSafeApply.v1";
  appliedAt: string;
  target: "productPackage" | "adminMapping" | "both";
  status: "applied" | "blocked" | "rolled_back";
  compatibility: BagaStudioCompatibilityGuardResult;
  rollbackAvailable: boolean;
  message: string;
};


function buildFriendlyComponentName(rawName: string, index: number) {
  const fallback = `Pezzo ${String(index).padStart(3, "0")}`;
  const cleaned = String(rawName || "")
    .replace(/^mesh[_\-\s]*/i, "")
    .replace(/^object[_\-\s]*/i, "")
    .replace(/^node[_\-\s]*/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sanitizeComponentId(rawName: string, index: number) {
  const base = String(rawName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/\-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return base || `part_${String(index).padStart(3, "0")}`;
}


function buildImportedProductPackage(root: THREE.Object3D, format?: string): BagaStudioProductPackage {
  const components = (root.userData?.bagastudioRuntimeComponents || []) as BagaStudioRuntimeComponent[];
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const sourceFormat = String(format || root.userData?.bagastudioImporterFormat || "unknown").toLowerCase();
  const createdAt = new Date().toISOString();

  return {
    schema: "bagastudio.productPackage.v1",
    createdAt,
    sourceFormat,
    product: {
      id: `imported_${sourceFormat}_${Date.now()}`,
      name: `Prodotto importato ${sourceFormat.toUpperCase()}`,
      modelFile: `bagastudio-import-${sourceFormat}-clean.glb`,
    },
    importer: {
      canExportGlb: true,
      normalized: true,
      componentCount: components.length,
    },
    dimensions: {
      width: Number(size.x.toFixed(4)),
      height: Number(size.y.toFixed(4)),
      depth: Number(size.z.toFixed(4)),
    },
    components,
    materials: {},
    accessories: {},
    led: components.reduce<Record<string, { enabled: boolean; kelvin?: number; intensity?: number }>>((acc, component) => {
      acc[component.id] = { enabled: false };
      return acc;
    }, {}),
    inserts: {},
  };
}

function prepareImportedProductPackage(root: THREE.Object3D, format?: string) {
  const productPackage = buildImportedProductPackage(root, format);
  const validation = validateProductPackage(productPackage, root);
  const importerReport = buildImporterReport(productPackage, validation, root);
  root.userData.bagastudioProductPackage = productPackage;
  root.userData.bagastudioProductPackageValidation = validation;
  root.userData.bagastudioImporterReport = importerReport;

  if (typeof window === "undefined") return productPackage;

  const cleanFormat = String(format || "model").toLowerCase();
  const filename = `bagastudio-product-package-${cleanFormat}.json`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetLastProductPackage?: () => BagaStudioProductPackage | undefined;
    bagastudioGetLastImporterReport?: () => BagaStudioImporterReport | undefined;
    bagastudioDownloadLastImporterReport?: () => void;
    bagastudioDownloadLastProductPackage?: () => void;
    bagastudioImportProductPackage?: (input: BagaStudioProductPackage | string) => BagaStudioProductPackage | undefined;
    bagastudioApplyLastProductPackage?: () => BagaStudioProductPackage | undefined;
    bagastudioSafeApplyLastProductPackage?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyImporterState?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioRollbackLastImporterSafeApply?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioValidateLastProductPackage?: () => BagaStudioValidationResult | undefined;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;
  bagastudioWindow.__bagastudioLastProductPackage = productPackage;
  bagastudioWindow.__bagastudioLastImporterReport = importerReport;
  prepareAdminMappingBridge(root, productPackage);
  prepareImporterUiBridge(root);
  prepareImporterHistoryBridge(root);
  prepareImporterCompatibilityGuardBridge(root);
  prepareImporterSafeApplyBridge(root);
  bagastudioWindow.bagastudioGetLastProductPackage = () => bagastudioWindow.__bagastudioLastProductPackage || productPackage;
  bagastudioWindow.bagastudioGetLastImporterReport = () => bagastudioWindow.__bagastudioLastImporterReport || importerReport;
  bagastudioWindow.bagastudioDownloadLastImporterReport = () => {
    const currentReport = bagastudioWindow.__bagastudioLastImporterReport || importerReport;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, `bagastudio-importer-report-${cleanFormat}.json`);
  };
  bagastudioWindow.bagastudioValidateLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage || productPackage;
    const validation = validateProductPackage(currentPackage, root);
    const report = buildImporterReport(currentPackage, validation, root);
    bagastudioWindow.__bagastudioLastImporterReport = report;
    root.userData.bagastudioImporterReport = report;

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-validation", {
        detail: { validation, productPackage: currentPackage, importerReport: report },
      })
    );

    return validation;
  };
  bagastudioWindow.bagastudioDownloadLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage || productPackage;
    const blob = new Blob([JSON.stringify(currentPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, filename);
  };

  bagastudioWindow.bagastudioImportProductPackage = (input) => {
    try {
      const importedPackage = parseProductPackageInput(input);
      const validation = validateProductPackage(importedPackage, root);

      if (!validation.valid) {
        throw new Error(`Invalid Product Package: ${validation.errors.map((issue) => issue.message).join(" | ")}`);
      }

      const report = buildImporterReport(importedPackage, validation, root);
      root.userData.bagastudioProductPackageValidation = validation;
      root.userData.bagastudioImporterReport = report;
      bagastudioWindow.__bagastudioLastProductPackage = importedPackage;
      bagastudioWindow.__bagastudioLastImporterReport = report;
      root.userData.bagastudioProductPackage = importedPackage;
      applyProductPackageToImportedRoot(root, importedPackage);

      prepareImporterUiBridge(root);
      window.dispatchEvent(
        new CustomEvent("bagastudio:product-package-imported", {
          detail: {
            productPackage: importedPackage,
            componentCount: importedPackage.importer.componentCount,
            validation,
            importerReport: report,
          },
        })
      );

      return importedPackage;
    } catch (error) {
      console.error("BagaStudio Importer: Product Package import failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:product-package-import-error", {
          detail: { error },
        })
      );
      return undefined;
    }
  };

  bagastudioWindow.bagastudioApplyLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage;
    if (!currentPackage) return undefined;

    applyProductPackageToImportedRoot(root, currentPackage);

    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-applied", {
        detail: { productPackage: currentPackage },
      })
    );

    return currentPackage;
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-product-package-ready", {
      detail: {
        filename,
        productPackage,
        componentCount: productPackage.components.length,
        validation,
        importerReport,
      },
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-report-ready", {
      detail: {
        importerReport,
        status: importerReport.status,
        componentCount: importerReport.summary.componentCount,
        errorCount: importerReport.summary.errorCount,
        warningCount: importerReport.summary.warningCount,
      },
    })
  );

  return productPackage;
}


function buildAdminMappingPackage(productPackage: BagaStudioProductPackage): BagaStudioAdminMappingPackage {
  return {
    schema: "bagastudio.adminMapping.v1",
    createdAt: new Date().toISOString(),
    sourceFormat: productPackage.sourceFormat,
    componentCount: productPackage.components.length,
    mappings: productPackage.components.map((component) => ({
      partId: component.id,
      meshName: component.meshName,
      originalName: component.originalName,
      displayName: component.displayName,
      customerName: component.displayName,
      materialGroup: component.materialGroup || "default",
      category: "component",
      supportsMaterial: component.supportsMaterial,
      supportsLED: component.supportsLED,
      supportsInsert: component.supportsInsert,
      supportsAccessories: true,
      visible: true,
      locked: false,
    })),
  };
}

function prepareAdminMappingBridge(root: THREE.Object3D, productPackage: BagaStudioProductPackage) {
  const adminMapping = buildAdminMappingPackage(productPackage);
  root.userData.bagastudioAdminMapping = adminMapping;

  if (typeof window === "undefined") return adminMapping;

  const filename = `bagastudio-admin-mapping-${productPackage.sourceFormat || "model"}.json`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    bagastudioGetLastAdminMapping?: () => BagaStudioAdminMappingPackage | undefined;
    bagastudioDownloadLastAdminMapping?: () => void;
    bagastudioUpdateLastAdminMappingEntry?: (partId: string, patch: Partial<BagaStudioAdminMappingEntry>) => BagaStudioAdminMappingPackage | undefined;
    bagastudioImportAdminMapping?: (input: BagaStudioAdminMappingPackage | string) => BagaStudioAdminMappingPackage | undefined;
    bagastudioApplyLastAdminMapping?: () => BagaStudioRuntimeComponent[] | undefined;
    bagastudioSafeApplyLastAdminMapping?: () => BagaStudioSafeApplyResult | undefined;
  };

  bagastudioWindow.__bagastudioLastAdminMapping = adminMapping;
  bagastudioWindow.bagastudioGetLastAdminMapping = () => bagastudioWindow.__bagastudioLastAdminMapping;
  bagastudioWindow.bagastudioDownloadLastAdminMapping = () => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping || adminMapping;
    const blob = new Blob([JSON.stringify(currentMapping, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, filename);
  };

  bagastudioWindow.bagastudioUpdateLastAdminMappingEntry = (partId, patch) => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping || adminMapping;
    const nextMapping: BagaStudioAdminMappingPackage = {
      ...currentMapping,
      mappings: currentMapping.mappings.map((entry) =>
        entry.partId === partId ? { ...entry, ...patch, partId: entry.partId } : entry
      ),
    };

    bagastudioWindow.__bagastudioLastAdminMapping = nextMapping;
    root.userData.bagastudioAdminMapping = nextMapping;
    applyAdminMappingToImportedRoot(root, nextMapping);

    window.dispatchEvent(
      new CustomEvent("bagastudio:admin-mapping-updated", {
        detail: { partId, patch, adminMapping: nextMapping },
      })
    );

    return nextMapping;
  };

  bagastudioWindow.bagastudioImportAdminMapping = (input) => {
    try {
      const importedMapping = parseAdminMappingInput(input);
      bagastudioWindow.__bagastudioLastAdminMapping = importedMapping;
      root.userData.bagastudioAdminMapping = importedMapping;
      const components = applyAdminMappingToImportedRoot(root, importedMapping);

      prepareImporterUiBridge(root);
      window.dispatchEvent(
        new CustomEvent("bagastudio:admin-mapping-imported", {
          detail: {
            adminMapping: importedMapping,
            componentCount: importedMapping.componentCount,
            components,
          },
        })
      );

      return importedMapping;
    } catch (error) {
      console.error("BagaStudio Importer: Admin Mapping import failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:admin-mapping-import-error", {
          detail: { error },
        })
      );
      return undefined;
    }
  };

  bagastudioWindow.bagastudioApplyLastAdminMapping = () => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping;
    if (!currentMapping) return undefined;

    const components = applyAdminMappingToImportedRoot(root, currentMapping);

    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:admin-mapping-applied", {
        detail: { adminMapping: currentMapping, components },
      })
    );

    return components;
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:admin-mapping-ready", {
      detail: {
        filename,
        adminMapping,
        componentCount: adminMapping.componentCount,
      },
    })
  );

  return adminMapping;
}


function applyAdminMappingToImportedRoot(root: THREE.Object3D, adminMapping: BagaStudioAdminMappingPackage) {
  const mappingByPartId = new Map(adminMapping.mappings.map((entry) => [entry.partId, entry]));
  const mappingByMeshName = new Map(adminMapping.mappings.map((entry) => [entry.meshName, entry]));

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "");
    const entry = mappingByPartId.get(partId) || mappingByMeshName.get(mesh.name);
    if (!entry) return;

    mesh.userData.bagastudioPartId = entry.partId;
    mesh.userData.bagastudioMeshName = entry.meshName;
    mesh.userData.bagastudioDisplayName = entry.customerName || entry.displayName;
    mesh.userData.bagastudioMaterialGroup = entry.materialGroup;
    mesh.userData.bagastudioCategory = entry.category;
    mesh.userData.bagastudioSupportsMaterial = entry.supportsMaterial;
    mesh.userData.bagastudioSupportsLED = entry.supportsLED;
    mesh.userData.bagastudioSupportsInsert = entry.supportsInsert;
    mesh.userData.bagastudioSupportsAccessories = entry.supportsAccessories;
    mesh.userData.bagastudioVisible = entry.visible;
    mesh.userData.bagastudioLocked = entry.locked;
  });

  root.userData.bagastudioAdminMapping = adminMapping;
  root.userData.bagastudioAdminMappingAppliedAt = new Date().toISOString();

  const runtimeComponents = (root.userData?.bagastudioRuntimeComponents || []) as BagaStudioRuntimeComponent[];
  root.userData.bagastudioRuntimeComponents = runtimeComponents.map((component) => {
    const entry = mappingByPartId.get(component.id) || mappingByMeshName.get(component.meshName);
    if (!entry) return component;

    return {
      ...component,
      displayName: entry.customerName || entry.displayName || component.displayName,
      materialGroup: entry.materialGroup || component.materialGroup,
      supportsMaterial: entry.supportsMaterial,
      supportsLED: entry.supportsLED,
      supportsInsert: entry.supportsInsert,
    };
  });

  return root.userData.bagastudioRuntimeComponents as BagaStudioRuntimeComponent[];
}

function parseAdminMappingInput(input: BagaStudioAdminMappingPackage | string) {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;

  if (!parsed || parsed.schema !== "bagastudio.adminMapping.v1" || !Array.isArray(parsed.mappings)) {
    throw new Error("Invalid BagaStudio Admin Mapping package");
  }

  return parsed as BagaStudioAdminMappingPackage;
}

function validateProductPackage(productPackage: BagaStudioProductPackage, root?: THREE.Object3D): BagaStudioValidationResult {
  const errors: BagaStudioValidationIssue[] = [];
  const warnings: BagaStudioValidationIssue[] = [];

  const pushIssue = (
    level: "error" | "warning",
    code: string,
    message: string,
    partId?: string
  ) => {
    const issue: BagaStudioValidationIssue = { level, code, message, partId };
    if (level === "error") errors.push(issue);
    else warnings.push(issue);
  };

  if (!productPackage || productPackage.schema !== "bagastudio.productPackage.v1") {
    pushIssue("error", "invalid_schema", "Schema Product Package non valido");
  }

  if (!Array.isArray(productPackage.components)) {
    pushIssue("error", "missing_components", "Lista componenti mancante o non valida");
  }

  const components = Array.isArray(productPackage.components) ? productPackage.components : [];
  const seenIds = new Set<string>();
  const seenMeshNames = new Set<string>();

  components.forEach((component, index) => {
    const fallbackPartId = `index_${index}`;
    const partId = String(component?.id || "").trim();
    const meshName = String(component?.meshName || "").trim();

    if (!partId) {
      pushIssue("error", "missing_part_id", `Componente ${index + 1} senza partId`, fallbackPartId);
    } else if (seenIds.has(partId)) {
      pushIssue("error", "duplicate_part_id", `partId duplicato: ${partId}`, partId);
    } else {
      seenIds.add(partId);
    }

    if (!meshName) {
      pushIssue("warning", "missing_mesh_name", `Componente ${partId || index + 1} senza meshName`, partId || fallbackPartId);
    } else if (seenMeshNames.has(meshName)) {
      pushIssue("warning", "duplicate_mesh_name", `meshName duplicato: ${meshName}`, partId || fallbackPartId);
    } else {
      seenMeshNames.add(meshName);
    }

    if (!String(component?.displayName || "").trim()) {
      pushIssue("warning", "missing_display_name", `Nome cliente mancante per ${partId || index + 1}`, partId || fallbackPartId);
    }

    const bounds = component?.bounds;
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || !Number.isFinite(bounds.depth)) {
      pushIssue("warning", "invalid_bounds", `Dimensioni componente non valide per ${partId || index + 1}`, partId || fallbackPartId);
    }
  });

  if (productPackage.importer?.componentCount !== components.length) {
    pushIssue(
      "warning",
      "component_count_mismatch",
      `Conteggio componenti non coerente: importer=${productPackage.importer?.componentCount ?? "n/d"}, reale=${components.length}`
    );
  }

  const ledKeys = Object.keys(productPackage.led || {});
  ledKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_led_config", `LED configurato su componente non presente: ${partId}`, partId);
    }
  });

  const materialKeys = Object.keys(productPackage.materials || {});
  materialKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_material_config", `Materiale configurato su componente non presente: ${partId}`, partId);
    }
  });

  const insertKeys = Object.keys(productPackage.inserts || {});
  insertKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_insert_config", `Inserto configurato su componente non presente: ${partId}`, partId);
    }
  });

  if (root) {
    const rootPartIds = new Set<string>();
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "").trim();
      if (partId) rootPartIds.add(partId);
    });

    components.forEach((component) => {
      if (component.id && !rootPartIds.has(component.id) && !rootPartIds.has(component.meshName)) {
        pushIssue("warning", "component_not_found_in_scene", `Componente non trovato nella scena corrente: ${component.id}`, component.id);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    componentCount: components.length,
    checkedAt: new Date().toISOString(),
  };
}

function buildImporterReport(
  productPackage: BagaStudioProductPackage,
  validation: BagaStudioValidationResult,
  root?: THREE.Object3D
): BagaStudioImporterReport {
  const dimensions = productPackage.dimensions || { width: 0, height: 0, depth: 0 };
  const issues = [...validation.errors, ...validation.warnings];
  const recommendedActions: string[] = [];

  if (validation.errors.length > 0) {
    recommendedActions.push("Correggere gli errori del Product Package prima di salvare il prodotto in catalogo.");
  }

  if (validation.warnings.some((issue) => issue.code === "missing_display_name")) {
    recommendedActions.push("Completare i nomi cliente-friendly dei componenti dal futuro Admin Panel.");
  }

  if (validation.warnings.some((issue) => issue.code === "invalid_bounds")) {
    recommendedActions.push("Verificare scala e dimensioni dei componenti importati.");
  }

  if (validation.warnings.some((issue) => issue.code === "component_not_found_in_scene")) {
    recommendedActions.push("Controllare che il mapping Admin corrisponda al modello attualmente caricato.");
  }

  if (productPackage.components.length === 0) {
    recommendedActions.push("Il modello non contiene mesh configurabili: verificare export sorgente o separazione componenti.");
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push("Package pronto per mapping Admin, export GLB e salvataggio in catalogo.");
  }

  if (root) {
    root.userData.bagastudioImporterReportGeneratedAt = new Date().toISOString();
  }

  return {
    schema: "bagastudio.importerReport.v1",
    createdAt: new Date().toISOString(),
    sourceFormat: productPackage.sourceFormat,
    status: validation.errors.length > 0 ? "error" : validation.warnings.length > 0 ? "warning" : "ready",
    summary: {
      componentCount: productPackage.components.length,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      canExportGlb: productPackage.importer?.canExportGlb === true,
      normalized: productPackage.importer?.normalized === true,
    },
    dimensions: {
      width: Number(dimensions.width || 0),
      height: Number(dimensions.height || 0),
      depth: Number(dimensions.depth || 0),
    },
    components: productPackage.components.map((component) => ({
      partId: component.id,
      meshName: component.meshName,
      displayName: component.displayName,
      materialGroup: component.materialGroup,
      supportsMaterial: component.supportsMaterial,
      supportsLED: component.supportsLED,
      supportsInsert: component.supportsInsert,
      bounds: component.bounds,
    })),
    issues,
    recommendedActions,
  };
}

function parseProductPackageInput(input: BagaStudioProductPackage | string) {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;

  if (!parsed || parsed.schema !== "bagastudio.productPackage.v1" || !Array.isArray(parsed.components)) {
    throw new Error("Invalid BagaStudio Product Package");
  }

  return parsed as BagaStudioProductPackage;
}



function bagastudioCreateRuntimeConfiguratorBridge(partId: string) {
  const stablePartId = String(partId || "").trim();

  return {
    schema: "bagastudio.configuratorBridge.v1",
    partId: stablePartId,
    materialKey: stablePartId,
    ledKey: stablePartId,
    insertKey: stablePartId,
    accessoryKey: stablePartId,
    visibilityKey: stablePartId,
    generatedAt: new Date().toISOString(),
  };
}

function bagastudioBuildRuntimeMetadataSummary(components: BagaStudioRuntimeComponent[], sourceFormat?: string) {
  const categories = components.reduce<Record<string, number>>((acc, component) => {
    const category = component.category || component.runtimeMetadata?.detectedCategory || component.materialGroup || "component";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return {
    schema: "bagastudio.runtimeMetadataSummary.v1",
    sourceFormat: sourceFormat || "product-package",
    componentCount: components.length,
    categories,
    generatedAt: new Date().toISOString(),
  };
}

function bagastudioNormalizeRuntimeComponentFromPackage(rawComponent: any, index: number, source: "geometry" | "reconstructed"): BagaStudioRuntimeComponent {
  const fallbackId = `${source}_${String(index + 1).padStart(3, "0")}`;
  const id = String(rawComponent?.id || rawComponent?.partId || rawComponent?.meshName || fallbackId);
  const meshName = String(rawComponent?.meshName || id);
  const displayName = String(rawComponent?.displayName || rawComponent?.customerName || rawComponent?.name || rawComponent?.originalName || meshName);
  const originalName = String(rawComponent?.originalName || rawComponent?.name || displayName);
  const materialGroup = String(rawComponent?.materialGroup || rawComponent?.category || "main");
  const category = String(rawComponent?.category || rawComponent?.runtimeMetadata?.detectedCategory || materialGroup || "component");
  const componentType = String(rawComponent?.componentType || rawComponent?.runtimeMetadata?.componentType || (source === "reconstructed" ? "reconstructed-placeholder" : category));
  const bounds = rawComponent?.bounds || { width: 0, height: 0, depth: 0 };

  return {
    id,
    partId: String(rawComponent?.partId || id),
    index: Number.isFinite(Number(rawComponent?.index)) ? Number(rawComponent.index) : index,
    meshName,
    originalName,
    displayName,
    materialGroup,
    category,
    componentType,
    tags: Array.isArray(rawComponent?.tags)
      ? rawComponent.tags
      : String(rawComponent?.tags || source)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    runtimeMetadata:
      rawComponent?.runtimeMetadata || {
        schema: "bagastudio.runtimeComponentMetadata.v1",
        detectedCategory: category,
        componentType,
        sourceFormat: source === "reconstructed" ? "space3d-reconstructed-placeholder" : "product-package",
        generatedAt: new Date().toISOString(),
        stablePartId: String(rawComponent?.partId || id),
        canReceiveMaterial: rawComponent?.supportsMaterial !== false,
        canReceiveAccessories: rawComponent?.supportsAccessories !== false,
        canReceiveLed: Boolean(rawComponent?.supportsLED ?? rawComponent?.compatibleLed ?? false),
        canReceiveInsert: Boolean(rawComponent?.supportsInsert ?? rawComponent?.compatibleInsert ?? false),
        bounds: {
          width: Number(bounds?.width || 0),
          height: Number(bounds?.height || 0),
          depth: Number(bounds?.depth || 0),
        },
        rawMeshName: meshName,
        originalName,
      },
    configuratorBridge: rawComponent?.configuratorBridge || bagastudioCreateRuntimeConfiguratorBridge(String(rawComponent?.partId || id)),
    supportsMaterial: rawComponent?.supportsMaterial !== false,
    supportsLED: Boolean(rawComponent?.supportsLED ?? rawComponent?.compatibleLed ?? false),
    supportsInsert: Boolean(rawComponent?.supportsInsert ?? rawComponent?.compatibleInsert ?? false),
    supportsAccessories: rawComponent?.supportsAccessories !== false,
    bounds: {
      width: Number(bounds?.width || 0),
      height: Number(bounds?.height || 0),
      depth: Number(bounds?.depth || 0),
    },
  };
}

function bagastudioGetMergedRuntimeComponents(productPackage: BagaStudioProductPackage): BagaStudioRuntimeComponent[] {
  const baseComponents = Array.isArray(productPackage.components) ? productPackage.components : [];
  const reconstructedCandidates = [
    ...(Array.isArray(productPackage.reconstructedParts) ? productPackage.reconstructedParts : []),
    ...(Array.isArray(productPackage.geometryCompletion?.reconstructedParts) ? productPackage.geometryCompletion?.reconstructedParts || [] : []),
    ...(Array.isArray(productPackage.geometryCompletion?.missingParts) ? productPackage.geometryCompletion?.missingParts || [] : []),
  ];

  const merged = [
    ...baseComponents.map((component, index) => bagastudioNormalizeRuntimeComponentFromPackage(component, index, "geometry")),
    ...reconstructedCandidates.map((component, index) =>
      bagastudioNormalizeRuntimeComponentFromPackage(component, baseComponents.length + index, "reconstructed")
    ),
  ];

  const seen = new Set<string>();
  return merged.filter((component) => {
    const key = String(component.id || component.partId || component.meshName || "").trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyProductPackageToImportedRoot(root: THREE.Object3D, productPackage: BagaStudioProductPackage) {
  const mergedRuntimeComponents = bagastudioGetMergedRuntimeComponents(productPackage);
  const componentsById = new Map(mergedRuntimeComponents.map((component) => [component.id, component]));
  const componentsByMeshName = new Map(mergedRuntimeComponents.map((component) => [component.meshName, component]));

  root.userData.bagastudioProductPackage = productPackage;
  root.userData.bagastudioProductPackageAppliedAt = new Date().toISOString();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "");
    const component = componentsById.get(partId) || componentsByMeshName.get(mesh.name);
    if (!component) return;

    mesh.userData.bagastudioPartId = component.id;
    mesh.userData.bagastudioMeshName = component.meshName;
    mesh.userData.bagastudioOriginalName = component.originalName;
    mesh.userData.bagastudioDisplayName = component.displayName;
    mesh.userData.bagastudioMaterialGroup = component.materialGroup;
    mesh.userData.bagastudioSupportsMaterial = component.supportsMaterial;
    mesh.userData.bagastudioSupportsLED = component.supportsLED;
    mesh.userData.bagastudioSupportsInsert = component.supportsInsert;
    mesh.userData.bagastudioRuntimeComponent = component;
  });

  root.userData.bagastudioRuntimeComponents = mergedRuntimeComponents;
  root.userData.bagastudioRuntimeMetadata = bagastudioBuildRuntimeMetadataSummary(mergedRuntimeComponents, productPackage.sourceFormat);
  root.userData.bagastudioRuntimeMergeReport = {
    schema: "bagastudio.runtimeMergeReport.v1",
    geometryComponents: Array.isArray(productPackage.components) ? productPackage.components.length : 0,
    reconstructedParts: Math.max(mergedRuntimeComponents.length - (Array.isArray(productPackage.components) ? productPackage.components.length : 0), 0),
    runtimeComponentCount: mergedRuntimeComponents.length,
    mergedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    (window as any).__bagastudioViewerRuntimeComponents = mergedRuntimeComponents;
    (window as any).__bagastudioViewerRuntimeMetadata = root.userData.bagastudioRuntimeMetadata;
    (window as any).__bagastudioViewerRuntimeMergeReport = root.userData.bagastudioRuntimeMergeReport;
    window.dispatchEvent(
      new CustomEvent("bagastudio:runtime-components-merged", {
        detail: {
          productPackage,
          components: mergedRuntimeComponents,
          mergeReport: root.userData.bagastudioRuntimeMergeReport,
        },
      })
    );
  }

  

/* =========================
   BagaStudio Catalog Browser V1
========================= */

function bagastudioNormalizeCatalogText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioSearchProductLibrary(query = "", filters: any = {}) {
  const library = bagastudioReadProductLibrary();
  const normalizedQuery = bagastudioNormalizeCatalogText(query);
  const categoryFilter = bagastudioNormalizeCatalogText(filters?.category || "");
  const sourceFormatFilter = bagastudioNormalizeCatalogText(filters?.sourceFormat || "");

  const results = library.filter((item: any) => {
    const searchableText = bagastudioNormalizeCatalogText([
      item?.name,
      item?.productId,
      item?.productSlug,
      item?.category,
      item?.version,
      item?.sourceFormat,
      item?.package?.metadata?.engine,
      item?.package?.metadata?.pipeline,
    ].filter(Boolean).join(" "));

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory =
      !categoryFilter || bagastudioNormalizeCatalogText(item?.category) === categoryFilter;
    const matchesSourceFormat =
      !sourceFormatFilter || bagastudioNormalizeCatalogText(item?.sourceFormat) === sourceFormatFilter;

    return matchesQuery && matchesCategory && matchesSourceFormat;
  });

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-search", {
      detail: {
        query,
        filters,
        count: results.length,
        results,
      },
    })
  );

  return results;
}

function bagastudioGetProductLibraryCategories() {
  const categories = bagastudioReadProductLibrary()
    .map((item: any) => item?.category || "uncategorized")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort((a: any, b: any) =>
    String(a).localeCompare(String(b))
  );
}

function bagastudioGetProductLibraryCardData(query = "", filters: any = {}) {
  return bagastudioSearchProductLibrary(query, filters).map((item: any) => ({
    productId: item?.productId,
    productSlug: item?.productSlug,
    name: item?.name || "BagaStudio Product",
    category: item?.category || "uncategorized",
    version: item?.version || "1.0.0",
    sourceFormat: item?.sourceFormat || null,
    savedAt: item?.savedAt || null,
    updatedAt: item?.updatedAt || null,
    thumbnail: item?.thumbnail || null,
    hasPackage: Boolean(item?.package),
    hasAdminMapping: Boolean(item?.package?.adminMapping || item?.package?.productPackage?.adminMapping),
    hasImporterReport: Boolean(item?.package?.importerReport),
  }));
}

function bagastudioImportProductLibrary(libraryJson: any, options: any = {}) {
  const incomingLibrary = Array.isArray(libraryJson)
    ? libraryJson
    : Array.isArray(libraryJson?.items)
      ? libraryJson.items
      : [];

  if (!incomingLibrary.length) {
    const error = new Error("Invalid BagaStudio product library import");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-import-error", {
        detail: error,
      })
    );

    throw error;
  }

  const currentLibrary = options?.replace ? [] : bagastudioReadProductLibrary();
  const currentByKey = new Map(
    currentLibrary.map((item: any) => [item?.productId || item?.productSlug, item])
  );

  incomingLibrary.forEach((item: any) => {
    const key = item?.productId || item?.productSlug || bagastudioCreateProductLibraryId(item?.name);
    currentByKey.set(key, {
      ...item,
      productId: item?.productId || key,
      productSlug:
        item?.productSlug ||
        String(item?.name || key)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      updatedAt: new Date().toISOString(),
    });
  });

  const nextLibrary = Array.from(currentByKey.values()).sort((a: any, b: any) =>
    String(b?.updatedAt || b?.savedAt || "").localeCompare(String(a?.updatedAt || a?.savedAt || ""))
  );

  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-imported", {
      detail: {
        replace: Boolean(options?.replace),
        count: incomingLibrary.length,
        library: nextLibrary,
      },
    })
  );

  return nextLibrary;
}



/* =========================
   BagaStudio Product Loader V1
========================= */

let __bagastudioPreparedLibraryProduct: any = null;

function bagastudioExtractProductRuntimePackage(libraryItem: any) {
  const fullPackage = libraryItem?.package || libraryItem || null;
  const productPackage = fullPackage?.productPackage || fullPackage || null;

  return {
    libraryItem,
    fullPackage,
    productPackage,
    adminMapping:
      fullPackage?.adminMapping ||
      productPackage?.adminMapping ||
      null,
    importerReport:
      fullPackage?.importerReport ||
      productPackage?.importerReport ||
      null,
    thumbnail:
      fullPackage?.thumbnail ||
      productPackage?.thumbnail ||
      libraryItem?.thumbnail ||
      null,
    metadata: {
      ...(fullPackage?.metadata || {}),
      ...(productPackage?.metadata || {}),
      productId: libraryItem?.productId || productPackage?.productId || null,
      productSlug: libraryItem?.productSlug || productPackage?.productSlug || null,
      productName: libraryItem?.name || productPackage?.productName || productPackage?.name || null,
      category: libraryItem?.category || productPackage?.productCategory || null,
      sourceFormat: libraryItem?.sourceFormat || productPackage?.sourceFormat || null,
    },
  };
}

function bagastudioPrepareProductFromLibrary(productIdOrSlug: string, options: any = {}) {
  const libraryItem = bagastudioLoadProductFromLibrary(productIdOrSlug);
  const prepared = bagastudioExtractProductRuntimePackage(libraryItem);

  __bagastudioPreparedLibraryProduct = {
    ...prepared,
    preparedAt: new Date().toISOString(),
    options,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-prepared", {
      detail: __bagastudioPreparedLibraryProduct,
    })
  );

  if (options?.autoApply) {
    return bagastudioApplyPreparedProduct(options);
  }

  return __bagastudioPreparedLibraryProduct;
}

function bagastudioApplyPreparedProduct(options: any = {}) {
  if (!__bagastudioPreparedLibraryProduct) {
    const error = new Error("No prepared BagaStudio product available");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-loader-apply-error", {
        detail: error,
      })
    );

    throw error;
  }

  const prepared = __bagastudioPreparedLibraryProduct;

  __bagastudioLastSavedPackage = prepared.fullPackage || null;
  (window as any).bagastudioProductPackage = prepared.productPackage || null;
  (window as any).bagastudioAdminMapping = prepared.adminMapping || null;
  (window as any).bagastudioLastImporterReport = prepared.importerReport || null;
  (window as any).__bagastudioLastProductThumbnail = prepared.thumbnail || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = prepared.libraryItem || null;

  const safeApply = (window as any).bagastudioSafeApplyImporterState;
  if (options?.safeApply && typeof safeApply === "function") {
    try {
      safeApply();
    } catch (error) {
      console.warn("BagaStudio Product Loader safe apply skipped", error);
    }
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-applied", {
      detail: prepared,
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-ui-state-refresh", {
      detail: prepared,
    })
  );

  return prepared;
}

function bagastudioGetPreparedProduct() {
  return __bagastudioPreparedLibraryProduct;
}

if (typeof window !== "undefined") {
    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-applied", {
        detail: {
          productPackage,
          componentCount: productPackage.components.length,
        },
      })
    );
  }

  return productPackage.components;
}

function analyzeImportedModelComponents(root: THREE.Object3D, format?: string) {
  const components: BagaStudioRuntimeComponent[] = [];
  const usedIds = new Map<string, number>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    if ((mesh.userData as any)?.bagastudioImportedSafeLed) return;
    if ((mesh.userData as any)?.bagastudioAccessory === true) return;
    if ((mesh.userData as any)?.bagastudioInsert === true) return;

    const index = components.length + 1;
    const originalName = String(mesh.name || "").trim();
    const baseId = sanitizeComponentId(originalName, index);
    const currentCount = usedIds.get(baseId) || 0;
    usedIds.set(baseId, currentCount + 1);

    const id = currentCount === 0
      ? baseId
      : `${baseId}_${String(currentCount + 1).padStart(2, "0")}`;

    if (!mesh.name || mesh.name.trim() === "" || mesh.name !== id) {
      mesh.name = id;
    }

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());

    const component: BagaStudioRuntimeComponent = {
      id,
      index,
      meshName: mesh.name,
      originalName,
      displayName: buildFriendlyComponentName(originalName || id, index),
      materialGroup: "default",
      supportsMaterial: true,
      supportsLED: true,
      supportsInsert: true,
      bounds: {
        width: Number(size.x.toFixed(4)),
        height: Number(size.y.toFixed(4)),
        depth: Number(size.z.toFixed(4)),
      },
    };

    mesh.userData.bagastudioPartId = component.id;
    mesh.userData.bagastudioMeshName = component.meshName;
    mesh.userData.bagastudioOriginalName = component.originalName;
    mesh.userData.bagastudioDisplayName = component.displayName;
    mesh.userData.bagastudioRuntimeComponent = component;

    components.push(component);
  });

  root.userData.bagastudioImporterFormat = format || "unknown";
  root.userData.bagastudioRuntimeComponents = components;

  

/* =========================
   BagaStudio Catalog Browser V1
========================= */

function bagastudioNormalizeCatalogText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioSearchProductLibrary(query = "", filters: any = {}) {
  const library = bagastudioReadProductLibrary();
  const normalizedQuery = bagastudioNormalizeCatalogText(query);
  const categoryFilter = bagastudioNormalizeCatalogText(filters?.category || "");
  const sourceFormatFilter = bagastudioNormalizeCatalogText(filters?.sourceFormat || "");

  const results = library.filter((item: any) => {
    const searchableText = bagastudioNormalizeCatalogText([
      item?.name,
      item?.productId,
      item?.productSlug,
      item?.category,
      item?.version,
      item?.sourceFormat,
      item?.package?.metadata?.engine,
      item?.package?.metadata?.pipeline,
    ].filter(Boolean).join(" "));

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory =
      !categoryFilter || bagastudioNormalizeCatalogText(item?.category) === categoryFilter;
    const matchesSourceFormat =
      !sourceFormatFilter || bagastudioNormalizeCatalogText(item?.sourceFormat) === sourceFormatFilter;

    return matchesQuery && matchesCategory && matchesSourceFormat;
  });

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-search", {
      detail: {
        query,
        filters,
        count: results.length,
        results,
      },
    })
  );

  return results;
}

function bagastudioGetProductLibraryCategories() {
  const categories = bagastudioReadProductLibrary()
    .map((item: any) => item?.category || "uncategorized")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort((a: any, b: any) =>
    String(a).localeCompare(String(b))
  );
}

function bagastudioGetProductLibraryCardData(query = "", filters: any = {}) {
  return bagastudioSearchProductLibrary(query, filters).map((item: any) => ({
    productId: item?.productId,
    productSlug: item?.productSlug,
    name: item?.name || "BagaStudio Product",
    category: item?.category || "uncategorized",
    version: item?.version || "1.0.0",
    sourceFormat: item?.sourceFormat || null,
    savedAt: item?.savedAt || null,
    updatedAt: item?.updatedAt || null,
    thumbnail: item?.thumbnail || null,
    hasPackage: Boolean(item?.package),
    hasAdminMapping: Boolean(item?.package?.adminMapping || item?.package?.productPackage?.adminMapping),
    hasImporterReport: Boolean(item?.package?.importerReport),
  }));
}

function bagastudioImportProductLibrary(libraryJson: any, options: any = {}) {
  const incomingLibrary = Array.isArray(libraryJson)
    ? libraryJson
    : Array.isArray(libraryJson?.items)
      ? libraryJson.items
      : [];

  if (!incomingLibrary.length) {
    const error = new Error("Invalid BagaStudio product library import");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-import-error", {
        detail: error,
      })
    );

    throw error;
  }

  const currentLibrary = options?.replace ? [] : bagastudioReadProductLibrary();
  const currentByKey = new Map(
    currentLibrary.map((item: any) => [item?.productId || item?.productSlug, item])
  );

  incomingLibrary.forEach((item: any) => {
    const key = item?.productId || item?.productSlug || bagastudioCreateProductLibraryId(item?.name);
    currentByKey.set(key, {
      ...item,
      productId: item?.productId || key,
      productSlug:
        item?.productSlug ||
        String(item?.name || key)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      updatedAt: new Date().toISOString(),
    });
  });

  const nextLibrary = Array.from(currentByKey.values()).sort((a: any, b: any) =>
    String(b?.updatedAt || b?.savedAt || "").localeCompare(String(a?.updatedAt || a?.savedAt || ""))
  );

  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-imported", {
      detail: {
        replace: Boolean(options?.replace),
        count: incomingLibrary.length,
        library: nextLibrary,
      },
    })
  );

  return nextLibrary;
}



/* =========================
   BagaStudio Product Loader V1
========================= */

let __bagastudioPreparedLibraryProduct: any = null;

function bagastudioExtractProductRuntimePackage(libraryItem: any) {
  const fullPackage = libraryItem?.package || libraryItem || null;
  const productPackage = fullPackage?.productPackage || fullPackage || null;

  return {
    libraryItem,
    fullPackage,
    productPackage,
    adminMapping:
      fullPackage?.adminMapping ||
      productPackage?.adminMapping ||
      null,
    importerReport:
      fullPackage?.importerReport ||
      productPackage?.importerReport ||
      null,
    thumbnail:
      fullPackage?.thumbnail ||
      productPackage?.thumbnail ||
      libraryItem?.thumbnail ||
      null,
    metadata: {
      ...(fullPackage?.metadata || {}),
      ...(productPackage?.metadata || {}),
      productId: libraryItem?.productId || productPackage?.productId || null,
      productSlug: libraryItem?.productSlug || productPackage?.productSlug || null,
      productName: libraryItem?.name || productPackage?.productName || productPackage?.name || null,
      category: libraryItem?.category || productPackage?.productCategory || null,
      sourceFormat: libraryItem?.sourceFormat || productPackage?.sourceFormat || null,
    },
  };
}

function bagastudioPrepareProductFromLibrary(productIdOrSlug: string, options: any = {}) {
  const libraryItem = bagastudioLoadProductFromLibrary(productIdOrSlug);
  const prepared = bagastudioExtractProductRuntimePackage(libraryItem);

  __bagastudioPreparedLibraryProduct = {
    ...prepared,
    preparedAt: new Date().toISOString(),
    options,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-prepared", {
      detail: __bagastudioPreparedLibraryProduct,
    })
  );

  if (options?.autoApply) {
    return bagastudioApplyPreparedProduct(options);
  }

  return __bagastudioPreparedLibraryProduct;
}

function bagastudioApplyPreparedProduct(options: any = {}) {
  if (!__bagastudioPreparedLibraryProduct) {
    const error = new Error("No prepared BagaStudio product available");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-loader-apply-error", {
        detail: error,
      })
    );

    throw error;
  }

  const prepared = __bagastudioPreparedLibraryProduct;

  __bagastudioLastSavedPackage = prepared.fullPackage || null;
  (window as any).bagastudioProductPackage = prepared.productPackage || null;
  (window as any).bagastudioAdminMapping = prepared.adminMapping || null;
  (window as any).bagastudioLastImporterReport = prepared.importerReport || null;
  (window as any).__bagastudioLastProductThumbnail = prepared.thumbnail || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = prepared.libraryItem || null;

  const safeApply = (window as any).bagastudioSafeApplyImporterState;
  if (options?.safeApply && typeof safeApply === "function") {
    try {
      safeApply();
    } catch (error) {
      console.warn("BagaStudio Product Loader safe apply skipped", error);
    }
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-applied", {
      detail: prepared,
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-ui-state-refresh", {
      detail: prepared,
    })
  );

  return prepared;
}

function bagastudioGetPreparedProduct() {
  return __bagastudioPreparedLibraryProduct;
}

if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-components-analyzed", {
        detail: {
          format: format || "unknown",
          count: components.length,
          components,
        },
      })
    );
  }

  return components;
}


function prepareImportedModelGlbExporter(root: THREE.Object3D, format?: string) {
  root.userData.bagastudioCanExportGlb = true;
  root.userData.bagastudioExportSourceFormat = format || "unknown";

  if (typeof window === "undefined") return;

  const cleanFormat = String(format || "model").toLowerCase();
  const filename = `bagastudio-import-${cleanFormat}-clean.glb`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    bagastudioExportLastImportAsGLB?: () => void;
    bagastudioDownloadLastImportAsGLB?: () => void;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;
  prepareImporterUiBridge(root);

  bagastudioWindow.bagastudioExportLastImportAsGLB = () => {
    exportImportedModelAsGLB(root, filename, false);
  };

  bagastudioWindow.bagastudioDownloadLastImportAsGLB = () => {
    exportImportedModelAsGLB(root, filename, true);
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-glb-exporter-ready", {
      detail: {
        format: format || "unknown",
        filename,
        canExportGlb: true,
        canDownloadGlb: true,
      },
    })
  );
}

function downloadGeneratedGlb(url: string, filename: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadJsonFile(url: string, filename: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function prepareImporterUiBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetImporterUiState?: () => {
      hasImportedModel: boolean;
      hasProductPackage: boolean;
      hasAdminMapping: boolean;
      hasImporterReport: boolean;
      sourceFormat?: string;
      componentCount: number;
      status: "idle" | "ready" | "warning" | "error";
      canDownloadGlb: boolean;
      canDownloadProductPackage: boolean;
      canDownloadAdminMapping: boolean;
      canDownloadImporterReport: boolean;
      canDownloadCompletePackage: boolean;
      productPackage?: BagaStudioProductPackage;
      adminMapping?: BagaStudioAdminMappingPackage;
      importerReport?: BagaStudioImporterReport;
    };
    bagastudioRefreshImporterUiState?: () => void;
    bagastudioDownloadImporterCompletePackage?: () => void;
    bagastudioDownloadImporterJsonBundle?: () => void;
    bagastudioDownloadLastImportAsGLB?: () => void;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;

  const buildUiState = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const components = (root.userData?.bagastudioRuntimeComponents || productPackage?.components || []) as BagaStudioRuntimeComponent[];
    const status = importerReport?.status || (components.length > 0 ? "ready" : "idle");

    return {
      hasImportedModel: true,
      hasProductPackage: Boolean(productPackage),
      hasAdminMapping: Boolean(adminMapping),
      hasImporterReport: Boolean(importerReport),
      sourceFormat: String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || "unknown"),
      componentCount: components.length,
      status,
      canDownloadGlb: Boolean(root.userData?.bagastudioCanExportGlb),
      canDownloadProductPackage: Boolean(productPackage),
      canDownloadAdminMapping: Boolean(adminMapping),
      canDownloadImporterReport: Boolean(importerReport),
      canDownloadCompletePackage: Boolean(productPackage || adminMapping || importerReport || root.userData?.bagastudioCanExportGlb),
      productPackage,
      adminMapping,
      importerReport,
    };
  };

  bagastudioWindow.bagastudioGetImporterUiState = buildUiState;

  bagastudioWindow.bagastudioRefreshImporterUiState = () => {
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-ui-state", {
        detail: buildUiState(),
      })
    );
  };

  bagastudioWindow.bagastudioDownloadImporterJsonBundle = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || "model").toLowerCase();

    const bundle = {
      schema: "bagastudio.importer.bundle.v1",
      createdAt: new Date().toISOString(),
      sourceFormat,
      productPackage: productPackage || null,
      adminMapping: adminMapping || null,
      importerReport: importerReport || null,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, `bagastudio-importer-bundle-${sourceFormat}.json`);

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-json-bundle-downloaded", {
        detail: bundle,
      })
    );
  };

  bagastudioWindow.bagastudioDownloadImporterCompletePackage = () => {
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || "model").toLowerCase();

    if (typeof bagastudioWindow.bagastudioDownloadLastImportAsGLB === "function") {
      bagastudioWindow.bagastudioDownloadLastImportAsGLB();
    } else {
      exportImportedModelAsGLB(root, `bagastudio-import-clean-${sourceFormat}.glb`, true);
    }

    bagastudioWindow.bagastudioDownloadImporterJsonBundle?.();

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-complete-package-downloaded", {
        detail: bagastudioWindow.bagastudioGetImporterUiState?.(),
      })
    );
  };

  bagastudioWindow.bagastudioRefreshImporterUiState();
}

function getImporterScenePartIds(root: THREE.Object3D) {
  const partIds: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((mesh.userData as any)?.bagastudioImportedSafeLed) return;
    if ((mesh.userData as any)?.bagastudioAccessory === true) return;
    if ((mesh.userData as any)?.bagastudioInsert === true) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "").trim();
    if (!partId) return;

    if (seen.has(partId)) duplicates.push(partId);
    seen.add(partId);
    partIds.push(partId);
  });

  return { partIds, duplicates };
}

function buildImporterCompatibilityGuard(
  root: THREE.Object3D,
  productPackage?: BagaStudioProductPackage,
  adminMapping?: BagaStudioAdminMappingPackage
): BagaStudioCompatibilityGuardResult {
  const issues: BagaStudioValidationIssue[] = [];
  const sceneInfo = getImporterScenePartIds(root);
  const scenePartIds = new Set(sceneInfo.partIds);
  const packageComponents = Array.isArray(productPackage?.components) ? productPackage!.components : [];
  const packagePartIds = new Set(packageComponents.map((component) => String(component.id || "").trim()).filter(Boolean));
  const adminMappings = Array.isArray(adminMapping?.mappings) ? adminMapping!.mappings : [];
  const adminPartIds = new Set(adminMappings.map((entry) => String(entry.partId || "").trim()).filter(Boolean));

  const unmatchedPackagePartIds = [...packagePartIds].filter((partId) => !scenePartIds.has(partId));
  const unmatchedScenePartIds = [...scenePartIds].filter((partId) => packagePartIds.size > 0 && !packagePartIds.has(partId));
  const missingAdminMappingPartIds = [...packagePartIds].filter((partId) => adminPartIds.size > 0 && !adminPartIds.has(partId));

  sceneInfo.duplicates.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "duplicate_scene_part_id",
      message: `partId duplicato nella scena: ${partId}`,
      partId,
    });
  });

  unmatchedPackagePartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "package_part_not_found_in_scene",
      message: `Componente del Product Package non trovato nella scena: ${partId}`,
      partId,
    });
  });

  unmatchedScenePartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "scene_part_not_found_in_package",
      message: `Componente della scena non presente nel Product Package: ${partId}`,
      partId,
    });
  });

  missingAdminMappingPartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "missing_admin_mapping_entry",
      message: `Componente senza voce Admin Mapping: ${partId}`,
      partId,
    });
  });

  if (scenePartIds.size === 0) {
    issues.push({
      level: "error",
      code: "empty_scene_components",
      message: "Nessun componente configurabile trovato nella scena importata",
    });
  }

  if (productPackage && packageComponents.length === 0) {
    issues.push({
      level: "error",
      code: "empty_product_package_components",
      message: "Product Package senza componenti configurabili",
    });
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter((issue) => issue.level === "warning").length;
  const matchedComponentCount = [...packagePartIds].filter((partId) => scenePartIds.has(partId)).length;

  return {
    schema: "bagastudio.importerCompatibilityGuard.v1",
    checkedAt: new Date().toISOString(),
    status: errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "ready",
    canApply: errorCount === 0,
    sceneComponentCount: scenePartIds.size,
    packageComponentCount: packageComponents.length,
    adminMappingCount: adminMappings.length,
    matchedComponentCount,
    unmatchedPackagePartIds,
    unmatchedScenePartIds,
    missingAdminMappingPartIds,
    duplicateScenePartIds: sceneInfo.duplicates,
    issues,
  };
}

function prepareImporterCompatibilityGuardBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastCompatibilityGuard?: BagaStudioCompatibilityGuardResult;
    bagastudioCheckImporterCompatibility?: () => BagaStudioCompatibilityGuardResult;
    bagastudioGetLastImporterCompatibilityGuard?: () => BagaStudioCompatibilityGuardResult | undefined;
  };

  const runGuard = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    root.userData.bagastudioImporterCompatibilityGuard = compatibility;
    bagastudioWindow.__bagastudioLastCompatibilityGuard = compatibility;

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-compatibility-guard", {
        detail: compatibility,
      })
    );

    return compatibility;
  };

  bagastudioWindow.bagastudioCheckImporterCompatibility = runGuard;
  bagastudioWindow.bagastudioGetLastImporterCompatibilityGuard = () => bagastudioWindow.__bagastudioLastCompatibilityGuard;

  runGuard();
}



function getImporterSafeMeshes(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) meshes.push(mesh);
  });

  return meshes;
}

function cloneImporterSafeState(root: THREE.Object3D) {
  return {
    productPackage: root.userData?.bagastudioProductPackage,
    adminMapping: root.userData?.bagastudioAdminMapping,
    runtimeComponents: Array.isArray(root.userData?.bagastudioRuntimeComponents)
      ? JSON.parse(JSON.stringify(root.userData.bagastudioRuntimeComponents))
      : [],
    meshUserData: getImporterSafeMeshes(root).map((mesh) => ({
      uuid: mesh.uuid,
      name: mesh.name,
      userData: JSON.parse(JSON.stringify(mesh.userData || {})),
      visible: mesh.visible,
    })),
  };
}

function restoreImporterSafeState(root: THREE.Object3D, snapshot: ReturnType<typeof cloneImporterSafeState>) {
  root.userData.bagastudioProductPackage = snapshot.productPackage;
  root.userData.bagastudioAdminMapping = snapshot.adminMapping;
  root.userData.bagastudioRuntimeComponents = snapshot.runtimeComponents;

  const meshStateByUuid = new Map(snapshot.meshUserData.map((entry) => [entry.uuid, entry]));
  getImporterSafeMeshes(root).forEach((mesh) => {
    const saved = meshStateByUuid.get(mesh.uuid);
    if (!saved) return;
    mesh.name = saved.name;
    mesh.userData = saved.userData || {};
    mesh.visible = saved.visible;
  });
}

function prepareImporterSafeApplyBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastSafeApplySnapshot?: ReturnType<typeof cloneImporterSafeState>;
    __bagastudioLastSafeApplyResult?: BagaStudioSafeApplyResult;
    bagastudioSafeApplyLastProductPackage?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyLastAdminMapping?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyImporterState?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioRollbackLastImporterSafeApply?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioGetLastImporterSafeApplyResult?: () => BagaStudioSafeApplyResult | undefined;
  };

  const emitResult = (result: BagaStudioSafeApplyResult) => {
    root.userData.bagastudioImporterSafeApplyResult = result;
    bagastudioWindow.__bagastudioLastSafeApplyResult = result;
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-safe-apply", {
        detail: result,
      })
    );
    return result;
  };

  const blockedResult = (
    target: BagaStudioSafeApplyResult["target"],
    compatibility: BagaStudioCompatibilityGuardResult,
    message: string
  ): BagaStudioSafeApplyResult =>
    emitResult({
      schema: "bagastudio.importerSafeApply.v1",
      appliedAt: new Date().toISOString(),
      target,
      status: "blocked",
      compatibility,
      rollbackAvailable: Boolean(bagastudioWindow.__bagastudioLastSafeApplySnapshot),
      message,
    });

  const safeApply = (target: BagaStudioSafeApplyResult["target"]): BagaStudioSafeApplyResult | undefined => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    if (!compatibility.canApply) {
      return blockedResult(target, compatibility, "Applicazione bloccata: compatibilità importer non valida.");
    }

    const snapshot = cloneImporterSafeState(root);
    bagastudioWindow.__bagastudioLastSafeApplySnapshot = snapshot;

    try {
      if ((target === "productPackage" || target === "both") && productPackage) {
        applyProductPackageToImportedRoot(root, productPackage);
      }

      if ((target === "adminMapping" || target === "both") && adminMapping) {
        applyAdminMappingToImportedRoot(root, adminMapping);
      }

      const nextCompatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);
      prepareImporterUiBridge(root);

      return emitResult({
        schema: "bagastudio.importerSafeApply.v1",
        appliedAt: new Date().toISOString(),
        target,
        status: "applied",
        compatibility: nextCompatibility,
        rollbackAvailable: true,
        message: "Applicazione sicura completata.",
      });
    } catch (error) {
      restoreImporterSafeState(root, snapshot);
      const rollbackCompatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

      return emitResult({
        schema: "bagastudio.importerSafeApply.v1",
        appliedAt: new Date().toISOString(),
        target,
        status: "rolled_back",
        compatibility: rollbackCompatibility,
        rollbackAvailable: true,
        message: `Errore durante l'applicazione: ${error instanceof Error ? error.message : "errore sconosciuto"}. Rollback eseguito.`,
      });
    }
  };

  bagastudioWindow.bagastudioSafeApplyLastProductPackage = () => safeApply("productPackage");
  bagastudioWindow.bagastudioSafeApplyLastAdminMapping = () => safeApply("adminMapping");
  bagastudioWindow.bagastudioSafeApplyImporterState = () => safeApply("both");
  bagastudioWindow.bagastudioGetLastImporterSafeApplyResult = () => bagastudioWindow.__bagastudioLastSafeApplyResult;
  bagastudioWindow.bagastudioRollbackLastImporterSafeApply = () => {
    const snapshot = bagastudioWindow.__bagastudioLastSafeApplySnapshot;
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    if (!snapshot) {
      return blockedResult("both", compatibility, "Rollback non disponibile: nessuno snapshot precedente trovato.");
    }

    restoreImporterSafeState(root, snapshot);
    prepareImporterUiBridge(root);

    return emitResult({
      schema: "bagastudio.importerSafeApply.v1",
      appliedAt: new Date().toISOString(),
      target: "both",
      status: "rolled_back",
      compatibility: buildImporterCompatibilityGuard(root, productPackage, adminMapping),
      rollbackAvailable: false,
      message: "Rollback importer eseguito correttamente.",
    });
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-safe-apply-ready", {
      detail: {
        safeApplyProductPackage: true,
        safeApplyAdminMapping: true,
        safeApplyImporterState: true,
        rollback: true,
      },
    })
  );
}

function prepareImporterHistoryBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const storageKey = "bagastudio.importer.history.v1";
  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetImporterHistory?: () => BagaStudioImporterHistoryEntry[];
    bagastudioSaveImporterHistorySnapshot?: () => BagaStudioImporterHistoryEntry | undefined;
    bagastudioRestoreImporterHistorySnapshot?: (idOrIndex: string | number) => BagaStudioImporterHistoryEntry | undefined;
    bagastudioClearImporterHistory?: () => void;
    bagastudioRefreshImporterUiState?: () => void;
  };

  const readHistory = (): BagaStudioImporterHistoryEntry[] => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("BagaStudio Importer: history read failed", error);
      return [];
    }
  };

  const writeHistory = (items: BagaStudioImporterHistoryEntry[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 10)));
    } catch (error) {
      console.warn("BagaStudio Importer: history save failed", error);
    }
  };

  bagastudioWindow.bagastudioGetImporterHistory = readHistory;

  bagastudioWindow.bagastudioSaveImporterHistorySnapshot = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || importerReport?.sourceFormat || "unknown").toLowerCase();

    if (!productPackage && !adminMapping && !importerReport) return undefined;

    const entry: BagaStudioImporterHistoryEntry = {
      id: `import_${sourceFormat}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sourceFormat,
      status: importerReport?.status || "ready",
      componentCount: Number(importerReport?.summary?.componentCount || productPackage?.components?.length || 0),
      productPackage,
      adminMapping,
      importerReport,
    };

    const current = readHistory().filter((item) => item.id !== entry.id);
    writeHistory([entry, ...current]);

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-history-saved", {
        detail: entry,
      })
    );

    return entry;
  };

  bagastudioWindow.bagastudioRestoreImporterHistorySnapshot = (idOrIndex: string | number) => {
    const history = readHistory();
    const entry = typeof idOrIndex === "number"
      ? history[idOrIndex]
      : history.find((item) => item.id === idOrIndex);

    if (!entry) return undefined;

    if (entry.productPackage) {
      root.userData.bagastudioProductPackage = entry.productPackage;
      bagastudioWindow.__bagastudioLastProductPackage = entry.productPackage;
    }

    if (entry.adminMapping) {
      root.userData.bagastudioAdminMapping = entry.adminMapping;
      bagastudioWindow.__bagastudioLastAdminMapping = entry.adminMapping;
    }

    if (entry.importerReport) {
      root.userData.bagastudioImporterReport = entry.importerReport;
      bagastudioWindow.__bagastudioLastImporterReport = entry.importerReport;
    }

    bagastudioWindow.__bagastudioLastImportedRoot = root;
    bagastudioWindow.bagastudioRefreshImporterUiState?.();

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-history-restored", {
        detail: entry,
      })
    );

    return entry;
  };

  bagastudioWindow.bagastudioClearImporterHistory = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("BagaStudio Importer: history clear failed", error);
    }

    window.dispatchEvent(new CustomEvent("bagastudio:importer-history-cleared"));
  };

  const snapshot = bagastudioWindow.bagastudioSaveImporterHistorySnapshot?.();

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-history-ready", {
      detail: {
        latest: snapshot,
        history: readHistory(),
      },
    })
  );
}

function exportImportedModelAsGLB(root: THREE.Object3D, filename = "bagastudio-import-clean.glb", autoDownload = false) {
  if (typeof window === "undefined") return;

  const exporter = new GLTFExporter();
  const exportRoot = root.clone(true);

  exportRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.userData = {
      ...mesh.userData,
      bagastudioExportedFromImporter: true,
    };
  });

  exporter.parse(
    exportRoot,
    (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });

      const url = URL.createObjectURL(blob);

      if (autoDownload) {
        downloadGeneratedGlb(url, filename);
      }

      window.dispatchEvent(
        new CustomEvent("bagastudio:importer-glb-ready", {
          detail: {
            filename,
            blob,
            url,
            sizeBytes: blob.size,
            autoDownload,
          },
        })
      );
    },
    (error) => {
      console.error("BagaStudio Importer: GLB export failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:importer-glb-error", {
          detail: { error, filename },
        })
      );
    },
    {
      binary: true,
      onlyVisible: false,
      truncateDrawRange: true,
    }
  );
}

function buildObjectFromGeometry(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: "#d8d8d8",
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "STL_Mesh";
  const group = new THREE.Group();
  group.name = "Imported_STL";
  group.add(mesh);
  return group;
}

function isImportedModelFormat(format?: string) {
  return ["obj", "fbx", "stl", "dae"].includes(String(format || "").toLowerCase());
}

function createImportedModelSafeLedBar(
  mesh: THREE.Mesh,
  color: string,
  config: {
    frontOffset?: number;
    sideMargin?: number;
    yOffset?: number;
    position?: string;
    intensity?: number;
  }
) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const position = String(config.position || "front").toLowerCase();
  const margin = Number(config.sideMargin ?? 8) / 100;
  const frontOffset = Number(config.frontOffset ?? 2) / 100;
  const yOffset = Number(config.yOffset ?? -2) / 100;

  const safeWidth = Math.max(size.x * Math.max(0.15, 1 - margin), 0.08);
  const safeDepth = Math.max(size.z * Math.max(0.15, 1 - margin), 0.08);
  const safeHeight = Math.max(size.y, 0.08);

  let geometry: THREE.BoxGeometry;
  const ledPosition = center.clone();

  if (position.includes("left") || position.includes("right")) {
    geometry = new THREE.BoxGeometry(0.035, Math.max(safeHeight * 0.9, 0.12), 0.035);
    ledPosition.x += position.includes("left")
      ? -size.x / 2 - frontOffset
      : size.x / 2 + frontOffset;
    ledPosition.y += yOffset;
  } else if (position.includes("back")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, 0.035);
    ledPosition.z -= size.z / 2 + frontOffset;
    ledPosition.y += yOffset;
  } else if (position.includes("top")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, Math.max(safeDepth * 0.08, 0.035));
    ledPosition.y += size.y / 2 + frontOffset;
  } else if (position.includes("bottom") || position.includes("under")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, Math.max(safeDepth * 0.08, 0.035));
    ledPosition.y -= size.y / 2 + frontOffset;
  } else {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, 0.035);
    ledPosition.z += size.z / 2 + frontOffset;
    ledPosition.y += yOffset;
  }

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(1, Math.max(0.35, Number(config.intensity ?? 1) * 0.55)),
    toneMapped: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const led = new THREE.Mesh(geometry, material);
  led.name = `LED_${mesh.name}`;
  led.position.copy(ledPosition);
  led.renderOrder = 20;
  led.frustumCulled = false;
  led.userData.bagastudioImportedSafeLed = true;

  return led;
}


function buildBagastudioSpazio3DColladaRuntimeRootFromText(daeText: string, fileName = "Spazio3D.dae") {
  try {
    if (typeof DOMParser === "undefined") return null;

    const documentXml = new DOMParser().parseFromString(daeText, "application/xml");
    if (documentXml.querySelector("parsererror")) return null;

    const parseNumbers = (value: string | null | undefined) =>
      String(value || "")
        .trim()
        .split(/\s+/)
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));

    const localName = (element: Element | null | undefined) => element?.localName || "";
    const childElements = (element: Element | null | undefined, name?: string) =>
      Array.from(element?.children || []).filter((child) => !name || localName(child) === name) as Element[];
    const firstChild = (element: Element | null | undefined, name: string) =>
      childElements(element, name)[0] || null;
    const cleanRef = (value: string | null | undefined) => String(value || "").replace(/^#/, "");

    const material = () =>
      new THREE.MeshStandardMaterial({
        color: "#d8d3ca",
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
      });

    const geometryById = new Map<string, THREE.BufferGeometry>();
    const geometryNameById = new Map<string, string>();

    documentXml.querySelectorAll("geometry").forEach((geometryElement) => {
      const geometryId = geometryElement.getAttribute("id") || "";
      if (!geometryId) return;

      const meshElement = firstChild(geometryElement, "mesh");
      if (!meshElement) return;

      const sources = new Map<string, number[]>();
      childElements(meshElement, "source").forEach((sourceElement) => {
        const sourceId = sourceElement.getAttribute("id") || "";
        const floatArray = firstChild(sourceElement, "float_array");
        if (sourceId && floatArray?.textContent) {
          sources.set(sourceId, parseNumbers(floatArray.textContent));
        }
      });

      const verticesMap = new Map<string, string>();
      childElements(meshElement, "vertices").forEach((verticesElement) => {
        const verticesId = verticesElement.getAttribute("id") || "";
        const positionInput = childElements(verticesElement, "input").find(
          (input) => input.getAttribute("semantic") === "POSITION"
        );
        if (verticesId && positionInput) verticesMap.set(verticesId, cleanRef(positionInput.getAttribute("source")));
      });

      const primitiveElement = firstChild(meshElement, "polylist") || firstChild(meshElement, "triangles");
      if (!primitiveElement) return;

      const inputs = childElements(primitiveElement, "input").map((input) => ({
        semantic: input.getAttribute("semantic") || "",
        source: cleanRef(input.getAttribute("source")),
        offset: Number(input.getAttribute("offset") || 0),
      }));

      const vertexInput = inputs.find((input) => input.semantic === "VERTEX") || inputs.find((input) => input.semantic === "POSITION");
      if (!vertexInput) return;

      const positionSourceId = vertexInput.semantic === "VERTEX" ? verticesMap.get(vertexInput.source) : vertexInput.source;
      const positionValues = positionSourceId ? sources.get(positionSourceId) : null;
      if (!positionValues || positionValues.length < 9) return;

      const stride = Math.max(...inputs.map((input) => input.offset)) + 1;
      const indices = parseNumbers(firstChild(primitiveElement, "p")?.textContent || "").map((item) => Math.trunc(item));
      const vcount = localName(primitiveElement) === "triangles"
        ? new Array(Number(primitiveElement.getAttribute("count") || 0)).fill(3)
        : parseNumbers(firstChild(primitiveElement, "vcount")?.textContent || "").map((item) => Math.trunc(item));

      const positions: number[] = [];
      let cursor = 0;

      vcount.forEach((polygonSize) => {
        const polygonVertices: number[][] = [];

        for (let i = 0; i < polygonSize; i += 1) {
          const vertexIndex = indices[cursor + vertexInput.offset];
          const base = vertexIndex * 3;
          polygonVertices.push([
            positionValues[base] || 0,
            positionValues[base + 1] || 0,
            positionValues[base + 2] || 0,
          ]);
          cursor += stride;
        }

        for (let i = 1; i < polygonVertices.length - 1; i += 1) {
          positions.push(...polygonVertices[0], ...polygonVertices[i], ...polygonVertices[i + 1]);
        }
      });

      if (positions.length < 9) return;

      const bufferGeometry = new THREE.BufferGeometry();
      bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      bufferGeometry.computeVertexNormals();
      bufferGeometry.computeBoundingBox();
      bufferGeometry.computeBoundingSphere();

      geometryById.set(geometryId, bufferGeometry);
      geometryNameById.set(geometryId, geometryElement.getAttribute("name") || geometryId);
    });

    if (geometryById.size === 0) return null;

    const libraryNodes = new Map<string, Element>();
    const libraryNodesElement = documentXml.querySelector("library_nodes");
    childElements(libraryNodesElement, "node").forEach((nodeElement) => {
      const nodeId = nodeElement.getAttribute("id") || "";
      if (nodeId) libraryNodes.set(nodeId, nodeElement);
    });

    const applyMatrix = (object: THREE.Object3D, nodeElement: Element) => {
      const matrixValues = parseNumbers(firstChild(nodeElement, "matrix")?.textContent || "");
      if (matrixValues.length === 16) {
        const matrix = new THREE.Matrix4();
        matrix.set(
          matrixValues[0], matrixValues[1], matrixValues[2], matrixValues[3],
          matrixValues[4], matrixValues[5], matrixValues[6], matrixValues[7],
          matrixValues[8], matrixValues[9], matrixValues[10], matrixValues[11],
          matrixValues[12], matrixValues[13], matrixValues[14], matrixValues[15]
        );
        object.matrix.copy(matrix);
        object.matrixAutoUpdate = false;
      }
    };

    const buildNode = (nodeElement: Element): THREE.Object3D => {
      const group = new THREE.Group();
      group.name = nodeElement.getAttribute("name") || nodeElement.getAttribute("id") || "dae_node";
      applyMatrix(group, nodeElement);

      childElements(nodeElement).forEach((child) => {
        if (localName(child) === "node") {
          group.add(buildNode(child));
          return;
        }

        if (localName(child) === "instance_node") {
          const target = libraryNodes.get(cleanRef(child.getAttribute("url")));
          if (target) group.add(buildNode(target));
          return;
        }

        if (localName(child) === "instance_geometry") {
          const geometryId = cleanRef(child.getAttribute("url"));
          const sourceGeometry = geometryById.get(geometryId);
          if (!sourceGeometry) return;

          const mesh = new THREE.Mesh(sourceGeometry.clone(), material());
          mesh.name = group.name || geometryNameById.get(geometryId) || geometryId;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          mesh.visible = true;
          mesh.userData = {
            ...mesh.userData,
            bagastudioImportedFormat: "dae",
            bagastudioSourceType: "spazio3d-manual-collada-parser",
            bagastudioSelectable: true,
            bagastudioRuntimeComponent: true,
            bagastudioOriginalName: mesh.name,
            bagastudioParentName: group.name,
          };
          group.add(mesh);
        }
      });

      return group;
    };

    const root = new THREE.Group();
    root.name = fileName.replace(/\.[^/.]+$/, "") || "Spazio3D_DAE";
    root.userData = {
      bagastudioImportedFormat: "dae",
      bagastudioSourceType: "spazio3d-manual-collada-parser",
      bagastudioPreserveHierarchy: true,
    };

    const visualScene = documentXml.querySelector("library_visual_scenes visual_scene");
    childElements(visualScene).forEach((child) => {
      if (localName(child) === "node") {
        const group = new THREE.Group();
        group.name = child.getAttribute("name") || child.getAttribute("id") || "Scene";
        applyMatrix(group, child);
        childElements(child).forEach((sceneChild) => {
          if (localName(sceneChild) === "instance_node") {
            const target = libraryNodes.get(cleanRef(sceneChild.getAttribute("url")));
            if (target) group.add(buildNode(target));
          } else if (localName(sceneChild) === "node") {
            group.add(buildNode(sceneChild));
          }
        });
        root.add(group.children.length ? group : buildNode(child));
      }
    });

    if (root.children.length === 0) {
      libraryNodes.forEach((node) => root.add(buildNode(node)));
    }

    let meshCount = 0;
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      meshCount += 1;
    });

    if (meshCount === 0) return null;
    root.updateMatrixWorld(true);
    return root;
  } catch (error) {
    console.warn("BagaStudio Spazio3D DAE manual parser failed", error);
    return null;
  }
}

function ProductModel({
  materials = {},
  productMaterials = [],
  accessories = {},
  inserts = {},
  insertMaterials = {},
  insertSizes = {},
  visibility = {},
  ledKelvin = {},
  ledIntensity = {},
  productModel,
  productModelFormat,
  activeViewId,
  views = [],
  productParts = [],
  woodDirection,
  xRayEnabled = false,
  xRayOpacity = 0.35,
}: Viewer3DProps) {
  const materialsSource =
  productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;

  const [loadedRoot, setLoadedRoot] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const runtimeModelFormat = useMemo(
    () => inferModelFormat(productModel, productModelFormat),
    [productModel, productModelFormat]
  );

  const useImportedSafeLed = isImportedModelFormat(runtimeModelFormat);

  const materialRefreshKey = useMemo(
    () =>
      JSON.stringify({
        materials,
        insertMaterials,
        inserts,
        woodDirection,
      }),
    [materials, insertMaterials, inserts, woodDirection]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadedRoot(null);
    setLoadError(null);

    const format = runtimeModelFormat;

    const onLoaded = (object: THREE.Object3D) => {
      if (cancelled) return;
      forcePreviewMaterials(object, format);
      const analyzedComponents = analyzeImportedModelComponents(object, format);

      if (typeof window !== "undefined") {
        (window as any).__bagastudioViewerRuntimeComponents = analyzedComponents;
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-components-ready", {
            detail: {
              format,
              count: analyzedComponents.length,
              components: analyzedComponents,
            },
          })
        );
      }

      prepareImportedProductPackage(object, format);
      prepareImportedModelGlbExporter(object, format);
      setLoadedRoot(object);
    };

    const onError = (error: unknown) => {
      console.error("BagaStudio Viewer: model load failed", { productModel, format, error });
      if (!cancelled) setLoadError(`Model load failed: ${format}`);
    };

    try {
      if (format === "stl") {
        new STLLoader().load(
          productModel,
          (geometry) => onLoaded(buildObjectFromGeometry(geometry)),
          undefined,
          onError
        );
      } else if (format === "obj") {
        new OBJLoader().load(productModel, onLoaded, undefined, onError);
      } else if (format === "fbx") {
        new FBXLoader().load(productModel, onLoaded, undefined, onError);
      } else if (format === "dae") {
        const loadWithColladaLoaderFallback = () => {
          new ColladaLoader().load(
            productModel,
            (collada) => {
              const daeScene = collada?.scene;

              if (!daeScene) {
                onError(new Error("DAE scene not found"));
                return;
              }

              const daeGroup = buildBagastudioColladaRuntimeRoot(daeScene);

              prepareBagastudioImportedObject(daeGroup, "dae");

              daeGroup.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (!mesh.isMesh) return;

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false;
                mesh.visible = true;

                if (!mesh.name || mesh.name.trim() === "") {
                  mesh.name = `part_${mesh.id}`;
                }

                mesh.userData = {
                  ...mesh.userData,
                  bagastudioImportedFormat: "dae",
                  bagastudioSelectable: true,
                  bagastudioRuntimeComponent: true,
                };

                if (!hasUsableMaterial(mesh.material)) {
                  mesh.material = createBagastudioNeutralImportMaterial();
                }

                const apply = (mat: THREE.Material) => {
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                };

                if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
                else if (mesh.material) apply(mesh.material as THREE.Material);
              });

              onLoaded(daeGroup);
            },
            undefined,
            onError
          );
        };

        fetch(productModel)
          .then((response) => response.text())
          .then((daeText) => {
            if (cancelled) return;
            const manualRoot = buildBagastudioSpazio3DColladaRuntimeRootFromText(daeText, String(productModel || "Nuovo.dae"));
            if (manualRoot) {
              prepareBagastudioImportedObject(manualRoot, "dae");
              onLoaded(manualRoot);
              return;
            }
            loadWithColladaLoaderFallback();
          })
          .catch(() => loadWithColladaLoaderFallback());
      } else {
        new GLTFLoader().load(productModel, (gltf) => onLoaded(gltf.scene), undefined, onError);
      }
    } catch (error) {
      onError(error);
    }

    return () => {
      cancelled = true;
    };
  }, [productModel, runtimeModelFormat]);

 const setSelectedPartId = useConfigStore(
  (state) => state.setSelectedPart
);
  const selectedPartId = useConfigStore(
(state) => state.selectedPartId
);
const highlightedRef = useRef<{
  mesh: THREE.Mesh;
  material: THREE.Material | THREE.Material[];
} | null>(null);

const cloneMaterialForRestore = (material: THREE.Material | THREE.Material[]) => {
  return Array.isArray(material)
    ? material.map((mat) => mat.clone())
    : material.clone();
};

const restoreHighlightedMesh = () => {
  if (!highlightedRef.current) return;

  // Recovery V6: never restore a previously cloned material on deselect/selection change.
  // The old restore path could overwrite a texture that had just been applied asynchronously,
  // making the material disappear when clicking another component. Selection must be
  // non-destructive: only reset render priority.
  highlightedRef.current.mesh.renderOrder = 0;
  highlightedRef.current = null;
};

const applyBagastudioXRayMaterialState = (
  targetMaterial: THREE.Material | THREE.Material[] | null | undefined,
  enabled: boolean,
  opacity: number
) => {
  if (!targetMaterial) return;

  const safeOpacity = THREE.MathUtils.clamp(Number(opacity), 0.08, 1);
  const materialsList = Array.isArray(targetMaterial) ? targetMaterial : [targetMaterial];

  materialsList.forEach((mat) => {
    if (!mat) return;

    mat.side = enabled ? THREE.DoubleSide : THREE.FrontSide;
    mat.transparent = enabled;
    mat.opacity = enabled ? safeOpacity : 1;
    mat.depthWrite = !enabled;
    mat.depthTest = true;
    mat.needsUpdate = true;
  });
};
  const scene = useMemo(() => {
    if (!loadedRoot) return null;

    const clonedScene = loadedRoot.clone(true);
    clonedScene.updateMatrixWorld(true);

    // Recovery Texture V3: use one global UV reference box for imported models.
    // Some Spazio3D/DAE panels are split into multiple coplanar meshes; mapping UVs
    // per single mesh makes the same texture restart on every sub-mesh, causing
    // visible square repetitions. Global world-space UVs keep the texture continuous.
    const importedGlobalUvBox = isImportedModelFormat(runtimeModelFormat)
      ? new THREE.Box3().setFromObject(clonedScene)
      : null;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.includes("Piano")) {
}
        const partKey = mesh.name;
        const meshPartId = String(mesh.userData?.bagastudioPartId || "");
        const meshRuntimeMeshName = String(mesh.userData?.bagastudioMeshName || "");
        const meshDisplayName = String(mesh.userData?.bagastudioDisplayName || "");
        const meshOriginalName = String(mesh.userData?.bagastudioOriginalName || "");
        const meshMaterialGroup = String(mesh.userData?.bagastudioMaterialGroup || "");
        const isImportedRuntimeMesh = isImportedModelFormat(runtimeModelFormat);
        const effectivePartId = meshPartId || meshRuntimeMeshName || partKey;
        const meshAliases = isImportedRuntimeMesh
          ? [effectivePartId].filter(Boolean)
          : [
              partKey,
              mesh.name,
              meshPartId,
              meshRuntimeMeshName,
              meshDisplayName,
              meshOriginalName,
              meshMaterialGroup,
            ].filter(Boolean);

        const productPart =
  productParts.find((p) => meshAliases.includes(String(p.id))) ||
  productParts.find((p) => meshAliases.includes(String(p.meshName))) ||
  productParts.find((p) => meshAliases.some((alias) => String(alias).includes(String(p.meshName || "__no_match__")))) ||
  productParts.find((p) =>
    mesh.name.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    mesh.name.toLowerCase().includes("specch") &&
    String(p.id).toLowerCase().includes("mirror")
  );

        //console.log("PRODUCT PART:", productPart);

const ledMount = productPart?.mountPoints?.led || null;
const ledPosition = ledMount?.position || "front";
const insertMount = productPart?.mountPoints?.insert;
const defaultInsert = getDefaultInsertConfig();
        

      const storeKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id || partKey);

const hasLed = (productPart as any)?.compatibleLed === true || Boolean(ledMount);

const ledIsActive =
  (accessories as any)?.[storeKey]?.led === true ||
  (accessories as any)?.[partKey]?.led === true ||
  (accessories as any)?.[storeKey] === true ||
  (accessories as any)?.[partKey] === true;

        const materialStoreKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id ?? partKey);

const insertKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id ?? storeKey ?? partKey);

const hasInsert = Boolean(
  inserts[insertKey]
);
        const insertOffset = insertMount?.offset || { x: 0, y: 0, z: 1 };

const isMirrorPart =
  mesh.name?.toLowerCase().includes("specchiera") ||
  mesh.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchiera");

const materialId =
  isMirrorPart
    ? "specchio"
    : isImportedRuntimeMesh
      ? materials[effectivePartId] ||
        productPart?.defaultMaterialId ||
        (mesh.name.includes("Piede") || mesh.name.includes("Maniglia")
          ? "oro_satinato"
          : "barok")
      : meshAliases.map((alias) => materials[String(alias)]).find(Boolean) ||
        materials[productPart?.id ?? ""] ||
        materials[materialStoreKey] ||
        materials[partKey] ||
        productPart?.defaultMaterialId ||
        (mesh.name.includes("Piede") || mesh.name.includes("Maniglia")
          ? "oro_satinato"
          : "barok");

   const isSelected =
  Boolean(selectedPartId) &&
  (
    selectedPartId === (isImportedRuntimeMesh ? effectivePartId : productPart?.id) ||
    selectedPartId === effectivePartId ||
    (!isImportedRuntimeMesh && selectedPartId === partKey) ||
    (!isImportedRuntimeMesh && selectedPartId === mesh.name) ||
    meshAliases.includes(String(selectedPartId))
  );
const ledColor =
  ledKelvin?.[partKey] === 6000
    ? "#bfe4ff" // freddo più evidente
    : "#ffd27a"; // caldo più evidente

const normalizeKey = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const materialData =
 materialsSource.find(
  (m: any) => normalizeKey(m.id) === normalizeKey(materialId)
) ||
  materialsSource.find(
  (m: any) => normalizeKey(m.name) === normalizeKey(materialId)
);
const isUnmappedImportedMesh =
  isImportedRuntimeMesh &&
  !productPart &&
  !Boolean(materials[effectivePartId]);

if (isUnmappedImportedMesh && !materialData) {
  mesh.material = createBagastudioNeutralImportMaterial();
  applyBagastudioXRayMaterialState(mesh.material, xRayEnabled, xRayOpacity);
  mesh.renderOrder = xRayEnabled ? 5 : 0;
  mesh.castShadow = !xRayEnabled;
  mesh.receiveShadow = !xRayEnabled;
  return;
}

function applyPlanarUV(mesh: THREE.Mesh, rotate = false, worldBox?: THREE.Box3 | null) {
  const baseGeometry = mesh.geometry as THREE.BufferGeometry;
  if (!baseGeometry.attributes.position) return;

  // Recovery Texture V4:
  // Use box-projected UVs by face normal, not one single projection plane.
  // This avoids both problems seen in tests:
  // 1) repeated square tiles on coplanar split DAE meshes;
  // 2) vertical striped distortion when one global projection is forced on all faces.
  const geometry = baseGeometry.index ? baseGeometry.toNonIndexed() : baseGeometry;
  if (geometry !== baseGeometry) {
    mesh.geometry = geometry;
  }

  geometry.computeBoundingBox();
  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  const localBox = geometry.boundingBox;
  if (!localBox) return;

  const sourceBox = worldBox && !worldBox.isEmpty() ? worldBox : localBox;
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const sizeX = Math.max(sourceSize.x, 0.0001);
  const sizeY = Math.max(sourceSize.y, 0.0001);
  const sizeZ = Math.max(sourceSize.z, 0.0001);

  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const normalAttr = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const uvs: number[] = [];

  const readWorldPosition = (index: number) => {
    vertex.fromBufferAttribute(pos, index);
    if (worldBox && !worldBox.isEmpty()) mesh.localToWorld(vertex);
    return vertex;
  };

  const readWorldNormal = (index: number) => {
    if (normalAttr) {
      normal.fromBufferAttribute(normalAttr, index);
      if (worldBox && !worldBox.isEmpty()) normal.applyMatrix3(normalMatrix).normalize();
    } else {
      normal.set(0, 0, 1);
    }
    return normal;
  };

  const getLocalU = (value: number, axis: "x" | "y" | "z") => {
    if (worldBox && !worldBox.isEmpty()) {
      if (axis === "x") return (value - sourceBox.min.x) / sizeX;
      if (axis === "y") return (value - sourceBox.min.y) / sizeY;
      return (value - sourceBox.min.z) / sizeZ;
    }

    if (axis === "x") return (value - localBox.min.x) / Math.max(localBox.max.x - localBox.min.x, 0.0001);
    if (axis === "y") return (value - localBox.min.y) / Math.max(localBox.max.y - localBox.min.y, 0.0001);
    return (value - localBox.min.z) / Math.max(localBox.max.z - localBox.min.z, 0.0001);
  };

  for (let i = 0; i < pos.count; i++) {
    const p = readWorldPosition(i);
    const n = readWorldNormal(i);
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);

    let u = 0;
    let v = 0;

    if (ay >= ax && ay >= az) {
      // Horizontal top/bottom: project X/Z.
      u = getLocalU(p.x, "x");
      v = getLocalU(p.z, "z");
    } else if (ax >= ay && ax >= az) {
      // Left/right sides: project Z/Y.
      u = getLocalU(p.z, "z");
      v = getLocalU(p.y, "y");
    } else {
      // Front/back: project X/Y.
      u = getLocalU(p.x, "x");
      v = getLocalU(p.y, "y");
    }

    if (rotate) {
      // Real grain direction switch: swap the projection axes in UV space only.
      // Do not rotate the texture bitmap afterwards, otherwise horizontal/vertical cancels out.
      const nextU = v;
      v = u;
      u = nextU;
    }

    uvs.push(THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1));
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
  geometry.computeVertexNormals();
}

        let material:
          | THREE.MeshStandardMaterial
          | THREE.MeshPhysicalMaterial;

        switch (materialData?.type) {
case "texture": {
const directionKey = productPart?.id || partKey;

const selectedWoodDirection =
  woodDirection?.[directionKey] ||
  woodDirection?.[partKey] ||
  materialData.woodDirection ||
  "x";

const meshName = String(mesh.name || "").toLowerCase();

const projection =
  meshName.includes("piano") || meshName.includes("top")
    ? "xz"
    : meshName.includes("fianco") || meshName.includes("side")
    ? "xy"
    : "yz";

const rotateWood = selectedWoodDirection === "z";

applyPlanarUV(mesh, rotateWood, importedGlobalUvBox);
const textureUrl = materialData.textureUrl;
const fallbackColor =
  materialData.fallbackColor ||
  materialData.color ||
  "#c8c2b6";

const configureTexture = (loadedTexture: THREE.Texture) => {
  const runtimeTexture = loadedTexture.clone();
  runtimeTexture.image = loadedTexture.image;
  configureBagastudioTexture(
    runtimeTexture,
    getBagastudioTextureRepeat(mesh, materialData, rotateWood)
  );
  return runtimeTexture;
};

const applyLoadedTexture = (loadedTexture: THREE.Texture) => {
  const runtimeTexture = configureTexture(loadedTexture);

  const currentMaterial = mesh.material as THREE.MeshStandardMaterial;

  if (
    currentMaterial &&
    (currentMaterial as any).userData?.bagastudioTextureUrl === textureUrl
  ) {
    currentMaterial.map = runtimeTexture;
    currentMaterial.color.set("#ffffff");
    currentMaterial.needsUpdate = true;
    mesh.material = currentMaterial;
    mesh.visible = mesh.visible;
    mesh.updateMatrixWorld(true);
  }
};

let texture = textureCache.get(textureUrl);

if (texture) {
  const runtimeTexture = configureTexture(texture);

  material = new THREE.MeshStandardMaterial({
    map: runtimeTexture,
    color: "#ffffff",
    roughness: materialData.roughness ?? 0.48,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });
  (material as any).userData.bagastudioTextureUrl = textureUrl;
} else {
  material = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: materialData.roughness ?? 0.48,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });

  (material as any).userData.bagastudioTextureUrl = textureUrl;

  const waiters = textureWaiters.get(textureUrl);

  if (waiters) {
    waiters.push(applyLoadedTexture);
  } else {
    textureWaiters.set(textureUrl, [applyLoadedTexture]);

    textureLoader.load(
      textureUrl,
      (loadedTexture) => {
        configureTexture(loadedTexture);
        textureCache.set(textureUrl, loadedTexture);

        const callbacks = textureWaiters.get(textureUrl) || [];
        callbacks.forEach((callback) => callback(loadedTexture));
        textureWaiters.delete(textureUrl);
      },
      undefined,
      (err) => {
        console.error("TEXTURE ERROR:", textureUrl, err);
        textureWaiters.delete(textureUrl);
      }
    );
  }
}

  break;
}
          case "metal":
            material = new THREE.MeshPhysicalMaterial({
              color: materialData.color || "#c7a55d",
              roughness: materialData.roughness ?? 0.35,
              metalness: materialData.metalness ?? 1,
              clearcoat: materialData.clearcoat ?? 0.2,
              clearcoatRoughness:
                materialData.clearcoatRoughness ?? 0.2,
              envMapIntensity:
                materialData.envMapIntensity ?? 1.6,
            });
            break;

          case "mirror":
            material = new THREE.MeshPhysicalMaterial({
              color: materialData.color || "#ffffff",
              roughness: materialData.roughness ?? 0,
              metalness: materialData.metalness ?? 1,
              clearcoat: materialData.clearcoat ?? 1,
              clearcoatRoughness:
                materialData.clearcoatRoughness ?? 0,
              envMapIntensity:
                materialData.envMapIntensity ?? 2,
            });
            break;

          default:
            material = new THREE.MeshStandardMaterial({
              color: materialData?.color || "gray",
              roughness: materialData?.roughness ?? 0.45,
              metalness: materialData?.metalness ?? 0.05,
            });
        }

        mesh.material = material;
        mesh.material.needsUpdate = true;
        mesh.updateMatrixWorld(true);
        mesh.castShadow = false;
mesh.receiveShadow = false;
        console.log("INSERT CHECK", {
  mesh: mesh.name,
  productPartId: productPart?.id,
  partKey,
  storeKey,
  materialStoreKey,
  hasInsert,
  insertMount,
  insertMaterials,
  inserts,
});
if (hasInsert) {
  const effectiveInsertMount = insertMount || {
    position: ["top"],
    offset: { x: 0, y: 0, z: 1 },
  };

  const existingInsert = clonedScene.getObjectByName(`INSERT_${mesh.name}`);
  if (existingInsert) {
    clonedScene.remove(existingInsert);
  }

 const insertKey = productPart?.id ?? partKey;

const insertMaterialId =
  insertMaterials?.[insertKey] ||
  insertMaterials?.[productPart?.id ?? ""] ||
  insertMaterials?.[partKey] ||
  "marmo";

console.log("INSERT MATERIAL CHECK:", {
  insertKey,
  partKey,
  productPartId: productPart?.id,
  insertMaterials,
  insertMaterialId,
});

const insertMaterialData =
  materialsSource.find((m: any) => m.id === insertMaterialId) ||
  null;

console.log("INSERT MATERIAL FOUND:", {
  insertMaterialId,
  insertMaterialData,
});

let insertRenderMaterial = new THREE.MeshStandardMaterial({
  color: "#d9d9d9",
  roughness: 0.25,
  metalness: 0,
});

if (insertMaterialData) {
  switch (insertMaterialData.type) {
    case "marble":
    case "texture": {
      let texture = textureCache.get(insertMaterialData.textureUrl);

if (!texture) {
  texture = textureLoader.load(insertMaterialData.textureUrl);
  textureCache.set(insertMaterialData.textureUrl, texture);
}

      configureBagastudioTexture(texture, {
        repeatX: insertMaterialData.repeatX ?? insertMaterialData.scaleX ?? 1,
        repeatY: insertMaterialData.repeatY ?? insertMaterialData.scaleY ?? 1,
      });

      insertRenderMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        color: "#ffffff",
        roughness: insertMaterialData.roughness ?? 0.35,
        metalness: insertMaterialData.metalness ?? 0,
      });
      break;
    }

    case "metal":
      insertRenderMaterial = new THREE.MeshPhysicalMaterial({
        color: insertMaterialData.color || "#c7a55d",
        roughness: insertMaterialData.roughness ?? 0.25,
        metalness: 1,
      });
      break;

    case "mirror":
      insertRenderMaterial = new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0,
        metalness: 1,
        clearcoat: 1,
      });
      break;
  }
}
const insertPanel = createInsertPanel(
  mesh,
  insertRenderMaterial,
  effectiveInsertMount,
 insertSizes[productPart?.id ?? partKey] ?? {
  width: defaultInsert.widthPercent,
  depth: defaultInsert.heightPercent,
  offsetX: defaultInsert.offsetX,
  offsetZ: defaultInsert.offsetY,
}
);
  clonedScene.add(insertPanel);
}
        mesh.castShadow = false;
mesh.receiveShadow = false;

if (mesh.geometry) {
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
}

applyBagastudioXRayMaterialState(mesh.material, xRayEnabled, xRayOpacity);
mesh.renderOrder = xRayEnabled ? 5 : 0;
mesh.castShadow = !xRayEnabled;
mesh.receiveShadow = !xRayEnabled;
const visibilityKey = productPart?.id ?? partKey;

mesh.visible =
  visibility[visibilityKey] !== false &&
  visibility[partKey] !== false;
const existingLed = clonedScene.getObjectByName(`LED_${mesh.name}`);
if (existingLed) {
  clonedScene.remove(existingLed);
}
if (hasLed && ledIsActive) {
  const currentLedIntensity = Number(
    ledIntensity?.[storeKey] ??
    ledIntensity?.[partKey] ??
    1
  );

  const ledConfig = {
    frontOffset: 2,
    sideMargin: 8,
    yOffset: -2,
    position: "front",
    ...(ledMount || {}),
    intensity: currentLedIntensity,
  };

  const ledColor =
    ledKelvin?.[storeKey] === 6000 || ledKelvin?.[partKey] === 6000
      ? "#dff3ff"
      : "#fff1b8";

  const ledBar = useImportedSafeLed
    ? createImportedModelSafeLedBar(mesh, ledColor, ledConfig)
    : createLedBar(mesh, ledColor, ledConfig);

  clonedScene.add(ledBar);
}
const usbActive =
  accessories?.[storeKey]?.usb === true ||
  accessories?.[partKey]?.usb === true;

if (usbActive) {
  const usb = createUsbAccessory(mesh);
  clonedScene.add(usb);
}
const socketActive =
  accessories?.[storeKey]?.socket === true ||
  accessories?.[partKey]?.socket === true;

if (socketActive) {
  const socket = createSocketAccessory(mesh);
  clonedScene.add(socket);
}
const hairdryerHolderActive =
  accessories?.[storeKey]?.hairdryer_holder === true ||
  accessories?.[partKey]?.hairdryer_holder === true;

if (hairdryerHolderActive) {
  const holder = createHairdryerHolderAccessory(mesh);
  clonedScene.add(holder);
}
const toolHolderActive =
  accessories?.[storeKey]?.tool_holder === true ||
  accessories?.[partKey]?.tool_holder === true;

if (toolHolderActive) {
  const toolHolder = createToolHolderAccessory(mesh);
  clonedScene.add(toolHolder);
}
const wirelessActive =
  accessories?.[storeKey]?.wireless_charge === true ||
  accessories?.[partKey]?.wireless_charge === true;

if (wirelessActive) {
  const wireless = createWirelessChargerAccessory(mesh);
  clonedScene.add(wireless);
}
// const mirrorLedActive =
//   accessories?.[storeKey]?.mirror_led === true ||
//   accessories?.[partKey]?.mirror_led === true;

// if (mirrorLedActive) {
//   const mirrorLed = createMirrorLedAccessory(mesh);
//   clonedScene.add(mirrorLed);
// }
}
});


return clonedScene;
}, [
  loadedRoot,
  runtimeModelFormat,
  productParts,
  productMaterials,
  materials,
  accessories,
  inserts,
  insertMaterials,
  insertSizes,
  ledKelvin,
  ledIntensity,
  visibility,
  woodDirection,
  xRayEnabled,
  xRayOpacity,
  materialRefreshKey,
]);

const importedModelDisplayScale = useMemo(
  () => getBagastudioImportedDisplayScale(scene, runtimeModelFormat),
  [scene, runtimeModelFormat]
);

function createInsertPanel(
  mesh: THREE.Mesh,
  material: THREE.Material,
  insertMount: {
    position?: string[];
    offset?: {
      x: number;
      y: number;
      z: number;
    };
  },
  insertSize?: {
    width?: number;
    depth?: number;
    offsetX?: number;
    offsetZ?: number;
  }
) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const offset = insertMount.offset || { x: 0, y: 0, z: 1 };
  const position = insertMount.position?.[0] || "front";

 let geometry: THREE.BoxGeometry;
const insertThickness = 0.08;

const widthPercent = insertSize?.width ?? 100;
const depthPercent = insertSize?.depth ?? 100;

const widthX = size.x * (widthPercent / 100);
const heightY = size.y * (depthPercent / 100);
const depthZ = size.z * (depthPercent / 100);

if (position === "top") {
  geometry = new THREE.BoxGeometry(widthX, insertThickness, depthZ);
} else if (position === "side") {
  geometry = new THREE.BoxGeometry(insertThickness, heightY, depthZ);
} else {
  geometry = new THREE.BoxGeometry(widthX, heightY, insertThickness);
}

  const insert = new THREE.Mesh(geometry, material.clone());

if (position === "top") {
  insert.position.set(
    center.x + offset.x + (insertSize?.offsetX ?? 0),
 box.max.y + (insertThickness / 2) + 0.015 + offset.y,
    center.z + offset.z + (insertSize?.offsetZ ?? 0)
  );
} else if (position === "side") {
  insert.position.set(
    box.max.x + offset.x,
    center.y + offset.y + (insertSize?.offsetZ ?? 0),
    center.z + offset.z + (insertSize?.offsetX ?? 0)
  );
} else {
  insert.position.set(
    center.x + offset.x + (insertSize?.offsetX ?? 0),
    center.y + offset.y + (insertSize?.offsetZ ?? 0),
    box.max.z + offset.z
  );
}

  insert.name = `INSERT_${mesh.name}`;

  return insert;
}
  useEffect(() => {
    if (!scene) return;

    restoreHighlightedMesh();

    if (!selectedPartId) return;

    let targetMesh: THREE.Mesh | null = null;

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || targetMesh) return;

      const partId = String(mesh.userData?.bagastudioPartId || "");
      const meshName = String(mesh.userData?.bagastudioMeshName || mesh.name || "");
      const displayName = String(mesh.userData?.bagastudioDisplayName || "");

      if (
        mesh.name === selectedPartId ||
        partId === selectedPartId ||
        meshName === selectedPartId ||
        displayName === selectedPartId
      ) {
        targetMesh = mesh;
      }
    });

    if (!targetMesh) return;
const mesh = targetMesh as THREE.Mesh;

   highlightedRef.current = {
  mesh,
  material: cloneMaterialForRestore(mesh.material),
};

const applySoftSelectionHighlight = (_material: THREE.Material | THREE.Material[]) => {
  // Recovery V6: no material mutation for selection highlight.
  // Mutating emissive/material state on the selected mesh interfered with runtime texture
  // persistence when another component was clicked. Keep selection visual non-destructive.
  return;
};

applySoftSelectionHighlight(mesh.material);
mesh.renderOrder = 30;
  }, [scene, selectedPartId]);

  if (!scene) return null;

  return (
    <Center>
<group
  onPointerMissed={() => {
    restoreHighlightedMesh();

    setSelectedPartId(null);
  }}
>
  <primitive
    object={scene}
    scale={importedModelDisplayScale}
    castShadow
    receiveShadow
    onClick={(e: any) => {
      e.stopPropagation();

      const clickedName =
        e.object.name ||
        e.object.parent?.name ||
        "unknown-part";
const clickedPart =
  productParts.find((p) => p.meshName === clickedName) ||
  productParts.find((p) => clickedName.includes(p.meshName)) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("specch") &&
    String(p.id).toLowerCase().includes("mirror")
  );
  productParts.find((p) =>
    clickedName.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("specchio") &&
    String(p.id).toLowerCase().includes("mirror")
  );

const clickedMeshObject = e.object as THREE.Mesh;
const clickedMeshPartId = String(clickedMeshObject.userData?.bagastudioPartId || "");
const clickedMeshRuntimeName = String(clickedMeshObject.userData?.bagastudioMeshName || "");
const clickedIsImported = isImportedModelFormat(runtimeModelFormat);

const realPartKey =
  clickedIsImported
    ? (clickedMeshPartId || clickedMeshRuntimeName || clickedName)
    : (clickedPart?.id || clickedMeshPartId || clickedMeshRuntimeName || clickedName);

    const clickedMesh =
  scene.getObjectByName(clickedPart?.meshName || clickedName) as THREE.Mesh ||
  (e.object as THREE.Mesh);

      restoreHighlightedMesh();

      highlightedRef.current = {
        mesh: clickedMesh,
        material: cloneMaterialForRestore(clickedMesh.material),
      };

      setSelectedPartId(realPartKey);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-component-selected", {
            detail: {
              partId: realPartKey,
              id: realPartKey,
              meshName: clickedMesh.name || clickedName,
              displayName: String(clickedMesh.userData?.bagastudioDisplayName || clickedMesh.name || clickedName),
              originalName: String(clickedMesh.userData?.bagastudioOriginalName || clickedName),
            },
          })
        );
      }
    }}
  />
</group>
  </Center>
);
}

function CameraController({
  activeViewId,
  views,
}: {
  activeViewId?: string | null;
  views?: any[];
}) {
  const { camera } = useThree();

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 6, 28], target: [0, 0, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    const viewId = activeViewId || "iso";

    const selectedView = views?.find((v) => v.id === viewId);

    const cameraData =
      selectedView?.camera ||
      DEFAULT_CAMERA_VIEWS[viewId] ||
      DEFAULT_CAMERA_VIEWS.iso;

    camera.position.set(
      cameraData.position[0],
      cameraData.position[1],
      cameraData.position[2]
    );

    camera.lookAt(
      cameraData.target[0],
      cameraData.target[1],
      cameraData.target[2]
    );

    camera.updateProjectionMatrix();
  }, [activeViewId, views, camera]);

  return null;
}

function ViewerRuntimeControls({
  activeViewId,
  views,
  productParts = [],
}: {
  activeViewId?: string | null;
  views?: any[];
  productParts?: any[];
}) {
  const { camera, gl, scene } = useThree();
  const selectedPartId = useConfigStore((state) => state.selectedPartId);

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 6, 28], target: [0, 0, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    const applyCameraView = (viewId = activeViewId || "iso") => {
      const selectedView = views?.find((v) => v.id === viewId);
      const cameraData =
        selectedView?.camera ||
        DEFAULT_CAMERA_VIEWS[viewId] ||
        DEFAULT_CAMERA_VIEWS.iso;

      camera.position.set(
        cameraData.position[0],
        cameraData.position[1],
        cameraData.position[2]
      );

      camera.lookAt(
        cameraData.target[0],
        cameraData.target[1],
        cameraData.target[2]
      );

      camera.updateProjectionMatrix();

      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      if (controls?.target) {
        controls.target.set(
          cameraData.target[0],
          cameraData.target[1],
          cameraData.target[2]
        );
        controls.update?.();
      }
    };

    const getTargetObjects = () => {
      const objects: THREE.Object3D[] = [];

      const selectedPart = productParts.find((part: any) => {
        return part.id === selectedPartId || part.meshName === selectedPartId;
      });

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;

        if (!selectedPartId) {
          objects.push(mesh);
          return;
        }

        const objectName = String(mesh.name || "");
        const selectedMeshName = String(selectedPart?.meshName || "");
        const selectedId = String(selectedPartId || "");

        if (
          objectName === selectedId ||
          objectName === selectedMeshName ||
          objectName.includes(selectedMeshName) ||
          objectName.includes(selectedId)
        ) {
          objects.push(mesh);
        }
      });

      return objects;
    };

    const focusObjects = () => {
      const objects = getTargetObjects();
      if (!objects.length) return;

      const box = new THREE.Box3();
      objects.forEach((object) => box.expandByObject(object));

      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = Math.max(maxSize * 2.2, 8);

      camera.position.set(
        center.x + distance,
        center.y + distance * 0.45,
        center.z + distance
      );
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      if (controls?.target) {
        controls.target.copy(center);
        controls.update?.();
      }
    };

    const downloadScreenshot = () => {
      requestAnimationFrame(() => {
        const link = document.createElement("a");
        link.download = `bagastudio-render-${Date.now()}.png`;
        link.href = gl.domElement.toDataURL("image/png");
        link.click();
      });
    };

    const generateProductThumbnail = (download = false) => {
      requestAnimationFrame(() => {
        const sourceCanvas = gl.domElement;
        const size = 512;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(sourceCanvas, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/png");

        (window as any).__bagastudioLastProductThumbnail = {
          generatedAt: new Date().toISOString(),
          width: size,
          height: size,
          type: "image/png",
          dataUrl,
        };

        window.dispatchEvent(
          new CustomEvent("bagastudio:product-thumbnail-ready", {
            detail: (window as any).__bagastudioLastProductThumbnail,
          })
        );

        if (download) {
          const link = document.createElement("a");
          link.download = `bagastudio-product-thumbnail-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      });
    };

    const handleReset = () => applyCameraView("iso");
    const handleFocus = () => focusObjects();
    const handleScreenshot = () => downloadScreenshot();
    const handleThumbnail = () => generateProductThumbnail(false);
    const handleThumbnailDownload = () => generateProductThumbnail(true);

    (window as any).bagastudioGenerateProductThumbnail = handleThumbnail;
    (window as any).bagastudioDownloadProductThumbnail = handleThumbnailDownload;

    window.addEventListener("bagastudio:reset-camera", handleReset);
    window.addEventListener("bagastudio:focus-selection", handleFocus);
    window.addEventListener("bagastudio:screenshot", handleScreenshot);
    window.addEventListener("bagastudio:generate-thumbnail", handleThumbnail);
    window.addEventListener("bagastudio:download-thumbnail", handleThumbnailDownload);

    return () => {
      window.removeEventListener("bagastudio:reset-camera", handleReset);
      window.removeEventListener("bagastudio:focus-selection", handleFocus);
      window.removeEventListener("bagastudio:screenshot", handleScreenshot);
      window.removeEventListener("bagastudio:generate-thumbnail", handleThumbnail);
      window.removeEventListener("bagastudio:download-thumbnail", handleThumbnailDownload);

      delete (window as any).bagastudioGenerateProductThumbnail;
      delete (window as any).bagastudioDownloadProductThumbnail;
    };
  }, [activeViewId, views, camera, gl, scene, selectedPartId, productParts]);

  return null;
}


function getRuntimePlaceholderBucket(component: any) {
  const source = [
    component?.category,
    component?.componentCategory,
    component?.runtimeRole,
    component?.partId,
    component?.displayName,
    component?.name,
    component?.meshName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("top") || source.includes("cielo") || source.includes("piano")) return "TOP";
  if (source.includes("side") || source.includes("fianco") || source.includes("lato")) return "SIDE";
  if (source.includes("back") || source.includes("retro") || source.includes("schiena")) return "BACK";
  if (source.includes("shelf") || source.includes("ripiano") || source.includes("mensola")) return "SHELF";
  if (source.includes("front") || source.includes("frontale") || source.includes("anta")) return "FRONT";
  if (source.includes("base") || source.includes("fondo") || source.includes("zoccolo") || source.includes("plinth")) return "BASE";
  if (source.includes("hardware") || source.includes("ferramenta") || source.includes("cerniera") || source.includes("guida")) return "HARDWARE";

  return "OTHER";
}

function getRuntimePlaceholderBucketConfig(bucket: string) {
  const configs: Record<
    string,
    {
      origin: [number, number, number];
      color: string;
      width: number;
      height: number;
      depth: number;
    }
  > = {
    TOP: {
      origin: [-520, 115, -420],
      color: "#38bdf8",
      width: 70,
      height: 5,
      depth: 38,
    },
    SIDE: {
      origin: [-520, 72, -520],
      color: "#22c55e",
      width: 8,
      height: 58,
      depth: 40,
    },
    BACK: {
      origin: [-520, 48, -620],
      color: "#f59e0b",
      width: 72,
      height: 45,
      depth: 5,
    },
    SHELF: {
      origin: [-520, 28, -720],
      color: "#a78bfa",
      width: 66,
      height: 4,
      depth: 32,
    },
    FRONT: {
      origin: [460, 58, -420],
      color: "#ef4444",
      width: 62,
      height: 42,
      depth: 5,
    },
    BASE: {
      origin: [460, 12, -520],
      color: "#eab308",
      width: 68,
      height: 8,
      depth: 36,
    },
    HARDWARE: {
      origin: [460, 88, -620],
      color: "#f97316",
      width: 14,
      height: 14,
      depth: 14,
    },
    OTHER: {
      origin: [460, 32, -720],
      color: "#94a3b8",
      width: 42,
      height: 12,
      depth: 24,
    },
  };

  return configs[bucket] || configs.OTHER;
}

function buildRuntimePlaceholderGeometry(component: any, index: number, bucketIndex = index) {
  const bucket = getRuntimePlaceholderBucket(component);
  const config = getRuntimePlaceholderBucketConfig(bucket);

  const columns = 6;
  const column = bucketIndex % columns;
  const row = Math.floor(bucketIndex / columns);

  const spacingX = 82;
  const spacingY = 18;
  const spacingZ = 42;

  return {
    bucket,
    width: config.width,
    height: config.height,
    depth: config.depth,
    color: config.color,
    position: [
      config.origin[0] + column * spacingX,
      config.origin[1] + row * spacingY,
      config.origin[2] - row * spacingZ,
    ] as [number, number, number],
  };
}

export default function Viewer3D({
  width,
  height,
  depth,
  materials,
  productMaterials,
  accessories,
  inserts,
  insertMaterials,
  insertSizes = {},
  visibility,
  productModel,
  productModelFormat,
  productParts,
  views = [],
  activeViewId,
  ledIntensity,
  woodDirection,
  xRayEnabled = false,
  xRayOpacity = 0.35,
}: Viewer3DProps) {
  const materialsSource =
productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;
  const ledKelvin = useConfigStore((state) => state.ledKelvin);
  const ledIntensityStore = useConfigStore((state) => state.ledIntensity);
  const selectedRuntimePartId = useConfigStore((state) => state.selectedPartId);
  const setRuntimeSelectedPartId = useConfigStore((state) => state.setSelectedPart);
  const [viewerMode, setViewerMode] = useState<"select" | "pan" | "orbit">("select");
  const [viewerRuntimeComponents, setViewerRuntimeComponents] = useState<BagaStudioRuntimeComponent[]>([]);
  const componentRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [runtimeImportedModel, setRuntimeImportedModel] = useState<{
    url: string;
    format: string;
    name?: string;
    size?: number;
    importedAt?: string;
  } | null>(null);
  const runtimeImportedModelRef = useRef<{ url: string; format: string; name?: string } | null>(null);

  useEffect(() => {
    const setSelectMode = () => setViewerMode("select");
    const setPanMode = () => setViewerMode("pan");
    const setOrbitMode = () => setViewerMode("orbit");

    window.addEventListener("bagastudio:tool-select", setSelectMode);
    window.addEventListener("bagastudio:tool-pan", setPanMode);
    window.addEventListener("bagastudio:tool-orbit", setOrbitMode);

    return () => {
      window.removeEventListener("bagastudio:tool-select", setSelectMode);
      window.removeEventListener("bagastudio:tool-pan", setPanMode);
      window.removeEventListener("bagastudio:tool-orbit", setOrbitMode);
    };
  }, []);

  useEffect(() => {
    const supportedFormats = ["glb", "gltf", "dae", "fbx", "obj", "stl"];

    const getExtension = (fileName: string) =>
      String(fileName || "")
        .split(".")
        .pop()
        ?.trim()
        .toLowerCase() || "";

    const applyRuntimeModel = (payload: any) => {
      const url = String(payload?.objectUrl || payload?.url || payload?.productModel || "");
      const name = String(payload?.name || payload?.fileName || "");
      const format = String(payload?.format || payload?.productModelFormat || getExtension(name) || getExtension(url)).toLowerCase();

      if (!url || !supportedFormats.includes(format)) {
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-runtime-model-error", {
            detail: {
              status: "error",
              message: "Formato modello non supportato o URL mancante",
              payload,
              supportedFormats,
            },
          })
        );
        return;
      }

      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:") && previous.url !== url) {
        URL.revokeObjectURL(previous.url);
      }

      const nextModel = {
        url,
        format,
        name: name || `BagaStudio import ${format.toUpperCase()}`,
        size: Number(payload?.size || 0),
        importedAt: String(payload?.importedAt || new Date().toISOString()),
      };

      runtimeImportedModelRef.current = nextModel;
      setRuntimeImportedModel(nextModel);

      // BagaStudio Recovery DAE/Viewer V1:
      // ogni nuovo modello deve ripartire da una lista componenti pulita.
      // Prima potevano rimanere componenti/placeholder del Product Package precedente
      // e il Viewer mostrava pezzi finti o non appartenenti al DAE caricato.
      setViewerRuntimeComponents([]);
      setRuntimeSelectedPartId("");
      (window as any).__bagastudioViewerRuntimeComponents = [];
      (window as any).__bagastudioViewerRuntimeMergeReport = null;

      window.dispatchEvent(
        new CustomEvent("bagastudio:viewer-runtime-model-loaded", {
          detail: nextModel,
        })
      );
    };

    const handleDragDropModelReady = (event: Event) => {
      applyRuntimeModel((event as CustomEvent).detail);
    };

    const handleViewerLoadModel = (event: Event) => {
      applyRuntimeModel((event as CustomEvent).detail);
    };

    (window as any).bagastudioLoadModelFile = (file: File) => {
      const format = getExtension(file?.name || "");
      if (!file || !supportedFormats.includes(format)) {
        throw new Error(`Formato non supportato. Usa: ${supportedFormats.join(", ")}`);
      }

      const objectUrl = URL.createObjectURL(file);
      const payload = {
        objectUrl,
        format,
        name: file.name,
        size: file.size,
        type: file.type || null,
        file,
        importedAt: new Date().toISOString(),
      };

      applyRuntimeModel(payload);
      return payload;
    };

    (window as any).bagastudioLoadModelUrl = (url: string, format?: string, name?: string) => {
      const payload = {
        url,
        format: format || getExtension(name || url),
        name: name || url.split("/").pop() || "BagaStudio model",
        importedAt: new Date().toISOString(),
      };

      applyRuntimeModel(payload);
      return payload;
    };

    
    (window as any).bagastudioLoadProductPackageJson = (productPackage: any) => {
      try {
        const components = Array.isArray(productPackage?.components)
          ? productPackage.components
          : [];

        (window as any).__bagastudioProductPackage = productPackage;
        (window as any).__bagastudioViewerRuntimeComponents = components;
        (window as any).__bagastudioViewerRuntimeMergeReport = {
          runtimeComponentCount: components.length,
          source: "product-package"
        };

        const modelUrl =
          productPackage?.assets?.convertedModelUrl ||
          productPackage?.assets?.embeddedModelDataUrl ||
          productPackage?.assets?.modelUrl;

        if (modelUrl) {
          const isConvertedModelUrl = Boolean(productPackage?.assets?.convertedModelUrl);
          const resolvedFormat = isConvertedModelUrl
            ? String(productPackage?.assets?.conversionTargetFormat || "glb").toLowerCase()
            : inferModelFormat(
                modelUrl,
                productPackage?.assets?.modelExtension ||
                  productPackage?.assets?.modelFormat ||
                  productPackage?.assets?.originalFormat ||
                  productPackage?.engine?.canonicalModelFormat ||
                  "glb"
              );

          applyRuntimeModel({
            url: modelUrl,
            format: resolvedFormat,
            name:
              productPackage?.assets?.sourceFileName ||
              productPackage?.name ||
              "Product Package Model",
            importedAt: new Date().toISOString(),
          });
        }

        window.dispatchEvent(
          new CustomEvent("bagastudio:runtime-components-merged", {
            detail: {
              productPackage,
              components,
              mergeReport: {
                runtimeComponentCount: components.length,
              },
            },
          })
        );

        return {
          productPackage,
          components,
          componentCount: components.length,
          modelLoaded: Boolean(modelUrl),
        };
      } catch (error) {
        console.error("Product package load error", error);
        return null;
      }
    };

(window as any).bagastudioGetRuntimeImportedModel = () => runtimeImportedModelRef.current;
    (window as any).bagastudioClearRuntimeImportedModel = () => {
      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }
      runtimeImportedModelRef.current = null;
      setRuntimeImportedModel(null);
      window.dispatchEvent(new CustomEvent("bagastudio:viewer-runtime-model-cleared"));
    };

    window.addEventListener("bagastudio:drag-drop-model-ready", handleDragDropModelReady);
    window.addEventListener("bagastudio:viewer-load-model", handleViewerLoadModel);
    window.addEventListener("bagastudio:import-model", handleViewerLoadModel);

    return () => {
      window.removeEventListener("bagastudio:drag-drop-model-ready", handleDragDropModelReady);
      window.removeEventListener("bagastudio:viewer-load-model", handleViewerLoadModel);
      window.removeEventListener("bagastudio:import-model", handleViewerLoadModel);

      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }

      delete (window as any).bagastudioLoadModelFile;
      delete (window as any).bagastudioLoadModelUrl;
      delete (window as any).bagastudioGetRuntimeImportedModel;
      delete (window as any).bagastudioClearRuntimeImportedModel;
    };
  }, []);


  useEffect(() => {
    const applyComponents = (payload: any) => {
      const incomingComponents = Array.isArray(payload?.components)
        ? payload.components
        : Array.isArray(payload?.detail?.components)
        ? payload.detail.components
        : [];

      const incoming = incomingComponents as BagaStudioRuntimeComponent[];

      // BagaStudio Recovery DAE/Viewer V1:
      // la lista componenti deve rappresentare il modello attivo, non il conteggio più alto
      // visto in precedenza. Il confronto incoming >= current manteneva componenti vecchi
      // quando il nuovo DAE aveva meno mesh, generando residui demo/package nel Viewer.
      if (Array.isArray(incoming)) {
        setViewerRuntimeComponents(incoming);
        (window as any).__bagastudioViewerRuntimeComponents = incoming;
      }
    };

    const handleComponentsReady = (event: Event) => {
      applyComponents((event as CustomEvent).detail);
    };

    const handleSelectComponent = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const partId = String(detail?.partId || detail?.id || detail?.meshName || "");
      if (!partId) return;
      setRuntimeSelectedPartId(partId);
    };

    (window as any).bagastudioGetViewerRuntimeComponents = () => viewerRuntimeComponents;
    (window as any).bagastudioSelectViewerRuntimeComponent = (partId: string) => {
      const safePartId = String(partId || "");
      if (!safePartId) return null;

      setRuntimeSelectedPartId(safePartId);
      window.dispatchEvent(
        new CustomEvent("bagastudio:viewer-component-selected", {
          detail: { partId: safePartId },
        })
      );

      return safePartId;
    };

    window.addEventListener("bagastudio:viewer-components-ready", handleComponentsReady);
    window.addEventListener("bagastudio:importer-components-analyzed", handleComponentsReady);
    window.addEventListener("bagastudio:runtime-components-merged", handleComponentsReady);
    window.addEventListener("bagastudio:viewer-select-component", handleSelectComponent);

    const existingComponents = (window as any).__bagastudioViewerRuntimeComponents;
    if (Array.isArray(existingComponents)) {
      setViewerRuntimeComponents(existingComponents as BagaStudioRuntimeComponent[]);
    }

    return () => {
      window.removeEventListener("bagastudio:viewer-components-ready", handleComponentsReady);
      window.removeEventListener("bagastudio:importer-components-analyzed", handleComponentsReady);
      window.removeEventListener("bagastudio:runtime-components-merged", handleComponentsReady);
      window.removeEventListener("bagastudio:viewer-select-component", handleSelectComponent);

      delete (window as any).bagastudioGetViewerRuntimeComponents;
      delete (window as any).bagastudioSelectViewerRuntimeComponent;
    };
  }, [setRuntimeSelectedPartId, viewerRuntimeComponents]);

  useEffect(() => {
    if (!selectedRuntimePartId) return;

    const targetRow = componentRowRefs.current[selectedRuntimePartId];

    if (!targetRow) return;

    targetRow.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedRuntimePartId, viewerRuntimeComponents]);

  const selectedViewerRuntimeComponent = useMemo(() => {
    if (!selectedRuntimePartId) return null;

    return (
      viewerRuntimeComponents.find((component) => component.id === selectedRuntimePartId) ||
      viewerRuntimeComponents.find((component) => component.meshName === selectedRuntimePartId) ||
      null
    );
  }, [selectedRuntimePartId, viewerRuntimeComponents]);

  const effectiveProductModel = runtimeImportedModel?.url || productModel;
  const effectiveProductModelFormat = runtimeImportedModel?.format || productModelFormat;

  return (
    <div className="relative h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {runtimeImportedModel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl border border-emerald-500/30 bg-black/70 px-3 py-2 text-xs text-emerald-100 shadow-lg backdrop-blur">
          Import attivo: {runtimeImportedModel.name} · {runtimeImportedModel.format.toUpperCase()}
        </div>
      )}

      {/* Component list moved to right sidebar in app/page.tsx. Canvas kept clean. */}

      <Canvas
        shadows
        camera={{ position: [20, 10, 22], fov: 70 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onContextMenu={(event) => event.preventDefault()}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          bagastudioRendererMaxAnisotropy = Math.max(8, gl.capabilities.getMaxAnisotropy?.() || 8);
        }}
      >
        <color attach="background" args={["#07111c"]} />

        <ambientLight intensity={1.25} />

        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={2.7}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <directionalLight
          position={[-4, 4, -3]}
          intensity={1.6}
        />

        <pointLight
          position={[0, 3, 3]}
          intensity={1.2}
        />

        <Environment preset="apartment" />

<CameraController activeViewId={activeViewId} views={views} />
<ViewerRuntimeControls activeViewId={activeViewId} views={views} productParts={productParts} />

        <ProductModel
  width={width}
  height={height}
  depth={depth}
  materials={materials}
  productMaterials={productMaterials}
  accessories={accessories}
  inserts={inserts}
  insertMaterials={insertMaterials}
  insertSizes={insertSizes}
  ledKelvin={ledKelvin}
  ledIntensity={ledIntensity ?? ledIntensityStore}
  visibility={visibility}
  productModel={effectiveProductModel}
  productModelFormat={effectiveProductModelFormat}
  productParts={productParts}
  woodDirection={woodDirection}
  xRayEnabled={xRayEnabled}
  xRayOpacity={xRayOpacity}
/>

      <OrbitControls
  makeDefault
  enableRotate={true}
  enablePan={true}
  enableZoom={true}
  enableDamping={true}
  dampingFactor={0.08}
  mouseButtons={{
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }}
/>
      
      {/* Runtime Placeholder Geometry V2 disattivata in Recovery DAE/Viewer V1.
          I placeholder metadata non devono generare pannelli visibili nel Viewer cliente:
          creavano pezzi estranei al modello reale e mascheravano il DAE caricato. */}

</Canvas>
    </div>
  );
}




/* =========================
   BagaStudio Importer Save System V1
========================= */

declare global {
  interface Window {
   bagastudioSaveCompleteProductPackage?: () => Promise<any>;
    bagastudioGetLastSavedProductPackage?: () => any;
    bagastudioSaveLastProductToLibrary?: (options?: any) => any;
    bagastudioGetProductLibrary?: () => any[];
    bagastudioExportProductLibrary?: () => any[];
    bagastudioLoadProductFromLibrary?: (productIdOrSlug: string) => any;
    bagastudioRemoveProductFromLibrary?: (productIdOrSlug: string) => any[];
    bagastudioClearProductLibrary?: () => any[];
    bagastudioSearchProductLibrary?: (query?: string, filters?: any) => any[];
    bagastudioGetProductLibraryCategories?: () => string[];
    bagastudioGetProductLibraryCardData?: (query?: string, filters?: any) => any[];
    bagastudioImportProductLibrary?: (libraryJson: any, options?: any) => any[];
    bagastudioPrepareProductFromLibrary?: (productIdOrSlug: string, options?: any) => any;
    bagastudioApplyPreparedProduct?: (options?: any) => any;
    bagastudioGetPreparedProduct?: () => any;
  }
}

let __bagastudioLastSavedPackage: any = null;

async function bagastudioSaveCompleteProductPackageRuntime() {
  try {
    const runtimePackage = {
      savedAt: new Date().toISOString(),
      version: "ImporterSaveSystemV1",
      productPackage: (window as any).bagastudioProductPackage || null,
      adminMapping: (window as any).bagastudioAdminMapping || null,
      importerReport: (window as any).bagastudioLastImporterReport || null,
      thumbnail: (window as any).__bagastudioLastProductThumbnail || null,
      metadata: {
        engine: "BagaStudio Core",
        pipeline: "Importer Pipeline V2",
      },
    };

    __bagastudioLastSavedPackage = runtimePackage;

    const blob = new Blob(
      [JSON.stringify(runtimePackage, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bagastudio-complete-product-package.json";
    a.click();

    URL.revokeObjectURL(url);

    window.dispatchEvent(
      new CustomEvent("bagastudio:complete-product-package-saved", {
        detail: runtimePackage,
      })
    );

    return runtimePackage;
  } catch (error) {
    console.error("BagaStudio Save System Error", error);

    window.dispatchEvent(
      new CustomEvent("bagastudio:complete-product-package-save-error", {
        detail: error,
      })
    );
  }
}


/* =========================
   BagaStudio Product Library V1
========================= */

const BAGASTUDIO_PRODUCT_LIBRARY_KEY = "bagastudio.productLibrary.v1";

function bagastudioCreateProductLibraryId(base = "product") {
  const cleanBase = String(base || "product")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

  return `${cleanBase}-${Date.now()}`;
}

function bagastudioReadProductLibrary() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio Product Library read error", error);
    return [];
  }
}

function bagastudioWriteProductLibrary(items: any[]) {
  if (typeof window === "undefined") return [];

  const safeItems = Array.isArray(items) ? items : [];
  window.localStorage.setItem(
    BAGASTUDIO_PRODUCT_LIBRARY_KEY,
    JSON.stringify(safeItems)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-updated", {
      detail: safeItems,
    })
  );

  return safeItems;
}

function bagastudioSaveLastProductToLibrary(options: any = {}) {
  const sourcePackage =
    __bagastudioLastSavedPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  if (!sourcePackage) {
    const error = new Error("No BagaStudio product package available to save");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-save-error", {
        detail: error,
      })
    );

    throw error;
  }

  const productPackage = sourcePackage.productPackage || sourcePackage;
  const suggestedName =
    options.name ||
    productPackage?.productName ||
    productPackage?.name ||
    productPackage?.metadata?.name ||
    "BagaStudio Product";

  const productId =
    options.productId ||
    productPackage?.productId ||
    productPackage?.id ||
    bagastudioCreateProductLibraryId(suggestedName);

  const productSlug =
    options.productSlug ||
    productPackage?.productSlug ||
    String(suggestedName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const libraryItem = {
    productId,
    productSlug,
    name: suggestedName,
    category: options.category || productPackage?.productCategory || "uncategorized",
    version: options.version || productPackage?.version || "1.0.0",
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFormat: options.sourceFormat || productPackage?.sourceFormat || null,
    thumbnail:
      options.thumbnail ||
      sourcePackage.thumbnail ||
      (window as any).__bagastudioLastProductThumbnail ||
      null,
    package: sourcePackage,
  };

  const currentLibrary = bagastudioReadProductLibrary();
  const filteredLibrary = currentLibrary.filter(
    (item: any) =>
      item?.productId !== libraryItem.productId &&
      item?.productSlug !== libraryItem.productSlug
  );

  const nextLibrary = [libraryItem, ...filteredLibrary];
  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-item-saved", {
      detail: libraryItem,
    })
  );

  return libraryItem;
}

function bagastudioLoadProductFromLibrary(productIdOrSlug: string) {
  const library = bagastudioReadProductLibrary();
  const item = library.find(
    (entry: any) =>
      entry?.productId === productIdOrSlug || entry?.productSlug === productIdOrSlug
  );

  if (!item) {
    const error = new Error(`BagaStudio product not found: ${productIdOrSlug}`);

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-load-error", {
        detail: error,
      })
    );

    throw error;
  }

  __bagastudioLastSavedPackage = item.package || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = item;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-item-loaded", {
      detail: item,
    })
  );

  return item;
}

function bagastudioRemoveProductFromLibrary(productIdOrSlug: string) {
  const nextLibrary = bagastudioReadProductLibrary().filter(
    (entry: any) =>
      entry?.productId !== productIdOrSlug && entry?.productSlug !== productIdOrSlug
  );

  return bagastudioWriteProductLibrary(nextLibrary);
}

function bagastudioClearProductLibrary() {
  return bagastudioWriteProductLibrary([]);
}

function bagastudioExportProductLibrary() {
  const library = bagastudioReadProductLibrary();
  const blob = new Blob([JSON.stringify(library, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bagastudio-product-library-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-exported", {
      detail: library,
    })
  );

  return library;
}



/* =========================
   BagaStudio Catalog Browser V1
========================= */

function bagastudioNormalizeCatalogText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioSearchProductLibrary(query = "", filters: any = {}) {
  const library = bagastudioReadProductLibrary();
  const normalizedQuery = bagastudioNormalizeCatalogText(query);
  const categoryFilter = bagastudioNormalizeCatalogText(filters?.category || "");
  const sourceFormatFilter = bagastudioNormalizeCatalogText(filters?.sourceFormat || "");

  const results = library.filter((item: any) => {
    const searchableText = bagastudioNormalizeCatalogText([
      item?.name,
      item?.productId,
      item?.productSlug,
      item?.category,
      item?.version,
      item?.sourceFormat,
      item?.package?.metadata?.engine,
      item?.package?.metadata?.pipeline,
    ].filter(Boolean).join(" "));

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory =
      !categoryFilter || bagastudioNormalizeCatalogText(item?.category) === categoryFilter;
    const matchesSourceFormat =
      !sourceFormatFilter || bagastudioNormalizeCatalogText(item?.sourceFormat) === sourceFormatFilter;

    return matchesQuery && matchesCategory && matchesSourceFormat;
  });

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-search", {
      detail: {
        query,
        filters,
        count: results.length,
        results,
      },
    })
  );

  return results;
}

function bagastudioGetProductLibraryCategories() {
  const categories = bagastudioReadProductLibrary()
    .map((item: any) => item?.category || "uncategorized")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort((a: any, b: any) =>
    String(a).localeCompare(String(b))
  );
}

function bagastudioGetProductLibraryCardData(query = "", filters: any = {}) {
  return bagastudioSearchProductLibrary(query, filters).map((item: any) => ({
    productId: item?.productId,
    productSlug: item?.productSlug,
    name: item?.name || "BagaStudio Product",
    category: item?.category || "uncategorized",
    version: item?.version || "1.0.0",
    sourceFormat: item?.sourceFormat || null,
    savedAt: item?.savedAt || null,
    updatedAt: item?.updatedAt || null,
    thumbnail: item?.thumbnail || null,
    hasPackage: Boolean(item?.package),
    hasAdminMapping: Boolean(item?.package?.adminMapping || item?.package?.productPackage?.adminMapping),
    hasImporterReport: Boolean(item?.package?.importerReport),
  }));
}

function bagastudioImportProductLibrary(libraryJson: any, options: any = {}) {
  const incomingLibrary = Array.isArray(libraryJson)
    ? libraryJson
    : Array.isArray(libraryJson?.items)
      ? libraryJson.items
      : [];

  if (!incomingLibrary.length) {
    const error = new Error("Invalid BagaStudio product library import");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-import-error", {
        detail: error,
      })
    );

    throw error;
  }

  const currentLibrary = options?.replace ? [] : bagastudioReadProductLibrary();
  const currentByKey = new Map(
    currentLibrary.map((item: any) => [item?.productId || item?.productSlug, item])
  );

  incomingLibrary.forEach((item: any) => {
    const key = item?.productId || item?.productSlug || bagastudioCreateProductLibraryId(item?.name);
    currentByKey.set(key, {
      ...item,
      productId: item?.productId || key,
      productSlug:
        item?.productSlug ||
        String(item?.name || key)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      updatedAt: new Date().toISOString(),
    });
  });

  const nextLibrary = Array.from(currentByKey.values()).sort((a: any, b: any) =>
    String(b?.updatedAt || b?.savedAt || "").localeCompare(String(a?.updatedAt || a?.savedAt || ""))
  );

  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-imported", {
      detail: {
        replace: Boolean(options?.replace),
        count: incomingLibrary.length,
        library: nextLibrary,
      },
    })
  );

  return nextLibrary;
}



/* =========================
   BagaStudio Product Loader V1
========================= */

let __bagastudioPreparedLibraryProduct: any = null;

function bagastudioExtractProductRuntimePackage(libraryItem: any) {
  const fullPackage = libraryItem?.package || libraryItem || null;
  const productPackage = fullPackage?.productPackage || fullPackage || null;

  return {
    libraryItem,
    fullPackage,
    productPackage,
    adminMapping:
      fullPackage?.adminMapping ||
      productPackage?.adminMapping ||
      null,
    importerReport:
      fullPackage?.importerReport ||
      productPackage?.importerReport ||
      null,
    thumbnail:
      fullPackage?.thumbnail ||
      productPackage?.thumbnail ||
      libraryItem?.thumbnail ||
      null,
    metadata: {
      ...(fullPackage?.metadata || {}),
      ...(productPackage?.metadata || {}),
      productId: libraryItem?.productId || productPackage?.productId || null,
      productSlug: libraryItem?.productSlug || productPackage?.productSlug || null,
      productName: libraryItem?.name || productPackage?.productName || productPackage?.name || null,
      category: libraryItem?.category || productPackage?.productCategory || null,
      sourceFormat: libraryItem?.sourceFormat || productPackage?.sourceFormat || null,
    },
  };
}

function bagastudioPrepareProductFromLibrary(productIdOrSlug: string, options: any = {}) {
  const libraryItem = bagastudioLoadProductFromLibrary(productIdOrSlug);
  const prepared = bagastudioExtractProductRuntimePackage(libraryItem);

  __bagastudioPreparedLibraryProduct = {
    ...prepared,
    preparedAt: new Date().toISOString(),
    options,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-prepared", {
      detail: __bagastudioPreparedLibraryProduct,
    })
  );

  if (options?.autoApply) {
    return bagastudioApplyPreparedProduct(options);
  }

  return __bagastudioPreparedLibraryProduct;
}

function bagastudioApplyPreparedProduct(options: any = {}) {
  if (!__bagastudioPreparedLibraryProduct) {
    const error = new Error("No prepared BagaStudio product available");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-loader-apply-error", {
        detail: error,
      })
    );

    throw error;
  }

  const prepared = __bagastudioPreparedLibraryProduct;

  __bagastudioLastSavedPackage = prepared.fullPackage || null;
  (window as any).bagastudioProductPackage = prepared.productPackage || null;
  (window as any).bagastudioAdminMapping = prepared.adminMapping || null;
  (window as any).bagastudioLastImporterReport = prepared.importerReport || null;
  (window as any).__bagastudioLastProductThumbnail = prepared.thumbnail || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = prepared.libraryItem || null;

  const safeApply = (window as any).bagastudioSafeApplyImporterState;
  if (options?.safeApply && typeof safeApply === "function") {
    try {
      safeApply();
    } catch (error) {
      console.warn("BagaStudio Product Loader safe apply skipped", error);
    }
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-applied", {
      detail: prepared,
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-ui-state-refresh", {
      detail: prepared,
    })
  );

  return prepared;
}

function bagastudioGetPreparedProduct() {
  return __bagastudioPreparedLibraryProduct;
}

if (typeof window !== "undefined") {
  window.bagastudioSaveCompleteProductPackage =
    bagastudioSaveCompleteProductPackageRuntime;

  window.bagastudioGetLastSavedProductPackage = () =>
    __bagastudioLastSavedPackage;


  window.bagastudioSaveLastProductToLibrary =
    bagastudioSaveLastProductToLibrary;
  window.bagastudioGetProductLibrary = bagastudioReadProductLibrary;
  window.bagastudioExportProductLibrary = bagastudioExportProductLibrary;
  window.bagastudioLoadProductFromLibrary = bagastudioLoadProductFromLibrary;
  window.bagastudioRemoveProductFromLibrary = bagastudioRemoveProductFromLibrary;
  window.bagastudioClearProductLibrary = bagastudioClearProductLibrary;
  window.bagastudioSearchProductLibrary = bagastudioSearchProductLibrary;
  window.bagastudioGetProductLibraryCategories = bagastudioGetProductLibraryCategories;
  window.bagastudioGetProductLibraryCardData = bagastudioGetProductLibraryCardData;
  window.bagastudioImportProductLibrary = bagastudioImportProductLibrary;
  window.bagastudioPrepareProductFromLibrary = bagastudioPrepareProductFromLibrary;
  window.bagastudioApplyPreparedProduct = bagastudioApplyPreparedProduct;
  window.bagastudioGetPreparedProduct = bagastudioGetPreparedProduct;
}




/* =========================
   BagaStudio Drag & Drop Importer V1
   Conservative runtime bridge: does not replace props or existing loader logic.
========================= */

declare global {
  interface Window {
    bagastudioEnableDragDropImporter?: () => any;
    bagastudioDisableDragDropImporter?: () => any;
    bagastudioGetLastDroppedImport?: () => any;
    bagastudioClearLastDroppedImport?: () => void;
  }
}

let __bagastudioDragDropInstalled = false;
let __bagastudioLastDroppedImport: any = null;
let __bagastudioDragDropCleanup: null | (() => void) = null;

const BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS = ["glb", "gltf", "obj", "fbx", "stl", "dae"];
const BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS = ["json"];

function bagastudioGetFileExtension(fileName: string) {
  return String(fileName || "")
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase() || "";
}

function bagastudioIsSupportedDragFile(file: File) {
  const ext = bagastudioGetFileExtension(file.name);
  return (
    BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS.includes(ext) ||
    BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS.includes(ext)
  );
}

function bagastudioReadDroppedJson(file: File) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result || "{}")));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read dropped JSON file"));
    reader.readAsText(file);
  });
}

async function bagastudioHandleDroppedFiles(files: File[]) {
  const validFiles = files.filter(bagastudioIsSupportedDragFile);

  if (!validFiles.length) {
    const warning = {
      status: "warning",
      message: "Nessun file supportato. Formati: GLB, GLTF, OBJ, FBX, STL, DAE, JSON.",
      droppedAt: new Date().toISOString(),
      files: files.map((file) => file.name),
    };

    window.dispatchEvent(new CustomEvent("bagastudio:drag-drop-import-warning", { detail: warning }));
    return warning;
  }

  const result: any = {
    status: "ready",
    droppedAt: new Date().toISOString(),
    models: [],
    packages: [],
    files: validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || null,
      extension: bagastudioGetFileExtension(file.name),
    })),
  };

  for (const file of validFiles) {
    const extension = bagastudioGetFileExtension(file.name);

    if (BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS.includes(extension)) {
      const objectUrl = URL.createObjectURL(file);
      const modelPayload = {
        name: file.name,
        size: file.size,
        type: file.type || null,
        format: extension,
        objectUrl,
        file,
        importedAt: new Date().toISOString(),
      };

      result.models.push(modelPayload);

      window.dispatchEvent(
        new CustomEvent("bagastudio:drag-drop-model-ready", {
          detail: modelPayload,
        })
      );
    }

    if (BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS.includes(extension)) {
      try {
        const json = await bagastudioReadDroppedJson(file);
        const packagePayload = {
          name: file.name,
          size: file.size,
          type: file.type || "application/json",
          json,
          importedAt: new Date().toISOString(),
        };

        result.packages.push(packagePayload);

        window.dispatchEvent(
          new CustomEvent("bagastudio:drag-drop-json-ready", {
            detail: packagePayload,
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent("bagastudio:drag-drop-json-error", {
            detail: {
              name: file.name,
              error,
              message: error instanceof Error ? error.message : "Errore lettura JSON",
            },
          })
        );
      }
    }
  }

  __bagastudioLastDroppedImport = result;

  window.dispatchEvent(
    new CustomEvent("bagastudio:drag-drop-import-ready", {
      detail: result,
    })
  );

  return result;
}

function bagastudioEnableDragDropImporterRuntime() {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  if (__bagastudioDragDropInstalled) {
    return {
      status: "already-enabled",
      lastDroppedImport: __bagastudioLastDroppedImport,
    };
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.add("bagastudio-drag-over");

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-over", {
        detail: { active: true },
      })
    );
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove("bagastudio-drag-over");

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-over", {
        detail: { active: false },
      })
    );
  };

  const onDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove("bagastudio-drag-over");

    const files = Array.from(event.dataTransfer?.files || []);

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-start", {
        detail: {
          count: files.length,
          files: files.map((file) => file.name),
        },
      })
    );

    try {
      await bagastudioHandleDroppedFiles(files);
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("bagastudio:drag-drop-import-error", {
          detail: {
            error,
            message: error instanceof Error ? error.message : "Errore import drag & drop",
          },
        })
      );
    }
  };

  window.addEventListener("dragover", onDragOver);
  window.addEventListener("dragleave", onDragLeave);
  window.addEventListener("drop", onDrop);

  __bagastudioDragDropCleanup = () => {
    window.removeEventListener("dragover", onDragOver);
    window.removeEventListener("dragleave", onDragLeave);
    window.removeEventListener("drop", onDrop);
    document.body.classList.remove("bagastudio-drag-over");
  };

  __bagastudioDragDropInstalled = true;

  const enabledPayload = {
    status: "enabled",
    supportedModelFormats: BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS,
    supportedPackageFormats: BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:drag-drop-importer-enabled", {
      detail: enabledPayload,
    })
  );

  return enabledPayload;
}

function bagastudioDisableDragDropImporterRuntime() {
  if (__bagastudioDragDropCleanup) {
    __bagastudioDragDropCleanup();
  }

  __bagastudioDragDropInstalled = false;
  __bagastudioDragDropCleanup = null;

  const disabledPayload = { status: "disabled" };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-importer-disabled", {
        detail: disabledPayload,
      })
    );
  }

  return disabledPayload;
}

if (typeof window !== "undefined") {
  (window as any).bagastudioEnableDragDropImporter = bagastudioEnableDragDropImporterRuntime;
  (window as any).bagastudioDisableDragDropImporter = bagastudioDisableDragDropImporterRuntime;
  (window as any).bagastudioGetLastDroppedImport = () => __bagastudioLastDroppedImport;
  (window as any).bagastudioClearLastDroppedImport = () => {
    __bagastudioLastDroppedImport = null;
  };

  bagastudioEnableDragDropImporterRuntime();
}


/* =========================
   BagaStudio Cloud Ready Storage Bridge V1
   Local-first bridge prepared for future backend/cloud persistence.
   It does not replace the current Product Library or Importer Save System.
========================= */

declare global {
  interface Window {
    bagastudioBuildCloudProductPayload?: (options?: any) => any;
    bagastudioSaveProductToCloudBridge?: (options?: any) => any;
    bagastudioGetCloudBridgeQueue?: () => any[];
    bagastudioClearCloudBridgeQueue?: () => any[];
    bagastudioMarkCloudBridgeItemSynced?: (cloudBridgeId: string, remoteData?: any) => any;
    bagastudioExportCloudBridgeQueue?: () => any[];
  }
}

const BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY = "bagastudio.cloudBridge.queue.v1";
let __bagastudioLastCloudBridgePayload: any = null;

function bagastudioReadCloudBridgeQueue(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio cloud bridge queue read failed", error);
    return [];
  }
}

function bagastudioWriteCloudBridgeQueue(queue: any[]) {
  if (typeof window === "undefined") return [];

  const normalizedQueue = Array.isArray(queue) ? queue : [];
  window.localStorage.setItem(
    BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY,
    JSON.stringify(normalizedQueue)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-queue-updated", {
      detail: normalizedQueue,
    })
  );

  return normalizedQueue;
}

function bagastudioBuildCloudProductPayloadRuntime(options: any = {}) {
  const savedPackage =
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const productPackage =
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const thumbnail =
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const catalogProduct =
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const payload = {
    cloudBridgeId:
      options.cloudBridgeId ||
      `cloud_bridge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    target: options.target || "local-first-cloud-ready",
    tenantId: options.tenantId || null,
    workspaceId: options.workspaceId || null,
    productId:
      options.productId ||
      catalogProduct?.productId ||
      productPackage?.productId ||
      productPackage?.id ||
      null,
    productSlug:
      options.productSlug ||
      catalogProduct?.productSlug ||
      productPackage?.productSlug ||
      null,
    productName:
      options.productName ||
      catalogProduct?.productName ||
      productPackage?.productName ||
      productPackage?.name ||
      "BagaStudio Imported Product",
    productCategory:
      options.productCategory ||
      catalogProduct?.productCategory ||
      productPackage?.productCategory ||
      "uncategorized",
    source: {
      engine: "BagaStudio Core",
      module: "CloudReadyStorageBridgeV1",
      mode: "local-first",
    },
    assets: {
      glb: options.glb || null,
      textureRefs: options.textureRefs || productPackage?.textureRefs || [],
      thumbnail,
    },
    data: {
      catalogProduct,
      productPackage,
      adminMapping,
      importerReport,
      savedPackage,
    },
    sync: {
      isSynced: false,
      remoteId: null,
      remoteUrl: null,
      syncedAt: null,
      lastError: null,
    },
  };

  __bagastudioLastCloudBridgePayload = payload;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:cloud-bridge-payload-ready", {
        detail: payload,
      })
    );
  }

  return payload;
}

function bagastudioSaveProductToCloudBridgeRuntime(options: any = {}) {
  const payload = bagastudioBuildCloudProductPayloadRuntime(options);
  const queue = bagastudioReadCloudBridgeQueue();
  const nextQueue = [payload, ...queue].slice(0, options.maxItems || 50);
  bagastudioWriteCloudBridgeQueue(nextQueue);

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-product-queued", {
      detail: payload,
    })
  );

  return payload;
}

function bagastudioMarkCloudBridgeItemSyncedRuntime(cloudBridgeId: string, remoteData: any = {}) {
  const queue = bagastudioReadCloudBridgeQueue();
  const updatedQueue = queue.map((item) => {
    if (item?.cloudBridgeId !== cloudBridgeId) return item;

    return {
      ...item,
      status: "synced",
      updatedAt: new Date().toISOString(),
      sync: {
        ...(item.sync || {}),
        isSynced: true,
        remoteId: remoteData.remoteId || item.sync?.remoteId || null,
        remoteUrl: remoteData.remoteUrl || item.sync?.remoteUrl || null,
        syncedAt: new Date().toISOString(),
        lastError: null,
      },
    };
  });

  bagastudioWriteCloudBridgeQueue(updatedQueue);

  const syncedItem = updatedQueue.find((item) => item?.cloudBridgeId === cloudBridgeId) || null;

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-item-synced", {
      detail: syncedItem,
    })
  );

  return syncedItem;
}

if (typeof window !== "undefined") {
  window.bagastudioBuildCloudProductPayload = bagastudioBuildCloudProductPayloadRuntime;
  window.bagastudioSaveProductToCloudBridge = bagastudioSaveProductToCloudBridgeRuntime;
  window.bagastudioGetCloudBridgeQueue = bagastudioReadCloudBridgeQueue;
  window.bagastudioClearCloudBridgeQueue = () => bagastudioWriteCloudBridgeQueue([]);
  window.bagastudioMarkCloudBridgeItemSynced = bagastudioMarkCloudBridgeItemSyncedRuntime;
  window.bagastudioExportCloudBridgeQueue = () => bagastudioReadCloudBridgeQueue();

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-ready", {
      detail: {
        status: "ready",
        mode: "local-first",
        storageKey: BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY,
      },
    })
  );
}



/* =========================
   BagaStudio Versioning & Backup V1
   Local-first product/package backup system for catalog-safe recovery.
   Keeps Cloud Bridge, Product Library and Importer Save System untouched.
========================= */

declare global {
  interface Window {
    bagastudioCreateProductBackup?: (options?: any) => any;
    bagastudioGetProductBackups?: () => any[];
    bagastudioGetProductBackupById?: (backupId: string) => any;
    bagastudioRestoreProductBackup?: (backupId: string) => any;
    bagastudioDeleteProductBackup?: (backupId: string) => any[];
    bagastudioClearProductBackups?: () => any[];
    bagastudioExportProductBackups?: () => any[];
  }
}

const BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY = "bagastudio.productBackups.v1";
let __bagastudioLastProductBackup: any = null;
let __bagastudioLastRestoredProductBackup: any = null;

function bagastudioReadProductBackupsRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio product backups read failed", error);
    return [];
  }
}

function bagastudioWriteProductBackupsRuntime(backups: any[]) {
  if (typeof window === "undefined") return [];

  const normalizedBackups = Array.isArray(backups) ? backups : [];
  window.localStorage.setItem(
    BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY,
    JSON.stringify(normalizedBackups)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backups-updated", {
      detail: normalizedBackups,
    })
  );

  return normalizedBackups;
}

function bagastudioBuildProductBackupRuntime(options: any = {}) {
  const savedPackage =
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const productPackage =
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const catalogProduct =
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const thumbnail =
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const cloudPayload =
    (window as any).bagastudioBuildCloudProductPayload?.({
      target: "backup-snapshot",
    }) ||
    null;

  const createdAt = new Date().toISOString();
  const productId =
    options.productId ||
    catalogProduct?.productId ||
    productPackage?.productId ||
    productPackage?.id ||
    `bagastudio_product_${Date.now()}`;

  const backup = {
    backupId:
      options.backupId ||
      `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    backupVersion: "1.0.0",
    createdAt,
    updatedAt: createdAt,
    reason: options.reason || "manual-backup",
    label:
      options.label ||
      catalogProduct?.productName ||
      productPackage?.productName ||
      productPackage?.name ||
      "BagaStudio Product Backup",
    productId,
    productSlug:
      options.productSlug ||
      catalogProduct?.productSlug ||
      productPackage?.productSlug ||
      null,
    productCategory:
      options.productCategory ||
      catalogProduct?.productCategory ||
      productPackage?.productCategory ||
      "uncategorized",
    source: {
      engine: "BagaStudio Core",
      module: "VersioningBackupV1",
      mode: "local-first",
    },
    snapshot: {
      catalogProduct,
      productPackage,
      adminMapping,
      importerReport,
      thumbnail,
      savedPackage,
      cloudPayload,
    },
    restore: {
      canRestoreProductPackage: !!productPackage,
      canRestoreAdminMapping: !!adminMapping,
      canRestoreCatalogProduct: !!catalogProduct,
      canRestoreThumbnail: !!thumbnail,
    },
  };

  __bagastudioLastProductBackup = backup;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-built", {
      detail: backup,
    })
  );

  return backup;
}

function bagastudioCreateProductBackupRuntime(options: any = {}) {
  const backup = bagastudioBuildProductBackupRuntime(options);
  const backups = bagastudioReadProductBackupsRuntime();
  const maxItems = Number.isFinite(options.maxItems) ? options.maxItems : 25;
  const nextBackups = [backup, ...backups].slice(0, maxItems);

  bagastudioWriteProductBackupsRuntime(nextBackups);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-created", {
      detail: backup,
    })
  );

  return backup;
}

function bagastudioGetProductBackupByIdRuntime(backupId: string) {
  const backups = bagastudioReadProductBackupsRuntime();
  return backups.find((backup) => backup?.backupId === backupId) || null;
}

function bagastudioRestoreProductBackupRuntime(backupId: string) {
  const backup = bagastudioGetProductBackupByIdRuntime(backupId);

  if (!backup) {
    const result = {
      status: "error",
      backupId,
      message: "Backup not found",
    };

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-backup-restore-error", {
        detail: result,
      })
    );

    return result;
  }

  const snapshot = backup.snapshot || {};

  if (snapshot.productPackage) {
    (window as any).bagastudioProductPackage = snapshot.productPackage;
  }

  if (snapshot.adminMapping) {
    (window as any).bagastudioAdminMapping = snapshot.adminMapping;
  }

  if (snapshot.importerReport) {
    (window as any).bagastudioLastImporterReport = snapshot.importerReport;
  }

  if (snapshot.catalogProduct) {
    (window as any).bagastudioCatalogProduct = snapshot.catalogProduct;
  }

  if (snapshot.thumbnail) {
    (window as any).__bagastudioLastProductThumbnail = snapshot.thumbnail;
  }

  if (snapshot.savedPackage) {
    (window as any).__bagastudioLastCompleteProductPackage = snapshot.savedPackage;
  }

  __bagastudioLastRestoredProductBackup = backup;

  const result = {
    status: "restored",
    backupId,
    restoredAt: new Date().toISOString(),
    backup,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-restored", {
      detail: result,
    })
  );

  return result;
}

function bagastudioDeleteProductBackupRuntime(backupId: string) {
  const backups = bagastudioReadProductBackupsRuntime();
  const nextBackups = backups.filter((backup) => backup?.backupId !== backupId);
  bagastudioWriteProductBackupsRuntime(nextBackups);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-deleted", {
      detail: {
        backupId,
        remaining: nextBackups.length,
      },
    })
  );

  return nextBackups;
}

if (typeof window !== "undefined") {
  window.bagastudioCreateProductBackup = bagastudioCreateProductBackupRuntime;
  window.bagastudioGetProductBackups = bagastudioReadProductBackupsRuntime;
  window.bagastudioGetProductBackupById = bagastudioGetProductBackupByIdRuntime;
  window.bagastudioRestoreProductBackup = bagastudioRestoreProductBackupRuntime;
  window.bagastudioDeleteProductBackup = bagastudioDeleteProductBackupRuntime;
  window.bagastudioClearProductBackups = () => bagastudioWriteProductBackupsRuntime([]);
  window.bagastudioExportProductBackups = () => bagastudioReadProductBackupsRuntime();

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-system-ready", {
      detail: {
        status: "ready",
        storageKey: BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY,
        mode: "local-first",
      },
    })
  );
}


/* -------------------------------------------------------------
   BagaStudio Product Registry / Index V1
   Local-first index for catalog search, Admin lists and future SaaS sync.
------------------------------------------------------------- */

declare global {
  interface Window {
    bagastudioRegisterCurrentProduct?: (options?: any) => any;
    bagastudioGetProductRegistry?: () => any[];
    bagastudioSearchProductRegistry?: (query?: string, filters?: any) => any[];
    bagastudioGetProductRegistryItem?: (productId: string) => any;
    bagastudioRemoveProductRegistryItem?: (productId: string) => any[];
    bagastudioClearProductRegistry?: () => any[];
    bagastudioExportProductRegistry?: () => any[];
  }
}

const BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY = "bagastudio.productRegistry.v1";
let __bagastudioLastRegisteredProduct: any = null;

function bagastudioSafeSlugRuntime(value: string) {
  return String(value || "bagastudio-product")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bagastudio-product";
}

function bagastudioReadProductRegistryRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio product registry read failed", error);
    return [];
  }
}

function bagastudioWriteProductRegistryRuntime(items: any[]) {
  if (typeof window === "undefined") return [];

  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];

  try {
    window.localStorage.setItem(
      BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
      JSON.stringify(cleanItems)
    );
  } catch (error) {
    console.warn("BagaStudio product registry write failed", error);
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-updated", {
      detail: {
        storageKey: BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
        count: cleanItems.length,
        items: cleanItems,
      },
    })
  );

  return cleanItems;
}

function bagastudioBuildProductRegistryItemRuntime(options: any = {}) {
  const savedPackage =
    options.savedPackage ||
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const catalogProduct =
    options.catalogProduct ||
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const productPackage =
    options.productPackage ||
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    options.adminMapping ||
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    options.importerReport ||
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const thumbnail =
    options.thumbnail ||
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const productId =
    options.productId ||
    catalogProduct?.productId ||
    productPackage?.productId ||
    savedPackage?.productId ||
    `bagastudio_product_${Date.now()}`;

  const productName =
    options.productName ||
    catalogProduct?.productName ||
    productPackage?.productName ||
    savedPackage?.productName ||
    "BagaStudio Product";

  const category =
    options.category ||
    catalogProduct?.productCategory ||
    productPackage?.productCategory ||
    savedPackage?.productCategory ||
    "uncategorized";

  const components =
    productPackage?.components ||
    adminMapping?.components ||
    savedPackage?.components ||
    [];

  const componentCount = Array.isArray(components) ? components.length : 0;
  const sourceFormat =
    options.sourceFormat ||
    catalogProduct?.sourceFormat ||
    productPackage?.sourceFormat ||
    importerReport?.sourceFormat ||
    savedPackage?.sourceFormat ||
    "unknown";

  const now = new Date().toISOString();
  const productSlug =
    options.productSlug ||
    catalogProduct?.productSlug ||
    bagastudioSafeSlugRuntime(productName);

  const registryItem = {
    productId,
    productSlug,
    productName,
    category,
    sourceFormat,
    componentCount,
    status: options.status || "draft",
    tags: Array.isArray(options.tags) ? options.tags : [],
    createdAt:
      options.createdAt ||
      catalogProduct?.createdAt ||
      productPackage?.createdAt ||
      savedPackage?.createdAt ||
      now,
    updatedAt: now,
    engineVersion:
      options.engineVersion ||
      catalogProduct?.engineVersion ||
      productPackage?.engineVersion ||
      "BagaStudio Core Importer Save System V1",
    thumbnailPreview: thumbnail
      ? {
          generatedAt: thumbnail.generatedAt || null,
          width: thumbnail.width || null,
          height: thumbnail.height || null,
          type: thumbnail.type || "image/png",
          dataUrl: thumbnail.dataUrl || null,
        }
      : null,
    references: {
      hasSavedPackage: Boolean(savedPackage),
      hasProductPackage: Boolean(productPackage),
      hasAdminMapping: Boolean(adminMapping),
      hasImporterReport: Boolean(importerReport),
      hasThumbnail: Boolean(thumbnail),
    },
    searchText: [productName, productSlug, category, sourceFormat, ...(Array.isArray(options.tags) ? options.tags : [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    module: "ProductRegistryIndexV1",
  };

  __bagastudioLastRegisteredProduct = registryItem;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-item-built", {
      detail: registryItem,
    })
  );

  return registryItem;
}

function bagastudioRegisterCurrentProductRuntime(options: any = {}) {
  const item = bagastudioBuildProductRegistryItemRuntime(options);
  const registry = bagastudioReadProductRegistryRuntime();
  const withoutCurrent = registry.filter((entry) => entry?.productId !== item.productId);
  const nextRegistry = [item, ...withoutCurrent].slice(0, 500);

  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registered", {
      detail: {
        item,
        count: nextRegistry.length,
      },
    })
  );

  return item;
}

function bagastudioSearchProductRegistryRuntime(query = "", filters: any = {}) {
  const registry = bagastudioReadProductRegistryRuntime();
  const normalizedQuery = String(query || "").trim().toLowerCase();

  return registry.filter((item) => {
    const matchesQuery = !normalizedQuery || String(item?.searchText || "").includes(normalizedQuery);
    const matchesCategory = !filters?.category || item?.category === filters.category;
    const matchesStatus = !filters?.status || item?.status === filters.status;
    const matchesFormat = !filters?.sourceFormat || item?.sourceFormat === filters.sourceFormat;
    return matchesQuery && matchesCategory && matchesStatus && matchesFormat;
  });
}

function bagastudioGetProductRegistryItemRuntime(productId: string) {
  return bagastudioReadProductRegistryRuntime().find((item) => item?.productId === productId) || null;
}

function bagastudioRemoveProductRegistryItemRuntime(productId: string) {
  const registry = bagastudioReadProductRegistryRuntime();
  const nextRegistry = registry.filter((item) => item?.productId !== productId);
  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-item-removed", {
      detail: {
        productId,
        count: nextRegistry.length,
      },
    })
  );

  return nextRegistry;
}

if (typeof window !== "undefined") {
  window.bagastudioRegisterCurrentProduct = bagastudioRegisterCurrentProductRuntime;
  window.bagastudioGetProductRegistry = bagastudioReadProductRegistryRuntime;
  window.bagastudioSearchProductRegistry = bagastudioSearchProductRegistryRuntime;
  window.bagastudioGetProductRegistryItem = bagastudioGetProductRegistryItemRuntime;
  window.bagastudioRemoveProductRegistryItem = bagastudioRemoveProductRegistryItemRuntime;
  window.bagastudioClearProductRegistry = () => bagastudioWriteProductRegistryRuntime([]);
  window.bagastudioExportProductRegistry = () => bagastudioReadProductRegistryRuntime();

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-ready", {
      detail: {
        status: "ready",
        storageKey: BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
        mode: "local-first",
      },
    })
  );
}


/* -------------------------------------------------------------
   BagaStudio Filters + Tags V1
   Advanced local catalog filters, facets, sorting and tag helpers.
------------------------------------------------------------- */

declare global {
  interface Window {
    bagastudioSearchProductsAdvanced?: (params?: any) => any;
    bagastudioGetProductRegistryFacets?: () => any;
    bagastudioAddProductTags?: (productId: string, tags: string[]) => any;
    bagastudioRemoveProductTags?: (productId: string, tags: string[]) => any;
    bagastudioSetProductFavorite?: (productId: string, favorite?: boolean) => any;
    bagastudioSetProductArchived?: (productId: string, archived?: boolean) => any;
  }
}

function bagastudioNormalizeCatalogTokenRuntime(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function bagastudioNormalizeTagListRuntime(tags: any): string[] {
  const source = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return Array.from(
    new Set(
      source
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );
}

function bagastudioUpdateProductRegistryEntryRuntime(productId: string, updater: (item: any) => any) {
  const registry = bagastudioReadProductRegistryRuntime();
  let updatedItem: any = null;

  const nextRegistry = registry.map((item) => {
    if (item?.productId !== productId) return item;
    updatedItem = updater({ ...item });
    return updatedItem;
  });

  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-entry-updated", {
      detail: {
        productId,
        item: updatedItem,
        count: nextRegistry.length,
      },
    })
  );

  return updatedItem;
}

function bagastudioGetProductRegistryFacetsRuntime() {
  const registry = bagastudioReadProductRegistryRuntime();

  const facets = registry.reduce(
    (acc, item) => {
      const category = item?.category || "uncategorized";
      const status = item?.status || "unknown";
      const sourceFormat = item?.sourceFormat || item?.format || "unknown";
      const tags = bagastudioNormalizeTagListRuntime(item?.tags || []);

      acc.categories[category] = (acc.categories[category] || 0) + 1;
      acc.statuses[status] = (acc.statuses[status] || 0) + 1;
      acc.sourceFormats[sourceFormat] = (acc.sourceFormats[sourceFormat] || 0) + 1;
      tags.forEach((tag) => {
        acc.tags[tag] = (acc.tags[tag] || 0) + 1;
      });

      if (item?.favorite) acc.favorites += 1;
      if (item?.archived) acc.archived += 1;

      return acc;
    },
    {
      total: registry.length,
      favorites: 0,
      archived: 0,
      categories: {} as Record<string, number>,
      statuses: {} as Record<string, number>,
      sourceFormats: {} as Record<string, number>,
      tags: {} as Record<string, number>,
    }
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-facets", {
      detail: facets,
    })
  );

  return facets;
}

function bagastudioSearchProductsAdvancedRuntime(params: any = {}) {
  const {
    query = "",
    category,
    status,
    sourceFormat,
    tags = [],
    favorite,
    archived = false,
    sortBy = "updatedAt",
    sortDirection = "desc",
    limit = 100,
  } = params || {};

  const normalizedQuery = bagastudioNormalizeCatalogTokenRuntime(query);
  const normalizedTags = bagastudioNormalizeTagListRuntime(tags).map(bagastudioNormalizeCatalogTokenRuntime);

  const registry = bagastudioReadProductRegistryRuntime();

  const filtered = registry.filter((item) => {
    const itemTags = bagastudioNormalizeTagListRuntime(item?.tags || []).map(bagastudioNormalizeCatalogTokenRuntime);
    const searchable = [
      item?.searchText,
      item?.productId,
      item?.productSlug,
      item?.name,
      item?.displayName,
      item?.category,
      item?.sourceFormat,
      itemTags.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesCategory = !category || item?.category === category;
    const matchesStatus = !status || item?.status === status;
    const matchesFormat = !sourceFormat || item?.sourceFormat === sourceFormat || item?.format === sourceFormat;
    const matchesTags = normalizedTags.length === 0 || normalizedTags.every((tag) => itemTags.includes(tag));
    const matchesFavorite = typeof favorite !== "boolean" || Boolean(item?.favorite) === favorite;
    const matchesArchived = typeof archived !== "boolean" || Boolean(item?.archived) === archived;

    return matchesQuery && matchesCategory && matchesStatus && matchesFormat && matchesTags && matchesFavorite && matchesArchived;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a?.[sortBy] || "";
    const bv = b?.[sortBy] || "";
    const result = String(av).localeCompare(String(bv));
    return sortDirection === "asc" ? result : -result;
  });

  const result = {
    query,
    filters: { category, status, sourceFormat, tags: normalizedTags, favorite, archived },
    sortBy,
    sortDirection,
    total: sorted.length,
    items: sorted.slice(0, Number(limit) || 100),
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-search-results", {
      detail: result,
    })
  );

  return result;
}

function bagastudioAddProductTagsRuntime(productId: string, tags: string[]) {
  const newTags = bagastudioNormalizeTagListRuntime(tags);
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    tags: bagastudioNormalizeTagListRuntime([...(item?.tags || []), ...newTags]),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioRemoveProductTagsRuntime(productId: string, tags: string[]) {
  const removeTags = bagastudioNormalizeTagListRuntime(tags).map(bagastudioNormalizeCatalogTokenRuntime);
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    tags: bagastudioNormalizeTagListRuntime(item?.tags || []).filter(
      (tag) => !removeTags.includes(bagastudioNormalizeCatalogTokenRuntime(tag))
    ),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioSetProductFavoriteRuntime(productId: string, favorite = true) {
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    favorite: Boolean(favorite),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioSetProductArchivedRuntime(productId: string, archived = true) {
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    archived: Boolean(archived),
    updatedAt: new Date().toISOString(),
  }));
}

if (typeof window !== "undefined") {
  window.bagastudioSearchProductsAdvanced = bagastudioSearchProductsAdvancedRuntime;
  window.bagastudioGetProductRegistryFacets = bagastudioGetProductRegistryFacetsRuntime;
  window.bagastudioAddProductTags = bagastudioAddProductTagsRuntime;
  window.bagastudioRemoveProductTags = bagastudioRemoveProductTagsRuntime;
  window.bagastudioSetProductFavorite = bagastudioSetProductFavoriteRuntime;
  window.bagastudioSetProductArchived = bagastudioSetProductArchivedRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:filters-tags-ready", {
      detail: {
        status: "ready",
        features: ["advanced-search", "facets", "tags", "favorites", "archive"],
      },
    })
  );
}

// ============================================================
// BagaStudio Core - Smart Collections V1
// Conservative runtime layer for catalog grouping and saved views.
// ============================================================

declare global {
  interface Window {
    bagastudioCreateProductCollection?: (collection: any) => any;
    bagastudioGetProductCollections?: () => any[];
    bagastudioUpdateProductCollection?: (collectionId: string, patch: any) => any;
    bagastudioDeleteProductCollection?: (collectionId: string) => any;
    bagastudioAddProductsToCollection?: (collectionId: string, productIds: string[]) => any;
    bagastudioRemoveProductsFromCollection?: (collectionId: string, productIds: string[]) => any;
    bagastudioGetCollectionProducts?: (collectionId: string) => any;
    bagastudioCreateSmartCollection?: (collection: any) => any;
    bagastudioRefreshSmartCollection?: (collectionId: string) => any;
  }
}

const BAGASTUDIO_PRODUCT_COLLECTIONS_KEY = "bagastudio_product_collections_v1";

function bagastudioReadProductCollectionsRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_COLLECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio collections read failed", error);
    return [];
  }
}

function bagastudioWriteProductCollectionsRuntime(collections: any[]) {
  if (typeof window === "undefined") return [];

  const safeCollections = Array.isArray(collections) ? collections : [];
  window.localStorage.setItem(BAGASTUDIO_PRODUCT_COLLECTIONS_KEY, JSON.stringify(safeCollections, null, 2));

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collections-updated", {
      detail: {
        total: safeCollections.length,
        collections: safeCollections,
      },
    })
  );

  return safeCollections;
}

function bagastudioCreateProductCollectionRuntime(collection: any = {}) {
  const now = new Date().toISOString();
  const name = String(collection?.name || collection?.displayName || "Nuova collezione").trim();
  const collectionId = String(
    collection?.collectionId ||
      collection?.id ||
      `collection_${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || Date.now()}_${Date.now()}`
  );

  const nextCollection = {
    collectionId,
    id: collectionId,
    name,
    displayName: collection?.displayName || name,
    description: collection?.description || "",
    type: collection?.type || "manual",
    productIds: Array.isArray(collection?.productIds) ? Array.from(new Set(collection.productIds.map(String))) : [],
    query: collection?.query || null,
    filters: collection?.filters || {},
    tags: bagastudioNormalizeTagListRuntime(collection?.tags || []),
    createdAt: collection?.createdAt || now,
    updatedAt: now,
  };

  const collections = bagastudioReadProductCollectionsRuntime();
  const filtered = collections.filter((item) => item?.collectionId !== collectionId && item?.id !== collectionId);
  const result = bagastudioWriteProductCollectionsRuntime([nextCollection, ...filtered]);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-created", {
      detail: nextCollection,
    })
  );

  return nextCollection;
}

function bagastudioUpdateProductCollectionRuntime(collectionId: string, patch: any = {}) {
  const now = new Date().toISOString();
  const collections = bagastudioReadProductCollectionsRuntime();
  let updated: any = null;

  const next = collections.map((item) => {
    if (item?.collectionId !== collectionId && item?.id !== collectionId) return item;

    updated = {
      ...item,
      ...patch,
      collectionId: item?.collectionId || collectionId,
      id: item?.id || collectionId,
      tags: patch?.tags ? bagastudioNormalizeTagListRuntime(patch.tags) : item?.tags || [],
      updatedAt: now,
    };

    return updated;
  });

  bagastudioWriteProductCollectionsRuntime(next);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-updated", {
      detail: updated,
    })
  );

  return updated;
}

function bagastudioDeleteProductCollectionRuntime(collectionId: string) {
  const collections = bagastudioReadProductCollectionsRuntime();
  const next = collections.filter((item) => item?.collectionId !== collectionId && item?.id !== collectionId);
  bagastudioWriteProductCollectionsRuntime(next);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-deleted", {
      detail: { collectionId },
    })
  );

  return { collectionId, deleted: collections.length !== next.length };
}

function bagastudioAddProductsToCollectionRuntime(collectionId: string, productIds: string[] = []) {
  const ids = Array.from(new Set((productIds || []).map(String).filter(Boolean)));
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  if (!collection) return null;

  const currentIds = Array.isArray(collection.productIds) ? collection.productIds.map(String) : [];
  return bagastudioUpdateProductCollectionRuntime(collectionId, {
    productIds: Array.from(new Set([...currentIds, ...ids])),
  });
}

function bagastudioRemoveProductsFromCollectionRuntime(collectionId: string, productIds: string[] = []) {
  const removeIds = new Set((productIds || []).map(String).filter(Boolean));
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  if (!collection) return null;

  const currentIds = Array.isArray(collection.productIds) ? collection.productIds.map(String) : [];
  return bagastudioUpdateProductCollectionRuntime(collectionId, {
    productIds: currentIds.filter((id: string) => !removeIds.has(id)),
  });
}

function bagastudioGetCollectionProductsRuntime(collectionId: string) {
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  const registry = bagastudioReadProductRegistryRuntime();

  if (!collection) {
    return { collectionId, collection: null, total: 0, items: [] };
  }

  let items: any[] = [];

  if (collection.type === "smart") {
    const result = bagastudioSearchProductsAdvancedRuntime({
      query: collection?.query || "",
      ...(collection?.filters || {}),
      limit: 1000,
    });
    items = result?.items || [];
  } else {
    const ids = new Set((collection.productIds || []).map(String));
    items = registry.filter((item) => ids.has(String(item?.productId || item?.id)));
  }

  const result = {
    collectionId: collection.collectionId || collection.id,
    collection,
    total: items.length,
    items,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-products", {
      detail: result,
    })
  );

  return result;
}

function bagastudioCreateSmartCollectionRuntime(collection: any = {}) {
  return bagastudioCreateProductCollectionRuntime({
    ...collection,
    type: "smart",
    productIds: [],
    query: collection?.query || "",
    filters: collection?.filters || {},
  });
}

function bagastudioRefreshSmartCollectionRuntime(collectionId: string) {
  const result = bagastudioGetCollectionProductsRuntime(collectionId);

  window.dispatchEvent(
    new CustomEvent("bagastudio:smart-collection-refreshed", {
      detail: result,
    })
  );

  return result;
}

if (typeof window !== "undefined") {
  window.bagastudioCreateProductCollection = bagastudioCreateProductCollectionRuntime;
  window.bagastudioGetProductCollections = bagastudioReadProductCollectionsRuntime;
  window.bagastudioUpdateProductCollection = bagastudioUpdateProductCollectionRuntime;
  window.bagastudioDeleteProductCollection = bagastudioDeleteProductCollectionRuntime;
  window.bagastudioAddProductsToCollection = bagastudioAddProductsToCollectionRuntime;
  window.bagastudioRemoveProductsFromCollection = bagastudioRemoveProductsFromCollectionRuntime;
  window.bagastudioGetCollectionProducts = bagastudioGetCollectionProductsRuntime;
  window.bagastudioCreateSmartCollection = bagastudioCreateSmartCollectionRuntime;
  window.bagastudioRefreshSmartCollection = bagastudioRefreshSmartCollectionRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:smart-collections-ready", {
      detail: {
        status: "ready",
        features: ["manual-collections", "smart-collections", "saved-views", "collection-products"],
      },
    })
  );
}

// ============================================================
// BagaStudio Core - AI Recommendation Engine V1
// Conservative runtime layer for AI-ready metadata, semantic index,
// similar products and catalog recommendations.
// ============================================================

declare global {
  interface Window {
    bagastudioBuildAiCatalogIndex?: () => any[];
    bagastudioGetAiProductMetadata?: (productId: string) => any;
    bagastudioFindSimilarProducts?: (productId: string, limit?: number) => any;
    bagastudioRecommendProducts?: (criteria?: any, limit?: number) => any;
  }
}

const BAGASTUDIO_AI_INDEX_KEY = "bagastudio_ai_catalog_index_v1";

function bagastudioNormalizeAiTextRuntime(value: any): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioTokenizeAiRuntime(value: any): string[] {
  const normalized = bagastudioNormalizeAiTextRuntime(value);
  return Array.from(
    new Set(
      normalized
        .split(/[^a-z0-9]+/i)
        .map((token: string) => token.trim())
        .filter((token: string) => token.length >= 2)
    )
  );
}

function bagastudioReadAiRegistryRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    if (typeof window.bagastudioGetProductRegistry === "function") {
      const registry = window.bagastudioGetProductRegistry();
      return Array.isArray(registry) ? registry : [];
    }
  } catch (error) {
    console.warn("BagaStudio AI registry bridge failed", error);
  }

  try {
    const raw = window.localStorage.getItem("bagastudio_product_registry_v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio AI registry read failed", error);
    return [];
  }
}

function bagastudioBuildAiMetadataRuntime(product: any): any {
  const productId = String(product?.productId || product?.id || product?.slug || `product_${Date.now()}`);
  const name = String(product?.name || product?.productName || product?.title || productId);
  const category = String(product?.category || product?.productCategory || "uncategorized");
  const tags = Array.isArray(product?.tags) ? product.tags.map(String) : [];
  const materials = Array.isArray(product?.materials) ? product.materials.map(String) : [];
  const collections = Array.isArray(product?.collections) ? product.collections.map(String) : [];
  const sourceText = [
    productId,
    name,
    category,
    product?.description,
    product?.sourceFormat,
    product?.engineVersion,
    ...tags,
    ...materials,
    ...collections,
  ].join(" ");
  const semanticTags = Array.from(new Set([...tags, ...materials, category, ...bagastudioTokenizeAiRuntime(sourceText)]));

  return {
    productId,
    name,
    category,
    tags,
    materials,
    collections,
    semanticTags,
    searchText: bagastudioNormalizeAiTextRuntime(sourceText),
    aiScore: semanticTags.length + (product?.thumbnail ? 5 : 0) + (product?.productPackage ? 10 : 0),
    sourceFormat: product?.sourceFormat || product?.metadata?.sourceFormat || null,
    thumbnail: product?.thumbnail || product?.preview || null,
    raw: product,
    indexedAt: new Date().toISOString(),
  };
}

function bagastudioBuildAiCatalogIndexRuntime(): any[] {
  const registry = bagastudioReadAiRegistryRuntime();
  const index = registry.map((product: any) => bagastudioBuildAiMetadataRuntime(product));

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(BAGASTUDIO_AI_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.warn("BagaStudio AI index save failed", error);
    }

    window.dispatchEvent(
      new CustomEvent("bagastudio:ai-catalog-index-ready", {
        detail: {
          status: "ready",
          total: index.length,
          index,
        },
      })
    );
  }

  return index;
}

function bagastudioReadAiCatalogIndexRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_AI_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (error) {
    console.warn("BagaStudio AI index read failed", error);
  }

  return bagastudioBuildAiCatalogIndexRuntime();
}

function bagastudioGetAiProductMetadataRuntime(productId: string): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const found = index.find((item: any) => String(item?.productId) === String(productId));

  window.dispatchEvent(
    new CustomEvent("bagastudio:ai-product-metadata", {
      detail: found || null,
    })
  );

  return found || null;
}

function bagastudioSimilarityScoreRuntime(a: any, b: any): number {
  const aTags = new Set((a?.semanticTags || []).map(String));
  const bTags = new Set((b?.semanticTags || []).map(String));
 const shared = (Array.from(aTags) as string[]).filter((tag: string) => bTags.has(tag)).length;
  const categoryBoost = a?.category && b?.category && a.category === b.category ? 5 : 0;
  const materialBoost = (a?.materials || []).some((material: string) => (b?.materials || []).includes(material)) ? 3 : 0;
  return shared + categoryBoost + materialBoost;
}

function bagastudioFindSimilarProductsRuntime(productId: string, limit = 6): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const source = index.find((item: any) => String(item?.productId) === String(productId));

  if (!source) {
    const emptyResult = { productId, total: 0, items: [] };
    window.dispatchEvent(new CustomEvent("bagastudio:similar-products-ready", { detail: emptyResult }));
    return emptyResult;
  }

  const items = index
    .filter((item: any) => String(item?.productId) !== String(productId))
    .map((item: any) => ({
      ...item,
      similarityScore: bagastudioSimilarityScoreRuntime(source, item),
    }))
    .filter((item: any) => item.similarityScore > 0)
    .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  const result = { productId, total: items.length, source, items };
  window.dispatchEvent(new CustomEvent("bagastudio:similar-products-ready", { detail: result }));
  return result;
}

function bagastudioRecommendProductsRuntime(criteria: any = {}, limit = 8): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const queryTokens = bagastudioTokenizeAiRuntime(criteria?.query || criteria?.text || "");
  const category = criteria?.category ? String(criteria.category) : "";
  const tags = Array.isArray(criteria?.tags) ? criteria.tags.map(String) : [];

  const items = index
    .map((item: any) => {
      const semanticTags = new Set((item?.semanticTags || []).map(String));
      const queryScore = queryTokens.filter((token: string) => semanticTags.has(token) || item?.searchText?.includes(token)).length;
      const categoryScore = category && item?.category === category ? 6 : 0;
      const tagScore = tags.filter((tag: string) => semanticTags.has(tag)).length * 2;
      const score = queryScore + categoryScore + tagScore + Number(item?.aiScore || 0) * 0.05;
      return { ...item, recommendationScore: score };
    })
    .filter((item: any) => item.recommendationScore > 0 || (!criteria?.query && !category && tags.length === 0))
    .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  const result = {
    criteria,
    total: items.length,
    items,
    generatedAt: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("bagastudio:product-recommendations-ready", { detail: result }));
  return result;
}

if (typeof window !== "undefined") {
  window.bagastudioBuildAiCatalogIndex = bagastudioBuildAiCatalogIndexRuntime;
  window.bagastudioGetAiProductMetadata = bagastudioGetAiProductMetadataRuntime;
  window.bagastudioFindSimilarProducts = bagastudioFindSimilarProductsRuntime;
  window.bagastudioRecommendProducts = bagastudioRecommendProductsRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:ai-recommendation-engine-ready", {
      detail: {
        status: "ready",
        features: [
          "ai-metadata",
          "semantic-index",
          "similar-products",
          "recommendations",
          "future-ai-assistant-bridge",
        ],
      },
    })
  );
}
