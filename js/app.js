// js/app.js

if (typeof lucide !== 'undefined') {
    const originalCreateIcons = lucide.createIcons;
    lucide.createIcons = function(options) {
        document.querySelectorAll('[data-lucide="first-aid"]').forEach(el => {
            el.setAttribute('data-lucide', 'heart-pulse');
        });
        try {
            originalCreateIcons.apply(lucide, [options]);
        } catch(e) {
            console.warn("Errore grafico bypassato in Lucide:", e);
        }
    };
}

window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');

    if (moduleId === 'procedure') {
        document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
        contentDiv.innerHTML = `
            <div class="w-full max-w-3xl mx-auto mt-24 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
                <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <i data-lucide="pause-circle" class="w-9 h-9 text-slate-500"></i>
                </div>
                <h1 class="text-2xl font-black uppercase text-slate-900 tracking-tight">Procedure digitali in pausa</h1>
                <p class="text-sm text-slate-600 mt-3 leading-relaxed">
                    Il modulo <strong>Firma, test e fascicolo locale</strong> è temporaneamente disattivato.
                    I dati già presenti non vengono cancellati; il modulo resta nel codice per eventuale riattivazione futura.
                </p>
                <button onclick="window.loadModule('admin')" class="mt-6 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                    Torna alla Dashboard
                </button>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    
    document.querySelectorAll('.btn-tab').forEach(b => {
        b.classList.remove('active');
    });

    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) {
        activeBtn.classList.add('active');
    }

    try {
        contentDiv.innerHTML = `<div class="flex items-center justify-center h-64 mt-20"><div class="text-center text-slate-500"><i data-lucide="loader-2" class="w-10 h-10 animate-spin mx-auto mb-4"></i><p class="font-bold uppercase tracking-widest text-sm">Caricamento modulo...</p></div></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const response = await fetch(`modules/${moduleId}.html`);
        if (!response.ok) throw new Error("File del modulo non trovato.");
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        if (moduleId === 'admin' && typeof window.loadDashboardStats === 'function') window.loadDashboardStats();
        if (moduleId === 'aziende' && typeof window.loadAziendeTable === 'function') window.loadAziendeTable();
        if (moduleId === 'docenti' && typeof window.loadDocentiTable === 'function') window.loadDocentiTable();
        if (moduleId === 'corsisti' && typeof window.loadCorsistiTable === 'function') window.loadCorsistiTable();
        if (moduleId === 'progetti' && typeof window.loadProgettiTable === 'function') window.loadProgettiTable();
        if (moduleId === 'scadenze' && typeof window.loadScadenzeTable === 'function') window.loadScadenzeTable();
        if (moduleId === 'ente' && typeof window.loadEnteData === 'function') window.loadEnteData();
        if (moduleId === 'stampe' && typeof window.initStampe === 'function') window.initStampe();
        if (moduleId === 'procedure' && typeof window.initProcedureDigitali === 'function') window.initProcedureDigitali();
        if (moduleId === 'migrazione' && typeof window.initMigrazione === 'function') window.initMigrazione();
        if (moduleId === 'archivio_corsi' && typeof window.loadArchivioCorsi === 'function') window.loadArchivioCorsi();

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold flex flex-col items-center mt-20"><i data-lucide="alert-triangle" class="w-10 h-10 mb-2"></i> Errore Modulo: ${error.message}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

let deferredPrompt;

document.addEventListener("DOMContentLoaded", async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then((reg) => {
            console.log('Service Worker registrato per PWA.');
        }).catch((err) => {
            console.log('Errore Service Worker', err);
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('btn-install-app');
        if (installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.classList.add('hidden');
                }
                deferredPrompt = null;
            });
        }
    });

    window.addEventListener('appinstalled', () => {
        const installBtn = document.getElementById('btn-install-app');
        if (installBtn) installBtn.classList.add('hidden');
    });

    await window.loadModule('admin'); 
});
