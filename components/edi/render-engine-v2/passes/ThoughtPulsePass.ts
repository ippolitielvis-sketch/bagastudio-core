import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createThoughtPulseShaderMaterial } from "../shaders/thoughtPulseShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export type EdiThoughtPulseEventV1 = { id: string; strength: number; timestamp: number };

const stateHint = { idle: 0, thinking: .25, analyzing: .5, speaking: .75, suggestion: 1, warning: .6, success: .85 } as const;

export class ThoughtPulsePass implements RenderPass {
  readonly id = "thoughtPulse";
  private view = createPassScene();
  private material = createThoughtPulseShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(1.75, 1.55), this.material);
  private event: EdiThoughtPulseEventV1 | null = null;

  constructor() { this.view.scene.add(this.mesh); }
  setEvent(event: EdiThoughtPulseEventV1 | null) { this.event = event; }
  render(frame: EdiV2Frame) {
    const eventStrength = this.event?.strength ?? 1;
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uPulseStrength.value = frame.laboratory.thoughtPulseStrength * eventStrength;
    this.material.uniforms.uPulseRadius.value = frame.laboratory.thoughtPulseRadius;
    this.material.uniforms.uPulseSpeed.value = frame.laboratory.thoughtPulseSpeed;
    this.material.uniforms.uPulseWidth.value = frame.laboratory.thoughtPulseWidth;
    this.material.uniforms.uPulseGlow.value = frame.laboratory.thoughtPulseGlow;
    this.material.uniforms.uPulseDecay.value = frame.laboratory.thoughtPulseDecay;
    this.material.uniforms.uStateHint.value = stateHint[frame.state];
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
