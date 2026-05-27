import { BagaProduct } from "@/core/schemas/product.schema";

export const demoProduct2: BagaProduct = {
  id: "demo-carrello-2",
  name: "Demo Carrello Variante",
  category: "industrial-demo",
  version: "1.0.0",

  assets: {
    modelUrl: "/models/demo-product-2.glb",
  },

  dimensions: {
    width: {
      min: 100,
      max: 350,
      step: 10,
      default: 180,
    },
    height: {
      min: 70,
      max: 150,
      step: 5,
      default: 100,
    },
    depth: {
      min: 40,
      max: 100,
      step: 5,
      default: 60,
    },
  },

 parts: [
  {
    id: "main_body",
    name: "Corpo principale",
    meshName: "main_body",
    selectable: true,
    visible: true,
    materialSlots: ["main"],
    compatibleAccessories: ["led", "insert"],
  },

  {
    id: "piano",
    name: "Piano",
    meshName: "Piano",
    selectable: true,
    visible: true,
    materialSlots: ["main"],
    allowedMaterialCategories: ["wood", "marble"],
    compatibleAccessories: [
  "led",
  "insert",
  "usb",
  "wireless_charge",
  "socket",
  "hairdryer_holder",
  "tool_holder",
  "bag_hook",
],
mountPoints: {
  led: {
    frontOffset: 2,
    sideMargin: 5,
    yOffset: 0
  }
}
  },

  {
  id: "mirror_left",
  name: "Specchio sinistro",
  meshName: "Mirror_Left",
  selectable: true,
  visible: true,
  materialSlots: ["mirror"],
  compatibleAccessories: ["mirror_led"],
},

{
  id: "mirror_right",
  name: "Specchio destro",
  meshName: "Mirror_Right",
  selectable: true,
  visible: true,
  materialSlots: ["mirror"],
  compatibleAccessories: ["mirror_led"],
},
],

materials: [
  {
    id: "barok",
    name: "Barok",
    category: "wood",
    type: "texture",
    textureUrl: "/textures/Barok.webp",
    woodDirection: "z",
    roughness: 0.42,
    metalness: 0,
    priceMultiplier: 1.2,
  },
  {
    id: "confortable_coffee",
    name: "Confortable Coffee",
    category: "wood",
    type: "texture",
    textureUrl: "/textures/Confortable_Coffe.webp",
    roughness: 0.42,
    metalness: 0,
    priceMultiplier: 1.15,
  },
  {
    id: "bianco_sporco_china",
    name: "Bianco Sporco China",
    category: "basic",
    type: "texture",
    textureUrl: "/textures/Bianco_Sporco_China.webp",
    roughness: 0.5,
    metalness: 0,
    priceMultiplier: 1,
  },
  {
    id: "acciaio_ossidato",
    name: "Acciaio Ossidato",
    category: "metal",
   type: "texture",
    textureUrl: "/textures/Acciaio_Ossidato.webp",
    roughness: 0.35,
    metalness: 0.7,
    priceMultiplier: 1.3,
  },
  {
    id: "marmo",
    name: "Marmo",
    category: "marble",
  type: "texture",
    textureUrl: "/textures/Marmo.webp",
    roughness: 0.2,
    metalness: 0.02,
    priceMultiplier: 1.35,
  },
  {
    id: "oro_satinato",
    name: "Oro Satinato",
    category: "metal",
    type: "texture",
    textureUrl: "/textures/Oro_Satinato.webp",
    roughness: 0.25,
    metalness: 1,
    priceMultiplier: 1.25,
  },
  {
    id: "mirror",
    name: "Specchio",
    category: "glass",
    type: "mirror",
    color: "#ffffff",
    metalness: 1,
    roughness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0,
    envMapIntensity: 2,
  },
],
  options: [],

  pricing: {
    currency: "EUR",
    basePrice: 900,
    vat: 22,
    margin: 25,
  },

views: [
  {
    id: "front",
    name: "Frontale",
    camera: {
      position: [0, 4, 28],
      target: [0, 1, 0],
    },
  },
  {
    id: "back",
    name: "Retro",
    camera: {
      position: [0, 4, -28],
      target: [0, 1, 0],
    },
  },
  {
    id: "left",
    name: "Sinistra",
    camera: {
      position: [-28, 4, 0],
      target: [0, 1, 0],
    },
  },
  {
    id: "right",
    name: "Destra",
    camera: {
      position: [28, 4, 0],
      target: [0, 1, 0],
    },
  },
  {
    id: "top",
    name: "Alto",
    camera: {
      position: [0, 32, 0],
      target: [0, 0, 0],
    },
  },
  {
    id: "iso",
    name: "3D",
    camera: {
      position: [20, 10, 22],
      target: [0, 1, 0],
    },
  },
],
};