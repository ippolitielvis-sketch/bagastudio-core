# 02 - Decision Log

Questo documento registra decisioni tecniche ricostruite dall'export. Non e un riassunto conversazionale. Quando una decisione e dichiarata nei checkpoint ma non verificata sul codice, viene marcata `Da verificare`.

## Milestone - BagaStudio Core come engine universale

# Contesto
BagaStudio viene separato da Libreria Morini e dal framework Elvis. Le conversazioni chiariscono che BagaStudio non deve restare una demo verticale.

# Problema
Il progetto rischiava di confondere software proprietario, librerie prodotto, lavoro aziendale e servizi AI.

# Decisione
BagaStudio diventa Core universale multi-prodotto. BagaStudio Showcase resta demo/prototipo. Libreria Morini resta separata.

# Motivazione
Il vincolo e etico e strategico: costruire un asset software non in conflitto con l'ecosistema lavorativo corrente.

# Implementazione
Da verificare. Storicamente la decisione produce la roadmap per import multi-formato, materiali per pezzo, LED, salvataggio configurazione, BOM e pricing.

# Evoluzione
Questa decisione genera Viewer, Import Intelligence, Product Package, Pricing/BOM, Factory, Scene Composer ed EDI.

# Impatto
BagaStudio passa da configuratore visuale a piattaforma tecnico-commerciale.

# Regole permanenti nate
- Separare BagaStudio, Libreria Morini ed Elvis.
- Pensare ogni feature come parte di un engine riutilizzabile.
- Evitare funzioni one-off non riusabili.

# Collegamenti con altri Engine
Viewer, Import, Product Package, Pricing/BOM, Factory, EDI.

# Conversazioni utilizzate
- `BagaStudio Core V1` (`conversations-003.json`)
- `Riprendere BagaStudio Core` (`conversations-003.json`)

## Milestone - Sviluppo conservativo e validato

# Contesto
Il progetto cresce su file grandi e funzioni interdipendenti. Le conversazioni ripetono la necessita di non perdere funzioni gia stabili.

# Problema
Refactor ampi o patch non isolate potevano rompere Viewer, import, camera, drag, collisioni, join o logica EDI.

# Decisione
Adottare disciplina permanente: modifiche chirurgiche, merge-safe, un modulo alla volta, test reale e checkpoint Git dopo fasi validate.

# Motivazione
Il valore del progetto sta nella continuita tecnica accumulata. Ogni checkpoint validato diventa fondazione.

# Implementazione
Prompt operativi ricorrenti chiedono file unico quando possibile, nessun refactor, funzioni rimosse = 0, report con righe iniziali/finali, file modificati, test e rischi residui.

# Evoluzione
La regola diventa piu rigida in Recovery DAE/Viewer, Collision/Join e EDI Render Engine V2.

# Impatto
BagaStudio assume una governance da Master Blueprint: ogni modifica deve essere piccola, verificabile e reversibile.

# Regole permanenti nate
- Un modulo alla volta.
- Test reale obbligatorio.
- Git checkpoint dopo fase validata.
- Nessun refactor prima della validazione.
- Nuove funzionalita in file dedicati quando possibile.
- Funzioni rimosse = 0.

# Collegamenti con altri Engine
Tutti gli Engine.

# Conversazioni utilizzate
- `Modifiche Dashboard Premium` (`conversations-004.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `Refactor BagaStudio V1.9` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)

## Milestone - Viewer come superficie stabile

# Contesto
Il Viewer attraversa multi-loader, dashboard premium, recovery DAE, UX premium, showroom, collisioni e join.

# Problema
Ogni engine dipende dal Viewer. Se camera, selezione, drag, import o collisioni regrediscono, il resto del Core non e affidabile.

# Decisione
Il Viewer diventa contratto stabile: ogni nuova feature deve dichiarare cosa non tocca.

# Motivazione
Il Viewer e il luogo di verifica reale del sistema. Tutte le regressioni diventano visibili li.

# Implementazione
Da verificare. I prompt impongono di non cambiare UI, camera, drag DAE, selezione modello, import, collisioni o Join Assistant quando lo step riguarda solo data shape.

# Evoluzione
Viewer Recovery produce il principio che la camera non deve tornare automaticamente in vista 3D durante selezioni o aggiornamenti UI.

# Impatto
Ogni engine deve agganciarsi al Viewer senza contaminarlo.

# Regole permanenti nate
- Preservare camera e vista corrente.
- Preservare drag DAE e moduli parametrici.
- Validare Viewer prima di feature nuove.

# Collegamenti con altri Engine
Import, Recognition, Collision, Join, Product Package, EDI overlay.

# Conversazioni utilizzate
- `Ripresa Viewer3D Multi-Loader` (`conversations-003.json`)
- `Ripresa BagaStudio Core - Recovery DAE/Viewer` (`conversations-004.json`)
- `Bug Fix Showroom Premium` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - Product Package come ponte verso produzione

# Contesto
Dopo DAE/S3D, il modello importato deve diventare componente tecnico e non solo geometria.

# Problema
Senza partId, categorie, metadata e mapping, non esistono materiali modulo, BOM, pricing, collisioni affidabili o factory.

# Decisione
Product Package V2 deve contenere partId automatici, categorie componenti, metadata runtime, bridge Viewer/configuratore e preparazione geometria/runtime.

# Motivazione
Serve un contratto dati tra asset visuale e logica tecnico-commerciale.

# Implementazione
Da verificare. Le conversazioni citano S3D Import Runtime V1, analyzer `.s3d`, DAE importer nel Viewer, component list runtime e CSV/CIX Matcher 80/80.

# Evoluzione
Product Package porta ad Auto Mapping Engine V2 e Imported Model Hierarchy V1.

# Impatto
Il pacchetto prodotto diventa fondazione per configurazione, BOM, preventivo e produzione.

# Regole permanenti nate
- Ogni parte importata deve avere identita tecnica.
- I dati devono essere aggiunti in modo non distruttivo.

# Collegamenti con altri Engine
Import, Recognition, Pricing/BOM, Factory, Viewer, Collision.

# Conversazioni utilizzate
- `Importer Pipeline V2 DAE` (`conversations-004.json`)
- `Aggiornamento S3D Product Package` (`conversations-004.json`)
- `BagaStudio Core V2` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - EDI come Engine separato

# Contesto
EDI viene dichiarato presente in Home e Viewer, con overlay separato dal Canvas e motori cognitivi validati.

# Problema
Un launcher statico non rappresenta EDI. Evolverlo direttamente nel Viewer rischia regressioni.

# Decisione
Separare EDI logic, EDI visual e EDI Render Engine V2. Il renderer SVG resta prototipo V1.

# Motivazione
EDI deve diventare entita viva senza contaminare Viewer, Home, Launcher o logica esistente.

# Implementazione
Da verificare. Sono citati EdiAnimatedCoreV1, stati Idle/Analyzing/Thinking/Suggestion/Warning/Success, WebGLRenderer, RenderTarget, ShaderMaterial, EffectComposer e UnrealBloomPass.

# Evoluzione
La roadmap passa a Shader Laboratory, Heart Shader, Plasma Shader, Magnetic Distortion, Particle Physics, Volumetric Glow, Thought Pulse e Speaking Pulse.

# Impatto
EDI diventa asse tecnico parallelo del Core.

# Regole permanenti nate
- Non evolvere piu SVG oltre il prototipo.
- Una RFC alla volta.
- Non contaminare Viewer/Home/Launcher.

# Collegamenti con altri Engine
Viewer overlay, Home, EDI Cognitive, Shader Laboratory.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)

## Milestone - RFC-1214 Validation Support Builder Foundation

# Contesto
Il Core Cognitive Loop ha introdotto Proposal Artifact, Proposal Builder, Proposal Traceability, Proposal Evaluation e poi Validation Support Artifact come materiale consultivo non autoritativo.

# Problema
Serviva un builder fondazionale per creare Validation Support Artifact singoli o multipli da input espliciti senza trasformare il supporto in approvazione, rifiuto, decisione automatica o Mutation.

# Decisione
Introdurre `EdiValidationSupportArtifactBuilder` come builder stateless, puro e deterministico con timestamp esplicito, delegando a `createEdiValidationSupportArtifact`.

# Motivazione
Validation Support deve avere una forma produttiva coerente, ma deve restare support material. La decisione finale e la mutation appartengono a futuri layer BagaStudio-owned.

# Implementazione
RFC-1214 crea `components/edi/validation/EdiValidationSupportArtifactBuilder.ts` e documenta il builder nei documenti EDI principali.

# Evoluzione
La roadmap passa a review di Validation Support Builder e Mutation Boundary prima di qualsiasi approval/rejection workflow.

# Impatto
Il layer Validation Support ottiene artifact e builder fondazionali, ma resta non esecutivo e non autoritativo.

# Regole permanenti nate
- Validation Support Builder produce solo `EdiValidationSupportArtifact`.
- Validation Support Builder usa input espliciti e timestamp esplicito.
- Validation Support Builder non approva, non rifiuta e non decide.
- Validation Support Builder non muta Product Package o Project State.
- Validation Support Builder non chiama executor, runtime, Viewer, UI, storage o retrieval.

# Collegamenti con altri Engine
EDI Cognitive, Proposal, Reasoning, Understanding, BagaStudio Validation futura.

# Conversazioni utilizzate
- RFC-1214 Validation Support Builder Foundation

## Milestone - RFC-1215 Validation Support Traceability Foundation

# Contesto
Validation Support dispone di artifact e builder fondazionali, ma serve tracciabilita cognitiva dedicata prima di qualsiasi review su Mutation Boundary.

# Problema
Senza audit trail, il materiale di supporto alla validazione non puo essere collegato in modo esplicito a Understanding, Reasoning, Proposal, considerazioni, rischi e domande.

# Decisione
Introdurre `EdiValidationSupportTraceability` come struttura dati serializzabile, auditabile, domain-independent e non esecutiva.

# Motivazione
Validation Support deve poter essere ispezionato storicamente senza diventare approval, rejection, decision engine o mutation path.

# Implementazione
RFC-1215 crea `components/edi/validation/EdiValidationSupportTraceability.ts` e documenta la traceability nei documenti EDI principali.

# Evoluzione
La roadmap passa a review di Validation Support Traceability e Mutation Boundary prima di introdurre approval/rejection workflow.

# Impatto
Il layer Validation Support ottiene auditability fondazionale, mantenendo separati supporto, decisione e mutation.

# Regole permanenti nate
- Validation Support Traceability e audit data.
- Validation Support Traceability non approva, non rifiuta e non decide.
- Validation Support Traceability non muta Product Package o Project State.
- Validation Support Traceability non chiama executor, runtime, Viewer, UI, storage o retrieval.

# Collegamenti con altri Engine
EDI Cognitive, Validation Support, Proposal, Reasoning, Understanding, BagaStudio Validation futura.

# Conversazioni utilizzate
- RFC-1215 Validation Support Traceability Foundation

## Milestone - RFC-1216 Validation Support Evaluation Foundation

# Contesto
Validation Support dispone di artifact, builder e traceability fondazionali. Serve ora descrivere la qualita del support material senza introdurre decisioni.

# Problema
Senza evaluation dedicata, completezza, copertura, copertura rischi, qualita delle domande e completezza della traceability restano non rappresentate.

# Decisione
Introdurre `EdiValidationSupportEvaluation` come struttura dati serializzabile, auditabile, domain-independent e non esecutiva.

# Motivazione
Validation Support deve poter esporre quality signals descrittivi prima di qualsiasi workflow di approval/rejection o Mutation Boundary.

# Implementazione
RFC-1216 crea `components/edi/validation/EdiValidationSupportEvaluation.ts` e documenta la evaluation nei documenti EDI principali.

# Evoluzione
La roadmap passa a review di Validation Support Evaluation e Mutation Boundary prima di introdurre approval/rejection workflow.

# Impatto
Il layer Validation Support ottiene quality data fondazionale, mantenendo separati supporto, decisione e mutation.

# Regole permanenti nate
- Validation Support Evaluation e quality data.
- Validation Support Evaluation non approva, non rifiuta e non decide.
- Validation Support Evaluation non muta Product Package o Project State.
- Validation Support Evaluation non chiama executor, runtime, Viewer, UI, storage o retrieval.

# Collegamenti con altri Engine
EDI Cognitive, Validation Support, Proposal, Reasoning, Understanding, BagaStudio Validation futura.

# Conversazioni utilizzate
- RFC-1216 Validation Support Evaluation Foundation

## Milestone - RFC-1217 Decision Support Artifact Foundation

# Contesto
Validation Support dispone di artifact, builder, traceability ed evaluation fondazionali. Serve aprire Decision Support senza introdurre Decision Engine, approval o mutation.

# Problema
Senza un artifact dedicato, decision context, fattori, opzioni, tradeoff, rischi e domande restano mescolati con Validation Support o Proposal.

# Decisione
Introdurre `EdiDecisionSupportArtifact` come struttura dati serializzabile, auditabile, domain-independent e non esecutiva.

# Motivazione
Decision Support deve poter preparare materiale consultivo per un futuro processo BagaStudio-owned, senza scegliere opzioni o produrre decisioni finali.

# Implementazione
RFC-1217 crea `components/edi/decision/EdiDecisionSupportArtifact.ts` e documenta il Decision Support layer nei documenti EDI principali.

# Evoluzione
La roadmap passa a review di Decision Support Artifact e Decision Boundary prima di introdurre qualsiasi Decision Engine, Validation Approval o Mutation Layer.

# Impatto
EDI puo rappresentare supporto alla decisione, ma resta non autoritativo e non muta Product Package o Project State.

# Regole permanenti nate
- Decision Support Artifact e support material.
- Decision Support Artifact non approva, non rifiuta e non decide.
- Decision Support Artifact non seleziona opzioni e non produce decisioni finali.
- Decision Support Artifact non muta Product Package o Project State.
- Decision Support Artifact non chiama executor, runtime, workflow engine, Viewer, UI, storage o retrieval.

# Collegamenti con altri Engine
EDI Cognitive, Validation Support, Proposal, Reasoning, Understanding, BagaStudio Validation futura.

# Conversazioni utilizzate
- RFC-1217 Decision Support Artifact Foundation

## Milestone - RFC-1218 First Visible EDI Panel Foundation

# Contesto
EDI dispone di molte foundation cognitive e dati, ma non era ancora visibile nel Viewer.

# Problema
Serviva rendere EDI percepibile dall'utente senza collegare Viewer a EDI Core, runtime, observation flow reale, Validation, Decision Support o Mutation Layer.

# Decisione
Introdurre `EdiObservationPanel` come primo pannello EDI visibile, read-only e passivo.

# Motivazione
Il pannello massimizza il risultato visibile e minimizza il lavoro, usando solo dati gia disponibili nel Viewer.

# Implementazione
RFC-1218 crea `components/viewer-ui/EdiObservationPanel.tsx` e lo renderizza passivamente in `components/Viewer3D.tsx`.

# Evoluzione
La roadmap puo passare a una review del primo pannello visibile prima di collegare Product Package observation flow o EDI Core.

# Impatto
EDI diventa visibile nel Viewer, ma resta non autoritativo e non operativo.

# Regole permanenti nate
- First Visible EDI Panel e read-only.
- First Visible EDI Panel non importa EDI Core.
- First Visible EDI Panel non chiama runtime EDI.
- First Visible EDI Panel non crea artifact EDI.
- First Visible EDI Panel non muta Product Package o Project State.
- First Visible EDI Panel non introduce action, apply, execute o commit.

# Collegamenti con altri Engine
Viewer, BagaStudio Presentation, EDI Cognitive.

# Conversazioni utilizzate
- RFC-1218 First Visible EDI Panel Foundation

## Milestone - RFC-1219 First Real Observation Foundation

# Contesto
Il primo pannello EDI era visibile nel Viewer ma mostrava solo stato statico.

# Problema
Serviva rendere EDI capace di mostrare osservazioni reali derivate dal Viewer senza collegare EDI Core, runtime, artifact cognitivi o Mutation Layer.

# Decisione
Aggiornare `EdiObservationPanel` con una sezione `Osservazioni` derivata da dati presentation-safe gia disponibili nel Viewer.

# Motivazione
L'utente vede EDI reagire al contesto senza trasformare il pannello in runtime, observation flow reale o writer del Product Package.

# Implementazione
RFC-1219 aggiunge osservazioni descrittive: nessun prodotto caricato, modello rilevato, importazione completata e componenti osservabili.

# Evoluzione
La roadmap puo passare alla review del primo observation panel prima di collegare Product Package Observation Adapter o Memory.

# Impatto
EDI diventa osservatore visibile minimale, ma resta presentation-only.

# Regole permanenti nate
- First Real Viewer Observation e descrittiva.
- First Real Viewer Observation non crea artifact EDI.
- First Real Viewer Observation non chiama runtime EDI.
- First Real Viewer Observation non attiva Memory, Understanding, Reasoning, Proposal, Validation Support o Decision Support.
- First Real Viewer Observation non muta Product Package o Project State.

# Collegamenti con altri Engine
Viewer, BagaStudio Presentation, EDI Observation futura.

# Conversazioni utilizzate
- RFC-1219 First Real Observation Foundation

## Milestone - RFC-1220 First Real Understanding Foundation

# Contesto
Il pannello EDI mostrava osservazioni reali derivate dal Viewer, ma non ancora una comprensione semplice e visibile del contesto.

# Problema
Serviva mostrare una prima interpretazione deterministica del Viewer senza collegare EDI Core, runtime, Understanding Artifact, Memory, Reasoning, Proposal, Validation o Mutation Layer.

# Decisione
Aggiornare `EdiObservationPanel` con una sezione `COMPRENSIONE` derivata solo da dati Viewer presentation-safe gia disponibili.

# Motivazione
La comprensione visibile rende EDI piu utile per l'utente, ma resta read-only, spiegabile e non operativa.

# Implementazione
RFC-1220 aggiunge comprensioni deterministiche: progetto composto da X elementi, nessun elemento configurato, oggetto STL rilevato, modello importato rilevato e nome rilevato.

# Evoluzione
La roadmap puo distinguere la comprensione presentation-level dal futuro `EdiUnderstandingArtifact` collegato al Core Cognitive Loop.

# Impatto
EDI interpreta il contesto Viewer in modo minimale, ma non diventa runtime, AI, decision maker o mutatore del Product Package.

# Regole permanenti nate
- First Real Viewer Understanding e presentation-level.
- First Real Viewer Understanding non crea artifact EDI.
- First Real Viewer Understanding non chiama runtime EDI.
- First Real Viewer Understanding non usa LLM o AI.
- First Real Viewer Understanding non attiva Memory, Understanding Core, Reasoning, Proposal, Validation Support o Decision Support.
- First Real Viewer Understanding non muta Product Package o Project State.

# Collegamenti con altri Engine
Viewer, BagaStudio Presentation, EDI Understanding futura.

# Conversazioni utilizzate
- RFC-1220 First Real Understanding Foundation

## Milestone - RFC-1221 First Real Insight Foundation

# Contesto
Il pannello EDI mostrava osservazioni e comprensioni presentation-level derivate dal Viewer.

# Problema
Serviva aggiungere una prima nota di insight visibile senza collegare Reasoning, Proposal, Validation, Decision, runtime, AI o Mutation Layer.

# Decisione
Aggiornare `EdiObservationPanel` con una sezione `INSIGHT` derivata solo da dati Viewer presentation-safe gia disponibili.

# Motivazione
Gli insight rule-based rendono EDI piu espressivo per l'utente, ma restano spiegabili, read-only e non operativi.

# Implementazione
RFC-1221 aggiunge insight deterministici: progetto ancora vuoto, progetto con un solo elemento, progetto con pochi elementi e modello esterno importato.

# Evoluzione
La roadmap puo distinguere gli insight presentation-level dal futuro Reasoning, Decision Support o Decision Layer.

# Impatto
EDI mostra una prima nota contestuale, ma non diventa runtime, AI, decision maker o mutatore del Product Package.

# Regole permanenti nate
- First Real Viewer Insight e rule-based e presentation-level.
- First Real Viewer Insight non crea artifact EDI.
- First Real Viewer Insight non chiama runtime EDI.
- First Real Viewer Insight non usa LLM o AI.
- First Real Viewer Insight non attiva Memory, Understanding Core, Reasoning, Proposal, Validation Support, Decision Support o Decision.
- First Real Viewer Insight non muta Product Package o Project State.

# Collegamenti con altri Engine
Viewer, BagaStudio Presentation, EDI Insight futura.

# Conversazioni utilizzate
- RFC-1221 First Real Insight Foundation

## Milestone - RFC-1222 Product Package Observation Summary Foundation

# Contesto
Il pannello EDI era visibile nel Viewer e mostrava osservazioni, comprensioni e insight presentation-level, ma non vedeva ancora in modo controllato i moduli nativi BagaStudio.

# Problema
Serviva collegare Product Package, Viewer runtime e Scene Composer modules al pannello senza importare EDI Core nella UI, senza creare artifact nel pannello e senza introdurre mutation.

# Decisione
Introdurre un Product Package Observation summary read-only e presentation-safe creato fuori da `EdiObservationPanel`.

# Motivazione
Il summary permette a EDI di mostrare componenti osservabili, origine nativa/importata e disponibilita snapshot senza diventare runtime, Memory, Reasoning, Proposal, Validation o Decision.

# Implementazione
RFC-1222 usa il Product Package Observation Adapter fuori dal pannello e passa a `EdiObservationPanel` solo props serializzabili.

# Evoluzione
La roadmap puo ora revieware il ponte Product Package Observation Summary prima di collegare Memory o observation flow EDI completo.

# Impatto
EDI vede anche moduli nativi in forma summary read-only, mentre Product Package e Project State restano protetti.

# Regole permanenti nate
- Product Package Observation Summary e read-only.
- Product Package Observation Summary e presentation-safe.
- `EdiObservationPanel` non importa EDI Core.
- `EdiObservationPanel` non crea artifact EDI.
- Product Package Observation Summary non muta Product Package o Project State.

# Collegamenti con altri Engine
Viewer, Scene Composer, Product Package Observation, EDI Observation futura.

# Conversazioni utilizzate
- RFC-1222 Product Package Observation Summary Foundation

## Milestone - RFC-1223 Focused Observation / Selection Awareness Foundation

# Contesto
Il pannello EDI vedeva gia contesto Viewer, insight e Product Package Observation Summary, ma non la selezione corrente.

# Problema
Serviva rendere EDI consapevole del focus dell'utente senza collegare EDI Core, runtime, artifact, Memory, Reasoning, Proposal, Validation, Decision o Mutation.

# Decisione
Introdurre una sezione `FOCUS` nel pannello EDI alimentata da un selection summary presentation-safe creato in `Viewer3D`.

# Motivazione
La consapevolezza della selezione rende EDI piu contestuale e utile, restando read-only e deterministica.

# Implementazione
RFC-1223 usa `selectedRuntimePartId`, `selectedViewerRuntimeComponent` e `activeSceneModuleV1` per mostrare nome elemento selezionato, origine e stato osservazione.

# Evoluzione
La roadmap puo distinguere selection awareness presentation-level da futuri focus artifact, Memory o Reasoning.

# Impatto
EDI mostra il focus corrente del Viewer senza mutare Product Package, Project State o selezione.

# Regole permanenti nate
- Focused Observation e presentation-level.
- Focused Observation non crea artifact EDI.
- Focused Observation non chiama runtime EDI.
- Focused Observation non usa LLM o AI.
- Focused Observation non introduce action, apply, execute o commit.
- Focused Observation non muta Product Package o Project State.

# Collegamenti con altri Engine
Viewer, Scene Composer, Product Package Observation, EDI Observation futura.

# Conversazioni utilizzate
- RFC-1223 Focused Observation / Selection Awareness Foundation
