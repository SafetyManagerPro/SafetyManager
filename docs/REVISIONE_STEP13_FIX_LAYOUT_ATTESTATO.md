
# Step 13 - Fix layout attestato in stampa

## Problema risolto
Nel fronte dell'attestato il corpo del documento poteva uscire dal bordo contornato in fase di stampa/PDF, soprattutto con:
- nomi azienda/corso lunghi;
- diciture normative estese;
- logo/timbro visibili;
- browser con scala stampa non ottimale.

## Interventi
- Ridotto padding esterno e interno della pagina attestato.
- Ridotto bordo interno da 10px a 6px sul fronte.
- Compattati header, titolo, dati corsista, dati corso e firme.
- Ridotte altezze di logo e timbro.
- Limitata l'area delle note legali per evitare sforamento.
- Aggiunte classi specifiche `attestato-front` e `attestato-retro`.
- Aggiunto CSS di stampa dedicato per retro e syllabus.

## Nota operativa
Per la stampa/PDF usare scala 100% o "Adatta alla pagina" se il browser lo propone.
