# EDI Execution Decision Log

## Status

Foundation Complete.

This document records the permanent architectural decisions made for the EDI Execution Layer foundation introduced from RFC-1126 to RFC-1150.

The decisions below describe implemented foundation and wiring behavior only. They do not describe product integration, real engine execution, UI wiring, command bus behavior, or project mutation.

## Scope

Covered foundation:

- Cognitive State Runtime
- Cognitive Activation Context
- Intent
- Action
- Execution Plan
- Execution Request
- Execution Result
- Executor Contract
- Executor Registry
- Executor Selector
- EdiExecutionRuntime
- Preview Executors
- PreviewExecutorRegistry
- PreviewExecutionRuntime
- Execution Result Consumer
- Execution Result Consumer Registry
- Preview Execution Result Consumer Wiring
- Execution Result Dispatcher
- Preview Execution And Consumption Wiring
- Preview Execution And Dispatch Helper
- Integration Boundary

## DL-EXEC-001 — Execution Runtime Neutro

### Problema

L'Execution Layer aveva bisogno di un punto unico capace di ricevere una `EdiExecutionRequest`, selezionare un executor e restituire sempre una `EdiExecutionResult`, senza introdurre logica di dominio o collegamenti a engine reali.

### Decisione

Introdurre `EdiExecutionRuntime` come orchestratore neutro dell'esecuzione EDI.

Il runtime:

- riceve `EdiExecutionRequest`;
- usa `EdiExecutorSelector`;
- invoca `executor.execute(request)`;
- restituisce sempre `EdiExecutionResult`;
- gestisce failure path controllati.

### Motivazione

La responsabilità di orchestrare la richiesta deve essere separata sia dai contratti core sia dai singoli executor. Questo mantiene il punto di esecuzione prevedibile, testabile e privo di dipendenze verso Viewer, UI, RuntimeHost, RuntimeLoop o engine reali.

### Alternative Scartate

- Far eseguire direttamente il caller.
- Inserire l'esecuzione dentro `ExecutorSelector`.
- Inserire l'esecuzione dentro `ExecutorRegistry`.
- Collegare l'esecuzione a `EdiRuntimeHost` o `EdiRuntimeLoop`.

### Impatto Architetturale

`EdiExecutionRuntime` diventa il boundary runtime tra request e executor. Il resto della pipeline resta esplicito e caller-driven.

### Regole Permanenti Generate

- Il runtime execution non contiene logica domain-specific.
- Il runtime execution non importa Viewer, UI, RuntimeHost, RuntimeLoop o engine reali.
- Il runtime execution deve restituire un risultato controllato anche in failure path.

## DL-EXEC-002 — Registry Separato Da Selector

### Problema

Serviva un modo per custodire executor disponibili senza trasformare il registro in un selettore intelligente o in un orchestratore.

### Decisione

Separare `ExecutorRegistry` da `ExecutorSelector`.

`ExecutorRegistry` conserva executor e supporta lookup descrittivi per:

- id;
- domain;
- mode.

### Motivazione

Il registry deve restare una struttura statica e non mutabile. Il suo ruolo è custodire e restituire executor, non interpretare request o scegliere il candidato migliore.

### Alternative Scartate

- Inserire ranking nel registry.
- Inserire selection policy nel registry.
- Introdurre register/unregister mutabili.
- Introdurre plugin discovery.

### Impatto Architetturale

La responsabilità di storage rimane isolata. Il registry può essere popolato in modo deterministico e riutilizzato senza lifecycle globale.

### Regole Permanenti Generate

- Il registry non ranka.
- Il registry non esegue.
- Il registry non valida readiness.
- Il registry non ha register/unregister nella foundation.
- Il registry non introduce plugin system.

## DL-EXEC-003 — Selector Separato Da Runtime

### Problema

La selezione degli executor candidati doveva essere separata dall'esecuzione per evitare che il runtime diventasse responsabile anche del matching.

### Decisione

Introdurre `ExecutorSelector` come helper dedicato che seleziona candidati usando `EdiExecutionRequest` e `ExecutorRegistry`.

### Motivazione

Il selector traduce request domain/mode in candidati registry. Il runtime usa il risultato del selector, ma non implementa il matching.

### Alternative Scartate

- Far selezionare direttamente `EdiExecutionRuntime`.
- Far scegliere un singolo executor dal selector.
- Introdurre fallback o ranking.
- Introdurre `canExecute` o `validate`.

### Impatto Architetturale

La pipeline execution resta composta da piccoli layer indipendenti:

```text
Request
-> Selector
-> Registry
-> Executor candidates
-> Runtime execution
```

### Regole Permanenti Generate

- Il selector restituisce candidati.
- Il selector non sceglie il migliore.
- Il selector non chiama `execute`.
- Il selector non usa ranking, scoring, fallback o validation.

## DL-EXEC-004 — Preview Executor Separati Dagli Engine Reali

### Problema

Era necessario introdurre executor concreti senza anticipare engine integration o operazioni reali sui domini Import, Recognition, Layout, Join, Pricing e Factory.

### Decisione

Creare preview executor separati dagli engine reali:

- `importPreviewExecutor`
- `recognitionPreviewExecutor`
- `layoutPreviewExecutor`
- `joinPreviewExecutor`
- `pricingPreviewExecutor`
- `factoryPreviewExecutor`

Ogni preview executor implementa `EdiExecutor`, consuma `EdiExecutionRequest` e produce `EdiExecutionResult` descrittivo.

### Motivazione

I preview executor permettono di validare il contratto execution end-to-end senza collegarsi a parser, Viewer, Scene Composer, Pricing Engine, Factory Engine, Room Intelligence o Product Package runtime.

### Alternative Scartate

- Collegare subito executor a engine reali.
- Usare producer adapter come executor.
- Generare output operativi.
- Usare payload come comando.

### Impatto Architetturale

La foundation può testare selezione, registry, runtime e result production restando side-effect free.

### Regole Permanenti Generate

- Preview executor output è solo descrittivo.
- Preview executor non chiama engine reali.
- Preview executor non muta il progetto.
- Preview executor non produce file, diff, UI instruction o istruzioni produttive.
- `succeeded` nei preview executor significa descriptor prodotto, non operazione reale completata.

## DL-EXEC-005 — Wiring Separato Da Integration

### Problema

Dopo aver creato executor, registry, selector e runtime serviva un punto di wiring pronto all'uso senza collegare automaticamente la pipeline a UI, Viewer, cognitive runtime o engine reali.

### Decisione

Introdurre:

- `PreviewExecutorRegistry`
- `PreviewExecutionRuntime`

come wiring foundation.

### Motivazione

Il wiring deve costruire componenti già disponibili, non attivare comportamenti di prodotto. Questo consente di avere un runtime preview pronto all'uso mantenendo l'integrazione esplicita e futura.

### Alternative Scartate

- Collegare automaticamente `PreviewExecutionRuntime` a `EdiRuntimeHost`.
- Collegare execution alla UI.
- Collegare execution al Viewer.
- Registrare executor tramite lifecycle globale.
- Eseguire request automaticamente.

### Impatto Architetturale

Il sistema distingue chiaramente:

- Foundation: contratti e componenti base.
- Wiring: composizione dei componenti.
- Integration: collegamento al prodotto reale, non ancora implementato.

### Regole Permanenti Generate

- Wiring non è Integration.
- Wiring non attiva execution automatica.
- Wiring non introduce subscription.
- Wiring non collega UI, Viewer, RuntimeHost o RuntimeLoop.

## DL-EXEC-006 — Execution Foundation Read-Only

### Problema

L'Execution Layer introduce il lessico di esecuzione, ma in questa fase non deve produrre effetti reali né modificare il progetto.

### Decisione

Mantenere tutta l'Execution Foundation read-only, descrittiva e side-effect free.

### Motivazione

La priorità architetturale è validare i contratti e i confini prima di introdurre executor reali. La separazione riduce il rischio di accoppiamento prematuro e protegge le funzionalità già validate.

### Alternative Scartate

- Introdurre executor mutativi.
- Introdurre command bus.
- Introdurre handler operativi.
- Introdurre output produttivi.
- Introdurre integration con engine reali.

### Impatto Architetturale

La foundation resta sicura, testabile e reversibile. Le future integrazioni dovranno passare da RFC dedicate.

### Regole Permanenti Generate

- Nessuna mutazione progetto nella foundation.
- Nessun command bus nella foundation.
- Nessun engine reale nella foundation.
- Nessuna UI instruction nella foundation.
- Nessuna execution automatica nella foundation.
- Ogni futura execution reale richiede RFC specifica e confini espliciti.

## DL-EXEC-007 — Execution Result Consumer Neutro

### Problema

L'Execution Layer produce `EdiExecutionResult`, ma serviva un contratto ufficiale per consumare questi risultati senza introdurre UI, RuntimeHost, RuntimeLoop, event bus o mutazioni progetto.

### Decisione

Introdurre `EdiExecutionResultConsumer` come contratto neutro.

Il consumer:

- ha id e name;
- espone `consume(result)`;
- riceve `EdiExecutionResult`;
- non impone side effect.

### Motivazione

Il consumo del risultato deve essere modellato prima dell'integrazione reale, ma senza anticipare comportamenti UI, engine o pipeline cognitive.

### Alternative Scartate

- Consumare risultati direttamente dentro `EdiExecutionRuntime`.
- Collegare subito i risultati alla UI.
- Usare event bus o callback globali.
- Mutare il progetto durante il consumo.

### Impatto Architetturale

Il result consumption diventa un contratto separato e testabile, senza accoppiarsi al runtime di esecuzione.

### Regole Permanenti Generate

- Il consumer è neutro.
- Il consumer non implica UI.
- Il consumer non implica mutazione progetto.
- Il consumer non è Runtime Integration.

## DL-EXEC-008 — Consumer Registry Separato Dal Consumer Runtime

### Problema

Serviva un punto per custodire consumer disponibili senza eseguirli automaticamente o introdurre routing.

### Decisione

Introdurre `ExecutionResultConsumerRegistry` separato dal consumer runtime/wiring.

Il registry:

- riceve consumer dall'esterno;
- mantiene ordine deterministico;
- espone elenco consumer;
- supporta lookup by id.

### Motivazione

La registrazione dei consumer deve restare separata dall'eventuale consumo dei risultati. Questo evita routing prematuro, ranking e side effect.

### Alternative Scartate

- Eseguire automaticamente i consumer al momento della registrazione.
- Inserire routing nel registry.
- Inserire ranking o filtering custom.
- Collegare registry a `EdiExecutionRuntime`.

### Impatto Architetturale

Il sistema può costruire un catalogo consumer stabile senza attivare alcun comportamento.

### Regole Permanenti Generate

- Il consumer registry non consuma risultati.
- Il consumer registry non fa routing.
- Il consumer registry non ranka.
- Il consumer registry non è integration.

## DL-EXEC-009 — Consumer Wiring Separato Da Runtime Integration

### Problema

Dopo aver creato consumer e registry, serviva un punto ufficiale di wiring preview senza collegare automaticamente i risultati prodotti da `EdiExecutionRuntime`.

### Decisione

Introdurre:

- `PreviewExecutionResultConsumerRegistry`
- `PreviewExecutionResultConsumerRuntime`

come wiring foundation.

### Motivazione

Il wiring deve rendere disponibile un registry consumer pronto all'uso, ma non deve consumare risultati, collegarsi al runtime execution o attivare pipeline.

### Alternative Scartate

- Collegare automaticamente `EdiExecutionRuntime` ai consumer.
- Consumare ogni result appena prodotto.
- Collegare consumer a UI, Viewer o RuntimeHost.
- Usare queue, event bus o subscription.

### Impatto Architetturale

Il consumer side completa la foundation senza trasformarsi in integration. La futura Runtime Integration dovrà essere progettata esplicitamente.

### Regole Permanenti Generate

- Consumer Wiring non è Runtime Integration.
- Consumer Wiring non consuma risultati automaticamente.
- Consumer Wiring non collega `EdiExecutionRuntime`.
- Consumer Wiring non introduce UI, Viewer, RuntimeHost, RuntimeLoop o engine reali.

## DL-EXEC-010 — Runtime Non È Dispatcher

### Problema

Dopo l'introduzione del consumer side, era possibile collegare direttamente `EdiExecutionRuntime` ai consumer, trasformando il runtime in un punto di dispatch.

### Decisione

Mantenere `EdiExecutionRuntime` separato da `EdiExecutionResultDispatcher`.

`EdiExecutionRuntime` produce `EdiExecutionResult`.

`EdiExecutionResultDispatcher` dirama un result già prodotto verso i consumer registrati.

### Motivazione

La produzione del result e il consumo del result sono responsabilità diverse. Separarle evita integration implicita e mantiene il runtime neutro.

### Alternative Scartate

- Far chiamare i consumer direttamente dal runtime.
- Far conoscere il consumer registry al runtime.
- Aggiungere dispatch automatico a `runExecution`.

### Impatto Architetturale

Execution e Consumption restano layer separati. Il caller futuro potrà decidere esplicitamente se e quando dispatchare.

### Regole Permanenti Generate

- Runtime non è Dispatcher.
- Runtime non conosce consumer.
- Runtime non consuma result.
- Dispatch richiede passaggio esplicito.

## DL-EXEC-011 — Dispatcher Non È Consumer Registry

### Problema

Il dispatcher aveva bisogno di accedere ai consumer disponibili, ma non doveva diventare owner dello storage o della registrazione.

### Decisione

Mantenere `EdiExecutionResultDispatcher` separato da `ExecutionResultConsumerRegistry`.

Il dispatcher riceve un registry già costruito e usa `getConsumers()`.

### Motivazione

Il registry custodisce consumer. Il dispatcher invoca consumer. Separare le responsabilità evita routing, ranking, filtering e lifecycle implicito.

### Alternative Scartate

- Far creare il registry al dispatcher.
- Far registrare consumer al dispatcher.
- Inserire routing o filtering nel dispatcher.

### Impatto Architetturale

Il dispatcher resta stateless e può essere usato con registry differenti senza mutazioni.

### Regole Permanenti Generate

- Dispatcher non è Consumer Registry.
- Dispatcher non registra consumer.
- Dispatcher non filtra consumer.
- Dispatcher non ranka consumer.

## DL-EXEC-012 — Wiring Object Non È Orchestrator

### Problema

Una volta disponibili execution runtime, consumer registry e dispatcher, era necessario un punto unico di costruzione senza introdurre un orchestrator operativo.

### Decisione

Introdurre `PreviewExecutionAndConsumptionWiring` come wiring object passivo.

Il wiring object costruisce e restituisce:

- `executionRuntime`
- `consumerRegistry`
- `executionResultDispatcher`

### Motivazione

Il wiring rende ergonomica la composizione dei componenti preview, ma non deve ricevere request, eseguire request, dispatchare result o consumare result.

### Alternative Scartate

- Creare un orchestrator `runAndDispatch`.
- Eseguire automaticamente request.
- Dispatchare automaticamente result.
- Collegare il wiring alla pipeline cognitiva.

### Impatto Architetturale

Execution e Consumption sono disponibili insieme senza diventare Integration.

### Regole Permanenti Generate

- Wiring Object non è Orchestrator.
- Wiring Object non riceve request.
- Wiring Object non esegue.
- Wiring Object non dispatcha.
- Wiring Object non consuma.

## DL-EXEC-013 — Helper Integration Non È Orchestrator

### Problema

Dopo la disponibilità del wiring passivo, serviva un primo helper esplicito capace di collegare execution e dispatch per una singola request senza trasformarsi in orchestrator, runtime globale o integration reale.

### Decisione

Introdurre `runEdiPreviewExecutionAndDispatch` come helper di preview integration controllata.

Il helper riceve dall'esterno:

- `EdiExecutionRequest`;
- `EdiExecutionRuntime`;
- `EdiExecutionResultDispatcher`;
- `EdiExecutionResultConsumerRegistry`.

Il helper esegue la request, dispatcha il result e restituisce `EdiExecutionResult`.

### Motivazione

Il primo livello di integration deve essere esplicito, sincrono, stateless e caller-driven. Il helper collega componenti già costruiti senza crearli, possederli o trasformarsi in lifecycle manager.

### Alternative Scartate

- Creare un orchestrator con stato interno.
- Inserire dispatch dentro `EdiExecutionRuntime`.
- Inserire execution dentro `EdiExecutionResultDispatcher`.
- Collegare automaticamente UI, Viewer, RuntimeHost o RuntimeLoop.
- Introdurre queue, event bus o subscription.

### Impatto Architetturale

EDI ottiene il primo flow preview completo:

```text
Execution
-> Result
-> Dispatch
-> Consumer
```

Il flow resta esplicito e non introduce real integration.

### Regole Permanenti Generate

- Helper Integration non è Orchestrator.
- Helper Integration non crea componenti.
- Helper Integration non possiede stato.
- Helper Integration non introduce lifecycle.
- Helper Integration non è real integration.

## DL-EXEC-014 — Integration Boundary Protegge Real Integration

### Problema

Dopo la preview integration controllata, serviva un confine esplicito verso la futura real integration senza collegare RuntimeHost, RuntimeLoop, Viewer, UI o engine reali.

### Decisione

Introdurre `EdiIntegrationBoundary` come foundation minimale.

La boundary espone:

- `createEdiIntegrationBoundaryRequest`;
- `validateEdiIntegrationBoundaryRequest`.

### Motivazione

Il passaggio da Preview Integration a Real Integration deve essere protetto da un confine architetturale esplicito. La boundary consente di validare una `EdiExecutionRequest` prima di attraversare quel confine, senza alterare i contratti pubblici esistenti e senza introdurre runtime reale.

### Alternative Scartate

- Collegare Preview Integration direttamente a RuntimeHost.
- Importare RuntimeHost nella preview integration.
- Importare Preview Integration in RuntimeHost.
- Introdurre `runRealIntegration`.
- Collegare engine reali.

### Impatto Architetturale

La boundary crea un punto di controllo futuro senza cambiare Execution, Consumption, Wiring o Preview Integration.

### Regole Permanenti Generate

- Integration Boundary non è Real Integration.
- Integration Boundary non importa RuntimeHost.
- Integration Boundary non importa RuntimeLoop.
- Integration Boundary non importa Preview Integration.
- Integration Boundary non collega engine reali.
- Integration Boundary valida senza mutare la request.
