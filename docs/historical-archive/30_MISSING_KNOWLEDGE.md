# 30 - Missing Knowledge

## Scopo

Questo documento elenca conoscenza insufficiente o non certificabile dall'Historical Archive. Non e una lista di feature da implementare; e una mappa dei punti che richiedono verifica futura.

## Lacune critiche per verifica tecnica

### Stato reale del codice per milestone dichiarate

- Area: Viewer Recovery, Product Package, Collision, EDI V2.
- Problema: molte milestone sono descritte nei checkpoint, ma non sempre accompagnate da diff o codice.
- Impatto: la storia e coerente, ma non certifica il comportamento runtime.
- Documenti: [04_VIEWER_HISTORY.md](04_VIEWER_HISTORY.md), [11_VIEWER_RECOVERY_FOUNDATION.md](11_VIEWER_RECOVERY_FOUNDATION.md), [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md).

### Factory e validatori

- Area: Factory, Manufacturing Constraints, Constraint Engine, Smart Technical Validator.
- Problema: citati nella roadmap, ma poco documentati come implementazione.
- Impatto: copertura storica media-bassa.
- Documenti: [15_PRICING_FACTORY_HISTORY.md](15_PRICING_FACTORY_HISTORY.md), [29_ENGINE_COVERAGE_REPORT.md](29_ENGINE_COVERAGE_REPORT.md).

### Module Registry

- Area: Recognition / Imported Graph.
- Problema: concetto necessario e coerente, ma non documentato come engine implementato.
- Impatto: va mantenuto come concetto architetturale `Da verificare`.
- Documenti: [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md).

### Reasoning Bridge

- Area: EDI e Core.
- Problema: il ponte tra motori cognitivi EDI e dati tecnici BagaStudio e descritto come relazione, non come componente verificato.
- Impatto: utile per blueprint, ma non certificabile come implementazione.
- Documenti: [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md), [25_HISTORICAL_GLOSSARY.md](25_HISTORICAL_GLOSSARY.md).

## Lacune specifiche

| Area | Mancanza | Stato | Documento |
|---|---|---|---|
| Multilingua | Stato oltre topbar/dictionary base | Da verificare | [03](03_ROADMAP_EXTRACTED.md) |
| Texture online | Ricerca/aggiunta texture online | Da verificare | [05](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md), [12](12_IMPORT_INTELLIGENCE_HISTORY.md) |
| Product Package V2 | Metadata finali e bridge runtime | Da verificare | [14](14_PRODUCT_PACKAGE_HISTORY.md) |
| Auto Mapping Engine V2 | Implementazione successiva a CSV/CIX Matcher | Da verificare | [24](24_RFC_ORIGIN_MAP.md) |
| moduleCollisionNoticeV42 | Toast collisione modulo | Da verificare | [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md) |
| Empty Room Premium V32 | Stato reale ambiente premium | Da verificare | [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [08](08_RENDER_MATERIAL_TEXTURE_HISTORY.md) |
| EDI Render Engine V2 | Verifica runtime shader | Da verificare | [16](16_EDI_VISUAL_ENGINE_HISTORY.md) |
| Pricing formule | Regole matematiche e input prezzi | Incompleto | [15](15_PRICING_FACTORY_HISTORY.md) |
| BOM | Struttura distinta base finale | Incompleto | [15](15_PRICING_FACTORY_HISTORY.md) |
| Blueprint originale | Documento sorgente completo non presente nell'archive | Incompleto | [17](17_BAGASTUDIO_TIMELINE.md) |

## Conoscenza dedotta da pattern ricorrenti

Questi elementi sono coerenti e utili, ma devono restare classificati come dedotti:

- `Canvas First`: dedotto dal ruolo del Viewer come contratto stabile.
- `Compatibility First`: dedotto dalle regole conservative ripetute.
- `Imported Graph`: dedotto da Imported Model Hierarchy V1.
- `Module Registry`: dedotto dalla necessita di registrare moduli riconosciuti.
- `Reasoning Bridge`: dedotto dalla relazione tra EDI cognitivo e dati Core.

## Conoscenza non mancante

Sono sufficientemente preservati:

- evoluzione cronologica generale;
- decisioni principali;
- roadmap engine-driven;
- Viewer Recovery come fondazione;
- Product Package come ponte tra import e produzione;
- EDI Visual Engine V2 e decisione di non evolvere SVG;
- principi permanenti di sviluppo conservativo.

## Priorita futura di verifica

1. Verificare codice e commit reali per Viewer Recovery.
2. Verificare Product Package V2 e metadata runtime.
3. Verificare Collision/Join e `moduleCollisionNoticeV42`.
4. Verificare EDI Render Engine V2 runtime.
5. Ricostruire Factory/BOM/Pricing con dati tecnici piu puntuali.
