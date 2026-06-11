import { BufferGeometry, Float32BufferAttribute, Points, Vector3 } from "three";
import { ParticlePhysics, type EdiParticleEngineInputV1 } from "../physics/ParticlePhysics";
import type { RenderPass } from "../pipeline/RenderPass";
import { createParticleKnowledgeShaderMaterial } from "../shaders/particleKnowledgeShader";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

const stateHint = { idle: 0, thinking: .25, analyzing: .5, speaking: .75, suggestion: 1, warning: .6, success: .85 } as const;

export class ParticlePass implements RenderPass {
  readonly id = "particles";
  private view = createPassScene(); private geometry = new BufferGeometry(); private material = createParticleKnowledgeShaderMaterial(); private points = new Points(this.geometry, this.material); private physics = new ParticlePhysics(); private position = new Vector3();
  constructor() { this.view.scene.add(this.points); }
  setInput(input: Partial<EdiParticleEngineInputV1>) { this.physics.setInput(input); }
  render(frame: EdiV2Frame) { const positions: number[] = []; const phases: number[] = []; const baseCount = frame.compact ? 18 : 32; const count = Math.max(1, Math.round(baseCount * frame.laboratory.particleDensity)); for (let index = 0; index < count; index += 1) { this.physics.update(this.position, frame.time * frame.laboratory.particleSpeed, index); positions.push(this.position.x, this.position.y, this.position.z); phases.push(index / count); } this.geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); this.geometry.setAttribute("aKnowledgePhase", new Float32BufferAttribute(phases, 1)); this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time; this.material.uniforms.uIntensity.value = frame.intensity; this.material.uniforms.uParticleDensity.value = frame.laboratory.particleDensity; this.material.uniforms.uParticleSpeed.value = frame.laboratory.particleSpeed; this.material.uniforms.uParticleSize.value = frame.laboratory.particleSize; this.material.uniforms.uParticleOpacity.value = frame.laboratory.particleOpacity; this.material.uniforms.uParticleLife.value = frame.laboratory.particleLife; this.material.uniforms.uKnowledgeFlow.value = frame.laboratory.knowledgeFlow; this.material.uniforms.uNoiseScale.value = frame.laboratory.plasmaNoiseScale; this.material.uniforms.uStateHint.value = stateHint[frame.state]; frame.renderer.render(this.view.scene, this.view.camera); }
  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
