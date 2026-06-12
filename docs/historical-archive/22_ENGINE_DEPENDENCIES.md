# 22 - Engine Dependencies

Questo documento descrive dipendenze, input, output, motivi ed evoluzione degli Engine. Vedere anche [20_ENGINE_RELATIONSHIP_MAP.md](20_ENGINE_RELATIONSHIP_MAP.md) e [23_CROSS_REFERENCE_INDEX.md](23_CROSS_REFERENCE_INDEX.md).

## Viewer

- Dipendenze: Core, Import Intelligence, Selection, Scene Composer, EDI Overlay.
- Input: modelli importati, runtime components, configurazioni, eventi utente, camera state.
- Output: scena visiva, selezione, drag, viste, screenshot/fullscreen, stato validato per engine superiori.
- Motivi: e la superficie dove ogni regressione diventa visibile.
- Evoluzione: configuratore professionale -> dashboard premium -> Viewer Recovery -> UX Premium.
- Documenti: [04](04_VIEWER_HISTORY.md), [11](11_VIEWER_RECOVERY_FOUNDATION.md), [18](18_PERMANENT_DESIGN_PRINCIPLES.md).

## Import Intelligence

- Dipendenze: Viewer, loader 3D, pipeline asset.
- Input: STL/GLB/GLTF/OBJ/FBX/DAE/S3D e formati futuri citati.
- Output: modelli caricati, component list runtime, dati preparati per Product Package.
- Motivi: senza import affidabile non esistono configurazione, recognition o factory.
- Evoluzione: import multi-formato -> DAE Pipeline V2 -> S3D Runtime -> Product Package.
- Documenti: [05](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md), [12](12_IMPORT_INTELLIGENCE_HISTORY.md).

## Recognition

- Dipendenze: Import Intelligence, Product Package, Viewer Recovery.
- Input: runtime components, parentName, materialGroup, category, componentType, bounds, meshName.
- Output: Imported Graph, moduli, parti, associazioni semantiche.
- Motivi: il sistema deve riconoscere moduli dentro DAE importati.
- Evoluzione: component list -> Imported Model Hierarchy V1 -> Module Registry.
- Documenti: [13](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [24](24_RFC_ORIGIN_MAP.md).

## Imported Graph

- Dipendenze: Recognition, Import Intelligence.
- Input: parti importate e gruppi logici.
- Output: struttura Scene -> Imported Model -> Module -> Part.
- Motivi: creare una rappresentazione navigabile e non distruttiva del modello importato.
- Evoluzione: concetto emerso da Imported Model Hierarchy V1.
- Documenti: [13](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [25](25_HISTORICAL_GLOSSARY.md).

## Module Registry

- Dipendenze: Imported Graph, Product Package.
- Input: moduli riconosciuti, partId, metadata runtime.
- Output: elenco moduli selezionabili, configurabili, prezzabili e producibili.
- Motivi: il Viewer deve poter lavorare a livello modulo, non solo mesh.
- Evoluzione: Da verificare; implicato dalla gerarchia Imported Model -> Module -> Part.
- Documenti: [13](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [14](14_PRODUCT_PACKAGE_HISTORY.md).

## Selection

- Dipendenze: Viewer, Module Registry, Recognition.
- Input: click utente, runtime components, stato modello importato.
- Output: componente o modulo attivo, highlight, deselezione, selezione intero modello DAE.
- Motivi: ogni azione configurativa parte dalla selezione corretta.
- Evoluzione: selezione componente -> selezione modello DAE -> futura selezione modulo.
- Documenti: [04](04_VIEWER_HISTORY.md), [11](11_VIEWER_RECOVERY_FOUNDATION.md), [13](13_RECOGNITION_INTELLIGENCE_HISTORY.md).

## Product Package

- Dipendenze: Import Intelligence, Recognition, Viewer.
- Input: partId, categorie, metadata runtime, component list, mapping.
- Output: dati prodotto per materiali, BOM, pricing, factory e scene composer.
- Motivi: ponte tra geometria e produzione.
- Evoluzione: S3D Runtime -> Product Package V2 -> Auto Mapping Engine V2.
- Documenti: [14](14_PRODUCT_PACKAGE_HISTORY.md), [05](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md).

## Scene Composer

- Dipendenze: Viewer, Room Environment, Selection, Product Package, Collision, Join.
- Input: moduli, stanza, trasformazioni, collision status, join state.
- Output: scena composta, posizioni valide, relazioni tra moduli.
- Motivi: BagaStudio deve comporre ambienti, non solo prodotti isolati.
- Evoluzione: RoomEnvironment -> Empty Room Premium -> Collision/Join -> Multi Import Scene.
- Documenti: [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [17](17_BAGASTUDIO_TIMELINE.md).

## Collision

- Dipendenze: Scene Composer, Viewer, Module Registry.
- Input: trasformazioni candidate, bounds, stato precedente, moduli.
- Output: collision status, rollback, notice/toast collisione.
- Motivi: impedire attraversamento moduli e preservare scena coerente.
- Evoluzione: collisione modulo-modulo -> Collision V43 -> moduleCollisionNoticeV42.
- Documenti: [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md).

## Join Assistant

- Dipendenze: Collision, Scene Composer, Viewer UI.
- Input: prossimita o relazione tra moduli, separazione, collisione.
- Output: assistente trascinabile, posizione persistente, chiusura automatica.
- Motivi: rendere esplicita e gestibile la relazione tra moduli.
- Evoluzione: debug JOIN DIAGNOSTIC -> Join Assistant stabilizzato.
- Documenti: [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [25](25_HISTORICAL_GLOSSARY.md).

## Pricing

- Dipendenze: Product Package, BOM, materiali, configurazione.
- Input: componenti, materiali, €/mq, optional, dimensioni.
- Output: prezzo runtime e preventivo.
- Motivi: trasformare configurazione in valore commerciale.
- Evoluzione: pricing runtime -> Pricing Engine Recovery V1 -> materiali €/mq.
- Documenti: [15](15_PRICING_FACTORY_HISTORY.md).

## Factory

- Dipendenze: Product Package, BOM, Pricing, Constraint Engine.
- Input: distinta, materiali, componenti, vincoli produttivi.
- Output: dati produzione, validazioni, readiness tecnica.
- Motivi: portare BagaStudio da visualizzazione a produzione.
- Evoluzione: BOM -> Manufacturing Constraints -> Smart Technical Validator.
- Documenti: [15](15_PRICING_FACTORY_HISTORY.md).

## EDI

- Dipendenze: Core, Viewer Overlay, Home, Reasoning Bridge, Visual Engine.
- Input: stato progetto, knowledge, dipendenze, linguaggio naturale, memoria cognitiva.
- Output: analisi, suggerimenti, decisioni, planning, stati visuali.
- Motivi: rendere BagaStudio assistito e intelligente.
- Evoluzione: motori cognitivi -> Animated Core -> Render Engine V2.
- Documenti: [07](07_EDI_HISTORY.md), [16](16_EDI_VISUAL_ENGINE_HISTORY.md).

## Visual Engine

- Dipendenze: EDI, Shader Laboratory, Three.js pipeline.
- Input: stato EDI, shader mode, pass grafici.
- Output: sfera viva, shader, glow, particelle, stati visuali.
- Motivi: EDI deve essere entita visiva, non immagine statica.
- Evoluzione: SVG Prototype V1 -> EDI Render Engine V2 -> Shader Laboratory.
- Documenti: [16](16_EDI_VISUAL_ENGINE_HISTORY.md), [24](24_RFC_ORIGIN_MAP.md).

## Reasoning Bridge

- Dipendenze: EDI Cognitive Engines, Product Package, Scene Composer.
- Input: knowledge coverage, dependency graph, reasoning, memory, decision/planning.
- Output: suggerimenti e decisioni operative collegate al progetto.
- Motivi: collegare intelligenza EDI ai dati tecnici BagaStudio.
- Evoluzione: Da verificare; concetto derivato dai motori EDI validati e dalla necessita di collegare EDI al Core.
- Documenti: [07](07_EDI_HISTORY.md), [21](21_DECISION_TO_ENGINE_MATRIX.md).
