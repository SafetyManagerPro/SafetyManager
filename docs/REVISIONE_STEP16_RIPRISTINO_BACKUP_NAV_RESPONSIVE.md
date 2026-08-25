
# Step 16 - Ripristino backup e navbar responsive senza scroll

## Ripristino backup
Nel modulo `Migrazione Dati` è stata aggiunta la sezione `Ripristino backup database`.

Funzioni:
- lettura backup `.zip` prodotto da SafetyManager;
- lettura backup `.json`;
- analisi preventiva del contenuto;
- ripristino conservativo con `upsert`;
- log di avanzamento per tabella;
- non cancella automaticamente i dati esistenti non presenti nel backup.

Ordine di ripristino:
1. enti / ente
2. aziende
3. docenti
4. corsisti
5. progetti
6. iscrizioni
7. firme/test/export fascicoli

## Navbar responsive
La barra superiore è stata resa responsive:
- nessuno scroll orizzontale;
- nessuno scroll verticale nella navbar;
- pulsanti disposti su più righe quando la finestra è stretta;
- offset del contenuto calcolato dinamicamente in base all'altezza reale della navbar;
- su schermi piccoli le etichette testuali si nascondono e restano le icone.
