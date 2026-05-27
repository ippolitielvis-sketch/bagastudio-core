"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

type MeshConfig = {
  meshName: string;
  displayName: string;
  selectable: boolean;
  visible: boolean;
  compatibleLed: boolean;
  compatibleInsert: boolean;
  materialSlots: string;
  compatibleAccessories: string;

  ledFrontOffset: string;
ledSideMargin: string;
ledYOffset: string;

insertPosition: string;
insertOffsetX: string;
insertOffsetY: string;
insertOffsetZ: string;
ledPosition: string;
};


const BAGASTUDIO_ADMIN_AUTOSAVE_KEY = "bagastudio_core_admin_autosave_v1";

const DEFAULT_PRODUCT_MATERIALS = [
  { id: "acciaio_ossidato", name: "Acciaio Ossidato", category: "metal", textureUrl: "/textures/Acciaio_Ossidato.webp", roughness: 0.55, metalness: 0.8 },
  { id: "acciaio_ossidato_truciolato", name: "Acciaio Ossidato Truciolato", category: "wood", textureUrl: "/textures/Acciaio_Ossidato_Truciolato.webp", roughness: 0.55, metalness: 0 },
  { id: "angel_white", name: "Angel White", category: "wood", textureUrl: "/textures/Angel_White.webp", roughness: 0.45, metalness: 0 },
  { id: "barok", name: "Barok", category: "wood", textureUrl: "/textures/Barok.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_liscio_china", name: "Bianco Liscio China", category: "wood", textureUrl: "/textures/Bianco_Liscio_China.webp", roughness: 0.4, metalness: 0 },
  { id: "bianco_liscio_truciolato", name: "Bianco Liscio Truciolato", category: "wood", textureUrl: "/textures/Bianco_Liscio_Truciolato.webp", roughness: 0.4, metalness: 0 },
  { id: "bianco_sporco_bilaminato", name: "Bianco Sporco Bilaminato", category: "wood", textureUrl: "/textures/Bianco_Sporco_Bilaminato.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_sporco_china", name: "Bianco Sporco China", category: "wood", textureUrl: "/textures/Bianco_Sporco_China.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_sporco_truciolato", name: "Bianco Sporco Truciolato", category: "wood", textureUrl: "/textures/Bianco_Sporco_Truciolato.webp", roughness: 0.45, metalness: 0 },
  { id: "bianco_venato", name: "Bianco Venato", category: "wood", textureUrl: "/textures/Bianco_Venato.webp", roughness: 0.45, metalness: 0 },
  { id: "cemento_chiaro", name: "Cemento Chiaro", category: "stone", textureUrl: "/textures/Cemento_Chiaro.webp", roughness: 0.7, metalness: 0 },
  { id: "confortable_coffe", name: "Confortable Coffe", category: "wood", textureUrl: "/textures/Confortable_Coffe.webp", roughness: 0.45, metalness: 0 },
  { id: "marmo", name: "Marmo", category: "marble", textureUrl: "/textures/Marmo.webp", roughness: 0.2, metalness: 0 },
  { id: "mdf_bianco", name: "MDF Bianco", category: "wood", textureUrl: "/textures/MDF_Bianco.webp", roughness: 0.5, metalness: 0 },
  { id: "mdf_nero", name: "MDF Nero", category: "wood", textureUrl: "/textures/MDF_Nero.webp", roughness: 0.5, metalness: 0 },
  { id: "nero_venato_china", name: "Nero Venato China", category: "wood", textureUrl: "/textures/Nero_Venato_China.webp", roughness: 0.5, metalness: 0 },
  { id: "noce_canaletto", name: "Noce Canaletto", category: "wood", textureUrl: "/textures/Noce_canaletto.webp", roughness: 0.45, metalness: 0 },
  { id: "oro", name: "Oro", category: "metal", textureUrl: "/textures/Oro.webp", roughness: 0.2, metalness: 1 },
  { id: "oro_satinato", name: "Oro Satinato", category: "metal", textureUrl: "/textures/Oro_Satinato.webp", roughness: 0.35, metalness: 1 },
  { id: "rovere_cadiz", name: "Rovere Cadiz", category: "wood", textureUrl: "/textures/Rovere_Cadiz.webp", roughness: 0.45, metalness: 0 },
  { id: "wood_7040", name: "Wood 7040", category: "wood", textureUrl: "/textures/Wood_7040.webp", roughness: 0.45, metalness: 0 },
  { id: "youth_fleeting", name: "Youth Fleeting", category: "wood", textureUrl: "/textures/Youth_Fleeting.webp", roughness: 0.45, metalness: 0 }
];

const DEFAULT_PRODUCT_VIEWS = [
  { id: "front", name: "Frontale" },
  { id: "back", name: "Retro" },
  { id: "left", name: "Sinistra" },
  { id: "right", name: "Destra" },
  { id: "top", name: "Alto" },
  { id: "iso", name: "3D" },
];

function downloadJsonFile(fileName: string, payload: unknown) {
  const jsonString = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function guessPartName(mesh: THREE.Mesh, index: number) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();

  box.getSize(size);

  const width = size.x;
  const height = size.y;
  const depth = size.z;
  const name = mesh.name.toLowerCase();

  if (name.includes("top") || name.includes("piano")) return "Piano";
if (name.includes("bottom") || name.includes("base") || name.includes("zoccolo")) return "Base";
if (name.includes("front") || name.includes("frontale")) return "Frontale";
if (name.includes("back") || name.includes("schiena") || name.includes("retro")) return "Schiena";
if (name.includes("left") || name.includes("sx") || name.includes("sinistro")) return "Fianco SX";
if (name.includes("right") || name.includes("dx") || name.includes("destro")) return "Fianco DX";
if (name.includes("side") || name.includes("fianco")) return "Fianco";
if (name.includes("door") || name.includes("anta")) return "Anta";
if (name.includes("drawer") || name.includes("cassetto")) return "Cassetto";
if (name.includes("shelf") || name.includes("mensola")) return "Mensola";
if (name.includes("mirror") || name.includes("specchio")) return "Specchio";
if (name.includes("handle") || name.includes("maniglia")) return "Maniglia";
if (name.includes("led")) return "LED strip";
if (name.includes("insert") || name.includes("inserto") || name.includes("marmo")) return "Inserto";

if (height < width * 0.18 && height < depth * 0.35) return "Piano";
if (height > width * 2 && depth < width * 0.5) return "Fianco";
if (width > depth * 2 && height > depth * 2) return "Frontale";
if (width < depth * 0.4 && height > depth * 1.2) return "Fianco";
  return mesh.name || `Componente ${index + 1}`;
}

function extractMeshesFromObject(object: THREE.Object3D) {
  const meshes: MeshConfig[] = [];

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      const rawName = mesh.name?.trim() || "";
      const isBadName = rawName === "" || /^\d+$/.test(rawName);
      const meshName = isBadName ? `Mesh_${meshes.length + 1}` : rawName;

      const guessedName = isBadName
        ? guessPartName(mesh, meshes.length)
        : guessPartName(mesh, meshes.length);

      meshes.push({
        meshName,
        displayName: guessedName,
        selectable: true,
        visible: true,
        compatibleLed: guessedName.includes("LED"),
        compatibleInsert: guessedName.includes("Inserto"),
        materialSlots:
          guessedName === "Piano"
            ? "top"
            : guessedName === "Frontale"
            ? "front"
            : guessedName === "Specchio"
            ? "mirror"
            : guessedName === "Maniglia"
            ? "metal"
            : "main",
        compatibleAccessories:
          guessedName.includes("LED")
            ? "led"
            : guessedName.includes("Inserto")
            ? "inserto"
            : "",
            ledPosition: "front",
            ledFrontOffset: "4",
ledSideMargin: "5",
ledYOffset: "0",

insertPosition: "front",
insertOffsetX: "0",
insertOffsetY: "0",
insertOffsetZ: "1",
      });
    }
  });

  return meshes;
}

function AdminGLBModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.rotation.y = modelRotationY;

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;

    cloned.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    cloned.scale.setScalar(scale);
    cloned.updateMatrixWorld(true);

    return cloned;
  }, [scene, selectedMeshName, modelRotationY]);

  return (
    <primitive
      object={clonedScene}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Mesh;
        if (!clicked?.name) return;
        onSelectMesh(clicked.name);
      }}
    />
  );
}

function AdminSTLModel({
  url,
  selectedMeshName,
  onSelectMesh,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new STLLoader();

    loader.load(url, (loadedGeometry) => {
      loadedGeometry.computeVertexNormals();
      loadedGeometry.computeBoundingBox();

      const box = loadedGeometry.boundingBox;

      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;

        loadedGeometry.center();
        loadedGeometry.scale(scale, scale, scale);
        loadedGeometry.computeBoundingSphere();
      }

      setGeometry(loadedGeometry);
    });
  }, [url]);

  if (!geometry) return null;

  const meshName = "STL_Mesh";

  return (
    <mesh
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation();
        onSelectMesh(meshName);
      }}
    >
      <meshStandardMaterial
        color={selectedMeshName === meshName ? "#ffffff" : "#ffcc66"}
        roughness={0.45}
        metalness={0.05}
        side={THREE.DoubleSide}
        emissive={selectedMeshName === meshName ? "#2563eb" : "#000000"}
        emissiveIntensity={selectedMeshName === meshName ? 0.7 : 0}
      />
    </mesh>
  );
}

function AdminOBJModel({
  url,
  selectedMeshName,
  onSelectMesh,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();

    loader.load(url, (loadedObject) => {
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          mesh.material = new THREE.MeshStandardMaterial({
            color: mesh.name === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: mesh.name === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: mesh.name === selectedMeshName ? 0.7 : 0,
          });
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      loadedObject.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );

      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Mesh;
        if (!clicked?.name) return;
        onSelectMesh(clicked.name);
      }}
    />
  );
}
function AdminFBXModel({
  url,
  selectedMeshName,
  onSelectMesh,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new FBXLoader();

    loader.load(url, (loadedObject) => {
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          mesh.material = new THREE.MeshStandardMaterial({
            color: mesh.name === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: mesh.name === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: mesh.name === selectedMeshName ? 0.7 : 0,
          });
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      loadedObject.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );

      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Mesh;
        if (!clicked?.name) return;
        onSelectMesh(clicked.name);
      }}
    />
  );
}

function AdminModelRouter({
  url,
  fileName,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  fileName: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const ext = fileName.split(".").pop()?.toLowerCase();

 if (ext === "glb" || ext === "gltf") {
  return (
   <AdminGLBModel
  url={url}
  selectedMeshName={selectedMeshName}
  onSelectMesh={onSelectMesh}
  modelRotationY={modelRotationY}
/>
  );
}

  if (ext === "stl") {
    return (
      <AdminSTLModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
      />
    );
  }

  if (ext === "obj") {
    return (
      <AdminOBJModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
      />
    );
  }
if (ext === "fbx") {
  return (
    <AdminFBXModel
      url={url}
      selectedMeshName={selectedMeshName}
      onSelectMesh={onSelectMesh}
    />
  );
}
  return null;
}
export default function AdminPage() {

const [meshList, setMeshList] = useState<MeshConfig[]>([]);
const [generatedJson, setGeneratedJson] = useState("");
const [productId, setProductId] = useState("new-product");
const [productName, setProductName] = useState("Nuovo prodotto");
const [productCategory, setProductCategory] = useState("custom");
const [widthDefault, setWidthDefault] = useState(180);
const [widthMin, setWidthMin] = useState(100);
const [widthMax, setWidthMax] = useState(350);

const [heightDefault, setHeightDefault] = useState(100);
const [heightMin, setHeightMin] = useState(70);
const [heightMax, setHeightMax] = useState(150);

const [depthDefault, setDepthDefault] = useState(60);
const [depthMin, setDepthMin] = useState(40);
const [depthMax, setDepthMax] = useState(100);
const [modelFileName, setModelFileName] = useState("");
const [modelExtension, setModelExtension] = useState("glb");
const [modelPreviewUrl, setModelPreviewUrl] = useState("");
const [selectedMeshName, setSelectedMeshName] = useState("");
const [modelRotationY, setModelRotationY] = useState(0);
const [meshThumbnails, setMeshThumbnails] = useState<Record<string, string>>({});
const [backupStatus, setBackupStatus] = useState("Nessun autosave caricato");
const autosaveHydratedRef = useRef(false);
const meshCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
const meshInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
useEffect(() => {
  if (!selectedMeshName) return;

  meshCardRefs.current[selectedMeshName]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  setTimeout(() => {
    meshInputRefs.current[selectedMeshName]?.focus();
    meshInputRefs.current[selectedMeshName]?.select();
  }, 250);
}, [selectedMeshName]);

const buildAdminBackup = () => ({
  schema: "bagastudio-admin-backup",
  version: 1,
  savedAt: new Date().toISOString(),
  state: {
    productId,
    productName,
    productCategory,
    widthDefault,
    widthMin,
    widthMax,
    heightDefault,
    heightMin,
    heightMax,
    depthDefault,
    depthMin,
    depthMax,
    modelFileName,
    modelExtension,
    selectedMeshName,
    modelRotationY,
    meshList,
    generatedJson,
  },
});

const restoreAdminBackup = (backup: any) => {
  const state = backup?.state ?? backup;
  if (!state) return;

  setProductId(state.productId ?? "new-product");
  setProductName(state.productName ?? "Nuovo prodotto");
  setProductCategory(state.productCategory ?? "custom");

  setWidthDefault(Number(state.widthDefault ?? 180));
  setWidthMin(Number(state.widthMin ?? 100));
  setWidthMax(Number(state.widthMax ?? 350));

  setHeightDefault(Number(state.heightDefault ?? 100));
  setHeightMin(Number(state.heightMin ?? 70));
  setHeightMax(Number(state.heightMax ?? 150));

  setDepthDefault(Number(state.depthDefault ?? 60));
  setDepthMin(Number(state.depthMin ?? 40));
  setDepthMax(Number(state.depthMax ?? 100));

  setModelFileName(state.modelFileName ?? "");
  setModelExtension(state.modelExtension ?? "glb");
  setSelectedMeshName(state.selectedMeshName ?? "");
  setModelRotationY(Number(state.modelRotationY ?? 0));
  setMeshList(Array.isArray(state.meshList) ? state.meshList : []);
  setGeneratedJson(state.generatedJson ?? "");

  setBackupStatus(`Ripristino completato: ${new Date().toLocaleString()}`);
};

useEffect(() => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const savedAt = parsed?.savedAt
        ? new Date(parsed.savedAt).toLocaleString()
        : "data non disponibile";
      setBackupStatus(`Autosave disponibile: ${savedAt}`);
    } catch {
      setBackupStatus("Autosave presente ma non leggibile");
    }
  } else {
    setBackupStatus("Nessun autosave disponibile");
  }

  autosaveHydratedRef.current = true;
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!autosaveHydratedRef.current) return;

  const timer = window.setTimeout(() => {
    const backup = buildAdminBackup();
    window.localStorage.setItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY, JSON.stringify(backup));
    setBackupStatus(`Autosave: ${new Date().toLocaleTimeString()}`);
  }, 700);

  return () => window.clearTimeout(timer);
}, [
  productId,
  productName,
  productCategory,
  widthDefault,
  widthMin,
  widthMax,
  heightDefault,
  heightMin,
  heightMax,
  depthDefault,
  depthMin,
  depthMax,
  modelFileName,
  modelExtension,
  selectedMeshName,
  modelRotationY,
  meshList,
  generatedJson,
]);

const downloadAdminBackup = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJsonFile(`bagastudio-admin-backup-${stamp}.json`, buildAdminBackup());
};

const restoreLastAutosave = () => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (!saved) {
    setBackupStatus("Nessun autosave da ripristinare");
    return;
  }

  try {
    restoreAdminBackup(JSON.parse(saved));
  } catch {
    setBackupStatus("Errore: autosave non leggibile");
  }
};

const importBackupFile = async (file: File | undefined) => {
  if (!file) return;

  try {
    const text = await file.text();
    restoreAdminBackup(JSON.parse(text));
  } catch {
    setBackupStatus("Errore: file backup non valido");
  }
};


const handleModelFile = async (file: File | undefined) => {
  if (!file) return;

  setModelFileName(file.name);
  const url = URL.createObjectURL(file);
  setModelPreviewUrl(url);

  const ext = file.name.split(".").pop()?.toLowerCase() || "glb";
  setModelExtension(ext);

  if (ext === "stl") {
    setMeshList([
      {
        meshName: "STL_Mesh",
        displayName: "Componente STL",
        selectable: true,
        visible: true,
        compatibleLed: false,
        compatibleInsert: false,
        materialSlots: "main",
        compatibleAccessories: "",
        ledPosition: "front",
        ledFrontOffset: "4",
        ledSideMargin: "5",
        ledYOffset: "0",
        insertPosition: "front",
        insertOffsetX: "0",
        insertOffsetY: "0",
        insertOffsetZ: "1",
      },
    ]);
    return;
  }

  if (ext === "obj") {
    const loader = new OBJLoader();
    loader.load(url, (loadedObject) => {
      const meshes = extractMeshesFromObject(loadedObject);
      setMeshList(meshes);
    });
    return;
  }

  if (ext === "fbx") {
    const loader = new FBXLoader();
    loader.load(url, (loadedObject) => {
      const meshes = extractMeshesFromObject(loadedObject);
      setMeshList(meshes);
    });
    return;
  }

  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    const meshes: MeshConfig[] = [];

    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push({
          meshName: child.name || "unnamed_mesh",
          displayName: guessPartName(child as THREE.Mesh, meshes.length),
          selectable: true,
          visible: true,
          compatibleLed: false,
          compatibleInsert: false,
          materialSlots: "main",
          compatibleAccessories: "",
          ledPosition: "front",
          ledFrontOffset: "4",
          ledSideMargin: "5",
          ledYOffset: "0",
          insertPosition: "front",
          insertOffsetX: "0",
          insertOffsetY: "0",
          insertOffsetZ: "1",
        });
      }
    });

    setMeshList(meshes);
  });
};

const generateProductPackage = () => {
  const productPackage = {
    id: productId,
    name: productName,
    category: productCategory,
    version: "1.0.0",
    assets: {
      modelUrl: `/models/${modelFileName || "imported-model.glb"}`,
      originalFileUrl: `/models/${modelFileName || "imported-model.glb"}`,
      originalFormat: modelExtension || "glb",
      convertedModelUrl: `/models/${modelFileName || "imported-model.glb"}`,
    },
    dimensions: {
      width: { min: widthMin, max: widthMax, step: 10, default: widthDefault },
      height: { min: heightMin, max: heightMax, step: 10, default: heightDefault },
      depth: { min: depthMin, max: depthMax, step: 5, default: depthDefault },
    },
    parts: meshList.map((mesh, index) => ({
      id: `part_${index + 1}`,
      name: mesh.displayName,
      meshName: mesh.meshName,
      selectable: mesh.selectable,
      visible: mesh.visible,
      compatibleLed: mesh.compatibleLed,
      compatibleInsert: mesh.compatibleInsert,
      materialSlots: mesh.materialSlots ? mesh.materialSlots.split(",").map((part) => part.trim()) : ["main"],
      allowedMaterialCategories: ["wood", "marble", "metal"],
      compatibleAccessories: [
        ...(mesh.compatibleAccessories ? mesh.compatibleAccessories.split(",").map((part) => part.trim()) : []),
        ...(mesh.compatibleInsert ? ["insert"] : []),
        ...(mesh.compatibleLed ? ["led"] : []),
      ],
      mountPoints: {
        ...(mesh.compatibleLed && {
          led: {
            frontOffset: Number(mesh.ledFrontOffset),
            sideMargin: Number(mesh.ledSideMargin),
            yOffset: Number(mesh.ledYOffset),
            position: mesh.ledPosition || "front",
          },
        }),
        ...(mesh.compatibleInsert && {
          insert: {
            position:
              mesh.displayName?.toLowerCase().includes("piano") ||
              mesh.meshName?.toLowerCase().includes("piano") ||
              mesh.meshName?.toLowerCase().includes("orizzontale")
                ? ["top"]
                : mesh.displayName?.toLowerCase().includes("fianco") ||
                  mesh.meshName?.toLowerCase().includes("fianco") ||
                  mesh.meshName?.toLowerCase().includes("side")
                  ? ["side"]
                  : mesh.insertPosition
                    ? mesh.insertPosition.split(",").map((part) => part.trim())
                    : ["front"],
            offset: {
              x: Number(mesh.insertOffsetX || 0),
              y:
                mesh.insertPosition === "top" ||
                mesh.displayName?.toLowerCase().includes("piano") ||
                mesh.meshName?.toLowerCase().includes("piano") ||
                mesh.meshName?.toLowerCase().includes("orizzontale")
                  ? 0.08
                  : Number(mesh.insertOffsetY || 0),
              z:
                mesh.insertPosition === "top" ||
                mesh.displayName?.toLowerCase().includes("piano") ||
                mesh.meshName?.toLowerCase().includes("piano") ||
                mesh.meshName?.toLowerCase().includes("orizzontale")
                  ? 0
                  : Number(mesh.insertOffsetZ || 1),
            },
          },
        }),
      },
    })),
    materials: DEFAULT_PRODUCT_MATERIALS,
    options: [],
    accessories: [
      { id: "insert", name: "Inserto", stateType: "insert" },
      { id: "led", name: "LED", stateType: "accessory" },
    ],
    pricing: { basePrice: 900, margin: 0, vat: 22 },
    views: DEFAULT_PRODUCT_VIEWS,
  };

  const jsonString = JSON.stringify(productPackage, null, 2);
  setGeneratedJson(jsonString);
  downloadJsonFile("product-package.json", jsonString);
};

  return (
    <main className="min-h-screen bg-[#02070d] text-white">
      <div className="mx-auto max-w-[1760px] p-4">
        <div className="overflow-hidden rounded-2xl border border-sky-900/50 bg-[#06101a] shadow-2xl shadow-sky-950/40">
          <header className="border-b border-sky-900/40 bg-gradient-to-r from-[#02070d] via-[#071522] to-[#02070d] p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-5">
                <img
                  src="/bagastudio-core-brand.png"
                  alt="BagaStudio Core"
                  className="h-28 w-28 rounded-2xl object-cover shadow-xl shadow-sky-500/20"
                />
                <div>
                  <p className="text-xs font-semibold tracking-[0.55em] text-sky-300/80">BAGASTUDIO CORE</p>
                  <h1 className="mt-2 text-4xl font-black leading-none tracking-tight">
                    Admin <span className="text-sky-400">Panel</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400">
                    Importer professionale per modelli 3D, mapping componenti, materiali, accessori, LED, inserti e package JSON prodotto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {["IMPORTER 3D", "MAPPING", "MATERIALI", "JSON PACKAGE"].map((label) => (
                  <div key={label} className="rounded-2xl border border-sky-900/50 bg-black/25 px-5 py-4 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/40 text-sky-300">◆</div>
                    <p className="text-xs font-bold tracking-wide text-slate-200">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-sky-800/60 bg-black/30 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato importer</p>
                <p className="mt-1 text-2xl font-black text-sky-400">{meshList.length} mesh</p>
                <p className="text-xs text-slate-500">{modelFileName || "Nessun modello caricato"}</p>
              </div>
            </div>
          </header>

          <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-900/40 bg-[#030b13] px-6 py-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-950/30">Admin Panel</button>
              <button type="button" className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-300">Importer</button>
              <button type="button" className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-300">Catalogo</button>
              <button type="button" className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-300">Materiali</button>
              <button type="button" className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold text-slate-300">Pricing</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/" className="rounded-xl border border-sky-900/60 px-4 py-3 text-sm font-bold text-slate-200">Torna al Viewer</a>
              <button type="button" onClick={downloadAdminBackup} className="rounded-xl border border-sky-700/70 px-4 py-3 text-sm font-bold text-sky-200">Scarica backup</button>
              <button type="button" onClick={restoreLastAutosave} className="rounded-xl border border-amber-500/60 px-4 py-3 text-sm font-bold text-amber-200">Ripristina autosave</button>
              <label className="cursor-pointer rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white">
                Importa backup
                <input type="file" accept=".json" className="hidden" onChange={(event) => importBackupFile(event.target.files?.[0])} />
              </label>
            </div>
          </nav>

          <section className="grid gap-4 p-4 xl:grid-cols-[330px_minmax(0,1fr)_390px]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-sky-900/50 bg-[#06101a] p-5">
                <h2 className="text-lg font-black">Importa modello</h2>
                <p className="mt-1 text-xs text-slate-400">GLB, GLTF, OBJ, FBX, STL.</p>
                <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-sky-700/70 bg-sky-950/20 p-5 text-center hover:bg-sky-950/40">
                  <span className="text-sm font-bold text-sky-200">Scegli file modello 3D</span>
                  <input type="file" accept=".glb,.gltf,.obj,.stl,.fbx" className="hidden" onChange={(event) => handleModelFile(event.target.files?.[0])} />
                </label>
                <div className="mt-4 rounded-xl bg-black/25 p-3 text-xs text-slate-400">
                  <p><span className="text-slate-200">File:</span> {modelFileName || "—"}</p>
                  <p><span className="text-slate-200">Formato:</span> {modelExtension.toUpperCase()}</p>
                  <p><span className="text-slate-200">Autosave:</span> {backupStatus}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-900/50 bg-[#06101a] p-5">
                <h2 className="text-lg font-black">Rotazione modello</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setModelRotationY(0)} className="rounded-xl border border-sky-900/60 bg-white/5 px-3 py-3 text-sm font-bold">0°</button>
                  <button type="button" onClick={() => setModelRotationY(Math.PI / 2)} className="rounded-xl border border-sky-900/60 bg-white/5 px-3 py-3 text-sm font-bold">90°</button>
                  <button type="button" onClick={() => setModelRotationY(Math.PI)} className="rounded-xl border border-sky-900/60 bg-white/5 px-3 py-3 text-sm font-bold">180°</button>
                  <button type="button" onClick={() => setModelRotationY((Math.PI * 3) / 2)} className="rounded-xl border border-sky-900/60 bg-white/5 px-3 py-3 text-sm font-bold">270°</button>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-900/50 bg-[#06101a] p-5">
                <h2 className="text-lg font-black">Informazioni prodotto</h2>
                <div className="mt-4 space-y-3">
                  <input value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="ID prodotto" className="w-full rounded-xl border border-sky-900/60 bg-black/35 px-4 py-3 text-sm text-white" />
                  <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Nome prodotto" className="w-full rounded-xl border border-sky-900/60 bg-black/35 px-4 py-3 text-sm text-white" />
                  <input value={productCategory} onChange={(event) => setProductCategory(event.target.value)} placeholder="Categoria" className="w-full rounded-xl border border-sky-900/60 bg-black/35 px-4 py-3 text-sm text-white" />
                </div>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-sky-900/50 bg-black">
                <div className="flex items-center justify-between border-b border-sky-900/40 bg-[#06101a] px-5 py-4">
                  <div>
                    <h2 className="text-lg font-black">Preview 3D Admin</h2>
                    <p className="text-xs text-slate-400">Clicca una mesh nel modello per selezionarla nel mapping.</p>
                  </div>
                  <span className="rounded-xl border border-sky-700/60 px-3 py-2 text-xs font-bold text-sky-200">{selectedMeshName || "Nessuna selezione"}</span>
                </div>
                <div className="h-[620px] bg-neutral-300">
                  <Canvas camera={{ position: [4, 3, 6], fov: 45 }} style={{ background: "#8f8f8f" }}>
                    <ambientLight intensity={3} />
                    <directionalLight position={[5, 8, 5]} intensity={4} />
                    <directionalLight position={[-5, 3, -5]} intensity={2} />
                    <gridHelper args={[10, 10]} />
                    <axesHelper args={[3]} />
                    <OrbitControls target={[0, 0, 0]} />
                    {modelPreviewUrl && (
                      <AdminModelRouter
                        url={modelPreviewUrl}
                        fileName={modelFileName}
                        selectedMeshName={selectedMeshName}
                        onSelectMesh={(meshName) => setSelectedMeshName(meshName)}
                        modelRotationY={modelRotationY}
                      />
                    )}
                  </Canvas>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-900/50 bg-[#06101a] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">Dimensioni prodotto</h2>
                    <p className="text-xs text-slate-400">Valori salvati nel package JSON.</p>
                  </div>
                  <button type="button" onClick={generateProductPackage} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-950/30">Genera JSON prodotto</button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    ["Larghezza", widthMin, setWidthMin, widthDefault, setWidthDefault, widthMax, setWidthMax],
                    ["Altezza", heightMin, setHeightMin, heightDefault, setHeightDefault, heightMax, setHeightMax],
                    ["Profondità", depthMin, setDepthMin, depthDefault, setDepthDefault, depthMax, setDepthMax],
                  ].map(([label, minValue, setMin, defaultValue, setDefault, maxValue, setMax]: any) => (
                    <div key={label} className="rounded-2xl border border-sky-900/40 bg-black/25 p-4">
                      <h3 className="font-bold text-slate-100">{label}</h3>
                      <label className="mt-3 block text-xs text-slate-400">Min</label>
                      <input type="number" value={minValue} onChange={(event) => setMin(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-sky-900/60 bg-black/35 px-3 py-2 text-white" />
                      <label className="mt-3 block text-xs text-slate-400">Default</label>
                      <input type="number" value={defaultValue} onChange={(event) => setDefault(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-sky-900/60 bg-black/35 px-3 py-2 text-white" />
                      <label className="mt-3 block text-xs text-slate-400">Max</label>
                      <input type="number" value={maxValue} onChange={(event) => setMax(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-sky-900/60 bg-black/35 px-3 py-2 text-white" />
                    </div>
                  ))}
                </div>
              </div>

              {generatedJson && (
                <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/10 p-5">
                  <h2 className="text-lg font-black text-emerald-200">JSON prodotto generato</h2>
                  <pre className="mt-4 max-h-[360px] overflow-auto rounded-xl bg-black/60 p-4 text-xs text-emerald-300">{generatedJson}</pre>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-sky-900/50 bg-[#06101a] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black">Mapping componenti</h2>
                  <span className="rounded-lg bg-sky-600/20 px-3 py-1 text-xs font-bold text-sky-200">{meshList.length}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Rinomina mesh, abilita selezione, LED, inserti e slot materiali.</p>

                <div className="mt-4 max-h-[980px] space-y-3 overflow-auto pr-1">
                  {meshList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-sky-900/50 bg-black/20 p-6 text-center text-sm text-slate-400">
                      Qui comparirà la lista mesh del modello importato.
                    </div>
                  ) : (
                    meshList.map((mesh, index) => (
                      <div
                        key={index}
                        ref={(el) => { meshCardRefs.current[mesh.meshName] = el; }}
                        onClick={() => setSelectedMeshName(mesh.meshName)}
                        className={`rounded-2xl border p-4 transition ${selectedMeshName === mesh.meshName ? "border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-950/30" : "border-sky-900/40 bg-black/25 hover:border-sky-700/70"}`}
                      >
                        {meshThumbnails[mesh.meshName] && (
                          <img src={meshThumbnails[mesh.meshName]} alt={mesh.displayName} className="mb-3 h-20 w-full rounded-xl border border-sky-900/40 bg-black object-contain" />
                        )}
                        <p className="text-[11px] text-slate-500">Mesh: {mesh.meshName}</p>
                        <input
                          ref={(el) => { meshInputRefs.current[mesh.meshName] = el; }}
                          value={mesh.displayName}
                          onChange={(event) => {
                            const updated = [...meshList];
                            updated[index].displayName = event.target.value;
                            setMeshList(updated);
                          }}
                          className="mt-2 w-full rounded-xl border border-sky-900/60 bg-black/40 px-3 py-2 text-sm font-bold text-white"
                        />

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                          {[
                            ["Selezionabile", "selectable"],
                            ["Visibile", "visible"],
                            ["Compatibile LED", "compatibleLed"],
                            ["Compatibile Inserto", "compatibleInsert"],
                          ].map(([label, key]: any) => (
                            <label key={key} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2">
                              <input
                                type="checkbox"
                                checked={(mesh as any)[key]}
                                onChange={(event) => {
                                  const updated = [...meshList];
                                  (updated[index] as any)[key] = event.target.checked;
                                  setMeshList(updated);
                                }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>

                        {mesh.compatibleLed && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <select
                              value={mesh.ledPosition}
                              onChange={(event) => {
                                const updated = [...meshList];
                                updated[index].ledPosition = event.target.value;
                                setMeshList(updated);
                              }}
                              className="rounded-xl border border-sky-900/60 bg-black/40 px-3 py-2 text-xs text-white"
                            >
                              <option value="front">LED Front</option>
                              <option value="top">LED Top</option>
                              <option value="side">LED Side</option>
                            </select>
                            {[
                              ["Front offset", "ledFrontOffset"],
                              ["Side margin", "ledSideMargin"],
                              ["Y offset", "ledYOffset"],
                            ].map(([label, key]: any) => (
                              <input
                                key={key}
                                type="number"
                                value={(mesh as any)[key]}
                                title={label}
                                onChange={(event) => {
                                  const updated = [...meshList];
                                  (updated[index] as any)[key] = event.target.value;
                                  setMeshList(updated);
                                }}
                                className="rounded-xl border border-sky-900/60 bg-black/40 px-3 py-2 text-xs text-white"
                              />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <input
                            value={mesh.materialSlots}
                            onChange={(event) => {
                              const updated = [...meshList];
                              updated[index].materialSlots = event.target.value;
                              setMeshList(updated);
                            }}
                            placeholder="main, top, frontale"
                            className="rounded-xl border border-sky-900/60 bg-black/40 px-3 py-2 text-xs text-white"
                          />
                          <input
                            value={mesh.compatibleAccessories}
                            onChange={(event) => {
                              const updated = [...meshList];
                              updated[index].compatibleAccessories = event.target.value;
                              setMeshList(updated);
                            }}
                            placeholder="led, inserto, maniglia"
                            className="rounded-xl border border-sky-900/60 bg-black/40 px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
