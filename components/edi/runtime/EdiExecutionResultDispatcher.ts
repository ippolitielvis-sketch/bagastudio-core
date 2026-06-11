import type { EdiExecutionResult } from "../core/executionResultTypes";
import type { EdiExecutionResultConsumerRegistry } from "./ExecutionResultConsumerRegistry";

export type DispatchEdiExecutionResultInput = {
  result: EdiExecutionResult;
  consumerRegistry: EdiExecutionResultConsumerRegistry;
};

export type EdiExecutionResultDispatcher = {
  dispatchResult(input: DispatchEdiExecutionResultInput): void;
};

export const createEdiExecutionResultDispatcher = (): EdiExecutionResultDispatcher => ({
  dispatchResult: ({ result, consumerRegistry }) => {
    const consumers = consumerRegistry.getConsumers();

    consumers.forEach((consumer) => {
      try {
        consumer.consume(result);
      } catch (error) {
        void error;
      }
    });
  },
});
