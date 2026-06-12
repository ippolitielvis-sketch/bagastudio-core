# 03 - Roadmap Extracted

La roadmap viene ricostruita come sequenza evolutiva, non come lista di feature.

## Milestone - Core universale

# Contesto
BagaStudio nasce come configuratore professionale JSON-driven e poi viene separato da Libreria Morini.

# Problema
Il prototipo verticale non bastava per un prodotto proprietario scalabile.

# Decisione
Evolvere verso BagaStudio Core, engine universale multi-prodotto.

# Motivazione
Costruire un asset software non in conflitto con il settore lavorativo corrente.

# Implementazione
Da verificare. Roadmap citata: import multi-formato, split parti, naming wizard, thumbnails, BOM mapping, materiali per componente, LED, Kelvin, salvataggio configurazione.

# Evoluzione
Il Core genera roadmap Viewer, Import, Product Package, Pricing, Scene Composer, Factory ed EDI.

# Impatto
Il progetto diventa piattaforma, non semplice demo.

# Regole permanenti nate
Separazione ecosistemi e progettazione engine-first.

# Collegamenti con altri Engine
Tutti.

# Conversazioni utilizzate
- `BagaStudio Core V1` (`conversations-003.json`)
- `Riprendere BagaStudio Core` (`conversations-003.json`)

## Milestone - Viewer UX e workflow operativo

# Contesto
La dashboard premium introduce topbar, prezzo hero, tab Config/Materiali/Accessori/Viste e viewer piu grande.

# Problema
L'interfaccia rischiava accumulo di funzioni senza flusso chiaro.

# Decisione
Roadmap: Viewer UX Premium Finale, poi Salva/Apri progetto, poi Scene Composer V1, Modular Merge Engine e Adaptive Geometry Engine.

# Motivazione
Prima rendere il sistema usabile e stabile; poi aggiungere automazioni avanzate.

# Implementazione
Da verificare. Flusso citato: CARICA / CONFIGURA / SALVA / PRODUCI / AIUTO.

# Evoluzione
La UX diventa ponte tra cliente, operatore e produzione.

# Impatto
Il Viewer diventa superficie primaria del prodotto.

# Regole permanenti nate
Cleanup solo dopo stabilita; nessuna funzione persa.

# Collegamenti con altri Engine
Viewer, Pricing/BOM, Project Save/Open, EDI launcher.

# Conversazioni utilizzate
- `Modifiche Dashboard Premium` (`conversations-004.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `Ripresa BagaStudio Core - A2.5 Salva/Apri progetto` (`conversations-004.json`)

## Milestone - Product Package e produzione

# Contesto
DAE/S3D portano geometrie nel Viewer, ma serve convertirle in dati tecnici.

# Problema
Senza metadata e mapping non esistono BOM, pricing, factory o riconoscimento modulo.

# Decisione
Introdurre Product Package V2, Auto Mapping Engine V2, Hardware Analyzer, Manufacturing Constraints, Constraint Engine, Knowledge Base e Smart Technical Validator.

# Motivazione
Collegare configurazione visuale a produzione reale.

# Implementazione
Da verificare. Le conversazioni citano S3D Runtime, analyzer, DAE importer, component list, CSV/CIX Matcher 80/80.

# Evoluzione
La roadmap arriva a Imported Model Hierarchy V1.

# Impatto
BagaStudio assume direzione CPQ/factory-ready.

# Regole permanenti nate
Ogni parte visuale deve diventare dato tecnico.

# Collegamenti con altri Engine
Import, Recognition, Pricing/BOM, Factory, Viewer.

# Conversazioni utilizzate
- `Aggiornamento S3D Product Package` (`conversations-004.json`)
- `BagaStudio Core V2` (`conversations-004.json`)
- `Knowledge Base V1.1` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - Scene Composer

# Contesto
RoomEnvironment, Empty Room, collisioni e Join Assistant convergono verso composizione di scena.

# Problema
Il sistema deve gestire relazioni spaziali: stanza, pareti, pavimenti, moduli, DAE, collisioni e join.

# Decisione
Costruire Collision Engine/Join Assistant come fondazione di Scene Composer.

# Motivazione
La composizione reale richiede vincoli spaziali e feedback utente, non solo rendering.

# Implementazione
Da verificare. Sono citati Collision V43, Join Assistant, rollback, toast collisione e moduleCollisionNoticeV42.

# Evoluzione
Scene Composer si collega alla gerarchia Imported Model -> Module -> Part.

# Impatto
BagaStudio diventa compositore intelligente di ambienti.

# Regole permanenti nate
Non toccare camera, Join Assistant o collisioni validate in patch non correlate.

# Collegamenti con altri Engine
Viewer, Room, Recognition, Product Package.

# Conversazioni utilizzate
- `Configurazione Ambiente V1` (`conversations-004.json`)
- `Prossimi passi V32` (`conversations-004.json`)
- `Fix trasformazione modulo` (`conversations-004.json`)
- `Stabilizzazione motore collisione` (`conversations-004.json`)

## Milestone - EDI e Render Engine V2

# Contesto
EDI parte da motori cognitivi validati e poi richiede rappresentazione visuale viva.

# Problema
SVG e launcher statico non bastano.

# Decisione
Creare EdiAnimatedCoreV1 e poi sviluppare solo EDI Render Engine V2, lasciando SVG come prototipo.

# Motivazione
EDI deve avere pipeline grafica GPU scalabile e isolata.

# Implementazione
Da verificare. RFC citate: 1001, 1002, 1003, 1004, 1005, 1100, 1101, 1102.

# Evoluzione
Roadmap shader: Heart, Plasma, Magnetic Distortion, Particle Physics, Volumetric Glow, Thought Pulse, Speaking Pulse.

# Impatto
EDI diventa engine autonomo dentro il Master Blueprint.

# Regole permanenti nate
Una RFC alla volta; non contaminare Viewer/Home/Launcher.

# Collegamenti con altri Engine
EDI Cognitive, Viewer overlay, Shader Laboratory.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)
