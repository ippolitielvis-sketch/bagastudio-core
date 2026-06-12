import type {
  RecognitionObservableMetadata,
  RecognitionObservableResult,
} from "../integration/recognition/RecognitionResultAdapter";

export type EdiViewModelSnapshotMetadata = {
  source?: string;
  reason?: string;
  [key: string]: unknown;
};

export type EdiViewModelRecognitionSection = {
  id: string;
  timestamp: number;
  executionResultId: string;
  executionRequestId: string;
  mode: RecognitionObservableResult["mode"];
  status: RecognitionObservableResult["status"];
  metadata?: RecognitionObservableMetadata;
};

export type EdiViewModelSnapshot = {
  id: string;
  timestamp: number;
  recognition?: EdiViewModelRecognitionSection;
  metadata?: EdiViewModelSnapshotMetadata;
};

export const createEdiViewModelSnapshotFromRecognitionObservableResult = (
  result: RecognitionObservableResult,
): EdiViewModelSnapshot => ({
  id: `edi-view-model:${result.id}`,
  timestamp: result.timestamp,
  recognition: {
    id: result.id,
    timestamp: result.timestamp,
    executionResultId: result.executionResultId,
    executionRequestId: result.executionRequestId,
    mode: result.mode,
    status: result.status,
    metadata: result.metadata,
  },
  metadata: {
    source: "EdiViewModelSnapshot",
    reason: "recognition-observable-result",
  },
});
