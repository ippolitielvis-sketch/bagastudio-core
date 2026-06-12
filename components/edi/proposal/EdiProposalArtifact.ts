import type { EdiReasoningArtifact } from "../reasoning/EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";

export type EdiProposalMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  reasoningArtifactIds?: readonly string[];
  understandingArtifactIds?: readonly string[];
  [key: string]: unknown;
};

export type EdiProposalType = "observation" | "improvement" | "optimization" | "warning" | "planning";

export type EdiProposalCategory = {
  label: string;
  domain?: string;
  metadata?: EdiProposalMetadata;
};

export type EdiProposalReasoningReference = {
  id: string;
  timestamp: number;
  rationale: string;
};

export type EdiProposalUnderstandingReference = {
  id: string;
  timestamp: number;
  inferredMeaning: string;
};

export type EdiProposalArtifact = {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  proposalType: EdiProposalType;
  proposalCategory?: EdiProposalCategory;
  rationale: string;
  expectedBenefits: readonly string[];
  expectedRisks: readonly string[];
  relatedReasoningArtifacts: readonly EdiProposalReasoningReference[];
  relatedUnderstandingArtifacts: readonly EdiProposalUnderstandingReference[];
  metadata?: EdiProposalMetadata;
};

export type EdiProposalArtifactInput = {
  id?: string;
  timestamp: number;
  title: string;
  description: string;
  proposalType: EdiProposalType;
  proposalCategory?: EdiProposalCategory;
  rationale: string;
  expectedBenefits?: readonly string[];
  expectedRisks?: readonly string[];
  relatedReasoningArtifacts?: readonly EdiReasoningArtifact[];
  relatedUnderstandingArtifacts?: readonly EdiUnderstandingArtifact[];
  metadata?: EdiProposalMetadata;
};

const copyProposalMetadata = (
  metadata: EdiProposalMetadata | undefined,
): EdiProposalMetadata | undefined => (metadata ? { ...metadata } : undefined);

export const createEdiProposalArtifact = (
  input: EdiProposalArtifactInput,
): EdiProposalArtifact => {
  const relatedReasoningArtifacts = (input.relatedReasoningArtifacts ?? []).map((artifact) => ({
    id: artifact.id,
    timestamp: artifact.timestamp,
    rationale: artifact.rationale,
  }));
  const relatedUnderstandingArtifacts = (input.relatedUnderstandingArtifacts ?? []).map(
    (artifact) => ({
      id: artifact.id,
      timestamp: artifact.timestamp,
      inferredMeaning: artifact.inferredMeaning,
    }),
  );
  const reasoningArtifactIds = relatedReasoningArtifacts.map((artifact) => artifact.id);
  const understandingArtifactIds = relatedUnderstandingArtifacts.map((artifact) => artifact.id);

  return {
    id: input.id ?? `proposal:${reasoningArtifactIds.join(":") || "unknown"}:${input.timestamp}`,
    timestamp: input.timestamp,
    title: input.title,
    description: input.description,
    proposalType: input.proposalType,
    proposalCategory: input.proposalCategory
      ? {
          ...input.proposalCategory,
          metadata: copyProposalMetadata(input.proposalCategory.metadata),
        }
      : undefined,
    rationale: input.rationale,
    expectedBenefits: [...(input.expectedBenefits ?? [])],
    expectedRisks: [...(input.expectedRisks ?? [])],
    relatedReasoningArtifacts,
    relatedUnderstandingArtifacts,
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiProposalArtifact",
      reasoningArtifactIds: input.metadata?.reasoningArtifactIds ?? reasoningArtifactIds,
      understandingArtifactIds:
        input.metadata?.understandingArtifactIds ?? understandingArtifactIds,
    },
  };
};
