import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createMagneticFieldShaderMaterial } from "../shaders/magneticFieldShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export class FieldPass implements RenderPass {
  readonly id = "magnetic";
  private view = createPassScene();
  private material = createMagneticFieldShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(2, 1.65), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uIntensity.value = frame.intensity;
    this.material.uniforms.uFieldStrength.value = frame.laboratory.fieldStrength;
    this.material.uniforms.uFieldSpeed.value = frame.laboratory.fieldSpeed;
    this.material.uniforms.uFieldDistortion.value = frame.laboratory.fieldDistortion;
    this.material.uniforms.uFieldThickness.value = frame.laboratory.fieldThickness;
    this.material.uniforms.uFieldOpacity.value = frame.laboratory.fieldOpacity;
    this.material.uniforms.uFieldNoise.value = frame.laboratory.magneticIntensity;
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
