import type { EdiV2Frame } from "../types";

export interface RenderPass {
  readonly id: string;
  readonly composite?: boolean;
  setSize?(size: number): void;
  render(frame: EdiV2Frame): void;
  dispose(): void;
}
