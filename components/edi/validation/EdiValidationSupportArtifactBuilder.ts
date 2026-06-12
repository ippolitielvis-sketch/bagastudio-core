import type { EdiProposalArtifact } from "../proposal/EdiProposalArtifact";
import type { EdiReasoningArtifact } from "../reasoning/EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";
import {
  createEdiValidationSupportArtifact,
  type EdiValidationSupportArtifact,
  type EdiValidationSupportContext,
  type EdiValidationSupportItem,
  type EdiValidationSupportMetadata,
} from "./EdiValidationSupportArtifact";

export type BuildEdiValidationSupportArtifactInput = {
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

export type BuildEdiValidationSupportArtifactsInput = {
  artifacts: readonly BuildEdiValidationSupportArtifactInput[];
};

export type EdiValidationSupportArtifactBuilder = {
  buildValidationSupportArtifact(
    input: BuildEdiValidationSupportArtifactInput,
  ): EdiValidationSupportArtifact;
  buildValidationSupportArtifacts(
    input: BuildEdiValidationSupportArtifactsInput,
  ): readonly EdiValidationSupportArtifact[];
};

export const createEdiValidationSupportArtifactBuilder =
  (): EdiValidationSupportArtifactBuilder => {
    const buildValidationSupportArtifact = (
      input: BuildEdiValidationSupportArtifactInput,
    ): EdiValidationSupportArtifact =>
      createEdiValidationSupportArtifact({
        id: input.id,
        timestamp: input.timestamp,
        validationContext: input.validationContext,
        proposalArtifacts: input.proposalArtifacts,
        reasoningArtifacts: input.reasoningArtifacts,
        understandingArtifacts: input.understandingArtifacts,
        validationConsiderations: input.validationConsiderations,
        validationRisks: input.validationRisks,
        validationBenefits: input.validationBenefits,
        validationQuestions: input.validationQuestions,
        metadata: input.metadata,
      });

    return {
      buildValidationSupportArtifact,
      buildValidationSupportArtifacts: (input) =>
        input.artifacts.map(buildValidationSupportArtifact),
    };
  };
