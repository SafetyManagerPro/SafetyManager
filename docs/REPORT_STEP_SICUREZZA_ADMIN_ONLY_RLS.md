# Step sicurezza Supabase - Admin only RLS

## Obiettivo
Proteggere SafetyManager PRO considerando l'app come gestionale monoutente, utilizzato solo dall'amministratore.

Account autorizzato:

```text
albertocentrella.av@gmail.com
```

## Modifiche applicate

### 1. Login obbligatorio lato frontend
Aggiornato `js/app.js`.

All'avvio l'app non carica più direttamente la Dashboard se non esiste una sessione Supabase valida dell'admin autorizzato.

Sono state aggiunte funzioni:

- `getSafetySession()`
- `getSafetyAdminUser()`
- `showSafetyLogin()`
- `handleSafetyLogin()`
- `sendSafetyMagicLink()`
- `logoutSafetyAdmin()`
- `ensureSafetyAdminOrLogin()`

La navigazione dei moduli viene bloccata se l'utente non è autenticato come admin.

### 2. RLS attiva su tabelle pubbliche
Applicata migrazione Supabase:

```text
step_sicurezza_admin_only_rls
```

Versione migrazione:

```text
20260910180202
```

Tabelle protette:

- `audit_log`
- `aziende`
- `corsisti`
- `docenti`
- `documenti_fascicolo`
- `ente`
- `enti`
- `export_fascicoli`
- `firme_digitali`
- `iscrizioni`
- `progetti`
- `richieste_organismi_paritetici`
- `test_digitali`
- `validazioni_percorsi_formativi`

### 3. Policy unica admin
Per ogni tabella è stata creata la policy:

```text
safety_admin_all
```

Logica:

- accesso consentito solo al ruolo `authenticated`;
- lettura/scrittura/modifica/cancellazione consentite solo se `auth.uid()` coincide con l'utente admin autorizzato;
- utenti anonimi esclusi;
- altri utenti autenticati esclusi.

## Verifiche eseguite

- RLS attiva sulle 14 tabelle pubbliche principali.
- Una policy presente su ogni tabella.
- Advisor sicurezza Supabase: rimosso errore `RLS Disabled in Public`.
- Rimane solo warning non bloccante su `Leaked Password Protection Disabled`.
- Deploy Vercel generato correttamente dal commit `Step sicurezza: login admin obbligatorio`.
- Build Vercel completata senza errori.

## Azioni successive consigliate

1. Accedere da app con `albertocentrella.av@gmail.com`.
2. Verificare lettura dati in Dashboard, Aziende, Corsisti, Docenti, Progetti e Stampe.
3. Attivare da pannello Supabase Auth la protezione password compromesse.
4. Valutare 2FA sull'account Google/GitHub/Vercel/Supabase.
5. In futuro, se dovranno accedere altri utenti, sostituire la policy monoutente con ruoli e tabella `profiles`.
