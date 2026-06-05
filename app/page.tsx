"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Viewer3D from "@/components/Viewer3D";
import ComponentExplorer from "@/components/explorer/ComponentExplorer";
import ViewerRuntimeStatusBar from "@/components/viewer-ui/ViewerRuntimeStatusBar";
import ViewerPremiumHeader from "@/components/viewer-ui/ViewerPremiumHeader";
import ViewerImportWorkflowPanel from "@/components/viewer-ui/ViewerImportWorkflowPanel";
import { useConfigStore } from "@/core/state/config.state";
import { MATERIAL_LIBRARY } from "@/core/data/materials";
import { getDefaultInsertConfig } from "@/core/engines/insertEngine";
import { calculatePricing } from "@/core/engines/pricing.engine";
import { accessoriesCatalog } from "@/core/catalogs/accessories.catalog";

type AnyProduct = any;

type EnvironmentSettings = {
  showRoom: boolean;
  width: number;
  depth: number;
  height: number;
  floorMaterial: string;
  wallMaterial: string;
  showBackWall: boolean;
  showLeftWall: boolean;
  showRightWall: boolean;
};

const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  showRoom: true,
  width: 420,
  depth: 360,
  height: 280,
  floorMaterial: "wood-neutral",
  wallMaterial: "warm-white",
  showBackWall: true,
  showLeftWall: true,
  showRightWall: true,
};

const ENVIRONMENT_MATERIAL_OPTIONS = {
  floors: [
    { id: "wood-neutral", label: "Legno neutro" },
    { id: "cement-light", label: "Cemento chiaro" },
    { id: "stone-greige", label: "Gres tortora" },
    { id: "dark-matte", label: "Nero opaco" },
  ],
  walls: [
    { id: "warm-white", label: "Bianco caldo" },
    { id: "tortora", label: "Tortora" },
    { id: "cement", label: "Cemento" },
    { id: "dark-salon", label: "Scuro elegante" },
  ],
};

function getEnvironmentMaterialLabel(kind: "floors" | "walls", materialId: string) {
  return ENVIRONMENT_MATERIAL_OPTIONS[kind].find((item) => item.id === materialId)?.label || materialId;
}

function getEnvironmentViewerSurfaces(settings: EnvironmentSettings) {
  const floorStyles: Record<string, any> = {
    "wood-neutral": {
      backgroundColor: "#7c5a3a",
      backgroundImage:
        "linear-gradient(90deg, rgba(255,255,255,0.08) 0px, transparent 2px, transparent 120px), repeating-linear-gradient(90deg, #7b5738 0px, #8b6645 120px, #765131 240px), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.15))",
      backgroundSize: "120px 100%, 240px 100%, 100% 100%",
    },
    "cement-light": {
      backgroundColor: "#c8c8c1",
      backgroundImage:
        "radial-gradient(circle at 18% 28%, rgba(255,255,255,0.38), transparent 0 18px), radial-gradient(circle at 72% 62%, rgba(92,96,98,0.16), transparent 0 22px), linear-gradient(180deg, rgba(255,255,255,0.26), rgba(112,116,118,0.14))",
      backgroundSize: "120px 90px, 150px 110px, 100% 100%",
    },
    "stone-greige": {
      backgroundColor: "#b6aa9b",
      backgroundImage:
        "linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 72px), linear-gradient(0deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 48px), linear-gradient(180deg, rgba(255,255,255,0.16), rgba(78,68,58,0.18))",
      backgroundSize: "72px 100%, 100% 48px, 100% 100%",
    },
    "dark-matte": {
      backgroundColor: "#111315",
      backgroundImage:
        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18)), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 46px)",
      backgroundSize: "100% 100%, 46px 100%",
    },
  };

  const wallStyles: Record<string, any> = {
    "warm-white": {
      backgroundColor: "#f2eadc",
      backgroundImage:
        "radial-gradient(circle at 24% 22%, rgba(255,255,255,0.65), transparent 0 26px), linear-gradient(180deg, rgba(255,255,255,0.28), rgba(188,174,154,0.14))",
      backgroundSize: "140px 100px, 100% 100%",
    },
    tortora: {
      backgroundColor: "#9b8775",
      backgroundImage:
        "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(72,58,49,0.16)), radial-gradient(circle at 70% 40%, rgba(255,255,255,0.12), transparent 0 28px)",
      backgroundSize: "100% 100%, 160px 120px",
    },
    cement: {
      backgroundColor: "#a8adad",
      backgroundImage:
        "radial-gradient(circle at 20% 32%, rgba(255,255,255,0.32), transparent 0 22px), radial-gradient(circle at 78% 58%, rgba(65,70,72,0.13), transparent 0 24px), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(71,78,80,0.12))",
      backgroundSize: "130px 95px, 160px 115px, 100% 100%",
    },
    "dark-salon": {
      backgroundColor: "#14181d",
      backgroundImage:
        "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(0,0,0,0.22)), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 48px)",
      backgroundSize: "100% 100%, 48px 100%",
    },
  };

  return {
    floor: floorStyles[settings.floorMaterial] || floorStyles[DEFAULT_ENVIRONMENT_SETTINGS.floorMaterial],
    wall: wallStyles[settings.wallMaterial] || wallStyles[DEFAULT_ENVIRONMENT_SETTINGS.wallMaterial],
  };
}
function normalizeEnvironmentSettings(value: any): EnvironmentSettings {
  return {
    showRoom: value?.showRoom === true,
    width: Number(value?.width || DEFAULT_ENVIRONMENT_SETTINGS.width),
    depth: Number(value?.depth || DEFAULT_ENVIRONMENT_SETTINGS.depth),
    height: Number(value?.height || DEFAULT_ENVIRONMENT_SETTINGS.height),
    floorMaterial: String(value?.floorMaterial || DEFAULT_ENVIRONMENT_SETTINGS.floorMaterial),
    wallMaterial: String(value?.wallMaterial || DEFAULT_ENVIRONMENT_SETTINGS.wallMaterial),
    showBackWall: value?.showBackWall !== false,
    showLeftWall: value?.showLeftWall !== false,
    showRightWall: value?.showRightWall !== false,
  };
}

const DEFAULT_MATERIALS = MATERIAL_LIBRARY;

// BagaStudio Viewer axes convention:
// +Y = alto, +X = destra, +Z = profondità/frontale viewer.
// Target coerente a [0,0,0] perché il modello importato viene centrato nel Viewer.
const DEFAULT_VIEWS = [
  {
    id: "front",
    name: "Frontale",
    camera: { position: [0, 6, 28], target: [0, 0, 0] },
  },
  {
    id: "back",
    name: "Retro",
    camera: { position: [0, 6, -28], target: [0, 0, 0] },
  },
  {
    id: "left",
    name: "Sinistra",
    camera: { position: [-28, 6, 0], target: [0, 0, 0] },
  },
  {
    id: "right",
    name: "Destra",
    camera: { position: [28, 6, 0], target: [0, 0, 0] },
  },
  {
    id: "top",
    name: "Alto",
    camera: { position: [0, 35, 0.1], target: [0, 0, 0] },
  },
  {
    id: "iso",
    name: "3D",
    camera: { position: [20, 10, 22], target: [0, 0, 0] },
  },
];

const EMPTY_IMPORTED_PRODUCT_BASE: AnyProduct = {
  id: "empty-import",
  name: "Import manuale",
  displayName: "Import manuale",
  source: "clean-import",
  assets: {},
  parts: [],
  materials: DEFAULT_MATERIALS,
  accessories: [],
  views: DEFAULT_VIEWS,
  pricing: { basePrice: 0, margin: 0, vat: 22 },
  dimensions: {
    width: { default: 180, min: 60, max: 400, step: 1 },
    height: { default: 100, min: 40, max: 250, step: 1 },
    depth: { default: 60, min: 20, max: 200, step: 1 },
  },
};


const SUPPORTED_IMPORT_MODEL_ACCEPT = ".glb,.gltf,.dae,.fbx,.obj,.stl";
const SUPPORTED_GENERIC_IMPORT_ACCEPT = `${SUPPORTED_IMPORT_MODEL_ACCEPT},.json,.baga,application/json`;
const SUPPORTED_IMPORT_MODEL_FORMATS = ["glb", "gltf", "dae", "fbx", "obj", "stl"] as const;

function getImportFileFormat(fileName: string) {
  return String(fileName.split(".").pop() || "").trim().toLowerCase();
}

function isSupportedImportModel(file: File) {
  return SUPPORTED_IMPORT_MODEL_FORMATS.includes(getImportFileFormat(file.name) as any);
}

function createImportedModelProduct(file: File, objectUrl: string, format: string, baseProduct?: AnyProduct | null) {
  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  const now = new Date().toISOString();

  return normalizeProduct({
    ...(baseProduct || EMPTY_IMPORTED_PRODUCT_BASE),
    id: `imported-${cleanName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}`,
    name: cleanName,
    displayName: cleanName,
    source: "local-import",
    createdAt: now,
    updatedAt: now,
    assets: {
      ...(baseProduct?.assets || {}),
      originalFileName: file.name,
      originalFileUrl: objectUrl,
      originalFormat: format,
      format,
      modelFormat: format,
      modelUrl: objectUrl,
      importedAt: now,
    },
    parts: Array.isArray(baseProduct?.parts) ? baseProduct.parts : [],
    views: Array.isArray(baseProduct?.views) && baseProduct.views.length ? baseProduct.views : DEFAULT_VIEWS,
    dimensions: baseProduct?.dimensions || {
      width: { default: 180, min: 60, max: 400, step: 1 },
      height: { default: 100, min: 40, max: 250, step: 1 },
      depth: { default: 60, min: 20, max: 200, step: 1 },
    },
    importer: {
      sourceFileName: file.name,
      sourceFormat: format,
      sizeBytes: file.size,
      importedAt: now,
      pipeline: "Importer UI V2",
    },
  });
}


const DICTIONARY = {
  it: {
    language: "Lingua",
    italian: "Italiano",
    english: "Inglese",
    totalPrice: "Prezzo totale",
    vatIncluded: "IVA inclusa",
    configurator: "BAGASTUDIO CORE VIEWER",
    realisticRender: "RENDER REALISTICI",
    ar: "REALTÀ AUMENTATA",
    quotes: "PREVENTIVI ISTANTANEI",
    project: "IMPORTA",
    materials: "MATERIALI",
    accessories: "ACCESSORI",
    views: "VISTE",
    studioTools: "STRUMENTI",
    save: "Salva",
    export: "Esporta",
    quote: "Preventivo",
    addToQuote: "Aggiungi al preventivo",
    adminPanel: "Admin Panel",
    adminPanelDescription: "Importer modelli, mapping componenti, catalogo prodotti, materiali, accessori e strumenti avanzati.",
    importProductJson: "Importa Product Package JSON",
    restoreAutosave: "Ripristina autosave",
    importBackup: "Importa backup",
    selectedPart: "Pezzo selezionato",
    noSelectedPart: "Nessun pezzo selezionato",
    noPart: "Nessun pezzo",
    dimensions: "Dimensioni",
    width: "Larghezza",
    height: "Altezza",
    depth: "Profondità",
    max: "Max",
    visibility: "Visibilità",
    showComponent: "Mostra componente",
    loadedFile: "File caricato",
    backupAutosave: "Backup / Autosave",
    saveAutosave: "Salva autosave",
    downloadFullBackup: "Scarica backup completo",
    lastAutosave: "Ultimo autosave",
    autosaveReady: "Autosave pronto.",
    noAutosaveAvailable: "Nessun autosave disponibile.",
    customerConfiguration: "Configurazione cliente",
    exportConfiguration: "Esporta configurazione",
    importConfiguration: "Importa configurazione",
    applyAccessoriesTo: "Applichi accessori a",
    selectPartFromModel: "Seleziona un pezzo dal modello.",
    insertDimensions: "Dimensioni inserto",
    insertMaterial: "Materiale inserto",
    ledTemperature: "Temperatura LED",
    ledIntensity: "Intensità LED",
    selectMaterial: "Seleziona materiale",
    woodDirection: "Senso venatura",
    horizontal: "Orizzontale",
    vertical: "Verticale",
    runtimeJson: "Runtime JSON",
    importProductFromSidebar: "Importa un Product Package JSON dall’area Importa.",
    projectSummary: "Riepilogo prodotto",
    product: "Prodotto",
    included: "Inclusi",
    configured: "Configurati",
    ready: "Pronto",
    projectTotal: "Totale prodotto",
    objectProperties: "Proprietà oggetto",
    name: "Nome",
    view: "Vista",
    closeLogo: "Chiudi logo",
    openLogo: "Apri logo BagaStudio Core",
    enlargedLogoAlt: "BagaStudio Core logo ingrandito",
    viewFront: "Frontale",
    viewBack: "Retro",
    viewLeft: "Sinistra",
    viewRight: "Destra",
    viewTop: "Alto",
    viewIso: "3D",
    toolSelect: "Modalità selezione",
    toolPan: "Modalità pan",
    toolReset: "Reset camera",
    toolOrbit: "Modalità orbit",
    toolFocus: "Focus oggetto",
    toolTop: "Vista dall'alto",
    toolScreenshot: "Screenshot",
    toolFullscreen: "Fullscreen",
    accessoryInsert: "Inserto",
    accessoryLed: "LED",
    on: "ON",
    off: "OFF",
    insertWidthPercent: "Larghezza %",
    insertDepthPercent: "Profondità %",
    insertOffsetX: "Sposta X",
    insertOffsetZ: "Sposta Z",
    materialMarble: "Marmo",
    materialCalacatta: "Calacatta",
    materialMarquinia: "Marquinia",
    materialStatuario: "Statuario",
    materialTravertino: "Travertino",
    materialOnice: "Onice",
    materialEmperador: "Emperador",
    backup: "Backup",
    autosave: "Autosave",
    led: "LED",
    partTop: "Piano",
    partSideRight: "Fianco destro",
    partSideLeft: "Fianco sinistro",
    partBack: "Schiena",
    partFront: "Frontale",
    partDoor: "Anta",
    partDrawer: "Cassetto",
    partHandle: "Maniglia",
    partShelf: "Ripiano",
    partMirror: "Specchio",
    partBase: "Base",
    partPanel: "Pannello",
    invalidProductJson: "JSON prodotto non valido.",
    invalidBackupJson: "Backup non valido.",
    invalidConfigurationJson: "Configurazione non valida.",
    productImported: "Prodotto importato correttamente.",
    backupImported: "Backup importato correttamente.",
    configurationImported: "Configurazione importata correttamente.",
    autosaveRestored: "Autosave ripristinato.",
    autosaveSavedManual: "Autosave salvato.",
  },
  en: {
    language: "Language",
    italian: "Italian",
    english: "English",
    totalPrice: "Total price",
    vatIncluded: "VAT included",
    configurator: "BAGASTUDIO CORE VIEWER",
    realisticRender: "REALISTIC RENDERS",
    ar: "AUGMENTED REALITY",
    quotes: "INSTANT QUOTES",
    project: "IMPORT",
    materials: "MATERIALS",
    accessories: "ACCESSORIES",
    views: "VIEWS",
    studioTools: "STRUMENTI",
    save: "Save",
    export: "Export",
    quote: "Quote",
    addToQuote: "Add to quote",
    adminPanel: "Admin Panel",
    adminPanelDescription: "Model importer, component mapping, product catalog, materials, accessories and advanced tools.",
    importProductJson: "Import Product Package JSON",
    restoreAutosave: "Restore autosave",
    importBackup: "Import backup",
    selectedPart: "Selected part",
    noSelectedPart: "No part selected",
    noPart: "No part",
    dimensions: "Dimensions",
    width: "Width",
    height: "Height",
    depth: "Depth",
    max: "Max",
    visibility: "Visibility",
    showComponent: "Show component",
    loadedFile: "Loaded file",
    backupAutosave: "Backup / Autosave",
    saveAutosave: "Save autosave",
    downloadFullBackup: "Download full backup",
    lastAutosave: "Last autosave",
    autosaveReady: "Autosave ready.",
    noAutosaveAvailable: "No autosave available.",
    customerConfiguration: "Customer configuration",
    exportConfiguration: "Export configuration",
    importConfiguration: "Import configuration",
    applyAccessoriesTo: "Apply accessories to",
    selectPartFromModel: "Select a part from the model.",
    insertDimensions: "Insert dimensions",
    insertMaterial: "Insert material",
    ledTemperature: "LED temperature",
    ledIntensity: "LED intensity",
    selectMaterial: "Select material",
    woodDirection: "Wood grain direction",
    horizontal: "Horizontal",
    vertical: "Vertical",
    runtimeJson: "Runtime JSON",
    importProductFromSidebar: "Import a product JSON from the sidebar.",
    projectSummary: "Product summary",
    product: "Product",
    included: "Included",
    configured: "Configured",
    ready: "Ready",
    projectTotal: "Product total",
    objectProperties: "Object properties",
    name: "Name",
    view: "View",
    closeLogo: "Close logo",
    openLogo: "Open BagaStudio Core logo",
    enlargedLogoAlt: "Enlarged BagaStudio Core logo",
    viewFront: "Front",
    viewBack: "Back",
    viewLeft: "Left",
    viewRight: "Right",
    viewTop: "Top",
    viewIso: "3D",
    toolSelect: "Selection mode",
    toolPan: "Pan mode",
    toolReset: "Reset camera",
    toolOrbit: "Orbit mode",
    toolFocus: "Focus object",
    toolTop: "Top view",
    toolScreenshot: "Screenshot",
    toolFullscreen: "Fullscreen",
    accessoryInsert: "Insert",
    accessoryLed: "LED",
    on: "ON",
    off: "OFF",
    insertWidthPercent: "Width %",
    insertDepthPercent: "Depth %",
    insertOffsetX: "Move X",
    insertOffsetZ: "Move Z",
    materialMarble: "Marble",
    materialCalacatta: "Calacatta",
    materialMarquinia: "Marquinia",
    materialStatuario: "Statuario",
    materialTravertino: "Travertino",
    materialOnice: "Onyx",
    materialEmperador: "Emperador",
    backup: "Backup",
    autosave: "Autosave",
    led: "LED",
    partTop: "Top",
    partSideRight: "Right side",
    partSideLeft: "Left side",
    partBack: "Back panel",
    partFront: "Front",
    partDoor: "Door",
    partDrawer: "Drawer",
    partHandle: "Handle",
    partShelf: "Shelf",
    partMirror: "Mirror",
    partBase: "Base",
    partPanel: "Panel",
    invalidProductJson: "Invalid product JSON.",
    invalidBackupJson: "Invalid backup.",
    invalidConfigurationJson: "Invalid configuration.",
    productImported: "Product imported successfully.",
    backupImported: "Backup imported successfully.",
    configurationImported: "Configuration imported successfully.",
    autosaveRestored: "Autosave restored.",
    autosaveSavedManual: "Autosave saved.",
  },
};

const VIEW_LABEL_KEYS: Record<string, keyof typeof DICTIONARY.it> = {
  front: "viewFront",
  back: "viewBack",
  left: "viewLeft",
  right: "viewRight",
  top: "viewTop",
  iso: "viewIso",
  "3d": "viewIso",
};

const DIMENSION_LABEL_KEYS: Record<string, keyof typeof DICTIONARY.it> = {
  width: "width",
  height: "height",
  depth: "depth",
};

function translateViewName(view: any, t: typeof DICTIONARY.it) {
  const key = VIEW_LABEL_KEYS[String(view?.id || view?.name || "").toLowerCase()];
  return key ? t[key] : view?.name || "3D";
}

function translateDimensionName(key: string, t: typeof DICTIONARY.it) {
  const labelKey = DIMENSION_LABEL_KEYS[key];
  return labelKey ? t[labelKey] : key;
}

function translateAccessoryName(accessory: any, t: typeof DICTIONARY.it) {
  const id = String(accessory?.id || "").toLowerCase();
  if (id === "insert") return t.accessoryInsert;
  if (id === "led") return t.accessoryLed;
  return accessory?.name || id;
}

const PART_LABEL_KEY_MATCHERS: Array<[RegExp, keyof typeof DICTIONARY.it]> = [
  [/^(piano|top)$/i, "partTop"],
  [/(fianco|side).*(destro|right)|^(right)$/i, "partSideRight"],
  [/(fianco|side).*(sinistro|left)|^(left)$/i, "partSideLeft"],
  [/(schiena|retro|back)/i, "partBack"],
  [/(frontale|front)/i, "partFront"],
  [/(anta|door)/i, "partDoor"],
  [/(cassetto|drawer)/i, "partDrawer"],
  [/(maniglia|handle)/i, "partHandle"],
  [/(ripiano|shelf)/i, "partShelf"],
  [/(specchio|mirror)/i, "partMirror"],
  [/(base|zoccolo)/i, "partBase"],
  [/(pannello|panel)/i, "partPanel"],
];

function translatePartName(part: any, t: typeof DICTIONARY.it) {
  const label = String(part?.label || part?.name || part?.id || "").trim();
  const source = label.toLowerCase();
  const match = PART_LABEL_KEY_MATCHERS.find(([regex]) => regex.test(source));
  return match ? t[match[1]] : label;
}

const MATERIAL_LABEL_KEYS: Record<string, keyof typeof DICTIONARY.it> = {
  marmo: "materialMarble",
  marble: "materialMarble",
  calacatta: "materialCalacatta",
  marquinia: "materialMarquinia",
  statuario: "materialStatuario",
  travertino: "materialTravertino",
  onice: "materialOnice",
  onyx: "materialOnice",
  emperador: "materialEmperador",
};

function translateMaterialName(material: any, t: typeof DICTIONARY.it) {
  const rawId = String(material?.id || "").toLowerCase().trim();
  const rawName = String(material?.name || "").toLowerCase().trim();
  const key = MATERIAL_LABEL_KEYS[rawId] || MATERIAL_LABEL_KEYS[rawName];
  return key ? t[key] : material?.name || material?.id || "";
}


function mergeById(primary: any[] = [], fallback: any[] = []) {
  const map = new Map<string, any>();
  fallback.forEach((item) => map.set(item.id, item));
  primary.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
  return Array.from(map.values());
}

function normalizeProduct(product: AnyProduct) {
  const normalized = {
    ...product,
    assets: product.assets || {},
    dimensions: product.dimensions || {},
    parts: Array.isArray(product.parts) ? product.parts : [],
  materials: product.materials?.length ? product.materials : DEFAULT_MATERIALS,
    accessories:
      Array.isArray(product.accessories) && product.accessories.length
        ? product.accessories
        : [
            { id: "insert", name: "Inserto", stateType: "insert" },
            { id: "led", name: "LED", stateType: "accessory" },
          ],
    views:
      Array.isArray(product.views) && product.views.length
        ? product.views
        : DEFAULT_VIEWS,
    pricing: product.pricing || { basePrice: 0, margin: 0, vat: 22 },
  };

  normalized.parts = normalized.parts.map((part: any) => {
    const compatibleAccessories = Array.from(
      new Set([
        ...(Array.isArray(part.compatibleAccessories)
          ? part.compatibleAccessories
          : []),
        ...(part.compatibleLed ? ["led"] : []),
        ...(part.compatibleInsert ? ["insert"] : []),
      ])
    );

    return {
      ...part,
      selectable: part.selectable !== false,
      visible: part.visible !== false,
      materialSlots: part.materialSlots?.length ? part.materialSlots : ["main"],
      allowedMaterialCategories: part.allowedMaterialCategories?.length
        ? part.allowedMaterialCategories
        : ["wood", "marble", "metal", "mirror"],
      compatibleAccessories,
      mountPoints: part.mountPoints || {},
    };
  });

  return normalized;
}

function getModelUrl(product: AnyProduct | null) {
  if (!product) return "";
  return (
    product.assets?.embeddedModelDataUrl ||
    product.assets?.convertedModelDataUrl ||
    product.assets?.modelDataUrl ||
    product.assets?.convertedModelUrl ||
    product.assets?.modelUrl ||
    product.assets?.originalFileUrl ||
    ""
  );
}

function getModelFormat(product: AnyProduct | null) {
  const format = String(
    product?.assets?.originalFormat ||
      product?.assets?.format ||
      product?.assets?.modelFormat ||
      ""
  )
    .toLowerCase()
    .replace(".", "");

  if (format) return format;

  const modelUrl = getModelUrl(product);
  if (modelUrl.startsWith("data:")) {
    if (modelUrl.includes("model/fbx")) return "fbx";
    if (modelUrl.includes("model/obj")) return "obj";
    if (modelUrl.includes("model/stl")) return "stl";
    if (modelUrl.includes("model/gltf") || modelUrl.includes("model/glb")) return "glb";
    return "glb";
  }

  const cleanUrl = modelUrl.split("?")[0].split("#")[0].toLowerCase();
  return cleanUrl.split(".").pop() || "glb";
}

function isAccessoryActive(accessories: any, partId: string, accessoryId: string) {
  return accessories?.[partId]?.[accessoryId] === true;
}

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getInitialLanguage(): "it" | "en" {
  if (typeof window === "undefined") return "it";
  const savedLanguage = window.localStorage.getItem("bagastudio-language");
  return savedLanguage === "en" ? "en" : "it";
}

function createBagaStudioProject(configuration: any, projectName = "Progetto BagaStudio", environment?: EnvironmentSettings) {
  const now = new Date().toISOString();

  return {
    type: "bagastudio-project",
    version: "1.1",
    name: projectName || "Progetto BagaStudio",
    createdAt: now,
    updatedAt: now,
    configuration,
    environment: normalizeEnvironmentSettings(environment),
  };
}

function getSafeProjectFilename(projectName: string) {
  const safeName = String(projectName || "Progetto BagaStudio")
    .trim()
    .replace(/[^a-zA-Z0-9-_àèéìòùÀÈÉÌÒÙ ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  return `${safeName || "Progetto_BagaStudio"}.baga`;
}

type RecentBagaStudioProject = {
  id: string;
  name: string;
  fileName: string;
  updatedAt: string;
  project: any;
};

const RECENT_PROJECTS_STORAGE_KEY = "bagastudio-recent-projects-v1";
const RECENT_PROJECTS_LIMIT = 8;

function readRecentBagaStudioProjects(): RecentBagaStudioProject[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.project?.configuration).slice(0, RECENT_PROJECTS_LIMIT) : [];
  } catch (error) {
    console.warn("BagaStudio recent projects read failed", error);
    return [];
  }
}

function writeRecentBagaStudioProjects(items: RecentBagaStudioProject[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      RECENT_PROJECTS_STORAGE_KEY,
      JSON.stringify(items.slice(0, RECENT_PROJECTS_LIMIT))
    );
  } catch (error) {
    console.warn("BagaStudio recent projects write failed", error);
  }
}

export default function HomePage() {
  const product = useConfigStore((state) => state.runtimeProduct || state.product);
  const setRuntimeProduct = useConfigStore((state) => state.setRuntimeProduct);
  const setDimension = useConfigStore((state) => state.setDimension);
  const setMaterial = useConfigStore((state) => state.setMaterial);
  const setAccessory = useConfigStore((state) => state.setAccessory);
  const setInsert = useConfigStore((state) => state.setInsert);
  const setLedKelvin = useConfigStore((state) => state.setLedKelvin);
  const setLedIntensity = useConfigStore((state) => state.setLedIntensity);
  const setVisibility = useConfigStore((state) => state.setVisibility);
  const setActiveView = useConfigStore((state) => state.setActiveView);
  const setSelectedPart = useConfigStore((state) => state.setSelectedPart);
  const importConfiguration = useConfigStore((state) => state.importConfiguration);
  const exportConfiguration = useConfigStore((state) => state.exportConfiguration);
  const saveAutosave = useConfigStore((state) => state.saveAutosave);
  const restoreAutosave = useConfigStore((state) => state.restoreAutosave);
  const createBackupSnapshot = useConfigStore((state) => state.createBackupSnapshot);

  const dimensions = useConfigStore((state) => state.dimensions);
  const materials = useConfigStore((state) => state.materials);
  const accessories = useConfigStore((state) => state.accessories);
  const inserts = useConfigStore((state) => state.inserts);
  const insertMaterials = useConfigStore((state) => state.insertMaterials);
const setInsertMaterial = useConfigStore((state) => state.setInsertMaterial);
const insertSizes = useConfigStore((state) => state.insertSizes);
const setInsertSize = useConfigStore((state) => state.setInsertSize);
  const ledKelvin = useConfigStore((state) => state.ledKelvin);
  const ledIntensity = useConfigStore((state) => state.ledIntensity);
  const visibility = useConfigStore((state) => state.visibility);
  const activeViewId = useConfigStore((state) => state.activeViewId);
  const woodDirection = useConfigStore((state) => state.woodDirection);
const setWoodDirection = useConfigStore((state) => state.setWoodDirection);
  const selectedPartId = useConfigStore((state) => state.selectedPartId);
  const pricing = useConfigStore((state) => state.pricing);



 const [importName, setImportName] = useState("");
const [currentProjectName, setCurrentProjectName] = useState("Progetto BagaStudio");
const [lastProjectAction, setLastProjectAction] = useState("");
const [uiNotice, setUiNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
const [recentProjects, setRecentProjects] = useState<RecentBagaStudioProject[]>([]);
const [autosaveLabel, setAutosaveLabel] = useState("");
const [activePanel, setActivePanel] = useState<
  "config" | "materials" | "accessories" | "views" | "save" | "produce" | "help" | "admin"
>("config");
const [activeViewerTool, setActiveViewerTool] = useState<"select" | "pan" | "orbit" | null>("select");
const [xRayEnabled, setXRayEnabled] = useState(false);
const [xRayOpacity, setXRayOpacity] = useState(0.35);
const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
const [language, setLanguage] = useState<"it" | "en">(() => getInitialLanguage());
const t = DICTIONARY[language];
const viewerShellRef = useRef<HTMLElement | null>(null);
const importedModelUrlRef = useRef<string | null>(null);
const [importedModelName, setImportedModelName] = useState("");
const [importedModelFormat, setImportedModelFormat] = useState("");
const [importedModelVersion, setImportedModelVersion] = useState(0);
const [importerStatus, setImporterStatus] = useState("");
const [isImporterDragging, setIsImporterDragging] = useState(false);
const [importerUiState, setImporterUiState] = useState<any>(null);
const [lastImporterEvent, setLastImporterEvent] = useState("");
const [viewerRuntimeComponents, setViewerRuntimeComponents] = useState<any[]>([]);
const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
const [structureCounts, setStructureCounts] = useState({
  verticalDividers: 1,
  horizontalDividers: 0,
  shelves: 2,
  drawers: 0,
  doors: 2,
});
const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettings>(DEFAULT_ENVIRONMENT_SETTINGS);
const environmentViewerSurfaces = useMemo(() => getEnvironmentViewerSurfaces(environmentSettings), [environmentSettings]);
const componentRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
const uiNoticeTimerRef = useRef<number | null>(null);

function showUiNotice(message: string, type: "success" | "error" | "info" = "success") {
  setUiNotice({ type, message });

  if (uiNoticeTimerRef.current) {
    window.clearTimeout(uiNoticeTimerRef.current);
  }

  uiNoticeTimerRef.current = window.setTimeout(() => {
    setUiNotice(null);
    uiNoticeTimerRef.current = null;
  }, 3200);
}

const updateStructureCount = (key: keyof typeof structureCounts, delta: number) => {
  setStructureCounts((current) => ({
    ...current,
    [key]: Math.max(0, Number(current[key] || 0) + delta),
  }));
};

const updateEnvironmentSetting = <K extends keyof EnvironmentSettings,>(key: K, value: EnvironmentSettings[K]) => {
  setEnvironmentSettings((current) => normalizeEnvironmentSettings({
    ...current,
    [key]: value,
  }));
};

const resetEnvironmentSettings = () => {
  setEnvironmentSettings(DEFAULT_ENVIRONMENT_SETTINGS);
  showUiNotice("Ambiente riportato ai valori base", "info");
};

useEffect(() => {
  if (!selectedPartId) return;

  const target =
    componentRowRefs.current[selectedPartId] ||
    componentRowRefs.current[String(selectedPartId)];

  if (!target) return;

  target.scrollIntoView({
    block: "nearest",
    behavior: "smooth",
  });
}, [selectedPartId, viewerRuntimeComponents]);

useEffect(() => {
  const currentId = String(selectedPartId || "");
  if (!currentId) {
    setSelectedPartIds([]);
    return;
  }

  setSelectedPartIds((current) => {
    if (current.includes(currentId)) return current;
    return [currentId];
  });
}, [selectedPartId]);

const [viewerRuntimeMetadata, setViewerRuntimeMetadata] = useState<any>(null);
const [viewerRuntimeProduct, setViewerRuntimeProduct] = useState<any>(null);

useEffect(() => {
  window.localStorage.setItem("bagastudio-language", language);
}, [language]);

useEffect(() => {
  setRecentProjects(readRecentBagaStudioProjects());
}, []);

useEffect(() => {
  return () => {
    if (uiNoticeTimerRef.current) {
      window.clearTimeout(uiNoticeTimerRef.current);
    }
  };
}, []);

useEffect(() => {
  const isEditableTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;

    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      element.isContentEditable
    );
  };

  const openProjectFromShortcut = async () => {
    try {
      const openFilePicker = (window as any).showOpenFilePicker;

      if (typeof openFilePicker === "function") {
        const [handle] = await openFilePicker({
          multiple: false,
          types: [
            {
              description: "BagaStudio Project",
              accept: { "application/json": [".baga", ".json"] },
            },
          ],
        });

        const file = await handle.getFile();
        if (file) await openProject(file);
        return;
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".baga,.json,application/json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) await openProject(file);
      };
      input.click();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        showUiNotice("Apertura progetto annullata", "info");
        return;
      }

      console.error("BagaStudio project open picker error", error);
      showUiNotice("Errore apertura progetto", "error");
    }
  };

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;

    const key = event.key.toLowerCase();

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "s") {
      event.preventDefault();
      void saveProject();
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "o") {
      event.preventDefault();
      void openProjectFromShortcut();
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "n") {
      event.preventDefault();
      newProject();
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "f") {
      event.preventDefault();
      window.dispatchEvent(new Event("bagastudio:focus-selection"));
      showUiNotice("Focus modello", "info");
      return;
    }

    if (event.altKey && !event.ctrlKey && !event.metaKey && key === "x") {
      event.preventDefault();
      setXRayEnabled((value) => !value);
      showUiNotice("X-Ray aggiornato", "info");
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "Escape") {
      setSelectedPart(null);
      setSelectedPartIds([]);
      window.dispatchEvent(new CustomEvent("bagastudio:viewer-component-cleared"));
      showUiNotice("Selezione annullata", "info");
      return;
    }


    const viewShortcuts: Record<string, string> = {
      "1": "iso",
      "2": "front",
      "3": "left",
      "4": "right",
      "5": "top",
    };

    const nextView = viewShortcuts[event.key];
    if (nextView) {
      setActiveView(nextView);
      showUiNotice(`Vista ${event.key} attivata`, "info");
    }
  };

  window.addEventListener("keydown", handleKeyboardShortcut);
  return () => window.removeEventListener("keydown", handleKeyboardShortcut);
}, [openProject, saveProject, newProject, setActiveView, setSelectedPart]);


useEffect(() => {
  const refreshImporterUiState = () => {
    const getter = (window as any).bagastudioGetImporterUiState;
    const refresher = (window as any).bagastudioRefreshImporterUiState;

    try {
      const nextState = typeof refresher === "function" ? refresher() : typeof getter === "function" ? getter() : null;
      if (nextState) setImporterUiState(nextState);
    } catch (error) {
      console.warn("BagaStudio importer UI state refresh failed", error);
    }
  };

  const handleImporterUiState = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    setImporterUiState(detail || null);
    setLastImporterEvent("Stato importer aggiornato");
  };

  const handleImporterRuntimeEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const eventType = customEvent.type;
    const detail = customEvent.detail || {};

    if (Array.isArray(detail.components)) {
      setViewerRuntimeComponents(detail.components);
    }

    if (detail.runtimeMetadata) {
      setViewerRuntimeMetadata(detail.runtimeMetadata);
    }

    if (detail?.schema === "bagastudio.runtimeMetadata.v1") {
      setViewerRuntimeMetadata(detail);
    }

    if (detail.runtimeProduct) {
      setViewerRuntimeProduct(detail.runtimeProduct);
    }

    if (eventType === "bagastudio:runtime-product-ready" && detail?.parts) {
      setViewerRuntimeProduct(detail);
      setViewerRuntimeComponents(detail.parts);
    }

    setLastImporterEvent(eventType.replace("bagastudio:", ""));
    refreshImporterUiState();
  };

  const handleViewerComponentSelected = (event: Event) => {
    const detail = (event as CustomEvent).detail || {};
    const nextId = String(detail?.partId || detail?.id || detail?.meshName || "");
    if (!nextId) return;

    const wantsMultiSelect = Boolean(detail?.multiSelect || detail?.additive || detail?.range);
    setSelectedPartIds((current) => {
      if (!wantsMultiSelect) return [nextId];
      return current.includes(nextId)
        ? current.filter((id) => id !== nextId)
        : [...current, nextId];
    });
    setSelectedPart(nextId);

    setViewerRuntimeComponents((current) => {
      if (!Array.isArray(current)) return current;

      const incomingComponent = detail?.runtimeComponent || null;
      const incomingBounds = detail?.bounds || incomingComponent?.bounds || incomingComponent?.runtimeMetadata?.bounds || null;
      const incomingCategory = detail?.category || incomingComponent?.category || incomingComponent?.runtimeMetadata?.detectedCategory || null;

      const exists = current.some((component: any) =>
        component?.id === nextId || component?.partId === nextId || component?.meshName === nextId
      );

      if (exists) {
        return current.map((component: any) => {
          const isMatch = component?.id === nextId || component?.partId === nextId || component?.meshName === nextId;
          if (!isMatch) return component;

          return {
            ...component,
            ...(incomingComponent || {}),
            id: component?.id || incomingComponent?.id || nextId,
            partId: component?.partId || incomingComponent?.partId || nextId,
            meshName: component?.meshName || detail?.meshName || incomingComponent?.meshName || nextId,
            displayName: component?.displayName || detail?.displayName || incomingComponent?.displayName || nextId,
            originalName: component?.originalName || detail?.originalName || incomingComponent?.originalName || nextId,
            category: component?.category || incomingCategory || undefined,
            runtimeMetadata: {
              ...(component?.runtimeMetadata || {}),
              ...(incomingComponent?.runtimeMetadata || {}),
              detectedCategory: component?.runtimeMetadata?.detectedCategory || incomingCategory || incomingComponent?.runtimeMetadata?.detectedCategory,
              bounds: incomingBounds || component?.runtimeMetadata?.bounds || incomingComponent?.runtimeMetadata?.bounds,
            },
            bounds: incomingBounds || component?.bounds || incomingComponent?.bounds,
          };
        });
      }

      return [
        ...current,
        {
          ...(incomingComponent || {}),
          id: incomingComponent?.id || nextId,
          partId: incomingComponent?.partId || nextId,
          meshName: detail?.meshName || incomingComponent?.meshName || nextId,
          displayName: detail?.displayName || detail?.name || incomingComponent?.displayName || nextId,
          originalName: detail?.originalName || incomingComponent?.originalName || detail?.meshName || nextId,
          category: incomingCategory || undefined,
          runtimeMetadata: {
            ...(incomingComponent?.runtimeMetadata || {}),
            detectedCategory: incomingCategory || incomingComponent?.runtimeMetadata?.detectedCategory,
            bounds: incomingBounds || incomingComponent?.runtimeMetadata?.bounds,
          },
          bounds: incomingBounds || incomingComponent?.bounds,
          index: current.length + 1,
        },
      ];
    });
  };

  const watchedEvents = [
    "bagastudio:importer-ui-state",
    "bagastudio:importer-report-ready",
    "bagastudio:importer-product-package-ready",
    "bagastudio:admin-mapping-ready",
    "bagastudio:importer-glb-ready",
    "bagastudio:product-thumbnail-ready",
    "bagastudio:importer-compatibility-guard",
    "bagastudio:complete-product-package-saved",
    "bagastudio:viewer-components-ready",
    "bagastudio:viewer-component-selected",
    "bagastudio:runtime-components-merged",
    "bagastudio:viewer-runtime-metadata-ready",
    "bagastudio:runtime-metadata-updated",
    "bagastudio:runtime-product-ready",
  ];

  window.addEventListener("bagastudio:importer-ui-state", handleImporterUiState as EventListener);
  window.addEventListener("bagastudio:viewer-component-selected", handleViewerComponentSelected as EventListener);
  watchedEvents
    .filter((eventName) => eventName !== "bagastudio:importer-ui-state")
    .forEach((eventName) => window.addEventListener(eventName, handleImporterRuntimeEvent as EventListener));

  const runtimeComponents = (window as any).__bagastudioViewerRuntimeComponents;
  const runtimeMetadata = (window as any).__bagastudioRuntimeMetadata || (window as any).__bagastudioViewerRuntimeMetadata;
  const runtimeProduct = (window as any).__bagastudioRuntimeProduct;

  if (Array.isArray(runtimeComponents)) {
    setViewerRuntimeComponents(runtimeComponents);
  }
  if (runtimeMetadata) setViewerRuntimeMetadata(runtimeMetadata);
  if (runtimeProduct) setViewerRuntimeProduct(runtimeProduct);

  const timer = window.setTimeout(refreshImporterUiState, 300);

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("bagastudio:importer-ui-state", handleImporterUiState as EventListener);
    window.removeEventListener("bagastudio:viewer-component-selected", handleViewerComponentSelected as EventListener);
    watchedEvents
      .filter((eventName) => eventName !== "bagastudio:importer-ui-state")
      .forEach((eventName) => window.removeEventListener(eventName, handleImporterRuntimeEvent as EventListener));
  };
}, []);

useEffect(() => {
  return () => {
    if (importedModelUrlRef.current) {
      URL.revokeObjectURL(importedModelUrlRef.current);
      importedModelUrlRef.current = null;
    }
  };
}, []);

function goNextView() {
  const views = runtimeProduct?.views?.length ? runtimeProduct.views : DEFAULT_VIEWS;
  const currentIndex = views.findIndex((view: any) => view.id === activeViewId);
  const nextView = views[(currentIndex + 1 + views.length) % views.length];
  setActiveView(nextView?.id || "iso");
}

function requestViewerFullscreen() {
  viewerShellRef.current?.requestFullscreen?.();
}

function registerRecentProject(projectName: string, projectData?: any) {
  const normalizedName = (projectName || "Progetto BagaStudio").trim() || "Progetto BagaStudio";
  const project = projectData || createBagaStudioProject(exportConfiguration(), normalizedName, environmentSettings);
  const fileName = getSafeProjectFilename(normalizedName);
  const id = `${fileName.toLowerCase()}::${normalizedName.toLowerCase()}`;
  const nextItem: RecentBagaStudioProject = {
    id,
    name: normalizedName,
    fileName,
    updatedAt: new Date().toISOString(),
    project,
  };

  setRecentProjects((current) => {
    const next = [nextItem, ...current.filter((item) => item.id !== id)].slice(0, RECENT_PROJECTS_LIMIT);
    writeRecentBagaStudioProjects(next);
    return next;
  });
}

function openRecentProject(projectId: string) {
  const target = recentProjects.find((item) => item.id === projectId);

  if (!target?.project?.configuration) {
    showUiNotice("Progetto recente non disponibile", "error");
    return;
  }

  importConfiguration(target.project.configuration);
  setEnvironmentSettings(normalizeEnvironmentSettings(target.project.environment));
  const nextName = target.project.name || target.name || "Progetto BagaStudio";
  setCurrentProjectName(nextName);
  setImportName(nextName);
  setLastProjectAction(`Progetto recente aperto: ${nextName}`);
  showUiNotice(`Progetto recente aperto: ${nextName}`);
  registerRecentProject(nextName, target.project);
  setSelectedPart(null);
  setSelectedPartIds([]);
}

function getCurrentProjectName() {
  return (currentProjectName || importName || importedModelName || runtimeProduct?.displayName || runtimeProduct?.name || "Progetto BagaStudio").trim();
}

function newProject() {
  const suggestedName = "Nuovo progetto";
  const nextName = window.prompt("Nome nuovo progetto BagaStudio", suggestedName) || suggestedName;
  importConfiguration({});
  setCurrentProjectName(nextName);
  setImportName(nextName);
  setEnvironmentSettings(DEFAULT_ENVIRONMENT_SETTINGS);
  setLastProjectAction(`Nuovo progetto avviato: ${nextName}`);
  showUiNotice(`Nuovo progetto avviato: ${nextName}`, "info");
  setSelectedPart(null);
  setSelectedPartIds([]);
}

async function saveProject() {
  const projectName = getCurrentProjectName();
  const project = createBagaStudioProject(exportConfiguration(), projectName, environmentSettings);
  const fileName = getSafeProjectFilename(projectName);

  try {
    const saveFilePicker = (window as any).showSaveFilePicker;

    if (typeof saveFilePicker === "function") {
      const handle = await saveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "BagaStudio Project",
            accept: { "application/json": [".baga", ".json"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(project, null, 2));
      await writable.close();
    } else {
      downloadJson(fileName, project);
    }

    registerRecentProject(projectName, project);
    setLastProjectAction(`Progetto salvato: ${projectName}`);
    showUiNotice(`Progetto salvato: ${projectName}`);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      showUiNotice("Salvataggio annullato", "info");
      return;
    }

    console.error("BagaStudio project save error", error);
    setLastProjectAction("Errore: progetto non salvato.");
    showUiNotice("Errore: progetto non salvato.", "error");
  }
}

async function openProject(file: File) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data?.type === "bagastudio-project" && data?.configuration) {
      importConfiguration(data.configuration);
      setEnvironmentSettings(normalizeEnvironmentSettings(data.environment));
      const nextName = data?.name || file.name.replace(/\.baga$|\.json$/i, "") || "Progetto BagaStudio";
      setCurrentProjectName(nextName);
      setImportName(nextName);
      registerRecentProject(nextName, data);
      setLastProjectAction(`Progetto aperto: ${nextName}`);
      showUiNotice(`Progetto aperto: ${nextName}`);
      return;
    }

    if (data?.configuration) {
      importConfiguration(data.configuration);
      setEnvironmentSettings(normalizeEnvironmentSettings(data.environment));
      const nextName = data?.name || file.name.replace(/\.baga$|\.json$/i, "") || "Progetto BagaStudio";
      setCurrentProjectName(nextName);
      setImportName(nextName);
      registerRecentProject(nextName, createBagaStudioProject(data.configuration, nextName, environmentSettings));
      setLastProjectAction(`Configurazione importata: ${nextName}`);
      showUiNotice(`Configurazione importata: ${nextName}`);
      return;
    }

    importConfiguration(data);
    const nextName = file.name.replace(/\.baga$|\.json$/i, "") || "Progetto BagaStudio";
    setCurrentProjectName(nextName);
    setImportName(nextName);
    registerRecentProject(nextName, createBagaStudioProject(data, nextName, environmentSettings));
    setLastProjectAction(`Configurazione importata: ${nextName}`);
    showUiNotice(`Configurazione importata: ${nextName}`);
  } catch (error) {
    console.error("BagaStudio project import error", error);
    setLastProjectAction("Errore: file progetto BagaStudio non valido.");
    showUiNotice("Errore: file progetto BagaStudio non valido.", "error");
  }
}

async function handleGenericImportFile(file: File) {
  const format = getImportFileFormat(file.name);

  if (format === "baga") {
    await openProject(file);
    return;
  }

  if (format === "json") {
    const text = await file.text();
    let data: any = null;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("BagaStudio generic JSON import error", error);
      setLastProjectAction("Errore: file JSON non valido.");
      showUiNotice("Errore: file JSON non valido.", "error");
      return;
    }

    const isProductPackage =
      data?.schema === "bagastudio-product-package" ||
      data?.productPackageVersion === 2;

    if (isProductPackage) {
      await handleProductJsonImport(file);
      return;
    }

    await openProject(file);
    return;
  }

  if (isSupportedImportModel(file)) {
    await handleModelFileImport(file);
    return;
  }

  const message = `Formato non supportato: .${format || "sconosciuto"}. Usa GLB, GLTF, DAE, FBX, OBJ, STL, JSON, BAGA, JSON o BAGA.`;
  setImporterStatus(message);
  setLastProjectAction(message);
  showUiNotice(message, "error");
}

 const runtimeProduct = useMemo(() => {
  return product ? normalizeProduct(product) : null;
}, [product]);

const basePricing = useMemo(() => {
 return calculatePricing(runtimeProduct);
}, [
  runtimeProduct,
  dimensions,
  accessories,
  inserts,
  insertSizes,
  insertMaterials,
]);


const formatMmValue = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const getBounds = (part: any) => part?.bounds || part?.runtimeMetadata?.bounds || null;

const getDimensionRatio = (key: "width" | "height" | "depth") => {
  const dim = runtimeProduct?.dimensions?.[key];
  const baseValue = Number(dim?.default || 0);
  const currentValue = Number(dimensions?.[key] ?? baseValue);

  if (!Number.isFinite(baseValue) || baseValue <= 0) return 1;
  if (!Number.isFinite(currentValue) || currentValue <= 0) return 1;

  return currentValue / baseValue;
};

const getDimensionScalePolicy = (part: any) => {
  const source = String(
    `${part?.category || ""} ${part?.type || ""} ${part?.partId || ""} ${part?.name || ""} ${part?.displayName || ""} ${part?.meshName || ""} ${part?.originalName || ""} ${part?.runtimeMetadata?.detectedCategory || ""}`
  )
    .replace(/[_-]+/g, " ")
    .toLowerCase();

  if (/maniglia|handle|pomello|led|presa|porta phon|portaphon|lavabo|rubinetto|cerniera|basetta|vite|foro|cabineo|ferramenta|minifix/.test(source)) {
    return "fixed" as const;
  }

  if (/anta|frontale|frontali|door|facciata|cassetto front/.test(source)) {
    return "width-height" as const;
  }

  if (/schiena|retro|back panel|backpanel/.test(source)) {
    return "width-height" as const;
  }

  if (/fianco|fianchi|side/.test(source)) {
    return "height-depth" as const;
  }

  if (/fondo|cielo|ripiano|ripiani|mensola|mensole|top|piano|base|shelf/.test(source)) {
    return "width-depth" as const;
  }

  return "width-depth" as const;
};

const getSortedBoundsMm = (part: any) => {
  const bounds = getBounds(part);
  if (!bounds) return null;

  const values = [
    Number(bounds.width || 0) * 10,
    Number(bounds.depth || 0) * 10,
    Number(bounds.height || 0) * 10,
  ].filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => b - a);

  if (!values.length) return null;

  return {
    majorMm: Number(values[0] || 0),
    secondaryMm: Number(values[1] || 0),
    thicknessMm: Number(values[2] || 0),
  };
};

const getScaledBoundsMm = (part: any) => {
  const sorted = getSortedBoundsMm(part);
  if (!sorted) return null;

  const policy = getDimensionScalePolicy(part);
  const widthRatio = getDimensionRatio("width");
  const heightRatio = getDimensionRatio("height");
  const depthRatio = getDimensionRatio("depth");

  if (policy === "fixed") {
    return {
      widthMm: sorted.majorMm,
      depthMm: sorted.secondaryMm,
      heightMm: sorted.thicknessMm,
    };
  }

  // Regola pannelli V1.2:
  // mai applicare altezza/profondità allo spessore. Lo spessore resta sempre l'ultima misura.
  if (policy === "width-height") {
    return {
      widthMm: sorted.secondaryMm * widthRatio,
      depthMm: sorted.majorMm * heightRatio,
      heightMm: sorted.thicknessMm,
    };
  }

  if (policy === "height-depth") {
    return {
      widthMm: sorted.majorMm * heightRatio,
      depthMm: sorted.secondaryMm * depthRatio,
      heightMm: sorted.thicknessMm,
    };
  }

  return {
    widthMm: sorted.majorMm * widthRatio,
    depthMm: sorted.secondaryMm * depthRatio,
    heightMm: sorted.thicknessMm,
  };
};

const bomRows = useMemo(() => {
  const sourceParts = Array.isArray(viewerRuntimeComponents) && viewerRuntimeComponents.length > 0
    ? viewerRuntimeComponents
    : Array.isArray(runtimeProduct?.parts)
      ? runtimeProduct.parts
      : [];

  const normalizeBomLabel = (value: any) => {
    const cleaned = String(value || "Componente senza nome")
      .replace(/[_-]+/g, " ")
      .replace(/\b(mesh|object|node|edge definition)\b/gi, "")
      .replace(/\s+\d+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Componente senza nome";
  };

  const getBomLabel = (part: any) => {
    const rawLabel =
      part?.displayName ||
      part?.name ||
      part?.partName ||
      part?.originalName ||
      part?.meshName ||
      part?.partId ||
      part?.id ||
      "Componente senza nome";

    return normalizeBomLabel(rawLabel);
  };

  const normalizeBomCategory = (part: any) => {
    const rawCategory = String(
      part?.category ||
      part?.type ||
      part?.runtimeMetadata?.detectedCategory ||
      part?.runtimeMetadata?.category ||
      "component"
    )
      .replace(/[_-]+/g, " ")
      .trim()
      .toLowerCase();

    const source = `${rawCategory} ${part?.partId || ""} ${part?.name || ""} ${part?.displayName || ""}`.toLowerCase();

    if (rawCategory === "panel" || /fianco|fondo|cielo|ripiano|anta|schiena|zoccolo|pannello|top|mensola/.test(source)) return "panel";
    if (rawCategory === "hardware" || /cerniera|basetta|cabineo|ferramenta|vite|foro|giunzione|minifix/.test(source)) return "hardware";
    if (rawCategory === "accessory" || /maniglia|accessorio|led|porta phon|portaphon|presa|lavabo|rubinetto|pomello|handle/.test(source)) return "accessory";

    return "component";
  };

  const getBomGroupTitle = (category: string) => {
    if (category === "panel") return "Pannelli";
    if (category === "hardware") return "Ferramenta";
    if (category === "accessory") return "Accessori";
    return "Componenti";
  };

  const getBomGroupOrder = (category: string) => {
    if (category === "panel") return 1;
    if (category === "hardware") return 2;
    if (category === "accessory") return 3;
    return 4;
  };

  const formatMmValue = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  const getBounds = (part: any) => part?.bounds || part?.runtimeMetadata?.bounds || null;

  const getDimensionRatio = (key: "width" | "height" | "depth") => {
    const dim = runtimeProduct?.dimensions?.[key];
    const baseValue = Number(dim?.default || 0);
    const currentValue = Number(dimensions?.[key] ?? baseValue);

    if (!Number.isFinite(baseValue) || baseValue <= 0) return 1;
    if (!Number.isFinite(currentValue) || currentValue <= 0) return 1;

    return currentValue / baseValue;
  };

  const getDimensionScalePolicy = (part: any) => {
    const source = String(
      `${part?.category || ""} ${part?.type || ""} ${part?.partId || ""} ${part?.name || ""} ${part?.displayName || ""} ${part?.meshName || ""} ${part?.originalName || ""} ${part?.runtimeMetadata?.detectedCategory || ""}`
    )
      .replace(/[_-]+/g, " ")
      .toLowerCase();

    if (/maniglia|handle|pomello|led|presa|porta phon|portaphon|lavabo|rubinetto|cerniera|basetta|vite|foro|cabineo|ferramenta|minifix/.test(source)) {
      return "fixed" as const;
    }

    if (/anta|frontale|frontali|door|facciata|cassetto front/.test(source)) {
      return "width-height" as const;
    }

    if (/schiena|retro|back panel|backpanel/.test(source)) {
      return "width-height" as const;
    }

    if (/fianco|fianchi|side/.test(source)) {
      return "height-depth" as const;
    }

    if (/fondo|cielo|ripiano|ripiani|mensola|mensole|top|piano|base|shelf/.test(source)) {
      return "width-depth" as const;
    }

    return "width-depth" as const;
  };

  const getSortedBoundsMm = (part: any) => {
    const bounds = getBounds(part);
    if (!bounds) return null;

    const values = [
      Number(bounds.width || 0) * 10,
      Number(bounds.depth || 0) * 10,
      Number(bounds.height || 0) * 10,
    ].filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => b - a);

    if (!values.length) return null;

    return {
      majorMm: Number(values[0] || 0),
      secondaryMm: Number(values[1] || 0),
      thicknessMm: Number(values[2] || 0),
    };
  };

  const getScaledBoundsMm = (part: any) => {
    const sorted = getSortedBoundsMm(part);
    if (!sorted) return null;

    const policy = getDimensionScalePolicy(part);
    const widthRatio = getDimensionRatio("width");
    const heightRatio = getDimensionRatio("height");
    const depthRatio = getDimensionRatio("depth");

    if (policy === "fixed") {
      return {
        widthMm: sorted.majorMm,
        depthMm: sorted.secondaryMm,
        heightMm: sorted.thicknessMm,
      };
    }

    // Regola pannelli V1.2:
    // mai applicare altezza/profondità allo spessore. Lo spessore resta sempre l'ultima misura.
    if (policy === "width-height") {
      return {
        widthMm: sorted.secondaryMm * widthRatio,
        depthMm: sorted.majorMm * heightRatio,
        heightMm: sorted.thicknessMm,
      };
    }

    if (policy === "height-depth") {
      return {
        widthMm: sorted.majorMm * heightRatio,
        depthMm: sorted.secondaryMm * depthRatio,
        heightMm: sorted.thicknessMm,
      };
    }

    return {
      widthMm: sorted.majorMm * widthRatio,
      depthMm: sorted.secondaryMm * depthRatio,
      heightMm: sorted.thicknessMm,
    };
  };

  const getPartStoreKey = (part: any) => String(
    part?.id ||
    part?.partId ||
    part?.meshName ||
    part?.name ||
    part?.displayName ||
    part?.originalName ||
    ""
  ).trim();

  const getPartMaterialId = (part: any) => {
    const storeKey = getPartStoreKey(part);
    return String(
      materials?.[storeKey] ||
      part?.materialId ||
      part?.material ||
      part?.runtimeMetadata?.materialId ||
      ""
    ).trim();
  };

  const getMaterialRecord = (materialId: string) => {
    const materialKey = String(materialId || "").toLowerCase().trim();
    if (!materialKey) return null;

    const sourceMaterials = [
      ...(Array.isArray(runtimeProduct?.materials) ? runtimeProduct.materials : []),
      ...MATERIAL_LIBRARY,
    ];

    return sourceMaterials.find((material: any) => {
      const id = String(material?.id || "").toLowerCase().trim();
      const name = String(material?.name || "").toLowerCase().trim();
      return id === materialKey || name === materialKey;
    }) || null;
  };

  const getMaterialPricePerSqm = (material: any, materialId?: string) => {
    const candidates = [
      // Material Library V1 uses pricePerMq (€/mq).
      material?.pricePerMq,
      material?.pricing?.pricePerMq,
      material?.metadata?.pricePerMq,
      // Backward-compatible aliases already used by previous pricing tests.
      material?.pricePerSqm,
      material?.priceSqm,
      material?.costPerSqm,
      material?.costSqm,
      material?.eurPerSqm,
      material?.priceM2,
      material?.costM2,
      material?.pricing?.pricePerSqm,
      material?.pricing?.costPerSqm,
      material?.metadata?.pricePerSqm,
      material?.metadata?.costPerSqm,
    ];

    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) return value;
    }

    const key = `${materialId || material?.id || ""} ${material?.name || ""}`.toLowerCase();
    if (!key.trim()) return 0;
    if (/fenix|hpl|compact|laminam|gres|stone|marmo|calacatta|statuario|onice|emperador/.test(key)) return 110;
    if (/laccat|lucid|opaco|verniciat/.test(key)) return 95;
    if (/rovere|noce|olmo|legno|wood|truciolato|bilaminato|melaminico|laminato/.test(key)) return 65;
    if (/metallo|acciaio|alluminio|nero|tortora|bianco|cemento/.test(key)) return 75;
    return 65;
  };

  const getPanelAreaSqm = (part: any, category?: string) => {
    if (category !== "panel") return 0;

    const scaledBounds = getScaledBoundsMm(part);
    if (!scaledBounds) return 0;

    const dimensionsMm = [
      scaledBounds.widthMm,
      scaledBounds.depthMm,
      scaledBounds.heightMm,
    ].filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => b - a);

    if (dimensionsMm.length < 2) return 0;
    return (Number(dimensionsMm[0] || 0) * Number(dimensionsMm[1] || 0)) / 1000000;
  };

  const getDimensionLabel = (part: any) => {
    const scaledBounds = getScaledBoundsMm(part);
    if (!scaledBounds) return "-";

    const { widthMm, depthMm, heightMm } = scaledBounds;

    if (!widthMm && !depthMm && !heightMm) return "-";

    return `${formatMmValue(widthMm)} × ${formatMmValue(depthMm)} × ${formatMmValue(heightMm)} mm`;
  };

  const grouped = new Map<string, any>();

  sourceParts.forEach((part: any) => {
    const label = getBomLabel(part);
    const category = normalizeBomCategory(part);
    const groupTitle = getBomGroupTitle(category);
    const dimensionsLabel = getDimensionLabel(part);
    const materialId = getPartMaterialId(part);
    const materialRecord = getMaterialRecord(materialId);
    const materialName = materialRecord ? translateMaterialName(materialRecord, t) : materialId || "Materiale non assegnato";
    const pricePerSqm = category === "panel" ? getMaterialPricePerSqm(materialRecord, materialId) : 0;
    const areaSqm = getPanelAreaSqm(part, category);
    const materialCost = areaSqm * pricePerSqm;
    const key = `${category}|${label.toLowerCase()}|${dimensionsLabel}|${category === "panel" ? materialId.toLowerCase() : ""}`;
    const id = String(part?.partId || part?.id || part?.meshName || part?.name || "").trim();

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        name: label,
        category,
        groupTitle,
        groupOrder: getBomGroupOrder(category),
        dimensionsLabel,
        quantity: 0,
        partIds: [],
        materialId,
        materialName,
        pricePerSqm,
        areaSqm: 0,
        materialCost: 0,
      });
    }

    const row = grouped.get(key);
    row.quantity += 1;
    row.areaSqm += areaSqm;
    row.materialCost += materialCost;
    if (id) row.partIds.push(id);
  });

  const addSyntheticPanelRow = (options: {
    key: string;
    name: string;
    quantity: number;
    widthMm: number;
    depthMm: number;
    thicknessMm?: number;
    pricePerSqm?: number;
  }) => {
    const quantity = Math.max(0, Math.round(Number(options.quantity || 0)));
    if (quantity <= 0) return;

    const widthMm = Number(options.widthMm || 0);
    const depthMm = Number(options.depthMm || 0);
    const thicknessMm = Number(options.thicknessMm || 18);
    if (!Number.isFinite(widthMm) || widthMm <= 0 || !Number.isFinite(depthMm) || depthMm <= 0) return;

    const pricePerSqm = Number(options.pricePerSqm || 28);
    const areaSqm = (widthMm * depthMm) / 1000000;
    const materialCost = areaSqm * pricePerSqm * quantity;
    const dimensionsLabel = `${formatMmValue(widthMm)} × ${formatMmValue(depthMm)} × ${formatMmValue(thicknessMm)} mm`;
    const id = `synthetic-structure-${options.key}`;

    grouped.set(id, {
      id,
      name: options.name,
      category: "panel",
      groupTitle: "Pannelli",
      groupOrder: 1,
      dimensionsLabel,
      quantity,
      partIds: [],
      materialId: "structure-v1",
      materialName: "Materiale struttura V1",
      pricePerSqm,
      areaSqm: areaSqm * quantity,
      materialCost,
    });
  };

  const currentWidthMm = Number(dimensions?.width ?? runtimeProduct?.dimensions?.width?.default ?? 180) * 10;
  const currentHeightMm = Number(dimensions?.height ?? runtimeProduct?.dimensions?.height?.default ?? 100) * 10;
  const currentDepthMm = Number(dimensions?.depth ?? runtimeProduct?.dimensions?.depth?.default ?? 60) * 10;
  const panelThicknessMm = 18;

  addSyntheticPanelRow({
    key: "vertical-dividers",
    name: "Divisorio verticale configurato",
    quantity: structureCounts.verticalDividers,
    widthMm: currentHeightMm,
    depthMm: currentDepthMm,
    thicknessMm: panelThicknessMm,
  });

  addSyntheticPanelRow({
    key: "horizontal-dividers",
    name: "Divisorio orizzontale configurato",
    quantity: structureCounts.horizontalDividers,
    widthMm: currentWidthMm,
    depthMm: currentDepthMm,
    thicknessMm: panelThicknessMm,
  });
  addSyntheticPanelRow({
    key: "shelves",
    name: "Ripiano configurato",
    quantity: structureCounts.shelves,
    widthMm: currentWidthMm,
    depthMm: currentDepthMm,
    thicknessMm: panelThicknessMm,
  });
  addSyntheticPanelRow({
    key: "doors",
    name: "Anta configurata",
    quantity: structureCounts.doors,
    widthMm: currentWidthMm / Math.max(1, structureCounts.doors),
    depthMm: currentHeightMm,
    thicknessMm: panelThicknessMm,
  });
  addSyntheticPanelRow({
    key: "drawers-front",
    name: "Frontale cassetto configurato",
    quantity: structureCounts.drawers,
    widthMm: currentWidthMm / Math.max(1, structureCounts.doors || 1),
    depthMm: 220,
    thicknessMm: panelThicknessMm,
  });

  return Array.from(grouped.values()).sort((a: any, b: any) =>
    Number(a.groupOrder || 99) - Number(b.groupOrder || 99) ||
    String(a.name).localeCompare(String(b.name)) ||
    String(a.dimensionsLabel).localeCompare(String(b.dimensionsLabel))
  );
}, [runtimeProduct, viewerRuntimeComponents, materials, dimensions, structureCounts, t]);

const bomSections = useMemo(() => {
  const sections = new Map<string, any>();

  bomRows.forEach((row: any) => {
    const key = row.groupTitle || "Componenti";
    if (!sections.has(key)) {
      sections.set(key, {
        title: key,
        order: row.groupOrder || 99,
        rows: [],
      });
    }
    sections.get(key).rows.push(row);
  });

  return Array.from(sections.values()).sort((a: any, b: any) => Number(a.order || 99) - Number(b.order || 99));
}, [bomRows]);

const materialPricingSummary = useMemo(() => {
  const panelRows = bomRows.filter((row: any) => row.category === "panel");
  const areaSqm = panelRows.reduce((total: number, row: any) => total + Number(row.areaSqm || 0), 0);
  const materialCost = panelRows.reduce((total: number, row: any) => total + Number(row.materialCost || 0), 0);
  const pricedRows = panelRows.filter((row: any) => Number(row.pricePerSqm || 0) > 0).length;

  return {
    areaSqm,
    materialCost,
    pricedRows,
    panelRows: panelRows.length,
  };
}, [bomRows]);

const displayPricing = useMemo(() => {
  const baseTotal = Number(basePricing?.total || 0);
  const materialCost = Number(materialPricingSummary.materialCost || 0);

  return {
    ...basePricing,
    materialCost,
    total: baseTotal + materialCost,
  };
}, [basePricing, materialPricingSummary]);

  const selectedPart = useMemo(() => {
    if (!selectedPartId) return null;

    const productPart =
      runtimeProduct?.parts?.find((part: any) => part.id === selectedPartId) ||
      runtimeProduct?.parts?.find((part: any) => part.meshName === selectedPartId) ||
      runtimeProduct?.parts?.find((part: any) => part.name === selectedPartId) ||
      runtimeProduct?.parts?.find((part: any) => part.partId === selectedPartId) ||
      runtimeProduct?.parts?.find((part: any) => part.displayName === selectedPartId) ||
      runtimeProduct?.parts?.find((part: any) => part.originalName === selectedPartId) ||
      null;

    if (productPart) return productPart;

    return (
      viewerRuntimeComponents.find((part: any) => part.id === selectedPartId) ||
      viewerRuntimeComponents.find((part: any) => part.partId === selectedPartId) ||
      viewerRuntimeComponents.find((part: any) => part.meshName === selectedPartId) ||
      viewerRuntimeComponents.find((part: any) => part.name === selectedPartId) ||
      viewerRuntimeComponents.find((part: any) => part.displayName === selectedPartId) ||
      viewerRuntimeComponents.find((part: any) => part.originalName === selectedPartId) ||
      null
    );
  }, [runtimeProduct, selectedPartId, viewerRuntimeComponents]);

  const selectedStoreKey = selectedPart?.id || selectedPartId || "";
  const selectedPartBounds = selectedPart?.bounds || selectedPart?.runtimeMetadata?.bounds || null;
  const getSelectedPartScaledBoundsMm = (part: any) => getScaledBoundsMm(part);
  const selectedPartScaledBounds = selectedPart ? getSelectedPartScaledBoundsMm(selectedPart) : null;
  const selectedPartDimensionLabel = selectedPartScaledBounds
    ? `${formatMmValue(selectedPartScaledBounds.widthMm)} × ${formatMmValue(selectedPartScaledBounds.depthMm)} × ${formatMmValue(selectedPartScaledBounds.heightMm)} mm`
    : `${Number(dimensions?.width ?? runtimeProduct?.dimensions?.width?.default ?? 0)} × ${Number(dimensions?.depth ?? runtimeProduct?.dimensions?.depth?.default ?? 0)} × ${Number(dimensions?.height ?? runtimeProduct?.dimensions?.height?.default ?? 0)} cm`;
  const effectiveSelectedPartIds = selectedPartIds.length > 0 ? selectedPartIds : selectedStoreKey ? [selectedStoreKey] : [];
  const hasMultiSelection = effectiveSelectedPartIds.length > 1;

  const selectedRuntimeComponents = useMemo(() => {
    if (!effectiveSelectedPartIds.length) return [];

    const selectedSet = new Set(effectiveSelectedPartIds.map((id) => String(id || "")));
    return viewerRuntimeComponents.filter((component: any) => {
      const aliases = [
        component?.id,
        component?.partId,
        component?.meshName,
        component?.name,
        component?.displayName,
        component?.originalName,
      ]
        .map((value: any) => String(value || ""))
        .filter(Boolean);

      return aliases.some((alias) => selectedSet.has(alias));
    });
  }, [effectiveSelectedPartIds, viewerRuntimeComponents]);

 const filteredMaterials = useMemo(() => {
  if (!runtimeProduct) return [];

  const sourceMaterials = MATERIAL_LIBRARY;

  const dedupedMaterials = Array.from(
    new Map(
      sourceMaterials.map((m: any) => [
        String(m.id || m.name).toLowerCase().trim(),
        m,
      ])
    ).values()
  );

  return dedupedMaterials;
}, [runtimeProduct]);
const availableAccessories = useMemo(() => {
  if (!runtimeProduct || !selectedPart) return [];

  const compatible = selectedPart.compatibleAccessories || [];

  const mergedAccessories = mergeById(
    runtimeProduct.accessories || [],
    accessoriesCatalog
  );

  return mergedAccessories.filter((accessory: any) => {
    if (accessory.stateType === "insert") {
      return (
        selectedPart.compatibleInsert === true ||
        compatible.includes("insert")
      );
    }

    return (
      compatible.includes(accessory.id) ||
      (accessory.id === "led" && selectedPart.compatibleLed === true)
    );
  });
}, [runtimeProduct, selectedPart]);

  useEffect(() => {
    if (!isLogoModalOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLogoModalOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isLogoModalOpen]);

  useEffect(() => {
    if (!runtimeProduct) return;

    const timer = window.setTimeout(() => {
      saveAutosave();
      setAutosaveLabel(new Date().toLocaleTimeString(language === "it" ? "it-IT" : "en-US"));
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    runtimeProduct,
    dimensions,
    materials,
    accessories,
    inserts,
    ledKelvin,
    visibility,
    woodDirection,
    activeViewId,
    selectedPartId,
    language,
    saveAutosave,
  ]);

  async function handleModelFileImport(file: File) {
    const format = getImportFileFormat(file.name);

    if (!isSupportedImportModel(file)) {
      const message = `Formato non supportato: .${format || "sconosciuto"}. Formati supportati: ${SUPPORTED_IMPORT_MODEL_ACCEPT}`;
      setImporterStatus(message);
      setLastProjectAction(message);
      showUiNotice(message, "error");
      return;
    }

    if (importedModelUrlRef.current) {
      URL.revokeObjectURL(importedModelUrlRef.current);
      importedModelUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    importedModelUrlRef.current = objectUrl;

    const nextProduct = createImportedModelProduct(file, objectUrl, format, null);

    setViewerRuntimeComponents([]);
    setViewerRuntimeMetadata(null);
    setViewerRuntimeProduct(null);
    setImporterUiState(null);
    componentRowRefs.current = {};
    (window as any).__bagastudioViewerRuntimeComponents = [];
    (window as any).__bagastudioRuntimeProduct = null;
    (window as any).__bagastudioProductPackage = null;

    setRuntimeProduct(nextProduct);
    setDimension("width", nextProduct.dimensions?.width?.default ?? 180);
    setDimension("height", nextProduct.dimensions?.height?.default ?? 100);
    setDimension("depth", nextProduct.dimensions?.depth?.default ?? 60);
    setActiveView("iso");
    setSelectedPart(null);
                  setSelectedPartIds([]);
    setImportName(file.name);
    setImportedModelName(file.name);
    setImportedModelFormat(format.toUpperCase());
    setImportedModelVersion(Date.now());
    setImporterStatus(`Modello importato: ${file.name} (.${format})`);
    setLastProjectAction(`Modello importato: ${file.name}`);
    showUiNotice(`Modello importato: ${file.name}`);

    window.dispatchEvent(
      new CustomEvent("bagastudio:import-model-file", {
        detail: {
          fileName: file.name,
          format,
          objectUrl,
          sizeBytes: file.size,
          importedAt: new Date().toISOString(),
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent("bagastudio:viewer-load-model", {
        detail: {
          file,
          fileName: file.name,
          format,
          objectUrl,
          modelUrl: objectUrl,
          source: "viewer-import-ui",
          forceReload: true,
          importedAt: new Date().toISOString(),
        },
      })
    );

    window.setTimeout(() => {
      try {
        const state = (window as any).bagastudioRefreshImporterUiState?.() || (window as any).bagastudioGetImporterUiState?.();
        if (state) setImporterUiState(state);
      } catch (error) {
        console.warn("BagaStudio importer state not ready yet", error);
      }
    }, 500);
  }

  async function handleProductJsonImport(file: File) {
    try {
      const text = await file.text();
      const rawProduct = JSON.parse(text);

      const isProductPackage =
        rawProduct?.schema === "bagastudio-product-package" ||
        rawProduct?.productPackageVersion === 2;

      if (isProductPackage) {
        const nextProduct = normalizeProduct(rawProduct);

        // Recovery DAE/Viewer V4:
        // il Viewer3D espone bagastudioLoadProductPackageJson solo dopo il mount.
        // Se importiamo un Product Package quando runtimeProduct è ancora vuoto,
        // il Viewer non è montato e il loader non può esistere: non deve bloccare l'import.
        // Prima montiamo il prodotto tramite store, poi lasciamo al Viewer caricare il modelUrl/dataUrl.
        setRuntimeProduct(nextProduct);
        setDimension("width", nextProduct.dimensions?.width?.default ?? 180);
        setDimension("height", nextProduct.dimensions?.height?.default ?? 100);
        setDimension("depth", nextProduct.dimensions?.depth?.default ?? 60);
        setActiveView("iso");
        setSelectedPart(null);
                  setSelectedPartIds([]);
        setViewerRuntimeComponents([]);
        componentRowRefs.current = {};
        setImporterUiState((current: any) => ({
          ...(current || {}),
          productPackage: rawProduct,
          componentCount: 0,
        }));

        window.dispatchEvent(new CustomEvent("bagastudio:viewer-component-cleared"));
        window.dispatchEvent(new CustomEvent("bagastudio:runtime-components-cleared"));

        window.setTimeout(() => {
          const packageLoader = (window as any).bagastudioLoadProductPackageJson;
          if (typeof packageLoader === "function") {
            try {
              packageLoader(rawProduct);
            } catch (loaderError) {
              console.warn("BagaStudio deferred Product Package loader skipped", loaderError);
            }
          }
        }, 120);

        setImportName(file.name);
        setLastProjectAction(`Product Package importato: ${file.name}`);
        setImporterStatus(`Product Package importato: ${file.name}`);
        showUiNotice(`Product Package importato: ${file.name}`);
        console.info("BagaStudio Product Package imported without blocking on Viewer runtime loader");
        return;
      }

      const nextProduct = normalizeProduct(rawProduct);

      setRuntimeProduct(nextProduct);

      setDimension("width", nextProduct.dimensions?.width?.default ?? 180);
      setDimension("height", nextProduct.dimensions?.height?.default ?? 100);
      setDimension("depth", nextProduct.dimensions?.depth?.default ?? 60);

      nextProduct.parts.forEach((part: any) => {
        setVisibility(part.id, part.visible !== false);
        if (part.meshName) setVisibility(part.meshName, part.visible !== false);
      });

      setActiveView("iso");
      setSelectedPart(null);
                  setSelectedPartIds([]);
      setImportName(file.name);
      setLastProjectAction(`Prodotto JSON importato: ${file.name}`);
      setImporterStatus(`Prodotto JSON importato: ${file.name}`);
      showUiNotice(`Prodotto JSON importato: ${file.name}`);
      console.info("BagaStudio product imported successfully");
    } catch (error) {
      console.error("BagaStudio product import error", error);
      setLastProjectAction(t.invalidProductJson);
      showUiNotice(t.invalidProductJson, "error");
    }
  }

  async function handleBackupImport(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.product || data.runtimeProduct) {
        const nextProduct = normalizeProduct(data.runtimeProduct || data.product);
        setRuntimeProduct(nextProduct);
      }

      if (data.configuration) {
        importConfiguration(data.configuration);
      }

      setLastProjectAction(t.backupImported);
      showUiNotice(t.backupImported);
    } catch (error) {
      console.error("BagaStudio backup import error", error);
      setLastProjectAction(t.invalidBackupJson);
      showUiNotice(t.invalidBackupJson, "error");
    }
  }

  return (
   <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.20),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(59,130,246,0.12),transparent_26%),#03070d] text-white">
  <div className="flex h-screen flex-col overflow-hidden">
    <ViewerPremiumHeader
      t={t}
      language={language}
      activePanel={activePanel}
      totalPrice={displayPricing.total}
      onOpenLogo={() => setIsLogoModalOpen(true)}
      onAdminPanel={() => window.location.href = "/admin-panel"}
      onLanguageChange={(nextLanguage) => setLanguage(nextLanguage)}
      onPanelChange={setActivePanel}
      onSave={() => saveAutosave()}
      onExport={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())}
      onQuote={() => downloadJson("bagastudio-config.json", exportConfiguration())}
    />

    {uiNotice && (
      <div
        className={`fixed left-[118px] top-6 z-[120] flex min-w-[300px] max-w-[460px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-[0_18px_60px_rgba(0,0,0,0.45)] ${
          uiNotice.type === "error"
            ? "border-red-400/40 bg-red-500/20 text-red-50"
            : uiNotice.type === "info"
              ? "border-sky-400/40 bg-sky-500/20 text-sky-50"
              : "border-emerald-400/40 bg-emerald-500/20 text-emerald-50"
        }`}
      >
        <span className="text-lg">{uiNotice.type === "error" ? "⚠" : uiNotice.type === "info" ? "ℹ" : "✓"}</span>
        <span className="flex-1">{uiNotice.message}</span>
        <button
          type="button"
          onClick={() => setUiNotice(null)}
          className="rounded-full px-2 text-lg leading-none text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Chiudi avviso"
        >
          ×
        </button>
      </div>
    )}

    <ViewerRuntimeStatusBar
      componentCount={viewerRuntimeComponents.length || 0}
      selectedCount={effectiveSelectedPartIds.length}
    />

    <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_360px] gap-2 bg-[#030911] p-2">
  <aside className="overflow-y-auto rounded-[22px] border border-sky-400/15 bg-[#07111c]/92 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_70px_rgba(0,0,0,0.28)]">
  <section className="hidden">
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setIsLogoModalOpen(true)}
        className="rounded-2xl border border-sky-300/25 bg-black/35 p-2 shadow-[0_0_24px_rgba(14,165,233,0.22)] transition hover:scale-[1.03] hover:border-sky-300/50"
      >
        <img src="/bagastudio-core-brand.png" alt="BagaStudio Core" className="h-16 w-auto object-contain" />
      </button>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.38em] text-sky-300">BagaStudio</p>
        <h2 className="text-xl font-black leading-tight text-white">Core Viewer</h2>
        <p className="mt-1 text-xs font-semibold text-cyan-100/80">BagaStudio Core Viewer</p>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-2 py-2">
        <span className="block text-[10px] uppercase tracking-[0.16em] text-emerald-200">Runtime</span>
        <strong className="text-sm text-white">Ready</strong>
      </div>
      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-2 py-2">
        <span className="block text-[10px] uppercase tracking-[0.16em] text-sky-200">Pezzi</span>
        <strong className="text-sm text-white">{viewerRuntimeComponents.length || 0}</strong>
      </div>
      <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-2 py-2">
        <span className="block text-[10px] uppercase tracking-[0.16em] text-violet-200">Select</span>
        <strong className="text-sm text-white">{effectiveSelectedPartIds.length}</strong>
      </div>
    </div>
  </section>

{activePanel === "config" && (
  <>
    <section className="rounded-3xl border border-emerald-400/20 bg-[#081827]/90 p-4 shadow-[0_0_24px_rgba(16,185,129,0.10)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Azioni rapide</p>
          <h3 className="mt-1 text-lg font-black text-white">Materiale modello</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-400">Seleziona un pezzo e cambia subito texture e venatura.</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Quick</span>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Materiale</span>
          <select
            disabled={!selectedStoreKey}
            value={hasMultiSelection ? "" : selectedStoreKey ? materials?.[selectedStoreKey] || "" : ""}
            onChange={(event) => {
              const targetPartIds = effectiveSelectedPartIds
                .map((value: any) => String(value || ""))
                .filter(Boolean);
              if (!targetPartIds.length) return;

              const nextMaterialId = event.target.value;
              targetPartIds.forEach((key) => setMaterial(key, nextMaterialId));
            }}
            className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{t.selectMaterial}</option>
            {filteredMaterials.map((material: any) => (
              <option key={material.id} value={material.id}>
                {translateMaterialName(material, t)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Pezzo selezionato</p>
          <p className="text-sm font-black text-white">
            {selectedPart ? translatePartName(selectedPart, t) : selectedPartId || t.noSelectedPart}
          </p>
          {hasMultiSelection && (
            <p className="mt-1 text-xs font-semibold text-cyan-200">{effectiveSelectedPartIds.length} pezzi selezionati</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Venatura</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!selectedStoreKey}
              onClick={() => effectiveSelectedPartIds.forEach((partId) => setWoodDirection(partId, "x"))}
              className={`rounded-2xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                (woodDirection?.[selectedPart?.id || selectedStoreKey] || "x") === "x"
                  ? "border-emerald-300 bg-emerald-500 text-white"
                  : "border-neutral-700 bg-neutral-900 text-white"
              }`}
            >
              {t.horizontal}
            </button>
            <button
              type="button"
              disabled={!selectedStoreKey}
              onClick={() => effectiveSelectedPartIds.forEach((partId) => setWoodDirection(partId, "z"))}
              className={`rounded-2xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                woodDirection?.[selectedPart?.id || selectedStoreKey] === "z"
                  ? "border-emerald-300 bg-emerald-500 text-white"
                  : "border-neutral-700 bg-neutral-900 text-white"
              }`}
            >
              {t.vertical}
            </button>
          </div>
        </div>
      </div>
    </section>

    <ViewerImportWorkflowPanel
      t={t}
      importName={importName}
      importedModelName={importedModelName}
      importedModelFormat={importedModelFormat}
      importerStatus={importerStatus}
      importerUiState={importerUiState}
      viewerRuntimeComponents={viewerRuntimeComponents}
      viewerRuntimeMetadata={viewerRuntimeMetadata}
      lastImporterEvent={lastImporterEvent}
      supportedModelAccept={SUPPORTED_IMPORT_MODEL_ACCEPT}
      recentProjects={recentProjects}
      onRecentProjectOpen={openRecentProject}
      onModelFileImport={handleModelFileImport}
      onProductJsonImport={handleProductJsonImport}
      onRefreshImporterState={() => {
        const state = (window as any).bagastudioRefreshImporterUiState?.() || (window as any).bagastudioGetImporterUiState?.();
        setImporterUiState(state || null);
        setLastImporterEvent("Refresh manuale");
      }}
      onRestoreAutosave={() => {
        const ok = restoreAutosave();
        if (!ok) {
          setLastProjectAction(t.noAutosaveAvailable);
          showUiNotice(t.noAutosaveAvailable, "error");
        }
        if (ok) {
          setLastProjectAction(t.autosaveRestored);
          showUiNotice(t.autosaveRestored);
        }
      }}
      onBackupImport={handleBackupImport}
    />

  </>
)}


{activePanel === "admin" && (
  <>
    <section className="rounded-3xl border border-sky-400/25 bg-[#081827] p-5 shadow-[0_0_26px_rgba(14,165,233,0.10)]">
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.35em] text-sky-400">
        BagaStudio Core
      </p>
    </section>

    <section className="rounded-3xl border border-sky-400/25 bg-sky-500/5 p-5 shadow-[0_0_26px_rgba(14,165,233,0.10)]">
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.35em] text-sky-400">
        STRUMENTI AVANZATI
      </p>
      <h2 className="mb-2 text-lg font-black text-white">Export e diagnostica prodotto</h2>
      <p className="mb-4 text-xs leading-5 text-neutral-300">
        L'import principale ora si trova nella scheda Importa. Qui restano gli strumenti avanzati di export, diagnostica e compatibilità.
      </p>


      {(importedModelName || importerStatus) && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-neutral-300">
          {importedModelName && (
            <p><span className="font-bold text-white">File:</span> {importedModelName}</p>
          )}
          {importedModelFormat && (
            <p><span className="font-bold text-white">Formato:</span> {importedModelFormat}</p>
          )}
          {importerStatus && (
            <p className="mt-1 text-sky-200">{importerStatus}</p>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastImportAsGLB?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Scarica GLB
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadImporterJsonBundle?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Scarica JSON bundle
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastProductPackage?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Product Package
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastAdminMapping?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Admin Mapping
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastImporterReport?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Report Importer
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadProductThumbnail?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Thumbnail
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadImporterCompletePackage?.()}
          className="col-span-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-3 py-3 text-xs font-black text-sky-100 hover:border-sky-300/60 hover:bg-sky-400/15"
        >
          Scarica pacchetto completo
        </button>
        <button
          type="button"
          onClick={() => {
            const result = (window as any).bagastudioCheckImporterCompatibility?.();
            setLastImporterEvent(result?.status ? `Compatibility: ${result.status}` : "Compatibility check avviato");
            const state = (window as any).bagastudioRefreshImporterUiState?.() || (window as any).bagastudioGetImporterUiState?.();
            setImporterUiState(state || null);
          }}
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-400/15"
        >
          Verifica compatibilità
        </button>
        <button
          type="button"
          onClick={() => {
            const result = (window as any).bagastudioSaveCompleteProductPackage?.();
            setLastImporterEvent(result ? "Save Product avviato" : "Save Product non disponibile");
          }}
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 hover:border-amber-300/60 hover:bg-amber-400/15"
        >
          Salva prodotto
        </button>
      </div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">{t.backupAutosave}</h2>
      <div className="grid gap-3">
        <div className="mt-2 border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">Ripristino rapido</div>

        <button
          type="button"
          onClick={() => {
            saveAutosave();
            setAutosaveLabel(new Date().toLocaleTimeString(language === "it" ? "it-IT" : "en-US"));
            setLastProjectAction(t.autosaveSavedManual);
            showUiNotice(t.autosaveSavedManual);
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.saveAutosave}
        </button>

        <button
          type="button"
          onClick={() => {
            const ok = restoreAutosave();
            if (!ok) {
              setLastProjectAction(t.noAutosaveAvailable);
              showUiNotice(t.noAutosaveAvailable, "error");
            }
            if (ok) {
              setLastProjectAction(t.autosaveRestored);
              showUiNotice(t.autosaveRestored);
            }
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.restoreAutosave}
        </button>

        <div className="mt-2 border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">Backup tecnico</div>

        <button
          type="button"
          onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())}
          className="rounded-2xl border border-sky-400/30 bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.25)]"
        >
          {t.downloadFullBackup}
        </button>

        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10">
          {t.importBackup}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleBackupImport(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        {autosaveLabel ? `${t.lastAutosave}: ${autosaveLabel}` : t.autosaveReady}
      </p>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">{t.customerConfiguration}</h2>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.exportConfiguration}
        </button>

        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10">
          {t.importConfiguration}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              try {
                const fileText = await file.text();
                const data = JSON.parse(fileText);

                importConfiguration(data);
                setLastProjectAction(t.configurationImported);
                showUiNotice(t.configurationImported);
              } catch (error) {
                console.error("BagaStudio configuration import error", error);
                setLastProjectAction(t.invalidConfigurationJson);
                showUiNotice(t.invalidConfigurationJson, "error");
              }

              event.target.value = "";
            }}
          />
        </label>
      </div>
    </section>
  </>
)}

{activePanel === "accessories" && (
  <>
    <section className="rounded-[20px] border border-sky-400/15 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <h2 className="mb-3 text-lg font-semibold">{t.accessories}</h2>
      <p className="mb-3 text-sm text-neutral-400">
        {t.applyAccessoriesTo}: {selectedPart ? translatePartName(selectedPart, t) : selectedPartId || "-"}
      </p>

      {!selectedPart && (
        <p className="text-sm text-neutral-500">{t.selectPartFromModel}</p>
      )}

      {availableAccessories.map((accessory: any) => {
        const isInsert = accessory.stateType === "insert";
        const isActive = isInsert
          ? inserts?.[selectedStoreKey] === true
          : isAccessoryActive(accessories, selectedStoreKey, accessory.id);

        return (
          <button
            key={accessory.id}
            onClick={() => {
              if (!selectedStoreKey) return;

              if (isInsert) {
                setInsert(selectedStoreKey, !isActive);
                return;
              }

              setAccessory(selectedStoreKey, accessory.id, !isActive);
            }}
            className={`mb-3 w-full rounded-2xl border px-4 py-3 transition ${
              isActive
                ? "border-amber-300 bg-sky-500 text-white shadow-lg"
                : "border-neutral-700 bg-neutral-900 text-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{translateAccessoryName(accessory, t)}</span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-black text-sky-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {isActive ? t.on : t.off}
              </span>
            </div>
          </button>
        );
      })}

      {selectedStoreKey && inserts?.[selectedStoreKey] && (
        <>
          <div className="mt-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-3">
            <p className="mb-3 text-sm font-semibold text-white">{t.insertDimensions}</p>

            {[
              { key: "width", label: t.insertWidthPercent, min: 5, max: 100 },
              { key: "depth", label: t.insertDepthPercent, min: 5, max: 100 },
              { key: "offsetX", label: t.insertOffsetX, min: -600, max: 600 },
              { key: "offsetZ", label: t.insertOffsetZ, min: -300, max: 300 },
            ].map((control) => {
              const insertDefaults = getDefaultInsertConfig();

              const currentSize = insertSizes?.[selectedStoreKey] || {
                width: insertDefaults.widthPercent,
                depth: insertDefaults.heightPercent,
                offsetX: insertDefaults.offsetX,
                offsetZ: insertDefaults.offsetY,
              };

              return (
                <label key={control.key} className="mb-3 block text-xs text-neutral-300">
                  <div className="mb-1 flex justify-between">
                    <span>{control.label}</span>
                    <span>{currentSize[control.key as keyof typeof currentSize]}</span>
                  </div>

                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step="1"
                    value={currentSize[control.key as keyof typeof currentSize]}
                    onChange={(event) =>
                      setInsertSize(selectedStoreKey, {
                        ...currentSize,
                        [control.key]: Number(event.target.value),
                      })
                    }
                    className="w-full"
                  />
                </label>
              );
            })}
          </div>

          <label className="mt-4 block text-xs text-neutral-300">
            {t.insertMaterial}
            <select
              value={insertMaterials?.[selectedStoreKey] || "marmo"}
              onChange={(event) =>
                setInsertMaterial(selectedStoreKey, event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
            >
              <option value="marmo">{t.materialMarble}</option>
              <option value="calacatta">{t.materialCalacatta}</option>
              <option value="marquinia">{t.materialMarquinia}</option>
              <option value="statuario">{t.materialStatuario}</option>
              <option value="travertino">{t.materialTravertino}</option>
              <option value="onice">{t.materialOnice}</option>
              <option value="emperador">{t.materialEmperador}</option>
            </select>
          </label>
        </>
      )}

      {selectedStoreKey && isAccessoryActive(accessories, selectedStoreKey, "led") && (
        <>
          <div className="mt-4">
            <label className="mb-2 block text-sm">{t.ledTemperature}</label>
            <div className="flex gap-2">
              {[4500, 6000].map((kelvin) => (
                <button
                  key={kelvin}
                  onClick={() => setLedKelvin(selectedStoreKey, kelvin)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    Number(ledKelvin?.[selectedStoreKey] || 4500) === kelvin
                      ? kelvin === 4500
                        ? "border-amber-400 bg-sky-500 text-white"
                        : "border-blue-400 bg-blue-500 text-white"
                      : "border-neutral-700 bg-neutral-900 text-white"
                  }`}
                >
                  {kelvin}K
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{t.ledIntensity}</span>
              <span>{Number(ledIntensity?.[selectedStoreKey] ?? 1).toFixed(1)}x</span>
            </div>

            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={Number(ledIntensity?.[selectedStoreKey] ?? 1)}
              onChange={(event) =>
                setLedIntensity(selectedStoreKey, Number(event.target.value))
              }
              className="w-full"
            />
          </div>
        </>
      )}
    </section>
  </>
)}

{activePanel === "materials" && (
  <>
    <section className="rounded-[22px] border border-cyan-400/20 bg-cyan-500/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">CONFIGURA</p>
      <h2 className="mb-2 text-lg font-black text-white">Workspace aperto</h2>
      <p className="text-xs leading-5 text-neutral-300">
        Usa la finestra grande per dimensioni, struttura, materiali e accessori. La barra laterale resta solo per azioni rapide.
      </p>
    </section>

    <div className="fixed bottom-5 left-[250px] right-[400px] top-[118px] z-40 overflow-hidden rounded-[30px] border border-cyan-400/25 bg-[#07111c]/96 shadow-[0_30px_90px_rgba(0,0,0,0.58)] backdrop-blur-xl">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 bg-white/[0.035] px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300">BagaStudio Core</p>
            <h2 className="mt-1 text-2xl font-black text-white">Configura prodotto</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">
              Workspace professionale per dimensionare, modificare struttura, scegliere materiali e preparare gli accessori. V1 crea il guscio UX: i collegamenti parametrici avanzati saranno attivati a step successivi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("views")}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-neutral-200 hover:border-cyan-300/50 hover:bg-cyan-400/10"
          >
            Chiudi
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-[24px] border border-cyan-400/20 bg-black/24 p-5 xl:col-span-2">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">00</p>
                  <h3 className="mt-1 text-xl font-black text-white">Ambiente V1</h3>
                  <p className="mt-1 text-sm text-neutral-400">Dimensione stanza, pavimento e pareti base per non vedere più il mobile sospeso nel vuoto.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateEnvironmentSetting("showRoom", !environmentSettings.showRoom)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                      environmentSettings.showRoom
                        ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-400/25"
                        : "border-white/10 bg-black/25 text-neutral-300 hover:border-cyan-300/40 hover:bg-cyan-400/10"
                    }`}
                  >
                    Stanza {environmentSettings.showRoom ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={resetEnvironmentSettings}
                    className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-400/20"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="grid gap-3 md:grid-cols-3">
                  {([
                    ["width", "Larghezza stanza", 200, 1200],
                    ["depth", "Profondità stanza", 200, 1200],
                    ["height", "Altezza stanza", 220, 500],
                  ] as const).map(([key, label, min, max]) => (
                    <label key={key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">{label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={min}
                          max={max}
                          step={1}
                          value={environmentSettings[key]}
                          onChange={(event) => updateEnvironmentSetting(key, Number(event.target.value))}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300/60"
                        />
                        <span className="text-xs font-black text-cyan-200">cm</span>
                      </div>
                    </label>
                  ))}

                  <label className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Pavimento</span>
                    <select
                      value={environmentSettings.floorMaterial}
                      onChange={(event) => updateEnvironmentSetting("floorMaterial", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300/60"
                    >
                      {ENVIRONMENT_MATERIAL_OPTIONS.floors.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Pareti</span>
                    <select
                      value={environmentSettings.wallMaterial}
                      onChange={(event) => updateEnvironmentSetting("wallMaterial", event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300/60"
                    >
                      {ENVIRONMENT_MATERIAL_OPTIONS.walls.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.035] p-4 md:col-span-3">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Preview materiali stanza</span>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <div key={`floor-preview-${environmentSettings.floorMaterial}`} className="h-16" style={environmentViewerSurfaces.floor} />
                        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-300">
                          <span>Pavimento</span>
                          <span className="text-cyan-100">{getEnvironmentMaterialLabel("floors", environmentSettings.floorMaterial)}</span>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <div key={`wall-preview-${environmentSettings.wallMaterial}`} className="h-16" style={environmentViewerSurfaces.wall} />
                        <div className="flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-300">
                          <span>Pareti</span>
                          <span className="text-cyan-100">{getEnvironmentMaterialLabel("walls", environmentSettings.wallMaterial)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Pareti visibili</span>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ["showBackWall", "Fondo"],
                        ["showLeftWall", "SX"],
                        ["showRightWall", "DX"],
                      ] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateEnvironmentSetting(key, !environmentSettings[key])}
                          className={`rounded-xl border px-2 py-2 text-xs font-black ${
                            environmentSettings[key]
                              ? "border-cyan-300/45 bg-cyan-500/20 text-white"
                              : "border-white/10 bg-black/25 text-neutral-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-cyan-400/15 bg-[#06111d] p-4">
                  <div className="relative h-56 overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_42%),#020812]">
                    {environmentSettings.showBackWall && <div className="absolute left-[15%] right-[15%] top-[12%] h-[42%] rounded-t-2xl border border-white/10" style={environmentViewerSurfaces.wall} />}
                    {environmentSettings.showLeftWall && <div className="absolute left-[8%] top-[18%] h-[53%] w-[22%] skew-y-[-18deg] rounded-l-2xl border border-white/10" style={environmentViewerSurfaces.wall} />}
                    {environmentSettings.showRightWall && <div className="absolute right-[8%] top-[18%] h-[53%] w-[22%] skew-y-[18deg] rounded-r-2xl border border-white/10" style={environmentViewerSurfaces.wall} />}
                    <div className="absolute bottom-[12%] left-[14%] right-[14%] h-[34%] skew-x-[-12deg] rounded-2xl border border-cyan-300/15 shadow-[0_22px_60px_rgba(0,0,0,0.45)]" style={environmentViewerSurfaces.floor} />
                    <div className="absolute bottom-[29%] left-1/2 h-20 w-28 -translate-x-1/2 rounded-xl border border-emerald-300/25 bg-emerald-400/15 shadow-[0_0_30px_rgba(16,185,129,0.18)]" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100/80">
                      <span>{environmentSettings.width} × {environmentSettings.depth} cm</span>
                      <span>H {environmentSettings.height} cm</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-neutral-400">
                    Ambiente salvato nel progetto .baga e visualizzato come guscio ambiente nel Viewer. La geometria 3D reale interna a Viewer3D sarà lo step successivo con il file Viewer3D.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-sky-400/15 bg-black/24 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">01</p>
                  <h3 className="mt-1 text-xl font-black text-white">Dimensioni</h3>
                  <p className="mt-1 text-sm text-neutral-400">Larghezza, altezza, profondità e spessori.</p>
                </div>
                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">Parametric</span>
              </div>

              {runtimeProduct?.dimensions ? (
                <div className="grid gap-3">
                  {(["width", "height", "depth"] as const).map((key) => {
                    const dim = runtimeProduct.dimensions?.[key];
                    if (!dim) return null;

                    return (
                      <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <label className="text-sm font-black uppercase tracking-[0.14em] text-neutral-200">{translateDimensionName(key, t)}</label>
                          <span className="text-lg font-black text-sky-200">{Number(dimensions?.[key] ?? dim.default)} cm</span>
                        </div>
                        <input
                          type="range"
                          min={dim.min}
                          max={dim.max}
                          step={dim.step || 1}
                          value={Number(dimensions?.[key] ?? dim.default)}
                          onChange={(event) => setDimension(key, Number(event.target.value))}
                          className="w-full accent-sky-400"
                        />
                        <p className="mt-2 text-xs text-neutral-500">Min {dim.min} cm · Max {dim.max} cm · Step {dim.step || 1} cm</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-neutral-400">
                  Nessun dato parametrico dimensionale nel Product Package corrente. Qui entreranno larghezza, altezza, profondità e spessori quando il prodotto li espone.
                </div>
              )}
            </section>

            <section className="rounded-[24px] border border-violet-400/15 bg-black/24 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">02</p>
                  <h3 className="mt-1 text-xl font-black text-white">Struttura</h3>
                  <p className="mt-1 text-sm text-neutral-400">Divisori verticali, divisori orizzontali, ripiani, cassetti, ante e vani aperti.</p>
                </div>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">V2.1</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "verticalDividers", title: "Divisori verticali", description: "Dividono i vani in larghezza", value: structureCounts.verticalDividers },
                  { key: "horizontalDividers", title: "Divisori orizzontali", description: "Dividono i vani in altezza", value: structureCounts.horizontalDividers },
                  { key: "shelves", title: "Ripiani", description: "Piani interni regolabili/fissi", value: structureCounts.shelves },
                  { key: "drawers", title: "Cassetti", description: "Frontali cassetto V1", value: structureCounts.drawers },
                  { key: "doors", title: "Ante", description: "Frontali / battenti", value: structureCounts.doors },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <span className="block text-sm font-black text-white">{item.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-neutral-400">{item.description}</span>
                      </div>
                      <span className="rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-sm font-black text-violet-100">{item.value}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateStructureCount(item.key as keyof typeof structureCounts, -1)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-black text-neutral-100 hover:border-violet-300/45 hover:bg-violet-400/10"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStructureCount(item.key as keyof typeof structureCounts, 1)}
                        className="rounded-xl border border-violet-300/25 bg-violet-500/20 px-3 py-2 text-sm font-black text-white hover:border-violet-200/70 hover:bg-violet-500/30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-violet-400/10 bg-black/20 p-3 text-xs leading-5 text-neutral-400">
                V2 aggiorna BOM e prezzo. Il Viewer 3D verrà collegato nello step Parametric Geometry V1.
              </div>
            </section>

            <section className="rounded-[24px] border border-emerald-400/15 bg-black/24 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">03</p>
                  <h3 className="mt-1 text-xl font-black text-white">Materiali</h3>
                  <p className="mt-1 text-sm text-neutral-400">Scelta rapida per pezzo selezionato e macro-gruppi futuri.</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Texture</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Pezzo selezionato</p>
                <p className="mb-4 text-sm font-bold text-white">{selectedPart ? translatePartName(selectedPart, t) : selectedPartId || t.noSelectedPart}</p>

                <select
                  disabled={!selectedStoreKey}
                  value={hasMultiSelection ? "" : selectedStoreKey ? materials?.[selectedStoreKey] || "" : ""}
                  onChange={(event) => {
                    const targetPartIds = effectiveSelectedPartIds
                      .map((value: any) => String(value || ""))
                      .filter(Boolean);
                    if (!targetPartIds.length) return;

                    const nextMaterialId = event.target.value;
                    targetPartIds.forEach((key) => setMaterial(key, nextMaterialId));
                  }}
                  className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-emerald-300/60"
                >
                  <option value="">{t.selectMaterial}</option>
                  {filteredMaterials.map((material: any) => (
                    <option key={material.id} value={material.id}>
                      {translateMaterialName(material, t)}
                    </option>
                  ))}
                </select>

                {selectedStoreKey && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => effectiveSelectedPartIds.forEach((partId) => setWoodDirection(partId, "x"))}
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold ${
                        (woodDirection?.[selectedPart?.id || selectedStoreKey] || "x") === "x"
                          ? "border-emerald-300 bg-emerald-500 text-white"
                          : "border-neutral-700 bg-neutral-900 text-white"
                      }`}
                    >
                      {t.horizontal}
                    </button>

                    <button
                      type="button"
                      onClick={() => effectiveSelectedPartIds.forEach((partId) => setWoodDirection(partId, "z"))}
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold ${
                        woodDirection?.[selectedPart?.id || selectedStoreKey] === "z"
                          ? "border-emerald-300 bg-emerald-500 text-white"
                          : "border-neutral-700 bg-neutral-900 text-white"
                      }`}
                    >
                      {t.vertical}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Scocca", "Frontali", "Divisori", "Ripiani", "Schiene", "Top"].map((group) => (
                  <button key={group} type="button" className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-black text-neutral-200 hover:border-emerald-300/45 hover:bg-emerald-400/10">
                    {group}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-amber-400/15 bg-black/24 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">04</p>
                  <h3 className="mt-1 text-xl font-black text-white">Accessori rapidi</h3>
                  <p className="mt-1 text-sm text-neutral-400">Maniglie, LED, prese, portaphon e optional.</p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Add-on</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Maniglie", "Scelta maniglie e profili"],
                  ["LED", "Accensione, Kelvin e intensità"],
                  ["Prese", "Presa 503 e punti tecnici"],
                  ["Portaphon", "Accessori parrucchiere"],
                  ["Lavabi", "Appoggio o incasso"],
                  ["Ruote / Piedini", "Supporti e basamenti"],
                ].map(([title, description]) => (
                  <button
                    key={title}
                    type="button"
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left hover:border-amber-300/45 hover:bg-amber-400/10"
                  >
                    <span className="block text-sm font-black text-white">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-400">{description}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-white">Trasparenza / X-Ray</p>
                    <p className="text-xs text-neutral-400">Controllo visivo interno del modello</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setXRayEnabled((value) => !value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                      xRayEnabled
                        ? "border-cyan-300 bg-cyan-500 text-white"
                        : "border-neutral-700 bg-neutral-900 text-neutral-200"
                    }`}
                  >
                    {xRayEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.08}
                    max={0.9}
                    step={0.01}
                    value={xRayOpacity}
                    onChange={(event) => setXRayOpacity(Number(event.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <span className="w-12 text-right text-xs font-bold text-cyan-200">
                    {Math.round(xRayOpacity * 100)}%
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </>
)}

{activePanel === "save" && (
  <>
    <section className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">SALVA</p>
      <h2 className="mb-2 text-lg font-black text-white">Progetto BagaStudio</h2>
      <p className="mb-4 text-sm leading-6 text-neutral-300">Area quotidiana per creare, salvare e riaprire file progetto .baga.</p>

      <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-black/25 p-4">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Nome progetto</label>
        <input
          type="text"
          value={currentProjectName}
          onChange={(event) => setCurrentProjectName(event.target.value)}
          placeholder="Progetto BagaStudio"
          className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-300/60"
        />
        <p className="mt-2 text-[11px] leading-5 text-neutral-400">
          File previsto: <strong className="text-emerald-100">{getSafeProjectFilename(getCurrentProjectName())}</strong>
        </p>
        {lastProjectAction && (
          <p className="mt-2 rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-100">
            {lastProjectAction}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={newProject}
          className="rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm font-black text-sky-100 hover:bg-sky-500/20"
        >
          Nuovo progetto
        </button>

        <button
          type="button"
          onClick={saveProject}
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-500/20"
        >
          Salva progetto .baga
        </button>

        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-neutral-100 hover:border-emerald-400/40 hover:bg-emerald-400/10">
          Apri progetto .baga / .json
          <input
            type="file"
            accept=".baga,.json,application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await openProject(file);
              event.target.value = "";
            }}
          />
        </label>

        <div className="mt-2 border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">Ripristino rapido</div>

        <button
          type="button"
          onClick={() => {
            saveAutosave();
            setAutosaveLabel(new Date().toLocaleTimeString(language === "it" ? "it-IT" : "en-US"));
            setLastProjectAction(t.autosaveSavedManual);
            showUiNotice(t.autosaveSavedManual);
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-emerald-400/40 hover:bg-emerald-400/10"
        >
          Salva autosave
        </button>

        <button
          type="button"
          onClick={() => {
            const ok = restoreAutosave();
            if (!ok) {
              setLastProjectAction(t.noAutosaveAvailable);
              showUiNotice(t.noAutosaveAvailable, "error");
            }
            if (ok) {
              setLastProjectAction(t.autosaveRestored);
              showUiNotice(t.autosaveRestored);
            }
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-emerald-400/40 hover:bg-emerald-400/10"
        >
          Ripristina autosave
        </button>

        <div className="mt-2 border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">Backup tecnico</div>

        <button
          type="button"
          onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())}
          className="rounded-2xl border border-sky-400/30 bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.25)]"
        >
          Scarica backup completo
        </button>

        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10">
          Importa backup
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleBackupImport(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        {autosaveLabel ? `${t.lastAutosave}: ${autosaveLabel}` : t.autosaveReady}
      </p>
    </section>
  </>
)}

{activePanel === "produce" && (
  <>
    <section className="rounded-[22px] border border-amber-400/20 bg-amber-500/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">PRODUCI</p>
      <h2 className="mb-2 text-lg font-black text-white">Output progetto</h2>
      <p className="mb-4 text-sm leading-6 text-neutral-300">Area per generare file e documenti da consegnare o usare in produzione. Gli strumenti tecnici restano in Strumenti.</p>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-neutral-300">Totale progetto</span>
          <span className="text-2xl font-black text-sky-300">€ {displayPricing.total.toFixed(2)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="block font-black uppercase tracking-[0.14em] text-neutral-500">Pannelli</span>
            <span className="font-bold text-neutral-200">{materialPricingSummary.areaSqm.toFixed(3)} m²</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="block font-black uppercase tracking-[0.14em] text-neutral-500">Materiali €/mq</span>
            <span className="font-bold text-amber-200">€ {materialPricingSummary.materialCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-amber-400/15 bg-black/25 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">Distinta materiali / BOM V2</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-400">Distinta categorizzata con pannelli, ferramenta, accessori e dimensioni convertite in millimetri.</p>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-100">
            {bomRows.reduce((total: number, row: any) => total + Number(row.quantity || 0), 0)} pezzi
          </span>
        </div>

        {bomRows.length > 0 ? (
          <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/20">
            {bomSections.map((section: any) => (
              <div key={section.title} className="border-b border-white/10 last:border-b-0">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/80 px-3 py-2 backdrop-blur">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">{section.title}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
                    {section.rows.reduce((total: number, row: any) => total + Number(row.quantity || 0), 0)} pz
                  </span>
                </div>
                <div className="divide-y divide-white/10">
                  {section.rows.map((row: any) => (
                    <div key={row.id} className="grid grid-cols-[1fr_64px] gap-3 px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-bold text-white">{row.name}</p>
                        <p className="text-[11px] font-semibold text-neutral-400">{row.dimensionsLabel || "-"}</p>
                        {row.category === "panel" && (
                          <p className="mt-1 text-[10px] font-semibold text-neutral-500">
                            {row.materialName || "Materiale non assegnato"} · {Number(row.areaSqm || 0).toFixed(3)} m² · € {Number(row.pricePerSqm || 0).toFixed(2)}/m²
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-amber-200">{row.quantity}</p>
                        {row.category === "panel" && <p className="text-[10px] font-bold text-sky-300">€ {Number(row.materialCost || 0).toFixed(2)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
            Nessun componente runtime rilevato. Importa un modello o un Product Package per generare la distinta.
          </div>
        )}
      </div>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => downloadJson("bagastudio-preventivo.json", createBackupSnapshot())}
          className="rounded-2xl border border-sky-400/30 bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.25)]"
        >
          Scarica preventivo
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastProductPackage?.()}
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-100 hover:bg-amber-500/20"
        >
          Esporta Product Package
        </button>
        <button
          type="button"
          onClick={() => (window as any).bagastudioDownloadLastImportAsGLB?.()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-amber-400/40 hover:bg-amber-400/10"
        >
          Esporta GLB
        </button>
      </div>
    </section>
  </>
)}

{activePanel === "help" && (
  <>
    <section className="rounded-[22px] border border-violet-400/20 bg-violet-500/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">AIUTO</p>
      <h2 className="mb-2 text-lg font-black text-white">Guida rapida</h2>
      <div className="space-y-3 text-sm leading-6 text-neutral-300">
        <p><strong className="text-sky-200">CARICA</strong>: importa un modello 3D o un Product Package.</p>
        <p><strong className="text-cyan-200">CONFIGURA</strong>: scegli materiali, accessori, LED, dimensioni e visibilità.</p>
        <p><strong className="text-emerald-200">SALVA</strong>: conserva il lavoro e ripristina configurazioni o backup.</p>
        <p><strong className="text-amber-200">PRODUCI</strong>: genera preventivo, Product Package e GLB.</p>
        <p><strong className="text-neutral-100">STRUMENTI</strong>: area tecnica avanzata, non necessaria per il flusso quotidiano.</p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">Scorciatoie da tastiera</p>
        <div className="grid grid-cols-1 gap-2 text-xs text-neutral-300">
          {[
            ["Alt+S", "Salva progetto"],
            ["Alt+O", "Apri progetto"],
            ["Alt+N", "Nuovo progetto"],
            ["Esc", "Deseleziona"],
            ["Alt+F", "Focus modello"],
            ["Alt+X", "X-Ray"],
            ["1 / 2 / 3 / 4 / 5", "3D / Frontale / Sinistra / Destra / Top"],
          ].map(([shortcut, action]) => (
            <div key={shortcut} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
              <span className="font-black text-white">{shortcut}</span>
              <span className="text-right text-neutral-300">{action}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-neutral-500">Le scorciatoie Alt sono disattivate mentre scrivi in campi testo, misure, nomi progetto o input.</p>
      </div>
    </section>
  </>
)}

{activePanel === "views" && (
  <>
    <section className="rounded-[20px] border border-sky-400/15 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <h2 className="mb-3 text-lg font-semibold">{t.views}</h2>
      <div className="grid grid-cols-2 gap-2">
        {(runtimeProduct?.views?.length ? runtimeProduct.views : DEFAULT_VIEWS).map(
          (view: any) => (
            <button
              key={view.id || view.name}
              onClick={() => setActiveView(view.id || "iso")}
              className={`rounded-2xl border px-3 py-3 ${
                activeViewId === view.id
                  ? "border-amber-300 bg-sky-500 text-white"
                  : "border-neutral-700 bg-neutral-900 text-white"
              }`}
            >
              {translateViewName(view, t)}
            </button>
          )
        )}
      </div>
    </section>
  </>
)}
        </aside>

<section
  ref={viewerShellRef}
  onDragOver={(event) => {
    event.preventDefault();
    setIsImporterDragging(true);
  }}
  onDragLeave={(event) => {
    if (event.currentTarget === event.target) {
      setIsImporterDragging(false);
    }
  }}
  onDrop={(event) => {
    event.preventDefault();
    setIsImporterDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleGenericImportFile(file);
  }}
  className={`relative overflow-hidden rounded-[30px] border bg-[#050d16] p-3 shadow-[0_25px_100px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)] ${
    isImporterDragging ? "border-sky-300 ring-2 ring-sky-400/60" : "border-sky-400/15"
  }`}
>
  {isImporterDragging && (
    <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 bg-sky-500/10 text-center backdrop-blur-sm">
      <div className="rounded-3xl border border-sky-300/40 bg-[#07111c]/90 px-8 py-6 shadow-2xl">
        <p className="text-lg font-black text-white">Rilascia il file BagaStudio</p>
        <p className="mt-2 text-sm font-semibold text-sky-200">GLB, GLTF, DAE, FBX, OBJ, STL, JSON, BAGA</p>
      </div>
    </div>
  )}

  {environmentSettings.showRoom && runtimeProduct && (
    <div className="pointer-events-none absolute inset-3 z-10 overflow-hidden rounded-[24px]">
      {/* Empty Room Premium V32 - CSS shell only, no Viewer3D/import/scaling changes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.13),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_52%)]" />

      <div className="absolute left-[9%] right-[9%] top-[5%] h-[9%] rounded-t-[30px] border border-white/[0.055] bg-[#f4efe6] shadow-[inset_0_-24px_50px_rgba(0,0,0,0.08)]" />

      {environmentSettings.showBackWall && (
        <div
          className="absolute left-[9%] right-[9%] top-[14%] bottom-[31%] border-x border-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-26px_60px_rgba(0,0,0,0.10)]"
          style={environmentViewerSurfaces.wall}
        />
      )}

      {environmentSettings.showLeftWall && (
        <div
          className="absolute left-0 top-[14%] bottom-[31%] w-[9%] border-r border-white/[0.045] opacity-95 shadow-[inset_-28px_0_50px_rgba(0,0,0,0.10)]"
          style={environmentViewerSurfaces.wall}
        />
      )}

      {environmentSettings.showRightWall && (
        <div
          className="absolute right-0 top-[14%] bottom-[31%] w-[9%] border-l border-white/[0.045] opacity-95 shadow-[inset_28px_0_50px_rgba(0,0,0,0.10)]"
          style={environmentViewerSurfaces.wall}
        />
      )}

      <div className="absolute left-[9%] right-[9%] bottom-[31%] h-[12px] bg-[#f8f3e9] shadow-[0_-1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(0,0,0,0.18)]" />
      <div className="absolute left-0 top-[14%] bottom-[31%] w-[1px] bg-white/10" />
      <div className="absolute right-0 top-[14%] bottom-[31%] w-[1px] bg-black/10" />

      {[22, 38, 54, 70].map((position) => (
        <div key={`premium-spot-${position}`} className="absolute top-[8.5%] h-3 w-3 rounded-full bg-white shadow-[0_0_35px_rgba(255,255,255,0.95),0_0_75px_rgba(255,244,214,0.35)]" style={{ left: `${position}%` }}>
          <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
        </div>
      ))}

      <div
        className="absolute bottom-[-3%] left-[4%] right-[4%] h-[43%] origin-bottom rounded-t-[36px] border border-white/[0.06] opacity-95 shadow-[0_-34px_90px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.13)]"
        style={{
          ...environmentViewerSurfaces.floor,
          transform: "perspective(1200px) rotateX(72deg)",
          transformOrigin: "bottom center",
        }}
      />

      <div className="absolute bottom-[30%] left-[9%] right-[9%] h-16 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),transparent)]" />

      <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/28 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-200 backdrop-blur-md">
        Ambiente {environmentSettings.width}×{environmentSettings.depth}×{environmentSettings.height} cm
      </div>
      <div className="absolute left-5 top-[62px] w-[260px] rounded-2xl border border-cyan-400/18 bg-black/32 p-2 text-[10px] font-black uppercase tracking-[0.13em] text-neutral-200 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-neutral-400">Preview stanza</span>
          <span className="text-cyan-100">V32</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
            <div className="h-8" style={environmentViewerSurfaces.floor} />
            <div className="truncate px-2 py-1 text-[9px] text-neutral-300">Pav. {getEnvironmentMaterialLabel("floors", environmentSettings.floorMaterial)}</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
            <div className="h-8" style={environmentViewerSurfaces.wall} />
            <div className="truncate px-2 py-1 text-[9px] text-neutral-300">Pareti {getEnvironmentMaterialLabel("walls", environmentSettings.wallMaterial)}</div>
          </div>
        </div>
      </div>
    </div>
  )}

  <div className="absolute right-5 top-5 z-30 w-[230px] rounded-3xl border border-cyan-400/25 bg-[#061522]/88 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_28px_rgba(14,165,233,0.10)] backdrop-blur-2xl">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">X-Ray</p>
        <p className="text-[10px] text-neutral-400">Trasparenza modello</p>
      </div>
      <button
        type="button"
        onClick={() => setXRayEnabled((value) => !value)}
        className={`rounded-xl border px-3 py-1.5 text-xs font-black ${
          xRayEnabled
            ? "border-cyan-300 bg-cyan-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.35)]"
            : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-cyan-400/50"
        }`}
      >
        {xRayEnabled ? "ON" : "OFF"}
      </button>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0.08}
        max={0.9}
        step={0.01}
        value={xRayOpacity}
        onChange={(event) => setXRayOpacity(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
      <span className="w-10 text-right text-[11px] font-black text-cyan-100">
        {Math.round(xRayOpacity * 100)}%
      </span>
    </div>
  </div>

  <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 rounded-[22px] border border-white/10 bg-[#06111d]/94 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.48),0_0_22px_rgba(14,165,233,0.10)] backdrop-blur-2xl">
    {[
      ["3D", t.viewIso, "iso"],
      ["FR", t.viewFront, "front"],
      ["SX", t.viewLeft, "left"],
      ["DX", t.viewRight, "right"],
      ["TOP", t.viewTop, "top"],
      ["⌁", t.toolFocus, "focus"],
      ["↻", t.toolReset, "reset"],
      ["◎", t.toolScreenshot, "shot"],
      ["↗", t.toolFullscreen, "fullscreen"],
    ].map(([label, title, action]: any, index) => {
      const isViewAction = ["iso", "front", "left", "right", "top"].includes(action);
      const isActiveView = isViewAction && activeViewId === action;

      return (
        <button
          key={`${label}-${index}`}
          type="button"
          title={title}
          onClick={() => {
            if (action === "reset") {
              setActiveView("iso");
              window.dispatchEvent(new Event("bagastudio:reset-camera"));
            } else if (action === "focus") {
              window.dispatchEvent(new Event("bagastudio:focus-selection"));
            } else if (action === "shot") {
              window.dispatchEvent(new Event("bagastudio:screenshot"));
            } else if (action === "fullscreen") {
              requestViewerFullscreen();
            } else if (action) {
              setActiveView(action);
            }
          }}
          className={`flex h-10 min-w-12 items-center justify-center rounded-2xl px-2.5 text-[11px] font-black uppercase tracking-[0.08em] transition ${
            isActiveView
              ? "bg-sky-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.35)]"
              : "text-neutral-200 hover:bg-sky-500/20 hover:text-white"
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>

  {runtimeProduct ? (
    <div className="relative z-20 h-full overflow-hidden rounded-2xl">
      {environmentSettings.showRoom && (
        <div className="pointer-events-none absolute bottom-[18%] left-1/2 z-0 h-32 w-[55%] -translate-x-1/2 rounded-full bg-black/25 blur-[60px]" />
      )}
      <Viewer3D
        width={dimensions?.width}
        height={dimensions?.height}
        depth={dimensions?.depth}
        materials={materials}
        accessories={accessories}
        inserts={inserts}
        insertMaterials={insertMaterials}
        insertSizes={insertSizes}
        visibility={visibility}
        ledKelvin={ledKelvin}
        ledIntensity={ledIntensity}
        activeViewId={activeViewId}
        productModel={getModelUrl(runtimeProduct)}
        productModelFormat={getModelFormat(runtimeProduct)}
        productMaterials={MATERIAL_LIBRARY}
        productParts={runtimeProduct.parts}
        views={runtimeProduct.views?.length ? runtimeProduct.views : DEFAULT_VIEWS}
        woodDirection={woodDirection}
        xRayEnabled={xRayEnabled}
        xRayOpacity={xRayOpacity}
        environment={environmentSettings.showRoom ? {
          roomWidthCm: environmentSettings.width,
          roomDepthCm: environmentSettings.depth,
          roomHeightCm: environmentSettings.height,
          floorMaterial: environmentSettings.floorMaterial,
          wallMaterial: environmentSettings.wallMaterial,
          showBackWall: environmentSettings.showBackWall,
          showLeftWall: environmentSettings.showLeftWall,
          showRightWall: environmentSettings.showRightWall,
        } : undefined}
      />
    </div>
  ) : (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl border border-sky-400/10 bg-[#050d16] p-0">
      {environmentSettings.showRoom ? (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl bg-[#0a1119]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(180deg,rgba(2,6,12,0.10),rgba(2,6,12,0.38))]" />

          <div className="absolute left-[4%] right-[4%] top-[4%] bottom-[4%] overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#d8cab9] shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_28px_90px_rgba(0,0,0,0.50)]">
            <div className="absolute inset-x-0 top-0 h-[23%] bg-[linear-gradient(180deg,#cdbba8_0%,#d9c8b5_76%,#bca995_100%)] shadow-[inset_0_-20px_45px_rgba(72,52,36,0.12)]" />
            <div className="absolute left-[3%] right-[3%] top-[21.5%] h-[2px] bg-white/34 shadow-[0_2px_7px_rgba(60,45,35,0.22)]" />
            <div className="absolute left-[6%] right-[6%] top-[24%] h-[3px] bg-[#c5b39f]/70 shadow-[0_8px_22px_rgba(62,46,35,0.18)]" />

            <div className="absolute left-[6%] top-[9%] h-5 w-5 rounded-full bg-white shadow-[0_0_18px_7px_rgba(255,244,218,0.54),0_58px_76px_20px_rgba(255,236,198,0.24)]" />
            <div className="absolute left-1/2 top-[8.5%] h-5 w-5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_7px_rgba(255,244,218,0.54),0_58px_76px_24px_rgba(255,236,198,0.25)]" />
            <div className="absolute right-[6%] top-[9%] h-5 w-5 rounded-full bg-white shadow-[0_0_18px_7px_rgba(255,244,218,0.54),0_58px_76px_20px_rgba(255,236,198,0.24)]" />

            <div className="absolute left-0 top-[22%] bottom-[18%] w-[16%] bg-[linear-gradient(90deg,#bca894_0%,#d9cabb_72%,#e4d7c8_100%)] shadow-[inset_-22px_0_45px_rgba(74,54,40,0.16)]" />
            <div className="absolute right-0 top-[22%] bottom-[18%] w-[16%] bg-[linear-gradient(270deg,#bca894_0%,#d9cabb_72%,#e4d7c8_100%)] shadow-[inset_22px_0_45px_rgba(74,54,40,0.16)]" />
            <div className="absolute left-[15.7%] top-[22%] bottom-[18%] w-[1px] bg-white/36" />
            <div className="absolute right-[15.7%] top-[22%] bottom-[18%] w-[1px] bg-white/36" />
            <div className="absolute left-[16%] right-[16%] top-[22%] bottom-[18%] bg-[radial-gradient(circle_at_50%_24%,rgba(255,248,235,0.50),transparent_17%),radial-gradient(circle_at_23%_22%,rgba(255,245,225,0.36),transparent_15%),radial-gradient(circle_at_77%_22%,rgba(255,245,225,0.36),transparent_15%),linear-gradient(180deg,#d7c8b7_0%,#cdbda9_100%)]" />
            <div className="absolute left-[16%] right-[16%] top-[22%] bottom-[18%] opacity-[0.17] bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.42)_0_1px,transparent_1px_34px),repeating-linear-gradient(0deg,rgba(75,57,42,0.18)_0_1px,transparent_1px_46px)]" />

            <div className="absolute left-[3%] right-[3%] bottom-[18%] h-[10px] bg-[#eee5da] shadow-[0_-1px_0_rgba(255,255,255,0.65),0_-8px_16px_rgba(90,65,45,0.12)]" />
            <div className="absolute left-[3%] right-[3%] bottom-[16.9%] h-[7px] bg-[#cdbca8] shadow-[0_4px_12px_rgba(0,0,0,0.18)]" />
            <div className="absolute left-[16%] right-[16%] bottom-[18%] h-[1px] bg-white/50" />

            <div className="absolute left-0 right-0 bottom-0 h-[18%] bg-[linear-gradient(180deg,rgba(62,40,22,0.08),rgba(18,10,5,0.18)),repeating-linear-gradient(90deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_74px),repeating-linear-gradient(0deg,#a97543_0_13px,#b57e4b_13px_26px,#9f6738_26px_39px)] shadow-[inset_0_24px_45px_rgba(255,242,218,0.10)]" />
            <div className="absolute left-0 right-0 bottom-0 h-[18%] opacity-[0.30] bg-[radial-gradient(circle_at_14%_42%,rgba(55,33,17,0.20),transparent_0_38px),radial-gradient(circle_at_48%_58%,rgba(255,234,196,0.13),transparent_0_44px),radial-gradient(circle_at_82%_36%,rgba(50,30,16,0.16),transparent_0_36px)]" />
            <div className="absolute left-0 right-0 bottom-[18%] h-[1px] bg-white/34" />
          </div>

          <div className="absolute left-5 top-5 z-20 rounded-2xl border border-white/10 bg-black/58 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-100 shadow-[0_14px_40px_rgba(0,0,0,0.36)] backdrop-blur-md">
            Ambiente vuoto {environmentSettings.width}×{environmentSettings.depth}×{environmentSettings.height} cm
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.10),transparent_38%),#050d16]" />
      )}

      <label className="group relative z-20 flex w-[min(520px,calc(100%-80px))] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-sky-300/20 bg-[#07111c]/92 px-8 py-8 text-center shadow-[0_26px_82px_rgba(0,0,0,0.54),0_0_46px_rgba(14,165,233,0.10),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-300/55 hover:bg-[#081827]/96">
        <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border border-sky-300/22 bg-sky-400/8 text-5xl text-sky-300 shadow-[0_0_34px_rgba(14,165,233,0.22)] transition group-hover:scale-[1.03] group-hover:text-sky-200">
          ☁
        </span>
        <span className="text-lg font-black text-white">Importa file BagaStudio</span>
        <span className="mt-3 text-sm font-medium text-neutral-300">Modelli 3D, Product Package JSON o progetto .baga.</span>
        <span className="mt-7 rounded-2xl border border-sky-300/30 bg-sky-500 px-7 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.34)] transition group-hover:bg-sky-400">
          Seleziona file
        </span>
        <input
          type="file"
          accept={SUPPORTED_GENERIC_IMPORT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleGenericImportFile(file);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  )}
</section>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[24px] border border-sky-400/15 bg-[#07111c]/92 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_70px_rgba(0,0,0,0.28)]">
          {/* bagastudio-sidebar-components-right-final-v1 */}
          <ComponentExplorer
            components={viewerRuntimeComponents}
            selectedPartId={selectedPartId}
            selectedPartIds={selectedPartIds}
            rowRefs={componentRowRefs}
            onClear={() => {
              setSelectedPart(null);
              setSelectedPartIds([]);
              window.dispatchEvent(new CustomEvent("bagastudio:viewer-component-cleared"));
            }}
            onSelectComponent={(component: any, componentId: string, wantsMultiSelect: boolean) => {
              if (!componentId) return;

              setSelectedPartIds((current) => {
                if (!wantsMultiSelect) return [componentId];
                return current.includes(componentId)
                  ? current.filter((id) => id !== componentId)
                  : [...current, componentId];
              });
              setSelectedPart(componentId);
              window.dispatchEvent(
                new CustomEvent("bagastudio:viewer-select-component", {
                  detail: {
                    ...component,
                    partId: componentId,
                    multiSelect: wantsMultiSelect,
                  },
                })
              );
            }}
          />

          {effectiveSelectedPartIds.length > 0 && (
            <section className="shrink-0 rounded-[22px] border border-sky-400/25 bg-sky-500/[0.08] p-3 shadow-[0_0_30px_rgba(14,165,233,0.08)]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">
                    {hasMultiSelection ? "Selezione multipla" : "Selezione attiva"}
                  </h2>
                  <p className="text-xs font-semibold text-white">
                    {effectiveSelectedPartIds.length} {effectiveSelectedPartIds.length === 1 ? "pezzo selezionato" : "pezzi selezionati"}
                  </p>
                </div>
                {hasMultiSelection && (
                  <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100">
                    gruppo
                  </span>
                )}
              </div>

              <div className="max-h-[180px] space-y-1.5 overflow-auto pr-1">
                {(selectedRuntimeComponents.length
                  ? selectedRuntimeComponents
                  : effectiveSelectedPartIds.map((id) => ({ id, partId: id, displayName: id }))
                ).map((component: any, index: number) => {
                  const componentId = String(component?.id || component?.partId || component?.meshName || effectiveSelectedPartIds[index] || "");
                  const isActive = componentId === selectedPartId || component?.partId === selectedPartId || component?.meshName === selectedPartId;
                  return (
                    <div
                      key={`selected-${componentId}-${index}`}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        isActive
                          ? "border-amber-300/40 bg-amber-300/10 text-white"
                          : "border-white/10 bg-black/20 text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">
                          {component?.displayName || component?.name || component?.meshName || componentId}
                        </span>
                        {isActive && <span className="text-[10px] text-amber-200">attivo</span>}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-neutral-400">
                        {component?.partId || component?.id || componentId}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMultiSelection && (
                <p className="mt-2 text-[11px] leading-snug text-sky-100/80">
                  Materiale, venatura e azioni condivise vengono applicate al gruppo selezionato.
                </p>
              )}
            </section>
          )}

          <section className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-white">{t.objectProperties}</h2>
              <span className="text-neutral-400">⌃</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.name}</span><span className="text-right text-white">{selectedPart ? translatePartName(selectedPart, t) : selectedPartId || t.noPart}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">partId</span><span className="break-all text-right text-white">{selectedPart?.partId || selectedPart?.id || selectedPartId || "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">Categoria</span><span className="text-right text-white">{selectedPart?.category || selectedPart?.runtimeMetadata?.detectedCategory || "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.product}</span><span className="text-right text-white">{viewerRuntimeProduct?.schema ? "Runtime importato" : runtimeProduct?.name || "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.dimensions}</span><span className="text-right text-white">{selectedPartDimensionLabel}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.view}</span><span className="text-right text-white">{translateViewName({ id: activeViewId }, t)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.led}</span><span className="text-right text-white">{selectedStoreKey && isAccessoryActive(accessories, selectedStoreKey, "led") ? `${ledKelvin?.[selectedStoreKey] ?? 4500}K` : t.off}</span></div>
            </div>
          </section>

          <div className="mt-auto space-y-3">
            <section className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-wide text-white">{t.projectSummary}</h2>
                <span className="text-neutral-400">⌃</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-sky-400">⌂ {runtimeProduct?.name || t.product}</span>
                  <span>€ {Number(runtimeProduct?.pricing?.basePrice ?? displayPricing.total ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-neutral-300">
                  <span>✦ {t.accessories}</span>
                  <span>{t.included}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-neutral-300">
                  <span>◉ {t.materials}</span>
                  <span>€ {materialPricingSummary.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-neutral-300">
                  <span>▤ {t.backup}</span>
                  <span>{autosaveLabel ? `${t.autosave} ${autosaveLabel}` : t.ready}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-neutral-300">
                  <span>▱ Ambiente</span>
                  <span>{environmentSettings.showRoom ? `${environmentSettings.width}×${environmentSettings.depth}×${environmentSettings.height} cm` : "OFF"}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-white">{t.projectTotal}</p>
                    <p className="text-xs text-neutral-400">{t.vatIncluded}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-sky-400">€ {displayPricing.total.toFixed(2)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">Materiali €/mq € {materialPricingSummary.materialCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>

            <button onClick={() => downloadJson("bagastudio-preventivo.json", createBackupSnapshot())} className="w-full rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.35)] hover:bg-sky-400">
              {t.addToQuote}
            </button>
          </div>
        </aside>
    </div>
  </div>
  {isLogoModalOpen && (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 p-6 backdrop-blur-xl"
      onClick={() => setIsLogoModalOpen(false)}
    >
      <div
        className="relative w-full max-w-5xl rounded-[2rem] border border-sky-400/25 bg-[#07111c]/95 p-5 shadow-[0_0_80px_rgba(14,165,233,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsLogoModalOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-xl text-white transition hover:border-sky-400/40 hover:bg-sky-500/20"
          aria-label={t.closeLogo}
        >
          ×
        </button>

        <img
          src="/bagastudio-core-brand.png"
          alt={t.enlargedLogoAlt}
          className="mx-auto max-h-[82vh] w-full rounded-[1.5rem] object-contain"
        />
      </div>
    </div>
  )}

</main>
);
}
