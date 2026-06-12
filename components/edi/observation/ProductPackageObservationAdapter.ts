import {
  createProductPackageObservationSnapshot,
  type ProductPackageObservationComponentSnapshot,
  type ProductPackageObservationDimensionSnapshot,
  type ProductPackageObservationMetadata,
  type ProductPackageObservationSnapshot,
} from "./ProductPackageObservationSnapshot";

export type ProductPackageObservationAdapterInput = {
  productPackage: Record<string, unknown>;
  id?: string;
  timestamp?: number;
  metadata?: ProductPackageObservationMetadata;
};

export type ProductPackageObservationAdapterResult = {
  snapshot: ProductPackageObservationSnapshot;
  metadata?: ProductPackageObservationMetadata;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const readNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
};

const readDimensionSnapshot = (
  value: unknown,
): ProductPackageObservationDimensionSnapshot | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    width: readNumber(value, "width"),
    height: readNumber(value, "height"),
    depth: readNumber(value, "depth"),
    unit: readString(value, "unit"),
  };
};

const readStringKeys = (value: unknown): string[] => {
  if (!isRecord(value)) {
    return [];
  }

  return Object.keys(value);
};

const readStringValuesOrKeys = (value: unknown): string[] => {
  if (!isRecord(value)) {
    return [];
  }

  const stringValues = Object.values(value).filter((entry): entry is string => typeof entry === "string");
  return stringValues.length > 0 ? stringValues : Object.keys(value);
};

const readProductId = (productPackage: Record<string, unknown>): string | undefined => {
  const product = productPackage.product;

  if (isRecord(product)) {
    return readString(product, "id");
  }

  return readString(productPackage, "id");
};

const readComponentSnapshot = (
  value: unknown,
): ProductPackageObservationComponentSnapshot | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id =
    readString(value, "id") ??
    readString(value, "partId") ??
    readString(value, "componentId");

  if (!id) {
    return undefined;
  }

  return {
    id,
    type: readString(value, "type") ?? readString(value, "runtimeRole"),
    category: readString(value, "category"),
    material: readString(value, "material") ?? readString(value, "materialGroup"),
    finish: readString(value, "finish"),
    quantity: readNumber(value, "quantity"),
  };
};

const readComponentSnapshots = (
  productPackage: Record<string, unknown>,
): ProductPackageObservationComponentSnapshot[] => {
  const components = productPackage.components;

  if (!Array.isArray(components)) {
    return [];
  }

  return components
    .map(readComponentSnapshot)
    .filter((component): component is ProductPackageObservationComponentSnapshot => Boolean(component));
};

export const createProductPackageObservationAdapterResult = (
  input: ProductPackageObservationAdapterInput,
): ProductPackageObservationAdapterResult => {
  const timestamp = input.timestamp ?? Date.now();
  const productPackage = input.productPackage;
  const components = readComponentSnapshots(productPackage);
  const componentIds = components.map((component) => component.id);
  const metadata: ProductPackageObservationMetadata = {
    ...input.metadata,
    source: input.metadata?.source ?? "ProductPackageObservationAdapter",
    productPackageId: input.metadata?.productPackageId ?? readProductId(productPackage),
    productPackageVersion: input.metadata?.productPackageVersion ?? readString(productPackage, "version"),
    schema: input.metadata?.schema ?? readString(productPackage, "schema"),
    sourceFormat: input.metadata?.sourceFormat ?? readString(productPackage, "sourceFormat"),
    observedAt: input.metadata?.observedAt ?? timestamp,
  };

  return {
    snapshot: createProductPackageObservationSnapshot({
      id: input.id,
      timestamp,
      productPackageId: metadata.productPackageId,
      productPackageVersion: metadata.productPackageVersion,
      schema: metadata.schema,
      sourceFormat: metadata.sourceFormat,
      status: readString(productPackage, "status"),
      dimensions: readDimensionSnapshot(productPackage.dimensions),
      footprint: readDimensionSnapshot(productPackage.footprint),
      componentIds,
      componentCount: readNumber(productPackage, "componentCount") ?? components.length,
      components,
      materials: readStringValuesOrKeys(productPackage.materials),
      finishes: readStringKeys(productPackage.finishes),
      metadata,
    }),
    metadata: {
      ...metadata,
      reason: metadata.reason ?? "product-package-observation",
    },
  };
};
