// js/app.js

window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');
    
    // Aggiorna l'estetica del menu superiore
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active', 'bg-blue-50', 'text-blue-900'));
    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) activeBtn.classList.add('active', 'bg-blue-50', 'text-blue-900');

    try {
        // Carica HTML
        const response = await fetch(`modules/${moduleId}.html`);
        if (!response.ok) throw new Error("Modulo non trovato");
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Re-inizializza le icone
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // ==================================================
        // ROUTER TRIGGER: Esegui script specifici in base al modulo
        // ==================================================
        
        // Se apro Aziende -> Carica la tabella dal DB
        if (moduleId === 'aziende' && typeof window.loadAziendeTable === 'function') {
            window.loadAziendeTable();
        }
        
        // Se apro i vecchi moduli documentali -> Aggiorna l'anteprima
        if (['progetto', 'registro', 'verbale', 'attestato'].includes(moduleId) && typeof window.updateAll === 'function') {
            window.updateAll();
        }
        // Se apro Docenti -> Carica tabella
        if (moduleId === 'docenti' && typeof window.loadDocentiTable === 'function') {
            window.loadDocentiTable();
        }
        
        // Se apro Corsisti -> Carica tabella
        if (moduleId === 'corsisti' && typeof window.loadCorsistiTable === 'function') {
            window.loadCorsistiTable();
        }
        // Se apro Progetti -> Carica tabella
        if (moduleId === 'progetti' && typeof window.loadProgettiTable === 'function') {
            window.loadProgettiTable();
        }
        // Se apro Ente -> Carica Dati
        if (moduleId === 'ente' && typeof window.loadEnteData === 'function') {
            window.loadEnteData();
        }

        // Se apro Stampe -> Inizializza
        if (moduleId === 'stampe' && typeof window.initStampe === 'function') {
            window.initStampe();
        }

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold flex flex-col items-center"><i data-lucide="alert-triangle" class="w-10 h-10 mb-2"></i> Errore caricamento modulo: ${error.message}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    // Carica il modulo iniziale
    await window.loadModule('aziende'); // Facciamo partire l'app sulle Aziende per testare!
});
