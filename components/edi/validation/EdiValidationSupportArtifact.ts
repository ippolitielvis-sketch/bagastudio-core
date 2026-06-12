import type { EdiProposalArtifact } from "../proposal/EdiProposalArtifact";
import type { EdiReasoningArtifact } from "../reasoning/EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";

export type EdiValidationSupportMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  proposalArtifactIds?: readonly string[];
  reasoningArtifactIds?: readonly string[];
  understandingArtifactIds?: readonly string[];
  [key: string]: unknown;
};

export type EdiValidationSupportContext = {
  id: string;
  label: string;
  description?: string;
  domain?: string;
  metadata?: EdiValidationSupportMetadata;
};

export type EdiValidationSupportReference = {
  id: string;
  timestamp: number;
  label?: string;
  summary?: string;
  metadata?: EdiValidationSupportMetadata;
};

export type EdiValidationSupportItem = {
  id: string;
  label: string;
  description?: string;
  metadata?: EdiValidationSupportMetadata;
};

export type EdiValidationSupportArtifact = {
  id: string;
  timestamp: number;
  validationContext: EdiValidationSupportContext;
  proposalReferences: readonly EdiValidationSupportReference[];
  reasoningReferences: readonly EdiValidationSupportReference[];
  understandingReferences: readonly EdiValidationSupportReference[];
  validationConsiderations: readonly EdiValidationSupportItem[];
  validationRisks: readonly EdiValidationSupportItem[];
  validationBenefits: readonly EdiValidationSupportItem[];
  validationQuestions: readonly EdiValidationSupportItem[];
  metadata?: EdiValidationSupportMetadata;
};

export type EdiValidationSupportArtifactInput = {
  id?: string;
  timestamp: number;
  validationContext: EdiValidationSupportContext;
  proposalArtifacts?: readonly EdiProposalArtifact[];
  reasoningArtifacts?: readonly EdiReasoningArtifact[];
  understandingArtifacts?: readonly EdiUnderstandingArtifact[];
  validationConsiderations?: readonly EdiValidationSupportItem[];
  validationRisks?: readonly EdiValidationSupportItem[];
  validationBenefits?: readonly EdiValidationSupportItem[];
  validationQuestions?: readonly EdiValidationSupportItem[];
  metadata?: EdiValidationSupportMetadata;
};

const copyValidationSupportMetadata = (
  metadata: EdiValidationSupportMetadata | undefined,
): EdiValidationSupportMetadata | undefined => (metadata ? { ...metadata } : undefined);

const copyValidationSupportItem = (
  item: EdiValidationSupportItem,
): EdiValidationSupportItem => ({
  ...item,
  metadata: copyValidationSupportMetadata(item.metadata),
});

export const createEdiValidationSupportArtifact = (
  input: EdiValidationSupportArtifactInput,
): EdiValidationSupportArtifact => {
  const proposalReferences = (input.proposalArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    label: artifact.title,
    summary: artifact.description,
    metadata: copyValidationSupportMetadata(artifact.metadata),
  }));
  const reasoningReferences = (input.reasoningArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    summary: artifact.rationale,
    metadata: copyValidationSupportMetadata(artifact.metadata),
  }));
  const understandingReferences = (input.understandingArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    summary: artifact.inferredMeaning,
    metadata: copyValidationSupportMetadata(artifact.metadata),
  }));
  const proposalArtifactIds = proposalReferences.map((reference) => reference.id);
  const reasoningArtifactIds = reasoningReferences.map((reference) => reference.id);
  const understandingArtifactIds = understandingReferences.map((reference) => reference.id);

  return {
    id: input.id ?? `validation-support:${proposalArtifactIds.join(":") || "unknown"}:${input.timestamp}`,
    timestamp: input.timestamp,
    validationContext: {
      ...input.validationContext,
      metadata: copyValidationSupportMetadata(input.validationContext.metadata),
    },
    proposalReferences,
    reasoningReferences,
    understandingReferences,
    validationConsiderations: (input.validationConsiderations ?? []).map(copyValidationSupportItem),
    validationRisks: (input.validationRisks ?? []).map(copyValidationSupportItem),
    validationBenefits: (input.validationBenefits ?? []).map(copyValidationSupportItem),
    validationQuestions: (input.validationQuestions ?? []).map(copyValidationSupportItem),
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiValidationSupportArtifact",
      proposalArtifactIds: input.metadata?.proposalArtifactIds ?? proposalArtifactIds,
      reasoningArtifactIds: input.metadata?.reasoningArtifactIds ?? reasoningArtifactIds,
      understandingArtifactIds:
        input.metadata?.understandingArtifactIds ?? understandingArtifactIds,
    },
  };
};
