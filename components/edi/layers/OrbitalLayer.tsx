import type { EdiLayerPropsV3 } from "../types";

export default function OrbitalLayer({ ediState }: EdiLayerPropsV3) {
  return <span className={`edi-v3__orbitals edi-v3__orbitals--${ediState}`}><i /><i /><i /></span>;
}
