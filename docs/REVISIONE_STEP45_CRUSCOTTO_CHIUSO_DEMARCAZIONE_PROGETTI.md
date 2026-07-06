# Step 45 - Cruscotto chiuso di default e demarcazione progetti

## Problema rilevato
Nella schermata `Progetti Attivi` il cruscotto qualità restava aperto e occupava troppo spazio.

Inoltre nella parte scura i progetti non erano immediatamente distinguibili: la separazione tra un progetto e il successivo non era abbastanza marcata.

## Correzioni applicate

### 1. Cruscotto qualità chiuso di default
Il `Cruscotto qualità corso` ora è chiuso di default anche nella schermata principale dei progetti.

Resta visibile solo una barra compatta con:
- titolo;
- stato non bloccante;
- avanzamento;
- numero aree complete;
- numero aree da verificare;
- freccia giù/apri.

Per vedere i dettagli basta cliccare:

`Apri cruscotto`

Il pulsante cambia in:

`Chiudi cruscotto`

con freccia su.

### 2. Toggle sincronizzato
La funzione:

`window.toggleProjectQualityDetails(projectId)`

ora aggiorna tutti i cruscotti dello stesso progetto presenti nella pagina, comprese eventuali viste desktop/mobile.

### 3. Demarcazione visiva tra progetti
Aggiunta una riga separatrice evidente prima di ogni progetto nella vista desktop:

- bordo superiore ambra;
- linea orizzontale;
- etichetta `Inizio progetto`;
- codice progetto;
- azienda;
- data esame.

### 4. Bordo gruppo progetto
Ogni blocco progetto desktop ora ha un bordo laterale e inferiore ambra per distinguere:
- riga dati progetto;
- cruscotto qualità;
- area partecipanti.

### 5. Mobile
Anche la card mobile progetto ha:
- margine superiore più ampio;
- bordo ambra spesso;
- intestazione `Inizio progetto`.

## File modificato
- `js/utils.js`
