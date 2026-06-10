import type { EdiLayerPropsV3 } from "../types";

export default function ParticleLayer({ ediState }: EdiLayerPropsV3) {
  return <span className={`edi-v3__particles edi-v3__particles--${ediState}`}>{["01", "Δ", "X", "42", "°", "+"].map((value, index) => <i key={value} style={{ ["--particle-index" as string]: index }}>{value}</i>)}</span>;
}
