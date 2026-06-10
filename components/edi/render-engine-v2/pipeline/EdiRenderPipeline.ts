import type { EdiV2Frame } from "../types";
import type { RenderPass } from "./RenderPass";

export class EdiRenderPipeline {
  constructor(private readonly passes: RenderPass[]) {}
  render(frame: EdiV2Frame) { this.passes.forEach((pass) => pass.render(frame)); }
  dispose() { this.passes.forEach((pass) => pass.dispose()); }
}
