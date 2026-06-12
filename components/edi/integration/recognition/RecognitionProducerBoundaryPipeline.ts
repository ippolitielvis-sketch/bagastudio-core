import {
  createEdiProducerAdapterBoundaryPipelineResult,
  type EdiProducerAdapterBoundaryPipelineResult,
} from "../EdiProducerAdapterBoundaryPipeline";
import {
  createRecognitionProducerAdapterOutput,
  type RecognitionProducerAdapterInput,
} from "./RecognitionProducerAdapter";

export const createRecognitionProducerBoundaryPipelineResult = (
  input: RecognitionProducerAdapterInput,
): EdiProducerAdapterBoundaryPipelineResult => {
  const output = createRecognitionProducerAdapterOutput(input);

  return createEdiProducerAdapterBoundaryPipelineResult(output);
};
