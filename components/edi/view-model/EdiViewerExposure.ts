import type {
  EdiViewModelRecognitionSection,
  EdiViewModelSnapshot,
  EdiViewModelSnapshotMetadata,
} from "./EdiViewModelSnapshot";

export type EdiViewerExposureMetadata = EdiViewModelSnapshotMetadata & {
  source?: string;
  exposureSource?: "view-model-snapshot";
};

export type EdiViewerExposureRecognition = {
  id: string;
  timestamp: number;
  executionResultId: string;
  executionRequestId: string;
  mode: EdiViewModelRecognitionSection["mode"];
  status: EdiViewModelRecognitionSection["status"];
  metadata?: EdiViewModelRecognitionSection["metadata"];
};

export type EdiViewerExposure = {
  id: string;
  timestamp: number;
  recognition?: EdiViewerExposureRecognition;
  metadata?: EdiViewerExposureMetadata;
};

export const createEdiViewerExposureFromSnapshot = (
  snapshot: EdiViewModelSnapshot,
): EdiViewerExposure => ({
  id: `edi-viewer-exposure:${snapshot.id}`,
  timestamp: snapshot.timestamp,
  recognition: snapshot.recognition
    ? {
        id: snapshot.recognition.id,
        timestamp: snapshot.recognition.timestamp,
        executionResultId: snapshot.recognition.executionResultId,
        executionRequestId: snapshot.recognition.executionRequestId,
        mode: snapshot.recognition.mode,
        status: snapshot.recognition.status,
        metadata: snapshot.recognition.metadata,
      }
    : undefined,
  metadata: {
    ...snapshot.metadata,
    source: snapshot.metadata?.source ?? "EdiViewerExposure",
    exposureSource: "view-model-snapshot",
  },
});
