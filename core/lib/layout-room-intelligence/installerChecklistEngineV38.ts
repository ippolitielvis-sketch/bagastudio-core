export type InstallationRiskV37Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InstallerChecklistV38Priority = "mandatory" | "recommended" | "optional";
export type InstallerChecklistV38Status = "ready" | "review" | "blocked";

export type InstallerChecklistV38Item = {
  id: string;
  phase: "pre_installation" | "wall_verification" | "fixing" | "mounting" | "handover";
  label: string;
  priority: InstallerChecklistV38Priority;
  status: InstallerChecklistV38Status;
  reason: string;
  requiredBy: string[];
  evidenceRequired: boolean;
  outputTarget: "PDF" | "DXF" | "CAD" | "INSTALLER";
};

export type InstallerChecklistV38Report = {
  schema: "bagastudio-installer-checklist-engine-v3-8";
  version: "3.8";
  generatedAt: string;
  checklistStatus: "INSTALL_READY" | "INSTALL_REVIEW_REQUIRED" | "INSTALL_BLOCKED";
  sourceRiskLevel: InstallationRiskV37Level;
  sourceRiskScore: number;
  installBlocked: boolean;
  installerRequired: boolean;
  siteSurveyRequired: boolean;
  totals: {
    items: number;
    mandatory: number;
    recommended: number;
    optional: number;
    ready: number;
    review: number;
    blocked: number;
    evidenceRequired: number;
  };
  phases: Record<string, number>;
  items: InstallerChecklistV38Item[];
  printableSections: string[];
  exportTargets: string[];
  nextActions: string[];
};

type InstallationRiskV37ReportLike = {
  siteSurveyRequired: boolean;
  installBlocked: boolean;
  installerRequired: boolean;
  installRiskLevel: InstallationRiskV37Level;
  riskScore: number;
  recommendedActions: string[];
};

type WallTechnicalReportV36ReportLike = {
  totals: {
    blocked: number;
    review: number;
  };
  installerChecklist: string[];
};

export function buildInstallerChecklistEngineV38Report(params: {
  installationRiskV37: InstallationRiskV37ReportLike;
  technicalWallReportV36: WallTechnicalReportV36ReportLike;
}): InstallerChecklistV38Report {
  const items: InstallerChecklistV38Item[] = [];

  const pushItem = (item: InstallerChecklistV38Item) => {
    if (items.some((existingItem) => existingItem.id === item.id)) return;
    items.push(item);
  };

  pushItem({
    id: "verify-wall-profile",
    phase: "pre_installation",
    label: "Verificare profilo parete dichiarato dal cliente",
    priority: "mandatory",
    status: params.installationRiskV37.siteSurveyRequired ? "review" : "ready",
    reason: params.installationRiskV37.siteSurveyRequired
      ? "Il rischio installazione richiede sopralluogo o verifica aggiuntiva prima del montaggio."
      : "Profilo parete sufficientemente affidabile per checklist preliminare.",
    requiredBy: ["Wall Confidence Engine V3.2", "Installation Risk Engine V3.7"],
    evidenceRequired: params.installationRiskV37.siteSurveyRequired,
    outputTarget: "PDF",
  });

  pushItem({
    id: "confirm-loads-and-weights",
    phase: "wall_verification",
    label: "Confermare pesi reali di specchi, mensole e pensili",
    priority: "mandatory",
    status: params.installationRiskV37.installBlocked ? "blocked" : params.installationRiskV37.installerRequired ? "review" : "ready",
    reason: params.installationRiskV37.installBlocked
      ? "Installazione bloccata: carichi o fissaggi non sono ancora autorizzabili."
      : "I pesi devono essere confermati prima della scheda installativa definitiva.",
    requiredBy: ["Wall Load Analyzer V3.3", "Mirror & Shelf Validator V3.5"],
    evidenceRequired: params.installationRiskV37.installerRequired,
    outputTarget: "INSTALLER",
  });

  pushItem({
    id: "mark-fixing-points",
    phase: "fixing",
    label: "Marcatura punti fissaggio su parete e controllo interassi",
    priority: "mandatory",
    status: params.technicalWallReportV36.totals.blocked > 0 ? "blocked" : params.technicalWallReportV36.totals.review > 0 ? "review" : "ready",
    reason: "I punti fissaggio devono rispettare prospetto parete, interassi e layer tecnici PDF/DXF/CAD.",
    requiredBy: ["Technical Wall Report V3.6", "Rule Pack System V2.8"],
    evidenceRequired: params.technicalWallReportV36.totals.review > 0 || params.technicalWallReportV36.totals.blocked > 0,
    outputTarget: "DXF",
  });

  pushItem({
    id: "select-fixing-hardware",
    phase: "fixing",
    label: "Preparare ferramenta consigliata per parete e carico",
    priority: "mandatory",
    status: params.installationRiskV37.installBlocked ? "blocked" : "ready",
    reason: "La ferramenta deve seguire le raccomandazioni V3.4 e non può essere lasciata generica nei casi critici.",
    requiredBy: ["Fixing Recommendation Engine V3.4"],
    evidenceRequired: params.installationRiskV37.installBlocked || params.installationRiskV37.installerRequired,
    outputTarget: "INSTALLER",
  });

  if (params.installationRiskV37.installerRequired) {
    pushItem({
      id: "qualified-installer-required",
      phase: "mounting",
      label: "Installatore qualificato richiesto",
      priority: "mandatory",
      status: params.installationRiskV37.installBlocked ? "blocked" : "review",
      reason: "Il rischio installazione richiede intervento tecnico e non semplice montaggio cliente.",
      requiredBy: ["Installation Risk Engine V3.7"],
      evidenceRequired: true,
      outputTarget: "INSTALLER",
    });
  }

  if (params.installationRiskV37.siteSurveyRequired) {
    pushItem({
      id: "site-survey-required",
      phase: "pre_installation",
      label: "Sopralluogo o conferma fotografica/DWG prima del montaggio",
      priority: "mandatory",
      status: params.installationRiskV37.installBlocked ? "blocked" : "review",
      reason: "Dati parete insufficienti o rischio alto: serve evidenza integrativa prima di produrre scheda definitiva.",
      requiredBy: ["Wall Intelligence Engine V3", "Installation Risk Engine V3.7"],
      evidenceRequired: true,
      outputTarget: "PDF",
    });
  }

  params.installationRiskV37.recommendedActions.slice(0, 8).forEach((action, index) => {
    pushItem({
      id: `risk-action-${index + 1}`,
      phase: "handover",
      label: action,
      priority: params.installationRiskV37.installRiskLevel === "LOW" ? "recommended" : "mandatory",
      status: params.installationRiskV37.installBlocked ? "blocked" : params.installationRiskV37.installRiskLevel === "LOW" ? "ready" : "review",
      reason: "Azione derivata automaticamente dai fattori rischio V3.7.",
      requiredBy: ["Installation Risk Engine V3.7"],
      evidenceRequired: params.installationRiskV37.installRiskLevel !== "LOW",
      outputTarget: "PDF",
    });
  });

  params.technicalWallReportV36.installerChecklist.slice(0, 8).forEach((check, index) => {
    pushItem({
      id: `technical-wall-check-${index + 1}`,
      phase: "mounting",
      label: check,
      priority: "recommended",
      status: params.technicalWallReportV36.totals.blocked > 0 ? "blocked" : params.technicalWallReportV36.totals.review > 0 ? "review" : "ready",
      reason: "Voce importata dal Technical Wall Report V3.6 per scheda installatore.",
      requiredBy: ["Technical Wall Report V3.6"],
      evidenceRequired: params.technicalWallReportV36.totals.review > 0,
      outputTarget: "INSTALLER",
    });
  });

  const blocked = items.filter((item) => item.status === "blocked").length;
  const review = items.filter((item) => item.status === "review").length;
  const checklistStatus = blocked > 0
    ? "INSTALL_BLOCKED"
    : review > 0
      ? "INSTALL_REVIEW_REQUIRED"
      : "INSTALL_READY";

  const phases = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.phase] = (acc[item.phase] || 0) + 1;
    return acc;
  }, {});

  return {
    schema: "bagastudio-installer-checklist-engine-v3-8",
    version: "3.8",
    generatedAt: new Date().toISOString(),
    checklistStatus,
    sourceRiskLevel: params.installationRiskV37.installRiskLevel,
    sourceRiskScore: params.installationRiskV37.riskScore,
    installBlocked: params.installationRiskV37.installBlocked,
    installerRequired: params.installationRiskV37.installerRequired,
    siteSurveyRequired: params.installationRiskV37.siteSurveyRequired,
    totals: {
      items: items.length,
      mandatory: items.filter((item) => item.priority === "mandatory").length,
      recommended: items.filter((item) => item.priority === "recommended").length,
      optional: items.filter((item) => item.priority === "optional").length,
      ready: items.filter((item) => item.status === "ready").length,
      review,
      blocked,
      evidenceRequired: items.filter((item) => item.evidenceRequired).length,
    },
    phases,
    items,
    printableSections: [
      "Dati parete e livello affidabilità",
      "Rischio installazione e blocchi",
      "Punti fissaggio e layer tecnici",
      "Ferramenta consigliata",
      "Checklist installatore",
      "Evidenze richieste prima del montaggio",
    ],
    exportTargets: ["PDF installatore", "DXF punti fissaggio", "CAD prospetto parete", "JSON checklist V3.8"],
    nextActions: [
      "Preparare V3.9 Technical Approval Workflow con stati bozza/review/approvato/bloccato.",
      "Collegare checklist al preventivo installazione e ai costi sopralluogo.",
      "Predisporre campi firma installatore/cliente nella scheda PDF.",
      "Far aggiornare checklist quando arrivano foto, DWG, DXF o note tecniche.",
    ],
  };
}
