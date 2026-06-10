import { LinearFilter, RGBAFormat, WebGLRenderTarget } from "three";
import type { EdiV2Frame } from "../types";
import type { RenderPass } from "./RenderPass";

export class EdiRenderPipeline {
  private target: WebGLRenderTarget;

  constructor(private readonly passes: RenderPass[], size = 140) {
    this.target = new WebGLRenderTarget(size, size, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  setSize(size: number) {
    this.target.setSize(size, size);
    this.passes.forEach((pass) => pass.setSize?.(size));
  }

  render(frame: Omit<EdiV2Frame, "target">) {
    const targetFrame = { ...frame, target: this.target };
    frame.renderer.setRenderTarget(this.target);
    frame.renderer.clear();
    this.passes.filter((pass) => !pass.composite && (frame.laboratory.shaderMode === "composite" || pass.id === frame.laboratory.shaderMode)).forEach((pass) => pass.render(targetFrame));
    frame.renderer.setRenderTarget(null);
    this.passes.filter((pass) => pass.composite).forEach((pass) => pass.render(targetFrame));
  }

  dispose() {
    this.target.dispose();
    this.passes.forEach((pass) => pass.dispose());
  }
}
