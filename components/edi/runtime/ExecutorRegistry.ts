import type { EdiObservationDomain } from "../adapters/ObservationAdapter";
import type { EdiExecutor } from "../core/executorTypes";
import type { EdiExecutionRequestMode } from "../core/executionRequestTypes";

export type CreateEdiExecutorRegistryInput = {
  executors?: readonly EdiExecutor[];
};

export type FindEdiExecutorsInput = {
  domain?: EdiObservationDomain;
  mode?: EdiExecutionRequestMode;
};

export type EdiExecutorRegistry = {
  getExecutors(): readonly EdiExecutor[];
  getExecutorById(id: string): EdiExecutor | undefined;
  findExecutors(input: FindEdiExecutorsInput): readonly EdiExecutor[];
};

export const createEdiExecutorRegistry = (
  input: CreateEdiExecutorRegistryInput = {},
): EdiExecutorRegistry => {
  const executors = [...(input.executors ?? [])];

  const getExecutors = (): readonly EdiExecutor[] => [...executors];

  const getExecutorById = (id: string): EdiExecutor | undefined =>
    executors.find((executor) => executor.id === id);

  const findExecutors = (findInput: FindEdiExecutorsInput): readonly EdiExecutor[] => {
    if (!findInput.domain && !findInput.mode) {
      return getExecutors();
    }

    return executors.filter((executor) =>
      executor.capabilities?.some((capability) => {
        const matchesDomain = !findInput.domain || capability.domain === findInput.domain;
        const matchesMode = !findInput.mode || capability.modes?.includes(findInput.mode) === true;

        return matchesDomain && matchesMode;
      }) === true,
    );
  };

  return {
    getExecutors,
    getExecutorById,
    findExecutors,
  };
};
