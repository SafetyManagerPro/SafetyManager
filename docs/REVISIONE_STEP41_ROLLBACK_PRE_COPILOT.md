# Step 41 - Rollback pre revisioni Copilot

## Scopo
Questo pacchetto ripristina la versione stabile precedente alle revisioni tecniche consigliate da Copilot/GitHub.

## Base ripristinata
Base tecnica:

`Step 35 - Scheda ente formatore/erogatore e stampa A4 orizzontale`

## Cosa viene mantenuto
Sono mantenute tutte le funzioni fino allo Step 35, incluse:

- scheda cliente/committente PDF e XLS;
- scheda ente formatore/erogatore PDF e XLS;
- stampa schede in A4 orizzontale;
- Archivio Imprese / Enti con filtri e gruppi apribili/chiudibili;
- Anagrafica Docenti con azienda di appartenenza da menu aziende clienti;
- Progetti Attivi con grafica migliorata e stampa attestato individuale;
- filtri corsisti per azienda e corso;
- raccolta errori dashboard;
- stampa corso/corsisti da Archivio Corsi.

## Cosa viene rimosso rispetto agli step 36-40
Non sono presenti le revisioni Copilot successive:

- hardening Supabase dello Step 36;
- safety_env obbligatorio;
- CSP dello Step 38;
- service worker/cache forcing Step 38/40;
- package.json, tools audit, GitHub Actions Step 39;
- cache-busting forzato `?v=40`.

## Nota
Questa versione torna al comportamento precedente, con collegamento Supabase come prima delle revisioni Copilot.
