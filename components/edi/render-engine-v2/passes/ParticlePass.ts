import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { EDI_GOLD } from "../utils/color";
import { createPassScene } from "./passUtils";

export class ParticlePass implements RenderPass {
  private view = createPassScene(); private geometry = new BufferGeometry(); private material = new PointsMaterial({ color: EDI_GOLD, size: .025, transparent: true, opacity: .65 }); private points = new Points(this.geometry, this.material);
  constructor() { this.view.scene.add(this.points); }
  render(frame: EdiV2Frame) { const positions: number[] = []; for (let index = 0; index < (frame.compact ? 18 : 32); index += 1) { const angle = index * 2.4 + frame.time * .15; const radius = .25 + (index % 8) * .065; positions.push(Math.cos(angle) * radius, Math.sin(angle * 1.17) * radius * .72, 0); } this.geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); frame.renderer.render(this.view.scene, this.view.camera); }
  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
