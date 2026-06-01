type TechnicalKnowledgeBaseV1Category = string;
type TechnicalKnowledgeBaseV1Severity = "error" | "warning" | "info" | string;

type TechnicalKnowledgeBaseV1Rule = {
  id: string;
  category: TechnicalKnowledgeBaseV1Category;
  validationTarget: string;
  label: string;
  severity: TechnicalKnowledgeBaseV1Severity;
  expected: string;
  note: string;
};

type TechnicalKnowledgeBaseV1Report = {
  schema: string;
  status: string;
  sinkHeights: {
    countertopSinkTopHeightMm: number;
    insetSinkTopHeightMm: number;
  };
  rules: TechnicalKnowledgeBaseV1Rule[];
};

type WallTechnicalPointsValidationV1Status = string;

type WallTechnicalPointsValidationV1Rule = {
  kind: string;
  status: SmartTechnicalValidatorV1IssueStatus;
  actual: string;
};

type WallTechnicalPointsValidationV1Report = {
  schema: string;
  status: WallTechnicalPointsValidationV1Status;
  rules: WallTechnicalPointsValidationV1Rule[];
};

type SmartTechnicalValidatorV1Status = "TECHNICAL_VALIDATION_READY" | "TECHNICAL_VALIDATION_REVIEW_REQUIRED" | "TECHNICAL_VALIDATION_BLOCKED";

type SmartTechnicalValidatorV1IssueStatus = "passed" | "review" | "blocked";

type SmartTechnicalValidatorV1Issue = {
  id: string;
  category: TechnicalKnowledgeBaseV1Category;
  label: string;
  status: SmartTechnicalValidatorV1IssueStatus;
  severity: TechnicalKnowledgeBaseV1Severity;
  sourceRuleId: string;
  expected: string;
  detected: string;
  recommendation: string;
};

type SmartTechnicalValidatorV1Report = {
  schema: "bagastudio-smart-technical-validator-v1";
  version: 1;
  generatedAt: string;
  status: SmartTechnicalValidatorV1Status;
  sourceKnowledgeBaseSchema: TechnicalKnowledgeBaseV1Report["schema"];
  sourceKnowledgeBaseStatus: TechnicalKnowledgeBaseV1Report["status"];
  sourceWallValidationSchema: WallTechnicalPointsValidationV1Report["schema"];
  sourceWallValidationStatus: WallTechnicalPointsValidationV1Status;
  totals: {
    checks: number;
    passed: number;
    review: number;
    blocked: number;
    errors: number;
    warnings: number;
    info: number;
  };
  sinkHeights: TechnicalKnowledgeBaseV1Report["sinkHeights"];
  issues: SmartTechnicalValidatorV1Issue[];
  recommendations: string[];
};

function resolveSmartTechnicalValidatorV1Status(
  issueStatus: SmartTechnicalValidatorV1IssueStatus,
  severity: TechnicalKnowledgeBaseV1Severity
): SmartTechnicalValidatorV1IssueStatus {
  if (issueStatus === "blocked") return "blocked";
  if (severity === "error" && issueStatus === "review") return "review";
  return issueStatus;
}

export function buildSmartTechnicalValidatorV1Report(params: {
  knowledgeBase: TechnicalKnowledgeBaseV1Report;
  wallValidation: WallTechnicalPointsValidationV1Report;
}): SmartTechnicalValidatorV1Report {
  const wallRuleByKind = new Map<string, WallTechnicalPointsValidationV1Rule>();
  params.wallValidation.rules.forEach((rule) => {
    wallRuleByKind.set(rule.kind, rule);
  });

  const issues: SmartTechnicalValidatorV1Issue[] = params.knowledgeBase.rules.map((rule) => {
    const relatedWallRule =
      wallRuleByKind.get(rule.category) ||
      wallRuleByKind.get(rule.validationTarget) ||
      null;

    const baseStatus: SmartTechnicalValidatorV1IssueStatus =
      params.wallValidation.status === "TECHNICAL_POINTS_BLOCKED" && rule.severity === "error"
        ? "blocked"
        : params.wallValidation.status === "TECHNICAL_POINTS_REVIEW_REQUIRED" || relatedWallRule?.status === "review"
          ? "review"
          : relatedWallRule?.status === "blocked"
            ? "blocked"
            : "passed";

    const status = resolveSmartTechnicalValidatorV1Status(baseStatus, rule.severity);

    return {
      id: `smart-validator-v1-${rule.id}`,
      category: rule.category,
      label: rule.label,
      status,
      severity: rule.severity,
      sourceRuleId: rule.id,
      expected: rule.expected,
      detected: relatedWallRule
        ? `${relatedWallRule.status}: ${relatedWallRule.actual}`
        : "Regola disponibile in Technical Knowledge Base V1; dati progetto specifici non ancora collegati.",
      recommendation:
        status === "blocked"
          ? `Correggere prima dell'export tecnico: ${rule.note}`
          : status === "review"
            ? `Verifica manuale consigliata: ${rule.note}`
            : `Controllo pronto: ${rule.note}`,
    };
  });

  const blocked = issues.filter((issue) => issue.status === "blocked").length;
  const review = issues.filter((issue) => issue.status === "review").length;
  const status: SmartTechnicalValidatorV1Status =
    blocked > 0
      ? "TECHNICAL_VALIDATION_BLOCKED"
      : review > 0
        ? "TECHNICAL_VALIDATION_REVIEW_REQUIRED"
        : "TECHNICAL_VALIDATION_READY";

  return {
    schema: "bagastudio-smart-technical-validator-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    status,
    sourceKnowledgeBaseSchema: params.knowledgeBase.schema,
    sourceKnowledgeBaseStatus: params.knowledgeBase.status,
    sourceWallValidationSchema: params.wallValidation.schema,
    sourceWallValidationStatus: params.wallValidation.status,
    totals: {
      checks: issues.length,
      passed: issues.filter((issue) => issue.status === "passed").length,
      review,
      blocked,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    },
    sinkHeights: params.knowledgeBase.sinkHeights,
    issues,
    recommendations: [
      "Usare Smart Technical Validator V1 come gate tecnico prima della scheda PDF/DXF/CAD finale.",
      "Collegare progressivamente i dati reali del progetto: tipo lavabo, battiscopa, parete, prese, carichi/scarichi e fissaggi.",
      "Le regole bloccanti devono impedire l'export tecnico finale finché non vengono risolte o approvate manualmente.",
    ],
  };
}
