"use client";

type EdiObservationPanelProps = {
  productPackageAvailable: boolean;
  importedModelName?: string;
  observableComponentCount?: number;
  lastImporterEvent?: string;
};

const formatAvailability = (available: boolean) => (available ? "disponibile" : "non disponibile");

export default function EdiObservationPanel({
  productPackageAvailable,
  importedModelName,
  observableComponentCount,
  lastImporterEvent,
}: EdiObservationPanelProps) {
  const componentCount =
    typeof observableComponentCount === "number" && Number.isFinite(observableComponentCount)
      ? observableComponentCount
      : 0;

  return (
    <aside className="absolute bottom-20 right-4 z-[68] w-[320px] rounded-2xl border border-emerald-300/22 bg-slate-950/92 p-4 text-xs text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
            EDI
          </div>
          <div className="mt-1 text-base font-black uppercase tracking-wide text-white">
            Osservatore attivo
          </div>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100">
          read-only
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            Product Package
          </span>
          <span className="mt-1 block font-bold text-white">
            {formatAvailability(productPackageAvailable)}
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            Modello importato
          </span>
          <span className="mt-1 block truncate font-bold text-white">
            {importedModelName || "non disponibile"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              Componenti
            </span>
            <span className="mt-1 block font-bold text-white">{componentCount}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              Azioni
            </span>
            <span className="mt-1 block font-bold text-white">nessuna</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            Ultimo evento import
          </span>
          <span className="mt-1 block truncate font-bold text-white">
            {lastImporterEvent || "non disponibile"}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-amber-300/18 bg-amber-400/8 px-3 py-2 text-[10px] font-semibold leading-relaxed text-amber-100">
        Nessuna mutation, nessuna decisione.
      </div>
    </aside>
  );
}
