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


function inferModelFormat(url: string, explicitFormat?: string) {
  const format = String(explicitFormat || "").toLowerCase().replace(".", "");
  if (format) return format;

  if (url.startsWith("data:")) {
    if (url.includes("model/gltf") || url.includes("model/glb")) return "glb";
    if (url.includes("model/stl")) return "stl";
    if (url.includes("model/obj")) return "obj";
    if (url.includes("model/fbx")) return "fbx";
    if (url.includes("model/vnd.collada") || url.includes("model/dae") || url.includes("collada")) return "dae";
    return "glb";
  }

  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.split(".").pop() || "glb";
}

function forcePreviewMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const apply = (mat: THREE.Material) => {
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else if (mesh.material) apply(mesh.material as THREE.Material);
  });
}


type BagaStudioRuntimeComponent = {
  id: string;
  index: number;
  meshName: string;
  originalName: string;
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

function applyProductPackageToImportedRoot(root: THREE.Object3D, productPackage: BagaStudioProductPackage) {
  const componentsById = new Map(productPackage.components.map((component) => [component.id, component]));
  const componentsByMeshName = new Map(productPackage.components.map((component) => [component.meshName, component]));

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

  root.userData.bagastudioRuntimeComponents = productPackage.components;

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

  useEffect(() => {
    let cancelled = false;
    setLoadedRoot(null);
    setLoadError(null);

    const format = runtimeModelFormat;

    const onLoaded = (object: THREE.Object3D) => {
      if (cancelled) return;
      forcePreviewMaterials(object);
      analyzeImportedModelComponents(object, format);
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
        new ColladaLoader().load(
          productModel,
          (collada) => {
           const daeScene = collada?.scene;

if (!daeScene) {
  onError(new Error("DAE scene not found"));
  return;
}

            daeScene.traverse((child) => {
              const mesh = child as THREE.Mesh;
              if (!mesh.isMesh) return;

              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.frustumCulled = false;

              if (!mesh.name || mesh.name.trim() === "") {
                mesh.name = `part_${mesh.id}`;
              }

              const apply = (mat: THREE.Material) => {
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              };

              if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
              else if (mesh.material) apply(mesh.material as THREE.Material);
            });

            onLoaded(daeScene);
          },
          undefined,
          onError
        );
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
  const scene = useMemo(() => {
    if (!loadedRoot) return null;

    const clonedScene = loadedRoot.clone(true);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.includes("Piano")) {
}
        const partKey = mesh.name;

        const productPart =
  productParts.find((p) => p.meshName === mesh.name) ||
  productParts.find((p) => mesh.name.includes(p.meshName)) ||
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
        

      const storeKey = productPart?.id || partKey;

const hasLed = (productPart as any)?.compatibleLed === true || Boolean(ledMount);

const ledIsActive =
  (accessories as any)?.[storeKey]?.led === true ||
  (accessories as any)?.[partKey]?.led === true ||
  (accessories as any)?.[storeKey] === true ||
  (accessories as any)?.[partKey] === true;

        const materialStoreKey = productPart?.id ?? partKey;

const insertKey = productPart?.id ?? storeKey ?? partKey;

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
    : materials[productPart?.id ?? ""] ||
  materials[materialStoreKey] ||
  materials[partKey] ||
  productPart?.defaultMaterialId ||
      (mesh.name.includes("Piede") || mesh.name.includes("Maniglia")
        ? "oro_satinato"
        : "barok");

   const isSelected =
  Boolean(selectedPartId) &&
  (
    selectedPartId === productPart?.id ||
    selectedPartId === partKey ||
    selectedPartId === mesh.name
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
console.log("MATERIAL FOUND:", materialData);
console.log("MATERIAL CHECK:", {
  materialId,
  materialData,
  productMaterials,
});

function applyPlanarUV(mesh: THREE.Mesh, rotate = false) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  if (!geometry.attributes.position) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const pos = geometry.attributes.position;
  const uvs: number[] = [];

  const sizeX = Math.max(box.max.x - box.min.x, 1);
  const sizeY = Math.max(box.max.y - box.min.y, 1);
  const sizeZ = Math.max(box.max.z - box.min.z, 1);

  const sizes = [
    { axis: "x", size: sizeX },
    { axis: "y", size: sizeY },
    { axis: "z", size: sizeZ },
  ].sort((a, b) => b.size - a.size);

  const axisU = sizes[0].axis;
  const axisV = sizes[1].axis;

  const getValue = (axis: string, index: number) => {
    if (axis === "x") return (pos.getX(index) - box.min.x) / sizeX;
    if (axis === "y") return (pos.getY(index) - box.min.y) / sizeY;
    return (pos.getZ(index) - box.min.z) / sizeZ;
  };

  for (let i = 0; i < pos.count; i++) {
    const u = getValue(rotate ? axisV : axisU, i);
    const v = getValue(rotate ? axisU : axisV, i);
    uvs.push(u, v);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
geometry.computeVertexNormals();
  (geometry.attributes.uv as THREE.BufferAttribute).needsUpdate = true;
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

applyPlanarUV(mesh, rotateWood);
console.log("MATERIAL DATA:", materialData);

const textureUrl = materialData.textureUrl;
const fallbackColor =
  materialData.fallbackColor ||
  materialData.color ||
  "#c8c2b6";

const configureTexture = (loadedTexture: THREE.Texture) => {
  loadedTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTexture.wrapS = THREE.RepeatWrapping;
  loadedTexture.wrapT = THREE.RepeatWrapping;
  loadedTexture.flipY = false;

  loadedTexture.repeat.set(
    materialData.repeatX ?? 1,
    materialData.repeatY ?? 1
  );

  loadedTexture.needsUpdate = true;
};

const applyLoadedTexture = (loadedTexture: THREE.Texture) => {
  const currentMaterial = mesh.material as THREE.MeshStandardMaterial;

  if (
    currentMaterial &&
    (currentMaterial as any).userData?.bagastudioTextureUrl === textureUrl
  ) {
    currentMaterial.map = loadedTexture;
    currentMaterial.color.set("#ffffff");
    currentMaterial.needsUpdate = true;
  }
};

let texture = textureCache.get(textureUrl);

if (texture) {
  configureTexture(texture);

  material = new THREE.MeshStandardMaterial({
    map: texture,
    color: "#ffffff",
    roughness: materialData.roughness ?? 0.65,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });
} else {
  material = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: materialData.roughness ?? 0.65,
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

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.flipY = false;

 texture.repeat.set(
  insertMaterialData.repeatX ?? 1,
  insertMaterialData.repeatY ?? 1
);

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

material.side = THREE.FrontSide;
material.needsUpdate = true;
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
]);

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
  if (!scene) return null;

  return (
    <Center>
<group
  onPointerMissed={() => {
    if (highlightedRef.current) {
      highlightedRef.current.mesh.material =
        highlightedRef.current.material;
      highlightedRef.current = null;
    }

    setSelectedPartId(null);
  }}
>
  <primitive
    object={scene}
    scale={0.01}
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

const realPartKey = clickedPart?.id || clickedName;

    const clickedMesh =
  scene.getObjectByName(clickedPart?.meshName || clickedName) as THREE.Mesh ||
  (e.object as THREE.Mesh);

      if (highlightedRef.current) {
        highlightedRef.current.mesh.material =
          highlightedRef.current.material;
      }

      highlightedRef.current = {
        mesh: clickedMesh,
        material: clickedMesh.material,
      };

      setSelectedPartId(realPartKey);
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

    const handleReset = () => applyCameraView("iso");
    const handleFocus = () => focusObjects();
    const handleScreenshot = () => downloadScreenshot();

    window.addEventListener("bagastudio:reset-camera", handleReset);
    window.addEventListener("bagastudio:focus-selection", handleFocus);
    window.addEventListener("bagastudio:screenshot", handleScreenshot);

    return () => {
      window.removeEventListener("bagastudio:reset-camera", handleReset);
      window.removeEventListener("bagastudio:focus-selection", handleFocus);
      window.removeEventListener("bagastudio:screenshot", handleScreenshot);
    };
  }, [activeViewId, views, camera, gl, scene, selectedPartId, productParts]);

  return null;
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
}: Viewer3DProps) {
  const materialsSource =
productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;
  const ledKelvin = useConfigStore((state) => state.ledKelvin);
  const ledIntensityStore = useConfigStore((state) => state.ledIntensity);
  const [viewerMode, setViewerMode] = useState<"select" | "pan" | "orbit">("select");

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

  return (
    <div className="h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [20, 10, 22], fov: 70 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.9;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={["#000000"]} />

        <ambientLight intensity={0.45} />

        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={1.6}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <directionalLight
          position={[-4, 4, -3]}
          intensity={0.8}
        />

        <pointLight
          position={[0, 3, 3]}
          intensity={0.7}
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
  productModel={productModel}
  productModelFormat={productModelFormat}
  productParts={productParts}
  woodDirection={woodDirection}
/>

        <OrbitControls
          makeDefault
          enableRotate={viewerMode === "orbit"}
          enablePan={viewerMode === "pan"}
          enableZoom={true}
          mouseButtons={{
            LEFT:
              viewerMode === "pan"
                ? THREE.MOUSE.PAN
                : viewerMode === "orbit"
                ? THREE.MOUSE.ROTATE
                : undefined,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}

