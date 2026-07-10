# Step 53 - Correzione firme trasparenti

## Problema corretto
Le firme elaborate nello step precedente risultavano con sfondo scuro / quasi nero.
Il problema è stato corretto rifacendo l'elaborazione partendo dagli originali.

## Correzione applicata
Per entrambe le firme:
- rimozione completa dello sfondo carta;
- esportazione in PNG RGBA con trasparenza reale;
- tratto scuro mantenuto solo sulla firma;
- nessun riempimento scuro del fondo;
- alleggerimento del file.

## File aggiornati
- `assets/firme/firma_berardino_pesce.png`
- `assets/firme/firma_centrella_alberto.png`

## Esito finale
Entrambe le immagini:
- hanno angoli trasparenti;
- hanno sfondo trasparente;
- possono essere sovrapposte ai documenti facendo intravedere la parte sottostante;
- mantengono il richiamo automatico per ruolo già configurato nello step 52.

### Dati finali
- `firma_berardino_pesce.png`: 1000x262 px, 78844 byte
- `firma_centrella_alberto.png`: 900x564 px, 112811 byte
