import { create } from "zustand";
import type { BagaProduct } from "@/core/schemas/product.schema";

type RuntimeDimensions = {
  width?: number;
  height?: number;
  depth?: number;
};

type RuntimeMaterials = Record<string, string>;
type RuntimeOptions = Record<string, any>;
type RuntimeAccessories = Record<string, Record<string, boolean>>;
type RuntimeInserts = Record<string, boolean>;
type RuntimeInsertMaterials = Record<string, string>;
type RuntimeLedKelvin = Record<string, number>;
type RuntimeLedIntensity = Record<string, number>;
type RuntimeVisibility = Record<string, boolean>;

type RuntimePricing = {
  subtotal: number;
  vat: number;
  total: number;
};

type BagaConfigState = {
  product: BagaProduct | null;
  runtimeProduct: BagaProduct | null;

  dimensions: RuntimeDimensions;
  materials: RuntimeMaterials;
  options: RuntimeOptions;
  accessories: RuntimeAccessories;
  inserts: RuntimeInserts;
  insertMaterials: RuntimeInsertMaterials;
  insertSizes: Record<string, {
  width: number;
  depth: number;
  offsetX: number;
  offsetZ: number;
}>;
  ledKelvin: RuntimeLedKelvin;
  ledIntensity: RuntimeLedIntensity;
  visibility: RuntimeVisibility;
  woodDirection: Record<string, "x" | "z">;

  pricing: RuntimePricing;
  activeViewId: string | null;
  selectedPartId: string | null;

  loadProduct: (product: BagaProduct) => void;
  setRuntimeProduct: (product: BagaProduct) => void;

  setDimension: (key: keyof RuntimeDimensions, value: number) => void;
  setMaterial: (partId: string, materialId: string) => void;
  setOption: (optionId: string, value: any) => void;

  setAccessory: (partId: string, accessoryId: string, enabled: boolean) => void;
  setInsert: (partId: string, enabled: boolean) => void;
  setInsertMaterial: (partId: string, materialId: string) => void;
  setInsertSize: (
  partId: string,
  size: {
    width: number;
    depth: number;
    offsetX: number;
    offsetZ: number;
  }
) => void;
  setLedKelvin: (partId: string, kelvin: number) => void;
  setLedIntensity: (partId: string, intensity: number) => void;
  toggleAccessory: (partId: string, accessoryId: string) => void;

  setVisibility: (partId: string, visible: boolean) => void;
  setWoodDirection: (partId: string, direction: "x" | "z") => void;
  setActiveView: (viewId: string) => void;
  setSelectedPart: (partId: string | null) => void;

  updatePricing: (pricing: RuntimePricing) => void;

  resetConfiguration: () => void;
  exportConfiguration: () => any;
  importConfiguration: (config: any) => void;

  createBackupSnapshot: () => any;
  saveAutosave: () => void;
  restoreAutosave: () => boolean;
};

const defaultPricing: RuntimePricing = {
  subtotal: 0,
  vat: 0,
  total: 0,
};

const BAGASTUDIO_RUNTIME_AUTOSAVE_KEY = "bagastudio_core_runtime_autosave_v1";

export const useConfigStore = create<BagaConfigState>((set, get) => ({
  product: null,
runtimeProduct: null,
  dimensions: {},
  materials: {},
  options: {},
  accessories: {},
  inserts: {},
  insertMaterials: {},
  insertSizes: {},
  ledKelvin: {},
  ledIntensity: {},
  visibility: {},
  woodDirection: {},
  
  pricing: defaultPricing,
  activeViewId: "iso",
  selectedPartId: null,

  loadProduct: (product) => {
    const visibility: RuntimeVisibility = {};
    const options: RuntimeOptions = {};

    product.parts.forEach((part) => {
      visibility[part.id] = part.visible;
    });

    product.options.forEach((option) => {
     options[option.id] = false;
    });

    set({
      product,
      visibility,
      options,
      dimensions: {
        width: product.dimensions.width?.default,
        height: product.dimensions.height?.default,
        depth: product.dimensions.depth?.default,
      },
      pricing: defaultPricing,
      activeViewId: "iso",
    });
  },
setRuntimeProduct: (product) => {
  set({
    runtimeProduct: product,
    product,
    selectedPartId: null,
    materials: {},
    accessories: {},
    inserts: {},
    ledKelvin: {},
    ledIntensity: {},
    visibility: {},
    activeViewId: "iso",
  });
},
  setDimension: (key, value) => {
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        [key]: value,
      },
    }));
  },

  setMaterial: (partId, materialId) => {
    set((state) => ({
      materials: {
        ...state.materials,
        [partId]: materialId,
      },
    }));
  },

  setOption: (optionId, value) => {
    set((state) => ({
      options: {
        ...state.options,
        [optionId]: value,
      },
    }));
  },

 setAccessory: (partId, accessoryId, enabled) => {
  set((state) => ({
    accessories: {
      ...state.accessories,
      [partId]: {
        ...(state.accessories[partId] || {}),
        [accessoryId]: enabled,
      },
    },
  }));
},
  
  setInsert: (partId, enabled) => {
  set((state) => ({
    inserts: {
      ...state.inserts,
      [partId]: enabled,
    },
  }));
},

setInsertMaterial: (partId: string, materialId: string) => {
  set((state) => ({
    insertMaterials: {
      ...state.insertMaterials,
      [partId]: materialId,
    },
  }));
},

setInsertSize: (partId, size) => {
  set((state) => ({
    insertSizes: {
      ...state.insertSizes,
      [partId]: size,
    },
  }));
},

  setLedKelvin: (partId, kelvin) => {
  set((state) => ({
    ledKelvin: {
      ...state.ledKelvin,
      [partId]: kelvin,
    },
  }));
},

  setLedIntensity: (partId, intensity) => {
  set((state) => ({
    ledIntensity: {
      ...state.ledIntensity,
      [partId]: intensity,
    },
  }));
},

  toggleAccessory: (partId, accessoryId) => {
  set((state) => ({
    accessories: {
      ...state.accessories,
      [partId]: {
        ...(state.accessories[partId] || {}),
        [accessoryId]: !state.accessories?.[partId]?.[accessoryId],
      },
    },
  }));
},

  setVisibility: (partId, visible) => {
    set((state) => ({
      visibility: {
        ...state.visibility,
        [partId]: visible,
      },
    }));
  },

setWoodDirection: (partId: string, direction: "x" | "z") => {
  set((state) => ({
    woodDirection: {
      ...state.woodDirection,
      [partId]: direction,
    },
  }));
},

setActiveView: (viewId) => {
  set({ activeViewId: viewId });
},

setSelectedPart: (partId) => {
  set({ selectedPartId: partId });
},
  updatePricing: (pricing) => {
    set({ pricing });
  },

  resetConfiguration: () => {
  const product = get().product;
  if (!product) return;

  get().loadProduct(product);

  set({
    materials: {},
    accessories: {},
    inserts: {},
    ledKelvin: {},
    ledIntensity: {},
    selectedPartId: null,
    activeViewId: "iso",
  });
},

  exportConfiguration: () => {
    const state = get();

    return {
      productId: state.product?.id,
      dimensions: state.dimensions,
      materials: state.materials,
      options: state.options,
      accessories: state.accessories,
      inserts: state.inserts,
      insertMaterials: state.insertMaterials,
      ledKelvin: state.ledKelvin,
      ledIntensity: state.ledIntensity,
      woodDirection: state.woodDirection,
      visibility: state.visibility,
      activeViewId: state.activeViewId,
      selectedPartId: state.selectedPartId,
    };
  },

  importConfiguration: (config) => {
    set({
      dimensions: config.dimensions || {},
      materials: config.materials || {},
      options: config.options || {},
      ledKelvin: config.ledKelvin || {},
      ledIntensity: config.ledIntensity || {},
      woodDirection: config.woodDirection || {},
      inserts: config.inserts || {},
      insertMaterials: config.insertMaterials || {},
      accessories: config.accessories || {},
      visibility: config.visibility || {},
      activeViewId: config.activeViewId || null,
      selectedPartId: config.selectedPartId || null,
    });
  },

  createBackupSnapshot: () => {
    const state = get();

    return {
      schema: "bagastudio-runtime-backup",
      version: 1,
      savedAt: new Date().toISOString(),
      product: state.product,
      runtimeProduct: state.runtimeProduct,
      configuration: state.exportConfiguration(),
      pricing: state.pricing,
    };
  },

  saveAutosave: () => {
    if (typeof window === "undefined") return;

    const snapshot = get().createBackupSnapshot();
    window.localStorage.setItem(
      BAGASTUDIO_RUNTIME_AUTOSAVE_KEY,
      JSON.stringify(snapshot)
    );
  },

  restoreAutosave: () => {
    if (typeof window === "undefined") return false;

    const saved = window.localStorage.getItem(BAGASTUDIO_RUNTIME_AUTOSAVE_KEY);
    if (!saved) return false;

    try {
      const snapshot = JSON.parse(saved);

      if (snapshot.product) {
        set({
          product: snapshot.product,
          runtimeProduct: snapshot.runtimeProduct || snapshot.product,
        });
      }

      if (snapshot.configuration) {
        get().importConfiguration(snapshot.configuration);
      }

      if (snapshot.pricing) {
        set({ pricing: snapshot.pricing });
      }

      return true;
    } catch {
      return false;
    }
  },
}));