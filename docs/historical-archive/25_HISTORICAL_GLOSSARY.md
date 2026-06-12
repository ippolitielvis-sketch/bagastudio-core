# 25 - Historical Glossary

Glossario unico dei termini storici e architetturali di BagaStudio Core. I link puntano ai documenti dove il concetto viene definito o usato come milestone.

## Product Package
Pacchetto dati che trasforma un asset importato in prodotto tecnico: partId, categorie, metadata runtime, bridge Viewer/configuratore e preparazione produzione. Vedi [14_PRODUCT_PACKAGE_HISTORY.md](14_PRODUCT_PACKAGE_HISTORY.md), [05_IMPORT_PRODUCT_PACKAGE_HISTORY.md](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md).

## Imported Graph
Rappresentazione semantica del modello importato. Deriva da Imported Model Hierarchy V1 e organizza Scene -> Imported Model -> Module -> Part. Vedi [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md).

## Recognition
Engine che riconosce moduli e parti dentro un DAE importato usando segnali come parentName, materialGroup, category, componentType, bounds e meshName. Vedi [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md).

## Canvas First
Principio implicito: il Viewer/Canvas e il luogo di verita operativa. Qualsiasi engine deve preservare camera, vista, drag, selezione e import. Vedi [04_VIEWER_HISTORY.md](04_VIEWER_HISTORY.md), [11_VIEWER_RECOVERY_FOUNDATION.md](11_VIEWER_RECOVERY_FOUNDATION.md).

## Compatibility First
Principio permanente: prima preservare funzioni esistenti, poi espandere. Coincide con modifiche conservative, test reale e nessuna funzione rimossa. Vedi [18_PERMANENT_DESIGN_PRINCIPLES.md](18_PERMANENT_DESIGN_PRINCIPLES.md).

## Merge Safe
Regola operativa: modifiche precise, chirurgiche, senza rewrite completi e con rischio minimo di conflitto. Vedi [02_DECISION_LOG.md](02_DECISION_LOG.md), [18_PERMANENT_DESIGN_PRINCIPLES.md](18_PERMANENT_DESIGN_PRINCIPLES.md).

## Viewer Recovery
Fondazione creata per stabilizzare camera, drag DAE, vista corrente, selezione modello e import prima di feature nuove. Vedi [11_VIEWER_RECOVERY_FOUNDATION.md](11_VIEWER_RECOVERY_FOUNDATION.md).

## Join Assistant
Interfaccia di relazione tra moduli: posizione persistente, drag, auto-close quando i moduli si separano e integrazione con collisioni. Vedi [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md).

## Collision V43
Milestone citata nella fase di stabilizzazione collisioni: preserva collisioni, Join Assistant e camera. Stato implementativo completo: Da verificare. Vedi [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md).

## moduleCollisionNoticeV42
Toast/notice dedicato alla collisione modulo. Il suo stato finale e indicato come area da verificare. Vedi [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [19_PHASE2_REPORT.md](19_PHASE2_REPORT.md).

## Imported Model Hierarchy V1
Data shape non distruttivo per rappresentare Scene -> Imported Model -> Module -> Part. Vedi [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [24_RFC_ORIGIN_MAP.md](24_RFC_ORIGIN_MAP.md).

## Module Registry
Registro implicito dei moduli riconosciuti. Deriva da Imported Graph e Product Package. Stato implementativo: Da verificare. Vedi [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md).

## Selection
Sistema di selezione componente/modello/modulo. Evoluzione storica: highlight blu, deselezione su click vuoto, selezione intero DAE, futura selezione modulo. Vedi [04_VIEWER_HISTORY.md](04_VIEWER_HISTORY.md), [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md).

## Scene Composer
Engine di composizione ambienti e moduli. Nasce da RoomEnvironment, Empty Room, collisioni e join. Vedi [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md).

## RoomEnvironment
Fondazione ambiente: stanza, materiali stanza, texture pareti/pavimento, vista, profondita e realismo showroom. Vedi [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [08_RENDER_MATERIAL_TEXTURE_HISTORY.md](08_RENDER_MATERIAL_TEXTURE_HISTORY.md).

## Pricing Engine
Engine che trasforma configurazione, materiali e dimensioni in prezzo runtime/preventivo. Vedi [15_PRICING_FACTORY_HISTORY.md](15_PRICING_FACTORY_HISTORY.md).

## BOM
Distinta base tecnica. Collegata a Product Package, componenti runtime e Factory. Vedi [15_PRICING_FACTORY_HISTORY.md](15_PRICING_FACTORY_HISTORY.md).

## Factory
Direzione produttiva del Core: manufacturing constraints, validator, BOM e output produzione. Vedi [15_PRICING_FACTORY_HISTORY.md](15_PRICING_FACTORY_HISTORY.md).

## EDI
Assistente intelligente di BagaStudio con motori cognitivi, overlay separato dal Canvas, presenza Home/Viewer e visual engine dedicato. Vedi [07_EDI_HISTORY.md](07_EDI_HISTORY.md).

## EDI Visual Prototype V1
Renderer SVG originale. Decisione finale: non evolverlo piu; resta prototipo. Vedi [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md).

## EDI Render Engine V2
Motore grafico GPU dedicato a EDI, con ShaderMaterial, WebGLRenderer, EffectComposer, UnrealBloomPass e Shader Laboratory. Vedi [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md).

## Shader Laboratory
RFC-1102. Laboratorio preview per testare pipeline GPU EDI V2 e futuri shader. Vedi [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md), [24_RFC_ORIGIN_MAP.md](24_RFC_ORIGIN_MAP.md).

## Reasoning Bridge
Ponte concettuale tra motori cognitivi EDI e dati tecnici BagaStudio. Stato implementativo: Da verificare. Vedi [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md), [07_EDI_HISTORY.md](07_EDI_HISTORY.md).

## Step Fantasma
Step tecnico che aggiunge dati/fondamenta senza cambiare UI o comportamento. Usato per Imported Model Hierarchy V1. Vedi [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [18_PERMANENT_DESIGN_PRINCIPLES.md](18_PERMANENT_DESIGN_PRINCIPLES.md).

## Da verificare
Marcatura obbligatoria quando una decisione o implementazione e citata nei checkpoint ma non confermata direttamente nel codice o da evidenza completa. Vedi [19_PHASE2_REPORT.md](19_PHASE2_REPORT.md).
