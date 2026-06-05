"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export type RoomEnvironmentSettings = {
  roomWidthCm?: number;
  roomDepthCm?: number;
  roomHeightCm?: number;
  floorMaterial?: string;
  wallMaterial?: string;
  showBackWall?: boolean;
  showLeftWall?: boolean;
  showRightWall?: boolean;
  showCeiling?: boolean;
};

let bagastudioRendererMaxAnisotropy = 8;

function createPremiumRoomCanvasTexture(kind: "floor" | "wall") {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  if (kind === "floor") {
    const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    baseGradient.addColorStop(0, "#8b5a32");
    baseGradient.addColorStop(0.42, "#70401f");
    baseGradient.addColorStop(1, "#9b6a3d");
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plankHeight = 168;
    const plankColors = ["#86532d", "#74431f", "#98633a", "#6d3b1c", "#8f5b34", "#7d4a26"];

    for (let y = 0; y < canvas.height + plankHeight; y += plankHeight) {
      const colorIndex = Math.floor(y / plankHeight) % plankColors.length;
      const shade = plankColors[colorIndex];
      const plankGradient = ctx.createLinearGradient(0, y, canvas.width, y + plankHeight);
      plankGradient.addColorStop(0, shade);
      plankGradient.addColorStop(0.48, colorIndex % 2 ? "#7a4724" : "#955f36");
      plankGradient.addColorStop(1, shade);

      ctx.fillStyle = plankGradient;
      ctx.fillRect(0, y, canvas.width, plankHeight - 5);

      ctx.strokeStyle = "rgba(255,244,220,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + 2);
      ctx.lineTo(canvas.width, y + 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(38,19,8,0.34)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y + plankHeight - 5);
      ctx.lineTo(canvas.width, y + plankHeight - 5);
      ctx.stroke();

      const seamOffset = (Math.floor(y / plankHeight) % 3) * 330;
      for (let x = seamOffset; x < canvas.width; x += 620) {
        ctx.strokeStyle = "rgba(28,14,8,0.22)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x, y + plankHeight - 24);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,236,205,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 20);
        ctx.lineTo(x + 3, y + plankHeight - 28);
        ctx.stroke();
      }

      for (let grain = 0; grain < 18; grain += 1) {
        const gy = y + 20 + grain * 7.2 + Math.sin(grain + y * 0.018) * 4;
        const alpha = grain % 3 === 0 ? 0.11 : 0.06;
        ctx.strokeStyle = grain % 2 ? `rgba(255,228,190,${alpha})` : `rgba(42,21,10,${alpha})`;
        ctx.lineWidth = grain % 4 === 0 ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.moveTo(-40, gy);
        for (let x = 0; x <= canvas.width + 80; x += 90) {
          ctx.lineTo(x, gy + Math.sin((x + y + grain * 43) / 105) * 5);
        }
        ctx.stroke();
      }

      for (let knot = 0; knot < 3; knot += 1) {
        const kx = ((knot * 397 + y * 1.7) % canvas.width);
        const ky = y + 42 + ((knot * 51) % Math.max(1, plankHeight - 88));
        const knotGradient = ctx.createRadialGradient(kx, ky, 2, kx, ky, 42);
        knotGradient.addColorStop(0, "rgba(43,22,12,0.24)");
        knotGradient.addColorStop(0.42, "rgba(80,42,20,0.13)");
        knotGradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = knotGradient;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 48, 16, Math.sin(y + knot) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 220, canvas.width / 2, canvas.height / 2, canvas.width * 0.78);
    vignette.addColorStop(0, "rgba(255,255,255,0.05)");
    vignette.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#ddc9ad");
    gradient.addColorStop(0.42, "#d1bda2");
    gradient.addColorStop(0.74, "#c8b399");
    gradient.addColorStop(1, "#bea78b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 480; i += 1) {
      const alpha = 0.018 + ((i * 17) % 10) / 1200;
      const size = 1 + (i % 4);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect((i * 113) % canvas.width, (i * 67) % canvas.height, size, size);
    }

    for (let i = 0; i < 180; i += 1) {
      const alpha = 0.014 + ((i * 11) % 6) / 1000;
      ctx.fillStyle = `rgba(68,49,33,${alpha})`;
      ctx.fillRect((i * 191) % canvas.width, (i * 83) % canvas.height, 2 + (i % 6), 2 + (i % 7));
    }

    ctx.strokeStyle = "rgba(255,255,255,0.024)";
    ctx.lineWidth = 1;
    for (let x = -canvas.height; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + canvas.height, 0);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = bagastudioRendererMaxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

const BAGASTUDIO_ROOM_TEXTURE_PATHS = {
  floorShowroom: "/textures/Gentle_2.webp",
  floorCement: "/textures/Ibiza.webp",
  floorDark: "/textures/Legno_China.webp",
  floorGreige: "/textures/Florida_Truciolato.webp",
  wallShowroom: "/textures/Angel_White.webp",
  wallWarm: "/textures/Angel_White.webp",
  wallTortora: "/textures/Comfortable_Coffee.webp",
  wallCement: "/textures/Gentle_2.webp",
};

function getRoomFloorTexturePath(materialId?: string) {
  const key = String(materialId || "").toLowerCase();
  if (key === "cement-light") return BAGASTUDIO_ROOM_TEXTURE_PATHS.floorCement;
  if (key === "stone-greige") return BAGASTUDIO_ROOM_TEXTURE_PATHS.floorGreige;
  if (key === "dark-matte") return BAGASTUDIO_ROOM_TEXTURE_PATHS.floorDark;
  return BAGASTUDIO_ROOM_TEXTURE_PATHS.floorShowroom;
}

function getRoomWallTexturePath(materialId?: string) {
  const key = String(materialId || "").toLowerCase();
  if (key === "tortora") return BAGASTUDIO_ROOM_TEXTURE_PATHS.wallTortora;
  if (key === "cement") return BAGASTUDIO_ROOM_TEXTURE_PATHS.wallCement;
  if (key === "dark-salon") return BAGASTUDIO_ROOM_TEXTURE_PATHS.wallTortora;
  return BAGASTUDIO_ROOM_TEXTURE_PATHS.wallWarm;
}

function configurePremiumRoomTexture(texture: THREE.Texture, kind: "floor" | "wall") {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = bagastudioRendererMaxAnisotropy;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  if (kind === "floor") {
    // V34: Gentle_2 viene usata come texture showroom a doghe larghe, non come tile piccolo ripetuto.
    texture.repeat.set(2.2, 3.35);
    return texture;
  }

  texture.repeat.set(1.55, 1.1);
  return texture;
}

export default function PremiumRoomEnvironment({ environment }: { environment?: RoomEnvironmentSettings }) {
  const fallbackFloorTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const texture = createPremiumRoomCanvasTexture("floor");
    if (texture) configurePremiumRoomTexture(texture, "floor");
    return texture;
  }, []);

  const fallbackWallTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const texture = createPremiumRoomCanvasTexture("wall");
    if (texture) configurePremiumRoomTexture(texture, "wall");
    return texture;
  }, []);

  const floorTexturePath = getRoomFloorTexturePath(environment?.floorMaterial);
  const wallTexturePath = getRoomWallTexturePath(environment?.wallMaterial);
  const [roomFloorTexture, setRoomFloorTexture] = useState<THREE.Texture | null>(null);
  const [roomWallTexture, setRoomWallTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const loader = new THREE.TextureLoader();

    loader.load(
      floorTexturePath,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }

        setRoomFloorTexture(configurePremiumRoomTexture(texture, "floor"));
      },
      undefined,
      () => {
        if (!cancelled) setRoomFloorTexture(null);
      }
    );

    loader.load(
      wallTexturePath,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }

        setRoomWallTexture(configurePremiumRoomTexture(texture, "wall"));
      },
      undefined,
      () => {
        if (!cancelled) setRoomWallTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [floorTexturePath, wallTexturePath]);

  useEffect(() => {
    return () => {
      fallbackFloorTexture?.dispose();
      fallbackWallTexture?.dispose();
    };
  }, [fallbackFloorTexture, fallbackWallTexture]);

  useEffect(() => {
    return () => {
      roomFloorTexture?.dispose();
    };
  }, [roomFloorTexture]);

  useEffect(() => {
    return () => {
      roomWallTexture?.dispose();
    };
  }, [roomWallTexture]);

  const floorTexture = roomFloorTexture || fallbackFloorTexture;
  const wallTexture = roomWallTexture || fallbackWallTexture;

  if (!environment) return null;

  const roomWidth = Math.max(2.8, Number(environment.roomWidthCm || 420) / 100);
  const roomDepth = Math.max(2.8, Number(environment.roomDepthCm || 360) / 100);
  const roomHeight = Math.max(2.45, Number(environment.roomHeightCm || 280) / 100);
  const floorY = 0.006;
  const backZ = -roomDepth / 2;
  const frontZ = roomDepth / 2;
  const sideDepth = roomDepth;
  const wallThickness = 0.12;
  const ceilingThickness = 0.08;
  const baseboardHeight = 0.115;
  const baseboardThickness = 0.055;
  const baseboardColor = "#f3eee7";
  const wallColor = environment.wallMaterial === "dark-salon" ? "#34302b" : environment.wallMaterial === "cement" ? "#c7c2b7" : environment.wallMaterial === "tortora" ? "#d0baa0" : "#eee6da";
  const ceilingColor = environment.wallMaterial === "dark-salon" ? "#2b2926" : "#f3eadf";
  return (
    <group name="bagastudio-premium-room-v34-gentle-2-lighting">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]}>
        <planeGeometry args={[roomWidth + 0.018, roomDepth + 0.018]} />
        <meshPhysicalMaterial
          map={floorTexture || undefined}
          color="#f0e7d9"
          roughness={0.78}
          metalness={0.01}
          clearcoat={0.04}
          clearcoatRoughness={0.82}
          reflectivity={0.08}
        />
      </mesh>

      {/* V33.1 seam covers: floor is slightly raised and tucked under walls/baseboards to remove visible gaps. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.003, backZ + 0.018]}>
        <planeGeometry args={[roomWidth, 0.055]} />
        <meshBasicMaterial color="#2f241d" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-roomWidth / 2 + 0.018, floorY + 0.003, 0]}>
        <planeGeometry args={[roomDepth, 0.052]} />
        <meshBasicMaterial color="#2f241d" transparent opacity={0.105} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[roomWidth / 2 - 0.018, floorY + 0.003, 0]}>
        <planeGeometry args={[roomDepth, 0.052]} />
        <meshBasicMaterial color="#2f241d" transparent opacity={0.105} depthWrite={false} />
      </mesh>

      {environment.showBackWall !== false && (
        <mesh receiveShadow castShadow position={[0, roomHeight / 2, backZ - wallThickness / 2]}>
          <boxGeometry args={[roomWidth + wallThickness * 2, roomHeight, wallThickness]} />
          <meshStandardMaterial
            map={wallTexture || undefined}
            color={wallColor}
            roughness={0.78}
            metalness={0}
          />
        </mesh>
      )}

      {environment.showLeftWall !== false && (
        <mesh receiveShadow castShadow position={[-roomWidth / 2 - wallThickness / 2, roomHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, roomHeight, sideDepth + wallThickness]} />
          <meshStandardMaterial
            map={wallTexture || undefined}
            color={wallColor}
            roughness={0.80}
            metalness={0}
          />
        </mesh>
      )}

      {environment.showRightWall !== false && (
        <mesh receiveShadow castShadow position={[roomWidth / 2 + wallThickness / 2, roomHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, roomHeight, sideDepth + wallThickness]} />
          <meshStandardMaterial
            map={wallTexture || undefined}
            color={wallColor}
            roughness={0.80}
            metalness={0}
          />
        </mesh>
      )}

      {environment.showCeiling !== false && (
        <>
          <mesh receiveShadow position={[0, roomHeight + ceilingThickness / 2, backZ + roomDepth * 0.34]}>
            <boxGeometry args={[roomWidth + wallThickness * 2, ceilingThickness, roomDepth * 0.68]} />
            <meshStandardMaterial color={ceilingColor} roughness={0.72} metalness={0} />
          </mesh>

          <mesh position={[0, roomHeight - 0.035, backZ + roomDepth * 0.68]}>
            <boxGeometry args={[roomWidth + wallThickness * 2, 0.055, 0.08]} />
            <meshStandardMaterial color={ceilingColor} roughness={0.68} metalness={0} />
          </mesh>
        </>
      )}

      {environment.showBackWall !== false && (
        <>
          <mesh receiveShadow castShadow position={[0, baseboardHeight / 2, backZ + baseboardThickness / 2]}>
            <boxGeometry args={[roomWidth + 0.026, baseboardHeight, baseboardThickness]} />
            <meshStandardMaterial color={baseboardColor} roughness={0.42} metalness={0.02} />
          </mesh>
          <mesh position={[0, baseboardHeight + 0.012, backZ + baseboardThickness + 0.003]}>
            <boxGeometry args={[roomWidth + 0.026, 0.022, 0.025]} />
            <meshStandardMaterial color="#ffffff" roughness={0.36} metalness={0.03} />
          </mesh>
        </>
      )}

      {environment.showLeftWall !== false && (
        <>
          <mesh receiveShadow castShadow position={[-roomWidth / 2 + baseboardThickness / 2, baseboardHeight / 2, 0]}>
            <boxGeometry args={[baseboardThickness, baseboardHeight, roomDepth]} />
            <meshStandardMaterial color={baseboardColor} roughness={0.42} metalness={0.02} />
          </mesh>
          <mesh position={[-roomWidth / 2 + baseboardThickness + 0.004, baseboardHeight + 0.012, 0]}>
            <boxGeometry args={[0.026, 0.022, roomDepth]} />
            <meshStandardMaterial color="#ffffff" roughness={0.36} metalness={0.03} />
          </mesh>
        </>
      )}

      {environment.showRightWall !== false && (
        <>
          <mesh receiveShadow castShadow position={[roomWidth / 2 - baseboardThickness / 2, baseboardHeight / 2, 0]}>
            <boxGeometry args={[baseboardThickness, baseboardHeight, roomDepth]} />
            <meshStandardMaterial color={baseboardColor} roughness={0.42} metalness={0.02} />
          </mesh>
          <mesh position={[roomWidth / 2 - baseboardThickness - 0.004, baseboardHeight + 0.012, 0]}>
            <boxGeometry args={[0.026, 0.022, roomDepth]} />
            <meshStandardMaterial color="#ffffff" roughness={0.36} metalness={0.03} />
          </mesh>
        </>
      )}

      {/* V41.5: rimosse le finte ombre rettangolari/ellittiche.
          Le ombre ambiente devono arrivare da luci reali e materiali, non da plane scuri visibili. */}

      {environment.showCeiling !== false && [0.2, 0.4, 0.6, 0.8].map((ratio, index) => {
        const x = -roomWidth / 2 + roomWidth * ratio;
        const z = backZ + roomDepth * 0.22;
        return (
          <group key={`spot-v33-${index}`} position={[x, roomHeight - 0.055, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.026, 40]} />
              <meshStandardMaterial color="#f9f7f2" roughness={0.24} metalness={0.18} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.016, 0]}>
              <circleGeometry args={[0.056, 40]} />
              <meshStandardMaterial color="#fff8ec" emissive="#fff0ca" emissiveIntensity={2.15} roughness={0.2} />
            </mesh>
            <spotLight
              color="#fff0ca"
              intensity={1.22}
              distance={5.4}
              angle={0.62}
              penumbra={0.9}
              decay={2}
              position={[0, -0.04, 0]}
              castShadow
            />
            <pointLight color="#fff2d0" intensity={0.24} distance={1.25} decay={2} position={[0, -0.12, 0]} />
          </group>
        );
      })}

      {environment.showCeiling !== false && (
      <spotLight
        castShadow
        position={[0, roomHeight - 0.16, backZ + roomDepth * 0.52]}
        intensity={1.18}
        angle={0.82}
        penumbra={0.72}
        distance={6.5}
        decay={2}
        color="#fff4dc"
      />
      )}

      <hemisphereLight
        color="#fff8ec"
        groundColor="#b58f68"
        intensity={0.38}
      />

      <pointLight
        position={[0, roomHeight * 0.58, frontZ * 0.78]}
        intensity={0.44}
        distance={6.4}
        decay={2}
        color="#fff3df"
      />
    </group>
  );
}
