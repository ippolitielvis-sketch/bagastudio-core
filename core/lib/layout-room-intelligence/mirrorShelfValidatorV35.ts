export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type WallIntelligenceV30WallType = "unknown" | "drywall" | "masonry" | "concrete" | "wood" | "technical";
export type WallIntelligenceV33LoadCategory = "mirror" | "shelf" | "suspended_cabinet" | "other" | string;

type WallIntelligenceFixingRecommendationV34ItemLike = {
  id: string;
  label: string;
  category: WallIntelligenceV33LoadCategory;
  wallType: WallIntelligenceV30WallType;
  status: "safe" | "warning" | "critical" | string;
  recommendedFixingPoints: number;
  loadPerFixingKg: number;
  confidenceScore: number;
  installerRequired: boolean;
};

type WallIntelligenceFixingRecommendationV34ReportLike = {
  schema: string;
  recommendations: WallIntelligenceFixingRecommendationV34ItemLike[];
};

type LayoutRoomIntelligenceV25ReportLike = {
  stationSpacingChecks: Array<{
    stationType: "barber" | "esthetician" | string;
    passed: boolean;
    severity: "info" | "warning" | "critical" | string;
  }>;
};

export type WallIntelligenceV35ValidationStatus = "ready" | "review" | "blocked";
export type WallIntelligenceV35MountingClass = "mirror" | "shelf" | "suspended_cabinet" | "other";

export type WallIntelligenceV35ValidatedItem = {
  id: string;
  sourceRecommendationId: string;
  label: string;
  mountingClass: WallIntelligenceV35MountingClass;
  wallType: WallIntelligenceV30WallType;
  status: WallIntelligenceV35ValidationStatus;
  minimumSpacingCm: number | null;
  recommendedFixingPoints: number;
  loadPerFixingKg: number;
  confidenceScore: number;
  checks: Array<{
    code: string;
    label: string;
    passed: boolean;
    severity: "info" | "warning" | "error";
    message: string;
  }>;
  installationNotes: string[];
};

export type WallIntelligenceMirrorShelfValidatorV35Report = {
  schema: "bagastudio-wall-intelligence-mirror-shelf-validator-v3-5";
  version: "3.5";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceFixingRecommendationSchema: string;
  validatorPrinciples: {
    mirrorsFollowStationSpacing: boolean;
    shelvesRequireLoadAndDepthReview: boolean;
    suspendedCabinetsRequireRedundantFixings: boolean;
    clientWallDescriptionStillPrimary: boolean;
  };
  items: WallIntelligenceV35ValidatedItem[];
  totals: {
    items: number;
    ready: number;
    review: number;
    blocked: number;
    mirrorItems: number;
    shelfItems: number;
    suspendedCabinets: number;
    failedChecks: number;
  };
  nextActions: string[];
};

function resolveWallIntelligenceV35MountingClass(category: WallIntelligenceV33LoadCategory): WallIntelligenceV35MountingClass {
  if (category === "mirror") return "mirror";
  if (category === "shelf") return "shelf";
  if (category === "suspended_cabinet") return "suspended_cabinet";
  return "other";
}

export function buildWallIntelligenceMirrorShelfValidatorV35Report(params: {
  fixingRecommendationV34: WallIntelligenceFixingRecommendationV34ReportLike;
  spacingV25: LayoutRoomIntelligenceV25ReportLike;
}): WallIntelligenceMirrorShelfValidatorV35Report {
  const hasBarberSpacingErrors = params.spacingV25.stationSpacingChecks.some((item) => item.stationType === "barber" && !item.passed && item.severity === "critical");
  const hasBeautySpacingErrors = params.spacingV25.stationSpacingChecks.some((item) => item.stationType === "esthetician" && !item.passed && item.severity === "critical");

  const items = params.fixingRecommendationV34.recommendations
    .filter((recommendation) => ["mirror", "shelf", "suspended_cabinet"].includes(recommendation.category))
    .map((recommendation): WallIntelligenceV35ValidatedItem => {
      const mountingClass = resolveWallIntelligenceV35MountingClass(recommendation.category);
      const checks: WallIntelligenceV35ValidatedItem["checks"] = [];
      const installationNotes: string[] = [];

      if (mountingClass === "mirror") {
        const spacingWarning = hasBarberSpacingErrors || hasBeautySpacingErrors;
        checks.push({
          code: "MIRROR_STATION_SPACING_LINK",
          label: "Interasse specchio/postazione",
          passed: !spacingWarning,
          severity: spacingWarning ? "error" : "info",
          message: spacingWarning
            ? "Almeno uno specchio/postazione non rispetta gli interassi minimi: barber 150 cm, estetista 120 cm."
            : "Specchi collegati alle regole interasse postazioni: barber 150 cm, estetista 120 cm.",
        });
        checks.push({
          code: "MIRROR_FIXING_REDUNDANCY",
          label: "Fissaggi specchio",
          passed: recommendation.recommendedFixingPoints >= 2,
          severity: recommendation.recommendedFixingPoints >= 2 ? "info" : "error",
          message: `Specchio con ${recommendation.recommendedFixingPoints} fissaggi consigliati.`,
        });
        installationNotes.push("Allineare specchio alla postazione collegata e mantenere interasse minimo della tipologia servizio.");
      }

      if (mountingClass === "shelf") {
        const shelfLoadOk = recommendation.loadPerFixingKg <= 8 || recommendation.wallType === "concrete" || recommendation.wallType === "masonry";
        checks.push({
          code: "SHELF_LOAD_PER_FIXING",
          label: "Carico mensola per fissaggio",
          passed: shelfLoadOk,
          severity: shelfLoadOk ? "info" : "warning",
          message: shelfLoadOk
            ? "Carico mensola compatibile con controllo preliminare V3.5."
            : "Mensola con carico/fissaggio da verificare: valutare staffe rinforzate o barra/traversa.",
        });
        checks.push({
          code: "SHELF_WALL_TYPE_COMPATIBILITY",
          label: "Supporto parete mensola",
          passed: recommendation.wallType !== "unknown" && recommendation.wallType !== "technical",
          severity: recommendation.wallType === "unknown" ? "error" : "warning",
          message: recommendation.wallType === "unknown"
            ? "Parete sconosciuta: non validare mensole sospese senza descrizione o sopralluogo."
            : "Parete identificata ma da verificare rispetto a profondità, carico e staffe.",
        });
        installationNotes.push("Per mensole profonde o caricate controllare momento, profondità, staffe e supporto, non solo peso verticale.");
      }

      if (mountingClass === "suspended_cabinet") {
        checks.push({
          code: "CABINET_REDUNDANT_FIXING",
          label: "Fissaggi ridondanti pensile",
          passed: recommendation.recommendedFixingPoints >= 4,
          severity: recommendation.recommendedFixingPoints >= 4 ? "info" : "error",
          message: `Pensile/mobile sospeso con ${recommendation.recommendedFixingPoints} fissaggi consigliati: minimo operativo V3.5 = 4.`,
        });
        checks.push({
          code: "CABINET_WALL_SUPPORT",
          label: "Supporto parete pensile",
          passed: ["masonry", "concrete", "wood"].includes(recommendation.wallType),
          severity: ["unknown", "drywall", "technical"].includes(recommendation.wallType) ? "error" : "warning",
          message: ["unknown", "drywall", "technical"].includes(recommendation.wallType)
            ? "Pensile su parete non strutturale/sconosciuta: richiesta verifica installatore o rinforzo."
            : "Parete preliminarmente compatibile: dimensionare barra/staffe e verificare carico reale.",
        });
        installationNotes.push("Usare barra di sospensione/staffe rinforzate e distribuire il carico su più punti.");
      }

      checks.push({
        code: "CONFIDENCE_MINIMUM",
        label: "Confidenza parete",
        passed: recommendation.confidenceScore >= 70,
        severity: recommendation.confidenceScore >= 70 ? "info" : recommendation.confidenceScore >= 41 ? "warning" : "error",
        message: `Confidence score ${recommendation.confidenceScore}%. ${recommendation.confidenceScore < 70 ? "Richiesta verifica prima della validazione tecnica." : "Dati parete sufficienti per validazione preliminare."}`,
      });

      checks.push({
        code: "FIXING_ENGINE_STATUS",
        label: "Esito fissaggio V3.4",
        passed: recommendation.status !== "critical",
        severity: recommendation.status === "critical" ? "error" : recommendation.status === "warning" ? "warning" : "info",
        message: `Fixing Recommendation V3.4: ${recommendation.status}.`,
      });

      const hasErrors = checks.some((check) => check.severity === "error" && !check.passed);
      const hasWarnings = checks.some((check) => check.severity === "warning" && !check.passed) || recommendation.installerRequired;
      const status: WallIntelligenceV35ValidationStatus = hasErrors ? "blocked" : hasWarnings ? "review" : "ready";

      return {
        id: `v3-5-validator-${recommendation.id}`,
        sourceRecommendationId: recommendation.id,
        label: recommendation.label,
        mountingClass,
        wallType: recommendation.wallType,
        status,
        minimumSpacingCm: mountingClass === "mirror" ? (hasBarberSpacingErrors ? 150 : hasBeautySpacingErrors ? 120 : null) : null,
        recommendedFixingPoints: recommendation.recommendedFixingPoints,
        loadPerFixingKg: recommendation.loadPerFixingKg,
        confidenceScore: recommendation.confidenceScore,
        checks,
        installationNotes: Array.from(new Set([
          ...installationNotes,
          ...(recommendation.installerRequired ? ["Verifica installatore richiesta prima di confermare posa/fissaggi."] : []),
        ])),
      };
    });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;

  return {
    schema: "bagastudio-wall-intelligence-mirror-shelf-validator-v3-5",
    version: "3.5",
    generatedAt: new Date().toISOString(),
    status: blocked > 0
      ? "LAYOUT_V2_BLOCKED"
      : review > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceFixingRecommendationSchema: params.fixingRecommendationV34.schema,
    validatorPrinciples: {
      mirrorsFollowStationSpacing: true,
      shelvesRequireLoadAndDepthReview: true,
      suspendedCabinetsRequireRedundantFixings: true,
      clientWallDescriptionStillPrimary: true,
    },
    items,
    totals: {
      items: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      mirrorItems: items.filter((item) => item.mountingClass === "mirror").length,
      shelfItems: items.filter((item) => item.mountingClass === "shelf").length,
      suspendedCabinets: items.filter((item) => item.mountingClass === "suspended_cabinet").length,
      failedChecks: items.reduce((sum, item) => sum + item.checks.filter((check) => !check.passed).length, 0),
    },
    nextActions: [
      "Collegare V3.5 alle schede tecniche parete per mostrare specchi, mensole, pensili e alert fissaggio.",
      "Aggiungere nel Product Package campi peso reale, profondità mensola, larghezza specchio e punti fissaggio reali.",
      "Preparare V3.6: Technical Wall Report con riepilogo installatore e output PDF/DXF/CAD.",
      "In futuro far confermare o correggere questi controlli tramite foto/DWG/DXF e note installatore.",
    ],
  };
}
