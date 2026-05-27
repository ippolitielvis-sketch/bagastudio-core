import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function createUsbAccessory(mesh: THREE.Mesh): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  const usb = new THREE.Mesh(
    new THREE.BoxGeometry(10, 3, 6),
    new THREE.MeshStandardMaterial({
      color: "#1f1f1f",
      metalness: 0.8,
      roughness: 0.3,
    })
  );

usb.position.set(
  box.getCenter(new THREE.Vector3()).x,
  box.max.y + 0.8,
  box.max.z - 8
);

  usb.name = `ACCESSORY_USB_${mesh.name}`;

  return usb;
}
export function createSocketAccessory(mesh: THREE.Mesh): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  const texture = new THREE.TextureLoader().load(
    "/textures/accessories/presa-503.webp"
  );

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    metalness: 0.05,
    roughness: 0.7,
  });

  const plane = new THREE.Mesh(
   new THREE.PlaneGeometry(180, 120),
    material
  );

  plane.rotation.x = -Math.PI / 2;

  plane.position.set(
    center.x,
    box.max.y + 0.15,
    center.z
  );

  plane.name = `ACCESSORY_SOCKET_${mesh.name}`;

  return plane;
}
export function createHairdryerHolderAccessory(
  mesh: THREE.Mesh
): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const holder = new THREE.Group();

  holder.position.set(
  center.x + size.x * 0.4,
  box.max.y - 38,
  box.max.z - -15

);

  const loader = new GLTFLoader();

  loader.load("/models/accessories/portaphon.glb", (gltf: any) => {
    const model = gltf.scene;

    model.scale.set(0.45, 0.45, 0.45);
model.rotation.set(
  -Math.PI / 2,
  Math.PI / 200,
  Math.PI / 2
);

    model.updateMatrixWorld(true);

    const modelBox = new THREE.Box3().setFromObject(model);
    const modelCenter = modelBox.getCenter(new THREE.Vector3());

    model.position.x -= modelCenter.x;
    model.position.y -= modelCenter.y;
    model.position.z -= modelCenter.z;

    holder.add(model);
  });

  holder.name = `ACCESSORY_HAIRDRYER_${mesh.name}`;

  return holder;
}
export function createToolHolderAccessory(
  mesh: THREE.Mesh
): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  const holder = new THREE.Group();

  const steel = new THREE.MeshStandardMaterial({
    color: "#bfc4c9",
    metalness: 1,
    roughness: 0.22,
  });

  // staffa base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(70, 4, 18),
    steel
  );

  // cilindri porta ferri
  const tubeGeo = new THREE.CylinderGeometry(10, 10, 45, 32);

  const tube1 = new THREE.Mesh(tubeGeo, steel);
  tube1.rotation.x = Math.PI / 2;
  tube1.position.set(-20, 14, 0);

  const tube2 = new THREE.Mesh(tubeGeo, steel);
  tube2.rotation.x = Math.PI / 2;
  tube2.position.set(20, 14, 0);

  holder.add(base);
  holder.add(tube1);
  holder.add(tube2);

  holder.rotation.z = Math.PI / 2;

  holder.position.set(
    center.x - 45,
    box.max.y + 2,
    box.max.z - 8
  );

  holder.name = `ACCESSORY_TOOL_HOLDER_${mesh.name}`;

  return holder;
}
export function createWirelessChargerAccessory(
  mesh: THREE.Mesh
): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  const charger = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(42, 42, 2.2, 64),
    new THREE.MeshStandardMaterial({
      color: "#111111",
      metalness: 0.35,
      roughness: 0.28,
    })
  );

 base.rotation.x = 0;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(26, 1.2, 16, 64),
    new THREE.MeshStandardMaterial({
      color: "#3a3a3a",
      metalness: 0.5,
      roughness: 0.22,
    })
  );

 ring.rotation.x = 0;
 ring.position.y = 0.6;

  charger.add(base);
  charger.add(ring);

charger.position.set(
  center.x,
 box.max.y + 1.2,
  center.z - 35
);

  charger.name = `ACCESSORY_WIRELESS_${mesh.name}`;

  return charger;
}
export function createMirrorLedAccessory(
  mesh: THREE.Mesh
): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const ledGroup = new THREE.Group();

  const material = new THREE.MeshStandardMaterial({
    color: "#fff3c8",
    emissive: "#fff3c8",
    emissiveIntensity: 2.8,
    toneMapped: false,
  });

  const barThickness = Math.max(size.x, size.y) * 0.025;

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(size.x * 0.95, barThickness, 1.2),
    material
  );
  top.position.y = size.y * 0.48;

  const bottom = top.clone();
  bottom.position.y = -size.y * 0.48;

  const left = new THREE.Mesh(
    new THREE.BoxGeometry(barThickness, size.y * 0.95, 1.2),
    material
  );
  left.position.x = -size.x * 0.48;

  const right = left.clone();
  right.position.x = size.x * 0.48;

  ledGroup.add(top);
  ledGroup.add(bottom);
  ledGroup.add(left);
  ledGroup.add(right);

  ledGroup.position.set(center.x, center.y, box.min.z - 1.5);
  ledGroup.name = `ACCESSORY_MIRROR_LED_${mesh.name}`;

  return ledGroup;
}
