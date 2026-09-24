// js/app.js

// STEP SICUREZZA SUPABASE - accesso riservato all'unico admin
window.SAFETY_ADMIN_EMAIL = 'albertocentrella.av@gmail.com';
window.safetyAuthChecked = false;

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

window.updateNavOffset = function() {
    const nav = document.getElementById('top-nav');
    if (!nav) return;
    const h = Math.ceil(nav.getBoundingClientRect().height || 80);
    document.documentElement.style.setProperty('--nav-offset', (h + 18) + 'px');
};

window.addEventListener('resize', () => {
    clearTimeout(window.__navOffsetTimer);
    window.__navOffsetTimer = setTimeout(window.updateNavOffset, 100);
});

window.loadOptionalSafetyScript = async function(src) {
    if (!src || document.querySelector(`script[data-safety-dynamic="${src}"]`)) return true;
    return await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.dataset.safetyDynamic = src;
        script.onload = () => resolve(true);
        script.onerror = () => {
            console.warn('SafetyManager: script opzionale non caricato:', src);
            resolve(false);
        };
        document.head.appendChild(script);
    });
};

window.isSafetyAdminEmail = function(email) {
    return String(email || '').trim().toLowerCase() === String(window.SAFETY_ADMIN_EMAIL || '').toLowerCase();
};

window.getSafetySession = async function() {
    if (!window.supabaseClient?.auth) return null;
    try {
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        return data?.session || null;
    } catch (error) {
        console.warn('SafetyManager: sessione Supabase non disponibile.', error);
        return null;
    }
};

window.getSafetyAdminUser = async function() {
    if (!window.supabaseClient?.auth) return null;
    try {
        const { data, error } = await window.supabaseClient.auth.getUser();
        if (error) throw error;
        const user = data?.user || null;
        if (!user || !window.isSafetyAdminEmail(user.email)) return null;
        return user;
    } catch (error) {
        console.warn('SafetyManager: utente Supabase non disponibile.', error);
        return null;
    }
};

window.showSafetyLogin = function(message = '') {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
    contentDiv.innerHTML = `
        <div class="w-full max-w-md mx-auto mt-24 bg-white border border-slate-200 rounded-2xl shadow-xl p-7">
            <div class="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i data-lucide="lock-keyhole" class="w-7 h-7 text-emerald-300"></i>
            </div>
            <h1 class="text-center text-2xl font-black uppercase tracking-tight text-slate-900">SafetyManager PRO</h1>
            <p class="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Accesso amministratore</p>
            ${message ? `<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-xs font-bold">${window.dashEscape ? window.dashEscape(message) : message}</div>` : ''}

            <form onsubmit="window.handleSafetyLogin(event)" class="mt-6 space-y-4">
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email autorizzata</label>
                    <input id="safety-login-email" type="email" autocomplete="username" class="input-field mt-1" value="${window.SAFETY_ADMIN_EMAIL}" required>
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest">Password Supabase</label>
                    <input id="safety-login-password" type="password" autocomplete="current-password" class="input-field mt-1" placeholder="Inserisci password" required>
                </div>
                <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl py-3 shadow-md">
                    Entra
                </button>
            </form>

            <button type="button" onclick="window.sendSafetyMagicLink()" class="mt-3 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-black uppercase tracking-widest text-[10px] rounded-xl py-2.5">
                Invia link di accesso via email
            </button>
            <p class="mt-4 text-[10px] leading-relaxed text-slate-500 text-center">
                Accesso consentito solo a <strong>${window.SAFETY_ADMIN_EMAIL}</strong>. Le policy Supabase bloccano le API per utenti anonimi o diversi dall'admin.
            </p>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof window.updateNavOffset === 'function') setTimeout(window.updateNavOffset, 50);
};

window.handleSafetyLogin = async function(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('safety-login-email')?.value || '';
    const password = document.getElementById('safety-login-password')?.value || '';

    if (!window.isSafetyAdminEmail(email)) {
        alert('Accesso non autorizzato. Può accedere solo l\'admin configurato.');
        return;
    }
    if (!password) {
        alert('Inserisci la password.');
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!window.isSafetyAdminEmail(data?.user?.email)) {
            await window.supabaseClient.auth.signOut();
            alert('Utente non autorizzato.');
            return;
        }
        if (typeof window.installSafetySignaturePatches === 'function') window.installSafetySignaturePatches();
        await window.loadModule('admin');
    } catch (error) {
        console.error('Login non riuscito:', error);
        alert('Login non riuscito: ' + (error.message || error));
    }
};

window.sendSafetyMagicLink = async function() {
    const email = document.getElementById('safety-login-email')?.value || window.SAFETY_ADMIN_EMAIL;
    if (!window.isSafetyAdminEmail(email)) {
        alert('Accesso non autorizzato. Può accedere solo l\'admin configurato.');
        return;
    }
    try {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await window.supabaseClient.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo }
        });
        if (error) throw error;
        alert('Link di accesso inviato via email. Aprilo dallo stesso browser o dispositivo.');
    } catch (error) {
        console.error('Invio magic link non riuscito:', error);
        alert('Invio link non riuscito: ' + (error.message || error));
    }
};

window.logoutSafetyAdmin = async function() {
    try {
        await window.supabaseClient.auth.signOut();
    } catch (error) {
        console.warn('Logout non riuscito:', error);
    }
    window.showSafetyLogin('Sessione chiusa.');
};

window.ensureSafetyAdminOrLogin = async function() {
    const user = await window.getSafetyAdminUser();
    if (user) return user;
    const session = await window.getSafetySession();
    if (session && !window.isSafetyAdminEmail(session?.user?.email)) {
        await window.supabaseClient.auth.signOut();
        window.showSafetyLogin('Sessione non autorizzata rimossa.');
        return null;
    }
    window.showSafetyLogin('Effettua l\'accesso per continuare.');
    return null;
};

window.injectSafetyLogoutButton = function() {
    const nav = document.getElementById('top-nav-buttons');
    if (!nav || document.getElementById('nav-safety-logout')) return;
    const btn = document.createElement('button');
    btn.id = 'nav-safety-logout';
    btn.type = 'button';
    btn.onclick = window.logoutSafetyAdmin;
    btn.className = 'btn-tab flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:text-white hover:bg-red-900/70 group text-slate-400 border border-red-900/40';
    btn.innerHTML = '<div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-red-600 transition-all"><i data-lucide="log-out" class="w-3.5 h-3.5 group-hover:text-white icon-svg transition-colors"></i></div><span class="hidden xl:block">Esci</span>';
    nav.appendChild(btn);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.loadModule = async function(moduleId) {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;

    if (typeof window.installSafetySignaturePatches === 'function') window.installSafetySignaturePatches();

    if (moduleId !== 'login') {
        const user = await window.getSafetyAdminUser();
        if (!user) {
            await window.ensureSafetyAdminOrLogin();
            return;
        }
        window.injectSafetyLogoutButton();
        if (typeof window.SafetyPWA?.ensureInstallButton === 'function') window.SafetyPWA.ensureInstallButton();
    }

    if (moduleId === 'login') {
        window.showSafetyLogin();
        return;
    }

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
    
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));

    const activeBtn = document.getElementById('nav-' + moduleId);
    if(activeBtn) activeBtn.classList.add('active');

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
        if (moduleId === 'docenti' && typeof window.loadDocentiTable === 'function') await window.loadDocentiTable();
        if (moduleId === 'corsisti' && typeof window.loadCorsistiTable === 'function') window.loadCorsistiTable();
        if (moduleId === 'progetti' && typeof window.loadProgettiTable === 'function') await window.loadProgettiTable();
        if (moduleId === 'scadenze' && typeof window.loadScadenzeTable === 'function') window.loadScadenzeTable();
        if (moduleId === 'ente' && typeof window.loadEnteData === 'function') window.loadEnteData();
        if (moduleId === 'stampe' && typeof window.initStampe === 'function') window.initStampe();
        if (moduleId === 'fogli_progetti' && typeof window.initFogliProgetti === 'function') window.initFogliProgetti();
        if (moduleId === 'procedure' && typeof window.initProcedureDigitali === 'function') window.initProcedureDigitali();
        if (moduleId === 'migrazione' && typeof window.initMigrazione === 'function') window.initMigrazione();
        if (moduleId === 'archivio_corsi' && typeof window.loadArchivioCorsi === 'function') window.loadArchivioCorsi();
        if (moduleId === 'kit_cliente' && typeof window.initKitCliente === 'function') await window.initKitCliente();
        if (moduleId === 'collaudo' && typeof window.initCollaudoSistema === 'function') window.initCollaudoSistema();
        if (typeof window.installSafetySignaturePatches === 'function') window.installSafetySignaturePatches();
        if (typeof window.injectSectionExportToolbar === 'function') window.injectSectionExportToolbar(moduleId);
        if (typeof window.SafetyAI?.apply === 'function') window.SafetyAI.apply();
        if (typeof window.SafetyPWA?.ensureInstallButton === 'function') window.SafetyPWA.ensureInstallButton();
        if (typeof window.updateNavOffset === 'function') setTimeout(window.updateNavOffset, 50);

    } catch (error) {
        contentDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold flex flex-col items-center mt-20"><i data-lucide="alert-triangle" class="w-10 h-10 mb-2"></i> Errore Modulo: ${error.message}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    // PWA prima degli altri moduli: mantiene attivo il service worker e abilita il prompt di installazione.
    await window.loadOptionalSafetyScript('js/pwa.js');
    await window.loadOptionalSafetyScript('js/modules/firme_unificate.js');
    await window.loadOptionalSafetyScript('js/modules/corsisti_ruolo_azienda.js');
    await window.loadOptionalSafetyScript('js/modules/ai_assistant.js');
    await window.loadOptionalSafetyScript('js/modules/compliance_advisor.js');
    if (typeof window.installSafetySignaturePatches === 'function') window.installSafetySignaturePatches();

    if (window.supabaseClient?.auth?.onAuthStateChange) {
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                window.showSafetyLogin('Sessione chiusa.');
                return;
            }
            if (session?.user && window.isSafetyAdminEmail(session.user.email)) {
                if (!window.safetyAuthChecked) return;
                if (typeof window.installSafetySignaturePatches === 'function') window.installSafetySignaturePatches();
                await window.loadModule('admin');
            }
        });
    }

    window.safetyAuthChecked = true;
    const user = await window.getSafetyAdminUser();
    if (!user) {
        window.showSafetyLogin('Effettua l\'accesso per continuare.');
        return;
    }

    await window.loadModule('admin');
    if (typeof window.updateNavOffset === 'function') window.updateNavOffset();
});
