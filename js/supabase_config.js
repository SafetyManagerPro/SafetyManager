// js/supabase_config.js
const SUPABASE_URL = 'INSERISCI_QUI_IL_TUO_URL_SUPABASE';
const SUPABASE_ANON_KEY = 'INSERISCI_QUI_LA_TUA_CHIAVE_ANON_SUPABASE';

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
