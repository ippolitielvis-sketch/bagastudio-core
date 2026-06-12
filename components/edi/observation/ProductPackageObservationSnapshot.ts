export type ProductPackageObservationMetadata = {
  source?: string;
  reason?: string;
  traceId?: string;
  productPackageId?: string;
  productPackageVersion?: string;
  schema?: string;
  sourceFormat?: string;
  observedAt?: number;
  [key: string]: unknown;
};

export type ProductPackageObservationDimensionSnapshot = {
  width?: number;
  height?: number;
  depth?: number;
  unit?: string;
  metadata?: ProductPackageObservationMetadata;
};

export type ProductPackageObservationComponentSnapshot = {
  id: string;
  type?: string;
  category?: string;
  material?: string;
  finish?: string;
  quantity?: number;
  metadata?: ProductPackageObservationMetadata;
};

export type ProductPackageObservationSnapshot = {
  id: string;
  timestamp: number;
  productPackageId?: string;
  productPackageVersion?: string;
  schema?: string;
  sourceFormat?: string;
  status?: string;
  dimensions?: ProductPackageObservationDimensionSnapshot;
  footprint?: ProductPackageObservationDimensionSnapshot;
  componentIds: readonly string[];
  componentCount: number;
  components: readonly ProductPackageObservationComponentSnapshot[];
  materials: readonly string[];
  finishes: readonly string[];
  metadata?: ProductPackageObservationMetadata;
};

export type ProductPackageObservationSnapshotInput = {
  id?: string;
  timestamp?: number;
  productPackageId?: string;
  productPackageVersion?: string;
  schema?: string;
  sourceFormat?: string;
  status?: string;
  dimensions?: ProductPackageObservationDimensionSnapshot;
  footprint?: ProductPackageObservationDimensionSnapshot;
  componentIds?: readonly string[];
  componentCount?: number;
  components?: readonly ProductPackageObservationComponentSnapshot[];
  materials?: readonly string[];
  finishes?: readonly string[];
  metadata?: ProductPackageObservationMetadata;
};

export const createProductPackageObservationSnapshot = (
  input: ProductPackageObservationSnapshotInput,
): ProductPackageObservationSnapshot => {
  const timestamp = input.timestamp ?? Date.now();
  const componentIds = [...(input.componentIds ?? [])];
  const components = (input.components ?? []).map((component) => ({
    ...component,
    metadata: component.metadata ? { ...component.metadata } : undefined,
  }));
  const materials = [...(input.materials ?? [])];
  const finishes = [...(input.finishes ?? [])];

  return {
    id: input.id ?? `product-package-observation:${input.productPackageId ?? "unknown"}:${timestamp}`,
    timestamp,
    productPackageId: input.productPackageId,
    productPackageVersion: input.productPackageVersion,
    schema: input.schema,
    sourceFormat: input.sourceFormat,
    status: input.status,
    dimensions: input.dimensions
      ? {
          ...input.dimensions,
          metadata: input.dimensions.metadata ? { ...input.dimensions.metadata } : undefined,
        }
      : undefined,
    footprint: input.footprint
      ? {
          ...input.footprint,
          metadata: input.footprint.metadata ? { ...input.footprint.metadata } : undefined,
        }
      : undefined,
    componentIds,
    componentCount: input.componentCount ?? componentIds.length,
    components,
    materials,
    finishes,
    metadata: input.metadata
      ? {
          ...input.metadata,
          observedAt: input.metadata.observedAt ?? timestamp,
        }
      : {
          source: "ProductPackageObservationSnapshot",
          observedAt: timestamp,
        },
  };
};
