import type { EdiObservationDomain } from "../adapters/ObservationAdapter";
import type { EdiExecutionRequest, EdiExecutionRequestMode } from "./executionRequestTypes";
import type { EdiExecutionResult } from "./executionResultTypes";

export type EdiExecutorCapability = {
  domain?: EdiObservationDomain;
  modes?: readonly EdiExecutionRequestMode[];
  description?: string;
  metadata?: Record<string, unknown>;
};

export type EdiExecutorExecution = (
  request: EdiExecutionRequest,
) => EdiExecutionResult | Promise<EdiExecutionResult>;

export type EdiExecutor = {
  id: string;
  name: string;
  capabilities?: readonly EdiExecutorCapability[];
  execute: EdiExecutorExecution;
};
