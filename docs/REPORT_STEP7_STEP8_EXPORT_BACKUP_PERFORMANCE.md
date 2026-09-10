# Step 7 / Step 8 - Export, backup, ripristino e performance Supabase

## Step 7 - Import / Export / Backup

Aggiornato `js/modules/export_sezioni.js` con uno strato di hardening che si carica dopo i moduli storici di backup e migrazione.

### Tabelle incluse nel backup completo

Il backup locale ora copre tutte le tabelle pubbliche principali di SafetyManager:

- `enti`
- `ente`
- `aziende`
- `docenti`
- `corsisti`
- `progetti`
- `iscrizioni`
- `richieste_organismi_paritetici`
- `validazioni_percorsi_formativi`
- `documenti_fascicolo`
- `export_fascicoli`
- `firme_digitali`
- `test_digitali`
- `audit_log`

### Formati generati

Il pulsante storico `Scarica Backup` continua a funzionare, ma ora genera un pacchetto ZIP più completo:

- `backup_completo.json`
- `manifest.json`
- `conteggi.json`
- cartella `tabelle_json/`
- cartella `tabelle_csv/`
- eventuale `ERRORI_EXPORT.json`

### Ripristino conservativo

Il ripristino resta conservativo:

- usa una whitelist delle tabelle SafetyManager;
- ignora tabelle estranee;
- usa upsert su `id`;
- non cancella dati esistenti assenti dal backup;
- pulisce eventuali oggetti derivati da join prima dell'upsert.

## Step 8 - Performance Supabase

Applicata migrazione:

```text
step8_performance_fk_indexes_rls_initplan
```

### Interventi eseguiti

1. Aggiunti indici mancanti sulle foreign key segnalate dal Supabase linter.
2. Ottimizzata la policy RLS `safety_admin_all` usando `(select auth.uid())` al posto di `auth.uid()` diretto.
3. Rimosso l'indice duplicato standalone `iscrizioni_progetto_corsista_unique`, mantenendo il vincolo unique ufficiale `iscrizioni_progetto_id_corsista_id_key`.

### Indici FK aggiunti

- `idx_audit_log_changed_by`
- `idx_aziende_ente_id`
- `idx_corsisti_azienda_id`
- `idx_docenti_ente_id`
- `idx_documenti_fascicolo_created_by`
- `idx_export_fascicoli_progetto_id`
- `idx_firme_digitali_corsista_id`
- `idx_iscrizioni_corsista_id`
- `idx_progetti_azienda_id`
- `idx_richieste_op_azienda_id`
- `idx_test_digitali_corsista_id`
- `idx_validazioni_created_by`

### Stato advisor dopo migrazione

Risolti gli advisor performance su:

- foreign key senza indice;
- RLS initplan;
- indice duplicato su `iscrizioni`.

Rimangono solo avvisi `unused_index`, normali dopo la creazione di indici nuovi o in database con poco traffico. Non sono stati rimossi perché alcuni indici potrebbero servire quando l'app viene usata più intensamente.

### Sicurezza

La sicurezza RLS admin-only resta invariata: accesso alle tabelle pubbliche consentito solo all'utente admin autorizzato.

Rimane da valutare manualmente in Supabase Auth l'attivazione di `Leaked Password Protection`.
