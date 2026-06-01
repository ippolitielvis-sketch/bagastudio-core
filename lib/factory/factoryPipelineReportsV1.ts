// @ts-nocheck

function normalizeCsvRegenerationKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9àèéìòùç._ -]/gi, "")
    .trim();
}

function csvRegenerationEscape(value) {
  const raw = String(value ?? "");
  if (/[;"\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function buildCsvRegenerationV1Csv(report) {
  const header = [
    "rowIndex",
    "name",
    "material",
    "originalThickness",
    "regeneratedThickness",
    "width",
    "height",
    "depth",
    "quantity",
    "status",
    "note",
  ];

  const rows = (report?.rows || []).map((row) => [
    row.rowIndex,
    row.name,
    row.material || "",
    row.originalThickness ?? "",
    row.regeneratedThickness ?? "",
    row.width ?? "",
    row.height ?? "",
    row.depth ?? "",
    row.quantity ?? "",
    row.status,
    row.note,
  ]);

  return [header, ...rows]
    .map((line) => line.map(csvRegenerationEscape).join(";"))
    .join("\n");
}

export type FactoryExportPackageV1Readiness = "FACTORY_READY" | "FACTORY_REVIEW_REQUIRED" | "FACTORY_BLOCKED";

export type FactoryExportPackageV1Report = {
  schema: "bagastudio-factory-export-package-v1";
  version: 1;
  generatedAt: string;
  readiness: FactoryExportPackageV1Readiness;
  product: {
    id: string;
    name: string;
    category: string;
    brand: string;
    packageVersion: string;
  };
  sources: {
    csvFileName: string | null;
    targetThickness: number | null;
    componentCount: number;
  };
  gates: {
    compatibilityMatrix: any;
    productionReadiness: ProductionReadinessGateV1Report;
    parametricEdit: ParametricEditV1Report;
    csvRegeneration: CsvRegenerationV1Report;
    csvGuard: CsvRegenerationGuardV1Report;
  };
  exports: {
    regeneratedCsv: string;
  };
  summary: {
    csvRows: number;
    csvUpdatedRows: number;
    csvBlockedRows: number;
    csvReviewRows: number;
    productionBlockedComponents: number;
    parametricBlockedComponents: number;
  };
  notes: string[];
};

export function buildFactoryExportPackageV1Report(params: {
  productId: string;
  productName: string;
  productCategory: string;
  productBrand: string;
  packageVersion: string;
  componentCount: number;
  compatibilityMatrix: any;
  productionReadiness: ProductionReadinessGateV1Report;
  parametricEdit: ParametricEditV1Report;
  csvRegeneration: CsvRegenerationV1Report;
  csvGuard: CsvRegenerationGuardV1Report;
}): FactoryExportPackageV1Report {
  const readiness: FactoryExportPackageV1Readiness =
    params.csvGuard.readiness === "CSV_BLOCKED" || params.productionReadiness.totals.blocked > 0
      ? "FACTORY_BLOCKED"
      : params.csvGuard.readiness === "CSV_REVIEW_REQUIRED" || params.productionReadiness.totals.review > 0
        ? "FACTORY_REVIEW_REQUIRED"
        : "FACTORY_READY";

  const notes = [
    readiness === "FACTORY_READY"
      ? "Pacchetto pronto per export factory diagnostico."
      : readiness === "FACTORY_BLOCKED"
        ? "Export factory bloccato: correggere gli errori segnalati prima della produzione."
        : "Export factory richiede revisione tecnica prima della produzione.",
    "Il CSV rigenerato mantiene gli ingombri esterni e segnala righe saltate o non collegate.",
    "Questo pacchetto V1 è diagnostico: prima dell'uso in produzione serve validazione manuale su casi reali.",
  ];

  return {
    schema: "bagastudio-factory-export-package-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    product: {
      id: params.productId,
      name: params.productName,
      category: params.productCategory,
      brand: params.productBrand,
      packageVersion: params.packageVersion,
    },
    sources: {
      csvFileName: params.csvRegeneration.sourceCsvFileName,
      targetThickness: params.csvRegeneration.targetThickness,
      componentCount: params.componentCount,
    },
    gates: {
      compatibilityMatrix: params.compatibilityMatrix,
      productionReadiness: params.productionReadiness,
      parametricEdit: params.parametricEdit,
      csvRegeneration: params.csvRegeneration,
      csvGuard: params.csvGuard,
    },
    exports: {
      regeneratedCsv: buildCsvRegenerationV1Csv(params.csvRegeneration),
    },
    summary: {
      csvRows: params.csvRegeneration.totals.csvRows,
      csvUpdatedRows: params.csvRegeneration.totals.updatedRows,
      csvBlockedRows: params.csvGuard.totals.blocked,
      csvReviewRows: params.csvGuard.totals.review,
      productionBlockedComponents: params.productionReadiness.totals.blocked,
      parametricBlockedComponents: params.parametricEdit.totals.blocked,
    },
    notes,
  };
}



export type BomRegenerationV1Status = "ready" | "review" | "blocked";

export type BomRegenerationV1Item = {
  key: string;
  material: string | null;
  thickness: number | null;
  quantity: number;
  componentNames: string[];
  sourceRows: number[];
  status: BomRegenerationV1Status;
  note: string;
};

export type BomRegenerationV1Report = {
  schema: "bagastudio-bom-regeneration-v1";
  version: 1;
  generatedAt: string;
  readiness: "BOM_READY" | "BOM_REVIEW_REQUIRED" | "BOM_BLOCKED";
  sourceCsvFileName: string | null;
  targetThickness: number | null;
  totals: {
    bomItems: number;
    components: number;
    ready: number;
    review: number;
    blocked: number;
    totalQuantity: number;
  };
  items: BomRegenerationV1Item[];
  notes: string[];
};

export function buildBomRegenerationV1Report(
  csvReport: CsvRegenerationV1Report,
  csvGuardReport: CsvRegenerationGuardV1Report
): BomRegenerationV1Report {
  const guardByRow = new Map<number, CsvRegenerationGuardV1Report["items"][number]>();
  csvGuardReport.items.forEach((item) => guardByRow.set(item.rowIndex, item));

  const grouped = new Map<string, BomRegenerationV1Item>();

  csvReport.rows.forEach((row) => {
    const guard = guardByRow.get(row.rowIndex) || null;
    const materialKey = String(row.material || "materiale-non-definito").trim().toLowerCase();
    const thicknessKey = row.regeneratedThickness === null ? "spessore-non-definito" : `${row.regeneratedThickness}`;
    const key = `${materialKey}__${thicknessKey}`;
    const rowQuantity = row.quantity && row.quantity > 0 ? row.quantity : 1;
    const rowStatus: BomRegenerationV1Status = guard?.status === "blocked"
      ? "blocked"
      : guard?.status === "review" || row.status === "skipped"
        ? "review"
        : "ready";

    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += rowQuantity;
      existing.componentNames.push(row.name);
      existing.sourceRows.push(row.rowIndex);
      if (rowStatus === "blocked") existing.status = "blocked";
      else if (rowStatus === "review" && existing.status !== "blocked") existing.status = "review";
      return;
    }

    grouped.set(key, {
      key,
      material: row.material,
      thickness: row.regeneratedThickness,
      quantity: rowQuantity,
      componentNames: [row.name],
      sourceRows: [row.rowIndex],
      status: rowStatus,
      note: rowStatus === "blocked"
        ? "Voce BOM bloccata da CSV Guard: correggere prima dell'export produttivo."
        : rowStatus === "review"
          ? "Voce BOM da revisionare: riga CSV saltata/non collegata o richiesta verifica tecnica."
          : "Voce BOM pronta per distinta diagnostica V1.",
    });
  });

  const items = Array.from(grouped.values()).sort((a, b) => {
    const materialCompare = String(a.material || "").localeCompare(String(b.material || ""));
    if (materialCompare !== 0) return materialCompare;
    return (a.thickness || 0) - (b.thickness || 0);
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness = blocked > 0 ? "BOM_BLOCKED" : review > 0 ? "BOM_REVIEW_REQUIRED" : "BOM_READY";

  return {
    schema: "bagastudio-bom-regeneration-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    sourceCsvFileName: csvReport.sourceCsvFileName,
    targetThickness: csvReport.targetThickness,
    totals: {
      bomItems: items.length,
      components: csvReport.rows.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    },
    items,
    notes: [
      "BOM Regeneration V1 raggruppa il CSV rigenerato per materiale e spessore.",
      "La quantità è diagnostica e deriva dalle righe CSV, senza ancora ottimizzazione taglio o nesting.",
      "Le voci review/blocked devono essere corrette prima della futura pipeline Factory Engine.",
    ],
  };
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
  parametricReport: ParametricEditV1Report,
  csvReport: CsvRegenerationV1Report,
  constraintReport: ConstraintEngineV1Report
): HardwareRepositionEngineV1Report {
  const csvByName = new Map<string, CsvRegenerationV1Report["rows"][number]>();
  csvReport.rows.forEach((row) => csvByName.set(normalizeCsvRegenerationKey(row.name), row));

  const constraintsByComponent = new Map<string, ConstraintEngineV1Item[]>();
  constraintReport.items.forEach((item) => {
    const list = constraintsByComponent.get(item.componentId) || [];
    list.push(item);
    constraintsByComponent.set(item.componentId, list);
  });

  const items: HardwareRepositionEngineV1Item[] = parametricReport.items.map((item) => {
    const linkedCsvRow = csvByName.get(normalizeCsvRegenerationKey(item.displayName)) || null;
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


export type CsvCixRegenerationPipelineV1Status = "ready" | "review" | "blocked" | "skipped";
export type CsvCixRegenerationPipelineV1Readiness = "PIPELINE_READY" | "PIPELINE_REVIEW_REQUIRED" | "PIPELINE_BLOCKED";

export type CsvCixRegenerationPipelineV1Item = {
  componentId: string;
  displayName: string;
  status: CsvCixRegenerationPipelineV1Status;
  csvRow: number | null;
  csvStatus: CsvRegenerationV1Report["rows"][number]["status"] | null;
  csvGuardStatus: CsvRegenerationGuardV1Status | null;
  bomStatus: BomRegenerationV1Status | null;
  hardwareRepositionStatus: HardwareRepositionEngineV1Status | null;
  outputTargets: Array<"CSV" | "CIX" | "BOM" | "HARDWARE_MAP">;
  note: string;
};

export type CsvCixRegenerationPipelineV1Report = {
  schema: "bagastudio-csv-cix-regeneration-pipeline-v1";
  version: 1;
  generatedAt: string;
  readiness: CsvCixRegenerationPipelineV1Readiness;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    csvRowsReady: number;
    cixTargetsPlanned: number;
    bomLinkedItems: number;
  };
  items: CsvCixRegenerationPipelineV1Item[];
  notes: string[];
};

export function buildCsvCixRegenerationPipelineV1Report(
  csvReport: CsvRegenerationV1Report,
  csvGuardReport: CsvRegenerationGuardV1Report,
  bomReport: BomRegenerationV1Report,
  hardwareReport: HardwareRepositionEngineV1Report
): CsvCixRegenerationPipelineV1Report {
  const guardByRow = new Map<number, CsvRegenerationGuardV1Report["items"][number]>();
  csvGuardReport.items.forEach((item) => guardByRow.set(item.rowIndex, item));

  const hardwareByName = new Map<string, HardwareRepositionEngineV1Item>();
  hardwareReport.items.forEach((item) => hardwareByName.set(normalizeCsvRegenerationKey(item.displayName), item));

  const bomByComponentName = new Map<string, BomRegenerationV1Item>();
  bomReport.items.forEach((item) => {
    item.componentNames.forEach((componentName) => {
      bomByComponentName.set(normalizeCsvRegenerationKey(componentName), item);
    });
  });

  const items: CsvCixRegenerationPipelineV1Item[] = csvReport.rows.map((row) => {
    const key = normalizeCsvRegenerationKey(row.name);
    const guard = guardByRow.get(row.rowIndex) || null;
    const hardware = hardwareByName.get(key) || null;
    const bom = bomByComponentName.get(key) || null;
    const outputTargets: CsvCixRegenerationPipelineV1Item["outputTargets"] = ["CSV"];

    if (bom) outputTargets.push("BOM");
    if (hardware && hardware.status !== "skipped") outputTargets.push("HARDWARE_MAP", "CIX");

    let status: CsvCixRegenerationPipelineV1Status = "ready";
    let note = "Pipeline pronta: CSV rigenerabile, BOM collegata e CIX pianificabile in modalità diagnostica V1.";

    if (guard?.status === "blocked" || hardware?.status === "blocked" || bom?.status === "blocked") {
      status = "blocked";
      note = "Pipeline bloccata: correggere CSV Guard, BOM o Hardware Reposition prima della rigenerazione CSV/CIX.";
    } else if (row.status === "skipped" || hardware?.status === "skipped") {
      status = "skipped";
      note = "Pipeline saltata: riga o ferramenta non gestita dalle regole V1.";
    } else if (guard?.status === "review" || hardware?.status === "review" || bom?.status === "review" || !hardware || !bom) {
      status = "review";
      note = "Pipeline da revisionare: collegamenti incompleti o warning presenti prima dell'export produttivo.";
    }

    return {
      componentId: hardware?.componentId || `csv-row-${row.rowIndex}`,
      displayName: row.name,
      status,
      csvRow: row.rowIndex,
      csvStatus: row.status,
      csvGuardStatus: guard?.status || null,
      bomStatus: bom?.status || null,
      hardwareRepositionStatus: hardware?.status || null,
      outputTargets,
      note,
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const readiness: CsvCixRegenerationPipelineV1Readiness = blocked > 0
    ? "PIPELINE_BLOCKED"
    : review > 0
      ? "PIPELINE_REVIEW_REQUIRED"
      : "PIPELINE_READY";

  return {
    schema: "bagastudio-csv-cix-regeneration-pipeline-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    readiness,
    totals: {
      components: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped: items.filter((item) => item.status === "skipped").length,
      csvRowsReady: csvReport.rows.filter((row) => row.status === "updated" || row.status === "unchanged").length,
      cixTargetsPlanned: items.filter((item) => item.outputTargets.includes("CIX")).length,
      bomLinkedItems: items.filter((item) => item.bomStatus !== null).length,
    },
    items,
    notes: [
      "CSV/CIX Regeneration Pipeline V1 collega CSV rigenerato, CSV Guard, BOM e Hardware Reposition.",
      "Il CIX in V1 è pianificato come target diagnostico: la scrittura reale dei file .cix richiederà mapping lavorazioni macchina.",
      "Gli stati review/blocked impediscono l'export produttivo automatico e richiedono controllo tecnico.",
    ],
  };
}



export type FactoryEngineV1Status = "READY" | "REVIEW" | "BLOCKED";

export type FactoryEngineV1Report = {
  schema: "bagastudio-factory-engine-v1";
  version: 1;
  generatedAt: string;
  factoryStatus: FactoryEngineV1Status;
  factoryScore: number;
  summary: {
    components: number;
    productionBlocked: number;
    productionReview: number;
    parametricBlocked: number;
    csvBlocked: number;
    bomBlocked: number;
    hardwareBlocked: number;
    pipelineBlocked: number;
    exportReadiness: FactoryExportPackageV1Readiness;
  };
  inputs: {
    productionReadinessSchema: ProductionReadinessGateV1Report["schema"];
    parametricEditSchema: ParametricEditV1Report["schema"];
    csvGuardSchema: CsvRegenerationGuardV1Report["schema"];
    factoryExportSchema: FactoryExportPackageV1Report["schema"];
    bomSchema: BomRegenerationV1Report["schema"];
    hardwareRepositionSchema: HardwareRepositionEngineV1Report["schema"];
    csvCixPipelineSchema: CsvCixRegenerationPipelineV1Report["schema"];
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
};

export function buildFactoryEngineV1Report(params: {
  productionReadiness: ProductionReadinessGateV1Report;
  parametricEdit: ParametricEditV1Report;
  csvGuard: CsvRegenerationGuardV1Report;
  factoryExport: FactoryExportPackageV1Report;
  bom: BomRegenerationV1Report;
  hardwareReposition: HardwareRepositionEngineV1Report;
  csvCixPipeline: CsvCixRegenerationPipelineV1Report;
}): FactoryEngineV1Report {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (params.productionReadiness.totals.blocked > 0) {
    blockers.push(`${params.productionReadiness.totals.blocked} componenti bloccati dal Production Readiness Gate.`);
  }
  if (params.productionReadiness.totals.review > 0) {
    warnings.push(`${params.productionReadiness.totals.review} componenti richiedono revisione produttiva.`);
  }

  if (params.parametricEdit.totals.blocked > 0) {
    blockers.push(`${params.parametricEdit.totals.blocked} componenti bloccati nel Parametric Edit.`);
  }
  if (params.parametricEdit.totals.review > 0) {
    warnings.push(`${params.parametricEdit.totals.review} componenti parametrici richiedono controllo tecnico.`);
  }

  if (params.csvGuard.totals.blocked > 0) {
    blockers.push(`${params.csvGuard.totals.blocked} righe CSV non rigenerabili in sicurezza.`);
  }
  if (params.csvGuard.totals.review > 0) {
    warnings.push(`${params.csvGuard.totals.review} righe CSV richiedono revisione prima dell'export.`);
  }

  if (params.bom.totals.blocked > 0) {
    blockers.push(`${params.bom.totals.blocked} righe BOM bloccate.`);
  }
  if (params.bom.totals.review > 0) {
    warnings.push(`${params.bom.totals.review} righe BOM richiedono revisione.`);
  }

  if (params.hardwareReposition.totals.blocked > 0) {
    blockers.push(`${params.hardwareReposition.totals.blocked} riposizionamenti ferramenta bloccati.`);
  }
  if (params.hardwareReposition.totals.review > 0) {
    warnings.push(`${params.hardwareReposition.totals.review} riposizionamenti ferramenta richiedono revisione.`);
  }

  if (params.csvCixPipeline.totals.blocked > 0) {
    blockers.push(`${params.csvCixPipeline.totals.blocked} elementi bloccati nella pipeline CSV/CIX.`);
  }
  if (params.csvCixPipeline.totals.review > 0) {
    warnings.push(`${params.csvCixPipeline.totals.review} elementi pipeline CSV/CIX richiedono controllo.`);
  }

  if (params.factoryExport.readiness === "FACTORY_BLOCKED") {
    blockers.push("Factory Export Package V1 segnala export produttivo bloccato.");
  }
  if (params.factoryExport.readiness === "FACTORY_REVIEW_REQUIRED") {
    warnings.push("Factory Export Package V1 richiede revisione prima dell'export.");
  }

  if (blockers.length === 0 && warnings.length === 0) {
    recommendations.push("Progetto pronto per il prossimo step: Product Package Regeneration e Viewer Sync.");
  } else {
    recommendations.push("Correggere prima i blocchi critici, poi rieseguire CSV Guard, BOM, Hardware Reposition e Pipeline CSV/CIX.");
  }
  if (params.csvCixPipeline.totals.cixTargetsPlanned > 0) {
    recommendations.push("Prima dell'export CIX reale serve mapping lavorazioni macchina per ogni target CIX pianificato.");
  }

  const factoryStatus: FactoryEngineV1Status = blockers.length > 0 ? "BLOCKED" : warnings.length > 0 ? "REVIEW" : "READY";
  const totalSignals = blockers.length + warnings.length;
  const factoryScore = Math.max(0, Math.min(100, 100 - blockers.length * 18 - warnings.length * 7 - Math.max(0, totalSignals - 4) * 2));

  return {
    schema: "bagastudio-factory-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    factoryStatus,
    factoryScore,
    summary: {
      components: params.productionReadiness.totals.components,
      productionBlocked: params.productionReadiness.totals.blocked,
      productionReview: params.productionReadiness.totals.review,
      parametricBlocked: params.parametricEdit.totals.blocked,
      csvBlocked: params.csvGuard.totals.blocked,
      bomBlocked: params.bom.totals.blocked,
      hardwareBlocked: params.hardwareReposition.totals.blocked,
      pipelineBlocked: params.csvCixPipeline.totals.blocked,
      exportReadiness: params.factoryExport.readiness,
    },
    inputs: {
      productionReadinessSchema: params.productionReadiness.schema,
      parametricEditSchema: params.parametricEdit.schema,
      csvGuardSchema: params.csvGuard.schema,
      factoryExportSchema: params.factoryExport.schema,
      bomSchema: params.bom.schema,
      hardwareRepositionSchema: params.hardwareReposition.schema,
      csvCixPipelineSchema: params.csvCixPipeline.schema,
    },
    blockers,
    warnings,
    recommendations,
  };
}



export type ProductPackageRegenerationV1Status = "READY_TO_SYNC" | "REVIEW_REQUIRED" | "BLOCKED";

export type ProductPackageRegenerationV1Component = {
  componentId: string;
  displayName: string;
  status: "ready" | "review" | "blocked" | "skipped";
  parametricStatus: ParametricEditV1Status | null;
  bomStatus: BomRegenerationV1Status | null;
  hardwareStatus: HardwareRepositionEngineV1Status | null;
  pipelineStatus: CsvCixRegenerationPipelineV1Status | null;
  targetThickness: number | null;
  externalDimensionsLocked: boolean;
  viewerSyncReady: boolean;
  note: string;
};

export type ProductPackageRegenerationV1Report = {
  schema: "bagastudio-product-package-regeneration-v1";
  version: 1;
  generatedAt: string;
  status: ProductPackageRegenerationV1Status;
  sourceFactoryStatus: FactoryEngineV1Status;
  currentPackageSchema: string;
  nextPackageVersion: number;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    viewerSyncReady: number;
    packageComponents: number;
  };
  components: ProductPackageRegenerationV1Component[];
  packagePatch: {
    mode: "diagnostic_patch_v1";
    keepsOriginalGeometry: boolean;
    keepsExternalDimensions: boolean;
    updatesParametricMetadata: boolean;
    updatesBomMetadata: boolean;
    updatesHardwareMetadata: boolean;
    updatesCsvCixMetadata: boolean;
  };
  recommendations: string[];
};

export function buildProductPackageRegenerationV1Report(params: {
  factory: FactoryEngineV1Report;
  currentPackage: any;
  parametric: ParametricEditV1Report;
  bom: BomRegenerationV1Report;
  hardware: HardwareRepositionEngineV1Report;
  csvCix: CsvCixRegenerationPipelineV1Report;
}): ProductPackageRegenerationV1Report {
  const bomByComponentName = new Map<string, BomRegenerationV1Item>();
  params.bom.items.forEach((item) => {
    item.componentNames.forEach((componentName) => {
      bomByComponentName.set(normalizeCsvRegenerationKey(componentName), item);
    });
  });

  const hardwareById = new Map<string, HardwareRepositionEngineV1Item>();
  params.hardware.items.forEach((item) => hardwareById.set(item.componentId, item));

  const pipelineById = new Map<string, CsvCixRegenerationPipelineV1Item>();
  params.csvCix.items.forEach((item) => pipelineById.set(item.componentId, item));

  const components: ProductPackageRegenerationV1Component[] = params.parametric.items.map((item) => {
    const bomItem = bomByComponentName.get(normalizeCsvRegenerationKey(item.displayName)) || null;
    const hardwareItem = hardwareById.get(item.componentId) || null;
    const pipelineItem = pipelineById.get(item.componentId) || null;

    const hasBlock = item.status === "blocked" || bomItem?.status === "blocked" || hardwareItem?.status === "blocked" || pipelineItem?.status === "blocked";
    const hasReview = item.status === "review" || bomItem?.status === "review" || hardwareItem?.status === "review" || pipelineItem?.status === "review";
    const isSkipped = item.status === "skipped" || pipelineItem?.status === "skipped";

    let status: ProductPackageRegenerationV1Component["status"] = "ready";
    let note = "Componente pronto per patch Product Package e futura sincronizzazione Viewer.";

    if (hasBlock) {
      status = "blocked";
      note = "Bloccato: Factory/Parametric/BOM/Hardware/Pipeline segnala errori da correggere prima di rigenerare il Product Package.";
    } else if (hasReview) {
      status = "review";
      note = "Review richiesta: il Product Package può essere preparato solo come bozza controllata.";
    } else if (isSkipped) {
      status = "skipped";
      note = "Componente saltato dalla pipeline produttiva: non viene incluso nella patch automatica V1.";
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status,
      parametricStatus: item.status,
      bomStatus: bomItem?.status || null,
      hardwareStatus: hardwareItem?.status || null,
      pipelineStatus: pipelineItem?.status || null,
      targetThickness: item.targetThickness,
      externalDimensionsLocked: item.externalDimensionsLocked,
      viewerSyncReady: status === "ready" && item.externalDimensionsLocked,
      note,
    };
  });

  const blocked = components.filter((item) => item.status === "blocked").length;
  const review = components.filter((item) => item.status === "review").length;
  const skipped = components.filter((item) => item.status === "skipped").length;

  const status: ProductPackageRegenerationV1Status =
    params.factory.factoryStatus === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.factory.factoryStatus === "REVIEW" || review > 0
        ? "REVIEW_REQUIRED"
        : "READY_TO_SYNC";

  const packageComponents = Array.isArray(params.currentPackage?.components)
    ? params.currentPackage.components.length
    : Array.isArray(params.currentPackage?.parts)
      ? params.currentPackage.parts.length
      : 0;

  return {
    schema: "bagastudio-product-package-regeneration-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryStatus: params.factory.factoryStatus,
    currentPackageSchema: String(params.currentPackage?.schema || params.currentPackage?.productPackageSchema || "unknown"),
    nextPackageVersion: Number(params.currentPackage?.version || params.currentPackage?.packageVersion || 3) + 1,
    totals: {
      components: components.length,
      ready: components.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped,
      viewerSyncReady: components.filter((item) => item.viewerSyncReady).length,
      packageComponents,
    },
    components,
    packagePatch: {
      mode: "diagnostic_patch_v1",
      keepsOriginalGeometry: true,
      keepsExternalDimensions: true,
      updatesParametricMetadata: true,
      updatesBomMetadata: true,
      updatesHardwareMetadata: true,
      updatesCsvCixMetadata: true,
    },
    recommendations: [
      status === "READY_TO_SYNC"
        ? "Product Package pronto per Viewer Sync V1: applicare patch metadata senza alterare geometria originale."
        : "Correggere blocchi/review prima di usare il Product Package rigenerato come base cliente.",
      "V1 genera una patch diagnostica: la rigenerazione geometrica reale arriverà con Viewer Sync e Structure Editor.",
      "Mantenere sempre ingombro esterno bloccato durante cambio spessore, ferramenta e quote interne.",
    ],
  };
}



export type ViewerSyncV1Status = "SYNC_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type ViewerSyncV1Component = {
  componentId: string;
  displayName: string;
  status: "ready" | "review" | "blocked" | "skipped";
  sourceProductPackageStatus: ProductPackageRegenerationV1Component["status"];
  viewerSyncReady: boolean;
  geometryMode: "metadata_only" | "geometry_regeneration_required" | "skipped";
  syncTargets: string[];
  note: string;
};

export type ViewerSyncV1Report = {
  schema: "bagastudio-viewer-sync-v1";
  version: 1;
  generatedAt: string;
  status: ViewerSyncV1Status;
  sourceProductPackageSchema: ProductPackageRegenerationV1Report["schema"];
  sourceProductPackageStatus: ProductPackageRegenerationV1Status;
  syncMode: "diagnostic_viewer_sync_v1";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    skipped: number;
    metadataOnly: number;
    geometryRequired: number;
  };
  components: ViewerSyncV1Component[];
  viewerPatch: {
    keepsCurrentModelGeometry: boolean;
    updatesComponentMetadata: boolean;
    updatesFactoryMetadata: boolean;
    updatesBomMetadata: boolean;
    updatesHardwareMetadata: boolean;
    updatesCsvCixMetadata: boolean;
    readyForMaterialAccessoryLedWorkflow: boolean;
  };
  recommendations: string[];
};

export function buildViewerSyncV1Report(params: {
  productPackage: ProductPackageRegenerationV1Report;
}): ViewerSyncV1Report {
  const components: ViewerSyncV1Component[] = params.productPackage.components.map((item) => {
    const syncTargets = ["componentMetadata", "factoryState", "bomMetadata", "hardwareMetadata", "csvCixMetadata"];

    if (item.status === "blocked") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "blocked",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "geometry_regeneration_required",
        syncTargets,
        note: "Bloccato: il componente non deve essere sincronizzato nel Viewer finché Product Package/Factory non sono corretti.",
      };
    }

    if (item.status === "skipped") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "skipped",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "skipped",
        syncTargets: [],
        note: "Componente saltato: nessuna patch Viewer automatica in V1.",
      };
    }

    if (!item.viewerSyncReady || item.status === "review") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        status: "review",
        sourceProductPackageStatus: item.status,
        viewerSyncReady: false,
        geometryMode: "geometry_regeneration_required",
        syncTargets,
        note: "Review richiesta: servono controlli prima di aggiornare il Viewer o rigenerare geometria/struttura.",
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      status: "ready",
      sourceProductPackageStatus: item.status,
      viewerSyncReady: true,
      geometryMode: "metadata_only",
      syncTargets,
      note: "Pronto: il Viewer può ricevere metadata factory mantenendo geometria attuale e workflow materiali/accessori/LED.",
    };
  });

  const blocked = components.filter((item) => item.status === "blocked").length;
  const review = components.filter((item) => item.status === "review").length;
  const skipped = components.filter((item) => item.status === "skipped").length;
  const geometryRequired = components.filter((item) => item.geometryMode === "geometry_regeneration_required").length;

  const status: ViewerSyncV1Status =
    params.productPackage.status === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.productPackage.status === "REVIEW_REQUIRED" || review > 0
        ? "REVIEW_REQUIRED"
        : "SYNC_READY";

  return {
    schema: "bagastudio-viewer-sync-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceProductPackageSchema: params.productPackage.schema,
    sourceProductPackageStatus: params.productPackage.status,
    syncMode: "diagnostic_viewer_sync_v1",
    totals: {
      components: components.length,
      ready: components.filter((item) => item.status === "ready").length,
      review,
      blocked,
      skipped,
      metadataOnly: components.filter((item) => item.geometryMode === "metadata_only").length,
      geometryRequired,
    },
    components,
    viewerPatch: {
      keepsCurrentModelGeometry: true,
      updatesComponentMetadata: true,
      updatesFactoryMetadata: true,
      updatesBomMetadata: true,
      updatesHardwareMetadata: true,
      updatesCsvCixMetadata: true,
      readyForMaterialAccessoryLedWorkflow: status === "SYNC_READY",
    },
    recommendations: [
      status === "SYNC_READY"
        ? "Viewer Sync V1 pronto: applicare metadata produttivi al Product Package senza perdere materiali, accessori, LED e configurazione cliente."
        : "Correggere review/blocchi prima di usare il Viewer come anteprima commerciale del prodotto rigenerato.",
      "V1 è metadata-only: la modifica geometrica reale dei componenti arriverà con Structure Editor/Product Package Regeneration V2.",
      "Mantenere separati dati factory e dati cliente, così texture/accessori/LED restano applicabili anche dopo la rigenerazione.",
    ],
  };
}



export type ParametricStructureEditorV1Status = "STRUCTURE_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type ParametricStructureEditorV1Action = {
  componentId: string;
  displayName: string;
  actionType: "preserve_geometry" | "update_metadata" | "requires_structure_regeneration" | "blocked";
  status: "ready" | "review" | "blocked";
  sourceViewerStatus: ViewerSyncV1Component["status"];
  keepsExternalDimensions: boolean;
  editableTargets: string[];
  note: string;
};

export type ParametricStructureEditorV1Report = {
  schema: "bagastudio-parametric-structure-editor-v1";
  version: 1;
  generatedAt: string;
  status: ParametricStructureEditorV1Status;
  sourceViewerSyncSchema: ViewerSyncV1Report["schema"];
  sourceViewerSyncStatus: ViewerSyncV1Status;
  editorMode: "diagnostic_structure_editor_v1";
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    preserveGeometry: number;
    requiresRegeneration: number;
    metadataUpdates: number;
  };
  actions: ParametricStructureEditorV1Action[];
  structureRules: {
    keepExternalEnvelopeLocked: boolean;
    allowInternalRepartition: boolean;
    allowThicknessDrivenRecalculation: boolean;
    allowHardwareDrivenReposition: boolean;
    allowViewerMaterialWorkflowAfterEdit: boolean;
  };
  recommendations: string[];
};

export function buildParametricStructureEditorV1Report(params: {
  viewerSync: ViewerSyncV1Report;
}): ParametricStructureEditorV1Report {
  const actions: ParametricStructureEditorV1Action[] = params.viewerSync.components.map((item) => {
    const editableTargets = [
      "thicknessMetadata",
      "internalOffsets",
      "hardwareReferences",
      "bomReferences",
      "viewerComponentMetadata",
    ];

    if (item.status === "blocked") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        actionType: "blocked",
        status: "blocked",
        sourceViewerStatus: item.status,
        keepsExternalDimensions: true,
        editableTargets: [],
        note: "Bloccato: non modificare la struttura finché Viewer Sync/Product Package non sono corretti.",
      };
    }

    if (item.geometryMode === "geometry_regeneration_required" || item.status === "review") {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        actionType: "requires_structure_regeneration",
        status: "review",
        sourceViewerStatus: item.status,
        keepsExternalDimensions: true,
        editableTargets,
        note: "Richiede rigenerazione struttura: V1 prepara il piano di modifica mantenendo l'ingombro esterno bloccato.",
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      actionType: item.viewerSyncReady ? "update_metadata" : "preserve_geometry",
      status: "ready",
      sourceViewerStatus: item.status,
      keepsExternalDimensions: true,
      editableTargets,
      note: "Pronto: struttura modificabile a livello metadata/parametri, con Viewer ancora pronto per texture, accessori e LED.",
    };
  });

  const blocked = actions.filter((item) => item.status === "blocked").length;
  const review = actions.filter((item) => item.status === "review").length;
  const requiresRegeneration = actions.filter((item) => item.actionType === "requires_structure_regeneration").length;

  const status: ParametricStructureEditorV1Status =
    params.viewerSync.status === "BLOCKED" || blocked > 0
      ? "BLOCKED"
      : params.viewerSync.status === "REVIEW_REQUIRED" || review > 0
        ? "REVIEW_REQUIRED"
        : "STRUCTURE_READY";

  return {
    schema: "bagastudio-parametric-structure-editor-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceViewerSyncSchema: params.viewerSync.schema,
    sourceViewerSyncStatus: params.viewerSync.status,
    editorMode: "diagnostic_structure_editor_v1",
    totals: {
      components: actions.length,
      ready: actions.filter((item) => item.status === "ready").length,
      review,
      blocked,
      preserveGeometry: actions.filter((item) => item.actionType === "preserve_geometry").length,
      requiresRegeneration,
      metadataUpdates: actions.filter((item) => item.actionType === "update_metadata").length,
    },
    actions,
    structureRules: {
      keepExternalEnvelopeLocked: true,
      allowInternalRepartition: true,
      allowThicknessDrivenRecalculation: true,
      allowHardwareDrivenReposition: true,
      allowViewerMaterialWorkflowAfterEdit: status !== "BLOCKED",
    },
    recommendations: [
      status === "STRUCTURE_READY"
        ? "Structure Editor V1 pronto: applicare modifiche parametriche interne senza cambiare ingombro esterno del mobile."
        : "Correggere review/blocchi prima di generare una nuova struttura usabile nel Viewer.",
      "Questo step prepara il futuro editor reale: aggiunta divisori, modifica spessori, riallineamento ferramenta e mantenimento del workflow materiali/accessori/LED.",
      "Le geometrie reali non vengono ancora riscritte in V1: il report crea un piano controllato per Product Package Regeneration V2.",
    ],
  };
}



export type FactoryEngineV2Status = "FACTORY_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type FactoryEngineV2PhaseStatus = "ready" | "review" | "blocked";

export type FactoryEngineV2Phase = {
  id: string;
  label: string;
  status: FactoryEngineV2PhaseStatus;
  sourceSchema: string;
  note: string;
};

export type FactoryEngineV2Report = {
  schema: "bagastudio-factory-engine-v2";
  version: 2;
  generatedAt: string;
  status: FactoryEngineV2Status;
  sourceFactoryEngineSchema: FactoryEngineV1Report["schema"];
  sourceFactoryEngineStatus: FactoryEngineV1Status;
  sourceStructureEditorSchema: ParametricStructureEditorV1Report["schema"];
  sourceStructureEditorStatus: ParametricStructureEditorV1Status;
  factoryScore: number;
  phases: FactoryEngineV2Phase[];
  totals: {
    phases: number;
    ready: number;
    review: number;
    blocked: number;
    structureActions: number;
    structureReady: number;
    structureReview: number;
    structureBlocked: number;
  };
  viewerBridge: {
    productPackageRegenerationReady: boolean;
    viewerSyncReady: boolean;
    structureEditorReady: boolean;
    keepsExternalEnvelopeLocked: boolean;
    materialAccessoryLedWorkflowPreserved: boolean;
  };
  nextSteps: string[];
  recommendations: string[];
};

export function buildFactoryEngineV2Report(params: {
  factory: FactoryEngineV1Report;
  productPackage: ProductPackageRegenerationV1Report;
  viewerSync: ViewerSyncV1Report;
  structureEditor: ParametricStructureEditorV1Report;
}): FactoryEngineV2Report {
  const toPhaseStatus = (blocked: boolean, review: boolean): FactoryEngineV2PhaseStatus => {
    if (blocked) return "blocked";
    if (review) return "review";
    return "ready";
  };

  const phases: FactoryEngineV2Phase[] = [
    {
      id: "factory-engine-v1",
      label: "Factory Engine V1",
      status: toPhaseStatus(params.factory.factoryStatus === "BLOCKED", params.factory.factoryStatus === "REVIEW"),
      sourceSchema: params.factory.schema,
      note: `Stato sorgente: ${params.factory.factoryStatus}. Score ${params.factory.factoryScore}.`,
    },
    {
      id: "product-package-regeneration-v1",
      label: "Product Package Regeneration V1",
      status: toPhaseStatus(params.productPackage.status === "BLOCKED", params.productPackage.status === "REVIEW_REQUIRED"),
      sourceSchema: params.productPackage.schema,
      note: "Verifica patch Product Package e mantenimento dei riferimenti factory.",
    },
    {
      id: "viewer-sync-v1",
      label: "Viewer Sync V1",
      status: toPhaseStatus(params.viewerSync.status === "BLOCKED", params.viewerSync.status === "REVIEW_REQUIRED"),
      sourceSchema: params.viewerSync.schema,
      note: "Verifica ponte verso Viewer per texture, accessori, LED e configurazione cliente.",
    },
    {
      id: "parametric-structure-editor-v1",
      label: "Parametric Structure Editor V1",
      status: toPhaseStatus(params.structureEditor.status === "BLOCKED", params.structureEditor.status === "REVIEW_REQUIRED"),
      sourceSchema: params.structureEditor.schema,
      note: "Verifica modifiche struttura con ingombro esterno bloccato.",
    },
  ];

  const blocked = phases.filter((item) => item.status === "blocked").length;
  const review = phases.filter((item) => item.status === "review").length;
  const ready = phases.filter((item) => item.status === "ready").length;

  const status: FactoryEngineV2Status = blocked > 0 ? "BLOCKED" : review > 0 ? "REVIEW_REQUIRED" : "FACTORY_READY";

  const factoryScore = Math.max(
    0,
    Math.min(100, Math.round(params.factory.factoryScore - blocked * 18 - review * 7)),
  );

  return {
    schema: "bagastudio-factory-engine-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineSchema: params.factory.schema,
    sourceFactoryEngineStatus: params.factory.factoryStatus,
    sourceStructureEditorSchema: params.structureEditor.schema,
    sourceStructureEditorStatus: params.structureEditor.status,
    factoryScore,
    phases,
    totals: {
      phases: phases.length,
      ready,
      review,
      blocked,
      structureActions: params.structureEditor.totals.components,
      structureReady: params.structureEditor.totals.ready,
      structureReview: params.structureEditor.totals.review,
      structureBlocked: params.structureEditor.totals.blocked,
    },
    viewerBridge: {
      productPackageRegenerationReady: params.productPackage.status === "READY_TO_SYNC",
      viewerSyncReady: params.viewerSync.status === "SYNC_READY",
      structureEditorReady: params.structureEditor.status === "STRUCTURE_READY",
      keepsExternalEnvelopeLocked: params.structureEditor.structureRules.keepExternalEnvelopeLocked,
      materialAccessoryLedWorkflowPreserved: params.viewerSync.viewerPatch.readyForMaterialAccessoryLedWorkflow,
    },
    nextSteps: [
      "Product Package Regeneration V2 con geometria/componenti aggiornabili.",
      "Viewer Sync V2 con applicazione reale della patch al Product Package.",
      "CSV/CIX Regeneration reale con output produttivo scaricabile.",
    ],
    recommendations: [
      status === "FACTORY_READY"
        ? "Factory Engine V2 pronto: il flusso factory è coerente e può alimentare i prossimi step Product Package V2 / Viewer Sync V2."
        : "Correggere i blocchi/review indicati prima di procedere con rigenerazione reale della geometria o output macchina.",
      "Mantenere separati dati produttivi e configurazione cliente per non perdere materiali, texture, accessori e LED nel Viewer.",
      "Il prossimo step consigliato è Viewer Sync V2 o Product Package Regeneration V2, non una nuova feature laterale.",
    ],
  };
}



export type ProductPackageRegenerationV2Status = "PACKAGE_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type ProductPackageRegenerationV2PatchStatus = "ready" | "review" | "blocked";

export type ProductPackageRegenerationV2Patch = {
  id: string;
  componentId: string;
  displayName: string;
  patchType: "preserve_geometry" | "update_metadata" | "regenerate_structure" | "review_required";
  status: ProductPackageRegenerationV2PatchStatus;
  keepsCustomerConfiguration: boolean;
  keepsExternalEnvelopeLocked: boolean;
  viewerSyncHint: string;
  note: string;
};

export type ProductPackageRegenerationV2Report = {
  schema: "bagastudio-product-package-regeneration-v2";
  version: 2;
  generatedAt: string;
  status: ProductPackageRegenerationV2Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  sourceProductPackageV1Schema: ProductPackageRegenerationV1Report["schema"];
  sourceViewerSyncV1Schema: ViewerSyncV1Report["schema"];
  sourceStructureEditorV1Schema: ParametricStructureEditorV1Report["schema"];
  totals: {
    patches: number;
    ready: number;
    review: number;
    blocked: number;
    preserveGeometry: number;
    metadataUpdates: number;
    structureRegeneration: number;
  };
  packageRules: {
    preserveMaterials: boolean;
    preserveAccessories: boolean;
    preserveLedConfiguration: boolean;
    preserveCustomerConfiguration: boolean;
    keepExternalEnvelopeLocked: boolean;
    regenerateComponentsMetadataOnly: boolean;
  };
  patches: ProductPackageRegenerationV2Patch[];
  recommendations: string[];
};

export function buildProductPackageRegenerationV2Report(params: {
  factoryV2: FactoryEngineV2Report;
  productPackageV1: ProductPackageRegenerationV1Report;
  viewerSyncV1: ViewerSyncV1Report;
  structureEditorV1: ParametricStructureEditorV1Report;
}): ProductPackageRegenerationV2Report {
  const v1Components = params.productPackageV1.components ?? [];
  const structureActions = params.structureEditorV1.actions ?? [];
  const actionByComponentId = new Map(structureActions.map((item) => [item.componentId, item]));

  const patches: ProductPackageRegenerationV2Patch[] = v1Components.map((component) => {
    const structureAction = actionByComponentId.get(component.componentId);
    const hasFactoryBlock = params.factoryV2.status === "BLOCKED" || component.status === "blocked" || structureAction?.status === "blocked";
    const requiresReview = params.factoryV2.status === "REVIEW_REQUIRED" || component.status === "review" || structureAction?.status === "review";
    const requiresStructureRegeneration = structureAction?.actionType === "requires_structure_regeneration";

    const status: ProductPackageRegenerationV2PatchStatus = hasFactoryBlock ? "blocked" : requiresReview ? "review" : "ready";

    const patchType: ProductPackageRegenerationV2Patch["patchType"] = hasFactoryBlock
      ? "review_required"
      : requiresStructureRegeneration
        ? "regenerate_structure"
        : component.viewerSyncReady
          ? "update_metadata"
          : "preserve_geometry";

    return {
      id: `pp-v2-${component.componentId}`,
      componentId: component.componentId,
      displayName: component.displayName,
      patchType,
      status,
      keepsCustomerConfiguration: status !== "blocked",
      keepsExternalEnvelopeLocked: structureAction?.keepsExternalDimensions ?? true,
      viewerSyncHint: status === "blocked"
        ? "Non sincronizzare nel Viewer finché i blocchi factory non sono risolti."
        : requiresStructureRegeneration
          ? "Preparare geometria/metadata aggiornati per Viewer Sync V2 mantenendo materiali, accessori e LED."
          : "Sincronizzazione metadata-only compatibile con Viewer Sync V2.",
      note: structureAction?.note ?? component.note,
    };
  });

  const blocked = patches.filter((item) => item.status === "blocked").length;
  const review = patches.filter((item) => item.status === "review").length;
  const ready = patches.filter((item) => item.status === "ready").length;

  const status: ProductPackageRegenerationV2Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "PACKAGE_READY";

  return {
    schema: "bagastudio-product-package-regeneration-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    sourceProductPackageV1Schema: params.productPackageV1.schema,
    sourceViewerSyncV1Schema: params.viewerSyncV1.schema,
    sourceStructureEditorV1Schema: params.structureEditorV1.schema,
    totals: {
      patches: patches.length,
      ready,
      review,
      blocked,
      preserveGeometry: patches.filter((item) => item.patchType === "preserve_geometry").length,
      metadataUpdates: patches.filter((item) => item.patchType === "update_metadata").length,
      structureRegeneration: patches.filter((item) => item.patchType === "regenerate_structure").length,
    },
    packageRules: {
      preserveMaterials: true,
      preserveAccessories: true,
      preserveLedConfiguration: true,
      preserveCustomerConfiguration: true,
      keepExternalEnvelopeLocked: params.structureEditorV1.structureRules.keepExternalEnvelopeLocked,
      regenerateComponentsMetadataOnly: status !== "BLOCKED",
    },
    patches,
    recommendations: [
      status === "PACKAGE_READY"
        ? "Product Package Regeneration V2 pronto: il pacchetto può alimentare Viewer Sync V2 senza perdere materiali, accessori e LED del cliente."
        : "Correggere review/blocchi prima di applicare la patch Product Package al Viewer.",
      "Mantenere separata la configurazione cliente dal layer produttivo: materiali, texture, accessori, LED e Kelvin non devono essere sovrascritti dalle modifiche factory.",
      "Questo step resta diagnostico: la riscrittura reale della geometria/componenti arriverà con Product Package Regeneration V3 / Viewer Sync V2 applicativo.",
    ],
  };
}



export type ViewerSyncV2Status = "VIEWER_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type ViewerSyncV2SyncMode = "metadata_only" | "geometry_patch" | "structure_regeneration" | "blocked";

export type ViewerSyncV2ItemStatus = "ready" | "review" | "blocked";

export type ViewerSyncV2Item = {
  id: string;
  componentId: string;
  displayName: string;
  syncMode: ViewerSyncV2SyncMode;
  status: ViewerSyncV2ItemStatus;
  preservesMaterials: boolean;
  preservesAccessories: boolean;
  preservesLedConfiguration: boolean;
  preservesCustomerConfiguration: boolean;
  requiresViewerRefresh: boolean;
  requiresGeometryRebuild: boolean;
  note: string;
};

export type ViewerSyncV2Report = {
  schema: "bagastudio-viewer-sync-v2";
  version: 2;
  generatedAt: string;
  status: ViewerSyncV2Status;
  sourceProductPackageV2Schema: ProductPackageRegenerationV2Report["schema"];
  sourceProductPackageV2Status: ProductPackageRegenerationV2Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    metadataOnly: number;
    geometryPatch: number;
    structureRegeneration: number;
  };
  viewerRules: {
    preserveExistingMaterials: boolean;
    preserveExistingAccessories: boolean;
    preserveExistingLedAndKelvin: boolean;
    preserveCustomerSelections: boolean;
    allowMetadataOnlySync: boolean;
    requireManualReviewBeforeGeometryRebuild: boolean;
  };
  items: ViewerSyncV2Item[];
  recommendations: string[];
};

export function buildViewerSyncV2Report(params: {
  productPackageV2: ProductPackageRegenerationV2Report;
  factoryV2: FactoryEngineV2Report;
}): ViewerSyncV2Report {
  const items: ViewerSyncV2Item[] = params.productPackageV2.patches.map((patch) => {
    const requiresGeometryRebuild = patch.patchType === "regenerate_structure";
    const isBlocked = patch.status === "blocked" || params.factoryV2.status === "BLOCKED";
    const requiresReview = patch.status === "review" || params.factoryV2.status === "REVIEW_REQUIRED" || requiresGeometryRebuild;

    const syncMode: ViewerSyncV2SyncMode = isBlocked
      ? "blocked"
      : requiresGeometryRebuild
        ? "structure_regeneration"
        : patch.patchType === "update_metadata"
          ? "metadata_only"
          : "geometry_patch";

    const status: ViewerSyncV2ItemStatus = isBlocked ? "blocked" : requiresReview ? "review" : "ready";

    return {
      id: `viewer-sync-v2-${patch.componentId}`,
      componentId: patch.componentId,
      displayName: patch.displayName,
      syncMode,
      status,
      preservesMaterials: patch.keepsCustomerConfiguration,
      preservesAccessories: patch.keepsCustomerConfiguration,
      preservesLedConfiguration: patch.keepsCustomerConfiguration,
      preservesCustomerConfiguration: patch.keepsCustomerConfiguration,
      requiresViewerRefresh: status !== "blocked",
      requiresGeometryRebuild,
      note: status === "blocked"
        ? "Bloccato: risolvere prima gli errori factory o Product Package."
        : requiresGeometryRebuild
          ? "Review richiesta: struttura modificata, sincronizzare nel Viewer solo dopo conferma geometria/Product Package."
          : "Sincronizzazione Viewer V2 pronta senza sovrascrivere materiali, accessori, LED e configurazione cliente.",
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const ready = items.filter((item) => item.status === "ready").length;

  const status: ViewerSyncV2Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "VIEWER_READY";

  return {
    schema: "bagastudio-viewer-sync-v2",
    version: 2,
    generatedAt: new Date().toISOString(),
    status,
    sourceProductPackageV2Schema: params.productPackageV2.schema,
    sourceProductPackageV2Status: params.productPackageV2.status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    totals: {
      components: items.length,
      ready,
      review,
      blocked,
      metadataOnly: items.filter((item) => item.syncMode === "metadata_only").length,
      geometryPatch: items.filter((item) => item.syncMode === "geometry_patch").length,
      structureRegeneration: items.filter((item) => item.syncMode === "structure_regeneration").length,
    },
    viewerRules: {
      preserveExistingMaterials: true,
      preserveExistingAccessories: true,
      preserveExistingLedAndKelvin: true,
      preserveCustomerSelections: true,
      allowMetadataOnlySync: status !== "BLOCKED",
      requireManualReviewBeforeGeometryRebuild: true,
    },
    items,
    recommendations: [
      status === "VIEWER_READY"
        ? "Viewer Sync V2 pronto: il Viewer può ricevere la patch Product Package preservando materiali, accessori e LED scelti dal cliente."
        : "Prima della sincronizzazione Viewer risolvere blocchi/review segnalati da Product Package V2 e Factory Engine V2.",
      "Separare sempre il layer factory dal layer commerciale: la rigenerazione produttiva non deve cancellare texture, accessori, LED, Kelvin e configurazione cliente.",
      "Le modifiche strutturali richiedono conferma manuale prima del rebuild geometrico completo nel Viewer.",
    ],
  };
}



export type FactoryProductionPackageV1Status = "PRODUCTION_READY" | "REVIEW_REQUIRED" | "BLOCKED";

export type FactoryProductionPackageV1ItemStatus = "ready" | "review" | "blocked";

export type FactoryProductionPackageV1Item = {
  id: string;
  componentId: string;
  displayName: string;
  status: FactoryProductionPackageV1ItemStatus;
  includeInFactoryPackage: boolean;
  includeInViewerPackage: boolean;
  includeInCsvCixExport: boolean;
  includeInBom: boolean;
  preservesCustomerConfiguration: boolean;
  note: string;
};

export type FactoryProductionPackageV1Report = {
  schema: "bagastudio-factory-production-package-v1";
  version: 1;
  generatedAt: string;
  status: FactoryProductionPackageV1Status;
  sourceFactoryEngineV2Schema: FactoryEngineV2Report["schema"];
  sourceFactoryEngineV2Status: FactoryEngineV2Status;
  sourceProductPackageV2Schema: ProductPackageRegenerationV2Report["schema"];
  sourceProductPackageV2Status: ProductPackageRegenerationV2Status;
  sourceViewerSyncV2Schema: ViewerSyncV2Report["schema"];
  sourceViewerSyncV2Status: ViewerSyncV2Status;
  totals: {
    components: number;
    ready: number;
    review: number;
    blocked: number;
    factoryIncluded: number;
    viewerIncluded: number;
    csvCixIncluded: number;
    bomIncluded: number;
  };
  packageRules: {
    requireFactoryReady: boolean;
    requireViewerSyncReady: boolean;
    preserveCustomerMaterialsAccessoriesLed: boolean;
    includeCsvCixPayload: boolean;
    includeBomPayload: boolean;
    requireManualApprovalOnReview: boolean;
  };
  items: FactoryProductionPackageV1Item[];
  recommendations: string[];
};

export function buildFactoryProductionPackageV1Report(params: {
  factoryV2: FactoryEngineV2Report;
  productPackageV2: ProductPackageRegenerationV2Report;
  viewerSyncV2: ViewerSyncV2Report;
}): FactoryProductionPackageV1Report {
  const items: FactoryProductionPackageV1Item[] = params.viewerSyncV2.items.map((viewerItem) => {
    const productPatch = params.productPackageV2.patches.find((patch) => patch.componentId === viewerItem.componentId);
    const isBlocked = viewerItem.status === "blocked" || params.factoryV2.status === "BLOCKED" || params.productPackageV2.status === "BLOCKED";
    const requiresReview = viewerItem.status === "review" || params.factoryV2.status === "REVIEW_REQUIRED" || params.productPackageV2.status === "REVIEW_REQUIRED";
    const status: FactoryProductionPackageV1ItemStatus = isBlocked ? "blocked" : requiresReview ? "review" : "ready";

    return {
      id: `factory-production-package-v1-${viewerItem.componentId}`,
      componentId: viewerItem.componentId,
      displayName: viewerItem.displayName,
      status,
      includeInFactoryPackage: status !== "blocked",
      includeInViewerPackage: status !== "blocked" && viewerItem.requiresViewerRefresh,
      includeInCsvCixExport: status !== "blocked" && !!productPatch,
      includeInBom: status !== "blocked",
      preservesCustomerConfiguration: viewerItem.preservesCustomerConfiguration,
      note: status === "blocked"
        ? "Componente escluso dal pacchetto produzione: risolvere blocchi factory/Product Package/Viewer Sync."
        : status === "review"
          ? "Componente inseribile solo dopo approvazione tecnica manuale."
          : "Componente pronto per pacchetto produzione con configurazione cliente preservata.",
    };
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const ready = items.filter((item) => item.status === "ready").length;

  const status: FactoryProductionPackageV1Status = blocked > 0
    ? "BLOCKED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : "PRODUCTION_READY";

  return {
    schema: "bagastudio-factory-production-package-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceFactoryEngineV2Schema: params.factoryV2.schema,
    sourceFactoryEngineV2Status: params.factoryV2.status,
    sourceProductPackageV2Schema: params.productPackageV2.schema,
    sourceProductPackageV2Status: params.productPackageV2.status,
    sourceViewerSyncV2Schema: params.viewerSyncV2.schema,
    sourceViewerSyncV2Status: params.viewerSyncV2.status,
    totals: {
      components: items.length,
      ready,
      review,
      blocked,
      factoryIncluded: items.filter((item) => item.includeInFactoryPackage).length,
      viewerIncluded: items.filter((item) => item.includeInViewerPackage).length,
      csvCixIncluded: items.filter((item) => item.includeInCsvCixExport).length,
      bomIncluded: items.filter((item) => item.includeInBom).length,
    },
    packageRules: {
      requireFactoryReady: true,
      requireViewerSyncReady: true,
      preserveCustomerMaterialsAccessoriesLed: true,
      includeCsvCixPayload: true,
      includeBomPayload: true,
      requireManualApprovalOnReview: true,
    },
    items,
    recommendations: [
      status === "PRODUCTION_READY"
        ? "Factory Production Package V1 pronto: il progetto può essere consegnato al flusso produzione mantenendo il ponte Viewer/Product Package."
        : "Prima della consegna produzione risolvere i blocchi o approvare manualmente gli elementi in review.",
      "Il pacchetto produzione deve includere CSV/CIX, BOM, report factory, Product Package rigenerato e istruzioni Viewer Sync senza cancellare la configurazione cliente.",
      "Questo step resta diagnostico: la generazione fisica dei file finali arriverà con Factory Production Package V2 / Export Bundle reale.",
    ],
  };
}

