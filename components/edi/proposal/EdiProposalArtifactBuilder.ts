import {
  createEdiProposalArtifact,
  type EdiProposalArtifact,
  type EdiProposalCategory,
  type EdiProposalMetadata,
  type EdiProposalType,
} from "./EdiProposalArtifact";
import type { EdiReasoningArtifact } from "../reasoning/EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";

export type BuildEdiProposalArtifactInput = {
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

export type BuildEdiProposalArtifactsInput = {
  artifacts: readonly BuildEdiProposalArtifactInput[];
};

export type EdiProposalArtifactBuilder = {
  buildProposalArtifact(input: BuildEdiProposalArtifactInput): EdiProposalArtifact;
  buildProposalArtifacts(input: BuildEdiProposalArtifactsInput): readonly EdiProposalArtifact[];
};

export const createEdiProposalArtifactBuilder = (): EdiProposalArtifactBuilder => {
  const buildProposalArtifact = (
    input: BuildEdiProposalArtifactInput,
  ): EdiProposalArtifact =>
    createEdiProposalArtifact({
      id: input.id,
      timestamp: input.timestamp,
      title: input.title,
      description: input.description,
      proposalType: input.proposalType,
      proposalCategory: input.proposalCategory,
      rationale: input.rationale,
      expectedBenefits: input.expectedBenefits,
      expectedRisks: input.expectedRisks,
      relatedReasoningArtifacts: input.relatedReasoningArtifacts,
      relatedUnderstandingArtifacts: input.relatedUnderstandingArtifacts,
      metadata: input.metadata,
    });

  return {
    buildProposalArtifact,
    buildProposalArtifacts: (input) => input.artifacts.map(buildProposalArtifact),
  };
};
