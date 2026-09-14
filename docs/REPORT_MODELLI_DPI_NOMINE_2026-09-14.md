# SafetyManagerPro — Modelli DPI, nomine e incarichi

Data: 2026-09-14

## Punto di ripristino

Prima di introdurre i nuovi modelli è stata conservata l'ultima versione funzionante:

- commit: `bc942ee7837b93ee9e2bb2d34ae15b5814eb4a33`
- branch: `backup-working-2026-09-14`
- branch aggiuntivo: `backup-working-2026-09-14-modelli`

Se la nuova funzione provoca regressioni, il riferimento da ripristinare è il commit indicato sopra.

## Fonti e modelli consultati

- INAIL — fac-simile / scheda di consegna DPI al lavoratore: struttura con lavoratore, mansione, elenco DPI, modello, uso e firme; indicazioni sulla cura, sul divieto di modifica e sulla segnalazione dei difetti.
- INAIL — verbale di consegna DPI: struttura con tipo di DPI e rischi da cui proteggono.
- Normattiva — D.Lgs. 81/2008, art. 18: designazione addetti emergenze, individuazione preposti, affidamento dei compiti in funzione di capacità e condizioni, fornitura DPI.
- Normattiva — D.Lgs. 81/2008, art. 19: obblighi del preposto.
- Normattiva — D.Lgs. 81/2008, art. 20: obblighi dei lavoratori e corretto utilizzo dei DPI.
- Normattiva — D.Lgs. 81/2008, art. 34: svolgimento diretto da parte del datore di lavoro nei casi e limiti previsti.
- Ministero dell'Ambiente — fac-simile di lettera di incarico al preposto.
- Ministero del Lavoro — obblighi del datore di lavoro e designazione degli addetti alle emergenze.

## Scelte progettuali

La formazione non viene trattata automaticamente come una nomina. Il software distingue:

- **designazione / individuazione** per ruoli per cui la normativa prevede una formale individuazione/designazione (es. preposto, primo soccorso, antincendio/emergenza);
- **incarico / autorizzazione interna** per attività o attrezzature per cui la formazione è uno dei requisiti ma non coincide da sola con una nomina;
- **dichiarazione del datore di lavoro** per lo svolgimento diretto di compiti consentiti dall'art. 34, da utilizzare solo previa verifica delle condizioni applicabili al caso concreto.

## Modelli introdotti

1. Verbale individuale consegna DPI.
2. Registro aziendale consegna DPI, con righe per i lavoratori e spazio firma.
3. Lettera di designazione / incarico per:
   - preposto;
   - addetto primo soccorso;
   - addetto antincendio / evacuazione;
   - utilizzo attrezzature;
   - lavori in quota / DPI III categoria;
   - ambienti confinati;
   - incarico operativo generico.
4. Dichiarazione del Datore di Lavoro per:
   - svolgimento diretto dei compiti SPP/RSPP nei casi consentiti;
   - primo soccorso nei casi consentiti;
   - antincendio / evacuazione nei casi consentiti.

## Dati usati

Per i documenti individuali, SafetyManager usa:

- dati del lavoratore/corsista;
- mansione storica associata all'iscrizione;
- dati dell'azienda di appartenenza del lavoratore, se disponibili nell'anagrafica;
- in fallback, azienda committente del progetto;
- corso, codice progetto e date come riferimento formativo.

Nel registro DPI con lavoratori di più aziende, i lavoratori vengono raggruppati per azienda e viene prodotta una pagina/sezione distinta per azienda.

## Architettura

La funzione è isolata in tre file:

- `js/modules/documenti_azienda_lavoratore_core.js`
- `js/modules/documenti_azienda_lavoratore_ui.js`
- `js/modules/documenti_azienda_lavoratore_print.js`

Il motore storico delle stampe non è stato modificato. `stampaSezioneAttuale()` viene intercettata esclusivamente per i quattro nuovi tipi di documento e delega all'implementazione originale per tutte le stampe esistenti.

## Verifiche da eseguire

- apertura Centro Stampe senza errori;
- presenza sezione “Documenti azienda / lavoratore”;
- selezione progetto e generazione Verbale consegna DPI;
- verifica dati lavoratore e azienda di appartenenza;
- generazione Registro DPI con più lavoratori;
- generazione Lettera nomina/incarico;
- generazione dichiarazione Datore di Lavoro;
- stampa di un documento storico già funzionante per verificare assenza di regressioni.
