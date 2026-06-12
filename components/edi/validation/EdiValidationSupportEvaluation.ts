export type EdiValidationSupportEvaluationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  evaluatedAt?: number;
  [key: string]: unknown;
};

export type EdiValidationSupportEvaluationLevel = "low" | "medium" | "high" | "critical";

export type EdiValidationSupportEvaluationIndicator = {
  id: string;
  label: string;
  value?: number;
  level?: EdiValidationSupportEvaluationLevel;
  notes?: readonly string[];
  metadata?: EdiValidationSupportEvaluationMetadata;
};

export type EdiValidationSupportEvaluation = {
  id: string;
  timestamp: number;
  validationSupportArtifactId: string;
  completenessIndicators: readonly EdiValidationSupportEvaluationIndicator[];
  coverageIndicators: readonly EdiValidationSupportEvaluationIndicator[];
  riskCoverageIndicators: readonly EdiValidationSupportEvaluationIndicator[];
  questionQualityIndicators: readonly EdiValidationSupportEvaluationIndicator[];
  traceabilityCompletenessIndicators: readonly EdiValidationSupportEvaluationIndicator[];
  evaluationMetadata?: EdiValidationSupportEvaluationMetadata;
};

export type EdiValidationSupportEvaluationInput = {
  id?: string;
  timestamp: number;
  validationSupportArtifactId: string;
  completenessIndicators?: readonly EdiValidationSupportEvaluationIndicator[];
  coverageIndicators?: readonly EdiValidationSupportEvaluationIndicator[];
  riskCoverageIndicators?: readonly EdiValidationSupportEvaluationIndicator[];
  questionQualityIndicators?: readonly EdiValidationSupportEvaluationIndicator[];
  traceabilityCompletenessIndicators?: readonly EdiValidationSupportEvaluationIndicator[];
  evaluationMetadata?: EdiValidationSupportEvaluationMetadata;
};

const copyValidationSupportEvaluationIndicator = (
  indicator: EdiValidationSupportEvaluationIndicator,
): EdiValidationSupportEvaluationIndicator => ({
  ...indicator,
  notes: indicator.notes ? [...indicator.notes] : undefined,
  metadata: indicator.metadata ? { ...indicator.metadata } : undefined,
});

export const createEdiValidationSupportEvaluation = (
  input: EdiValidationSupportEvaluationInput,
): EdiValidationSupportEvaluation => ({
  id:
    input.id ??
    `validation-support-evaluation:${input.validationSupportArtifactId}:${input.timestamp}`,
  timestamp: input.timestamp,
  validationSupportArtifactId: input.validationSupportArtifactId,
  completenessIndicators: (input.completenessIndicators ?? []).map(
    copyValidationSupportEvaluationIndicator,
  ),
  coverageIndicators: (input.coverageIndicators ?? []).map(
    copyValidationSupportEvaluationIndicator,
  ),
  riskCoverageIndicators: (input.riskCoverageIndicators ?? []).map(
    copyValidationSupportEvaluationIndicator,
  ),
  questionQualityIndicators: (input.questionQualityIndicators ?? []).map(
    copyValidationSupportEvaluationIndicator,
  ),
  traceabilityCompletenessIndicators: (
    input.traceabilityCompletenessIndicators ?? []
  ).map(copyValidationSupportEvaluationIndicator),
  evaluationMetadata: input.evaluationMetadata
    ? {
        ...input.evaluationMetadata,
        evaluatedAt: input.evaluationMetadata.evaluatedAt ?? input.timestamp,
      }
    : {
        source: "EdiValidationSupportEvaluation",
        evaluatedAt: input.timestamp,
      },
});
