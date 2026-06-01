import * as THREE from "three";

export type ImporterNamingEngineResult = {
  renamedCount: number;
  duplicateBaseNames: string[];
  meshNames: string[];
};

function sanitizeMeshName(name: string, fallback: string) {
  const clean = String(name || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return clean || fallback;
}

function formatIndex(index: number) {
  return String(index).padStart(3, "0");
}

export function applyUniqueRuntimeMeshNames(scene: THREE.Object3D): ImporterNamingEngineResult {
  const baseNameCounts = new Map<string, number>();
  const usedNames = new Set<string>();
  const duplicateBaseNames = new Set<string>();

  let meshIndex = 0;
  let renamedCount = 0;
  const meshNames: string[] = [];

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.isMesh) return;

    meshIndex += 1;

    const originalName = sanitizeMeshName(
      mesh.name || object.name,
      `mesh_${formatIndex(meshIndex)}`
    );

    const nextCount = (baseNameCounts.get(originalName) || 0) + 1;
    baseNameCounts.set(originalName, nextCount);

    if (nextCount > 1) {
      duplicateBaseNames.add(originalName);
    }

    let nextName = `${originalName}_${formatIndex(nextCount)}`;

    while (usedNames.has(nextName)) {
      const forcedIndex = usedNames.size + 1;
      nextName = `${originalName}_${formatIndex(forcedIndex)}`;
    }

    usedNames.add(nextName);

    mesh.userData = {
      ...(mesh.userData || {}),
      bagastudioOriginalMeshName: mesh.name || object.name || originalName,
      bagastudioRuntimeMeshName: nextName,
      bagastudioRuntimeMeshIndex: meshIndex,
      bagastudioBaseMeshName: originalName,
      bagastudioDuplicateIndex: nextCount,
    };

    if (mesh.name !== nextName) {
      renamedCount += 1;
      mesh.name = nextName;
    }

    meshNames.push(nextName);
  });

  return {
    renamedCount,
    duplicateBaseNames: Array.from(duplicateBaseNames),
    meshNames,
  };
}
