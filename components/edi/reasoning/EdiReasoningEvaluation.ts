export type EdiReasoningEvaluationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  evaluatedAt?: number;
  [key: string]: unknown;
};

export type EdiReasoningEvaluationLevel = "low" | "medium" | "high" | "critical";

export type EdiReasoningEvaluationIndicator = {
  id: string;
  label: string;
  value?: number;
  level?: EdiReasoningEvaluationLevel;
  notes?: readonly string[];
  metadata?: EdiReasoningEvaluationMetadata;
};

export type EdiReasoningEvaluation = {
  id: string;
  timestamp: number;
  reasoningArtifactId: string;
  confidenceIndicators: readonly EdiReasoningEvaluationIndicator[];
  consistencyIndicators: readonly EdiReasoningEvaluationIndicator[];
  coverageIndicators: readonly EdiReasoningEvaluationIndicator[];
  riskIndicators: readonly EdiReasoningEvaluationIndicator[];
  traceabilityCompletenessIndicators: readonly EdiReasoningEvaluationIndicator[];
  evaluationMetadata?: EdiReasoningEvaluationMetadata;
};

export type EdiReasoningEvaluationInput = {
  id?: string;
  timestamp: number;
  reasoningArtifactId: string;
  confidenceIndicators?: readonly EdiReasoningEvaluationIndicator[];
  consistencyIndicators?: readonly EdiReasoningEvaluationIndicator[];
  coverageIndicators?: readonly EdiReasoningEvaluationIndicator[];
  riskIndicators?: readonly EdiReasoningEvaluationIndicator[];
  traceabilityCompletenessIndicators?: readonly EdiReasoningEvaluationIndicator[];
  evaluationMetadata?: EdiReasoningEvaluationMetadata;
};

const copyEvaluationIndicator = (
  indicator: EdiReasoningEvaluationIndicator,
): EdiReasoningEvaluationIndicator => ({
  ...indicator,
  notes: indicator.notes ? [...indicator.notes] : undefined,
  metadata: indicator.metadata ? { ...indicator.metadata } : undefined,
});

export const createEdiReasoningEvaluation = (
  input: EdiReasoningEvaluationInput,
): EdiReasoningEvaluation => ({
  id: input.id ?? `reasoning-evaluation:${input.reasoningArtifactId}:${input.timestamp}`,
  timestamp: input.timestamp,
  reasoningArtifactId: input.reasoningArtifactId,
  confidenceIndicators: (input.confidenceIndicators ?? []).map(copyEvaluationIndicator),
  consistencyIndicators: (input.consistencyIndicators ?? []).map(copyEvaluationIndicator),
  coverageIndicators: (input.coverageIndicators ?? []).map(copyEvaluationIndicator),
  riskIndicators: (input.riskIndicators ?? []).map(copyEvaluationIndicator),
  traceabilityCompletenessIndicators: (
    input.traceabilityCompletenessIndicators ?? []
  ).map(copyEvaluationIndicator),
  evaluationMetadata: input.evaluationMetadata
    ? {
        ...input.evaluationMetadata,
        evaluatedAt: input.evaluationMetadata.evaluatedAt ?? input.timestamp,
      }
    : {
        source: "EdiReasoningEvaluation",
        evaluatedAt: input.timestamp,
      },
});
