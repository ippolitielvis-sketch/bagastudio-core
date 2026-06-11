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
