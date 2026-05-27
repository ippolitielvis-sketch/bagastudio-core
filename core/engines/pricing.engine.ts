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
const product = productOverride || store.runtimeProduct || store.product;

  if (!product) {
    return {
      subtotal: 0,
      vat: 0,
      total: 0,
    };
  }

  let subtotal = product.pricing.basePrice;

  const width = store.dimensions.width || 0;
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

  // supplemento larghezza oltre 200 cm
  if (width > 200) {
    subtotal += (width - 200) * 8;
  }

  // supplemento LED

  if (hasBlackMaterial) {
    subtotal *= 1.1;
  }

  const margin = product.pricing.margin || 0;
  const vatRate = product.pricing.vat || 0;

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