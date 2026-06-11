import type { EdiV2ShaderMode } from "../types";

export type EdiV2ShaderRegistryStatus = "prototype" | "foundation" | "planned";
export type EdiV2ShaderRegistryCategory = "core" | "plasma" | "field" | "particles" | "postprocess";
export type EdiV2ShaderRegistryEngineType = "shader" | "simulation" | "postprocess" | "physics";

export type EdiV2ShaderRegistryEntry = {
  id: EdiV2ShaderMode;
  label: string;
  description: string;
  category: EdiV2ShaderRegistryCategory;
  status: EdiV2ShaderRegistryStatus;
  enabled: boolean;
  visibleInLaboratory: boolean;
  engineType: EdiV2ShaderRegistryEngineType;
  experimental: boolean;
  uniforms?: string[];
  dependencies?: EdiV2ShaderMode[];
};

export const EDI_V2_SHADER_REGISTRY: EdiV2ShaderRegistryEntry[] = [
  { id: "heart", label: "Heart", description: "Cognitive energy core shader.", category: "core", status: "foundation", enabled: true, visibleInLaboratory: true, engineType: "shader", experimental: false, uniforms: ["uTime", "uIntensity", "uPulseSpeed", "uRadius", "uNoise", "uGlow"] },
  { id: "plasma", label: "Plasma", description: "Procedural plasma field surrounding the core.", category: "plasma", status: "prototype", enabled: true, visibleInLaboratory: true, engineType: "shader", experimental: true, uniforms: ["uTime", "uActivity", "uWarning", "uDistortion"], dependencies: ["heart"] },
  { id: "magnetic", label: "Magnetic", description: "Deformed magnetic force field placeholder.", category: "field", status: "prototype", enabled: true, visibleInLaboratory: true, engineType: "simulation", experimental: true, dependencies: ["heart"] },
  { id: "particles", label: "Particles", description: "Knowledge particle engine placeholder.", category: "particles", status: "prototype", enabled: true, visibleInLaboratory: true, engineType: "physics", experimental: true, dependencies: ["heart"] },
  { id: "glow", label: "Glow", description: "Soft energy glow placeholder.", category: "postprocess", status: "prototype", enabled: true, visibleInLaboratory: true, engineType: "postprocess", experimental: true, dependencies: ["heart"] },
  { id: "composite", label: "Composite", description: "Full EDI V2 render pipeline composition.", category: "postprocess", status: "foundation", enabled: true, visibleInLaboratory: true, engineType: "postprocess", experimental: false, uniforms: ["bloomIntensity", "bloomRadius", "bloomThreshold"], dependencies: ["heart", "plasma", "magnetic", "particles", "glow"] },
];
