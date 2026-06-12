import {
  createEdiReasoningArtifact,
  type EdiReasoningAlternative,
  type EdiReasoningArtifact,
  type EdiReasoningConsequence,
  type EdiReasoningConstraint,
  type EdiReasoningMetadata,
  type EdiReasoningRisk,
} from "./EdiReasoningArtifact";
import type { EdiUnderstandingArtifact } from "../understanding/EdiUnderstandingArtifact";

export type BuildEdiReasoningArtifactInput = {
  sourceUnderstandingArtifacts: readonly EdiUnderstandingArtifact[];
  id?: string;
  timestamp: number;
  alternatives?: readonly EdiReasoningAlternative[];
  constraints?: readonly EdiReasoningConstraint[];
  consequences?: readonly EdiReasoningConsequence[];
  tradeoffs?: readonly string[];
  assumptions?: readonly string[];
  risks?: readonly EdiReasoningRisk[];
  rationale: string;
  metadata?: EdiReasoningMetadata;
};

export type BuildEdiReasoningArtifactsInput = {
  artifacts: readonly BuildEdiReasoningArtifactInput[];
};

export type EdiReasoningArtifactBuilder = {
  buildReasoningArtifact(input: BuildEdiReasoningArtifactInput): EdiReasoningArtifact;
  buildReasoningArtifacts(input: BuildEdiReasoningArtifactsInput): readonly EdiReasoningArtifact[];
};

export const createEdiReasoningArtifactBuilder = (): EdiReasoningArtifactBuilder => {
  const buildReasoningArtifact = (
    input: BuildEdiReasoningArtifactInput,
  ): EdiReasoningArtifact =>
    createEdiReasoningArtifact({
      id: input.id,
      timestamp: input.timestamp,
      sourceUnderstandingArtifacts: input.sourceUnderstandingArtifacts,
      alternatives: input.alternatives,
      constraints: input.constraints,
      consequences: input.consequences,
      tradeoffs: input.tradeoffs,
      assumptions: input.assumptions,
      risks: input.risks,
      rationale: input.rationale,
      metadata: input.metadata,
    });

  return {
    buildReasoningArtifact,
    buildReasoningArtifacts: (input) => input.artifacts.map(buildReasoningArtifact),
  };
};
