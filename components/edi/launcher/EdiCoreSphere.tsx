import EdiCoreRenderer from "../renderer/EdiCoreRenderer";
import type { EdiCoreState } from "../renderer/types";

export type EdiCoreVisualState = EdiCoreState;

export default function EdiCoreSphere({ state = "idle" }: { state?: EdiCoreVisualState }) {
  return <span className="edi-launcher-core__sphere" data-edi-state={state}><EdiCoreRenderer state={state} size={96} /></span>;
}
