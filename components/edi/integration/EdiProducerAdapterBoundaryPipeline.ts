import type { EdiExecutionRequest } from "../core/executionRequestTypes";
import {
  createEdiIntegrationBoundaryRequest,
  type EdiIntegrationBoundaryValidationResult,
} from "./EdiIntegrationBoundary";
import type { EdiProducerAdapterOutput } from "./EdiProducerAdapter";
import { createEdiExecutionRequestFromProducerAdapterOutput } from "./EdiProducerAdapterRequestFactory";

export type EdiProducerAdapterBoundaryPipelineMetadata = {
  source: "EdiProducerAdapterBoundaryPipeline";
  stage: "pre-runtime";
  producerAdapterSource: EdiProducerAdapterOutput["source"];
};

export type EdiProducerAdapterBoundaryPipelineResult = {
  request?: EdiExecutionRequest;
  validation: EdiIntegrationBoundaryValidationResult;
  metadata: EdiProducerAdapterBoundaryPipelineMetadata;
};

export const createEdiProducerAdapterBoundaryPipelineResult = (
  output: EdiProducerAdapterOutput,
): EdiProducerAdapterBoundaryPipelineResult => {
  const request = createEdiExecutionRequestFromProducerAdapterOutput(output);
  const boundaryRequest = createEdiIntegrationBoundaryRequest(request);

  return {
    request: boundaryRequest.request,
    validation: boundaryRequest.validation,
    metadata: {
      source: "EdiProducerAdapterBoundaryPipeline",
      stage: "pre-runtime",
      producerAdapterSource: output.source,
    },
  };
};
