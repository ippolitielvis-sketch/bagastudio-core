import type { EdiExecutionResultConsumer } from "../core/executionResultConsumerTypes";

export type CreateEdiExecutionResultConsumerRegistryInput = {
  consumers?: readonly EdiExecutionResultConsumer[];
};

export type EdiExecutionResultConsumerRegistry = {
  getConsumers(): readonly EdiExecutionResultConsumer[];
  getConsumerById(id: string): EdiExecutionResultConsumer | undefined;
};

export const createEdiExecutionResultConsumerRegistry = (
  input: CreateEdiExecutionResultConsumerRegistryInput = {},
): EdiExecutionResultConsumerRegistry => {
  const consumers = [...(input.consumers ?? [])];

  const getConsumers = (): readonly EdiExecutionResultConsumer[] => [...consumers];

  const getConsumerById = (id: string): EdiExecutionResultConsumer | undefined =>
    consumers.find((consumer) => consumer.id === id);

  return {
    getConsumers,
    getConsumerById,
  };
};
