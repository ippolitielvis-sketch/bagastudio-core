import * as THREE from "three";

export type LedConfig = {
  frontOffset?: number;
  sideMargin?: number;
  yOffset?: number;
  position?: string | string[];
  thickness?: number;
  intensity?: number;
};

export function createLedBar(
  mesh: THREE.Mesh,
  color: string,
  ledConfig: LedConfig = {}
) {
  mesh.updateWorldMatrix(true, false);

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const sideMargin = ledConfig.sideMargin ?? 8;
  const frontOffset = ledConfig.frontOffset ?? 2;
  const yOffset = ledConfig.yOffset ?? -2;
  const thickness = ledConfig.thickness ?? 0.8;
  const intensity = ledConfig.intensity ?? 1;
  const lightPower = 4.2 * intensity;

  const rawPosition = Array.isArray(ledConfig.position)
    ? ledConfig.position[0]
    : ledConfig.position;

  const isHorizontalLedPart =
    mesh.name?.toLowerCase().includes("piano") ||
    mesh.name?.toLowerCase().includes("orizzontale") ||
    mesh.name?.toLowerCase().includes("fondo");

  const position =
    isHorizontalLedPart && rawPosition === "top"
      ? "front"
      : rawPosition ?? "front";

  const led = new THREE.Group();

  let ledLength = 1;
  let ledSizeX = 1;
  let ledSizeY = 1;
  let ledSizeZ = 1;

  if (position === "front" || position === "under") {
    ledLength = Math.max(size.x - sideMargin * 2, 5);
    ledSizeX = ledLength;
    ledSizeY = thickness;
    ledSizeZ = thickness;

    led.position.set(
      center.x,
      box.min.y - thickness / 2 + yOffset,
      box.max.z - frontOffset
    );
  } else if (position === "top") {
    ledLength = Math.max(size.x - sideMargin * 2, 5);
    ledSizeX = ledLength;
    ledSizeY = thickness;
    ledSizeZ = thickness;

    led.position.set(
      center.x,
      box.max.y + thickness / 2 + yOffset,
      box.max.z - frontOffset
    );
  } else if (position === "back") {
    ledLength = Math.max(size.x - sideMargin * 2, 5);
    ledSizeX = ledLength;
    ledSizeY = thickness;
    ledSizeZ = thickness;

    led.position.set(
      center.x,
      box.min.y - thickness / 2 + yOffset,
      box.min.z + frontOffset
    );
  } else if (position === "side") {
    ledLength = Math.max(size.y * 0.8, 5);
    ledSizeX = thickness;
    ledSizeY = ledLength;
    ledSizeZ = thickness;

    led.position.set(
      box.max.x - frontOffset,
      center.y + yOffset,
      center.z
    );
  }

  const profileMaterial = new THREE.MeshStandardMaterial({
    color: "#2b2b2b",
    roughness: 0.35,
    metalness: 0.6,
  });

  const diffuserMaterial = new THREE.MeshPhysicalMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: lightPower * 1.35,
    roughness: 0.12,
    transparent: true,
    opacity: Math.min(0.95, 0.45 + intensity * 0.18),
    toneMapped: false,
  });

  const profile = new THREE.Mesh(
    new THREE.BoxGeometry(ledSizeX, ledSizeY * 1.6, ledSizeZ * 1.6),
    profileMaterial
  );

  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(ledSizeX, ledSizeY, ledSizeZ),
    diffuserMaterial
  );

  const realLight = new THREE.RectAreaLight(
    color,
    lightPower * 1.4,
    Math.max(ledSizeX * 0.9, 4),
    0.18
  );

  realLight.position.set(0, -ledSizeY * 1.8, 0);
  realLight.rotation.x = -Math.PI / 2;

  led.add(profile);
  led.add(diffuser);
  led.add(realLight);

  const lightCount = Math.max(4, Math.floor(ledSizeX / 12));

  for (let i = 0; i < lightCount; i++) {
    const t = lightCount === 1 ? 0 : i / (lightCount - 1);
    const x = -ledSizeX / 2 + t * ledSizeX;

    const point = new THREE.PointLight(color, 0.85 * intensity, 22, 2.6);
    point.position.set(x, -ledSizeY * 4.5, 0);
    led.add(point);
  }

  led.name = `LED_${mesh.name}`;
  led.renderOrder = 9999;

  return led;
}