export type EdiProposalDerivationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  derivedAt?: number;
  [key: string]: unknown;
};

export type EdiProposalReference = {
  id: string;
  type?: string;
  label?: string;
  metadata?: EdiProposalDerivationMetadata;
};

export type EdiProposalTraceability = {
  id: string;
  timestamp: number;
  sourceArtifactIds: readonly string[];
  understandingReferences: readonly EdiProposalReference[];
  reasoningReferences: readonly EdiProposalReference[];
  proposalLineageReferences: readonly EdiProposalReference[];
  assumptionReferences: readonly EdiProposalReference[];
  riskReferences: readonly EdiProposalReference[];
  derivationMetadata?: EdiProposalDerivationMetadata;
};

export type EdiProposalTraceabilityInput = {
  id?: string;
  timestamp: number;
  sourceArtifactIds?: readonly string[];
  understandingReferences?: readonly EdiProposalReference[];
  reasoningReferences?: readonly EdiProposalReference[];
  proposalLineageReferences?: readonly EdiProposalReference[];
  assumptionReferences?: readonly EdiProposalReference[];
  riskReferences?: readonly EdiProposalReference[];
  derivationMetadata?: EdiProposalDerivationMetadata;
};

const copyProposalReference = (reference: EdiProposalReference): EdiProposalReference => ({
  ...reference,
  metadata: reference.metadata ? { ...reference.metadata } : undefined,
});

export const createEdiProposalTraceability = (
  input: EdiProposalTraceabilityInput,
): EdiProposalTraceability => ({
  id: input.id ?? `proposal-traceability:${input.timestamp}`,
  timestamp: input.timestamp,
  sourceArtifactIds: [...(input.sourceArtifactIds ?? [])],
  understandingReferences: (input.understandingReferences ?? []).map(copyProposalReference),
  reasoningReferences: (input.reasoningReferences ?? []).map(copyProposalReference),
  proposalLineageReferences: (input.proposalLineageReferences ?? []).map(copyProposalReference),
  assumptionReferences: (input.assumptionReferences ?? []).map(copyProposalReference),
  riskReferences: (input.riskReferences ?? []).map(copyProposalReference),
  derivationMetadata: input.derivationMetadata
    ? {
        ...input.derivationMetadata,
        derivedAt: input.derivationMetadata.derivedAt ?? input.timestamp,
      }
    : {
        source: "EdiProposalTraceability",
        derivedAt: input.timestamp,
      },
});
