import * as THREE from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { applyUniqueRuntimeMeshNames } from "@/lib/importer/importerNamingEngine";

export type RuntimeGlbConverterInput = {
  daeText: string;
  fileName?: string;
  bakeTransforms?: boolean;
  centerModel?: boolean;
  normalizeScale?: boolean;
  stripMaterials?: boolean;
};

export type RuntimeGlbConverterResult = {
  glbBlob: Blob;
  glbArrayBuffer: ArrayBuffer;
  objectCount: number;
  meshCount: number;
  fileName: string;
  generatedAt: string;
  warnings: string[];
  naming: {
    renamedCount: number;
    duplicateBaseNames: string[];
    meshNames: string[];
  };
};

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType = "model/gltf-binary"): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
}

function daeTextToDataUrl(daeText: string): string {
  return `data:application/xml;base64,${btoa(unescape(encodeURIComponent(daeText)))}`;
}

function createSafeRuntimeMaterial() {
  return new THREE.MeshStandardMaterial({
    name: "BagaStudio_Runtime_Safe_Material",
    color: new THREE.Color("#d8d8d8"),
    roughness: 0.65,
    metalness: 0,
  });
}

function disposeMaterialTextures(material: THREE.Material) {
  const materialAny = material as any;

  [
    "map",
    "alphaMap",
    "aoMap",
    "bumpMap",
    "displacementMap",
    "emissiveMap",
    "envMap",
    "lightMap",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
    "specularMap",
    "gradientMap",
  ].forEach((key) => {
    if (materialAny[key]) {
      materialAny[key] = null;
    }
  });

  material.needsUpdate = true;
}

function stripUnsafeMaterials(scene: THREE.Object3D) {
  let strippedMaterialCount = 0;
  const safeMaterial = createSafeRuntimeMaterial();

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.isMesh) return;

    const currentMaterial = mesh.material;

    if (Array.isArray(currentMaterial)) {
      currentMaterial.forEach((material) => disposeMaterialTextures(material));
      mesh.material = currentMaterial.map(() => safeMaterial.clone());
      strippedMaterialCount += currentMaterial.length;
      return;
    }

    if (currentMaterial) {
      disposeMaterialTextures(currentMaterial);
      mesh.material = safeMaterial.clone();
      strippedMaterialCount += 1;
    }
  });

  return strippedMaterialCount;
}

function prepareSceneForRuntime(
  scene: THREE.Object3D,
  options: Pick<
    RuntimeGlbConverterInput,
    "bakeTransforms" | "centerModel" | "normalizeScale" | "stripMaterials"
  >
) {
  const warnings: string[] = [];

  scene.updateMatrixWorld(true);

  if (options.stripMaterials !== false) {
    const strippedCount = stripUnsafeMaterials(scene);
    warnings.push(`Texture/materiali DAE neutralizzati per export GLB: ${strippedCount}.`);
  }

 if (options.bakeTransforms !== false) {
  scene.updateMatrixWorld(true);

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.isMesh) return;

    if (mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
  });

  warnings.push(
    "Hierarchy-safe mode attiva: trasformazioni COLLADA preservate."
  );
}

  if (options.centerModel !== false) {
    const box = new THREE.Box3().setFromObject(scene);

    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      scene.position.sub(center);
      scene.updateMatrixWorld(true);
    } else {
      warnings.push("Bounding box vuota: centratura modello saltata.");
    }
  }

  if (options.normalizeScale === true) {
    const box = new THREE.Box3().setFromObject(scene);

    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z);

      if (maxAxis > 0) {
        const targetSize = 3;
        const scale = targetSize / maxAxis;
        scene.scale.multiplyScalar(scale);
        scene.updateMatrixWorld(true);
      } else {
        warnings.push("Scala non normalizzata: dimensione massima non valida.");
      }
    }
  }

  return warnings;
}

function countSceneObjects(scene: THREE.Object3D) {
  let objectCount = 0;
  let meshCount = 0;

  scene.traverse((object) => {
    objectCount += 1;

    if ((object as THREE.Mesh).isMesh) {
      meshCount += 1;
    }
  });

  return { objectCount, meshCount };
}

export async function convertDaeToRuntimeGlb(
  input: RuntimeGlbConverterInput
): Promise<RuntimeGlbConverterResult> {
  if (!input?.daeText || typeof input.daeText !== "string") {
    throw new Error("convertDaeToRuntimeGlb: daeText mancante o non valido.");
  }

  const loader = new ColladaLoader();
  const daeDataUrl = daeTextToDataUrl(input.daeText);
  const collada = await loader.loadAsync(daeDataUrl);

  if (!collada?.scene) {
    throw new Error("convertDaeToRuntimeGlb: scena COLLADA non trovata.");
  }

  const scene = collada.scene;
  scene.name = input.fileName || "BagaStudio_DAE_Runtime";

  const naming = applyUniqueRuntimeMeshNames(scene);

  const warnings = prepareSceneForRuntime(scene, {
    bakeTransforms: input.bakeTransforms,
    centerModel: input.centerModel,
    normalizeScale: input.normalizeScale,
    stripMaterials: input.stripMaterials,
  });

  if (naming.renamedCount > 0) {
    warnings.push(
      `Importer Naming Engine: rinominate ${naming.renamedCount} mesh duplicate/univoche.`
    );
  }

  if (naming.duplicateBaseNames.length > 0) {
    warnings.push(
      `Mesh duplicate normalizzate: ${naming.duplicateBaseNames.join(", ")}.`
    );
  }

  const { objectCount, meshCount } = countSceneObjects(scene);

  const exporter = new GLTFExporter();

  const glbArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
          return;
        }

        try {
          const json = JSON.stringify(result);
          const blob = new Blob([json], { type: "model/gltf+json" });
          blob.arrayBuffer().then(resolve).catch(reject);
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error),
      {
        binary: true,
        onlyVisible: true,
        truncateDrawRange: true,
      }
    );
  });

  const glbBlob = new Blob([glbArrayBuffer], { type: "model/gltf-binary" });

  return {
    glbBlob,
    glbArrayBuffer,
    objectCount,
    meshCount,
    fileName: (input.fileName || "bagastudio-runtime-model").replace(/\.[^.]+$/, "") + ".glb",
    generatedAt: new Date().toISOString(),
    warnings,
    naming,
  };
}

export async function convertDaeToRuntimeGlbDataUrl(
  input: RuntimeGlbConverterInput
): Promise<string> {
  const result = await convertDaeToRuntimeGlb(input);
  return arrayBufferToDataUrl(result.glbArrayBuffer);
}
