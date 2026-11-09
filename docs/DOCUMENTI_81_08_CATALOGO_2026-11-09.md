# Documenti azienda / lavoratore D.Lgs. 81/08 — catalogo e stampa unica (9 novembre 2026)

Nuovo modulo `js/modules/documenti_azienda_lavoratore_catalogo.js`, caricato dopo i moduli esistenti
(`core`, `ui`, `print`, `directory`). Nel Centro Stampe, sotto "Documenti azienda / persona", compare
il riquadro verde **Documenti D.Lgs. 81/08 — datore di lavoro e lavoratore**.

Corsi, progetti e attestati non sono modificati: il modulo li **legge** soltanto (candidati RLS formati,
formazione del preposto, abilitazioni alle attrezzature). Nessuna modifica al database.
I 4 modelli storici (verbale consegna DPI, registro consegna DPI, lettera nomina/incarico,
dichiarazione DL) restano gestiti dal codice originale e producono le stesse stampe di prima (verificato).

## Documenti

| Gruppo | Documento | Destinatario | Riferimenti |
| --- | --- | --- | --- |
| Informazione | Verbale di informazione al lavoratore | lavoratore | art. 36 |
| Informazione | Informazione sui rischi specifici (VDT, MMC, rumore, vibrazioni, chimico, biologico, segnaletica) | lavoratore | artt. 36, 164, 169, 177, 184, 195, 227, 278 |
| Informazione | Presa visione del piano di emergenza ed evacuazione | lavoratore | artt. 36, 43, 46; D.M. 2/9/2021 |
| Addestramento | Scheda di addestramento — procedure di lavoro sicure | lavoratore + persona esperta | art. 37 cc. 4-5 |
| Addestramento | Scheda di addestramento all'uso di attrezzatura | lavoratore + persona esperta | artt. 37 c. 5, 71 c. 7, 73 |
| DPI | Verbale di consegna e addestramento DPI (con categoria I/II/III) | lavoratore + addestratore | artt. 18, 77, 78 |
| Nomine | Individuazione e nomina del preposto | preposto | artt. 18 c. 1 b-bis, 19, 37 c. 7 |
| Nomine | Verbale di elezione del RLS (candidati = lavoratori con corso RLS completato) | azienda | artt. 47, 18 c. 1 aa), 37 cc. 10-11 |
| Registri | Registro dell'addestramento (12 righe per pagina) | azienda | art. 37 c. 5 |

Regole comuni:
- In ogni documento compaiono azienda, **datore di lavoro** (persona dell'azienda con ruolo
  "Datore di lavoro", altrimenti il referente dell'azienda) e **lavoratore** (nome, C.F., nascita, mansione),
  con spazi firma per entrambi.
- Nessun esito presunto: le prove pratiche dell'addestramento hanno le caselle "positivo / da ripetere" vuote.
- L'RLS eletto non viene mai precompilato; la formazione del preposto e le abilitazioni sono proposte
  dai corsi completati, modificabili.
- Con "Tutta l'azienda" i documenti individuali vengono generati per ogni lavoratore (escluso il datore di lavoro).

## Stampa unica

Pulsante **Stampa unica di più documenti**: si scelgono i documenti (anche il registro consegna DPI esistente),
per una persona o per tutta l'azienda. Ordine delle pagine: per ogni lavoratore tutti i suoi documenti,
poi i documenti aziendali. I campi specifici restano da compilare a mano sul foglio.

## Verifica

- `npm run check`, `npm test` (177 test, inclusi 7 nuovi in `tests/documenti_81_08_catalogo.test.cjs`).
- Banco di prova: HTML dei 4 modelli storici identico con e senza il nuovo modulo; ognuno dei 9 documenti
  sta in una pagina A4; stampa unica per un'azienda con 3 lavoratori = 24 pagine, tutte inviate alla stampa.

## Da fare prima dell'uso

I testi sono una base redatta sulla normativa: vanno letti da chi segue la sicurezza in CNA e adattati
alle procedure e ai modelli già in uso.
