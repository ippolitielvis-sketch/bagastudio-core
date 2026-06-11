import { createEdiAction } from "../core/Action";
import type {
  EdiAction,
  EdiActionMetadata,
  EdiActionPayload,
  EdiActionPriority,
  EdiActionStatus,
} from "../core/actionTypes";
import type { EdiIntent } from "../core/intentTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type BuildEdiActionInput = {
  intent: EdiIntent;
  id?: string;
  timestamp?: number;
  status?: EdiActionStatus;
  priority?: EdiActionPriority;
  confidence?: number;
  targetDomain?: EdiObservationDomain;
  payload?: EdiActionPayload;
  reason?: string;
  explanation?: string;
  metadata?: EdiActionMetadata;
};

export type BuildEdiActionsInput = {
  actions: readonly BuildEdiActionInput[];
};

export type EdiActionBuilder = {
  buildAction(input: BuildEdiActionInput): EdiAction;
  buildActions(input: BuildEdiActionsInput): readonly EdiAction[];
};

export const createEdiActionBuilder = (): EdiActionBuilder => {
  const buildAction = (input: BuildEdiActionInput): EdiAction =>
    createEdiAction({
      id: input.id,
      timestamp: input.timestamp,
      intentId: input.intent.id,
      contextId: input.intent.contextId,
      kind: input.intent.kind,
      status: input.status,
      priority: input.priority ?? input.intent.priority,
      confidence: input.confidence ?? input.intent.confidence,
      targetDomain: input.targetDomain ?? input.intent.targetDomain,
      payload: input.payload,
      reason: input.reason ?? input.intent.reason,
      explanation: input.explanation ?? input.intent.explanation,
      metadata: input.metadata,
    });

  return {
    buildAction,
    buildActions: (input) => input.actions.map(buildAction),
  };
};
