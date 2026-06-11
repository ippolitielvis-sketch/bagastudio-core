import type { EdiObservation, EdiObservationInput, EdiObservationListener } from "./observationTypes";

export const isValidEdiObservation = (observation: unknown): observation is EdiObservation => {
  if (!observation || typeof observation !== "object") return false;
  const candidate = observation as Partial<EdiObservation>;
  return typeof candidate.id === "string"
    && candidate.id.length > 0
    && typeof candidate.timestamp === "number"
    && Number.isFinite(candidate.timestamp)
    && typeof candidate.cognitiveState === "string"
    && typeof candidate.confidence === "number"
    && Number.isFinite(candidate.confidence)
    && candidate.confidence >= 0
    && candidate.confidence <= 1;
};

export const createEdiObservation = <TPayload = unknown>(
  input: EdiObservationInput<TPayload>,
): EdiObservation<TPayload> => {
  const observation: EdiObservation<TPayload> = { ...input, timestamp: input.timestamp ?? Date.now() };
  if (!isValidEdiObservation(observation)) throw new TypeError("Invalid EDI observation");
  return observation;
};

export class ReasoningBridge {
  private observations: EdiObservation[] = [];
  private listeners = new Set<EdiObservationListener>();

  constructor(private readonly maxObservations = 500) {}

  pushObservation<TPayload = unknown>(input: EdiObservationInput<TPayload>): EdiObservation<TPayload> {
    const observation = createEdiObservation(input);
    this.observations = [...this.observations, observation]
      .sort((left, right) => left.timestamp - right.timestamp)
      .slice(-this.maxObservations);
    const snapshot = this.getObservations();
    this.listeners.forEach((listener) => listener(snapshot, observation));
    return observation;
  }

  getObservations(): readonly EdiObservation[] {
    return [...this.observations];
  }

  clearObservations() {
    this.observations = [];
  }

  subscribeObservations(listener: EdiObservationListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: EdiObservationListener) {
    this.listeners.delete(listener);
  }
}
