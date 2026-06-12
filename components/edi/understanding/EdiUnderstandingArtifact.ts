import type { EdiMemoryEntry } from "../memory/EdiMemoryEntry";

export type EdiUnderstandingMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  memoryEntryIds?: readonly string[];
  [key: string]: unknown;
};

export type EdiUnderstandingClassification = {
  label: string;
  domain?: string;
  confidence?: number;
  metadata?: EdiUnderstandingMetadata;
};

export type EdiUnderstandingRelation = {
  sourceId: string;
  targetId: string;
  type: string;
  meaning?: string;
  metadata?: EdiUnderstandingMetadata;
};

export type EdiUnderstandingMemoryReference = {
  id: string;
  timestamp: number;
  source: EdiMemoryEntry["source"];
  category: EdiMemoryEntry["category"];
};

export type EdiUnderstandingArtifact = {
  id: string;
  timestamp: number;
  sourceMemoryReferences: readonly EdiUnderstandingMemoryReference[];
  classification?: EdiUnderstandingClassification;
  inferredMeaning: string;
  contextualNotes: readonly string[];
  relations: readonly EdiUnderstandingRelation[];
  metadata?: EdiUnderstandingMetadata;
};

export type EdiUnderstandingArtifactInput = {
  id?: string;
  timestamp?: number;
  sourceMemoryEntries: readonly EdiMemoryEntry[];
  classification?: EdiUnderstandingClassification;
  inferredMeaning: string;
  contextualNotes?: readonly string[];
  relations?: readonly EdiUnderstandingRelation[];
  metadata?: EdiUnderstandingMetadata;
};

export const createEdiUnderstandingArtifact = (
  input: EdiUnderstandingArtifactInput,
): EdiUnderstandingArtifact => {
  const timestamp = input.timestamp ?? Date.now();
  const sourceMemoryReferences = input.sourceMemoryEntries.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    source: entry.source,
    category: entry.category,
  }));
  const memoryEntryIds = sourceMemoryReferences.map((entry) => entry.id);

  return {
    id: input.id ?? `understanding:${memoryEntryIds.join(":") || "unknown"}:${timestamp}`,
    timestamp,
    sourceMemoryReferences,
    classification: input.classification
      ? {
          ...input.classification,
          metadata: input.classification.metadata ? { ...input.classification.metadata } : undefined,
        }
      : undefined,
    inferredMeaning: input.inferredMeaning,
    contextualNotes: [...(input.contextualNotes ?? [])],
    relations: (input.relations ?? []).map((relation) => ({
      ...relation,
      metadata: relation.metadata ? { ...relation.metadata } : undefined,
    })),
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiUnderstandingArtifact",
      memoryEntryIds: input.metadata?.memoryEntryIds ?? memoryEntryIds,
    },
  };
};
