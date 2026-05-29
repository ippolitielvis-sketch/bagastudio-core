export type ImporterReportStatus = "READY_FOR_CONVERSION" | "READY" | "WARNING" | "ERROR";

export type ImporterReportCompatibility = {
  directViewer: boolean;
  runtimeGlb: boolean;
  requiresConversion: boolean;
};

export type ImporterReportStatistics = {
  nodes: number;
  instanceNodes: number;
  geometries: number;
};

export type ImporterReport = {
  schema: "bagastudio-importer-report";
  version: 1;
  generatedAt: string;
  fileName: string;
  sourceFormat: string;
  statistics: ImporterReportStatistics;
  compatibility: ImporterReportCompatibility;
  warnings: string[];
  errors: string[];
  status: ImporterReportStatus;
};

export function buildImporterReport(data: {
  fileName?: string;
  sourceFormat?: string;
  nodeCount?: number;
  instanceNodeCount?: number;
  geometryCount?: number;
  warnings?: string[];
  errors?: string[];
}): ImporterReport {
  const sourceFormat = String(data.sourceFormat || "unknown").toLowerCase();
  const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
  const errors = Array.isArray(data.errors) ? data.errors.filter(Boolean) : [];
  const requiresConversion = sourceFormat === "dae" && (data.instanceNodeCount || 0) > 0;

  return {
    schema: "bagastudio-importer-report",
    version: 1,
    generatedAt: new Date().toISOString(),
    fileName: data.fileName || "unknown",
    sourceFormat,
    statistics: {
      nodes: data.nodeCount || 0,
      instanceNodes: data.instanceNodeCount || 0,
      geometries: data.geometryCount || 0,
    },
    compatibility: {
      directViewer: !requiresConversion && errors.length === 0,
      runtimeGlb: errors.length === 0,
      requiresConversion,
    },
    warnings,
    errors,
    status:
      errors.length > 0
        ? "ERROR"
        : requiresConversion
        ? "READY_FOR_CONVERSION"
        : warnings.length > 0
        ? "WARNING"
        : "READY",
  };
}
