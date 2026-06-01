export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type WallIntelligenceV30WallType = "unknown" | "drywall" | "masonry" | "concrete" | "wood" | "technical";
export type WallIntelligenceV33LoadCategory = "mirror" | "shelf" | "suspended_cabinet" | "other" | string;

type WallIntelligenceV32ConfidenceCard = {
  id: string;
  wallType: WallIntelligenceV30WallType;
};

type WallIntelligenceConfidenceEngineV32Report = {
  confidenceCards: WallIntelligenceV32ConfidenceCard[];
};

type WallIntelligenceV33LoadTarget = {
  id: string;
  linkedWallCardId: string;
  label: string;
  category: WallIntelligenceV33LoadCategory;
  loadPerFixingKg: number;
  confidenceScore: number;
  risk: "safe" | "review" | "critical" | string;
  fixingPoints: number;
  warnings: string[];
};

type WallIntelligenceLoadAnalyzerV33Report = {
  schema: string;
  loadTargets: WallIntelligenceV33LoadTarget[];
};

export type WallIntelligenceV34RecommendationStatus = "safe" | "warning" | "critical";
export type WallIntelligenceV34HardwareFamily =
  | "nylon_plug"
  | "molly_anchor"
  | "structural_anchor"
  | "load_distribution_bar"
  | "wood_screw"
  | "site_survey_required";

export type WallIntelligenceV34FixingRecommendation = {
  id: string;
  sourceLoadTargetId: string;
  label: string;
  category: WallIntelligenceV33LoadCategory;
  wallType: WallIntelligenceV30WallType;
  status: WallIntelligenceV34RecommendationStatus;
  hardwareFamily: WallIntelligenceV34HardwareFamily;
  suggestedHardware: string[];
  fixingStrategy: string;
  minimumFixingPoints: number;
  recommendedFixingPoints: number;
  loadPerFixingKg: number;
  confidenceScore: number;
  installerRequired: boolean;
  reasons: string[];
  warnings: string[];
};

export type WallIntelligenceFixingRecommendationV34Report = {
  schema: "bagastudio-wall-intelligence-fixing-recommendation-v3-4";
  version: "3.4";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLoadAnalyzerSchema: WallIntelligenceLoadAnalyzerV33Report["schema"];
  recommendationPrinciples: {
    clientDescriptionFirst: boolean;
    fixingDependsOnWallType: boolean;
    lowConfidenceRequiresInstallerVerification: boolean;
    recommendationIsPreliminary: boolean;
  };
  recommendations: WallIntelligenceV34FixingRecommendation[];
  totals: {
    recommendations: number;
    safe: number;
    warning: number;
    critical: number;
    installerRequired: number;
    drywallWarnings: number;
  };
  nextActions: string[];
};

export function buildWallIntelligenceFixingRecommendationV34Report(params: {
  loadAnalyzerV33: WallIntelligenceLoadAnalyzerV33Report;
  confidenceEngineV32: WallIntelligenceConfidenceEngineV32Report;
}): WallIntelligenceFixingRecommendationV34Report {
  const confidenceById = new Map<string, WallIntelligenceV32ConfidenceCard>();
  params.confidenceEngineV32.confidenceCards.forEach((card) => {
    confidenceById.set(card.id, card);
  });

  const getBaseRecommendation = (
    wallType: WallIntelligenceV30WallType,
    category: WallIntelligenceV33LoadCategory,
    loadPerFixingKg: number
  ): Pick<WallIntelligenceV34FixingRecommendation, "hardwareFamily" | "suggestedHardware" | "fixingStrategy"> => {
    if (wallType === "unknown") {
      return {
        hardwareFamily: "site_survey_required",
        suggestedHardware: ["Sopralluogo tecnico", "Verifica supporto reale", "Definizione ferramenta dopo identificazione parete"],
        fixingStrategy: "Bloccare conferma fissaggi finché il cliente/installatore non descrive la parete o allega evidenze.",
      };
    }

    if (wallType === "drywall") {
      if (category === "mirror" && loadPerFixingKg <= 6) {
        return {
          hardwareFamily: "molly_anchor",
          suggestedHardware: ["Tassello metallico Molly", "Fissaggi multipli", "Verifica presenza montanti"],
          fixingStrategy: "Distribuire il carico su più punti e preferire sempre montante o rinforzo quando disponibile.",
        };
      }

      return {
        hardwareFamily: "load_distribution_bar",
        suggestedHardware: ["Barra distribuzione carico", "Ancoraggio su montante", "Rinforzo interno cartongesso", "Verifica installatore"],
        fixingStrategy: "Non affidare carichi importanti al solo cartongesso; cercare montanti o predisporre rinforzo strutturale.",
      };
    }

    if (wallType === "concrete") {
      return {
        hardwareFamily: "structural_anchor",
        suggestedHardware: ["Tassello meccanico per calcestruzzo", "Ancorante certificato", "Barra sospensione per pensili"],
        fixingStrategy: "Usare fissaggi strutturali dimensionati in base al peso e distribuire il carico sui punti previsti.",
      };
    }

    if (wallType === "wood") {
      return {
        hardwareFamily: "wood_screw",
        suggestedHardware: ["Viti strutturali per legno", "Pre-foro controllato", "Rondelle o piastra di ripartizione"],
        fixingStrategy: "Ancorare su elemento pieno/strutturale e verificare spessore reale del supporto.",
      };
    }

    if (wallType === "technical") {
      return {
        hardwareFamily: "site_survey_required",
        suggestedHardware: ["Verifica stratigrafia parete tecnica", "Fissaggio su struttura interna", "Piastra di ripartizione"],
        fixingStrategy: "Trattare la parete tecnica come supporto da verificare: servono stratigrafia e punti strutturali.",
      };
    }

    return {
      hardwareFamily: "nylon_plug",
      suggestedHardware: loadPerFixingKg > 12
        ? ["Tassello nylon maggiorato", "Barra distribuzione carico", "Fissaggio multiplo"]
        : ["Tassello nylon 8/10 mm", "Viti adeguate al supporto", "Fissaggi multipli"],
      fixingStrategy: "Distribuire il carico sulla muratura e usare diametro/lunghezza tassello coerenti con peso e supporto.",
    };
  };

  const recommendations = params.loadAnalyzerV33.loadTargets.map((target): WallIntelligenceV34FixingRecommendation => {
    const confidenceCard = confidenceById.get(target.linkedWallCardId);
    const wallType = confidenceCard?.wallType || "unknown";
    const base = getBaseRecommendation(wallType, target.category, target.loadPerFixingKg);

    const reasons: string[] = [];
    const warnings = [...target.warnings];

    reasons.push(`Parete: ${wallType}`);
    reasons.push(`Carico per fissaggio: ${target.loadPerFixingKg} kg`);
    reasons.push(`Confidenza dati parete: ${target.confidenceScore}%`);

    if (target.risk === "critical") {
      warnings.push("Rischio carico critico da Wall Load Analyzer V3.3.");
    }

    if (target.confidenceScore <= 40) {
      warnings.push("Confidenza bassa: raccomandazione solo preliminare.");
    }

    if (wallType === "drywall") {
      warnings.push("Cartongesso: verificare sempre montante/rinforzo prima di carichi sospesi.");
    }

    if (target.category === "suspended_cabinet") {
      reasons.push("Pensile/mobile sospeso: richiede distribuzione carico e fissaggi ridondanti.");
    }

    if (target.category === "shelf") {
      reasons.push("Mensola caricata: controllare momento e profondità, non solo peso verticale.");
    }

    const minimumFixingPoints = Math.max(2, target.fixingPoints);
    const recommendedFixingPoints = target.risk === "critical" || wallType === "drywall"
      ? Math.max(minimumFixingPoints + 2, 4)
      : target.risk === "review"
        ? Math.max(minimumFixingPoints + 1, 3)
        : minimumFixingPoints;

    const installerRequired =
      target.risk === "critical" ||
      target.confidenceScore <= 70 ||
      wallType === "unknown" ||
      wallType === "technical" ||
      (wallType === "drywall" && target.category !== "mirror");

    const status: WallIntelligenceV34RecommendationStatus =
      target.risk === "critical" || wallType === "unknown"
        ? "critical"
        : installerRequired || target.risk === "review" || warnings.length > 0
          ? "warning"
          : "safe";

    return {
      id: `v3-4-fixing-${target.id}`,
      sourceLoadTargetId: target.id,
      label: target.label,
      category: target.category,
      wallType,
      status,
      hardwareFamily: base.hardwareFamily,
      suggestedHardware: base.suggestedHardware,
      fixingStrategy: base.fixingStrategy,
      minimumFixingPoints,
      recommendedFixingPoints,
      loadPerFixingKg: target.loadPerFixingKg,
      confidenceScore: target.confidenceScore,
      installerRequired,
      reasons,
      warnings: Array.from(new Set(warnings)),
    };
  });

  const critical = recommendations.filter((item) => item.status === "critical").length;
  const warning = recommendations.filter((item) => item.status === "warning").length;

  return {
    schema: "bagastudio-wall-intelligence-fixing-recommendation-v3-4",
    version: "3.4",
    generatedAt: new Date().toISOString(),
    status: critical > 0
      ? "LAYOUT_V2_BLOCKED"
      : warning > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceLoadAnalyzerSchema: params.loadAnalyzerV33.schema,
    recommendationPrinciples: {
      clientDescriptionFirst: true,
      fixingDependsOnWallType: true,
      lowConfidenceRequiresInstallerVerification: true,
      recommendationIsPreliminary: true,
    },
    recommendations,
    totals: {
      recommendations: recommendations.length,
      safe: recommendations.filter((item) => item.status === "safe").length,
      warning,
      critical,
      installerRequired: recommendations.filter((item) => item.installerRequired).length,
      drywallWarnings: recommendations.filter((item) => item.wallType === "drywall").length,
    },
    nextActions: [
      "Collegare il Fixing Recommendation Engine alle schede tecniche parete PDF/DXF/CAD.",
      "Aggiungere in Admin una libreria ferramenta fissaggi editabile e JSON-driven.",
      "Preparare V3.5: Mirror & Shelf Validator con regole specifiche per specchi, mensole e pensili.",
      "In futuro aumentare la confidenza tramite foto, DWG/DXF o nota installatore senza rifare il profilo parete.",
    ],
  };
}

