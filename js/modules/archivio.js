// Archivio corsi module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.loadArchivioCorsi = async function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 font-bold uppercase"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Caricamento archivio...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const [progetti, aziende] = await Promise.all([window.getProgetti(), window.getAziende()]);
    window.archivioCorsiState.progetti = progetti || [];
    window.archivioCorsiState.aziende = aziende || [];
    const ids = window.archivioCorsiState.progetti.map(p => p.id).filter(Boolean);
    window.archivioCorsiState.iscrizioniByProject = window.getIscrizioniPerProgetti
        ? await window.getIscrizioniPerProgetti(ids)
        : await window.buildIscrizioniMapFallback(window.archivioCorsiState.progetti);

    window.renderArchivioCorsi();
};

window.renderArchivioCorsi = function() {
    const container = document.getElementById('archivio-corsi-container');
    if (!container) return;

    const q = (document.getElementById('archivio-search')?.value || '').toLowerCase();
    const stato = document.getElementById('archivio-filter-stato')?.value || '';
    const progetti = window.archivioCorsiState.progetti || [];
    const aziende = window.archivioCorsiState.aziende || [];
    const iscrizioniByProject = window.archivioCorsiState.iscrizioniByProject || {};

    const groups = [];
    aziende.forEach(az => {
        const ps = progetti.filter(p => p.azienda_id === az.id && (!stato || (p.stato_corso || 'aperto') === stato));
        if (!ps.length) return;
        groups.push({ type: 'azienda', title: az.ragione_sociale, subtitle: `${az.piva_cf || ''} ${az.ateco ? '· ATECO ' + az.ateco : ''}`, progetti: ps });
    });

    const enteProjects = progetti.filter(p => p.ente_erogatore === 'ente' && (!stato || (p.stato_corso || 'aperto') === stato));
    if (enteProjects.length) {
        groups.unshift({ type: 'ente', title: window.getVal('cfg-ente') || 'Ente formatore / erogatore', subtitle: 'Corsi erogati come associazione/ente di diretta emanazione', progetti: enteProjects });
    }

    const filtered = groups.map(g => {
        const ps = g.progetti.filter(p => {
            const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
            const iscritti = iscrizioniByProject[p.id] || [];
            const hay = [g.title, g.subtitle, p.codice, course, p.aziende?.ragione_sociale, ...iscritti.map(i => `${i.corsisti?.nome_cognome || ''} ${i.corsisti?.cf || ''}`)].join(' ').toLowerCase();
            return !q || hay.includes(q);
        });
        return { ...g, progetti: ps };
    }).filter(g => g.progetti.length);

    if (!filtered.length) {
        container.innerHTML = '<div class="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 font-bold uppercase">Nessun corso trovato per i filtri selezionati.</div>';
        return;
    }

    container.innerHTML = filtered.map(g => `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="p-4 ${g.type === 'ente' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'} border-b flex justify-between items-start gap-4">
                <div>
                    <p class="font-black uppercase ${g.type === 'ente' ? 'text-emerald-900' : 'text-blue-900'}">${window.dashEscape(g.title)}</p>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">${window.dashEscape(g.subtitle || '')}</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-700">${g.progetti.length} corsi</span>
            </div>
            <div class="divide-y divide-slate-100">
                ${g.progetti.map(p => {
                    const course = window.DB_CORSI[p.corso_id]?.t || p.corso_id;
                    const iscritti = iscrizioniByProject[p.id] || [];
                    const stato = p.stato_corso || 'aperto';
                    const badge = stato === 'chiuso' ? 'bg-slate-900 text-white' : (stato === 'svolto' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800');
                    return `<div class="p-4">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                                <button onclick="window.apriPopupProgettoById('${p.id}', 'progetti')" class="font-mono text-rose-700 hover:underline font-black text-xs">${window.dashEscape(p.codice || '')}</button>
                                <p class="font-black text-slate-900 uppercase text-sm mt-1">${window.dashEscape(course)}</p>
                                <p class="text-[10px] text-slate-500 uppercase mt-0.5">Esame: ${window.formatDataToItalian(p.data_esame)} · Corsisti: ${iscritti.length}</p>
                                ${p.documenti_firmati_url ? `<a href="${window.dashEscape(p.documenti_firmati_url)}" target="_blank" class="inline-block mt-2 text-[10px] font-black text-blue-700 hover:underline uppercase">Apri scansioni documenti firmati</a>` : ''}
                            </div>
                            <span class="px-3 py-1 rounded-full ${badge} text-[9px] font-black uppercase self-start">${window.dashEscape(stato)}</span>
                        </div>
                        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            ${iscritti.length ? iscritti.map(isc => `<div class="border border-slate-200 bg-slate-50 rounded-lg p-2">
                                <p class="font-black uppercase text-slate-900 text-[11px]">${window.dashEscape(isc.corsisti?.nome_cognome || '-')}</p>
                                <p class="font-mono text-[9px] text-slate-500">${window.dashEscape(isc.corsisti?.cf || '-')}</p>
                                <p class="text-[9px] text-slate-500 mt-1">${window.dashEscape(isc.mansione_storica || isc.corsisti?.mansione_storica || '-')}</p>
                            </div>`).join('') : '<div class="text-[10px] text-red-600 font-bold uppercase">Nessun corsista abbinato</div>'}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
};


// ==========================================
// STAMPA PDF COMPLETA PROGETTO + ATTESTATI
// ==========================================
