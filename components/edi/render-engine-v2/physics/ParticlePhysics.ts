import { Vector3 } from "three";

export class ParticlePhysics {
  update(position: Vector3, time: number, index: number) { position.set(Math.cos(time * .25 + index) * .65, Math.sin(time * .31 + index) * .42, 0); }
}
