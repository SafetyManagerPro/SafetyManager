// js/supabase_config.js
const SUPABASE_URL = 'https://gblcedkfnasqlnrxupzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

// Inizializza il client Supabase (la libreria viene caricata nell'index.html)
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funzioni centralizzate per il DB
async function loadCloudDatabase() {
    const { data, error } = await supabase.from('corsisti').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Errore DB:", error); return []; }
    return data;
}

async function saveCorsistaCloud(record) {
    const { data, error } = await supabase
        .from('corsisti')
        .upsert(record, { onConflict: 'id_certificato' }); // Aggiorna se esiste, altrimenti inserisce
        
    if (error) {
        console.error("Errore salvataggio:", error);
        return false;
    }
    return true;
}

async function deleteCorsistaCloud(id_certificato) {
    const { error } = await supabase.from('corsisti').delete().eq('id_certificato', id_certificato);
    return !error;
}
