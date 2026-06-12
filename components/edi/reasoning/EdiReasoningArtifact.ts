import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";

export type EdiReasoningMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  understandingArtifactIds?: readonly string[];
  [key: string]: unknown;
};

export type EdiReasoningUnderstandingReference = {
  id: string;
  timestamp: number;
  inferredMeaning: string;
};

export type EdiReasoningAlternative = {
  id: string;
  label: string;
  description?: string;
  metadata?: EdiReasoningMetadata;
};

export type EdiReasoningConstraint = {
  id: string;
  label: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: EdiReasoningMetadata;
};

export type EdiReasoningConsequence = {
  id: string;
  label: string;
  description?: string;
  impact?: "low" | "medium" | "high" | "critical";
  metadata?: EdiReasoningMetadata;
};

export type EdiReasoningRisk = {
  id: string;
  label: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: EdiReasoningMetadata;
};

export type EdiReasoningArtifact = {
  id: string;
  timestamp: number;
  sourceUnderstandingReferences: readonly EdiReasoningUnderstandingReference[];
  alternatives: readonly EdiReasoningAlternative[];
  constraints: readonly EdiReasoningConstraint[];
  consequences: readonly EdiReasoningConsequence[];
  tradeoffs: readonly string[];
  assumptions: readonly string[];
  risks: readonly EdiReasoningRisk[];
  rationale: string;
  metadata?: EdiReasoningMetadata;
};

export type EdiReasoningArtifactInput = {
  id?: string;
  timestamp?: number;
  sourceUnderstandingArtifacts: readonly EdiUnderstandingArtifact[];
  alternatives?: readonly EdiReasoningAlternative[];
  constraints?: readonly EdiReasoningConstraint[];
  consequences?: readonly EdiReasoningConsequence[];
  tradeoffs?: readonly string[];
  assumptions?: readonly string[];
  risks?: readonly EdiReasoningRisk[];
  rationale: string;
  metadata?: EdiReasoningMetadata;
};

const copyReasoningMetadata = (
  metadata: EdiReasoningMetadata | undefined,
): EdiReasoningMetadata | undefined => (metadata ? { ...metadata } : undefined);

export const createEdiReasoningArtifact = (
  input: EdiReasoningArtifactInput,
): EdiReasoningArtifact => {
  const timestamp = input.timestamp ?? Date.now();
  const sourceUnderstandingReferences = input.sourceUnderstandingArtifacts.map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    inferredMeaning: artifact.inferredMeaning,
  }));
  const understandingArtifactIds = sourceUnderstandingReferences.map((artifact) => artifact.id);

  return {
    id: input.id ?? `reasoning:${understandingArtifactIds.join(":") || "unknown"}:${timestamp}`,
    timestamp,
    sourceUnderstandingReferences,
    alternatives: (input.alternatives ?? []).map((alternative) => ({
      ...alternative,
      metadata: copyReasoningMetadata(alternative.metadata),
    })),
    constraints: (input.constraints ?? []).map((constraint) => ({
      ...constraint,
      metadata: copyReasoningMetadata(constraint.metadata),
    })),
    consequences: (input.consequences ?? []).map((consequence) => ({
      ...consequence,
      metadata: copyReasoningMetadata(consequence.metadata),
    })),
    tradeoffs: [...(input.tradeoffs ?? [])],
    assumptions: [...(input.assumptions ?? [])],
    risks: (input.risks ?? []).map((risk) => ({
      ...risk,
      metadata: copyReasoningMetadata(risk.metadata),
    })),
    rationale: input.rationale,
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiReasoningArtifact",
      understandingArtifactIds:
        input.metadata?.understandingArtifactIds ?? understandingArtifactIds,
    },
  };
};
