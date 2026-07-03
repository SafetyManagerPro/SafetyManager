// js/supabase_config.js

// Configurazione Supabase lato client.
// STEP 36: rimosse URL e anon key hardcodate dal codice sorgente.
// Valorizzare in produzione tramite variabili iniettate nel runtime:
//   window.SAFETY_SUPABASE_URL
//   window.SAFETY_SUPABASE_ANON_KEY
// oppure, solo per test locali, tramite localStorage.
// Esempio console locale:
//   localStorage.setItem('SAFETY_SUPABASE_URL', 'https://xxxxx.supabase.co')
//   localStorage.setItem('SAFETY_SUPABASE_ANON_KEY', 'ey...')
const SUPABASE_URL =
    window.SAFETY_SUPABASE_URL ||
    localStorage.getItem('SAFETY_SUPABASE_URL') ||
    '';

const SUPABASE_ANON_KEY =
    window.SAFETY_SUPABASE_ANON_KEY ||
    localStorage.getItem('SAFETY_SUPABASE_ANON_KEY') ||
    '';

window.isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);

window.setSafetySupabaseConfig = function(url, anonKey) {
    if (!url || !anonKey) {
        alert('Inserire URL Supabase e anon key.');
        return false;
    }
    localStorage.setItem('SAFETY_SUPABASE_URL', url);
    localStorage.setItem('SAFETY_SUPABASE_ANON_KEY', anonKey);
    alert('Configurazione Supabase salvata nel browser. Ricarica la pagina.');
    return true;
};

window.clearSafetySupabaseConfig = function() {
    localStorage.removeItem('SAFETY_SUPABASE_URL');
    localStorage.removeItem('SAFETY_SUPABASE_ANON_KEY');
    alert('Configurazione Supabase rimossa dal browser. Ricarica la pagina.');
};

if (!window.isSupabaseConfigured) {
    console.warn('Configurazione Supabase mancante: verificare che js/safety_env.js sia caricato prima di js/supabase_config.js oppure impostare window/localStorage.');
}

const supabaseClient = window.isSupabaseConfigured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
    })
    : {
        from() { throw new Error('Configurazione Supabase mancante. Impostare SAFETY_SUPABASE_URL e SAFETY_SUPABASE_ANON_KEY.'); },
        storage: {
            from() { throw new Error('Configurazione Supabase mancante.'); }
        },
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
        }
    };

window.supabaseClient = supabaseClient;

// ==========================================
// API AZIENDE (CRM)
// ==========================================

// Legge tutte le aziende in ordine alfabetico
window.getAziende = async function() {
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

    try {
        let result = await runSave(record);
        if (result.error && record.sede_operativa && String(result.error.message || '').includes('sede_operativa')) {
            console.warn('Colonna sede_operativa non presente: salvataggio fallback senza sede operativa. Applicare la migration Step 29 per salvarla nel database.');
            const fallback = { ...record };
            delete fallback.sede_operativa;
            result = await runSave(fallback);
        }
        if (result.error) throw result.error;
        return result.data;
    } catch (err) {
        console.error("Errore salvataggio Azienda:", err);
        alert("ERRORE DATABASE: " + err.message); 
        return false;
    }
};

// Elimina un'azienda tramite ID
window.deleteAzienda = async function(id) {
    try {
        const { error } = await supabaseClient
            .from('aziende')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Errore eliminazione Azienda:", err);
        return false;
    }
};
// ==========================================
// API DOCENTI
// ==========================================
window.getDocenti = async function() {
    try {
        const { data, error } = await supabaseClient.from('docenti').select('*').order('nome_cognome');
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
};

window.saveDocente = async function(record) {
    try {
        const { data, error } = await supabaseClient.from('docenti').upsert(record).select();
        if (error) throw error; return data;
    } catch (err) {
        const msg = String(err?.message || err || '');
        if (record.azienda_appartenenza !== undefined && (msg.includes('azienda_appartenenza') || msg.includes('schema cache'))) {
            console.warn('Campo docenti.azienda_appartenenza non presente: applica la migration Step 30. Riprovo senza campo.');
            const fallback = { ...record };
            delete fallback.azienda_appartenenza;
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
    try {
        const { data, error } = await supabaseClient
            .from('corsisti')
            .select('*, aziende(ragione_sociale, piva_cf, indirizzo, sede_operativa, ateco, referente)')
            .order('nome_cognome');
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
};

window.normalizzaCodiceFiscale = function(cf) {
    return String(cf || '').trim().toUpperCase().replace(/\s+/g, '');
};

window.checkCorsistaCfDuplicato = async function(cf, excludeId = null) {
    const cfNorm = window.normalizzaCodiceFiscale(cf);
    if (!cfNorm) return null;
    try {
        let q = supabaseClient
            .from('corsisti')
            .select('id,nome_cognome,cf')
            .eq('cf', cfNorm)
            .limit(1);
        if (excludeId) q = q.neq('id', excludeId);
        const { data, error } = await q;
        if (error) throw error;
        return data && data.length ? data[0] : null;
    } catch (err) {
        console.error('Errore controllo duplicato CF:', err);
        return null;
    }
};

window.saveCorsistaData = async function(record) {
    try {
        record.cf = window.normalizzaCodiceFiscale(record.cf);
        const duplicato = await window.checkCorsistaCfDuplicato(record.cf, record.id || null);
        if (duplicato) {
            alert(`Codice fiscale già presente: ${duplicato.nome_cognome || 'corsista esistente'} (${duplicato.cf}). Operazione annullata per evitare doppioni.`);
            return false;
        }
        const { data, error } = await supabaseClient.from('corsisti').upsert(record).select();
        if (error) throw error; return data;
    } catch (err) { console.error(err); return false; }
};

window.deleteCorsistaData = async function(id) {
    try {
        const { error } = await supabaseClient.from('corsisti').delete().eq('id', id);
        if (error) throw error; return true;
    } catch (err) { console.error(err); return false; }
};// ==========================================
// API PROGETTI
// ==========================================
window.getProgetti = async function() {
    try {
        const { data, error } = await supabaseClient
            .from('progetti')
            .select('*, aziende(ragione_sociale, piva_cf, indirizzo, sede_operativa, ateco, referente)')
            .order('data_esame', { ascending: false });
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
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
        const { data, error } = await supabaseClient
            .from('iscrizioni')
            .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica)')
            .eq('progetto_id', progetto_id)
            .order('created_at', { ascending: true });
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
};

window.getIscrizioniPerProgetti = async function(progettoIds = []) {
    const ids = [...new Set((progettoIds || []).filter(Boolean))];
    const map = {};
    ids.forEach(id => { map[id] = []; });
    if (!ids.length) return map;

    try {
        const { data, error } = await supabaseClient
            .from('iscrizioni')
            .select('*, corsisti(id, azienda_id, nome_cognome, cf, luogo_data_nascita, mansione_storica)')
            .in('progetto_id', ids)
            .order('created_at', { ascending: true });
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
        const { data, error } = await supabaseClient.from('enti').upsert(record).select().single();
        if (error) throw error; return data;
    } catch (err) { console.error(err); return null; }
};
