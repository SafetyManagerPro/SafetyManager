// STEP 9 - Dashboard professionale SafetyManager
// Obiettivo: rendere la home operativa, leggibile e guidata senza toccare stampe/firme/database.
(function() {
    if (window.__safetyDashboardProLoaded) return;
    window.__safetyDashboardProLoaded = true;

    const esc = (value) => {
        if (typeof window.dashEscape === 'function') return window.dashEscape(value);
        return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
    };

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '0';
    };

    const todayStart = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const parseDate = (value) => {
        if (!value) return null;
        const d = new Date(String(value).slice(0, 10) + 'T00:00:00');
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const fmtDate = (value) => {
        if (!value) return '-';
        if (typeof window.formatDataToItalian === 'function') return window.formatDataToItalian(String(value).slice(0, 10));
        return String(value).slice(0, 10);
    };

    const courseLabel = (p) => {
        const c = window.DB_CORSI?.[p?.corso_id];
        return c ? (c.t || c.code || p.corso_id) : (p?.corso_id || 'Corso non indicato');
    };

    const companyLabel = (p) => p?.aziende?.ragione_sociale || p?.azienda_nome || 'Azienda non collegata';

    const projectStatus = (p, iscritti = []) => {
        const missing = [];
        if (!p?.codice) missing.push('codice');
        if (!p?.corso_id || !window.DB_CORSI?.[p.corso_id]) missing.push('corso');
        if (!p?.azienda_id) missing.push('azienda');
        if (!p?.data_inizio) missing.push('data inizio');
        if (!p?.data_esame) missing.push('data verifica');
        if (!p?.sede) missing.push('sede');
        if (!p?.resp_progetto) missing.push('resp. progetto');
        if (!p?.resp_corso) missing.push('resp. corso');
        if (!p?.docenti_ud && !p?.docente_principale) missing.push('docenti');
        if (!iscritti.length) missing.push('corsisti');

        const state = String(p?.stato_corso || 'aperto').toLowerCase();
        const examDate = parseDate(p?.data_esame);
        const pastExam = examDate && examDate.getTime() <= todayStart().getTime();

        if (state === 'chiuso') {
            return { key: 'closed', label: 'Chiuso', tone: 'emerald', missing, priority: 4 };
        }
        if (pastExam) {
            return { key: 'toclose', label: 'Da chiudere', tone: 'amber', missing, priority: 1 };
        }
        if (missing.length) {
            return { key: 'draft', label: 'Dati mancanti', tone: 'rose', missing, priority: 2 };
        }
        return { key: 'ready', label: 'Pronto stampa', tone: 'blue', missing, priority: 3 };
    };

    const badge = (status) => {
        const map = {
            closed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            toclose: 'bg-amber-100 text-amber-900 border-amber-200',
            draft: 'bg-rose-100 text-rose-800 border-rose-200',
            ready: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return `<span class="inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${map[status.key] || map.draft}">${esc(status.label)}</span>`;
    };

    const statusCard = ({ id, title, value, subtitle, icon, tone, action }) => `
        <button type="button" ${action ? `onclick="${action}"` : ''} class="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">${esc(title)}</p>
                    <p id="${esc(id)}" class="text-3xl font-black text-slate-900 mt-1">${esc(value ?? 0)}</p>
                </div>
                <span class="w-12 h-12 rounded-2xl bg-${tone}-50 text-${tone}-600 border border-${tone}-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <i data-lucide="${esc(icon)}" class="w-5 h-5"></i>
                </span>
            </div>
            <p class="text-[11px] leading-relaxed text-slate-500 mt-3">${esc(subtitle || '')}</p>
        </button>`;

    const renderActionPlan = (projects, iscrizioniMap) => {
        const box = document.getElementById('dash-action-plan');
        if (!box) return;
        const items = [];
        projects.forEach(p => {
            const iscritti = iscrizioniMap[p.id] || [];
            const s = projectStatus(p, iscritti);
            if (s.key === 'toclose') {
                items.push({ level: 'amber', icon: 'lock-keyhole', title: 'Corso da chiudere', project: p, text: `Data verifica ${fmtDate(p.data_esame)}. Completa esiti, registro, verbale e archivio.` });
            } else if (s.key === 'draft') {
                items.push({ level: 'rose', icon: 'clipboard-warning', title: 'Dati mancanti', project: p, text: `Mancano: ${s.missing.slice(0, 5).join(', ')}${s.missing.length > 5 ? '…' : ''}.` });
            } else if (s.key === 'ready') {
                items.push({ level: 'blue', icon: 'printer-check', title: 'Pronto per stampe', project: p, text: 'Dati minimi completi: puoi generare progetto, registro, test e fascicolo.' });
            }
        });

        items.sort((a, b) => {
            const order = { amber: 1, rose: 2, blue: 3 };
            return (order[a.level] || 9) - (order[b.level] || 9);
        });

        if (!items.length) {
            box.innerHTML = `
                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <i data-lucide="badge-check" class="w-8 h-8 mx-auto text-emerald-600 mb-2"></i>
                    <p class="font-black uppercase text-emerald-900 text-sm">Nessuna urgenza operativa</p>
                    <p class="text-xs text-emerald-800 mt-1">Non risultano corsi da chiudere o progetti incompleti nei controlli rapidi.</p>
                </div>`;
            return;
        }

        box.innerHTML = items.slice(0, 6).map(item => `
            <div class="rounded-2xl border border-${item.level}-200 bg-${item.level}-50 p-4 flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 min-w-0">
                    <span class="w-10 h-10 rounded-xl bg-white border border-${item.level}-200 text-${item.level}-700 flex items-center justify-center shrink-0">
                        <i data-lucide="${esc(item.icon)}" class="w-4 h-4"></i>
                    </span>
                    <div class="min-w-0">
                        <p class="text-[10px] font-black uppercase tracking-widest text-${item.level}-800">${esc(item.title)}</p>
                        <p class="font-black text-slate-900 text-sm mt-0.5 truncate">${esc(item.project.codice || 'Senza codice')} · ${esc(courseLabel(item.project))}</p>
                        <p class="text-xs text-slate-600 mt-1 leading-relaxed">${esc(item.text)}</p>
                    </div>
                </div>
                <button type="button" onclick="window.dashboardOpenProject('${esc(item.project.id)}')" class="shrink-0 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition">Apri</button>
            </div>`).join('');
    };

    const renderProjectsOverview = (projects, iscrizioniMap) => {
        const box = document.getElementById('dash-projects-overview');
        if (!box) return;
        if (!projects.length) {
            box.innerHTML = '<div class="p-5 text-center text-sm text-slate-500">Nessun progetto formativo presente.</div>';
            return;
        }
        const ordered = [...projects].sort((a, b) => {
            const sa = projectStatus(a, iscrizioniMap[a.id] || []);
            const sb = projectStatus(b, iscrizioniMap[b.id] || []);
            const da = parseDate(a.data_esame)?.getTime() || 0;
            const db = parseDate(b.data_esame)?.getTime() || 0;
            return sa.priority - sb.priority || db - da;
        }).slice(0, 8);

        box.innerHTML = `
            <div class="hidden md:block overflow-x-auto">
                <table data-responsive-cards="dashboard-projects-mobile-cards" class="w-full text-left text-xs">
                    <thead class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                        <tr>
                            <th class="p-3">Corso</th>
                            <th class="p-3">Azienda</th>
                            <th class="p-3">Date</th>
                            <th class="p-3 text-center">Iscritti</th>
                            <th class="p-3">Stato</th>
                            <th class="p-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordered.map(p => {
                            const iscritti = iscrizioniMap[p.id] || [];
                            const s = projectStatus(p, iscritti);
                            return `
                                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td class="p-3 align-top">
                                        <p class="font-black text-slate-900 uppercase">${esc(p.codice || 'Senza codice')}</p>
                                        <p class="text-[11px] text-slate-500 mt-0.5">${esc(courseLabel(p))}</p>
                                    </td>
                                    <td class="p-3 align-top text-slate-600">${esc(companyLabel(p))}</td>
                                    <td class="p-3 align-top text-slate-600 whitespace-nowrap">
                                        <p>Inizio: <strong>${esc(fmtDate(p.data_inizio))}</strong></p>
                                        <p>Verifica: <strong>${esc(fmtDate(p.data_esame))}</strong></p>
                                    </td>
                                    <td class="p-3 align-top text-center font-black text-slate-800">${iscritti.length}</td>
                                    <td class="p-3 align-top">${badge(s)}${s.missing.length ? `<p class="text-[10px] text-slate-500 mt-1">${esc(s.missing.slice(0, 3).join(', '))}</p>` : ''}</td>
                                    <td class="p-3 align-top text-right whitespace-nowrap">
                                        <button type="button" onclick="window.dashboardOpenProject('${esc(p.id)}')" class="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest">Apri</button>
                                        <button type="button" onclick="window.loadModule('stampe')" class="px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100 text-[10px] font-black uppercase tracking-widest ml-1">Stampe</button>
                                    </td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div id="dashboard-projects-mobile-cards" class="md:hidden p-3 space-y-3 bg-slate-50"></div>`;
    };

    const renderSystemHealth = (counts, projects, iscrizioniMap) => {
        const box = document.getElementById('dash-system-health');
        if (!box) return;
        const hasBackup = typeof window.esportaBackupDatabaseLocale === 'function';
        const hasPrint = typeof window.prepareSafetyPrintContainer === 'function' || typeof window.waitForPrintImages === 'function';
        const totalIscrizioni = Object.values(iscrizioniMap || {}).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
        box.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p class="text-[10px] font-black uppercase tracking-widest text-emerald-800">Database</p>
                    <p class="text-sm font-black text-slate-900 mt-1">${counts.progetti || 0} progetti · ${totalIscrizioni} iscrizioni</p>
                    <p class="text-[11px] text-emerald-800 mt-1">Accesso protetto da login admin e RLS.</p>
                </div>
                <div class="rounded-2xl border ${hasPrint ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'} p-4">
                    <p class="text-[10px] font-black uppercase tracking-widest ${hasPrint ? 'text-emerald-800' : 'text-amber-800'}">Stampe</p>
                    <p class="text-sm font-black text-slate-900 mt-1">${hasPrint ? 'Motore A4 attivo' : 'Da verificare'}</p>
                    <p class="text-[11px] ${hasPrint ? 'text-emerald-800' : 'text-amber-800'} mt-1">Attestati, test e registri mantenuti stabili.</p>
                </div>
                <div class="rounded-2xl border ${hasBackup ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'} p-4">
                    <p class="text-[10px] font-black uppercase tracking-widest ${hasBackup ? 'text-emerald-800' : 'text-amber-800'}">Backup</p>
                    <p class="text-sm font-black text-slate-900 mt-1">${hasBackup ? 'ZIP completo disponibile' : 'Modulo non caricato'}</p>
                    <p class="text-[11px] ${hasBackup ? 'text-emerald-800' : 'text-amber-800'} mt-1">Usa Migrazione → Scarica Backup prima di interventi importanti.</p>
                </div>
            </div>`;
    };

    window.dashboardOpenProject = async function(projectId) {
        await window.loadModule('progetti');
        if (!projectId) return;
        let tries = 0;
        while ((!window.progettiList || !window.progettiList.find(p => p.id === projectId)) && tries < 12) {
            await new Promise(resolve => setTimeout(resolve, 150));
            tries++;
        }
        const row = document.querySelector(`tr[data-project-id="${projectId}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
            setTimeout(() => row.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50'), 3000);
        }
        if (typeof window.apriPopupProgettoById === 'function') {
            try { await window.apriPopupProgettoById(projectId, 'dashboard'); } catch (e) { console.warn('Apertura progetto da dashboard non riuscita', e); }
        }
    };

    window.loadDashboardStats = async function() {
        const loading = document.getElementById('dash-action-plan');
        if (loading) loading.innerHTML = '<div class="p-5 text-center text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento dashboard...</div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const fetchCount = async (table) => {
                try {
                    const { count, error } = await window.supabaseClient.from(table).select('*', { count: 'exact', head: true });
                    if (error) return 0;
                    return count || 0;
                } catch (e) { return 0; }
            };

            const [az, cor, doc, prog, projects] = await Promise.all([
                fetchCount('aziende'),
                fetchCount('corsisti'),
                fetchCount('docenti'),
                fetchCount('progetti'),
                typeof window.getProgetti === 'function' ? window.getProgetti() : Promise.resolve([])
            ]);

            const projectIds = (projects || []).map(p => p.id).filter(Boolean);
            const iscrizioniMap = projectIds.length
                ? (window.getIscrizioniPerProgetti ? await window.getIscrizioniPerProgetti(projectIds) : await window.buildIscrizioniMapFallback(projects || []))
                : {};

            const statuses = (projects || []).map(p => projectStatus(p, iscrizioniMap[p.id] || []));
            const counts = {
                aziende: az,
                corsisti: cor,
                docenti: doc,
                progetti: prog,
                ready: statuses.filter(s => s.key === 'ready').length,
                draft: statuses.filter(s => s.key === 'draft').length,
                toclose: statuses.filter(s => s.key === 'toclose').length,
                closed: statuses.filter(s => s.key === 'closed').length
            };

            setText('dash-aziende', counts.aziende);
            setText('dash-corsisti', counts.corsisti);
            setText('dash-docenti', counts.docenti);
            setText('dash-progetti', counts.progetti);
            setText('dash-ready-print', counts.ready);
            setText('dash-draft-courses', counts.draft);
            setText('dash-to-close', counts.toclose);
            setText('dash-closed-courses', counts.closed);

            const grid = document.getElementById('dash-operational-grid');
            if (grid) {
                grid.innerHTML = [
                    statusCard({ id: 'dash-ready-print', title: 'Pronti stampa', value: counts.ready, subtitle: 'Corsi con dati minimi completi e iscritti presenti.', icon: 'printer-check', tone: 'blue', action: "window.loadModule('stampe')" }),
                    statusCard({ id: 'dash-to-close', title: 'Da chiudere', value: counts.toclose, subtitle: 'Corsi con data verifica trascorsa e non ancora archiviati.', icon: 'lock-keyhole', tone: 'amber', action: "window.loadModule('progetti')" }),
                    statusCard({ id: 'dash-draft-courses', title: 'Dati mancanti', value: counts.draft, subtitle: 'Progetti che richiedono completamento prima della stampa finale.', icon: 'clipboard-warning', tone: 'rose', action: "window.loadModule('progetti')" }),
                    statusCard({ id: 'dash-closed-courses', title: 'Archiviati', value: counts.closed, subtitle: 'Corsi chiusi e disponibili per consultazione archivio.', icon: 'archive', tone: 'emerald', action: "window.loadModule('archivio_corsi')" })
                ].join('');
            }

            renderActionPlan(projects || [], iscrizioniMap);
            renderProjectsOverview(projects || [], iscrizioniMap);
            renderSystemHealth(counts, projects || [], iscrizioniMap);

            if (typeof window.loadDashboardCompliance === 'function') {
                try { await window.loadDashboardCompliance(); } catch (e) { console.warn('Compliance dashboard non disponibile', e); }
            }
        } catch (e) {
            console.error('Errore dashboard pro', e);
            const box = document.getElementById('dash-action-plan');
            if (box) box.innerHTML = `<div class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 text-sm font-bold">Errore caricamento dashboard: ${esc(e.message || e)}</div>`;
        } finally {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };
})();
