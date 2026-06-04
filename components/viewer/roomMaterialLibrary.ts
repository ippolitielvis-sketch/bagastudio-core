export type BagaRoomMaterialKind = "floor" | "wall";

export type BagaRoomPbrMaterial = {
  id: string;
  label: string;
  kind: BagaRoomMaterialKind;
  source: "environment-library" | "legacy-texture" | "procedural-fallback";
  albedo?: string;
  normal?: string;
  roughness?: string;
  ao?: string;
  color: string;
  repeat: [number, number];
  roughnessValue: number;
  metalnessValue?: number;
  normalScale?: number;
};

export const BAGASTUDIO_ENVIRONMENT_FLOOR_MATERIALS: Record<string, BagaRoomPbrMaterial> = {
  "oak-premium": {
    id: "oak-premium",
    label: "Oak Premium",
    kind: "floor",
    source: "environment-library",
    albedo: "/materials/environment/floors/oak-premium/albedo.jpg",
    normal: "/materials/environment/floors/oak-premium/normal.jpg",
    roughness: "/materials/environment/floors/oak-premium/roughness.jpg",
    ao: "/materials/environment/floors/oak-premium/ao.jpg",
    color: "#eadcc8",
    repeat: [2.15, 3.25],
    roughnessValue: 0.68,
    metalnessValue: 0,
    normalScale: 0.18,
  },
  "walnut-premium": {
    id: "walnut-premium",
    label: "Walnut Premium",
    kind: "floor",
    source: "environment-library",
    albedo: "/materials/environment/floors/walnut-premium/albedo.jpg",
    normal: "/materials/environment/floors/walnut-premium/normal.jpg",
    roughness: "/materials/environment/floors/walnut-premium/roughness.jpg",
    ao: "/materials/environment/floors/walnut-premium/ao.jpg",
    color: "#7b5638",
    repeat: [2.0, 3.1],
    roughnessValue: 0.72,
    metalnessValue: 0,
    normalScale: 0.2,
  },
  "concrete-soft": {
    id: "concrete-soft",
    label: "Concrete Soft",
    kind: "floor",
    source: "environment-library",
    albedo: "/materials/environment/floors/concrete-soft/albedo.jpg",
    normal: "/materials/environment/floors/concrete-soft/normal.jpg",
    roughness: "/materials/environment/floors/concrete-soft/roughness.jpg",
    ao: "/materials/environment/floors/concrete-soft/ao.jpg",
    color: "#bcb7ae",
    repeat: [1.2, 1.2],
    roughnessValue: 0.86,
    metalnessValue: 0,
    normalScale: 0.11,
  },
};

export const BAGASTUDIO_ENVIRONMENT_WALL_MATERIALS: Record<string, BagaRoomPbrMaterial> = {
  "showroom-warm": {
    id: "showroom-warm",
    label: "Showroom Warm White",
    kind: "wall",
    source: "environment-library",
    albedo: "/materials/environment/walls/showroom-warm/albedo.jpg",
    normal: "/materials/environment/walls/showroom-warm/normal.jpg",
    roughness: "/materials/environment/walls/showroom-warm/roughness.jpg",
    ao: "/materials/environment/walls/showroom-warm/ao.jpg",
    color: "#f1eadf",
    repeat: [1.0, 1.0],
    roughnessValue: 0.88,
    metalnessValue: 0,
    normalScale: 0.055,
  },
  "luxury-beige": {
    id: "luxury-beige",
    label: "Luxury Beige",
    kind: "wall",
    source: "environment-library",
    albedo: "/materials/environment/walls/luxury-beige/albedo.jpg",
    normal: "/materials/environment/walls/luxury-beige/normal.jpg",
    roughness: "/materials/environment/walls/luxury-beige/roughness.jpg",
    ao: "/materials/environment/walls/luxury-beige/ao.jpg",
    color: "#ded0bb",
    repeat: [1.0, 1.0],
    roughnessValue: 0.84,
    metalnessValue: 0,
    normalScale: 0.06,
  },
  "microcement-light": {
    id: "microcement-light",
    label: "Microcement Light",
    kind: "wall",
    source: "environment-library",
    albedo: "/materials/environment/walls/microcement-light/albedo.jpg",
    normal: "/materials/environment/walls/microcement-light/normal.jpg",
    roughness: "/materials/environment/walls/microcement-light/roughness.jpg",
    ao: "/materials/environment/walls/microcement-light/ao.jpg",
    color: "#d6d2c9",
    repeat: [1.15, 1.0],
    roughnessValue: 0.9,
    metalnessValue: 0,
    normalScale: 0.045,
  },
};

export function getBagaRoomFloorMaterial(materialId?: string): BagaRoomPbrMaterial {
  const key = String(materialId || "").toLowerCase();

  if (key === "dark-matte") return BAGASTUDIO_ENVIRONMENT_FLOOR_MATERIALS["walnut-premium"];
  if (key === "cement-light" || key === "stone-greige") return BAGASTUDIO_ENVIRONMENT_FLOOR_MATERIALS["concrete-soft"];
  if (key === "walnut-premium" || key === "oak-premium" || key === "concrete-soft") {
    return BAGASTUDIO_ENVIRONMENT_FLOOR_MATERIALS[key];
  }

  return BAGASTUDIO_ENVIRONMENT_FLOOR_MATERIALS["oak-premium"];
}

export function getBagaRoomWallMaterial(materialId?: string): BagaRoomPbrMaterial {
  const key = String(materialId || "").toLowerCase();

  if (key === "tortora" || key === "dark-salon") return BAGASTUDIO_ENVIRONMENT_WALL_MATERIALS["luxury-beige"];
  if (key === "cement" || key === "microcement-light") return BAGASTUDIO_ENVIRONMENT_WALL_MATERIALS["microcement-light"];
  if (key === "showroom-warm" || key === "luxury-beige") return BAGASTUDIO_ENVIRONMENT_WALL_MATERIALS[key];

  return BAGASTUDIO_ENVIRONMENT_WALL_MATERIALS["showroom-warm"];
}
