# SafetyManagerPro — Documenti azienda/persona filtrati per ruolo

Data: 15/09/2026

## Obiettivo
Riorganizzare **Documenti azienda / lavoratore** affinché i modelli siano collegati alla persona presente in Anagrafica Corsisti, alla sua azienda di appartenenza, al ruolo organizzativo e allo storico formativo, invece di dipendere esclusivamente dal progetto selezionato nel Centro Stampe.

## Punto di rollback
Prima dell'intervento è stato creato il branch:

`backup-pre-person-doc-filter-2026-09-15`

Commit base funzionante:

`310c5418f5337aa0489ab986a5d219274f4fa093`

## Database
Applicata migration Supabase:

`add_corsisti_ruolo_aziendale`

Aggiunta alla tabella `corsisti` la colonna:

`ruolo_aziendale text not null default 'lavoratore'`

Valori gestiti dall'interfaccia:
- lavoratore
- preposto
- dirigente
- datore_lavoro
- socio_lavoratore
- lavoratore_autonomo
- altro

La mansione resta separata dal ruolo aziendale.

## Nuovi moduli
### `js/modules/corsisti_ruolo_azienda.js`
- aggiunge il campo Ruolo aziendale alla scheda Corsista;
- aggiunge lo stesso campo al quick-add Corsista quando disponibile;
- salva il ruolo tramite l'API esistente `saveCorsistaData`;
- ripristina il ruolo durante la modifica anagrafica;
- mostra un badge ruolo nella tabella Corsisti;
- invalida la cache documentale dopo il salvataggio.

### `js/modules/documenti_azienda_lavoratore_directory.js`
- carica Aziende, Corsisti, Progetti e iscrizioni;
- costruisce lo storico formativo per persona;
- nel Centro Stampe introduce i filtri Azienda → Persona;
- supporta la modalità `Tutta l'azienda` per il Registro DPI;
- abilita/disabilita i documenti in base alla persona selezionata;
- la Dichiarazione Datore di Lavoro è disponibile solo se la persona è classificata come `datore_lavoro` e possiede una formazione pertinente nello storico;
- le lettere di incarico utilizzano lo storico formativo della persona come riferimento;
- i documenti prendono i dati dall'azienda di appartenenza della persona e non più obbligatoriamente dall'azienda del progetto.

## Documenti gestiti
- Verbale consegna DPI — persona singola;
- Registro consegna DPI — intera azienda;
- Lettera nomina/incarico — persona + storico formativo;
- Dichiarazione Datore di Lavoro — persona classificata datore + formazione pertinente.

## Compatibilità
Non sono stati modificati:
- motore delle stampe esistenti;
- attestati;
- firme;
- RLS/policy di sicurezza;
- tabelle diverse da `corsisti`;
- funzioni di chiusura corso.

I renderer documentali esistenti (`documenti_azienda_lavoratore_print.js`) restano invariati e vengono alimentati dal nuovo selettore anagrafico.

## Verifica consigliata
1. Aprire Corsisti e assegnare il ruolo corretto ad almeno un lavoratore e un datore di lavoro.
2. Aprire Centro Stampe.
3. In Documenti azienda/persona scegliere azienda e persona.
4. Verificare che i pulsanti si abilitino/disabilitino coerentemente.
5. Aprire Lettera nomina/incarico e controllare lo storico formativo proposto.
6. Selezionare un datore di lavoro e verificare la Dichiarazione DL.
7. Provare `Tutta l'azienda` e generare Registro DPI.
