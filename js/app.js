// js/app.js

window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');
    
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active', 'bg-blue-50', 'text-blue-900'));
    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) activeBtn.classList.add('active', 'bg-blue-50', 'text-blue-900');

    try {
        const response = await fetch(`modules/${moduleId}.html`);
        if (!response.ok) throw new Error("Modulo non trovato");
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // --- ROUTER TRIGGERS ---
        if (moduleId === 'admin' && typeof window.loadDashboardStats === 'function') {
            window.loadDashboardStats();
        }
        if (moduleId === 'aziende' && typeof window.loadAziendeTable === 'function') {
            window.loadAziendeTable();
        }
        if (moduleId === 'docenti' && typeof window.loadDocentiTable === 'function') {
            window.loadDocentiTable();
        }
        if (moduleId === 'corsisti' && typeof window.loadCorsistiTable === 'function') {
            window.loadCorsistiTable();
        }
        if (moduleId === 'progetti' && typeof window.loadProgettiTable === 'function') {
            window.loadProgettiTable();
        }
        if (moduleId === 'ente' && typeof window.loadEnteData === 'function') {
            window.loadEnteData();
        }
        if (moduleId === 'stampe' && typeof window.initStampe === 'function') {
            window.initStampe();
        }

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold flex flex-col items-center"><i data-lucide="alert-triangle" class="w-10 h-10 mb-2"></i> Errore caricamento modulo: ${error.message}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadModule('admin'); 
});
