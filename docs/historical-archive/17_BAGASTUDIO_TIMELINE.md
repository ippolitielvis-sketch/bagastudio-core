# 17 - BagaStudio Timeline

## Milestone - 2026-05-12 Configuratore professionale

# Contesto
Ripresa del configuratore professionale con architettura JSON-driven, selezione parti, multiselezione, varianti dimensionali, accessori, viste, render premium, preventivo, BOM e assembly.

# Problema
Il modello esploso e la scala non erano stabili.

# Decisione
Correggere normalizzazione e scala prima di nuove feature.

# Motivazione
La stabilita del Viewer viene prima dell'espansione funzionale.

# Implementazione
Da verificare. Fix proposto su `baseModelScale` dopo normalizzazione.

# Evoluzione
Introduce disciplina tecnica sul Viewer.

# Impatto
Avvia Viewer Foundation.

# Regole permanenti nate
Prima loader/scala, poi feature.

# Collegamenti con altri Engine
Viewer, Import.

# Conversazioni utilizzate
- `Ripristino configuratore professionale` (`conversations-003.json`)

## Milestone - 2026-05-14/15 BagaStudio Core

# Contesto
BagaStudio viene distinto da Libreria Morini e definito asset software proprietario.

# Problema
Serviva separare business, progetto software e framework operativo.

# Decisione
BagaStudio Core diventa engine universale multi-prodotto.

# Motivazione
Vincolo etico e strategico; costruzione asset non in conflitto.

# Implementazione
Da verificare.

# Evoluzione
Nasce roadmap import multi-formato, materiali per pezzo, LED, configurazione cliente e BOM.

# Impatto
BagaStudio diventa progetto SaaS/factory-ready.

# Regole permanenti nate
Separazione ecosistemi.

# Collegamenti con altri Engine
Tutti.

# Conversazioni utilizzate
- `BagaStudio Core V1` (`conversations-003.json`)
- `Riprendere BagaStudio Core` (`conversations-003.json`)

## Milestone - 2026-05-26/29 Dashboard, Import e Product Package

# Contesto
Dashboard premium, multilingua, DAE, S3D Product Package e Auto Mapping emergono in sequenza.

# Problema
Il Viewer doveva diventare prodotto usabile e il modello importato dato tecnico.

# Decisione
Procedere con UI premium conservativa, Importer Pipeline V2, Product Package V2 e Auto Mapping Engine V2.

# Motivazione
Serve ponte tra esperienza utente, geometria e produzione.

# Implementazione
Da verificare. Citati toolbar, analyzer, DAE importer, component list, CSV/CIX Matcher 80/80.

# Evoluzione
Porta a Knowledge Base, validators e refactor modulare.

# Impatto
Il Core entra nella fase engine-driven.

# Regole permanenti nate
Modifiche chirurgiche, nessuna funzione rimossa, checkpoint Git.

# Collegamenti con altri Engine
Viewer, Import, Product Package, Pricing.

# Conversazioni utilizzate
- `Modifiche Dashboard Premium` (`conversations-004.json`)
- `Multilingua BagaStudio` (`conversations-004.json`)
- `Importer Pipeline V2 DAE` (`conversations-004.json`)
- `Aggiornamento S3D Product Package` (`conversations-004.json`)
- `BagaStudio Core V2` (`conversations-004.json`)

## Milestone - 2026-06-01/05 Recovery, Room e Scene Composer

# Contesto
Recovery DAE/Viewer, UX, salvataggio progetto, pricing/BOM, ambiente stanza e Scene Composer Foundation si intrecciano.

# Problema
Prima di scene complesse servono Viewer stabile, stanza credibile, materiali ambiente, pricing e flusso operativo.

# Decisione
Validare Recovery, poi Viewer UX, RoomEnvironment e roadmap Scene Composer.

# Motivazione
Stabilita prima di espansione.

# Implementazione
Da verificare. Citati RoomEnvironment, Room Materials V1, Room Textures V1, Ground Alignment, Viewer Pad e Texture Quality.

# Evoluzione
Porta a Collision Engine, Join Assistant e Imported Model Hierarchy.

# Impatto
BagaStudio diventa ambiente di composizione.

# Regole permanenti nate
Test reale, niente refactor prima della validazione, step isolati.

# Collegamenti con altri Engine
Viewer, Room, Pricing, Scene Composer.

# Conversazioni utilizzate
- `Ripresa Viewer UX` (`conversations-004.json`)
- `Roadmap e Task sviluppo` (`conversations-004.json`)
- `Configurazione Ambiente V1` (`conversations-004.json`)
- `Prossimi passi V32` (`conversations-004.json`)
- `Aggiornamenti BagaStudio Core` (`conversations-004.json`)

## Milestone - 2026-06-08/09 Blueprint, Collisioni, Join e Hierarchy

# Contesto
Master Blueprint, roadmap reale post Blueprint, Showroom Premium, collisioni e Imported Model Hierarchy convergono.

# Problema
La scena deve gestire collisioni, join, rollback, toast, camera stabile e riconoscimento moduli DAE.

# Decisione
Stabilizzare collisioni/join e preparare gerarchia non distruttiva Imported Model -> Module -> Part.

# Motivazione
Scene Composer richiede dati semantici e motore spaziale affidabile.

# Implementazione
Da verificare. Citati Collision V43, Join Assistant, moduleCollisionNoticeV42, commit recovery e funzione pura per gerarchia.

# Evoluzione
Prepara selezione modulo, materiali modulo, BOM modulo e Multi Import Scene.

# Impatto
BagaStudio entra nella fase compositore intelligente.

# Regole permanenti nate
Non cambiare UI/camera/drag/import se si aggiunge solo data shape.

# Collegamenti con altri Engine
Viewer, Import, Recognition, Product Package, Scene Composer.

# Conversazioni utilizzate
- `Master Blueprint Blocco 63` (`conversations-004.json`)
- `Roadmap BagaStudio Core` (`conversations-004.json`)
- `Bug Fix Showroom Premium` (`conversations-004.json`)
- `Fix trasformazione modulo` (`conversations-004.json`)
- `Stabilizzazione motore collisione` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - 2026-06-10 EDI Animated Core e Shader Laboratory

# Contesto
EDI passa da overlay/launcher a entita viva e poi a Render Engine V2 GPU.

# Problema
SVG e launcher statico non bastano.

# Decisione
Creare EdiAnimatedCoreV1 e poi continuare solo su EDI Render Engine V2.

# Motivazione
Serve motore visuale dedicato, modulare, isolato e scalabile.

# Implementazione
Da verificare. Citati RFC-1001/1002/1003/1004/1005, RFC-1100, RFC-1101, RFC-1102.

# Evoluzione
Roadmap shader: Heart, Plasma, Magnetic, Particles, Glow, Thought/Speaking Pulse.

# Impatto
EDI diventa engine tecnico parallelo al Core.

# Regole permanenti nate
Non contaminare Viewer/Home/Launcher; una RFC alla volta.

# Collegamenti con altri Engine
EDI Cognitive, Visual State, Shader Laboratory.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)
