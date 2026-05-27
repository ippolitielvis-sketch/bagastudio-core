"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Viewer3D from "@/components/Viewer3D";
import { useConfigStore } from "@/core/state/config.state";
import { demoProduct2 } from "@/core/products/demo-product-2";
import { MATERIAL_LIBRARY } from "@/core/data/materials";
import { getDefaultInsertConfig } from "@/core/engines/insertEngine";
import { calculatePricing } from "@/core/engines/pricing.engine";
import { accessoriesCatalog } from "@/core/catalogs/accessories.catalog";

type AnyProduct = any;

const DEFAULT_MATERIALS = MATERIAL_LIBRARY;

const DEFAULT_VIEWS = [
  {
    id: "front",
    name: "Frontale",
    camera: { position: [0, 5, 22], target: [0, 2, 0] },
  },
  {
    id: "back",
    name: "Retro",
    camera: { position: [0, 5, -22], target: [0, 2, 0] },
  },
  {
    id: "left",
    name: "Sinistra",
    camera: { position: [-22, 5, 0], target: [0, 2, 0] },
  },
  {
    id: "right",
    name: "Destra",
    camera: { position: [22, 5, 0], target: [0, 2, 0] },
  },
  {
    id: "top",
    name: "Alto",
    camera: { position: [0, 28, 0.01], target: [0, 0, 0] },
  },
  {
    id: "iso",
    name: "3D",
    camera: { position: [20, 10, 22], target: [0, 2, 0] },
  },
];


const DICTIONARY = {
  it: {
    language: "Lingua",
    italian: "Italiano",
    english: "Inglese",
    totalPrice: "Prezzo totale",
    vatIncluded: "IVA inclusa",
    configurator: "CONFIGURATORE 3D",
    realisticRender: "RENDER REALISTICI",
    ar: "REALTÀ AUMENTATA",
    quotes: "PREVENTIVI ISTANTANEI",
    project: "PROGETTO",
    materials: "MATERIALI",
    accessories: "ACCESSORI",
    views: "VISTE",
    studioTools: "STUDIO TOOLS",
    save: "Salva",
    export: "Esporta",
    quote: "Preventivo",
    addToQuote: "Aggiungi al preventivo",
    adminPanel: "Admin Panel",
    adminPanelDescription: "Importer modelli, mapping componenti, catalogo prodotti, materiali, accessori e strumenti avanzati.",
    importProductJson: "Importa prodotto JSON",
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
    importProductFromSidebar: "Importa un JSON prodotto dalla sidebar.",
    projectSummary: "Riepilogo progetto",
    product: "Prodotto",
    included: "Inclusi",
    configured: "Configurati",
    ready: "Pronto",
    projectTotal: "Totale progetto",
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
    configurator: "3D CONFIGURATOR",
    realisticRender: "REALISTIC RENDERS",
    ar: "AUGMENTED REALITY",
    quotes: "INSTANT QUOTES",
    project: "PROJECT",
    materials: "MATERIALS",
    accessories: "ACCESSORIES",
    views: "VIEWS",
    studioTools: "STUDIO TOOLS",
    save: "Save",
    export: "Export",
    quote: "Quote",
    addToQuote: "Add to quote",
    adminPanel: "Admin Panel",
    adminPanelDescription: "Model importer, component mapping, product catalog, materials, accessories and advanced tools.",
    importProductJson: "Import product JSON",
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
    projectSummary: "Project summary",
    product: "Product",
    included: "Included",
    configured: "Configured",
    ready: "Ready",
    projectTotal: "Project total",
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
    product.assets?.convertedModelUrl ||
    product.assets?.modelUrl ||
    product.assets?.originalFileUrl ||
    "/models/demo-product-2.glb"
  );
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
const [autosaveLabel, setAutosaveLabel] = useState("");
const [activePanel, setActivePanel] = useState<
  "config" | "materials" | "accessories" | "views" | "admin"
>("config");
const [activeViewerTool, setActiveViewerTool] = useState<"select" | "pan" | "orbit" | null>("select");
const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
const [language, setLanguage] = useState<"it" | "en">(() => getInitialLanguage());
const t = DICTIONARY[language];
const viewerShellRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  window.localStorage.setItem("bagastudio-language", language);
}, [language]);

function goNextView() {
  const views = runtimeProduct?.views?.length ? runtimeProduct.views : DEFAULT_VIEWS;
  const currentIndex = views.findIndex((view: any) => view.id === activeViewId);
  const nextView = views[(currentIndex + 1 + views.length) % views.length];
  setActiveView(nextView?.id || "iso");
}

function requestViewerFullscreen() {
  viewerShellRef.current?.requestFullscreen?.();
}
 const runtimeProduct = useMemo(() => {
  return product ? normalizeProduct(product) : normalizeProduct(demoProduct2);
}, [product]);

const displayPricing = useMemo(() => {
 return calculatePricing(runtimeProduct);
}, [
  runtimeProduct,
  dimensions,
  accessories,
  inserts,
  insertSizes,
  insertMaterials,
]);

  const selectedPart = useMemo(() => {
    if (!runtimeProduct || !selectedPartId) return null;
    return (
      runtimeProduct.parts.find((part: any) => part.id === selectedPartId) ||
      runtimeProduct.parts.find((part: any) => part.meshName === selectedPartId) ||
      runtimeProduct.parts.find((part: any) => part.name === selectedPartId) ||
      null
    );
  }, [runtimeProduct, selectedPartId]);

  const selectedStoreKey = selectedPart?.id || selectedPartId || "";

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

  async function handleProductJsonImport(file: File) {
    try {
      const text = await file.text();
      const rawProduct = JSON.parse(text);
      const nextProduct = normalizeProduct(rawProduct);

      setRuntimeProduct(nextProduct);

      setDimension("width", nextProduct.dimensions?.width?.default ?? 180);
      setDimension("height", nextProduct.dimensions?.height?.default ?? 100);
      setDimension("depth", nextProduct.dimensions?.depth?.default ?? 60);

      nextProduct.parts.forEach((part: any) => {
        setVisibility(part.id, part.visible !== false);
        if (part.meshName) setVisibility(part.meshName, part.visible !== false);
      });

      setActiveView(nextProduct.views?.[0]?.id || "iso");
      setSelectedPart(null);
      setImportName(file.name);
      alert(t.productImported);
    } catch (error) {
      console.error("BagaStudio product import error", error);
      alert(t.invalidProductJson);
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

      alert(t.backupImported);
    } catch (error) {
      console.error("BagaStudio backup import error", error);
      alert(t.invalidBackupJson);
    }
  }

  return (
   <main className="min-h-screen bg-[#07090f] text-white">
  <div className="flex h-screen flex-col">
   <header className="sticky top-0 z-50 border-b border-sky-500/20 bg-[#07111c]/95 px-4 py-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
      <div className="rounded-2xl border border-sky-400/20 bg-[#07111c] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-[390px] items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              title={t.openLogo}
              className="group rounded-2xl border border-transparent p-1 transition hover:border-sky-400/30 hover:bg-sky-400/5"
            >
              <img
                src="/bagastudio-core-brand.png"
                alt="BagaStudio Core"
                className="h-28 w-auto shrink-0 object-contain drop-shadow-[0_0_22px_rgba(14,165,233,0.35)] transition group-hover:scale-[1.02]"
              />
            </button>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-0 xl:flex">
            {[
              ["⬡", t.configurator],
              ["◉", t.realisticRender],
              ["AR", t.ar],
              ["▤", t.quotes],
            ].map((item, index) => (
              <div
                key={item[1]}
                className={`flex min-w-[150px] flex-col items-center justify-center gap-2 border-white/10 px-6 ${
                  index > 0 ? "border-l" : ""
                }`}
              >
                <div className="text-3xl font-black text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.35)]">
                  {item[0]}
                </div>
                <div className="text-center text-[11px] font-bold tracking-wide text-neutral-200">
                  {item[1]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-sky-400/20 bg-[#0b1826] px-6 py-4 shadow-[0_0_24px_rgba(14,165,233,0.08)]">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">{t.totalPrice}</p>
              <p className="mt-1 text-3xl font-black text-sky-400">
                € {displayPricing.total.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-400">{t.vatIncluded}</p>
            </div>

           <div
  onClick={() => window.location.href = "/admin-panel"}
  className="cursor-pointer rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-black/40 p-5 shadow-[0_0_30px_rgba(14,165,233,0.08)] transition hover:border-sky-400/40 hover:shadow-[0_0_35px_rgba(14,165,233,0.18)]"
>
  <div className="text-[10px] font-bold tracking-[0.35em] text-sky-400">
    BAGASTUDIO CORE
  </div>

  <h3 className="mt-3 flex items-center gap-2 text-xl font-black text-white">
    ⚙ {t.adminPanel}
  </h3>

  <p className="mt-2 text-xs leading-5 text-neutral-300">
    {t.adminPanelDescription}
  </p>
</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">{t.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "it" | "en")}
              className="rounded-xl border border-sky-500/30 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none"
            >
              <option className="bg-slate-950 text-white" value="it">
                {t.italian}
              </option>
              <option className="bg-slate-950 text-white" value="en">
                {t.english}
              </option>
            </select>
          </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {[
              ["config", "⌂", t.project],
              ["materials", "▧", t.materials],
              ["accessories", "✦", t.accessories],
              ["views", "◱", t.views],
              ["admin", "⚙", t.studioTools],
            ].map((tab: any) => (
              <button
                key={tab[0]}
                onClick={() => setActivePanel(tab[0])}
                className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                  activePanel === tab[0]
                    ? "bg-sky-500 text-white shadow-[0_0_22px_rgba(14,165,233,0.35)]"
                    : "bg-white/[0.03] text-neutral-300 hover:bg-white/[0.07]"
                }`}
              >
                <span className="mr-2">{tab[1]}</span>{tab[2]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => saveAutosave()} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-neutral-200 hover:bg-white/[0.08]">
              {t.save}
            </button>
            <button onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-neutral-200 hover:bg-white/[0.08]">
              {t.export}
            </button>
            <button onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())} className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.35)] hover:bg-sky-400">
              {t.quote}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_330px] gap-3 bg-[#07111c] p-3">
  <aside className="overflow-y-auto rounded-2xl border border-sky-400/15 bg-[#07111c] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
{activePanel === "config" && (
  <>
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-semibold text-white">{t.importProductJson}</h2>
      <input
        type="file"
        accept=".json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleProductJsonImport(file);
        }}
        className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-2xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-black"
      />
      {importName && (
        <p className="mt-2 text-xs text-neutral-400">{importName}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const ok = restoreAutosave();
            if (!ok) alert(t.noAutosaveAvailable);
            if (ok) alert(t.autosaveRestored);
          }}
          className="rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        >
          {t.restoreAutosave}
        </button>

        <label className="cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm">
          {t.importBackup}
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleBackupImport(file);
            }}
          />
        </label>
      </div>
    </section>

    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-semibold text-white">{t.selectedPart}</h2>
      <p className="text-sm text-neutral-300">
        {selectedPart ? translatePartName(selectedPart, t) : selectedPartId || t.noSelectedPart}
      </p>
    </section>

    {runtimeProduct && (
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
        <h2 className="mb-4 text-xl font-semibold">{t.dimensions}</h2>

        {(["width", "height", "depth"] as const).map((key) => {
          const dim = runtimeProduct.dimensions?.[key];
          if (!dim) return null;

          return (
            <div key={key} className="mb-4">
              <label className="block text-sm capitalize">{translateDimensionName(key, t)}</label>
              <input
                type="range"
                min={dim.min}
                max={dim.max}
                step={dim.step || 1}
                value={Number(dimensions?.[key] ?? dim.default)}
                onChange={(event) =>
                  setDimension(key, Number(event.target.value))
                }
                className="w-full"
              />
              <p className="text-sm font-semibold">
                {Number(dimensions?.[key] ?? dim.default)} cm
              </p>
              <p className="text-xs text-neutral-500">{t.max}: {dim.max} cm</p>
            </div>
          );
        })}
      </section>
    )}

    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">{t.visibility}</h2>
      <p className="mb-3 text-sm text-neutral-400">
        {selectedPart ? translatePartName(selectedPart, t) : selectedPartId || "-"}
      </p>

      {selectedStoreKey && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={visibility?.[selectedStoreKey] !== false}
            onChange={(event) => {
              setVisibility(selectedStoreKey, event.target.checked);
              if (selectedPart?.meshName) {
                setVisibility(selectedPart.meshName, event.target.checked);
              }
            }}
          />
          {t.showComponent}
        </label>
      )}
    </section>
  </>
)}


{activePanel === "admin" && (
  <>
    <section className="rounded-3xl border border-sky-400/25 bg-[#081827] p-5 shadow-[0_0_26px_rgba(14,165,233,0.10)]">
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.35em] text-sky-400">
        BagaStudio Core
      </p>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">{t.importProductJson}</h2>
      <input
        type="file"
        accept=".json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleProductJsonImport(file);
        }}
        className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-2xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:font-bold file:text-white"
      />
      {importName && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-neutral-300">
          {t.loadedFile}: {importName}
        </p>
      )}
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">{t.backupAutosave}</h2>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => {
            saveAutosave();
            setAutosaveLabel(new Date().toLocaleTimeString(language === "it" ? "it-IT" : "en-US"));
            alert(t.autosaveSavedManual);
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.saveAutosave}
        </button>

        <button
          type="button"
          onClick={() => {
            const ok = restoreAutosave();
            if (!ok) alert(t.noAutosaveAvailable);
            if (ok) alert(t.autosaveRestored);
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.restoreAutosave}
        </button>

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
                alert(t.configurationImported);
              } catch (error) {
                console.error("BagaStudio configuration import error", error);
                alert(t.invalidConfigurationJson);
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
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">{t.accessories}</h2>
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
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">{t.materials}</h2>
      <p className="mb-3 text-sm text-neutral-400">
        {selectedPart ? translatePartName(selectedPart, t) : selectedPartId || "-"}
      </p>

      <select
        disabled={!selectedStoreKey}
        value={selectedStoreKey ? materials?.[selectedStoreKey] || "" : ""}
        onChange={(event) => {
          if (!selectedStoreKey) return;
          setMaterial(selectedStoreKey, event.target.value);
          if (selectedPart?.meshName) {
            setMaterial(selectedPart.meshName, event.target.value);
          }
        }}
        className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-3 text-white"
      >
        <option value="">{t.selectMaterial}</option>
        {filteredMaterials.map((material: any) => (
          <option key={material.id} value={material.id}>
            {translateMaterialName(material, t)}
          </option>
        ))}
      </select>

      {selectedStoreKey && (
        <div className="mt-3">
          <label className="mb-2 block text-sm text-neutral-300">
            {t.woodDirection}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setWoodDirection(selectedPart?.id || selectedStoreKey, "x")
              }
              className={`rounded-2xl border px-3 py-2 text-sm ${
                (woodDirection?.[selectedPart?.id || selectedStoreKey] || "x") === "x"
                  ? "border-amber-300 bg-sky-500 text-white"
                  : "border-neutral-700 bg-neutral-900 text-white"
              }`}
            >
              {t.horizontal}
            </button>

            <button
              type="button"
              onClick={() =>
                setWoodDirection(selectedPart?.id || selectedStoreKey, "z")
              }
              className={`rounded-2xl border px-3 py-2 text-sm ${
                woodDirection?.[selectedPart?.id || selectedStoreKey] === "z"
                  ? "border-amber-300 bg-sky-500 text-white"
                  : "border-neutral-700 bg-neutral-900 text-white"
              }`}
            >
              {t.vertical}
            </button>
          </div>
        </div>
      )}
    </section>
  </>
)}

{activePanel === "views" && (
  <>
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">{t.views}</h2>
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

    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">{t.runtimeJson}</h2>
      <button
        onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())}
        className="mb-2 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
      >
        {t.exportConfiguration}
      </button>
      <label className="mb-2 block w-full cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm text-white">
        {t.importConfiguration}
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
              const text = await file.text();
              const data = JSON.parse(text);

              importConfiguration(data);
              alert(t.configurationImported);
            } catch (error) {
              console.error("BagaStudio configuration import error", error);
              alert(t.invalidConfigurationJson);
            }

            event.target.value = "";
          }}
        />
      </label>
      <button
        onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())}
        className="w-full rounded-2xl bg-sky-500 px-3 py-2 text-sm text-black"
      >
        {t.downloadFullBackup}
      </button>
    </section>
  </>
)}
        </aside>

<section
  ref={viewerShellRef}
  className="relative overflow-hidden rounded-2xl border border-sky-400/15 bg-[#0b111b] p-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
>
  <div className="absolute left-1/2 top-5 z-10 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-[#07111c]/90 p-1 shadow-2xl backdrop-blur-xl">
    {[
      ["↖", t.toolSelect, "select"],
["✥", t.toolPan, "pan"],
["↻", t.toolReset, "reset"],
["□", t.toolOrbit, "orbit"],
["⌁", t.toolFocus, "focus"],
["↕", t.toolTop, "top"],
["◎", t.toolScreenshot, "shot"],
["↗", t.toolFullscreen, "fullscreen"],
    ].map(([icon, title, action]: any, index) => (
      <button
        key={`${icon}-${index}`}
        type="button"
        title={title}
        onClick={() => {
          if (action === "select") {
            setActiveViewerTool("select");
            window.dispatchEvent(new Event("bagastudio:tool-select"));
          } else if (action === "pan") {
            setActiveViewerTool("pan");
            window.dispatchEvent(new Event("bagastudio:tool-pan"));
          } else if (action === "orbit") {
            setActiveViewerTool("orbit");
            window.dispatchEvent(new Event("bagastudio:tool-orbit"));
            setActiveView("iso");
          } else if (action === "reset") {
            window.dispatchEvent(new Event("bagastudio:reset-camera"));
          } else if (action === "focus") {
            window.dispatchEvent(new Event("bagastudio:focus-selection"));
          } else if (action === "shot") {
            window.dispatchEvent(new Event("bagastudio:screenshot"));
          } else if (action === "fullscreen") {
            requestViewerFullscreen();
          } else if (action === "next") {
            goNextView();
          } else if (action) {
            setActiveView(action);
          }
        }}
        className={`flex h-10 w-11 items-center justify-center rounded-lg text-lg transition ${
          activeViewerTool === action
            ? "bg-sky-500 text-white"
            : "text-neutral-200 hover:bg-sky-500/20"
        }`}
      >
        {icon}
      </button>
    ))}
  </div>

  {runtimeProduct ? (
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
      productMaterials={MATERIAL_LIBRARY}
      productParts={runtimeProduct.parts}
      views={runtimeProduct.views?.length ? runtimeProduct.views : DEFAULT_VIEWS}
      woodDirection={woodDirection}
    />
  ) : (
    <div className="flex h-full items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-400">
      {t.importProductFromSidebar}
    </div>
  )}
</section>

        <aside className="overflow-y-auto rounded-2xl border border-sky-400/15 bg-[#07111c] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <section className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
                <span>{t.configured}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>▤ {t.backup}</span>
                <span>{autosaveLabel ? `${t.autosave} ${autosaveLabel}` : t.ready}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">{t.projectTotal}</p>
                  <p className="text-xs text-neutral-400">{t.vatIncluded}</p>
                </div>
                <p className="text-3xl font-black text-sky-400">€ {displayPricing.total.toFixed(2)}</p>
              </div>
            </div>
          </section>

          <section className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-white">{t.objectProperties}</h2>
              <span className="text-neutral-400">⌃</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.name}</span><span className="text-right text-white">{selectedPart ? translatePartName(selectedPart, t) : selectedPartId || t.noPart}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.product}</span><span className="text-right text-white">{runtimeProduct?.name || "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.dimensions}</span><span className="text-right text-white">{Number(dimensions?.width ?? runtimeProduct?.dimensions?.width?.default ?? 0)} × {Number(dimensions?.depth ?? runtimeProduct?.dimensions?.depth?.default ?? 0)} × {Number(dimensions?.height ?? runtimeProduct?.dimensions?.height?.default ?? 0)} cm</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.view}</span><span className="text-right text-white">{translateViewName({ id: activeViewId }, t)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">{t.led}</span><span className="text-right text-white">{selectedStoreKey && isAccessoryActive(accessories, selectedStoreKey, "led") ? `${ledKelvin?.[selectedStoreKey] || 4000}K` : t.off}</span></div>
            </div>
          </section>

          <button onClick={() => downloadJson("bagastudio-preventivo.json", createBackupSnapshot())} className="w-full rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.35)] hover:bg-sky-400">
            {t.addToQuote}
          </button>
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
