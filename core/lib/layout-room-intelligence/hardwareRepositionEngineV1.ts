// @ts-nocheck

type ParametricEditV1ReportLike = {
  items: Array<{
    componentId: string;
    displayName: string;
    status: "ready" | "review" | "blocked" | "skipped" | string;
    originalThickness: number | null;
    targetThickness: number | null;
    [key: string]: any;
  }>;
};

type CsvRegenerationV1RowLike = {
  rowIndex: number;
  name: string;
  status?: string;
  [key: string]: any;
};

type CsvRegenerationV1ReportLike = {
  rows: CsvRegenerationV1RowLike[];
};

type ConstraintEngineV1ItemLike = {
  componentId: string;
  status: "ok" | "warning" | "error" | string;
  [key: string]: any;
};

type ConstraintEngineV1ReportLike = {
  items: ConstraintEngineV1ItemLike[];
};

function normalizeHardwareRepositionKey(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type HardwareRepositionEngineV1Status = "ready" | "review" | "blocked" | "skipped";

export type HardwareRepositionEngineV1Item = {
  componentId: string;
  displayName: string;
  status: HardwareRepositionEngineV1Status;
  originalThickness: number | null;
  targetThickness: number | null;
  thicknessDelta: number | null;
  drillingOffsetRule: string;
  hardwareOffsetRule: string;
  linkedCsvRow: number | null;
  constraintStatus: "ok" | "warning" | "error" | null;
  note: string;
};

export type HardwareRepositionEngineV1Report = {
  schema: "bagastudio-hardware-reposition-engine-v1";
  version: 1;
  generatedAt: string;
  readiness: "REPOSITION_READY" | "REPOSITION_REVIEW_REQUIRED" | "REPOSITION_BLOCKED";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    repositionRequired: number;
  };
  items: HardwareRepositionEngineV1Item[];
  notes: string[];
};

export function buildHardwareRepositionEngineV1Report(
  parametricReport: ParametricEditV1ReportLike,
  csvReport: CsvRegenerationV1ReportLike,
  constraintReport: ConstraintEngineV1ReportLike
): HardwareRepositionEngineV1Report {
  const csvByName = new Map<string, CsvRegenerationV1RowLike>();
  csvReport.rows.forEach((row) => csvByName.set(normalizeHardwareRepositionKey(row.name), row));

  const constraintsByComponent = new Map<string, ConstraintEngineV1ItemLike[]>();
  constraintReport.items.forEach((item) => {
    const list = constraintsByComponent.get(item.componentId) || [];
    list.push(item);
    constraintsByComponent.set(item.componentId, list);
  });

  const items: HardwareRepositionEngineV1Item[] = parametricReport.items.map((item) => {
    const linkedCsvRow = csvByName.get(normalizeHardwareRepositionKey(item.displayName)) || null;
    const constraints = constraintsByComponent.get(item.componentId) || [];
    const hasConstraintError = constraints.some((constraint) => constraint.status === "error");
    const hasConstraintWarning = constraints.some((constraint) => constraint.status === "warning");
    const thicknessDelta = item.originalThickness !== null && item.targetThickness !== null
      ? Number((item.targetThickness - item.originalThickness).toFixed(3))
      : null;
    const repositionRequired = Boolean(thicknessDelta !== null && Math.abs(thicknessDelta) > 0.001);

    let status: HardwareRepositionEngineV1Status = "ready";
    let note = "Ferramenta pronta: nessun riposizionamento richiesto dalle regole V1.";

    if (item.status === "blocked" || hasConstraintError) {
      status = "blocked";
      note = "Riposizionamento bloccato: correggere prima errori Parametric Edit o Constraint Engine.";
    } else if (item.status === "skipped") {
      status = "skipped";
      note = "Componente saltato: nessuna regola di riposizionamento applicata in V1.";
    } else if (item.status === "review" || hasConstraintWarning || !linkedCsvRow) {
      status = "review";
      note = "Riposizionamento da revisionare: dati CSV/constraint incompleti o warning presenti.";
    } else if (repositionRequired) {
      status = "ready";
      note = "Riposizionamento V1 pronto: mantenere riferimenti parametrici a bordo/asse e aggiornare quote interne.";
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status,
      originalThickness: item.originalThickness,
      targetThickness: item.targetThickness,
      thicknessDelta,
      drillingOffsetRule: repositionRequired ? "edge/axis references preserved; internal drilling offsets recalculated" : "no drilling offset change",
      hardwareOffsetRule: repositionRequired ? "hardware anchors stay parametric; depth/margins revalidated" : "no hardware offset change",
      linkedCsvRow: linkedCsvRow?.rowIndex ?? null,
      constraintStatus: hasConstraintError ? "error" : hasConstraintWarning ? "warning" : constraints.length > 0 ? "ok" : null,
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness = blocked > 0
    ? "REPOSITION_BLOCKED"
    : review > 0
      ? "REPOSITION_REVIEW_REQUIRED"
      : "REPOSITION_READY";

  return {
    schema: "bagastudio-hardware-reposition-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    totals: {
      components: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped: items.filter((item) => item.status === "skipped").length,
      repositionRequired: items.filter((item) => item.thicknessDelta !== null && Math.abs(item.thicknessDelta) > 0.001).length,
    },
    items,
    notes: [
      "Hardware Reposition Engine V1 prepara il riposizionamento parametrico di ferramenta e forature dopo cambio spessore.",
      "Le quote restano diagnostiche: edge/axis references devono essere validate su CSV/CIX reali prima della produzione.",
      "Gli elementi blocked/review devono essere risolti prima della futura CSV/CIX Regeneration Pipeline.",
    ],
  };
}

