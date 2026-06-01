import type {
  ParametricEditV1Item,
  ParametricEditV1Report,
  ParametricEditV1Status,
} from "./parametricEditV10";
import type {
  ProductionReadinessGateV1Item,
  ProductionReadinessGateV1Report,
  ProductionReadinessGateV1Status,
} from "./productionReadinessGateV10";

type CsvRegenerationV1ReportLike = {
  totals: {
    updatedRows: number;
    skippedRows: number;
  };
  rows: Array<{
    rowIndex: number;
    name: string;
    status: "updated" | "unchanged" | "skipped";
    originalThickness: number | null;
    regeneratedThickness: number | null;
  }>;
};

function normalizeCsvRegenerationKey(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type CsvRegenerationGuardV1Status = "ready" | "review" | "blocked";

export type CsvRegenerationGuardV1Item = {
  rowIndex: number;
  name: string;
  status: CsvRegenerationGuardV1Status;
  csvStatus: "updated" | "unchanged" | "skipped";
  productionGate: ProductionReadinessGateV1Status | null;
  parametricStatus: ParametricEditV1Status | null;
  originalThickness: number | null;
  regeneratedThickness: number | null;
  externalDimensionsLocked: boolean;
  note: string;
};

export type CsvRegenerationGuardV1Report = {
  schema: "bagastudio-csv-regeneration-guard-v1";
  version: 1;
  generatedAt: string;
  readiness: "CSV_READY" | "CSV_REVIEW_REQUIRED" | "CSV_BLOCKED";
  totals: {
    rows: number;
    ready: number;
    review: number;
    blocked: number;
    updatedRows: number;
    skippedRows: number;
    externalDimensionsLocked: number;
  };
  items: CsvRegenerationGuardV1Item[];
};

export function buildCsvRegenerationGuardV1Report(
  csvReport: CsvRegenerationV1ReportLike,
  parametricReport: ParametricEditV1Report,
  productionGateReport: ProductionReadinessGateV1Report
): CsvRegenerationGuardV1Report {
  const parametricByName = new Map<string, ParametricEditV1Item>();
  parametricReport.items.forEach((item) => {
    parametricByName.set(normalizeCsvRegenerationKey(item.displayName), item);
  });

  const productionByName = new Map<string, ProductionReadinessGateV1Item>();
  productionGateReport.items.forEach((item) => {
    productionByName.set(normalizeCsvRegenerationKey(item.displayName), item);
  });

  const items = csvReport.rows.map((row) => {
    const rowKey = normalizeCsvRegenerationKey(row.name);
    const parametric = parametricByName.get(rowKey) || null;
    const production = productionByName.get(rowKey) || null;

    let status: CsvRegenerationGuardV1Status = "ready";
    let note = "CSV rigenerabile: riga collegata e controlli produttivi senza blocchi.";

    if (production?.status === "blocked" || parametric?.status === "blocked") {
      status = "blocked";
      note = "Bloccato: Production Readiness Gate o Parametric Edit segnala errori da correggere prima della rigenerazione CSV.";
    } else if (row.status === "skipped") {
      status = "review";
      note = "Review richiesta: riga CSV saltata o non modificabile dalle regole correnti.";
    } else if (production?.status === "review" || parametric?.status === "review") {
      status = "review";
      note = "Review richiesta: controllare warning produttivi prima dell'export CSV definitivo.";
    } else if (!parametric?.externalDimensionsLocked) {
      status = "review";
      note = "Review richiesta: ingombro esterno non confermato/bloccato sul componente collegato.";
    }

    return {
      rowIndex: row.rowIndex,
      name: row.name,
      status,
      csvStatus: row.status,
      productionGate: production?.status || null,
      parametricStatus: parametric?.status || null,
      originalThickness: row.originalThickness,
      regeneratedThickness: row.regeneratedThickness,
      externalDimensionsLocked: Boolean(parametric?.externalDimensionsLocked),
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;

  return {
    schema: "bagastudio-csv-regeneration-guard-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness: blocked > 0 ? "CSV_BLOCKED" : review > 0 ? "CSV_REVIEW_REQUIRED" : "CSV_READY",
    totals: {
      rows: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      updatedRows: csvReport.totals.updatedRows,
      skippedRows: csvReport.totals.skippedRows,
      externalDimensionsLocked: items.filter((item) => item.externalDimensionsLocked).length,
    },
    items,
  };
}

