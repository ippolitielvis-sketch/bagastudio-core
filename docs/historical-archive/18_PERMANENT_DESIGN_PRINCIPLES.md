# 18 - Permanent Design Principles

## Milestone - Conservazione prima dell'espansione

# Contesto
Il progetto cresce con molte patch su file grandi e funzioni interdipendenti.

# Problema
Ogni nuova feature puo rompere funzioni gia validate.

# Decisione
Ogni modifica deve essere conservativa, chirurgica e verificabile.

# Motivazione
Il valore del progetto sta nella continuita tecnica accumulata.

# Implementazione
Prompt ricorrenti richiedono nessun refactor, funzioni rimosse = 0, file dedicati, report finale e test.

# Evoluzione
Il principio si rafforza in Recovery, Collision ed EDI Render Engine V2.

# Impatto
BagaStudio assume governance da Master Blueprint.

# Regole permanenti nate
Un modulo alla volta; test reale; checkpoint Git; nessuna funzione rimossa.

# Collegamenti con altri Engine
Tutti.

# Conversazioni utilizzate
- `Modifiche Dashboard Premium` (`conversations-004.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)

## Milestone - Viewer stabile come contratto

# Contesto
Tutti gli engine si appoggiano al Viewer.

# Problema
Camera, drag, selezione, import e collisioni sono fragili se alterati da patch non correlate.

# Decisione
Il Viewer e un contratto: le feature devono agganciarsi senza alterare invarianti validati.

# Motivazione
L'utente testa valore e regressioni nel Viewer.

# Implementazione
Vincoli espliciti: non modificare camera, drag DAE, selezione, import, collisioni, join.

# Evoluzione
Recovery produce branch e checkpoint dedicati.

# Impatto
Ogni engine deve dichiarare cosa non tocca.

# Regole permanenti nate
Preservare camera/vista, drag e import reale.

# Collegamenti con altri Engine
Import, Recognition, Collision, EDI overlay.

# Conversazioni utilizzate
- `Ripresa BagaStudio Core - Recovery DAE/Viewer` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - Dati prima della UI

# Contesto
Imported Model Hierarchy V1 viene progettato come step fantasma.

# Problema
Muovere o configurare moduli DAE senza gerarchia dati rischia regressioni.

# Decisione
Prima aggiungere data shape non distruttivo, poi usarlo nella UI.

# Motivazione
Una gerarchia corretta riduce bug futuri.

# Implementazione
Tipi, campi opzionali e funzione pura di grouping; nessun cambio UI.

# Evoluzione
Il principio vale per Recognition, Product Package e Factory.

# Impatto
La UI diventa consumatore di dati validati.

# Regole permanenti nate
Step fantasma; dati opzionali; fallback conservativo; nessun cambiamento comportamentale non richiesto.

# Collegamenti con altri Engine
Recognition, Product Package, Pricing/BOM.

# Conversazioni utilizzate
- `BagaStudio Core Step 1` (`conversations-004.json`)

## Milestone - Separazione degli Engine

# Contesto
EDI Render Engine V2 e refactor modulare mostrano la necessita di isolare domini.

# Problema
Un unico file o engine contaminato diventa difficile da mantenere.

# Decisione
Nuove funzionalita in file dedicati; EDI V2 isolato da Viewer/Home/Launcher; SVG lasciato prototipo.

# Motivazione
Isolamento significa evoluzione piu rapida e rischio minore.

# Implementazione
Da verificare. RFC separate, cartelle dedicate e pipeline pass modulari.

# Evoluzione
Il principio diventa base per Shader Laboratory e future RFC.

# Impatto
BagaStudio assume architettura a engine.

# Regole permanenti nate
Una RFC alla volta; niente contaminazione; file dedicati.

# Collegamenti con altri Engine
EDI, Viewer, Import, Scene Composer.

# Conversazioni utilizzate
- `Refactor BagaStudio V1.9` (`conversations-004.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)
