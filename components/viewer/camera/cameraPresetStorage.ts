import {
  BAGASTUDIO_CAMERA_PRESETS_LEGACY_STORAGE_KEY,
  BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY,
  type BagastudioCameraPresetData,
  type BagastudioCameraPresetMap,
  type BagastudioCameraViewId,
  isBagastudioCameraPresetData,
  normalizeBagastudioCameraViewId,
} from "./cameraPresetTypes";

function normalizePresetMap(rawMap: unknown): BagastudioCameraPresetMap {
  if (!rawMap || typeof rawMap !== "object") return {};

  return Object.entries(rawMap as Record<string, unknown>).reduce<BagastudioCameraPresetMap>((acc, [rawViewId, preset]) => {
    if (!isBagastudioCameraPresetData(preset)) return acc;
    const viewId = normalizeBagastudioCameraViewId(rawViewId);
    acc[viewId] = preset;
    return acc;
  }, {});
}

function readStorageKey(storageKey: string): BagastudioCameraPresetMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    return normalizePresetMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

function readPerViewStorage(): BagastudioCameraPresetMap {
  if (typeof window === "undefined") return {};

  return (["front", "left", "right", "top", "3d", "iso"] as BagastudioCameraViewId[]).reduce<BagastudioCameraPresetMap>((acc, viewId) => {
    try {
      const raw = window.localStorage.getItem(`${BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY}.${viewId}`);
      if (!raw) return acc;
      const preset = JSON.parse(raw);
      if (isBagastudioCameraPresetData(preset)) acc[viewId] = preset;
    } catch {
      // Ignore singoli preset corrotti: non devono rompere gli altri.
    }
    return acc;
  }, {});
}

export function loadCameraPresetMap(): BagastudioCameraPresetMap {
  const current = readStorageKey(BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY);
  const legacy = readStorageKey(BAGASTUDIO_CAMERA_PRESETS_LEGACY_STORAGE_KEY);
  const perView = readPerViewStorage();
  return { ...legacy, ...current, ...perView };
}

export function saveCameraPresetMap(presets: BagastudioCameraPresetMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY, JSON.stringify(presets));

    Object.entries(presets).forEach(([rawViewId, preset]) => {
      const viewId = normalizeBagastudioCameraViewId(rawViewId);
      if (isBagastudioCameraPresetData(preset)) {
        window.localStorage.setItem(`${BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY}.${viewId}`, JSON.stringify(preset));
      }
    });
  } catch {
    // localStorage può essere bloccato in modalità privata o contesti limitati.
  }
}

export function loadCameraPreset(viewId: string): BagastudioCameraPresetData | null {
  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  const presets = loadCameraPresetMap();
  const preset = presets[normalizedViewId];
  return isBagastudioCameraPresetData(preset) ? preset : null;
}

export function saveCameraPreset(viewId: string, preset: BagastudioCameraPresetData): BagastudioCameraPresetMap {
  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  const presets = loadCameraPresetMap();
  const nextPresets: BagastudioCameraPresetMap = { ...presets, [normalizedViewId]: preset };
  saveCameraPresetMap(nextPresets);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:camera-preset-saved", {
        detail: { viewId: normalizedViewId, preset, presets: nextPresets },
      })
    );
  }

  return nextPresets;
}

export function resetCameraPreset(viewId: string): BagastudioCameraPresetMap {
  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  const presets = loadCameraPresetMap();
  const nextPresets: BagastudioCameraPresetMap = { ...presets };
  delete nextPresets[normalizedViewId as BagastudioCameraViewId];
  saveCameraPresetMap(nextPresets);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(`${BAGASTUDIO_CAMERA_PRESETS_STORAGE_KEY}.${normalizedViewId}`);
    } catch {
      // Ignore cleanup storage failures.
    }
  }

  return nextPresets;
}
