import type { EdiRendererLayerProps } from "../types";

export default function BlueprintBase({ compact }: EdiRendererLayerProps) {
  if (compact) return null;
  return <g className="edi-renderer__blueprint"><path d="M17 111h86M29 117V94m21 23V91m20 26V91m21 26V94M25 104h70" /><path d="M60 96l10 6v12l-10 6-10-6v-12z" /></g>;
}
