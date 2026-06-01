// @ts-nocheck
type TechnicalApprovalV39Status = "PENDING" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";
type TechnicalApprovalV39Gate = "pass" | "review" | "blocked";

type TechnicalApprovalV39Item = {
  id: string;
  label: string;
  gate: TechnicalApprovalV39Gate;
  source: string;
  reason: string;
  requiredAction: string;
};

type TechnicalApprovalWorkflowV39Report = {
  schema: "bagastudio-technical-approval-workflow-v3-9";
  version: "3.9";
  generatedAt: string;
  approvalStatus: TechnicalApprovalV39Status;
  installAllowed: boolean;
  approvalLocked: boolean;
  approvedBy: string | null;
  approvedDate: string | null;
  approvalNotes: string[];
  siteSurveyRequired: boolean;
  siteSurveyCompleted: boolean;
  siteSurveyNotes: string[];
  sourceRiskLevel: InstallationRiskV37Level;
  checklistStatus: InstallerChecklistV38Report["checklistStatus"];
  totals: {
    gates: number;
    pass: number;
    review: number;
    blocked: number;
    requiredActions: number;
  };
  gates: TechnicalApprovalV39Item[];
  workflowSteps: string[];
  requiredActions: string[];
  approvalConditions: string[];
  exportTargets: string[];
  nextActions: string[];
};

export function buildTechnicalApprovalWorkflowV39Report(params: {
  installationRiskV37: InstallationRiskV37Report;
  installerChecklistV38: InstallerChecklistV38Report;
  technicalWallReportV36: WallTechnicalReportV36Report;
}): TechnicalApprovalWorkflowV39Report {
  const gates: TechnicalApprovalV39Item[] = [];

  const pushGate = (gate: TechnicalApprovalV39Item) => {
    if (gates.some((existingGate) => existingGate.id === gate.id)) return;
    gates.push(gate);
  };

  pushGate({
    id: "installation-risk-approval",
    label: "Rischio installazione",
    gate: params.installationRiskV37.installBlocked
      ? "blocked"
      : params.installationRiskV37.installRiskLevel === "HIGH" || params.installationRiskV37.installRiskLevel === "CRITICAL"
        ? "review"
        : "pass",
    source: "Installation Risk Engine V3.7",
    reason: `Livello rischio ${params.installationRiskV37.installRiskLevel} con score ${params.installationRiskV37.riskScore}/100.`,
    requiredAction: params.installationRiskV37.installBlocked
      ? "Bloccare approvazione tecnica e richiedere correzione/sopralluogo."
      : params.installationRiskV37.installRiskLevel === "HIGH" || params.installationRiskV37.installRiskLevel === "CRITICAL"
        ? "Richiedere revisione tecnica prima dell'approvazione."
        : "Rischio compatibile con approvazione tecnica automatica.",
  });

  pushGate({
    id: "installer-checklist-approval",
    label: "Checklist installatore",
    gate: params.installerChecklistV38.checklistStatus === "INSTALL_BLOCKED"
      ? "blocked"
      : params.installerChecklistV38.checklistStatus === "INSTALL_REVIEW_REQUIRED"
        ? "review"
        : "pass",
    source: "Installer Checklist Engine V3.8",
    reason: `${params.installerChecklistV38.totals.blocked} voci bloccate, ${params.installerChecklistV38.totals.review} in review, ${params.installerChecklistV38.totals.evidenceRequired} evidenze richieste.`,
    requiredAction: params.installerChecklistV38.checklistStatus === "INSTALL_BLOCKED"
      ? "Completare o correggere le voci bloccanti della checklist."
      : params.installerChecklistV38.checklistStatus === "INSTALL_REVIEW_REQUIRED"
        ? "Far validare checklist da tecnico/installatore."
        : "Checklist pronta per approvazione.",
  });

  pushGate({
    id: "technical-wall-report-approval",
    label: "Report tecnico parete",
    gate: params.technicalWallReportV36.totals.blocked > 0
      ? "blocked"
      : params.technicalWallReportV36.totals.review > 0
        ? "review"
        : "pass",
    source: "Technical Wall Report V3.6",
    reason: `${params.technicalWallReportV36.totals.blocked} sezioni bloccanti e ${params.technicalWallReportV36.totals.review} sezioni da revisionare.`,
    requiredAction: params.technicalWallReportV36.totals.blocked > 0
      ? "Correggere sezioni bloccanti prima di generare scheda approvata."
      : params.technicalWallReportV36.totals.review > 0
        ? "Revisionare report tecnico parete prima della conferma finale."
        : "Report parete pronto per allegato tecnico.",
  });

  pushGate({
    id: "site-survey-approval",
    label: "Sopralluogo / evidenze integrative",
    gate: params.installationRiskV37.siteSurveyRequired ? "review" : "pass",
    source: "Wall Intelligence Engine V3 + futuro V4 Photo/DWG",
    reason: params.installationRiskV37.siteSurveyRequired
      ? "Il sistema richiede sopralluogo, foto, DWG/DXF o conferma installatore prima dell'approvazione definitiva."
      : "Nessun sopralluogo obbligatorio richiesto dai dati attuali.",
    requiredAction: params.installationRiskV37.siteSurveyRequired
      ? "Allegare evidenza o completare sopralluogo prima dello stato APPROVED."
      : "Nessuna azione aggiuntiva richiesta.",
  });

  const blocked = gates.filter((gate) => gate.gate === "blocked").length;
  const review = gates.filter((gate) => gate.gate === "review").length;
  const approvalStatus: TechnicalApprovalV39Status = blocked > 0
    ? "REJECTED"
    : review > 0
      ? "REVIEW_REQUIRED"
      : gates.length === 0
        ? "PENDING"
        : "APPROVED";

  const siteSurveyRequired = params.installationRiskV37.siteSurveyRequired;
  const siteSurveyCompleted = !siteSurveyRequired;
  const installAllowed = approvalStatus === "APPROVED";
  const approvalLocked = approvalStatus === "REJECTED" || approvalStatus === "APPROVED";

  const requiredActions = gates
    .filter((gate) => gate.gate !== "pass")
    .map((gate) => `${gate.label}: ${gate.requiredAction}`);

  if (requiredActions.length === 0) {
    requiredActions.push("Nessuna azione bloccante: progetto approvabile per installazione secondo V3.9.");
  }

  const approvalNotes = [
    approvalStatus === "APPROVED"
      ? "Approvazione tecnica automatica pronta: nessun gate bloccante o in review."
      : approvalStatus === "REJECTED"
        ? "Approvazione tecnica respinta: almeno un gate risulta bloccante."
        : approvalStatus === "REVIEW_REQUIRED"
          ? "Approvazione tecnica sospesa: serve revisione tecnico/installatore."
          : "Workflow in attesa di dati tecnici sufficienti.",
    "V3.9 non sostituisce la responsabilità del tecnico: prepara lo stato e le evidenze per PDF/DXF/CAD e installazione.",
  ];

  return {
    schema: "bagastudio-technical-approval-workflow-v3-9",
    version: "3.9",
    generatedAt: new Date().toISOString(),
    approvalStatus,
    installAllowed,
    approvalLocked,
    approvedBy: installAllowed ? "BagaStudio Core · Technical Approval Workflow V3.9" : null,
    approvedDate: installAllowed ? new Date().toISOString() : null,
    approvalNotes,
    siteSurveyRequired,
    siteSurveyCompleted,
    siteSurveyNotes: siteSurveyRequired
      ? ["Sopralluogo/foto/DWG richiesti prima di stato APPROVED definitivo.", "Quando V4 Photo/DWG sarà attivo, le evidenze aggiorneranno automaticamente confidence e approval gate."]
      : ["Sopralluogo non obbligatorio dai dati attuali."],
    sourceRiskLevel: params.installationRiskV37.installRiskLevel,
    checklistStatus: params.installerChecklistV38.checklistStatus,
    totals: {
      gates: gates.length,
      pass: gates.filter((gate) => gate.gate === "pass").length,
      review,
      blocked,
      requiredActions: requiredActions.length,
    },
    gates,
    workflowSteps: [
      "Descrizione parete cliente",
      "Analisi confidence e carichi",
      "Raccomandazione fissaggi",
      "Validazione specchi/mensole/pensili",
      "Report tecnico parete",
      "Checklist installatore",
      "Approvazione tecnica V3.9",
      "Installazione / PDF approvato",
    ],
    requiredActions,
    approvalConditions: [
      "Nessun gate bloccante attivo.",
      "Checklist installatore pronta o revisionata.",
      "Sopralluogo completato quando richiesto.",
      "Report tecnico parete senza sezioni critiche.",
      "Fissaggi e carichi confermati per la tipologia parete dichiarata.",
    ],
    exportTargets: [
      "PDF scheda approvazione tecnica",
      "PDF checklist installatore firmabile",
      "DXF/CAD prospetto parete con stato approvazione",
      "JSON Technical Approval V3.9",
      "Preventivo installazione con eventuale sopralluogo",
    ],
    nextActions: [
      "Fare Git checkpoint dopo V3.9 se il progetto compila.",
      "Preparare V4.0 Photo/DWG Assisted Recognition come conferma del profilo parete.",
      "Collegare approvalStatus a export PDF finale approvato/non approvato.",
      "Predisporre firma tecnico/installatore e note sopralluogo nel futuro Admin Rules/Approval Manager.",
    ],
  };
}
