# Revisione Step 4 — Catalogo corsi ASR 2025

## Modifica richiesta

La voce storica unica:

- `agg_pratico_4h` — Agg. Pratico Attrezzature / Spazi Confinati (4h)

è stata dismessa per i nuovi progetti e sostituita da due percorsi distinti:

- `agg_attrezzature_4h` — Aggiornamento operatori macchine/attrezzature art. 73 (4h)
- `agg_spazi_confinati_4h` — Aggiornamento ambienti sospetti di inquinamento o confinati (4h)

La vecchia voce resta nel database applicativo come `deprecated: true`, così eventuali progetti già creati non si rompono, ma non viene più proposta nelle tendine e nei filtri operativi.

## Motivazione tecnica e normativa

L'Accordo Stato-Regioni 17 aprile 2025 tratta separatamente:

- i percorsi per ambienti sospetti di inquinamento o confinati;
- i percorsi per operatori addetti all'uso di attrezzature di lavoro ex art. 73, comma 5, D.Lgs. 81/08.

Anche gli aggiornamenti sono stati quindi separati, evitando una voce unica ambigua.

## Altre integrazioni aggiunte

Sono stati aggiunti al catalogo anche i percorsi attrezzature introdotti/aggiornati dall'ASR 2025:

- `attr_crf` — Macchina agricola raccoglifrutta CRF (8h)
- `attr_cmm` — Caricatori per movimentazione materiali CMM (8h)
- `attr_carroponte_10h` — Carroponte / Gru a cavalletto, una tipologia comando (10h)
- `attr_carroponte_all_11h` — Carroponte / Gru a cavalletto, tutte le tipologie comando (11h)

## Moduli modificati

- `js/data.js`
  - nuovo catalogo corsi;
  - voce legacy deprecata;
  - pool test separati per attrezzature e spazi confinati;
  - controllo presenza obbligatoria aggiornato.

- `modules/progetti.html`
  - tendina corso aggiornata;
  - voce combinata rimossa per nuovi progetti;
  - nuove voci CRF, CMM e Carroponte.

- `js/utils.js`
  - filtri corso aggiornati per non mostrare corsi deprecati;
  - generatore test aggiornato per distinguere attrezzature/spazi confinati.

- `js/digital.js`
  - test digitali aggiornati;
  - filtri procedure aggiornati per nascondere corsi deprecati.

## Attenzione sui dati già inseriti

Se nel database esistono progetti con:

```sql
corso_id = 'agg_pratico_4h'
```

vanno riclassificati manualmente in uno dei due nuovi corsi, usando la migration di supporto:

```text
supabase/migrations/2026-06-25_step4_split_aggiornamenti_legacy_check.sql
```

Non è stata applicata una conversione automatica perché il sistema non può sapere se il vecchio corso era riferito ad attrezzature o a spazi confinati.
