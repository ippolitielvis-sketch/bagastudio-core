import * as THREE from "three";
import {
  BAGASTUDIO_DEFAULT_OPENING_VIEW_ID,
  type BagastudioCameraPresetData,
  normalizeBagastudioCameraViewId,
} from "./cameraPresetTypes";
import { loadCameraPreset, saveCameraPreset } from "./cameraPresetStorage";

export {
  BAGASTUDIO_DEFAULT_OPENING_VIEW_ID,
  type BagastudioCameraPresetData,
  normalizeBagastudioCameraViewId,
} from "./cameraPresetTypes";
export { loadCameraPresetMap, loadCameraPreset, saveCameraPreset, resetCameraPreset } from "./cameraPresetStorage";

export function getSavedCameraPreset(viewId?: string | null): BagastudioCameraPresetData | null {
  return loadCameraPreset(normalizeBagastudioCameraViewId(viewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID));
}

export function buildCameraPresetFromThreeCamera(
  camera: THREE.Camera,
  target: THREE.Vector3
): BagastudioCameraPresetData {
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  return {
    position: [camera.position.x, camera.position.y, camera.position.z],
    target: [target.x, target.y, target.z],
    up: [camera.up.x, camera.up.y, camera.up.z],
    near: perspectiveCamera.near,
    far: perspectiveCamera.far,
    fov: perspectiveCamera.fov,
  };
}

export function applyCameraPresetToThreeCamera({
  camera,
  renderer,
  preset,
}: {
  camera: THREE.Camera;
  renderer?: THREE.WebGLRenderer;
  preset: BagastudioCameraPresetData;
}) {
  if (!preset?.position || !preset?.target) return;

  if (preset.up) {
    camera.up.set(preset.up[0], preset.up[1], preset.up[2]);
  } else {
    camera.up.set(0, 1, 0);
  }

  camera.position.set(preset.position[0], preset.position[1], preset.position[2]);
  camera.lookAt(preset.target[0], preset.target[1], preset.target[2]);

  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  if (Number.isFinite(preset.fov)) {
    perspectiveCamera.fov = THREE.MathUtils.clamp(Number(preset.fov), 15, 85);
  }
  if (Number.isFinite(preset.near)) {
    perspectiveCamera.near = Math.max(Number(preset.near), 0.01);
  }
  if (Number.isFinite(preset.far)) {
    perspectiveCamera.far = Math.max(Number(preset.far), perspectiveCamera.near + 10);
  }
  perspectiveCamera.updateProjectionMatrix();

  const controls = (renderer as any)?.__r3f?.root?.getState?.().controls;
  if (controls?.target) {
    controls.target.set(preset.target[0], preset.target[1], preset.target[2]);
    controls.update?.();
  }
}

export function saveThreeCameraPreset({
  viewId,
  camera,
  target,
}: {
  viewId: string;
  camera: THREE.Camera;
  target: THREE.Vector3;
}) {
  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  const preset = buildCameraPresetFromThreeCamera(camera, target);
  saveCameraPreset(normalizedViewId, preset);
  return preset;
}
