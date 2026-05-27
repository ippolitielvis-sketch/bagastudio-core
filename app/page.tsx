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
const viewerShellRef = useRef<HTMLElement | null>(null);

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
    if (!runtimeProduct) return;

    const timer = window.setTimeout(() => {
      saveAutosave();
      setAutosaveLabel(new Date().toLocaleTimeString());
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
    saveAutosave,
  ]);

  async function handleProductJsonImport(file: File) {
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
  }

  async function handleBackupImport(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.product || data.runtimeProduct) {
      const nextProduct = normalizeProduct(data.runtimeProduct || data.product);
      setRuntimeProduct(nextProduct);
    }

    if (data.configuration) {
      importConfiguration(data.configuration);
    }
  }

  return (
   <main className="min-h-screen bg-[#07090f] text-white">
  <div className="flex h-screen flex-col">
   <header className="sticky top-0 z-50 border-b border-sky-500/20 bg-[#07111c]/95 px-4 py-4 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
      <div className="rounded-2xl border border-sky-400/20 bg-[#07111c] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-[390px] items-center gap-4">
            <img
              src="/bagastudio-core-brand.png"
              alt="BagaStudio Core"
              className="h-28 w-auto shrink-0 object-contain drop-shadow-[0_0_22px_rgba(14,165,233,0.35)]"
            />
          </div>

          <div className="hidden flex-1 items-center justify-center gap-0 xl:flex">
            {[
              ["⬡", "CONFIGURATORE 3D"],
              ["◉", "RENDER REALISTICI"],
              ["AR", "REALTÀ AUMENTATA"],
              ["▤", "PREVENTIVI ISTANTANEI"],
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
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">Prezzo totale</p>
              <p className="mt-1 text-3xl font-black text-sky-400">
                € {displayPricing.total.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-400">IVA inclusa</p>
            </div>

           <div
  onClick={() => window.location.href = "/admin-panel"}
  className="cursor-pointer rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-black/40 p-5 shadow-[0_0_30px_rgba(14,165,233,0.08)] transition hover:border-sky-400/40 hover:shadow-[0_0_35px_rgba(14,165,233,0.18)]"
>
  <div className="text-[10px] font-bold tracking-[0.35em] text-sky-400">
    BAGASTUDIO CORE
  </div>

  <h3 className="mt-3 flex items-center gap-2 text-xl font-black text-white">
    ⚙ Admin Panel
  </h3>

  <p className="mt-2 text-xs leading-5 text-neutral-300">
    Importer modelli, mapping componenti, catalogo prodotti,
    materiali, accessori e strumenti avanzati.
  </p>
</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {[
              ["config", "⌂", "PROGETTO"],
              ["materials", "▧", "MATERIALI"],
              ["accessories", "✦", "ACCESSORI"],
              ["views", "◱", "VISTE"],
              ["admin", "⚙", "STUDIO TOOLS"],
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
              Salva
            </button>
            <button onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-neutral-200 hover:bg-white/[0.08]">
              Esporta
            </button>
            <button onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())} className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.35)] hover:bg-sky-400">
              Preventivo
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
      <h2 className="mb-4 text-lg font-semibold text-white">Importa prodotto JSON</h2>
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
            if (!ok) alert("Nessun autosave disponibile.");
          }}
          className="rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        >
          Ripristina autosave
        </button>

        <label className="cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm">
          Importa backup
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
      <h2 className="mb-4 text-lg font-semibold text-white">Pezzo selezionato</h2>
      <p className="text-sm text-neutral-300">
        {selectedPart?.name || selectedPartId || "Nessun pezzo selezionato"}
      </p>
    </section>

    {runtimeProduct && (
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
        <h2 className="mb-4 text-xl font-semibold">Dimensioni</h2>

        {(["width", "height", "depth"] as const).map((key) => {
          const dim = runtimeProduct.dimensions?.[key];
          if (!dim) return null;

          return (
            <div key={key} className="mb-4">
              <label className="block text-sm capitalize">{key}</label>
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
              <p className="text-xs text-neutral-500">Max: {dim.max} cm</p>
            </div>
          );
        })}
      </section>
    )}

    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">Visibilità</h2>
      <p className="mb-3 text-sm text-neutral-400">
        {selectedPart?.name || selectedPartId || "-"}
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
          Mostra componente
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
      <h2 className="mb-4 text-lg font-black text-white">Importa prodotto JSON</h2>
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
          File caricato: {importName}
        </p>
      )}
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">Backup / Autosave</h2>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => {
            saveAutosave();
            setAutosaveLabel(new Date().toLocaleTimeString());
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Salva autosave
        </button>

        <button
          type="button"
          onClick={() => {
            const ok = restoreAutosave();
            if (!ok) alert("Nessun autosave disponibile.");
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Ripristina autosave
        </button>

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
        {autosaveLabel ? `Ultimo autosave: ${autosaveLabel}` : "Autosave pronto."}
      </p>
    </section>

    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-4 text-lg font-black text-white">Configurazione cliente</h2>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          Esporta configurazione
        </button>

        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10">
          Importa configurazione
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const fileText = await file.text();
              const data = JSON.parse(fileText);

              importConfiguration(data);

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
      <h2 className="mb-3 text-xl font-semibold">Accessori</h2>
      <p className="mb-3 text-sm text-neutral-400">
        Applichi accessori a: {selectedPart?.name || selectedPartId || "-"}
      </p>

      {!selectedPart && (
        <p className="text-sm text-neutral-500">Seleziona un pezzo dal modello.</p>
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
              <span>{accessory.name}</span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-black text-sky-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {isActive ? "ON" : "OFF"}
              </span>
            </div>
          </button>
        );
      })}

      {selectedStoreKey && inserts?.[selectedStoreKey] && (
        <>
          <div className="mt-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-3">
            <p className="mb-3 text-sm font-semibold text-white">Dimensioni inserto</p>

            {[
              { key: "width", label: "Larghezza %", min: 5, max: 100 },
              { key: "depth", label: "Profondità %", min: 5, max: 100 },
              { key: "offsetX", label: "Sposta X", min: -600, max: 600 },
              { key: "offsetZ", label: "Sposta Z", min: -300, max: 300 },
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
            Materiale inserto
            <select
              value={insertMaterials?.[selectedStoreKey] || "marmo"}
              onChange={(event) =>
                setInsertMaterial(selectedStoreKey, event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
            >
              <option value="marmo">Marmo</option>
              <option value="calacatta">Calacatta</option>
              <option value="marquinia">Marquinia</option>
              <option value="statuario">Statuario</option>
              <option value="travertino">Travertino</option>
              <option value="onice">Onice</option>
              <option value="emperador">Emperador</option>
            </select>
          </label>
        </>
      )}

      {selectedStoreKey && isAccessoryActive(accessories, selectedStoreKey, "led") && (
        <>
          <div className="mt-4">
            <label className="mb-2 block text-sm">Temperatura LED</label>
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
              <span>Intensità LED</span>
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
      <h2 className="mb-3 text-xl font-semibold">Materiali</h2>
      <p className="mb-3 text-sm text-neutral-400">
        {selectedPart?.name || selectedPartId || "-"}
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
        <option value="">Seleziona materiale</option>
        {filteredMaterials.map((material: any) => (
          <option key={material.id} value={material.id}>
            {material.name}
          </option>
        ))}
      </select>

      {selectedStoreKey && (
        <div className="mt-3">
          <label className="mb-2 block text-sm text-neutral-300">
            Senso venatura
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
              Orizzontale
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
              Verticale
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
      <h2 className="mb-3 text-xl font-semibold">Viste</h2>
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
              {view.name}
            </button>
          )
        )}
      </div>
    </section>

    <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_20px_rgba(0,0,0,0.25)]">
      <h2 className="mb-3 text-xl font-semibold">Runtime JSON</h2>
      <button
        onClick={() => downloadJson("bagastudio-config.json", exportConfiguration())}
        className="mb-2 w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
      >
        Esporta configurazione
      </button>
      <label className="mb-2 block w-full cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm text-white">
        Importa configurazione
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const text = await file.text();
            const data = JSON.parse(text);

            importConfiguration(data);

            event.target.value = "";
          }}
        />
      </label>
      <button
        onClick={() => downloadJson("bagastudio-backup.json", createBackupSnapshot())}
        className="w-full rounded-2xl bg-sky-500 px-3 py-2 text-sm text-black"
      >
        Scarica backup completo
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
      ["↖", "Selezione", null],
      ["✥", "Vista frontale", "front"],
      ["↻", "Vista successiva", "next"],
      ["□", "Vista 3D", "iso"],
      ["⌁", "Vista frontale", "front"],
      ["↕", "Vista dall'alto", "top"],
      ["◎", "Vista laterale", "right"],
      ["↗", "Fullscreen", "fullscreen"],
    ].map(([icon, title, action]: any, index) => (
      <button
        key={`${icon}-${index}`}
        type="button"
        title={title}
        onClick={() => {
          if (action === "next") goNextView();
          else if (action === "fullscreen") requestViewerFullscreen();
          else if (action) setActiveView(action);
        }}
        className={`flex h-10 w-11 items-center justify-center rounded-lg text-lg transition ${
          index === 0
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
      Importa un JSON prodotto dalla sidebar.
    </div>
  )}
</section>

        <aside className="overflow-y-auto rounded-2xl border border-sky-400/15 bg-[#07111c] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <section className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-white">Riepilogo progetto</h2>
              <span className="text-neutral-400">⌃</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-sky-400">⌂ {runtimeProduct?.name || "Prodotto"}</span>
                <span>€ {Number(runtimeProduct?.pricing?.basePrice ?? displayPricing.total ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>✦ Accessori</span>
                <span>Inclusi</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>◉ Materiali</span>
                <span>Configurati</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>▤ Backup</span>
                <span>{autosaveLabel ? `Autosave ${autosaveLabel}` : "Pronto"}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">Totale progetto</p>
                  <p className="text-xs text-neutral-400">IVA inclusa</p>
                </div>
                <p className="text-3xl font-black text-sky-400">€ {displayPricing.total.toFixed(2)}</p>
              </div>
            </div>
          </section>

          <section className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wide text-white">Proprietà oggetto</h2>
              <span className="text-neutral-400">⌃</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-neutral-400">Nome</span><span className="text-right text-white">{selectedPart?.name || selectedPartId || "Nessun pezzo"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">Prodotto</span><span className="text-right text-white">{runtimeProduct?.name || "-"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">Dimensioni</span><span className="text-right text-white">{Number(dimensions?.width ?? runtimeProduct?.dimensions?.width?.default ?? 0)} × {Number(dimensions?.depth ?? runtimeProduct?.dimensions?.depth?.default ?? 0)} × {Number(dimensions?.height ?? runtimeProduct?.dimensions?.height?.default ?? 0)} cm</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">Vista</span><span className="text-right text-white">{activeViewId || "3D"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-400">LED</span><span className="text-right text-white">{selectedStoreKey && isAccessoryActive(accessories, selectedStoreKey, "led") ? `${ledKelvin?.[selectedStoreKey] || 4000}K` : "Off"}</span></div>
            </div>
          </section>

          <button onClick={() => downloadJson("bagastudio-preventivo.json", createBackupSnapshot())} className="w-full rounded-2xl bg-sky-500 px-5 py-5 text-base font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.35)] hover:bg-sky-400">
            Aggiungi al preventivo
          </button>
        </aside>
    </div>
  </div>
</main>
);
}
