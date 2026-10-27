# SafetyManager Pro — FIX Archivio popup, layout legacy e cache (27 ottobre 2026)

## Segnalazione e autorizzazione
L'utente rileva ricomparsa intermittente del vecchio formato delle schede Progetti/Corsisti/Aziende e, dall'Archivio, apertura del progetto con navigazione indesiderata a Progetti. Dopo diagnosi, ha autorizzato «procedi».

## Cause verificate sul codice
1. In \`js/utils.js\`, \`ensureProgettiModuleReadyForProject\` esegue \`loadModule('progetti')\` quando manca \`#form-progetto\`. Le azioni «Apri» dall'Archivio richiamano \`apriPopupProgettoById\`, quindi la navigazione è implicita nella vecchia procedura.
2. \`js/app.js\` sostituisce interamente \`#app-content\` con l'HTML originale prima delle letture dati. I moduli G2/G3/G5 applicavano i popup al completamento dei loader asincroni: nell'intervallo si mostrava il vecchio form/sidebar. Non è prova di cache obsoleta.
3. Il SW aveva \`CACHE_NAME=safetymanager-pwa-v12\` con rete-prima per HTML e JS. La cache poteva riproporre file precedenti nei fallback offline; gli asset di upgrade non erano fra quelli precacheati.

## Interventi
- Nuovo \`js/modules/archive_project_popup_portal.js\`, caricato dopo G2/G3/G5. Intercetta \`apriPopupProgettoById\` **solo quando l'Archivio è la vista corrente e manca \`#form-progetto\`**. Recupera \`modules/progetti.html\` con \`cache:'no-store'\`, estrae **l'unico modulo originale** \`#progetto-form-col\` e lo monta in \`document.body\` come popup temporaneo, senza duplicare il form né navigare. Richiama **l'apertura legacy originale**, con gli stessi controlli, tab e salvataggi. In errore rete l'Archivio non cambia. Alla chiusura, rimuove il nodo temporaneo e ripristina focus e scroll.
- Il popup intercetta modifiche con eventi \`input/change\`; X o cambio sezione proteggono dati non salvati. Durante salvataggio, impedisce abbandono; il salvataggio originale richiama reset e chiusura **solo in caso di esito positivo**: il portale consente la chiusura automatica dopo reset, senza avviso spurious. Il wrapper non aggiunge scritture né query Supabase.
- In \`js/app.js\`, appena viene inserito l'HTML, **prima di attese asincrone**, si chiamano i montaggi G2 (Corsisti, Aziende), G3 (Progetti), G5 (Docenti), con guardia try/catch e fallback legacy accessibile. Così il vecchio pannello non rimane visibile durante letture lunghe. Caricamento HTML moduli con \`cache:'no-store'\`.
- In \`index.html\`, versionamento asset cache-busting per \`app.js\`, G2, G3, G5, e caricamento del portale Archivio.
- In \`sw.js\`, v13 PWA e precache degli script di upgrade, con rete-prima invariata. Se offline, resta il comportamento PWA documentato.
- Test \`tests/archive_project_popup_navigation.test.cjs\`: popup senza navigare, ritorno Archivio, conferme dati non salvati, reset e salvataggio, errore rete, compatibilità fuori archivio, deduplicazione montaggio, ordine inizializzazione UI e versionamento PWA.

## Vincoli e limitazioni
- **Nessuna migrazione, schema o dati DB alterati**, nessuna modifica ai documenti, PDF, firme, attestati, SafetyTraining o all'archivio PDF oltre il comportamento UI.
- Il file originale \`modules/progetti.html\` rimane la sorgente unica del modulo. Non si crea una seconda business logic.
- Il popup montato dal portale è quello di modifica **esistente**, non una versione read-only costruita separatamente. Restano le stesse capacità di modifica e i controlli utente.
- UI simulata in CI non sostituisce un collaudo nel browser autenticato: testare scroll, tab Corsisti, firma, ricerca e filtri Archivio conservati, smartphone/desktop e una modifica reale solo se necessario e autorizzata dall'admin.

## Checklist browser
1. Aprire Archivio, impostare filtri e ricerca, «Apri» su un progetto: la scheda si sovrappone **all'Archivio**, senza cambiare tab navigazione.
2. Chiudere con X: filtri e elenco Archivio devono rimanere come prima.
3. Provare la tab Corsisti, i dati e l'eventuale warning di completezza del progetto; nessun salvataggio è necessario.
4. Modificare un campo non salvandolo, premere X: conferma prima dell'abbandono. Anche il cambio sezione deve chiedere conferma.
5. Aprire Corsisti, Aziende, Progetti (e Docenti): lista moderna full-width immediata, nessuna lunga comparsa della sidebar legacy.
6. Ripetere su smartphone/PWA. Se si vede ancora un vecchio script, aggiornare la pagina mentre connessi alla rete per attivare la nuova versione SW.

## Stato
PR, CI, squash-merge e Vercel production da registrare dopo verifiche.
