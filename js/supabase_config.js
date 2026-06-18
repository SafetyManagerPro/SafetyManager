// js/supabase_config.js

// ⚠️ INSERISCI QUI LE TUE CHIAVI
const SUPABASE_URL = 'https://gblcedkfnasqlnrxupzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

// Usiamo window.supabase (fornito dalla CDN) e lo salviamo in una variabile DIVERSA per non creare conflitti
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funzione globale di Lettura
window.loadCloudDatabase = async function() {
    try {
        const { data, error } = await supabaseClient
            .from('corsisti')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) { 
            console.error("Supabase READ Error:", error); 
            return []; 
        }
        return data || [];
    } catch (err) {
        console.error("Errore di connessione Supabase:", err);
        return [];
    }
};

// Funzione globale di Salvataggio
window.saveCorsistaCloud = async function(record) {
    try {
        const { data, error } = await supabaseClient
            .from('corsisti')
            .upsert(record, { onConflict: 'id_certificato' });
            
        if (error) { 
            console.error("Supabase UPSERT Error:", error); 
            return false; 
        }
        return true;
    } catch (err) {
        console.error("Errore invio dati:", err);
        return false;
    }
};

// Funzione globale di Eliminazione
window.deleteCorsistaCloud = async function(id_certificato) {
    try {
        const { error } = await supabaseClient
            .from('corsisti')
            .delete()
            .eq('id_certificato', id_certificato);
            
        if (error) { 
            console.error("Supabase DELETE Error:", error); 
            return false; 
        }
        return true;
    } catch (err) {
        console.error("Errore eliminazione:", err);
        return false;
    }
};
