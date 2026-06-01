type HardwarePatternRecognitionV1Type = "hinge" | "minifix" | "shelfPin" | "unknown";

type HardwareCompatibilityV1Status = "compatible" | "warning" | "incompatible" | "unknown";
export type HardwareProductionGateV12 = "pass" | "review" | "blocked";

type HardwareCompatibilityV1ItemLike = {
  status: HardwareCompatibilityV1Status;
  thicknessSupported?: boolean;
  verifiedProfile: boolean;
};

type HardwarePatternRecognitionV1ItemLike = {
  patternType: HardwarePatternRecognitionV1Type;
};

export type HardwareKnowledgeProfileV11 = {
  id: string;
  displayName: string;
  verified: boolean;
  reliabilityScore: number;
  profilePriority: number;
  supportedThicknesses: number[];
  preferredPatternTypes: HardwarePatternRecognitionV1Type[];
  notes: string;
};

export const HARDWARE_KNOWLEDGE_BASE_V11: HardwareKnowledgeProfileV11[] = [
  {
    id: "Ferramenta_17.8",
    displayName: "Ferramenta 17.8",
    verified: true,
    reliabilityScore: 100,
    profilePriority: 1,
    supportedThicknesses: [17.8, 18.3],
    preferredPatternTypes: ["shelfPin"],
    notes: "Profilo verificato: priorità alta per pannelli 17.8/18.3 mm.",
  },
  {
    id: "Ferramenta_18.3",
    displayName: "Ferramenta 18.3",
    verified: true,
    reliabilityScore: 100,
    profilePriority: 1,
    supportedThicknesses: [17.8, 18.3],
    preferredPatternTypes: ["hinge", "shelfPin"],
    notes: "Profilo verificato: comportamento stabile su 17.8/18.3 mm.",
  },
  {
    id: "Cabineo_Singolo",
    displayName: "Cabineo Singolo",
    verified: true,
    reliabilityScore: 95,
    profilePriority: 2,
    supportedThicknesses: [17.8, 18.3, 19],
    preferredPatternTypes: ["minifix"],
    notes: "Profilo verificato per collegamento singolo tipo minifix/cabineo.",
  },
  {
    id: "divario_elvis",
    displayName: "Divario Elvis",
    verified: true,
    reliabilityScore: 90,
    profilePriority: 2,
    supportedThicknesses: [17.8, 18.3],
    preferredPatternTypes: ["hinge", "minifix"],
    notes: "Unico profilo Divario approvato: evitare profili Divario generici non verificati.",
  },
];

export const TRUSTED_HARDWARE_PROFILES_V1 = HARDWARE_KNOWLEDGE_BASE_V11.map((profile) => profile.id);
const HARDWARE_KNOWLEDGE_BY_ID_V11 = new Map(HARDWARE_KNOWLEDGE_BASE_V11.map((profile) => [profile.id, profile]));
export const EXCLUDED_HARDWARE_PROFILES_V12 = ["Divario", "Divario_Generico", "divario_generic", "divario_standard"];

export function resolveHardwareProductionGateV12(item: HardwareCompatibilityV1ItemLike): HardwareProductionGateV12 {
  if (item.status === "incompatible") return "blocked";
  if (item.status === "compatible" && item.thicknessSupported && item.verifiedProfile) return "pass";
  return "review";
}

export function getHardwareKnowledgeProfileV11(profileId: string | null): HardwareKnowledgeProfileV11 | null {
  if (!profileId) return null;
  return HARDWARE_KNOWLEDGE_BY_ID_V11.get(profileId) || null;
}

export function isThicknessSupportedByKnowledgeProfileV11(profile: HardwareKnowledgeProfileV11, thickness: number, tolerance = 0.35): boolean {
  return profile.supportedThicknesses.some((supportedThickness) => Math.abs(thickness - supportedThickness) <= tolerance);
}

export function chooseTrustedHardwareProfileV1(pattern: HardwarePatternRecognitionV1ItemLike, thickness: number | null): string | null {
  if (pattern.patternType === "hinge") return "Ferramenta_18.3";
  if (pattern.patternType === "shelfPin") return thickness !== null && thickness <= 18 ? "Ferramenta_17.8" : "Ferramenta_18.3";
  if (pattern.patternType === "minifix") return "Cabineo_Singolo";
  return null;
}