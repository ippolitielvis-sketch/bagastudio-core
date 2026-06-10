import type { EdiLayerPropsV3, EdiMicroEventV7 } from "../types";

export default function TechnicalObjectsLayer({ ediState, microEvent }: EdiLayerPropsV3 & { microEvent?: EdiMicroEventV7 }) {
  return <span className={`edi-v3__objects edi-v3__objects--${ediState} edi-v3__objects--event-${microEvent || "none"}`}><i className="edi-v3__compass">Λ</i><i className="edi-v3__square">△</i><i className="edi-v3__pen">╱</i><i className="edi-v3__roll">◫</i></span>;
}
