export type HardwarePatternRecognitionV1Type = "hinge" | "minifix" | "shelfPin" | "unknown";

export type HardwarePatternRecognitionV1Item = {
  componentId: string;
  displayName: string;
  patternType: HardwarePatternRecognitionV1Type;
  label: string;
  confidence: number;
  drillingIndexes: number[];
  reason: string;
};

export type HardwarePatternRecognitionV1Report = {
  schema: "bagastudio-hardware-pattern-recognition-v1";
  version: 1;
  generatedAt: string;
  totals: {
    components: number;
    patterns: number;
    hinges: number;
    minifix: number;
    shelfPins: number;
    unknown: number;
  };
  items: HardwarePatternRecognitionV1Item[];
};

type MeshConfigLike = {
  meshName?: string;
  displayName?: string;
  partId?: string;
  drillingLinks?: string;
  drillings?: string;
};

function buildStablePartIdV1(mesh: MeshConfigLike, meshIndex: number): string {
  return String(mesh.partId || mesh.meshName || mesh.displayName || `component-${meshIndex + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `component-${meshIndex + 1}`;
}

function parseJsonFieldV1(value: unknown, fallback: unknown): unknown {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeArrayV1(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>);
  return [];
}

function readNumberV1(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function buildHardwarePatternRecognitionV1Report(meshes: MeshConfigLike[]): HardwarePatternRecognitionV1Report {
  const items: HardwarePatternRecognitionV1Item[] = [];

  meshes.forEach((mesh, meshIndex) => {
    const componentId = buildStablePartIdV1(mesh, meshIndex);
    const displayName = mesh.displayName || mesh.meshName || `Componente ${meshIndex + 1}`;
    const drillingItems = normalizeArrayV1(
      parseJsonFieldV1(mesh.drillingLinks, parseJsonFieldV1(mesh.drillings, []))
    ).map((item, drillingIndex) => ({
      drillingIndex,
      x: readNumberV1(item?.x, item?.X),
      y: readNumberV1(item?.y, item?.Y),
      diameter: readNumberV1(item?.diameter, item?.dia, item?.DIA),
      depth: readNumberV1(item?.depth, item?.dp, item?.DP, item?.drillingDepth),
    })).filter((item) => item.x !== null && item.y !== null && item.diameter !== null);

    const usedIndexes = new Set<number>();

    drillingItems.filter((item) => Number(item.diameter) === 35).forEach((mainHole) => {
      const nearSmallHoles = drillingItems.filter((item) => {
        if (item.drillingIndex === mainHole.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        if (![5, 8, 10].includes(Number(item.diameter))) return false;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(mainHole.x), 2) + Math.pow(Number(item.y) - Number(mainHole.y), 2));
        return distance >= 15 && distance <= 60;
      });

      if (nearSmallHoles.length >= 1) {
        const drillingIndexes = [mainHole.drillingIndex, ...nearSmallHoles.slice(0, 2).map((item) => item.drillingIndex)];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "hinge",
          label: "Cerniera",
          confidence: nearSmallHoles.length >= 2 ? 90 : 78,
          drillingIndexes,
          reason: "Foro Ø35 con fori ausiliari vicini: probabile cerniera.",
        });
      }
    });

    drillingItems.filter((item) => Number(item.diameter) === 15 && !usedIndexes.has(item.drillingIndex)).forEach((mainHole) => {
      const linkedHole = drillingItems.find((item) => {
        if (item.drillingIndex === mainHole.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        if (![8, 10].includes(Number(item.diameter))) return false;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(mainHole.x), 2) + Math.pow(Number(item.y) - Number(mainHole.y), 2));
        return distance >= 20 && distance <= 45;
      });

      if (linkedHole) {
        const drillingIndexes = [mainHole.drillingIndex, linkedHole.drillingIndex];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "minifix",
          label: "Minifix / giunzione",
          confidence: 82,
          drillingIndexes,
          reason: "Foro Ø15 con foro collegato vicino: probabile minifix o giunzione pannello.",
        });
      }
    });

    const diameter5 = drillingItems.filter((item) => Number(item.diameter) === 5 && !usedIndexes.has(item.drillingIndex));
    for (let firstIndex = 0; firstIndex < diameter5.length; firstIndex += 1) {
      const first = diameter5[firstIndex];
      if (usedIndexes.has(first.drillingIndex)) continue;

      const aligned = diameter5.filter((item) => {
        if (item.drillingIndex === first.drillingIndex || usedIndexes.has(item.drillingIndex)) return false;
        const sameX = Math.abs(Number(item.x) - Number(first.x)) <= 1.5;
        const sameY = Math.abs(Number(item.y) - Number(first.y)) <= 1.5;
        const distance = Math.sqrt(Math.pow(Number(item.x) - Number(first.x), 2) + Math.pow(Number(item.y) - Number(first.y), 2));
        return (sameX || sameY) && distance >= 16 && distance <= 96;
      });

      if (aligned.length >= 1) {
        const drillingIndexes = [first.drillingIndex, ...aligned.slice(0, 3).map((item) => item.drillingIndex)];
        drillingIndexes.forEach((index) => usedIndexes.add(index));
        items.push({
          componentId,
          displayName,
          patternType: "shelfPin",
          label: "Reggipiano / foro serie",
          confidence: aligned.length >= 2 ? 86 : 72,
          drillingIndexes,
          reason: "Fori Ø5 allineati: probabile reggipiano o serie tecnica.",
        });
      }
    }

    const remaining = drillingItems.filter((item) => !usedIndexes.has(item.drillingIndex));
    if (remaining.length > 0) {
      items.push({
        componentId,
        displayName,
        patternType: "unknown",
        label: "Forature non classificate",
        confidence: 0,
        drillingIndexes: remaining.map((item) => item.drillingIndex),
        reason: "Forature presenti ma non riconosciute da Hardware Pattern Recognition V1.",
      });
    }
  });

  return {
    schema: "bagastudio-hardware-pattern-recognition-v1",
    version: 1,
    generatedAt: new Date().toISOString(),
    totals: {
      components: meshes.length,
      patterns: items.filter((item) => item.patternType !== "unknown").length,
      hinges: items.filter((item) => item.patternType === "hinge").length,
      minifix: items.filter((item) => item.patternType === "minifix").length,
      shelfPins: items.filter((item) => item.patternType === "shelfPin").length,
      unknown: items.filter((item) => item.patternType === "unknown").length,
    },
    items,
  };
}
