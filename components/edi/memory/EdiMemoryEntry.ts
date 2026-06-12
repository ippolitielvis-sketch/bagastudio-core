import type { ProductPackageObservationSnapshot } from "../observation/ProductPackageObservationSnapshot";

export type EdiMemoryEntrySource =
  | "observation-snapshot"
  | "product-package-observation"
  | "domain-observation"
  | "decision"
  | "proposal"
  | "error"
  | "validation"
  | "system";

export type EdiMemoryEntryCategory =
  | "observation"
  | "decision"
  | "proposal"
  | "error"
  | "validation"
  | "preference"
  | "business"
  | "system";

export type EdiMemoryEntryMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  observationSnapshotId?: string;
  productPackageId?: string;
  productPackageVersion?: string;
  schema?: string;
  sourceFormat?: string;
  [key: string]: unknown;
};

export type EdiMemoryEntryObservationReference = {
  id: string;
  timestamp: number;
  source: EdiMemoryEntrySource;
  productPackageId?: string;
  schema?: string;
};

export type EdiMemoryEntry = {
  id: string;
  timestamp: number;
  source: EdiMemoryEntrySource;
  category: EdiMemoryEntryCategory;
  summary: string;
  observationSnapshot: EdiMemoryEntryObservationReference;
  metadata?: EdiMemoryEntryMetadata;
};

export type CreateEdiMemoryEntryFromObservationSnapshotInput = {
  observationSnapshot: ProductPackageObservationSnapshot;
  id?: string;
  timestamp?: number;
  source?: EdiMemoryEntrySource;
  category?: EdiMemoryEntryCategory;
  summary?: string;
  metadata?: EdiMemoryEntryMetadata;
};

const createObservationSummary = (snapshot: ProductPackageObservationSnapshot): string => {
  const product = snapshot.productPackageId ?? "unknown-product";
  const status = snapshot.status ?? "unknown-status";

  return `Product observation ${product}: ${snapshot.componentCount} components, status ${status}`;
};

export const createEdiMemoryEntryFromObservationSnapshot = (
  input: CreateEdiMemoryEntryFromObservationSnapshotInput,
): EdiMemoryEntry => {
  const timestamp = input.timestamp ?? Date.now();
  const source = input.source ?? "product-package-observation";
  const category = input.category ?? "observation";
  const snapshot = input.observationSnapshot;

  return {
    id: input.id ?? `memory-entry:${snapshot.id}:${timestamp}`,
    timestamp,
    source,
    category,
    summary: input.summary ?? createObservationSummary(snapshot),
    observationSnapshot: {
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      source,
      productPackageId: snapshot.productPackageId,
      schema: snapshot.schema,
    },
    metadata: {
      ...input.metadata,
      source: input.metadata?.source ?? "EdiMemoryEntry",
      observationSnapshotId: input.metadata?.observationSnapshotId ?? snapshot.id,
      productPackageId: input.metadata?.productPackageId ?? snapshot.productPackageId,
      productPackageVersion: input.metadata?.productPackageVersion ?? snapshot.productPackageVersion,
      schema: input.metadata?.schema ?? snapshot.schema,
      sourceFormat: input.metadata?.sourceFormat ?? snapshot.sourceFormat,
    },
  };
};
