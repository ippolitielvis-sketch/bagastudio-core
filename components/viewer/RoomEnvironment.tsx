"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { configureSceneTexture, resolveSceneMaterialPreset } from "./sceneMaterials";

export type RoomEnvironmentSettings = {
  roomWidthCm?: number;
  roomDepthCm?: number;
  roomHeightCm?: number;
  width?: number;
  depth?: number;
  height?: number;
  floorMaterial?: string;
  wallMaterial?: string;
  showBackWall?: boolean;
  showLeftWall?: boolean;
  showRightWall?: boolean;
  showCeiling?: boolean;
  baseboardHeightCm?: number;
  baseboardDepthCm?: number;
};

type LoadedSceneTextures = {
  floorBase: THREE.Texture;
  floorNormal: THREE.Texture;
  floorRoughness: THREE.Texture;
  wallBase: THREE.Texture;
  wallNormal: THREE.Texture;
  wallRoughness: THREE.Texture;
  ceilingBase: THREE.Texture;
  baseboardBase: THREE.Texture;
};

const sceneTextureLoader = new THREE.TextureLoader();
const sceneTextureCache = new Map<string, THREE.Texture>();

function loadSceneTexture(url: string) {
  const cached = sceneTextureCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise<THREE.Texture>((resolve, reject) => {
    sceneTextureLoader.load(
      url,
      (texture) => {
        sceneTextureCache.set(url, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

function usePremiumSceneTextures() {
  const preset = resolveSceneMaterialPreset();
  const [textures, setTextures] = useState<LoadedSceneTextures | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.all([
      loadSceneTexture(preset.floor.baseColor),
      loadSceneTexture(preset.floor.normal),
      loadSceneTexture(preset.floor.roughness),
      loadSceneTexture(preset.wall.baseColor),
      loadSceneTexture(preset.wall.normal),
      loadSceneTexture(preset.wall.roughness),
      loadSceneTexture(preset.ceiling.baseColor),
      loadSceneTexture(preset.baseboard.baseColor),
    ])
      .then(([floorBase, floorNormal, floorRoughness, wallBase, wallNormal, wallRoughness, ceilingBase, baseboardBase]) => {
        if (!alive) return;
        setTextures({
          floorBase: configureSceneTexture(floorBase.clone(), preset.floor.repeat) as THREE.Texture,
          floorNormal: configureSceneTexture(floorNormal.clone(), preset.floor.repeat, "linear") as THREE.Texture,
          floorRoughness: configureSceneTexture(floorRoughness.clone(), preset.floor.repeat, "linear") as THREE.Texture,
          wallBase: configureSceneTexture(wallBase.clone(), preset.wall.repeat) as THREE.Texture,
          wallNormal: configureSceneTexture(wallNormal.clone(), preset.wall.repeat, "linear") as THREE.Texture,
          wallRoughness: configureSceneTexture(wallRoughness.clone(), preset.wall.repeat, "linear") as THREE.Texture,
          ceilingBase: configureSceneTexture(ceilingBase.clone(), preset.ceiling.repeat) as THREE.Texture,
          baseboardBase: configureSceneTexture(baseboardBase.clone(), preset.baseboard.repeat) as THREE.Texture,
        });
      })
      .catch((error) => {
        console.error("BagaStudio scene material preload failed", error);
      });

    return () => {
      alive = false;
    };
  }, [preset]);

  return textures;
}

function cmToM(value: any, fallback: number) {
  const parsed = Number(value);
  return Math.max(0.1, Number.isFinite(parsed) ? parsed / 100 : fallback / 100);
}

export default function PremiumRoomEnvironment({ environment }: { environment?: RoomEnvironmentSettings }) {
  const textures = usePremiumSceneTextures();
  const preset = resolveSceneMaterialPreset();

  const roomWidthM = cmToM(environment?.roomWidthCm ?? environment?.width, 420);
  const roomDepthM = cmToM(environment?.roomDepthCm ?? environment?.depth, 360);
  const roomHeightM = cmToM(environment?.roomHeightCm ?? environment?.height, 280);
  const baseboardHeightM = cmToM(environment?.baseboardHeightCm, 4);
  const baseboardDepthM = cmToM(environment?.baseboardDepthCm, 0.8);

  const halfW = roomWidthM / 2;
  const halfD = roomDepthM / 2;

  const showroomSpotPositions = useMemo(
    () => [
      [-roomWidthM * 0.32, roomHeightM - 0.08, -roomDepthM * 0.28] as [number, number, number],
      [0, roomHeightM - 0.08, -roomDepthM * 0.28] as [number, number, number],
      [roomWidthM * 0.32, roomHeightM - 0.08, -roomDepthM * 0.28] as [number, number, number],
      [-roomWidthM * 0.24, roomHeightM - 0.08, roomDepthM * 0.18] as [number, number, number],
      [roomWidthM * 0.24, roomHeightM - 0.08, roomDepthM * 0.18] as [number, number, number],
    ],
    [roomWidthM, roomDepthM, roomHeightM]
  );

  const materials = useMemo(() => {
    if (!textures) return null;

    return {
      floor: new THREE.MeshStandardMaterial({
        map: textures.floorBase,
        normalMap: textures.floorNormal,
        roughnessMap: textures.floorRoughness,
        color: preset.floor.color,
        roughness: preset.floor.roughnessValue,
        metalness: preset.floor.metalnessValue,
        normalScale: new THREE.Vector2(...preset.floor.normalScale),
        side: THREE.DoubleSide,
      }),
      wall: new THREE.MeshStandardMaterial({
        map: textures.wallBase,
        normalMap: textures.wallNormal,
        roughnessMap: textures.wallRoughness,
        color: preset.wall.color,
        roughness: preset.wall.roughnessValue,
        metalness: preset.wall.metalnessValue,
        normalScale: new THREE.Vector2(...preset.wall.normalScale),
        side: THREE.DoubleSide,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: "#f4efe7",
        roughness: 0.78,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
      baseboard: new THREE.MeshStandardMaterial({
        color: "#8b8172",
        roughness: 0.58,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
      spotlightBody: new THREE.MeshStandardMaterial({
        color: "#181818",
        roughness: 0.45,
        metalness: 0.35,
      }),
      spotlightGlass: new THREE.MeshStandardMaterial({
        color: "#fff3d6",
        emissive: "#fff0c8",
        emissiveIntensity: 1.2,
        roughness: 0.25,
        metalness: 0,
      }),
    };
  }, [textures, preset]);

  useEffect(() => {
    return () => {
      if (!materials) return;
      Object.values(materials).forEach((material) => material.dispose());
    };
  }, [materials]);

  if (!environment || !materials) return null;

  return (
    <group name="bagastudio-premium-room-environment-v61-5-baseboard">
      <ambientLight intensity={0.9} color="#fff3e4" />
      <hemisphereLight intensity={0.55} color="#fff6ea" groundColor="#6f6254" />
      <directionalLight position={[3.5, roomHeightM + 1.6, 2.8]} intensity={1.05} color="#fff1dc" castShadow />
      <pointLight position={[0, roomHeightM - 0.25, 0]} intensity={1.3} distance={7} color="#fff2df" />
      <pointLight position={[0, 0.35, -halfD + 0.18]} intensity={0.75} distance={5.5} color="#ffd9a3" />

      {showroomSpotPositions.map((position, index) => (
        <group key={`showroom-spot-${index}`} position={position} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={materials.spotlightBody}>
            <cylinderGeometry args={[0.055, 0.055, 0.025, 28]} />
          </mesh>
          <mesh position={[0, 0.014, 0]} material={materials.spotlightGlass}>
            <circleGeometry args={[0.043, 28]} />
          </mesh>
          <pointLight
            position={[0, 0.04, 0]}
            intensity={0.9}
            distance={4.2}
            color="#fff0d8"
          />
        </group>
      ))}

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={materials.floor}>
        <planeGeometry args={[roomWidthM, roomDepthM, 64, 64]} />
      </mesh>

      {environment.showBackWall !== false && (
        <mesh receiveShadow position={[0, roomHeightM / 2, -halfD]} material={materials.wall}>
          <boxGeometry args={[roomWidthM, roomHeightM, 0.035]} />
        </mesh>
      )}

      {environment.showLeftWall !== false && (
        <mesh receiveShadow position={[-halfW, roomHeightM / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.wall}>
          <boxGeometry args={[roomDepthM, roomHeightM, 0.035]} />
        </mesh>
      )}

      {environment.showRightWall !== false && (
        <mesh receiveShadow position={[halfW, roomHeightM / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.wall}>
          <boxGeometry args={[roomDepthM, roomHeightM, 0.035]} />
        </mesh>
      )}

      {environment.showCeiling !== false && (
        <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, roomHeightM, 0]} material={materials.ceiling}>
          <planeGeometry args={[roomWidthM, roomDepthM, 16, 16]} />
        </mesh>
      )}

      {environment.showBackWall !== false && (
        <mesh receiveShadow position={[0, baseboardHeightM / 2, -halfD + baseboardDepthM / 2]} material={materials.baseboard}>
          <boxGeometry args={[roomWidthM, baseboardHeightM, baseboardDepthM]} />
        </mesh>
      )}
      {environment.showLeftWall !== false && (
        <mesh receiveShadow position={[-halfW + baseboardDepthM / 2, baseboardHeightM / 2, 0]} material={materials.baseboard}>
          <boxGeometry args={[baseboardDepthM, baseboardHeightM, roomDepthM]} />
        </mesh>
      )}
      {environment.showRightWall !== false && (
        <mesh receiveShadow position={[halfW - baseboardDepthM / 2, baseboardHeightM / 2, 0]} material={materials.baseboard}>
          <boxGeometry args={[baseboardDepthM, baseboardHeightM, roomDepthM]} />
        </mesh>
      )}
    </group>
  );
}
