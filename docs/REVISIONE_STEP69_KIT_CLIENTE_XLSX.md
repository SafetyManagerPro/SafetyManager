# Step 69 — Kit cliente XLSX per attivazione corso

## Obiettivo

Raccogliere in un unico file XLSX i dati necessari per predisporre un corso, sia quando l'azienda è già presente in SafetyManager sia quando si tratta di un nuovo cliente.

## Nuovo modulo

È stato aggiunto il modulo **Kit attivazione corso XLSX**, accessibile:

- dalla barra superiore;
- dalle Azioni rapide della Dashboard;
- dal pulsante Kit XLSX presente nella riga di ogni azienda.

## Modello XLSX

Il modello distribuito al cliente contiene due fogli visibili:

1. **Dati Azienda**;
2. **Corsisti e Corsi**.

Un terzo foglio tecnico `_Elenchi` è nascosto e alimenta i menu a tendina. Il catalogo comprende tutti i corsi attivi definiti in `DB_CORSI` al momento della generazione dello Step 69.

Il file supporta:

- nuova azienda non ancora presente;
- azienda esistente, con ID e dati anagrafici precompilati;
- più corsi per lo stesso corsista mediante righe separate;
- massimo 50 righe corsista/corso nel modello iniziale;
- menu a tendina per corso, tipo percorso, lingua, modalità e valori Sì/No;
- segnalazione di campi mancanti e duplicazione della stessa coppia corsista/corso.

## Analisi prima dell'importazione

SafetyManager verifica senza scrivere nel database:

- presenza e nome dei due fogli obbligatori;
- dati minimi dell'azienda;
- conferma della correttezza dati;
- riconoscimento di azienda esistente tramite ID, P.IVA/C.F. o ragione sociale;
- campi minimi dei corsisti;
- riconoscimento del corso tramite ID stabile incluso nel menu;
- duplicazione esatta corsista/corso;
- conflitti tra codice fiscale già presente e azienda diversa.

Gli errori devono essere corretti prima dell'importazione. Gli avvisi non bloccanti restano visibili per la verifica dell'operatore.

## Importazione conservativa

L'importazione:

- riutilizza l'azienda già presente senza sovrascriverla;
- crea una nuova azienda solo quando non esiste una corrispondenza;
- riutilizza i corsisti riconosciuti per codice fiscale;
- crea solo i corsisti mancanti;
- non sovrascrive automaticamente anagrafiche esistenti;
- non crea progetti formativi incompleti.

Le richieste corso vengono salvate localmente come bozze operative. Il pulsante **Completa progetto** apre Gestione Progetto e precompila azienda, corso, corsisti, preferenze di sede/modalità e note del cliente. Date definitive, docenti, compliance, responsabili e altri dati devono essere verificati prima del normale salvataggio del progetto.

## Sicurezza

Il file XLSX contiene dati personali. La webapp non invia il foglio a servizi esterni: viene letto nel browser e i dati vengono scritti in Supabase solo dopo analisi, conferma esplicita e importazione. Restano necessarie Auth e policy RLS prima dell'uso multiutente in produzione.

## File principali

- `modules/kit_cliente.html`
- `js/modules/kit_cliente.js`
- `assets/templates/Kit_attivazione_corso_nuova_azienda.xlsx`
- `index.html`
- `js/app.js`
- `js/utils.js`
- `modules/admin.html`
- `js/modules/collaudo.js`

## Controlli eseguiti

- sintassi JavaScript dei file modificati;
- presenza e collegamento del modulo HTML/JS;
- integrità del modello XLSX;
- due fogli visibili e foglio tecnico nascosto;
- 53 corsi attivi presenti nel menu del modello;
- formule senza errori rilevati;
- test della precompilazione celle per azienda esistente;
- verifica visiva dei due fogli.

Non è richiesta una nuova migration Supabase per questo step.
