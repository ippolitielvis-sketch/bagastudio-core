import type {
  EdiExecutionResultConsumer,
  EdiExecutionResultConsumerConsumption,
} from "../core/executionResultConsumerTypes";

const PREVIEW_EXECUTION_RESULT_CONSUMER_ID = "edi.consumer.execution-result.preview";

export const previewExecutionResultConsumerConsumption: EdiExecutionResultConsumerConsumption = (
  result,
) => {
  void result;
};

export const previewExecutionResultConsumer: EdiExecutionResultConsumer = {
  id: PREVIEW_EXECUTION_RESULT_CONSUMER_ID,
  name: "EDI Preview Execution Result Consumer",
  consume: previewExecutionResultConsumerConsumption,
};
