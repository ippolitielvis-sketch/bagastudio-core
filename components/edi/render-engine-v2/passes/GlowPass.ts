import { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { EDI_BLUE } from "../utils/color";
import { pulse } from "../utils/math";
import { createPassScene } from "./passUtils";

export class GlowPass implements RenderPass {
  readonly id = "glow";
  private view = createPassScene(); private material = new MeshBasicMaterial({ color: EDI_BLUE, transparent: true, opacity: .035, depthWrite: false }); private mesh = new Mesh(new PlaneGeometry(1.2, .85), this.material);
  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) { const scale = .92 + pulse(frame.time, .7) * .16 * frame.laboratory.pulseIntensity; this.material.opacity = .035 * frame.laboratory.pulseIntensity; this.mesh.scale.set(scale, scale, 1); frame.renderer.render(this.view.scene, this.view.camera); }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
