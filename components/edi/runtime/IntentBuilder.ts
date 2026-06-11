import { createEdiIntent } from "../core/Intent";
import type { EdiCognitiveActivationContext } from "../core/activationContextTypes";
import type {
  EdiIntent,
  EdiIntentKind,
  EdiIntentMetadata,
  EdiIntentPriority,
} from "../core/intentTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type BuildEdiIntentInput = {
  context: EdiCognitiveActivationContext;
  id?: string;
  timestamp?: number;
  kind: EdiIntentKind;
  confidence: number;
  priority?: EdiIntentPriority;
  targetDomain?: EdiObservationDomain;
  reason?: string;
  explanation?: string;
  metadata?: EdiIntentMetadata;
};

export type BuildEdiIntentsInput = {
  context: EdiCognitiveActivationContext;
  intents: readonly Omit<BuildEdiIntentInput, "context">[];
};

export type EdiIntentBuilder = {
  buildIntent(input: BuildEdiIntentInput): EdiIntent;
  buildIntents(input: BuildEdiIntentsInput): readonly EdiIntent[];
};

export const createEdiIntentBuilder = (): EdiIntentBuilder => {
  const buildIntent = (input: BuildEdiIntentInput): EdiIntent =>
    createEdiIntent({
      id: input.id,
      timestamp: input.timestamp,
      contextId: input.context.id,
      cognitiveState: input.context.cognitiveState,
      kind: input.kind,
      confidence: input.confidence,
      priority: input.priority,
      targetDomain: input.targetDomain,
      reason: input.reason,
      explanation: input.explanation,
      metadata: input.metadata,
    });

  return {
    buildIntent,
    buildIntents: (input) =>
      input.intents.map((intent) =>
        buildIntent({
          ...intent,
          context: input.context,
        }),
      ),
  };
};
