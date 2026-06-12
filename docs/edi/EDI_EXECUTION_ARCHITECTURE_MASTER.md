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
Future Real Producer Adapter
-> EdiIntegrationBoundary
-> EdiExecutionRequest
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
- `EdiProducerAdapterInput`;
- `EdiProducerAdapterOutput`;
- `EdiProducerAdapter`.

A producer adapter is not a real engine. It does not parse files, inspect Viewer state, call product runtimes, mutate projects, call RuntimeHost, call RuntimeLoop, or execute requests.

Its role is to describe how a future source could prepare data compatible with future `EdiExecutionRequest` creation before crossing `EdiIntegrationBoundary`.

No concrete Import, Recognition, Viewer, Pricing, Factory, Layout, or Join real producer is implemented in this foundation.

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
