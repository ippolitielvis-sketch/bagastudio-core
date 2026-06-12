export type EdiProposalEvaluationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  evaluatedAt?: number;
  [key: string]: unknown;
};

export type EdiProposalEvaluationLevel = "low" | "medium" | "high" | "critical";

export type EdiProposalEvaluationIndicator = {
  id: string;
  label: string;
  value?: number;
  level?: EdiProposalEvaluationLevel;
  notes?: readonly string[];
  metadata?: EdiProposalEvaluationMetadata;
};

export type EdiProposalEvaluation = {
  id: string;
  timestamp: number;
  proposalArtifactId: string;
  confidenceIndicators: readonly EdiProposalEvaluationIndicator[];
  feasibilityIndicators: readonly EdiProposalEvaluationIndicator[];
  benefitIndicators: readonly EdiProposalEvaluationIndicator[];
  riskIndicators: readonly EdiProposalEvaluationIndicator[];
  traceabilityCompletenessIndicators: readonly EdiProposalEvaluationIndicator[];
  evaluationMetadata?: EdiProposalEvaluationMetadata;
};

export type EdiProposalEvaluationInput = {
  id?: string;
  timestamp: number;
  proposalArtifactId: string;
  confidenceIndicators?: readonly EdiProposalEvaluationIndicator[];
  feasibilityIndicators?: readonly EdiProposalEvaluationIndicator[];
  benefitIndicators?: readonly EdiProposalEvaluationIndicator[];
  riskIndicators?: readonly EdiProposalEvaluationIndicator[];
  traceabilityCompletenessIndicators?: readonly EdiProposalEvaluationIndicator[];
  evaluationMetadata?: EdiProposalEvaluationMetadata;
};

const copyProposalEvaluationIndicator = (
  indicator: EdiProposalEvaluationIndicator,
): EdiProposalEvaluationIndicator => ({
  ...indicator,
  notes: indicator.notes ? [...indicator.notes] : undefined,
  metadata: indicator.metadata ? { ...indicator.metadata } : undefined,
});

export const createEdiProposalEvaluation = (
  input: EdiProposalEvaluationInput,
): EdiProposalEvaluation => ({
  id: input.id ?? `proposal-evaluation:${input.proposalArtifactId}:${input.timestamp}`,
  timestamp: input.timestamp,
  proposalArtifactId: input.proposalArtifactId,
  confidenceIndicators: (input.confidenceIndicators ?? []).map(copyProposalEvaluationIndicator),
  feasibilityIndicators: (input.feasibilityIndicators ?? []).map(copyProposalEvaluationIndicator),
  benefitIndicators: (input.benefitIndicators ?? []).map(copyProposalEvaluationIndicator),
  riskIndicators: (input.riskIndicators ?? []).map(copyProposalEvaluationIndicator),
  traceabilityCompletenessIndicators: (
    input.traceabilityCompletenessIndicators ?? []
  ).map(copyProposalEvaluationIndicator),
  evaluationMetadata: input.evaluationMetadata
    ? {
        ...input.evaluationMetadata,
        evaluatedAt: input.evaluationMetadata.evaluatedAt ?? input.timestamp,
      }
    : {
        source: "EdiProposalEvaluation",
        evaluatedAt: input.timestamp,
      },
});
