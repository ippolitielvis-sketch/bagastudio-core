# EDI Execution Architecture Master

## Status

Foundation Complete.

This document is the official architecture reference for the EDI Execution Layer foundation introduced from RFC-1126 onward.

The current state is foundation and wiring only. Product integration is not implemented in this layer.

## Purpose

The purpose of this document is to describe how the EDI cognitive foundation evolves into a non-destructive execution foundation.

It documents:

- the data contracts introduced before execution;
- the runtime builders that compose those contracts;
- the executor contract;
- the registry and selector;
- the preview executors;
- the preview execution runtime wiring.
- the first controlled preview integration helper.

It does not document real product execution, UI integration, engine integration, project mutation, command handling, or production operations.

## Executive Summary

RFC-1126 to RFC-1150 introduced an explicit path from cognitive activation to preview execution.

The architecture now supports:

- cognitive state reading;
- activation context creation;
- intent creation;
- action descriptor creation;
- execution plan creation;
- execution request creation;
- executor candidate selection;
- preview executor execution;
- execution result production.

All preview executors are read-only, descriptive, side-effect free, and disconnected from real engines.

## RFC Scope

This document covers:

- RFC-1126: EDI Cognitive State Runtime Foundation
- RFC-1127: EDI Cognitive Activation Context Foundation
- RFC-1128: EDI Cognitive Activation Context Builder Foundation
- RFC-1129: EDI Intent Foundation
- RFC-1130: EDI Intent Builder Foundation
- RFC-1131: EDI Action Foundation
- RFC-1132: EDI Action Builder Foundation
- RFC-1133: EDI Execution Plan Foundation
- RFC-1134: EDI Execution Request Foundation
- RFC-1135: EDI Execution Result Foundation
- RFC-1136: EDI Executor Contract Foundation
- RFC-1137: EDI Execution Request Builder Foundation
- RFC-1138: EDI Executor Registry Foundation
- RFC-1139: EDI Executor Selector Foundation
- RFC-1141: EDI Import Preview Executor Foundation
- RFC-1142: EDI Recognition Preview Executor Foundation
- RFC-1144: EDI Layout Preview Executor Foundation
- RFC-1145: EDI Join Preview Executor Foundation
- RFC-1146: EDI Pricing Preview Executor Foundation
- RFC-1147: EDI Factory Preview Executor Foundation
- RFC-1149: EDI Executor Registry Population Foundation
- RFC-1150: EDI Runtime Execution Wiring Foundation
- RFC-1151: EDI Execution Result Consumer Foundation
- RFC-1152: EDI Preview Execution Result Consumer Foundation
- RFC-1153: EDI Execution Result Consumer Registry Foundation
- RFC-1154: EDI Execution Result Consumer Registry Population Foundation
- RFC-1155: EDI Execution Result Consumer Wiring Foundation
- RFC-1157: EDI Execution Result Dispatcher Foundation
- RFC-1159: EDI Preview Execution And Consumption Wiring Foundation
- RFC-1161: EDI Preview Execution And Dispatch Helper Foundation
- RFC-1163: EDI Integration Boundary Foundation
- RFC-1164: EDI Integration Boundary Wiring Review
- RFC-1165: EDI Preview Integration Boundary Wiring
- RFC-1166: EDI Boundary Failure Semantics Review
- RFC-1167: EDI Real Producer Adapter Foundation
- RFC-1168: EDI Producer Adapter Boundary Contract Review
- RFC-1169: EDI Producer Adapter Request Factory Foundation
- RFC-1170: EDI Producer Adapter Boundary Pipeline Review
- RFC-1171: EDI First Real Producer Adapter Review
- RFC-1172: EDI Recognition Producer Adapter Foundation
- RFC-1173: EDI Recognition Producer Boundary Pipeline Review
- RFC-1174: EDI Recognition Producer Pipeline Validation Review
- RFC-1175: EDI Recognition Producer Runtime Wiring Review
- RFC-1176: EDI Recognition Runtime Adapter Foundation
- RFC-1177: EDI Recognition Runtime Result Dispatch Review
- RFC-1178: EDI Recognition Result Adapter Foundation
- RFC-1179: EDI Recognition Observable Flow Review
- RFC-1180: EDI First Observable Recognition Flow Foundation
- RFC-1181: EDI Observable Recognition Flow Review
- RFC-1182: EDI Viewer Exposure Planning Review
- RFC-1183: EDI View Model Snapshot Foundation
- RFC-1184: EDI View Model Snapshot Validation Review
- RFC-1185: EDI Viewer Exposure Foundation
- RFC-1186: EDI Observable Stack Review
- RFC-1187: BagaStudio Integration Planning
- RFC-1188: BagaStudio EDI Presentation Adapter Review
- RFC-1189: BagaStudio Presentation Model Foundation
- RFC-1190: BagaStudio Integration Readiness Review
- RFC-1191: BagaStudio Operational Planning
- RFC-1191B: EDI Strategic Role Definition
- RFC-1192: BagaStudio Product State Boundary Review
- RFC-1193: BagaStudio Product State Integration Planning
- RFC-1194: Product Package Observation Adapter Review
- RFC-1195: Product Package Observation Snapshot Foundation

## Architecture Overview

The existing cognitive runtime path remains separate from the execution path.

```text
Domain Intelligence
-> ObservationAdapter
-> ReasoningBridge
-> CognitiveMemory
-> CognitiveFeedback
-> FeedbackVisualStateBridge
-> EdiRuntimeLoop
-> EdiRuntimeHost
```

The execution foundation adds a new explicit path:

```text
CognitiveStateRuntime
-> CognitiveActivationContextBuilder
-> EdiCognitiveActivationContext
-> EdiIntent
-> EdiAction
-> EdiExecutionPlan
-> EdiExecutionRequest
-> EdiExecutorSelector
-> EdiExecutor
-> EdiExecutionResult
-> EdiExecutionResultDispatcher
-> EdiExecutionResultConsumer
```

The implemented preview wiring can be summarized as:

```text
Execution
-> Consumption
-> Wiring
```

Execution produces a result. Consumption defines neutral consumers for that result. Wiring builds the available preview components without running or dispatching automatically.

The first controlled preview integration adds an explicit caller-driven helper:

```text
Foundation
-> Wiring
-> Preview Integration
-> Real Integration (not implemented)
```

Preview Integration means a caller explicitly asks the helper to execute one request and dispatch the resulting `EdiExecutionResult`. Real Integration with UI, Viewer, cognitive runtime, or real engines is not implemented.

This path is caller-driven. It does not run automatically.

Future real integration is expected to pass through producer adapters before crossing the integration boundary:

```text
Real Engine / Viewer / Import / Recognition
-> EdiProducerAdapter
-> executionRequestInput
-> createEdiExecutionRequestFromProducerAdapterOutput
-> EdiIntegrationBoundary
-> validated request
-> Execution Runtime
```

This path is not operational today.

## Core Contracts

### EdiCognitiveActivationContext

`EdiCognitiveActivationContext` is a non-operational data object.

It contains:

- cognitive state;
- observations;
- optional memory snapshot;
- activation metadata.

It does not subscribe to state changes, read directly from `CognitiveStateBus`, call producers, or trigger execution.

### EdiIntent

`EdiIntent` is an immutable semantic contract between activation context and future action.

It contains:

- context id;
- cognitive state snapshot;
- kind;
- confidence;
- priority;
- optional target domain;
- reason, explanation, and metadata.

It is not a command and it does not contain executable behavior.

### EdiAction

`EdiAction` is an immutable, serializable, non-executable descriptor connected to an intent.

It contains:

- intent id;
- context id;
- kind;
- status;
- priority;
- confidence;
- optional target domain;
- optional descriptive payload.

It does not contain executor, handler, callback, command bus, UI instruction, or project mutation logic.

### EdiExecutionPlan

`EdiExecutionPlan` is a non-executable descriptor of one or more actions.

It stores references only:

- action ids;
- intent ids;
- context ids.

It intentionally does not contain executable steps or full action objects.

### EdiExecutionRequest

`EdiExecutionRequest` is the request object consumed by an executor.

It contains:

- execution plan id;
- action ids;
- intent ids;
- context ids;
- mode;
- status;
- priority;
- optional target domain;
- optional descriptive payload.

Supported modes:

- `plan`
- `preview`
- `dry-run`

Within the foundation, these modes are non-destructive.

### EdiExecutionResult

`EdiExecutionResult` is the non-operational result descriptor returned by an executor.

It contains:

- execution request id;
- execution plan id;
- action ids;
- intent ids;
- context ids;
- mode;
- status;
- optional output;
- optional error;
- optional diagnostics;
- optional executor id;
- optional duration.

For preview executors, `succeeded` means that a descriptive preview result was produced. It does not mean that a real product operation was executed.

### EdiExecutor

`EdiExecutor` is the request-to-result contract.

It defines:

- id;
- name;
- optional capabilities;
- execute function.

Capabilities are descriptive metadata used by registry and selector layers. They do not imply validation or real execution readiness.

### EdiExecutionResultConsumer

`EdiExecutionResultConsumer` is the neutral result consumption contract.

It defines:

- id;
- name;
- consume function.

The consume function receives `EdiExecutionResult` and returns `void`.

The contract does not define UI behavior, project mutation, engine calls, event publishing, queues, routing, or automatic runtime integration.

## Runtime Builders

Runtime builders compose core contracts without executing real operations.

Implemented builders:

- `CognitiveStateRuntime`
- `CognitiveActivationContextBuilder`
- `IntentBuilder`
- `ActionBuilder`
- `ExecutionRequestBuilder`

Common rules:

- input-driven;
- stateless;
- deterministic;
- no subscriptions;
- no automatic runtime activation;
- no engine dependencies;
- no project mutation.

## Execution Layer Responsibilities

The Execution Layer is responsible for:

- executor selection;
- execution request handling;
- execution result production;
- execution result consumption contract definition.

The Execution Layer is not responsible for:

- intent generation;
- action generation;
- business logic;
- real engines;
- UI;
- automatic result integration.

This boundary keeps execution orchestration separate from cognitive interpretation, product runtime, and presentation concerns.

## Executor Runtime Foundation

### ExecutorRegistry

`ExecutorRegistry` is a static runtime registry.

It can:

- return all registered executors;
- look up an executor by id;
- find executors by domain and mode.

It does not:

- execute requests;
- rank executors;
- validate readiness;
- register or unregister after creation;
- discover plugins;
- create concrete executors.

### ExecutorSelector

`ExecutorSelector` selects executor candidates from an `EdiExecutionRequest` by using the registry.

It reads:

- request target domain;
- request mode.

It returns candidates. It does not choose the best executor, rank candidates, fallback to another domain, validate executors, or call `execute`.

### EdiExecutionRuntime

`EdiExecutionRuntime` is the neutral execution orchestrator foundation.

It:

- receives an `EdiExecutionRequest`;
- uses `EdiExecutorSelector`;
- takes the first candidate returned by the selector;
- invokes `executor.execute(request)`;
- always returns `EdiExecutionResult`.

Controlled failure paths:

- no executor found returns a failed result;
- executor throw returns a failed result;
- async executor returns a failed result because async execution is not part of this foundation.

It has no domain-specific logic and no dependency on Viewer, RuntimeHost, RuntimeLoop, UI, or real engines.

## Preview Executors Catalog

Preview executors are concrete `EdiExecutor` implementations, but they are not real operational executors.

They are:

- descriptive;
- read-only;
- side-effect free;
- disconnected from real engines;
- disconnected from UI;
- disconnected from project mutation.

Each preview executor consumes `EdiExecutionRequest` and produces `EdiExecutionResult` through `createEdiExecutionResult`.

### Import Preview Executor

Executor:

- export: `importPreviewExecutor`
- executor id: `edi.executor.import.preview`
- domain: `import`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive import preview results only. It does not use real import engine, parsers, filesystem, or Product Package runtime.

### Recognition Preview Executor

Executor:

- export: `recognitionPreviewExecutor`
- executor id: `edi.executor.recognition.preview`
- domain: `recognition`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive recognition preview results only. It does not use Recognition runtime, Viewer, or Scene Composer.

### Layout Preview Executor

Executor:

- export: `layoutPreviewExecutor`
- executor id: `edi.executor.layout.preview`
- domain: `layout`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive layout preview results only. It does not use Room Intelligence, layout engines, collision engines, or geometry mutation.

### Join Preview Executor

Executor:

- export: `joinPreviewExecutor`
- executor id: `edi.executor.join.preview`
- domain: `join`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive join preview results only. It does not generate joins, snaps, collisions, alignments, or Scene Composer operations.

### Pricing Preview Executor

Executor:

- export: `pricingPreviewExecutor`
- executor id: `edi.executor.pricing.preview`
- domain: `pricing`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive pricing preview results only. It does not calculate prices, margins, VAT, commercial validation, or Pricing Engine output.

### Factory Preview Executor

Executor:

- export: `factoryPreviewExecutor`
- executor id: `edi.executor.factory.preview`
- domain: `factory`
- modes: `plan`, `preview`, `dry-run`

It produces descriptive factory preview results only. It does not generate BOM, CSV, CIX, CNC, drilling, machining, assembly, hardware layout, or production instructions.

## Preview Registry And Wiring

### PreviewExecutorRegistry

`PreviewExecutorRegistry` is the official preview registry population point.

It exports:

- `ediPreviewExecutors`
- `createEdiPreviewExecutorRegistry`

Executor order is deterministic:

1. Import
2. Recognition
3. Layout
4. Join
5. Pricing
6. Factory

No ranking, priority, filtering, or domain-specific selection is introduced.

### PreviewExecutionRuntime

`PreviewExecutionRuntime` is the official preview wiring factory.

It builds:

- populated preview executor registry;
- executor selector;
- execution runtime.

It returns a ready-to-use preview execution runtime.

This is wiring, not integration. It does not execute automatically, subscribe to events, connect to UI, or connect to the cognitive runtime.

### PreviewExecutionResultConsumer

`PreviewExecutionResultConsumer` is the concrete preview consumer for execution results.

It implements `EdiExecutionResultConsumer`.

It is intentionally descriptive and side-effect free. It receives an `EdiExecutionResult` and performs no project mutation, UI update, engine call, event dispatch, queue operation, or runtime integration.

### ExecutionResultConsumerRegistry

`ExecutionResultConsumerRegistry` is the neutral registry for execution result consumers.

It can:

- return all registered consumers;
- look up a consumer by id.

It does not:

- consume results automatically;
- route results;
- rank consumers;
- filter by custom logic;
- publish events;
- connect to UI or engines.

### PreviewExecutionResultConsumerRegistry

`PreviewExecutionResultConsumerRegistry` is the official preview population point for result consumers.

It exports:

- `ediPreviewExecutionResultConsumers`
- `createEdiPreviewExecutionResultConsumerRegistry`

Current deterministic consumer order:

1. Preview Execution Result Consumer

No routing, ranking, filtering, or automatic consumption is introduced.

### PreviewExecutionResultConsumerRuntime

`PreviewExecutionResultConsumerRuntime` is the official wiring factory for preview result consumer registry construction.

It returns a ready-to-use `EdiExecutionResultConsumerRegistry`.

This is consumer wiring, not runtime integration. It does not consume results, does not connect to `EdiExecutionRuntime`, and does not connect to UI, Viewer, RuntimeHost, RuntimeLoop, or real engines.

### EdiExecutionResultDispatcher

`EdiExecutionResultDispatcher` is the neutral dispatcher for execution results.

It receives:

- `EdiExecutionResult`
- `EdiExecutionResultConsumerRegistry`

It obtains registered consumers and invokes `consumer.consume(result)` in deterministic order.

It does not:

- know `EdiExecutionRuntime`;
- create registries;
- route results;
- rank consumers;
- filter consumers;
- use async queues;
- publish events;
- connect to UI or engines.

If a consumer throws, the dispatcher handles the error locally and continues. The current consumer contract does not produce a dispatch report.

### PreviewExecutionAndConsumptionWiring

`PreviewExecutionAndConsumptionWiring` is the passive wiring object for preview execution and consumption.

It constructs and returns:

- `executionRuntime`
- `consumerRegistry`
- `executionResultDispatcher`

It does not receive `EdiExecutionRequest`, does not call `runExecution`, does not call `dispatchResult`, and does not consume results.

This is wiring, not an orchestrator and not integration.

### PreviewExecutionAndDispatch

`PreviewExecutionAndDispatch` introduces the first controlled preview integration helper.

It exports `runEdiPreviewExecutionAndDispatch`.

The helper receives:

- `EdiExecutionRequest`
- `EdiExecutionRuntime`
- `EdiExecutionResultDispatcher`
- `EdiExecutionResultConsumerRegistry`

It explicitly:

1. calls `executionRuntime.runExecution({ request })`;
2. calls `executionResultDispatcher.dispatchResult({ result, consumerRegistry })`;
3. returns the `EdiExecutionResult`.

It does not create components, own state, retry, queue, publish events, call UI, call Viewer, call RuntimeHost, call RuntimeLoop, call real engines, or mutate project state.

This helper is preview integration because it connects execution and consumption for a single explicit caller-driven flow. It is not an orchestrator and it is not real integration.

RFC-1165 wires this helper through `EdiIntegrationBoundary` before execution runtime is called.

The preview flow is:

Preview Integration
-> `createEdiIntegrationBoundaryRequest`
-> existing `EdiExecutionRequest`
-> `EdiExecutionRuntime`
-> `EdiExecutionResultDispatcher`

If boundary validation fails, the helper returns and dispatches a controlled failed `EdiExecutionResult`. It does not throw destructively and does not call execution runtime with a boundary-invalid request.

Boundary validation failure is a pre-runtime failure. It is not an executor failure, RuntimeHost failure, RuntimeLoop failure, or consumer failure.

### EdiIntegrationBoundary

`EdiIntegrationBoundary` introduces the first architectural boundary between Preview Integration and future real runtime integration.

It exports:

- `createEdiIntegrationBoundaryRequest`
- `validateEdiIntegrationBoundaryRequest`

The boundary accepts an `EdiExecutionRequest` compatible with the existing execution system and validates it minimally.

Current validation checks:

- request is present;
- request id is present;
- request mode is present;
- request target domain is present.

The boundary does not throw destructive errors, does not mutate the request, does not run execution, does not dispatch results, and does not connect to RuntimeHost, RuntimeLoop, Viewer, UI, or real engines.

Its purpose is to protect the future transition from Preview Integration to Real Integration without collapsing the current architectural boundaries.

#### Boundary Before Runtime Rule

`EdiIntegrationBoundary` must stay before execution runtime ownership.

It may be called by:

- Preview Integration;
- future Real Producer Adapters;
- future Import Integration Adapters;
- future Recognition Integration Adapters;
- future Viewer Integration Adapters.

It must not be called directly by:

- RuntimeHost;
- RuntimeLoop;
- Executor;
- Consumer.

RuntimeHost and RuntimeLoop must receive `EdiExecutionRequest` instances that are already normalized and validated. They must not know where the request came from and must not import the integration boundary directly.

The boundary must not become a dispatcher, a parallel runtime, a registry, or an execution/consumption owner.

#### Boundary Failure Is Pre-Runtime Rule

Boundary failures happen before execution runtime.

Current boundary issues are terminal:

- `missing-request`;
- `missing-request-id`;
- `missing-request-mode`;
- `missing-request-domain`.

`missing-request-domain` is terminal for now. It may become recoverable only in a future RFC if an explicit adapter is introduced to infer `targetDomain`.

The current foundation does not perform automatic recovery, does not infer `targetDomain`, does not call RuntimeHost, does not call RuntimeLoop, and does not reinterpret boundary failures as executor failures.

Preview Integration represents boundary failure as a controlled failed `EdiExecutionResult` with pre-runtime metadata.

### EdiProducerAdapter

`EdiProducerAdapter` introduces a neutral contract for future real producer adapters.

It defines:

- `EdiProducerAdapterSource`;
- `EdiProducerAdapterDomain`;
- `EdiProducerAdapterMode`;
- `EdiProducerAdapterExecutionRequestInput`;
- `EdiProducerAdapterInput`;
- `EdiProducerAdapterOutput`;
- `EdiProducerAdapter`.

A producer adapter is not a real engine. It does not parse files, inspect Viewer state, call product runtimes, mutate projects, call RuntimeHost, call RuntimeLoop, or execute requests.

Its role is to describe how a future source could prepare data compatible with future `EdiExecutionRequest` creation before crossing `EdiIntegrationBoundary`.

`EdiProducerAdapterOutput.executionRequestInput` is the handoff object for future `createEdiExecutionRequest` usage. It must include `mode` and `targetDomain` so the resulting request can cross `EdiIntegrationBoundary`.

No concrete Import, Recognition, Viewer, Pricing, Factory, Layout, or Join real producer is implemented in this foundation.

#### Producer Adapter Before Boundary Rule

Producer adapters sit before the integration boundary.

They may prepare `executionRequestInput`, but they must not call:

- RuntimeHost;
- RuntimeLoop;
- Executor;
- Consumer;
- real engines as part of EDI execution;
- `runRealIntegration`.

The resulting `EdiExecutionRequest` must cross `EdiIntegrationBoundary` before runtime execution.

### EdiProducerAdapterRequestFactory

`EdiProducerAdapterRequestFactory` introduces the neutral conversion layer from `EdiProducerAdapterOutput` to `EdiExecutionRequest`.

It exports:

- `createEdiExecutionRequestFromProducerAdapterOutput`.

The factory uses the existing `createEdiExecutionRequest` foundation path.

It preserves:

- producer adapter source;
- target domain;
- mode;
- payload;
- metadata.

The factory does not call RuntimeHost, RuntimeLoop, Executor, Consumer, real engines, Preview Integration, or `EdiIntegrationBoundary`.

The resulting `EdiExecutionRequest` must still cross `EdiIntegrationBoundary` before runtime execution.

### EdiProducerAdapterBoundaryPipeline

`EdiProducerAdapterBoundaryPipeline` introduces a neutral pre-runtime helper from `EdiProducerAdapterOutput` to boundary validation.

It exports:

- `EdiProducerAdapterBoundaryPipelineMetadata`;
- `EdiProducerAdapterBoundaryPipelineResult`;
- `createEdiProducerAdapterBoundaryPipelineResult`.

The pipeline:

- receives `EdiProducerAdapterOutput`;
- creates an `EdiExecutionRequest` via `createEdiExecutionRequestFromProducerAdapterOutput`;
- passes the request to `EdiIntegrationBoundary`;
- returns the request only when boundary validation succeeds;
- returns the validation result and pre-runtime metadata.

It does not call RuntimeHost, RuntimeLoop, Executor, Consumer, dispatcher, Preview Integration, real engines, or `runRealIntegration`.

It does not recover automatically and does not infer `targetDomain`.

### First Concrete Producer Candidate

The first planned concrete producer adapter is Recognition Producer Adapter Foundation.

Recognition is the recommended first producer because it is semantically close to EDI cognitive observation and can start as a controlled adapter foundation.

Import is deferred because it risks pulling parsing, geometry, scene graph, and model normalization too early.

Viewer is deferred because it risks pulling UI state integration and product runtime ownership too early.

The planned Recognition producer must remain a foundation adapter. It must produce `EdiProducerAdapterOutput` compatible with the pre-runtime pipeline, but it must not execute runtime, dispatch results, analyze real geometry, call real Recognition runtime, or introduce complete real recognition integration.

### RecognitionProducerAdapter

`RecognitionProducerAdapter` is the first concrete producer adapter foundation.

It exports:

- `RECOGNITION_PRODUCER_ADAPTER_ID`;
- `RecognitionProducerAdapterPayload`;
- `RecognitionProducerAdapterInput`;
- `createRecognitionProducerAdapterOutput`;
- `recognitionProducerAdapter`.

The adapter produces `EdiProducerAdapterOutput` with:

- source: `recognition-integration`;
- target domain: `recognition`;
- default mode: `preview`;
- minimal descriptive payload;
- metadata identifying the foundation adapter.

It does not call recognition runtime, geometry recognition, scene recognition, cognitive reasoning, runtime execution, dispatcher, executor, consumer, or `runRealIntegration`.

The output remains compatible with the pre-runtime producer adapter boundary pipeline.

### RecognitionProducerBoundaryPipeline

`RecognitionProducerBoundaryPipeline` is a domain-specific pre-runtime helper for the recognition producer foundation.

It exports:

- `createRecognitionProducerBoundaryPipelineResult`.

The helper:

- receives `RecognitionProducerAdapterInput`;
- creates `EdiProducerAdapterOutput` via `createRecognitionProducerAdapterOutput`;
- passes the output to `createEdiProducerAdapterBoundaryPipelineResult`;
- returns the existing `EdiProducerAdapterBoundaryPipelineResult`.

The result is a boundary pipeline result, not an `EdiExecutionResult`.

It does not call runtime, dispatcher, executor, consumer, recognition runtime, geometry recognition, scene recognition, cognitive reasoning, real engines, or `runRealIntegration`.

### Recognition Producer Pipeline Validation

RFC-1174 validates the recognition producer pre-runtime path as documentation-backed foundation validation.

No project test framework is introduced because the repository does not currently expose a dedicated test script or established TS test pattern for this layer.

The official validation checklist is:

- minimal recognition input can be accepted by `createRecognitionProducerAdapterOutput`;
- adapter output is created as `EdiProducerAdapterOutput`;
- `createRecognitionProducerBoundaryPipelineResult` creates the pipeline result;
- boundary validation succeeds for the minimal foundation output;
- request is present when validation succeeds;
- result type remains `EdiProducerAdapterBoundaryPipelineResult`;
- no `EdiExecutionResult` is produced;
- runtime is not called;
- dispatch is not called;
- executor and consumer are not called;
- no real recognition, geometry recognition, scene recognition, or cognitive reasoning is introduced.

A boundary-valid request means the request can cross the Integration Boundary. It does not mean execution occurred.

### Recognition Runtime Adapter Boundary

RFC-1175 defines the future runtime entry point for a boundary-valid Recognition producer request.

The Recognition Producer must not call directly:

- RuntimeHost;
- RuntimeLoop;
- PreviewExecutionAndDispatch;
- Executor;
- Consumer;
- Dispatcher.

The future operational layer is `Recognition Runtime Adapter`, planned for RFC-1176.

The adapter must remain distinct from:

- `RecognitionProducerAdapter`, which creates producer output;
- `RecognitionProducerBoundaryPipeline`, which creates and validates a boundary request;
- `PreviewExecutionAndDispatch`, which is a preview execution and dispatch helper.

The future `Recognition Runtime Adapter` may receive a boundary-valid `EdiExecutionRequest`, call only the appropriate `EdiExecutionRuntime`, and return `EdiExecutionResult`.

It must not dispatch, call RuntimeHost, call RuntimeLoop, own recognition logic, analyze geometry, manipulate scene graph, call real recognition engines, or introduce `runRealIntegration`.

### RecognitionRuntimeAdapter

`RecognitionRuntimeAdapter` introduces the minimal foundation runtime entry point for boundary-valid recognition execution requests.

It exports:

- `RunRecognitionRuntimeAdapterInput`;
- `runRecognitionRuntimeAdapter`.

The adapter receives:

- `request: EdiExecutionRequest`;
- `executionRuntime: EdiExecutionRuntime`.

It calls:

- `executionRuntime.runExecution({ request })`.

It returns:

- `EdiExecutionResult`.

The execution runtime is injected explicitly. The adapter does not create or import a runtime instance.

It does not dispatch, call Consumer, call RuntimeHost, call RuntimeLoop, analyze geometry, inspect scene graph, perform real recognition, or introduce `runRealIntegration`.

### Recognition Result Adapter Boundary

RFC-1177 defines the future result exposure boundary for recognition execution results.

`RecognitionRuntimeAdapter` returns `EdiExecutionResult`. It must not expose that result directly to Viewer, UI, RuntimeHost, RuntimeLoop, or product workflows.

The future layer is `Recognition Result Adapter`, planned for RFC-1178.

The planned flow is:

```text
RecognitionProducerAdapter
↓
RecognitionProducerBoundaryPipeline
↓
RecognitionRuntimeAdapter
↓
EdiExecutionResult
↓
Recognition Result Adapter
```

The future Result Adapter may receive `EdiExecutionResult` and transform it into an observable recognition result shape.

It must not render UI, wire Viewer, mutate runtime, call RuntimeHost, call RuntimeLoop, call dispatcher, or introduce real recognition.

Runtime Adapter and Result Adapter stay separate: Runtime Adapter enters execution runtime, while Result Adapter exposes execution output for later layers.

### RecognitionResultAdapter

`RecognitionResultAdapter` introduces the recognition-specific observable result foundation.

It exports:

- `RecognitionObservableMetadata`;
- `RecognitionObservableResult`;
- `createRecognitionObservableResult`;
- `recognitionResultAdapter`.

`EdiExecutionResult` is the execution runtime result descriptor.

`RecognitionObservableResult` is a recognition-specific observable shape derived from that descriptor.

It preserves:

- execution result id;
- execution request id;
- timestamp;
- mode;
- status;
- executor id;
- metadata;
- original execution result.

It does not render UI, wire Viewer, dispatch globally, mutate runtime, call RuntimeHost, call RuntimeLoop, call Consumer, perform real recognition, analyze geometry, inspect scene graph, or introduce `runRealIntegration`.

### Recognition Observable Flow

RFC-1179 defines the first complete recognition observable flow as a future controlled helper.

The documented flow is:

```text
Recognition Input
↓
RecognitionProducerAdapter
↓
RecognitionProducerBoundaryPipeline
↓
RecognitionRuntimeAdapter
↓
RecognitionResultAdapter
↓
RecognitionObservableResult
```

The observable flow is not Viewer integration.

The observable result is not UI.

The future flow helper must not dispatch globally, render UI, wire Viewer, call RuntimeHost, call RuntimeLoop, mutate runtime, perform real recognition, analyze geometry, inspect scene graph, or introduce `runRealIntegration`.

The planned next RFC is `RFC-1180 - First Observable Recognition Flow Foundation`.

RFC-1180 must create a controlled helper that accepts `RecognitionProducerAdapterInput`, uses the recognition boundary pipeline, handles boundary validation failures with a controlled flow result, calls `RecognitionRuntimeAdapter` only when boundary validation succeeds, uses `RecognitionResultAdapter`, and returns `RecognitionObservableResult` or a controlled flow result.

### RecognitionObservableFlow

`RecognitionObservableFlow` introduces the first end-to-end observable recognition flow foundation.

It exports:

- `RunRecognitionObservableFlowInput`;
- `RecognitionObservableFlowResult`;
- `runRecognitionObservableFlow`.

The flow receives:

- `recognitionInput: RecognitionProducerAdapterInput`;
- `executionRuntime: EdiExecutionRuntime`.

The flow composes:

- `createRecognitionProducerBoundaryPipelineResult`;
- `runRecognitionRuntimeAdapter`;
- `createRecognitionObservableResult`.

If boundary validation fails, the flow returns a controlled `RecognitionObservableFlowResult` with status `boundary-invalid`, validation details, and no runtime execution.

If boundary validation succeeds, the flow calls the recognition runtime adapter, creates the observable recognition result, and returns status `succeeded`.

It does not dispatch globally, render UI, wire Viewer, call RuntimeHost, call RuntimeLoop, call Consumer, perform real recognition, analyze geometry, inspect scene graph, or introduce `runRealIntegration`.

### Observable Recognition Flow Review

RFC-1181 reviews the first observable recognition flow introduced by RFC-1180.

Review outcome:

- boundary failure does not call runtime;
- validation success calls `RecognitionRuntimeAdapter`;
- result adapter produces `RecognitionObservableResult`;
- observable result is data, not UI;
- flow does not call Viewer;
- flow does not call RuntimeHost or RuntimeLoop;
- flow does not dispatch globally.

Post-review state:

- First Observable Recognition Flow: reviewed;
- EDI observable foundation: complete enough for next planning;
- Viewer exposure requires a dedicated future RFC;
- local/remote synchronization requires a dedicated verification before push.

### Viewer Exposure Planning

RFC-1182 defines the future Viewer exposure boundary without introducing Viewer code, UI, React state, or wiring.

The future exposure path is:

```text
RecognitionObservableResult
↓
EDI View Model Snapshot
↓
Viewer
```

The Viewer must not read `RecognitionObservableResult` directly.

The Viewer must not call `runRecognitionObservableFlow`.

The Viewer must not know `EdiExecutionRuntime`, RuntimeHost, or RuntimeLoop.

`EDI View Model Snapshot` is planned as an immutable snapshot, not live state.

The View Model must remain separate from domain-specific flows such as Recognition.

Recognition observable data may feed the View Model, but Viewer reads only the View Model.

The View Model must be future-extensible to:

- recognition;
- memory;
- reasoning;
- feedback;
- planning.

The View Model must not own runtime logic, real recognition logic, rendering, UI behavior, dispatch, or React state.

The planned next RFC is `RFC-1183 - EDI View Model Snapshot Foundation`.

### EdiViewModelSnapshot

`EdiViewModelSnapshot` introduces the immutable-style view model boundary between EDI observable data and future Viewer exposure.

It exports:

- `EdiViewModelSnapshotMetadata`;
- `EdiViewModelRecognitionSection`;
- `EdiViewModelSnapshot`;
- `createEdiViewModelSnapshotFromRecognitionObservableResult`.

The snapshot receives `RecognitionObservableResult` and produces a readable view model snapshot with a `recognition` section.

It preserves:

- id;
- timestamp;
- execution result id;
- execution request id;
- mode;
- status;
- metadata.

`RecognitionObservableResult` is domain observable data.

`EdiViewModelSnapshot` is the stable boundary intended for future Viewer reading.

It does not call Viewer, render UI, use React state, dispatch globally, call runtime, own real recognition logic, or mutate project state.

### View Model Snapshot Validation

RFC-1184 validates `EdiViewModelSnapshot` as the correct boundary between EDI observable results and future Viewer exposure.

Review outcome:

- data sufficiency: current recognition section preserves enough for a first Viewer-readable snapshot boundary;
- data excess: the snapshot does not expose the original execution result object and avoids runtime ownership;
- extensibility: future sections can be introduced for memory, reasoning, feedback, and planning without changing Viewer ownership rules;
- immutability: the model remains snapshot-oriented and does not introduce live state;
- independence: no React, Viewer, RuntimeHost, RuntimeLoop, Executor, Consumer, dispatch, or runtime dependency is introduced.

No type change is required in RFC-1184.

Current limits:

- memory, reasoning, feedback, and planning sections are not implemented yet;
- traceability is foundation-level through ids and metadata;
- no automated View Model tests exist yet;
- Viewer exposure is still not implemented.

Readiness:

- `EdiViewModelSnapshot` is ready for a future Viewer Exposure Foundation RFC;
- the Viewer must still read only the View Model Snapshot and not source observable results directly.

The planned next RFC is `RFC-1185 - Viewer Exposure Foundation`.

### EdiViewerExposure

`EdiViewerExposure` introduces the first data boundary between `EdiViewModelSnapshot` and a future Viewer.

It exports:

- `EdiViewerExposureMetadata`;
- `EdiViewerExposureRecognition`;
- `EdiViewerExposure`;
- `createEdiViewerExposureFromSnapshot`.

The exposure receives `EdiViewModelSnapshot` and produces a Viewer-friendly data shape.

It preserves:

- id;
- timestamp;
- recognition status;
- recognition mode;
- recognition execution result id;
- recognition execution request id;
- metadata.

`EdiViewModelSnapshot` is the internal EDI view model boundary.

`EdiViewerExposure` is the future Viewer-facing data boundary.

It does not create Viewer components, render UI, use React state, dispatch globally, call runtime, call RuntimeHost, call RuntimeLoop, call EdiExecutionRuntime, or contain real recognition logic.

No real Viewer is connected in RFC-1185.

### EDI Observable Stack Review

RFC-1186 reviews the full EDI Observable Stack built up to RFC-1185.

Reviewed stack:

```text
Recognition Producer Adapter
↓
Recognition Boundary Pipeline
↓
Recognition Runtime Adapter
↓
Recognition Result Adapter
↓
Recognition Observable Result
↓
EdiViewModelSnapshot
↓
EdiViewerExposure
```

Review outcome:

- RuntimeHost remains separate;
- RuntimeLoop remains separate;
- Viewer remains separate;
- Execution runtime remains injected and not globally owned by the stack;
- Recognition remains a foundation flow, not real recognition;
- Observable Result to View Model boundary is correct;
- View Model to Viewer Exposure boundary is correct;
- no Viewer code, UI, React state, dispatch, or real engine is introduced.

Stable foundations:

- EdiIntegrationBoundary;
- EdiProducerAdapter;
- EdiProducerAdapterRequestFactory;
- EdiProducerAdapterBoundaryPipeline;
- RecognitionProducerAdapter;
- RecognitionProducerBoundaryPipeline;
- RecognitionRuntimeAdapter;
- RecognitionResultAdapter;
- RecognitionObservableFlow;
- EdiViewModelSnapshot;
- EdiViewerExposure.

Provisional foundations:

- diagnostics and traceability remain foundation-level;
- boundary failure fallback remains minimal;
- View Model currently contains recognition only;
- Viewer exposure is data-only and not connected to a real Viewer;
- memory, reasoning, feedback, and planning sections are not implemented yet;
- automated tests for the observable stack are not present yet.

Readiness:

- BagaStudio integration: ready for planning, not implementation;
- Viewer exposure: ready for a dedicated foundation layer, not real UI wiring;
- Memory/Reasoning integration: ready for architecture planning, not runtime wiring.

The next recommended RFC is `RFC-1187 - BagaStudio Integration Planning`.

### BagaStudio Integration Planning

RFC-1187 plans how the reviewed EDI Observable Stack should enter BagaStudio without turning EDI into a Viewer controller.

Decision:

- EDI enters BagaStudio as an observable and consultable capability;
- EDI does not control Viewer directly;
- EDI does not own Project/Product state;
- Viewer must consume EDI indirectly through a presentation boundary;
- `EdiViewerExposure` remains the current EDI-side boundary;
- a future BagaStudio EDI Presentation Adapter should translate `EdiViewerExposure` into a BagaStudio-presentable shape.

Planned relationship:

```text
EDI Observable Stack
↓
EdiViewerExposure
↓
Future BagaStudio EDI Presentation Adapter
↓
Future BagaStudio presentation surface
↓
Viewer or UI consumer
```

The Viewer must not:

- call Recognition Observable Flow;
- call Recognition Runtime Adapter;
- call EdiExecutionRuntime;
- call RuntimeHost;
- call RuntimeLoop;
- read RecognitionObservableResult directly;
- own EDI lifecycle;
- infer runtime behavior from EDI data.

The future Presentation Adapter may translate data for BagaStudio, but it must not:

- render UI;
- create React state;
- call runtime;
- call dispatch;
- mutate Project/Product state;
- execute recognition;
- connect real engines.

First safe BagaStudio integration:

- a passive presentation adapter that receives `EdiViewerExposure`;
- produces a BagaStudio-readable presentation model;
- remains independent from Viewer implementation;
- does not connect to RuntimeHost, RuntimeLoop, Executor, Consumer, or real engines.

The next recommended RFC is `RFC-1188 - BagaStudio EDI Presentation Adapter Review`.

### BagaStudio EDI Presentation Adapter Review

RFC-1188 defines the role of the future BagaStudio EDI Presentation Adapter.

Planned flow:

```text
EdiViewerExposure
↓
BagaStudio EDI Presentation Adapter
↓
BagaStudio Presentation Model
↓
Viewer
```

The Presentation Adapter is the first BagaStudio-owned translation layer after the EDI-side exposure boundary.

It must translate `EdiViewerExposure` into a BagaStudio Presentation Model without exposing EDI internals directly to Viewer or UI layers.

Layer distinction:

- EDI View Model: EDI-owned snapshot of observable EDI data;
- Viewer Exposure: EDI-owned boundary prepared for future product consumption;
- BagaStudio Presentation Model: BagaStudio-owned shape intended for future presentation surfaces;
- Viewer: future consumer of BagaStudio presentation data, not a direct EDI consumer.

The Viewer must not read `EdiViewerExposure` directly because that would:

- make Viewer aware of EDI-specific contracts;
- bypass the BagaStudio ownership boundary;
- risk coupling UI evolution to EDI internals;
- encourage Viewer to call EDI flows or runtime paths directly;
- make future Memory, Reasoning, Feedback, and Planning extensions harder to isolate.

Future Memory, Reasoning, Feedback, and Planning should enter through the same pattern:

```text
EDI observable section
↓
EDI View Model Snapshot
↓
EdiViewerExposure
↓
BagaStudio EDI Presentation Adapter
↓
BagaStudio Presentation Model
```

Ownership:

- EDI owns observable results, View Model Snapshot, and Viewer Exposure;
- BagaStudio owns the Presentation Adapter and Presentation Model;
- Viewer owns rendering and interaction only in a future UI RFC.

RFC-1188 does not implement the adapter. It only defines the architectural boundary.

The next recommended RFC is `RFC-1189 - BagaStudio EDI Presentation Model Foundation`.

### BagaStudio Presentation Model Foundation

RFC-1189 introduces the first BagaStudio-owned presentation model for EDI data.

Implemented file:

- `components/bagastudio/presentation/BagaStudioPresentationModel.ts`

Public exports:

- `BagaStudioPresentationModel`;
- `BagaStudioPresentationMetadata`;
- `BagaStudioEdiPresentationSection`;
- `BagaStudioEdiPresentationRecognition`;
- `createBagaStudioPresentationModelFromEdiViewerExposure`.

The factory receives `EdiViewerExposure` and produces `BagaStudioPresentationModel`.

The model preserves:

- presentation id;
- timestamp;
- EDI section;
- source exposure id;
- recognition status and mode when present;
- metadata useful for future presentation.

Architectural meaning:

- `EdiViewerExposure` is still EDI-owned;
- `BagaStudioPresentationModel` is BagaStudio-owned;
- Viewer should consume future BagaStudio presentation data, not EDI internals;
- no Viewer component, UI, React state, runtime call, dispatch, or real recognition is introduced.

Current shape:

```text
BagaStudioPresentationModel
└─ edi
   ├─ sourceExposureId
   ├─ timestamp
   └─ recognition?
      ├─ status
      ├─ mode
      └─ metadata
```

### BagaStudio Integration Readiness Review

RFC-1190 reviews the state reached after the bridge:

```text
EDI Observable Stack
↓
EdiViewerExposure
↓
BagaStudioPresentationModel
```

Review outcome:

- EDI Observable Stack is sufficiently stable for planning;
- `BagaStudioPresentationModel` is a correct BagaStudio-side boundary;
- Viewer remains separated from EDI internals;
- RuntimeHost and RuntimeLoop remain untouched;
- no UI, React state, Viewer wiring, dispatch, or real recognition is introduced.

Readiness assessment:

- EDI readiness: stable foundation for observable data and presentation planning;
- BagaStudio readiness: ready for product-level planning, not operational product activation;
- Viewer readiness: not ready for real Viewer wiring yet;
- remote readiness: branch should go through a dedicated sync/push review before new operational work.

Missing before real Viewer:

- BagaStudio-side presentation adapter behavior;
- Viewer-facing consumption contract;
- UI ownership rules;
- React state strategy, if any;
- test/validation pattern for presentation data;
- explicit non-runtime data flow into Viewer.

Missing before operational BagaStudio return:

- sync/push review;
- remote branch verification;
- product integration plan;
- ownership rules for project/product state;
- decision on whether EDI remains passive or becomes requestable by product workflows.

Recommended next phase:

1. Sync/push review.
2. BagaStudio operational planning.
3. Viewer exposure wiring only after a dedicated Viewer RFC.

RFC-1190 does not introduce code. It documents readiness only.

### BagaStudio Operational Planning

RFC-1191 defines the operational return path after the EDI Observable Stack and BagaStudio Presentation Model were completed and pushed.

Current bridge:

```text
Recognition Observable Flow
↓
EdiViewModelSnapshot
↓
EdiViewerExposure
↓
BagaStudioPresentationModel
```

Operational decision:

- do not jump directly to Viewer UI;
- do not connect EDI directly to Viewer;
- do not connect EDI directly to Project/Product state;
- introduce a Product State / Presentation Boundary review first.

The first BagaStudio area to resume is not Viewer rendering. It is the product-side boundary that decides how `BagaStudioPresentationModel` can be held, exposed, or transformed without mutating existing project/product runtime state.

Observed BagaStudio surface:

- `components/Viewer3D.tsx` is a large, stateful Viewer surface with product package, runtime metadata, imported model, scene, and UI responsibilities;
- `components/viewer-ui/*` contains Viewer-facing panels and controls;
- product/package logic also appears in admin/runtime and factory/product package files;
- no dedicated BagaStudio documentation boundary currently exists outside the EDI docs.

Frozen EDI areas:

- EDI Observable Stack;
- EdiViewModelSnapshot;
- EdiViewerExposure;
- BagaStudioPresentationModel shape;
- RuntimeHost and RuntimeLoop;
- Execution, Consumer, Preview Integration, and Recognition foundations.

Before code, BagaStudio must analyze:

- where product/project state is owned;
- whether presentation data is stored, derived, or passed through;
- how `BagaStudioPresentationModel` relates to product package/runtime metadata;
- whether the boundary is read-only or can later request actions;
- how Viewer receives product-side presentation data without importing EDI.

Recommended next RFC:

- `RFC-1192 - BagaStudio Product State Boundary Review`.

RFC-1191 does not introduce code. It documents the operational sequence only.

### EDI Strategic Role Definition

RFC-1191B defines the strategic role of EDI in the BagaStudio ecosystem.

Strategic definition:

```text
EDI =
Observation Layer
+
Proposal Layer
+
Validation Support Layer
+
Optimization Layer
+
Memory Layer
+
Business Intelligence Layer
```

EDI is not the Source of Truth.

Source of Truth remains:

- Product Package;
- Project State;
- validated system data.

EDI mission:

- observe the product, project, context, and business process;
- understand patterns, risks, constraints, and opportunities;
- remember useful historical signals;
- propose alternatives and improvements;
- create drafts, plans, documents, and candidate outputs;
- validate as support, not authority;
- optimize across design, production, documentation, and business workflows.

Strategic future domains:

- Design: DXF, DWG, 3D models, environments, clearances, passages, furniture proposals, module proposals, configuration proposals;
- Production: machinery understanding, cut optimization, machining optimization, nesting optimization, waste reduction;
- Documentation: technical sheets, bills of materials, customer documentation, laboratory documentation;
- Business: marketing, sales support, estimates, company memory, decision support;
- Personal support: historical memory, preferences, planning, problem-solving support.

Relationship with Product Package:

- Product Package remains validated structured product data;
- EDI may read, interpret, explain, validate, or propose changes around it;
- EDI must not silently overwrite it;
- EDI proposals must pass through explicit product/project validation before becoming authoritative.

Relationship with BagaStudio:

- BagaStudio owns operational workflows and validated state;
- EDI supports BagaStudio as intelligence, memory, and proposal capability;
- EDI should remain consultable and observable before it becomes operational;
- EDI must not bypass product, project, factory, or business validation gates.

Strategic boundary:

- EDI can observe, understand, remember, propose, create, validate, and optimize;
- EDI cannot become Source of Truth by itself.

RFC-1191B introduces no code. It records strategic ownership and scope.

### BagaStudio Product State Boundary Review

RFC-1192 defines the Product State Boundary and the ownership map between Product Package, EDI, BagaStudio, Viewer, Factory, Project State, and Presentation Model.

Ownership map:

```text
Product Package
↓
Product Source of Truth

Project State
↓
Project Source of Truth

Validated System Data
↓
Operational Authority

EDI
↓
Observation + Memory + Proposal + Optimization

BagaStudio
↓
Validation Layer + Mutation Layer

BagaStudioPresentationModel
↓
Presentation Data Boundary

Viewer
↓
Presentation Layer

Factory
↓
Production Layer
```

Product Package role:

- owns product meaning;
- preserves validated product structure, components, dimensions, metadata, and production-relevant product data;
- can be changed only through explicit BagaStudio validation and mutation paths;
- must not be silently mutated by EDI, Viewer, or Presentation Model.

Project State role:

- owns project-specific context, placement, choices, configuration, and session/project state;
- remains authoritative for the current project;
- must be updated only through explicit BagaStudio mutation paths.

EDI role:

- observes Product Package and Project State;
- remembers, proposes, validates as support, and optimizes;
- may generate proposals, warnings, explanations, documents, and candidate changes;
- does not mutate Product Package or Project State directly;
- is never Source of Truth.

BagaStudio role:

- owns validation and mutation;
- decides whether an EDI proposal can become product/project state;
- protects Product Package and Project State from unvalidated output;
- defines the future proposal-to-validation workflow.

Presentation Model role:

- carries BagaStudio-side presentation data;
- is not Source of Truth;
- does not mutate product/project data;
- must remain safe for future Viewer consumption.

Viewer role:

- presents product/project information;
- may allow user interaction in future RFCs;
- does not own product meaning;
- does not directly mutate Product Package;
- must not consume EDI internals directly.

Factory role:

- consumes validated product/project/production data;
- produces production outputs only through validated factory workflows;
- does not accept EDI proposals as production instructions without validation.

What must not happen:

- Viewer as Source of Truth;
- EDI as Source of Truth;
- Presentation Model as Source of Truth;
- direct EDI mutation of Product Package;
- direct Viewer mutation of Product Package;
- Factory treating EDI suggestions as validated production instructions.

Next recommended RFC:

- `RFC-1193 - BagaStudio Product State Integration Planning`.

RFC-1192 introduces no code. It records ownership and boundary rules.

### BagaStudio Product State Integration Planning

RFC-1193 plans how Product Package and EDI should integrate while preserving the ownership rules defined in RFC-1192.

Observation path:

```text
Product Package
↓
Product Package Observation Adapter
↓
EDI Observation / Memory / Proposal / Optimization
```

The observation adapter must translate validated product data into EDI-readable observations without mutating Product Package, Project State, Viewer, Factory, or Presentation Model.

Proposal path:

```text
EDI
↓
Proposal
↓
BagaStudio Validation Layer
↓
BagaStudio Mutation Layer
↓
Product Package
```

EDI proposals must remain non-authoritative until BagaStudio validates them. Mutation can happen only after validation, through explicit BagaStudio-owned mutation paths.

Presentation path:

```text
Product Package
↓
BagaStudioPresentationModel
↓
Viewer
```

Presentation Model may be derived from Product Package and EDI presentation data, but it is not Source of Truth. Viewer consumes presentation data and must not mutate Product Package directly.

Product Package integration rules:

- Product Package feeds EDI through observation, not mutation;
- Product Package feeds presentation through BagaStudio-owned model generation;
- EDI proposals feed validation, not Product Package directly;
- validated proposals may become mutations only through BagaStudio;
- Factory consumes only validated product/production data.

Required future adapter:

- `Product Package Observation Adapter`.

The next recommended RFC is `RFC-1194 - Product Package Observation Adapter Review`.

RFC-1193 introduces no code. It documents integration planning only.

### Product Package Observation Adapter Review

RFC-1194 defines the future Product Package Observation Adapter.

The adapter is the planned boundary that allows EDI to observe Product Package without mutating it. It must produce a read-only observation snapshot, not a live reference to Viewer state, Product Package state, scene graph state, runtime globals, or Factory outputs.

Planned observation boundary:

```text
Product Package
-> Product Package Observation Adapter
-> Product Package Observation Snapshot
-> EDI Observation / Memory / Proposal / Optimization
```

The adapter may observe product identity, schema/version, source format, dimensions, footprint, component identifiers, component counts, materials, finishes, LED metadata, insert metadata, validation/report metadata, production readiness metadata when already validated, timestamps, and traceability identifiers.

The adapter must not directly expose mutable Product Package references, live Viewer scene objects, `userData` mutation handles, window/global helpers, raw parser internals, unvalidated geometry mutation data, Factory executable instructions, customer/private/business data not explicitly selected for observation, or any object that would let EDI mutate Product Package indirectly.

Read-only snapshot rule:

- Product Package remains the product Source of Truth;
- the adapter produces an immutable-style snapshot;
- the adapter does not mutate Product Package;
- the adapter does not call the Mutation Layer;
- the adapter does not call Viewer, Factory, runtime, UI, or React state;
- the adapter does not generate proposals directly;
- the adapter does not validate product changes;
- the adapter does not execute EDI runtime.

Relationship with future EDI layers:

- Memory may store the observation snapshot as historical product context;
- Proposal may use observations as evidence, but proposal creation is a later layer;
- Optimization may reason over observations, but cannot mutate Product Package directly;
- any proposal generated from observations must still cross BagaStudio Validation Layer before Mutation Layer.

The next recommended RFC is `RFC-1195 - Product Package Observation Snapshot Foundation`.

RFC-1194 introduces no code. It documents the observation boundary only.

### Product Package Observation Snapshot Foundation

RFC-1195 introduces `ProductPackageObservationSnapshot` as the first data contract between Product Package and EDI.

The snapshot is a foundation object only. It does not read Product Package by itself, does not observe live Viewer state, does not call Factory, and does not create proposals. A future Product Package Observation Adapter will be responsible for extracting selected Product Package data and creating this snapshot.

Snapshot contract:

```text
Product Package
-> future Product Package Observation Adapter
-> ProductPackageObservationSnapshot
-> EDI Memory / Reasoning / Proposal / Optimization
```

The snapshot contains:

- stable id and timestamp;
- optional productPackageId and productPackageVersion;
- optional schema and sourceFormat;
- optional status;
- optional dimensions and footprint summaries;
- componentIds;
- componentCount;
- component summaries;
- material and finish summaries;
- traceability metadata.

Snapshot rules:

- read-only data shape;
- immutable-style readonly arrays;
- serializable fields only;
- no mutation functions;
- no runtime references;
- no Viewer references;
- no Factory references;
- no React state;
- no proposal generation.

The snapshot can later feed EDI Memory as historical product context, Reasoning as product evidence, Proposal as non-authoritative input, and Optimization as observable product structure. Any proposal derived from it still requires BagaStudio Validation Layer before Mutation Layer.

RFC-1195 introduces no adapter, no runtime wiring, no Viewer integration, and no Product Package mutation.

## Foundation vs Wiring vs Integration

### Foundation

Foundation includes the stable contracts and preview primitives:

- activation context;
- intent;
- action;
- execution plan;
- execution request;
- execution result;
- executor contract;
- preview executors;
- producer adapter contract.

Foundation defines what exists and how the pieces are shaped.

### Wiring

Wiring connects existing foundation pieces without activating product behavior.

Current wiring includes:

- preview executor registry population;
- executor selector creation;
- execution runtime creation;
- preview execution result consumer registry population;
- preview execution result consumer registry construction;
- execution result dispatcher construction;
- preview execution and consumption wiring.

Wiring makes the preview runtime ready to use, but does not run it automatically.

### Preview Integration

Preview Integration is implemented only as an explicit helper.

Current Preview Integration:

- `runEdiPreviewExecutionAndDispatch`
- `EdiIntegrationBoundary`

It is:

- caller-driven;
- synchronous;
- stateless;
- preview-only;
- boundary-validated before execution runtime;
- disconnected from UI, Viewer, RuntimeHost, RuntimeLoop, cognitive runtime, and real engines.

### Real Integration

Real Integration is not implemented in the current foundation.

Real Integration would include future controlled connections to:

- UI;
- Viewer;
- cognitive runtime;
- real engines;
- product workflows;
- execution result consumption.

This document does not claim that real integration exists.

Producer adapters are a future pre-boundary layer. They are not RuntimeHost, RuntimeLoop, Executor, Consumer, or real engine integrations.

Consumer wiring does not mean result integration. The current consumer registry can be constructed, but no implemented layer automatically passes execution results into consumers.

The current `PreviewExecutionAndConsumptionWiring` object exposes components together but does not orchestrate them.

## Architectural Boundaries

The execution foundation is separated into:

- core data contracts;
- runtime builders;
- executor registry;
- executor selector;
- execution runtime;
- preview executors;
- preview wiring;
- execution result consumer contracts;
- preview result consumer wiring;
- execution result dispatcher;
- preview execution and consumption wiring;
- preview execution and dispatch helper;
- integration boundary.

Core contracts do not depend on runtime.

Preview executors do not depend on engine runtimes.

Runtime wiring does not depend on Viewer, UI, Admin, or real engines.

Producer adapters remain separate from executors.

Cognitive runtime remains separate from execution runtime.

Execution result consumers remain separate from `EdiExecutionRuntime` and are not invoked automatically.

`EdiExecutionResultDispatcher` remains separate from `EdiExecutionRuntime` and `ExecutionResultConsumerRegistry`.

`EdiIntegrationBoundary` remains separate from RuntimeHost, RuntimeLoop, Execution, Consumption, and Preview Integration. It validates the edge without importing real runtime owners.

The boundary sits before runtime. Preview Integration and future integration adapters may use it before handing a request to execution runtime components, but RuntimeHost, RuntimeLoop, Executor, and Consumer must remain unaware of it.

`EdiProducerAdapter` sits before `EdiIntegrationBoundary`. It describes future source adaptation and remains separate from boundary validation, runtime execution, consumers, preview executors, and real engines.

## Forbidden Dependencies

The execution foundation must not depend on:

- Viewer;
- React UI;
- Three.js;
- Admin runtime;
- Render Engine;
- Room Intelligence runtime;
- Pricing Engine runtime;
- Factory Engine runtime;
- Product Package runtime;
- Import parser runtime;
- Recognition runtime;
- Scene Composer;
- filesystem;
- command bus;
- plugin system;
- ProjectEventBridge;
- automatic subscriptions;
- async queues;
- AI/LLM classifier;
- automatic result routing;
- runtime result integration.

## Permanent Rules

- Foundation is not Integration.
- Wiring is not automatic activation.
- Preview executor output is descriptive only.
- Preview executor `succeeded` means descriptor produced, not real operation completed.
- `payload` must not be treated as a command.
- Executor Registry does not rank.
- Executor Selector returns candidates.
- EdiExecutionRuntime has no domain-specific logic.
- No preview executor may call real engines.
- No execution component may mutate project state in this foundation.
- All runtime activation remains explicit and caller-driven.
- Execution result consumers must remain neutral until an explicit integration RFC exists.
- Consumer wiring must not be described as runtime integration.
- Runtime is not Dispatcher.
- Dispatcher is not Consumer Registry.
- Wiring Object is not Orchestrator.
- Helper Integration is not Orchestrator.
- Integration Boundary is not Real Integration.
- Integration Boundary is before Runtime.
- RuntimeHost and RuntimeLoop do not import Integration Boundary.
- Boundary Failure is Pre-Runtime.
- Boundary Failure is not Executor Failure.
- Producer Adapter is not Real Engine.
- Producer Adapter is before Integration Boundary.
- Producer Adapter produces request input, not runtime execution.
- Producer Adapter does not call Executor or Consumer.
- Producer Adapter Request Factory is not Integration.
- Producer Adapter Request Factory does not call Boundary or Runtime.
- Producer Adapter Boundary Pipeline is Pre-Runtime.
- Producer Adapter Boundary Pipeline does not execute or dispatch.
- Recognition Producer Boundary Pipeline is Pre-Runtime.
- Recognition Producer Boundary Pipeline returns boundary validation, not execution result.
- Recognition Producer Pipeline Validation is documentation-backed until a project test pattern exists.
- Recognition Producer does not call runtime directly.
- Recognition Runtime Adapter is the future runtime entry point.
- Recognition Runtime Adapter must not dispatch.
- Recognition Runtime Adapter receives boundary-valid requests only.
- Recognition Runtime Adapter uses injected EdiExecutionRuntime.
- Recognition Runtime Adapter does not expose results directly to Viewer.
- Recognition Result Adapter is the future result exposure boundary.
- Recognition Result Adapter produces observable data, not UI.
- Recognition Result Adapter does not dispatch.
- Recognition Observable Flow is not Viewer Integration.
- Recognition Observable Flow must stay helper-driven.
- Recognition Observable Flow handles boundary failure without runtime execution.
- Recognition Observable Flow returns observable data, not UI.
- First Observable Recognition Flow is reviewed.
- Viewer exposure requires a dedicated RFC.
- Viewer must read View Model Snapshot, not RecognitionObservableResult.
- EDI View Model Snapshot is immutable, not live state.
- EDI View Model Snapshot exists as foundation.
- EDI View Model Snapshot is data, not Viewer UI.
- EDI View Model Snapshot is validated as the Viewer boundary.
- Viewer Exposure Foundation must read only EDI View Model Snapshot.
- Viewer Exposure reads View Model Snapshot, not runtime.
- Viewer Exposure is data, not final Viewer UI.
- EDI Observable Stack is reviewed.
- BagaStudio integration requires a dedicated planning RFC.
- EDI is an observable capability, not a Viewer controller.
- Viewer must consume EDI indirectly through a presentation boundary.
- EdiViewerExposure is the EDI-side boundary for future BagaStudio presentation.
- BagaStudio EDI Presentation Adapter requires a dedicated RFC.
- BagaStudio Presentation Model must hide EDI internals from Viewer.
- Viewer must not read EdiViewerExposure directly.
- Memory, Reasoning, Feedback, and Planning must enter presentation through the same adapter boundary.
- BagaStudio Presentation Model is BagaStudio-owned, not EDI runtime-owned.
- BagaStudio Presentation Model is data, not UI or React state.
- BagaStudio Integration Readiness is planning readiness, not product activation.
- Sync/push review should happen before the next operational phase.
- Viewer wiring requires a dedicated RFC after product-side planning.
- Operational return starts with Product State / Presentation Boundary review.
- Viewer UI must not be the first operational integration target.
- Product/Project state ownership must be understood before wiring.
- EDI is strategic intelligence, not Source of Truth.
- Product Package, Project State, and validated system data remain Source of Truth.
- EDI proposals require explicit validation before becoming authoritative.
- EDI can support design, production, documentation, business, and personal workflows.
- Product Package owns product meaning.
- BagaStudio owns validation and mutation.
- Viewer is presentation, not product authority.
- Factory consumes validated production data, not raw EDI proposals.
- Presentation Model is not Source of Truth.
- Product Package observation must be adapter-mediated.
- EDI proposal path must pass through Validation Layer before Mutation Layer.
- Product Package can feed presentation, but Presentation Model remains non-authoritative.
- Product Package Observation Adapter must produce read-only snapshots.
- Product Package Observation Adapter must not expose live mutable Product Package references.
- Product Package Observation Adapter must not call Viewer, Factory, runtime, UI, or Mutation Layer.
- Product Package Observation Adapter does not create proposals.
- Product Package Observation Snapshot is read-only and serializable.
- Product Package Observation Snapshot must not contain mutation functions or runtime references.
- Product Package Observation Snapshot is evidence for Memory, Reasoning, Proposal, and Optimization, not a mutation contract.

## Residual Risks

- Preview results may be misread as real execution unless documentation remains explicit.
- `EdiExecutionRuntime` currently uses the first selector candidate and intentionally does not rank.
- Async executor support is explicitly not part of this foundation.
- `PreviewExecutionRuntime` is available, but it is not integrated into product UI or cognitive runtime.
- `PreviewExecutionResultConsumerRegistry` is available, but it is not connected to `EdiExecutionRuntime`.
- `PreviewExecutionResultConsumerRuntime` constructs a registry only and does not consume results.
- `EdiExecutionResultDispatcher` can dispatch to registered consumers, but it is not automatically connected to runtime output.
- `PreviewExecutionAndConsumptionWiring` exposes components together, but it does not execute or dispatch.
- `runEdiPreviewExecutionAndDispatch` connects execution and dispatch only when explicitly called.
- `EdiIntegrationBoundary` validates requests for boundary crossing but does not connect real runtime.
- Boundary placement is documented, and only preview integration wiring has been introduced.
- Preview Integration now uses the boundary before execution runtime, but no real runtime integration has been introduced.
- Boundary failure semantics are documented as terminal and pre-runtime, with no automatic recovery or targetDomain inference.
- Producer adapter foundation exists as a contract only; no real producer is connected.
- Producer adapter to boundary contract is documented, but no producer is wired operationally.
- Producer adapter request factory exists, but no real producer calls it yet.
- Producer adapter boundary pipeline exists, but no real producer or runtime calls it yet.
- Recognition Producer Adapter Foundation exists, but recognition real integration is not implemented.
- Recognition Producer Boundary Pipeline exists, but it remains pre-runtime and does not dispatch or execute.
- Recognition Producer Pipeline Validation is documented, but no automated test framework has been introduced for it.
- Recognition Runtime Adapter exists as a foundation, but it does not perform real recognition or dispatch.
- Recognition Result Adapter exists as a foundation, but it is not connected to Viewer, UI, dispatch, or real recognition.
- Recognition Observable Flow exists as a foundation, but it is not connected to Viewer, UI, dispatch, or real recognition.
- Recognition Observable Flow traceability is foundation-level and may need richer diagnostics before Viewer exposure.
- Recognition Observable Flow fallback is controlled but minimal.
- Recognition Observable Flow has no automated tests yet.
- GitHub remote synchronization still requires a dedicated local/remote verification before push.
- Viewer exposure via View Model Snapshot is partially prepared, but no Viewer wiring exists.
- Viewer Exposure Foundation exists, but no real Viewer is connected.
- View Model Snapshot currently contains only recognition data.
- Memory, reasoning, feedback, and planning sections are deferred.
- Observable stack traceability and diagnostics remain minimal.
- BagaStudio product integration is not planned in code yet.
- BagaStudio EDI Presentation Adapter is not implemented yet.
- BagaStudio Presentation Model exists, but no Viewer consumes it yet.
- BagaStudio Presentation Model currently exposes only the EDI recognition presentation section.
- No BagaStudio operational plan exists yet.
- No sync/push review has been performed after RFC-1190.
- Viewer wiring remains explicitly out of scope.
- Product/Project state boundary is not defined yet.
- Viewer3D is stateful and should not consume EDI directly.
- Relationship between BagaStudioPresentationModel and product package/runtime metadata is not defined yet.
- Strategic EDI capabilities are documented but not implemented operationally.
- Proposal-to-validation workflow is not defined yet.
- Business intelligence and personal memory scopes require future privacy and governance review.
- Product State Integration is not implemented yet.
- Product Package to Presentation Model flow is not defined yet.
- EDI observation path over Product Package is not implemented yet.
- EDI proposal validation path is not defined yet.
- Product Package Observation Adapter is defined only as a documented boundary; no adapter implementation exists yet.
- Product Package to Presentation Model generation is not implemented yet.
- Proposal validation and mutation contracts are not implemented yet.
- Product Package Observation Snapshot exists, but no Product Package Observation Adapter creates it yet.
- Observable Product Package field allowlist needs a dedicated foundation.
- Product/customer/business metadata selection requires future privacy and governance review.
- Viewer calling EDI flows directly would break the Observable Stack boundary.
- Viewer reading EdiViewerExposure directly would bypass BagaStudio ownership.
- Product state ownership rules still need a dedicated integration plan.
- Future real executors will require stricter domain boundaries and validation strategy.
- Future integration will need explicit ownership rules before connecting to product workflows.

## Links To Evolution Log

The Evolution Log should record a milestone:

```text
EDI Execution Foundation — RFC-1126 to RFC-1150
```

Suggested points:

- completed the cognitive-to-execution foundation path;
- introduced immutable contracts for intent, action, plan, request, and result;
- introduced executor contract, registry, selector, and execution runtime;
- introduced six read-only preview executors;
- introduced preview registry population and runtime wiring;
- introduced neutral execution result consumer contracts and preview consumer wiring;
- introduced execution result dispatcher and passive execution/consumption wiring;
- introduced first controlled preview integration helper;
- introduced integration boundary between preview integration and future real runtime;
- deferred product integration and real engine execution.

## Links To Decision Log

The Decision Log should record:

- Intent and Action are non-operational contracts.
- Execution Plan, Request, and Result are serializable data contracts.
- Executor Registry is static and non-mutating.
- Executor Selector returns candidates without ranking.
- EdiExecutionRuntime has no domain-specific logic.
- Preview executors are read-only and descriptive.
- PreviewExecutionRuntime is wiring, not integration.
- Execution Result Consumer is neutral and side-effect free.
- Consumer Registry is separate from Consumer Runtime.
- Consumer Wiring is separate from Runtime Integration.
- Runtime is not Dispatcher.
- Dispatcher is not Consumer Registry.
- Wiring Object is not Orchestrator.
- Helper Integration is not Orchestrator.
- Integration Boundary is not Real Integration.
- Real engine executors are deferred.

## Recommended Next Steps

1. Add the Evolution Log milestone for RFC-1126 to RFC-1150.
2. Add the Decision Log entries listed above.
3. Add a Master Index entry pointing to this document.
4. Design how execution results should be consumed before connecting UI.
5. Design controlled integration with the cognitive runtime.
6. Defer real engine executors until preview behavior and boundaries are validated.
7. Define a future explicit result consumption integration RFC before connecting consumers to runtime output.
8. Define validation for Recognition Runtime Adapter once a project test pattern exists.
9. Define validation for Recognition Result Adapter once a project test pattern exists.
10. Define validation for Recognition Observable Flow once a project test pattern exists.
11. Define validation for EDI View Model Snapshot once a project test pattern exists.
12. Define validation for Viewer Exposure once a project test pattern exists.
13. RFC-1187 - BagaStudio Integration Planning.
14. RFC-1188 - BagaStudio EDI Presentation Adapter Review.
15. RFC-1189 - BagaStudio EDI Presentation Model Foundation.
16. Define BagaStudio EDI Presentation Adapter behavior before Viewer wiring.
17. Perform sync/push review before starting the next operational phase.
18. Plan BagaStudio operational integration before Viewer wiring.
19. RFC-1192 - BagaStudio Product State Boundary Review.
20. Define proposal-to-validation workflow for EDI outputs.
21. RFC-1193 - BagaStudio Product State Integration Planning.
22. RFC-1194 - Product Package Observation Adapter Review.
23. RFC-1195 - Product Package Observation Snapshot Foundation.
24. Product Package Observation Adapter Foundation.
