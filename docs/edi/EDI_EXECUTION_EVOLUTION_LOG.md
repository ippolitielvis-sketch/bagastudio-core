# EDI Execution Evolution Log

## Status

Foundation Complete.

This document records the chronological evolution of the EDI Execution Layer foundation built from RFC-1126 to RFC-1209.

It documents implemented foundation and wiring only. Integration with UI, Viewer, real engines, project mutation, command bus, or product workflows is not implemented in this layer.

## Scope

Covered RFC range:

- RFC-1126 to RFC-1209

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
- RFC-1183
- RFC-1184
- RFC-1185
- RFC-1186
- RFC-1187
- RFC-1188
- RFC-1189
- RFC-1190
- RFC-1191
- RFC-1191B
- RFC-1192
- RFC-1193
- RFC-1194
- RFC-1195
- RFC-1196
- RFC-1197
- RFC-1198
- RFC-1199

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

RFC-1183 introduced the EDI View Model Snapshot Foundation.

`createEdiViewModelSnapshotFromRecognitionObservableResult` receives `RecognitionObservableResult` and produces `EdiViewModelSnapshot` with a recognition section.

The snapshot preserves id, timestamp, execution result id, execution request id, mode, status, and metadata useful for future Viewer reading.

It does not call Viewer, render UI, use React state, call runtime, dispatch globally, mutate project state, or contain real recognition logic.

RFC-1184 validated the EDI View Model Snapshot as the correct boundary between EDI observable results and future Viewer exposure.

The review confirmed data sufficiency for a first Viewer-readable snapshot, no excessive exposure of the original execution result object, snapshot-oriented immutability, and independence from React, Viewer, RuntimeHost, RuntimeLoop, Executor, Consumer, dispatch, and runtime.

No type changes were required. Memory, reasoning, feedback, and planning remain future View Model sections.

The next planned RFC is `RFC-1185 - Viewer Exposure Foundation`.

RFC-1185 introduced the Viewer Exposure Foundation.

`createEdiViewerExposureFromSnapshot` receives `EdiViewModelSnapshot` and produces `EdiViewerExposure` as a Viewer-friendly data shape.

The exposure preserves id, timestamp, recognition status, recognition mode, execution result id, execution request id, and metadata useful for future Viewer reading.

It does not connect real Viewer components, render UI, use React state, call runtime, call RuntimeHost, call RuntimeLoop, call EdiExecutionRuntime, dispatch globally, or contain real recognition logic.

RFC-1186 reviewed the full EDI Observable Stack.

The reviewed stack is Recognition Producer Adapter, Recognition Boundary Pipeline, Recognition Runtime Adapter, Recognition Result Adapter, Recognition Observable Result, EdiViewModelSnapshot, and EdiViewerExposure.

The review confirmed that RuntimeHost, RuntimeLoop, Viewer, Execution Runtime, and Recognition remain separated. The Observable Result to ViewModel boundary and the ViewModel to Viewer Exposure boundary are correct.

Stable foundations include Integration Boundary, Producer Adapter contract, Request Factory, Boundary Pipeline, Recognition producer/runtime/result/observable flow, View Model Snapshot, and Viewer Exposure.

Provisional foundations include diagnostics, traceability, boundary fallback depth, recognition-only View Model content, data-only Viewer Exposure, and absent automated tests.

The stack is ready for BagaStudio integration planning and future Viewer Exposure planning, but not for direct Viewer/UI integration. Memory/Reasoning integration is ready for architecture planning, not runtime wiring.

The next recommended RFC is `RFC-1187 - BagaStudio Integration Planning`.

RFC-1187 planned how the reviewed EDI Observable Stack should enter BagaStudio.

The decision is that EDI enters BagaStudio as an observable and consultable capability, not as a direct Viewer controller.

`EdiViewerExposure` remains the EDI-side boundary. A future BagaStudio EDI Presentation Adapter should translate this exposure into a BagaStudio-presentable shape before any Viewer or UI consumer reads it.

The Viewer must not call Recognition Observable Flow, Recognition Runtime Adapter, EdiExecutionRuntime, RuntimeHost, or RuntimeLoop. It must not read RecognitionObservableResult directly and must not own EDI lifecycle.

The first safe BagaStudio integration is a passive presentation adapter that receives `EdiViewerExposure`, produces a BagaStudio-readable presentation model, and does not render UI, create React state, dispatch globally, mutate Project/Product state, or connect real engines.

The next recommended RFC is `RFC-1188 - BagaStudio EDI Presentation Adapter Review`.

RFC-1188 defined the role of the future BagaStudio EDI Presentation Adapter.

The planned flow is `EdiViewerExposure`, BagaStudio EDI Presentation Adapter, BagaStudio Presentation Model, and Viewer.

The review clarified the difference between EDI View Model, Viewer Exposure, and BagaStudio Presentation Model. EDI owns observable results, View Model Snapshot, and Viewer Exposure. BagaStudio owns the Presentation Adapter and Presentation Model. Viewer remains a future presentation consumer, not a direct EDI consumer.

The Viewer must not read `EdiViewerExposure` directly because that would expose EDI contracts, bypass BagaStudio ownership, and risk coupling UI evolution to EDI internals.

Memory, Reasoning, Feedback, and Planning should follow the same adapter boundary in future RFCs.

The next recommended RFC is `RFC-1189 - BagaStudio EDI Presentation Model Foundation`.

RFC-1189 introduced the BagaStudio Presentation Model Foundation.

`createBagaStudioPresentationModelFromEdiViewerExposure` receives `EdiViewerExposure` and produces `BagaStudioPresentationModel`.

The model contains an `edi` section with source exposure id, timestamp, recognition status and mode when present, and metadata useful for future presentation.

This model is BagaStudio-owned data. It is not Viewer UI, not React state, not runtime wiring, and not real recognition.

No RuntimeHost, RuntimeLoop, Executor, Consumer, PreviewExecutionAndDispatch, Viewer, UI, dispatch, or engine real integration was introduced.

RFC-1190 reviewed integration readiness after the bridge from EDI Observable Stack to `EdiViewerExposure` to `BagaStudioPresentationModel`.

The review confirmed that EDI Observable Stack is stable enough for planning, and that `BagaStudioPresentationModel` is a correct BagaStudio-side boundary.

The review also confirmed that real Viewer wiring is not ready yet. Missing pieces include presentation adapter behavior, Viewer-facing consumption contract, UI ownership rules, React state strategy if any, and a validation pattern for presentation data.

Before operational BagaStudio work, the recommended next phase is sync/push review. BagaStudio operational planning should follow that verification, and Viewer exposure wiring should remain behind a dedicated RFC.

RFC-1191 planned the operational return to BagaStudio after the EDI Observable Stack was completed and pushed.

The review concluded that the next operational area is not Viewer UI. The next boundary to review is Product State / Presentation Boundary.

The existing BagaStudio Viewer surface is stateful and already owns scene, import, product package, runtime metadata, panels, and controls. Connecting EDI directly to it would risk making Viewer the owner of EDI.

The recommended next RFC is `RFC-1192 - BagaStudio Product State Boundary Review`.

RFC-1191B defined the strategic role of EDI in the BagaStudio ecosystem.

The decision is that EDI is not only recognition. EDI is a permanent support intelligence for user, product, production, documentation, business, and company memory.

EDI is composed of Observation Layer, Proposal Layer, Validation Support Layer, Optimization Layer, Memory Layer, and Business Intelligence Layer.

EDI is not Source of Truth. Product Package, Project State, and validated system data remain authoritative.

EDI may observe, understand, remember, propose, create, validate, and optimize, but its proposals must pass explicit validation before becoming product, project, production, or business state.

RFC-1192 defined the BagaStudio Product State Boundary.

The decision is that Product Package owns product meaning, Project State owns project state, and validated system data remains operational authority.

EDI is the observation, memory, proposal, and optimization layer. It does not mutate Product Package or Project State directly.

BagaStudio owns validation and mutation. Viewer is presentation. Factory is production and consumes validated data only.

The next recommended RFC is `RFC-1193 - BagaStudio Product State Integration Planning`.

RFC-1193 planned Product Package and EDI integration while preserving RFC-1192 ownership rules.

The planned Observation Path is Product Package, Product Package Observation Adapter, and EDI.

The planned Proposal Path is EDI, Proposal, BagaStudio Validation Layer, BagaStudio Mutation Layer, and Product Package.

The planned Presentation Path is Product Package, BagaStudioPresentationModel, and Viewer.

The decision is that Product Package enters EDI only through an adapter, EDI proposals enter mutation only through validation, and Presentation Model remains non-authoritative.

The next recommended RFC is `RFC-1194 - Product Package Observation Adapter Review`.

RFC-1194 defined the future Product Package Observation Adapter as a read-only observation boundary.

The planned path is Product Package, Product Package Observation Adapter, Product Package Observation Snapshot, and EDI Observation / Memory / Proposal / Optimization.

The adapter may observe selected product identity, schema/version, source format, dimensions, footprint, component identifiers, component counts, materials, finishes, LED metadata, insert metadata, validation/report metadata, validated production readiness metadata, timestamps, and traceability identifiers.

The adapter must not expose mutable Product Package references, live Viewer scene objects, `userData` mutation handles, window/global helpers, raw parser internals, unvalidated geometry mutation data, Factory executable instructions, or customer/private/business data not explicitly selected for observation.

The decision is that Product Package Observation Adapter produces read-only snapshots only. It does not mutate Product Package, call Mutation Layer, call Viewer, call Factory, call runtime, create proposal, validate product changes, or execute EDI.

The snapshot can later feed Memory, Proposal, and Optimization as evidence, but any resulting proposal still requires BagaStudio Validation Layer before Mutation Layer.

The next recommended RFC is `RFC-1195 - Product Package Observation Snapshot Foundation`.

RFC-1195 introduced `ProductPackageObservationSnapshot` as the first concrete data contract between Product Package and EDI.

The snapshot is read-only, immutable-style, and serializable. It stores stable id, timestamp, optional productPackageId, optional productPackageVersion, schema, sourceFormat, status, dimension summary, footprint summary, component ids, component count, component summaries, material summaries, finish summaries, and traceability metadata.

The factory `createProductPackageObservationSnapshot` creates the snapshot and defensively copies arrays and metadata without calling Product Package, RuntimeHost, RuntimeLoop, Viewer, Factory, React, Mutation Layer, or Proposal Layer.

RFC-1195 does not introduce the operational Product Package Observation Adapter. It only creates the snapshot foundation that the future adapter will produce.

The snapshot may later feed Memory, Reasoning, Proposal, and Optimization as evidence. It remains non-authoritative and cannot mutate Product Package.

RFC-1196 introduced `ProductPackageObservationAdapter` as a one-way foundation adapter from Product Package-shaped data to `ProductPackageObservationSnapshot`.

The adapter accepts a neutral `Record<string, unknown>` so EDI does not import Viewer-local Product Package types. It selects observable summary fields, creates copied snapshot data, and does not return or retain mutable Product Package references.

RFC-1196 does not introduce product integration. No product workflow calls the adapter yet.

The adapter does not mutate Product Package, call RuntimeHost, call RuntimeLoop, call Viewer, call Factory, call UI, call React state, validate product changes, create proposals, or execute runtime.

RFC-1197 reviewed the full Product Package Observation Flow before EDI Memory planning.

The reviewed flow is Product Package, Product Package Observation Adapter, Product Package Observation Snapshot, and EDI Observation.

The review confirmed that the flow is one-way at foundation level, read-only at data-shape level, serializable when metadata is serializable, and sufficient for Memory architecture review.

RFC-1197 did not introduce Memory, Reasoning, Proposal, Viewer, UI, or runtime wiring.

Known risks remain: metadata needs a serializability/allowlist policy, immutable-style data is not runtime frozen, field selection is intentionally minimal, component id mapping may need expansion, and traceability may need stronger correlation ids.

The next recommended RFC is `RFC-1198 - EDI Memory Foundation Review`.

RFC-1198 defined the philosophy and architecture of EDI Memory.

Memory is not cache and not Source of Truth. It is contextual knowledge that preserves useful observations, decisions, proposals, errors, validation signals, preferences when allowed, and cross-domain historical context.

The conceptual lifecycle is Observation Snapshot, Memory Candidate, Memory Entry, Retrieval, Understanding / Reasoning, and future Knowledge Graph.

The review clarified the difference between Observation Snapshot, Memory Entry, and future Knowledge. Observation Snapshot is point-in-time observed data. Memory Entry is retained, addressable, contextualized record. Knowledge is a future higher-order structure linking and summarizing multiple entries.

Memory remains domain-independent and does not mutate Product Package, Project State, Viewer, Factory, runtime, or UI. Product Package and Project State remain Source of Truth.

The next recommended RFC is `RFC-1199 - EDI Memory Entry Foundation`.

RFC-1199 introduced `EdiMemoryEntry` as the first data contract for the Memory layer.

The Memory Entry is a descriptor, not storage. It contains identity, source, timestamp, category, summary, traceability metadata, and a serializable reference to the original Observation Snapshot.

The factory `createEdiMemoryEntryFromObservationSnapshot` creates a Memory Entry from `ProductPackageObservationSnapshot` without introducing database, storage, retrieval, reasoning, proposal, runtime, Viewer, UI, or React state.

RFC-1199 prepares the path from Observation to Memory, and then to future Understanding and Reasoning, but does not implement those later steps.

RFC-1200 reviewed the Observation to Memory flow before any Understanding, Reasoning, Proposal, storage, database, Viewer, UI, or runtime ingestion.

The reviewed path is Product Package, Product Package Observation Adapter, Product Package Observation Snapshot, Memory Candidate, and EdiMemoryEntry.

The review confirmed that Memory preserves contextual knowledge, not cache data. Observation Snapshot remains the point-in-time read-only evidence package. Memory Entry remains the retained contextual record with identity, source, timestamp, category, summary, traceability metadata, and a serializable snapshot reference.

RFC-1200 confirmed readiness for `RFC-1201 - EDI Understanding Foundation Review`.

It did not introduce Understanding, Reasoning, Proposal, storage, retrieval, mutation, runtime wiring, Viewer, UI, or React state.

RFC-1201 defined the philosophy and role of Understanding in the Core Cognitive Loop.

The review clarified that Observation means EDI sees, Memory means EDI remembers, and Understanding means EDI knows what the observed and remembered evidence means.

Understanding is positioned after Memory and before Reasoning. It can produce classifications, meanings, relationships, context, and semantic summaries, but it does not produce Proposal, Validation, Mutation, runtime execution, UI, Viewer output, or Source of Truth updates.

Understanding remains domain-independent at foundation level. It is expected to serve future DXF, DWG, Product Package, hardware, estimates, technical sheets, production, and Business Intelligence use cases without importing real engines.

RFC-1201 confirmed readiness for `RFC-1202 - EDI Understanding Artifact Foundation`.

It did not introduce an Understanding artifact, Reasoning, Proposal, runtime, Viewer, UI, storage, or engine integration.

RFC-1202 introduced `EdiUnderstandingArtifact` as the first data contract for the Understanding layer.

The artifact is created from Memory Entries and contains identity, timestamp, source memory references, optional classification, inferred meaning, contextual notes, relations, and traceability metadata.

The foundation clarified that Understanding Artifact is interpreted context. It is not Observation, not Memory, not Reasoning, not Proposal, not runtime execution, and not Source of Truth.

RFC-1202 prepares future Reasoning by creating a stable interpreted context descriptor, but it does not introduce Reasoning, Proposal, storage, retrieval, runtime, Viewer, UI, React state, or engine integration.

RFC-1203 reviewed the boundary between Understanding and future Reasoning.

The review clarified that Understanding owns interpreted meaning, classifications, relations, contextual notes, and semantic interpretation.

Reasoning will own future evaluation over understood context: alternatives, consequences, tradeoffs, constraints, possible paths, and preparation for Proposal.

The transition rule is that a comprehension becomes reasoning only when EDI moves from "what this means" to "what follows from this meaning".

RFC-1203 documented examples for Product Package, hardware, DXF/DWG, estimates, and production.

RFC-1203 confirmed readiness for `RFC-1204 - EDI Reasoning Foundation Review`.

It did not introduce Reasoning Foundation, Proposal, runtime, Viewer, UI, storage, retrieval, or engine integration.

RFC-1204 defined the philosophy and role of Reasoning in the Core Cognitive Loop.

The review clarified that Understanding means EDI knows what something means, while Reasoning means EDI evaluates what follows from that meaning.

Reasoning works over classifications, relations, context, constraints, alternatives, consequences, tradeoffs, uncertainty, and missing assumptions.

The review documented Reasoning scope for Product Package, DXF/DWG, hardware, estimates, production, and Business Intelligence.

Reasoning prepares future Proposal by organizing alternatives, rationale, constraints, risks, assumptions, and consequences. It does not create Proposal and does not mutate Product Package, Project State, Viewer, Factory, runtime, or any Source of Truth.

RFC-1204 confirmed readiness for `RFC-1205 - EDI Reasoning Artifact Foundation`.

It did not introduce Reasoning artifact, Proposal, Optimization, runtime, Viewer, UI, storage, retrieval, or engine integration.

RFC-1205 introduced `EdiReasoningArtifact` as the first data contract for the Reasoning layer.

The artifact is created from Understanding Artifacts and contains identity, timestamp, source understanding references, alternatives, constraints, consequences, tradeoffs, assumptions, risks, rationale, and traceability metadata.

The foundation clarified that Reasoning Artifact is evaluation and consequence modeling. It is not Understanding, not Proposal, not Validation Support, not Optimization execution, not runtime execution, and not Source of Truth.

RFC-1205 prepares future Proposal by creating a stable evaluated consequence descriptor, but it does not introduce Proposal, Validation Support, Optimization, mutation, runtime, Viewer, UI, React state, storage, retrieval, or engine integration.

RFC-1206 introduced `EdiReasoningArtifactBuilder` as the pure builder for `EdiReasoningArtifact`.

The builder accepts explicit Understanding-derived inputs and delegates creation to `createEdiReasoningArtifact`.

It supports single and batch artifact creation through `buildReasoningArtifact` and `buildReasoningArtifacts`.

RFC-1206 clarified that the builder is a foundational producer only. It does not generate Proposal, make automatic decisions, mutate Product Package or Project State, call runtime, call Viewer, call UI, access storage, or perform retrieval.

RFC-1207 introduced `EdiReasoningTraceability` as the dedicated audit trail data contract for Reasoning artifacts.

The traceability foundation can represent source artifact ids, understanding references, lineage references, assumption references, constraint references, and derivation metadata.

The factory `createEdiReasoningTraceability` uses explicit timestamp input and defensively copies reference arrays and metadata.

RFC-1207 clarified that traceability is audit data, not Evaluation, not Proposal, not automatic decision-making, not mutation, not runtime behavior, not Viewer/UI, and not storage/retrieval.

RFC-1208 introduced `EdiReasoningEvaluation` as the dedicated quality descriptor for Reasoning artifacts.

The evaluation foundation can represent confidence indicators, consistency indicators, coverage indicators, risk indicators, traceability completeness indicators, and evaluation metadata.

The factory `createEdiReasoningEvaluation` uses explicit timestamp input and defensively copies indicator arrays, notes, and metadata.

RFC-1208 clarified that evaluation is quality data, not Proposal, not Validation, not automatic decision-making, not mutation, not runtime behavior, not Viewer/UI, and not storage/retrieval.

RFC-1209 introduced `EdiProposalArtifact` as the first data contract of the Proposal layer.

The proposal artifact can represent identity, timestamp, title, description, proposal type, proposal category, rationale, expected benefits, expected risks, related Reasoning Artifact references, related Understanding Artifact references, and metadata.

The factory `createEdiProposalArtifact` uses explicit timestamp input and copies related artifacts into serializable references.

RFC-1209 clarified that Proposal Artifact is a proposal descriptor, not Validation, not Mutation, not automatic decision-making, not executor/runtime behavior, not Viewer/UI, and not storage/retrieval.

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
- EDI View Model Snapshot exists as foundation.
- EDI View Model Snapshot is data, not React state.
- EDI View Model Snapshot is validated as Viewer boundary.
- Viewer Exposure Foundation reads only EDI View Model Snapshot.
- Memory, reasoning, feedback, and planning sections are future extensions.
- Viewer Exposure Foundation exists as data boundary.
- Viewer Exposure is not final Viewer UI.
- Viewer Exposure does not read runtime.
- EDI Observable Stack is reviewed.
- Observable Stack reviewed does not mean product integration.
- BagaStudio integration requires dedicated planning.
- Viewer exposure real wiring requires a dedicated RFC.
- Memory/Reasoning integration requires planning before runtime wiring.
- EDI is an observable BagaStudio capability, not a Viewer controller.
- Viewer must consume EDI indirectly.
- Viewer must not call EDI flows.
- Viewer must not read RecognitionObservableResult directly.
- EdiViewerExposure is the EDI-side boundary for future BagaStudio presentation.
- BagaStudio EDI Presentation Adapter requires a dedicated RFC.
- BagaStudio Presentation Adapter translates EdiViewerExposure.
- BagaStudio Presentation Model hides EDI internals from Viewer.
- Viewer must not read EdiViewerExposure directly.
- Viewer must not read EDI View Model directly.
- Presentation Adapter does not render UI.
- Presentation Adapter does not create React state.
- Presentation Adapter does not call runtime or dispatch.
- Memory, Reasoning, Feedback, and Planning enter presentation through the same adapter boundary.
- BagaStudio Presentation Model belongs to BagaStudio.
- BagaStudio Presentation Model receives EdiViewerExposure.
- BagaStudio Presentation Model is data, not Viewer UI.
- BagaStudio Presentation Model is not React state.
- BagaStudio Presentation Model does not call runtime.
- BagaStudio Presentation Model does not know RuntimeHost or RuntimeLoop.
- BagaStudio Presentation Model does not contain real recognition logic.
- BagaStudio Integration Readiness is planning readiness, not product activation.
- Sync/push review precedes the next operational phase.
- BagaStudio operational planning precedes Viewer wiring.
- Viewer wiring requires a dedicated RFC.
- Product State Boundary precedes Viewer UI.
- Viewer is not the first operational owner of EDI.
- BagaStudioPresentationModel must not enter Viewer without product-side boundary review.
- Product/Project state ownership must be clarified before code.
- EDI Observable Stack stays frozen during operational planning.
- EDI is strategic intelligence, not Source of Truth.
- Product Package remains product Source of Truth.
- Project State remains project Source of Truth.
- Validated system data remains authoritative.
- EDI proposals must be validated before becoming operational.
- EDI supports design, production, documentation, business, and personal memory without bypassing validation gates.
- Product Package owns product meaning.
- BagaStudio owns validation and mutation.
- Viewer is presentation, not product authority.
- Presentation Model is not Source of Truth.
- Factory consumes validated production data, not raw EDI proposals.
- Viewer must not mutate Product Package directly.
- EDI must not mutate Product Package directly.
- Product Package enters EDI through Observation Adapter.
- Product Package Observation Adapter does not mutate Product Package.
- EDI proposals pass through Validation Layer before Mutation Layer.
- BagaStudio owns Mutation Layer.
- Presentation Model derives data for Viewer but is not Source of Truth.
- Product Package Observation Adapter produces read-only snapshots.
- Product Package Observation Adapter does not expose live mutable Product Package references.
- Product Package Observation Adapter does not call Viewer, Factory, runtime, UI, or Mutation Layer.
- Product Package Observation Adapter does not create proposals.
- Product Package Observation Snapshot feeds Memory, Proposal, and Optimization only as evidence.
- Product Package Observation Snapshot is a data contract.
- Product Package Observation Snapshot is read-only and serializable.
- Product Package Observation Snapshot does not contain mutation functions.
- Product Package Observation Snapshot does not contain runtime, Viewer, Factory, or React references.
- Product Package Observation Snapshot does not create proposals.
- Product Package Observation Adapter remains a future operational foundation.
- Product Package Observation Adapter is one-way.
- Product Package Observation Adapter produces only ProductPackageObservationSnapshot.
- Product Package Observation Adapter does not return mutable Product Package references.
- Product Package Observation Adapter foundation is not product integration.
- Product Package Observation Flow is reviewed as one-way.
- Product Package Observation Flow is Memory-ready for review, not automatic ingestion.
- Memory must consume observation snapshots, not live Product Package references.
- Observation metadata requires serializability and allowlist policy before Memory ingestion.
- Memory is not cache.
- Memory is not Source of Truth.
- Memory stores contextual knowledge.
- Memory is domain-independent.
- Memory feeds Understanding and Reasoning.
- Memory must not mutate Product Package, Project State, Viewer, Factory, or runtime.
- Knowledge Graph remains future.
- Memory Entry is a descriptor, not storage.
- Memory Entry references Observation Snapshot metadata, not live Product Package.
- Memory Entry does not trigger retrieval, reasoning, proposal, mutation, Viewer, UI, Factory, or runtime behavior.
- Observation to Memory keeps Snapshot and Memory Entry separate.
- Memory Entry preserves contextual knowledge, not cache data.
- Understanding may consume Memory Entry only after a dedicated RFC.
- Reasoning must not be triggered by Memory Entry creation.
- Understanding is interpreted meaning, not raw observation.
- Understanding is not Memory storage.
- Understanding is not Reasoning, Proposal, Mutation, UI, Viewer output, runtime execution, or Source of Truth.
- Understanding remains domain-independent at foundation level.
- Understanding Artifact is interpreted context, not reasoning result.
- Understanding Artifact references Memory Entries, not live Memory storage.
- Understanding Artifact does not trigger Reasoning, Proposal, Mutation, runtime, Viewer, UI, storage, or retrieval.
- Understanding owns interpreted meaning.
- Reasoning owns evaluation over understood meaning.
- Reasoning must not be embedded in Understanding Artifact.
- Reasoning may prepare Proposal only after dedicated Reasoning and Proposal RFCs.
- Reasoning evaluates consequences, alternatives, constraints, tradeoffs, and assumptions.
- Reasoning is not Proposal, Validation Layer, Optimization execution, runtime, Viewer, or UI.
- Reasoning does not mutate Product Package, Project State, Viewer, Factory, runtime, or Source of Truth.
- Reasoning Artifact is evaluation, not Proposal.
- Reasoning Artifact references Understanding Artifacts, not live Understanding storage.
- Reasoning Artifact does not trigger Proposal, Validation, Optimization, Mutation, runtime, Viewer, UI, storage, or retrieval.
- Reasoning Builder produces only Reasoning Artifact.
- Reasoning Builder delegates to createEdiReasoningArtifact.
- Reasoning Builder accepts explicit inputs only.
- Reasoning Builder does not generate Proposal, decisions, mutation, runtime behavior, Viewer output, UI, storage, or retrieval.
- Reasoning Traceability is audit data, not Evaluation.
- Reasoning Traceability remains independent from future Proposal.
- Reasoning Traceability does not trigger Proposal, Evaluation, Validation, Mutation, runtime, Viewer, UI, storage, or retrieval.
- Reasoning Evaluation is quality data, not Proposal or Validation.
- Reasoning Evaluation remains independent from future Proposal and Validation.
- Reasoning Evaluation does not trigger decisions, Mutation, runtime, Viewer, UI, storage, or retrieval.
- Proposal Artifact is data, not a decision.
- Proposal Artifact is not Validation, Mutation, or Source of Truth.
- Proposal Artifact does not call executor, runtime, Viewer, UI, storage, or retrieval.
- Proposal Artifact does not mutate Product Package or Project State.

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
- `createEdiViewModelSnapshotFromRecognitionObservableResult` exists as the View Model Snapshot foundation;
- EDI View Model Snapshot is validated as ready for Viewer Exposure Foundation planning;
- `createEdiViewerExposureFromSnapshot` exists as the Viewer Exposure foundation;
- EDI Observable Stack is reviewed;
- BagaStudio integration is ready for planning;
- Viewer exposure is ready for planning, not real wiring;
- Memory/Reasoning integration is ready for planning, not runtime wiring;
- BagaStudio integration planning is documented;
- `EdiViewerExposure` is the boundary for future BagaStudio presentation;
- BagaStudio EDI Presentation Adapter is the next planned review;
- BagaStudio EDI Presentation Adapter role is documented;
- BagaStudio Presentation Model is the next planned foundation;
- `createBagaStudioPresentationModelFromEdiViewerExposure` exists as the BagaStudio Presentation Model foundation;
- `BagaStudioPresentationModel` exists with an EDI presentation section;
- BagaStudio integration readiness is reviewed;
- EDI Observable Stack is stable enough for planning;
- BagaStudioPresentationModel is a correct BagaStudio-side boundary;
- sync/push review is the recommended next phase;
- BagaStudio operational planning is documented;
- Product State / Presentation Boundary Review is the next recommended RFC;
- EDI strategic role is documented;
- EDI is defined as observation, proposal, validation support, optimization, memory, and business intelligence;
- Product Package, Project State, and validated system data are documented as Source of Truth;
- Product State Boundary is documented;
- ownership map across Product Package, Project State, EDI, BagaStudio, Presentation Model, Viewer, and Factory is documented;
- Product State Integration Planning is documented;
- Observation Path, Proposal Path, and Presentation Path are documented;
- Product Package Observation Adapter is documented as read-only observation boundary;
- Product Package Observation Snapshot Foundation exists;
- Product Package Observation Adapter Foundation exists;
- Product Package Observation Adapter is not called by product workflows yet;
- Product Package Observation Flow is reviewed;
- EDI Memory Foundation Review is documented;
- EDI Memory Entry Foundation exists;
- Observation to Memory Flow is reviewed;
- Observation Snapshot and Memory Entry separation is documented;
- Understanding Foundation Review is documented;
- Understanding Artifact Foundation exists;
- Understanding to Reasoning Boundary Review is documented;
- Reasoning Foundation Review is documented;
- Reasoning Artifact Foundation exists;
- Reasoning Builder Foundation exists;
- Reasoning Traceability Foundation exists;
- Reasoning Evaluation Foundation exists;
- Proposal Artifact Foundation exists;
- Proposal Artifact Review and Validation Support Planning is the next recommended review;
- Memory storage and retrieval remain future;
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
- real Viewer wiring;
- final Viewer UI;
- BagaStudio product integration;
- BagaStudio EDI Presentation Adapter;
- Viewer consumption of BagaStudio Presentation Model;
- sync/push review after RFC-1190;
- BagaStudio operational planning;
- Product State / Presentation Boundary;
- proposal-to-validation workflow for EDI outputs;
- Product Package to Presentation Model flow;
- EDI observation path over Product Package;
- EDI proposal validation path;
- Product Package Observation Adapter product workflow integration;
- Memory Candidate explicit contract;
- EDI Understanding artifact runtime usage;
- Reasoning foundation;
- Reasoning artifact runtime usage;
- Reasoning evaluator;
- Reasoning traceability consumers;
- Reasoning evaluation consumers;
- Proposal builder;
- Proposal validation support;
- Proposal artifact runtime usage;
- Optimization foundation;
- Product Package Observation metadata serializability policy;
- Memory deduplication, correlation, confidence, trust, freshness, retention, privacy, and governance policies;
- alignment between EdiMemoryEntry descriptor and older cognitive memory contracts;
- real memory storage or database;
- memory retention, retrieval, privacy, and governance policy;
- Knowledge Graph;
- governance for business intelligence and personal memory;
- Viewer-facing consumption contract;
- memory/reasoning/feedback/planning View Model sections;
- automated Observable Stack tests;
- GitHub/local remote synchronization after this phase;
- `runRealIntegration`.

The current layer is safe for architectural validation and future integration planning. It is not a real operational execution system yet.
