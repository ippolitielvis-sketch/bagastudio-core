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


export function calculatePricing(productOverride?: any) {
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
  // V2 dovrà usare superficie/BOM reale quando Product Package + Factory Engine saranno consolidati.
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
console.log("ACCESSORIES TOTAL:", accessoriesTotal);
console.log("SUBTOTAL BEFORE MARGIN:", subtotal);

const hasBlackMaterial = Object.values(store.materials).includes("black");

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

  // supplemento LED

  if (hasBlackMaterial) {
    subtotal *= 1.1;
  }

  const margin = Number(pricingConfig.margin || 0);
  const vatRate = Number(pricingConfig.vat || 0);

  subtotal = subtotal + subtotal * (margin / 100);

  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;

  const pricing = {
    subtotal,
    vat,
    total,
  };

  return pricing;
}