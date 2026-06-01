// @ts-nocheck
import {
  type HardwarePatternRecognitionV1Report,
  type HardwarePatternRecognitionV1Type,
} from "@/lib/layout-room-intelligence/hardwarePatternRecognitionV1";
import {
  type HardwareCompatibilityMatrixV1Report,
  type HardwareCompatibilityV1Item,
  type HardwareCompatibilityV1Status,
} from "@/lib/layout-room-intelligence/hardwareCompatibilityMatrixV12";

export type HardwareLinkV1Item = {
  componentId: string;
  displayName: string;
  hardwareType: HardwarePatternRecognitionV1Type;
  hardwareLabel: string;
  trustedProfile: string | null;
  drillingIndexes: number[];
  confidence: number;
  compatibilityStatus: HardwareCompatibilityV1Status;
  status: "linked" | "ignored";
  note: string;
};

export type HardwareLinksEngineV1Report = {
  schema: "bagastudio-hardware-links-engine-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    links: number;
    linkedComponents: number;
    validPatterns: number;
    ignoredPatterns: number;
  };
  items: HardwareLinkV1Item[];
};

export function buildHardwareLinksEngineV1Report(
  patternReport: HardwarePatternRecognitionV1Report,
  compatibilityReport: HardwareCompatibilityMatrixV1Report
): HardwareLinksEngineV1Report {
  const compatibilityByKey = new Map<string, HardwareCompatibilityV1Item>();
  compatibilityReport.items.forEach((item) => {
    compatibilityByKey.set(`${item.componentId}__${item.hardwareLabel}`, item);
  });

  const items: HardwareLinkV1Item[] = patternReport.items.map((pattern) => {
    const compatibility = compatibilityByKey.get(`${pattern.componentId}__${pattern.label}`) || null;
    const isRecognized = pattern.patternType !== "unknown";
    const canLink = isRecognized && pattern.confidence > 0;

    return {
      componentId: pattern.componentId,
      displayName: pattern.displayName,
      hardwareType: pattern.patternType,
      hardwareLabel: pattern.label,
      trustedProfile: compatibility?.trustedProfile || null,
      drillingIndexes: pattern.drillingIndexes,
      confidence: pattern.confidence,
      compatibilityStatus: compatibility?.status || "unknown",
      status: canLink ? "linked" : "ignored",
      note: canLink
        ? "Link componente-ferramenta-forature creato da Pattern Recognition V1."
        : "Pattern non classificato: link non creato in Hardware Links Engine V1.",
    };
  });

  const linkedItems = items.filter((item) => item.status === "linked");
  const linkedComponents = new Set(linkedItems.map((item) => item.componentId)).size;

  return {
    schema: "bagastudio-hardware-links-engine-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: patternReport.totals.components,
      links: linkedItems.length,
      linkedComponents,
      validPatterns: linkedItems.length,
      ignoredPatterns: items.filter((item) => item.status === "ignored").length,
    },
    items,
  };
}
