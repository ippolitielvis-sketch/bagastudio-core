import type { EdiProjectEvent } from "./eventTypes";
import {
  EDI_PROJECT_EVENT_STATE_MAP,
  type EdiCognitiveState,
  type EdiCognitiveStateInput,
  type EdiCognitiveStateListener,
  type EdiCognitiveStateTransition,
} from "./cognitiveStateTypes";

export const mapProjectEventToCognitiveState = (event: EdiProjectEvent): EdiCognitiveState | null =>
  EDI_PROJECT_EVENT_STATE_MAP[event.type] ?? null;

export class CognitiveStateBus {
  private currentState: EdiCognitiveState = "idle";
  private listeners = new Set<EdiCognitiveStateListener>();

  publishState(input: EdiCognitiveStateInput): EdiCognitiveStateTransition {
    const transition: EdiCognitiveStateTransition = {
      ...input,
      timestamp: input.timestamp ?? Date.now(),
      previousState: this.currentState,
    };
    this.currentState = transition.nextState;
    this.listeners.forEach((listener) => listener(transition));
    return transition;
  }

  publishProjectEvent(event: EdiProjectEvent): EdiCognitiveStateTransition | null {
    const nextState = mapProjectEventToCognitiveState(event);
    if (!nextState) return null;
    return this.publishState({ nextState, sourceEvent: event, reason: `project-event:${event.type}` });
  }

  subscribeState(listener: EdiCognitiveStateListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: EdiCognitiveStateListener) {
    this.listeners.delete(listener);
  }

  getCurrentState(): EdiCognitiveState {
    return this.currentState;
  }

  reset(): EdiCognitiveStateTransition {
    return this.publishState({ nextState: "idle", reason: "reset", confidence: 1 });
  }
}
