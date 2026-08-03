# SafetyManager ASR2025 — Step 66

## Filtro azienda nel Centro Stampe e firme uniformate

### Base di lavoro

Intervento applicato alla versione 65 fornita come `SafetyManager-main (2).zip`.

### 1. Centro Stampe: filtro per azienda

Nel pannello del Centro Stampe è stato aggiunto il menu a tendina **Filtra per Azienda / Committente**.

Il filtro:

- viene popolato dalle aziende effettivamente collegate ai progetti;
- ordina alfabeticamente le ragioni sociali;
- funziona insieme al filtro per tipologia corso;
- mantiene il progetto selezionato se resta compatibile con i filtri;
- azzera l’anteprima se il progetto selezionato non appartiene più ai risultati;
- mostra il numero di progetti disponibili;
- gestisce anche eventuali progetti senza azienda con la voce `Privato / azienda non indicata`.

### 2. Correzione firme nelle stampe

È stata centralizzata la scelta della firma da mostrare negli slot dei documenti.

Ordine di risoluzione:

1. firma salvata nell’anagrafica del docente, se il firmatario coincide;
2. firma salvata in **Mio Ente Formatore** per il legale rappresentante dell’ente;
3. firma dell’ente anche per il responsabile progetto, solo se il nominativo coincide con il legale rappresentante;
4. firma automatica predefinita per nome e ruolo;
5. nessuna firma automatica quando nome e ruolo non sono compatibili.

Sono supportati:

- URL HTTPS/HTTP;
- percorsi relativi del repository, inclusi gli asset GitHub;
- immagini base64 generate dalla firma manuale;
- riferimenti `file:///` ove consentiti dal browser;
- fallback alle firme automatiche se un riferimento `LOCAL_FILE::nomefile` non è utilizzabile in stampa.

### 3. Ente formatore

Durante il caricamento del progetto nel Centro Stampe vengono ora trasferiti nello stato di stampa anche:

- nominativo del legale rappresentante;
- firma salvata in `enti.legale_firma_url`;
- record corrente dell’ente, usato per verificare la corretta corrispondenza tra firma e firmatario.

Questo corregge il caso in cui gli attestati erano emessi dall’ente formatore ma la firma caricata non veniva richiamata.

### 4. Altri documenti controllati

La logica comune viene applicata agli slot firma presenti in:

- attestato;
- progetto formativo;
- analisi fabbisogni;
- dichiarazioni/autocertificazioni;
- dichiarazione attrezzature;
- dichiarazioni docenti;
- esame;
- fascicolo corso;
- monitoraggio qualità;
- registri e registri multigiornata;
- relazione tutor;
- riepilogo gradimento;
- validazione percorso;
- verbale finale;
- comunicazione all’organismo paritetico.

Alla comunicazione all’organismo paritetico è stato aggiunto uno slot firma esplicito collegato al nominativo del firmatario.

### 5. Attesa immagini prima della stampa

Tutti i 12 flussi che invocano la stampa attendono ora il caricamento delle immagini presenti nell’area da stampare, con timeout di sicurezza. Questo evita che firme, logo o timbro remoti non compaiano nel PDF perché la finestra di stampa viene aperta troppo presto.

### Controlli eseguiti

- sintassi JavaScript: **18 file OK**;
- inventario slot firma: **25 slot**, tutti con ruolo e selettore firmatario;
- flussi stampa con attesa immagini: **12 su 12**;
- test unitario firma docente caricata: **OK**;
- test unitario firma ente caricata: **OK**;
- test mancata assegnazione della firma ente a nominativo diverso: **OK**;
- test fallback automatico da riferimento locale non stampabile: **OK**;
- test live filtro azienda `MIG COSTRUZIONI SRL`: **6 progetti corretti**;
- test live combinato `PLE + MIG COSTRUZIONI SRL`: **1 progetto corretto**;
- test live attestato CNA: firme **Berardino Pesce** e **Centrella Alberto** visibili e immagini caricate;
- test live progetto formativo: firme responsabile progetto, responsabile corso e docente visibili.

### Database

Nessuna migration richiesta. Lo step utilizza i campi già presenti:

- `enti.legale_firma_url`;
- `docenti.firma_docente_url`.

