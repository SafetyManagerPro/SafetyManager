// js/app.js

window.dbCorsisti = [];

// Funzione Router: Carica i file HTML dalla cartella modules
window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');
    
    // 1. Aggiorna l'estetica del menu superiore
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active', 'bg-blue-50', 'text-blue-900'));
    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) activeBtn.classList.add('active', 'bg-blue-50', 'text-blue-900');

    try {
        // 2. Chiama l'HTML del modulo selezionato
        const response = await fetch(`modules/${moduleId}.html`);
        if (!response.ok) throw new Error("Modulo non trovato");
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // 3. Re-inizializza le icone Lucide (se presenti)
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // 4. Aggiorna i dati sul nuovo modulo iniettato
        if (typeof window.updateAll === 'function') {
            window.updateAll();
        }
        
        // 5. Se è la dashboard, forza il rendering dei grafici
        if(moduleId === 'admin' && typeof window.renderAdminDashboard === 'function') {
            window.renderAdminDashboard();
        }

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold flex flex-col items-center"><i data-lucide="alert-triangle" class="w-10 h-10 mb-2"></i> Errore caricamento modulo: ${error.message}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Inizializzazione automatica al caricamento del sito
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Legge i dati dal cloud (Supabase) in modo sicuro
    if (typeof window.loadCloudDatabase === 'function') {
        window.dbCorsisti = await window.loadCloudDatabase();
    }
    
    // 2. Carica la prima schermata di default
    await window.loadModule('config');
    
    // 3. Aggiorna il contatore nella barra laterale
    if (typeof window.updateDBCounter === 'function') {
        window.updateDBCounter();
    }
});
