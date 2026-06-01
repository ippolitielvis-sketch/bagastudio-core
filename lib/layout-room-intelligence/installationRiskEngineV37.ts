export type InstallationRiskV37Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InstallationRiskV37Status = "installable" | "review" | "blocked";

export type InstallationRiskV37Factor = {
  id: string;
  label: string;
  impact: number;
  level: InstallationRiskV37Level;
  reason: string;
  recommendedAction: string;
};

export type InstallationRiskV37Report = {
  schema: "bagastudio-installation-risk-engine-v3-7";
  version: "3.7";
  generatedAt: string;
  status: InstallationRiskV37Status;
  installRiskLevel: InstallationRiskV37Level;
  installBlocked: boolean;
  installerRequired: boolean;
  siteSurveyRequired: boolean;
  riskScore: number;
  sourceReports: {
    confidenceEngine: string;
    loadAnalyzer: string;
    fixingRecommendation: string;
    mirrorShelfValidator: string;
    technicalWallReport: string;
  };
  totals: {
    factors: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    blockedSections: number;
    reviewSections: number;
  };
  factors: InstallationRiskV37Factor[];
  riskReasons: string[];
  recommendedActions: string[];
  installerChecklist: string[];
  nextActions: string[];
};

function resolveInstallationRiskV37Level(score: number, hasCritical: boolean, hasHigh: boolean): InstallationRiskV37Level {
  if (hasCritical || score >= 85) return "CRITICAL";
  if (hasHigh || score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

type ConfidenceEngineV32ReportLike = {
  schema: string;
  totals: { low: number; medium: number };
};

type LoadAnalyzerV33ReportLike = {
  schema: string;
  totals: { blocked: number; critical: number; review: number };
};

type FixingRecommendationV34ReportLike = {
  schema: string;
  totals: { critical: number; installerRequired: number };
};

type MirrorShelfValidatorV35ReportLike = {
  schema: string;
  totals: { blocked: number; failedChecks: number };
};

type TechnicalWallReportV36ReportLike = {
  schema: string;
  totals: { blocked: number; review: number };
};

export function buildInstallationRiskEngineV37Report(params: {
  confidenceEngineV32: ConfidenceEngineV32ReportLike;
  loadAnalyzerV33: LoadAnalyzerV33ReportLike;
  fixingRecommendationV34: FixingRecommendationV34ReportLike;
  mirrorShelfValidatorV35: MirrorShelfValidatorV35ReportLike;
  technicalWallReportV36: TechnicalWallReportV36ReportLike;
}): InstallationRiskV37Report {
  const factors: InstallationRiskV37Factor[] = [];

  const pushFactor = (factor: InstallationRiskV37Factor) => {
    if (factors.some((item) => item.id === factor.id)) return;
    factors.push(factor);
  };

  if (params.confidenceEngineV32.totals.low > 0) {
    pushFactor({
      id: "low-confidence",
      label: "Affidabilità parete bassa",
      impact: 28,
      level: "HIGH",
      reason: `Confidence bassa su ${params.confidenceEngineV32.totals.low} parete/i: dati cliente insufficienti per montaggio sicuro.`,
      recommendedAction: "Richiedere verifica installatore, foto o rilievo prima di confermare fissaggi e carichi.",
    });
  }

  if (params.confidenceEngineV32.totals.medium > 0) {
    pushFactor({
      id: "medium-confidence",
      label: "Affidabilità parete media",
      impact: 14,
      level: "MEDIUM",
      reason: `Confidence media su ${params.confidenceEngineV32.totals.medium} parete/i: dati utilizzabili ma da confermare.`,
      recommendedAction: "Segnare la parete come review e richiedere conferma su spessore, supporto e note installatore.",
    });
  }

  if (params.loadAnalyzerV33.totals.blocked > 0 || params.loadAnalyzerV33.totals.critical > 0) {
    pushFactor({
      id: "critical-load",
      label: "Carichi critici",
      impact: 34,
      level: "CRITICAL",
      reason: `Load Analyzer V3.3 segnala ${params.loadAnalyzerV33.totals.critical} carichi critici e ${params.loadAnalyzerV33.totals.blocked} blocchi.`,
      recommendedAction: "Bloccare installazione finché non vengono confermati parete, fissaggi, punti strutturali e peso reale.",
    });
  }

  if (params.loadAnalyzerV33.totals.review > 0) {
    pushFactor({
      id: "load-review",
      label: "Carichi da revisionare",
      impact: 16,
      level: "MEDIUM",
      reason: `Load Analyzer V3.3 richiede review su ${params.loadAnalyzerV33.totals.review} elemento/i.`,
      recommendedAction: "Controllare punti fissaggio e distribuzione carico prima della scheda tecnica definitiva.",
    });
  }

  if (params.fixingRecommendationV34.totals.critical > 0) {
    pushFactor({
      id: "fixing-critical",
      label: "Fissaggi critici",
      impact: 30,
      level: "CRITICAL",
      reason: `Fixing Recommendation V3.4 segnala ${params.fixingRecommendationV34.totals.critical} raccomandazioni critiche.`,
      recommendedAction: "Richiedere sopralluogo o alternativa di fissaggio prima di autorizzare montaggio.",
    });
  }

  if (params.fixingRecommendationV34.totals.installerRequired > 0) {
    pushFactor({
      id: "installer-required",
      label: "Installatore richiesto",
      impact: 18,
      level: "HIGH",
      reason: `Sono presenti ${params.fixingRecommendationV34.totals.installerRequired} raccomandazioni che richiedono installatore.`,
      recommendedAction: "Inserire installatore qualificato nel workflow e nel preventivo installazione.",
    });
  }

  if (params.mirrorShelfValidatorV35.totals.blocked > 0 || params.mirrorShelfValidatorV35.totals.failedChecks > 0) {
    pushFactor({
      id: "mirror-shelf-blocked",
      label: "Specchi/mensole/pensili non conformi",
      impact: 26,
      level: params.mirrorShelfValidatorV35.totals.blocked > 0 ? "CRITICAL" : "HIGH",
      reason: `Mirror & Shelf Validator V3.5 segnala ${params.mirrorShelfValidatorV35.totals.failedChecks} check KO e ${params.mirrorShelfValidatorV35.totals.blocked} blocchi.`,
      recommendedAction: "Correggere interassi, profondità, punti fissaggio o peso prima di generare PDF/DXF definitivo.",
    });
  }

  if (params.technicalWallReportV36.totals.blocked > 0) {
    pushFactor({
      id: "technical-report-blocked",
      label: "Report tecnico bloccante",
      impact: 24,
      level: "CRITICAL",
      reason: `Technical Wall Report V3.6 contiene ${params.technicalWallReportV36.totals.blocked} sezione/i bloccante/i.`,
      recommendedAction: "Non emettere scheda tecnica installativa fino alla chiusura dei blocchi.",
    });
  }

  if (params.technicalWallReportV36.totals.review > 0) {
    pushFactor({
      id: "technical-report-review",
      label: "Report tecnico in review",
      impact: 12,
      level: "MEDIUM",
      reason: `Technical Wall Report V3.6 contiene ${params.technicalWallReportV36.totals.review} sezione/i da revisionare.`,
      recommendedAction: "Mantenere scheda tecnica in bozza finché i dati parete non sono confermati.",
    });
  }

  if (factors.length === 0) {
    pushFactor({
      id: "low-risk-baseline",
      label: "Installazione preliminarmente compatibile",
      impact: 8,
      level: "LOW",
      reason: "Nessun blocco rilevato dai moduli V3.2-V3.6.",
      recommendedAction: "Procedere con scheda tecnica, mantenendo verifica installatore standard prima del montaggio.",
    });
  }

  const riskScore = Math.min(100, factors.reduce((sum, factor) => sum + factor.impact, 0));
  const hasCritical = factors.some((factor) => factor.level === "CRITICAL");
  const hasHigh = factors.some((factor) => factor.level === "HIGH");
  const installRiskLevel = resolveInstallationRiskV37Level(riskScore, hasCritical, hasHigh);
  const installBlocked = installRiskLevel === "CRITICAL" || params.technicalWallReportV36.totals.blocked > 0;
  const installerRequired = installBlocked || installRiskLevel === "HIGH" || params.fixingRecommendationV34.totals.installerRequired > 0;
  const siteSurveyRequired = installBlocked || params.confidenceEngineV32.totals.low > 0 || params.loadAnalyzerV33.totals.blocked > 0;

  const status: InstallationRiskV37Status = installBlocked
    ? "blocked"
    : installRiskLevel === "HIGH" || installRiskLevel === "MEDIUM"
      ? "review"
      : "installable";

  const recommendedActions = Array.from(new Set(factors.map((factor) => factor.recommendedAction)));

  return {
    schema: "bagastudio-installation-risk-engine-v3-7",
    version: "3.7",
    generatedAt: new Date().toISOString(),
    status,
    installRiskLevel,
    installBlocked,
    installerRequired,
    siteSurveyRequired,
    riskScore,
    sourceReports: {
      confidenceEngine: params.confidenceEngineV32.schema,
      loadAnalyzer: params.loadAnalyzerV33.schema,
      fixingRecommendation: params.fixingRecommendationV34.schema,
      mirrorShelfValidator: params.mirrorShelfValidatorV35.schema,
      technicalWallReport: params.technicalWallReportV36.schema,
    },
    totals: {
      factors: factors.length,
      low: factors.filter((factor) => factor.level === "LOW").length,
      medium: factors.filter((factor) => factor.level === "MEDIUM").length,
      high: factors.filter((factor) => factor.level === "HIGH").length,
      critical: factors.filter((factor) => factor.level === "CRITICAL").length,
      blockedSections: params.technicalWallReportV36.totals.blocked,
      reviewSections: params.technicalWallReportV36.totals.review,
    },
    factors,
    riskReasons: factors.map((factor) => factor.reason),
    recommendedActions,
    installerChecklist: [
      "Verificare supporto reale parete prima di fissare specchi, mensole o pensili.",
      "Confermare carichi effettivi e numero punti fissaggio prima dell'installazione.",
      "Se la parete è cartongesso, cercare montanti/rinforzi o usare barra distribuzione carico.",
      "Se confidence è bassa, eseguire sopralluogo o richiedere foto/DWG/DXF integrativi.",
      "Bloccare montaggio se Installation Risk Engine V3.7 restituisce CRITICAL.",
    ],
    nextActions: [
      "Preparare V3.8 Installer Checklist Engine con checklist operativa stampabile.",
      "Collegare rischio installazione al preventivo e ai costi sopralluogo/montaggio.",
      "Far alimentare V3.7 dalle evidenze future foto, DWG, DXF e note installatore.",
      "Integrare installRiskLevel nelle schede tecniche PDF/DXF/CAD.",
    ],
  };
}
