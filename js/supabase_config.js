// js/supabase_config.js
const SUPABASE_URL = 'https://gblcedkfnasqlnrxupzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

// Inizializza il client Supabase (la libreria viene caricata nell'index.html)
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funzione di Lettura
window.loadCloudDatabase = async function() {
    const { data, error } = await supabaseClient
        .from('corsisti')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) { 
        console.error("Supabase READ Error:", error); 
        return []; 
    }
    return data || [];
};

// Funzione di Salvataggio/Aggiornamento
window.saveCorsistaCloud = async function(record) {
    const { data, error } = await supabaseClient
        .from('corsisti')
        .upsert(record, { onConflict: 'id_certificato' });
        
    if (error) { 
        console.error("Supabase UPSERT Error:", error); 
        return false; 
    }
    return true;
};

// Funzione di Eliminazione
window.deleteCorsistaCloud = async function(id_certificato) {
    const { error } = await supabaseClient
        .from('corsisti')
        .delete()
        .eq('id_certificato', id_certificato);
        
    if (error) { 
        console.error("Supabase DELETE Error:", error); 
        return false; 
    }
    return true;
};
