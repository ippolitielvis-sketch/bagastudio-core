import type {
  EdiProducerAdapter,
  EdiProducerAdapterInput,
  EdiProducerAdapterMetadata,
  EdiProducerAdapterMode,
  EdiProducerAdapterOutput,
} from "../EdiProducerAdapter";

export const RECOGNITION_PRODUCER_ADAPTER_ID = "edi.producer.recognition.foundation";

export type RecognitionProducerAdapterPayload = {
  recognitionId?: string;
  source?: string;
  summary?: string;
  [key: string]: unknown;
};

export type RecognitionProducerAdapterInput = Omit<
  EdiProducerAdapterInput,
  "source" | "targetDomain" | "mode" | "payload"
> & {
  source?: "recognition-integration";
  targetDomain?: "recognition";
  mode?: EdiProducerAdapterMode;
  payload?: RecognitionProducerAdapterPayload;
  executionPlanId?: string;
  actionIds?: readonly string[];
  intentIds?: readonly string[];
  contextIds?: readonly string[];
};

const toRecognitionMetadata = (
  input: RecognitionProducerAdapterInput,
): EdiProducerAdapterMetadata => ({
  ...input.metadata,
  source: input.metadata?.source ?? RECOGNITION_PRODUCER_ADAPTER_ID,
  reason: input.metadata?.reason ?? "recognition-producer-adapter-foundation",
});

export const createRecognitionProducerAdapterOutput = (
  input: RecognitionProducerAdapterInput,
): EdiProducerAdapterOutput => {
  const mode = input.mode ?? "preview";
  const metadata = toRecognitionMetadata(input);

  return {
    source: "recognition-integration",
    targetDomain: "recognition",
    mode,
    executionRequestInput: {
      executionPlanId: input.executionPlanId ?? "recognition-producer:plan",
      actionIds: input.actionIds ?? [],
      intentIds: input.intentIds ?? [],
      contextIds: input.contextIds ?? [],
      mode,
      targetDomain: "recognition",
      payload: input.payload,
      metadata,
    },
    metadata,
  };
};

export const recognitionProducerAdapter: EdiProducerAdapter = {
  id: RECOGNITION_PRODUCER_ADAPTER_ID,
  source: "recognition-integration",
  targetDomain: "recognition",
  mode: "preview",
  adapt: (input) =>
    createRecognitionProducerAdapterOutput({
      ...input,
      source: "recognition-integration",
      targetDomain: "recognition",
    }),
};
