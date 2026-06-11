import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createVolumetricPresenceShaderMaterial } from "../shaders/volumetricPresenceShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

const stateHint = { idle: 0, thinking: .25, analyzing: .5, speaking: .75, suggestion: 1, warning: .6, success: .85 } as const;

export class PresencePass implements RenderPass {
  readonly id = "presence";
  private view = createPassScene();
  private material = createVolumetricPresenceShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(1.95, 1.75), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uPresence.value = frame.laboratory.presence;
    this.material.uniforms.uPresenceRadius.value = frame.laboratory.presenceRadius;
    this.material.uniforms.uPresenceOpacity.value = frame.laboratory.presenceOpacity * frame.intensity;
    this.material.uniforms.uPresenceSoftness.value = frame.laboratory.presenceSoftness;
    this.material.uniforms.uPresencePulse.value = frame.laboratory.presencePulse;
    this.material.uniforms.uStateHint.value = stateHint[frame.state];
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
