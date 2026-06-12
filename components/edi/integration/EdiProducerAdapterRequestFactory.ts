import { createEdiExecutionRequest } from "../core/ExecutionRequest";
import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import type { EdiProducerAdapterOutput } from "./EdiProducerAdapter";

export const createEdiExecutionRequestFromProducerAdapterOutput = (
  output: EdiProducerAdapterOutput,
): EdiExecutionRequest =>
  createEdiExecutionRequest({
    ...output.executionRequestInput,
    targetDomain: output.targetDomain,
    mode: output.mode,
    payload: output.executionRequestInput.payload,
    metadata: {
      ...output.executionRequestInput.metadata,
      ...output.metadata,
      producerAdapterSource: output.source,
    },
  });
