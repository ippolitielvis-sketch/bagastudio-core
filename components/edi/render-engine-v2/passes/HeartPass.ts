import { Mesh, MeshBasicMaterial, Scene, SphereGeometry, OrthographicCamera } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { EDI_WHITE } from "../utils/color";
import { pulse } from "../utils/math";

export class HeartPass implements RenderPass {
  private scene = new Scene(); private camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10); private mesh = new Mesh(new SphereGeometry(.22, 32, 20), new MeshBasicMaterial({ color: EDI_WHITE, transparent: true, opacity: .85 }));
  constructor() { this.camera.position.z = 2; this.mesh.scale.set(1.15, .82, 1); this.scene.add(this.mesh); }
  render(frame: EdiV2Frame) { const scale = .9 + pulse(frame.time, frame.state === "speaking" ? 4 : 2) * .18; this.mesh.scale.set(1.15 * scale, .82 * scale, scale); frame.renderer.render(this.scene, this.camera); }
  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as MeshBasicMaterial).dispose(); }
}
