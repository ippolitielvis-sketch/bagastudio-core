import type { EdiV2Frame } from "../types";

export interface RenderPass {
  render(frame: EdiV2Frame): void;
  dispose(): void;
}
