# Fix fase 2 — una sola percentuale di completamento (9 novembre 2026)

## Problema

Sull'app online, con i dati reali (89 progetti), lo stesso corso mostrava tre percentuali diverse:

| Corso | Checklist | Preparazione corsi | Cruscotto qualità |
| --- | --- | --- | --- |
| DLSPP-CAID-05062026-3313 | 22 % | 77 % | 36 % |
| PR-CAID-20102026-6708 | 38 % | 83 % | 45 % |
| PR-NES-13102026-3856 | 43 % | 87 % | 45 % |

Causa: Checklist e Preparazione corsi usano la stessa funzione `buildSafetyCourseChecklist`,
ma solo la Checklist le passava gli stati del registro Step 67 (`course_completion_items`,
verifiche di efficacia). Il Cruscotto qualità usava un terzo calcolo, a 11 aree.

## Regola unica (scelta dall'utente il 9/11/2026)

La percentuale di completamento del corso è quella del **registro Step 67**, in tutte le schermate.

| Schermata | Modifica | File |
| --- | --- | --- |
| Preparazione corsi (elenco e singolo corso) | Passa gli stati Step 67 a `buildSafetyCourseChecklist`, come la Checklist. Se il registro non risponde torna al calcolo precedente | `js/modules/prepara_corso.js` |
| Cruscotto qualità (elenco Progetti e popup) | Numero principale = Step 67, mostrato come "Avanzamento X %"; le 11 aree restano come dettaglio. Il registro si legge in un'unica richiesta per tutti i progetti mostrati, con memoria di 30 secondi; finché non arriva si vede "…" | `js/utils.js` |
| Registro Step 67 | Dopo ogni salvataggio svuota la memoria del Cruscotto, così il numero si aggiorna | `js/modules/step67_chiusura_intelligente.js` |
| Dashboard | Etichette uniche: "Pronto per le stampe" (prima anche "Pronto stampa"), "Pronto per l'archivio" / "Pronti per l'archivio" (prima "Pronto archiviazione", "Pronti archivio") | `js/modules/dashboard_pro.js` |
| Popup | I popup che ricostruiscono il contenuto (Checklist, Prepara corso) ricevono di nuovo Indietro/Avanti | `js/modules/professional_suite.js` |

I passaggi di preparazione (cosa manca prima delle stampe) non cambiano: usano ancora le voci
della checklist, non la percentuale. Nessuna modifica al database.

## Verifica

- `npm run check`, `npm test` (167 test, inclusi 4 nuovi in `tests/completezza_step67_fase2.test.cjs`).
- Banco di prova con dati simulati: Checklist, Preparazione corsi, Cruscotto nell'elenco e nel popup
  danno lo stesso valore per ogni corso.
- Dopo il deploy: ricontrollare i tre corsi della tabella sopra sull'app online.
