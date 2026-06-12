export type EdiReasoningDerivationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  derivedAt?: number;
  [key: string]: unknown;
};

export type EdiReasoningReference = {
  id: string;
  type?: string;
  label?: string;
  metadata?: EdiReasoningDerivationMetadata;
};

export type EdiReasoningTraceability = {
  id: string;
  timestamp: number;
  sourceArtifactIds: readonly string[];
  understandingReferences: readonly EdiReasoningReference[];
  lineageReferences: readonly EdiReasoningReference[];
  assumptionReferences: readonly EdiReasoningReference[];
  constraintReferences: readonly EdiReasoningReference[];
  derivationMetadata?: EdiReasoningDerivationMetadata;
};

export type EdiReasoningTraceabilityInput = {
  id?: string;
  timestamp: number;
  sourceArtifactIds?: readonly string[];
  understandingReferences?: readonly EdiReasoningReference[];
  lineageReferences?: readonly EdiReasoningReference[];
  assumptionReferences?: readonly EdiReasoningReference[];
  constraintReferences?: readonly EdiReasoningReference[];
  derivationMetadata?: EdiReasoningDerivationMetadata;
};

const copyReference = (reference: EdiReasoningReference): EdiReasoningReference => ({
  ...reference,
  metadata: reference.metadata ? { ...reference.metadata } : undefined,
});

export const createEdiReasoningTraceability = (
  input: EdiReasoningTraceabilityInput,
): EdiReasoningTraceability => ({
  id: input.id ?? `reasoning-traceability:${input.timestamp}`,
  timestamp: input.timestamp,
  sourceArtifactIds: [...(input.sourceArtifactIds ?? [])],
  understandingReferences: (input.understandingReferences ?? []).map(copyReference),
  lineageReferences: (input.lineageReferences ?? []).map(copyReference),
  assumptionReferences: (input.assumptionReferences ?? []).map(copyReference),
  constraintReferences: (input.constraintReferences ?? []).map(copyReference),
  derivationMetadata: input.derivationMetadata
    ? {
        ...input.derivationMetadata,
        derivedAt: input.derivationMetadata.derivedAt ?? input.timestamp,
      }
    : {
        source: "EdiReasoningTraceability",
        derivedAt: input.timestamp,
      },
});
