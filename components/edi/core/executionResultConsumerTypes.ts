import type { EdiExecutionResult } from "./executionResultTypes";

export type EdiExecutionResultConsumerConsumption = (
  result: EdiExecutionResult,
) => void;

export type EdiExecutionResultConsumer = {
  id: string;
  name: string;
  consume: EdiExecutionResultConsumerConsumption;
};
