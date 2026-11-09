# Informativa privacy nel fascicolo formativo (9 novembre 2026)

Nuovo documento **Informativa Privacy + Presa Visione** (`modules/informativa_privacy.html`,
`js/modules/informativa_privacy.js`). Corsi, progetti e attestati non sono modificati; nessuna modifica al database.

## Cosa stampa

1. **Informativa sul trattamento dei dati personali dei partecipanti** (art. 13 Reg. UE 2016/679), una pagina:
   titolare, dati trattati, finalità e basi giuridiche (art. 6 lett. b, c, f; artt. 36-37 D.Lgs. 81/08,
   Accordo Stato-Regioni 17/04/2025), conferimento, modalità e documenti digitali (firma elettronica,
   invio via e-mail/messaggistica solo al partecipante o all'azienda), destinatari, trasferimenti extra UE,
   conservazione (almeno 10 anni), diritti e reclamo al Garante, nessuna decisione automatizzata.
2. **Foglio unico di presa visione** per tutto il progetto (scelta del 9/11/2026): nome e C.F. dei corsisti
   iscritti già stampati, data e firma a mano; 20 righe per pagina, righe libere per chi si aggiunge.
   È una presa visione, non un consenso: il trattamento si basa su obblighi di legge.

## Titolare del trattamento

Il soggetto formatore del progetto: l'**ente** (ragione sociale, sede, P.IVA/C.F., contatti dall'anagrafica Ente;
per CNA Avellino il preset come riserva) oppure l'**azienda** quando il datore di lavoro è soggetto formatore
(contatti da compilare a mano). DPO: riga da compilare se designato.

## Dove compare

- **Centro Stampe**: pulsante "Informativa Privacy + Presa Visione", dopo il Test lingua italiana.
- **Pacchetto corso**: prima dei registri presenze (va consegnata prima di raccogliere i dati).
- **Fascicolo del corso** (e quindi PDF unico): allegata subito dopo la prima pagina
  (`includePrivacyAnnexes:false` per escluderla). La voce di controllo del fascicolo diventa
  "Informativa privacy art. 13 GDPR e foglio di presa visione firmato dai corsisti (allegati)".

## Dettagli tecnici

- Le pagine hanno `data-safety-portrait="1"`: `firme_unificate.js` non le ruota mai come i registri,
  anche se il testo cita il registro presenze.
- Dimensioni dei caratteri inline (non dipendono dalla build Tailwind).
- Test: `tests/informativa_privacy.test.cjs` (5 test); `npm test` 189 test.

## Da fare prima dell'uso

Il testo è una base redatta sul GDPR: va approvato dal referente privacy/DPO di CNA. In particolare verificare
dove sono i server dei fornitori (Supabase, Vercel) e su quale garanzia si basa l'eventuale trasferimento extra UE (punto 7).
