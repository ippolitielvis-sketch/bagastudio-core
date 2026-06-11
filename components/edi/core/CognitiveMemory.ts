import type {
  EdiCognitiveMemoryOptions,
  EdiMemoryEntry,
  EdiMemoryEntryInput,
  EdiMemoryListener,
} from "./memoryTypes";

export const createEdiMemoryEntry = <TObservation = unknown>(
  input: EdiMemoryEntryInput<TObservation>,
): EdiMemoryEntry<TObservation> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

export class CognitiveMemory {
  private memory: EdiMemoryEntry[] = [];
  private listeners = new Set<EdiMemoryListener>();
  private readonly maxEntries: number;
  private readonly timeWindowMs: number;

  constructor(options: EdiCognitiveMemoryOptions = {}) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 200);
    this.timeWindowMs = Math.max(0, options.timeWindowMs ?? 5 * 60 * 1000);
  }

  pushMemory<TObservation = unknown>(input: EdiMemoryEntryInput<TObservation>): EdiMemoryEntry<TObservation> {
    const entry = createEdiMemoryEntry(input);
    const cutoff = entry.timestamp - this.timeWindowMs;
    this.memory = [...this.memory, entry]
      .filter((candidate) => candidate.timestamp >= cutoff)
      .sort((left, right) => left.timestamp - right.timestamp)
      .slice(-this.maxEntries);
    const snapshot = this.getMemory();
    this.listeners.forEach((listener) => listener(snapshot, entry));
    return entry;
  }

  getMemory(): readonly EdiMemoryEntry[] {
    return [...this.memory];
  }

  clearMemory() {
    this.memory = [];
  }

  subscribeMemory(listener: EdiMemoryListener): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: EdiMemoryListener) {
    this.listeners.delete(listener);
  }
}
