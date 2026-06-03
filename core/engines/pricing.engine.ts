import { useConfigStore } from "@/core/state/config.state";
import { accessoriesCatalog } from "@/core/catalogs/accessories.catalog";

const INSERT_MATERIAL_MULTIPLIERS: Record<string, number> = {
  marmo: 1,
  calacatta: 1.15,
  marquinia: 1.25,
  statuario: 1.3,
  travertino: 1.1,
  onice: 1.45,
  emperador: 1.2,
};

type PricingResult = {
  subtotal: number;
  vat: number;
  total: number;
  materialCost?: number;
  accessoriesCost?: number;
  laborCost?: number;
  machineCost?: number;
  markupCost?: number;
};

function normalizeKey(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");
}

function getPartId(part: any) {
  return String(part?.partId || part?.id || part?.meshName || part?.name || part?.displayName || "").trim();
}

function getPartCategory(part: any) {
  const rawCategory = normalizeKey(part?.category || part?.type || part?.runtimeMetadata?.detectedCategory || part?.runtimeMetadata?.category);
  const source = `${rawCategory} ${part?.partId || ""} ${part?.name || ""} ${part?.displayName || ""}`.toLowerCase();

  if (rawCategory === "panel" || /fianco|fondo|cielo|ripiano|anta|schiena|zoccolo|pannello|top|mensola/.test(source)) return "panel";
  if (rawCategory === "hardware" || /cerniera|basetta|cabineo|ferramenta|vite|foro|giunzione|minifix/.test(source)) return "hardware";
  if (rawCategory === "accessory" || /maniglia|accessorio|led|porta phon|portaphon|presa|lavabo|rubinetto|pomello|handle/.test(source)) return "accessory";

  return "component";
}

function getPartBounds(part: any) {
  return part?.bounds || part?.runtimeMetadata?.bounds || null;
}

function getPanelAreaM2(part: any) {
  const bounds = getPartBounds(part);
  if (!bounds) return 0;

  const dimensionsMm = [
    Number(bounds.width || 0) * 10,
    Number(bounds.depth || 0) * 10,
    Number(bounds.height || 0) * 10,
  ].filter((value) => Number.isFinite(value) && value > 0);

  if (dimensionsMm.length < 2) return 0;

  const faceDimensionsMm = [...dimensionsMm].sort((a, b) => b - a).slice(0, 2);
  return (faceDimensionsMm[0] / 1000) * (faceDimensionsMm[1] / 1000);
}

function readMaterialCostMatrix(product: any, pricingConfig: any) {
  const matrix: Record<string, number> = {};

  const assignMatrix = (source: any) => {
    if (!source || typeof source !== "object") return;

    Object.entries(source).forEach(([key, value]) => {
      const normalized = normalizeKey(key);
      const numericValue =
        typeof value === "object" && value !== null
          ? Number((value as any).costPerM2 ?? (value as any).pricePerM2 ?? (value as any).eurPerM2 ?? 0)
          : Number(value || 0);

      if (normalized && Number.isFinite(numericValue) && numericValue > 0) {
        matrix[normalized] = numericValue;
      }
    });
  };

  assignMatrix(pricingConfig.materialCostsPerM2);
  assignMatrix(pricingConfig.materialCostMatrix);
  assignMatrix(product?.materialCostsPerM2);
  assignMatrix(product?.materialCostMatrix);

  const materials = product?.materials;
  if (Array.isArray(materials)) {
    materials.forEach((material: any) => {
      const key = normalizeKey(material?.id || material?.name || material?.label);
      const cost = Number(material?.costPerM2 ?? material?.pricePerM2 ?? material?.eurPerM2 ?? 0);
      if (key && Number.isFinite(cost) && cost > 0) matrix[key] = cost;
    });
  } else if (materials && typeof materials === "object") {
    Object.entries(materials).forEach(([key, value]) => {
      const material: any = value;
      const normalized = normalizeKey(material?.id || key);
      const cost =
        typeof material === "object" && material !== null
          ? Number(material?.costPerM2 ?? material?.pricePerM2 ?? material?.eurPerM2 ?? 0)
          : 0;
      if (normalized && Number.isFinite(cost) && cost > 0) matrix[normalized] = cost;
    });
  }

  return matrix;
}

function resolveMaterialIdForPart(part: any, selectedMaterials: Record<string, any>) {
  const aliases = [
    part?.partId,
    part?.id,
    part?.meshName,
    part?.name,
    part?.displayName,
    part?.originalName,
  ]
    .map((value) => String(value || ""))
    .filter(Boolean);

  for (const alias of aliases) {
    if (selectedMaterials?.[alias]) return selectedMaterials[alias];
  }

  return part?.materialId || part?.material || part?.runtimeMetadata?.materialId || "";
}

function calculatePanelMaterialCost(parts: any[], selectedMaterials: Record<string, any>, materialCostMatrix: Record<string, number>) {
  if (!Array.isArray(parts) || !parts.length) return 0;

  return parts.reduce((total, part) => {
    if (getPartCategory(part) !== "panel") return total;

    const materialId = normalizeKey(resolveMaterialIdForPart(part, selectedMaterials));
    const costPerM2 = materialCostMatrix[materialId] || 0;
    if (!costPerM2) return total;

    return total + getPanelAreaM2(part) * costPerM2;
  }, 0);
}

export function calculatePricing(productOverride?: any, runtimeComponentsOverride?: any[]): PricingResult {
const store = useConfigStore.getState();

const product =
  productOverride ||
  store.runtimeProduct ||
  store.product;

if (!product) {
  return {
    subtotal: 0,
    vat: 0,
    total: 0,
  };
}

const pricingConfig = product.pricing || {};

  let subtotal = Number(pricingConfig.basePrice || 0);

  const width = Number(store.dimensions?.width || 0);
  const height = Number(store.dimensions?.height || 0);
  const depth = Number(store.dimensions?.depth || 0);

  // Pricing Engine Recovery V1:
  // dimensioni base temporanee per rendere il prezzo reattivo nel Viewer.
  // V2 usa anche Material Cost Matrix reale quando sono disponibili prezzi €/mq.
  const BASE_WIDTH_CM = 100;
  const BASE_HEIGHT_CM = 85;
  const BASE_DEPTH_CM = 50;
  const WIDTH_PRICE_PER_CM = 8;
  const HEIGHT_PRICE_PER_CM = 4;
  const DEPTH_PRICE_PER_CM = 6;
  let accessoriesTotal = 0;

Object.entries(store.accessories || {}).forEach(
  ([partId, partAccessories]: [string, any]) => {
    Object.entries(partAccessories || {}).forEach(
      ([accessoryId, value]) => {
        if (!value) return;

        const accessoryDef = accessoriesCatalog.find(
          (a) => a.id === accessoryId
        );

        if (!accessoryDef) return;

        const quantity =
          typeof value === "object" && value !== null
          ? Number((value as any).quantity || 1)
            : 1;

        const multiplier =
          typeof value === "object" && value !== null
           ? Number((value as any).multiplier || 1)
            : 1;

        accessoriesTotal += accessoryDef.price * quantity * multiplier;
      }
    );
  }
);

Object.entries(store.inserts || {}).forEach(([partId, enabled]) => {
  if (!enabled) return;

  const insertDef = accessoriesCatalog.find(
    (a) => a.id === "insert"
  );

  if (!insertDef) return;

  const insertSize = store.insertSizes?.[partId] || {
    width: 60,
    depth: 25,
  };

  const insertMaterial =
    store.insertMaterials?.[partId] || "marmo";

  const materialMultiplier =
    INSERT_MATERIAL_MULTIPLIERS[insertMaterial] || 1;

  const areaFactor =
    (insertSize.width / 100) * (insertSize.depth / 100);

  const insertPrice =
    insertDef.price * areaFactor * materialMultiplier;

  accessoriesTotal += insertPrice;
});

subtotal += accessoriesTotal;

const sourceParts = Array.isArray(runtimeComponentsOverride) && runtimeComponentsOverride.length > 0
  ? runtimeComponentsOverride
  : Array.isArray(product?.parts)
    ? product.parts
    : [];

const materialCostMatrix = readMaterialCostMatrix(product, pricingConfig);
const materialCost = calculatePanelMaterialCost(sourceParts, store.materials || {}, materialCostMatrix);
subtotal += materialCost;

  // supplementi dimensionali temporanei V1
  if (width > BASE_WIDTH_CM) {
    subtotal += (width - BASE_WIDTH_CM) * WIDTH_PRICE_PER_CM;
  }

  if (height > BASE_HEIGHT_CM) {
    subtotal += (height - BASE_HEIGHT_CM) * HEIGHT_PRICE_PER_CM;
  }

  if (depth > BASE_DEPTH_CM) {
    subtotal += (depth - BASE_DEPTH_CM) * DEPTH_PRICE_PER_CM;
  }

  const laborCost = Number(pricingConfig.laborCost || pricingConfig.laborTotal || 0);
  const machineCost = Number(pricingConfig.machineCost || pricingConfig.cncCost || 0);
  subtotal += Number.isFinite(laborCost) ? laborCost : 0;
  subtotal += Number.isFinite(machineCost) ? machineCost : 0;

  const margin = Number(pricingConfig.margin || 0);
  const vatRate = Number(pricingConfig.vat || 0);

  const markupCost = subtotal * (margin / 100);
  subtotal = subtotal + markupCost;

  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;

  const pricing = {
    subtotal,
    vat,
    total,
    materialCost,
    accessoriesCost: accessoriesTotal,
    laborCost: Number.isFinite(laborCost) ? laborCost : 0,
    machineCost: Number.isFinite(machineCost) ? machineCost : 0,
    markupCost,
  };

  return pricing;
}
