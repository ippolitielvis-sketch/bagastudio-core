import {
  EDI_PROJECT_EVENT_TYPES,
  type EdiProjectEvent,
  type EdiProjectEventInput,
  type EdiProjectEventListener,
  type EdiProjectEventType,
} from "./eventTypes";

const projectEventTypes = new Set<string>(EDI_PROJECT_EVENT_TYPES);

export const isEdiProjectEventType = (value: unknown): value is EdiProjectEventType =>
  typeof value === "string" && projectEventTypes.has(value);

export const isValidEdiProjectEvent = (event: unknown): event is EdiProjectEvent => {
  if (!event || typeof event !== "object") return false;
  const candidate = event as Partial<EdiProjectEvent>;
  return isEdiProjectEventType(candidate.type)
    && typeof candidate.timestamp === "number"
    && Number.isFinite(candidate.timestamp)
    && typeof candidate.origin === "string"
    && candidate.origin.length > 0;
};

export const createEdiProjectEvent = <TPayload = unknown>(
  input: EdiProjectEventInput<TPayload>,
): EdiProjectEvent<TPayload> => {
  const event: EdiProjectEvent<TPayload> = { ...input, timestamp: input.timestamp ?? Date.now() };
  if (!isValidEdiProjectEvent(event)) throw new TypeError("Invalid EDI project event");
  return event;
};

export class ProjectEventBridge {
  private listeners = new Set<EdiProjectEventListener>();

  publish<TPayload = unknown>(input: EdiProjectEventInput<TPayload>): EdiProjectEvent<TPayload> {
    const event = createEdiProjectEvent(input);
    this.listeners.forEach((listener) => listener(event));
    return event;
  }

  subscribe(listener: EdiProjectEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.listeners.clear();
  }
}
