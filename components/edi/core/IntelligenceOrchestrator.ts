import type {
  EdiIntelligenceRegistration,
  EdiOrchestratorDispatch,
  EdiOrchestratorDispatchInput,
  EdiOrchestratorListener,
} from "./orchestratorTypes";

export const createEdiOrchestratorDispatch = <TPayload = unknown>(
  input: EdiOrchestratorDispatchInput<TPayload>,
): EdiOrchestratorDispatch<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

export class IntelligenceOrchestrator {
  private registrations = new Map<string, EdiIntelligenceRegistration>();
  private listeners = new Set<EdiOrchestratorListener>();

  register(registration: EdiIntelligenceRegistration): () => void {
    this.registrations.set(registration.id, registration);
    return () => this.unregister(registration.id);
  }

  unregister(registrationId: string) {
    this.registrations.delete(registrationId);
  }

  dispatch<TPayload = unknown>(input: EdiOrchestratorDispatchInput<TPayload>): EdiOrchestratorDispatch<TPayload> {
    const dispatch = createEdiOrchestratorDispatch(input);
    this.registrations.forEach((registration) => {
      if (registration.type === dispatch.target) registration.handle(dispatch);
    });
    this.listeners.forEach((listener) => listener(dispatch));
    return dispatch;
  }

  subscribe(listener: EdiOrchestratorListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: EdiOrchestratorListener) {
    this.listeners.delete(listener);
  }

  clear() {
    this.registrations.clear();
    this.listeners.clear();
  }
}
