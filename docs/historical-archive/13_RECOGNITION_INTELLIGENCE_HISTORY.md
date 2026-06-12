# 13 - Recognition Intelligence History

## Milestone - Imported Model Hierarchy V1

# Contesto
Dopo Viewer Recovery e Product Package, BagaStudio deve riconoscere automaticamente moduli dentro DAE importati: cassettiera, reception, colonna, banco, specchi e altri elementi.

# Problema
Un DAE contiene mesh. Senza gerarchia, il software non sa cosa e modulo, cosa e parte e cosa puo ricevere materiali, collisioni, join, BOM o pricing.

# Decisione
Introdurre gerarchia non distruttiva: Scene -> Imported Model -> Module -> Part.

# Motivazione
La gerarchia serve per selezione modulo, movimento modulo, materiali modulo, collisioni modulo, join modulo, BOM modulo, preventivo modulo e Multi Import Scene.

# Implementazione
Da verificare. Prompt richiesto: tipo `ImportedModelModuleV1`, campi opzionali su `BagaStudioRuntimeComponent` e funzione pura `buildImportedModelModulesV1`. Algoritmo V1: parentName, poi category + materialGroup + componentType, poi fallback conservativo.

# Evoluzione
Il primo step deve essere fantasma: prepara dati ma il Viewer deve comportarsi identico.

# Impatto
Recognition Intelligence trasforma import tecnico in struttura semantica.

# Regole permanenti nate
- Non cambiare UI.
- Non cambiare drag DAE.
- Non cambiare camera.
- Non cambiare import.
- Non toccare `app/page.tsx` o `config.state.ts`.
- Funzioni rimosse = 0.

# Collegamenti con altri Engine
Import Intelligence, Product Package, Collision, Join, BOM, Pricing, Scene Composer.

# Conversazioni utilizzate
- `BagaStudio Core Step 1` (`conversations-004.json`)
