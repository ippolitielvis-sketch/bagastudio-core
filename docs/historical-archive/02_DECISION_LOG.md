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
