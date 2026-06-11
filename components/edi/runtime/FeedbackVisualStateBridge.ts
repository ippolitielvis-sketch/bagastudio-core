import type { EdiCognitiveFeedback, EdiCognitiveFeedbackKind } from "../feedback/CognitiveFeedback";
import type { EdiV2LaboratoryProfile, EdiV2State } from "../render-engine-v2/types";

export type EdiFeedbackVisualState = {
  state: EdiV2State;
  intensity: number;
  laboratory?: Partial<EdiV2LaboratoryProfile>;
  sourceFeedbackIds: string[];
};

const FEEDBACK_KIND_PRIORITY: Record<EdiCognitiveFeedbackKind, number> = {
  warning: 4,
  suggestion: 3,
  success: 2,
  insight: 1,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const mapFeedbackKindToVisualState = (kind: EdiCognitiveFeedbackKind): EdiV2State => {
  if (kind === "warning") return "warning";
  if (kind === "suggestion") return "suggestion";
  if (kind === "success") return "success";
  return "analyzing";
};

const mapFeedbackKindToLaboratory = (kind: EdiCognitiveFeedbackKind, intensity: number): Partial<EdiV2LaboratoryProfile> => {
  if (kind === "warning") {
    return {
      presence: .85 + intensity * .15,
      thoughtPulseStrength: .65 + intensity * .35,
      communicationStrength: .45 + intensity * .25,
    };
  }

  if (kind === "suggestion") {
    return {
      presence: .7 + intensity * .18,
      thoughtPulseStrength: .8 + intensity * .2,
      communicationStrength: .55 + intensity * .25,
    };
  }

  if (kind === "success") {
    return {
      presence: .68 + intensity * .16,
      communicationStrength: .72 + intensity * .2,
      thoughtPulseStrength: .42 + intensity * .18,
    };
  }

  return {
    presence: .48 + intensity * .18,
    thoughtPulseStrength: .38 + intensity * .2,
    communicationStrength: .2 + intensity * .12,
  };
};

const selectPrimaryFeedback = (feedbacks: readonly EdiCognitiveFeedback[]): EdiCognitiveFeedback =>
  [...feedbacks].sort((left, right) => {
    const priorityDelta = FEEDBACK_KIND_PRIORITY[right.kind] - FEEDBACK_KIND_PRIORITY[left.kind];
    if (priorityDelta !== 0) return priorityDelta;
    return right.confidence - left.confidence;
  })[0];

export const buildFeedbackVisualState = (feedbacks: readonly EdiCognitiveFeedback[]): EdiFeedbackVisualState => {
  if (feedbacks.length === 0) {
    return {
      state: "idle",
      intensity: 0,
      sourceFeedbackIds: [],
    };
  }

  const primaryFeedback = selectPrimaryFeedback(feedbacks);
  const intensity = clamp01(primaryFeedback.confidence);

  return {
    state: mapFeedbackKindToVisualState(primaryFeedback.kind),
    intensity,
    laboratory: mapFeedbackKindToLaboratory(primaryFeedback.kind, intensity),
    sourceFeedbackIds: feedbacks.map((feedback) => feedback.id),
  };
};
