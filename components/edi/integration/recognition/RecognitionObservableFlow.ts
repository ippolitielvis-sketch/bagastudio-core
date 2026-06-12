import type { EdiExecutionRequest } from "../../core/executionRequestTypes";
import type { EdiExecutionResult } from "../../core/executionResultTypes";
import type { EdiIntegrationBoundaryValidationResult } from "../EdiIntegrationBoundary";
import type { EdiExecutionRuntime } from "../../runtime/EdiExecutionRuntime";
import {
  createRecognitionProducerBoundaryPipelineResult,
} from "./RecognitionProducerBoundaryPipeline";
import type { RecognitionProducerAdapterInput } from "./RecognitionProducerAdapter";
import {
  createRecognitionObservableResult,
  type RecognitionObservableResult,
} from "./RecognitionResultAdapter";
import { runRecognitionRuntimeAdapter } from "./RecognitionRuntimeAdapter";

export type RunRecognitionObservableFlowInput = {
  recognitionInput: RecognitionProducerAdapterInput;
  executionRuntime: EdiExecutionRuntime;
};

export type RecognitionObservableFlowResult =
  | {
      status: "boundary-invalid";
      validation: EdiIntegrationBoundaryValidationResult;
      observableResult?: undefined;
      executionResult?: undefined;
      request?: undefined;
    }
  | {
      status: "succeeded";
      validation: EdiIntegrationBoundaryValidationResult;
      request: EdiExecutionRequest;
      executionResult: EdiExecutionResult;
      observableResult: RecognitionObservableResult;
    };

export const runRecognitionObservableFlow = (
  input: RunRecognitionObservableFlowInput,
): RecognitionObservableFlowResult => {
  const boundaryPipelineResult = createRecognitionProducerBoundaryPipelineResult(
    input.recognitionInput,
  );

  if (!boundaryPipelineResult.request) {
    return {
      status: "boundary-invalid",
      validation: boundaryPipelineResult.validation,
    };
  }

  const executionResult = runRecognitionRuntimeAdapter({
    request: boundaryPipelineResult.request,
    executionRuntime: input.executionRuntime,
  });

  return {
    status: "succeeded",
    validation: boundaryPipelineResult.validation,
    request: boundaryPipelineResult.request,
    executionResult,
    observableResult: createRecognitionObservableResult(executionResult),
  };
};
