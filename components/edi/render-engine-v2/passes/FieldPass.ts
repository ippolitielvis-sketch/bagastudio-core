import { BufferGeometry, Line, LineDashedMaterial, Vector3 } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { EDI_BLUE, EDI_GOLD } from "../utils/color";
import { createPassScene } from "./passUtils";

export class FieldPass implements RenderPass {
  readonly id = "magnetic";
  private view = createPassScene(); private lines: Line[] = [];
  constructor() { for (let index = 0; index < 3; index += 1) { const line = new Line(new BufferGeometry(), new LineDashedMaterial({ color: index === 1 ? EDI_BLUE : EDI_GOLD, transparent: true, opacity: .16, dashSize: .08, gapSize: .12 })); this.lines.push(line); this.view.scene.add(line); } }
  render(frame: EdiV2Frame) { this.lines.forEach((line, index) => { const bend = Math.sin(frame.time * .2 + index) * .12 * frame.laboratory.magneticIntensity; (line.material as LineDashedMaterial).opacity = .16 * frame.laboratory.magneticIntensity; line.geometry.setFromPoints([new Vector3(-.92, -.4 + index * .35, 0), new Vector3(-.25, .55 + bend, 0), new Vector3(.38, -.48 - bend, 0), new Vector3(.92, -.2 + index * .28, 0)]); line.computeLineDistances(); }); frame.renderer.render(this.view.scene, this.view.camera); }
  dispose() { this.lines.forEach((line) => { line.geometry.dispose(); (line.material as LineDashedMaterial).dispose(); }); }
}
