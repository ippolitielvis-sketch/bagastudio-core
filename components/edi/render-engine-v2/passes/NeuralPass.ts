import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createNeuralFilamentShaderMaterial } from "../shaders/neuralFilamentShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

const stateHint = { idle: 0, thinking: .25, analyzing: .5, speaking: .75, suggestion: 1, warning: .6, success: .85 } as const;

export class NeuralPass implements RenderPass {
  readonly id = "neural";
  private view = createPassScene();
  private material = createNeuralFilamentShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(1.55, 1.4), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uIntensity.value = frame.intensity;
    this.material.uniforms.uFilamentDensity.value = frame.laboratory.filamentDensity;
    this.material.uniforms.uFilamentSpeed.value = frame.laboratory.filamentSpeed;
    this.material.uniforms.uFilamentThickness.value = frame.laboratory.filamentThickness;
    this.material.uniforms.uFilamentGlow.value = frame.laboratory.filamentGlow;
    this.material.uniforms.uPulseStrength.value = frame.laboratory.filamentPulseStrength;
    this.material.uniforms.uNoiseScale.value = frame.laboratory.plasmaNoiseScale;
    this.material.uniforms.uStateHint.value = stateHint[frame.state];
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
