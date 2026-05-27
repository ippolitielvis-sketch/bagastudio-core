export type InsertConfig = {
  enabled: boolean;
  widthPercent: number;
  heightPercent: number;
  offsetX: number;
  offsetY: number;
  materialId: string;
};

export const DEFAULT_INSERT_CONFIG: InsertConfig = {
  enabled: false,
  widthPercent: 60,
  heightPercent: 25,
  offsetX: 0,
  offsetY: 0,
  materialId: "marble_calacatta",
};

export function getDefaultInsertConfig(): InsertConfig {
  return { ...DEFAULT_INSERT_CONFIG };
}

export function toggleInsert(current?: InsertConfig): InsertConfig {
  const cfg = current ?? getDefaultInsertConfig();

  return {
    ...cfg,
    enabled: !cfg.enabled,
  };
}

export function updateInsert(
  current: InsertConfig | undefined,
  updates: Partial<InsertConfig>
): InsertConfig {
  return {
    ...(current ?? getDefaultInsertConfig()),
    ...updates,
  };
}