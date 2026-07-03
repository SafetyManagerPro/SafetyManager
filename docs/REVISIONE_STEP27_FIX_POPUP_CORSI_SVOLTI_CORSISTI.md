
# Step 27 - Fix popup progetto da Corsi svolti in Anagrafica Corsisti

## Problema corretto
Da `Anagrafica Corsisti`, cliccando un corso svolto, il popup poteva aprire la scheda progetto come se fosse un nuovo corso/progetto, con campi vuoti o rigenerati, invece del progetto esistente collegato al link cliccato.

## Causa
Il modulo `Progetti` veniva caricato ma la tabella/progetti e i menu collegati potevano non essere ancora inizializzati al momento della compilazione del form.
Inoltre `modificaProgetto()` richiamava il calcolo automatico del progetto, che poteva rigenerare codice/data/calendario invece di preservare quelli già salvati.

## Correzioni
- `loadModule('progetti')` ora attende il completamento di `loadProgettiTable()`.
- Aggiunto `ensureProgettiModuleReadyForProject(projectId)` per assicurare caricamento di:
  - aziende;
  - docenti;
  - corsisti;
  - progetti;
  - select azienda.
- Aggiunto `apriProgettoDaCorsoSvolto(projectId, corsistaId)`.
- I link in `Corsi Svolti` ora chiamano questa funzione dedicata.
- `modificaProgetto()` ora:
  - imposta sempre `prog-id`;
  - carica lo stato progetto reale;
  - carica documenti/chiusura reali;
  - conserva codice, data esame e calendario salvati;
  - non trasforma più il progetto esistente in un nuovo progetto rigenerato.
- Nel popup corsisti è stato aggiunto `data-popup-corsista-id` per evidenziare il corsista da cui si è partiti.

## Risultato
Cliccando un corso svolto in Anagrafica Corsisti viene aperto il progetto già presente in `Progetti Attivi`, con i dati reali del progetto salvato.
