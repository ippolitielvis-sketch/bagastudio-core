import type { EdiProposalArtifact } from "../proposal/EdiProposalArtifact";
import type { EdiReasoningArtifact } from "../reasoning/EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";
import type { EdiValidationSupportArtifact } from "../validation/EdiValidationSupportArtifact";

export type EdiDecisionSupportMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  validationSupportArtifactIds?: readonly string[];
  proposalArtifactIds?: readonly string[];
  reasoningArtifactIds?: readonly string[];
  understandingArtifactIds?: readonly string[];
  [key: string]: unknown;
};

export type EdiDecisionSupportContext = {
  id: string;
  label: string;
  description?: string;
  domain?: string;
  metadata?: EdiDecisionSupportMetadata;
};

export type EdiDecisionSupportReference = {
  id: string;
  timestamp: number;
  label?: string;
  summary?: string;
  metadata?: EdiDecisionSupportMetadata;
};

export type EdiDecisionSupportItem = {
  id: string;
  label: string;
  description?: string;
  metadata?: EdiDecisionSupportMetadata;
};

export type EdiDecisionSupportArtifact = {
  id: string;
  timestamp: number;
  decisionContext: EdiDecisionSupportContext;
  validationSupportReferences: readonly EdiDecisionSupportReference[];
  proposalReferences: readonly EdiDecisionSupportReference[];
  reasoningReferences: readonly EdiDecisionSupportReference[];
  understandingReferences: readonly EdiDecisionSupportReference[];
  decisionFactors: readonly EdiDecisionSupportItem[];
  decisionOptions: readonly EdiDecisionSupportItem[];
  decisionTradeoffs: readonly EdiDecisionSupportItem[];
  decisionRisks: readonly EdiDecisionSupportItem[];
  decisionQuestions: readonly EdiDecisionSupportItem[];
  metadata?: EdiDecisionSupportMetadata;
};

export type EdiDecisionSupportArtifactInput = {
  id?: string;
  timestamp: number;
  decisionContext: EdiDecisionSupportContext;
  validationSupportArtifacts?: readonly EdiValidationSupportArtifact[];
  proposalArtifacts?: readonly EdiProposalArtifact[];
  reasoningArtifacts?: readonly EdiReasoningArtifact[];
  understandingArtifacts?: readonly EdiUnderstandingArtifact[];
  decisionFactors?: readonly EdiDecisionSupportItem[];
  decisionOptions?: readonly EdiDecisionSupportItem[];
  decisionTradeoffs?: readonly EdiDecisionSupportItem[];
  decisionRisks?: readonly EdiDecisionSupportItem[];
  decisionQuestions?: readonly EdiDecisionSupportItem[];
  metadata?: EdiDecisionSupportMetadata;
};

const copyDecisionSupportMetadata = (
  metadata: EdiDecisionSupportMetadata | undefined,
): EdiDecisionSupportMetadata | undefined => (metadata ? { ...metadata } : undefined);

const copyDecisionSupportItem = (
  item: EdiDecisionSupportItem,
): EdiDecisionSupportItem => ({
  ...item,
  metadata: copyDecisionSupportMetadata(item.metadata),
});

export const createEdiDecisionSupportArtifact = (
  input: EdiDecisionSupportArtifactInput,
): EdiDecisionSupportArtifact => {
  const validationSupportReferences = (input.validationSupportArtifacts ?? []).map(
    (artifact) => ({
      id: artifact.id,
      timestamp: artifact.timestamp,
      label: artifact.validationContext.label,
      summary: artifact.validationContext.description,
      metadata: copyDecisionSupportMetadata(artifact.metadata),
    }),
  );
  const proposalReferences = (input.proposalArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    label: artifact.title,
    summary: artifact.description,
    metadata: copyDecisionSupportMetadata(artifact.metadata),
  }));
  const reasoningReferences = (input.reasoningArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    summary: artifact.rationale,
    metadata: copyDecisionSupportMetadata(artifact.metadata),
  }));
  const understandingReferences = (input.understandingArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    summary: artifact.inferredMeaning,
    metadata: copyDecisionSupportMetadata(artifact.metadata),
  }));
  const validationSupportArtifactIds = validationSupportReferences.map(
    (reference) => reference.id,
  );
  const proposalArtifactIds = proposalReferences.map((reference) => reference.id);
  const reasoningArtifactIds = reasoningReferences.map((reference) => reference.id);
  const understandingArtifactIds = understandingReferences.map((reference) => reference.id);

  return {
    id:
      input.id ??
      `decision-support:${validationSupportArtifactIds.join(":") || "unknown"}:${input.timestamp}`,
    timestamp: input.timestamp,
    decisionContext: {
      ...input.decisionContext,
      metadata: copyDecisionSupportMetadata(input.decisionContext.metadata),
    },
    validationSupportReferences,
    proposalReferences,
    reasoningReferences,
    understandingReferences,
    decisionFactors: (input.decisionFactors ?? []).map(copyDecisionSupportItem),
    decisionOptions: (input.decisionOptions ?? []).map(copyDecisionSupportItem),
    decisionTradeoffs: (input.decisionTradeoffs ?? []).map(copyDecisionSupportItem),
    decisionRisks: (input.decisionRisks ?? []).map(copyDecisionSupportItem),
    decisionQuestions: (input.decisionQuestions ?? []).map(copyDecisionSupportItem),
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiDecisionSupportArtifact",
      validationSupportArtifactIds:
        input.metadata?.validationSupportArtifactIds ?? validationSupportArtifactIds,
      proposalArtifactIds: input.metadata?.proposalArtifactIds ?? proposalArtifactIds,
      reasoningArtifactIds: input.metadata?.reasoningArtifactIds ?? reasoningArtifactIds,
      understandingArtifactIds:
        input.metadata?.understandingArtifactIds ?? understandingArtifactIds,
    },
  };
};
