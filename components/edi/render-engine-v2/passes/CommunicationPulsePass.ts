import { Mesh, PlaneGeometry } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import { createCommunicationPulseShaderMaterial } from "../shaders/communicationPulseShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export type EdiCommunicationPulseEventV1 = { id: string; strength: number; timestamp: number };

const stateHint = { idle: 0, thinking: .2, analyzing: .35, speaking: 1, suggestion: .65, warning: .5, success: .8 } as const;

export class CommunicationPulsePass implements RenderPass {
  readonly id = "communication";
  private view = createPassScene();
  private material = createCommunicationPulseShaderMaterial();
  private mesh = new Mesh(new PlaneGeometry(2, 1.8), this.material);
  private event: EdiCommunicationPulseEventV1 | null = null;

  constructor() { this.view.scene.add(this.mesh); }
  setEvent(event: EdiCommunicationPulseEventV1 | null) { this.event = event; }
  render(frame: EdiV2Frame) {
    const eventStrength = this.event?.strength ?? 1;
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uCommunicationStrength.value = frame.laboratory.communicationStrength * eventStrength;
    this.material.uniforms.uCommunicationRadius.value = frame.laboratory.communicationRadius;
    this.material.uniforms.uCommunicationSpeed.value = frame.laboratory.communicationSpeed;
    this.material.uniforms.uCommunicationWidth.value = frame.laboratory.communicationWidth;
    this.material.uniforms.uCommunicationGlow.value = frame.laboratory.communicationGlow;
    this.material.uniforms.uCommunicationDecay.value = frame.laboratory.communicationDecay;
    this.material.uniforms.uStateHint.value = stateHint[frame.state];
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
