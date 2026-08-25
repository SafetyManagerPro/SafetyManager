# Step 68 — Catalogo rischi per settore ampliato

Data revisione: 05/08/2026

## Obiettivo

Ampliare le schede rischi disponibili nel progetto formativo usando fonti istituzionali e collegare il catalogo aggiornato a Gestione Progetto, Analisi dei fabbisogni, Progetto formativo, Scheda rischi, Fascicolo del corso e Centro Stampe.

Le schede non sostituiscono il DVR: sono una base informativa da verificare rispetto ad attività, mansioni, attrezzature, sostanze, luoghi, procedure e misure realmente presenti nell'azienda.

## Nuovi settori

1. Costruzioni, edilizia e cantieri — ATECO 41, 42, 43
2. Agricoltura, silvicoltura e pesca — ATECO 01, 02, 03
3. Metalmeccanica e lavorazioni dei metalli — ATECO 24, 25, 28, 29, 30, 33
4. Autoriparazione, carrozzerie e pneumatici — ATECO 45.2 / ATECO 2025 95.31 e 95.32
5. Commercio al dettaglio e all'ingrosso — ATECO 45.1, 45.3, 45.4, 46, 47
6. Trasporti, logistica e magazzinaggio — ATECO 49–53
7. Sanità e assistenza sociale — ATECO 86–88
8. Pulizie e sanificazione — ATECO 81.2
9. Raccolta rifiuti e igiene urbana — ATECO 38, 39
10. Legno, falegnameria e arredo — ATECO 16, 31
11. Industria alimentare e bevande — ATECO 10, 11
12. Lavanderie industriali e servizi tessili — ATECO 96.01 / 96.10
13. Istruzione, scuole e servizi educativi — ATECO 85

Il catalogo complessivo contiene 21 settori e 179 voci di rischio.

## Integrazioni applicate

- suggerimento automatico del settore in base ad ATECO e parole chiave aziendali;
- menu settori ordinato alfabeticamente, con la scheda personalizzata sempre in fondo;
- fonti ufficiali visibili sotto il menu del settore;
- fonte e versione del catalogo riportate nelle stampe;
- rischi dettagliati con esposizione, danni, comportamento sicuro e misure;
- compatibilità con i progetti già salvati e con i rischi personalizzati;
- controllo automatico di settori, fonti, identificativi duplicati e completezza minima;
- nessuna migration Supabase necessaria: i campi esistenti sono già compatibili.

## Moduli aggiornati

- `js/modules/fabbisogni_rischi.js`
- `js/modules/rischi_settori_step68.js`
- `modules/progetti.html`
- `modules/analisi_fabbisogni.html`
- `modules/progetto_formativo.html`
- `modules/scheda_rischi_settore.html`
- `modules/fascicolo_corso.html`
- `js/modules/collaudo.js`
- `index.html`

## Fonti principali

- INAIL, Profili di rischio di comparto
- INAIL, approfondimenti settoriali e materiali tecnici su rischi specifici
- ISTAT, Classificazione ATECO 2025

I riferimenti specifici del settore sono salvati nel catalogo e visualizzati nell'interfaccia. La corrispondenza ATECO automatica è un suggerimento e va confermata dall'operatore.

## Controlli eseguiti

- sintassi JavaScript dei file modificati e dei moduli di stampa: OK;
- integrità catalogo: OK;
- settori disponibili: 21;
- rischi disponibili: 179;
- nuovi settori richiesti presenti: 13/13;
- caricamento locale della webapp: OK;
- visualizzazione menu settori e link alle fonti: OK;
- errori JavaScript in console durante la prova: nessuno;
- warning noto: Tailwind caricato da CDN, già presente nella versione precedente e non modificato nello Step 68.

## Nota operativa

Per ogni progetto l'operatore deve confermare il settore proposto, deselezionare i rischi non pertinenti, aggiungere i rischi specifici ricavati dal DVR e verificare le misure effettive. Non è stata inserita una classificazione automatica del livello di rischio aziendale.
