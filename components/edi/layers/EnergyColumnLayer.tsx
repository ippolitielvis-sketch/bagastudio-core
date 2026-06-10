import type { EdiLayerPropsV3 } from "../types";

export default function EnergyColumnLayer({ ediState }: EdiLayerPropsV3) {
  return <span className={`edi-v3__energy edi-v3__energy--${ediState}`}><span /></span>;
}
