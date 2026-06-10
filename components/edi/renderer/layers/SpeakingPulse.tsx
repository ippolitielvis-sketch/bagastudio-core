import type { EdiRendererLayerProps } from "../types";

export default function SpeakingPulse({ state }: EdiRendererLayerProps) {
  return state === "speaking" ? <path className="edi-renderer__speaking" d="M40 55c7-8 17-8 24 0M36 62c10 12 25 12 34 0" /> : null;
}
