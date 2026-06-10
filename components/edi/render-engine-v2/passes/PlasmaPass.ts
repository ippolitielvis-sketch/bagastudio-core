import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { EDI_BLUE, EDI_GOLD } from "../utils/color";
import { createPassScene } from "./passUtils";

export class PlasmaPass implements RenderPass {
  private view = createPassScene(); private lines: Line[] = [];
  constructor() { for (let index = 0; index < 5; index += 1) { const line = new Line(new BufferGeometry(), new LineBasicMaterial({ color: index % 2 ? EDI_GOLD : EDI_BLUE, transparent: true, opacity: .18 })); this.lines.push(line); this.view.scene.add(line); } }
  render(frame: EdiV2Frame) { this.lines.forEach((line, index) => { line.geometry.setFromPoints(Array.from({ length: 18 }, (_, point) => { const t = point / 17; return new Vector3(-.7 + t * 1.4, Math.sin(t * 6 + frame.time * .5 + index) * (.12 + index * .012) + (index - 2) * .055, 0); })); }); frame.renderer.render(this.view.scene, this.view.camera); }
  dispose() { this.lines.forEach((line) => { line.geometry.dispose(); (line.material as LineBasicMaterial).dispose(); }); }
}
