"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Center,
  Environment,
  Edges,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
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

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const textureWaiters = new Map<string, Array<(texture: THREE.Texture) => void>>();

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
  activeViewId?: string | null;
 ledKelvin?: Record<string, number>;
 ledIntensity?: Record<string, number>;
 woodDirection?: Record<string, "x" | "z">;
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


function inferModelFormat(url: string, explicitFormat?: string) {
  const format = String(explicitFormat || "").toLowerCase().replace(".", "");
  if (format) return format;

  if (url.startsWith("data:")) {
    if (url.includes("model/gltf") || url.includes("model/glb")) return "glb";
    if (url.includes("model/stl")) return "stl";
    if (url.includes("model/obj")) return "obj";
    if (url.includes("model/fbx")) return "fbx";
    return "glb";
  }

  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.split(".").pop() || "glb";
}

function forcePreviewMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const apply = (mat: THREE.Material) => {
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else if (mesh.material) apply(mesh.material as THREE.Material);
  });
}


function normalizePartKey(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[-.]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function collectMeshCandidateNames(mesh: THREE.Mesh) {
  const names = new Set<string>();
  let current: THREE.Object3D | null = mesh;

  while (current) {
    if (current.name) names.add(current.name);
    current = current.parent;
  }

  const data = (mesh.userData || {}) as any;
  [
    data.bagastudioPartId,
    data.bagastudioPartKey,
    data.originalName,
    data.meshName,
  ].forEach((value) => {
    if (value) names.add(String(value));
  });

  return Array.from(names).filter(Boolean);
}

function findProductPartForMesh(
  mesh: THREE.Mesh,
  productParts: any[] = [],
  meshIndex = -1
) {
  const candidates = collectMeshCandidateNames(mesh);
  const normalizedCandidates = candidates.map(normalizePartKey);

  const byExact = productParts.find((part: any) => {
    const partKeys = [part?.id, part?.meshName, part?.name, part?.label, part?.originalName] 
      .filter(Boolean)
      .map(normalizePartKey);

    return partKeys.some((key) => normalizedCandidates.includes(key));
  });

  if (byExact) return byExact;

  const byContains = productParts.find((part: any) => {
    const partKeys = [part?.id, part?.meshName, part?.name, part?.label, part?.originalName]
      .filter(Boolean)
      .map(normalizePartKey)
      .filter(Boolean);

    return partKeys.some((key) =>
      normalizedCandidates.some((candidate) =>
        candidate.includes(key) || key.includes(candidate)
      )
    );
  });

  if (byContains) return byContains;

  if (meshIndex >= 0 && productParts[meshIndex]) return productParts[meshIndex];

  return null;
}

function getStableMeshName(mesh: THREE.Mesh, productPart: any, meshIndex: number) {
  return (
    productPart?.meshName ||
    productPart?.id ||
    mesh.name ||
    `Mesh_${meshIndex + 1}`
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

function ProductModel({
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
  activeViewId,
  views = [],
  productParts = [],
  woodDirection,
}: Viewer3DProps) {
  const materialsSource =
  productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;

  const [loadedRoot, setLoadedRoot] = useState<THREE.Object3D | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadedRoot(null);
    setLoadError(null);

    const format = inferModelFormat(productModel, productModelFormat);

    const onLoaded = (object: THREE.Object3D) => {
      if (cancelled) return;
      forcePreviewMaterials(object);
      setLoadedRoot(object);
    };

    const onError = (error: unknown) => {
      console.error("BagaStudio Viewer: model load failed", { productModel, format, error });
      if (!cancelled) setLoadError(`Model load failed: ${format}`);
    };

    try {
      if (format === "stl") {
        new STLLoader().load(productModel, (geometry) => onLoaded(buildObjectFromGeometry(geometry)), undefined, onError);
      } else if (format === "obj") {
        new OBJLoader().load(productModel, onLoaded, undefined, onError);
      } else if (format === "fbx") {
        new FBXLoader().load(productModel, onLoaded, undefined, onError);
      } else {
        new GLTFLoader().load(productModel, (gltf) => onLoaded(gltf.scene), undefined, onError);
      }
    } catch (error) {
      onError(error);
    }

    return () => {
      cancelled = true;
    };
  }, [productModel, productModelFormat]);

 const setSelectedPartId = useConfigStore(
  (state) => state.setSelectedPart
);
  const selectedPartId = useConfigStore(
(state) => state.selectedPartId
);
const highlightedRef = useRef<{
  mesh: THREE.Mesh;
  material: THREE.Material | THREE.Material[];
} | null>(null);
  const scene = useMemo(() => {
    if (!loadedRoot) return null;

    const clonedScene = loadedRoot.clone(true);

    const sceneMeshes: THREE.Mesh[] = [];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) sceneMeshes.push(child as THREE.Mesh);
    });

    sceneMeshes.forEach((mesh, meshIndex) => {
        const productPart = findProductPartForMesh(mesh, productParts, meshIndex);
        const stableMeshName = getStableMeshName(mesh, productPart, meshIndex);
        const originalMeshName = mesh.name || stableMeshName;

        mesh.userData = {
          ...mesh.userData,
          originalName: originalMeshName,
          bagastudioPartId: productPart?.id || stableMeshName,
          bagastudioPartKey: stableMeshName,
        };

        if (!mesh.name || /^\d+$/.test(mesh.name)) {
          mesh.name = stableMeshName;
        }

        const partKey = stableMeshName;

        //console.log("PRODUCT PART:", productPart);

const ledMount = productPart?.mountPoints?.led || null;
const ledPosition = ledMount?.position || "front";
const insertMount = productPart?.mountPoints?.insert;
const defaultInsert = getDefaultInsertConfig();
        

      const storeKey = productPart?.id || partKey;

const hasLed = (productPart as any)?.compatibleLed === true || Boolean(ledMount);

const ledIsActive =
  (accessories as any)?.[storeKey]?.led === true ||
  (accessories as any)?.[partKey]?.led === true ||
  (accessories as any)?.[storeKey] === true ||
  (accessories as any)?.[partKey] === true;

        const materialStoreKey = productPart?.id ?? partKey;

const insertKey = productPart?.id ?? storeKey ?? partKey;

const hasInsert = Boolean(
  inserts[insertKey]
);
        const insertOffset = insertMount?.offset || { x: 0, y: 0, z: 1 };

const isMirrorPart =
  mesh.name?.toLowerCase().includes("specchiera") ||
  mesh.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchio") ||
  productPart?.name?.toLowerCase().includes("specchiera");

const materialId =
  isMirrorPart
    ? "specchio"
    : materials[productPart?.id ?? ""] ||
  materials[materialStoreKey] ||
  materials[partKey] ||
  productPart?.defaultMaterialId ||
      (mesh.name.includes("Piede") || mesh.name.includes("Maniglia")
        ? "oro_satinato"
        : "barok");

   const isSelected =
  Boolean(selectedPartId) &&
  (
    selectedPartId === productPart?.id ||
    selectedPartId === partKey ||
    selectedPartId === mesh.name
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
console.log("MATERIAL FOUND:", materialData);
console.log("MATERIAL CHECK:", {
  materialId,
  materialData,
  productMaterials,
});

function applyPlanarUV(mesh: THREE.Mesh, rotate = false) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  if (!geometry.attributes.position) return;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;

  const pos = geometry.attributes.position;
  const uvs: number[] = [];

  const sizeX = Math.max(box.max.x - box.min.x, 1);
  const sizeY = Math.max(box.max.y - box.min.y, 1);
  const sizeZ = Math.max(box.max.z - box.min.z, 1);

  const sizes = [
    { axis: "x", size: sizeX },
    { axis: "y", size: sizeY },
    { axis: "z", size: sizeZ },
  ].sort((a, b) => b.size - a.size);

  const axisU = sizes[0].axis;
  const axisV = sizes[1].axis;

  const getValue = (axis: string, index: number) => {
    if (axis === "x") return (pos.getX(index) - box.min.x) / sizeX;
    if (axis === "y") return (pos.getY(index) - box.min.y) / sizeY;
    return (pos.getZ(index) - box.min.z) / sizeZ;
  };

  for (let i = 0; i < pos.count; i++) {
    const u = getValue(rotate ? axisV : axisU, i);
    const v = getValue(rotate ? axisU : axisV, i);
    uvs.push(u, v);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.attributes.uv.needsUpdate = true;
geometry.computeVertexNormals();
  (geometry.attributes.uv as THREE.BufferAttribute).needsUpdate = true;
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

applyPlanarUV(mesh, rotateWood);
console.log("MATERIAL DATA:", materialData);

const textureUrl = materialData.textureUrl;
const fallbackColor =
  materialData.fallbackColor ||
  materialData.color ||
  "#c8c2b6";

const configureTexture = (loadedTexture: THREE.Texture) => {
  loadedTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTexture.wrapS = THREE.RepeatWrapping;
  loadedTexture.wrapT = THREE.RepeatWrapping;
  loadedTexture.flipY = false;

  loadedTexture.repeat.set(
    materialData.repeatX ?? 1,
    materialData.repeatY ?? 1
  );

  loadedTexture.needsUpdate = true;
};

const applyLoadedTexture = (loadedTexture: THREE.Texture) => {
  const currentMaterial = mesh.material as THREE.MeshStandardMaterial;

  if (
    currentMaterial &&
    (currentMaterial as any).userData?.bagastudioTextureUrl === textureUrl
  ) {
    currentMaterial.map = loadedTexture;
    currentMaterial.color.set("#ffffff");
    currentMaterial.needsUpdate = true;
  }
};

let texture = textureCache.get(textureUrl);

if (texture) {
  configureTexture(texture);

  material = new THREE.MeshStandardMaterial({
    map: texture,
    color: "#ffffff",
    roughness: materialData.roughness ?? 0.65,
    metalness: materialData.metalness ?? 0,
    side: THREE.FrontSide,
    transparent: false,
    depthWrite: true,
  });
} else {
  material = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: materialData.roughness ?? 0.65,
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

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.flipY = false;

 texture.repeat.set(
  insertMaterialData.repeatX ?? 1,
  insertMaterialData.repeatY ?? 1
);

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

material.side = THREE.FrontSide;
material.needsUpdate = true;
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

  const ledBar = createLedBar(mesh, ledColor, ledConfig);
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
});


return clonedScene;
}, [
  loadedRoot,
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
]);

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
  if (!scene) return null;

  return (
    <Center>
<group
  onPointerMissed={() => {
    if (highlightedRef.current) {
      highlightedRef.current.mesh.material =
        highlightedRef.current.material;
      highlightedRef.current = null;
    }

    setSelectedPartId(null);
  }}
>
  <primitive
    object={scene}
    scale={0.01}
    castShadow
    receiveShadow
    onClick={(e: any) => {
      e.stopPropagation();

      const clickedMesh = e.object as THREE.Mesh;
      const allMeshes: THREE.Mesh[] = [];
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) allMeshes.push(object as THREE.Mesh);
      });

      const meshIndex = Math.max(0, allMeshes.indexOf(clickedMesh));
      const clickedPart = findProductPartForMesh(clickedMesh, productParts, meshIndex);
      const clickedName = getStableMeshName(clickedMesh, clickedPart, meshIndex);
      const realPartKey = clickedPart?.id || clickedName;

      if (highlightedRef.current) {
        highlightedRef.current.mesh.material =
          highlightedRef.current.material;
      }

      highlightedRef.current = {
        mesh: clickedMesh,
        material: clickedMesh.material,
      };

      setSelectedPartId(realPartKey);
    }}
  />
</group>
  </Center>
);
}

function CameraController({
  activeViewId,
  views,
}: {
  activeViewId?: string | null;
  views?: any[];
}) {
  const { camera } = useThree();

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 6, 28], target: [0, 0, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    const viewId = activeViewId || "iso";

    const selectedView = views?.find((v) => v.id === viewId);

    const cameraData =
      selectedView?.camera ||
      DEFAULT_CAMERA_VIEWS[viewId] ||
      DEFAULT_CAMERA_VIEWS.iso;

    camera.position.set(
      cameraData.position[0],
      cameraData.position[1],
      cameraData.position[2]
    );

    camera.lookAt(
      cameraData.target[0],
      cameraData.target[1],
      cameraData.target[2]
    );

    camera.updateProjectionMatrix();
  }, [activeViewId, views, camera]);

  return null;
}

function ViewerRuntimeControls({
  activeViewId,
  views,
  productParts = [],
}: {
  activeViewId?: string | null;
  views?: any[];
  productParts?: any[];
}) {
  const { camera, gl, scene } = useThree();
  const selectedPartId = useConfigStore((state) => state.selectedPartId);

  useEffect(() => {
    const DEFAULT_CAMERA_VIEWS: Record<string, {
      position: [number, number, number];
      target: [number, number, number];
    }> = {
      iso: { position: [20, 10, 22], target: [0, 0, 0] },
      "3d": { position: [20, 10, 22], target: [0, 0, 0] },
      front: { position: [0, 6, 28], target: [0, 0, 0] },
      back: { position: [0, 6, -28], target: [0, 0, 0] },
      left: { position: [-28, 6, 0], target: [0, 0, 0] },
      right: { position: [28, 6, 0], target: [0, 0, 0] },
      top: { position: [0, 35, 0.1], target: [0, 0, 0] },
    };

    const applyCameraView = (viewId = activeViewId || "iso") => {
      const selectedView = views?.find((v) => v.id === viewId);
      const cameraData =
        selectedView?.camera ||
        DEFAULT_CAMERA_VIEWS[viewId] ||
        DEFAULT_CAMERA_VIEWS.iso;

      camera.position.set(
        cameraData.position[0],
        cameraData.position[1],
        cameraData.position[2]
      );

      camera.lookAt(
        cameraData.target[0],
        cameraData.target[1],
        cameraData.target[2]
      );

      camera.updateProjectionMatrix();

      const controls = (gl as any).__r3f?.root?.getState?.().controls;
      if (controls?.target) {
        controls.target.set(
          cameraData.target[0],
          cameraData.target[1],
          cameraData.target[2]
        );
        controls.update?.();
      }
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
      const distance = Math.max(maxSize * 2.2, 8);

      camera.position.set(
        center.x + distance,
        center.y + distance * 0.45,
        center.z + distance
      );
      camera.lookAt(center);
      camera.updateProjectionMatrix();

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

    const handleReset = () => applyCameraView("iso");
    const handleFocus = () => focusObjects();
    const handleScreenshot = () => downloadScreenshot();

    window.addEventListener("bagastudio:reset-camera", handleReset);
    window.addEventListener("bagastudio:focus-selection", handleFocus);
    window.addEventListener("bagastudio:screenshot", handleScreenshot);

    return () => {
      window.removeEventListener("bagastudio:reset-camera", handleReset);
      window.removeEventListener("bagastudio:focus-selection", handleFocus);
      window.removeEventListener("bagastudio:screenshot", handleScreenshot);
    };
  }, [activeViewId, views, camera, gl, scene, selectedPartId, productParts]);

  return null;
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
  productParts,
  views = [],
  activeViewId,
  ledIntensity,
  woodDirection,
}: Viewer3DProps) {
  const materialsSource =
productMaterials?.length
    ? productMaterials
    : MATERIAL_LIBRARY;
  const ledKelvin = useConfigStore((state) => state.ledKelvin);
  const ledIntensityStore = useConfigStore((state) => state.ledIntensity);
  const [viewerMode, setViewerMode] = useState<"select" | "pan" | "orbit">("select");

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

  return (
    <div className="h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [20, 10, 22], fov: 70 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.9;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={["#000000"]} />

        <ambientLight intensity={0.45} />

        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={1.6}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <directionalLight
          position={[-4, 4, -3]}
          intensity={0.8}
        />

        <pointLight
          position={[0, 3, 3]}
          intensity={0.7}
        />

        <Environment preset="apartment" />

<CameraController activeViewId={activeViewId} views={views} />
<ViewerRuntimeControls activeViewId={activeViewId} views={views} productParts={productParts} />

        <ProductModel
  width={width}
  height={height}
  depth={depth}
  materials={materials}
  productMaterials={productMaterials}
  accessories={accessories}
  inserts={inserts}
  insertMaterials={insertMaterials}
  insertSizes={insertSizes}
  ledKelvin={ledKelvin}
  ledIntensity={ledIntensity ?? ledIntensityStore}
  visibility={visibility}
  productModel={productModel}
  productModelFormat={productModelFormat}
  productParts={productParts}
  woodDirection={woodDirection}
/>

        <OrbitControls
          makeDefault
          enableRotate={viewerMode === "orbit"}
          enablePan={viewerMode === "pan"}
          enableZoom={true}
          mouseButtons={{
            LEFT:
              viewerMode === "pan"
                ? THREE.MOUSE.PAN
                : viewerMode === "orbit"
                ? THREE.MOUSE.ROTATE
                : undefined,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}

