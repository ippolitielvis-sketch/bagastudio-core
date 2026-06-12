# 15 - Pricing Factory History

## Milestone - Pricing, BOM e Factory Foundation

# Contesto
Pricing e BOM compaiono nel configuratore professionale e diventano roadmap esplicita quando Product Package e componenti runtime iniziano a consolidarsi.

# Problema
Configurare un prodotto senza prezzo, distinta base e vincoli produttivi non basta per BagaStudio Core.

# Decisione
Integrare Pricing Engine, BOM V2.2, pricing materiali €/mq, Manufacturing Constraints, Constraint Engine e Smart Technical Validator.

# Motivazione
L'obiettivo non e solo visualizzare: e produrre un output commerciale e tecnico affidabile.

# Implementazione
Da verificare. Conversazioni citano Pricing Engine Recovery V1 validato, BOM V2.2, pricing materiali €/mq, Hardware Analyzer V1, Manufacturing Constraints V1, Constraint Engine V1 e Smart Technical Validator V1.

# Evoluzione
Il flusso CARICA / CONFIGURA / SALVA / PRODUCI / AIUTO collega Pricing/Factory alla UX.

# Impatto
BagaStudio assume direzione CPQ/factory-ready.

# Regole permanenti nate
- Pricing e BOM devono seguire dati runtime affidabili.
- Non anticipare Factory se Viewer/Product Package non sono stabili.

# Collegamenti con altri Engine
Product Package, Recognition, Viewer, Configura V2.1, Knowledge Base, Technical Validator.

# Conversazioni utilizzate
- `Ripristino configuratore professionale` (`conversations-003.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `Roadmap e Task sviluppo` (`conversations-004.json`)
- `Configurazione Ambiente V1` (`conversations-004.json`)
- `Knowledge Base V1.1` (`conversations-004.json`)
