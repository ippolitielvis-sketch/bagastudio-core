import { OrthographicCamera, Scene } from "three";

export const createPassScene = () => {
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10);
  camera.position.z = 2;
  return { scene, camera };
};
