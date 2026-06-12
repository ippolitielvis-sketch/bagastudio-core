# EDI Execution Evolution Log

## Status

Foundation Complete.

This document records the chronological evolution of the EDI Execution Layer foundation built from RFC-1126 to RFC-1150.

It documents implemented foundation and wiring only. Integration with UI, Viewer, real engines, project mutation, command bus, or product workflows is not implemented in this layer.

## Scope

Covered RFC range:

- RFC-1126 to RFC-1182

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

## 10. Execution Result Consumer Foundation

RFC:

- RFC-1151

### Context

The execution runtime could produce `EdiExecutionResult`, but there was no official contract for result consumption.

### Problem

EDI needed a result consumption boundary without connecting to UI, Viewer, RuntimeHost, RuntimeLoop, event bus, or project mutation.

### Decision

Introduce `EdiExecutionResultConsumer`.

### Implementation

`EdiExecutionResultConsumer` defines:

- id;
- name;
- `consume(result)`.

The consume function receives `EdiExecutionResult` and returns `void`.

### Impact

EDI gained a neutral contract for future result consumption without implementing runtime integration.

### Permanent Rules Born

- Result consumption is modeled as a contract.
- Consumer does not imply UI.
- Consumer does not imply project mutation.
- Consumer does not imply runtime integration.

## 11. Preview Consumer Foundation

RFC:

- RFC-1152

### Context

The result consumer contract existed, but there was no concrete preview consumer.

### Problem

EDI needed a concrete consumer to validate the contract while remaining descriptive and side-effect free.

### Decision

Introduce `PreviewExecutionResultConsumer`.

### Implementation

`PreviewExecutionResultConsumer` implements `EdiExecutionResultConsumer` and provides a deterministic no-op consumption function.

### Impact

EDI gained a concrete preview consumer without side effects, UI wiring, runtime integration, or engine dependencies.

### Permanent Rules Born

- Preview consumer is side-effect free.
- Preview consumer does not mutate project state.
- Preview consumer does not publish events.
- Preview consumer does not integrate with UI or engines.

## 12. Consumer Registry Foundation

RFC:

- RFC-1153

### Context

The preview consumer existed, but there was no neutral registry for result consumers.

### Problem

EDI needed a deterministic registry for available consumers without executing them automatically.

### Decision

Introduce `ExecutionResultConsumerRegistry`.

### Implementation

`ExecutionResultConsumerRegistry` receives consumer instances, stores them in deterministic order, exposes all consumers, and supports lookup by id.

### Impact

EDI gained a stable registry for result consumers while keeping routing and execution separate.

### Permanent Rules Born

- Consumer registry does not consume results.
- Consumer registry does not route.
- Consumer registry does not rank.
- Consumer registry does not filter by custom logic.

## 13. Consumer Registry Population Foundation

RFC:

- RFC-1154

### Context

Consumer registry existed, but no official preview population point existed.

### Problem

EDI needed an official deterministic population point for preview result consumers.

### Decision

Introduce `PreviewExecutionResultConsumerRegistry`.

### Implementation

`PreviewExecutionResultConsumerRegistry` exports:

- `ediPreviewExecutionResultConsumers`
- `createEdiPreviewExecutionResultConsumerRegistry`

The current consumer list contains:

1. Preview Execution Result Consumer

### Impact

EDI gained an official populated registry for preview result consumers.

### Permanent Rules Born

- Consumer population is deterministic.
- Consumer population does not consume results.
- Consumer population does not route.
- Consumer population does not create integration.

## 14. Consumer Wiring Foundation

RFC:

- RFC-1155

### Context

The preview consumer registry population existed, but no official wiring factory existed for constructing the ready-to-use consumer registry.

### Problem

EDI needed a preview consumer wiring point without connecting it to `EdiExecutionRuntime`.

### Decision

Introduce `PreviewExecutionResultConsumerRuntime`.

### Implementation

`PreviewExecutionResultConsumerRuntime` constructs and returns a ready-to-use `EdiExecutionResultConsumerRegistry`.

It does not consume results.

### Impact

EDI gained consumer-side wiring while keeping runtime result integration deferred.

### Permanent Rules Born

- Consumer Wiring is not Runtime Integration.
- Consumer Wiring does not consume results automatically.
- Consumer Wiring does not connect to `EdiExecutionRuntime`.
- Consumer Wiring does not introduce UI, Viewer, RuntimeHost, RuntimeLoop, or engine dependencies.

## 15. Dispatcher Foundation

RFC:

- RFC-1157

### Context

Execution could produce results and the consumer registry could expose consumers, but no neutral dispatch layer existed between them.

### Problem

EDI needed a controlled way to pass an `EdiExecutionResult` to registered consumers without making `EdiExecutionRuntime` responsible for dispatch.

### Decision

Introduce `EdiExecutionResultDispatcher`.

### Implementation

`EdiExecutionResultDispatcher` receives:

- `EdiExecutionResult`
- `EdiExecutionResultConsumerRegistry`

It obtains consumers and invokes `consumer.consume(result)` in deterministic order.

### Impact

EDI gained a neutral dispatch boundary between result production and result consumption.

### Permanent Rules Born

- Runtime is not Dispatcher.
- Dispatcher is not Consumer Registry.
- Dispatcher does not route.
- Dispatcher does not rank.
- Dispatcher does not filter consumers.

## 16. Execution And Consumption Wiring Foundation

RFC:

- RFC-1159

### Context

Preview execution runtime, preview consumer registry, and result dispatcher existed separately.

### Problem

EDI needed a single preview wiring object that exposes all three components without executing or dispatching automatically.

### Decision

Introduce `PreviewExecutionAndConsumptionWiring`.

### Implementation

`PreviewExecutionAndConsumptionWiring` constructs and returns:

- `executionRuntime`
- `consumerRegistry`
- `executionResultDispatcher`

It does not receive request, execute request, dispatch result, or consume result.

### Impact

EDI gained a complete passive wiring point for preview execution and consumption.

### Permanent Rules Born

- Wiring Object is not Orchestrator.
- Wiring Object does not execute.
- Wiring Object does not dispatch.
- Wiring Object does not consume.
- Wiring Object does not introduce Integration.

## 17. Preview Integration Foundation

RFC:

- RFC-1161

### Context

Execution runtime, result dispatcher, consumer registry, and passive wiring existed as separate pieces.

### Problem

EDI needed a first explicit preview integration helper capable of running one execution request and dispatching the result without introducing orchestration, lifecycle, UI, Viewer, RuntimeHost, RuntimeLoop, or real engine integration.

### Decision

Introduce `runEdiPreviewExecutionAndDispatch`.

### Implementation

The helper receives:

- `EdiExecutionRequest`;
- `EdiExecutionRuntime`;
- `EdiExecutionResultDispatcher`;
- `EdiExecutionResultConsumerRegistry`.

It:

1. calls `executionRuntime.runExecution`;
2. calls `executionResultDispatcher.dispatchResult`;
3. returns `EdiExecutionResult`.

### Impact

EDI gained the first controlled preview integration flow:

```text
Execution
-> Consumption
-> Preview Integration
```

Real Integration remains not implemented.

### Permanent Rules Born

- Helper Integration is not Orchestrator.
- Helper Integration is explicit and caller-driven.
- Helper Integration does not create components.
- Helper Integration does not own state.
- Helper Integration is not real integration.

## 18. Integration Boundary Foundation

RFC:

- RFC-1163
- RFC-1164
- RFC-1165
- RFC-1166
- RFC-1167
- RFC-1168
- RFC-1169
- RFC-1170
- RFC-1171
- RFC-1172
- RFC-1173
- RFC-1174
- RFC-1175
- RFC-1176
- RFC-1177
- RFC-1178
- RFC-1179
- RFC-1180
- RFC-1181
- RFC-1182

### Context

EDI had preview integration through an explicit helper, but no architectural boundary existed between preview integration and a future real runtime integration.

### Problem

The project needed a boundary that protects RuntimeHost, RuntimeLoop, Execution, Consumption, and Preview Integration from premature coupling.

### Decision

Introduce `EdiIntegrationBoundary`.

### Implementation

`EdiIntegrationBoundary` exports:

- `createEdiIntegrationBoundaryRequest`;
- `validateEdiIntegrationBoundaryRequest`.

It validates an `EdiExecutionRequest` minimally:

- request present;
- request id present;
- mode present;
- target domain present.

### Impact

EDI gained a non-invasive boundary before future real integration work.

The boundary does not run real integration, does not connect to RuntimeHost, does not connect to RuntimeLoop, and does not import real engines.

RFC-1164 clarified placement without adding operational wiring: the boundary must stay before runtime.

It may be called by Preview Integration and future integration adapters, but not by RuntimeHost, RuntimeLoop, Executor, or Consumer.

RFC-1165 connected Preview Integration to the boundary.

`runEdiPreviewExecutionAndDispatch` now validates the request through `createEdiIntegrationBoundaryRequest` before calling execution runtime. Boundary validation failures produce a controlled failed `EdiExecutionResult` and are dispatched through the existing dispatcher.

RFC-1166 clarified boundary failure semantics.

Boundary failure is pre-runtime. Current boundary errors are terminal: `missing-request`, `missing-request-id`, `missing-request-mode`, and `missing-request-domain`.

`missing-request-domain` may become recoverable only in a future RFC with an explicit adapter capable of inferring `targetDomain`.

RFC-1167 introduced the Real Producer Adapter Foundation.

`EdiProducerAdapter` defines a neutral contract for future source adapters that may prepare data compatible with future `EdiExecutionRequest` creation before crossing `EdiIntegrationBoundary`.

No real Import, Recognition, Viewer, Pricing, Factory, Layout, or Join producer was introduced.

RFC-1168 clarified the producer adapter to boundary contract.

Producer adapters produce `executionRequestInput`. Future callers may use that input with `createEdiExecutionRequest`, and the resulting request must cross `EdiIntegrationBoundary` before runtime.

RFC-1169 introduced the Producer Adapter Request Factory.

`createEdiExecutionRequestFromProducerAdapterOutput` converts `EdiProducerAdapterOutput` into `EdiExecutionRequest` using the existing `createEdiExecutionRequest` path.

The factory does not call RuntimeHost, RuntimeLoop, Executor, Consumer, real engines, Preview Integration, or Integration Boundary.

RFC-1170 introduced the Producer Adapter Boundary Pipeline.

`createEdiProducerAdapterBoundaryPipelineResult` composes adapter output, request factory, and boundary validation. It returns a validated request when valid, or validation issues when invalid.

The pipeline is pre-runtime and does not execute, dispatch, consume, recover, infer `targetDomain`, or call real engines.

RFC-1171 selected the first planned concrete producer adapter.

The next producer candidate is Recognition Producer Adapter Foundation. It is preferred because Recognition is close to EDI cognitive semantics and can start as a controlled adapter foundation.

Import and Viewer producers are deferred because they risk pulling parsing, geometry, scene graph, model normalization, UI state integration, or product runtime ownership too early.

RFC-1172 introduced the Recognition Producer Adapter Foundation.

`recognitionProducerAdapter` is the first concrete producer adapter foundation. It produces `EdiProducerAdapterOutput` for the recognition domain and remains compatible with the pre-runtime pipeline.

It does not call recognition runtime, analyze geometry, inspect scenes, trigger cognitive reasoning, execute runtime, dispatch results, or call real engines.

RFC-1173 introduced the Recognition Producer Boundary Pipeline.

`createRecognitionProducerBoundaryPipelineResult` composes `createRecognitionProducerAdapterOutput` with `createEdiProducerAdapterBoundaryPipelineResult`.

It returns the existing boundary pipeline result, not an execution result.

It does not call runtime, dispatch, executor, consumer, recognition runtime, geometry recognition, scene recognition, cognitive reasoning, or real engines.

RFC-1174 validated the Recognition Producer pre-runtime flow.

The repository does not currently expose a dedicated test script or established TS test pattern for this layer, so no new test framework was introduced.

The validation is recorded as an official checklist: minimal recognition input, adapter output, boundary pipeline result, successful boundary validation, request presence on success, no execution result, no runtime call, no dispatch, and no real recognition.

RFC-1175 defined the future Recognition runtime entry point.

The Recognition Producer must not call runtime directly. A future `Recognition Runtime Adapter` will be the separate layer allowed to receive a boundary-valid `EdiExecutionRequest`, call only the appropriate `EdiExecutionRuntime`, and return `EdiExecutionResult`.

The future adapter must not dispatch, call RuntimeHost, call RuntimeLoop, own real recognition logic, analyze geometry, manipulate scene graph, or introduce `runRealIntegration`.

RFC-1176 introduced the Recognition Runtime Adapter Foundation.

`runRecognitionRuntimeAdapter` receives a boundary-valid `EdiExecutionRequest` and an injected `EdiExecutionRuntime`, calls `executionRuntime.runExecution({ request })`, and returns `EdiExecutionResult`.

It does not dispatch, call Consumer, call RuntimeHost, call RuntimeLoop, analyze geometry, inspect scenes, perform real recognition, or introduce `runRealIntegration`.

RFC-1177 defined the future recognition result exposure boundary.

`RecognitionRuntimeAdapter` returns `EdiExecutionResult`, but it must not expose results directly to Viewer, UI, RuntimeHost, RuntimeLoop, or product workflows.

The next planned layer is `Recognition Result Adapter`, which will receive `EdiExecutionResult` and transform it into an observable recognition result shape without rendering, UI wiring, dispatch, runtime mutation, or real recognition.

RFC-1178 introduced the Recognition Result Adapter Foundation.

`createRecognitionObservableResult` receives `EdiExecutionResult` and produces `RecognitionObservableResult`.

The observable result preserves execution result id, execution request id, timestamp, mode, status, executor id, metadata, and the original execution result.

It does not render UI, wire Viewer, dispatch globally, mutate runtime, call RuntimeHost, call RuntimeLoop, perform real recognition, analyze geometry, or inspect scenes.

RFC-1179 defined the future Recognition Observable Flow.

The documented flow is Recognition Input, Recognition Producer Adapter, Recognition Boundary Pipeline, Recognition Runtime Adapter, Recognition Result Adapter, and Recognition Observable Result.

The flow must remain a controlled helper, not Viewer integration, UI, global dispatch, real recognition, geometry recognition, scene recognition, RuntimeHost wiring, or RuntimeLoop wiring.

The next planned RFC is `RFC-1180 - First Observable Recognition Flow Foundation`.

RFC-1180 introduced the First Observable Recognition Flow Foundation.

`runRecognitionObservableFlow` receives `RecognitionProducerAdapterInput` and an injected `EdiExecutionRuntime`.

The helper uses `createRecognitionProducerBoundaryPipelineResult`, stops with a controlled `boundary-invalid` result when boundary validation fails, calls `runRecognitionRuntimeAdapter` only when validation succeeds, then creates `RecognitionObservableResult` through `createRecognitionObservableResult`.

The flow does not dispatch globally, render UI, wire Viewer, call RuntimeHost, call RuntimeLoop, call Consumer, perform real recognition, analyze geometry, or inspect scenes.

RFC-1181 reviewed the Observable Recognition Flow.

The review confirmed that boundary failure does not call runtime, validation success calls `RecognitionRuntimeAdapter`, `RecognitionResultAdapter` produces `RecognitionObservableResult`, the observable result is not UI, the flow does not call Viewer, RuntimeHost, RuntimeLoop, or global dispatch.

The post-review state is: First Observable Recognition Flow reviewed, EDI observable foundation complete enough for next planning, Viewer exposure requires a dedicated RFC, and GitHub/local remote synchronization requires a dedicated verification before push.

RFC-1182 planned future Viewer exposure through an EDI View Model Snapshot.

The planned path is RecognitionObservableResult, EDI View Model Snapshot, Viewer.

The Viewer must not read `RecognitionObservableResult` directly, call `runRecognitionObservableFlow`, know `EdiExecutionRuntime`, RuntimeHost, or RuntimeLoop.

The View Model Snapshot is planned as immutable, not live state. It must remain separate from Recognition-specific flow logic and must be extensible to recognition, memory, reasoning, feedback, and planning.

The next planned RFC is `RFC-1183 - EDI View Model Snapshot Foundation`.

### Permanent Rules Born

- Integration Boundary is not Real Integration.
- Integration Boundary does not import RuntimeHost.
- Integration Boundary does not import RuntimeLoop.
- Integration Boundary does not import engine runtimes.
- Integration Boundary validates without mutating request.
- Integration Boundary stays before Runtime.
- RuntimeHost and RuntimeLoop receive already validated requests.
- Preview Integration calls Integration Boundary before execution runtime.
- Boundary failure returns a controlled execution result.
- Boundary Failure is Pre-Runtime.
- Boundary Failure is not Executor Failure.
- Boundary Failure does not infer targetDomain.
- Producer Adapter is not Real Engine.
- Producer Adapter stays before Integration Boundary.
- Producer Adapter does not call RuntimeHost or RuntimeLoop.
- Producer Adapter produces request input.
- Producer Adapter does not call Executor or Consumer.
- Requests produced from adapter input must cross Integration Boundary.
- Producer Adapter Request Factory converts adapter output to request.
- Producer Adapter Request Factory does not call Boundary or Runtime.
- Producer Adapter Boundary Pipeline is pre-runtime.
- Producer Adapter Boundary Pipeline does not execute or dispatch.
- Producer Adapter Boundary Pipeline does not infer targetDomain.
- First concrete producer candidate is Recognition.
- Recognition Producer must remain foundation-only.
- Import and Viewer producers remain deferred.
- Recognition Producer Adapter Foundation exists.
- Recognition Producer Adapter is not real recognition.
- Recognition Producer Adapter does not execute or dispatch.
- Recognition Producer Boundary Pipeline is pre-runtime.
- Recognition Producer Boundary Pipeline returns boundary validation, not execution result.
- Recognition Producer Pipeline Validation is documentation-backed until a project test pattern exists.
- Boundary-valid request is not execution.
- Recognition Producer does not call runtime directly.
- Recognition Runtime Adapter is the future runtime entry point.
- Recognition Runtime Adapter must not dispatch.
- Recognition Runtime Adapter receives boundary-valid requests only.
- Recognition Runtime Adapter uses injected EdiExecutionRuntime.
- Recognition Runtime Adapter returns EdiExecutionResult.
- Recognition Runtime Adapter does not expose results directly to Viewer.
- Recognition Result Adapter is the future result exposure boundary.
- Recognition Result Adapter produces observable data, not UI.
- Recognition Result Adapter does not dispatch.
- Recognition Observable Flow is helper-driven.
- Recognition Observable Flow is not Viewer integration.
- Recognition Observable Result is not UI.
- Recognition Observable Flow handles boundary failure without runtime execution.
- Recognition Observable Flow returns observable data, not UI.
- First Observable Recognition Flow is reviewed.
- Viewer exposure requires a dedicated RFC.
- Push/remoto requires dedicated verification.
- Viewer reads View Model Snapshot, not RecognitionObservableResult.
- EDI View Model Snapshot is immutable, not live state.
- View Model does not render UI.

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
- preview execution runtime wiring;
- execution result consumer contract;
- preview execution result consumer;
- execution result consumer registry;
- preview consumer registry population;
- preview consumer wiring;
- execution result dispatcher;
- preview execution and consumption wiring;
- preview execution and dispatch helper;
- integration boundary.
- producer adapter contract.

Documented placement:

- integration boundary sits before runtime;
- Preview Integration may call it;
- future Real Producer Adapters may call it;
- future Import/Recognition Integration Adapters may call it;
- future Viewer Integration Adapters may call it;
- RuntimeHost, RuntimeLoop, Executor, and Consumer do not call it directly.

Implemented preview wiring:

- `runEdiPreviewExecutionAndDispatch` calls the boundary before execution runtime;
- boundary-valid requests continue through the existing execution and dispatch flow;
- boundary-invalid requests produce a failed `EdiExecutionResult`;
- boundary-invalid requests are classified as pre-runtime failures;
- no RuntimeHost, RuntimeLoop, Executor, Consumer, Viewer, UI, or engine real integration was added.

Implemented producer adapter foundation:

- `EdiProducerAdapter` contract exists;
- `EdiProducerAdapterOutput.executionRequestInput` is compatible with future `createEdiExecutionRequest` usage;
- `createEdiExecutionRequestFromProducerAdapterOutput` converts adapter output into `EdiExecutionRequest`;
- `createEdiProducerAdapterBoundaryPipelineResult` converts adapter output into boundary validation result;
- no concrete real producer exists;
- `recognitionProducerAdapter` exists as foundation output producer;
- `createRecognitionProducerBoundaryPipelineResult` exists as pre-runtime boundary pipeline helper;
- Recognition Producer Pipeline Validation is documented as a checklist;
- `runRecognitionRuntimeAdapter` exists as the Recognition Runtime Adapter foundation;
- `createRecognitionObservableResult` exists as the Recognition Result Adapter foundation;
- `runRecognitionObservableFlow` exists as the first observable recognition flow foundation;
- First Observable Recognition Flow is reviewed;
- EDI observable foundation is complete enough for next planning;
- Viewer exposure is planned through EDI View Model Snapshot;
- no producer is wired operationally to runtime or dispatch;
- no RuntimeHost, RuntimeLoop, Executor, Consumer, Viewer, UI, or engine real integration was added.

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
- automatic result consumption;
- runtime result integration;
- automatic execution and dispatch orchestration;
- real integration with UI, Viewer, RuntimeHost, RuntimeLoop, cognitive runtime, or real engines;
- Viewer exposure;
- EDI View Model Snapshot;
- GitHub/local remote synchronization after this phase;
- `runRealIntegration`.

The current layer is safe for architectural validation and future integration planning. It is not a real operational execution system yet.
