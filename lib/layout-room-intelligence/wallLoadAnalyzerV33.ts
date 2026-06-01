export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type WallIntelligenceV30CheckStatus = "ready" | "review" | "blocked";
export type WallIntelligenceV30WallType = "unknown" | "drywall" | "masonry" | "concrete" | "wood" | "technical";

type WallIntelligenceV32ConfidenceCard = {
  id: string;
  sourceWallCardId: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  confidenceScore: number;
};

export type WallIntelligenceConfidenceEngineV32Report = {
  schema: string;
  confidenceCards: WallIntelligenceV32ConfidenceCard[];
};

type WallIntelligenceV30WallProfile = {
  id: string;
  wallType: WallIntelligenceV30WallType;
};

export type WallIntelligenceEngineV30Report = {
  wallProfiles: WallIntelligenceV30WallProfile[];
};

export type WallIntelligenceV33LoadRisk = "safe" | "review" | "critical";
export type WallIntelligenceV33LoadCategory = "mirror" | "shelf" | "suspended_cabinet" | "wall_panel" | "technical_equipment";

export type WallIntelligenceV33LoadTarget = {
  id: string;
  label: string;
  category: WallIntelligenceV33LoadCategory;
  linkedWallCardId: string;
  estimatedWeightKg: number;
  projectedLoadKg: number;
  fixingPoints: number;
  loadPerFixingKg: number;
  wallCapacityKg: number | null;
  safetyFactor: number;
  confidenceScore: number;
  risk: WallIntelligenceV33LoadRisk;
  validatorDecision: WallIntelligenceV30CheckStatus;
  warnings: string[];
  recommendations: string[];
};

export type WallIntelligenceLoadAnalyzerV33Report = {
  schema: "bagastudio-wall-intelligence-load-analyzer-v3-3";
  version: "3.3";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceConfidenceSchema: WallIntelligenceConfidenceEngineV32Report["schema"];
  analysisPrinciples: {
    clientDescriptionFirst: boolean;
    confidenceAffectsLoadDecision: boolean;
    installerVerificationForCriticalLoads: boolean;
    doesNotCertifyStructuralSafety: boolean;
  };
  loadTargets: WallIntelligenceV33LoadTarget[];
  totals: {
    targets: number;
    safe: number;
    review: number;
    critical: number;
    blocked: number;
    warnings: number;
  };
  nextActions: string[];
};

export function buildWallIntelligenceLoadAnalyzerV33Report(params: {
  confidenceEngineV32: WallIntelligenceConfidenceEngineV32Report;
  wallEngineV30: WallIntelligenceEngineV30Report;
}): WallIntelligenceLoadAnalyzerV33Report {
  const wallCapacityByType: Record<WallIntelligenceV30WallType, number | null> = {
    masonry: 80,
    concrete: 120,
    wood: 55,
    technical: 45,
    drywall: 25,
    unknown: null,
  };

  const getWallCapacity = (wallType: WallIntelligenceV30WallType) => wallCapacityByType[wallType] ?? null;

  const demoTargetsByCategory: Array<{
    category: WallIntelligenceV33LoadCategory;
    label: string;
    estimatedWeightKg: number;
    fixingPoints: number;
    safetyFactor: number;
  }> = [
    { category: "mirror", label: "Specchio / pannello specchio", estimatedWeightKg: 18, fixingPoints: 4, safetyFactor: 1.35 },
    { category: "shelf", label: "Mensola sospesa con carico prodotti", estimatedWeightKg: 22, fixingPoints: 3, safetyFactor: 1.5 },
    { category: "suspended_cabinet", label: "Pensile / mobile sospeso", estimatedWeightKg: 38, fixingPoints: 6, safetyFactor: 1.6 },
  ];

  const loadTargets = params.confidenceEngineV32.confidenceCards.flatMap((confidenceCard) => {
    const wallProfile = params.wallEngineV30.wallProfiles.find((wall) =>
      confidenceCard.sourceWallCardId.includes(wall.id)
    );
    const wallType = wallProfile?.wallType ?? confidenceCard.wallType;
    const wallCapacityKg = getWallCapacity(wallType);

    return demoTargetsByCategory.map((target, index): WallIntelligenceV33LoadTarget => {
      const projectedLoadKg = Math.round(target.estimatedWeightKg * target.safetyFactor * 10) / 10;
      const loadPerFixingKg = Math.round((projectedLoadKg / Math.max(1, target.fixingPoints)) * 10) / 10;
      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (wallCapacityKg === null) {
        warnings.push("Capacità parete sconosciuta: impossibile validare il carico in modo affidabile.");
        recommendations.push("Richiedere tipo parete e descrizione cliente prima della scheda tecnica definitiva.");
      } else if (projectedLoadKg > wallCapacityKg) {
        warnings.push(`Carico proiettato ${projectedLoadKg} kg superiore alla capacità stimata parete ${wallCapacityKg} kg.`);
        recommendations.push("Ridurre carico, aumentare punti fissaggio o prevedere rinforzo/supporto strutturale.");
      } else if (projectedLoadKg > wallCapacityKg * 0.7) {
        warnings.push(`Carico proiettato vicino alla soglia: ${projectedLoadKg} kg su ${wallCapacityKg} kg stimati.`);
        recommendations.push("Verifica installatore consigliata e ferramenta certificata per il supporto reale.");
      }

      if (confidenceCard.confidenceScore <= 40) {
        warnings.push("Confidenza parete bassa: il carico non deve essere confermato senza sopralluogo/verifica.");
        recommendations.push("Aggiungere foto, DWG/DXF, nota installatore o descrizione parete completa.");
      } else if (confidenceCard.confidenceScore <= 70) {
        warnings.push("Confidenza media: usare il risultato come pre-analisi, non come conferma definitiva.");
        recommendations.push("Integrare evidenze e confermare fissaggi prima della produzione/installazione.");
      }

      if (wallType === "drywall" && target.category !== "mirror") {
        warnings.push("Cartongesso con elemento caricato: verificare montanti o rinforzi dedicati.");
        recommendations.push("Preferire ancoraggio su montante, rinforzo o staffa strutturale.");
      }

      const risk: WallIntelligenceV33LoadRisk =
        wallCapacityKg === null || projectedLoadKg > (wallCapacityKg ?? 0) || confidenceCard.confidenceScore <= 40
          ? "critical"
          : warnings.length > 0 || confidenceCard.confidenceScore <= 70
            ? "review"
            : "safe";

      return {
        id: `v3-3-load-${confidenceCard.id}-${index}`,
        label: `${target.label} · ${confidenceCard.label}`,
        category: target.category,
        linkedWallCardId: confidenceCard.id,
        estimatedWeightKg: target.estimatedWeightKg,
        projectedLoadKg,
        fixingPoints: target.fixingPoints,
        loadPerFixingKg,
        wallCapacityKg,
        safetyFactor: target.safetyFactor,
        confidenceScore: confidenceCard.confidenceScore,
        risk,
        validatorDecision: risk === "critical" ? "blocked" : risk === "review" ? "review" : "ready",
        warnings,
        recommendations,
      };
    });
  });

  const critical = loadTargets.filter((target) => target.risk === "critical").length;
  const review = loadTargets.filter((target) => target.risk === "review").length;
  const blocked = loadTargets.filter((target) => target.validatorDecision === "blocked").length;

  return {
    schema: "bagastudio-wall-intelligence-load-analyzer-v3-3",
    version: "3.3",
    generatedAt: new Date().toISOString(),
    status: blocked > 0
      ? "LAYOUT_V2_BLOCKED"
      : review > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceConfidenceSchema: params.confidenceEngineV32.schema,
    analysisPrinciples: {
      clientDescriptionFirst: true,
      confidenceAffectsLoadDecision: true,
      installerVerificationForCriticalLoads: true,
      doesNotCertifyStructuralSafety: true,
    },
    loadTargets,
    totals: {
      targets: loadTargets.length,
      safe: loadTargets.filter((target) => target.risk === "safe").length,
      review,
      critical,
      blocked,
      warnings: loadTargets.reduce((sum, target) => sum + target.warnings.length, 0),
    },
    nextActions: [
      "Collegare peso reale dei mobili Product Package al Wall Load Analyzer.",
      "Aggiungere campi Admin per peso stimato, punti fissaggio, fattore sicurezza e carico previsto.",
      "Preparare V3.4: Fixing Recommendation Engine con ferramenta suggerita in base a parete, peso e rischio.",
      "Usare i risultati V3.3 nei gate di schede tecniche PDF/DXF/CAD e preventivo installazione.",
    ],
  };
}

