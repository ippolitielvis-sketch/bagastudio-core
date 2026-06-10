import type { EdiLayerPropsV3, EdiMicroEventV7 } from "../types";

export default function IdeaLayer({ ediState, microEvent }: EdiLayerPropsV3 & { microEvent?: EdiMicroEventV7 }) {
  const visible = ediState === "suggestion" || ediState === "thinking" || ediState === "success" || microEvent === "idea";
  return <span className={`edi-v3__idea ${visible ? "edi-v3__idea--visible" : ""}`}>◉</span>;
}
