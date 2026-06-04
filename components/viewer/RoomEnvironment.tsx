/* BagaStudio Room Environment Refactor V1 */
"use client";

import * as THREE from "three";

export type RoomEnvironmentSettings = {
  roomWidthCm: number;
  roomDepthCm: number;
  roomHeightCm: number;
  floorMaterial: string;
  wallMaterial: string;
  showBackWall: boolean;
  showLeftWall: boolean;
  showRightWall: boolean;
};

function getRoomEnvironmentColor(materialId: string, fallback = "#d8d3c7") {
  const key = String(materialId || "").toLowerCase();

  // BagaStudio Room Materials V1.1:
  // allinea gli ID usati dalla UI in app/page.tsx con il resolver del RoomEnvironment.
  // Senza questi alias, materiali come "dark-matte" cadevano sul fallback cemento chiaro.
  if (key.includes("dark-matte")) return "#111111";
  if (key.includes("cement-light")) return "#b7b7b0";
  if (key.includes("stone-greige")) return "#b6aa9b";
  if (key.includes("wood-neutral")) return "#98704f";
  if (key.includes("warm-white")) return "#f2ece2";
  if (key.includes("dark-salon")) return "#1a1d21";

  if (key.includes("cemento-scuro") || key.includes("dark-concrete")) return "#4f5353";
  if (key.includes("cemento") || key.includes("concrete")) return "#aaa79f";
  if (key.includes("gres") || key.includes("stone") || key.includes("pietra")) return "#b9b0a4";
  if (key.includes("legno-scuro") || key.includes("dark-wood")) return "#6f4d32";
  if (key.includes("legno") || key.includes("7040") || key.includes("wood")) return "#9a7650";
  if (key.includes("tortora")) return "#9b8f83";
  if (key.includes("nero") || key.includes("black")) return "#171717";
  if (key.includes("grigio") || key.includes("grey") || key.includes("gray")) return "#8d8d88";
  if (key.includes("bianco-sporco") || key.includes("avorio") || key.includes("ivory")) return "#e4ddcf";
  if (key.includes("bianco") || key.includes("white")) return "#eee8dc";

  return fallback;
}


function createBagastudioRoomProceduralTexture(materialId: string, target: "floor" | "wall") {
  const key = String(materialId || "").toLowerCase();
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const baseColor = getRoomEnvironmentColor(materialId, target === "floor" ? "#b8b8b2" : "#e8e1d4");
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawNoise = (amount: number, alpha = 0.08) => {
    for (let i = 0; i < amount; i += 1) {
      const shade = Math.floor(180 + Math.random() * 55);
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  };

  // BagaStudio Room Textures V1:
  // texture procedurali leggere per dare realismo a pavimento/pareti senza asset esterni.
  // Fase successiva: collegamento alla Material Library con texture reali JPG/WebP/PBR.
  if (key.includes("legno") || key.includes("wood") || key.includes("7040")) {
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.fillStyle = y % 128 === 0 ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.055)";
      ctx.fillRect(0, y, canvas.width, 64);

      ctx.strokeStyle = "rgba(35,20,10,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();

      for (let x = 0; x < canvas.width; x += 128) {
        ctx.strokeStyle = "rgba(25,15,8,0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + ((y / 64) % 2) * 64, y);
        ctx.lineTo(x + ((y / 64) % 2) * 64, y + 64);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 38; i += 1) {
      ctx.strokeStyle = "rgba(55,32,14,0.13)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = Math.random() * canvas.height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(160, y + Math.random() * 18 - 9, 320, y + Math.random() * 18 - 9, canvas.width, y + Math.random() * 18 - 9);
      ctx.stroke();
    }
  } else if (key.includes("cemento") || key.includes("concrete") || key.includes("gres") || key.includes("stone") || key.includes("pietra") || key.includes("cement-light") || key.includes("stone-greige")) {
    drawNoise(11000, 0.048);

    // Texture Quality V1.1: micro-venature e variazioni leggere per evitare superfici piatte.
    for (let i = 0; i < 22; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = Math.random() * canvas.height;
      ctx.moveTo(Math.random() * 60, y);
      ctx.bezierCurveTo(180, y + Math.random() * 36 - 18, 330, y + Math.random() * 36 - 18, canvas.width, y + Math.random() * 36 - 18);
      ctx.stroke();
    }

    if (target === "floor") {
      const tile = 128;
      ctx.strokeStyle = "rgba(20,20,20,0.18)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= canvas.width; x += tile) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += tile) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  } else if (key.includes("nero") || key.includes("black") || key.includes("dark-matte") || key.includes("dark-salon")) {
    drawNoise(target === "floor" ? 6500 : 2800, target === "floor" ? 0.028 : 0.018);
    for (let i = 0; i < 18; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = Math.random() * canvas.height;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y + Math.random() * 14 - 7);
      ctx.stroke();
    }
  } else {
    drawNoise(target === "floor" ? 5000 : 2200, target === "floor" ? 0.035 : 0.022);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(target === "floor" ? 4 : 2, target === "floor" ? 4 : 2);
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

function getRoomEnvironmentMaterialProfile(materialId: string, fallbackColor = "#d8d3c7") {
  const key = String(materialId || "").toLowerCase();
  const color = getRoomEnvironmentColor(materialId, fallbackColor);

  // BagaStudio Room Materials V1:
  // prima fase leggera e sicura: materiali PBR procedurali senza caricare texture esterne.
  // Le texture reali potranno essere collegate dopo alla Material Library.
  if (key.includes("legno") || key.includes("7040") || key.includes("wood")) {
    return {
      color,
      roughness: 0.58,
      metalness: 0.02,
      emissive: "#000000",
    };
  }

  if (key.includes("cemento") || key.includes("concrete") || key.includes("gres") || key.includes("stone") || key.includes("pietra") || key.includes("cement-light") || key.includes("stone-greige")) {
    return {
      color,
      roughness: 0.88,
      metalness: 0.01,
      emissive: "#000000",
    };
  }

  if (key.includes("nero") || key.includes("black") || key.includes("dark-matte") || key.includes("dark-salon")) {
    return {
      color,
      roughness: 0.72,
      metalness: 0.04,
      emissive: "#000000",
    };
  }

  return {
    color,
    roughness: 0.82,
    metalness: 0.01,
    emissive: "#000000",
  };
}

export function RoomEnvironment({ environment }: { environment?: RoomEnvironmentSettings }) {
  if (!environment) return null;

  const roomWidth = Math.max(1, Number(environment.roomWidthCm || 400) / 100);
  const roomDepth = Math.max(1, Number(environment.roomDepthCm || 350) / 100);
  const roomHeight = Math.max(1, Number(environment.roomHeightCm || 270) / 100);
  const floorMaterial = getRoomEnvironmentMaterialProfile(environment.floorMaterial, "#b8b8b2");
  const wallMaterial = getRoomEnvironmentMaterialProfile(environment.wallMaterial, "#e8e1d4");
  const floorTexture = createBagastudioRoomProceduralTexture(environment.floorMaterial, "floor");
  const wallTexture = createBagastudioRoomProceduralTexture(environment.wallMaterial, "wall");
  const wallThickness = 0.12;

  return (
    <group name="bagastudio-room-environment-v1">
      <mesh
        name="bagastudio-room-floor"
        receiveShadow
        position={[0, -0.06, 0]}
      >
        <boxGeometry args={[roomWidth, wallThickness, roomDepth]} />
        <meshStandardMaterial map={floorTexture || undefined} color={floorMaterial.color} roughness={floorMaterial.roughness} metalness={floorMaterial.metalness} emissive={floorMaterial.emissive} />
      </mesh>

      {environment.showBackWall && (
        <mesh
          name="bagastudio-room-back-wall"
          receiveShadow
          position={[0, roomHeight / 2, -roomDepth / 2]}
        >
          <boxGeometry args={[roomWidth, roomHeight, wallThickness]} />
          <meshStandardMaterial map={wallTexture || undefined} color={wallMaterial.color} roughness={wallMaterial.roughness} metalness={wallMaterial.metalness} emissive={wallMaterial.emissive} />
        </mesh>
      )}

      {environment.showLeftWall && (
        <mesh
          name="bagastudio-room-left-wall"
          receiveShadow
          position={[-roomWidth / 2, roomHeight / 2, 0]}
        >
          <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
          <meshStandardMaterial map={wallTexture || undefined} color={wallMaterial.color} roughness={wallMaterial.roughness} metalness={wallMaterial.metalness} emissive={wallMaterial.emissive} />
        </mesh>
      )}

      {environment.showRightWall && (
        <mesh
          name="bagastudio-room-right-wall"
          receiveShadow
          position={[roomWidth / 2, roomHeight / 2, 0]}
        >
          <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
          <meshStandardMaterial map={wallTexture || undefined} color={wallMaterial.color} roughness={wallMaterial.roughness} metalness={wallMaterial.metalness} emissive={wallMaterial.emissive} />
        </mesh>
      )}
    </group>
  );
}