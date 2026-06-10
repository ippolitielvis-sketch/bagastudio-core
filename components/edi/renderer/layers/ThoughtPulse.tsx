import type { EdiRendererLayerProps } from "../types";

export default function ThoughtPulse({ state }: EdiRendererLayerProps) {
  return state === "thinking" || state === "suggestion" ? <circle className="edi-renderer__thought" cx="52" cy="54" r="4" /> : null;
}
