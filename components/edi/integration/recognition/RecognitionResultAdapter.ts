import type {
  EdiExecutionResult,
  EdiExecutionResultMetadata,
  EdiExecutionResultMode,
  EdiExecutionResultStatus,
} from "../../core/executionResultTypes";

export type RecognitionObservableMetadata = EdiExecutionResultMetadata & {
  source?: string;
  recognitionSource?: "execution-result";
};

export type RecognitionObservableResult = {
  id: string;
  timestamp: number;
  executionResultId: string;
  executionRequestId: string;
  mode: EdiExecutionResultMode;
  status: EdiExecutionResultStatus;
  targetDomain?: "recognition";
  executorId?: string;
  metadata?: RecognitionObservableMetadata;
  original: EdiExecutionResult;
};

export const createRecognitionObservableResult = (
  result: EdiExecutionResult,
): RecognitionObservableResult => ({
  id: `recognition-observable:${result.id}`,
  timestamp: result.timestamp,
  executionResultId: result.id,
  executionRequestId: result.executionRequestId,
  mode: result.mode,
  status: result.status,
  targetDomain: result.targetDomain === "recognition" ? "recognition" : undefined,
  executorId: result.executorId,
  metadata: {
    ...result.metadata,
    source: result.metadata?.source ?? "RecognitionResultAdapter",
    recognitionSource: "execution-result",
  },
  original: result,
});

export const recognitionResultAdapter = {
  id: "edi.recognition.result-adapter.foundation",
  createObservableResult: createRecognitionObservableResult,
} as const;
