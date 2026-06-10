import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createHeartShaderMaterial } from "../shaders/heartShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export class HeartPass implements RenderPass {
  readonly id = "heart";
  private view = createPassScene();
  private material = createHeartShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(1.35, 1.15), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .15 : frame.time;
    this.material.uniforms.uIntensity.value = frame.intensity * frame.laboratory.heartIntensity * (frame.state === "success" ? 1.2 : 1);
    this.material.uniforms.uPulseSpeed.value = frame.laboratory.heartPulseSpeed * (frame.state === "speaking" ? 1.28 : 1);
    this.material.uniforms.uRadius.value = frame.laboratory.heartRadius;
    this.material.uniforms.uNoise.value = frame.laboratory.heartNoise;
    this.material.uniforms.uGlow.value = frame.laboratory.heartGlow;
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
