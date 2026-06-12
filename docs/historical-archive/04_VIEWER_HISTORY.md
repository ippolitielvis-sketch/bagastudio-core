# 04 - Viewer History

## Milestone - Configuratore professionale e normalizzazione modello

# Contesto
Il Viewer nasce nel configuratore professionale JSON-driven, con modelli, materiali, texture, dimensioni, accessori, viste, pricing e BOM.

# Problema
Il modello esploso veniva scalato male: la scala base veniva salvata prima della normalizzazione reale.

# Decisione
Correggere la sequenza di normalizzazione e salvare la scala base dopo il calcolo corretto.

# Motivazione
Un modello esploso ha pivot e geometrie distribuite; una scala sbagliata rompe vista, selezione e composizione.

# Implementazione
Da verificare. La conversazione propone uso di `Box3`, `maxDim`, `normalizedScale` e salvataggio successivo di `baseModelScale`.

# Evoluzione
Nasce il principio: stabilizzare caricamento e trasformazioni prima di aggiungere funzioni.

# Impatto
Il Viewer viene trattato come motore tecnico, non canvas decorativo.

# Regole permanenti nate
Non usare rotazioni automatiche instabili; preferire preset reali; controllare bounding box.

# Collegamenti con altri Engine
Import, Transform, Collision.

# Conversazioni utilizzate
- `Ripristino configuratore professionale` (`conversations-003.json`)

## Milestone - Selezione componente, materiali e LED

# Contesto
Il checkpoint stabile cita highlight blu, deselezione su click vuoto, nomi leggibili cliente, viste da JSON, export/import config, pricing runtime, materiali persistenti per pezzo, LED e Kelvin per componente.

# Problema
BagaStudio doveva lavorare su parti singole, non su modello unico.

# Decisione
Rendere selezionabili i componenti e applicare materiali/LED/temperatura per parte.

# Motivazione
Un configuratore professionale deve rappresentare scelte tecniche reali del prodotto.

# Implementazione
Da verificare. La conversazione LED mostra anche un errore storico: una barra LED finta nel modello poteva confondere il LED runtime.

# Evoluzione
Il Viewer spinge verso Product Package e componenti runtime.

# Impatto
Ogni mesh deve poter diventare parte con identita e stato.

# Regole permanenti nate
Distinguere asset modellato da comportamento runtime; non correggere a caso senza individuare il blocco reale.

# Collegamenti con altri Engine
Product Package, Material Engine, Pricing Runtime.

# Conversazioni utilizzate
- `Riprendiamo BagaStudio LED` (`conversations-003.json`)
- `Riprendiamo BagaStudio Core` (`conversations-003.json`)

## Milestone - Dashboard Premium e workflow

# Contesto
La dashboard premium introduce topbar, prezzo hero, tab Config/Materiali/Accessori/Viste, admin, backup, autosave e viewer piu grande.

# Problema
Le funzioni stavano crescendo senza organizzazione SaaS definitiva.

# Decisione
Spostare funzioni operative nella topbar, pulire sidebar duplicata e rifinire UI premium senza perdere funzioni.

# Motivazione
Un prodotto professionale deve essere compatto, leggibile e operativo.

# Implementazione
Da verificare. Stato dichiarato: dashboard premium parzialmente applicata.

# Evoluzione
Il flusso diventa CARICA / CONFIGURA / SALVA / PRODUCI / AIUTO.

# Impatto
La UX diventa milestone tecnica.

# Regole permanenti nate
Niente rewrite completo; modifiche precise e merge-safe.

# Collegamenti con altri Engine
Project Save/Open, Pricing, Admin Panel, EDI launcher.

# Conversazioni utilizzate
- `Modifiche Dashboard Premium` (`conversations-004.json`)
- `Ripresa BagaStudio Core - A2.5 Salva/Apri progetto` (`conversations-004.json`)

## Milestone - Viewer Recovery Foundation

# Contesto
La fase Recovery DAE/Viewer nasce da import incompleti, pezzi non corretti, camera instabile e necessita di ripartire da un checkpoint.

# Problema
DAE, camera, drag e selezione dovevano essere affidabili prima di procedere.

# Decisione
Validare Viewer Recovery e solo dopo procedere con Viewer UX Premium Finale e Imported Model Hierarchy.

# Motivazione
Il Viewer e prerequisito per ogni engine successivo.

# Implementazione
Da verificare. Checkpoint dichiarato: camera non torna in vista 3D, vista corrente mantenuta, drag DAE funzionante, rotazione DAE con clamp stanza, selezione intero modello, drag moduli parametrici invariato, Join Assistant/Collision V43 preservati.

# Evoluzione
Recovery diventa base per data shape DAE non distruttivo.

# Impatto
Il Viewer diventa contratto stabile.

# Regole permanenti nate
Non modificare camera, import, drag, selezione, collisioni o join quando lo step non li riguarda.

# Collegamenti con altri Engine
Import Intelligence, Recognition, Collision, Join.

# Conversazioni utilizzate
- `Ripresa BagaStudio Core - Recovery DAE/Viewer` (`conversations-004.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)
