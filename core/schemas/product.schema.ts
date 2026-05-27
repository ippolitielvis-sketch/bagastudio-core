export type BagaMaterialType =
  | "color"
  | "metal"
  | "mirror"
  | "glass"
  | "pbr"
  | "texture"; 

export type BagaProductMaterial = {
  id: string;
  name: string;
  category: string;
  type: BagaMaterialType;
  color?: string;
  textureUrl?: string;
  priceMultiplier?: number;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
  woodDirection?: "x" | "z";
};

export type BagaProduct = {
  id: string;
  name: string;
  category: string;
  version: string;
  
  brand?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];

  assets: {
  modelUrl: string;
  originalFileUrl?: string;
  originalFormat?: "glb" | "gltf" | "obj" | "fbx" | "stl";
  convertedModelUrl?: string;
};

  dimensions: {
    width: {
      min: number;
      max: number;
      step: number;
      default: number;
    };
    height: {
      min: number;
      max: number;
      step: number;
      default: number;
    };
    depth: {
      min: number;
      max: number;
      step: number;
      default: number;
    };
  };
  
  importMeta?: {
  importedAt?: string;
  importedBy?: string;
  sourceFormat?: "glb" | "gltf" | "obj" | "fbx" | "stl";
  autoConverted?: boolean;
  sourceFileName?: string;
};
  parts: {
    id: string;
    name: string;
    meshName: string;
    selectable: boolean;
    visible: boolean;
   materialSlots: string[];
allowedMaterialCategories?: string[];
defaultMaterialId?: string;
compatibleAccessories?: string[];

  mountPoints?: {
led?: {
  position?: string;
  frontOffset: number;
  sideMargin: number;
  yOffset: number;
};
};
  }[];

  materials: BagaProductMaterial[];

  options: {
    id: string;
    name: string;
    type: "boolean";
  }[];

  pricing: {
    currency: string;
    basePrice: number;
    vat: number;
    margin: number;
  };

  views: {
    id: string;
    name: string;
    camera: {
      position: [number, number, number];
      target: [number, number, number];
    };
  }[];
};