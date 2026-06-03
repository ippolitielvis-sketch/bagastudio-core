"use client";

type ViewerImportWorkflowPanelProps = {
  t: any;
  importName: string;
  importedModelName: string;
  importedModelFormat: string;
  importerStatus: string;
  importerUiState: any;
  viewerRuntimeComponents: any[];
  viewerRuntimeMetadata: any;
  lastImporterEvent: string;
  supportedModelAccept: string;
  onModelFileImport: (file: File) => void;
  onProductJsonImport: (file: File) => void;
  onRefreshImporterState: () => void;
  onRestoreAutosave: () => void;
  onBackupImport: (file: File) => void;
};

export default function ViewerImportWorkflowPanel({
  t,
  importName,
  importedModelName,
  importedModelFormat,
  importerStatus,
  importerUiState,
  viewerRuntimeComponents,
  viewerRuntimeMetadata,
  lastImporterEvent,
  supportedModelAccept,
  onModelFileImport,
  onProductJsonImport,
  onRefreshImporterState,
  onRestoreAutosave,
  onBackupImport,
}: ViewerImportWorkflowPanelProps) {
  return (
    <section id="bagastudio-import-workflow" className="rounded-[26px] border border-sky-400/15 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">BagaStudio Core Viewer</p>
        <h2 className="mt-1 text-xl font-black text-white">Importa / Carica prodotto</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-400">
          Tutti i comandi di caricamento sono raggruppati qui: modello 3D, Product Package JSON e backup progetto.
        </p>
      </div>

      <div className="grid gap-3">
        <label className="block cursor-pointer rounded-2xl border border-dashed border-sky-400/40 bg-sky-500/10 px-4 py-5 text-center transition hover:border-sky-300 hover:bg-sky-400/15">
          <span className="block text-sm font-black text-white">Importa modello 3D</span>
          <span className="mt-1 block text-xs text-sky-200">DAE / GLB / GLTF / OBJ / FBX / STL</span>
          <input
            type="file"
            accept={supportedModelAccept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onModelFileImport(file);
              event.target.value = "";
            }}
          />
        </label>

        <label className="block cursor-pointer rounded-2xl border border-dashed border-cyan-400/35 bg-cyan-500/10 px-4 py-5 text-center transition hover:border-cyan-300 hover:bg-cyan-400/15">
          <span className="block text-sm font-black text-white">Importa Product Package JSON</span>
          <span className="mt-1 block text-xs text-cyan-200">Pacchetto prodotto già generato da BagaStudio Core</span>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onProductJsonImport(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {(importedModelName || importName || importerStatus) && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-neutral-300">
          {importedModelName && <p><span className="font-bold text-white">Modello 3D:</span> {importedModelName}</p>}
          {importedModelFormat && <p><span className="font-bold text-white">Formato:</span> {importedModelFormat}</p>}
          {importName && <p><span className="font-bold text-white">Product Package:</span> {importName}</p>}
          {importerStatus && <p className="mt-1 text-sky-200">{importerStatus}</p>}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-sky-400/20 bg-black/25 p-4 text-xs text-neutral-300">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-black uppercase tracking-[0.22em] text-sky-300">Stato prodotto</p>
          <button
            type="button"
            onClick={onRefreshImporterState}
            className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[11px] font-black text-sky-100 hover:bg-sky-400/15"
          >
            Aggiorna
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-neutral-500">Modello</span>
            <span className="font-bold text-white">{importerUiState?.hasImportedModel ? "Pronto" : importedModelName ? "Caricato" : "Non caricato"}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-neutral-500">Package</span>
            <span className="font-bold text-white">{importerUiState?.hasProductPackage || importName ? "Disponibile" : "Non pronto"}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-neutral-500">Componenti</span>
            <span className="font-bold text-white">{viewerRuntimeComponents.length || importerUiState?.componentCount || 0}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-neutral-500">Schema</span>
            <span className="font-bold text-white">{importerUiState?.productPackage?.schema || viewerRuntimeMetadata?.schema || "In attesa"}</span>
          </div>
        </div>

        {viewerRuntimeMetadata?.categories && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Categorie componenti</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(viewerRuntimeMetadata.categories).map(([category, count]) => (
                <span key={category} className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-100">
                  {category}: {String(count)}
                </span>
              ))}
            </div>
          </div>
        )}

        {lastImporterEvent && <p className="mt-3 text-[11px] text-sky-200">Ultimo evento: {lastImporterEvent}</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRestoreAutosave}
          className="rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10"
        >
          {t.restoreAutosave}
        </button>

        <label className="cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-sm font-bold text-neutral-100 hover:border-sky-400/40 hover:bg-sky-400/10">
          {t.importBackup}
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onBackupImport(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}
