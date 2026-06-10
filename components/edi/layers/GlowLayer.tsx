import type { EdiLayerPropsV3 } from "../types";

export default function GlowLayer({ ediState }: EdiLayerPropsV3) {
  return <span className={`edi-v3__glow edi-v3__glow--${ediState}`} />;
}
