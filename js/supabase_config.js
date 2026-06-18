// js/supabase_config.js

// ⚠️ INSERISCI QUI LE TUE CHIAVI
const SUPABASE_URL = 'https://gblcedkfnasqlnrxupzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    try {
        const { data, error } = await supabaseClient
            .from('aziende')
            .upsert(record)
            .select();
            
        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Errore salvataggio Azienda:", err);
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
    } catch (err) { console.error(err); return false; }
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
            .select('*, aziende(ragione_sociale)')
            .order('nome_cognome');
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
};

window.saveCorsistaData = async function(record) {
    try {
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
            .select('*, aziende(ragione_sociale)')
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
            .select('*, corsisti(nome_cognome, cf)')
            .eq('progetto_id', progetto_id)
            .order('created_at', { ascending: true });
        if (error) throw error; return data || [];
    } catch (err) { console.error(err); return []; }
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
