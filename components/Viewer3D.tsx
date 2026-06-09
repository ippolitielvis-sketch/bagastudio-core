  "use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Center,
  Environment,
  Edges,
  Line,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { useConfigStore } from "@/core/state/config.state";
import { MATERIAL_LIBRARY } from "@/core/data/materials";
import { createLedBar } from "@/lib/engine/ledEngine";
import {
  createUsbAccessory,
  createSocketAccessory,
  createHairdryerHolderAccessory,
  createToolHolderAccessory,
  createWirelessChargerAccessory,
  createMirrorLedAccessory,
} from "@/core/accessories/accessoryRenderer";
import { getDefaultInsertConfig } from "@/core/engines/insertEngine";
import PremiumRoomEnvironment, { type RoomEnvironmentSettings } from "./viewer/RoomEnvironment";
import SceneComposerPanel from "./viewer/SceneComposerPanel";
import RoomPanel from "./viewer-ui/RoomPanel";
import RoomOrientationOverlay from "./viewer-ui/RoomOrientationOverlay";
import ViewerToolsPanel from "./viewer-ui/ViewerToolsPanel";
import {
  BAGASTUDIO_DEFAULT_OPENING_VIEW_ID,
  type BagastudioCameraPresetData,
  applyCameraPresetToThreeCamera,
  getSavedCameraPreset,
  normalizeBagastudioCameraViewId,
  saveThreeCameraPreset,
} from "./viewer/camera/CameraPresetManager";


type ViewerMiniTabId = "room" | "module" | "view" | "join" | "quotes" | "help";

type ViewerMiniTabProps = {
  id: ViewerMiniTabId;
  label: string;
  eyebrow?: string;
  defaultPosition: { left: number; top: number };
  open: boolean;
  onToggle: (id: ViewerMiniTabId) => void;
  onPositionChange?: (position: { left: number; top: number }) => void;
  dockRight?: boolean;
  children?: ReactNode;
};

function ViewerMiniTab({ id, label, eyebrow, defaultPosition, open, onToggle, onPositionChange, dockRight = true, children }: ViewerMiniTabProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDockedRight, setIsDockedRight] = useState(dockRight);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const startDrag = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: isDockedRight ? defaultPosition.left : position.left,
      startTop: position.top,
    };
    setIsDockedRight(false);
    event.currentTarget?.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event: any) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const panelWidth = 430;
    const maxLeft = Math.max(12, viewportWidth - panelWidth - 24);
    const nextPosition = {
      left: Math.max(12, Math.min(maxLeft, drag.startLeft + event.clientX - drag.startX)),
      top: Math.max(12, Math.min(720, drag.startTop + event.clientY - drag.startY)),
    };
    setPosition(nextPosition);
    onPositionChange?.(nextPosition);
  };

  const dockBackRight = () => {
    setIsDockedRight(true);
    setPosition((current) => ({ ...current, left: defaultPosition.left }));
  };

  const endDrag = (event: any) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget?.releasePointerCapture?.(event.pointerId);

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const panelWidth = 430;
    const maxLeft = Math.max(12, viewportWidth - panelWidth - 24);
    const finalLeft = Math.max(12, Math.min(maxLeft, drag.startLeft + event.clientX - drag.startX));
    // Se la mini-tab viene trascinata vicino alla destra, torna automaticamente nel dock.
    if (finalLeft > viewportWidth - 520) {
      dockBackRight();
    }
  };

  return (
    <div
      className="absolute z-[60] select-none"
      style={isDockedRight ? { right: 6, top: position.top } : { left: position.left, top: position.top }}
      data-bagastudio-mini-tab={id}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`min-w-[86px] rounded-xl border px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.18em] shadow-[0_16px_38px_rgba(0,0,0,0.38)] backdrop-blur-xl transition ${
            open
              ? "border-cyan-300/40 bg-cyan-500/18 text-cyan-50"
              : "border-white/10 bg-slate-950/78 text-slate-300 hover:border-cyan-300/30 hover:text-cyan-100"
          }`}
          title={open ? `Chiudi ${label}` : `Apri ${label}`}
        >
          {label}
        </button>
        <button
          type="button"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            dockBackRight();
          }}
          className="h-7 w-7 cursor-grab rounded-xl border border-white/10 bg-slate-950/72 text-[13px] font-black text-slate-300 shadow-[0_16px_38px_rgba(0,0,0,0.32)] backdrop-blur-xl active:cursor-grabbing"
          title="Trascina mini-scheda. Doppio click per riagganciarla a destra."
        >
          ⋮⋮
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-9 max-h-[560px] w-[430px] overflow-y-auto overflow-x-hidden rounded-2xl pr-0 [&>*]:!static [&>*]:!bottom-auto [&>*]:!left-auto [&>*]:!right-auto [&>*]:!top-auto [&>*]:!w-full">
          {eyebrow && (
            <div className="mb-2 w-fit rounded-full border border-cyan-300/20 bg-slate-950/80 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200 shadow-xl backdrop-blur">
              {eyebrow}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}


type ViewerQuoteOverlayV5Props = {
  enabled: boolean;
  environment?: RoomEnvironmentSettings;
  sceneModules: any[];
  activeSceneModuleId?: string;
  productWidthCm: number;
  productDepthCm: number;
  productHeightCm: number;
};

function ViewerQuoteLabelV5({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  return (
    <Text
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.105}
      color="#e0faff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.006}
      outlineColor="#06111d"
    >
      {children as any}
    </Text>
  );
}

function ViewerQuoteOverlayV5({
  enabled,
  environment,
  sceneModules,
  activeSceneModuleId,
  productWidthCm,
  productDepthCm,
  productHeightCm,
}: ViewerQuoteOverlayV5Props) {
  if (!enabled) return null;

  const roomWidthM = Math.max(1, Number(environment?.roomWidthCm || 420) / 100);
  const roomDepthM = Math.max(1, Number(environment?.roomDepthCm || 360) / 100);
  const roomHeightCm = Number(environment?.roomHeightCm || 280);
  const moduleWidthM = Math.max(0.2, Number(productWidthCm || 180) / 100);
  const moduleDepthM = Math.max(0.2, Number(productDepthCm || 60) / 100);
  const moduleHeightCm = Math.max(1, Number(productHeightCm || 100));
  const floorY = 0.045;
  const roomX = roomWidthM / 2;
  const roomZ = roomDepthM / 2;
  const roomLinePoints: [number, number, number][] = [
    [-roomX, floorY, -roomZ],
    [roomX, floorY, -roomZ],
    [roomX, floorY, roomZ],
    [-roomX, floorY, roomZ],
    [-roomX, floorY, -roomZ],
  ];

  return (
    <group name="bagastudio-quote-overlay-v5">
      <Line points={roomLinePoints} color="#22d3ee" lineWidth={1.4} transparent opacity={0.9} />
      <ViewerQuoteLabelV5 position={[0, floorY + 0.018, roomZ + 0.18]}>{Math.round(roomWidthM * 100)} cm</ViewerQuoteLabelV5>
      <ViewerQuoteLabelV5 position={[roomX + 0.18, floorY + 0.018, 0]}>{Math.round(roomDepthM * 100)} cm</ViewerQuoteLabelV5>
      <ViewerQuoteLabelV5 position={[-roomX + 0.38, floorY + 0.018, -roomZ - 0.18]}>H {Math.round(roomHeightCm)} cm</ViewerQuoteLabelV5>

      {(sceneModules || []).map((module: any, index: number) => {
        const transform = module?.transform || {};
        const x = Number(transform.x || 0);
        const z = Number(transform.z ?? -0.62);
        const rotationY = THREE.MathUtils.degToRad(Number(transform.rotationYDeg || 0));
        const isActive = module?.id === activeSceneModuleId;
        const localX = moduleWidthM / 2;
        const localZ = moduleDepthM / 2;
        const localPoints: [number, number, number][] = [
          [-localX, floorY + 0.035, -localZ],
          [localX, floorY + 0.035, -localZ],
          [localX, floorY + 0.035, localZ],
          [-localX, floorY + 0.035, localZ],
          [-localX, floorY + 0.035, -localZ],
        ];

        return (
          <group key={`quote-module-${module?.id || index}`} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
            <Line
              points={localPoints}
              color={isActive ? "#67e8f9" : "#a78bfa"}
              lineWidth={isActive ? 2.2 : 1.2}
              transparent
              opacity={isActive ? 0.98 : 0.68}
            />
            <ViewerQuoteLabelV5 position={[0, floorY + 0.075, -localZ - 0.16]}>{Math.round(moduleWidthM * 100)} cm</ViewerQuoteLabelV5>
            <ViewerQuoteLabelV5 position={[localX + 0.16, floorY + 0.075, 0]}>{Math.round(moduleDepthM * 100)} cm</ViewerQuoteLabelV5>
            <ViewerQuoteLabelV5 position={[-localX - 0.16, floorY + 0.075, 0]}>H {Math.round(moduleHeightCm)} cm</ViewerQuoteLabelV5>
            <ViewerQuoteLabelV5 position={[0, floorY + 0.12, localZ + 0.18]}>{module?.name || `Modulo ${index + 1}`}</ViewerQuoteLabelV5>
          </group>
        );
      })}
    </group>
  );
}




type ParametricSceneModuleV1Props = {
  module: any;
  active: boolean;
  visualFeedback?: "join" | "collision" | null;
  onSelect?: (moduleId: string | null) => void;
};

function ParametricSceneModuleV1({ module, active, visualFeedback = null, onSelect }: ParametricSceneModuleV1Props) {
  const dimensions = module?.dimensions || {};
  const widthM = Math.max(0.05, Number(dimensions.width || 180) / 100);
  const depthM = Math.max(0.05, Number(dimensions.depth || 60) / 100);
  const heightM = Math.max(0.05, Number(dimensions.height || 100) / 100);
  const thicknessM = Math.max(0.006, Number(dimensions.thickness || 1.8) / 100);
  const transform = module?.transform || {};
  const moduleId = String(module?.id || "");
  const yCenter = heightM / 2;
  const panelMaterial = active ? "#dbeafe" : "#cbd5e1";
  const edgeColor = active ? "#22d3ee" : "#64748b";

  const panelCommon = {
    castShadow: true,
    receiveShadow: true,
    onClick: (event: any) => {
      event.stopPropagation();
      if (moduleId) onSelect?.(moduleId);
    },
  };

  return (
    <group
      name={`bagastudio-parametric-module-v1-${moduleId}`}
      position={[Number(transform.x || 0), 0, Number(transform.z || 0)]}
      rotation={[0, THREE.MathUtils.degToRad(Number(transform.rotationYDeg || 0)), 0]}
      userData={{ bagastudioParametricModuleV1: true, bagastudioSceneModuleId: moduleId }}
    >
      <mesh {...panelCommon} name={`${moduleId}_fianco_sx`} position={[-widthM / 2 + thicknessM / 2, yCenter, 0]}>
        <boxGeometry args={[thicknessM, heightM, depthM]} />
        <meshStandardMaterial color={panelMaterial} roughness={0.68} metalness={0.02} transparent opacity={0.96} />
        <Edges color={edgeColor} threshold={18} />
      </mesh>
      <mesh {...panelCommon} name={`${moduleId}_fianco_dx`} position={[widthM / 2 - thicknessM / 2, yCenter, 0]}>
        <boxGeometry args={[thicknessM, heightM, depthM]} />
        <meshStandardMaterial color={panelMaterial} roughness={0.68} metalness={0.02} transparent opacity={0.96} />
        <Edges color={edgeColor} threshold={18} />
      </mesh>
      <mesh {...panelCommon} name={`${moduleId}_cielo`} position={[0, heightM - thicknessM / 2, 0]}>
        <boxGeometry args={[widthM, thicknessM, depthM]} />
        <meshStandardMaterial color={panelMaterial} roughness={0.68} metalness={0.02} transparent opacity={0.96} />
        <Edges color={edgeColor} threshold={18} />
      </mesh>
      <mesh {...panelCommon} name={`${moduleId}_fondo`} position={[0, thicknessM / 2, 0]}>
        <boxGeometry args={[widthM, thicknessM, depthM]} />
        <meshStandardMaterial color={panelMaterial} roughness={0.68} metalness={0.02} transparent opacity={0.96} />
        <Edges color={edgeColor} threshold={18} />
      </mesh>
      <mesh {...panelCommon} name={`${moduleId}_schiena`} position={[0, yCenter, -depthM / 2 + thicknessM / 2]}>
        <boxGeometry args={[widthM, heightM, thicknessM]} />
        <meshStandardMaterial color={active ? "#e0f2fe" : "#e2e8f0"} roughness={0.72} metalness={0.01} transparent opacity={0.88} />
        <Edges color={edgeColor} threshold={18} />
      </mesh>
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} renderOrder={9}>
          <planeGeometry args={[widthM, depthM]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
      {visualFeedback && (
        <mesh position={[0, yCenter, 0]} renderOrder={10} userData={{ bagastudioIgnoreRaycast: true }}>
          <boxGeometry args={[widthM + 0.012, heightM + 0.012, depthM + 0.012]} />
          <meshBasicMaterial color={visualFeedback === "collision" ? "#ef4444" : "#22c55e"} transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
          <Edges color={visualFeedback === "collision" ? "#f87171" : "#4ade80"} threshold={10} />
        </mesh>
      )}
    </group>
  );
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const textureWaiters = new Map<string, Array<(texture: THREE.Texture) => void>>();
let bagastudioRendererMaxAnisotropy = 8;

function configureBagastudioTexture(texture: THREE.Texture, options?: {
  repeatX?: number;
  repeatY?: number;
  rotate?: boolean;
}) {
  texture.colorSpace = THREE.SRGBColorSpace;

  // Recovery Texture V2: default uniform texture on each part.
  // RepeatWrapping + automatic repeat caused visible "quadrati/piastrelle" on panels.
  // ClampToEdge keeps the texture stretched uniformly over the component surface.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.max(8, bagastudioRendererMaxAnisotropy || 8);

  // Forced 1:1. No runtime tiling in Viewer client; texture must be visually uniform on the part.
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.center.set(0.5, 0.5);
  // Wood direction is handled by UV coordinates, not by rotating the bitmap texture.
  // Rotating both UVs and texture caused the direction toggle to look like a mirror/flip.
  texture.rotation = 0;
  texture.needsUpdate = true;
}

function getBagastudioTextureRepeat(mesh: THREE.Mesh, materialData: any, rotateWood = false) {
  const explicitRepeatX = Number(materialData?.repeatX ?? materialData?.scaleX);
  const explicitRepeatY = Number(materialData?.repeatY ?? materialData?.scaleY);

  // Only use tiling when the material explicitly asks for it.
  // The safe default must be uniform, otherwise Spazio3D panels show square repetition.
  if (Number.isFinite(explicitRepeatX) && explicitRepeatX > 0 && Number.isFinite(explicitRepeatY) && explicitRepeatY > 0) {
    return { repeatX: explicitRepeatX, repeatY: explicitRepeatY, rotate: false };
  }

  return { repeatX: 1, repeatY: 1, rotate: false };
}

type ImportCalibrationSettings = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  rotationXDeg: number;
  rotationYDeg: number;
  rotationZDeg: number;
  scale: number;
  realWidthCm: number;
};

const DEFAULT_IMPORT_CALIBRATION: ImportCalibrationSettings = {
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  rotationXDeg: 0,
  rotationYDeg: 0,
  rotationZDeg: 0,
  scale: 1,
  realWidthCm: 0,
};

const IMPORT_CALIBRATION_LABELS: Record<keyof ImportCalibrationSettings, string> = {
  offsetX: "Offset X",
  offsetY: "Offset Y",
  offsetZ: "Offset Z",
  rotationXDeg: "Rot. X",
  rotationYDeg: "Rot. Y",
  rotationZDeg: "Rot. Z",
  scale: "Scala",
  realWidthCm: "Largh. reale cm",
};

type Viewer3DProps = {
  width?: number;
  height?: number;
  depth?: number;
  materials?: Record<string, string>;
  productMaterials?: any[];
 accessories: Record<string, Record<string, boolean>>;
  inserts?: Record<string, boolean>;
 insertMaterials?: Record<string, string>;
 insertSizes?: Record<string, {
  width?: number;
  depth?: number;
  offsetX?: number;
  offsetZ?: number;
}>;
  visibility?: Record<string, boolean>;
  productModel: string;
  productModelFormat?: string;
  importedModelName?: string;
  activeViewId?: string | null;
 ledKelvin?: Record<string, number>;
 ledIntensity?: Record<string, number>;
 woodDirection?: Record<string, "x" | "z">;
 xRayEnabled?: boolean;
 xRayOpacity?: number;
 onToggleXRay?: () => void;
 onChangeXRayOpacity?: (value: number) => void;
 modelEdgesEnabled?: boolean;
 environment?: RoomEnvironmentSettings;
 importCalibration?: ImportCalibrationSettings;
 modelSceneOffset?: { x: number; z: number; rotationYDeg?: number };
 sceneModules?: any[];
 activeSceneModuleId?: string;
 activeSceneModuleStatus?: "ok" | "join" | "collision" | null;
  onSelectSceneModule?: (moduleId: string | null) => void;
  views?: {
  id: string;
  name: string;
  camera: {
    position: number[];
    target: number[];
  };
}[];
productParts?: {
  id: string;
  name: string;
  meshName: string;
  defaultMaterialId?: string;
 mountPoints?: {
led?: {
  position?: string;
  frontOffset: number;
  sideMargin: number;
  yOffset: number;
};
  insert?: {
  position?: string[];
  offset?: {
    x: number;
    y: number;
    z: number;
  };
};
};
led?: boolean;
}[];
};


function sniffDataUrlModelFormat(url: string): string {
  if (!url.startsWith("data:")) return "";

  const lower = url.slice(0, 512).toLowerCase();
  if (lower.includes("model/gltf") || lower.includes("model/glb")) return "glb";
  if (lower.includes("model/stl")) return "stl";
  if (lower.includes("model/obj")) return "obj";
  if (lower.includes("model/fbx")) return "fbx";
  if (lower.includes("model/vnd.collada") || lower.includes("model/dae") || lower.includes("collada")) return "dae";

  try {
    const commaIndex = url.indexOf(",");
    if (commaIndex < 0) return "";
    const metadata = url.slice(0, commaIndex).toLowerCase();
    const payload = url.slice(commaIndex + 1, commaIndex + 12000);

    let sample = "";
    if (metadata.includes(";base64")) {
      const paddedPayload = payload.slice(0, payload.length - (payload.length % 4));
      sample = typeof atob === "function" ? atob(paddedPayload) : "";
    } else {
      sample = decodeURIComponent(payload);
    }

    const textSample = sample.slice(0, 4096).toLowerCase();
    if (textSample.startsWith("gltf") || textSample.includes("glb")) return "glb";
    if (textSample.includes("<collada") || textSample.includes("colladaschema")) return "dae";
    if (textSample.includes("<library_geometries") || textSample.includes("<library_nodes")) return "dae";
    if (textSample.includes("solid ") || textSample.includes("facet normal")) return "stl";
    if (textSample.includes("\nv ") && textSample.includes("\nf ")) return "obj";
  } catch {
    return "";
  }

  return "";
}

function inferModelFormat(url: string, explicitFormat?: string) {
  const sniffedDataUrlFormat = sniffDataUrlModelFormat(url);
  if (sniffedDataUrlFormat) return sniffedDataUrlFormat;

  const format = String(explicitFormat || "").toLowerCase().replace(".", "");
  if (format) return format;

  if (url.startsWith("data:")) return "glb";

  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.split(".").pop() || "glb";
}

function createBagastudioNeutralImportMaterial() {
  return new THREE.MeshStandardMaterial({
    name: "BagaStudio_Neutral_Import_Material",
    color: "#c8c8c8",
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
}

function hasUsableMaterial(material: THREE.Material | THREE.Material[] | undefined | null) {
  if (!material) return false;
  if (Array.isArray(material)) return material.length > 0 && material.every(Boolean);
  return Boolean(material);
}

function shouldUseNeutralImportMaterial(format?: string | null) {
  const normalizedFormat = String(format || "").toLowerCase();
  return ["dae", "obj", "fbx", "stl"].includes(normalizedFormat);
}

function materialLooksInvisible(material: THREE.Material | THREE.Material[] | undefined | null) {
  if (!material) return true;

  const materials = Array.isArray(material) ? material : [material];

  if (materials.length === 0) return true;

  return materials.some((mat: any) => {
    if (!mat) return true;
    if (typeof mat.opacity === "number" && mat.opacity <= 0.02) return true;
    if (mat.visible === false) return true;
    return false;
  });
}

function repairBagastudioImportedMeshGeometry(mesh: THREE.Mesh) {
  const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
  if (!geometry) return;

  const position = geometry.getAttribute("position");
  if (position) {
    const indexedCount = geometry.index?.count;
    geometry.setDrawRange(0, indexedCount || position.count);
  }

  const normal = geometry.getAttribute("normal");
  if (position && (!normal || normal.count !== position.count)) {
    geometry.computeVertexNormals();
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  mesh.visible = true;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function repairBagastudioImportedMaterial(material: THREE.Material | THREE.Material[] | null | undefined) {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((mat: any) => {
    if (!mat) return;

    mat.side = THREE.DoubleSide;
    mat.visible = true;
    mat.depthTest = true;
    mat.depthWrite = true;
    mat.needsUpdate = true;
  });
}

function prepareBagastudioImportedObject(root: THREE.Object3D, format?: string | null) {
  const forceNeutral = shouldUseNeutralImportMaterial(format);

  root.visible = true;
  root.updateMatrixWorld(true);

  root.traverse((child) => {
    child.visible = true;
    child.frustumCulled = false;
    child.updateMatrixWorld(true);

    const mesh = child as THREE.Mesh;

    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.visible = true;

    repairBagastudioImportedMeshGeometry(mesh);

    if (forceNeutral || !hasUsableMaterial(mesh.material) || materialLooksInvisible(mesh.material)) {
      mesh.material = createBagastudioNeutralImportMaterial();
    }

    repairBagastudioImportedMaterial(mesh.material);
  });

  root.updateMatrixWorld(true);
}

function forcePreviewMaterials(root: THREE.Object3D, format?: string | null) {
  prepareBagastudioImportedObject(root, format);
}


function buildBagastudioColladaRuntimeRoot(colladaScene: THREE.Object3D) {
  // BagaStudio V6.8 - Spazio3D DAE Hierarchy Loader
  // Spazio3D exports a real COLLADA node hierarchy (Cabinet -> panels -> hardware groups).
  // Do NOT bake each mesh with matrixWorld and do NOT reset transforms: that destroys
  // parent/child offsets, pivots, instance_node placement and makes the furniture appear
  // as a few overlapping boards. Keep the original hierarchy and only tag meshes.
  const daeRoot = colladaScene.clone(true);
  daeRoot.name = colladaScene.name || "Imported_DAE";
  daeRoot.visible = true;
  daeRoot.userData = {
    ...colladaScene.userData,
    bagastudioImportedFormat: "dae",
    bagastudioSourceType: "collada",
    bagastudioTransformMode: "hierarchy-preserved",
    bagastudioPreserveHierarchy: true,
  };

  let meshIndex = 0;

  daeRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    meshIndex += 1;
    mesh.visible = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    if (!mesh.name || mesh.name.trim() === "") {
      mesh.name = mesh.parent?.name || `dae_part_${meshIndex}`;
    }

    repairBagastudioImportedMeshGeometry(mesh);

    const originalName = mesh.name || "";
    const parentName = mesh.parent?.name || "";
    const normalizedName = `${originalName} ${parentName}`.toLowerCase();
    const isRuntimeHardware =
      normalizedName.includes("cerniera") ||
      normalizedName.includes("basetta") ||
      normalizedName.includes("maniglia") ||
      normalizedName.includes("cerchio") ||
      normalizedName.includes("hardware") ||
      normalizedName.includes("ironware");

    mesh.userData = {
      ...mesh.userData,
      bagastudioImportedFormat: "dae",
      bagastudioSelectable: true,
      bagastudioRuntimeComponent: true,
      bagastudioRuntimeKind: isRuntimeHardware ? "hardware" : "panel",
      bagastudioOriginalName: originalName,
      bagastudioParentName: parentName,
      bagastudioPreservedLocalTransform: true,
    };

    if (!hasUsableMaterial(mesh.material) || materialLooksInvisible(mesh.material)) {
      mesh.material = createBagastudioNeutralImportMaterial();
    }

    repairBagastudioImportedMaterial(mesh.material);
  });

  daeRoot.updateMatrixWorld(true);
  return daeRoot;
}

function getBagastudioKnownImportWidthCm(name?: string | null) {
  const key = String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (key.includes("postazione_vieira") || key.includes("vieira")) return 418;

  const explicitCm = key.match(/(?:^|[_\-\s])(\d{2,5})(?:cm|_cm)(?:$|[_\-\s])/);
  if (explicitCm) {
    const parsed = Number(explicitCm[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const explicitMm = key.match(/(?:^|[_\-\s])(\d{3,6})(?:mm|_mm)(?:$|[_\-\s])/);
  if (explicitMm) {
    const parsed = Number(explicitMm[1]) / 10;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
}

function getBagastudioImportedScaleBox(root: THREE.Object3D | null) {
  if (!root) return null;

  const boxes: THREE.Box3[] = [];
  const fullBox = new THREE.Box3().setFromObject(root);

  root.updateMatrixWorld(true);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    if (mesh.userData?.bagastudioEdgeOverlay) return;
    if (mesh.userData?.bagastudioTechnicalHelper) return;
    if (mesh.userData?.bagastudioIgnoreRaycast) return;

    const runtimeKind = String(mesh.userData?.bagastudioRuntimeKind || "").toLowerCase();
    const category = String(mesh.userData?.bagastudioCategory || "").toLowerCase();
    const meshName = String(mesh.name || "").toLowerCase();

    // Import Scale V17:
    // Maniglie/ferramenta/pezzi staccati possono allargare la bbox totale del DAE.
    // Per scalare la misura reale del mobile usiamo il cluster principale di pannelli,
    // non l'ingombro totale con accessori o moduli fuori gruppo.
    if (
      runtimeKind === "hardware" ||
      category === "accessory" ||
      meshName.includes("maniglia") ||
      meshName.includes("accessorio") ||
      meshName.includes("handle")
    ) {
      return;
    }

    const box = new THREE.Box3().setFromObject(mesh);
    if (!box.isEmpty()) boxes.push(box);
  });

  if (!boxes.length) return fullBox.isEmpty() ? null : fullBox;

  const fullSize = fullBox.getSize(new THREE.Vector3());
  const fullMax = Math.max(fullSize.x, fullSize.y, fullSize.z, 1);
  const clusterMargin = Math.max(fullMax * 0.04, 5);
  const ordered = boxes
    .map((box, index) => ({ box, index, volume: getBagastudioBoxVolume(box) }))
    .sort((a, b) => b.volume - a.volume);

  const seed = ordered[0]?.box;
  if (!seed) return fullBox.isEmpty() ? null : fullBox;

  const clusterBox = seed.clone();
  const used = new Set<number>([ordered[0].index]);
  let changed = true;

  while (changed) {
    changed = false;
    const expandedCluster = clusterBox.clone().expandByScalar(clusterMargin);

    ordered.forEach((item) => {
      if (used.has(item.index)) return;
      if (!expandedCluster.intersectsBox(item.box)) return;

      clusterBox.union(item.box);
      used.add(item.index);
      changed = true;
    });
  }

  return clusterBox.isEmpty() ? (fullBox.isEmpty() ? null : fullBox) : clusterBox;
}

function getBagastudioImportedDisplayScale(
  root: THREE.Object3D | null,
  format?: string | null,
  dimensions?: { width?: number; height?: number; depth?: number },
  importedModelName?: string | null,
  manualRealWidthCm?: number
) {
  if (!root) return 1;

  const box = getBagastudioImportedScaleBox(root) || new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());

  const rawWidth = Math.abs(Number(size.x || 0));
  const rawHeight = Math.abs(Number(size.y || 0));
  const rawDepth = Math.abs(Number(size.z || 0));
  const maxDimension = Math.max(rawWidth, rawHeight, rawDepth);

  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return 1;

  const normalizedFormat = String(format || "").toLowerCase();
  const isImported = isImportedModelFormat(normalizedFormat);

  const productWidthCm = Number(dimensions?.width || 0);
  const productHeightCm = Number(dimensions?.height || 0);
  const productDepthCm = Number(dimensions?.depth || 0);
  const productMaxCm = Math.max(productWidthCm, productHeightCm, productDepthCm);

  const isDefaultPlaceholderDimensions =
    Math.abs(productWidthCm - 180) < 0.001 &&
    Math.abs(productHeightCm - 60) < 0.001 &&
    Math.abs(productDepthCm - 100) < 0.001;

  // Scale Units V7:
  // 1 unità Viewer = 1 metro, stanza = cm / 100.
  // I valori 180x60x100 sono placeholder UI e NON devono scalare import DAE/STL reali.
  // Per import diretti si normalizza prima l'unità nativa del file:
  // 4180 => mm -> 4.18m, 418 => cm -> 4.18m, 41.8 => dm/CAD -> 4.18m, 4.18 => m.
  const importedUnitScale = (() => {
    if (!isImported) return 1;

    // Import Scale V16:
    // 1 unità Viewer = 1 metro.
    // Non usare più il caso decimetri automatico: raw 90 veniva trasformato in 9 m
    // e gli STL/DAE generici diventavano giganti.
    // Regola conservativa:
    // - valori molto grandi = millimetri;
    // - valori medi tipo 90/180/420 = centimetri;
    // - valori piccoli tipo 4.2/1.8 = metri.
    if (maxDimension >= 1000) return 0.001;
    if (maxDimension >= 20) return 0.01;
    return 1;
  })();

  // Import Scale V19:
  // La scala universale degli import non deve dipendere dal placeholder 180x60x100.
  // Se l'utente inserisce la larghezza reale nel pannello Import Calibration,
  // quella misura diventa la fonte di verità per qualunque DAE/STL/OBJ/FBX.
  const explicitRealWidthCm = Number(manualRealWidthCm || 0);
  if (isImported && explicitRealWidthCm > 0 && rawWidth > 0) {
    return THREE.MathUtils.clamp((explicitRealWidthCm / 100) / rawWidth, 0.00001, 1000);
  }

  // Scale Real V11:
  // Se il nome del file ci dà una larghezza reale nota, scala sull'asse X del modello,
  // non sulla dimensione massima. La Vieira è 418 cm e deve quasi riempire una parete da 420 cm.
  const knownWidthCm = getBagastudioKnownImportWidthCm(importedModelName);
  if (isImported && knownWidthCm && rawWidth > 0) {
    return THREE.MathUtils.clamp((knownWidthCm / 100) / rawWidth, 0.00001, 1000);
  }

  // Usa dimensioni prodotto solo quando sono esplicite e credibili.
  // Il placeholder 180x60x100 non deve scalare import DAE/STL reali.
  // Import Scale V24:
  // Gli import DAE/STL/OBJ/FBX NON devono essere scalati usando le dimensioni UI del prodotto
  // (180x60x100 o varianti scambiate): quel placeholder trasformava un cubo 50 cm in circa 180 cm.
  // Per gli import la fonte di scala deve essere:
  // 1) Largh. reale cm manuale;
  // 2) larghezza nota dal nome file;
  // 3) unità nativa stimata del file.
  const hasReliableProductDimensions =
    !isImported &&
    Number.isFinite(productMaxCm) &&
    productMaxCm > 0 &&
    !isDefaultPlaceholderDimensions;

  if (hasReliableProductDimensions) {
    const targetMaxDimension = productMaxCm / 100;
    return THREE.MathUtils.clamp(targetMaxDimension / maxDimension, 0.00001, 1000);
  }

  return importedUnitScale;
}

function getBagastudioImportedAxisCorrection(root: THREE.Object3D | null, format?: string | null): [number, number, number] {
  if (!root || !isImportedModelFormat(format ?? undefined)) return [0, 0, 0];

  const normalizedFormat = String(format || "").toLowerCase();
  if (!["dae", "glb", "gltf", "obj", "fbx", "stl"].includes(normalizedFormat)) return [0, 0, 0];

  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return [0, 0, 0];

  const size = box.getSize(new THREE.Vector3());
  const y = Math.abs(size.y);
  const z = Math.abs(size.z);

  // Recovery V18 - Axis guard:
  // Some Spazio3D/COLLADA imports arrive as Z-up even though the Viewer works in BagaStudio axes:
  // +Y = alto, +X = destra, +Z = profondità.
  // Rotate only when the geometry still looks Z-up. If ColladaLoader already converted it to Y-up,
  // this returns zero and does not disturb the hierarchy or the loader.
  if (z > y * 1.25) {
    return [-Math.PI / 2, 0, 0];
  }

  return [0, 0, 0];
}


type BagaStudioRuntimeComponent = {
  id: string;
  partId?: string;
  index: number;
  meshName: string;
  originalName: string;
  displayName: string;
  materialGroup: string;
  category?: string;
  componentType?: string;
  tags?: string[];
  runtimeMetadata?: Record<string, any>;
  configuratorBridge?: Record<string, any>;
  supportsMaterial: boolean;
  supportsLED: boolean;
  supportsInsert: boolean;
  supportsAccessories?: boolean;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
};



type BagaStudioAdminMappingEntry = {
  partId: string;
  meshName: string;
  originalName: string;
  displayName: string;
  customerName: string;
  materialGroup: string;
  category: string;
  supportsMaterial: boolean;
  supportsLED: boolean;
  supportsInsert: boolean;
  supportsAccessories: boolean;
  visible: boolean;
  locked: boolean;
};

type BagaStudioAdminMappingPackage = {
  schema: "bagastudio.adminMapping.v1";
  createdAt: string;
  sourceFormat: string;
  componentCount: number;
  mappings: BagaStudioAdminMappingEntry[];
};

type BagaStudioProductPackage = {
  schema: "bagastudio.productPackage.v1";
  createdAt: string;
  sourceFormat: string;
  product: {
    id: string;
    name: string;
    modelFile: string;
  };
  importer: {
    canExportGlb: boolean;
    normalized: boolean;
    componentCount: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  components: BagaStudioRuntimeComponent[];
  reconstructedParts?: BagaStudioRuntimeComponent[];
  geometryCompletion?: {
    status?: string;
    daeMeshCount?: number;
    s3dComponentCount?: number;
    matchedCount?: number;
    missingCount?: number;
    missingParts?: BagaStudioRuntimeComponent[];
    reconstructedParts?: BagaStudioRuntimeComponent[];
  };
  materials: Record<string, string>;
  accessories: Record<string, unknown[]>;
  led: Record<string, { enabled: boolean; kelvin?: number; intensity?: number }>;
  inserts: Record<string, unknown>;
};

type BagaStudioValidationIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  partId?: string;
};

type BagaStudioValidationResult = {
  valid: boolean;
  errors: BagaStudioValidationIssue[];
  warnings: BagaStudioValidationIssue[];
  componentCount: number;
  checkedAt: string;
};


type BagaStudioImporterReport = {
  schema: "bagastudio.importerReport.v1";
  createdAt: string;
  sourceFormat: string;
  status: "ready" | "warning" | "error";
  summary: {
    componentCount: number;
    errorCount: number;
    warningCount: number;
    canExportGlb: boolean;
    normalized: boolean;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  components: Array<{
    partId: string;
    meshName: string;
    displayName: string;
    materialGroup: string;
    supportsMaterial: boolean;
    supportsLED: boolean;
    supportsInsert: boolean;
    bounds: {
      width: number;
      height: number;
      depth: number;
    };
  }>;
  issues: BagaStudioValidationIssue[];
  recommendedActions: string[];
};

type BagaStudioImporterHistoryEntry = {
  id: string;
  createdAt: string;
  sourceFormat: string;
  status: "ready" | "warning" | "error";
  componentCount: number;
  productPackage?: BagaStudioProductPackage;
  adminMapping?: BagaStudioAdminMappingPackage;
  importerReport?: BagaStudioImporterReport;
};


type BagaStudioCompatibilityGuardResult = {
  schema: "bagastudio.importerCompatibilityGuard.v1";
  checkedAt: string;
  status: "ready" | "warning" | "error";
  canApply: boolean;
  sceneComponentCount: number;
  packageComponentCount: number;
  adminMappingCount: number;
  matchedComponentCount: number;
  unmatchedPackagePartIds: string[];
  unmatchedScenePartIds: string[];
  missingAdminMappingPartIds: string[];
  duplicateScenePartIds: string[];
  issues: BagaStudioValidationIssue[];
};

type BagaStudioSafeApplyResult = {
  schema: "bagastudio.importerSafeApply.v1";
  appliedAt: string;
  target: "productPackage" | "adminMapping" | "both";
  status: "applied" | "blocked" | "rolled_back";
  compatibility: BagaStudioCompatibilityGuardResult;
  rollbackAvailable: boolean;
  message: string;
};


function buildFriendlyComponentName(rawName: string, index: number) {
  const fallback = `Pezzo ${String(index).padStart(3, "0")}`;
  const cleaned = String(rawName || "")
    .replace(/^mesh[_\-\s]*/i, "")
    .replace(/^object[_\-\s]*/i, "")
    .replace(/^node[_\-\s]*/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sanitizeComponentId(rawName: string, index: number) {
  const base = String(rawName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/\-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return base || `part_${String(index).padStart(3, "0")}`;
}


function buildImportedProductPackage(root: THREE.Object3D, format?: string): BagaStudioProductPackage {
  const components = (root.userData?.bagastudioRuntimeComponents || []) as BagaStudioRuntimeComponent[];
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const sourceFormat = String(format || root.userData?.bagastudioImporterFormat || "unknown").toLowerCase();
  const createdAt = new Date().toISOString();

  return {
    schema: "bagastudio.productPackage.v1",
    createdAt,
    sourceFormat,
    product: {
      id: `imported_${sourceFormat}_${Date.now()}`,
      name: `Prodotto importato ${sourceFormat.toUpperCase()}`,
      modelFile: `bagastudio-import-${sourceFormat}-clean.glb`,
    },
    importer: {
      canExportGlb: true,
      normalized: true,
      componentCount: components.length,
    },
    dimensions: {
      width: Number(size.x.toFixed(4)),
      height: Number(size.y.toFixed(4)),
      depth: Number(size.z.toFixed(4)),
    },
    components,
    materials: {},
    accessories: {},
    led: components.reduce<Record<string, { enabled: boolean; kelvin?: number; intensity?: number }>>((acc, component) => {
      acc[component.id] = { enabled: false };
      return acc;
    }, {}),
    inserts: {},
  };
}

function prepareImportedProductPackage(root: THREE.Object3D, format?: string) {
  const productPackage = buildImportedProductPackage(root, format);
  const validation = validateProductPackage(productPackage, root);
  const importerReport = buildImporterReport(productPackage, validation, root);
  root.userData.bagastudioProductPackage = productPackage;
  root.userData.bagastudioProductPackageValidation = validation;
  root.userData.bagastudioImporterReport = importerReport;

  if (typeof window === "undefined") return productPackage;

  const cleanFormat = String(format || "model").toLowerCase();
  const filename = `bagastudio-product-package-${cleanFormat}.json`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetLastProductPackage?: () => BagaStudioProductPackage | undefined;
    bagastudioGetLastImporterReport?: () => BagaStudioImporterReport | undefined;
    bagastudioDownloadLastImporterReport?: () => void;
    bagastudioDownloadLastProductPackage?: () => void;
    bagastudioImportProductPackage?: (input: BagaStudioProductPackage | string) => BagaStudioProductPackage | undefined;
    bagastudioApplyLastProductPackage?: () => BagaStudioProductPackage | undefined;
    bagastudioSafeApplyLastProductPackage?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyImporterState?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioRollbackLastImporterSafeApply?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioValidateLastProductPackage?: () => BagaStudioValidationResult | undefined;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;
  bagastudioWindow.__bagastudioLastProductPackage = productPackage;
  bagastudioWindow.__bagastudioLastImporterReport = importerReport;
  prepareAdminMappingBridge(root, productPackage);
  prepareImporterUiBridge(root);
  prepareImporterHistoryBridge(root);
  prepareImporterCompatibilityGuardBridge(root);
  prepareImporterSafeApplyBridge(root);
  bagastudioWindow.bagastudioGetLastProductPackage = () => bagastudioWindow.__bagastudioLastProductPackage || productPackage;
  bagastudioWindow.bagastudioGetLastImporterReport = () => bagastudioWindow.__bagastudioLastImporterReport || importerReport;
  bagastudioWindow.bagastudioDownloadLastImporterReport = () => {
    const currentReport = bagastudioWindow.__bagastudioLastImporterReport || importerReport;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, `bagastudio-importer-report-${cleanFormat}.json`);
  };
  bagastudioWindow.bagastudioValidateLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage || productPackage;
    const validation = validateProductPackage(currentPackage, root);
    const report = buildImporterReport(currentPackage, validation, root);
    bagastudioWindow.__bagastudioLastImporterReport = report;
    root.userData.bagastudioImporterReport = report;

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-validation", {
        detail: { validation, productPackage: currentPackage, importerReport: report },
      })
    );

    return validation;
  };
  bagastudioWindow.bagastudioDownloadLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage || productPackage;
    const blob = new Blob([JSON.stringify(currentPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, filename);
  };

  bagastudioWindow.bagastudioImportProductPackage = (input) => {
    try {
      const importedPackage = parseProductPackageInput(input);
      const validation = validateProductPackage(importedPackage, root);

      if (!validation.valid) {
        throw new Error(`Invalid Product Package: ${validation.errors.map((issue) => issue.message).join(" | ")}`);
      }

      const report = buildImporterReport(importedPackage, validation, root);
      root.userData.bagastudioProductPackageValidation = validation;
      root.userData.bagastudioImporterReport = report;
      bagastudioWindow.__bagastudioLastProductPackage = importedPackage;
      bagastudioWindow.__bagastudioLastImporterReport = report;
      root.userData.bagastudioProductPackage = importedPackage;
      applyProductPackageToImportedRoot(root, importedPackage);

      prepareImporterUiBridge(root);
      window.dispatchEvent(
        new CustomEvent("bagastudio:product-package-imported", {
          detail: {
            productPackage: importedPackage,
            componentCount: importedPackage.importer.componentCount,
            validation,
            importerReport: report,
          },
        })
      );

      return importedPackage;
    } catch (error) {
      console.error("BagaStudio Importer: Product Package import failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:product-package-import-error", {
          detail: { error },
        })
      );
      return undefined;
    }
  };

  bagastudioWindow.bagastudioApplyLastProductPackage = () => {
    const currentPackage = bagastudioWindow.__bagastudioLastProductPackage;
    if (!currentPackage) return undefined;

    applyProductPackageToImportedRoot(root, currentPackage);

    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-applied", {
        detail: { productPackage: currentPackage },
      })
    );

    return currentPackage;
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-product-package-ready", {
      detail: {
        filename,
        productPackage,
        componentCount: productPackage.components.length,
        validation,
        importerReport,
      },
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-report-ready", {
      detail: {
        importerReport,
        status: importerReport.status,
        componentCount: importerReport.summary.componentCount,
        errorCount: importerReport.summary.errorCount,
        warningCount: importerReport.summary.warningCount,
      },
    })
  );

  return productPackage;
}


function buildAdminMappingPackage(productPackage: BagaStudioProductPackage): BagaStudioAdminMappingPackage {
  return {
    schema: "bagastudio.adminMapping.v1",
    createdAt: new Date().toISOString(),
    sourceFormat: productPackage.sourceFormat,
    componentCount: productPackage.components.length,
    mappings: productPackage.components.map((component) => ({
      partId: component.id,
      meshName: component.meshName,
      originalName: component.originalName,
      displayName: component.displayName,
      customerName: component.displayName,
      materialGroup: component.materialGroup || "default",
      category: "component",
      supportsMaterial: component.supportsMaterial,
      supportsLED: component.supportsLED,
      supportsInsert: component.supportsInsert,
      supportsAccessories: true,
      visible: true,
      locked: false,
    })),
  };
}

function prepareAdminMappingBridge(root: THREE.Object3D, productPackage: BagaStudioProductPackage) {
  const adminMapping = buildAdminMappingPackage(productPackage);
  root.userData.bagastudioAdminMapping = adminMapping;

  if (typeof window === "undefined") return adminMapping;

  const filename = `bagastudio-admin-mapping-${productPackage.sourceFormat || "model"}.json`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    bagastudioGetLastAdminMapping?: () => BagaStudioAdminMappingPackage | undefined;
    bagastudioDownloadLastAdminMapping?: () => void;
    bagastudioUpdateLastAdminMappingEntry?: (partId: string, patch: Partial<BagaStudioAdminMappingEntry>) => BagaStudioAdminMappingPackage | undefined;
    bagastudioImportAdminMapping?: (input: BagaStudioAdminMappingPackage | string) => BagaStudioAdminMappingPackage | undefined;
    bagastudioApplyLastAdminMapping?: () => BagaStudioRuntimeComponent[] | undefined;
    bagastudioSafeApplyLastAdminMapping?: () => BagaStudioSafeApplyResult | undefined;
  };

  bagastudioWindow.__bagastudioLastAdminMapping = adminMapping;
  bagastudioWindow.bagastudioGetLastAdminMapping = () => bagastudioWindow.__bagastudioLastAdminMapping;
  bagastudioWindow.bagastudioDownloadLastAdminMapping = () => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping || adminMapping;
    const blob = new Blob([JSON.stringify(currentMapping, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, filename);
  };

  bagastudioWindow.bagastudioUpdateLastAdminMappingEntry = (partId, patch) => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping || adminMapping;
    const nextMapping: BagaStudioAdminMappingPackage = {
      ...currentMapping,
      mappings: currentMapping.mappings.map((entry) =>
        entry.partId === partId ? { ...entry, ...patch, partId: entry.partId } : entry
      ),
    };

    bagastudioWindow.__bagastudioLastAdminMapping = nextMapping;
    root.userData.bagastudioAdminMapping = nextMapping;
    applyAdminMappingToImportedRoot(root, nextMapping);

    window.dispatchEvent(
      new CustomEvent("bagastudio:admin-mapping-updated", {
        detail: { partId, patch, adminMapping: nextMapping },
      })
    );

    return nextMapping;
  };

  bagastudioWindow.bagastudioImportAdminMapping = (input) => {
    try {
      const importedMapping = parseAdminMappingInput(input);
      bagastudioWindow.__bagastudioLastAdminMapping = importedMapping;
      root.userData.bagastudioAdminMapping = importedMapping;
      const components = applyAdminMappingToImportedRoot(root, importedMapping);

      prepareImporterUiBridge(root);
      window.dispatchEvent(
        new CustomEvent("bagastudio:admin-mapping-imported", {
          detail: {
            adminMapping: importedMapping,
            componentCount: importedMapping.componentCount,
            components,
          },
        })
      );

      return importedMapping;
    } catch (error) {
      console.error("BagaStudio Importer: Admin Mapping import failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:admin-mapping-import-error", {
          detail: { error },
        })
      );
      return undefined;
    }
  };

  bagastudioWindow.bagastudioApplyLastAdminMapping = () => {
    const currentMapping = bagastudioWindow.__bagastudioLastAdminMapping;
    if (!currentMapping) return undefined;

    const components = applyAdminMappingToImportedRoot(root, currentMapping);

    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:admin-mapping-applied", {
        detail: { adminMapping: currentMapping, components },
      })
    );

    return components;
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:admin-mapping-ready", {
      detail: {
        filename,
        adminMapping,
        componentCount: adminMapping.componentCount,
      },
    })
  );

  return adminMapping;
}


function applyAdminMappingToImportedRoot(root: THREE.Object3D, adminMapping: BagaStudioAdminMappingPackage) {
  const mappingByPartId = new Map(adminMapping.mappings.map((entry) => [entry.partId, entry]));
  const mappingByMeshName = new Map(adminMapping.mappings.map((entry) => [entry.meshName, entry]));

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "");
    const entry = mappingByPartId.get(partId) || mappingByMeshName.get(mesh.name);
    if (!entry) return;

    mesh.userData.bagastudioPartId = entry.partId;
    mesh.userData.bagastudioMeshName = entry.meshName;
    mesh.userData.bagastudioDisplayName = entry.customerName || entry.displayName;
    mesh.userData.bagastudioMaterialGroup = entry.materialGroup;
    mesh.userData.bagastudioCategory = entry.category;
    mesh.userData.bagastudioSupportsMaterial = entry.supportsMaterial;
    mesh.userData.bagastudioSupportsLED = entry.supportsLED;
    mesh.userData.bagastudioSupportsInsert = entry.supportsInsert;
    mesh.userData.bagastudioSupportsAccessories = entry.supportsAccessories;
    mesh.userData.bagastudioVisible = entry.visible;
    mesh.userData.bagastudioLocked = entry.locked;
  });

  root.userData.bagastudioAdminMapping = adminMapping;
  root.userData.bagastudioAdminMappingAppliedAt = new Date().toISOString();

  const runtimeComponents = (root.userData?.bagastudioRuntimeComponents || []) as BagaStudioRuntimeComponent[];
  root.userData.bagastudioRuntimeComponents = runtimeComponents.map((component) => {
    const entry = mappingByPartId.get(component.id) || mappingByMeshName.get(component.meshName);
    if (!entry) return component;

    return {
      ...component,
      displayName: entry.customerName || entry.displayName || component.displayName,
      materialGroup: entry.materialGroup || component.materialGroup,
      supportsMaterial: entry.supportsMaterial,
      supportsLED: entry.supportsLED,
      supportsInsert: entry.supportsInsert,
    };
  });

  return root.userData.bagastudioRuntimeComponents as BagaStudioRuntimeComponent[];
}

function parseAdminMappingInput(input: BagaStudioAdminMappingPackage | string) {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;

  if (!parsed || parsed.schema !== "bagastudio.adminMapping.v1" || !Array.isArray(parsed.mappings)) {
    throw new Error("Invalid BagaStudio Admin Mapping package");
  }

  return parsed as BagaStudioAdminMappingPackage;
}

function validateProductPackage(productPackage: BagaStudioProductPackage, root?: THREE.Object3D): BagaStudioValidationResult {
  const errors: BagaStudioValidationIssue[] = [];
  const warnings: BagaStudioValidationIssue[] = [];

  const pushIssue = (
    level: "error" | "warning",
    code: string,
    message: string,
    partId?: string
  ) => {
    const issue: BagaStudioValidationIssue = { level, code, message, partId };
    if (level === "error") errors.push(issue);
    else warnings.push(issue);
  };

  if (!productPackage || productPackage.schema !== "bagastudio.productPackage.v1") {
    pushIssue("error", "invalid_schema", "Schema Product Package non valido");
  }

  if (!Array.isArray(productPackage.components)) {
    pushIssue("error", "missing_components", "Lista componenti mancante o non valida");
  }

  const components = Array.isArray(productPackage.components) ? productPackage.components : [];
  const seenIds = new Set<string>();
  const seenMeshNames = new Set<string>();

  components.forEach((component, index) => {
    const fallbackPartId = `index_${index}`;
    const partId = String(component?.id || "").trim();
    const meshName = String(component?.meshName || "").trim();

    if (!partId) {
      pushIssue("error", "missing_part_id", `Componente ${index + 1} senza partId`, fallbackPartId);
    } else if (seenIds.has(partId)) {
      pushIssue("error", "duplicate_part_id", `partId duplicato: ${partId}`, partId);
    } else {
      seenIds.add(partId);
    }

    if (!meshName) {
      pushIssue("warning", "missing_mesh_name", `Componente ${partId || index + 1} senza meshName`, partId || fallbackPartId);
    } else if (seenMeshNames.has(meshName)) {
      pushIssue("warning", "duplicate_mesh_name", `meshName duplicato: ${meshName}`, partId || fallbackPartId);
    } else {
      seenMeshNames.add(meshName);
    }

    if (!String(component?.displayName || "").trim()) {
      pushIssue("warning", "missing_display_name", `Nome cliente mancante per ${partId || index + 1}`, partId || fallbackPartId);
    }

    const bounds = component?.bounds;
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || !Number.isFinite(bounds.depth)) {
      pushIssue("warning", "invalid_bounds", `Dimensioni componente non valide per ${partId || index + 1}`, partId || fallbackPartId);
    }
  });

  if (productPackage.importer?.componentCount !== components.length) {
    pushIssue(
      "warning",
      "component_count_mismatch",
      `Conteggio componenti non coerente: importer=${productPackage.importer?.componentCount ?? "n/d"}, reale=${components.length}`
    );
  }

  const ledKeys = Object.keys(productPackage.led || {});
  ledKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_led_config", `LED configurato su componente non presente: ${partId}`, partId);
    }
  });

  const materialKeys = Object.keys(productPackage.materials || {});
  materialKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_material_config", `Materiale configurato su componente non presente: ${partId}`, partId);
    }
  });

  const insertKeys = Object.keys(productPackage.inserts || {});
  insertKeys.forEach((partId) => {
    if (!seenIds.has(partId)) {
      pushIssue("warning", "orphan_insert_config", `Inserto configurato su componente non presente: ${partId}`, partId);
    }
  });

  if (root) {
    const rootPartIds = new Set<string>();
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "").trim();
      if (partId) rootPartIds.add(partId);
    });

    components.forEach((component) => {
      if (component.id && !rootPartIds.has(component.id) && !rootPartIds.has(component.meshName)) {
        pushIssue("warning", "component_not_found_in_scene", `Componente non trovato nella scena corrente: ${component.id}`, component.id);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    componentCount: components.length,
    checkedAt: new Date().toISOString(),
  };
}

function buildImporterReport(
  productPackage: BagaStudioProductPackage,
  validation: BagaStudioValidationResult,
  root?: THREE.Object3D
): BagaStudioImporterReport {
  const dimensions = productPackage.dimensions || { width: 0, height: 0, depth: 0 };
  const issues = [...validation.errors, ...validation.warnings];
  const recommendedActions: string[] = [];

  if (validation.errors.length > 0) {
    recommendedActions.push("Correggere gli errori del Product Package prima di salvare il prodotto in catalogo.");
  }

  if (validation.warnings.some((issue) => issue.code === "missing_display_name")) {
    recommendedActions.push("Completare i nomi cliente-friendly dei componenti dal futuro Admin Panel.");
  }

  if (validation.warnings.some((issue) => issue.code === "invalid_bounds")) {
    recommendedActions.push("Verificare scala e dimensioni dei componenti importati.");
  }

  if (validation.warnings.some((issue) => issue.code === "component_not_found_in_scene")) {
    recommendedActions.push("Controllare che il mapping Admin corrisponda al modello attualmente caricato.");
  }

  if (productPackage.components.length === 0) {
    recommendedActions.push("Il modello non contiene mesh configurabili: verificare export sorgente o separazione componenti.");
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push("Package pronto per mapping Admin, export GLB e salvataggio in catalogo.");
  }

  if (root) {
    root.userData.bagastudioImporterReportGeneratedAt = new Date().toISOString();
  }

  return {
    schema: "bagastudio.importerReport.v1",
    createdAt: new Date().toISOString(),
    sourceFormat: productPackage.sourceFormat,
    status: validation.errors.length > 0 ? "error" : validation.warnings.length > 0 ? "warning" : "ready",
    summary: {
      componentCount: productPackage.components.length,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      canExportGlb: productPackage.importer?.canExportGlb === true,
      normalized: productPackage.importer?.normalized === true,
    },
    dimensions: {
      width: Number(dimensions.width || 0),
      height: Number(dimensions.height || 0),
      depth: Number(dimensions.depth || 0),
    },
    components: productPackage.components.map((component) => ({
      partId: component.id,
      meshName: component.meshName,
      displayName: component.displayName,
      materialGroup: component.materialGroup,
      supportsMaterial: component.supportsMaterial,
      supportsLED: component.supportsLED,
      supportsInsert: component.supportsInsert,
      bounds: component.bounds,
    })),
    issues,
    recommendedActions,
  };
}

function parseProductPackageInput(input: BagaStudioProductPackage | string) {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;

  if (!parsed || parsed.schema !== "bagastudio.productPackage.v1" || !Array.isArray(parsed.components)) {
    throw new Error("Invalid BagaStudio Product Package");
  }

  return parsed as BagaStudioProductPackage;
}



function bagastudioCreateRuntimeConfiguratorBridge(partId: string) {
  const stablePartId = String(partId || "").trim();

  return {
    schema: "bagastudio.configuratorBridge.v1",
    partId: stablePartId,
    materialKey: stablePartId,
    ledKey: stablePartId,
    insertKey: stablePartId,
    accessoryKey: stablePartId,
    visibilityKey: stablePartId,
    generatedAt: new Date().toISOString(),
  };
}

function bagastudioBuildRuntimeMetadataSummary(components: BagaStudioRuntimeComponent[], sourceFormat?: string) {
  const categories = components.reduce<Record<string, number>>((acc, component) => {
    const category = component.category || component.runtimeMetadata?.detectedCategory || component.materialGroup || "component";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return {
    schema: "bagastudio.runtimeMetadataSummary.v1",
    sourceFormat: sourceFormat || "product-package",
    componentCount: components.length,
    categories,
    generatedAt: new Date().toISOString(),
  };
}

function bagastudioNormalizeRuntimeComponentFromPackage(rawComponent: any, index: number, source: "geometry" | "reconstructed"): BagaStudioRuntimeComponent {
  const fallbackId = `${source}_${String(index + 1).padStart(3, "0")}`;
  const id = String(rawComponent?.id || rawComponent?.partId || rawComponent?.meshName || fallbackId);
  const meshName = String(rawComponent?.meshName || id);
  const displayName = String(rawComponent?.displayName || rawComponent?.customerName || rawComponent?.name || rawComponent?.originalName || meshName);
  const originalName = String(rawComponent?.originalName || rawComponent?.name || displayName);
  const materialGroup = String(rawComponent?.materialGroup || rawComponent?.category || "main");
  const category = String(rawComponent?.category || rawComponent?.runtimeMetadata?.detectedCategory || materialGroup || "component");
  const componentType = String(rawComponent?.componentType || rawComponent?.runtimeMetadata?.componentType || (source === "reconstructed" ? "reconstructed-placeholder" : category));
  const bounds = rawComponent?.bounds || { width: 0, height: 0, depth: 0 };

  return {
    id,
    partId: String(rawComponent?.partId || id),
    index: Number.isFinite(Number(rawComponent?.index)) ? Number(rawComponent.index) : index,
    meshName,
    originalName,
    displayName,
    materialGroup,
    category,
    componentType,
    tags: Array.isArray(rawComponent?.tags)
      ? rawComponent.tags
      : String(rawComponent?.tags || source)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    runtimeMetadata:
      rawComponent?.runtimeMetadata || {
        schema: "bagastudio.runtimeComponentMetadata.v1",
        detectedCategory: category,
        componentType,
        sourceFormat: source === "reconstructed" ? "space3d-reconstructed-placeholder" : "product-package",
        generatedAt: new Date().toISOString(),
        stablePartId: String(rawComponent?.partId || id),
        canReceiveMaterial: rawComponent?.supportsMaterial !== false,
        canReceiveAccessories: rawComponent?.supportsAccessories !== false,
        canReceiveLed: Boolean(rawComponent?.supportsLED ?? rawComponent?.compatibleLed ?? false),
        canReceiveInsert: Boolean(rawComponent?.supportsInsert ?? rawComponent?.compatibleInsert ?? false),
        bounds: {
          width: Number(bounds?.width || 0),
          height: Number(bounds?.height || 0),
          depth: Number(bounds?.depth || 0),
        },
        rawMeshName: meshName,
        originalName,
      },
    configuratorBridge: rawComponent?.configuratorBridge || bagastudioCreateRuntimeConfiguratorBridge(String(rawComponent?.partId || id)),
    supportsMaterial: rawComponent?.supportsMaterial !== false,
    supportsLED: Boolean(rawComponent?.supportsLED ?? rawComponent?.compatibleLed ?? false),
    supportsInsert: Boolean(rawComponent?.supportsInsert ?? rawComponent?.compatibleInsert ?? false),
    supportsAccessories: rawComponent?.supportsAccessories !== false,
    bounds: {
      width: Number(bounds?.width || 0),
      height: Number(bounds?.height || 0),
      depth: Number(bounds?.depth || 0),
    },
  };
}

function bagastudioGetMergedRuntimeComponents(productPackage: BagaStudioProductPackage): BagaStudioRuntimeComponent[] {
  const baseComponents = Array.isArray(productPackage.components) ? productPackage.components : [];
  const reconstructedCandidates = [
    ...(Array.isArray(productPackage.reconstructedParts) ? productPackage.reconstructedParts : []),
    ...(Array.isArray(productPackage.geometryCompletion?.reconstructedParts) ? productPackage.geometryCompletion?.reconstructedParts || [] : []),
    ...(Array.isArray(productPackage.geometryCompletion?.missingParts) ? productPackage.geometryCompletion?.missingParts || [] : []),
  ];

  const merged = [
    ...baseComponents.map((component, index) => bagastudioNormalizeRuntimeComponentFromPackage(component, index, "geometry")),
    ...reconstructedCandidates.map((component, index) =>
      bagastudioNormalizeRuntimeComponentFromPackage(component, baseComponents.length + index, "reconstructed")
    ),
  ];

  const seen = new Set<string>();
  return merged.filter((component) => {
    const key = String(component.id || component.partId || component.meshName || "").trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyProductPackageToImportedRoot(root: THREE.Object3D, productPackage: BagaStudioProductPackage) {
  const mergedRuntimeComponents = bagastudioGetMergedRuntimeComponents(productPackage);
  const componentsById = new Map(mergedRuntimeComponents.map((component) => [component.id, component]));
  const componentsByMeshName = new Map(mergedRuntimeComponents.map((component) => [component.meshName, component]));

  root.userData.bagastudioProductPackage = productPackage;
  root.userData.bagastudioProductPackageAppliedAt = new Date().toISOString();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "");
    const component = componentsById.get(partId) || componentsByMeshName.get(mesh.name);
    if (!component) return;

    mesh.userData.bagastudioPartId = component.id;
    mesh.userData.bagastudioMeshName = component.meshName;
    mesh.userData.bagastudioOriginalName = component.originalName;
    mesh.userData.bagastudioDisplayName = component.displayName;
    mesh.userData.bagastudioMaterialGroup = component.materialGroup;
    mesh.userData.bagastudioSupportsMaterial = component.supportsMaterial;
    mesh.userData.bagastudioSupportsLED = component.supportsLED;
    mesh.userData.bagastudioSupportsInsert = component.supportsInsert;
    mesh.userData.bagastudioRuntimeComponent = component;
  });

  root.userData.bagastudioRuntimeComponents = mergedRuntimeComponents;
  root.userData.bagastudioRuntimeMetadata = bagastudioBuildRuntimeMetadataSummary(mergedRuntimeComponents, productPackage.sourceFormat);
  root.userData.bagastudioRuntimeMergeReport = {
    schema: "bagastudio.runtimeMergeReport.v1",
    geometryComponents: Array.isArray(productPackage.components) ? productPackage.components.length : 0,
    reconstructedParts: Math.max(mergedRuntimeComponents.length - (Array.isArray(productPackage.components) ? productPackage.components.length : 0), 0),
    runtimeComponentCount: mergedRuntimeComponents.length,
    mergedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    (window as any).__bagastudioViewerRuntimeComponents = mergedRuntimeComponents;
    (window as any).__bagastudioViewerRuntimeMetadata = root.userData.bagastudioRuntimeMetadata;
    (window as any).__bagastudioViewerRuntimeMergeReport = root.userData.bagastudioRuntimeMergeReport;
    window.dispatchEvent(
      new CustomEvent("bagastudio:runtime-components-merged", {
        detail: {
          productPackage,
          components: mergedRuntimeComponents,
          mergeReport: root.userData.bagastudioRuntimeMergeReport,
        },
      })
    );
  }

  

/* =========================
   BagaStudio Catalog Browser V1
========================= */

function bagastudioNormalizeCatalogText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioSearchProductLibrary(query = "", filters: any = {}) {
  const library = bagastudioReadProductLibrary();
  const normalizedQuery = bagastudioNormalizeCatalogText(query);
  const categoryFilter = bagastudioNormalizeCatalogText(filters?.category || "");
  const sourceFormatFilter = bagastudioNormalizeCatalogText(filters?.sourceFormat || "");

  const results = library.filter((item: any) => {
    const searchableText = bagastudioNormalizeCatalogText([
      item?.name,
      item?.productId,
      item?.productSlug,
      item?.category,
      item?.version,
      item?.sourceFormat,
      item?.package?.metadata?.engine,
      item?.package?.metadata?.pipeline,
    ].filter(Boolean).join(" "));

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory =
      !categoryFilter || bagastudioNormalizeCatalogText(item?.category) === categoryFilter;
    const matchesSourceFormat =
      !sourceFormatFilter || bagastudioNormalizeCatalogText(item?.sourceFormat) === sourceFormatFilter;

    return matchesQuery && matchesCategory && matchesSourceFormat;
  });

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-search", {
      detail: {
        query,
        filters,
        count: results.length,
        results,
      },
    })
  );

  return results;
}

function bagastudioGetProductLibraryCategories() {
  const categories = bagastudioReadProductLibrary()
    .map((item: any) => item?.category || "uncategorized")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort((a: any, b: any) =>
    String(a).localeCompare(String(b))
  );
}

function bagastudioGetProductLibraryCardData(query = "", filters: any = {}) {
  return bagastudioSearchProductLibrary(query, filters).map((item: any) => ({
    productId: item?.productId,
    productSlug: item?.productSlug,
    name: item?.name || "BagaStudio Product",
    category: item?.category || "uncategorized",
    version: item?.version || "1.0.0",
    sourceFormat: item?.sourceFormat || null,
    savedAt: item?.savedAt || null,
    updatedAt: item?.updatedAt || null,
    thumbnail: item?.thumbnail || null,
    hasPackage: Boolean(item?.package),
    hasAdminMapping: Boolean(item?.package?.adminMapping || item?.package?.productPackage?.adminMapping),
    hasImporterReport: Boolean(item?.package?.importerReport),
  }));
}

function bagastudioImportProductLibrary(libraryJson: any, options: any = {}) {
  const incomingLibrary = Array.isArray(libraryJson)
    ? libraryJson
    : Array.isArray(libraryJson?.items)
      ? libraryJson.items
      : [];

  if (!incomingLibrary.length) {
    const error = new Error("Invalid BagaStudio product library import");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-import-error", {
        detail: error,
      })
    );

    throw error;
  }

  const currentLibrary = options?.replace ? [] : bagastudioReadProductLibrary();
  const currentByKey = new Map(
    currentLibrary.map((item: any) => [item?.productId || item?.productSlug, item])
  );

  incomingLibrary.forEach((item: any) => {
    const key = item?.productId || item?.productSlug || bagastudioCreateProductLibraryId(item?.name);
    currentByKey.set(key, {
      ...item,
      productId: item?.productId || key,
      productSlug:
        item?.productSlug ||
        String(item?.name || key)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      updatedAt: new Date().toISOString(),
    });
  });

  const nextLibrary = Array.from(currentByKey.values()).sort((a: any, b: any) =>
    String(b?.updatedAt || b?.savedAt || "").localeCompare(String(a?.updatedAt || a?.savedAt || ""))
  );

  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-imported", {
      detail: {
        replace: Boolean(options?.replace),
        count: incomingLibrary.length,
        library: nextLibrary,
      },
    })
  );

  return nextLibrary;
}



/* =========================
   BagaStudio Product Loader V1
========================= */

let __bagastudioPreparedLibraryProduct: any = null;

function bagastudioExtractProductRuntimePackage(libraryItem: any) {
  const fullPackage = libraryItem?.package || libraryItem || null;
  const productPackage = fullPackage?.productPackage || fullPackage || null;

  return {
    libraryItem,
    fullPackage,
    productPackage,
    adminMapping:
      fullPackage?.adminMapping ||
      productPackage?.adminMapping ||
      null,
    importerReport:
      fullPackage?.importerReport ||
      productPackage?.importerReport ||
      null,
    thumbnail:
      fullPackage?.thumbnail ||
      productPackage?.thumbnail ||
      libraryItem?.thumbnail ||
      null,
    metadata: {
      ...(fullPackage?.metadata || {}),
      ...(productPackage?.metadata || {}),
      productId: libraryItem?.productId || productPackage?.productId || null,
      productSlug: libraryItem?.productSlug || productPackage?.productSlug || null,
      productName: libraryItem?.name || productPackage?.productName || productPackage?.name || null,
      category: libraryItem?.category || productPackage?.productCategory || null,
      sourceFormat: libraryItem?.sourceFormat || productPackage?.sourceFormat || null,
    },
  };
}

function bagastudioPrepareProductFromLibrary(productIdOrSlug: string, options: any = {}) {
  const libraryItem = bagastudioLoadProductFromLibrary(productIdOrSlug);
  const prepared = bagastudioExtractProductRuntimePackage(libraryItem);

  __bagastudioPreparedLibraryProduct = {
    ...prepared,
    preparedAt: new Date().toISOString(),
    options,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-prepared", {
      detail: __bagastudioPreparedLibraryProduct,
    })
  );

  if (options?.autoApply) {
    return bagastudioApplyPreparedProduct(options);
  }

  return __bagastudioPreparedLibraryProduct;
}

function bagastudioApplyPreparedProduct(options: any = {}) {
  if (!__bagastudioPreparedLibraryProduct) {
    const error = new Error("No prepared BagaStudio product available");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-loader-apply-error", {
        detail: error,
      })
    );

    throw error;
  }

  const prepared = __bagastudioPreparedLibraryProduct;

  __bagastudioLastSavedPackage = prepared.fullPackage || null;
  (window as any).bagastudioProductPackage = prepared.productPackage || null;
  (window as any).bagastudioAdminMapping = prepared.adminMapping || null;
  (window as any).bagastudioLastImporterReport = prepared.importerReport || null;
  (window as any).__bagastudioLastProductThumbnail = prepared.thumbnail || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = prepared.libraryItem || null;

  const safeApply = (window as any).bagastudioSafeApplyImporterState;
  if (options?.safeApply && typeof safeApply === "function") {
    try {
      safeApply();
    } catch (error) {
      console.warn("BagaStudio Product Loader safe apply skipped", error);
    }
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-applied", {
      detail: prepared,
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-ui-state-refresh", {
      detail: prepared,
    })
  );

  return prepared;
}

function bagastudioGetPreparedProduct() {
  return __bagastudioPreparedLibraryProduct;
}

if (typeof window !== "undefined") {
    prepareImporterUiBridge(root);
    window.dispatchEvent(
      new CustomEvent("bagastudio:product-package-applied", {
        detail: {
          productPackage,
          componentCount: productPackage.components.length,
        },
      })
    );
  }

  return productPackage.components;
}

function analyzeImportedModelComponents(root: THREE.Object3D, format?: string) {
  const components: BagaStudioRuntimeComponent[] = [];
  const usedIds = new Map<string, number>();

  type MeshEntry = {
    mesh: THREE.Mesh;
    originalName: string;
    parentName: string;
    grandParentName: string;
    text: string;
    normalizedText: string;
    box: THREE.Box3;
    size: THREE.Vector3;
    isStrongAccessory: boolean;
  };

  const normalizeAccessoryText = (value: string) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const hasAccessoryKeyword = (text: string) =>
    text.includes("maniglia") ||
    text.includes("handle") ||
    text.includes("pomello") ||
    text.includes("knob") ||
    text.includes("pull") ||
    text.includes("grip") ||
    text.includes("accessorio") ||
    text.includes("accessory");

  const hasHardwareKeyword = (text: string) =>
    hasAccessoryKeyword(text) ||
    text.includes("ferramenta") ||
    text.includes("hardware") ||
    text.includes("ironware");

  const isPanelLike = (text: string) =>
    text.includes("fianco") ||
    text.includes("side") ||
    text.includes("schiena") ||
    text.includes("back") ||
    text.includes("fondo") ||
    text.includes("bottom") ||
    text.includes("cielo") ||
    text.includes("top") ||
    text.includes("ripiano") ||
    text.includes("shelf") ||
    text.includes("anta") ||
    text.includes("door") ||
    text.includes("zoccolo") ||
    text.includes("plinth") ||
    text.includes("kickboard") ||
    text.includes("pannello") ||
    text.includes("panel");

  const isTechnicalRuntimeMesh = (text: string) =>
    /(^|_)edge_definition($|_)/.test(text) ||
    /(^|_)helper($|_)/.test(text) ||
    /(^|_)guide($|_)/.test(text) ||
    /(^|_)debug($|_)/.test(text) ||
    /(^|_)wire($|_)/.test(text) ||
    /(^|_)bounds?($|_)/.test(text) ||
    /(^|_)bounding_box($|_)/.test(text) ||
    /(^|_)collision_proxy($|_)/.test(text) ||
    /(^|_)outline($|_)/.test(text) ||
    /(^|_)contour($|_)/.test(text) ||
    /(^|_)contorno($|_)/.test(text);

  const inferRuntimeCategory = (text: string) => {
    if (hasAccessoryKeyword(text)) return "accessory";
    if (
      text.includes("cerniera") ||
      text.includes("hinge") ||
      text.includes("basetta") ||
      text.includes("cabineo") ||
      text.includes("vite") ||
      text.includes("screw") ||
      text.includes("ferramenta") ||
      text.includes("hardware") ||
      text.includes("ironware")
    ) {
      return "hardware";
    }
    if (isPanelLike(text)) return "panel";
    return "component";
  };



  const buildAccessoryDisplayName = (clusterEntries: MeshEntry[], accessoryIndex: number) => {
    const combined = normalizeAccessoryText(
      clusterEntries
        .flatMap((entry) => [entry.originalName, entry.parentName, entry.grandParentName, entry.text])
        .filter(Boolean)
        .join(" ")
    );

    if (combined.includes("portaphon") || combined.includes("porta_phon") || combined.includes("phon")) return "Portaphon";
    if (combined.includes("presa") || combined.includes("socket") || combined.includes("outlet")) return "Presa";
    if (combined.includes("led") || combined.includes("strip") || combined.includes("light")) return "LED";
    if (combined.includes("rubinetto") || combined.includes("tap") || combined.includes("faucet")) return "Rubinetto";
    if (combined.includes("lavabo") || combined.includes("lavandino") || combined.includes("sink")) return "Lavabo";
    if (combined.includes("pomello") || combined.includes("knob")) return "Pomello";
    if (
      combined.includes("maniglia") ||
      combined.includes("handle") ||
      combined.includes("pull") ||
      combined.includes("grip") ||
      combined.includes("cerchio") ||
      combined.includes("cilindro") ||
      combined.includes("cylinder") ||
      combined.includes("accessorio") ||
      combined.includes("accessory")
    ) {
      return "Maniglia";
    }

    return `Accessorio ${accessoryIndex}`;
  };

  const rootBox = new THREE.Box3().setFromObject(root);
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const rootMax = Math.max(rootSize.x, rootSize.y, rootSize.z, 1);
  const joinTolerance = Math.max(rootMax * 0.035, 0.01);
  const maxAccessoryDimension = rootMax * 0.45;

  const entries: MeshEntry[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    if ((mesh.userData as any)?.bagastudioImportedSafeLed) return;
    if ((mesh.userData as any)?.bagastudioAccessory === true) return;
    if ((mesh.userData as any)?.bagastudioInsert === true) return;

    const originalName = String(mesh.name || "").trim();
    const parentName = String(mesh.parent?.name || "").trim();
    const grandParentName = String(mesh.parent?.parent?.name || "").trim();
    const text = [
      originalName,
      parentName,
      grandParentName,
      String(mesh.userData?.bagastudioOriginalName || ""),
      String(mesh.userData?.bagastudioParentName || ""),
      String(mesh.userData?.bagastudioRuntimeKind || ""),
    ].filter(Boolean).join(" ");
    const normalizedText = normalizeAccessoryText(text);

    // Runtime Cleanup V1:
    // Some imported DAE/Product Package files contain helper meshes such as
    // *_edge_definition. They are useful as visual/technical overlays, but they
    // must not become selectable components, BOM rows, or property-panel items.
    if (isTechnicalRuntimeMesh(normalizedText)) {
      mesh.visible = false;
      mesh.userData.bagastudioRuntimeComponent = false;
      mesh.userData.bagastudioSelectable = false;
      mesh.userData.bagastudioIgnoreRaycast = true;
      mesh.userData.bagastudioTechnicalHelper = true;
      mesh.raycast = () => null;
      return;
    }

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const runtimeKind = String(mesh.userData?.bagastudioRuntimeKind || "").toLowerCase();
    const isStrongAccessory =
      hasAccessoryKeyword(normalizedText) ||
      ((runtimeKind === "hardware" || hasHardwareKeyword(normalizedText)) && !isPanelLike(normalizedText) && maxDimension <= maxAccessoryDimension);

    entries.push({
      mesh,
      originalName,
      parentName,
      grandParentName,
      text,
      normalizedText,
      box,
      size,
      isStrongAccessory,
    });
  });

  const accessoryEntryIndexes = new Set<number>();
  const strongIndexes = entries
    .map((entry, index) => (entry.isStrongAccessory ? index : -1))
    .filter((index) => index >= 0);

  strongIndexes.forEach((index) => accessoryEntryIndexes.add(index));

  // Accessory Grouping V2:
  // A Spazio3D/DAE handle can arrive as 3 meshes: front cylinder + 2 supports.
  // Some supports may have generic names and therefore V1 could still leave them separated.
  // Here we absorb small nearby meshes into the same accessory cluster, without touching big panels/doors.
  strongIndexes.forEach((seedIndex) => {
    const seed = entries[seedIndex];
    const expandedSeedBox = seed.box.clone().expandByScalar(joinTolerance);

    entries.forEach((entry, index) => {
      if (accessoryEntryIndexes.has(index)) return;
      if (isPanelLike(entry.normalizedText)) return;

      const maxDimension = Math.max(entry.size.x, entry.size.y, entry.size.z);
      if (maxDimension > maxAccessoryDimension) return;

      const expandedEntryBox = entry.box.clone().expandByScalar(joinTolerance);
      if (expandedSeedBox.intersectsBox(expandedEntryBox)) {
        accessoryEntryIndexes.add(index);
      }
    });
  });

  const accessoryIndexes = Array.from(accessoryEntryIndexes).sort((a, b) => a - b);
  const parent = new Map<number, number>();
  accessoryIndexes.forEach((index) => parent.set(index, index));

  const find = (index: number): number => {
    const current = parent.get(index) ?? index;
    if (current === index) return index;
    const rootIndex = find(current);
    parent.set(index, rootIndex);
    return rootIndex;
  };

  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  for (let i = 0; i < accessoryIndexes.length; i += 1) {
    for (let j = i + 1; j < accessoryIndexes.length; j += 1) {
      const indexA = accessoryIndexes[i];
      const indexB = accessoryIndexes[j];
      const boxA = entries[indexA].box.clone().expandByScalar(joinTolerance);
      const boxB = entries[indexB].box.clone().expandByScalar(joinTolerance);
      if (boxA.intersectsBox(boxB)) union(indexA, indexB);
    }
  }

  const accessoryClusters = new Map<number, number[]>();
  accessoryIndexes.forEach((index) => {
    const rootIndex = find(index);
    const cluster = accessoryClusters.get(rootIndex) || [];
    cluster.push(index);
    accessoryClusters.set(rootIndex, cluster);
  });

  const accessoryComponentByIndex = new Map<number, BagaStudioRuntimeComponent>();
  let accessoryCounter = 0;

  accessoryClusters.forEach((clusterIndexes) => {
    accessoryCounter += 1;
    const firstEntry = entries[clusterIndexes[0]];
    const clusterBox = new THREE.Box3();
    clusterIndexes.forEach((index) => clusterBox.union(entries[index].box));
    const clusterSize = clusterBox.getSize(new THREE.Vector3());
    const clusterEntries = clusterIndexes.map((index) => entries[index]);
    const seedName = buildAccessoryDisplayName(clusterEntries, accessoryCounter);
    const baseId = sanitizeComponentId(`accessorio_${seedName}`, components.length + 1);
    const currentCount = usedIds.get(baseId) || 0;
    usedIds.set(baseId, currentCount + 1);
    const id = currentCount === 0 ? baseId : `${baseId}_${String(currentCount + 1).padStart(2, "0")}`;

    const component: BagaStudioRuntimeComponent = {
      id,
      index: components.length + 1,
      meshName: id,
      originalName: seedName,
      displayName: seedName,
      materialGroup: "accessory",
      category: "accessory",
      componentType: "accessory",
      tags: ["accessory"],
      supportsMaterial: true,
      supportsLED: false,
      supportsInsert: false,
      bounds: {
        width: Number(clusterSize.x.toFixed(4)),
        height: Number(clusterSize.y.toFixed(4)),
        depth: Number(clusterSize.z.toFixed(4)),
      },
    };

    components.push(component);

    clusterIndexes.forEach((index) => {
      const mesh = entries[index].mesh;
      mesh.userData.bagastudioPartId = component.id;
      mesh.userData.bagastudioMeshName = component.meshName;
      mesh.userData.bagastudioOriginalName = entries[index].originalName || component.originalName;
      mesh.userData.bagastudioDisplayName = component.displayName;
      mesh.userData.bagastudioRuntimeComponent = component;
      mesh.userData.bagastudioAccessoryGroupId = component.id;
      mesh.userData.bagastudioRuntimeKind = "accessory";
      accessoryComponentByIndex.set(index, component);
    });
  });

  entries.forEach((entry, entryIndex) => {
    if (accessoryComponentByIndex.has(entryIndex)) return;

    const mesh = entry.mesh;
    const index = components.length + 1;
    const originalName = entry.originalName;
    const baseId = sanitizeComponentId(originalName, index);
    const currentCount = usedIds.get(baseId) || 0;
    usedIds.set(baseId, currentCount + 1);

    const id = currentCount === 0
      ? baseId
      : `${baseId}_${String(currentCount + 1).padStart(2, "0")}`;

    if (!mesh.name || mesh.name.trim() === "" || mesh.name !== id) {
      mesh.name = id;
    }

    const inferredCategory = inferRuntimeCategory(entry.normalizedText);

    const component: BagaStudioRuntimeComponent = {
      id,
      index,
      meshName: mesh.name,
      originalName,
      displayName: buildFriendlyComponentName(originalName || id, index),
      materialGroup: inferredCategory === "hardware" ? "hardware" : inferredCategory === "panel" ? "panel" : "default",
      category: inferredCategory,
      componentType: inferredCategory,
      tags: [inferredCategory],
      supportsMaterial: true,
      supportsLED: true,
      supportsInsert: true,
      bounds: {
        width: Number(entry.size.x.toFixed(4)),
        height: Number(entry.size.y.toFixed(4)),
        depth: Number(entry.size.z.toFixed(4)),
      },
    };

    mesh.userData.bagastudioPartId = component.id;
    mesh.userData.bagastudioMeshName = component.meshName;
    mesh.userData.bagastudioOriginalName = component.originalName;
    mesh.userData.bagastudioDisplayName = component.displayName;
    mesh.userData.bagastudioRuntimeComponent = component;

    components.push(component);
  });

  root.userData.bagastudioImporterFormat = format || "unknown";
  root.userData.bagastudioRuntimeComponents = components;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-components-analyzed", {
        detail: {
          format: format || "unknown",
          count: components.length,
          components,
        },
      })
    );
  }

  return components;
}

function prepareImportedModelGlbExporter(root: THREE.Object3D, format?: string) {
  root.userData.bagastudioCanExportGlb = true;
  root.userData.bagastudioExportSourceFormat = format || "unknown";

  if (typeof window === "undefined") return;

  const cleanFormat = String(format || "model").toLowerCase();
  const filename = `bagastudio-import-${cleanFormat}-clean.glb`;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    bagastudioExportLastImportAsGLB?: () => void;
    bagastudioDownloadLastImportAsGLB?: () => void;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;
  prepareImporterUiBridge(root);

  bagastudioWindow.bagastudioExportLastImportAsGLB = () => {
    exportImportedModelAsGLB(root, filename, false);
  };

  bagastudioWindow.bagastudioDownloadLastImportAsGLB = () => {
    exportImportedModelAsGLB(root, filename, true);
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-glb-exporter-ready", {
      detail: {
        format: format || "unknown",
        filename,
        canExportGlb: true,
        canDownloadGlb: true,
      },
    })
  );
}

function downloadGeneratedGlb(url: string, filename: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadJsonFile(url: string, filename: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function prepareImporterUiBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetImporterUiState?: () => {
      hasImportedModel: boolean;
      hasProductPackage: boolean;
      hasAdminMapping: boolean;
      hasImporterReport: boolean;
      sourceFormat?: string;
      componentCount: number;
      status: "idle" | "ready" | "warning" | "error";
      canDownloadGlb: boolean;
      canDownloadProductPackage: boolean;
      canDownloadAdminMapping: boolean;
      canDownloadImporterReport: boolean;
      canDownloadCompletePackage: boolean;
      productPackage?: BagaStudioProductPackage;
      adminMapping?: BagaStudioAdminMappingPackage;
      importerReport?: BagaStudioImporterReport;
    };
    bagastudioRefreshImporterUiState?: () => void;
    bagastudioDownloadImporterCompletePackage?: () => void;
    bagastudioDownloadImporterJsonBundle?: () => void;
    bagastudioDownloadLastImportAsGLB?: () => void;
  };

  bagastudioWindow.__bagastudioLastImportedRoot = root;

  const buildUiState = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const components = (root.userData?.bagastudioRuntimeComponents || productPackage?.components || []) as BagaStudioRuntimeComponent[];
    const status = importerReport?.status || (components.length > 0 ? "ready" : "idle");

    return {
      hasImportedModel: true,
      hasProductPackage: Boolean(productPackage),
      hasAdminMapping: Boolean(adminMapping),
      hasImporterReport: Boolean(importerReport),
      sourceFormat: String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || "unknown"),
      componentCount: components.length,
      status,
      canDownloadGlb: Boolean(root.userData?.bagastudioCanExportGlb),
      canDownloadProductPackage: Boolean(productPackage),
      canDownloadAdminMapping: Boolean(adminMapping),
      canDownloadImporterReport: Boolean(importerReport),
      canDownloadCompletePackage: Boolean(productPackage || adminMapping || importerReport || root.userData?.bagastudioCanExportGlb),
      productPackage,
      adminMapping,
      importerReport,
    };
  };

  bagastudioWindow.bagastudioGetImporterUiState = buildUiState;

  bagastudioWindow.bagastudioRefreshImporterUiState = () => {
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-ui-state", {
        detail: buildUiState(),
      })
    );
  };

  bagastudioWindow.bagastudioDownloadImporterJsonBundle = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || "model").toLowerCase();

    const bundle = {
      schema: "bagastudio.importer.bundle.v1",
      createdAt: new Date().toISOString(),
      sourceFormat,
      productPackage: productPackage || null,
      adminMapping: adminMapping || null,
      importerReport: importerReport || null,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadJsonFile(url, `bagastudio-importer-bundle-${sourceFormat}.json`);

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-json-bundle-downloaded", {
        detail: bundle,
      })
    );
  };

  bagastudioWindow.bagastudioDownloadImporterCompletePackage = () => {
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || "model").toLowerCase();

    if (typeof bagastudioWindow.bagastudioDownloadLastImportAsGLB === "function") {
      bagastudioWindow.bagastudioDownloadLastImportAsGLB();
    } else {
      exportImportedModelAsGLB(root, `bagastudio-import-clean-${sourceFormat}.glb`, true);
    }

    bagastudioWindow.bagastudioDownloadImporterJsonBundle?.();

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-complete-package-downloaded", {
        detail: bagastudioWindow.bagastudioGetImporterUiState?.(),
      })
    );
  };

  bagastudioWindow.bagastudioRefreshImporterUiState();
}

function getImporterScenePartIds(root: THREE.Object3D) {
  const partIds: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((mesh.userData as any)?.bagastudioImportedSafeLed) return;
    if ((mesh.userData as any)?.bagastudioAccessory === true) return;
    if ((mesh.userData as any)?.bagastudioInsert === true) return;

    const partId = String(mesh.userData?.bagastudioPartId || mesh.name || "").trim();
    if (!partId) return;

    if (seen.has(partId)) duplicates.push(partId);
    seen.add(partId);
    partIds.push(partId);
  });

  return { partIds, duplicates };
}

function buildImporterCompatibilityGuard(
  root: THREE.Object3D,
  productPackage?: BagaStudioProductPackage,
  adminMapping?: BagaStudioAdminMappingPackage
): BagaStudioCompatibilityGuardResult {
  const issues: BagaStudioValidationIssue[] = [];
  const sceneInfo = getImporterScenePartIds(root);
  const scenePartIds = new Set(sceneInfo.partIds);
  const packageComponents = Array.isArray(productPackage?.components) ? productPackage!.components : [];
  const packagePartIds = new Set(packageComponents.map((component) => String(component.id || "").trim()).filter(Boolean));
  const adminMappings = Array.isArray(adminMapping?.mappings) ? adminMapping!.mappings : [];
  const adminPartIds = new Set(adminMappings.map((entry) => String(entry.partId || "").trim()).filter(Boolean));

  const unmatchedPackagePartIds = [...packagePartIds].filter((partId) => !scenePartIds.has(partId));
  const unmatchedScenePartIds = [...scenePartIds].filter((partId) => packagePartIds.size > 0 && !packagePartIds.has(partId));
  const missingAdminMappingPartIds = [...packagePartIds].filter((partId) => adminPartIds.size > 0 && !adminPartIds.has(partId));

  sceneInfo.duplicates.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "duplicate_scene_part_id",
      message: `partId duplicato nella scena: ${partId}`,
      partId,
    });
  });

  unmatchedPackagePartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "package_part_not_found_in_scene",
      message: `Componente del Product Package non trovato nella scena: ${partId}`,
      partId,
    });
  });

  unmatchedScenePartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "scene_part_not_found_in_package",
      message: `Componente della scena non presente nel Product Package: ${partId}`,
      partId,
    });
  });

  missingAdminMappingPartIds.forEach((partId) => {
    issues.push({
      level: "warning",
      code: "missing_admin_mapping_entry",
      message: `Componente senza voce Admin Mapping: ${partId}`,
      partId,
    });
  });

  if (scenePartIds.size === 0) {
    issues.push({
      level: "error",
      code: "empty_scene_components",
      message: "Nessun componente configurabile trovato nella scena importata",
    });
  }

  if (productPackage && packageComponents.length === 0) {
    issues.push({
      level: "error",
      code: "empty_product_package_components",
      message: "Product Package senza componenti configurabili",
    });
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter((issue) => issue.level === "warning").length;
  const matchedComponentCount = [...packagePartIds].filter((partId) => scenePartIds.has(partId)).length;

  return {
    schema: "bagastudio.importerCompatibilityGuard.v1",
    checkedAt: new Date().toISOString(),
    status: errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "ready",
    canApply: errorCount === 0,
    sceneComponentCount: scenePartIds.size,
    packageComponentCount: packageComponents.length,
    adminMappingCount: adminMappings.length,
    matchedComponentCount,
    unmatchedPackagePartIds,
    unmatchedScenePartIds,
    missingAdminMappingPartIds,
    duplicateScenePartIds: sceneInfo.duplicates,
    issues,
  };
}

function prepareImporterCompatibilityGuardBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastCompatibilityGuard?: BagaStudioCompatibilityGuardResult;
    bagastudioCheckImporterCompatibility?: () => BagaStudioCompatibilityGuardResult;
    bagastudioGetLastImporterCompatibilityGuard?: () => BagaStudioCompatibilityGuardResult | undefined;
  };

  const runGuard = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    root.userData.bagastudioImporterCompatibilityGuard = compatibility;
    bagastudioWindow.__bagastudioLastCompatibilityGuard = compatibility;

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-compatibility-guard", {
        detail: compatibility,
      })
    );

    return compatibility;
  };

  bagastudioWindow.bagastudioCheckImporterCompatibility = runGuard;
  bagastudioWindow.bagastudioGetLastImporterCompatibilityGuard = () => bagastudioWindow.__bagastudioLastCompatibilityGuard;

  runGuard();
}



function getImporterSafeMeshes(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) meshes.push(mesh);
  });

  return meshes;
}

function cloneImporterSafeState(root: THREE.Object3D) {
  return {
    productPackage: root.userData?.bagastudioProductPackage,
    adminMapping: root.userData?.bagastudioAdminMapping,
    runtimeComponents: Array.isArray(root.userData?.bagastudioRuntimeComponents)
      ? JSON.parse(JSON.stringify(root.userData.bagastudioRuntimeComponents))
      : [],
    meshUserData: getImporterSafeMeshes(root).map((mesh) => ({
      uuid: mesh.uuid,
      name: mesh.name,
      userData: JSON.parse(JSON.stringify(mesh.userData || {})),
      visible: mesh.visible,
    })),
  };
}

function restoreImporterSafeState(root: THREE.Object3D, snapshot: ReturnType<typeof cloneImporterSafeState>) {
  root.userData.bagastudioProductPackage = snapshot.productPackage;
  root.userData.bagastudioAdminMapping = snapshot.adminMapping;
  root.userData.bagastudioRuntimeComponents = snapshot.runtimeComponents;

  const meshStateByUuid = new Map(snapshot.meshUserData.map((entry) => [entry.uuid, entry]));
  getImporterSafeMeshes(root).forEach((mesh) => {
    const saved = meshStateByUuid.get(mesh.uuid);
    if (!saved) return;
    mesh.name = saved.name;
    mesh.userData = saved.userData || {};
    mesh.visible = saved.visible;
  });
}

function prepareImporterSafeApplyBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const bagastudioWindow = window as Window & {
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastSafeApplySnapshot?: ReturnType<typeof cloneImporterSafeState>;
    __bagastudioLastSafeApplyResult?: BagaStudioSafeApplyResult;
    bagastudioSafeApplyLastProductPackage?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyLastAdminMapping?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioSafeApplyImporterState?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioRollbackLastImporterSafeApply?: () => BagaStudioSafeApplyResult | undefined;
    bagastudioGetLastImporterSafeApplyResult?: () => BagaStudioSafeApplyResult | undefined;
  };

  const emitResult = (result: BagaStudioSafeApplyResult) => {
    root.userData.bagastudioImporterSafeApplyResult = result;
    bagastudioWindow.__bagastudioLastSafeApplyResult = result;
    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-safe-apply", {
        detail: result,
      })
    );
    return result;
  };

  const blockedResult = (
    target: BagaStudioSafeApplyResult["target"],
    compatibility: BagaStudioCompatibilityGuardResult,
    message: string
  ): BagaStudioSafeApplyResult =>
    emitResult({
      schema: "bagastudio.importerSafeApply.v1",
      appliedAt: new Date().toISOString(),
      target,
      status: "blocked",
      compatibility,
      rollbackAvailable: Boolean(bagastudioWindow.__bagastudioLastSafeApplySnapshot),
      message,
    });

  const safeApply = (target: BagaStudioSafeApplyResult["target"]): BagaStudioSafeApplyResult | undefined => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    if (!compatibility.canApply) {
      return blockedResult(target, compatibility, "Applicazione bloccata: compatibilità importer non valida.");
    }

    const snapshot = cloneImporterSafeState(root);
    bagastudioWindow.__bagastudioLastSafeApplySnapshot = snapshot;

    try {
      if ((target === "productPackage" || target === "both") && productPackage) {
        applyProductPackageToImportedRoot(root, productPackage);
      }

      if ((target === "adminMapping" || target === "both") && adminMapping) {
        applyAdminMappingToImportedRoot(root, adminMapping);
      }

      const nextCompatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);
      prepareImporterUiBridge(root);

      return emitResult({
        schema: "bagastudio.importerSafeApply.v1",
        appliedAt: new Date().toISOString(),
        target,
        status: "applied",
        compatibility: nextCompatibility,
        rollbackAvailable: true,
        message: "Applicazione sicura completata.",
      });
    } catch (error) {
      restoreImporterSafeState(root, snapshot);
      const rollbackCompatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

      return emitResult({
        schema: "bagastudio.importerSafeApply.v1",
        appliedAt: new Date().toISOString(),
        target,
        status: "rolled_back",
        compatibility: rollbackCompatibility,
        rollbackAvailable: true,
        message: `Errore durante l'applicazione: ${error instanceof Error ? error.message : "errore sconosciuto"}. Rollback eseguito.`,
      });
    }
  };

  bagastudioWindow.bagastudioSafeApplyLastProductPackage = () => safeApply("productPackage");
  bagastudioWindow.bagastudioSafeApplyLastAdminMapping = () => safeApply("adminMapping");
  bagastudioWindow.bagastudioSafeApplyImporterState = () => safeApply("both");
  bagastudioWindow.bagastudioGetLastImporterSafeApplyResult = () => bagastudioWindow.__bagastudioLastSafeApplyResult;
  bagastudioWindow.bagastudioRollbackLastImporterSafeApply = () => {
    const snapshot = bagastudioWindow.__bagastudioLastSafeApplySnapshot;
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const compatibility = buildImporterCompatibilityGuard(root, productPackage, adminMapping);

    if (!snapshot) {
      return blockedResult("both", compatibility, "Rollback non disponibile: nessuno snapshot precedente trovato.");
    }

    restoreImporterSafeState(root, snapshot);
    prepareImporterUiBridge(root);

    return emitResult({
      schema: "bagastudio.importerSafeApply.v1",
      appliedAt: new Date().toISOString(),
      target: "both",
      status: "rolled_back",
      compatibility: buildImporterCompatibilityGuard(root, productPackage, adminMapping),
      rollbackAvailable: false,
      message: "Rollback importer eseguito correttamente.",
    });
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-safe-apply-ready", {
      detail: {
        safeApplyProductPackage: true,
        safeApplyAdminMapping: true,
        safeApplyImporterState: true,
        rollback: true,
      },
    })
  );
}

function prepareImporterHistoryBridge(root: THREE.Object3D) {
  if (typeof window === "undefined") return;

  const storageKey = "bagastudio.importer.history.v1";
  const bagastudioWindow = window as Window & {
    __bagastudioLastImportedRoot?: THREE.Object3D;
    __bagastudioLastProductPackage?: BagaStudioProductPackage;
    __bagastudioLastAdminMapping?: BagaStudioAdminMappingPackage;
    __bagastudioLastImporterReport?: BagaStudioImporterReport;
    bagastudioGetImporterHistory?: () => BagaStudioImporterHistoryEntry[];
    bagastudioSaveImporterHistorySnapshot?: () => BagaStudioImporterHistoryEntry | undefined;
    bagastudioRestoreImporterHistorySnapshot?: (idOrIndex: string | number) => BagaStudioImporterHistoryEntry | undefined;
    bagastudioClearImporterHistory?: () => void;
    bagastudioRefreshImporterUiState?: () => void;
  };

  const readHistory = (): BagaStudioImporterHistoryEntry[] => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("BagaStudio Importer: history read failed", error);
      return [];
    }
  };

  const writeHistory = (items: BagaStudioImporterHistoryEntry[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 10)));
    } catch (error) {
      console.warn("BagaStudio Importer: history save failed", error);
    }
  };

  bagastudioWindow.bagastudioGetImporterHistory = readHistory;

  bagastudioWindow.bagastudioSaveImporterHistorySnapshot = () => {
    const productPackage = bagastudioWindow.__bagastudioLastProductPackage || root.userData?.bagastudioProductPackage;
    const adminMapping = bagastudioWindow.__bagastudioLastAdminMapping || root.userData?.bagastudioAdminMapping;
    const importerReport = bagastudioWindow.__bagastudioLastImporterReport || root.userData?.bagastudioImporterReport;
    const sourceFormat = String(root.userData?.bagastudioImporterFormat || productPackage?.sourceFormat || importerReport?.sourceFormat || "unknown").toLowerCase();

    if (!productPackage && !adminMapping && !importerReport) return undefined;

    const entry: BagaStudioImporterHistoryEntry = {
      id: `import_${sourceFormat}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sourceFormat,
      status: importerReport?.status || "ready",
      componentCount: Number(importerReport?.summary?.componentCount || productPackage?.components?.length || 0),
      productPackage,
      adminMapping,
      importerReport,
    };

    const current = readHistory().filter((item) => item.id !== entry.id);
    writeHistory([entry, ...current]);

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-history-saved", {
        detail: entry,
      })
    );

    return entry;
  };

  bagastudioWindow.bagastudioRestoreImporterHistorySnapshot = (idOrIndex: string | number) => {
    const history = readHistory();
    const entry = typeof idOrIndex === "number"
      ? history[idOrIndex]
      : history.find((item) => item.id === idOrIndex);

    if (!entry) return undefined;

    if (entry.productPackage) {
      root.userData.bagastudioProductPackage = entry.productPackage;
      bagastudioWindow.__bagastudioLastProductPackage = entry.productPackage;
    }

    if (entry.adminMapping) {
      root.userData.bagastudioAdminMapping = entry.adminMapping;
      bagastudioWindow.__bagastudioLastAdminMapping = entry.adminMapping;
    }

    if (entry.importerReport) {
      root.userData.bagastudioImporterReport = entry.importerReport;
      bagastudioWindow.__bagastudioLastImporterReport = entry.importerReport;
    }

    bagastudioWindow.__bagastudioLastImportedRoot = root;
    bagastudioWindow.bagastudioRefreshImporterUiState?.();

    window.dispatchEvent(
      new CustomEvent("bagastudio:importer-history-restored", {
        detail: entry,
      })
    );

    return entry;
  };

  bagastudioWindow.bagastudioClearImporterHistory = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("BagaStudio Importer: history clear failed", error);
    }

    window.dispatchEvent(new CustomEvent("bagastudio:importer-history-cleared"));
  };

  const snapshot = bagastudioWindow.bagastudioSaveImporterHistorySnapshot?.();

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-history-ready", {
      detail: {
        latest: snapshot,
        history: readHistory(),
      },
    })
  );
}

function exportImportedModelAsGLB(root: THREE.Object3D, filename = "bagastudio-import-clean.glb", autoDownload = false) {
  if (typeof window === "undefined") return;

  const exporter = new GLTFExporter();
  const exportRoot = root.clone(true);

  exportRoot.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.userData = {
      ...mesh.userData,
      bagastudioExportedFromImporter: true,
    };
  });

  exporter.parse(
    exportRoot,
    (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: "model/gltf-binary" })
        : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });

      const url = URL.createObjectURL(blob);

      if (autoDownload) {
        downloadGeneratedGlb(url, filename);
      }

      window.dispatchEvent(
        new CustomEvent("bagastudio:importer-glb-ready", {
          detail: {
            filename,
            blob,
            url,
            sizeBytes: blob.size,
            autoDownload,
          },
        })
      );
    },
    (error) => {
      console.error("BagaStudio Importer: GLB export failed", error);
      window.dispatchEvent(
        new CustomEvent("bagastudio:importer-glb-error", {
          detail: { error, filename },
        })
      );
    },
    {
      binary: true,
      onlyVisible: false,
      truncateDrawRange: true,
    }
  );
}

function buildObjectFromGeometry(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: "#d8d8d8",
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "STL_Mesh";
  const group = new THREE.Group();
  group.name = "Imported_STL";
  group.add(mesh);
  return group;
}

function isImportedModelFormat(format?: string) {
  return ["obj", "fbx", "stl", "dae"].includes(String(format || "").toLowerCase());
}

function createImportedModelSafeLedBar(
  mesh: THREE.Mesh,
  color: string,
  config: {
    frontOffset?: number;
    sideMargin?: number;
    yOffset?: number;
    position?: string;
    intensity?: number;
  }
) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const position = String(config.position || "front").toLowerCase();
  const margin = Number(config.sideMargin ?? 8) / 100;
  const frontOffset = Number(config.frontOffset ?? 2) / 100;
  const yOffset = Number(config.yOffset ?? -2) / 100;

  const safeWidth = Math.max(size.x * Math.max(0.15, 1 - margin), 0.08);
  const safeDepth = Math.max(size.z * Math.max(0.15, 1 - margin), 0.08);
  const safeHeight = Math.max(size.y, 0.08);

  let geometry: THREE.BoxGeometry;
  const ledPosition = center.clone();

  if (position.includes("left") || position.includes("right")) {
    geometry = new THREE.BoxGeometry(0.035, Math.max(safeHeight * 0.9, 0.12), 0.035);
    ledPosition.x += position.includes("left")
      ? -size.x / 2 - frontOffset
      : size.x / 2 + frontOffset;
    ledPosition.y += yOffset;
  } else if (position.includes("back")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, 0.035);
    ledPosition.z -= size.z / 2 + frontOffset;
    ledPosition.y += yOffset;
  } else if (position.includes("top")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, Math.max(safeDepth * 0.08, 0.035));
    ledPosition.y += size.y / 2 + frontOffset;
  } else if (position.includes("bottom") || position.includes("under")) {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, Math.max(safeDepth * 0.08, 0.035));
    ledPosition.y -= size.y / 2 + frontOffset;
  } else {
    geometry = new THREE.BoxGeometry(safeWidth, 0.035, 0.035);
    ledPosition.z += size.z / 2 + frontOffset;
    ledPosition.y += yOffset;
  }

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(1, Math.max(0.35, Number(config.intensity ?? 1) * 0.55)),
    toneMapped: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const led = new THREE.Mesh(geometry, material);
  led.name = `LED_${mesh.name}`;
  led.position.copy(ledPosition);
  led.renderOrder = 20;
  led.frustumCulled = false;
  led.userData.bagastudioImportedSafeLed = true;

  return led;
}


function buildBagastudioSpazio3DColladaRuntimeRootFromText(daeText: string, fileName = "Spazio3D.dae") {
  try {
    if (typeof DOMParser === "undefined") return null;

    const documentXml = new DOMParser().parseFromString(daeText, "application/xml");
    if (documentXml.querySelector("parsererror")) return null;

    const parseNumbers = (value: string | null | undefined) =>
      String(value || "")
        .trim()
        .split(/\s+/)
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));

    const localName = (element: Element | null | undefined) => element?.localName || "";
    const childElements = (element: Element | null | undefined, name?: string) =>
      Array.from(element?.children || []).filter((child) => !name || localName(child) === name) as Element[];
    const firstChild = (element: Element | null | undefined, name: string) =>
      childElements(element, name)[0] || null;
    const cleanRef = (value: string | null | undefined) => String(value || "").replace(/^#/, "");

    const material = () =>
      new THREE.MeshStandardMaterial({
        color: "#d8d3ca",
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
      });

    const geometryById = new Map<string, THREE.BufferGeometry>();
    const geometryNameById = new Map<string, string>();

    documentXml.querySelectorAll("geometry").forEach((geometryElement) => {
      const geometryId = geometryElement.getAttribute("id") || "";
      if (!geometryId) return;

      const meshElement = firstChild(geometryElement, "mesh");
      if (!meshElement) return;

      const sources = new Map<string, number[]>();
      childElements(meshElement, "source").forEach((sourceElement) => {
        const sourceId = sourceElement.getAttribute("id") || "";
        const floatArray = firstChild(sourceElement, "float_array");
        if (sourceId && floatArray?.textContent) {
          sources.set(sourceId, parseNumbers(floatArray.textContent));
        }
      });

      const verticesMap = new Map<string, string>();
      childElements(meshElement, "vertices").forEach((verticesElement) => {
        const verticesId = verticesElement.getAttribute("id") || "";
        const positionInput = childElements(verticesElement, "input").find(
          (input) => input.getAttribute("semantic") === "POSITION"
        );
        if (verticesId && positionInput) verticesMap.set(verticesId, cleanRef(positionInput.getAttribute("source")));
      });

      const primitiveElement = firstChild(meshElement, "polylist") || firstChild(meshElement, "triangles");
      if (!primitiveElement) return;

      const inputs = childElements(primitiveElement, "input").map((input) => ({
        semantic: input.getAttribute("semantic") || "",
        source: cleanRef(input.getAttribute("source")),
        offset: Number(input.getAttribute("offset") || 0),
      }));

      const vertexInput = inputs.find((input) => input.semantic === "VERTEX") || inputs.find((input) => input.semantic === "POSITION");
      if (!vertexInput) return;

      const positionSourceId = vertexInput.semantic === "VERTEX" ? verticesMap.get(vertexInput.source) : vertexInput.source;
      const positionValues = positionSourceId ? sources.get(positionSourceId) : null;
      if (!positionValues || positionValues.length < 9) return;

      const stride = Math.max(...inputs.map((input) => input.offset)) + 1;
      const indices = parseNumbers(firstChild(primitiveElement, "p")?.textContent || "").map((item) => Math.trunc(item));
      const vcount = localName(primitiveElement) === "triangles"
        ? new Array(Number(primitiveElement.getAttribute("count") || 0)).fill(3)
        : parseNumbers(firstChild(primitiveElement, "vcount")?.textContent || "").map((item) => Math.trunc(item));

      const positions: number[] = [];
      let cursor = 0;

      vcount.forEach((polygonSize) => {
        const polygonVertices: number[][] = [];

        for (let i = 0; i < polygonSize; i += 1) {
          const vertexIndex = indices[cursor + vertexInput.offset];
          const base = vertexIndex * 3;
          polygonVertices.push([
            positionValues[base] || 0,
            positionValues[base + 1] || 0,
            positionValues[base + 2] || 0,
          ]);
          cursor += stride;
        }

        for (let i = 1; i < polygonVertices.length - 1; i += 1) {
          positions.push(...polygonVertices[0], ...polygonVertices[i], ...polygonVertices[i + 1]);
        }
      });

      if (positions.length < 9) return;

      const bufferGeometry = new THREE.BufferGeometry();
      bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      bufferGeometry.computeVertexNormals();
      bufferGeometry.computeBoundingBox();
      bufferGeometry.computeBoundingSphere();

      geometryById.set(geometryId, bufferGeometry);
      geometryNameById.set(geometryId, geometryElement.getAttribute("name") || geometryId);
    });

    if (geometryById.size === 0) return null;

    const libraryNodes = new Map<string, Element>();
    const libraryNodesElement = documentXml.querySelector("library_nodes");
    childElements(libraryNodesElement, "node").forEach((nodeElement) => {
      const nodeId = nodeElement.getAttribute("id") || "";
      if (nodeId) libraryNodes.set(nodeId, nodeElement);
    });

    const applyMatrix = (object: THREE.Object3D, nodeElement: Element) => {
      const matrixValues = parseNumbers(firstChild(nodeElement, "matrix")?.textContent || "");
      if (matrixValues.length === 16) {
        const matrix = new THREE.Matrix4();
        matrix.set(
          matrixValues[0], matrixValues[1], matrixValues[2], matrixValues[3],
          matrixValues[4], matrixValues[5], matrixValues[6], matrixValues[7],
          matrixValues[8], matrixValues[9], matrixValues[10], matrixValues[11],
          matrixValues[12], matrixValues[13], matrixValues[14], matrixValues[15]
        );
        object.matrix.copy(matrix);
        object.matrixAutoUpdate = false;
      }
    };

    const buildNode = (nodeElement: Element): THREE.Object3D => {
      const group = new THREE.Group();
      group.name = nodeElement.getAttribute("name") || nodeElement.getAttribute("id") || "dae_node";
      applyMatrix(group, nodeElement);

      childElements(nodeElement).forEach((child) => {
        if (localName(child) === "node") {
          group.add(buildNode(child));
          return;
        }

        if (localName(child) === "instance_node") {
          const target = libraryNodes.get(cleanRef(child.getAttribute("url")));
          if (target) group.add(buildNode(target));
          return;
        }

        if (localName(child) === "instance_geometry") {
          const geometryId = cleanRef(child.getAttribute("url"));
          const sourceGeometry = geometryById.get(geometryId);
          if (!sourceGeometry) return;

          const mesh = new THREE.Mesh(sourceGeometry.clone(), material());
          mesh.name = group.name || geometryNameById.get(geometryId) || geometryId;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          mesh.visible = true;
          mesh.userData = {
            ...mesh.userData,
            bagastudioImportedFormat: "dae",
            bagastudioSourceType: "spazio3d-manual-collada-parser",
            bagastudioSelectable: true,
            bagastudioRuntimeComponent: true,
            bagastudioOriginalName: mesh.name,
            bagastudioParentName: group.name,
          };
          group.add(mesh);
        }
      });

      return group;
    };

    const root = new THREE.Group();
    root.name = fileName.replace(/\.[^/.]+$/, "") || "Spazio3D_DAE";
    root.userData = {
      bagastudioImportedFormat: "dae",
      bagastudioSourceType: "spazio3d-manual-collada-parser",
      bagastudioPreserveHierarchy: true,
    };

    const visualScene = documentXml.querySelector("library_visual_scenes visual_scene");
    childElements(visualScene).forEach((child) => {
      if (localName(child) === "node") {
        const group = new THREE.Group();
        group.name = child.getAttribute("name") || child.getAttribute("id") || "Scene";
        applyMatrix(group, child);
        childElements(child).forEach((sceneChild) => {
          if (localName(sceneChild) === "instance_node") {
            const target = libraryNodes.get(cleanRef(sceneChild.getAttribute("url")));
            if (target) group.add(buildNode(target));
          } else if (localName(sceneChild) === "node") {
            group.add(buildNode(sceneChild));
          }
        });
        root.add(group.children.length ? group : buildNode(child));
      }
    });

    if (root.children.length === 0) {
      libraryNodes.forEach((node) => root.add(buildNode(node)));
    }

    let meshCount = 0;
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      meshCount += 1;
    });

    if (meshCount === 0) return null;
    root.updateMatrixWorld(true);
    return root;
  } catch (error) {
    console.warn("BagaStudio Spazio3D DAE manual parser failed", error);
    return null;
  }
}


function ensureBagastudioModelEdgeDefinition(root: THREE.Object3D | null, format?: string | null) {
  if (!root || !isImportedModelFormat(format ?? undefined)) return;

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (mesh.userData?.bagastudioEdgeOverlay) return;

    const existing = mesh.children.find((item) => item.userData?.bagastudioEdgeOverlay);
    if (existing) return;

    // Edge Smart V35: contorni più puliti e meno invasivi.
    // I DAE Spazio3D sono spesso triangolati: soglie basse mostrano diagonali/ventagli
    // interni che sembrano errori grafici. Con 82 gradi restano solo gli spigoli più
    // importanti e l'overlay diventa più simile a una linea tecnica premium.
    const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, 82);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#64748b"),
      transparent: true,
      opacity: 0.26,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    });

    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.name = `${mesh.name || "bagastudio_part"}_edge_definition`;
    edges.renderOrder = 8;
    edges.userData = {
      bagastudioEdgeOverlay: true,
      bagastudioSelectable: false,
      bagastudioRuntimeComponent: false,
      bagastudioIgnoreRaycast: true,
    };
    edges.raycast = () => null;
    mesh.add(edges);
  });
}

function setBagastudioModelEdgeDefinitionVisible(root: THREE.Object3D | null, visible: boolean) {
  if (!root) return;

  root.traverse((child) => {
    if (child.userData?.bagastudioEdgeOverlay) {
      child.visible = visible;
    }
  });
}


// Room Environment extracted to components/viewer/RoomEnvironment.tsx (V40.3).

function ProductModel({
  width,
  height,
  depth,
  materials = {},
  productMaterials = [],
  accessories = {},
  inserts = {},
  insertMaterials = {},
  insertSizes = {},
  visibility = {},
  ledKelvin = {},
  ledIntensity = {},
  productModel,
  productModelFormat,
  importedModelName,
  activeViewId,
  views = [],
  productParts = [],
  woodDirection,
  xRayEnabled = false,
  xRayOpacity = 0.35,
  onToggleXRay,
  onChangeXRayOpacity,
  modelEdgesEnabled = true,
  environment,
  importCalibration = DEFAULT_IMPORT_CALIBRATION,
  modelSceneOffset = { x: 0, z: 0, rotationYDeg: 0 },
  sceneModules = [],
  activeSceneModuleId,
  activeSceneModuleStatus,
  onSelectSceneModule,
}: Viewer3DProps) {
  const materialsSource =
  productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;

  const [loadedRoot, setLoadedRoot] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const runtimeModelFormat = useMemo(
    () => inferModelFormat(productModel, productModelFormat),
    [productModel, productModelFormat]
  );

  const useImportedSafeLed = isImportedModelFormat(runtimeModelFormat);

  const materialRefreshKey = useMemo(
    () =>
      JSON.stringify({
        materials,
        insertMaterials,
        inserts,
        woodDirection,
      }),
    [materials, insertMaterials, inserts, woodDirection]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadedRoot(null);
    setLoadError(null);

    const modelUrl = String(productModel || "").trim();
    const format = runtimeModelFormat;

    // Empty Room Start V54.1:
    // consente al Viewer 10583 di aprirsi senza import obbligatorio.
    // Se non esiste un modello importato, il loader 3D viene saltato e restano operative
    // stanza, moduli parametrici e Scene Composer.
    if (!modelUrl) {
      if (typeof window !== "undefined") {
        (window as any).__bagastudioViewerRuntimeComponents = [];
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-components-ready", {
            detail: {
              format: "empty-room",
              count: 0,
              components: [],
            },
          })
        );
      }

      return () => {
        cancelled = true;
      };
    }

    const onLoaded = (object: THREE.Object3D) => {
      if (cancelled) return;
      forcePreviewMaterials(object, format);
      if (modelEdgesEnabled) {
        ensureBagastudioModelEdgeDefinition(object, format);
      }
      setBagastudioModelEdgeDefinitionVisible(object, modelEdgesEnabled);
      const analyzedComponents = analyzeImportedModelComponents(object, format);

      if (typeof window !== "undefined") {
        (window as any).__bagastudioViewerRuntimeComponents = analyzedComponents;
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-components-ready", {
            detail: {
              format,
              count: analyzedComponents.length,
              components: analyzedComponents,
            },
          })
        );
      }

      prepareImportedProductPackage(object, format);
      prepareImportedModelGlbExporter(object, format);
      setLoadedRoot(object);
    };

    const onError = (error: unknown) => {
      console.error("BagaStudio Viewer: model load failed", { productModel, format, error });
      if (!cancelled) setLoadError(`Model load failed: ${format}`);
    };

    try {
      if (format === "stl") {
        new STLLoader().load(
          productModel,
          (geometry) => onLoaded(buildObjectFromGeometry(geometry)),
          undefined,
          onError
        );
      } else if (format === "obj") {
        new OBJLoader().load(productModel, onLoaded, undefined, onError);
      } else if (format === "fbx") {
        new FBXLoader().load(productModel, onLoaded, undefined, onError);
      } else if (format === "dae") {
        const loadWithColladaLoaderFallback = () => {
          new ColladaLoader().load(
            productModel,
            (collada) => {
              const daeScene = collada?.scene;

              if (!daeScene) {
                onError(new Error("DAE scene not found"));
                return;
              }

              const daeGroup = buildBagastudioColladaRuntimeRoot(daeScene);

              prepareBagastudioImportedObject(daeGroup, "dae");

              daeGroup.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (!mesh.isMesh) return;

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false;
                mesh.visible = true;

                if (!mesh.name || mesh.name.trim() === "") {
                  mesh.name = `part_${mesh.id}`;
                }

                mesh.userData = {
                  ...mesh.userData,
                  bagastudioImportedFormat: "dae",
                  bagastudioSelectable: true,
                  bagastudioRuntimeComponent: true,
                };

                if (!hasUsableMaterial(mesh.material) || materialLooksInvisible(mesh.material)) {
                  mesh.material = createBagastudioNeutralImportMaterial();
                }

                repairBagastudioImportedMeshGeometry(mesh);
                repairBagastudioImportedMaterial(mesh.material);
              });

              onLoaded(daeGroup);
            },
            undefined,
            onError
          );
        };

        fetch(productModel)
          .then((response) => response.text())
          .then((daeText) => {
            if (cancelled) return;
            const manualRoot = buildBagastudioSpazio3DColladaRuntimeRootFromText(daeText, String(productModel || "Nuovo.dae"));
            if (manualRoot) {
              prepareBagastudioImportedObject(manualRoot, "dae");
              onLoaded(manualRoot);
              return;
            }
            loadWithColladaLoaderFallback();
          })
          .catch(() => loadWithColladaLoaderFallback());
      } else {
        new GLTFLoader().load(productModel, (gltf) => onLoaded(gltf.scene), undefined, onError);
      }
    } catch (error) {
      onError(error);
    }

    return () => {
      cancelled = true;
    };
  }, [productModel, runtimeModelFormat]);

  useEffect(() => {
    if (!loadedRoot) return;
    if (modelEdgesEnabled) {
      ensureBagastudioModelEdgeDefinition(loadedRoot, runtimeModelFormat);
    }
    setBagastudioModelEdgeDefinitionVisible(loadedRoot, modelEdgesEnabled);
  }, [loadedRoot, runtimeModelFormat, modelEdgesEnabled]);

 const setSelectedPartId = useConfigStore(
  (state) => state.setSelectedPart
);
  const selectedPartId = useConfigStore(
(state) => state.selectedPartId
);
const lastSelectionWasMultiRef = useRef(false);
const multiSelectedPartIdsRef = useRef<Set<string>>(new Set());
const highlightedRef = useRef<{
  mesh: THREE.Mesh;
  material: THREE.Material | THREE.Material[];
  highlightMaterial?: THREE.Material | THREE.Material[];
} | null>(null);
const highlightedMeshMapRef = useRef<
  Map<
    string,
    {
      mesh: THREE.Mesh;
      material: THREE.Material | THREE.Material[];
      highlightMaterial?: THREE.Material | THREE.Material[];
    }
  >
>(new Map());

const cloneMaterialForRestore = (
  material: THREE.Material | THREE.Material[] | null | undefined
) => {
  if (Array.isArray(material)) {
    return material.filter(Boolean).map((mat) => mat.clone());
  }

  return material ? material.clone() : createBagastudioNeutralImportMaterial();
};

const restoreHighlightedMesh = (targetKey?: string) => {
  const restoreEntry = (
    key: string,
    entry: {
      mesh: THREE.Mesh;
      material: THREE.Material | THREE.Material[];
      highlightMaterial?: THREE.Material | THREE.Material[];
    }
  ) => {
    const { mesh, material, highlightMaterial } = entry;

    // BagaStudio V42.5:
    // ripristino conservativo multi-selezione. Ripristina solo i mesh che stanno
    // ancora usando il materiale clone di highlight, senza sovrascrivere texture/materiali applicati dopo.
    if (highlightMaterial) {
      if (Array.isArray(mesh.material) && Array.isArray(highlightMaterial)) {
        const stillUsingHighlight =
          mesh.material.length === highlightMaterial.length &&
          mesh.material.every((item, index) => item === highlightMaterial[index]);

        if (stillUsingHighlight) {
          mesh.material = material as THREE.Material[];
        }
      } else if (!Array.isArray(mesh.material) && !Array.isArray(highlightMaterial) && mesh.material === highlightMaterial) {
        mesh.material = material as THREE.Material;
      }
    }

    mesh.renderOrder = 0;
    highlightedMeshMapRef.current.delete(key);
  };

  if (targetKey) {
    const targetEntry = highlightedMeshMapRef.current.get(targetKey);
    if (targetEntry) restoreEntry(targetKey, targetEntry);
    if (highlightedRef.current?.mesh === targetEntry?.mesh) highlightedRef.current = null;
    return;
  }

  Array.from(highlightedMeshMapRef.current.entries()).forEach(([key, entry]) => {
    restoreEntry(key, entry);
  });

  if (highlightedRef.current) {
    const { mesh, material, highlightMaterial } = highlightedRef.current;
    if (highlightMaterial && mesh.material === highlightMaterial) {
      mesh.material = material as THREE.Material;
    }
    mesh.renderOrder = 0;
  }

  highlightedRef.current = null;
};

const getLastHighlightedPartKeyV4252 = () => {
  const keys = Array.from(highlightedMeshMapRef.current.keys());
  return keys.length ? keys[keys.length - 1] : null;
};

const clearSelectedPartHighlightsV4252 = () => {
  multiSelectedPartIdsRef.current.clear();
  restoreHighlightedMesh();
};

const removeSelectedPartHighlightV4252 = (partKey: string) => {
  const safePartKey = String(partKey || "");
  if (!safePartKey) return null;

  multiSelectedPartIdsRef.current.delete(safePartKey);
  restoreHighlightedMesh(safePartKey);

  return getLastHighlightedPartKeyV4252();
};

const createSelectedPartHighlightMaterial = (
  material: THREE.Material | THREE.Material[]
): THREE.Material | THREE.Material[] => {
  const enhanceMaterial = (sourceMaterial: THREE.Material) => {
    const highlightedMaterial = sourceMaterial.clone() as THREE.Material & {
      color?: THREE.Color;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      metalness?: number;
      roughness?: number;
      opacity?: number;
      transparent?: boolean;
    };

    // BagaStudio Texture Refresh Fix V616:
    // preserve runtime material metadata on selection highlights.
    // Without bagastudioTextureUrl, async texture loading cannot update the
    // currently highlighted last-selected part until another selection forces a refresh.
    highlightedMaterial.userData = {
      ...(sourceMaterial.userData || {}),
      ...(highlightedMaterial.userData || {}),
      bagastudioSelectionHighlightV42: true,
    };

    if (highlightedMaterial.emissive) {
      highlightedMaterial.emissive = new THREE.Color("#38bdf8");
      highlightedMaterial.emissiveIntensity = Math.max(0.55, Number(highlightedMaterial.emissiveIntensity || 0) + 0.55);
    }

    if (highlightedMaterial.color) {
      highlightedMaterial.color = highlightedMaterial.color.clone().lerp(new THREE.Color("#7dd3fc"), 0.18);
    }

    highlightedMaterial.needsUpdate = true;
    return highlightedMaterial;
  };

  return Array.isArray(material) ? material.map((item) => enhanceMaterial(item)) : enhanceMaterial(material);
};

const applySelectedPartLightUpV42 = (mesh: THREE.Mesh, highlightKey = mesh.uuid) => {
  const existing = highlightedMeshMapRef.current.get(highlightKey);
  if (existing?.mesh === mesh) return;

  restoreHighlightedMesh(highlightKey);

  const originalMaterial = mesh.material;
  const highlightMaterial = createSelectedPartHighlightMaterial(originalMaterial);

  mesh.material = highlightMaterial as any;
  mesh.renderOrder = 90;

  const entry = {
    mesh,
    material: originalMaterial,
    highlightMaterial,
  };

  highlightedRef.current = entry;
  highlightedMeshMapRef.current.set(highlightKey, entry);
};

const applyBagastudioXRayMaterialState = (
  targetMaterial: THREE.Material | THREE.Material[] | null | undefined,
  enabled: boolean,
  opacity: number
) => {
  if (!targetMaterial) return;

  const safeOpacity = THREE.MathUtils.clamp(Number(opacity), 0.08, 1);
  const materialsList = Array.isArray(targetMaterial) ? targetMaterial : [targetMaterial];

  materialsList.forEach((mat) => {
    if (!mat) return;

    mat.side = enabled ? THREE.DoubleSide : THREE.FrontSide;
    mat.transparent = enabled;
    mat.opacity = enabled ? safeOpacity : 1;
    mat.depthWrite = !enabled;
    mat.depthTest = true;
    mat.needsUpdate = true;
  });
};
  const scene = useMemo(() => {
    if (!loadedRoot) return null;

    const clonedScene = loadedRoot.clone(true);
    clonedScene.updateMatrixWorld(true);

    // Recovery Texture V3: use one global UV reference box for imported models.
    // Some Spazio3D/DAE panels are split into multiple coplanar meshes; mapping UVs
    // per single mesh makes the same texture restart on every sub-mesh, causing
    // visible square repetitions. Global world-space UVs keep the texture continuous.
    const importedGlobalUvBox = isImportedModelFormat(runtimeModelFormat)
      ? new THREE.Box3().setFromObject(clonedScene)
      : null;

    clonedScene.traverse((child) => {
      if (child.userData?.bagastudioEdgeOverlay) {
        child.visible = modelEdgesEnabled;
        return;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.includes("Piano")) {
}
        const partKey = mesh.name;
        const meshPartId = String(mesh.userData?.bagastudioPartId || "");
        const meshRuntimeMeshName = String(mesh.userData?.bagastudioMeshName || "");
        const meshDisplayName = String(mesh.userData?.bagastudioDisplayName || "");
        const meshOriginalName = String(mesh.userData?.bagastudioOriginalName || "");
        const meshMaterialGroup = String(mesh.userData?.bagastudioMaterialGroup || "");
        const isImportedRuntimeMesh = isImportedModelFormat(runtimeModelFormat);
        const effectivePartId = meshPartId || meshRuntimeMeshName || partKey;
        const meshAliases = [
          effectivePartId,
          partKey,
          mesh.name,
          meshPartId,
          meshRuntimeMeshName,
          meshDisplayName,
          meshOriginalName,
          meshMaterialGroup,
          String(mesh.parent?.name || ""),
          String(mesh.userData?.bagastudioParentName || ""),
        ].filter(Boolean);

        const productPart =
  productParts.find((p) => meshAliases.includes(String(p.id))) ||
  productParts.find((p) => meshAliases.includes(String(p.meshName))) ||
  productParts.find((p) => meshAliases.some((alias) => String(alias).includes(String(p.meshName || "__no_match__")))) ||
  productParts.find((p) =>
    mesh.name.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    mesh.name.toLowerCase().includes("specch") &&
    String(p.id).toLowerCase().includes("mirror")
  );

        //console.log("PRODUCT PART:", productPart);

const ledMount = productPart?.mountPoints?.led || null;
const ledPosition = ledMount?.position || "front";
const insertMount = productPart?.mountPoints?.insert;
const defaultInsert = getDefaultInsertConfig();
        

      const storeKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id || partKey);

const hasLed = (productPart as any)?.compatibleLed === true || Boolean(ledMount);

const ledIsActive =
  (accessories as any)?.[storeKey]?.led === true ||
  (accessories as any)?.[partKey]?.led === true ||
  (accessories as any)?.[storeKey] === true ||
  (accessories as any)?.[partKey] === true;

        const materialStoreKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id ?? partKey);

const insertKey = isImportedRuntimeMesh ? effectivePartId : (productPart?.id ?? storeKey ?? partKey);

const hasInsert = Boolean(
  inserts[insertKey]
);
        const insertOffset = insertMount?.offset || { x: 0, y: 0, z: 1 };

const isMirrorPart =
  mesh.name?.toLowerCase().includes("specchiera") ||
  mesh.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchiera");

const explicitImportedMaterialId = isImportedRuntimeMesh
  ? meshAliases.map((alias) => materials[String(alias)]).find(Boolean) || ""
  : "";

const materialId =
  isImportedRuntimeMesh
    ? explicitImportedMaterialId || "__bagastudio_neutral_import__"
    : isMirrorPart
      ? "specchio"
      : meshAliases.map((alias) => materials[String(alias)]).find(Boolean) ||
        materials[productPart?.id ?? ""] ||
        materials[materialStoreKey] ||
        materials[partKey] ||
        productPart?.defaultMaterialId ||
        (mesh.name.includes("Piede") || mesh.name.includes("Maniglia")
          ? "oro_satinato"
          : "barok");

   const isSelected =
  Boolean(selectedPartId) &&
  (
    selectedPartId === (isImportedRuntimeMesh ? effectivePartId : productPart?.id) ||
    selectedPartId === effectivePartId ||
    (!isImportedRuntimeMesh && selectedPartId === partKey) ||
    (!isImportedRuntimeMesh && selectedPartId === mesh.name) ||
    meshAliases.includes(String(selectedPartId))
  );
const ledColor =
  ledKelvin?.[partKey] === 6000
    ? "#bfe4ff" // freddo più evidente
    : "#ffd27a"; // caldo più evidente

const normalizeKey = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const materialData =
 materialsSource.find(
  (m: any) => normalizeKey(m.id) === normalizeKey(materialId)
) ||
  materialsSource.find(
  (m: any) => normalizeKey(m.name) === normalizeKey(materialId)
);

const shouldUseNeutralRuntimeMaterial =
  isImportedRuntimeMesh && materialId === "__bagastudio_neutral_import__";

if (shouldUseNeutralRuntimeMaterial) {
  mesh.material = createBagastudioNeutralImportMaterial();
  applyBagastudioXRayMaterialState(mesh.material, xRayEnabled, xRayOpacity);
  mesh.renderOrder = xRayEnabled ? 5 : 0;
  mesh.castShadow = !xRayEnabled;
  mesh.receiveShadow = !xRayEnabled;
  return;
}

const isUnmappedImportedMesh =
  isImportedRuntimeMesh &&
  !productPart &&
  !Boolean(materials[effectivePartId]);

if (isUnmappedImportedMesh && !materialData) {
  mesh.material = createBagastudioNeutralImportMaterial();
  applyBagastudioXRayMaterialState(mesh.material, xRayEnabled, xRayOpacity);
  mesh.renderOrder = xRayEnabled ? 5 : 0;
  mesh.castShadow = !xRayEnabled;
  mesh.receiveShadow = !xRayEnabled;
  return;
}

function applyPlanarUV(mesh: THREE.Mesh, rotate = false, worldBox?: THREE.Box3 | null) {
  const baseGeometry = mesh.geometry as THREE.BufferGeometry;
  if (!baseGeometry.attributes.position) return;

  // Recovery Texture V4:
  // Use box-projected UVs by face normal, not one single projection plane.
  // This avoids both problems seen in tests:
  // 1) repeated square tiles on coplanar split DAE meshes;
  // 2) vertical striped distortion when one global projection is forced on all faces.
  const geometry = baseGeometry.index ? baseGeometry.toNonIndexed() : baseGeometry;
  if (geometry !== baseGeometry) {
    mesh.geometry = geometry;
  }

  geometry.computeBoundingBox();
  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  const localBox = geometry.boundingBox;
  if (!localBox) return;

  const sourceBox = worldBox && !worldBox.isEmpty() ? worldBox : localBox;
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const sizeX = Math.max(sourceSize.x, 0.0001);
  const sizeY = Math.max(sourceSize.y, 0.0001);
  const sizeZ = Math.max(sourceSize.z, 0.0001);

  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const normalAttr = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const uvs: number[] = [];

  const readWorldPosition = (index: number) => {
    vertex.fromBufferAttribute(pos, index);
    if (worldBox && !worldBox.isEmpty()) mesh.localToWorld(vertex);
    return vertex;
  };

  const readWorldNormal = (index: number) => {
    if (normalAttr) {
      normal.fromBufferAttribute(normalAttr, index);
      if (worldBox && !worldBox.isEmpty()) normal.applyMatrix3(normalMatrix).normalize();
    } else {
      normal.set(0, 0, 1);
    }
    return normal;
  };

  const getLocalU = (value: number, axis: "x" | "y" | "z") => {
    if (worldBox && !worldBox.isEmpty()) {
      if (axis === "x") return (value - sourceBox.min.x) / sizeX;
      if (axis === "y") return (value - sourceBox.min.y) / sizeY;
      return (value - sourceBox.min.z) / sizeZ;
    }

    if (axis === "x") return (value - localBox.min.x) / Math.max(localBox.max.x - localBox.min.x, 0.0001);
    if (axis === "y") return (value - localBox.min.y) / Math.max(localBox.max.y - localBox.min.y, 0.0001);
    return (value - localBox.min.z) / Math.max(localBox.max.z - localBox.min.z, 0.0001);
  };

  for (let i = 0; i < pos.count; i++) {
    const p = readWorldPosition(i);
    const n = readWorldNormal(i);
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);

    let u = 0;
    let v = 0;

    if (ay >= ax && ay >= az) {
      // Horizontal top/bottom: project X/Z.
      u = getLocalU(p.x, "x");
      v = getLocalU(p.z, "z");
    } else if (ax >= ay && ax >= az) {
      // Left/right sides: project Z/Y.
      u = getLocalU(p.z, "z");
      v = getLocalU(p.y, "y");
    } else {
      // Front/back: project X/Y.
      u = getLocalU(p.x, "x");
      v = getLocalU(p.y, "y");
    }

    if (rotate) {
      // Real grain direction switch: swap the projection axes in UV space only.
      // Do not rotate the texture bitmap afterwards, otherwise horizontal/vertical cancels out.
      const nextU = v;
      v = u;
      u = nextU;
    }

    uvs.push(THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1));
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
  geometry.computeVertexNormals();
}

        let material:
          | THREE.MeshStandardMaterial
          | THREE.MeshPhysicalMaterial;

        switch (materialData?.type) {
case "texture": {
const directionKey = productPart?.id || partKey;

const selectedWoodDirection =
  woodDirection?.[directionKey] ||
  woodDirection?.[partKey] ||
  materialData.woodDirection ||
  "x";

const meshName = String(mesh.name || "").toLowerCase();

const projection =
  meshName.includes("piano") || meshName.includes("top")
    ? "xz"
    : meshName.includes("fianco") || meshName.includes("side")
    ? "xy"
    : "yz";

const rotateWood = selectedWoodDirection === "z";

applyPlanarUV(mesh, rotateWood, importedGlobalUvBox);
const textureUrl = materialData.textureUrl;
const fallbackColor =
  materialData.fallbackColor ||
  materialData.color ||
  "#c8c2b6";

const configureTexture = (loadedTexture: THREE.Texture) => {
  const runtimeTexture = loadedTexture.clone();
  runtimeTexture.image = loadedTexture.image;
  configureBagastudioTexture(
    runtimeTexture,
    getBagastudioTextureRepeat(mesh, materialData, rotateWood)
  );
  return runtimeTexture;
};

const applyLoadedTexture = (loadedTexture: THREE.Texture) => {
  const runtimeTexture = configureTexture(loadedTexture);

  const applyRuntimeTextureToMaterial = (targetMaterial: THREE.Material | THREE.Material[] | null | undefined) => {
    const targetMaterials = Array.isArray(targetMaterial) ? targetMaterial : [targetMaterial];

    targetMaterials.forEach((target) => {
      const standardMaterial = target as THREE.MeshStandardMaterial | null | undefined;
      if (!standardMaterial) return;
      if ((standardMaterial as any).userData?.bagastudioTextureUrl !== textureUrl) return;

      standardMaterial.map = runtimeTexture.clone();
      standardMaterial.map.image = runtimeTexture.image;
      standardMaterial.color.set("#ffffff");
      standardMaterial.needsUpdate = true;
    });
  };

  applyRuntimeTextureToMaterial(mesh.material);

  // BagaStudio Texture Refresh Fix V616:
  // if the selected mesh is highlighted while the texture finishes loading,
  // update both the visible highlight clone and the stored restore material.
  highlightedMeshMapRef.current.forEach((entry) => {
    if (entry.mesh !== mesh) return;
    applyRuntimeTextureToMaterial(entry.material);
    applyRuntimeTextureToMaterial(entry.highlightMaterial);
  });

  mesh.userData.bagastudioTextureRefreshV616 = Date.now();
  mesh.updateMatrixWorld(true);
  requestAnimationFrame(() => {
    applyRuntimeTextureToMaterial(mesh.material);
    mesh.updateMatrixWorld(true);
  });
};

let texture = textureCache.get(textureUrl);

if (texture) {
  const runtimeTexture = configureTexture(texture);

  material = new THREE.MeshStandardMaterial({
    map: runtimeTexture,
    color: "#ffffff",
    roughness: materialData.roughness ?? 0.48,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });
  (material as any).userData.bagastudioTextureUrl = textureUrl;
} else {
  material = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: materialData.roughness ?? 0.48,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });

  (material as any).userData.bagastudioTextureUrl = textureUrl;

  const waiters = textureWaiters.get(textureUrl);

  if (waiters) {
    waiters.push(applyLoadedTexture);
  } else {
    textureWaiters.set(textureUrl, [applyLoadedTexture]);

    textureLoader.load(
      textureUrl,
      (loadedTexture) => {
        configureTexture(loadedTexture);
        textureCache.set(textureUrl, loadedTexture);

        const callbacks = textureWaiters.get(textureUrl) || [];
        callbacks.forEach((callback) => callback(loadedTexture));
        textureWaiters.delete(textureUrl);
      },
      undefined,
      (err) => {
        console.error("TEXTURE ERROR:", textureUrl, err);
        textureWaiters.delete(textureUrl);
      }
    );
  }
}

  break;
}
          case "metal":
            material = new THREE.MeshPhysicalMaterial({
              color: materialData.color || "#c7a55d",
              roughness: materialData.roughness ?? 0.35,
              metalness: materialData.metalness ?? 1,
              clearcoat: materialData.clearcoat ?? 0.2,
              clearcoatRoughness:
                materialData.clearcoatRoughness ?? 0.2,
              envMapIntensity:
                materialData.envMapIntensity ?? 1.6,
            });
            break;

          case "mirror":
            material = new THREE.MeshPhysicalMaterial({
              color: materialData.color || "#ffffff",
              roughness: materialData.roughness ?? 0,
              metalness: materialData.metalness ?? 1,
              clearcoat: materialData.clearcoat ?? 1,
              clearcoatRoughness:
                materialData.clearcoatRoughness ?? 0,
              envMapIntensity:
                materialData.envMapIntensity ?? 2,
            });
            break;

          default:
            material = new THREE.MeshStandardMaterial({
              color: materialData?.color || "gray",
              roughness: materialData?.roughness ?? 0.45,
              metalness: materialData?.metalness ?? 0.05,
            });
        }

        mesh.material = material;
        mesh.material.needsUpdate = true;
        mesh.updateMatrixWorld(true);
        mesh.castShadow = false;
mesh.receiveShadow = false;
        console.log("INSERT CHECK", {
  mesh: mesh.name,
  productPartId: productPart?.id,
  partKey,
  storeKey,
  materialStoreKey,
  hasInsert,
  insertMount,
  insertMaterials,
  inserts,
});
if (hasInsert) {
  const effectiveInsertMount = insertMount || {
    position: ["top"],
    offset: { x: 0, y: 0, z: 1 },
  };

  const existingInsert = clonedScene.getObjectByName(`INSERT_${mesh.name}`);
  if (existingInsert) {
    clonedScene.remove(existingInsert);
  }

 const insertKey = productPart?.id ?? partKey;

const insertMaterialId =
  insertMaterials?.[insertKey] ||
  insertMaterials?.[productPart?.id ?? ""] ||
  insertMaterials?.[partKey] ||
  "marmo";

console.log("INSERT MATERIAL CHECK:", {
  insertKey,
  partKey,
  productPartId: productPart?.id,
  insertMaterials,
  insertMaterialId,
});

const insertMaterialData =
  materialsSource.find((m: any) => m.id === insertMaterialId) ||
  null;

console.log("INSERT MATERIAL FOUND:", {
  insertMaterialId,
  insertMaterialData,
});

let insertRenderMaterial = new THREE.MeshStandardMaterial({
  color: "#d9d9d9",
  roughness: 0.25,
  metalness: 0,
});

if (insertMaterialData) {
  switch (insertMaterialData.type) {
    case "marble":
    case "texture": {
      let texture = textureCache.get(insertMaterialData.textureUrl);

if (!texture) {
  texture = textureLoader.load(insertMaterialData.textureUrl);
  textureCache.set(insertMaterialData.textureUrl, texture);
}

      configureBagastudioTexture(texture, {
        repeatX: insertMaterialData.repeatX ?? insertMaterialData.scaleX ?? 1,
        repeatY: insertMaterialData.repeatY ?? insertMaterialData.scaleY ?? 1,
      });

      insertRenderMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        color: "#ffffff",
        roughness: insertMaterialData.roughness ?? 0.35,
        metalness: insertMaterialData.metalness ?? 0,
      });
      break;
    }

    case "metal":
      insertRenderMaterial = new THREE.MeshPhysicalMaterial({
        color: insertMaterialData.color || "#c7a55d",
        roughness: insertMaterialData.roughness ?? 0.25,
        metalness: 1,
      });
      break;

    case "mirror":
      insertRenderMaterial = new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0,
        metalness: 1,
        clearcoat: 1,
      });
      break;
  }
}
const insertPanel = createInsertPanel(
  mesh,
  insertRenderMaterial,
  effectiveInsertMount,
 insertSizes[productPart?.id ?? partKey] ?? {
  width: defaultInsert.widthPercent,
  depth: defaultInsert.heightPercent,
  offsetX: defaultInsert.offsetX,
  offsetZ: defaultInsert.offsetY,
}
);
  clonedScene.add(insertPanel);
}
        mesh.castShadow = false;
mesh.receiveShadow = false;

if (mesh.geometry) {
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
}

applyBagastudioXRayMaterialState(mesh.material, xRayEnabled, xRayOpacity);
mesh.renderOrder = xRayEnabled ? 5 : 0;
mesh.castShadow = !xRayEnabled;
mesh.receiveShadow = !xRayEnabled;
const visibilityKey = productPart?.id ?? partKey;

mesh.visible =
  visibility[visibilityKey] !== false &&
  visibility[partKey] !== false;
const existingLed = clonedScene.getObjectByName(`LED_${mesh.name}`);
if (existingLed) {
  clonedScene.remove(existingLed);
}
if (hasLed && ledIsActive) {
  const currentLedIntensity = Number(
    ledIntensity?.[storeKey] ??
    ledIntensity?.[partKey] ??
    1
  );

  const ledConfig = {
    frontOffset: 2,
    sideMargin: 8,
    yOffset: -2,
    position: "front",
    ...(ledMount || {}),
    intensity: currentLedIntensity,
  };

  const ledColor =
    ledKelvin?.[storeKey] === 6000 || ledKelvin?.[partKey] === 6000
      ? "#dff3ff"
      : "#fff1b8";

  const ledBar = useImportedSafeLed
    ? createImportedModelSafeLedBar(mesh, ledColor, ledConfig)
    : createLedBar(mesh, ledColor, ledConfig);

  clonedScene.add(ledBar);
}
const usbActive =
  accessories?.[storeKey]?.usb === true ||
  accessories?.[partKey]?.usb === true;

if (usbActive) {
  const usb = createUsbAccessory(mesh);
  clonedScene.add(usb);
}
const socketActive =
  accessories?.[storeKey]?.socket === true ||
  accessories?.[partKey]?.socket === true;

if (socketActive) {
  const socket = createSocketAccessory(mesh);
  clonedScene.add(socket);
}
const hairdryerHolderActive =
  accessories?.[storeKey]?.hairdryer_holder === true ||
  accessories?.[partKey]?.hairdryer_holder === true;

if (hairdryerHolderActive) {
  const holder = createHairdryerHolderAccessory(mesh);
  clonedScene.add(holder);
}
const toolHolderActive =
  accessories?.[storeKey]?.tool_holder === true ||
  accessories?.[partKey]?.tool_holder === true;

if (toolHolderActive) {
  const toolHolder = createToolHolderAccessory(mesh);
  clonedScene.add(toolHolder);
}
const wirelessActive =
  accessories?.[storeKey]?.wireless_charge === true ||
  accessories?.[partKey]?.wireless_charge === true;

if (wirelessActive) {
  const wireless = createWirelessChargerAccessory(mesh);
  clonedScene.add(wireless);
}
// const mirrorLedActive =
//   accessories?.[storeKey]?.mirror_led === true ||
//   accessories?.[partKey]?.mirror_led === true;

// if (mirrorLedActive) {
//   const mirrorLed = createMirrorLedAccessory(mesh);
//   clonedScene.add(mirrorLed);
// }
}
});


return clonedScene;
}, [
  loadedRoot,
  runtimeModelFormat,
  productParts,
  productMaterials,
  materials,
  accessories,
  inserts,
  insertMaterials,
  insertSizes,
  ledKelvin,
  ledIntensity,
  visibility,
  woodDirection,
  xRayEnabled,
  xRayOpacity,
  modelEdgesEnabled,
  materialRefreshKey,
]);

const importedModelDisplayScale = useMemo(
  () => getBagastudioImportedDisplayScale(
    scene,
    runtimeModelFormat,
    { width, height, depth },
    importedModelName,
    importCalibration.realWidthCm
  ),
  [scene, runtimeModelFormat, width, height, depth, importedModelName, importCalibration.realWidthCm]
);

const importedModelAxisCorrection = useMemo(
  () => getBagastudioImportedAxisCorrection(scene, runtimeModelFormat),
  [scene, runtimeModelFormat]
);

const importedModelGroundOffsetY = useMemo(() => {
  if (!scene) return 0;

  const probe = scene.clone(true);
  probe.rotation.set(
    importedModelAxisCorrection[0] || 0,
    importedModelAxisCorrection[1] || 0,
    importedModelAxisCorrection[2] || 0
  );
  probe.scale.setScalar(importedModelDisplayScale || 1);
  probe.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(probe);
  if (box.isEmpty()) return 0;

  const offsetY = -box.min.y;
  return Number.isFinite(offsetY) ? offsetY : 0;
}, [scene, importedModelAxisCorrection, importedModelDisplayScale]);

const importedModelDiagnostics = useMemo(() => {
  if (!scene) return null;

  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return null;

  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    width: size.x,
    height: size.y,
    depth: size.z,
    minY: box.min.y,
    maxY: box.max.y,
    scale: importedModelDisplayScale,
  };
}, [scene, importedModelDisplayScale]);

useEffect(() => {
  if (!importedModelDiagnostics) return;

  console.log("[BAGASTUDIO IMPORT DIAGNOSTICS]", {
    width: importedModelDiagnostics.width,
    height: importedModelDiagnostics.height,
    depth: importedModelDiagnostics.depth,
    minY: importedModelDiagnostics.minY,
    maxY: importedModelDiagnostics.maxY,
    scale: importedModelDiagnostics.scale,
  });
}, [importedModelDiagnostics]);

function createInsertPanel(
  mesh: THREE.Mesh,
  material: THREE.Material,
  insertMount: {
    position?: string[];
    offset?: {
      x: number;
      y: number;
      z: number;
    };
  },
  insertSize?: {
    width?: number;
    depth?: number;
    offsetX?: number;
    offsetZ?: number;
  }
) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const offset = insertMount.offset || { x: 0, y: 0, z: 1 };
  const position = insertMount.position?.[0] || "front";

 let geometry: THREE.BoxGeometry;
const insertThickness = 0.08;

const widthPercent = insertSize?.width ?? 100;
const depthPercent = insertSize?.depth ?? 100;

const widthX = size.x * (widthPercent / 100);
const heightY = size.y * (depthPercent / 100);
const depthZ = size.z * (depthPercent / 100);

if (position === "top") {
  geometry = new THREE.BoxGeometry(widthX, insertThickness, depthZ);
} else if (position === "side") {
  geometry = new THREE.BoxGeometry(insertThickness, heightY, depthZ);
} else {
  geometry = new THREE.BoxGeometry(widthX, heightY, insertThickness);
}

  const insert = new THREE.Mesh(geometry, material.clone());

if (position === "top") {
  insert.position.set(
    center.x + offset.x + (insertSize?.offsetX ?? 0),
 box.max.y + (insertThickness / 2) + 0.015 + offset.y,
    center.z + offset.z + (insertSize?.offsetZ ?? 0)
  );
} else if (position === "side") {
  insert.position.set(
    box.max.x + offset.x,
    center.y + offset.y + (insertSize?.offsetZ ?? 0),
    center.z + offset.z + (insertSize?.offsetX ?? 0)
  );
} else {
  insert.position.set(
    center.x + offset.x + (insertSize?.offsetX ?? 0),
    center.y + offset.y + (insertSize?.offsetZ ?? 0),
    box.max.z + offset.z
  );
}

  insert.name = `INSERT_${mesh.name}`;

  return insert;
}
  useEffect(() => {
    if (!scene) return;

    const keepExistingHighlights = lastSelectionWasMultiRef.current;
    lastSelectionWasMultiRef.current = false;

    if (!keepExistingHighlights) {
      clearSelectedPartHighlightsV4252();
    }

    if (!selectedPartId) return;

    let targetMesh: THREE.Mesh | null = null;

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || targetMesh) return;

      const partId = String(mesh.userData?.bagastudioPartId || "");
      const meshName = String(mesh.userData?.bagastudioMeshName || mesh.name || "");
      const displayName = String(mesh.userData?.bagastudioDisplayName || "");

      if (
        mesh.name === selectedPartId ||
        partId === selectedPartId ||
        meshName === selectedPartId ||
        displayName === selectedPartId
      ) {
        targetMesh = mesh;
      }
    });

    if (!targetMesh) return;
const mesh = targetMesh as THREE.Mesh;

const selectedKey = String(selectedPartId);
if (keepExistingHighlights) {
  multiSelectedPartIdsRef.current.add(selectedKey);
} else {
  multiSelectedPartIdsRef.current = new Set([selectedKey]);
}

applySelectedPartLightUpV42(mesh, selectedKey);
  }, [scene, selectedPartId]);

  const importedModelOffsetDiagnostics = useMemo(() => {
    if (!scene) return null;

    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return null;

    const size = new THREE.Vector3();
    box.getSize(size);

    return {
      rawWidth: size.x,
      rawHeight: size.y,
      rawDepth: size.z,
      rawMinY: box.min.y,
      rawMaxY: box.max.y,
      displayScale: importedModelDisplayScale,
      scaledMinY: box.min.y * importedModelDisplayScale,
      scaledMaxY: box.max.y * importedModelDisplayScale,
      scaledHeight: size.y * importedModelDisplayScale,
      suggestedGroundOffsetY: -box.min.y * importedModelDisplayScale,
      centerMode: "Center disableY",
    };
  }, [scene, importedModelDisplayScale]);

  useEffect(() => {
    if (!importedModelOffsetDiagnostics) return;

    console.log("[BAGASTUDIO IMPORT OFFSET DIAGNOSTICS V1]", importedModelOffsetDiagnostics);
  }, [importedModelOffsetDiagnostics]);

  const importedModelScaleDiagnostics = useMemo(() => {
    if (!scene || !importedModelOffsetDiagnostics) return null;

    const rawWidth = Number(importedModelOffsetDiagnostics.rawWidth || 0);
    const rawHeight = Number(importedModelOffsetDiagnostics.rawHeight || 0);
    const rawDepth = Number(importedModelOffsetDiagnostics.rawDepth || 0);
    const viewerScale = Number(importedModelDisplayScale || 1);
    const calibrationScale = Math.max(0.01, Number(importCalibration.scale || 1));
    const totalVisualScale = viewerScale * calibrationScale;

    // V42.5.4 Snap Parete reale:
    // misura l'ingombro visivo dopo la correzione assi DAE/GLB, perché lo snap deve usare
    // il box che l'utente vede nel Viewer e non solo width/depth dichiarati dal prodotto.
    const axisProbe = scene.clone(true);
    axisProbe.rotation.set(
      importedModelAxisCorrection[0] || 0,
      importedModelAxisCorrection[1] || 0,
      importedModelAxisCorrection[2] || 0
    );
    axisProbe.updateMatrixWorld(true);

    const axisBox = new THREE.Box3().setFromObject(axisProbe);
    const axisSize = axisBox.getSize(new THREE.Vector3());
    const axisCorrectedViewerUnits = {
      width: Math.max(0, axisSize.x * totalVisualScale),
      height: Math.max(0, axisSize.y * totalVisualScale),
      depth: Math.max(0, axisSize.z * totalVisualScale),
    };
    const axisCorrectedViewerBounds = {
      minX: axisBox.min.x * totalVisualScale,
      maxX: axisBox.max.x * totalVisualScale,
      minZ: axisBox.min.z * totalVisualScale,
      maxZ: axisBox.max.z * totalVisualScale,
    };

    // BagaStudio internal room unit: room cm / 100, quindi 1 unità viewer = 1000 mm.
    const viewerUnitToMm = 1000;
    const rawMax = Math.max(rawWidth, rawHeight, rawDepth);
    const candidateScales = {
      meters: 1,
      decimeters: 0.1,
      centimeters: 0.01,
      millimeters: 0.001,
    };

    return {
      format: runtimeModelFormat,
      raw: {
        width: rawWidth,
        height: rawHeight,
        depth: rawDepth,
        max: rawMax,
      },
      productPropsCm: {
        width,
        height,
        depth,
      },
      displayScale: viewerScale,
      calibrationScale,
      totalVisualScale,
      finalViewerUnits: {
        width: rawWidth * totalVisualScale,
        height: rawHeight * totalVisualScale,
        depth: rawDepth * totalVisualScale,
      },
      axisCorrectedViewerUnits,
      axisCorrectedViewerBounds,
      finalEstimatedCm: {
        width: rawWidth * totalVisualScale * 100,
        height: rawHeight * totalVisualScale * 100,
        depth: rawDepth * totalVisualScale * 100,
      },
      finalEstimatedMm: {
        width: rawWidth * totalVisualScale * viewerUnitToMm,
        height: rawHeight * totalVisualScale * viewerUnitToMm,
        depth: rawDepth * totalVisualScale * viewerUnitToMm,
      },
      candidatesCm: {
        meters: {
          width: rawWidth * candidateScales.meters * 100,
          height: rawHeight * candidateScales.meters * 100,
          depth: rawDepth * candidateScales.meters * 100,
        },
        decimeters: {
          width: rawWidth * candidateScales.decimeters * 100,
          height: rawHeight * candidateScales.decimeters * 100,
          depth: rawDepth * candidateScales.decimeters * 100,
        },
        centimeters: {
          width: rawWidth * candidateScales.centimeters * 100,
          height: rawHeight * candidateScales.centimeters * 100,
          depth: rawDepth * candidateScales.centimeters * 100,
        },
        millimeters: {
          width: rawWidth * candidateScales.millimeters * 100,
          height: rawHeight * candidateScales.millimeters * 100,
          depth: rawDepth * candidateScales.millimeters * 100,
        },
      },
      note:
        "Diagnostica scala V16: confrontare candidatesCm/finalEstimatedCm con le misure reali note prima di cambiare moltiplicatori.",
    };
  }, [
    scene,
    runtimeModelFormat,
    importedModelDisplayScale,
    importCalibration.scale,
    importedModelOffsetDiagnostics,
    importedModelAxisCorrection,
    width,
    height,
    depth,
  ]);

  useEffect(() => {
    if (!importedModelScaleDiagnostics) return;

    console.log("[BAGASTUDIO SCALE DIAGNOSTICS V16]", importedModelScaleDiagnostics);
    if (typeof window !== "undefined") {
      (window as any).__bagastudioScaleDiagnosticsV8 = importedModelScaleDiagnostics;
      window.dispatchEvent(
        new CustomEvent("bagastudio:scale-diagnostics-v8", {
          detail: importedModelScaleDiagnostics,
        })
      );
    }
  }, [importedModelScaleDiagnostics]);


  const getParametricModuleScaleV1 = (dimensions?: { width?: number; height?: number; depth?: number }) => {
    const estimatedCm = (importedModelScaleDiagnostics?.finalEstimatedCm || {}) as { width?: number; height?: number; depth?: number };
    const estimatedWidth = Math.max(1, Number(estimatedCm.width || width || 180));
    const estimatedHeight = Math.max(1, Number(estimatedCm.height || height || 100));
    const estimatedDepth = Math.max(1, Number(estimatedCm.depth || depth || 60));

    return {
      x: THREE.MathUtils.clamp(Number(dimensions?.width || width || 180) / estimatedWidth, 0.05, 20),
      y: THREE.MathUtils.clamp(Number(dimensions?.height || height || 100) / estimatedHeight, 0.05, 20),
      z: THREE.MathUtils.clamp(Number(dimensions?.depth || depth || 60) / estimatedDepth, 0.05, 20),
    };
  };

  const sceneModulePreviewClonesV39 = useMemo(() => {
    if (!scene || !Array.isArray(sceneModules) || sceneModules.length <= 1) return [];

    return sceneModules
      .filter((module: any) => module?.id && module.id !== activeSceneModuleId)
      .map((module: any) => {
        const transform = module?.transform || {};
        const clonedScene = scene.clone(true);

        clonedScene.traverse((object: any) => {
          object.userData = {
            ...(object.userData || {}),
            bagastudioIgnoreRaycast: true,
            bagastudioSceneModulePreview: true,
            bagastudioSceneModuleId: module.id,
          };

          if (object?.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = false;
          }
        });

        return {
          id: String(module.id),
          name: String(module.name || module.id),
          object: clonedScene,
          transform: {
            x: Number(transform.x || 0),
            z: Number(transform.z || 0),
            rotationYDeg: Number(transform.rotationYDeg || 0),
          },
          dimensions: module?.dimensions || { width, height, depth },
        };
      });
  }, [scene, sceneModules, activeSceneModuleId]);

  const sceneModuleCollisionMapV42 = useMemo(() => {
    const modules = Array.isArray(sceneModules) ? sceneModules : [];
    const footprintWidth = Math.max(0.24, Number(width || 180) / 100);
    const footprintDepth = Math.max(0.24, Number(depth || 60) / 100);
    const joinTolerance = 0.03;

    const getBox = (module: any, fallbackTransform?: any) => {
      const transform = module?.transform || fallbackTransform || {};
      const rotation = THREE.MathUtils.euclideanModulo(Number(transform.rotationYDeg || 0), 360);
      const quarterTurn = Math.abs((rotation % 180) - 90) < 45;
      const boxWidth = quarterTurn ? footprintDepth : footprintWidth;
      const boxDepth = quarterTurn ? footprintWidth : footprintDepth;
      const x = Number(transform.x || 0);
      const z = Number(transform.z || 0);

      return {
        id: String(module?.id || activeSceneModuleId || "primary-module"),
        x,
        z,
        width: boxWidth,
        depth: boxDepth,
        left: x - boxWidth / 2,
        right: x + boxWidth / 2,
        back: z - boxDepth / 2,
        front: z + boxDepth / 2,
      };
    };

    const boxes = modules.map((module: any) => getBox(module));
    const status = new Map<string, "ok" | "join" | "collision">();

    boxes.forEach((box) => status.set(box.id, "ok"));

    for (let index = 0; index < boxes.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < boxes.length; nextIndex += 1) {
        const a = boxes[index];
        const b = boxes[nextIndex];

        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapZ = Math.min(a.front, b.front) - Math.max(a.back, b.back);
        const intersects = overlapX > 0.005 && overlapZ > 0.005;

        const nearlyJoined =
          !intersects &&
          (
            (Math.abs(a.right - b.left) <= joinTolerance || Math.abs(b.right - a.left) <= joinTolerance) &&
            Math.min(a.front, b.front) - Math.max(a.back, b.back) > -joinTolerance
          ||
            (Math.abs(a.front - b.back) <= joinTolerance || Math.abs(b.front - a.back) <= joinTolerance) &&
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > -joinTolerance
          );

        if (intersects) {
          status.set(a.id, "collision");
          status.set(b.id, "collision");
        } else if (nearlyJoined) {
          if (status.get(a.id) !== "collision") status.set(a.id, "join");
          if (status.get(b.id) !== "collision") status.set(b.id, "join");
        }
      }
    }

    return status;
  }, [sceneModules, width, depth, activeSceneModuleId]);

  if (!scene) return null;

  return (
    <>
      {sceneModulePreviewClonesV39.map((module: any) => (
        <group
          key={`scene-module-preview-v39-${module.id}`}
          name={`bagastudio-scene-module-preview-v39-${module.id}`}
          onClick={(event: any) => {
            event.stopPropagation();
            onSelectSceneModule?.(String(module.id));
          }}
          position={[
            Number(importCalibration.offsetX || 0) + Number(module.transform?.x || 0),
            Number(importCalibration.offsetY || 0),
            Number(importCalibration.offsetZ || 0) + Number(module.transform?.z || 0),
          ]}
          rotation={[
            THREE.MathUtils.degToRad(Number(importCalibration.rotationXDeg || 0)),
            THREE.MathUtils.degToRad(
              Number(importCalibration.rotationYDeg || 0) + Number(module.transform?.rotationYDeg || 0)
            ),
            THREE.MathUtils.degToRad(Number(importCalibration.rotationZDeg || 0)),
          ]}
          scale={Math.max(0.01, Number(importCalibration.scale || 1))}
        >
          {sceneModuleCollisionMapV42.get(String(module.id)) !== "ok" && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={8}>
              <planeGeometry args={[Math.max(0.3, Number(width || 180) / 100), Math.max(0.3, Number(depth || 60) / 100)]} />
              <meshBasicMaterial
                color={sceneModuleCollisionMapV42.get(String(module.id)) === "collision" ? "#ef4444" : "#22c55e"}
                transparent
                opacity={0.18}
                depthWrite={false}
              />
            </mesh>
          )}
          <Center disableY>
            <group rotation={importedModelAxisCorrection} position={[0, importedModelGroundOffsetY, 0]}>
              <primitive
                object={module.object}
                scale={importedModelDisplayScale}
                castShadow
                receiveShadow
              />
            </group>
          </Center>
        </group>
      ))}

    <group
      name="bagastudio-import-calibration-v1"
      position={[
        Number(importCalibration.offsetX || 0) + Number(modelSceneOffset?.x || 0),
        Number(importCalibration.offsetY || 0),
        Number(importCalibration.offsetZ || 0) + Number(modelSceneOffset?.z || 0),
      ]}
      rotation={[
        THREE.MathUtils.degToRad(Number(importCalibration.rotationXDeg || 0)),
        THREE.MathUtils.degToRad(
          Number(importCalibration.rotationYDeg || 0) + Number(modelSceneOffset?.rotationYDeg || 0)
        ),
        THREE.MathUtils.degToRad(Number(importCalibration.rotationZDeg || 0)),
      ]}
      scale={Math.max(0.01, Number(importCalibration.scale || 1))}
    >
    {(activeSceneModuleStatus || sceneModuleCollisionMapV42.get(String(activeSceneModuleId || "primary-module"))) !== "ok" && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={8}>
        <planeGeometry args={[Math.max(0.3, Number(width || 180) / 100), Math.max(0.3, Number(depth || 60) / 100)]} />
        <meshBasicMaterial
          color={(activeSceneModuleStatus || sceneModuleCollisionMapV42.get(String(activeSceneModuleId || "primary-module"))) === "collision" ? "#ef4444" : "#22c55e"}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    )}
    <Center disableY>
<group
  rotation={importedModelAxisCorrection}
  position={[0, importedModelGroundOffsetY, 0]}
  onPointerMissed={() => {
    clearSelectedPartHighlightsV4252();

    setSelectedPartId(null);
  }}
>
  <primitive
    object={scene}
    scale={importedModelDisplayScale}
    castShadow
    receiveShadow
    onClick={(e: any) => {
      e.stopPropagation();

      const clickedObject = e.object as THREE.Object3D;
      const clickedObjectText = String(
        clickedObject.name || clickedObject.parent?.name || ""
      )
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      if (
        clickedObject.userData?.bagastudioIgnoreRaycast ||
        clickedObject.userData?.bagastudioTechnicalHelper ||
        /(^|_)edge_definition($|_)/.test(clickedObjectText)
      ) {
        return;
      }

      const clickedName =
        e.object.name ||
        e.object.parent?.name ||
        "unknown-part";
const clickedPart =
  productParts.find((p) => p.meshName === clickedName) ||
  productParts.find((p) => clickedName.includes(p.meshName)) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("specch") &&
    String(p.id).toLowerCase().includes("mirror")
  );
  productParts.find((p) =>
    clickedName.toLowerCase().includes("mirror") &&
    String(p.id).toLowerCase().includes("mirror")
  ) ||
  productParts.find((p) =>
    clickedName.toLowerCase().includes("specchio") &&
    String(p.id).toLowerCase().includes("mirror")
  );

const clickedMeshObject = e.object as THREE.Mesh;
const clickedMeshPartId = String(clickedMeshObject.userData?.bagastudioPartId || "");
const clickedMeshRuntimeName = String(clickedMeshObject.userData?.bagastudioMeshName || "");
const clickedIsImported = isImportedModelFormat(runtimeModelFormat);

const realPartKey =
  clickedIsImported
    ? (clickedMeshPartId || clickedMeshRuntimeName || clickedName)
    : (clickedPart?.id || clickedMeshPartId || clickedMeshRuntimeName || clickedName);

    const clickedMesh =
  scene.getObjectByName(clickedPart?.meshName || clickedName) as THREE.Mesh ||
  (e.object as THREE.Mesh);

      const isMultiSelectionClick = Boolean(e?.nativeEvent?.ctrlKey || e?.nativeEvent?.metaKey || e?.nativeEvent?.shiftKey);
      lastSelectionWasMultiRef.current = isMultiSelectionClick;

      if (isMultiSelectionClick && highlightedMeshMapRef.current.has(realPartKey)) {
        const fallbackSelectedPartId = removeSelectedPartHighlightV4252(realPartKey);
        setSelectedPartId(fallbackSelectedPartId);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("bagastudio:viewer-component-selected", {
              detail: {
                partId: fallbackSelectedPartId || "",
                id: fallbackSelectedPartId || "",
                toggledOffPartId: realPartKey,
                meshName: clickedMesh.name || clickedName,
                displayName: String(clickedMesh.userData?.bagastudioDisplayName || clickedMesh.name || clickedName),
                originalName: String(clickedMesh.userData?.bagastudioOriginalName || clickedName),
                multiSelect: true,
                additive: Boolean(e?.nativeEvent?.ctrlKey || e?.nativeEvent?.metaKey),
                range: Boolean(e?.nativeEvent?.shiftKey),
                deselected: true,
              },
            })
          );
        }

        return;
      }

      if (!isMultiSelectionClick) {
        clearSelectedPartHighlightsV4252();
      } else {
        multiSelectedPartIdsRef.current.add(realPartKey);
      }

      applySelectedPartLightUpV42(clickedMesh, realPartKey);

      setSelectedPartId(realPartKey);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-component-selected", {
            detail: {
              partId: realPartKey,
              id: realPartKey,
              meshName: clickedMesh.name || clickedName,
              displayName: String(clickedMesh.userData?.bagastudioDisplayName || clickedMesh.name || clickedName),
              originalName: String(clickedMesh.userData?.bagastudioOriginalName || clickedName),
              multiSelect: Boolean(e?.nativeEvent?.ctrlKey || e?.nativeEvent?.metaKey || e?.nativeEvent?.shiftKey),
              additive: Boolean(e?.nativeEvent?.ctrlKey || e?.nativeEvent?.metaKey),
              range: Boolean(e?.nativeEvent?.shiftKey),
            },
          })
        );
      }
    }}
  />
</group>
  </Center>


    </group>
    </>
);
}


function getBagastudioBoxVolume(box: THREE.Box3) {
  const size = new THREE.Vector3();
  box.getSize(size);
  return Math.max(size.x, 0.001) * Math.max(size.y, 0.001) * Math.max(size.z, 0.001);
}

function getBagastudioPrimaryClusterBox(boxes: THREE.Box3[]) {
  if (!boxes.length) return null;
  if (boxes.length === 1) return boxes[0].clone();

  const fullBox = new THREE.Box3();
  boxes.forEach((item) => fullBox.union(item));

  const fullSize = new THREE.Vector3();
  fullBox.getSize(fullSize);
  const fullMaxSize = Math.max(fullSize.x, fullSize.y, fullSize.z);
  const clusterMargin = Math.max(fullMaxSize * 0.18, 12);

  const remaining = boxes
    .map((box, index) => ({ box, index, volume: getBagastudioBoxVolume(box) }))
    .sort((a, b) => b.volume - a.volume);

  const seed = remaining[0]?.box;
  if (!seed) return fullBox.isEmpty() ? null : fullBox;

  const clusterBox = seed.clone();
  const used = new Set<number>([remaining[0].index]);
  let changed = true;

  while (changed) {
    changed = false;
    const expandedCluster = clusterBox.clone().expandByScalar(clusterMargin);

    remaining.forEach((item) => {
      if (used.has(item.index)) return;
      if (!expandedCluster.intersectsBox(item.box)) return;

      clusterBox.union(item.box);
      used.add(item.index);
      changed = true;
    });
  }

  return clusterBox.isEmpty() ? (fullBox.isEmpty() ? null : fullBox) : clusterBox;
}

function getBagastudioCleanSceneBox(scene: THREE.Scene) {
  const boxes: THREE.Box3[] = [];

  scene.updateMatrixWorld(true);

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.visible) return;
    if (mesh.userData?.bagastudioEdgeOverlay) return;
    if (mesh.userData?.bagastudioDebugBounds) return;
    if (String(mesh.name || "").includes("BagaStudio_Runtime_GLB_Debug")) return;

    const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
    const position = geometry?.attributes?.position;
    if (!geometry || !position || position.count < 3) return;

    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const localBox = geometry.boundingBox;
    if (!localBox || localBox.isEmpty()) return;

    const worldBox = localBox.clone().applyMatrix4(mesh.matrixWorld);
    const size = new THREE.Vector3();
    worldBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDim) || maxDim <= 0.0001) return;

    boxes.push(worldBox);
  });

  return getBagastudioPrimaryClusterBox(boxes);
}

function getBagastudioEnvironmentMeters(environment?: RoomEnvironmentSettings) {
  const readCm = (...values: any[]) => {
    const found = values.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
    return Number(found || 0) / 100;
  };

  return {
    width: readCm(environment?.roomWidthCm, (environment as any)?.width, 420),
    depth: readCm(environment?.roomDepthCm, (environment as any)?.depth, 360),
    height: readCm(environment?.roomHeightCm, (environment as any)?.height, 280),
  };
}

function buildBagastudioRoomOpeningCameraView(environment: RoomEnvironmentSettings | undefined, viewId?: string | null) {
  const viewKey = normalizeBagastudioCameraViewId(viewId);
  if (viewKey !== "front") return null;

  const room = getBagastudioEnvironmentMeters(environment);
  const halfDepth = Math.max(room.depth / 2, 1.2);
  const cameraZ = halfDepth + Math.max(room.depth * 0.42, 1.45);
  const targetZ = -Math.max(room.depth * 0.22, 0.72);
  const targetY = Math.max(Math.min(room.height * 0.46, 1.45), 1.15);

  return {
    position: [0, targetY + 0.18, cameraZ] as [number, number, number],
    target: [0, targetY, targetZ] as [number, number, number],
    up: [0, 1, 0] as [number, number, number],
    near: 0.01,
    far: Math.max(room.depth * 8, 100),
  };
}



function buildBagastudioDynamicCameraView(scene: THREE.Scene, camera: THREE.Camera, viewId = "iso") {
  const box = getBagastudioCleanSceneBox(scene);
  if (!box) return null;

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  const viewKey = normalizedViewId === "3d" ? "iso" : normalizedViewId;
  const directionByView: Record<string, THREE.Vector3> = {
    iso: new THREE.Vector3(1, 0.55, 1),
    front: new THREE.Vector3(0, 0, 1),
    back: new THREE.Vector3(0, 0, -1),
    left: new THREE.Vector3(-1, 0, 0),
    right: new THREE.Vector3(1, 0, 0),
    top: new THREE.Vector3(0, 1, 0),
  };

  const direction = (directionByView[viewKey] || directionByView.iso).clone().normalize();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const verticalFov = THREE.MathUtils.degToRad(perspectiveCamera.fov || 45);
  const aspect = Number.isFinite(perspectiveCamera.aspect) && perspectiveCamera.aspect > 0
    ? perspectiveCamera.aspect
    : 1;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);

  const maxDim = Math.max(size.x, size.y, size.z);
  const safeSize = Math.max(maxDim, 0.001);
  const padding = 1.45;

  let widthForView = size.x;
  let heightForView = size.y;

  if (viewKey === "top") {
    widthForView = size.x;
    heightForView = size.z;
  } else if (viewKey === "left" || viewKey === "right") {
    widthForView = size.z;
    heightForView = size.y;
  } else if (viewKey === "iso") {
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, safeSize * 0.5);
    const minFov = Math.min(verticalFov, horizontalFov);
    const distance = Math.max(radius / Math.sin(minFov / 2) * 1.18, safeSize * 1.35, 3);
    const position = center.clone().add(direction.multiplyScalar(distance));

    return {
      position: position.toArray() as [number, number, number],
      target: center.toArray() as [number, number, number],
      up: [0, 1, 0] as [number, number, number],
      near: Math.max(distance - safeSize * 4, 0.01),
      far: Math.max(distance + safeSize * 6, 1000),
    };
  }

  const distanceForHeight = heightForView / (2 * Math.tan(verticalFov / 2));
  const distanceForWidth = widthForView / (2 * Math.tan(horizontalFov / 2));
  const distance = Math.max(distanceForHeight, distanceForWidth, safeSize * 0.75, 3) * padding;

  const position = center.clone().add(direction.multiplyScalar(distance));
  const up = viewKey === "top" ? [0, 0, -1] : [0, 1, 0];

  return {
    position: position.toArray() as [number, number, number],
    target: center.toArray() as [number, number, number],
    up: up as [number, number, number],
    near: Math.max(distance - safeSize * 4, 0.01),
    far: Math.max(distance + safeSize * 6, 1000),
  };
}

function applyBagastudioCameraData(camera: THREE.Camera, gl: THREE.WebGLRenderer, cameraData: any) {
  applyCameraPresetToThreeCamera({
    camera,
    renderer: gl,
    preset: cameraData as BagastudioCameraPresetData,
  });
}

const BAGASTUDIO_VIEWER_CAMERA_PRESET_BACKUP_KEY_PREFIX = "bagastudio.viewer.cameraPresetBackup.";

function isBagastudioViewerCameraPresetData(value: any): value is BagastudioCameraPresetData {
  return (
    value &&
    Array.isArray(value.position) &&
    value.position.length === 3 &&
    value.position.every((item: any) => Number.isFinite(Number(item))) &&
    Array.isArray(value.target) &&
    value.target.length === 3 &&
    value.target.every((item: any) => Number.isFinite(Number(item)))
  );
}

function readBagastudioViewerCameraPresetBackup(viewId?: string | null): BagastudioCameraPresetData | null {
  if (typeof window === "undefined") return null;

  const normalizedViewId = normalizeBagastudioCameraViewId(viewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID);

  try {
    const raw = window.localStorage.getItem(`${BAGASTUDIO_VIEWER_CAMERA_PRESET_BACKUP_KEY_PREFIX}${normalizedViewId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return isBagastudioViewerCameraPresetData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeBagastudioViewerCameraPresetBackup(viewId: string, preset: BagastudioCameraPresetData) {
  if (typeof window === "undefined") return;

  const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
  if (!isBagastudioViewerCameraPresetData(preset)) return;

  try {
    window.localStorage.setItem(
      `${BAGASTUDIO_VIEWER_CAMERA_PRESET_BACKUP_KEY_PREFIX}${normalizedViewId}`,
      JSON.stringify(preset)
    );
  } catch {
    // Camera preset backup is best-effort only. The main manager still owns the feature.
  }
}

function getBagastudioPersistentCameraPreset(viewId?: string | null): BagastudioCameraPresetData | null {
  const normalizedViewId = normalizeBagastudioCameraViewId(viewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID);
  return getSavedCameraPreset(normalizedViewId) || readBagastudioViewerCameraPresetBackup(normalizedViewId);
}


function CameraController({
  activeViewId,
  views,
  environment,
}: {
  activeViewId?: string | null;
  views?: any[];
  environment?: RoomEnvironmentSettings;
}) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 1.65, 4.8], target: [0, 1.25, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    const viewId = normalizeBagastudioCameraViewId(activeViewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID);

    const selectedView = views?.find((v) => normalizeBagastudioCameraViewId(v.id) === viewId);
    const savedCameraPreset = getBagastudioPersistentCameraPreset(viewId);

    const cameraData =
      savedCameraPreset ||
      buildBagastudioRoomOpeningCameraView(environment, viewId) ||
      buildBagastudioDynamicCameraView(scene, camera, viewId) ||
      selectedView?.camera ||
      DEFAULT_CAMERA_VIEWS[viewId] ||
      DEFAULT_CAMERA_VIEWS.iso;

    applyBagastudioCameraData(camera, gl, cameraData);

    if (!savedCameraPreset) return;

    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          const reloadedPreset = getBagastudioPersistentCameraPreset(viewId);
          if (reloadedPreset) applyBagastudioCameraData(camera, gl, reloadedPreset);
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeViewId, views, camera, gl, scene, environment]);

  return null;
}

function ViewerRuntimeControls({
  activeViewId,
  views,
  productParts = [],
  environment,
}: {
  activeViewId?: string | null;
  views?: any[];
  productParts?: any[];
  environment?: RoomEnvironmentSettings;
}) {
  const { camera, gl, scene } = useThree();
  const selectedPartId = useConfigStore((state) => state.selectedPartId);
  const bagastudioActiveCameraPresetViewRef = useRef(
    normalizeBagastudioCameraViewId(activeViewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID)
  );

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 1.65, 4.8], target: [0, 1.25, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    bagastudioActiveCameraPresetViewRef.current = normalizeBagastudioCameraViewId(
      activeViewId || BAGASTUDIO_DEFAULT_OPENING_VIEW_ID
    );

    const applyCameraView = (viewId = bagastudioActiveCameraPresetViewRef.current) => {
      const normalizedViewId = normalizeBagastudioCameraViewId(viewId);
      bagastudioActiveCameraPresetViewRef.current = normalizedViewId;
      const selectedView = views?.find((v) => normalizeBagastudioCameraViewId(v.id) === normalizedViewId);
      const cameraData =
        getBagastudioPersistentCameraPreset(normalizedViewId) ||
        buildBagastudioRoomOpeningCameraView(environment, normalizedViewId) ||
        buildBagastudioDynamicCameraView(scene, camera, normalizedViewId) ||
        selectedView?.camera ||
        DEFAULT_CAMERA_VIEWS[normalizedViewId] ||
        DEFAULT_CAMERA_VIEWS.iso;

      applyBagastudioCameraData(camera, gl, cameraData);
    };

    const scheduleAutoFitCamera = (viewId = bagastudioActiveCameraPresetViewRef.current) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyCameraView(viewId);
        });
      });
    };

    const getTargetObjects = () => {
      const objects: THREE.Object3D[] = [];

      const selectedPart = productParts.find((part: any) => {
        return part.id === selectedPartId || part.meshName === selectedPartId;
      });

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;

        if (!selectedPartId) {
          objects.push(mesh);
          return;
        }

        const objectName = String(mesh.name || "");
        const selectedMeshName = String(selectedPart?.meshName || "");
        const selectedId = String(selectedPartId || "");

        if (
          objectName === selectedId ||
          objectName === selectedMeshName ||
          objectName.includes(selectedMeshName) ||
          objectName.includes(selectedId)
        ) {
          objects.push(mesh);
        }
      });

      return objects;
    };

    const focusObjects = () => {
      const objects = getTargetObjects();
      if (!objects.length) return;

      const box = new THREE.Box3();
      objects.forEach((object) => box.expandByObject(object));

      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      const maxSize = Math.max(size.x, size.y, size.z);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov || 45);
      const aspect = Number.isFinite(perspectiveCamera.aspect) && perspectiveCamera.aspect > 0
        ? perspectiveCamera.aspect
        : 1;
      const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
      const minFov = Math.min(fov, horizontalFov);
      const distance = Math.max(
        Math.max(sphere.radius, maxSize * 0.5) / Math.sin(minFov / 2) * 1.15,
        maxSize * 1.25,
        4
      );

      camera.position.set(
        center.x + distance,
        center.y + distance * 0.45,
        center.z + distance
      );
      camera.lookAt(center);
      perspectiveCamera.near = Math.max(distance - Math.max(maxSize, 0.001) * 4, 0.01);
      perspectiveCamera.far = Math.max(distance + Math.max(maxSize, 0.001) * 6, 1000);
      perspectiveCamera.updateProjectionMatrix();

      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      if (controls?.target) {
        controls.target.copy(center);
        controls.update?.();
      }
    };

    const downloadScreenshot = () => {
      requestAnimationFrame(() => {
        const link = document.createElement("a");
        link.download = `bagastudio-render-${Date.now()}.png`;
        link.href = gl.domElement.toDataURL("image/png");
        link.click();
      });
    };

    const generateProductThumbnail = (download = false) => {
      requestAnimationFrame(() => {
        const sourceCanvas = gl.domElement;
        const size = 512;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(sourceCanvas, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/png");

        (window as any).__bagastudioLastProductThumbnail = {
          generatedAt: new Date().toISOString(),
          width: size,
          height: size,
          type: "image/png",
          dataUrl,
        };

        window.dispatchEvent(
          new CustomEvent("bagastudio:product-thumbnail-ready", {
            detail: (window as any).__bagastudioLastProductThumbnail,
          })
        );

        if (download) {
          const link = document.createElement("a");
          link.download = `bagastudio-product-thumbnail-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      });
    };

    const orbitCameraBy = (yawRadians = 0, pitchRadians = 0) => {
      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      const cleanBox = getBagastudioCleanSceneBox(scene);
      const target = controls?.target?.clone?.() || (() => {
        if (!cleanBox) return new THREE.Vector3(0, 0, 0);
        const center = new THREE.Vector3();
        cleanBox.getCenter(center);
        return center;
      })();

      const offset = camera.position.clone().sub(target);
      if (offset.lengthSq() < 0.0001) return;

      if (yawRadians) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);
      }

      if (pitchRadians) {
        const direction = camera.position.clone().sub(target).normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
        if (right.lengthSq() > 0.0001) {
          offset.applyAxisAngle(right, pitchRadians);
        }
      }

      camera.position.copy(target.clone().add(offset));
      camera.lookAt(target);

      if (controls?.target) {
        controls.target.copy(target);
        controls.update?.();
      }
    };

    const handleReset = () => applyCameraView("iso");
    const handleAutoFit = () => scheduleAutoFitCamera(bagastudioActiveCameraPresetViewRef.current);
    const handleSaveCameraPreset = (event: Event) => {
      const detail = (event as CustomEvent<{ viewId?: string }>).detail || {};
      const viewId = normalizeBagastudioCameraViewId(detail.viewId || bagastudioActiveCameraPresetViewRef.current);
      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      const target = controls?.target?.clone?.() || (() => {
        const cleanBox = getBagastudioCleanSceneBox(scene);
        if (!cleanBox) return new THREE.Vector3(0, 0, 0);
        const center = new THREE.Vector3();
        cleanBox.getCenter(center);
        return center;
      })();
      const savedPreset = saveThreeCameraPreset({ viewId, camera, target });
      writeBagastudioViewerCameraPresetBackup(viewId, savedPreset);
    };
    const handleApplyCameraPreset = (event: Event) => {
      const detail = (event as CustomEvent<{ viewId?: string }>).detail || {};
      applyCameraView(normalizeBagastudioCameraViewId(detail.viewId || bagastudioActiveCameraPresetViewRef.current));
    };
    const handleFocus = () => focusObjects();
    const handleOrbitLeft = () => orbitCameraBy(-Math.PI / 14, 0);
    const handleOrbitRight = () => orbitCameraBy(Math.PI / 14, 0);
    const handleOrbitUp = () => orbitCameraBy(0, -Math.PI / 18);
    const handleOrbitDown = () => orbitCameraBy(0, Math.PI / 18);
    const handleScreenshot = () => downloadScreenshot();
    const handleThumbnail = () => generateProductThumbnail(false);
    const handleThumbnailDownload = () => generateProductThumbnail(true);

    (window as any).bagastudioGenerateProductThumbnail = handleThumbnail;
    (window as any).bagastudioDownloadProductThumbnail = handleThumbnailDownload;

    window.addEventListener("bagastudio:reset-camera", handleReset);
    window.addEventListener("bagastudio:autofit-camera", handleAutoFit);
    window.addEventListener("bagastudio:save-camera-preset", handleSaveCameraPreset);
    window.addEventListener("bagastudio:apply-camera-preset", handleApplyCameraPreset);
    window.addEventListener("bagastudio:viewer-runtime-model-loaded", handleAutoFit);
    window.addEventListener("bagastudio:viewer-components-ready", handleAutoFit);
    window.addEventListener("bagastudio:focus-selection", handleFocus);
    window.addEventListener("bagastudio:camera-orbit-left", handleOrbitLeft);
    window.addEventListener("bagastudio:camera-orbit-right", handleOrbitRight);
    window.addEventListener("bagastudio:camera-orbit-up", handleOrbitUp);
    window.addEventListener("bagastudio:camera-orbit-down", handleOrbitDown);
    window.addEventListener("bagastudio:screenshot", handleScreenshot);
    window.addEventListener("bagastudio:generate-thumbnail", handleThumbnail);
    window.addEventListener("bagastudio:download-thumbnail", handleThumbnailDownload);

    return () => {
      window.removeEventListener("bagastudio:reset-camera", handleReset);
      window.removeEventListener("bagastudio:autofit-camera", handleAutoFit);
      window.removeEventListener("bagastudio:save-camera-preset", handleSaveCameraPreset);
      window.removeEventListener("bagastudio:apply-camera-preset", handleApplyCameraPreset);
      window.removeEventListener("bagastudio:viewer-runtime-model-loaded", handleAutoFit);
      window.removeEventListener("bagastudio:viewer-components-ready", handleAutoFit);
      window.removeEventListener("bagastudio:focus-selection", handleFocus);
      window.removeEventListener("bagastudio:camera-orbit-left", handleOrbitLeft);
      window.removeEventListener("bagastudio:camera-orbit-right", handleOrbitRight);
      window.removeEventListener("bagastudio:camera-orbit-up", handleOrbitUp);
      window.removeEventListener("bagastudio:camera-orbit-down", handleOrbitDown);
      window.removeEventListener("bagastudio:screenshot", handleScreenshot);
      window.removeEventListener("bagastudio:generate-thumbnail", handleThumbnail);
      window.removeEventListener("bagastudio:download-thumbnail", handleThumbnailDownload);

      delete (window as any).bagastudioGenerateProductThumbnail;
      delete (window as any).bagastudioDownloadProductThumbnail;
    };
  }, [activeViewId, views, camera, gl, scene, selectedPartId, productParts, environment]);

  return null;
}


function getRuntimePlaceholderBucket(component: any) {
  const source = [
    component?.category,
    component?.componentCategory,
    component?.runtimeRole,
    component?.partId,
    component?.displayName,
    component?.name,
    component?.meshName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("top") || source.includes("cielo") || source.includes("piano")) return "TOP";
  if (source.includes("side") || source.includes("fianco") || source.includes("lato")) return "SIDE";
  if (source.includes("back") || source.includes("retro") || source.includes("schiena")) return "BACK";
  if (source.includes("shelf") || source.includes("ripiano") || source.includes("mensola")) return "SHELF";
  if (source.includes("front") || source.includes("frontale") || source.includes("anta")) return "FRONT";
  if (source.includes("base") || source.includes("fondo") || source.includes("zoccolo") || source.includes("plinth")) return "BASE";
  if (source.includes("hardware") || source.includes("ferramenta") || source.includes("cerniera") || source.includes("guida")) return "HARDWARE";

  return "OTHER";
}

function getRuntimePlaceholderBucketConfig(bucket: string) {
  const configs: Record<
    string,
    {
      origin: [number, number, number];
      color: string;
      width: number;
      height: number;
      depth: number;
    }
  > = {
    TOP: {
      origin: [-520, 115, -420],
      color: "#38bdf8",
      width: 70,
      height: 5,
      depth: 38,
    },
    SIDE: {
      origin: [-520, 72, -520],
      color: "#22c55e",
      width: 8,
      height: 58,
      depth: 40,
    },
    BACK: {
      origin: [-520, 48, -620],
      color: "#f59e0b",
      width: 72,
      height: 45,
      depth: 5,
    },
    SHELF: {
      origin: [-520, 28, -720],
      color: "#a78bfa",
      width: 66,
      height: 4,
      depth: 32,
    },
    FRONT: {
      origin: [460, 58, -420],
      color: "#ef4444",
      width: 62,
      height: 42,
      depth: 5,
    },
    BASE: {
      origin: [460, 12, -520],
      color: "#eab308",
      width: 68,
      height: 8,
      depth: 36,
    },
    HARDWARE: {
      origin: [460, 88, -620],
      color: "#f97316",
      width: 14,
      height: 14,
      depth: 14,
    },
    OTHER: {
      origin: [460, 32, -720],
      color: "#94a3b8",
      width: 42,
      height: 12,
      depth: 24,
    },
  };

  return configs[bucket] || configs.OTHER;
}

function buildRuntimePlaceholderGeometry(component: any, index: number, bucketIndex = index) {
  const bucket = getRuntimePlaceholderBucket(component);
  const config = getRuntimePlaceholderBucketConfig(bucket);

  const columns = 6;
  const column = bucketIndex % columns;
  const row = Math.floor(bucketIndex / columns);

  const spacingX = 82;
  const spacingY = 18;
  const spacingZ = 42;

  return {
    bucket,
    width: config.width,
    height: config.height,
    depth: config.depth,
    color: config.color,
    position: [
      config.origin[0] + column * spacingX,
      config.origin[1] + row * spacingY,
      config.origin[2] - row * spacingZ,
    ] as [number, number, number],
  };
}

export default function Viewer3D({
  width,
  height,
  depth,
  materials,
  productMaterials,
  accessories,
  inserts,
  insertMaterials,
  insertSizes = {},
  visibility,
  productModel,
  productModelFormat,
  importedModelName,
  productParts,
  views = [],
  activeViewId,
  ledIntensity,
  woodDirection,
  xRayEnabled = false,
  xRayOpacity = 0.35,
  onToggleXRay,
  onChangeXRayOpacity,
  modelEdgesEnabled = true,
  environment,
}: Viewer3DProps) {
  const materialsSource =
productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;
  const ledKelvin = useConfigStore((state) => state.ledKelvin);
  const ledIntensityStore = useConfigStore((state) => state.ledIntensity);
  const lastSelectionWasMultiRef = useRef(false);
  const selectedRuntimePartId = useConfigStore((state) => state.selectedPartId);
  const setRuntimeSelectedPartId = useConfigStore((state) => state.setSelectedPart);
  const [viewerMode, setViewerMode] = useState<"select" | "pan" | "orbit">("select");
  const [viewerRuntimeComponents, setViewerRuntimeComponents] = useState<BagaStudioRuntimeComponent[]>([]);
  const [viewerModelEdgesEnabled, setViewerModelEdgesEnabled] = useState(modelEdgesEnabled);
  // Scene Composer Foundation V38:
  // mantiene il controllo singolo validato in V37, ma introduce la struttura dati
  // per gestire più moduli/prodotti nella stessa stanza senza toccare import/scaling.
  const normalizeModuleDimensionCmV1 = (value: any, fallback: number, min = 5, max = 1200) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.round(THREE.MathUtils.clamp(parsed, min, max));
  };

  const getDefaultSceneModuleDimensionsV1 = () => ({
    width: normalizeModuleDimensionCmV1(width, 180),
    height: normalizeModuleDimensionCmV1(height, 100),
    depth: normalizeModuleDimensionCmV1(depth, 60),
  });

  const createSceneModuleV38 = (overrides: any = {}) => ({
    id: overrides.id || `scene-module-${Date.now()}`,
    name: overrides.name || "Modulo 1",
    source: overrides.source || {},
    dimensions: {
      ...getDefaultSceneModuleDimensionsV1(),
      ...(overrides.dimensions || {}),
    },
    shape: overrides.shape || "box",
    transform: {
      x: Number(overrides.transform?.x ?? 0),
      z: Number(overrides.transform?.z ?? -0.62),
      rotationYDeg: Number(overrides.transform?.rotationYDeg ?? 0),
      activeWallSnap: overrides.transform?.activeWallSnap ?? null,
    },
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [modelSceneOffset, setModelSceneOffset] = useState({ x: 0, z: -0.62, rotationYDeg: 0 });
  const [activeWallSnap, setActiveWallSnap] = useState<"back" | "front" | "left" | "right" | "center" | null>(null);
  const [wallSnapDistanceMode, setWallSnapDistanceMode] = useState<"touch" | "5" | "10" | "custom">("touch");
  const [customWallSnapDistanceCm, setCustomWallSnapDistanceCm] = useState(1);
  const [wallSnapNotice, setWallSnapNotice] = useState("");
  const [wallCollisionNotice, setWallCollisionNotice] = useState("");
  const [moduleCollisionNoticeV42, setModuleCollisionNoticeV42] = useState(false);
  const moduleCollisionNoticeTimeoutV42 = useRef<number | null>(null);
  // Module UX V2.6.7: la stanza puo' nascere vuota.
  // I moduli parametrici e il DAE importato entrano in sceneModulesV38 solo quando esistono davvero.
  const [sceneModulesV38, setSceneModulesV38] = useState<any[]>(() => []);
  const [activeSceneModuleIdV38, setActiveSceneModuleIdV38] = useState<string | null>(null);
  const [joinAssistantOpenV42, setJoinAssistantOpenV42] = useState(false);
  const [joinAssistantPosition, setJoinAssistantPosition] = useState({ left: 450, top: 253 });
  const [candidateSceneModuleStatusV42, setCandidateSceneModuleStatusV42] =
    useState<SceneModuleCollisionStatusV42 | null>(null);
  const candidateSceneModuleCollisionTimeoutV42 = useRef<number | null>(null);
  const [viewerMiniTabsOpenV5, setViewerMiniTabsOpenV5] = useState<Record<ViewerMiniTabId, boolean>>({
    room: false,
    module: false,
    view: false,
    join: false,
    quotes: false,
    help: false,
  });
  const closeAllViewerMiniTabsV5 = () => ({
    room: false,
    module: false,
    view: false,
    join: false,
    quotes: false,
    help: false,
  });

  const toggleViewerMiniTabV5 = (id: ViewerMiniTabId) => {
    setViewerMiniTabsOpenV5((current) => ({
      ...closeAllViewerMiniTabsV5(),
      [id]: !current[id],
    }));
  };

  const activeSceneModuleV1 = useMemo(
    () => sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || sceneModulesV38[0] || null,
    [sceneModulesV38, activeSceneModuleIdV38]
  );

  const activeSceneModuleDimensionsV1 = useMemo(() => {
    const fallback = getDefaultSceneModuleDimensionsV1();
    const dimensions = activeSceneModuleV1?.dimensions || {};
    return {
      width: normalizeModuleDimensionCmV1(dimensions.width, fallback.width),
      height: normalizeModuleDimensionCmV1(dimensions.height, fallback.height),
      depth: normalizeModuleDimensionCmV1(dimensions.depth, fallback.depth),
      thickness: normalizeModuleDimensionCmV1(dimensions.thickness, 1.8, 0.6, 6),
    };
  }, [activeSceneModuleV1, width, height, depth]);

  const isParametricSceneModuleV1 = (module: any) => module?.source?.kind === "parametric-module-v1";
  const isImportedSceneModuleV267 = (module: any) => module?.source?.kind === "imported-product-v1";
  const activeSceneModuleIsParametricV1 = isParametricSceneModuleV1(activeSceneModuleV1);
  const importedSceneModulesV1 = useMemo(
    () => sceneModulesV38.filter((module: any) => isImportedSceneModuleV267(module)),
    [sceneModulesV38]
  );
  const parametricSceneModulesV1 = useMemo(
    () => sceneModulesV38.filter((module: any) => isParametricSceneModuleV1(module)),
    [sceneModulesV38]
  );
  const activeImportedSceneModuleForRenderV1 = useMemo(
    () =>
      importedSceneModulesV1.find((module: any) => module.id === activeSceneModuleIdV38) ||
      importedSceneModulesV1[0] ||
      null,
    [importedSceneModulesV1, activeSceneModuleIdV38]
  );

  const updateActiveSceneModuleDimensionV1 = (key: "width" | "height" | "depth", value: any) => {
    const fallback = activeSceneModuleDimensionsV1[key];
    const nextValue = normalizeModuleDimensionCmV1(value, fallback);
    const nextDimensions = {
      ...activeSceneModuleDimensionsV1,
      [key]: nextValue,
    };

    setSceneModulesV38((current) =>
      current.map((module: any) =>
        module.id === activeSceneModuleIdV38
          ? {
              ...module,
              dimensions: nextDimensions,
              updatedAt: new Date().toISOString(),
            }
          : module
      )
    );

    if (!activeSceneModuleIsParametricV1) {
      const clampedTransform = normalizeSceneTransformV42(
        clampModelSceneTransform(modelSceneOffset, activeWallSnap)
      );
      setModelSceneOffset(clampedTransform);
    }
  };

  const [moduleDraftDimensionsV2, setModuleDraftDimensionsV2] = useState(() => getDefaultSceneModuleDimensionsV1());

  const updateModuleDraftDimensionV2 = (key: "width" | "height" | "depth", value: any) => {
    setModuleDraftDimensionsV2((current) => ({
      ...current,
      [key]: normalizeModuleDimensionCmV1(value, current[key] || getDefaultSceneModuleDimensionsV1()[key]),
    }));
  };

  const copyActiveModuleToDraftV2 = () => {
    setModuleDraftDimensionsV2({
      width: activeSceneModuleDimensionsV1.width,
      depth: activeSceneModuleDimensionsV1.depth,
      height: activeSceneModuleDimensionsV1.height,
    });
  };

  const applyDraftDimensionsToActiveModuleV2 = () => {
    if (!activeSceneModuleIdV38 || !activeSceneModuleIsParametricV1) {
      setWallSnapNotice("Seleziona un modulo parametrico prima di applicare le misure");
      window.setTimeout(() => setWallSnapNotice(""), 2200);
      return;
    }

    const nextDimensions = {
      ...activeSceneModuleDimensionsV1,
      ...moduleDraftDimensionsV2,
    };
    const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || null;
    const previousTransform = normalizeSceneTransformV42(activeModule?.transform || modelSceneOffset);
    const roomHeightCm = Math.max(1, Number(baseRoomEnvironment?.roomHeightCm || 280));
    if (
      !canSceneModuleDimensionsFitRoomV262(nextDimensions, previousTransform.rotationYDeg) ||
      Number(nextDimensions.height || 0) > roomHeightCm
    ) {
      setWallCollisionNotice("Modulo troppo grande per la stanza: modifica bloccata");
      window.setTimeout(() => setWallCollisionNotice(""), 2600);
      return;
    }
    const nextTransform = normalizeSceneTransformV42(
      clampModelSceneTransform(previousTransform, null, nextDimensions)
    );
    if (!isSceneModuleTransformInsideRoomV262(nextTransform, nextDimensions)) {
      setWallCollisionNotice("Modulo troppo grande per la stanza: modifica bloccata");
      window.setTimeout(() => setWallCollisionNotice(""), 2600);
      return;
    }

    setSceneModulesV38((current) =>
      current.map((module: any) =>
        module.id === activeSceneModuleIdV38
          ? {
              ...module,
              dimensions: nextDimensions,
              transform: {
                ...module.transform,
                ...nextTransform,
              },
              updatedAt: new Date().toISOString(),
            }
          : module
      )
    );

    if (!activeSceneModuleIsParametricV1) {
      const clampedTransform = normalizeSceneTransformV42(
        clampModelSceneTransform(modelSceneOffset, activeWallSnap)
      );
      setModelSceneOffset(clampedTransform);
    }
  };

  const componentRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [runtimeImportedModel, setRuntimeImportedModel] = useState<{
    url: string;
    format: string;
    name?: string;
    size?: number;
    dimensions?: { width?: number; height?: number; depth?: number } | null;
    importedAt?: string;
  } | null>(null);
  const runtimeImportedModelRef = useRef<{
    url: string;
    format: string;
    name?: string;
    dimensions?: { width?: number; height?: number; depth?: number } | null;
  } | null>(null);
  const [importCalibration, setImportCalibration] = useState<ImportCalibrationSettings>(DEFAULT_IMPORT_CALIBRATION);
  const [scaleDiagnosticsV8, setScaleDiagnosticsV8] = useState<any | null>(null);
  const [roomQuickVisibility, setRoomQuickVisibility] = useState({
    backWall: true,
    leftWall: true,
    rightWall: true,
    ceiling: true,
  });
  const [roomVisible, setRoomVisible] = useState(true);
  const [roomPanelEnvironment, setRoomPanelEnvironment] = useState<RoomEnvironmentSettings | null>(null);

  const baseRoomEnvironment = useMemo<RoomEnvironmentSettings | undefined>(() => {
    if (!environment && !roomPanelEnvironment) return undefined;

    return {
      ...(environment || {}),
      ...(roomPanelEnvironment || {}),
    };
  }, [environment, roomPanelEnvironment]);

  const effectiveEnvironment = useMemo<RoomEnvironmentSettings | undefined>(() => {
    if (!baseRoomEnvironment) return baseRoomEnvironment;

    return {
      ...baseRoomEnvironment,
      showBackWall: baseRoomEnvironment.showBackWall !== false && roomQuickVisibility.backWall,
      showLeftWall: baseRoomEnvironment.showLeftWall !== false && roomQuickVisibility.leftWall,
      showRightWall: baseRoomEnvironment.showRightWall !== false && roomQuickVisibility.rightWall,
      showCeiling: roomQuickVisibility.ceiling,
    };
  }, [baseRoomEnvironment, roomQuickVisibility]);

  const applyRoomPanelSettings = (settings: {
    roomWidthCm: number;
    roomDepthCm: number;
    roomHeightCm: number;
    baseboardHeightCm?: number;
    baseboardDepthCm?: number;
  }) => {
    setRoomPanelEnvironment((current) => ({
      ...(environment || {}),
      ...(current || {}),
      roomWidthCm: settings.roomWidthCm,
      roomDepthCm: settings.roomDepthCm,
      roomHeightCm: settings.roomHeightCm,
    }));
  };

  const resetRoomPanelSettings = () => {
    setRoomPanelEnvironment(null);
    setRoomVisible(true);
    resetRoomQuickVisibility();
  };

  const toggleRoomQuickVisibility = (key: keyof typeof roomQuickVisibility) => {
    setRoomQuickVisibility((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetRoomQuickVisibility = () => {
    setRoomQuickVisibility({
      backWall: true,
      leftWall: true,
      rightWall: true,
      ceiling: true,
    });
  };

  const updateImportCalibration = (key: keyof ImportCalibrationSettings, value: string) => {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) return;

    setImportCalibration((current) => ({
      ...current,
      [key]:
        key === "scale"
          ? Math.max(0.01, parsedValue)
          : key === "realWidthCm"
            ? Math.max(0, parsedValue)
            : parsedValue,
    }));
  };

  const resetImportCalibration = () => {
    setImportCalibration(DEFAULT_IMPORT_CALIBRATION);
  };

  const getRoomInteriorBoundsMeters = () => {
    const roomWidth = Math.max(2.8, Number(baseRoomEnvironment?.roomWidthCm || 420) / 100);
    const roomDepth = Math.max(2.8, Number(baseRoomEnvironment?.roomDepthCm || 360) / 100);

    // V42.5.4 Snap Parete reale:
    // il limite interno della stanza deve coincidere con la faccia visibile della parete.
    // Nessun cuscinetto nascosto: se l'utente sceglie Appoggiato, il modulo deve toccare la parete.
    return {
      left: -roomWidth / 2,
      right: roomWidth / 2,
      back: -roomDepth / 2,
      front: roomDepth / 2,
      centerZ: -0.18,
    };
  };

  const getSceneModelLocalBoundsMeters = (dimensionsOverride?: any) => {
    // V42.5.12 Wall Collision Foundation:
    // lo snap/clamp deve usare lo stesso ingombro che vede il Viewer, non solo le dimensioni dichiarate.
    // Il modello viene renderizzato dentro <Center disableY>, con axis correction e importedModelDisplayScale:
    // qui ricostruiamo quel box reale e lo recentriamo in X/Z come fa Center.
    // V42.5.13 Hotfix:
    // non usiamo variabili locali del renderer 3D (scene/importedModelDisplayScale) fuori scope.
    // L’ingombro viene letto dai diagnostics già esistenti, così compila e resta coerente col Viewer.

    const axisCorrectedViewerBounds = scaleDiagnosticsV8?.axisCorrectedViewerBounds || null;
    const axisCorrectedViewerUnits = scaleDiagnosticsV8?.axisCorrectedViewerUnits || {};
    const finalViewerUnits = scaleDiagnosticsV8?.finalViewerUnits || {};
    const finalEstimatedCm = scaleDiagnosticsV8?.finalEstimatedCm || {};

    const hasRealVisualBounds =
      axisCorrectedViewerBounds &&
      Number.isFinite(Number(axisCorrectedViewerBounds.minX)) &&
      Number.isFinite(Number(axisCorrectedViewerBounds.maxX)) &&
      Number.isFinite(Number(axisCorrectedViewerBounds.minZ)) &&
      Number.isFinite(Number(axisCorrectedViewerBounds.maxZ));

    const sceneDimensions = dimensionsOverride || activeSceneModuleDimensionsV1;
    const parametricWidthM = Math.max(0.18, Number(sceneDimensions.width || width || 180) / 100);
    const parametricDepthM = Math.max(0.18, Number(sceneDimensions.depth || depth || 60) / 100);

    // Modulo Parametrico V1:
    // quando la scheda MODULO cambia larghezza/profondità, collisioni, snap e limiti stanza
    // devono usare l'ingombro parametrico scelto dall'utente, non solo la bbox del DAE.
    // V640: usa i bounds parametrici solo per moduli parametrici reali/selezionati.
    // Il DAE/import principale deve invece usare i bounds visuali reali, altrimenti può uscire da SX/DX.
    const shouldUseParametricBoundsV640 = Boolean(dimensionsOverride || (activeSceneModuleIdV38 && activeSceneModuleIsParametricV1));

    if (shouldUseParametricBoundsV640) {
      return {
        minX: -parametricWidthM / 2,
        maxX: parametricWidthM / 2,
        minZ: -parametricDepthM / 2,
        maxZ: parametricDepthM / 2,
      };
    }

    if (hasRealVisualBounds) {
      const visualWidthM = Math.max(
        0.18,
        Number(axisCorrectedViewerBounds.maxX) - Number(axisCorrectedViewerBounds.minX)
      );
      const visualDepthM = Math.max(
        0.18,
        Number(axisCorrectedViewerBounds.maxZ) - Number(axisCorrectedViewerBounds.minZ)
      );

      return {
        minX: -visualWidthM / 2,
        maxX: visualWidthM / 2,
        minZ: -visualDepthM / 2,
        maxZ: visualDepthM / 2,
      };
    }

    const baseWidthM = Math.max(
      0.18,
      Number(axisCorrectedViewerUnits.width || finalViewerUnits.width || 0) ||
        Number(finalEstimatedCm.width || width || 180) / 100
    );
    const baseDepthM = Math.max(
      0.18,
      Number(axisCorrectedViewerUnits.depth || finalViewerUnits.depth || 0) ||
        Number(finalEstimatedCm.depth || depth || 60) / 100
    );

    return {
      minX: -baseWidthM / 2,
      maxX: baseWidthM / 2,
      minZ: -baseDepthM / 2,
      maxZ: baseDepthM / 2,
    };
  };

  const getSceneModelRotatedBoundsMeters = (rotationYDeg = modelSceneOffset.rotationYDeg || 0, dimensionsOverride?: any) => {
    const localBounds = getSceneModelLocalBoundsMeters(dimensionsOverride);
    const calibrationScale = Math.max(0.01, Number(importCalibration?.scale || 1));
    const totalRotationYDeg = Number(importCalibration?.rotationYDeg || 0) + Number(rotationYDeg || 0);
    const radians = THREE.MathUtils.degToRad(THREE.MathUtils.euclideanModulo(totalRotationYDeg, 360));
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const corners = [
      { x: localBounds.minX * calibrationScale, z: localBounds.minZ * calibrationScale },
      { x: localBounds.minX * calibrationScale, z: localBounds.maxZ * calibrationScale },
      { x: localBounds.maxX * calibrationScale, z: localBounds.minZ * calibrationScale },
      { x: localBounds.maxX * calibrationScale, z: localBounds.maxZ * calibrationScale },
    ].map((corner) => ({
      x: corner.x * cos - corner.z * sin,
      z: corner.x * sin + corner.z * cos,
    }));

    return {
      minX: Math.min(...corners.map((corner) => corner.x)),
      maxX: Math.max(...corners.map((corner) => corner.x)),
      minZ: Math.min(...corners.map((corner) => corner.z)),
      maxZ: Math.max(...corners.map((corner) => corner.z)),
    };
  };

  const getSceneModelFootprintMeters = (rotationYDeg = modelSceneOffset.rotationYDeg || 0) => {
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg);

    return {
      width: Math.max(0.18, rotatedBounds.maxX - rotatedBounds.minX),
      depth: Math.max(0.18, rotatedBounds.maxZ - rotatedBounds.minZ),
    };
  };

  type SceneModuleCollisionStatusV42 = "ok" | "join" | "collision";
  type SceneTransformV42 = { x: number; z: number; rotationYDeg: number };

  const normalizeSceneTransformV42 = (transform: { x?: number; z?: number; rotationYDeg?: number }): SceneTransformV42 => ({
    x: Number(transform.x || 0),
    z: Number(transform.z || 0),
    rotationYDeg: Number(transform.rotationYDeg || 0),
  });

  const getSceneModuleBoundsV42 = (
    transform: { x?: number; z?: number; rotationYDeg?: number } = {},
    dimensionsOverride?: any
  ) => {
    const rotationYDeg = Number(transform.rotationYDeg || 0);
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg, dimensionsOverride);
    const x = Number(transform.x || 0);
    const z = Number(transform.z || 0);

    return {
      left: x + rotatedBounds.minX,
      right: x + rotatedBounds.maxX,
      back: z + rotatedBounds.minZ,
      front: z + rotatedBounds.maxZ,
    };
  };

  const isSceneModuleTransformInsideRoomV262 = (
    transform: { x?: number; z?: number; rotationYDeg?: number } = {},
    dimensionsOverride?: any
  ) => {
    const roomBounds = getRoomInteriorBoundsMeters();
    const moduleBounds = getSceneModuleBoundsV42(transform, dimensionsOverride);
    return (
      moduleBounds.left >= roomBounds.left - 0.001 &&
      moduleBounds.right <= roomBounds.right + 0.001 &&
      moduleBounds.back >= roomBounds.back - 0.001 &&
      moduleBounds.front <= roomBounds.front + 0.001
    );
  };

  const canSceneModuleDimensionsFitRoomV262 = (dimensionsOverride?: any, rotationYDeg = 0) => {
    const roomBounds = getRoomInteriorBoundsMeters();
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg, dimensionsOverride);
    const moduleWidth = Math.max(0, rotatedBounds.maxX - rotatedBounds.minX);
    const moduleDepth = Math.max(0, rotatedBounds.maxZ - rotatedBounds.minZ);
    return (
      moduleWidth <= roomBounds.right - roomBounds.left + 0.001 &&
      moduleDepth <= roomBounds.front - roomBounds.back + 0.001
    );
  };

  const doSceneModuleBoundsIntersectV42 = (
    a: ReturnType<typeof getSceneModuleBoundsV42>,
    b: ReturnType<typeof getSceneModuleBoundsV42>
  ) => {
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapZ = Math.min(a.front, b.front) - Math.max(a.back, b.back);
    return {
      overlapX,
      overlapZ,
      intersects: overlapX > 0.005 && overlapZ > 0.005,
    };
  };

  const getSceneModuleCollisionMapV42 = (
    modules: any[] = sceneModulesV38,
    activeTransform: { x?: number; z?: number; rotationYDeg?: number } = modelSceneOffset
  ) => {
    const collisionMap = new Map<string, SceneModuleCollisionStatusV42>();
    const joinTolerance = 0.03;
    const boxes = modules.map((module: any) => {
      const transform = module?.id === activeSceneModuleIdV38 ? activeTransform : module?.transform || {};
      const dimensions = module?.id === activeSceneModuleIdV38 ? activeSceneModuleDimensionsV1 : module?.dimensions;
      return {
        id: String(module.id),
        ...getSceneModuleBoundsV42(transform, dimensions),
      };
    });

    boxes.forEach((box) => collisionMap.set(box.id, "ok"));

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const { overlapX, overlapZ, intersects } = doSceneModuleBoundsIntersectV42(a, b);
        const nearlyJoined =
          !intersects &&
          (
            (Math.abs(a.right - b.left) <= joinTolerance || Math.abs(b.right - a.left) <= joinTolerance) &&
            overlapZ > -joinTolerance
          ||
            (Math.abs(a.front - b.back) <= joinTolerance || Math.abs(b.front - a.back) <= joinTolerance) &&
            overlapX > -joinTolerance
          );

        if (intersects) {
          collisionMap.set(a.id, "collision");
          collisionMap.set(b.id, "collision");
        } else if (nearlyJoined) {
          if (collisionMap.get(a.id) !== "collision") collisionMap.set(a.id, "join");
          if (collisionMap.get(b.id) !== "collision") collisionMap.set(b.id, "join");
        }

        const distanceX = Math.min(Math.abs(a.right - b.left), Math.abs(b.right - a.left));
        const distanceZ = Math.min(Math.abs(a.front - b.back), Math.abs(b.front - a.back));
        const nearX = distanceX <= joinTolerance && overlapZ > -joinTolerance;
        const nearZ = distanceZ <= joinTolerance && overlapX > -joinTolerance;
        const finalStatus =
          collisionMap.get(a.id) === "collision" || collisionMap.get(b.id) === "collision"
            ? "collision"
            : collisionMap.get(a.id) === "join" || collisionMap.get(b.id) === "join"
              ? "join"
              : "ok";
      }
    }

    return collisionMap;
  };

  const resolveSceneModuleCollisionV42 = (
    candidateTransform: SceneTransformV42,
    previousTransform: SceneTransformV42,
    modules: any[] = sceneModulesV38
  ) => {
    const activeId = String(activeSceneModuleIdV38 || "");
    const normalizedCandidate = normalizeSceneTransformV42(candidateTransform);
    const finalStatus = getSceneModuleCollisionMapV42(modules, normalizedCandidate).get(activeId);
    return finalStatus === "collision"
      ? normalizeSceneTransformV42(previousTransform)
      : normalizedCandidate;
  };

  const findSceneModuleDuplicateTransformV42 = (sourceTransform: SceneTransformV42, dimensionsOverride?: any): SceneTransformV42 | null => {
    const sourceBounds = getSceneModuleBoundsV42(sourceTransform, dimensionsOverride);
    const moduleWidth = Math.max(0.2, sourceBounds.right - sourceBounds.left);
    const moduleDepth = Math.max(0.2, sourceBounds.front - sourceBounds.back);
    const joinGap = 0.06;
    const searchStep = 0.18;

    const isCandidateInvalid = (candidate: SceneTransformV42) => {
      const candidateDimensions = dimensionsOverride || activeSceneModuleDimensionsV1;
      if (!isSceneModuleTransformInsideRoomV262(candidate, candidateDimensions)) return true;
      const candidateBounds = getSceneModuleBoundsV42(candidate, candidateDimensions);
      return sceneModulesV38.some((module: any) => {
        if (!module) return false;
        const moduleBounds = getSceneModuleBoundsV42(module.transform || {}, module.dimensions);
        return doSceneModuleBoundsIntersectV42(candidateBounds, moduleBounds).intersects;
      });
    };

    const baseCandidates: SceneTransformV42[] = [
      { ...sourceTransform, x: sourceTransform.x + moduleWidth + joinGap },
      { ...sourceTransform, x: sourceTransform.x - moduleWidth - joinGap },
      { ...sourceTransform, z: sourceTransform.z + moduleDepth + joinGap },
      { ...sourceTransform, z: sourceTransform.z - moduleDepth - joinGap },
      { ...sourceTransform, x: sourceTransform.x + moduleWidth + joinGap, z: sourceTransform.z + moduleDepth + joinGap },
      { ...sourceTransform, x: sourceTransform.x - moduleWidth - joinGap, z: sourceTransform.z + moduleDepth + joinGap },
      { ...sourceTransform, x: sourceTransform.x + moduleWidth + joinGap, z: sourceTransform.z - moduleDepth - joinGap },
      { ...sourceTransform, x: sourceTransform.x - moduleWidth - joinGap, z: sourceTransform.z - moduleDepth - joinGap },
    ].map((candidate) => normalizeSceneTransformV42(clampModelSceneTransform(candidate, null, dimensionsOverride)));

    for (const candidate of baseCandidates) {
      if (!isCandidateInvalid(candidate)) return candidate;
    }

    const searchRadii = [1, 2, 3, 4, 5, 6];
    for (const radius of searchRadii) {
      const offset = radius * searchStep;
      const fallbackCandidates = [
        { ...sourceTransform, x: sourceTransform.x + moduleWidth + joinGap + offset },
        { ...sourceTransform, x: sourceTransform.x - moduleWidth - joinGap - offset },
        { ...sourceTransform, z: sourceTransform.z + moduleDepth + joinGap + offset },
        { ...sourceTransform, z: sourceTransform.z - moduleDepth - joinGap - offset },
      ].map((candidate) => normalizeSceneTransformV42(clampModelSceneTransform(candidate, null, dimensionsOverride)));

      for (const candidate of fallbackCandidates) {
        if (!isCandidateInvalid(candidate)) return candidate;
      }
    }

    return null;
  };

  const canSceneModuleFitWallV42 = (
    wall: "back" | "front" | "left" | "right" | "center",
    rotationYDeg: number
  ) => {
    if (wall === "center") return true;
    const bounds = getRoomInteriorBoundsMeters();
    const footprint = getSceneModelFootprintMeters(rotationYDeg);
    const roomWidth = Math.max(0, bounds.right - bounds.left);
    const roomDepth = Math.max(0, bounds.front - bounds.back);

    if (wall === "left" || wall === "right") {
      return footprint.depth <= roomDepth + 0.001;
    }

    return footprint.width <= roomWidth + 0.001;
  };


  const getActiveWallSnapDistanceCm = () => {
    if (wallSnapDistanceMode === "5") return 5;
    if (wallSnapDistanceMode === "10") return 10;
    if (wallSnapDistanceMode === "custom") {
      return Math.max(0, Math.min(100, Number(customWallSnapDistanceCm || 0)));
    }

    // V42.5.4 Snap Parete reale:
    // Appoggiato = 0 cm. Il contatto visivo viene gestito dall'ingombro reale del modulo,
    // non da margini nascosti.
    return 0;
  };

  const getWallSnapSceneInsetMeters = (distanceCm = getActiveWallSnapDistanceCm()) => {
    return Math.max(0, Number(distanceCm || 0)) / 100;
  };

  const getWallSnapModeLabel = () => {
    if (wallSnapDistanceMode === "5") return "5 cm";
    if (wallSnapDistanceMode === "10") return "10 cm";
    if (wallSnapDistanceMode === "custom") return `${getActiveWallSnapDistanceCm().toFixed(1)} cm`;
    return "0 cm";
  };

  const showWallSnapConfirmation = (wall: "back" | "front" | "left" | "right" | "center") => {
    const wallLabel =
      wall === "back"
        ? "parete fondo"
        : wall === "front"
          ? "parete frontale"
          : wall === "left"
            ? "parete sinistra"
            : wall === "right"
              ? "parete destra"
              : "centro stanza";

    setWallSnapNotice(
      wall === "center"
        ? "Modulo riportato al centro stanza"
        : `Modulo distaccato dalla ${wallLabel}: ${getWallSnapModeLabel()}`
    );

    window.setTimeout(() => setWallSnapNotice(""), 2600);
  };

  const clampModelSceneTransform = (
    next: { x: number; z: number; rotationYDeg?: number },
    snapHint: typeof activeWallSnap = activeWallSnap,
    dimensionsOverride?: any
  ) => {
    const bounds = getRoomInteriorBoundsMeters();
    const rotationYDeg = THREE.MathUtils.euclideanModulo(Number(next.rotationYDeg || 0), 360);
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg, dimensionsOverride);
    const calibrationOffsetX = Number(importCalibration?.offsetX || 0);
    const calibrationOffsetZ = Number(importCalibration?.offsetZ || 0);
    const boundarySafety = 0;

    const clampInsideRange = (value: number, min: number, max: number, axis: "x" | "z") => {
      if (!Number.isFinite(min) || !Number.isFinite(max)) return Number(value || 0);
      if (min <= max) return THREE.MathUtils.clamp(Number(value || 0), min, max);

      // V42.5.8 Snap Parete anti-uscita:
      // se il modulo e' piu grande dello spazio disponibile, non va centrato nella stanza.
      // Per SX/DX deve comandare la parete di fondo: il bordo posteriore resta interno/attaccato,
      // l'eventuale eccedenza va verso fronte, mai dietro la parete di fondo.
      if (axis === "z") {
        if (snapHint === "left" || snapHint === "right") {
          // V42.5.17 Side Wall Slide Unblock:
          // quando il modulo e' piu' profondo della stanza, SX/DX non devono congelarlo
          // sul fondo e generare collisione a ogni click. Il bordo posteriore resta vincolato
          // alla parete di fondo, ma il modulo puo' scorrere verso l'interno stanza.
          const roomDepth = Math.max(0.4, bounds.front - bounds.back);
          const safeSideSlideMax = min + roomDepth - 0.05;
          return THREE.MathUtils.clamp(Number(value || min), min, Math.max(min, safeSideSlideMax));
        }
        if (snapHint === "back") return min;
        if (snapHint === "front") return max;
      }

      if (axis === "x") {
        if (snapHint === "left") return min;
        if (snapHint === "right") return max;
      }

      // V42.5.26 Clamp Range Hotfix:
      // quando min > max il modulo e' piu' grande dello spazio disponibile.
      // Non va ricentrato artificialmente, altrimenti i pulsanti lo teletrasportano fuori stanza.
      const safeMin = Math.min(min, max);
      const safeMax = Math.max(min, max);
      return THREE.MathUtils.clamp(Number(value || 0), safeMin, safeMax);
    };

    // Scene Composer V42.5.8:
    // clamp su min/max visivi reali del modulo. Quando il modulo e' sovradimensionato
    // rispetto alla stanza, la parete scelta resta il vincolo prioritario invece di centrare
    // il modello e farlo uscire dietro.
    // V42.5.9 Wall Constraint Engine:
    // il gruppo renderizzato usa importCalibration.offsetX/Z + modelSceneOffset.
    // Il clamp deve quindi compensare gli offset di calibrazione, altrimenti il modulo
    // sembra corretto nei numeri ma puo' uscire visivamente dalle pareti perimetrali.
    const minX = bounds.left - rotatedBounds.minX - calibrationOffsetX + boundarySafety;
    const maxX = bounds.right - rotatedBounds.maxX - calibrationOffsetX - boundarySafety;
    const minZ = bounds.back - rotatedBounds.minZ - calibrationOffsetZ + boundarySafety;
    const maxZ = bounds.front - rotatedBounds.maxZ - calibrationOffsetZ - boundarySafety;

    return {
      x: clampInsideRange(Number(next.x || 0), minX, maxX, "x"),
      z: clampInsideRange(Number(next.z || 0), minZ, maxZ, "z"),
      rotationYDeg,
    };
  };

  const isSameSceneTransformV42 = (
    a: { x: number; z: number; rotationYDeg?: number },
    b: { x: number; z: number; rotationYDeg?: number }
  ) => {
    return (
      Math.abs(Number(a.x || 0) - Number(b.x || 0)) < 0.0001 &&
      Math.abs(Number(a.z || 0) - Number(b.z || 0)) < 0.0001 &&
      Math.abs(Number(a.rotationYDeg || 0) - Number(b.rotationYDeg || 0)) < 0.0001
    );
  };

  const showWallCollisionNoticeV42 = () => {
    setWallCollisionNotice("Modulo bloccato dalle pareti perimetrali");
    window.setTimeout(() => setWallCollisionNotice(""), 2200);
  };

  let activeSceneModuleCandidateStatusV42: SceneModuleCollisionStatusV42 | null = null;

  const syncActiveSceneModuleV38 = (
    nextTransform: SceneTransformV42,
    nextWallSnap: typeof activeWallSnap = activeWallSnap
  ): SceneTransformV42 => {
    if (!activeSceneModuleIdV38) {
      setWallCollisionNotice("Nessun modulo selezionato");
      window.setTimeout(() => setWallCollisionNotice(""), 1800);
      return normalizeSceneTransformV42(modelSceneOffset);
    }

    const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || null;
    if (!activeModule) return normalizeSceneTransformV42(modelSceneOffset);
    const previousTransform = normalizeSceneTransformV42(activeModule?.transform || modelSceneOffset);
    const activeDimensionsForBoundsV262 = activeModule?.dimensions || activeSceneModuleDimensionsV1;
    const clampedTransform = normalizeSceneTransformV42(
      clampModelSceneTransform(nextTransform, nextWallSnap, activeDimensionsForBoundsV262)
    );
    if (!canSceneModuleDimensionsFitRoomV262(activeDimensionsForBoundsV262, clampedTransform.rotationYDeg)) {
      setWallCollisionNotice("Modulo troppo grande per la stanza: movimento bloccato");
      window.setTimeout(() => setWallCollisionNotice(""), 2400);
      return previousTransform;
    }

    const candidateStatus = getSceneModuleCollisionMapV42(sceneModulesV38, clampedTransform)
      .get(activeSceneModuleIdV38 || "__no_active_module__") || null;
    activeSceneModuleCandidateStatusV42 = candidateStatus;
    if (candidateStatus === "collision") {
      if (candidateSceneModuleCollisionTimeoutV42.current !== null) {
        window.clearTimeout(candidateSceneModuleCollisionTimeoutV42.current);
      }
      setCandidateSceneModuleStatusV42("collision");
      candidateSceneModuleCollisionTimeoutV42.current = window.setTimeout(() => {
        setCandidateSceneModuleStatusV42(null);
        candidateSceneModuleCollisionTimeoutV42.current = null;
      }, 1400);
    } else if (candidateStatus === "join") {
      if (candidateSceneModuleCollisionTimeoutV42.current === null) {
        setCandidateSceneModuleStatusV42("join");
      }
    } else if (candidateSceneModuleCollisionTimeoutV42.current === null) {
      setCandidateSceneModuleStatusV42(null);
    }

    let contactSnappedTransformV43 = clampedTransform;
    if (candidateStatus === "join") {
      const joinDetectionGap = 0.03;
      const activeBounds = getSceneModuleBoundsV42(clampedTransform, activeDimensionsForBoundsV262);
      let closestSnap: { distance: number; x?: number; z?: number } | null = null;
      sceneModulesV38.forEach((module: any) => {
        if (!module || module.id === activeSceneModuleIdV38) return;
        const otherBounds = getSceneModuleBoundsV42(module.transform || {}, module.dimensions);
        const overlapX = Math.min(activeBounds.right, otherBounds.right) - Math.max(activeBounds.left, otherBounds.left);
        const overlapZ = Math.min(activeBounds.front, otherBounds.front) - Math.max(activeBounds.back, otherBounds.back);
        const candidates: Array<{ distance: number; x?: number; z?: number } | null> = [
          overlapZ > -joinDetectionGap && otherBounds.left - activeBounds.right >= 0 ? { distance: otherBounds.left - activeBounds.right, x: clampedTransform.x + otherBounds.left - activeBounds.right } : null,
          overlapZ > -joinDetectionGap && activeBounds.left - otherBounds.right >= 0 ? { distance: activeBounds.left - otherBounds.right, x: clampedTransform.x + otherBounds.right - activeBounds.left } : null,
          overlapX > -joinDetectionGap && otherBounds.back - activeBounds.front >= 0 ? { distance: otherBounds.back - activeBounds.front, z: clampedTransform.z + otherBounds.back - activeBounds.front } : null,
          overlapX > -joinDetectionGap && activeBounds.back - otherBounds.front >= 0 ? { distance: activeBounds.back - otherBounds.front, z: clampedTransform.z + otherBounds.front - activeBounds.back } : null,
        ];
        candidates.forEach((candidate) => {
          if (!candidate) return;
          if (candidate.distance <= joinDetectionGap && (!closestSnap || candidate.distance < closestSnap.distance)) {
            closestSnap = candidate;
          }
        });
      });
      const selectedSnap = closestSnap as { distance: number; x?: number; z?: number } | null;
      if (selectedSnap) {
        contactSnappedTransformV43 = normalizeSceneTransformV42({
          ...clampedTransform,
          ...(selectedSnap.x !== undefined ? { x: selectedSnap.x } : {}),
          ...(selectedSnap.z !== undefined ? { z: selectedSnap.z } : {}),
        });
        activeSceneModuleCandidateStatusV42 = "join";
        setCandidateSceneModuleStatusV42("join");
      }
    }

    const resolvedTransform = resolveSceneModuleCollisionV42(contactSnappedTransformV43, previousTransform, sceneModulesV38);
    if (candidateStatus === "collision") {
      if (moduleCollisionNoticeTimeoutV42.current !== null) {
        window.clearTimeout(moduleCollisionNoticeTimeoutV42.current);
      }
      setModuleCollisionNoticeV42(true);
      moduleCollisionNoticeTimeoutV42.current = window.setTimeout(() => {
        setModuleCollisionNoticeV42(false);
        moduleCollisionNoticeTimeoutV42.current = null;
      }, 1400);
    }
    console.warn("[MODULE MOVE STATUS]", {
      activeSceneModuleIdV38,
      candidateStatus,
      previousTransform,
      clampedTransform,
      resolvedTransform,
      isSameAfterResolve: isSameSceneTransformV42(clampedTransform, resolvedTransform),
      candidateSceneModuleStatusV42,
    });
    if (!isSceneModuleTransformInsideRoomV262(resolvedTransform, activeDimensionsForBoundsV262)) {
      setWallCollisionNotice("Modulo bloccato dentro i limiti della stanza");
      window.setTimeout(() => setWallCollisionNotice(""), 2200);
      return previousTransform;
    }
    setSceneModulesV38((current) =>
      current.map((module) =>
        module.id === activeSceneModuleIdV38
          ? {
              ...module,
              transform: {
                ...resolvedTransform,
                activeWallSnap: nextWallSnap,
                wallSnapDistanceCm: getActiveWallSnapDistanceCm(),
                wallSnapDistanceMode,
              },
              updatedAt: new Date().toISOString(),
            }
          : module
      )
    );

    return normalizeSceneTransformV42(resolvedTransform);
  };

  const getActiveSceneTransformV25 = (): SceneTransformV42 => {
    const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || null;
    return normalizeSceneTransformV42(activeModule?.transform || modelSceneOffset);
  };

  useEffect(() => {
    setCandidateSceneModuleStatusV42(null);
  }, [activeSceneModuleIdV38]);

  useEffect(() => {
    if (candidateSceneModuleStatusV42 !== "join") {
      setJoinAssistantOpenV42(false);
      setViewerMiniTabsOpenV5((current) => ({ ...current, join: false }));
      return;
    }
    if (joinAssistantOpenV42 && viewerMiniTabsOpenV5.join) return;
    setJoinAssistantOpenV42(true);
    setViewerMiniTabsOpenV5((current) => ({ ...current, join: true }));
  }, [candidateSceneModuleStatusV42, joinAssistantOpenV42, viewerMiniTabsOpenV5.join]);

  const commitActiveSceneTransformV25 = (
    nextTransform: SceneTransformV42,
    nextWallSnap: typeof activeWallSnap = activeWallSnap
  ) => {
    const committedTransform = syncActiveSceneModuleV38(nextTransform, nextWallSnap);

    // Module UX V2.5: i moduli parametrici vivono in sceneModules[].
    // Non aggiornare modelSceneOffset quando il modulo attivo e' parametrico,
    // perche' modelSceneOffset governa il DAE/import principale.
    if (!activeSceneModuleIsParametricV1) {
      setModelSceneOffset(committedTransform);
    }

    return committedTransform;
  };

  const deselectSceneModuleV21 = () => {
    setActiveSceneModuleIdV38(null);
    setActiveWallSnap(null);
  };

  const selectSceneModuleV38 = (moduleId: string | null) => {
    if (!moduleId) {
      deselectSceneModuleV21();
      return;
    }

    const target = sceneModulesV38.find((module) => module.id === moduleId);
    if (!target) return;

    if (activeSceneModuleIdV38 === moduleId) {
      deselectSceneModuleV21();
      return;
    }

    setActiveSceneModuleIdV38(moduleId);
    setActiveWallSnap(target.transform?.activeWallSnap || null);
  };

  const addSceneModuleSnapshotV38 = () => {
    const nextIndex = sceneModulesV38.length + 1;
    const nextModule = createSceneModuleV38({
      name: `Modulo ${nextIndex}`,
      source: {
        modelUrl: effectiveProductModel,
        format: effectiveProductModelFormat,
        importedModelName: effectiveImportedModelName || importedModelName || "",
      },
      dimensions: activeSceneModuleDimensionsV1,
      transform: {
        ...modelSceneOffset,
        activeWallSnap,
      },
    });

    setSceneModulesV38((current) => [...current, nextModule]);
    setActiveSceneModuleIdV38(nextModule.id);
    window.dispatchEvent(new CustomEvent("bagastudio:scene-module-created-v42", { detail: nextModule }));
  };

  const addParametricSceneModuleV1 = () => {
    const nextIndex = sceneModulesV38.length + 1;
    const draftDimensions = {
      width: normalizeModuleDimensionCmV1(moduleDraftDimensionsV2.width, activeSceneModuleDimensionsV1.width),
      depth: normalizeModuleDimensionCmV1(moduleDraftDimensionsV2.depth, activeSceneModuleDimensionsV1.depth),
      height: normalizeModuleDimensionCmV1(moduleDraftDimensionsV2.height, activeSceneModuleDimensionsV1.height),
    };
    if (!canSceneModuleDimensionsFitRoomV262(draftDimensions, 0)) {
      setWallCollisionNotice("Modulo troppo grande per la stanza: creazione bloccata");
      window.setTimeout(() => setWallCollisionNotice(""), 2600);
      return;
    }

    const startTransform = normalizeSceneTransformV42(
      clampModelSceneTransform({
        x: 0,
        z: 0.35,
        rotationYDeg: 0,
      }, null, draftDimensions)
    );
    const safeTransform = findSceneModuleDuplicateTransformV42(startTransform, draftDimensions);
    if (!safeTransform) {
      setWallCollisionNotice("Spazio insufficiente: impossibile creare nuovo modulo");
      window.setTimeout(() => setWallCollisionNotice(""), 3000);
      return;
    }

    const nextModule = createSceneModuleV38({
      name: `Modulo parametrico ${nextIndex}`,
      source: {
        kind: "parametric-module-v1",
        engine: "BagaStudio Parametric Module Engine V1",
      },
      dimensions: draftDimensions,
      shape: "box-panels-v1",
      transform: {
        ...safeTransform,
        activeWallSnap: null,
      },
    });

    setSceneModulesV38((current) => [...current, nextModule]);
    setActiveSceneModuleIdV38(nextModule.id);
    setActiveWallSnap(null);
    setViewerMiniTabsOpenV5({ ...closeAllViewerMiniTabsV5(), module: true });
    setWallSnapNotice("Nuovo modulo creato: le misure restano nel pad, non modificano il selezionato");
    window.setTimeout(() => setWallSnapNotice(""), 2400);
    window.dispatchEvent(new CustomEvent("bagastudio:parametric-module-created-v1", { detail: nextModule }));
  };

  const duplicateActiveSceneModuleV42 = () => {
    if (!activeSceneModuleIdV38) return;
    const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38);
    if (!activeModule) return;

    const nextIndex = sceneModulesV38.length + 1;
    const sourceTransform = activeModule.transform || modelSceneOffset;
    const duplicateStartTransform = normalizeSceneTransformV42({
      x: Number(sourceTransform.x || 0),
      z: Number(sourceTransform.z ?? -0.62),
      rotationYDeg: Number(sourceTransform.rotationYDeg || 0),
    });
    const duplicateDimensions = activeModule.dimensions || activeSceneModuleDimensionsV1;
    if (!canSceneModuleDimensionsFitRoomV262(duplicateDimensions, duplicateStartTransform.rotationYDeg)) {
      setWallCollisionNotice("Modulo troppo grande per la stanza: duplicazione bloccata");
      window.setTimeout(() => setWallCollisionNotice(""), 2600);
      return;
    }

    const safeDuplicateTransform = findSceneModuleDuplicateTransformV42(duplicateStartTransform, duplicateDimensions);
    if (!safeDuplicateTransform) {
      setWallCollisionNotice("Spazio insufficiente: impossibile duplicare il modulo");
      window.setTimeout(() => setWallCollisionNotice(""), 3000);
      return;
    }

    const duplicatedModule = createSceneModuleV38({
      name: `${activeModule.name || "Modulo"} copia`,
      source: {
        ...(activeModule.source || {}),
        modelUrl: activeModule.source?.modelUrl || effectiveProductModel,
        format: activeModule.source?.format || effectiveProductModelFormat,
        importedModelName: activeModule.source?.importedModelName || effectiveImportedModelName || importedModelName || "",
      },
      dimensions: duplicateDimensions,
      transform: {
        ...safeDuplicateTransform,
        activeWallSnap: null,
      },
    });

    duplicatedModule.name = `Modulo ${nextIndex}`;
    duplicatedModule.transform = {
      ...duplicatedModule.transform,
      ...safeDuplicateTransform,
      activeWallSnap: null,
    };

    setSceneModulesV38((current) => [...current, duplicatedModule]);
    setActiveSceneModuleIdV38(duplicatedModule.id);
    if (!isParametricSceneModuleV1(duplicatedModule)) {
      setModelSceneOffset(safeDuplicateTransform);
    }
    setActiveWallSnap(null);
    window.dispatchEvent(new CustomEvent("bagastudio:scene-module-duplicated-v42", { detail: duplicatedModule }));
  };

  const deleteActiveSceneModuleV42 = () => {
    if (!activeSceneModuleIdV38) return;

    const currentIndex = sceneModulesV38.findIndex((module) => module.id === activeSceneModuleIdV38);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextModules = sceneModulesV38.filter((module) => module.id !== activeSceneModuleIdV38);
    const nextActiveModule = nextModules[Math.max(0, safeIndex - 1)] || nextModules[0];

    setSceneModulesV38(nextModules);

    if (nextActiveModule) {
      const nextTransform = clampModelSceneTransform(nextActiveModule.transform || { x: 0, z: -0.62, rotationYDeg: 0 }, null, nextActiveModule.dimensions);
      setActiveSceneModuleIdV38(nextActiveModule.id);
      if (!isParametricSceneModuleV1(nextActiveModule)) {
        setModelSceneOffset(nextTransform);
      }
      setActiveWallSnap(nextActiveModule.transform?.activeWallSnap || null);
    } else {
      setActiveSceneModuleIdV38(null);
      setActiveWallSnap(null);
    }

    window.dispatchEvent(
      new CustomEvent("bagastudio:scene-module-deleted-v42", {
        detail: { deletedModuleId: activeSceneModuleIdV38, nextActiveModuleId: nextActiveModule?.id || "" },
      })
    );
  };

  const getSceneTransformRangeV42 = (rotationYDeg = modelSceneOffset.rotationYDeg || 0) => {
    const bounds = getRoomInteriorBoundsMeters();
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg);
    const calibrationOffsetX = Number(importCalibration?.offsetX || 0);
    const calibrationOffsetZ = Number(importCalibration?.offsetZ || 0);

    return {
      minX: bounds.left - rotatedBounds.minX - calibrationOffsetX,
      maxX: bounds.right - rotatedBounds.maxX - calibrationOffsetX,
      minZ: bounds.back - rotatedBounds.minZ - calibrationOffsetZ,
      maxZ: bounds.front - rotatedBounds.maxZ - calibrationOffsetZ,
    };
  };

  const getSideWallSlideRangeV42 = (
    wall: "left" | "right",
    rotationYDeg = modelSceneOffset.rotationYDeg || 0
  ) => {
    const bounds = getRoomInteriorBoundsMeters();
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg);
    const calibrationOffsetZ = Number(importCalibration?.offsetZ || 0);
    const contactClearance = getWallSnapSceneInsetMeters();

    // V42.5.16 Side Wall Slide Guard:
    // quando il modulo è agganciato a SX/DX, il movimento lungo parete deve restare
    // comandato dalla parete di fondo. La X rimane bloccata sulla parete laterale,
    // mentre la Z può avanzare verso l'interno stanza senza uscire dietro.
    // Se l'ingombro visivo è più profondo della stanza, non congeliamo il movimento:
    // usiamo un binario di scorrimento sicuro dalla parete di fondo verso il fronte.
    const backContactZ = bounds.back - rotatedBounds.minZ - calibrationOffsetZ + contactClearance;
    const strictFrontLimitZ = bounds.front - rotatedBounds.maxZ - calibrationOffsetZ - contactClearance;
    const roomDepth = Math.max(0.4, bounds.front - bounds.back);
    const fallbackFrontLimitZ = backContactZ + roomDepth - 0.05;
    const maxZ = Number.isFinite(strictFrontLimitZ) && strictFrontLimitZ > backContactZ
      ? strictFrontLimitZ
      : fallbackFrontLimitZ;

    return {
      minZ: backContactZ,
      maxZ: Math.max(backContactZ, maxZ),
    };
  };

  const moveModelInRoom = (deltaX = 0, deltaZ = 0) => {
    const activeModuleV42 = activeSceneModuleIdV38
      ? sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || null
      : null;
    if (!activeModuleV42 || !isParametricSceneModuleV1(activeModuleV42)) {
      // BagaStudio V639 REAL:
      // se non e' selezionato un modulo parametrico, i pulsanti movimento devono
      // comandare il DAE/import principale tramite modelSceneOffset.
      const currentImportTransform = normalizeSceneTransformV42(modelSceneOffset);
      const requestedImportTransform: SceneTransformV42 = {
        ...currentImportTransform,
        x: Number(currentImportTransform.x || 0) + deltaX,
        z: Number(currentImportTransform.z || 0) + deltaZ,
      };
      const nextImportTransform = normalizeSceneTransformV42(
        clampModelSceneTransform(requestedImportTransform, null)
      );
      const resolvedImportTransform = resolveSceneModuleCollisionV42(
        nextImportTransform,
        currentImportTransform,
        sceneModulesV38
      );

      setActiveWallSnap(null);
      setModelSceneOffset(resolvedImportTransform);
      if (!isSameSceneTransformV42(nextImportTransform, resolvedImportTransform)) {
        setWallCollisionNotice("Collisione modulo: spostamento bloccato prima dell'attraversamento");
        window.setTimeout(() => setWallCollisionNotice(""), 2200);
      } else if (!isSameSceneTransformV42(requestedImportTransform, nextImportTransform)) showWallCollisionNoticeV42();
      return;
    }
    const storedWallSnapV42 = activeModuleV42?.transform?.activeWallSnap || null;
    const sideWallLock =
      activeWallSnap === "left" || activeWallSnap === "right"
        ? activeWallSnap
        : storedWallSnapV42 === "left" || storedWallSnapV42 === "right"
          ? storedWallSnapV42
          : null;

    // V42.5.15 Side Wall Persistent Lock:
    // se il modulo è agganciato a SX/DX, i pulsanti movimento non devono mai sganciare
    // la parete laterale. Prima il deltaX sganciava lo snap al secondo click e il modulo
    // usciva dietro/fuori stanza. Lo snap laterale resta attivo finché l'utente sceglie
    // reset, centro, altra parete o rotazione.
    if (!sideWallLock) {
      setActiveWallSnap(null);
    } else if (activeWallSnap !== sideWallLock) {
      setActiveWallSnap(sideWallLock);
    }

    const current = getActiveSceneTransformV25();
    {
      const rotationYDeg = Number(current.rotationYDeg || 0);
      const movementRange = getSceneTransformRangeV42(rotationYDeg);
      let requestedX = Number(current.x || 0) + deltaX;
      let requestedZ = Number(current.z || 0) + deltaZ;
      let wallCollisionAlreadyHandledV42 = false;

      let nextWallSnapForMove: typeof activeWallSnap = sideWallLock;

      if (sideWallLock) {
        const sideTarget = getWallSnapTarget(sideWallLock, current);
        const sideSlideRange = getSideWallSlideRangeV42(sideWallLock, rotationYDeg);
        const rawDeltaX = Number(deltaX || 0);
        const rawDeltaZ = Number(deltaZ || 0);

        // V42.5.19 Side Wall XY Move Fix:
        // quando il modulo è agganciato a SX/DX:
        // - frecce SU/GIU scorrono lungo la parete, quindi X resta attaccata;
        // - frecce DX/SX muovono davvero il modulo dentro/fuori dalla parete, quindi X cambia.
        // Prima anche DX/SX venivano convertite in Z e il mobile andava solo fronte/retro.
        if (Math.abs(rawDeltaX) > 0.0001) {
          // V42.5.23 Side Wall Inward Detach:
          // su parete SX/DX il pulsante verso l'interno stanza deve funzionare.
          // Blocchiamo solo il verso che spingerebbe fuori dalla parete perimetrale.
          const isInwardFromSideWall =
            (sideWallLock === "left" && rawDeltaX > 0) ||
            (sideWallLock === "right" && rawDeltaX < 0);

          if (isInwardFromSideWall) {
            const candidateX = Number(current.x || 0) + rawDeltaX;
            const candidateZ = THREE.MathUtils.clamp(Number(current.z || 0), sideSlideRange.minZ, sideSlideRange.maxZ);
            const candidateTransform = {
              ...current,
              x: candidateX,
              z: candidateZ,
              rotationYDeg,
            };
            const candidateClamped = clampModelSceneTransform(candidateTransform, null, activeModuleV42.dimensions || activeSceneModuleDimensionsV1);
            const canDetachInsideRoom =
              Math.abs(Number(candidateTransform.x || 0) - Number(candidateClamped.x || 0)) < 0.0001;

            // V42.5.27 Side Wall Inward Fix:
            // lo sgancio dalla parete laterale deve validare l'asse X, non pretendere che il
            // modulo entri perfettamente anche in Z. Con moduli profondi/ruotati la Z puo' avere
            // un range impossibile, ma il movimento verso l'interno stanza e' comunque valido.
            // Usiamo la Z gia' normalizzata dal clamp per evitare falsi avvisi di collisione.
            if (canDetachInsideRoom) {
              requestedX = candidateClamped.x;
              requestedZ = candidateClamped.z;
              nextWallSnapForMove = null;
              setActiveWallSnap(null);
            } else {
              requestedX = sideTarget.x;
              requestedZ = Number(current.z || 0);
              nextWallSnapForMove = sideWallLock;
              showWallCollisionNoticeV42();
            }
          } else {
            requestedX = sideTarget.x;
            requestedZ = Number(current.z || 0);
            nextWallSnapForMove = sideWallLock;
            showWallCollisionNoticeV42();
          }
        } else {
          // V42.5.28 Side Wall Vertical Slide Fix:
          // SU/GIU su parete laterale devono scorrere SOLO lungo Z, mantenendo X agganciata.
          // Non usiamo il confronto globale requested/nextTransform per mostrare collisione,
          // perche' il clamp della stanza normalizza X/Z e generava falsi avvisi anche quando
          // il movimento lungo parete era valido.
          const candidateZ = Number(current.z || 0) + rawDeltaZ;
          requestedX = sideTarget.x;
          requestedZ = THREE.MathUtils.clamp(candidateZ, sideSlideRange.minZ, sideSlideRange.maxZ);
          wallCollisionAlreadyHandledV42 = true;
          if (Math.abs(candidateZ - requestedZ) > 0.0001 && Math.abs(rawDeltaZ) > 0.0001) {
            showWallCollisionNoticeV42();
          }
        }
      }

      const requestedTransform: SceneTransformV42 = {
        ...current,
        x: requestedX,
        z: requestedZ,
        rotationYDeg,
      };
      const nextTransform = commitActiveSceneTransformV25(requestedTransform, nextWallSnapForMove);
      if (!wallCollisionAlreadyHandledV42 && activeSceneModuleCandidateStatusV42 !== "collision" && activeSceneModuleCandidateStatusV42 !== "join" && !isSameSceneTransformV42(requestedTransform, nextTransform)) showWallCollisionNoticeV42();
    }
  };

  const rotateModelInRoom = (deltaRotationYDeg = 0) => {
    const current = getActiveSceneTransformV25();
    {
      const requestedRotation = Number(current.rotationYDeg || 0) + deltaRotationYDeg;
      const sideWallLock = activeWallSnap === "left" || activeWallSnap === "right" ? activeWallSnap : null;

      if (sideWallLock && !canSceneModuleFitWallV42(sideWallLock, requestedRotation)) {
        setWallCollisionNotice("Rotazione bloccata: il modulo supera la profondità della parete laterale");
        window.setTimeout(() => setWallCollisionNotice(""), 2600);
        return;
      }

      setActiveWallSnap(null);
      const requestedTransform: SceneTransformV42 = {
        ...current,
        x: Number(current.x || 0),
        z: Number(current.z || 0),
        rotationYDeg: requestedRotation,
      };
      const nextTransform = commitActiveSceneTransformV25(requestedTransform, null);
      if (!isSameSceneTransformV42(requestedTransform, nextTransform)) showWallCollisionNoticeV42();
    }
  };

  const getWallSnapTarget = (
    wall: "back" | "front" | "left" | "right" | "center",
    current: { x: number; z: number; rotationYDeg?: number }
  ) => {
    const bounds = getRoomInteriorBoundsMeters();
    const calibrationOffsetX = Number(importCalibration?.offsetX || 0);
    const calibrationOffsetZ = Number(importCalibration?.offsetZ || 0);
    const wallRotations = {
      back: 0,
      front: 180,
      left: 90,
      right: 270,
      center: Number(current.rotationYDeg || 0),
    } as const;
    const rotationYDeg = wallRotations[wall];

    // V42.5.4 Snap Parete reale:
    // usa l'ingombro visivo già corretto per assi/import, così il bordo del modulo
    // coincide con la faccia della parete selezionata.
    const rotatedBounds = getSceneModelRotatedBoundsMeters(rotationYDeg);
    const contactClearance = getWallSnapSceneInsetMeters();
    const clampZForSideSnap = (value: number) => {
      const minZ = bounds.back - rotatedBounds.minZ - calibrationOffsetZ;
      const maxZ = bounds.front - rotatedBounds.maxZ - calibrationOffsetZ;
      if (minZ > maxZ) return (minZ + maxZ) / 2;
      return THREE.MathUtils.clamp(Number(value || bounds.centerZ), minZ, maxZ);
    };
    const clampXForDepthSnap = (value: number) => {
      const minX = bounds.left - rotatedBounds.minX - calibrationOffsetX;
      const maxX = bounds.right - rotatedBounds.maxX - calibrationOffsetX;
      if (minX > maxX) return (minX + maxX) / 2;
      return THREE.MathUtils.clamp(Number(value || 0), minX, maxX);
    };

    if (wall === "back") {
      return { x: clampXForDepthSnap(current.x), z: bounds.back - rotatedBounds.minZ - calibrationOffsetZ + contactClearance, rotationYDeg };
    }

    if (wall === "front") {
      return { x: clampXForDepthSnap(current.x), z: bounds.front - rotatedBounds.maxZ - calibrationOffsetZ - contactClearance, rotationYDeg };
    }

    if (wall === "left") {
      // V42.5.7 Snap Parete laterale:
      // quando il modulo viene appoggiato a SX/DX, la parete di fondo comanda anche la profondità.
      // Non manteniamo current.z, perché con modelli DAE centrati può lasciare il mobile oltre il fondo stanza.
      const backLockedZ = bounds.back - rotatedBounds.minZ - calibrationOffsetZ + contactClearance;
      return {
        x: bounds.left - rotatedBounds.minX - calibrationOffsetX + contactClearance,
        z: clampZForSideSnap(backLockedZ),
        rotationYDeg,
      };
    }

    if (wall === "right") {
      // V42.5.7 Snap Parete laterale:
      // SX/DX devono appoggiare visivamente alla parete laterale e restare agganciati al fondo stanza.
      const backLockedZ = bounds.back - rotatedBounds.minZ - calibrationOffsetZ + contactClearance;
      return {
        x: bounds.right - rotatedBounds.maxX - calibrationOffsetX - contactClearance,
        z: clampZForSideSnap(backLockedZ),
        rotationYDeg,
      };
    }

    return { x: 0, z: bounds.centerZ, rotationYDeg };
  };

  const snapModelToWall = (wall: "back" | "front" | "left" | "right" | "center") => {
    const wallRotationMap = { back: 0, front: 180, left: 90, right: 270, center: modelSceneOffset.rotationYDeg || 0 } as const;
    const targetRotation = Number(wallRotationMap[wall] || 0);

    if (!canSceneModuleFitWallV42(wall, targetRotation)) {
      const wallLabel = wall === "left" || wall === "right" ? "parete laterale" : "parete selezionata";
      setWallCollisionNotice(`Modulo troppo profondo/lungo per la ${wallLabel}: snap bloccato`);
      window.setTimeout(() => setWallCollisionNotice(""), 2600);
      return;
    }

    setActiveWallSnap(wall);
    const current = getActiveSceneTransformV25();
    commitActiveSceneTransformV25(
      {
        ...current,
        ...getWallSnapTarget(wall, current),
      },
      wall
    );
    showWallSnapConfirmation(wall);
  };

  const snapModelToBackWall = () => snapModelToWall("back");

  const resetModelRoomPosition = () => {
    commitActiveSceneTransformV25({ x: 0, z: -0.62, rotationYDeg: 0 }, null);
    setActiveWallSnap(null);
  };

  useEffect(() => {
    (window as any).__bagastudioImportCalibrationV1 = importCalibration;
    (window as any).bagastudioGetImportCalibration = () => importCalibration;
    (window as any).bagastudioResetImportCalibration = resetImportCalibration;

    return () => {
      delete (window as any).bagastudioGetImportCalibration;
      delete (window as any).bagastudioResetImportCalibration;
    };
  }, [importCalibration]);
  useEffect(() => {
    const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || sceneModulesV38[0] || null;
    const scenePackageV38 = {
      schema: "bagastudio.sceneComposer.v42",
      activeModuleId: activeSceneModuleIdV38,
      activeWallSnap,
      activeWallSnapDistanceCm: getActiveWallSnapDistanceCm(),
      activeWallSnapDistanceMode: wallSnapDistanceMode,
      activeTransform: modelSceneOffset,
      modules: sceneModulesV38,
      note: "Scene Composer V42: registry multi-modulo con modulo attivo, duplica/elimina e transform indipendente. Import multiplo reale previsto nello step successivo.",
      updatedAt: new Date().toISOString(),
    };

    (window as any).__bagastudioSceneComposerTransformV36 = modelSceneOffset;
    (window as any).__bagastudioSceneComposerModulesV38 = sceneModulesV38;
    (window as any).__bagastudioSceneComposerPackageV38 = scenePackageV38;
    (window as any).bagastudioGetSceneComposerTransform = () => modelSceneOffset;
    (window as any).bagastudioGetSceneComposerModules = () => sceneModulesV38;
    (window as any).bagastudioGetSceneComposerPackage = () => scenePackageV38;
    window.dispatchEvent(
      new CustomEvent("bagastudio:scene-composer-transform-updated", {
        detail: {
          ...modelSceneOffset,
          schema: "bagastudio.sceneComposerTransform.v40",
          activeWallSnap,
          activeWallSnapDistanceCm: getActiveWallSnapDistanceCm(),
          activeWallSnapDistanceMode: wallSnapDistanceMode,
          activeModule,
          moduleCount: sceneModulesV38.length,
          note: scenePackageV38.note,
        },
      })
    );

    return () => {
      delete (window as any).bagastudioGetSceneComposerTransform;
      delete (window as any).bagastudioGetSceneComposerModules;
      delete (window as any).bagastudioGetSceneComposerPackage;
    };
  }, [modelSceneOffset, activeWallSnap, wallSnapDistanceMode, customWallSnapDistanceCm, sceneModulesV38, activeSceneModuleIdV38]);


  useEffect(() => {
    const handleScaleDiagnostics = (event: Event) => {
      setScaleDiagnosticsV8((event as CustomEvent).detail || null);
    };

    window.addEventListener("bagastudio:scale-diagnostics-v8", handleScaleDiagnostics);

    return () => {
      window.removeEventListener("bagastudio:scale-diagnostics-v8", handleScaleDiagnostics);
    };
  }, []);

  useEffect(() => {
    const setSelectMode = () => setViewerMode("select");
    const setPanMode = () => setViewerMode("pan");
    const setOrbitMode = () => setViewerMode("orbit");

    window.addEventListener("bagastudio:tool-select", setSelectMode);
    window.addEventListener("bagastudio:tool-pan", setPanMode);
    window.addEventListener("bagastudio:tool-orbit", setOrbitMode);

    return () => {
      window.removeEventListener("bagastudio:tool-select", setSelectMode);
      window.removeEventListener("bagastudio:tool-pan", setPanMode);
      window.removeEventListener("bagastudio:tool-orbit", setOrbitMode);
    };
  }, []);

  useEffect(() => {
    const supportedFormats = ["glb", "gltf", "dae", "fbx", "obj", "stl"];

    const getExtension = (fileName: string) =>
      String(fileName || "")
        .split(".")
        .pop()
        ?.trim()
        .toLowerCase() || "";

    const productPackageDimensionsFromPayload = (payload: any) => {
      const sourceDimensions =
        payload?.productPackage?.dimensions ||
        payload?.dimensions ||
        payload?.package?.dimensions ||
        null;

      if (!sourceDimensions) return null;

      const nextDimensions = {
        width: Number(sourceDimensions.width || 0),
        height: Number(sourceDimensions.height || 0),
        depth: Number(sourceDimensions.depth || 0),
      };

      if (!Number.isFinite(nextDimensions.width + nextDimensions.height + nextDimensions.depth)) return null;
      if (Math.max(nextDimensions.width, nextDimensions.height, nextDimensions.depth) <= 0) return null;

      return nextDimensions;
    };

    const applyRuntimeModel = (payload: any) => {
      const url = String(payload?.objectUrl || payload?.url || payload?.productModel || "");
      const name = String(payload?.name || payload?.fileName || "");
      const format = String(payload?.format || payload?.productModelFormat || getExtension(name) || getExtension(url)).toLowerCase();

      if (!url || !supportedFormats.includes(format)) {
        window.dispatchEvent(
          new CustomEvent("bagastudio:viewer-runtime-model-error", {
            detail: {
              status: "error",
              message: "Formato modello non supportato o URL mancante",
              payload,
              supportedFormats,
            },
          })
        );
        return;
      }

      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:") && previous.url !== url) {
        URL.revokeObjectURL(previous.url);
      }

      const payloadDimensions = payload?.dimensions || productPackageDimensionsFromPayload(payload);

      const nextModel = {
        url,
        format,
        name: name || `BagaStudio import ${format.toUpperCase()}`,
        size: Number(payload?.size || 0),
        dimensions: payloadDimensions,
        importedAt: String(payload?.importedAt || new Date().toISOString()),
      };

      runtimeImportedModelRef.current = nextModel;
      setRuntimeImportedModel(nextModel);

      // Module UX V2.6.7: l'import DAE/JSON diventa un ostacolo reale di scena,
      // ma non e' piu' il modulo parametrico da muovere con il PAD.
      const importedDimensionsV267 = {
        width: normalizeModuleDimensionCmV1(payloadDimensions?.width, Number(width || 180)),
        height: normalizeModuleDimensionCmV1(payloadDimensions?.height, Number(height || 100)),
        depth: normalizeModuleDimensionCmV1(payloadDimensions?.depth, Number(depth || 60)),
      };
      const importedTransformV267 = normalizeSceneTransformV42(
        clampModelSceneTransform({ x: 0, z: -0.62, rotationYDeg: 0 }, null, importedDimensionsV267)
      );

      setSceneModulesV38((current) => {
        const nextImportedModule = createSceneModuleV38({
          id: "imported-product-main",
          name: name || nextModel.name || "Modello importato",
          source: {
            kind: "imported-product-v1",
            modelUrl: url,
            format,
            importedModelName: name || nextModel.name || "Modello importato",
          },
          dimensions: importedDimensionsV267,
          transform: importedTransformV267,
        });

        const withoutPreviousImport = current.filter((module: any) => !isImportedSceneModuleV267(module));
        return [nextImportedModule, ...withoutPreviousImport];
      });
      setActiveSceneModuleIdV38("imported-product-main");
      setActiveWallSnap(null);
      setModelSceneOffset(importedTransformV267);

      // BagaStudio Recovery DAE/Viewer V1:
      // ogni nuovo modello deve ripartire da una lista componenti pulita.
      // Prima potevano rimanere componenti/placeholder del Product Package precedente
      // e il Viewer mostrava pezzi finti o non appartenenti al DAE caricato.
      setViewerRuntimeComponents([]);
      setRuntimeSelectedPartId("");
      (window as any).__bagastudioViewerRuntimeComponents = [];
      (window as any).__bagastudioViewerRuntimeMergeReport = null;

      window.dispatchEvent(
        new CustomEvent("bagastudio:viewer-runtime-model-loaded", {
          detail: nextModel,
        })
      );
    };

    const handleDragDropModelReady = (event: Event) => {
      applyRuntimeModel((event as CustomEvent).detail);
    };

    const handleViewerLoadModel = (event: Event) => {
      applyRuntimeModel((event as CustomEvent).detail);
    };

    (window as any).bagastudioLoadModelFile = (file: File) => {
      const format = getExtension(file?.name || "");
      if (!file || !supportedFormats.includes(format)) {
        throw new Error(`Formato non supportato. Usa: ${supportedFormats.join(", ")}`);
      }

      const objectUrl = URL.createObjectURL(file);
      const payload = {
        objectUrl,
        format,
        name: file.name,
        size: file.size,
        type: file.type || null,
        file,
        importedAt: new Date().toISOString(),
      };

      applyRuntimeModel(payload);
      return payload;
    };

    (window as any).bagastudioLoadModelUrl = (url: string, format?: string, name?: string) => {
      const payload = {
        url,
        format: format || getExtension(name || url),
        name: name || url.split("/").pop() || "BagaStudio model",
        importedAt: new Date().toISOString(),
      };

      applyRuntimeModel(payload);
      return payload;
    };

    
    (window as any).bagastudioLoadProductPackageJson = (productPackage: any) => {
      try {
        const components = Array.isArray(productPackage?.components)
          ? productPackage.components
          : [];

        (window as any).__bagastudioProductPackage = productPackage;
        (window as any).__bagastudioViewerRuntimeComponents = components;
        (window as any).__bagastudioViewerRuntimeMergeReport = {
          runtimeComponentCount: components.length,
          source: "product-package"
        };

        const modelUrl =
          productPackage?.assets?.convertedModelUrl ||
          productPackage?.assets?.embeddedModelDataUrl ||
          productPackage?.assets?.modelUrl;

        if (modelUrl) {
          const isConvertedModelUrl = Boolean(productPackage?.assets?.convertedModelUrl);
          const resolvedFormat = isConvertedModelUrl
            ? String(productPackage?.assets?.conversionTargetFormat || "glb").toLowerCase()
            : inferModelFormat(
                modelUrl,
                productPackage?.assets?.modelExtension ||
                  productPackage?.assets?.modelFormat ||
                  productPackage?.assets?.originalFormat ||
                  productPackage?.engine?.canonicalModelFormat ||
                  "glb"
              );

          applyRuntimeModel({
            url: modelUrl,
            format: resolvedFormat,
            name:
              productPackage?.assets?.sourceFileName ||
              productPackage?.name ||
              "Product Package Model",
            dimensions: productPackage?.dimensions || null,
            productPackage,
            importedAt: new Date().toISOString(),
          });
        }

        window.dispatchEvent(
          new CustomEvent("bagastudio:runtime-components-merged", {
            detail: {
              productPackage,
              components,
              mergeReport: {
                runtimeComponentCount: components.length,
              },
            },
          })
        );

        return {
          productPackage,
          components,
          componentCount: components.length,
          modelLoaded: Boolean(modelUrl),
        };
      } catch (error) {
        console.error("Product package load error", error);
        return null;
      }
    };

(window as any).bagastudioGetRuntimeImportedModel = () => runtimeImportedModelRef.current;
    (window as any).bagastudioClearRuntimeImportedModel = () => {
      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }
      runtimeImportedModelRef.current = null;
      setRuntimeImportedModel(null);
      setSceneModulesV38((current) => current.filter((module: any) => !isImportedSceneModuleV267(module)));
      setActiveSceneModuleIdV38((current) => (current === "imported-product-main" ? null : current));
      window.dispatchEvent(new CustomEvent("bagastudio:viewer-runtime-model-cleared"));
    };

    window.addEventListener("bagastudio:drag-drop-model-ready", handleDragDropModelReady);
    window.addEventListener("bagastudio:viewer-load-model", handleViewerLoadModel);
    window.addEventListener("bagastudio:import-model", handleViewerLoadModel);

    return () => {
      window.removeEventListener("bagastudio:drag-drop-model-ready", handleDragDropModelReady);
      window.removeEventListener("bagastudio:viewer-load-model", handleViewerLoadModel);
      window.removeEventListener("bagastudio:import-model", handleViewerLoadModel);

      const previous = runtimeImportedModelRef.current;
      if (previous?.url && previous.url.startsWith("blob:")) {
        URL.revokeObjectURL(previous.url);
      }

      delete (window as any).bagastudioLoadModelFile;
      delete (window as any).bagastudioLoadModelUrl;
      delete (window as any).bagastudioGetRuntimeImportedModel;
      delete (window as any).bagastudioClearRuntimeImportedModel;
    };
  }, []);


  useEffect(() => {
    const applyComponents = (payload: any) => {
      const incomingComponents = Array.isArray(payload?.components)
        ? payload.components
        : Array.isArray(payload?.detail?.components)
        ? payload.detail.components
        : [];

      const incoming = incomingComponents as BagaStudioRuntimeComponent[];

      // BagaStudio Recovery DAE/Viewer V1:
      // la lista componenti deve rappresentare il modello attivo, non il conteggio più alto
      // visto in precedenza. Il confronto incoming >= current manteneva componenti vecchi
      // quando il nuovo DAE aveva meno mesh, generando residui demo/package nel Viewer.
      if (Array.isArray(incoming)) {
        setViewerRuntimeComponents(incoming);
        (window as any).__bagastudioViewerRuntimeComponents = incoming;
      }
    };

    const handleComponentsReady = (event: Event) => {
      applyComponents((event as CustomEvent).detail);
    };

    const handleSelectComponent = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const partId = String(detail?.partId || detail?.id || detail?.meshName || "");
      if (!partId) return;
      lastSelectionWasMultiRef.current = Boolean(detail?.multiSelect || detail?.additive || detail?.range);
      setRuntimeSelectedPartId(partId);
    };

    (window as any).bagastudioGetViewerRuntimeComponents = () => viewerRuntimeComponents;
    (window as any).bagastudioSelectViewerRuntimeComponent = (partId: string) => {
      const safePartId = String(partId || "");
      if (!safePartId) return null;

      setRuntimeSelectedPartId(safePartId);
      window.dispatchEvent(
        new CustomEvent("bagastudio:viewer-component-selected", {
          detail: { partId: safePartId },
        })
      );

      return safePartId;
    };

    window.addEventListener("bagastudio:viewer-components-ready", handleComponentsReady);
    window.addEventListener("bagastudio:importer-components-analyzed", handleComponentsReady);
    window.addEventListener("bagastudio:runtime-components-merged", handleComponentsReady);
    window.addEventListener("bagastudio:viewer-select-component", handleSelectComponent);

    const existingComponents = (window as any).__bagastudioViewerRuntimeComponents;
    if (Array.isArray(existingComponents)) {
      setViewerRuntimeComponents(existingComponents as BagaStudioRuntimeComponent[]);
    }

    return () => {
      window.removeEventListener("bagastudio:viewer-components-ready", handleComponentsReady);
      window.removeEventListener("bagastudio:importer-components-analyzed", handleComponentsReady);
      window.removeEventListener("bagastudio:runtime-components-merged", handleComponentsReady);
      window.removeEventListener("bagastudio:viewer-select-component", handleSelectComponent);

      delete (window as any).bagastudioGetViewerRuntimeComponents;
      delete (window as any).bagastudioSelectViewerRuntimeComponent;
    };
  }, [setRuntimeSelectedPartId, viewerRuntimeComponents]);

  useEffect(() => {
    if (!selectedRuntimePartId) return;

    const targetRow = componentRowRefs.current[selectedRuntimePartId];

    if (!targetRow) return;

    targetRow.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedRuntimePartId, viewerRuntimeComponents]);

  const selectedViewerRuntimeComponent = useMemo(() => {
    if (!selectedRuntimePartId) return null;

    return (
      viewerRuntimeComponents.find((component) => component.id === selectedRuntimePartId) ||
      viewerRuntimeComponents.find((component) => component.meshName === selectedRuntimePartId) ||
      null
    );
  }, [selectedRuntimePartId, viewerRuntimeComponents]);

  const effectiveProductModel = runtimeImportedModel?.url || productModel;
  const effectiveProductModelFormat = useMemo(
    () => inferModelFormat(effectiveProductModel || "", runtimeImportedModel?.format || productModelFormat),
    [effectiveProductModel, runtimeImportedModel?.format, productModelFormat]
  );
  const effectiveImportedModelName =
    runtimeImportedModel?.name ||
    importedModelName ||
    (typeof effectiveProductModel === "string" ? effectiveProductModel.split("/").pop() : "") ||
    "import";

  // Import Calibration V23:
  // Il pannello deve comparire anche quando il DAE arriva da page.tsx come productModel,
  // quindi il formato va sempre inferito dal model URL/data-url e non solo da runtimeImportedModel.
  // Empty Room Premium V32.1:
  // pannello calibrazione/debug nascosto nel Viewer cliente.
  // La logica di scala/import resta invariata; viene solo disattivata la UI overlay.
  const hasActiveImportCalibrationPanel = false;

  const emitViewerCommand = (eventName: string, detail?: any) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  };
  const moduleVisualFeedbackMapV1 = getSceneModuleCollisionMapV42(sceneModulesV38, getActiveSceneTransformV25());
  if (candidateSceneModuleStatusV42 && activeSceneModuleIdV38) {
    moduleVisualFeedbackMapV1.set(activeSceneModuleIdV38, candidateSceneModuleStatusV42);
  }
  const collisionHighlightModuleIdsV1 = new Set(
    Array.from(moduleVisualFeedbackMapV1.entries())
      .filter(([, status]) => status === "collision")
      .map(([moduleId]) => moduleId)
  );
  const joinHighlightModuleIdsV43 = new Set(
    Array.from(moduleVisualFeedbackMapV1.entries())
      .filter(([, status]) => status === "join")
      .map(([moduleId]) => moduleId)
  );

  return (
    <div className="relative h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {runtimeImportedModel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl border border-emerald-500/30 bg-black/70 px-3 py-2 text-xs text-emerald-100 shadow-lg backdrop-blur">
          Import attivo: {runtimeImportedModel.name} · {runtimeImportedModel.format.toUpperCase()}
        </div>
      )}

      {environment && (
        <div className="pointer-events-none absolute left-3 top-16 z-10 rounded-xl border border-cyan-500/25 bg-black/65 px-3 py-2 text-xs text-cyan-50 shadow-lg backdrop-blur">
          Ambiente: {baseRoomEnvironment?.roomWidthCm || 420} × {baseRoomEnvironment?.roomDepthCm || 360} × {baseRoomEnvironment?.roomHeightCm || 280} cm
        </div>
      )}

      {activeWallSnap && activeWallSnap !== "center" && (
        <div className="pointer-events-none absolute bottom-[118px] right-[294px] z-30 hidden rounded-2xl border border-emerald-400/30 bg-black/46 px-3 py-2 text-xs font-black text-emerald-100 shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-md md:block">
          <div className="mb-1 h-px w-16 bg-emerald-300/70" />
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-emerald-300">↔</span>
            <span>{getWallSnapModeLabel()}</span>
          </div>
        </div>
      )}

      {(sceneModulesV38.length > 1 || candidateSceneModuleStatusV42) && (() => {
        const collisionMap = getSceneModuleCollisionMapV42(sceneModulesV38, getActiveSceneTransformV25());
        const activeStatus =
          candidateSceneModuleStatusV42 ||
          collisionMap.get(activeSceneModuleIdV38 || "__no_active_module__");
        if (!activeStatus || activeStatus === "ok") return null;

        // UX V5.1: se l'assistente giunzione è già aperto nella mini-tab,
        // non mostrare anche il toast verde sopra al modello.
        // Lascia invece sempre visibile il warning rosso di collisione.
        if (activeStatus === "join" && joinAssistantOpenV42 && viewerMiniTabsOpenV5.join) return null;

        return (
          <div className={`fixed left-1/2 top-6 z-[100] max-w-[300px] -translate-x-1/2 rounded-2xl border px-3 py-2 text-[11px] font-black shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl ${
            activeStatus === "collision"
              ? "border-red-400/40 bg-red-950/80 text-red-50"
              : "border-emerald-400/35 bg-emerald-950/78 text-emerald-50"
          }`}>
            <div className="uppercase tracking-[0.18em]">
              {activeStatus === "collision" ? "Collisione modulo" : "Giunzione possibile"}
            </div>
            <div className="mt-1 text-[10px] font-semibold opacity-80">
              {activeStatus === "collision"
                ? "Sposta il modulo: sta attraversando un altro ingombro."
                : "Modulo accostato: apri la mini-tab GIUNZIONE."}
            </div>
            {activeStatus === "join" && (
              <button
                type="button"
                onClick={() => {
                  setJoinAssistantOpenV42(true);
                  setViewerMiniTabsOpenV5((current) => ({ ...current, join: true }));
                }}
                className="pointer-events-auto mt-2 rounded-xl border border-emerald-300/40 bg-emerald-400/16 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-50 transition hover:bg-emerald-400/26"
              >
                Apri giunzione
              </button>
            )}
          </div>
        );
      })()}

      {joinAssistantOpenV42 && viewerMiniTabsOpenV5.join && (() => {
        const activeModule = sceneModulesV38.find((module: any) => module.id === activeSceneModuleIdV38) || null;
        const activeBounds = getSceneModuleBoundsV42(getActiveSceneTransformV25());
        const otherModule = sceneModulesV38.find((module: any) => {
          if (!module || module.id === activeSceneModuleIdV38) return false;
          const otherBounds = getSceneModuleBoundsV42(module.transform || {});
          const touchTolerance = 0.1;
          const overlapX = Math.min(activeBounds.right, otherBounds.right) - Math.max(activeBounds.left, otherBounds.left);
          const overlapZ = Math.min(activeBounds.front, otherBounds.front) - Math.max(activeBounds.back, otherBounds.back);
          const touchesX =
            (Math.abs(activeBounds.right - otherBounds.left) <= touchTolerance ||
              Math.abs(otherBounds.right - activeBounds.left) <= touchTolerance) &&
            overlapZ > -touchTolerance;
          const touchesZ =
            (Math.abs(activeBounds.front - otherBounds.back) <= touchTolerance ||
              Math.abs(otherBounds.front - activeBounds.back) <= touchTolerance) &&
            overlapX > -touchTolerance;
          return touchesX || touchesZ;
        });

        return (
          <ViewerMiniTab
            id="join"
            label="Giunzione"
            eyebrow="Scene Composer V42"
            defaultPosition={joinAssistantPosition}
            open={viewerMiniTabsOpenV5.join}
            onToggle={toggleViewerMiniTabV5}
            onPositionChange={setJoinAssistantPosition}
            dockRight={false}
          >
            <div className="w-[390px] rounded-3xl border border-emerald-300/35 bg-slate-950/92 p-4 text-xs text-emerald-50 shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Scene Composer V42</div>
                <div className="mt-1 text-lg font-black uppercase tracking-wide text-white">Assistente giunzione</div>
              </div>
              <button
                type="button"
                onClick={() => setJoinAssistantOpenV42(false)}
                className="rounded-xl border border-white/10 bg-white/8 px-2 py-1 text-[10px] font-black uppercase text-slate-200 hover:bg-white/15"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/8 p-3">
              <div className="font-black uppercase tracking-[0.14em] text-emerald-200">Giunzione rilevata</div>
              <div className="mt-2 leading-relaxed text-emerald-50/82">
                <b>{activeModule?.name || "Modulo attivo"}</b> è accostato a <b>{otherModule?.name || "un altro modulo"}</b>.
                Controlla la giunzione prima di confermarla: fianco condiviso, ferramenta e fattibilità produttiva andranno validati nel prossimo step.
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-2xl border border-emerald-300/25 bg-emerald-400/14 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50 hover:bg-emerald-400/24"
                onClick={() => setJoinAssistantOpenV42(false)}
              >
                Tieni separati
              </button>
              <button
                type="button"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/14 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-50 hover:bg-cyan-400/24 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  setWallSnapNotice("Giunzione segnata come possibile: validazione tecnica da completare");
                  window.setTimeout(() => setWallSnapNotice(""), 2400);
                  setJoinAssistantOpenV42(false);
                }}
              >
                Segna possibile
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/8 p-3 text-[11px] font-semibold leading-relaxed text-amber-100/85">
              V42 recovery: questa scheda ripristina il workflow. La scelta reale di ferramenta/fianco condiviso resta roadmap Modular Merge Engine.
            </div>
            </div>
          </ViewerMiniTab>
        );
      })()}

      {moduleCollisionNoticeV42 && (
        <div className="pointer-events-none fixed left-1/2 top-6 z-[100] max-w-[300px] -translate-x-1/2 rounded-2xl border border-red-400/40 bg-red-950/80 px-3 py-2 text-[11px] font-black text-red-50 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="uppercase tracking-[0.18em]">Collisione modulo</div>
          <div className="mt-1 text-[10px] font-semibold opacity-80">
            Spostamento bloccato prima dell&apos;attraversamento.
          </div>
        </div>
      )}

      {wallCollisionNotice && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-[999] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-400/35 bg-red-950/92 px-5 py-3 text-sm text-white shadow-[0_18px_55px_rgba(0,0,0,0.58)] backdrop-blur-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-lg font-black text-white">!</span>
          <div>
            <div className="font-black">Collisione parete</div>
            <div className="text-xs font-semibold text-red-100/90">{wallCollisionNotice}</div>
          </div>
        </div>
      )}

      {wallSnapNotice && (
        <div className="pointer-events-none absolute left-1/2 top-[82px] z-[998] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-400/25 bg-slate-950/90 px-4 py-2 text-xs text-white shadow-[0_18px_55px_rgba(0,0,0,0.52)] backdrop-blur-xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-white">✓</span>
          <div>
            <div className="font-black">Snap parete</div>
            <div className="text-xs font-semibold text-slate-300">{getWallSnapModeLabel()} ({wallSnapDistanceMode === "touch" ? "appoggiato" : "snap"})</div>
          </div>
        </div>
      )}

      {hasActiveImportCalibrationPanel && (
        <div className="fixed left-[230px] top-[145px] z-[99999] max-h-[70vh] w-[330px] overflow-y-auto rounded-xl border-2 border-amber-300/60 bg-black/95 p-3 text-xs text-amber-50 shadow-2xl shadow-amber-950/40 backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-black uppercase tracking-[0.18em] text-amber-300">Import Calibration V23</div>
              <div className="text-[10px] text-slate-300">Correzione locale modello importato</div>
              <div className="mt-1 max-w-[220px] truncate text-[10px] font-bold text-amber-100">
                Modello: {effectiveImportedModelName || effectiveProductModelFormat || "import"}
              </div>
            </div>
            <button
              type="button"
              onClick={resetImportCalibration}
              className="rounded-full border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-100 transition hover:bg-amber-400/20"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(IMPORT_CALIBRATION_LABELS) as Array<keyof ImportCalibrationSettings>).map((key) => (
              <label key={key} className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                {IMPORT_CALIBRATION_LABELS[key]}
                <input
                  type="number"
                  value={importCalibration[key]}
                  step={key === "scale" ? 0.01 : key === "realWidthCm" ? 1 : 0.1}
                  onChange={(event) => updateImportCalibration(key, event.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1 text-xs text-white outline-none transition focus:border-amber-300/70"
                />
              </label>
            ))}
          </div>

          <div className="mt-2 text-[10px] leading-snug text-slate-400">
            Usa Offset Y per alzare/abbassare DAE. Largh. reale cm forza la scala corretta del modello importato.
          </div>

          {scaleDiagnosticsV8 && (
            <div className="mt-3 rounded-lg border border-amber-300/20 bg-slate-950/80 p-2 text-[10px] leading-snug text-amber-50">
              <div className="mb-1 font-black uppercase tracking-[0.14em] text-amber-300">Scale Debug V19</div>
              <div>Raw: {Number(scaleDiagnosticsV8.raw?.width || 0).toFixed(3)} × {Number(scaleDiagnosticsV8.raw?.height || 0).toFixed(3)} × {Number(scaleDiagnosticsV8.raw?.depth || 0).toFixed(3)}</div>
              <div>Scala auto: {Number(scaleDiagnosticsV8.displayScale || 0).toFixed(5)}</div>
              <div>Finale cm: {Number(scaleDiagnosticsV8.finalEstimatedCm?.width || 0).toFixed(1)} × {Number(scaleDiagnosticsV8.finalEstimatedCm?.height || 0).toFixed(1)} × {Number(scaleDiagnosticsV8.finalEstimatedCm?.depth || 0).toFixed(1)}</div>
              <div className="mt-1 text-slate-300">Candidate cm:</div>
              <div>m: {Number(scaleDiagnosticsV8.candidatesCm?.meters?.width || 0).toFixed(1)}</div>
              <div>dm: {Number(scaleDiagnosticsV8.candidatesCm?.decimeters?.width || 0).toFixed(1)}</div>
              <div>cm: {Number(scaleDiagnosticsV8.candidatesCm?.centimeters?.width || 0).toFixed(1)}</div>
              <div>mm: {Number(scaleDiagnosticsV8.candidatesCm?.millimeters?.width || 0).toFixed(1)}</div>
            </div>
          )}
        </div>
      )}

      {/* Component list moved to right sidebar in app/page.tsx. Canvas kept clean. */}

      <RoomOrientationOverlay />

      <ViewerMiniTab
        id="room"
        label="Stanza"
        eyebrow="Ambiente"
        defaultPosition={{ left: 1180, top: 28 }}
        open={viewerMiniTabsOpenV5.room}
        onToggle={toggleViewerMiniTabV5}
      >
        <RoomPanel
          environment={effectiveEnvironment}
          visibility={roomQuickVisibility}
          roomVisible={roomVisible}
          onToggleRoomVisible={() => setRoomVisible((current) => !current)}
          onToggleWall={toggleRoomQuickVisibility}
          onResetWalls={resetRoomQuickVisibility}
          onApplyRoom={applyRoomPanelSettings}
          onResetRoom={resetRoomPanelSettings}
        />
      </ViewerMiniTab>

      <ViewerMiniTab
        id="view"
        label="Vista"
        eyebrow="Viewer Tools"
        defaultPosition={{ left: 1180, top: 73 }}
        open={viewerMiniTabsOpenV5.view}
        onToggle={toggleViewerMiniTabV5}
      >
        <ViewerToolsPanel
          xRayEnabled={xRayEnabled}
          xRayOpacity={xRayOpacity}
          onToggleXRay={onToggleXRay}
          onChangeXRayOpacity={onChangeXRayOpacity}
          contoursEnabled={viewerModelEdgesEnabled}
          onToggleContours={() => setViewerModelEdgesEnabled((current) => !current)}
          onFocus={() => emitViewerCommand("bagastudio:focus-selection")}
          onFit={() => emitViewerCommand("bagastudio:autofit-camera")}
          onResetView={() => emitViewerCommand("bagastudio:reset-camera")}
          onSaveCameraPreset={(viewId) => emitViewerCommand("bagastudio:save-camera-preset", { viewId })}
          onApplyCameraPreset={(viewId) => emitViewerCommand("bagastudio:apply-camera-preset", { viewId })}
        />
      </ViewerMiniTab>

      <ViewerMiniTab
        id="module"
        label="Modulo"
        eyebrow="Modulo V1"
        defaultPosition={{ left: 1180, top: 118 }}
        open={viewerMiniTabsOpenV5.module}
        onToggle={toggleViewerMiniTabV5}
      >
        <div className="w-[390px] rounded-3xl border border-cyan-300/22 bg-slate-950/92 p-4 text-xs text-cyan-50 shadow-[0_22px_70px_rgba(0,0,0,0.50)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Modulo Parametrico V1</div>
              <div className="mt-1 text-lg font-black uppercase tracking-wide text-white">Crea e misura</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-200">
              {activeSceneModuleV1?.name || "Modulo"}
              <div className="mt-1 text-cyan-200">{activeSceneModuleDimensionsV1.width}×{activeSceneModuleDimensionsV1.depth}×{activeSceneModuleDimensionsV1.height}</div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-emerald-300/18 bg-emerald-400/8 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Pad nuovo modulo</div>
                <div className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-300">
                  Questi campi preparano il prossimo modulo. Non modificano il modulo selezionato finché non premi Applica.
                </div>
              </div>
              <button
                type="button"
                onClick={copyActiveModuleToDraftV2}
                className="shrink-0 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-100 hover:bg-white/14"
              >
                Usa selez.
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                ["width", "Larghezza", moduleDraftDimensionsV2.width],
                ["depth", "Profondità", moduleDraftDimensionsV2.depth],
                ["height", "Altezza", moduleDraftDimensionsV2.height],
              ] as const).map(([key, label, value]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-slate-950/52 p-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">
                  {label}
                  <input
                    type="number"
                    min={5}
                    max={1200}
                    step={1}
                    value={value}
                    onChange={(event) => updateModuleDraftDimensionV2(key, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300/18 bg-slate-950/90 px-2 py-1.5 text-sm font-black text-white outline-none focus:border-emerald-300/55"
                  />
                  <span className="mt-1 block text-[8px] text-slate-500">cm</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={addParametricSceneModuleV1}
              className="rounded-2xl border border-emerald-300/25 bg-emerald-400/16 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50 hover:bg-emerald-400/28"
            >
              + Crea nuovo
            </button>
            <button
              type="button"
              onClick={duplicateActiveSceneModuleV42}
              disabled={!activeSceneModuleIdV38}
              className="rounded-2xl border border-cyan-300/25 bg-cyan-400/14 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-50 hover:bg-cyan-400/24"
            >
              Duplica selez.
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={applyDraftDimensionsToActiveModuleV2}
              disabled={!activeSceneModuleIdV38 || !activeSceneModuleIsParametricV1}
              className="rounded-2xl border border-amber-300/25 bg-amber-400/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-50 hover:bg-amber-400/22 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Applica al selez.
            </button>
            <button
              type="button"
              onClick={deleteActiveSceneModuleV42}
              disabled={!activeSceneModuleIdV38}
              className="rounded-2xl border border-rose-300/25 bg-rose-400/14 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-rose-50 hover:bg-rose-400/24 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Elimina selez.
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-amber-300/18 bg-amber-400/10 p-3 text-[10px] font-semibold leading-relaxed text-amber-100/90">
            Module UX V2.6.4: movimento solo su modulo selezionato, clamp usa le misure reali del modulo e creazione si blocca se non trova spazio libero.
          </div>
        </div>

        <SceneComposerPanel
          modelSceneOffset={modelSceneOffset}
          resetModelRoomPosition={resetModelRoomPosition}
          moveModelInRoom={moveModelInRoom}
          rotateModelInRoom={rotateModelInRoom}
          activeWallSnap={activeWallSnap}
          wallSnapDistanceMode={wallSnapDistanceMode}
          setWallSnapDistanceMode={setWallSnapDistanceMode}
          customWallSnapDistanceCm={customWallSnapDistanceCm}
          setCustomWallSnapDistanceCm={setCustomWallSnapDistanceCm}
          getWallSnapModeLabel={getWallSnapModeLabel}
          snapModelToWall={snapModelToWall}
          sceneModulesV38={sceneModulesV38}
          activeSceneModuleIdV38={activeSceneModuleIdV38 || ""}
          selectSceneModuleV38={selectSceneModuleV38}
          addSceneModuleSnapshotV38={addSceneModuleSnapshotV38}
          duplicateActiveSceneModuleV42={duplicateActiveSceneModuleV42}
          deleteActiveSceneModuleV42={deleteActiveSceneModuleV42}
        />
      </ViewerMiniTab>

      <ViewerMiniTab
        id="quotes"
        label="Quote"
        eyebrow="Misure"
        defaultPosition={{ left: 1180, top: 163 }}
        open={viewerMiniTabsOpenV5.quotes}
        onToggle={toggleViewerMiniTabV5}
      >
        <div className="w-[390px] rounded-3xl border border-cyan-300/22 bg-slate-950/90 p-4 text-xs text-cyan-50 shadow-[0_22px_70px_rgba(0,0,0,0.50)] backdrop-blur-xl">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Quote V5</div>
          <div className="mt-1 text-lg font-black uppercase tracking-wide text-white">Misure ambiente</div>
          <div className="mt-3 rounded-2xl border border-emerald-300/18 bg-emerald-400/10 p-3 text-[11px] font-semibold leading-relaxed text-emerald-100/90">
            Quote visibili nel Viewer: stanza, moduli e ingombri principali. Questa è la base per quotare tutto senza coprire il modello.
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-2 text-slate-200">Stanza<br />{effectiveEnvironment?.roomWidthCm ?? baseRoomEnvironment?.roomWidthCm ?? 420}×{effectiveEnvironment?.roomDepthCm ?? baseRoomEnvironment?.roomDepthCm ?? 360}×{effectiveEnvironment?.roomHeightCm ?? baseRoomEnvironment?.roomHeightCm ?? 280}</div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-2 text-slate-200">Modulo<br />{activeSceneModuleDimensionsV1.width}×{activeSceneModuleDimensionsV1.depth}×{activeSceneModuleDimensionsV1.height}</div>
          </div>
          <div className="mt-3 rounded-2xl border border-amber-300/18 bg-amber-400/10 p-3 text-[10px] font-semibold leading-relaxed text-amber-100/90">
            Prossimo livello: distanza da pareti, distanza tra moduli, battiscopa, snap e quote selezionabili per schede tecniche/PDF.
          </div>
        </div>
      </ViewerMiniTab>

      <ViewerMiniTab
        id="help"
        label="Aiuto"
        eyebrow="Guida"
        defaultPosition={{ left: 1180, top: 208 }}
        open={viewerMiniTabsOpenV5.help}
        onToggle={toggleViewerMiniTabV5}
      >
        <div className="w-[390px] rounded-3xl border border-amber-300/22 bg-slate-950/90 p-4 text-xs text-amber-50 shadow-[0_22px_70px_rgba(0,0,0,0.50)] backdrop-blur-xl">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Guida rapida</div>
          <div className="mt-2 space-y-2 text-[11px] font-semibold leading-relaxed text-amber-100/85">
            <p><b>STANZA</b>: misure, pareti, battiscopa.</p>
            <p><b>MODULO</b>: movimento, snap, duplica/elimina.</p>
            <p><b>VISTA</b>: X-Ray, contorni, focus, fit.</p>
            <p><b>QUOTE</b>: misure tecniche in arrivo nello step dedicato.</p>
          </div>
        </div>
      </ViewerMiniTab>
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-2xl border border-cyan-400/20 bg-slate-950/55 p-2 text-[11px] font-black text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-md">
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:focus-selection")}
          className="rounded-xl border border-cyan-300/25 bg-cyan-500/15 px-3 py-2 uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-400/25"
          title="Focus selezione"
        >
          Focus
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:camera-orbit-left")}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 text-base transition hover:bg-white/20"
          title="Ruota camera a sinistra"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:camera-orbit-right")}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 text-base transition hover:bg-white/20"
          title="Ruota camera a destra"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:camera-orbit-up")}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 text-base transition hover:bg-white/20"
          title="Inclina camera verso l'alto"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:camera-orbit-down")}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 text-base transition hover:bg-white/20"
          title="Inclina camera verso il basso"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:autofit-camera")}
          className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-400/20"
          title="Adatta modello alla vista"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={() => emitViewerCommand("bagastudio:reset-camera")}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 uppercase tracking-wide transition hover:bg-white/20"
          title="Reset vista 3D"
        >
          Reset
        </button>
      </div>

      <Canvas
        shadows
        camera={{ position: [20, 10, 22], fov: 70 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onContextMenu={(event) => event.preventDefault()}
        onPointerMissed={() => {
          selectSceneModuleV38(null);
        }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          bagastudioRendererMaxAnisotropy = Math.max(8, gl.capabilities.getMaxAnisotropy?.() || 8);
        }}
      >
        <color attach="background" args={["#07111c"]} />

        <ambientLight intensity={1.25} />

        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={2.7}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <directionalLight
          position={[-4, 4, -3]}
          intensity={1.6}
        />

        <pointLight
          position={[0, 3, 3]}
          intensity={1.2}
        />

        <Environment preset="apartment" />

<CameraController activeViewId={activeViewId} views={views} environment={effectiveEnvironment} />
<ViewerRuntimeControls activeViewId={activeViewId} views={views} productParts={productParts} environment={effectiveEnvironment} />

        <PremiumRoomEnvironment environment={roomVisible ? effectiveEnvironment : undefined} />

        {parametricSceneModulesV1.map((module: any) => (
          <ParametricSceneModuleV1
            key={`parametric-module-v1-${module.id}`}
            module={module}
            active={module.id === activeSceneModuleIdV38}
            visualFeedback={
              collisionHighlightModuleIdsV1.has(String(module.id))
                ? "collision"
                : joinHighlightModuleIdsV43.has(String(module.id))
                  ? "join"
                  : null
            }
            onSelect={selectSceneModuleV38}
          />
        ))}

        {effectiveProductModel && importedSceneModulesV1.length > 0 && (
        <ProductModel
  width={activeSceneModuleIsParametricV1 ? normalizeModuleDimensionCmV1(activeImportedSceneModuleForRenderV1?.dimensions?.width, Number(width || 180)) : activeSceneModuleDimensionsV1.width}
  height={activeSceneModuleIsParametricV1 ? normalizeModuleDimensionCmV1(activeImportedSceneModuleForRenderV1?.dimensions?.height, Number(height || 100)) : activeSceneModuleDimensionsV1.height}
  depth={activeSceneModuleIsParametricV1 ? normalizeModuleDimensionCmV1(activeImportedSceneModuleForRenderV1?.dimensions?.depth, Number(depth || 60)) : activeSceneModuleDimensionsV1.depth}
  importedModelName={effectiveImportedModelName}
  materials={materials}
  productMaterials={productMaterials}
  accessories={accessories}
  inserts={inserts}
  insertMaterials={insertMaterials}
  insertSizes={insertSizes}
  ledKelvin={ledKelvin}
  ledIntensity={ledIntensity ?? ledIntensityStore}
  visibility={visibility}
  productModel={effectiveProductModel}
  productModelFormat={effectiveProductModelFormat}
  productParts={productParts}
  woodDirection={woodDirection}
  environment={effectiveEnvironment}
  importCalibration={importCalibration}
  modelSceneOffset={activeSceneModuleIsParametricV1 ? normalizeSceneTransformV42(activeImportedSceneModuleForRenderV1?.transform || { x: 0, z: -0.62, rotationYDeg: 0 }) : modelSceneOffset}
  sceneModules={importedSceneModulesV1}
  activeSceneModuleId={activeSceneModuleIsParametricV1 ? String(activeImportedSceneModuleForRenderV1?.id || "") : activeSceneModuleIdV38 || ""}
  activeSceneModuleStatus={candidateSceneModuleStatusV42}
  onSelectSceneModule={selectSceneModuleV38}
  xRayEnabled={xRayEnabled}
  xRayOpacity={xRayOpacity}
  modelEdgesEnabled={viewerModelEdgesEnabled}
/>
        )}

        <ViewerQuoteOverlayV5
          enabled={viewerMiniTabsOpenV5.quotes}
          environment={effectiveEnvironment || baseRoomEnvironment}
          sceneModules={sceneModulesV38}
          activeSceneModuleId={activeSceneModuleIdV38 ?? undefined}
          productWidthCm={activeSceneModuleDimensionsV1.width}
          productDepthCm={activeSceneModuleDimensionsV1.depth}
          productHeightCm={activeSceneModuleDimensionsV1.height}
        />

      <OrbitControls
  makeDefault
  enableRotate={true}
  enablePan={true}
  enableZoom={true}
  enableDamping={true}
  dampingFactor={0.08}
  mouseButtons={{
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }}
/>
      
      {/* Runtime Placeholder Geometry V2 disattivata in Recovery DAE/Viewer V1.
          I placeholder metadata non devono generare pannelli visibili nel Viewer cliente:
          creavano pezzi estranei al modello reale e mascheravano il DAE caricato. */}

</Canvas>

    </div>
  );
}




/* =========================
   BagaStudio Importer Save System V1
========================= */

declare global {
  interface Window {
   bagastudioSaveCompleteProductPackage?: () => Promise<any>;
    bagastudioGetLastSavedProductPackage?: () => any;
    bagastudioSaveLastProductToLibrary?: (options?: any) => any;
    bagastudioGetProductLibrary?: () => any[];
    bagastudioExportProductLibrary?: () => any[];
    bagastudioLoadProductFromLibrary?: (productIdOrSlug: string) => any;
    bagastudioRemoveProductFromLibrary?: (productIdOrSlug: string) => any[];
    bagastudioClearProductLibrary?: () => any[];
    bagastudioSearchProductLibrary?: (query?: string, filters?: any) => any[];
    bagastudioGetProductLibraryCategories?: () => string[];
    bagastudioGetProductLibraryCardData?: (query?: string, filters?: any) => any[];
    bagastudioImportProductLibrary?: (libraryJson: any, options?: any) => any[];
    bagastudioPrepareProductFromLibrary?: (productIdOrSlug: string, options?: any) => any;
    bagastudioApplyPreparedProduct?: (options?: any) => any;
    bagastudioGetPreparedProduct?: () => any;
  }
}

let __bagastudioLastSavedPackage: any = null;

async function bagastudioSaveCompleteProductPackageRuntime() {
  try {
    const runtimePackage = {
      savedAt: new Date().toISOString(),
      version: "ImporterSaveSystemV1",
      productPackage: (window as any).bagastudioProductPackage || null,
      adminMapping: (window as any).bagastudioAdminMapping || null,
      importerReport: (window as any).bagastudioLastImporterReport || null,
      thumbnail: (window as any).__bagastudioLastProductThumbnail || null,
      metadata: {
        engine: "BagaStudio Core",
        pipeline: "Importer Pipeline V2",
      },
    };

    __bagastudioLastSavedPackage = runtimePackage;

    const blob = new Blob(
      [JSON.stringify(runtimePackage, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bagastudio-complete-product-package.json";
    a.click();

    URL.revokeObjectURL(url);

    window.dispatchEvent(
      new CustomEvent("bagastudio:complete-product-package-saved", {
        detail: runtimePackage,
      })
    );

    return runtimePackage;
  } catch (error) {
    console.error("BagaStudio Save System Error", error);

    window.dispatchEvent(
      new CustomEvent("bagastudio:complete-product-package-save-error", {
        detail: error,
      })
    );
  }
}


/* =========================
   BagaStudio Product Library V1
========================= */

const BAGASTUDIO_PRODUCT_LIBRARY_KEY = "bagastudio.productLibrary.v1";

function bagastudioCreateProductLibraryId(base = "product") {
  const cleanBase = String(base || "product")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

  return `${cleanBase}-${Date.now()}`;
}

function bagastudioReadProductLibrary() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio Product Library read error", error);
    return [];
  }
}

function bagastudioWriteProductLibrary(items: any[]) {
  if (typeof window === "undefined") return [];

  const safeItems = Array.isArray(items) ? items : [];
  window.localStorage.setItem(
    BAGASTUDIO_PRODUCT_LIBRARY_KEY,
    JSON.stringify(safeItems)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-updated", {
      detail: safeItems,
    })
  );

  return safeItems;
}

function bagastudioSaveLastProductToLibrary(options: any = {}) {
  const sourcePackage =
    __bagastudioLastSavedPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  if (!sourcePackage) {
    const error = new Error("No BagaStudio product package available to save");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-save-error", {
        detail: error,
      })
    );

    throw error;
  }

  const productPackage = sourcePackage.productPackage || sourcePackage;
  const suggestedName =
    options.name ||
    productPackage?.productName ||
    productPackage?.name ||
    productPackage?.metadata?.name ||
    "BagaStudio Product";

  const productId =
    options.productId ||
    productPackage?.productId ||
    productPackage?.id ||
    bagastudioCreateProductLibraryId(suggestedName);

  const productSlug =
    options.productSlug ||
    productPackage?.productSlug ||
    String(suggestedName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const libraryItem = {
    productId,
    productSlug,
    name: suggestedName,
    category: options.category || productPackage?.productCategory || "uncategorized",
    version: options.version || productPackage?.version || "1.0.0",
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFormat: options.sourceFormat || productPackage?.sourceFormat || null,
    thumbnail:
      options.thumbnail ||
      sourcePackage.thumbnail ||
      (window as any).__bagastudioLastProductThumbnail ||
      null,
    package: sourcePackage,
  };

  const currentLibrary = bagastudioReadProductLibrary();
  const filteredLibrary = currentLibrary.filter(
    (item: any) =>
      item?.productId !== libraryItem.productId &&
      item?.productSlug !== libraryItem.productSlug
  );

  const nextLibrary = [libraryItem, ...filteredLibrary];
  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-item-saved", {
      detail: libraryItem,
    })
  );

  return libraryItem;
}

function bagastudioLoadProductFromLibrary(productIdOrSlug: string) {
  const library = bagastudioReadProductLibrary();
  const item = library.find(
    (entry: any) =>
      entry?.productId === productIdOrSlug || entry?.productSlug === productIdOrSlug
  );

  if (!item) {
    const error = new Error(`BagaStudio product not found: ${productIdOrSlug}`);

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-load-error", {
        detail: error,
      })
    );

    throw error;
  }

  __bagastudioLastSavedPackage = item.package || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = item;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-item-loaded", {
      detail: item,
    })
  );

  return item;
}

function bagastudioRemoveProductFromLibrary(productIdOrSlug: string) {
  const nextLibrary = bagastudioReadProductLibrary().filter(
    (entry: any) =>
      entry?.productId !== productIdOrSlug && entry?.productSlug !== productIdOrSlug
  );

  return bagastudioWriteProductLibrary(nextLibrary);
}

function bagastudioClearProductLibrary() {
  return bagastudioWriteProductLibrary([]);
}

function bagastudioExportProductLibrary() {
  const library = bagastudioReadProductLibrary();
  const blob = new Blob([JSON.stringify(library, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bagastudio-product-library-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-exported", {
      detail: library,
    })
  );

  return library;
}



/* =========================
   BagaStudio Catalog Browser V1
========================= */

function bagastudioNormalizeCatalogText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioSearchProductLibrary(query = "", filters: any = {}) {
  const library = bagastudioReadProductLibrary();
  const normalizedQuery = bagastudioNormalizeCatalogText(query);
  const categoryFilter = bagastudioNormalizeCatalogText(filters?.category || "");
  const sourceFormatFilter = bagastudioNormalizeCatalogText(filters?.sourceFormat || "");

  const results = library.filter((item: any) => {
    const searchableText = bagastudioNormalizeCatalogText([
      item?.name,
      item?.productId,
      item?.productSlug,
      item?.category,
      item?.version,
      item?.sourceFormat,
      item?.package?.metadata?.engine,
      item?.package?.metadata?.pipeline,
    ].filter(Boolean).join(" "));

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory =
      !categoryFilter || bagastudioNormalizeCatalogText(item?.category) === categoryFilter;
    const matchesSourceFormat =
      !sourceFormatFilter || bagastudioNormalizeCatalogText(item?.sourceFormat) === sourceFormatFilter;

    return matchesQuery && matchesCategory && matchesSourceFormat;
  });

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-search", {
      detail: {
        query,
        filters,
        count: results.length,
        results,
      },
    })
  );

  return results;
}

function bagastudioGetProductLibraryCategories() {
  const categories = bagastudioReadProductLibrary()
    .map((item: any) => item?.category || "uncategorized")
    .filter(Boolean);

  return Array.from(new Set(categories)).sort((a: any, b: any) =>
    String(a).localeCompare(String(b))
  );
}

function bagastudioGetProductLibraryCardData(query = "", filters: any = {}) {
  return bagastudioSearchProductLibrary(query, filters).map((item: any) => ({
    productId: item?.productId,
    productSlug: item?.productSlug,
    name: item?.name || "BagaStudio Product",
    category: item?.category || "uncategorized",
    version: item?.version || "1.0.0",
    sourceFormat: item?.sourceFormat || null,
    savedAt: item?.savedAt || null,
    updatedAt: item?.updatedAt || null,
    thumbnail: item?.thumbnail || null,
    hasPackage: Boolean(item?.package),
    hasAdminMapping: Boolean(item?.package?.adminMapping || item?.package?.productPackage?.adminMapping),
    hasImporterReport: Boolean(item?.package?.importerReport),
  }));
}

function bagastudioImportProductLibrary(libraryJson: any, options: any = {}) {
  const incomingLibrary = Array.isArray(libraryJson)
    ? libraryJson
    : Array.isArray(libraryJson?.items)
      ? libraryJson.items
      : [];

  if (!incomingLibrary.length) {
    const error = new Error("Invalid BagaStudio product library import");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-library-import-error", {
        detail: error,
      })
    );

    throw error;
  }

  const currentLibrary = options?.replace ? [] : bagastudioReadProductLibrary();
  const currentByKey = new Map(
    currentLibrary.map((item: any) => [item?.productId || item?.productSlug, item])
  );

  incomingLibrary.forEach((item: any) => {
    const key = item?.productId || item?.productSlug || bagastudioCreateProductLibraryId(item?.name);
    currentByKey.set(key, {
      ...item,
      productId: item?.productId || key,
      productSlug:
        item?.productSlug ||
        String(item?.name || key)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      updatedAt: new Date().toISOString(),
    });
  });

  const nextLibrary = Array.from(currentByKey.values()).sort((a: any, b: any) =>
    String(b?.updatedAt || b?.savedAt || "").localeCompare(String(a?.updatedAt || a?.savedAt || ""))
  );

  bagastudioWriteProductLibrary(nextLibrary);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-library-imported", {
      detail: {
        replace: Boolean(options?.replace),
        count: incomingLibrary.length,
        library: nextLibrary,
      },
    })
  );

  return nextLibrary;
}



/* =========================
   BagaStudio Product Loader V1
========================= */

let __bagastudioPreparedLibraryProduct: any = null;

function bagastudioExtractProductRuntimePackage(libraryItem: any) {
  const fullPackage = libraryItem?.package || libraryItem || null;
  const productPackage = fullPackage?.productPackage || fullPackage || null;

  return {
    libraryItem,
    fullPackage,
    productPackage,
    adminMapping:
      fullPackage?.adminMapping ||
      productPackage?.adminMapping ||
      null,
    importerReport:
      fullPackage?.importerReport ||
      productPackage?.importerReport ||
      null,
    thumbnail:
      fullPackage?.thumbnail ||
      productPackage?.thumbnail ||
      libraryItem?.thumbnail ||
      null,
    metadata: {
      ...(fullPackage?.metadata || {}),
      ...(productPackage?.metadata || {}),
      productId: libraryItem?.productId || productPackage?.productId || null,
      productSlug: libraryItem?.productSlug || productPackage?.productSlug || null,
      productName: libraryItem?.name || productPackage?.productName || productPackage?.name || null,
      category: libraryItem?.category || productPackage?.productCategory || null,
      sourceFormat: libraryItem?.sourceFormat || productPackage?.sourceFormat || null,
    },
  };
}

function bagastudioPrepareProductFromLibrary(productIdOrSlug: string, options: any = {}) {
  const libraryItem = bagastudioLoadProductFromLibrary(productIdOrSlug);
  const prepared = bagastudioExtractProductRuntimePackage(libraryItem);

  __bagastudioPreparedLibraryProduct = {
    ...prepared,
    preparedAt: new Date().toISOString(),
    options,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-prepared", {
      detail: __bagastudioPreparedLibraryProduct,
    })
  );

  if (options?.autoApply) {
    return bagastudioApplyPreparedProduct(options);
  }

  return __bagastudioPreparedLibraryProduct;
}

function bagastudioApplyPreparedProduct(options: any = {}) {
  if (!__bagastudioPreparedLibraryProduct) {
    const error = new Error("No prepared BagaStudio product available");

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-loader-apply-error", {
        detail: error,
      })
    );

    throw error;
  }

  const prepared = __bagastudioPreparedLibraryProduct;

  __bagastudioLastSavedPackage = prepared.fullPackage || null;
  (window as any).bagastudioProductPackage = prepared.productPackage || null;
  (window as any).bagastudioAdminMapping = prepared.adminMapping || null;
  (window as any).bagastudioLastImporterReport = prepared.importerReport || null;
  (window as any).__bagastudioLastProductThumbnail = prepared.thumbnail || null;
  (window as any).__bagastudioLastLoadedLibraryProduct = prepared.libraryItem || null;

  const safeApply = (window as any).bagastudioSafeApplyImporterState;
  if (options?.safeApply && typeof safeApply === "function") {
    try {
      safeApply();
    } catch (error) {
      console.warn("BagaStudio Product Loader safe apply skipped", error);
    }
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-loader-applied", {
      detail: prepared,
    })
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:importer-ui-state-refresh", {
      detail: prepared,
    })
  );

  return prepared;
}

function bagastudioGetPreparedProduct() {
  return __bagastudioPreparedLibraryProduct;
}

if (typeof window !== "undefined") {
  window.bagastudioSaveCompleteProductPackage =
    bagastudioSaveCompleteProductPackageRuntime;

  window.bagastudioGetLastSavedProductPackage = () =>
    __bagastudioLastSavedPackage;


  window.bagastudioSaveLastProductToLibrary =
    bagastudioSaveLastProductToLibrary;
  window.bagastudioGetProductLibrary = bagastudioReadProductLibrary;
  window.bagastudioExportProductLibrary = bagastudioExportProductLibrary;
  window.bagastudioLoadProductFromLibrary = bagastudioLoadProductFromLibrary;
  window.bagastudioRemoveProductFromLibrary = bagastudioRemoveProductFromLibrary;
  window.bagastudioClearProductLibrary = bagastudioClearProductLibrary;
  window.bagastudioSearchProductLibrary = bagastudioSearchProductLibrary;
  window.bagastudioGetProductLibraryCategories = bagastudioGetProductLibraryCategories;
  window.bagastudioGetProductLibraryCardData = bagastudioGetProductLibraryCardData;
  window.bagastudioImportProductLibrary = bagastudioImportProductLibrary;
  window.bagastudioPrepareProductFromLibrary = bagastudioPrepareProductFromLibrary;
  window.bagastudioApplyPreparedProduct = bagastudioApplyPreparedProduct;
  window.bagastudioGetPreparedProduct = bagastudioGetPreparedProduct;
}




/* =========================
   BagaStudio Drag & Drop Importer V1
   Conservative runtime bridge: does not replace props or existing loader logic.
========================= */

declare global {
  interface Window {
    bagastudioEnableDragDropImporter?: () => any;
    bagastudioDisableDragDropImporter?: () => any;
    bagastudioGetLastDroppedImport?: () => any;
    bagastudioClearLastDroppedImport?: () => void;
  }
}

let __bagastudioDragDropInstalled = false;
let __bagastudioLastDroppedImport: any = null;
let __bagastudioDragDropCleanup: null | (() => void) = null;

const BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS = ["glb", "gltf", "obj", "fbx", "stl", "dae"];
const BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS = ["json"];

function bagastudioGetFileExtension(fileName: string) {
  return String(fileName || "")
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase() || "";
}

function bagastudioIsSupportedDragFile(file: File) {
  const ext = bagastudioGetFileExtension(file.name);
  return (
    BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS.includes(ext) ||
    BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS.includes(ext)
  );
}

function bagastudioReadDroppedJson(file: File) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result || "{}")));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read dropped JSON file"));
    reader.readAsText(file);
  });
}

async function bagastudioHandleDroppedFiles(files: File[]) {
  const validFiles = files.filter(bagastudioIsSupportedDragFile);

  if (!validFiles.length) {
    const warning = {
      status: "warning",
      message: "Nessun file supportato. Formati: GLB, GLTF, OBJ, FBX, STL, DAE, JSON.",
      droppedAt: new Date().toISOString(),
      files: files.map((file) => file.name),
    };

    window.dispatchEvent(new CustomEvent("bagastudio:drag-drop-import-warning", { detail: warning }));
    return warning;
  }

  const result: any = {
    status: "ready",
    droppedAt: new Date().toISOString(),
    models: [],
    packages: [],
    files: validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || null,
      extension: bagastudioGetFileExtension(file.name),
    })),
  };

  for (const file of validFiles) {
    const extension = bagastudioGetFileExtension(file.name);

    if (BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS.includes(extension)) {
      const objectUrl = URL.createObjectURL(file);
      const modelPayload = {
        name: file.name,
        size: file.size,
        type: file.type || null,
        format: extension,
        objectUrl,
        file,
        importedAt: new Date().toISOString(),
      };

      result.models.push(modelPayload);

      window.dispatchEvent(
        new CustomEvent("bagastudio:drag-drop-model-ready", {
          detail: modelPayload,
        })
      );
    }

    if (BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS.includes(extension)) {
      try {
        const json = await bagastudioReadDroppedJson(file);
        const packagePayload = {
          name: file.name,
          size: file.size,
          type: file.type || "application/json",
          json,
          importedAt: new Date().toISOString(),
        };

        result.packages.push(packagePayload);

        window.dispatchEvent(
          new CustomEvent("bagastudio:drag-drop-json-ready", {
            detail: packagePayload,
          })
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent("bagastudio:drag-drop-json-error", {
            detail: {
              name: file.name,
              error,
              message: error instanceof Error ? error.message : "Errore lettura JSON",
            },
          })
        );
      }
    }
  }

  __bagastudioLastDroppedImport = result;

  window.dispatchEvent(
    new CustomEvent("bagastudio:drag-drop-import-ready", {
      detail: result,
    })
  );

  return result;
}

function bagastudioEnableDragDropImporterRuntime() {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  if (__bagastudioDragDropInstalled) {
    return {
      status: "already-enabled",
      lastDroppedImport: __bagastudioLastDroppedImport,
    };
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.add("bagastudio-drag-over");

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-over", {
        detail: { active: true },
      })
    );
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove("bagastudio-drag-over");

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-over", {
        detail: { active: false },
      })
    );
  };

  const onDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove("bagastudio-drag-over");

    const files = Array.from(event.dataTransfer?.files || []);

    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-start", {
        detail: {
          count: files.length,
          files: files.map((file) => file.name),
        },
      })
    );

    try {
      await bagastudioHandleDroppedFiles(files);
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("bagastudio:drag-drop-import-error", {
          detail: {
            error,
            message: error instanceof Error ? error.message : "Errore import drag & drop",
          },
        })
      );
    }
  };

  window.addEventListener("dragover", onDragOver);
  window.addEventListener("dragleave", onDragLeave);
  window.addEventListener("drop", onDrop);

  __bagastudioDragDropCleanup = () => {
    window.removeEventListener("dragover", onDragOver);
    window.removeEventListener("dragleave", onDragLeave);
    window.removeEventListener("drop", onDrop);
    document.body.classList.remove("bagastudio-drag-over");
  };

  __bagastudioDragDropInstalled = true;

  const enabledPayload = {
    status: "enabled",
    supportedModelFormats: BAGASTUDIO_SUPPORTED_MODEL_EXTENSIONS,
    supportedPackageFormats: BAGASTUDIO_SUPPORTED_PACKAGE_EXTENSIONS,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:drag-drop-importer-enabled", {
      detail: enabledPayload,
    })
  );

  return enabledPayload;
}

function bagastudioDisableDragDropImporterRuntime() {
  if (__bagastudioDragDropCleanup) {
    __bagastudioDragDropCleanup();
  }

  __bagastudioDragDropInstalled = false;
  __bagastudioDragDropCleanup = null;

  const disabledPayload = { status: "disabled" };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:drag-drop-importer-disabled", {
        detail: disabledPayload,
      })
    );
  }

  return disabledPayload;
}

if (typeof window !== "undefined") {
  (window as any).bagastudioEnableDragDropImporter = bagastudioEnableDragDropImporterRuntime;
  (window as any).bagastudioDisableDragDropImporter = bagastudioDisableDragDropImporterRuntime;
  (window as any).bagastudioGetLastDroppedImport = () => __bagastudioLastDroppedImport;
  (window as any).bagastudioClearLastDroppedImport = () => {
    __bagastudioLastDroppedImport = null;
  };

  bagastudioEnableDragDropImporterRuntime();
}


/* =========================
   BagaStudio Cloud Ready Storage Bridge V1
   Local-first bridge prepared for future backend/cloud persistence.
   It does not replace the current Product Library or Importer Save System.
========================= */

declare global {
  interface Window {
    bagastudioBuildCloudProductPayload?: (options?: any) => any;
    bagastudioSaveProductToCloudBridge?: (options?: any) => any;
    bagastudioGetCloudBridgeQueue?: () => any[];
    bagastudioClearCloudBridgeQueue?: () => any[];
    bagastudioMarkCloudBridgeItemSynced?: (cloudBridgeId: string, remoteData?: any) => any;
    bagastudioExportCloudBridgeQueue?: () => any[];
  }
}

const BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY = "bagastudio.cloudBridge.queue.v1";
let __bagastudioLastCloudBridgePayload: any = null;

function bagastudioReadCloudBridgeQueue(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio cloud bridge queue read failed", error);
    return [];
  }
}

function bagastudioWriteCloudBridgeQueue(queue: any[]) {
  if (typeof window === "undefined") return [];

  const normalizedQueue = Array.isArray(queue) ? queue : [];
  window.localStorage.setItem(
    BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY,
    JSON.stringify(normalizedQueue)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-queue-updated", {
      detail: normalizedQueue,
    })
  );

  return normalizedQueue;
}

function bagastudioBuildCloudProductPayloadRuntime(options: any = {}) {
  const savedPackage =
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const productPackage =
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const thumbnail =
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const catalogProduct =
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const payload = {
    cloudBridgeId:
      options.cloudBridgeId ||
      `cloud_bridge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    target: options.target || "local-first-cloud-ready",
    tenantId: options.tenantId || null,
    workspaceId: options.workspaceId || null,
    productId:
      options.productId ||
      catalogProduct?.productId ||
      productPackage?.productId ||
      productPackage?.id ||
      null,
    productSlug:
      options.productSlug ||
      catalogProduct?.productSlug ||
      productPackage?.productSlug ||
      null,
    productName:
      options.productName ||
      catalogProduct?.productName ||
      productPackage?.productName ||
      productPackage?.name ||
      "BagaStudio Imported Product",
    productCategory:
      options.productCategory ||
      catalogProduct?.productCategory ||
      productPackage?.productCategory ||
      "uncategorized",
    source: {
      engine: "BagaStudio Core",
      module: "CloudReadyStorageBridgeV1",
      mode: "local-first",
    },
    assets: {
      glb: options.glb || null,
      textureRefs: options.textureRefs || productPackage?.textureRefs || [],
      thumbnail,
    },
    data: {
      catalogProduct,
      productPackage,
      adminMapping,
      importerReport,
      savedPackage,
    },
    sync: {
      isSynced: false,
      remoteId: null,
      remoteUrl: null,
      syncedAt: null,
      lastError: null,
    },
  };

  __bagastudioLastCloudBridgePayload = payload;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bagastudio:cloud-bridge-payload-ready", {
        detail: payload,
      })
    );
  }

  return payload;
}

function bagastudioSaveProductToCloudBridgeRuntime(options: any = {}) {
  const payload = bagastudioBuildCloudProductPayloadRuntime(options);
  const queue = bagastudioReadCloudBridgeQueue();
  const nextQueue = [payload, ...queue].slice(0, options.maxItems || 50);
  bagastudioWriteCloudBridgeQueue(nextQueue);

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-product-queued", {
      detail: payload,
    })
  );

  return payload;
}

function bagastudioMarkCloudBridgeItemSyncedRuntime(cloudBridgeId: string, remoteData: any = {}) {
  const queue = bagastudioReadCloudBridgeQueue();
  const updatedQueue = queue.map((item) => {
    if (item?.cloudBridgeId !== cloudBridgeId) return item;

    return {
      ...item,
      status: "synced",
      updatedAt: new Date().toISOString(),
      sync: {
        ...(item.sync || {}),
        isSynced: true,
        remoteId: remoteData.remoteId || item.sync?.remoteId || null,
        remoteUrl: remoteData.remoteUrl || item.sync?.remoteUrl || null,
        syncedAt: new Date().toISOString(),
        lastError: null,
      },
    };
  });

  bagastudioWriteCloudBridgeQueue(updatedQueue);

  const syncedItem = updatedQueue.find((item) => item?.cloudBridgeId === cloudBridgeId) || null;

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-item-synced", {
      detail: syncedItem,
    })
  );

  return syncedItem;
}

if (typeof window !== "undefined") {
  window.bagastudioBuildCloudProductPayload = bagastudioBuildCloudProductPayloadRuntime;
  window.bagastudioSaveProductToCloudBridge = bagastudioSaveProductToCloudBridgeRuntime;
  window.bagastudioGetCloudBridgeQueue = bagastudioReadCloudBridgeQueue;
  window.bagastudioClearCloudBridgeQueue = () => bagastudioWriteCloudBridgeQueue([]);
  window.bagastudioMarkCloudBridgeItemSynced = bagastudioMarkCloudBridgeItemSyncedRuntime;
  window.bagastudioExportCloudBridgeQueue = () => bagastudioReadCloudBridgeQueue();

  window.dispatchEvent(
    new CustomEvent("bagastudio:cloud-bridge-ready", {
      detail: {
        status: "ready",
        mode: "local-first",
        storageKey: BAGASTUDIO_CLOUD_BRIDGE_STORAGE_KEY,
      },
    })
  );
}



/* =========================
   BagaStudio Versioning & Backup V1
   Local-first product/package backup system for catalog-safe recovery.
   Keeps Cloud Bridge, Product Library and Importer Save System untouched.
========================= */

declare global {
  interface Window {
    bagastudioCreateProductBackup?: (options?: any) => any;
    bagastudioGetProductBackups?: () => any[];
    bagastudioGetProductBackupById?: (backupId: string) => any;
    bagastudioRestoreProductBackup?: (backupId: string) => any;
    bagastudioDeleteProductBackup?: (backupId: string) => any[];
    bagastudioClearProductBackups?: () => any[];
    bagastudioExportProductBackups?: () => any[];
  }
}

const BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY = "bagastudio.productBackups.v1";
let __bagastudioLastProductBackup: any = null;
let __bagastudioLastRestoredProductBackup: any = null;

function bagastudioReadProductBackupsRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio product backups read failed", error);
    return [];
  }
}

function bagastudioWriteProductBackupsRuntime(backups: any[]) {
  if (typeof window === "undefined") return [];

  const normalizedBackups = Array.isArray(backups) ? backups : [];
  window.localStorage.setItem(
    BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY,
    JSON.stringify(normalizedBackups)
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backups-updated", {
      detail: normalizedBackups,
    })
  );

  return normalizedBackups;
}

function bagastudioBuildProductBackupRuntime(options: any = {}) {
  const savedPackage =
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const productPackage =
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const catalogProduct =
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const thumbnail =
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const cloudPayload =
    (window as any).bagastudioBuildCloudProductPayload?.({
      target: "backup-snapshot",
    }) ||
    null;

  const createdAt = new Date().toISOString();
  const productId =
    options.productId ||
    catalogProduct?.productId ||
    productPackage?.productId ||
    productPackage?.id ||
    `bagastudio_product_${Date.now()}`;

  const backup = {
    backupId:
      options.backupId ||
      `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    backupVersion: "1.0.0",
    createdAt,
    updatedAt: createdAt,
    reason: options.reason || "manual-backup",
    label:
      options.label ||
      catalogProduct?.productName ||
      productPackage?.productName ||
      productPackage?.name ||
      "BagaStudio Product Backup",
    productId,
    productSlug:
      options.productSlug ||
      catalogProduct?.productSlug ||
      productPackage?.productSlug ||
      null,
    productCategory:
      options.productCategory ||
      catalogProduct?.productCategory ||
      productPackage?.productCategory ||
      "uncategorized",
    source: {
      engine: "BagaStudio Core",
      module: "VersioningBackupV1",
      mode: "local-first",
    },
    snapshot: {
      catalogProduct,
      productPackage,
      adminMapping,
      importerReport,
      thumbnail,
      savedPackage,
      cloudPayload,
    },
    restore: {
      canRestoreProductPackage: !!productPackage,
      canRestoreAdminMapping: !!adminMapping,
      canRestoreCatalogProduct: !!catalogProduct,
      canRestoreThumbnail: !!thumbnail,
    },
  };

  __bagastudioLastProductBackup = backup;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-built", {
      detail: backup,
    })
  );

  return backup;
}

function bagastudioCreateProductBackupRuntime(options: any = {}) {
  const backup = bagastudioBuildProductBackupRuntime(options);
  const backups = bagastudioReadProductBackupsRuntime();
  const maxItems = Number.isFinite(options.maxItems) ? options.maxItems : 25;
  const nextBackups = [backup, ...backups].slice(0, maxItems);

  bagastudioWriteProductBackupsRuntime(nextBackups);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-created", {
      detail: backup,
    })
  );

  return backup;
}

function bagastudioGetProductBackupByIdRuntime(backupId: string) {
  const backups = bagastudioReadProductBackupsRuntime();
  return backups.find((backup) => backup?.backupId === backupId) || null;
}

function bagastudioRestoreProductBackupRuntime(backupId: string) {
  const backup = bagastudioGetProductBackupByIdRuntime(backupId);

  if (!backup) {
    const result = {
      status: "error",
      backupId,
      message: "Backup not found",
    };

    window.dispatchEvent(
      new CustomEvent("bagastudio:product-backup-restore-error", {
        detail: result,
      })
    );

    return result;
  }

  const snapshot = backup.snapshot || {};

  if (snapshot.productPackage) {
    (window as any).bagastudioProductPackage = snapshot.productPackage;
  }

  if (snapshot.adminMapping) {
    (window as any).bagastudioAdminMapping = snapshot.adminMapping;
  }

  if (snapshot.importerReport) {
    (window as any).bagastudioLastImporterReport = snapshot.importerReport;
  }

  if (snapshot.catalogProduct) {
    (window as any).bagastudioCatalogProduct = snapshot.catalogProduct;
  }

  if (snapshot.thumbnail) {
    (window as any).__bagastudioLastProductThumbnail = snapshot.thumbnail;
  }

  if (snapshot.savedPackage) {
    (window as any).__bagastudioLastCompleteProductPackage = snapshot.savedPackage;
  }

  __bagastudioLastRestoredProductBackup = backup;

  const result = {
    status: "restored",
    backupId,
    restoredAt: new Date().toISOString(),
    backup,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-restored", {
      detail: result,
    })
  );

  return result;
}

function bagastudioDeleteProductBackupRuntime(backupId: string) {
  const backups = bagastudioReadProductBackupsRuntime();
  const nextBackups = backups.filter((backup) => backup?.backupId !== backupId);
  bagastudioWriteProductBackupsRuntime(nextBackups);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-deleted", {
      detail: {
        backupId,
        remaining: nextBackups.length,
      },
    })
  );

  return nextBackups;
}

if (typeof window !== "undefined") {
  window.bagastudioCreateProductBackup = bagastudioCreateProductBackupRuntime;
  window.bagastudioGetProductBackups = bagastudioReadProductBackupsRuntime;
  window.bagastudioGetProductBackupById = bagastudioGetProductBackupByIdRuntime;
  window.bagastudioRestoreProductBackup = bagastudioRestoreProductBackupRuntime;
  window.bagastudioDeleteProductBackup = bagastudioDeleteProductBackupRuntime;
  window.bagastudioClearProductBackups = () => bagastudioWriteProductBackupsRuntime([]);
  window.bagastudioExportProductBackups = () => bagastudioReadProductBackupsRuntime();

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-backup-system-ready", {
      detail: {
        status: "ready",
        storageKey: BAGASTUDIO_PRODUCT_BACKUP_STORAGE_KEY,
        mode: "local-first",
      },
    })
  );
}


/* -------------------------------------------------------------
   BagaStudio Product Registry / Index V1
   Local-first index for catalog search, Admin lists and future SaaS sync.
------------------------------------------------------------- */

declare global {
  interface Window {
    bagastudioRegisterCurrentProduct?: (options?: any) => any;
    bagastudioGetProductRegistry?: () => any[];
    bagastudioSearchProductRegistry?: (query?: string, filters?: any) => any[];
    bagastudioGetProductRegistryItem?: (productId: string) => any;
    bagastudioRemoveProductRegistryItem?: (productId: string) => any[];
    bagastudioClearProductRegistry?: () => any[];
    bagastudioExportProductRegistry?: () => any[];
  }
}

const BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY = "bagastudio.productRegistry.v1";
let __bagastudioLastRegisteredProduct: any = null;

function bagastudioSafeSlugRuntime(value: string) {
  return String(value || "bagastudio-product")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bagastudio-product";
}

function bagastudioReadProductRegistryRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio product registry read failed", error);
    return [];
  }
}

function bagastudioWriteProductRegistryRuntime(items: any[]) {
  if (typeof window === "undefined") return [];

  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];

  try {
    window.localStorage.setItem(
      BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
      JSON.stringify(cleanItems)
    );
  } catch (error) {
    console.warn("BagaStudio product registry write failed", error);
  }

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-updated", {
      detail: {
        storageKey: BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
        count: cleanItems.length,
        items: cleanItems,
      },
    })
  );

  return cleanItems;
}

function bagastudioBuildProductRegistryItemRuntime(options: any = {}) {
  const savedPackage =
    options.savedPackage ||
    (window as any).bagastudioGetLastSavedProductPackage?.() ||
    (window as any).__bagastudioLastCompleteProductPackage ||
    null;

  const catalogProduct =
    options.catalogProduct ||
    savedPackage?.catalogProduct ||
    (window as any).bagastudioCatalogProduct ||
    null;

  const productPackage =
    options.productPackage ||
    savedPackage?.productPackage ||
    (window as any).bagastudioProductPackage ||
    null;

  const adminMapping =
    options.adminMapping ||
    savedPackage?.adminMapping ||
    (window as any).bagastudioAdminMapping ||
    null;

  const importerReport =
    options.importerReport ||
    savedPackage?.importerReport ||
    (window as any).bagastudioLastImporterReport ||
    null;

  const thumbnail =
    options.thumbnail ||
    savedPackage?.thumbnail ||
    (window as any).__bagastudioLastProductThumbnail ||
    null;

  const productId =
    options.productId ||
    catalogProduct?.productId ||
    productPackage?.productId ||
    savedPackage?.productId ||
    `bagastudio_product_${Date.now()}`;

  const productName =
    options.productName ||
    catalogProduct?.productName ||
    productPackage?.productName ||
    savedPackage?.productName ||
    "BagaStudio Product";

  const category =
    options.category ||
    catalogProduct?.productCategory ||
    productPackage?.productCategory ||
    savedPackage?.productCategory ||
    "uncategorized";

  const components =
    productPackage?.components ||
    adminMapping?.components ||
    savedPackage?.components ||
    [];

  const componentCount = Array.isArray(components) ? components.length : 0;
  const sourceFormat =
    options.sourceFormat ||
    catalogProduct?.sourceFormat ||
    productPackage?.sourceFormat ||
    importerReport?.sourceFormat ||
    savedPackage?.sourceFormat ||
    "unknown";

  const now = new Date().toISOString();
  const productSlug =
    options.productSlug ||
    catalogProduct?.productSlug ||
    bagastudioSafeSlugRuntime(productName);

  const registryItem = {
    productId,
    productSlug,
    productName,
    category,
    sourceFormat,
    componentCount,
    status: options.status || "draft",
    tags: Array.isArray(options.tags) ? options.tags : [],
    createdAt:
      options.createdAt ||
      catalogProduct?.createdAt ||
      productPackage?.createdAt ||
      savedPackage?.createdAt ||
      now,
    updatedAt: now,
    engineVersion:
      options.engineVersion ||
      catalogProduct?.engineVersion ||
      productPackage?.engineVersion ||
      "BagaStudio Core Importer Save System V1",
    thumbnailPreview: thumbnail
      ? {
          generatedAt: thumbnail.generatedAt || null,
          width: thumbnail.width || null,
          height: thumbnail.height || null,
          type: thumbnail.type || "image/png",
          dataUrl: thumbnail.dataUrl || null,
        }
      : null,
    references: {
      hasSavedPackage: Boolean(savedPackage),
      hasProductPackage: Boolean(productPackage),
      hasAdminMapping: Boolean(adminMapping),
      hasImporterReport: Boolean(importerReport),
      hasThumbnail: Boolean(thumbnail),
    },
    searchText: [productName, productSlug, category, sourceFormat, ...(Array.isArray(options.tags) ? options.tags : [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    module: "ProductRegistryIndexV1",
  };

  __bagastudioLastRegisteredProduct = registryItem;

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-item-built", {
      detail: registryItem,
    })
  );

  return registryItem;
}

function bagastudioRegisterCurrentProductRuntime(options: any = {}) {
  const item = bagastudioBuildProductRegistryItemRuntime(options);
  const registry = bagastudioReadProductRegistryRuntime();
  const withoutCurrent = registry.filter((entry) => entry?.productId !== item.productId);
  const nextRegistry = [item, ...withoutCurrent].slice(0, 500);

  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registered", {
      detail: {
        item,
        count: nextRegistry.length,
      },
    })
  );

  return item;
}

function bagastudioSearchProductRegistryRuntime(query = "", filters: any = {}) {
  const registry = bagastudioReadProductRegistryRuntime();
  const normalizedQuery = String(query || "").trim().toLowerCase();

  return registry.filter((item) => {
    const matchesQuery = !normalizedQuery || String(item?.searchText || "").includes(normalizedQuery);
    const matchesCategory = !filters?.category || item?.category === filters.category;
    const matchesStatus = !filters?.status || item?.status === filters.status;
    const matchesFormat = !filters?.sourceFormat || item?.sourceFormat === filters.sourceFormat;
    return matchesQuery && matchesCategory && matchesStatus && matchesFormat;
  });
}

function bagastudioGetProductRegistryItemRuntime(productId: string) {
  return bagastudioReadProductRegistryRuntime().find((item) => item?.productId === productId) || null;
}

function bagastudioRemoveProductRegistryItemRuntime(productId: string) {
  const registry = bagastudioReadProductRegistryRuntime();
  const nextRegistry = registry.filter((item) => item?.productId !== productId);
  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-item-removed", {
      detail: {
        productId,
        count: nextRegistry.length,
      },
    })
  );

  return nextRegistry;
}

if (typeof window !== "undefined") {
  window.bagastudioRegisterCurrentProduct = bagastudioRegisterCurrentProductRuntime;
  window.bagastudioGetProductRegistry = bagastudioReadProductRegistryRuntime;
  window.bagastudioSearchProductRegistry = bagastudioSearchProductRegistryRuntime;
  window.bagastudioGetProductRegistryItem = bagastudioGetProductRegistryItemRuntime;
  window.bagastudioRemoveProductRegistryItem = bagastudioRemoveProductRegistryItemRuntime;
  window.bagastudioClearProductRegistry = () => bagastudioWriteProductRegistryRuntime([]);
  window.bagastudioExportProductRegistry = () => bagastudioReadProductRegistryRuntime();

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-ready", {
      detail: {
        status: "ready",
        storageKey: BAGASTUDIO_PRODUCT_REGISTRY_STORAGE_KEY,
        mode: "local-first",
      },
    })
  );
}


/* -------------------------------------------------------------
   BagaStudio Filters + Tags V1
   Advanced local catalog filters, facets, sorting and tag helpers.
------------------------------------------------------------- */

declare global {
  interface Window {
    bagastudioSearchProductsAdvanced?: (params?: any) => any;
    bagastudioGetProductRegistryFacets?: () => any;
    bagastudioAddProductTags?: (productId: string, tags: string[]) => any;
    bagastudioRemoveProductTags?: (productId: string, tags: string[]) => any;
    bagastudioSetProductFavorite?: (productId: string, favorite?: boolean) => any;
    bagastudioSetProductArchived?: (productId: string, archived?: boolean) => any;
  }
}

function bagastudioNormalizeCatalogTokenRuntime(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function bagastudioNormalizeTagListRuntime(tags: any): string[] {
  const source = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return Array.from(
    new Set(
      source
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );
}

function bagastudioUpdateProductRegistryEntryRuntime(productId: string, updater: (item: any) => any) {
  const registry = bagastudioReadProductRegistryRuntime();
  let updatedItem: any = null;

  const nextRegistry = registry.map((item) => {
    if (item?.productId !== productId) return item;
    updatedItem = updater({ ...item });
    return updatedItem;
  });

  bagastudioWriteProductRegistryRuntime(nextRegistry);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-entry-updated", {
      detail: {
        productId,
        item: updatedItem,
        count: nextRegistry.length,
      },
    })
  );

  return updatedItem;
}

function bagastudioGetProductRegistryFacetsRuntime() {
  const registry = bagastudioReadProductRegistryRuntime();

  const facets = registry.reduce(
    (acc, item) => {
      const category = item?.category || "uncategorized";
      const status = item?.status || "unknown";
      const sourceFormat = item?.sourceFormat || item?.format || "unknown";
      const tags = bagastudioNormalizeTagListRuntime(item?.tags || []);

      acc.categories[category] = (acc.categories[category] || 0) + 1;
      acc.statuses[status] = (acc.statuses[status] || 0) + 1;
      acc.sourceFormats[sourceFormat] = (acc.sourceFormats[sourceFormat] || 0) + 1;
      tags.forEach((tag) => {
        acc.tags[tag] = (acc.tags[tag] || 0) + 1;
      });

      if (item?.favorite) acc.favorites += 1;
      if (item?.archived) acc.archived += 1;

      return acc;
    },
    {
      total: registry.length,
      favorites: 0,
      archived: 0,
      categories: {} as Record<string, number>,
      statuses: {} as Record<string, number>,
      sourceFormats: {} as Record<string, number>,
      tags: {} as Record<string, number>,
    }
  );

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-registry-facets", {
      detail: facets,
    })
  );

  return facets;
}

function bagastudioSearchProductsAdvancedRuntime(params: any = {}) {
  const {
    query = "",
    category,
    status,
    sourceFormat,
    tags = [],
    favorite,
    archived = false,
    sortBy = "updatedAt",
    sortDirection = "desc",
    limit = 100,
  } = params || {};

  const normalizedQuery = bagastudioNormalizeCatalogTokenRuntime(query);
  const normalizedTags = bagastudioNormalizeTagListRuntime(tags).map(bagastudioNormalizeCatalogTokenRuntime);

  const registry = bagastudioReadProductRegistryRuntime();

  const filtered = registry.filter((item) => {
    const itemTags = bagastudioNormalizeTagListRuntime(item?.tags || []).map(bagastudioNormalizeCatalogTokenRuntime);
    const searchable = [
      item?.searchText,
      item?.productId,
      item?.productSlug,
      item?.name,
      item?.displayName,
      item?.category,
      item?.sourceFormat,
      itemTags.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesCategory = !category || item?.category === category;
    const matchesStatus = !status || item?.status === status;
    const matchesFormat = !sourceFormat || item?.sourceFormat === sourceFormat || item?.format === sourceFormat;
    const matchesTags = normalizedTags.length === 0 || normalizedTags.every((tag) => itemTags.includes(tag));
    const matchesFavorite = typeof favorite !== "boolean" || Boolean(item?.favorite) === favorite;
    const matchesArchived = typeof archived !== "boolean" || Boolean(item?.archived) === archived;

    return matchesQuery && matchesCategory && matchesStatus && matchesFormat && matchesTags && matchesFavorite && matchesArchived;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a?.[sortBy] || "";
    const bv = b?.[sortBy] || "";
    const result = String(av).localeCompare(String(bv));
    return sortDirection === "asc" ? result : -result;
  });

  const result = {
    query,
    filters: { category, status, sourceFormat, tags: normalizedTags, favorite, archived },
    sortBy,
    sortDirection,
    total: sorted.length,
    items: sorted.slice(0, Number(limit) || 100),
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-search-results", {
      detail: result,
    })
  );

  return result;
}

function bagastudioAddProductTagsRuntime(productId: string, tags: string[]) {
  const newTags = bagastudioNormalizeTagListRuntime(tags);
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    tags: bagastudioNormalizeTagListRuntime([...(item?.tags || []), ...newTags]),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioRemoveProductTagsRuntime(productId: string, tags: string[]) {
  const removeTags = bagastudioNormalizeTagListRuntime(tags).map(bagastudioNormalizeCatalogTokenRuntime);
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    tags: bagastudioNormalizeTagListRuntime(item?.tags || []).filter(
      (tag) => !removeTags.includes(bagastudioNormalizeCatalogTokenRuntime(tag))
    ),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioSetProductFavoriteRuntime(productId: string, favorite = true) {
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    favorite: Boolean(favorite),
    updatedAt: new Date().toISOString(),
  }));
}

function bagastudioSetProductArchivedRuntime(productId: string, archived = true) {
  return bagastudioUpdateProductRegistryEntryRuntime(productId, (item) => ({
    ...item,
    archived: Boolean(archived),
    updatedAt: new Date().toISOString(),
  }));
}

if (typeof window !== "undefined") {
  window.bagastudioSearchProductsAdvanced = bagastudioSearchProductsAdvancedRuntime;
  window.bagastudioGetProductRegistryFacets = bagastudioGetProductRegistryFacetsRuntime;
  window.bagastudioAddProductTags = bagastudioAddProductTagsRuntime;
  window.bagastudioRemoveProductTags = bagastudioRemoveProductTagsRuntime;
  window.bagastudioSetProductFavorite = bagastudioSetProductFavoriteRuntime;
  window.bagastudioSetProductArchived = bagastudioSetProductArchivedRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:filters-tags-ready", {
      detail: {
        status: "ready",
        features: ["advanced-search", "facets", "tags", "favorites", "archive"],
      },
    })
  );
}

// ============================================================
// BagaStudio Core - Smart Collections V1
// Conservative runtime layer for catalog grouping and saved views.
// ============================================================

declare global {
  interface Window {
    bagastudioCreateProductCollection?: (collection: any) => any;
    bagastudioGetProductCollections?: () => any[];
    bagastudioUpdateProductCollection?: (collectionId: string, patch: any) => any;
    bagastudioDeleteProductCollection?: (collectionId: string) => any;
    bagastudioAddProductsToCollection?: (collectionId: string, productIds: string[]) => any;
    bagastudioRemoveProductsFromCollection?: (collectionId: string, productIds: string[]) => any;
    bagastudioGetCollectionProducts?: (collectionId: string) => any;
    bagastudioCreateSmartCollection?: (collection: any) => any;
    bagastudioRefreshSmartCollection?: (collectionId: string) => any;
  }
}

const BAGASTUDIO_PRODUCT_COLLECTIONS_KEY = "bagastudio_product_collections_v1";

function bagastudioReadProductCollectionsRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_PRODUCT_COLLECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio collections read failed", error);
    return [];
  }
}

function bagastudioWriteProductCollectionsRuntime(collections: any[]) {
  if (typeof window === "undefined") return [];

  const safeCollections = Array.isArray(collections) ? collections : [];
  window.localStorage.setItem(BAGASTUDIO_PRODUCT_COLLECTIONS_KEY, JSON.stringify(safeCollections, null, 2));

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collections-updated", {
      detail: {
        total: safeCollections.length,
        collections: safeCollections,
      },
    })
  );

  return safeCollections;
}

function bagastudioCreateProductCollectionRuntime(collection: any = {}) {
  const now = new Date().toISOString();
  const name = String(collection?.name || collection?.displayName || "Nuova collezione").trim();
  const collectionId = String(
    collection?.collectionId ||
      collection?.id ||
      `collection_${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || Date.now()}_${Date.now()}`
  );

  const nextCollection = {
    collectionId,
    id: collectionId,
    name,
    displayName: collection?.displayName || name,
    description: collection?.description || "",
    type: collection?.type || "manual",
    productIds: Array.isArray(collection?.productIds) ? Array.from(new Set(collection.productIds.map(String))) : [],
    query: collection?.query || null,
    filters: collection?.filters || {},
    tags: bagastudioNormalizeTagListRuntime(collection?.tags || []),
    createdAt: collection?.createdAt || now,
    updatedAt: now,
  };

  const collections = bagastudioReadProductCollectionsRuntime();
  const filtered = collections.filter((item) => item?.collectionId !== collectionId && item?.id !== collectionId);
  const result = bagastudioWriteProductCollectionsRuntime([nextCollection, ...filtered]);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-created", {
      detail: nextCollection,
    })
  );

  return nextCollection;
}

function bagastudioUpdateProductCollectionRuntime(collectionId: string, patch: any = {}) {
  const now = new Date().toISOString();
  const collections = bagastudioReadProductCollectionsRuntime();
  let updated: any = null;

  const next = collections.map((item) => {
    if (item?.collectionId !== collectionId && item?.id !== collectionId) return item;

    updated = {
      ...item,
      ...patch,
      collectionId: item?.collectionId || collectionId,
      id: item?.id || collectionId,
      tags: patch?.tags ? bagastudioNormalizeTagListRuntime(patch.tags) : item?.tags || [],
      updatedAt: now,
    };

    return updated;
  });

  bagastudioWriteProductCollectionsRuntime(next);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-updated", {
      detail: updated,
    })
  );

  return updated;
}

function bagastudioDeleteProductCollectionRuntime(collectionId: string) {
  const collections = bagastudioReadProductCollectionsRuntime();
  const next = collections.filter((item) => item?.collectionId !== collectionId && item?.id !== collectionId);
  bagastudioWriteProductCollectionsRuntime(next);

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-deleted", {
      detail: { collectionId },
    })
  );

  return { collectionId, deleted: collections.length !== next.length };
}

function bagastudioAddProductsToCollectionRuntime(collectionId: string, productIds: string[] = []) {
  const ids = Array.from(new Set((productIds || []).map(String).filter(Boolean)));
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  if (!collection) return null;

  const currentIds = Array.isArray(collection.productIds) ? collection.productIds.map(String) : [];
  return bagastudioUpdateProductCollectionRuntime(collectionId, {
    productIds: Array.from(new Set([...currentIds, ...ids])),
  });
}

function bagastudioRemoveProductsFromCollectionRuntime(collectionId: string, productIds: string[] = []) {
  const removeIds = new Set((productIds || []).map(String).filter(Boolean));
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  if (!collection) return null;

  const currentIds = Array.isArray(collection.productIds) ? collection.productIds.map(String) : [];
  return bagastudioUpdateProductCollectionRuntime(collectionId, {
    productIds: currentIds.filter((id: string) => !removeIds.has(id)),
  });
}

function bagastudioGetCollectionProductsRuntime(collectionId: string) {
  const collections = bagastudioReadProductCollectionsRuntime();
  const collection = collections.find((item) => item?.collectionId === collectionId || item?.id === collectionId);
  const registry = bagastudioReadProductRegistryRuntime();

  if (!collection) {
    return { collectionId, collection: null, total: 0, items: [] };
  }

  let items: any[] = [];

  if (collection.type === "smart") {
    const result = bagastudioSearchProductsAdvancedRuntime({
      query: collection?.query || "",
      ...(collection?.filters || {}),
      limit: 1000,
    });
    items = result?.items || [];
  } else {
    const ids = new Set((collection.productIds || []).map(String));
    items = registry.filter((item) => ids.has(String(item?.productId || item?.id)));
  }

  const result = {
    collectionId: collection.collectionId || collection.id,
    collection,
    total: items.length,
    items,
  };

  window.dispatchEvent(
    new CustomEvent("bagastudio:product-collection-products", {
      detail: result,
    })
  );

  return result;
}

function bagastudioCreateSmartCollectionRuntime(collection: any = {}) {
  return bagastudioCreateProductCollectionRuntime({
    ...collection,
    type: "smart",
    productIds: [],
    query: collection?.query || "",
    filters: collection?.filters || {},
  });
}

function bagastudioRefreshSmartCollectionRuntime(collectionId: string) {
  const result = bagastudioGetCollectionProductsRuntime(collectionId);

  window.dispatchEvent(
    new CustomEvent("bagastudio:smart-collection-refreshed", {
      detail: result,
    })
  );

  return result;
}

if (typeof window !== "undefined") {
  window.bagastudioCreateProductCollection = bagastudioCreateProductCollectionRuntime;
  window.bagastudioGetProductCollections = bagastudioReadProductCollectionsRuntime;
  window.bagastudioUpdateProductCollection = bagastudioUpdateProductCollectionRuntime;
  window.bagastudioDeleteProductCollection = bagastudioDeleteProductCollectionRuntime;
  window.bagastudioAddProductsToCollection = bagastudioAddProductsToCollectionRuntime;
  window.bagastudioRemoveProductsFromCollection = bagastudioRemoveProductsFromCollectionRuntime;
  window.bagastudioGetCollectionProducts = bagastudioGetCollectionProductsRuntime;
  window.bagastudioCreateSmartCollection = bagastudioCreateSmartCollectionRuntime;
  window.bagastudioRefreshSmartCollection = bagastudioRefreshSmartCollectionRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:smart-collections-ready", {
      detail: {
        status: "ready",
        features: ["manual-collections", "smart-collections", "saved-views", "collection-products"],
      },
    })
  );
}

// ============================================================
// BagaStudio Core - AI Recommendation Engine V1
// Conservative runtime layer for AI-ready metadata, semantic index,
// similar products and catalog recommendations.
// ============================================================

declare global {
  interface Window {
    bagastudioBuildAiCatalogIndex?: () => any[];
    bagastudioGetAiProductMetadata?: (productId: string) => any;
    bagastudioFindSimilarProducts?: (productId: string, limit?: number) => any;
    bagastudioRecommendProducts?: (criteria?: any, limit?: number) => any;
  }
}

const BAGASTUDIO_AI_INDEX_KEY = "bagastudio_ai_catalog_index_v1";

function bagastudioNormalizeAiTextRuntime(value: any): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function bagastudioTokenizeAiRuntime(value: any): string[] {
  const normalized = bagastudioNormalizeAiTextRuntime(value);
  return Array.from(
    new Set(
      normalized
        .split(/[^a-z0-9]+/i)
        .map((token: string) => token.trim())
        .filter((token: string) => token.length >= 2)
    )
  );
}

function bagastudioReadAiRegistryRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    if (typeof window.bagastudioGetProductRegistry === "function") {
      const registry = window.bagastudioGetProductRegistry();
      return Array.isArray(registry) ? registry : [];
    }
  } catch (error) {
    console.warn("BagaStudio AI registry bridge failed", error);
  }

  try {
    const raw = window.localStorage.getItem("bagastudio_product_registry_v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("BagaStudio AI registry read failed", error);
    return [];
  }
}

function bagastudioBuildAiMetadataRuntime(product: any): any {
  const productId = String(product?.productId || product?.id || product?.slug || `product_${Date.now()}`);
  const name = String(product?.name || product?.productName || product?.title || productId);
  const category = String(product?.category || product?.productCategory || "uncategorized");
  const tags = Array.isArray(product?.tags) ? product.tags.map(String) : [];
  const materials = Array.isArray(product?.materials) ? product.materials.map(String) : [];
  const collections = Array.isArray(product?.collections) ? product.collections.map(String) : [];
  const sourceText = [
    productId,
    name,
    category,
    product?.description,
    product?.sourceFormat,
    product?.engineVersion,
    ...tags,
    ...materials,
    ...collections,
  ].join(" ");
  const semanticTags = Array.from(new Set([...tags, ...materials, category, ...bagastudioTokenizeAiRuntime(sourceText)]));

  return {
    productId,
    name,
    category,
    tags,
    materials,
    collections,
    semanticTags,
    searchText: bagastudioNormalizeAiTextRuntime(sourceText),
    aiScore: semanticTags.length + (product?.thumbnail ? 5 : 0) + (product?.productPackage ? 10 : 0),
    sourceFormat: product?.sourceFormat || product?.metadata?.sourceFormat || null,
    thumbnail: product?.thumbnail || product?.preview || null,
    raw: product,
    indexedAt: new Date().toISOString(),
  };
}

function bagastudioBuildAiCatalogIndexRuntime(): any[] {
  const registry = bagastudioReadAiRegistryRuntime();
  const index = registry.map((product: any) => bagastudioBuildAiMetadataRuntime(product));

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(BAGASTUDIO_AI_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.warn("BagaStudio AI index save failed", error);
    }

    window.dispatchEvent(
      new CustomEvent("bagastudio:ai-catalog-index-ready", {
        detail: {
          status: "ready",
          total: index.length,
          index,
        },
      })
    );
  }

  return index;
}

function bagastudioReadAiCatalogIndexRuntime(): any[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BAGASTUDIO_AI_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (error) {
    console.warn("BagaStudio AI index read failed", error);
  }

  return bagastudioBuildAiCatalogIndexRuntime();
}

function bagastudioGetAiProductMetadataRuntime(productId: string): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const found = index.find((item: any) => String(item?.productId) === String(productId));

  window.dispatchEvent(
    new CustomEvent("bagastudio:ai-product-metadata", {
      detail: found || null,
    })
  );

  return found || null;
}

function bagastudioSimilarityScoreRuntime(a: any, b: any): number {
  const aTags = new Set((a?.semanticTags || []).map(String));
  const bTags = new Set((b?.semanticTags || []).map(String));
 const shared = (Array.from(aTags) as string[]).filter((tag: string) => bTags.has(tag)).length;
  const categoryBoost = a?.category && b?.category && a.category === b.category ? 5 : 0;
  const materialBoost = (a?.materials || []).some((material: string) => (b?.materials || []).includes(material)) ? 3 : 0;
  return shared + categoryBoost + materialBoost;
}

function bagastudioFindSimilarProductsRuntime(productId: string, limit = 6): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const source = index.find((item: any) => String(item?.productId) === String(productId));

  if (!source) {
    const emptyResult = { productId, total: 0, items: [] };
    window.dispatchEvent(new CustomEvent("bagastudio:similar-products-ready", { detail: emptyResult }));
    return emptyResult;
  }

  const items = index
    .filter((item: any) => String(item?.productId) !== String(productId))
    .map((item: any) => ({
      ...item,
      similarityScore: bagastudioSimilarityScoreRuntime(source, item),
    }))
    .filter((item: any) => item.similarityScore > 0)
    .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  const result = { productId, total: items.length, source, items };
  window.dispatchEvent(new CustomEvent("bagastudio:similar-products-ready", { detail: result }));
  return result;
}

function bagastudioRecommendProductsRuntime(criteria: any = {}, limit = 8): any {
  const index = bagastudioReadAiCatalogIndexRuntime();
  const queryTokens = bagastudioTokenizeAiRuntime(criteria?.query || criteria?.text || "");
  const category = criteria?.category ? String(criteria.category) : "";
  const tags = Array.isArray(criteria?.tags) ? criteria.tags.map(String) : [];

  const items = index
    .map((item: any) => {
      const semanticTags = new Set((item?.semanticTags || []).map(String));
      const queryScore = queryTokens.filter((token: string) => semanticTags.has(token) || item?.searchText?.includes(token)).length;
      const categoryScore = category && item?.category === category ? 6 : 0;
      const tagScore = tags.filter((tag: string) => semanticTags.has(tag)).length * 2;
      const score = queryScore + categoryScore + tagScore + Number(item?.aiScore || 0) * 0.05;
      return { ...item, recommendationScore: score };
    })
    .filter((item: any) => item.recommendationScore > 0 || (!criteria?.query && !category && tags.length === 0))
    .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  const result = {
    criteria,
    total: items.length,
    items,
    generatedAt: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("bagastudio:product-recommendations-ready", { detail: result }));
  return result;
}

if (typeof window !== "undefined") {
  window.bagastudioBuildAiCatalogIndex = bagastudioBuildAiCatalogIndexRuntime;
  window.bagastudioGetAiProductMetadata = bagastudioGetAiProductMetadataRuntime;
  window.bagastudioFindSimilarProducts = bagastudioFindSimilarProductsRuntime;
  window.bagastudioRecommendProducts = bagastudioRecommendProductsRuntime;

  window.dispatchEvent(
    new CustomEvent("bagastudio:ai-recommendation-engine-ready", {
      detail: {
        status: "ready",
        features: [
          "ai-metadata",
          "semantic-index",
          "similar-products",
          "recommendations",
          "future-ai-assistant-bridge",
        ],
      },
    })
  );
}
