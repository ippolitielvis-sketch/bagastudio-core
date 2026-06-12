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
- Integration Boundary Wiring Rule
- Preview Integration Boundary Wiring
- Boundary Failure Semantics
- Real Producer Adapter Foundation
- Producer Adapter Boundary Contract
- Producer Adapter Request Factory
- Producer Adapter Boundary Pipeline
- First Real Producer Adapter Candidate
- Recognition Producer Adapter Foundation
- Recognition Producer Boundary Pipeline
- Recognition Producer Pipeline Validation
- Recognition Producer Runtime Wiring Boundary
- Recognition Runtime Adapter Foundation
- Recognition Runtime Result Adapter Boundary
- Recognition Result Adapter Foundation
- Recognition Observable Flow Boundary
- First Observable Recognition Flow Foundation
- Observable Recognition Flow Review
- Viewer Exposure Via View Model Snapshot
- EDI View Model Snapshot Foundation
- EDI View Model Snapshot Validation
- Viewer Exposure Foundation
- EDI Observable Stack Review
- BagaStudio Integration Planning
- BagaStudio EDI Presentation Adapter Review
- BagaStudio Presentation Model Foundation
- BagaStudio Integration Readiness Review
- BagaStudio Operational Planning
- EDI Strategic Role Definition
- BagaStudio Product State Boundary Review
- BagaStudio Product State Integration Planning
- Product Package Observation Adapter Review
- Product Package Observation Snapshot Foundation
- Product Package Observation Adapter Foundation
- Product Package Observation Flow Review
- EDI Memory Foundation Review
- EDI Memory Entry Foundation
- Observation to Memory Flow Review

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

## DL-EXEC-015 — Boundary Before Runtime

### Problema

Dopo l'introduzione della `EdiIntegrationBoundary`, serviva chiarire dove debba essere collocata nel flow futuro senza introdurre wiring operativo.

Il rischio era farla diventare un runtime parallelo, un dispatcher, un registry o una dipendenza diretta di RuntimeHost e RuntimeLoop.

### Decisione

La Integration Boundary deve stare prima del runtime.

Puo essere chiamata da:

- Preview Integration;
- futuri Real Producer Adapters;
- futuri Import Integration Adapters;
- futuri Recognition Integration Adapters;
- futuri Viewer Integration Adapters.

Non deve essere chiamata direttamente da:

- RuntimeHost;
- RuntimeLoop;
- Executor;
- Consumer.

### Motivazione

RuntimeHost e RuntimeLoop devono ricevere `EdiExecutionRequest` gia normalizzate e validate. Non devono conoscere la provenienza della richiesta e non devono importare la boundary.

Questa separazione preserva RuntimeHost e RuntimeLoop come componenti neutrali, mentre la boundary resta un controllo di ingresso per futuri adapter di integrazione.

### Alternative Scartate

- Importare `EdiIntegrationBoundary` dentro RuntimeHost.
- Importare `EdiIntegrationBoundary` dentro RuntimeLoop.
- Far chiamare la boundary agli executor.
- Far chiamare la boundary ai consumer.
- Trasformare la boundary in dispatcher o registry.
- Introdurre wiring operativo verso real integration.

### Impatto Architetturale

La boundary viene posizionata come pre-runtime check. Il runtime resta agnostico rispetto alla provenienza delle request.

Non viene introdotto nessun collegamento operativo nuovo.

### Regole Permanenti Generate

- Boundary Before Runtime.
- RuntimeHost non importa Integration Boundary.
- RuntimeLoop non importa Integration Boundary.
- Executor non chiama Integration Boundary.
- Consumer non chiama Integration Boundary.
- Integration Boundary non e dispatcher.
- Integration Boundary non e registry.
- Integration Boundary non e runtime parallelo.

## DL-EXEC-016 — Preview Integration Passa Dalla Boundary

### Problema

Dopo aver stabilito che la boundary deve stare prima del runtime, la Preview Integration doveva iniziare a usare `EdiIntegrationBoundary` senza introdurre real integration e senza modificare RuntimeHost o RuntimeLoop.

### Decisione

Collegare `runEdiPreviewExecutionAndDispatch` a `createEdiIntegrationBoundaryRequest` prima della chiamata a `EdiExecutionRuntime`.

Il flow diventa:

- Preview Integration;
- `createEdiIntegrationBoundaryRequest`;
- `EdiExecutionRequest` esistente;
- `EdiExecutionRuntime`;
- `EdiExecutionResultDispatcher`.

### Motivazione

La Preview Integration e il futuro mondo degli adapter sono i punti corretti per attraversare la boundary. RuntimeHost e RuntimeLoop devono restare neutrali e ricevere request gia validate.

### Alternative Scartate

- Importare la boundary in RuntimeHost.
- Importare la boundary in RuntimeLoop.
- Far validare la boundary agli executor.
- Far validare la boundary ai consumer.
- Introdurre `runRealIntegration`.
- Collegare engine reali.

### Impatto Architetturale

La Preview Integration ora valida la request prima di chiamare execution runtime.

Se la boundary non valida la request, il flow produce un `EdiExecutionResult` failed controllato e lo passa al dispatcher esistente. Non viene lanciato un errore distruttivo e non viene chiamato execution runtime con una request invalida.

### Regole Permanenti Generate

- Preview Integration puo chiamare Integration Boundary.
- RuntimeHost non chiama Integration Boundary.
- RuntimeLoop non chiama Integration Boundary.
- Executor non chiama Integration Boundary.
- Consumer non chiama Integration Boundary.
- Boundary failure produce result controllato.
- Preview boundary wiring non e real integration.

## DL-EXEC-017 — Boundary Failure Is Pre-Runtime

### Problema

Dopo RFC-1165, la Preview Integration produce un `EdiExecutionResult` failed quando la `EdiIntegrationBoundary` non valida la request.

Serviva distinguere questo fallimento da un errore di executor, RuntimeHost, RuntimeLoop o Consumer.

### Decisione

Un fallimento della boundary e un errore pre-runtime.

Non e:

- errore executor;
- errore RuntimeHost;
- errore RuntimeLoop;
- errore Consumer.

### Classificazione Errori

Gli errori attuali sono terminali:

- `missing-request`;
- `missing-request-id`;
- `missing-request-mode`;
- `missing-request-domain`.

`missing-request-domain` resta terminale per ora. Potra diventare recoverable solo in una futura RFC, se verra introdotto un adapter capace di inferire esplicitamente `targetDomain`.

### Motivazione

La boundary protegge il runtime da request non valide. Se fallisce, il runtime non deve essere chiamato e il risultato deve indicare chiaramente che il fallimento e avvenuto prima dell'esecuzione.

### Alternative Scartate

- Trattare il fallimento boundary come errore executor.
- Impostare un executor reale o preview come responsabile del fallimento.
- Introdurre recovery automatico.
- Inferire automaticamente `targetDomain`.
- Chiamare RuntimeHost o RuntimeLoop.

### Impatto Architetturale

Preview Integration mantiene un failure path controllato e descrittivo.

Il `EdiExecutionResult` failed usa metadata pre-runtime coerenti con `EdiIntegrationBoundary`, senza fingere che sia fallito un executor.

### Regole Permanenti Generate

- Boundary Failure Is Pre-Runtime.
- Boundary Failure non e Executor Failure.
- Boundary Failure non chiama RuntimeHost.
- Boundary Failure non chiama RuntimeLoop.
- Boundary Failure non attiva recovery automatico.
- Boundary Failure non inferisce `targetDomain`.
- `missing-request-domain` e terminale fino a RFC dedicata.

## DL-EXEC-018 — Producer Adapter Prima Della Boundary

### Problema

Dopo la definizione della Integration Boundary, serviva un contratto neutrale per rappresentare futuri producer reali senza introdurre engine reali, real integration o wiring operativo.

### Decisione

Introdurre `EdiProducerAdapter` come foundation di contratto.

Il producer adapter descrive:

- source;
- target domain;
- mode;
- payload/input;
- metadata minimi;
- output compatibile con futura creazione di `EdiExecutionRequest`.

### Motivazione

I futuri adapter di integrazione dovranno preparare request prima di attraversare `EdiIntegrationBoundary`, ma non devono essere confusi con engine reali, RuntimeHost, RuntimeLoop, executor o consumer.

### Alternative Scartate

- Creare subito un Import producer reale.
- Creare subito un Recognition producer reale.
- Creare subito un Viewer producer reale.
- Collegare producer adapter alla boundary in modo operativo.
- Importare RuntimeHost o RuntimeLoop nei producer adapter.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

EDI guadagna un livello contrattuale pre-boundary senza attivare real integration.

Il contratto resta neutrale e non modifica il contratto pubblico `EdiExecutionRequest`.

### Regole Permanenti Generate

- Producer Adapter non e Real Engine.
- Producer Adapter non e RuntimeHost.
- Producer Adapter non e RuntimeLoop.
- Producer Adapter non e Executor.
- Producer Adapter non e Consumer.
- Producer Adapter vive prima della Integration Boundary.
- Producer Adapter non chiama engine reali.
- Producer Adapter non introduce real integration.

## DL-EXEC-019 — Producer Adapter Produce Request Input

### Problema

`EdiProducerAdapter` doveva essere collegato concettualmente a `EdiIntegrationBoundary` senza creare producer reali o wiring operativo.

Serviva chiarire che il producer adapter non produce runtime execution, ma prepara un input compatibile con la futura creazione di una `EdiExecutionRequest`.

### Decisione

Il producer adapter produce `executionRequestInput`.

Il flow contrattuale e:

- Real Engine / Viewer / Import / Recognition;
- `EdiProducerAdapter`;
- `executionRequestInput`;
- `createEdiExecutionRequest`;
- `EdiIntegrationBoundary`;
- Runtime.

### Motivazione

Il runtime deve ricevere solo request gia create e validate. Il producer adapter deve restare prima della boundary e non deve conoscere RuntimeHost, RuntimeLoop, executor o consumer.

`executionRequestInput` deve includere `mode` e `targetDomain`, perche la boundary li richiede per validare la request risultante.

### Alternative Scartate

- Far chiamare il runtime al producer adapter.
- Far chiamare executor o consumer al producer adapter.
- Far attraversare il runtime senza boundary.
- Introdurre producer reali specifici.
- Introdurre inferenza automatica di `targetDomain`.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

Il contratto tra producer adapter e boundary viene reso esplicito senza attivare real integration.

`EdiExecutionRequest` resta invariata.

### Regole Permanenti Generate

- Producer Adapter Before Boundary.
- Producer Adapter produce request input.
- Producer Adapter non chiama runtime.
- Producer Adapter non chiama executor.
- Producer Adapter non chiama consumer.
- Producer Adapter non inferisce automaticamente `targetDomain`.
- Request prodotta da adapter deve attraversare Integration Boundary.

## DL-EXEC-020 — Producer Adapter Request Factory

### Problema

Dopo aver definito `EdiProducerAdapterOutput.executionRequestInput`, serviva un punto neutrale per trasformare quell'output in una `EdiExecutionRequest` senza introdurre producer reali o collegamenti runtime.

### Decisione

Introdurre `createEdiExecutionRequestFromProducerAdapterOutput`.

La factory:

- riceve `EdiProducerAdapterOutput`;
- usa il path esistente `createEdiExecutionRequest`;
- preserva source, targetDomain, mode, payload e metadata;
- restituisce una `EdiExecutionRequest`.

### Motivazione

La conversione tra adapter output e request deve essere esplicita e separata dalla boundary.

Il producer adapter prepara input. La factory crea request. La boundary valida request. Il runtime riceve solo request gia validate.

### Alternative Scartate

- Far creare direttamente la request a producer reali specifici.
- Far chiamare la boundary alla factory.
- Far chiamare runtime alla factory.
- Introdurre recovery automatico.
- Inferire automaticamente `targetDomain`.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

EDI guadagna un conversion layer pre-boundary senza attivare integration operativa.

RuntimeHost, RuntimeLoop, Executor e Consumer restano invariati.

### Regole Permanenti Generate

- Request Factory non e Integration.
- Request Factory non chiama Boundary.
- Request Factory non chiama RuntimeHost.
- Request Factory non chiama RuntimeLoop.
- Request Factory non chiama Executor.
- Request Factory non chiama Consumer.
- Request Factory non inferisce `targetDomain`.
- Request creata dalla factory deve attraversare Integration Boundary.

## DL-EXEC-021 — Producer Adapter Boundary Pipeline Is Pre-Runtime

### Problema

Dopo aver introdotto la request factory, mancava un helper neutrale per collegare `EdiProducerAdapterOutput` alla `EdiIntegrationBoundary` senza chiamare runtime, dispatcher, executor o consumer.

### Decisione

Introdurre `createEdiProducerAdapterBoundaryPipelineResult`.

La pipeline:

- riceve `EdiProducerAdapterOutput`;
- crea una `EdiExecutionRequest`;
- passa la request alla `EdiIntegrationBoundary`;
- restituisce la request se valida;
- restituisce validation result e metadata pre-runtime.

### Motivazione

Adapter output, request creation e boundary validation sono responsabilita pre-runtime. Devono restare separate dall'esecuzione, dal dispatch e dalla consumption.

### Alternative Scartate

- Chiamare execution runtime dalla pipeline.
- Chiamare dispatcher dalla pipeline.
- Chiamare executor o consumer dalla pipeline.
- Collegare producer reali.
- Introdurre recovery automatica.
- Inferire automaticamente `targetDomain`.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

EDI ottiene un helper pre-runtime controllato per validare output adapter trasformati in request.

RuntimeHost, RuntimeLoop, Executor, Consumer e Preview Integration restano invariati.

### Regole Permanenti Generate

- Producer Adapter Boundary Pipeline e pre-runtime.
- Producer Adapter Boundary Pipeline non chiama runtime.
- Producer Adapter Boundary Pipeline non chiama dispatcher.
- Producer Adapter Boundary Pipeline non chiama executor.
- Producer Adapter Boundary Pipeline non chiama consumer.
- Producer Adapter Boundary Pipeline non introduce producer reali.
- Producer Adapter Boundary Pipeline non inferisce `targetDomain`.

## DL-EXEC-022 — Recognition Producer Adapter Come Primo Producer

### Problema

Dopo la Producer Adapter Boundary Pipeline serviva decidere quale producer adapter concreto introdurre per primo, senza implementarlo ancora.

### Decisione

Il primo producer adapter concreto previsto sara Recognition Producer Adapter Foundation.

### Motivazione

Recognition e piu vicina al dominio cognitivo EDI e puo partire come adapter controllato e minimale.

Import viene rinviato perche rischia di introdurre parsing, geometria, scene graph e normalizzazione modello troppo presto.

Viewer viene rinviato perche rischia di introdurre UI state integration e ownership del prodotto troppo presto.

### Perimetro Prossima RFC

La prossima RFC operativa sara:

RFC-1172 — Recognition Producer Adapter Foundation.

Dovra:

- creare solo adapter foundation;
- produrre `EdiProducerAdapterOutput` compatibile;
- non eseguire runtime;
- non chiamare dispatch;
- non analizzare geometria reale;
- non introdurre real recognition completa;
- non modificare RuntimeHost o RuntimeLoop.

### Alternative Scartate

- Import Producer Adapter come primo producer.
- Viewer Producer Adapter come primo producer.
- Recognition real completa.
- Collegamento diretto a runtime.
- Collegamento a dispatch.
- Introduzione di `runRealIntegration`.

### Impatto Architetturale

La roadmap dei producer reali parte dal dominio meno invasivo e piu vicino al layer cognitivo.

Nessun producer reale viene introdotto in questa RFC.

### Regole Permanenti Generate

- First concrete producer candidate is Recognition.
- Recognition Producer deve essere foundation, non real recognition completa.
- Import Producer resta rinviato.
- Viewer Producer resta rinviato.
- Producer RFC non modifica RuntimeHost o RuntimeLoop.

## DL-EXEC-023 — Recognition Producer Adapter Foundation

### Problema

Dopo aver scelto Recognition come primo producer candidate, serviva introdurre una foundation concreta senza trasformarla in recognition runtime reale.

### Decisione

Introdurre `RecognitionProducerAdapter` come adapter foundation.

L'adapter produce `EdiProducerAdapterOutput` con:

- source `recognition-integration`;
- target domain `recognition`;
- mode coerente, con default `preview`;
- payload minimale;
- metadata descrittivi.

### Motivazione

Recognition e il dominio piu vicino alla semantica cognitiva EDI e puo validare la forma producer adapter senza introdurre parsing, Viewer state, geometria o scene graph.

### Alternative Scartate

- Introdurre recognition runtime reale.
- Analizzare geometria reale.
- Analizzare scene reali.
- Collegare cognitive reasoning reale.
- Chiamare runtime execution.
- Chiamare dispatcher.
- Chiamare executor o consumer.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

EDI ottiene il primo producer adapter foundation concreto, ma nessuna real integration.

RuntimeHost, RuntimeLoop, Executor, Consumer e PreviewExecutionAndDispatch restano invariati.

### Regole Permanenti Generate

- Recognition Producer Adapter e foundation.
- Recognition Producer Adapter non e real recognition.
- Recognition Producer Adapter produce solo `EdiProducerAdapterOutput`.
- Recognition Producer Adapter non esegue runtime.
- Recognition Producer Adapter non chiama dispatcher.
- Recognition Producer Adapter non analizza geometria reale.
- Recognition Producer Adapter non modifica RuntimeHost o RuntimeLoop.

## DL-EXEC-024 - Recognition Producer Boundary Pipeline

### Problema

Dopo l'introduzione di `RecognitionProducerAdapter`, serviva chiarire come il producer foundation attraversa la Producer Adapter Boundary Pipeline senza diventare runtime integration.

### Decisione

Introdurre `RecognitionProducerBoundaryPipeline` come helper pre-runtime specifico per Recognition.

Il helper riceve `RecognitionProducerAdapterInput`, crea `EdiProducerAdapterOutput` tramite `createRecognitionProducerAdapterOutput`, lo passa a `createEdiProducerAdapterBoundaryPipelineResult` e restituisce il boundary pipeline result esistente.

### Motivazione

La composizione mantiene separati producer foundation, request factory, boundary validation ed execution runtime.

Il risultato resta `EdiProducerAdapterBoundaryPipelineResult`, non `EdiExecutionResult`.

### Alternative Scartate

- Chiamare direttamente `EdiExecutionRuntime`.
- Chiamare dispatcher, executor o consumer.
- Creare un execution result dalla pipeline recognition.
- Introdurre recognition runtime reale.
- Analizzare geometria o scene reali.
- Introdurre cognitive reasoning reale.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

Recognition ottiene un passaggio pre-runtime controllato verso la boundary pipeline.

RuntimeHost, RuntimeLoop, Executor, Consumer e PreviewExecutionAndDispatch restano invariati.

### Regole Permanenti Generate

- Recognition Producer Boundary Pipeline e pre-runtime.
- Recognition Producer Boundary Pipeline non e runtime integration.
- Recognition Producer Boundary Pipeline restituisce boundary pipeline result, non execution result.
- Recognition Producer Boundary Pipeline non chiama runtime.
- Recognition Producer Boundary Pipeline non chiama dispatcher.
- Recognition Producer Boundary Pipeline non chiama executor o consumer.
- Recognition Producer Boundary Pipeline non introduce recognition reale.

## DL-EXEC-025 - Recognition Producer Pipeline Validation

### Problema

Dopo l'introduzione di `RecognitionProducerAdapter` e `RecognitionProducerBoundaryPipeline`, serviva validare il flusso pre-runtime senza introdurre runtime integration, dispatch o recognition reale.

### Decisione

Documentare una validation checklist ufficiale per il flusso Recognition Producer pre-runtime.

Non viene introdotto un nuovo framework di test perche il progetto non espone oggi uno script test dedicato o un pattern TS test consolidato per questo layer.

### Motivazione

La validazione deve restare compatibile con l'architettura corrente e non deve creare infrastruttura trasversale non richiesta.

La build TypeScript resta la validazione tecnica disponibile e la checklist documentale blocca semanticamente il perimetro.

### Alternative Scartate

- Introdurre un framework di test nuovo.
- Creare uno script di validation custom non consolidato.
- Chiamare runtime execution.
- Chiamare dispatcher, executor o consumer.
- Produrre `EdiExecutionResult` dalla pipeline recognition.
- Introdurre recognition runtime reale.

### Impatto Architetturale

Il flusso Recognition Producer e validato come pre-runtime foundation path.

Il boundary-valid request resta distinto da execution.

### Regole Permanenti Generate

- Recognition Producer Pipeline Validation non introduce framework test nuovo.
- Recognition Producer Pipeline Validation resta pre-runtime.
- Boundary-valid request non equivale a execution.
- Recognition Producer Pipeline Validation non produce execution result.
- Recognition Producer Pipeline Validation non chiama runtime o dispatch.
- Recognition Producer Pipeline Validation non introduce recognition reale.

## DL-EXEC-026 - Recognition Producer Runtime Wiring Boundary

### Problema

Dopo la validation della pipeline pre-runtime, serviva decidere come una boundary-valid `EdiExecutionRequest` prodotta dal Recognition Producer potra entrare nel runtime di execution senza far chiamare il runtime direttamente al producer.

### Decisione

Il Recognition Producer non deve chiamare direttamente RuntimeHost, RuntimeLoop, PreviewExecutionAndDispatch, Executor, Consumer, Dispatcher o runtime execution.

Il prossimo layer operativo futuro sara `Recognition Runtime Adapter`, distinto dal producer, dalla boundary pipeline e dai runtime host/loop.

### Motivazione

Il producer resta responsabile della produzione di `EdiProducerAdapterOutput`.

La boundary pipeline resta responsabile della conversione e validazione pre-runtime.

Il futuro runtime adapter sara responsabile solo dell'ingresso controllato nel runtime di execution e non del dispatch.

### Alternative Scartate

- Far chiamare `EdiExecutionRuntime` direttamente al producer.
- Riutilizzare `PreviewExecutionAndDispatch` per il flusso Recognition.
- Far chiamare dispatcher o consumer al producer.
- Far chiamare RuntimeHost o RuntimeLoop al producer.
- Introdurre recognition runtime reale.
- Introdurre geometry recognition o scene recognition.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

Il confine tra Producer Adapter, Boundary Pipeline e futuro Runtime Adapter resta esplicito.

RuntimeHost, RuntimeLoop, Executor, Consumer e PreviewExecutionAndDispatch restano invariati.

### Regole Permanenti Generate

- Recognition Producer non chiama runtime direttamente.
- Recognition Runtime Adapter sara un layer separato.
- Recognition Runtime Adapter ricevera request boundary-valid.
- Recognition Runtime Adapter non fara dispatch.
- Recognition Runtime Adapter non chiamera RuntimeHost o RuntimeLoop.
- Recognition Runtime Adapter non introdurra recognition reale.
- RFC-1176 dovra creare solo la foundation del Recognition Runtime Adapter.

## DL-EXEC-027 - Recognition Runtime Adapter Foundation

### Problema

Serviva introdurre il primo layer operativo minimale capace di ricevere una `EdiExecutionRequest` gia validata dalla boundary e passarla al runtime di execution esistente, senza creare dispatch o recognition reale.

### Decisione

Introdurre `RecognitionRuntimeAdapter` come foundation minimale.

L'adapter esporta `runRecognitionRuntimeAdapter`, riceve `EdiExecutionRequest` e `EdiExecutionRuntime` tramite dependency injection esplicita, chiama `executionRuntime.runExecution({ request })` e restituisce `EdiExecutionResult`.

### Motivazione

La dependency injection evita istanze globali e mantiene separato il runtime adapter da RuntimeHost, RuntimeLoop, PreviewExecutionAndDispatch, Consumer e Dispatcher.

La funzione resta un passaggio controllato tra boundary-valid request e runtime di execution.

### Alternative Scartate

- Creare o importare un runtime globale.
- Chiamare RuntimeHost o RuntimeLoop.
- Chiamare PreviewExecutionAndDispatch.
- Fare dispatch del result.
- Chiamare Consumer.
- Introdurre recognition runtime reale.
- Analizzare geometria o scene.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

Recognition ottiene il primo runtime adapter foundation, ma non una real integration.

Il confine tra Producer Adapter, Boundary Pipeline, Runtime Adapter, Execution Runtime e Dispatch resta separato.

### Regole Permanenti Generate

- Recognition Runtime Adapter riceve request gia boundary-valid.
- Recognition Runtime Adapter usa `EdiExecutionRuntime` iniettato.
- Recognition Runtime Adapter restituisce `EdiExecutionResult`.
- Recognition Runtime Adapter non fa dispatch.
- Recognition Runtime Adapter non chiama Consumer.
- Recognition Runtime Adapter non chiama RuntimeHost o RuntimeLoop.
- Recognition Runtime Adapter non introduce recognition reale.

## DL-EXEC-028 - Recognition Runtime Result Adapter Boundary

### Problema

Dopo l'introduzione di `RecognitionRuntimeAdapter`, serviva definire come un `EdiExecutionResult` recognition potra essere esposto ai layer successivi senza collegare Viewer, UI, RuntimeHost, RuntimeLoop o dispatch reale.

### Decisione

Il risultato prodotto dal Recognition Runtime Adapter non deve essere esposto direttamente al Viewer o ai workflow di prodotto.

Il prossimo layer futuro sara `Recognition Result Adapter`, distinto dal Runtime Adapter.

### Motivazione

Il Runtime Adapter deve restare responsabile solo dell'ingresso nel runtime di execution.

Il Result Adapter avra il compito futuro di ricevere `EdiExecutionResult` e trasformarlo in una forma osservabile, senza rendering, UI wiring o mutazione runtime.

### Alternative Scartate

- Far esporre risultati direttamente al Viewer dal Runtime Adapter.
- Far chiamare RuntimeHost o RuntimeLoop al Result Adapter.
- Far chiamare dispatcher reale in questa fase.
- Trasformare il Runtime Adapter in orchestrator.
- Introdurre UI o Viewer wiring.
- Introdurre recognition reale.

### Impatto Architetturale

Viene preservata la separazione tra runtime execution e result exposure.

La prossima RFC operativa sara `RFC-1178 - Recognition Result Adapter Foundation`.

### Regole Permanenti Generate

- Runtime Adapter non espone direttamente risultati al Viewer.
- Result Adapter e separato da Runtime Adapter.
- Result Adapter ricevera `EdiExecutionResult`.
- Result Adapter non renderizza UI.
- Result Adapter non chiama RuntimeHost o RuntimeLoop.
- Result Adapter non introduce dispatch reale.
- Result Adapter non introduce recognition reale.

## DL-EXEC-029 - Recognition Result Adapter Foundation

### Problema

Serviva introdurre una forma recognition-specific osservabile derivata da `EdiExecutionResult`, senza collegare Viewer, UI, dispatcher globale, RuntimeHost o RuntimeLoop.

### Decisione

Introdurre `RecognitionResultAdapter` come foundation minimale.

L'adapter espone `createRecognitionObservableResult`, riceve `EdiExecutionResult` e produce `RecognitionObservableResult`.

### Motivazione

`EdiExecutionResult` resta il descrittore generico del runtime di execution.

`RecognitionObservableResult` rappresenta una forma osservabile specifica per Recognition, utile per futuri layer successivi senza introdurre rendering o integrazione prodotto.

### Alternative Scartate

- Esportare direttamente `EdiExecutionResult` verso Viewer o UI.
- Usare dispatcher globale.
- Chiamare Consumer.
- Mutare runtime.
- Chiamare RuntimeHost o RuntimeLoop.
- Introdurre recognition reale.
- Analizzare geometria o scene.

### Impatto Architetturale

La result exposure recognition diventa un layer dati separato dal runtime adapter e dalla UI.

Non viene introdotta real integration.

### Regole Permanenti Generate

- Recognition Result Adapter riceve `EdiExecutionResult`.
- Recognition Result Adapter produce `RecognitionObservableResult`.
- Recognition Result Adapter preserva id, mode, status e metadata utili.
- Recognition Result Adapter non renderizza UI.
- Recognition Result Adapter non fa dispatch.
- Recognition Result Adapter non modifica runtime.
- Recognition Result Adapter non conosce Viewer.
- Recognition Result Adapter non introduce recognition reale.

## DL-EXEC-030 - Recognition Observable Flow Boundary

### Problema

Dopo Producer Adapter, Boundary Pipeline, Runtime Adapter e Result Adapter, serviva definire il primo flow recognition osservabile completo senza trasformarlo in Viewer integration o dispatch globale.

### Decisione

Il primo Recognition Observable Flow dovra essere un helper controllato.

Il flow documentato e:

```text
Recognition Input
Recognition Producer Adapter
Recognition Boundary Pipeline
Recognition Runtime Adapter
Recognition Result Adapter
Recognition Observable Result
```

### Motivazione

Il flow osservabile deve comporre foundation esistenti senza assumere ownership di Viewer, UI, RuntimeHost, RuntimeLoop, dispatcher globale o real recognition.

### Alternative Scartate

- Collegare direttamente Viewer.
- Introdurre UI.
- Fare dispatch globale.
- Chiamare RuntimeHost o RuntimeLoop.
- Unire Runtime Adapter e Result Adapter.
- Introdurre recognition reale.
- Analizzare geometria o scene.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

La pipeline recognition puo essere descritta end-to-end come observable flow, ma resta fuori dalla real integration.

La prossima RFC operativa sara `RFC-1180 - First Observable Recognition Flow Foundation`.

### Regole Permanenti Generate

- Recognition Observable Flow e helper controllato.
- Recognition Observable Flow non e Viewer integration.
- Recognition Observable Result non e UI.
- Recognition Observable Flow non fa dispatch globale.
- Recognition Observable Flow non chiama RuntimeHost o RuntimeLoop.
- Recognition Observable Flow non introduce recognition reale.

## DL-EXEC-032 - Observable Recognition Flow Reviewed

### Problema

Dopo l'introduzione di `RecognitionObservableFlow`, serviva confermare che il flow restasse osservabile e non operativo, senza introdurre Viewer, UI, dispatch globale o real recognition.

### Decisione

Classificare il First Observable Recognition Flow come reviewed.

La review conferma:

- boundary failure non chiama runtime;
- validation success chiama `RecognitionRuntimeAdapter`;
- `RecognitionResultAdapter` produce `RecognitionObservableResult`;
- observable result non e UI;
- il flow non chiama Viewer;
- il flow non chiama RuntimeHost o RuntimeLoop;
- il flow non fa dispatch globale.

### Motivazione

La review consolida lo stato architetturale prima di pianificare esposizione Viewer o ulteriori integrazioni.

### Alternative Scartate

- Procedere direttamente con Viewer exposure.
- Collegare UI.
- Introdurre dispatch globale.
- Aggiungere fallback complessi.
- Introdurre recognition reale.

### Impatto Architetturale

EDI observable foundation e completa abbastanza per la prossima pianificazione.

Prima di Viewer exposure serve una RFC dedicata.

Prima del push serve una verifica local/remote dedicata.

### Regole Permanenti Generate

- First Observable Recognition Flow e reviewed.
- Observable result resta dato, non UI.
- Viewer exposure richiede RFC dedicata.
- Push/remoto richiede verifica dedicata.
- Tracciabilita e fallback restano foundation-level finche non vengono ampliati da RFC dedicate.

## DL-EXEC-033 - Viewer Exposure Via View Model Snapshot

### Problema

Dopo la review del First Observable Recognition Flow, serviva pianificare come esporre in futuro risultati EDI osservabili al Viewer senza accoppiare Viewer a RecognitionObservableResult, RecognitionObservableFlow, EdiExecutionRuntime, RuntimeHost o RuntimeLoop.

### Decisione

La futura esposizione Viewer dovra passare attraverso un `EDI View Model Snapshot`.

Il flusso futuro sara:

```text
RecognitionObservableResult
EDI View Model Snapshot
Viewer
```

Il Viewer non dovra leggere direttamente `RecognitionObservableResult` e non dovra chiamare `RecognitionObservableFlow`.

### Motivazione

Uno snapshot immutabile e preferibile a live state in questa fase perche mantiene il confine architetturale leggibile, serializzabile e non operativo.

Il View Model separa i flow specifici, come Recognition, dalla futura superficie Viewer.

### Alternative Scartate

- Far leggere direttamente `RecognitionObservableResult` al Viewer.
- Far chiamare `RecognitionObservableFlow` al Viewer.
- Introdurre React state.
- Introdurre UI wiring.
- Collegare Viewer a `EdiExecutionRuntime`.
- Collegare Viewer a RuntimeHost o RuntimeLoop.
- Trasformare il View Model in runtime vivo.

### Impatto Architetturale

Il View Model Snapshot diventa il confine futuro tra observable data e Viewer exposure.

La prossima RFC operativa sara `RFC-1183 - EDI View Model Snapshot Foundation`.

### Regole Permanenti Generate

- Viewer legge View Model Snapshot, non RecognitionObservableResult.
- Viewer non chiama RecognitionObservableFlow.
- View Model Snapshot e immutabile, non live state.
- View Model e separato dai flow specifici.
- View Model non possiede runtime logic.
- View Model non possiede real recognition logic.
- View Model non renderizza UI.
- View Model deve restare estendibile a recognition, memory, reasoning, feedback e planning.

## DL-EXEC-034 - EDI View Model Snapshot Foundation

### Problema

Serviva introdurre il primo contratto dati tra `RecognitionObservableResult` e futura esposizione Viewer, senza collegare Viewer, UI, React state, runtime o dispatch globale.

### Decisione

Introdurre `EdiViewModelSnapshot` come foundation minimale.

La factory `createEdiViewModelSnapshotFromRecognitionObservableResult` riceve `RecognitionObservableResult` e produce uno snapshot con sezione `recognition`.

### Motivazione

Lo snapshot rende esplicito il confine tra observable data e futura lettura Viewer.

Mantenerlo immutable-style evita live state prematuro e impedisce di accoppiare EDI ai componenti React.

### Alternative Scartate

- Collegare direttamente Viewer a `RecognitionObservableResult`.
- Introdurre React state.
- Introdurre UI/rendering.
- Chiamare runtime o dispatch.
- Inserire logica recognition reale nel View Model.

### Impatto Architetturale

Il View Model Snapshot diventa il primo boundary dati verso futura Viewer exposure.

Non viene introdotto Viewer wiring.

### Regole Permanenti Generate

- EDI View Model Snapshot riceve observable data.
- EDI View Model Snapshot produce dati leggibili dal futuro Viewer.
- EDI View Model Snapshot e immutable-style.
- EDI View Model Snapshot non e React state.
- EDI View Model Snapshot non renderizza UI.
- EDI View Model Snapshot non chiama runtime.
- EDI View Model Snapshot non contiene real recognition logic.

## DL-EXEC-035 - EDI View Model Snapshot Validation

### Problema

Dopo l'introduzione di `EdiViewModelSnapshot`, serviva validare se il modello fosse sufficiente come boundary verso futuro Viewer e se esponesse troppi dettagli runtime.

### Decisione

Validare `EdiViewModelSnapshot` come boundary corretto tra EDI observable data e futura Viewer Exposure Foundation.

Non vengono applicate modifiche ai tipi in RFC-1184.

### Motivazione

Lo snapshot contiene dati sufficienti per una prima esposizione leggibile: id, timestamp, execution result id, execution request id, mode, status e metadata.

Non espone l'oggetto `EdiExecutionResult` originale, quindi evita di trasferire al Viewer dettagli runtime non necessari.

### Alternative Scartate

- Aggiungere subito sezioni memory/reasoning/feedback/planning.
- Esporre `RecognitionObservableResult` direttamente al Viewer.
- Inserire l'oggetto runtime originale nello snapshot.
- Introdurre React state.
- Introdurre Viewer wiring.
- Collegare runtime o dispatch.

### Impatto Architetturale

Lo snapshot e maturo abbastanza per pianificare `RFC-1185 - Viewer Exposure Foundation`.

Le sezioni memory, reasoning, feedback e planning restano future extension.

### Regole Permanenti Generate

- EDI View Model Snapshot e boundary validato verso Viewer.
- Viewer Exposure Foundation dovra leggere solo EDI View Model Snapshot.
- Snapshot non espone l'oggetto execution result originale.
- Snapshot resta immutable-style.
- Memory, reasoning, feedback e planning sono sezioni future.
- Nessun Viewer/UI/React state viene introdotto da questa validation.

## DL-EXEC-036 - Viewer Exposure Foundation

### Problema

Dopo la validazione dello snapshot, serviva introdurre il primo boundary dati verso futuro Viewer senza collegare Viewer reale, UI, React state, runtime o dispatch.

### Decisione

Introdurre `EdiViewerExposure` come foundation minimale.

La factory `createEdiViewerExposureFromSnapshot` riceve `EdiViewModelSnapshot` e produce una struttura Viewer-friendly.

### Motivazione

Il Viewer futuro deve leggere un layer di esposizione dedicato e non conoscere runtime, flow recognition o observable result.

Separare View Model e Viewer Exposure mantiene EDI indipendente da componenti UI e da React state.

### Alternative Scartate

- Far leggere direttamente lo snapshot ai componenti Viewer reali.
- Collegare Viewer reale in questa RFC.
- Introdurre UI definitiva.
- Introdurre React state globale.
- Chiamare runtime, RuntimeHost o RuntimeLoop.
- Collegare RecognitionObservableResult al Viewer.

### Impatto Architetturale

La futura esposizione Viewer ottiene un boundary dati dedicato.

Non viene introdotto Viewer wiring reale.

### Regole Permanenti Generate

- Viewer Exposure legge EDI View Model Snapshot.
- Viewer Exposure non legge runtime.
- Viewer Exposure non legge RecognitionObservableResult direttamente.
- Viewer Exposure non e UI definitiva.
- Viewer Exposure non usa React state.
- Viewer Exposure non chiama RuntimeHost o RuntimeLoop.
- Viewer Exposure non contiene real recognition logic.

## DL-EXEC-037 - EDI Observable Stack Reviewed

### Problema

Dopo l'introduzione di Viewer Exposure Foundation, serviva revisionare l'intero Observable Stack per capire se fosse maturo abbastanza per pianificare integrazione BagaStudio senza introdurre ancora Viewer reale o codice operativo.

### Decisione

Classificare l'EDI Observable Stack come reviewed.

Lo stack revisionato e:

```text
Recognition Producer Adapter
Recognition Boundary Pipeline
Recognition Runtime Adapter
Recognition Result Adapter
Recognition Observable Result
EdiViewModelSnapshot
EdiViewerExposure
```

### Motivazione

La review conferma che RuntimeHost, RuntimeLoop, Viewer, Execution Runtime e Recognition restano separati.

Le boundary Observable Result -> ViewModel e ViewModel -> Viewer Exposure sono corrette.

### Alternative Scartate

- Procedere direttamente a Viewer wiring.
- Introdurre UI.
- Introdurre dispatch globale.
- Collegare RuntimeHost o RuntimeLoop.
- Introdurre real recognition.
- Introdurre Memory/Reasoning wiring senza planning.

### Impatto Architetturale

EDI observable foundation e matura abbastanza per planning BagaStudio.

Non e ancora pronta per integrazione prodotto diretta.

La prossima RFC consigliata e `RFC-1187 - BagaStudio Integration Planning`.

### Regole Permanenti Generate

- Observable Stack reviewed non significa Viewer integration.
- BagaStudio integration richiede planning dedicato.
- Viewer exposure reale richiede RFC dedicata.
- Memory/Reasoning integration richiede planning dedicato.
- Traceability e fallback restano foundation-level.
- Nessun push/remoto senza verifica dedicata.

## DL-EXEC-038 - EDI As Observable BagaStudio Capability

### Problema

Dopo la review dell'Observable Stack, serviva pianificare come EDI potra entrare in BagaStudio senza accoppiare EDI a Viewer, RuntimeHost, RuntimeLoop, React state o componenti UI.

### Decisione

EDI deve essere integrato in BagaStudio come capability osservabile e consultabile, non come controller diretto del Viewer.

Il Viewer non deve leggere direttamente `RecognitionObservableResult` e non deve chiamare flow EDI.

`EdiViewerExposure` resta il boundary EDI-side verso un futuro livello BagaStudio.

La prossima RFC consigliata e `RFC-1188 - BagaStudio EDI Presentation Adapter Review`.

### Motivazione

Separare EDI da Viewer preserva il ruolo dell'Observable Stack come pipeline dati e impedisce che componenti UI o stato React diventino proprietari del runtime EDI.

Un futuro BagaStudio EDI Presentation Adapter puo tradurre `EdiViewerExposure` in una forma presentabile senza introdurre Viewer wiring reale.

### Alternative Scartate

- Far chiamare `runRecognitionObservableFlow` al Viewer.
- Far leggere `RecognitionObservableResult` direttamente al Viewer.
- Collegare Viewer a `EdiExecutionRuntime`.
- Collegare Viewer a RuntimeHost o RuntimeLoop.
- Trasformare `EdiViewerExposure` in UI definitiva.
- Mutare Project/Product state da EDI.

### Impatto Architetturale

EDI ottiene un percorso di integrazione BagaStudio pianificato ma non implementato.

La prima integrazione sicura sara un presentation adapter passivo, non un Viewer component.

### Regole Permanenti Generate

- EDI e una capability osservabile, non un Viewer controller.
- Viewer consuma EDI indirettamente.
- Viewer non chiama flow EDI.
- Viewer non legge RecognitionObservableResult.
- Viewer non conosce RuntimeHost o RuntimeLoop.
- EdiViewerExposure e il boundary EDI-side verso BagaStudio presentation.
- BagaStudio EDI Presentation Adapter richiede RFC dedicata.
- Nessuna UI, React state o Viewer wiring viene introdotta da questa planning RFC.

## DL-EXEC-039 - BagaStudio Presentation Adapter Separates Viewer From EDI

### Problema

Dopo aver pianificato EDI come capability osservabile, serviva decidere come `EdiViewerExposure` potra diventare consumabile da BagaStudio senza esporre contratti interni EDI al Viewer.

### Decisione

Introdurre in una RFC futura un BagaStudio EDI Presentation Adapter.

Il flusso previsto e:

```text
EdiViewerExposure
BagaStudio EDI Presentation Adapter
BagaStudio Presentation Model
Viewer
```

Il Presentation Adapter appartiene a BagaStudio, non al runtime EDI.

### Motivazione

`EdiViewerExposure` e ancora un boundary EDI-side. Farlo leggere direttamente dal Viewer renderebbe il Viewer consapevole di dettagli EDI e indebolirebbe la separazione tra EDI e prodotto.

Un Presentation Model BagaStudio puo nascondere dettagli EDI, stabilizzare la forma consumata dal Viewer futuro e preparare estensioni per Memory, Reasoning, Feedback e Planning.

### Alternative Scartate

- Far leggere `EdiViewerExposure` direttamente al Viewer.
- Trasformare `EdiViewerExposure` in UI.
- Introdurre React state in questa fase.
- Collegare Viewer a EDI View Model.
- Collegare Viewer a Recognition Observable Flow.
- Inserire Memory, Reasoning, Feedback o Planning direttamente nel Viewer senza adapter.

### Impatto Architetturale

La futura integrazione BagaStudio avra un boundary dedicato tra EDI e presentazione prodotto.

RFC-1188 non implementa UI, Viewer reale, React state o wiring operativo.

La prossima RFC consigliata e `RFC-1189 - BagaStudio EDI Presentation Model Foundation`.

### Regole Permanenti Generate

- BagaStudio Presentation Adapter traduce EdiViewerExposure.
- BagaStudio Presentation Model nasconde dettagli interni EDI.
- Viewer non legge EdiViewerExposure direttamente.
- Viewer non legge EDI View Model direttamente.
- Presentation Adapter non renderizza UI.
- Presentation Adapter non crea React state.
- Presentation Adapter non chiama runtime, dispatch, RuntimeHost o RuntimeLoop.
- Memory, Reasoning, Feedback e Planning entrano in presentazione attraverso lo stesso boundary.

## DL-EXEC-040 - BagaStudio Presentation Model Is Product-Side Data

### Problema

Dopo aver definito il ruolo del Presentation Adapter, serviva introdurre un primo modello dati consumabile da BagaStudio senza esporre direttamente `EdiViewerExposure` o altri dettagli interni EDI al Viewer futuro.

### Decisione

Introdurre `BagaStudioPresentationModel` come modello dati BagaStudio-side.

La factory `createBagaStudioPresentationModelFromEdiViewerExposure` riceve `EdiViewerExposure` e produce un modello con sezione `edi`.

### Motivazione

Il Presentation Model stabilizza il contratto prodotto-side e mantiene EDI separato da Viewer, UI, React state, runtime e recognition reale.

Il modello conserva status, timestamp e metadata utili, ma non importa RuntimeHost, RuntimeLoop, EdiExecutionRuntime o componenti Viewer.

### Alternative Scartate

- Far leggere `EdiViewerExposure` direttamente al Viewer.
- Usare `EdiViewerExposure` come modello prodotto definitivo.
- Creare componenti UI in questa RFC.
- Introdurre React state.
- Collegare il modello a runtime, dispatch o Viewer reale.

### Impatto Architetturale

BagaStudio ottiene il primo modello presentazionale fondazionale per EDI.

La foundation resta data-only e immutable-style.

Non viene introdotto wiring operativo.

### Regole Permanenti Generate

- BagaStudio Presentation Model appartiene a BagaStudio.
- BagaStudio Presentation Model riceve EdiViewerExposure.
- BagaStudio Presentation Model non e Viewer UI.
- BagaStudio Presentation Model non e React state.
- BagaStudio Presentation Model non chiama runtime.
- BagaStudio Presentation Model non conosce RuntimeHost o RuntimeLoop.
- BagaStudio Presentation Model non contiene recognition reale.

## DL-EXEC-041 - BagaStudio Integration Is Ready For Planning, Not Activation

### Problema

Dopo il ponte EDI Observable Stack, `EdiViewerExposure`, e `BagaStudioPresentationModel`, serviva stabilire se procedere direttamente verso Viewer, verso integrazione operativa BagaStudio, oppure prima consolidare lo stato locale/remoto.

### Decisione

La foundation e pronta per planning BagaStudio, ma non per attivazione operativa o Viewer wiring.

La prossima fase consigliata e una sync/push review dedicata prima di nuovo lavoro operativo.

### Motivazione

Il branch contiene una lunga sequenza di foundation EDI e BagaStudio-side. Prima di introdurre nuove integrazioni operative, conviene verificare stato locale/remoto, branch, ahead, build e contenuto della PR.

`BagaStudioPresentationModel` e un boundary corretto, ma manca ancora un piano operativo di prodotto e manca un contratto Viewer-facing.

### Alternative Scartate

- Procedere subito con Viewer wiring.
- Procedere subito con UI.
- Collegare BagaStudioPresentationModel a React state.
- Collegare EDI a Project/Product state.
- Introdurre runtime operativo prima della sync/push review.

### Impatto Architetturale

La roadmap viene ordinata in tre passaggi:

1. sync/push review;
2. BagaStudio operational planning;
3. Viewer exposure wiring solo con RFC dedicata.

### Regole Permanenti Generate

- Readiness non significa product activation.
- Viewer readiness non significa Viewer wiring.
- BagaStudioPresentationModel e boundary corretto, non UI.
- Sync/push review precede la prossima fase operativa.
- BagaStudio operational planning precede Viewer wiring.
- Viewer reale richiede RFC dedicata.

## DL-EXEC-042 - Product State Boundary Before Viewer UI

### Problema

Dopo il completamento e push del ponte `EDI Observable Stack -> EdiViewerExposure -> BagaStudioPresentationModel`, serviva decidere se ripartire subito dal Viewer o se prima definire un boundary BagaStudio product-side.

### Decisione

Prima di introdurre Viewer UI o Viewer wiring, serve una `BagaStudio Product State Boundary Review`.

La prossima RFC consigliata e `RFC-1192 - BagaStudio Product State Boundary Review`.

### Motivazione

Il Viewer esistente e una superficie ampia e stateful. Contiene responsabilita di scena, import, product package, runtime metadata, pannelli e controlli.

Collegare subito `BagaStudioPresentationModel` al Viewer rischierebbe di trasformare il Viewer nel primo owner della capability EDI.

Il boundary corretto deve chiarire prima dove vive lo stato product/project e come il presentation model viene mantenuto, derivato o passato al futuro Viewer.

### Alternative Scartate

- Collegare subito `BagaStudioPresentationModel` a Viewer.
- Creare UI EDI immediata.
- Introdurre React state per EDI.
- Far leggere al Viewer dati EDI o EdiViewerExposure.
- Collegare EDI a Product/Project state senza ownership review.

### Impatto Architetturale

EDI resta congelato come stack osservabile e data boundary.

BagaStudio riparte dal confine Product/Project State, non dal rendering.

Il Viewer resta consumer futuro e indiretto.

### Regole Permanenti Generate

- Product State Boundary precede Viewer UI.
- Viewer non e il primo owner operativo di EDI.
- BagaStudioPresentationModel non entra nel Viewer senza boundary product-side.
- Product/Project state ownership deve essere chiarita prima del codice.
- EDI Observable Stack resta congelato durante operational planning.

## DL-EXEC-043 - EDI Is Strategic Intelligence, Not Source Of Truth

### Problema

Durante il planning operativo e emerso che EDI non puo essere descritto solo come motore recognition. Serve una definizione strategica ufficiale del ruolo EDI nell'ecosistema BagaStudio.

### Decisione

EDI e il layer permanente di supporto intelligente a utente, prodotto, produzione e azienda.

EDI include:

```text
Observation Layer
Proposal Layer
Validation Support Layer
Optimization Layer
Memory Layer
Business Intelligence Layer
```

EDI non e Source of Truth.

Source of Truth resta:

- Product Package;
- Project State;
- dati validati del sistema.

### Motivazione

EDI deve poter osservare, comprendere, ricordare, proporre, creare, validare e ottimizzare.

Queste capacita devono pero restare subordinate ai dati validati del sistema. Product Package, Project State e dati validati proteggono BagaStudio da proposte non confermate, inferenze non validate o output generativi trattati come verita operativa.

### Capacita Future

Progettazione:

- interpretazione DXF;
- interpretazione DWG;
- interpretazione modelli 3D;
- comprensione ambienti, ingombri e passaggi;
- proposta arredi, moduli e configurazioni.

Produzione:

- comprensione macchinari;
- ottimizzazione tagli;
- ottimizzazione lavorazioni;
- ottimizzazione nesting;
- riduzione scarti.

Documentazione:

- schede tecniche;
- distinte base;
- documentazione cliente;
- documentazione laboratorio.

Business:

- marketing;
- commerciale;
- preventivi;
- memoria aziendale;
- supporto decisionale.

Personale:

- memoria storica;
- preferenze;
- pianificazione;
- supporto alla risoluzione problemi.

### Alternative Scartate

- Trattare EDI come Source of Truth.
- Trattare EDI come solo recognition.
- Far mutare Product Package direttamente da EDI.
- Far mutare Project State direttamente da EDI.
- Saltare validazione umana o di sistema per proposte EDI.

### Impatto Architetturale

EDI diventa una capability strategica permanente, ma resta non autoritativa.

Ogni proposta EDI deve attraversare boundary e validazioni esplicite prima di diventare stato prodotto, stato progetto o dato operativo.

### Regole Permanenti Generate

- EDI osserva, comprende, ricorda, propone, crea, valida e ottimizza.
- EDI non e Source of Truth.
- Product Package resta Source of Truth prodotto.
- Project State resta Source of Truth progetto.
- Dati validati del sistema restano autoritativi.
- Le proposte EDI devono essere validate prima di diventare operative.
- EDI supporta progettazione, produzione, documentazione, business e memoria personale senza bypassare validation gate.

## DL-EXEC-044 - Product Package Owns Product Meaning

### Problema

Dopo aver definito EDI come intelligence strategica, serviva formalizzare il Product State Boundary: chi possiede il significato del prodotto, chi puo modificarlo, chi puo osservarlo e come Viewer, Factory e Presentation Model devono restare separati.

### Decisione

Il Product Package e il Source of Truth del prodotto.

Project State e il Source of Truth del progetto.

BagaStudio possiede Validation Layer e Mutation Layer.

EDI osserva, ricorda, propone e ottimizza, ma non modifica direttamente Product Package o Project State.

Viewer e Presentation Model non sono Source of Truth.

Factory consuma solo dati validati.

### Ownership Map

```text
Product Package -> Product Source of Truth
Project State -> Project Source of Truth
Validated System Data -> Operational Authority
EDI -> Observation / Memory / Proposal / Optimization
BagaStudio -> Validation / Mutation
BagaStudioPresentationModel -> Presentation Boundary
Viewer -> Presentation
Factory -> Production
```

### Motivazione

Product Package contiene significato prodotto, componenti, dimensioni, metadata e dati rilevanti per produzione.

Viewer e Presentation Model servono a presentare o trasportare dati, non a definirne la verita.

EDI puo generare proposte utili, ma trattarle come mutazioni dirette introdurrebbe rischio operativo e produttivo.

### Alternative Scartate

- EDI modifica direttamente Product Package.
- Viewer modifica direttamente Product Package.
- Presentation Model diventa Source of Truth.
- Factory accetta suggerimenti EDI come istruzioni produttive validate.
- Product Package viene derivato implicitamente da output non validati.

### Impatto Architetturale

La prossima RFC deve pianificare il flusso di integrazione product-state:

- come Product Package alimenta Presentation Model;
- come EDI osserva Product Package;
- come proposal EDI attraversano Validation Layer prima della Mutation.

La prossima RFC consigliata e `RFC-1193 - BagaStudio Product State Integration Planning`.

### Regole Permanenti Generate

- Product Package e Source of Truth prodotto.
- Project State e Source of Truth progetto.
- Presentation Model non e Source of Truth.
- Viewer non e Source of Truth.
- EDI non modifica direttamente Product Package.
- Viewer non modifica direttamente Product Package.
- BagaStudio Validation Layer precede Mutation Layer.
- Factory consuma dati validati, non proposte EDI grezze.

## DL-EXEC-045 - Product Package Integration Is Adapter And Validation Driven

### Problema

Dopo la definizione del Product State Boundary, serviva pianificare come Product Package, EDI, Validation Layer, Mutation Layer, Presentation Model e Viewer collaborano senza violare le ownership.

### Decisione

L'integrazione deve seguire tre path separati.

Observation Path:

```text
Product Package
Observation Adapter
EDI
```

Proposal Path:

```text
EDI
Proposal
Validation Layer
Mutation Layer
Product Package
```

Presentation Path:

```text
Product Package
BagaStudioPresentationModel
Viewer
```

### Motivazione

Product Package resta Source of Truth e puo essere osservato da EDI solo tramite un adapter dedicato.

EDI puo proporre, ma non mutare.

BagaStudio Validation Layer decide se una proposta puo avanzare. BagaStudio Mutation Layer e l'unico percorso ammesso per modificare Product Package.

Presentation Model serve il Viewer, ma non diventa autoritativo.

### Alternative Scartate

- EDI legge Product Package e lo modifica direttamente.
- EDI genera mutation senza Validation Layer.
- Viewer aggiorna Product Package direttamente.
- Presentation Model sostituisce Product Package.
- Factory consuma proposte EDI non validate.

### Impatto Architetturale

La prossima RFC deve progettare il `Product Package Observation Adapter`.

Il Product Package Observation Adapter dovra convertire dati Product Package validati in osservazioni EDI senza introdurre mutazione, Viewer, UI o runtime operativo.

### Regole Permanenti Generate

- Product Package entra in EDI tramite Observation Adapter.
- Observation Adapter non muta Product Package.
- Proposal EDI attraversa Validation Layer prima della Mutation.
- Mutation Layer appartiene a BagaStudio.
- Presentation Model deriva dati per Viewer, ma non e Source of Truth.
- Viewer consuma Presentation Model, non Product Package mutation.
- Factory consuma solo dati validati.

## DL-EXEC-046 - Product Package Observation Uses Read-Only Snapshot

### Problema

Dopo aver stabilito che Product Package e il Source of Truth del prodotto, serviva definire come EDI potra osservarlo senza acquisire poteri di mutazione o dipendenze da Viewer, Factory, runtime o UI.

Il codice storico contiene riferimenti Product Package vicini a Viewer state, `userData`, helper globali e report factory/layout. Questi riferimenti sono utili come evidenza architetturale, ma non devono diventare il modello di integrazione EDI.

### Decisione

Il futuro Product Package Observation Adapter deve produrre uno snapshot read-only.

Lo snapshot e il solo oggetto che EDI potra consumare come osservazione prodotto.

Il flusso documentato e:

```text
Product Package
Product Package Observation Adapter
Product Package Observation Snapshot
EDI Observation / Memory / Proposal / Optimization
```

L'adapter puo osservare dati gia presenti e selezionati, come identita prodotto, schema/versione, source format, dimensioni, footprint, component ids, component count, materiali, finiture, LED metadata, insert metadata, validation/report metadata, production readiness metadata gia validati, timestamp e traceability ids.

L'adapter non deve esporre riferimenti mutabili, scene graph live, `userData` mutation handles, helper globali, parser internals, dati geometrici non validati per mutation, istruzioni Factory eseguibili o dati customer/business non esplicitamente inclusi nello snapshot.

### Motivazione

EDI deve poter osservare, ricordare, proporre e ottimizzare, ma non deve diventare Source of Truth.

Uno snapshot read-only consente a EDI di costruire memoria e ragionamento senza possedere il Product Package e senza poterlo alterare per riferimento.

La separazione protegge anche BagaStudio: ogni proposal futura dovra attraversare Validation Layer e Mutation Layer prima di modificare Product Package.

### Alternative Scartate

- Far leggere a EDI il Product Package live.
- Passare a EDI riferimenti Viewer o `userData`.
- Far produrre proposal direttamente all'Observation Adapter.
- Far validare modifiche prodotto all'Observation Adapter.
- Far chiamare Mutation Layer, Viewer, Factory o runtime dall'Observation Adapter.

### Impatto Architetturale

La prossima RFC consigliata e `RFC-1195 - Product Package Observation Snapshot Foundation`.

RFC-1195 dovra introdurre solo il tipo snapshot read-only e la relativa factory/foundation minima, senza mutare Product Package, senza chiamare runtime, senza creare proposal e senza collegare Viewer/UI.

### Regole Permanenti Generate

- Product Package Observation Adapter produce snapshot read-only.
- Product Package Observation Adapter non espone riferimenti mutabili.
- Product Package Observation Adapter non chiama Mutation Layer.
- Product Package Observation Adapter non chiama Viewer, Factory, runtime, UI o React state.
- Product Package Observation Adapter non crea proposal.
- Product Package Observation Adapter non valida modifiche prodotto.
- Product Package Observation Snapshot puo alimentare Memory, Proposal e Optimization solo come evidenza.
- Ogni proposal derivata dallo snapshot deve attraversare Validation Layer prima della Mutation.

## DL-EXEC-047 - Product Package Observation Snapshot Is Data Contract

### Problema

Dopo aver deciso che il Product Package Observation Adapter dovra produrre snapshot read-only, serviva introdurre il primo contratto dati concreto tra Product Package ed EDI senza creare ancora l'adapter operativo.

### Decisione

Introdurre `ProductPackageObservationSnapshot` come foundation serializzabile, immutable-style e read-only.

Il contratto contiene solo dati osservabili:

- id;
- timestamp;
- productPackageId;
- productPackageVersion;
- schema;
- sourceFormat;
- status;
- dimension summary;
- footprint summary;
- component ids;
- component count;
- component summaries;
- material summaries;
- finish summaries;
- metadata di tracciabilita.

La factory `createProductPackageObservationSnapshot` crea il dato snapshot, applica copie difensive agli array e ai metadata principali, e non chiama Product Package, RuntimeHost, RuntimeLoop, Viewer, Factory, React, Mutation Layer o Proposal Layer.

### Motivazione

Il primo contratto EDI/Product Package deve essere stabile prima di introdurre l'adapter.

Separare snapshot e adapter mantiene Product Package come Source of Truth e impedisce a EDI di ricevere riferimenti live o mutabili.

Lo snapshot consente a Memory, Reasoning, Proposal e Optimization di lavorare su evidenza serializzabile, senza scambiare l'osservazione per una mutazione autorizzata.

### Alternative Scartate

- Creare subito un Product Package Observation Adapter operativo.
- Far accettare alla foundation riferimenti Product Package live.
- Far leggere allo snapshot Viewer state o `userData`.
- Inserire funzioni di mutation, validation o proposal nello snapshot.
- Collegare lo snapshot a runtime, Factory o UI.

### Impatto Architetturale

RFC-1195 crea il contratto dati, ma non crea il percorso operativo.

La prossima fase potra introdurre un Product Package Observation Adapter Foundation che accetta Product Package come input, seleziona i campi osservabili e crea `ProductPackageObservationSnapshot`.

### Regole Permanenti Generate

- Product Package Observation Snapshot e un contratto dati.
- Product Package Observation Snapshot e read-only e serializzabile.
- Product Package Observation Snapshot non contiene funzioni di mutation.
- Product Package Observation Snapshot non contiene riferimenti runtime, Viewer, Factory o React.
- Product Package Observation Snapshot non crea proposal.
- Product Package Observation Snapshot alimenta Memory, Reasoning, Proposal e Optimization solo come evidenza.
- Product Package Observation Adapter operativo resta una RFC futura.

## DL-EXEC-048 - Product Package Observation Adapter Is One-Way

### Problema

Dopo aver creato `ProductPackageObservationSnapshot`, serviva introdurre il primo adapter foundation capace di trasformare dati Product Package in snapshot senza aprire un percorso di mutation, proposal o runtime execution.

### Decisione

Introdurre `ProductPackageObservationAdapter` come adapter one-way.

Il flusso ammesso e:

```text
Product Package-shaped data
createProductPackageObservationAdapterResult
ProductPackageObservationSnapshot
EDI
```

L'adapter accetta una shape neutra `Record<string, unknown>` e seleziona solo campi osservabili:

- identita prodotto;
- schema;
- versione;
- sourceFormat;
- status;
- dimensioni;
- footprint;
- component ids;
- component summaries;
- component count;
- materiali;
- finiture;
- metadata di tracciabilita.

L'adapter non restituisce il Product Package originale e non conserva riferimenti mutabili.

### Motivazione

La shape Product Package esistente e ancora vicina a Viewer/runtime legacy. Usare un input neutro evita di importare tipi Viewer-local dentro EDI.

La conversione one-way permette a EDI di osservare dati prodotto senza diventare owner del Product Package.

### Alternative Scartate

- Importare direttamente il tipo Product Package definito nel Viewer.
- Restituire il Product Package originale insieme allo snapshot.
- Collegare l'adapter a RuntimeHost o RuntimeLoop.
- Usare l'adapter per generare proposal.
- Usare l'adapter per validare o mutare Product Package.

### Impatto Architetturale

RFC-1196 crea un punto di conversione sicuro, ma non introduce integration.

Nessun workflow prodotto chiama ancora `createProductPackageObservationAdapterResult`.

### Regole Permanenti Generate

- Product Package Observation Adapter e one-way.
- Product Package Observation Adapter produce solo `ProductPackageObservationSnapshot`.
- Product Package Observation Adapter non restituisce reference mutabili al Product Package.
- Product Package Observation Adapter non muta Product Package.
- Product Package Observation Adapter non chiama RuntimeHost, RuntimeLoop, Viewer, Factory, UI o React state.
- Product Package Observation Adapter non crea proposal.
- Product Package Observation Adapter non valida product changes.
- Product Package Observation Adapter foundation non e product integration.

## DL-EXEC-049 - Product Package Observation Flow Is Memory-Ready For Review

### Problema

Dopo RFC-1195 e RFC-1196, serviva verificare se il flow Product Package, Observation Adapter, Observation Snapshot, EDI Observation fosse abbastanza sicuro per pianificare Memory senza introdurre ancora Memory, Reasoning, Proposal, Viewer o UI.

### Decisione

Il Product Package Observation Flow e approvato come foundation one-way e read-only.

Il flow resta:

```text
Product Package
Product Package Observation Adapter
Product Package Observation Snapshot
EDI Observation
```

Il flow e pronto per una review Memory, non per ingestion automatica.

### Motivazione

L'adapter non restituisce il Product Package originale, non muta Product Package e produce solo `ProductPackageObservationSnapshot`.

Lo snapshot contiene dati sufficienti per una prima pianificazione Memory:

- id;
- timestamp;
- productPackageId;
- productPackageVersion;
- schema;
- sourceFormat;
- status;
- dimensions;
- footprint;
- component ids;
- component summaries;
- material summaries;
- finish summaries;
- traceability metadata.

### Rischi Documentati

- `metadata` usa campi estensibili `unknown` e richiede una policy futura di serializzazione e allowlist.
- Le array sono readonly a livello TypeScript e copiate difensivamente, ma non sono runtime frozen.
- La selezione campi Product Package e minimale e potrebbe mancare dati utili alla Memory futura.
- Alcuni componenti potrebbero non entrare nello snapshot se usano campi id non riconosciuti.
- La tracciabilita e ancora foundation-level.

### Alternative Scartate

- Collegare subito lo snapshot a Memory.
- Introdurre Reasoning o Proposal prima della Memory review.
- Collegare il flow a Viewer o UI.
- Espandere adesso l'adapter con field mapping completo.
- Introdurre runtime freezing o validation policy senza RFC dedicata.

### Impatto Architetturale

La prossima RFC consigliata e `RFC-1198 - EDI Memory Foundation Review`.

RFC-1198 dovra decidere come EDI Observation diventa Memory senza introdurre ingestion automatica o mutation.

### Regole Permanenti Generate

- Product Package Observation Flow e one-way.
- Product Package Observation Flow e read-only a livello foundation.
- Product Package Observation Snapshot puo alimentare Memory solo dopo RFC dedicata.
- Metadata osservativi richiedono policy di serializzazione prima di Memory ingestion.
- Memory non deve leggere Product Package direttamente.
- Memory deve ricevere osservazioni/snapshot, non riferimenti Product Package live.

## DL-EXEC-050 - EDI Memory Is Contextual Knowledge, Not Cache

### Problema

Dopo la chiusura dell'Observation Flow, serviva definire che cosa significhi Memory per EDI prima di creare un tipo `Memory Entry` o introdurre storage reale.

Il rischio era trattare Memory come cache tecnica o come nuovo Source of Truth.

### Decisione

EDI Memory e conoscenza contestuale persistibile, domain-independent e non autoritativa.

Memory puo ricordare:

- osservazioni;
- observation snapshot;
- decisioni;
- proposte;
- errori;
- rifiuti;
- validazioni;
- preferenze esplicite;
- segnali di prodotto, progetto, cliente, documentazione, preventivo, produzione e business.

Memory non e cache.

Memory non e Source of Truth.

Memory alimenta Understanding e Reasoning, ma non muta Product Package, Project State, Viewer, Factory o runtime.

### Lifecycle

Il lifecycle concettuale e:

```text
Observation Snapshot
Memory Candidate
Memory Entry
Retrieval
Understanding / Reasoning
Knowledge Graph future
```

### Observation Snapshot vs Memory Entry vs Knowledge

Observation Snapshot:

- pacchetto read-only point-in-time;
- rappresenta cio che e stato osservato;
- non decide cosa conservare.

Memory Entry:

- record trattenuto e indirizzabile;
- puo derivare da una o piu osservazioni, decisioni, proposal o errori;
- deve conservare provenance, timestamp e ownership metadata.

Knowledge futura:

- struttura superiore;
- collega, sintetizza e generalizza piu memory entries;
- non viene introdotta in questa RFC.

### Motivazione

EDI deve ricordare segnali utili per continuita, apprendimento operativo, supporto decisionale e ragionamento.

La memoria deve collegare domini diversi senza sostituire i sistemi autoritativi.

Product Package resta Source of Truth prodotto. Project State resta Source of Truth progetto. I dati validati restano autorita operativa.

### Alternative Scartate

- Memory come cache temporanea.
- Memory come database operativo introdotto subito.
- Memory come Source of Truth.
- Memory che legge Product Package live.
- Memory che modifica Product Package o Project State.
- Memory che avvia Reasoning, Proposal o Optimization automaticamente.

### Impatto Architetturale

La prossima RFC consigliata e `RFC-1199 - EDI Memory Entry Foundation`.

RFC-1199 dovra creare il concetto di Memory Entry senza storage reale, database, Reasoning, Proposal, Viewer o UI.

### Regole Permanenti Generate

- Memory non e cache.
- Memory non e Source of Truth.
- Memory conserva conoscenza utile e contestuale.
- Memory e domain-independent.
- Memory riceve Observation Snapshot o segnali espliciti, non riferimenti live.
- Memory alimenta Understanding e Reasoning.
- Memory non muta Product Package, Project State, Viewer, Factory o runtime.
- Knowledge Graph resta futuro.

## DL-EXEC-051 - EDI Memory Entry Is Descriptor, Not Storage

### Problema

Dopo aver definito la filosofia Memory, serviva introdurre il primo contratto dati `Memory Entry` senza trasformarlo in database, storage, retrieval engine, reasoning o proposal.

### Decisione

Introdurre `EdiMemoryEntry` come descrittore serializzabile e non operativo.

La entry contiene:

- identity;
- source;
- timestamp;
- category;
- summary;
- traceability metadata;
- reference serializzabile allo Observation Snapshot originale.

La factory `createEdiMemoryEntryFromObservationSnapshot` crea una entry da `ProductPackageObservationSnapshot`, copiando metadata utili e conservando solo un riferimento serializzabile allo snapshot.

### Motivazione

Memory Entry deve essere il ponte dati tra Observation e futura Understanding/Reasoning.

La entry non deve trattenere riferimenti live a Product Package, Viewer, Factory, runtime o UI.

Separare Memory Entry da storage consente di definire il significato del ricordo prima di decidere persistenza, retention, retrieval, privacy e governance.

### Alternative Scartate

- Introdurre subito storage reale.
- Introdurre subito database.
- Usare Memory Entry come cache runtime.
- Inserire retrieval o scoring nella factory.
- Collegare Memory Entry a Reasoning o Proposal.
- Salvare il Product Package live dentro Memory.

### Impatto Architetturale

RFC-1199 crea il contratto Memory Entry, ma non crea Memory runtime.

La prossima fase dovra revisionare la entry e pianificare ingestion/retrieval senza rompere ownership e governance.

### Regole Permanenti Generate

- Memory Entry e un descrittore, non storage.
- Memory Entry non e cache.
- Memory Entry non e Source of Truth.
- Memory Entry conserva un riferimento serializzabile allo Observation Snapshot.
- Memory Entry non conserva Product Package live.
- Memory Entry non attiva retrieval, reasoning, proposal o mutation.
- Memory Entry non conosce Viewer, UI, Factory o runtime.

## DL-EXEC-052 - Observation To Memory Preserves Context Without Triggering Reasoning

### Problema

Dopo RFC-1199, serviva revisionare il percorso `Observation Snapshot -> Memory Entry` prima di progettare Understanding, Reasoning, Proposal, storage o ingestion runtime.

La domanda centrale era se Memory conserva dati grezzi o conoscenza contestuale.

### Decisione

Approvare il percorso Observation to Memory come foundation documentale:

```text
Product Package
Product Package Observation Adapter
Product Package Observation Snapshot
Memory Candidate
EdiMemoryEntry
```

Memory conserva conoscenza contestuale derivata da osservazioni, non cache runtime.

`ProductPackageObservationSnapshot` resta il pacchetto read-only di evidenza osservata.

`EdiMemoryEntry` resta il record contestuale trattenuto, con summary, source, category, timestamp, metadata e riferimento serializzabile allo snapshot originale.

### Motivazione

Separare Snapshot e Memory Entry evita che l'osservazione diventi memoria viva o Source of Truth.

La Memory Entry e sufficientemente tracciabile a livello foundation tramite id, timestamp, source, productPackageId, schema, sourceFormat e riferimento allo snapshot.

Il modello e abbastanza domain-independent per pianificare Understanding futura, perche source e category non sono limitati al solo Product Package.

### Alternative Scartate

- Usare Observation Snapshot direttamente come Memory Entry.
- Introdurre storage o database durante la review.
- Introdurre Understanding o Reasoning subito dopo la creazione della entry.
- Introdurre Proposal o Optimization operative.
- Usare Memory Entry come cache runtime.
- Salvare riferimenti live al Product Package.

### Impatto Architetturale

RFC-1200 conferma che Observation to Memory e pronto per planning Understanding, ma non per runtime ingestion, retrieval, reasoning operativo o proposal.

Restano aperti deduplication, correlation, confidence, trust, freshness, retention, privacy, governance e allineamento con i contratti cognitivi memory piu vecchi.

La prossima RFC consigliata e `RFC-1201 - EDI Understanding Foundation Review`.

### Regole Permanenti Generate

- Observation Snapshot e Memory Entry restano separati.
- Memory conserva conoscenza contestuale, non cache dati.
- Memory Entry non e Source of Truth.
- Memory Entry non avvia Understanding, Reasoning, Proposal, Optimization, Mutation o runtime.
- Future Understanding deve leggere Memory Entry solo tramite RFC dedicata.
- Future Reasoning deve trattare Memory Entry come evidenza, non come trigger automatico.

## DL-EXEC-031 - First Observable Recognition Flow Foundation

### Problema

Serviva assemblare il primo flow recognition osservabile end-to-end usando solo le foundation esistenti, senza introdurre Viewer, UI, dispatch globale, RuntimeHost, RuntimeLoop o recognition reale.

### Decisione

Introdurre `RecognitionObservableFlow` come helper controllato.

Il helper riceve `RecognitionProducerAdapterInput` e `EdiExecutionRuntime`, usa `RecognitionProducerBoundaryPipeline`, chiama `RecognitionRuntimeAdapter` solo se la boundary validation passa, usa `RecognitionResultAdapter` e restituisce `RecognitionObservableFlowResult`.

### Motivazione

Il flow consente di validare la composizione end-to-end mantenendo separati producer, boundary, runtime adapter e result adapter.

La boundary failure resta controllata e non chiama runtime.

### Alternative Scartate

- Collegare Viewer o UI.
- Fare dispatch globale.
- Chiamare RuntimeHost o RuntimeLoop.
- Chiamare Consumer.
- Unire flow helper e dispatch.
- Introdurre recognition reale.
- Analizzare geometria o scene.
- Introdurre `runRealIntegration`.

### Impatto Architetturale

Recognition ottiene il primo observable flow foundation completo, ma nessuna real integration.

Il flow resta helper-driven e caller-controlled.

### Regole Permanenti Generate

- Recognition Observable Flow accetta `RecognitionProducerAdapterInput`.
- Recognition Observable Flow usa la boundary pipeline prima del runtime.
- Recognition Observable Flow non chiama runtime quando boundary validation fallisce.
- Recognition Observable Flow produce un result controllato.
- Recognition Observable Flow restituisce observable data, non UI.
- Recognition Observable Flow non fa dispatch globale.
- Recognition Observable Flow non chiama RuntimeHost o RuntimeLoop.
- Recognition Observable Flow non introduce recognition reale.
