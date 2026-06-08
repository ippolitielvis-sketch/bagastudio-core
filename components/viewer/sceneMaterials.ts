import * as THREE from "three";

export type BagaStudioSceneSurfaceId =
  | "showroom-premium"
  | "wood-neutral"
  | "cement-light"
  | "stone-greige"
  | "dark-matte"
  | "warm-white"
  | "tortora"
  | "cement"
  | "dark-salon";

export type BagaStudioSceneMaterialPreset = {
  id: string;
  label: string;
  floor: {
    baseColor: string;
    normal: string;
    roughness: string;
    repeat: [number, number];
    color: string;
    roughnessValue: number;
    metalnessValue: number;
    normalScale: [number, number];
  };
  wall: {
    baseColor: string;
    normal: string;
    roughness: string;
    repeat: [number, number];
    color: string;
    roughnessValue: number;
    metalnessValue: number;
    normalScale: [number, number];
  };
  ceiling: {
    baseColor: string;
    repeat: [number, number];
    color: string;
    roughnessValue: number;
  };
  baseboard: {
    baseColor: string;
    repeat: [number, number];
    color: string;
    roughnessValue: number;
    metalnessValue: number;
  };
};

export const BAGASTUDIO_SHOWROOM_PREMIUM_PRESET: BagaStudioSceneMaterialPreset = {
  id: "showroom-premium-v1",
  label: "Showroom Premium V1",
  floor: {
    baseColor: "/textures/scene/showroom-premium/floor_basecolor.webp",
    normal: "/textures/scene/showroom-premium/floor_normal.webp",
    roughness: "/textures/scene/showroom-premium/floor_roughness.webp",
    repeat: [2.15, 2.15],
    color: "#ffffff",
    roughnessValue: 0.62,
    metalnessValue: 0.02,
    normalScale: [0.18, 0.18],
  },
  wall: {
    baseColor: "/textures/scene/showroom-premium/wall_basecolor.webp",
    normal: "/textures/scene/showroom-premium/wall_normal.webp",
    roughness: "/textures/scene/showroom-premium/wall_roughness.webp",
    repeat: [1.65, 1.2],
    color: "#ffffff",
    roughnessValue: 0.86,
    metalnessValue: 0.0,
    normalScale: [0.08, 0.08],
  },
  ceiling: {
    baseColor: "/textures/scene/showroom-premium/ceiling_basecolor.webp",
    repeat: [1.2, 1.2],
    color: "#ffffff",
    roughnessValue: 0.9,
  },
  baseboard: {
    baseColor: "/textures/scene/showroom-premium/baseboard_basecolor.webp",
    repeat: [3, 1],
    color: "#ffffff",
    roughnessValue: 0.54,
    metalnessValue: 0.08,
  },
};

export function configureSceneTexture(
  texture: THREE.Texture | null | undefined,
  repeat: [number, number] = [1, 1],
  colorSpace: THREE.ColorSpace | "linear" = THREE.SRGBColorSpace
) {
  if (!texture) return texture;
  if (colorSpace !== "linear") texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function resolveSceneMaterialPreset(): BagaStudioSceneMaterialPreset {
  return BAGASTUDIO_SHOWROOM_PREMIUM_PRESET;
}
