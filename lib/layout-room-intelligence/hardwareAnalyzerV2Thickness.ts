type CsvRegenerationV1ReportLike = {
  rows: Array<{
    name: string;
    originalThickness?: number | string | null;
    regeneratedThickness?: number | string | null;
    status: "updated" | "unchanged" | "skipped" | string;
    [key: string]: any;
  }>;
};

export type HardwareAnalyzerV2ThicknessItem = {
  componentId: string;
  displayName: string;
  originalThickness: number | null;
  targetThickness: number | null;
  status: "compatible" | "incompatible" | "skipped" | "missing";
  severity: "ok" | "warning" | "error";
  note: string;
};

export type HardwareAnalyzerV2ThicknessReport = {
  schema: "bagastudio-hardware-analyzer-v2-thickness";
  version: 2;
  generatedAt: string;
  productionStatus: "PRODUCTION_READY" | "PRODUCTION_BLOCKED";
  targetThickness: number | null;
  totals: {
    analyzed: number;
    compatible: number;
    incompatible: number;
    skipped: number;
    missing: number;
  };
  items: HardwareAnalyzerV2ThicknessItem[];
};

function readCollisionNumberV1(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const cleaned = value.replace(",", ".").replace(/[^\d.-]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

export function buildHardwareAnalyzerV2ThicknessReport(
  csvReport: CsvRegenerationV1ReportLike,
  targetThickness: number | null
): HardwareAnalyzerV2ThicknessReport {
  const items: HardwareAnalyzerV2ThicknessItem[] = csvReport.rows.map((row, index) => {
    const originalThickness = readCollisionNumberV1(row.originalThickness);
    const regeneratedThickness = readCollisionNumberV1(row.regeneratedThickness, targetThickness);

    if (originalThickness === null) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: regeneratedThickness,
        status: "missing",
        severity: "warning",
        note: "Spessore originale non rilevato: controllo compatibilità non eseguibile.",
      };
    }

    if (row.status === "skipped") {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "skipped",
        severity: "ok",
        note: "Componente escluso dalle regole produttive: spessore mantenuto invariato.",
      };
    }

    const isThinPanel = originalThickness <= 6;
    const isManualCheck = originalThickness > 6 && originalThickness < 12;

    if (isThinPanel) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "skipped",
        severity: "ok",
        note: "Pannello sottile protetto: non deve seguire l'override spessore.",
      };
    }

    if (isManualCheck) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: originalThickness,
        status: "incompatible",
        severity: "warning",
        note: "Spessore intermedio 6-12 mm: richiede controllo manuale prima della produzione.",
      };
    }

    if (regeneratedThickness === null) {
      return {
        componentId: `${index}-${row.name}`,
        displayName: row.name,
        originalThickness,
        targetThickness: null,
        status: "missing",
        severity: "warning",
        note: "Spessore target non disponibile.",
      };
    }

    return {
      componentId: `${index}-${row.name}`,
      displayName: row.name,
      originalThickness,
      targetThickness: regeneratedThickness,
      status: "compatible",
      severity: "ok",
      note: "Compatibile con override spessore e regole produttive.",
    };
  });

  const totals = {
    analyzed: items.length,
    compatible: items.filter((item) => item.status === "compatible").length,
    incompatible: items.filter((item) => item.status === "incompatible").length,
    skipped: items.filter((item) => item.status === "skipped").length,
    missing: items.filter((item) => item.status === "missing").length,
  };

  const productionStatus =
    totals.incompatible > 0 || totals.missing > 0
      ? "PRODUCTION_BLOCKED"
      : "PRODUCTION_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-thickness",
    version: 2,
    generatedAt: new Date().toISOString(),
    productionStatus,
    targetThickness,
    totals,
    items,
  };
}
