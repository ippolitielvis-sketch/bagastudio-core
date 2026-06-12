import type {
  EdiExecutionRequestInput,
  EdiExecutionRequestMode,
  EdiExecutionRequestPayload,
} from "../core/executionRequestTypes";
import type { EdiObservationDomain } from "../adapters/ObservationAdapter";

export type EdiProducerAdapterSource =
  | "preview-integration"
  | "real-producer"
  | "import-integration"
  | "recognition-integration"
  | "viewer-integration"
  | "system";

export type EdiProducerAdapterDomain = EdiObservationDomain;

export type EdiProducerAdapterMode = EdiExecutionRequestMode;

export type EdiProducerAdapterMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiProducerAdapterInput = {
  source: EdiProducerAdapterSource;
  targetDomain: EdiProducerAdapterDomain;
  mode: EdiProducerAdapterMode;
  payload?: EdiExecutionRequestPayload;
  metadata?: EdiProducerAdapterMetadata;
};

export type EdiProducerAdapterOutput = {
  source: EdiProducerAdapterSource;
  targetDomain: EdiProducerAdapterDomain;
  mode: EdiProducerAdapterMode;
  executionRequestInput: EdiExecutionRequestInput;
  metadata?: EdiProducerAdapterMetadata;
};

export type EdiProducerAdapter = {
  id: string;
  source: EdiProducerAdapterSource;
  targetDomain?: EdiProducerAdapterDomain;
  mode?: EdiProducerAdapterMode;
  adapt(input: EdiProducerAdapterInput): EdiProducerAdapterOutput;
};
