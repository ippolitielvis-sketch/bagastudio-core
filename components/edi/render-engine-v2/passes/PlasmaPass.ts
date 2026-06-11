import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createPlasmaShaderMaterial } from "../shaders/plasmaShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export class PlasmaPass implements RenderPass {
  readonly id = "plasma";
  private view = createPassScene();
  private material = createPlasmaShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(1.9, 1.55), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    const activity = frame.state === "analyzing" ? 1.35 : frame.state === "thinking" ? 1.15 : .9;
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uIntensity.value = activity * frame.intensity;
    this.material.uniforms.uPlasmaIntensity.value = frame.laboratory.plasmaIntensity;
    this.material.uniforms.uPulseIntensity.value = frame.laboratory.pulseIntensity;
    this.material.uniforms.uFlowSpeed.value = frame.laboratory.plasmaFlowSpeed;
    this.material.uniforms.uNoiseScale.value = frame.laboratory.plasmaNoiseScale;
    this.material.uniforms.uEnergyMix.value = frame.laboratory.plasmaEnergyMix;
    this.material.uniforms.uSoftness.value = frame.laboratory.plasmaSoftness;
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
