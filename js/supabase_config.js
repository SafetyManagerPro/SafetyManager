// js/supabase_config.js

// Configurazione Supabase lato client.
// In produzione su Vercel è preferibile valorizzare queste variabili tramite un file
// pubblico generato in build, ad esempio window.SAFETY_SUPABASE_URL e
// window.SAFETY_SUPABASE_ANON_KEY, oppure salvarle da pannello admin in localStorage.
// L'anon key non è una chiave segreta: la sicurezza reale deve essere garantita da RLS
// e policy Supabase coerenti con ente/azienda/ruolo utente.
const SUPABASE_URL =
    window.SAFETY_SUPABASE_URL ||
    localStorage.getItem('SAFETY_SUPABASE_URL') ||
    'https://gblcedkfnasqlnrxupzx.supabase.co';

const SUPABASE_ANON_KEY =
    window.SAFETY_SUPABASE_ANON_KEY ||
    localStorage.getItem('SAFETY_SUPABASE_ANON_KEY') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Configurazione Supabase mancante: impostare URL e anon key prima del deploy.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
});
window.supabaseClient = supabaseClient;

// Deduplica soltanto letture contemporanee identiche.
// Non conserva risultati dopo la risposta: nessun rischio di mostrare dati obsoleti.
window.__safetyReadInflight = window.__safetyReadInflight || new Map();
window.safetyDedupRead = function(key, loader) {
    const map = window.__safetyReadInflight;
    if (map.has(key)) return map.get(key);
    const promise = Promise.resolve().then(loader).finally(() => {
        if (map.get(key) === promise) map.delete(key);
    });
    map.set(key, promise);
    return promise;
};

// ==========================================
// API AZIENDE (CRM)
// ==========================================

// Legge tutte le aziende in ordine alfabetico
window.getAziende = async function() {
    return window.safetyDedupRead('aziende:list', async () => {
        try {
            const { data, error } = await supabaseClient
                .from('aziende')
                .select('*')
                .order('ragione_sociale', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Errore lettura Aziende:", err);
            return [];
        }
    });
};

// L'identificativo fiscale va confrontato con la stessa normalizzazione
// già usata dal trigger del database. IT + 11 cifre e 11 cifre sono equivalenti.
window.normalizzaIdentificativoAzienda = function(value) {
    let key=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(/^IT[0-9]{11}$/.test(key))key=key.slice(2);
    return key;
};
window.lastAziendaSaveError=null;
window.getAziendaSaveErrorMessage=()=>window.lastAziendaSaveError?.message||'Salvataggio azienda non riuscito.';

window.checkAziendaIdentificativoDuplicato = async function(value,excludeId=null,enteId=null) {
    const key=window.normalizzaIdentificativoAzienda(value);
    if(!key)return null;
    // Query di sola lettura; nessun accesso all'archivio documentale e nessun invio a terzi.
    // Pagine esplicite per non limitare il controllo ai primi 1000 record di PostgREST.
    for(let offset=0;offset<100000;offset+=500){
        const {data,error}=await supabaseClient.from('aziende')
          .select('id,ragione_sociale,piva_cf,ente_id').order('id',{ascending:true})
          .range(offset,offset+499);
        if(error)throw error; // Non tradurre un errore RLS/rete in «nessun duplicato».
        const match=(data||[]).find(a=>String(a.id)!==String(excludeId||'') &&
             (a.ente_id||null)===(enteId||null) &&
             window.normalizzaIdentificativoAzienda(a.piva_cf)===key);
        if(match)return match;
        if((data||[]).length<500)return null;
    }
    throw Error('Controllo partita IVA incompleto. Riprova prima di salvare.');
};

// Crea o aggiorna un'azienda
window.saveAzienda = async function(record) {
    const runSave = async (payload) => {
        if (payload.id) {
            return await supabaseClient
                .from('aziende')
                .update(payload)
                .eq('id', payload.id)
                .select();
        }
        return await supabaseClient
            .from('aziende')
            .insert(payload)
            .select();
    };

    window.lastAziendaSaveError=null;
    try {
        // In modifica, se il form non contiene ente_id, leggi lo scope effettivo
        // della scheda per non segnalare falsi duplicati di un altro ente.
        let enteId=record.ente_id??null;
        if(record.id && record.ente_id===undefined){
            const {data:current,error:readError}=await supabaseClient
                .from('aziende').select('ente_id').eq('id',record.id).maybeSingle();
            if(readError)throw readError;
            if(!current)throw Error('Azienda da modificare non trovata o non accessibile.');
            enteId=current.ente_id??null;
        }
        // La verifica è un aiuto UX; il trigger Supabase resta il controllo definitivo
        // anche contro salvataggi simultanei o chiusi su altri account.
        const duplicato=await window.checkAziendaIdentificativoDuplicato(record.piva_cf,record.id||null,enteId);
        if(duplicato){
            window.lastAziendaSaveError={
                code:'AZIENDA_IDENTIFICATIVO_DUPLICATO',
                message:'Partita IVA / codice fiscale già associato a «'+(duplicato.ragione_sociale||'altra azienda')+'». Apri la scheda esistente per modificarla.'
            };
            return false;
        }
        let result = await runSave(record);
        if (result.error && (String(result.error.message || '').includes('sede_operativa') || String(result.error.message || '').includes('legale_documento_url') || String(result.error.message || '').includes('schema cache'))) {
            console.warn('Colonne opzionali azienda non presenti: salvataggio fallback senza campi documentali/sede operativa. Applicare le migration Step 29/47.');
            const fallback = { ...record };
            delete fallback.sede_operativa;
            delete fallback.legale_documento_url;
            result = await runSave(fallback);
        }
        if (result.error) throw result.error;
        return result.data;
    } catch (err) {
        console.error('Errore salvataggio Azienda:',err);
        const message=String(err?.message||'Errore non disponibile');
        const code=String(err?.code||'');
        const duplicate=code==='23505'&&/partita iva|codice fiscale azienda|duplicat|già presente/i.test(message);
        const friendly=duplicate
          ?'Partita IVA / codice fiscale già presente in un’altra anagrafica aziendale.'
          :code==='23503'?'Collegamento aziendale non valido: '+message
          :code==='42501'?'Permessi insufficienti per salvare l’azienda.'
          :'Salvataggio azienda non riuscito ('+(code||'connessione o database')+'): '+message;
        window.lastAziendaSaveError={code:code||'SAVE_FAILED',message:friendly};
        return false;
    }
};

// Report preventivo: un'azienda collegata NON va eliminata con una cascata
// potenzialmente distruttiva per progetti, iscrizioni e storico dei corsisti.
window.getAziendaDeleteImpact = async function(id) {
    if(!id)throw Error('Identificativo azienda mancante.');
    const relazioni=[
        ['progetti','azienda_id','progetti'],
        ['corsisti','azienda_id','corsisti'],
        ['corsisti_rapporti_azienda','azienda_id','rapportiStorici'],
        ['iscrizioni','azienda_storica_id','iscrizioniStoriche'],
        ['corsisti_documenti_archivio','azienda_storica_id','documentiStorici'],
        ['richieste_organismi_paritetici','azienda_id','richiesteOrganismi'],
        ['training_effectiveness_checks','azienda_id','verificheEfficacia']
    ];
    const entries=await Promise.all(relazioni.map(async ([table,col,name])=>{
        const {count,error}=await supabaseClient.from(table).select('id',{head:true,count:'exact'}).eq(col,id);
        if(error)throw Error('Non riesco a verificare '+table+': '+error.message);
        // Un conteggio mancante/non valido NON equivale a zero collegamenti.
        // Per sicurezza blocca la DELETE se il controllo non è affidabile.
        if(!Number.isSafeInteger(count)||count<0){
            throw Error('Conteggio collegamenti non disponibile per '+table+'.');
        }
        return [name,count];
    }));
    return Object.fromEntries(entries);
};
window.deleteAzienda = async function(id) {
    window.lastAziendaDeleteError=null;
    try {
        const impact=await window.getAziendaDeleteImpact(id);
        const linked=Object.entries(impact).filter(([,count])=>count>0);
        if(linked.length){
            const labels={
                progetti:'progetti',corsisti:'corsisti',rapportiStorici:'rapporti aziendali',
                iscrizioniStoriche:'iscrizioni storiche',documentiStorici:'documenti archiviati',richiesteOrganismi:'richieste a organismi',
                verificheEfficacia:'verifiche di efficacia'
            };
            const message='Eliminazione non consentita: azienda collegata a '+linked.map(([key,n])=>n+' '+labels[key]).join(', ')+'. Gli storici devono restare disponibili. Apri la scheda azienda per verificare i collegamenti.';
            window.lastAziendaDeleteError=message;
            return false;
        }
        const {error}=await supabaseClient.from('aziende').delete().eq('id',id);
        if(error)throw error;
        return true;
    }catch(err){
        console.error('Eliminazione azienda impedita:',err);
        window.lastAziendaDeleteError='Eliminazione annullata: '+String(err?.message||'verifica dei collegamenti non disponibile');
        return false;
    }
};
// ==========================================
// API DOCENTI
// ==========================================
window.getDocenti = async function() {
    return window.safetyDedupRead('docenti:list', async () => {
        try {
            const { data, error } = await supabaseClient.from('docenti').select('*').order('nome_cognome');
            if (error) throw error;
            return data || [];
        } catch (err) { console.error(err); return []; }
    });
};

window.saveDocente = async function(record) {
    try {
        const { data, error } = await supabaseClient.from('docenti').upsert(record).select();
        if (error) throw error; return data;
    } catch (err) {
        const msg = String(err?.message || err || '');
        if ((record.azienda_appartenenza !== undefined || record.documento_identita_url !== undefined || record.codice_fiscale_url !== undefined || record.firma_docente_url !== undefined || record.luogo_data_nascita !== undefined) && (msg.includes('azienda_appartenenza') || msg.includes('documento_identita_url') || msg.includes('codice_fiscale_url') || msg.includes('firma_docente_url') || msg.includes('luogo_data_nascita') || msg.includes('schema cache'))) {
            console.warn('Campi opzionali docenti non presenti: applica le migration Step 30/47/48/65. Riprovo senza campi opzionali.');
            const fallback = { ...record };
            delete fallback.azienda_appartenenza;
            delete fallback.documento_identita_url;
            delete fallback.codice_fiscale_url;
            delete fallback.firma_docente_url;
            delete fallback.luogo_data_nascita;
            try {
                const { data, error } = await supabaseClient.from('docenti').upsert(fallback).select();
                if (error) throw error; return data;
            } catch (err2) { console.error(err2); return false; }
        }
        console.error(err); return false;
    }
};

window.deleteDocente = async function(id) {
    try {
        const { error } = await supabaseClient.from('docenti').delete().eq('id', id);
        if (error) throw error; return true;
    } catch (err) { console.error(err); return false; }
};

// ==========================================
// API CORSISTI (Con Join su Aziende)
// ==========================================
window.getCorsisti = async function() {
    return window.safetyDedupRead('corsisti:list', async () => {
        try {
            const { data, error } = await supabaseClient
                .from('corsisti')
                .select('*, aziende(ragione_sociale, piva_cf, indirizzo, sede_operativa, ateco, referente)')
                .order('nome_cognome');
            if (error) throw error;
            return data || [];
        } catch (err) { console.error(err); return []; }
    });
};

window.getCorsistaCompanyHistory = async function(corsistaId) {
    if (!corsistaId) return [];
    try {
        const { data, error } = await supabaseClient
            .from('corsisti_rapporti_azienda')
            .select('*')
            .eq('corsista_id', corsistaId)
            .order('data_inizio', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Errore lettura storico aziende corsista:', err);
        return [];
    }
};

window.normalizzaCodiceFiscale = function(cf) {
    return String(cf || '').trim().toUpperCase().replace(/\s+/g, '');
};

// Ultimo errore reso leggibile da tutti i moduli (nuovo corsista, modifica e inserimento rapido).
// Non interpretare un errore FK/permessi/schema come se fosse un CF già esistente.
window.lastCorsistaSaveError = null;
window.getCorsistaSaveErrorMessage = function() {
    return window.lastCorsistaSaveError?.message || 'Impossibile salvare il corsista. Riprova e verifica il collegamento al database.';
};

window.checkCorsistaCfDuplicato = async function(cf, excludeId = null) {
    const cfNorm = window.normalizzaCodiceFiscale(cf);
    if (!cfNorm) return null;
    let q = supabaseClient
        .from('corsisti')
        .select('id,nome_cognome,cf,archived_at')
        .eq('cf', cfNorm)
        .limit(1);
    if (excludeId) q = q.neq('id', excludeId);
    const { data, error } = await q;
    // La verifica non deve fallire silenziosamente se c'è un problema di rete o permessi.
    if (error) {
        console.error('Errore verifica CF corsista:', error);
        throw error;
    }
    return data && data.length ? data[0] : null;
};

window.saveCorsistaData = async function(record) {
    window.lastCorsistaSaveError = null;
    let phase = 'verifica';
    try {
        record.cf = window.normalizzaCodiceFiscale(record.cf);
        const duplicato = await window.checkCorsistaCfDuplicato(record.cf, record.id || null);
        if (duplicato) {
            window.lastCorsistaSaveError = {
                code: 'CF_DUPLICATO',
                message: `Codice fiscale già presente per ${duplicato.nome_cognome || 'un altro corsista'}${duplicato.archived_at ? ' (anagrafica archiviata: puoi ripristinarla)' : ''}. Non è stata creata una seconda anagrafica.`
            };
            return false;
        }
        phase = 'salvataggio';
        const linguaFields = [
            'cittadinanza',
            'studi_scolastici_italia',
            'lingua_test_stato',
            'lingua_test_data',
            'lingua_test_parte1',
            'lingua_test_parte2',
            'lingua_test_parte3',
            'lingua_test_valutatore',
            'lingua_test_dichiarazione_dl',
            'lingua_test_documento_url',
            'lingua_test_note'
        ];
        let workingRecord = { ...record };
        let { data, error } = await supabaseClient.from('corsisti').upsert(workingRecord).select();
        if (error && (
            String(error.message || '').includes('lingua_test_') ||
            String(error.message || '').includes('cittadinanza') ||
            String(error.message || '').includes('studi_scolastici_italia')
        )) {
            console.warn('Campi verifica lingua italiana non presenti: applica la migration Step 63. Riprovo senza dati lingua.');
            linguaFields.forEach(key => delete workingRecord[key]);
            const retry = await supabaseClient.from('corsisti').upsert(workingRecord).select();
            data = retry.data; error = retry.error;
        }
        if (error && (String(error.message || '').includes('documento_identita_url') || String(error.message || '').includes('codice_fiscale_url') || String(error.message || '').includes('schema cache'))) {
            console.warn('Campi documentali corsista non presenti: applica la migration Step 47. Riprovo senza link documenti.');
            delete workingRecord.documento_identita_url;
            delete workingRecord.codice_fiscale_url;
            const retry = await supabaseClient.from('corsisti').upsert(workingRecord).select();
            data = retry.data; error = retry.error;
        }
        if (error) throw error;
        window.lastCorsistaSaveError = null;
        return data;
    } catch (err) {
        console.error('Errore salvataggio corsista:', err);
        const code = String(err?.code || '');
        const raw = String(err?.message || 'Errore sconosciuto');
        const extra = String(err?.details || '');
        let message;
        if (phase === 'verifica') {
            message = 'Non riesco a verificare il codice fiscale nel database. Nessun dato è stato salvato. ' + raw;
        } else if (code === '23505' &&
                   /codice fiscale corsista|corsisti_ente_id_cf_key|corsisti.*cf|trg_guard_corsisti_cf_duplicate/i.test(raw + ' ' + extra)) {
            message = 'Codice fiscale realmente già associato a un corsista. Controlla anche eventuali anagrafiche archiviate. ' + raw;
        } else if (code === '23503') {
            message = 'Collegamento tra anagrafiche non valido (ad esempio azienda o storico): ' + raw;
        } else if (code === '42501' || /permission denied|row.level.security/i.test(raw)) {
            message = 'Permessi insufficienti per il salvataggio del corsista: ' + raw;
        } else {
            message = 'Salvataggio non riuscito (' + (code || 'errore database') + '): ' + raw;
        }
        window.lastCorsistaSaveError = { code: code || 'SAVE_FAILED', message };
        return false;
    }
};

window.archiveCorsistaData = async function(id, reason = '') {
    try {
        const { data, error } = await supabaseClient
            .from('corsisti')
            .update({
                archived_at: new Date().toISOString(),
                archived_reason: String(reason || '').trim() || null
            })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data?.[0] || true;
    } catch (err) {
        console.error('Errore archiviazione corsista:', err);
        return false;
    }
};

window.restoreCorsistaData = async function(id) {
    try {
        const { data, error } = await supabaseClient
            .from('corsisti')
            .update({ archived_at: null, archived_reason: null })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data?.[0] || true;
    } catch (err) {
        console.error('Errore ripristino corsista:', err);
        return false;
    }
};

window.getCorsistaDeleteImpact = async function(id) {
    if (!id) return null;
    try {
        const [
            iscrizioni,
            crediti,
            verifiche,
            rapporti
        ] = await Promise.all([
            supabaseClient.from('iscrizioni').select('*', { count: 'exact', head: true }).eq('corsista_id', id),
            supabaseClient.from('training_credits').select('*', { count: 'exact', head: true }).eq('corsista_id', id),
            supabaseClient.from('training_effectiveness_checks').select('*', { count: 'exact', head: true }).eq('corsista_id', id),
            supabaseClient.from('corsisti_rapporti_azienda').select('*', { count: 'exact', head: true }).eq('corsista_id', id)
        ]);
        return {
            iscrizioni: iscrizioni.count || 0,
            crediti: crediti.count || 0,
            verifiche: verifiche.count || 0,
            rapporti: rapporti.count || 0
        };
    } catch (err) {
        console.error('Errore analisi cancellazione corsista:', err);
        return null;
    }
};

window.hardDeleteCorsistaData = async function(id, confirmation) {
    try {
        const { data, error } = await supabaseClient.rpc('safety_hard_delete_corsista', {
            p_corsista_id: id,
            p_confirmation: confirmation
        });
        if (error) throw error;
        return data || true;
    } catch (err) {
        console.error('Errore eliminazione definitiva corsista:', err);
        alert('Eliminazione definitiva non riuscita: ' + (err?.message || err));
        return false;
    }
};

// Compatibilità: la vecchia delete diretta non viene più usata.
// Restituisce false per impedire cancellazioni accidentali che aggirano la procedura protetta.
window.deleteCorsistaData = async function(id) {
    console.warn('Cancellazione diretta corsista bloccata. Usa archiviazione o eliminazione definitiva protetta.', id);
    return false;
};// ==========================================
// API PROGETTI
// ==========================================
window.getProgetti = async function() {
    return window.safetyDedupRead('progetti:list', async () => {
        try {
            const { data, error } = await supabaseClient
                .from('progetti')
                .select('*, aziende(ragione_sociale, piva_cf, indirizzo, sede_operativa, ateco, referente)')
                .order('data_esame', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (err) { console.error(err); return []; }
    });
};

window.saveProgetto = async function(record) {
    try {
        const { data, error } = await supabaseClient.from('progetti').upsert(record).select();
        if (error) throw error; return data;
    } catch (err) { console.error(err); return false; }
};

window.deleteProgetto = async function(id) {
    try {
        const { error } = await supabaseClient.from('progetti').delete().eq('id', id);
        if (error) throw error; return true;
    } catch (err) { console.error(err); return false; }
};

// ==========================================
// API ISCRIZIONI
// ==========================================
window.getIscrizioni = async function(progetto_id) {
    try {
        let { data, error } = await supabaseClient
            .from('iscrizioni')
            .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica, cittadinanza, studi_scolastici_italia, lingua_test_stato, lingua_test_data, lingua_test_parte1, lingua_test_parte2, lingua_test_parte3, lingua_test_valutatore, lingua_test_dichiarazione_dl, lingua_test_documento_url, lingua_test_note)')
            .eq('progetto_id', progetto_id)
            .order('created_at', { ascending: true });
        if (error && (
            String(error.message || '').includes('lingua_test_') ||
            String(error.message || '').includes('cittadinanza') ||
            String(error.message || '').includes('studi_scolastici_italia')
        )) {
            const retry = await supabaseClient
                .from('iscrizioni')
                .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica)')
                .eq('progetto_id', progetto_id)
                .order('created_at', { ascending: true });
            data = retry.data; error = retry.error;
        }
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
};

window.getIscrizioniPerProgetti = async function(progettoIds = []) {
    const ids = [...new Set((progettoIds || []).filter(Boolean))];
    const emptyMap = {};
    ids.forEach(id => { emptyMap[id] = []; });
    if (!ids.length) return emptyMap;

    const key = 'iscrizioni:batch:' + [...ids].sort().join(',');
    return window.safetyDedupRead(key, async () => {
        const map = {};
        ids.forEach(id => { map[id] = []; });

        try {
            let { data, error } = await supabaseClient
                .from('iscrizioni')
                .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica, cittadinanza, studi_scolastici_italia, lingua_test_stato, lingua_test_data, lingua_test_parte1, lingua_test_parte2, lingua_test_parte3, lingua_test_valutatore, lingua_test_dichiarazione_dl, lingua_test_documento_url, lingua_test_note)')
                .in('progetto_id', ids)
                .order('created_at', { ascending: true });
            if (error && (
                String(error.message || '').includes('lingua_test_') ||
                String(error.message || '').includes('cittadinanza') ||
                String(error.message || '').includes('studi_scolastici_italia')
            )) {
                const retry = await supabaseClient
                    .from('iscrizioni')
                    .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica)')
                    .in('progetto_id', ids)
                    .order('created_at', { ascending: true });
                data = retry.data;
                error = retry.error;
            }
            if (error) throw error;
            (data || []).forEach(row => {
                if (!map[row.progetto_id]) map[row.progetto_id] = [];
                map[row.progetto_id].push(row);
            });
            return map;
        } catch (err) {
            console.error('Errore caricamento batch iscrizioni:', err);
            return map;
        }
    });
};

window.updateIscrizioniCorsistaSnapshot = async function(corsistaId, corsistaRecord = {}) {
    // Le iscrizioni sono record storici: azienda, mansione e ruolo del corso non devono
    // cambiare quando viene aggiornata l'anagrafica corrente del corsista.
    // La funzione resta per compatibilità con i vecchi chiamanti, ma non riscrive lo storico.
    return true;
};

window.saveIscrizione = async function(record) {
    try {
        const { data, error } = await supabaseClient.from('iscrizioni').insert(record).select();
        if (error) throw error; return data;
    } catch (err) { 
        console.error("Errore Iscrizione (Probabile duplicato):", err); 
        return false; 
    }
};

window.deleteIscrizione = async function(id) {
    try {
        const { error } = await supabaseClient.from('iscrizioni').delete().eq('id', id);
        if (error) throw error; return true;
    } catch (err) { console.error(err); return false; }
};
// ==========================================
// API ENTE FORMATORE
// ==========================================
window.getEnte = async function() {
    try {
        const { data, error } = await supabaseClient.from('enti').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 è "nessuna riga trovata"
        return data || null;
    } catch (err) { console.error(err); return null; }
};

window.saveEnteData = async function(record) {
    try {
        // Usa upsert. Assicurati che l'ID sia passato per sovrascrivere l'unico record esistente.
        let { data, error } = await supabaseClient.from('enti').upsert(record).select().single();
        if (error && (String(error.message || '').includes('legale_firma_url') || String(error.message || '').includes('schema cache'))) {
            console.warn('Campo enti.legale_firma_url non presente: applicare migration Step 48. Riprovo senza firma.');
            const fallback = { ...record };
            delete fallback.legale_firma_url;
            const retry = await supabaseClient.from('enti').upsert(fallback).select().single();
            data = retry.data; error = retry.error;
        }
        if (error) throw error; return data;
    } catch (err) { console.error(err); return null; }
};
