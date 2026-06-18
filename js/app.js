// js/app.js

window.dbCorsisti = [];

// Funzione Router: Carica i file HTML dalla cartella modules
window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');
    
    // Aggiorna la UI del menu
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active', 'bg-blue-50', 'text-blue-900'));
    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) activeBtn.classList.add('active', 'bg-blue-50', 'text-blue-900');

    try {
        // Carica il file HTML in modo asincrono
        const response = await fetch(`modules/${moduleId}.html`);
        if (!response.ok) throw new Error("Modulo non trovato");
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Re-inizializza le icone Lucide per il nuovo contenuto
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Esegui eventuali script specifici del modulo
        window.updateAll(); // La tua funzione core di aggiornamento dati
        
        // Se è la dashboard admin, chiama il render
        if(moduleId === 'admin') window.renderAdminDashboard();

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold">Errore caricamento modulo: ${error.message}</div>`;
    }
};

// Modifica del salvataggio per usare Supabase
window.salvaCorsistaDB = async function() {
    // ... (Raccogli i dati dai form come facevi prima, creando l'oggetto 'record') ...
    
    const btn = document.getElementById('btn-save-cloud');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Salvataggio su Supabase...';
    
    // Salva nel cloud
    const success = await saveCorsistaCloud(record);
    
    if (success) {
        // Ricarica il DB locale da Supabase per avere i dati sincronizzati
        window.dbCorsisti = await loadCloudDatabase();
        window.updateDBCounter();
        
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Salvato nel Cloud!';
        setTimeout(() => { btn.innerHTML = originalHtml; lucide.createIcons(); }, 1500);
    } else {
        alert("Errore durante il salvataggio su Supabase.");
        btn.innerHTML = originalHtml;
    }
}

// Inizializzazione all'avvio
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carica il DB da Supabase
    window.dbCorsisti = await loadCloudDatabase();
    
    // 2. Carica il modulo iniziale (es. Config o Dashboard)
    await window.loadModule('config');
    
    // 3. Aggiorna i contatori
    window.updateDBCounter();
});
