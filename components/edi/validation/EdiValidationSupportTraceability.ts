export type EdiValidationSupportDerivationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  derivedAt?: number;
  [key: string]: unknown;
};

export type EdiValidationSupportTraceabilityReference = {
  id: string;
  type?: string;
  label?: string;
  metadata?: EdiValidationSupportDerivationMetadata;
};

export type EdiValidationSupportTraceability = {
  id: string;
  timestamp: number;
  sourceArtifactIds: readonly string[];
  understandingReferences: readonly EdiValidationSupportTraceabilityReference[];
  reasoningReferences: readonly EdiValidationSupportTraceabilityReference[];
  proposalReferences: readonly EdiValidationSupportTraceabilityReference[];
  validationSupportLineageReferences: readonly EdiValidationSupportTraceabilityReference[];
  considerationReferences: readonly EdiValidationSupportTraceabilityReference[];
  riskReferences: readonly EdiValidationSupportTraceabilityReference[];
  questionReferences: readonly EdiValidationSupportTraceabilityReference[];
  derivationMetadata?: EdiValidationSupportDerivationMetadata;
};

export type EdiValidationSupportTraceabilityInput = {
  id?: string;
  timestamp: number;
  sourceArtifactIds?: readonly string[];
  understandingReferences?: readonly EdiValidationSupportTraceabilityReference[];
  reasoningReferences?: readonly EdiValidationSupportTraceabilityReference[];
  proposalReferences?: readonly EdiValidationSupportTraceabilityReference[];
  validationSupportLineageReferences?: readonly EdiValidationSupportTraceabilityReference[];
  considerationReferences?: readonly EdiValidationSupportTraceabilityReference[];
  riskReferences?: readonly EdiValidationSupportTraceabilityReference[];
  questionReferences?: readonly EdiValidationSupportTraceabilityReference[];
  derivationMetadata?: EdiValidationSupportDerivationMetadata;
};

const copyValidationSupportTraceabilityReference = (
  reference: EdiValidationSupportTraceabilityReference,
): EdiValidationSupportTraceabilityReference => ({
  ...reference,
  metadata: reference.metadata ? { ...reference.metadata } : undefined,
});

export const createEdiValidationSupportTraceability = (
  input: EdiValidationSupportTraceabilityInput,
): EdiValidationSupportTraceability => ({
  id: input.id ?? `validation-support-traceability:${input.timestamp}`,
  timestamp: input.timestamp,
  sourceArtifactIds: [...(input.sourceArtifactIds ?? [])],
  understandingReferences: (input.understandingReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  reasoningReferences: (input.reasoningReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  proposalReferences: (input.proposalReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  validationSupportLineageReferences: (input.validationSupportLineageReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  considerationReferences: (input.considerationReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  riskReferences: (input.riskReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  questionReferences: (input.questionReferences ?? []).map(
    copyValidationSupportTraceabilityReference,
  ),
  derivationMetadata: input.derivationMetadata
    ? {
        ...input.derivationMetadata,
        derivedAt: input.derivationMetadata.derivedAt ?? input.timestamp,
      }
    : {
        source: "EdiValidationSupportTraceability",
        derivedAt: input.timestamp,
      },
});
