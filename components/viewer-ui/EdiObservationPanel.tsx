"use client";

type EdiObservationPanelProps = {
  productPackageAvailable: boolean;
  importedModelName?: string;
  observableComponentCount?: number;
  lastImporterEvent?: string;
  productPackageObservationSummary?: EdiProductPackageObservationSummary;
  selectionSummary?: EdiSelectionObservationSummary;
};

export type EdiProductPackageObservationSummary = {
  snapshotAvailable: boolean;
  productPackageObserved: boolean;
  componentCount: number;
  sourceFormat?: string;
  origin?: string;
  nativeModuleCount?: number;
  importedModuleCount?: number;
};

export type EdiSelectionObservationSummary = {
  hasSelection: boolean;
  selectedName?: string;
  origin?: string;
  observationActive: boolean;
};

const formatAvailability = (available: boolean) => (available ? "disponibile" : "non disponibile");

const createViewerObservationMessages = ({
  productPackageAvailable,
  importedModelName,
  componentCount,
  lastImporterEvent,
}: {
  productPackageAvailable: boolean;
  importedModelName?: string;
  componentCount: number;
  lastImporterEvent?: string;
}) => {
  const observations: string[] = [];
  const hasImportedModel = Boolean(importedModelName?.trim());
  const hasImporterEvent = Boolean(lastImporterEvent?.trim());

  if (!productPackageAvailable && !hasImportedModel && componentCount === 0) {
    observations.push("Nessun prodotto caricato");
  }

  if (hasImportedModel) {
    observations.push("Modello rilevato");
  }

  if (productPackageAvailable || hasImporterEvent) {
    observations.push("Importazione completata");
  }

  if (componentCount > 0) {
    observations.push(`${componentCount} componenti osservabili`);
  }

  return observations;
};

const createViewerUnderstandingMessages = ({
  importedModelName,
  componentCount,
}: {
  importedModelName?: string;
  componentCount: number;
}) => {
  const understandings: string[] = [];
  const normalizedModelName = importedModelName?.trim();
  const hasImportedModel = Boolean(normalizedModelName);
  const modelExtension = normalizedModelName?.split(".").pop()?.toLowerCase();

  if (componentCount > 0) {
    understandings.push(`Progetto composto da ${componentCount} elementi`);
  } else {
    understandings.push("Nessun elemento configurato");
  }

  if (modelExtension === "stl") {
    understandings.push("Oggetto STL rilevato");
  }

  if (hasImportedModel) {
    understandings.push("Modello importato rilevato");
    understandings.push(`Nome rilevato: ${normalizedModelName}`);
  }

  return understandings;
};

const createViewerInsightMessages = ({
  importedModelName,
  componentCount,
}: {
  importedModelName?: string;
  componentCount: number;
}) => {
  const insights: string[] = [];
  const hasImportedModel = Boolean(importedModelName?.trim());

  if (componentCount === 0) {
    insights.push("Ho notato che il progetto e ancora vuoto.");
  } else if (componentCount === 1) {
    insights.push("Ho notato che il progetto contiene un solo elemento.");
  } else if (componentCount <= 5) {
    insights.push("Ho notato che il progetto contiene pochi elementi.");
  }

  if (hasImportedModel) {
    insights.push("Ho notato che e stato importato un modello esterno.");
  }

  return insights;
};

const createViewerContextMessages = ({
  importedModelName,
  componentCount,
  productPackageObservation,
  selectionObservation,
}: {
  importedModelName?: string;
  componentCount: number;
  productPackageObservation: EdiProductPackageObservationSummary;
  selectionObservation: EdiSelectionObservationSummary;
}) => {
  const contexts: string[] = [];
  const selectedName = selectionObservation.selectedName?.trim();
  const normalizedSelectedName = selectedName?.toLowerCase() || "";
  const hasImportedModel = Boolean(importedModelName?.trim());

  if (selectionObservation.hasSelection && normalizedSelectedName.includes("front")) {
    contexts.push("Stai lavorando sui frontali.");
  } else if (
    selectionObservation.hasSelection &&
    (normalizedSelectedName.includes("lavello") || normalizedSelectedName.includes("sink"))
  ) {
    contexts.push("Focus corrente: zona lavello.");
  } else if (
    selectionObservation.hasSelection &&
    (normalizedSelectedName.includes("main") ||
      normalizedSelectedName.includes("principale") ||
      selectionObservation.origin === "importato")
  ) {
    contexts.push("Focus corrente: modulo principale.");
  } else if (selectionObservation.hasSelection) {
    contexts.push(`Focus corrente: ${selectedName || "elemento selezionato"}.`);
  }

  if (productPackageObservation.productPackageObserved && (productPackageObservation.nativeModuleCount ?? 0) > 0) {
    contexts.push("Contesto nativo BagaStudio disponibile.");
  }

  if (hasImportedModel || (productPackageObservation.importedModuleCount ?? 0) > 0) {
    contexts.push("Contesto import rilevato.");
  }

  if (contexts.length === 0 && componentCount > 0) {
    contexts.push("Contesto Viewer disponibile.");
  }

  if (contexts.length === 0) {
    contexts.push("Contesto non determinabile.");
  }

  return contexts;
};

export default function EdiObservationPanel({
  productPackageAvailable,
  importedModelName,
  observableComponentCount,
  lastImporterEvent,
  productPackageObservationSummary,
  selectionSummary,
}: EdiObservationPanelProps) {
  const componentCount =
    typeof observableComponentCount === "number" && Number.isFinite(observableComponentCount)
      ? observableComponentCount
      : 0;
  const observations = createViewerObservationMessages({
    productPackageAvailable,
    importedModelName,
    componentCount,
    lastImporterEvent,
  });
  const understandings = createViewerUnderstandingMessages({
    importedModelName,
    componentCount,
  });
  const insights = createViewerInsightMessages({
    importedModelName,
    componentCount,
  });
  const productPackageObservation = productPackageObservationSummary ?? {
    snapshotAvailable: false,
    productPackageObserved: false,
    componentCount: 0,
  };
  const selectionObservation = selectionSummary ?? {
    hasSelection: false,
    observationActive: false,
  };
  const contexts = createViewerContextMessages({
    importedModelName,
    componentCount,
    productPackageObservation,
    selectionObservation,
  });

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

      <div className="mt-3 rounded-xl border border-lime-300/16 bg-lime-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-lime-200">
          Product Package Observation
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-100">
          <div>
            <span className="block uppercase tracking-[0.12em] text-slate-500">Product Package</span>
            <span className="mt-0.5 block font-bold text-white">
              {formatAvailability(productPackageObservation.productPackageObserved)}
            </span>
          </div>
          <div>
            <span className="block uppercase tracking-[0.12em] text-slate-500">Snapshot</span>
            <span className="mt-0.5 block font-bold text-white">
              {formatAvailability(productPackageObservation.snapshotAvailable)}
            </span>
          </div>
          <div>
            <span className="block uppercase tracking-[0.12em] text-slate-500">Componenti PP</span>
            <span className="mt-0.5 block font-bold text-white">
              {productPackageObservation.componentCount}
            </span>
          </div>
          <div>
            <span className="block uppercase tracking-[0.12em] text-slate-500">Origine</span>
            <span className="mt-0.5 block truncate font-bold text-white">
              {productPackageObservation.origin || productPackageObservation.sourceFormat || "non disponibile"}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-semibold leading-relaxed text-lime-100/90">
          Nativi: {productPackageObservation.nativeModuleCount ?? 0} · Importati:{" "}
          {productPackageObservation.importedModuleCount ?? 0}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-cyan-300/16 bg-cyan-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
          FOCUS
        </span>
        <div className="mt-2 grid gap-2 text-[10px] font-semibold text-slate-100">
          <div>
            <span className="block uppercase tracking-[0.12em] text-slate-500">Elemento</span>
            <span className="mt-0.5 block truncate font-bold text-white">
              {selectionObservation.hasSelection
                ? selectionObservation.selectedName || "elemento selezionato"
                : "nessun elemento selezionato"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block uppercase tracking-[0.12em] text-slate-500">Origine</span>
              <span className="mt-0.5 block truncate font-bold text-white">
                {selectionObservation.origin || "non disponibile"}
              </span>
            </div>
            <div>
              <span className="block uppercase tracking-[0.12em] text-slate-500">Osservazione</span>
              <span className="mt-0.5 block font-bold text-white">
                {selectionObservation.observationActive ? "attiva" : "non attiva"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-fuchsia-300/16 bg-fuchsia-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-200">
          CONTESTO
        </span>
        <ul className="mt-2 space-y-1.5">
          {contexts.map((context) => (
            <li key={context} className="flex gap-2 text-[11px] font-semibold leading-snug text-slate-100">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
              <span>{context}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-300/16 bg-emerald-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
          Osservazioni
        </span>
        <ul className="mt-2 space-y-1.5">
          {observations.map((observation) => (
            <li key={observation} className="flex gap-2 text-[11px] font-semibold leading-snug text-slate-100">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-sky-300/16 bg-sky-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-sky-200">
          COMPRENSIONE
        </span>
        <ul className="mt-2 space-y-1.5">
          {understandings.map((understanding) => (
            <li key={understanding} className="flex gap-2 text-[11px] font-semibold leading-snug text-slate-100">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
              <span>{understanding}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-violet-300/16 bg-violet-400/8 px-3 py-2">
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-violet-200">
          INSIGHT
        </span>
        <ul className="mt-2 space-y-1.5">
          {insights.map((insight) => (
            <li key={insight} className="flex gap-2 text-[11px] font-semibold leading-snug text-slate-100">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-amber-300/18 bg-amber-400/8 px-3 py-2 text-[10px] font-semibold leading-relaxed text-amber-100">
        Nessuna mutation, nessuna decisione.
      </div>
    </aside>
  );
}
