import type {
  EdiViewerExposure,
  EdiViewerExposureMetadata,
  EdiViewerExposureRecognition,
} from "../../edi/view-model/EdiViewerExposure";

export type BagaStudioPresentationMetadata = EdiViewerExposureMetadata & {
  source?: string;
  presentationSource?: "edi-viewer-exposure";
};

export type BagaStudioEdiPresentationRecognition = {
  id: string;
  timestamp: number;
  status: EdiViewerExposureRecognition["status"];
  mode: EdiViewerExposureRecognition["mode"];
  metadata?: EdiViewerExposureRecognition["metadata"];
};

export type BagaStudioEdiPresentationSection = {
  id: string;
  timestamp: number;
  sourceExposureId: string;
  recognition?: BagaStudioEdiPresentationRecognition;
  metadata?: EdiViewerExposure["metadata"];
};

export type BagaStudioPresentationModel = {
  id: string;
  timestamp: number;
  edi: BagaStudioEdiPresentationSection;
  metadata?: BagaStudioPresentationMetadata;
};

export const createBagaStudioPresentationModelFromEdiViewerExposure = (
  exposure: EdiViewerExposure,
): BagaStudioPresentationModel => ({
  id: `bagastudio-presentation:${exposure.id}`,
  timestamp: exposure.timestamp,
  edi: {
    id: `bagastudio-edi:${exposure.id}`,
    timestamp: exposure.timestamp,
    sourceExposureId: exposure.id,
    recognition: exposure.recognition
      ? {
          id: exposure.recognition.id,
          timestamp: exposure.recognition.timestamp,
          status: exposure.recognition.status,
          mode: exposure.recognition.mode,
          metadata: exposure.recognition.metadata,
        }
      : undefined,
    metadata: exposure.metadata,
  },
  metadata: {
    ...exposure.metadata,
    source: exposure.metadata?.source ?? "BagaStudioPresentationModel",
    presentationSource: "edi-viewer-exposure",
  },
});
