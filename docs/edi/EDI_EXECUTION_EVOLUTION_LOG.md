# EDI Execution Evolution Log

## Status

Foundation Complete.

This document records the chronological evolution of the EDI Execution Layer foundation built from RFC-1126 to RFC-1150.

It documents implemented foundation and wiring only. Integration with UI, Viewer, real engines, project mutation, command bus, or product workflows is not implemented in this layer.

## Scope

Covered RFC range:

- RFC-1126 to RFC-1150

Architecture distinction:

- Foundation: contracts, descriptors, builders, preview executors.
- Wiring: construction of already implemented pieces.
- Integration: product or engine connection, not yet implemented.

## 1. Cognitive Activation Foundation

RFC range:

- RFC-1126 to RFC-1128

### Context

The EDI runtime already had cognitive state and observation foundations, but producer/runtime activation still received cognitive state externally.

### Problem

EDI needed a controlled way to read current cognitive state and compose an activation context without introducing subscriptions, lifecycle automation, or runtime side effects.

### Decision

Introduce:

- `CognitiveStateRuntime`
- `EdiCognitiveActivationContext`
- `CognitiveActivationContextBuilder`

### Implementation

`CognitiveStateRuntime` reads state through `getCurrentState`.

`EdiCognitiveActivationContext` stores cognitive state, observations, optional memory snapshot, and metadata.

`CognitiveActivationContextBuilder` composes the current cognitive state with externally provided observations and memory snapshot.

### Impact

EDI gained a stable activation boundary before Intent and Action.

### Permanent Rules Born

- Cognitive activation is pull-based.
- No automatic subscriptions.
- No project event publishing.
- Activation Context is data, not behavior.
- Memory is passed as snapshot, not mutable runtime reference.

## 2. Intent Foundation

RFC range:

- RFC-1129 to RFC-1130

### Context

After activation context existed, EDI needed a semantic intermediate before any action descriptor.

### Problem

The system needed to represent intent without introducing execution, command handling, classifier logic, or AI-driven inference.

### Decision

Introduce:

- `EdiIntent`
- `IntentBuilder`

### Implementation

`EdiIntent` stores context reference, cognitive state snapshot, kind, confidence, priority, optional domain, reason, explanation, and metadata.

`IntentBuilder` creates intents from activation context using explicit caller-provided inputs.

### Impact

EDI gained a stable semantic contract between activation context and future action.

### Permanent Rules Born

- Intent is not Action.
- Intent is not a command.
- Intent contains `contextId`, not the full context.
- Intent creation remains input-driven.
- No classifier or AI/LLM inference in the foundation.

## 3. Action Foundation

RFC range:

- RFC-1131 to RFC-1132

### Context

With Intent available, EDI needed a non-executable action descriptor that could prepare future execution without mutating the project.

### Problem

Action terminology can easily imply operation. The foundation needed to prevent Action from becoming an executor, handler, callback, or command bus entry.

### Decision

Introduce:

- `EdiAction`
- `ActionBuilder`

### Implementation

`EdiAction` stores intent id, context id, kind, status, priority, confidence, optional target domain, optional descriptive payload, reason, explanation, and metadata.

`ActionBuilder` creates action descriptors from intents.

### Impact

EDI gained a serializable descriptor for possible future action while keeping execution separate.

### Permanent Rules Born

- Action is non-executable.
- Action must contain `intentId` and `contextId`.
- Payload is descriptive, not a command.
- No executor, handler, callback, or command bus in Action.
- No project mutation in Action foundation.

## 4. Execution Model Foundation

RFC range:

- RFC-1133 to RFC-1137

### Context

Intent and Action existed, but EDI still needed the intermediate execution model before an executor could consume anything.

### Problem

The system needed request/result contracts without introducing actual execution, executable steps, or engine operations.

### Decision

Introduce:

- `EdiExecutionPlan`
- `EdiExecutionRequest`
- `EdiExecutionResult`
- `EdiExecutor`
- `ExecutionRequestBuilder`

### Implementation

`EdiExecutionPlan` stores action, intent, and context ids.

`EdiExecutionRequest` stores plan reference, ids, mode, status, priority, optional target domain, and descriptive payload.

`EdiExecutionResult` stores request, plan, action, intent, and context references with result status and optional output/error/diagnostics.

`EdiExecutor` defines the request-to-result contract.

`ExecutionRequestBuilder` builds execution requests from plans.

### Impact

EDI gained a complete non-operational execution data model.

### Permanent Rules Born

- Execution Plan has no executable steps.
- Execution Request is not execution.
- Execution Result is a descriptor.
- Executor contract consumes request and returns result.
- Request builder does not infer mode or validate readiness.

## 5. Execution Discovery Foundation

RFC range:

- RFC-1138 to RFC-1139

### Context

With executor contract defined, EDI needed a way to locate executor candidates without hardcoding or executing them.

### Problem

Discovery needed to stay separate from execution and avoid ranking, validation, plugin system, or mutable registry lifecycle.

### Decision

Introduce:

- `ExecutorRegistry`
- `ExecutorSelector`

### Implementation

`ExecutorRegistry` stores executors received from outside and supports lookup by id, domain, and mode.

`ExecutorSelector` receives a request and registry, then returns executor candidates based on target domain and mode.

### Impact

EDI gained deterministic executor discovery while keeping selection and execution separated.

### Permanent Rules Born

- Registry does not execute.
- Registry does not rank.
- Registry is static in the foundation.
- Selector returns candidates.
- Selector does not call `execute`.
- No fallback, scoring, `canExecute`, or validation.

## 6. Preview Executor Foundation

RFC range:

- RFC-1141 to RFC-1147

### Context

The contract and discovery layers existed, but there were no concrete executors to validate the model.

### Problem

EDI needed concrete executors without introducing real engine execution or project mutation.

### Decision

Introduce preview executors for:

- Import
- Recognition
- Layout
- Join
- Pricing
- Factory

### Implementation

Created:

- `importPreviewExecutor`
- `recognitionPreviewExecutor`
- `layoutPreviewExecutor`
- `joinPreviewExecutor`
- `pricingPreviewExecutor`
- `factoryPreviewExecutor`

Each executor implements `EdiExecutor`, supports `plan`, `preview`, and `dry-run`, consumes `EdiExecutionRequest`, and produces `EdiExecutionResult` via `createEdiExecutionResult`.

### Impact

EDI gained a full catalog of read-only preview executors across all current domains.

### Permanent Rules Born

- Preview executors are descriptive.
- Preview executors are read-only.
- Preview executors are side-effect free.
- Preview executors do not call real engines.
- `succeeded` means preview descriptor produced, not real operation completed.

## 7. Execution Runtime Foundation

RFC:

- RFC-1143

### Context

Executors, selector, and registry existed, but there was no neutral runtime orchestrator.

### Problem

EDI needed an official runtime capable of receiving a request, selecting an executor, invoking it, and always returning a result.

### Decision

Introduce `EdiExecutionRuntime`.

### Implementation

`EdiExecutionRuntime` receives `EdiExecutionRequest`, uses `EdiExecutorSelector`, invokes the first candidate executor, and returns `EdiExecutionResult`.

Failure paths are controlled:

- no executor found;
- executor throws;
- async executor returned.

### Impact

EDI gained a neutral execution orchestrator without domain-specific logic.

### Permanent Rules Born

- Runtime execution is neutral.
- Runtime execution has no engine dependencies.
- Runtime execution returns controlled failures.
- Runtime execution is not a queue or event bus.
- Async execution is not part of the foundation.

## 8. Registry Population Foundation

RFC:

- RFC-1149

### Context

Preview executors existed individually, but no official populated registry was available.

### Problem

The system needed a deterministic point of registry population without ranking, filters, or domain-specific policy.

### Decision

Introduce `PreviewExecutorRegistry`.

### Implementation

`PreviewExecutorRegistry` exports:

- `ediPreviewExecutors`
- `createEdiPreviewExecutorRegistry`

The executor order is:

1. Import
2. Recognition
3. Layout
4. Join
5. Pricing
6. Factory

### Impact

EDI gained an official registry population point for all preview executors.

### Permanent Rules Born

- Registry population is deterministic.
- Registry population does not rank.
- Registry population does not filter.
- Registry population does not create product integration.

## 9. Runtime Wiring Foundation

RFC:

- RFC-1150

### Context

Registry population, selector, and execution runtime existed separately.

### Problem

The preview execution runtime needed an official construction point that wires the pieces together without activating product behavior.

### Decision

Introduce `PreviewExecutionRuntime`.

### Implementation

`PreviewExecutionRuntime` builds:

- populated preview executor registry;
- executor selector;
- execution runtime.

It returns a ready-to-use preview execution runtime.

### Impact

EDI gained execution wiring that is ready for future controlled integration.

### Permanent Rules Born

- Wiring is not Integration.
- Wiring does not execute automatically.
- Wiring does not subscribe to events.
- Wiring does not connect to UI, Viewer, RuntimeHost, RuntimeLoop, or real engines.

## Current State

The EDI Execution Layer has reached Foundation Complete status.

Implemented today:

- cognitive activation foundation;
- intent foundation;
- action foundation;
- execution plan, request, and result model;
- executor contract;
- executor registry;
- executor selector;
- neutral execution runtime;
- six preview executors;
- preview executor registry population;
- preview execution runtime wiring.

Not implemented today:

- UI integration;
- Viewer integration;
- cognitive runtime integration;
- real engine execution;
- project mutation;
- command bus;
- plugin system;
- async queue;
- product workflow activation.

The current layer is safe for architectural validation and future integration planning. It is not a real operational execution system yet.
