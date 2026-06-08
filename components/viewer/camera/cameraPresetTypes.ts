export type BagastudioCameraViewId = "front" | "left" | "right" | "top" | "iso" | "3d";

export type BagastudioCameraPresetData = {
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
  near?: number;
  far?: number;
  fov?: number;
};

export type BagastudioCameraPresetMap = Partial<Record<BagastudioCameraViewId, BagastudioCameraPresetData>>;

export const BAGASTUDIO_DEFAULT_OPENING_VIEW_ID: BagastudioCameraViewId = "front";
export const BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY = "bagastudio.cameraPresets.v2";
export const BAGASTUDIO_CAMERA_PRESETS_LEGACY_STORAGE_KEY = "bagastudio.cameraPresets.v1";

export function normalizeBagastudioCameraViewId(viewId?: string | null): BagastudioCameraViewId {
  const raw = String(viewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID).trim().toLowerCase();
  if (raw === "fr" || raw === "frontale" || raw === "front") return "front";
  if (raw === "sx" || raw === "sinistra" || raw === "left") return "left";
  if (raw === "dx" || raw === "destra" || raw === "right") return "right";
  if (raw === "top" || raw === "alto") return "top";
  if (raw === "3d") return "3d";
  if (raw === "iso" || raw === "isometrica") return "iso";
  return BAGASTUDIO_DEFAULT_OPENING_VIEW_ID;
}

export function isBagastudioCameraPresetData(value: unknown): value is BagastudioCameraPresetData {
  const preset = value as BagastudioCameraPresetData | null;
  return Boolean(
    preset &&
      Array.isArray(preset.position) &&
      preset.position.length === 3 &&
      preset.position.every((item) => Number.isFinite(Number(item))) &&
      Array.isArray(preset.target) &&
      preset.target.length === 3 &&
      preset.target.every((item) => Number.isFinite(Number(item)))
  );
}
