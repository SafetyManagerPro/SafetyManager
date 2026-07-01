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
