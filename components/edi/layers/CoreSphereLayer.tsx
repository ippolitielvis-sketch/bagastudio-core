import type { EdiLayerPropsV3 } from "../types";

export default function CoreSphereLayer({ ediState }: EdiLayerPropsV3) {
  return <span className={`edi-v3__sphere edi-v3__sphere--${ediState}`}><span className="edi-v3__plasma" /><span className="edi-v3__discharge" /></span>;
}
