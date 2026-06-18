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
