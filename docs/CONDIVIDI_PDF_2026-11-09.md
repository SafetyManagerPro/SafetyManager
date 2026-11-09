# Condividi PDF dal Centro Stampe (9 novembre 2026)

Nuovo modulo `js/modules/condividi_pdf.js`, caricato solo nella sezione Stampe (`js/app.js`).

## Pulsanti

- **Condividi PDF (WhatsApp, email)** sotto "Ristampa documento visualizzato": condivide il documento in anteprima
  (qualsiasi stampa del Centro Stampe, compresi documenti azienda/lavoratore e stampa unica).
- **Condividi PDF** nella "Stampa libera di qualsiasi modello" dei documenti azienda/persona.

## Come funziona

1. Il pulsante avvia la normale funzione di stampa; la sua prossima chiamata a `window.print()` viene
   intercettata (una sola volta, poi ripristinata) e le pagine pronte vengono copiate.
2. Il PDF viene creato **nel browser** con html2pdf 0.10.1, lo stesso convertitore (e la stessa impronta SRI)
   già usato per l'archivio del fascicolo corsista: una pagina del documento = una pagina A4 del PDF.
3. Una finestra propone:
   - **Condividi** (solo dove il dispositivo lo consente: telefoni, tablet, alcuni computer): menu del sistema
     con WhatsApp, email e altre app, PDF già allegato;
   - **Scarica PDF**;
   - **Email** / **WhatsApp Web**: scarica il PDF e apre un messaggio pronto; il file va allegato a mano.

Il passaggio in due tempi è necessario perché i browser aprono la condivisione solo subito dopo un clic,
mentre la creazione del PDF richiede alcuni secondi.

Nome del file: titolo del documento e nome del lavoratore (es. `Verbale Di Informazione Al Lavoratore - Mario Rossi.pdf`);
per più documenti diversi insieme: `Documenti sicurezza - <azienda>.pdf`.

## Privacy

Nessun invio a server, nessuna copia salvata (né su Supabase né nel browser). I documenti contengono dati personali:
la finestra ricorda di inviarli solo ai contatti ufficiali.

## Note

- Le pagine con tabelle molto larghe (registri) sono ruotate di 90° anche nel PDF, come nella stampa su carta
  (comportamento esistente di `firme_unificate.js`).
- Invio email diretto dall'app (senza aprire altri programmi) e campi email/telefono nelle anagrafiche: non inclusi,
  da valutare in seguito.

## Verifica

- `npm run check`, `npm test` (184 test, inclusi 5 nuovi in `tests/condividi_pdf.test.cjs`).
- Banco di prova: documento singolo → PDF di 1 pagina; Stampa libera → 1 pagina; stampa unica di un'azienda con
  3 lavoratori → 24 pagine (come l'anteprima); la stampa normale dopo la condivisione funziona come prima.
