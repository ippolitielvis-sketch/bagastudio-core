# 10 - Transfer Pack New Account

## Cosa trasferire nel nuovo account
- Tutti i file Markdown in `docs/historical-archive/`.
- I JSON originali `conversations-000.json` ... `conversations-005.json` solo come fonte, non come documentazione finale.
- Questa sintesi come memoria permanente del progetto BagaStudio.

## Regole operative da portare avanti
- Lavorare in modo conservativo e merge-safe.
- Un modulo alla volta.
- Test reale obbligatorio prima del modulo successivo.
- Checkpoint Git dopo fase validata, ma non automatico se non richiesto.
- Non rimuovere funzioni esistenti.
- Non refactorare prima della validazione.
- Preferire file dedicati per nuove funzionalita.
- Nei report indicare file toccati, righe iniziali/finali quando rilevante, funzioni rimosse e test eseguiti.

## Stato mentale del progetto
BagaStudio non e solo un viewer: e una piattaforma di configurazione e produzione per arredo professionale, con import tecnico, product package, pricing/BOM/factory, scene composer, collisioni/join ed EDI come assistente intelligente.

## Prompt breve di ripresa
"Riprendiamo BagaStudio Core dallo storico in `docs/historical-archive`. Mantieni le regole permanenti: modifiche conservative, un modulo alla volta, test reale, nessuna funzione rimossa, nuove funzionalita in file dedicati quando possibile. Prima leggi `00_INDEX.md`, `01_EXECUTIVE_SUMMARY.md`, `02_DECISION_LOG.md` e `03_ROADMAP_EXTRACTED.md`."

## File creati
- `00_INDEX.md`
- `01_EXECUTIVE_SUMMARY.md`
- `02_DECISION_LOG.md`
- `03_ROADMAP_EXTRACTED.md`
- `04_VIEWER_HISTORY.md`
- `05_IMPORT_PRODUCT_PACKAGE_HISTORY.md`
- `06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md`
- `07_EDI_HISTORY.md`
- `08_RENDER_MATERIAL_TEXTURE_HISTORY.md`
- `09_MARKETING_PRODUCT_HISTORY.md`
- `10_TRANSFER_PACK_NEW_ACCOUNT.md`

## Report finale
- File letti: `conversations-000.json`, `conversations-001.json`, `conversations-002.json`, `conversations-003.json`, `conversations-004.json`, `conversations-005.json`
- Conversazioni analizzate: 508
- Conversazioni rilevanti: 66
- Rischi residui: alcune sintesi derivano da checkpoint narrati nelle conversazioni, non da verifica diretta del codice; classificazione dell'indice completa ma euristica.
