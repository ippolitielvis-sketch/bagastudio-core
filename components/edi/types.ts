export type EdiLivingStateV3 = "idle" | "thinking" | "analyzing" | "suggestion" | "warning" | "success";
export type EdiSceneStateV7 = EdiLivingStateV3 | "projectDetected";
export type EdiMicroEventV7 = "compass" | "pen" | "roll" | "idea" | null;

export type EdiLayerPropsV3 = {
  ediState: EdiLivingStateV3;
};

export type EdiProjectBlueprintV4 = {
  paths?: string[];
  dimensions?: string[];
};
