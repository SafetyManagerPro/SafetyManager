// Scadenze module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.fetchScadenzeData = async function() {
    const { data, error } = await supabaseClient
        .from('iscrizioni')
        .select(`
            id,
            partecipazione_stato,
            partecipazione_motivo,
            data_scadenza,
            id_certificato,
            corsisti (
                nome_cognome,
                aziende (
                    ragione_sociale,
                    referente
                )
            ),
            progetti (
                corso_id,
                data_esame
            )
        `)
        .not('data_scadenza', 'is', null)
        .order('data_scadenza', { ascending: true });

    if (error) {
        console.error("Errore recupero scadenze", error);
        return [];
    }
    return data || [];
};

window.loadScadenzeTable = async function() {
    const tbody = document.getElementById('tabella-scadenze');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400 italic"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2"></i> Caricamento scadenze in corso...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    if (window.allScadenzeList.length === 0) {
        window.allScadenzeList = await window.fetchScadenzeData();
    }

    window.renderScadenzeTable();
};

window.renderScadenzeTable = function() {
    const tbody = document.getElementById('tabella-scadenze');
    if(!tbody) return;

    const filterGiorni = parseInt(document.getElementById('filter-giorni').value, 10);
    const searchTxt = document.getElementById('search-scadenze').value.toLowerCase();

    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    
    let targetDate = new Date(oggi);
    targetDate.setDate(targetDate.getDate() + filterGiorni);

    let filtered = window.allScadenzeList.filter(isc => {
        if(!isc.data_scadenza) return false;
        let dScad = new Date(isc.data_scadenza);
        if (filterGiorni !== 9999) {
            if (dScad > targetDate) return false;
        }
        return true;
    });

    if (searchTxt) {
        filtered = filtered.filter(isc => {
            const corsista = isc.corsisti?.nome_cognome?.toLowerCase() || '';
            const azienda = isc.corsisti?.aziende?.ragione_sociale?.toLowerCase() || '';
            const corsoId = isc.progetti?.corso_id || '';
            const nomeCorso = window.DB_CORSI[corsoId] ? window.DB_CORSI[corsoId].t.toLowerCase() : corsoId.toLowerCase();
            return corsista.includes(searchTxt) || azienda.includes(searchTxt) || nomeCorso.includes(searchTxt);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500 italic">Nessuna scadenza trovata per il periodo selezionato.</td></tr>';
        return;
    }

    let html = '';
    filtered.forEach(isc => {
        const corsista = isc.corsisti ? isc.corsisti.nome_cognome : 'Sconosciuto';
        const aziendaObj = isc.corsisti && isc.corsisti.aziende ? isc.corsisti.aziende : null;
        const azienda = aziendaObj ? aziendaObj.ragione_sociale : 'Privato';
        const contatti = aziendaObj && aziendaObj.referente ? aziendaObj.referente : 'Nessun recapito';
        
        const corsoId = isc.progetti ? isc.progetti.corso_id : '';
        const nomeCorso = window.DB_CORSI[corsoId] ? window.DB_CORSI[corsoId].t : corsoId;
        const dataEsame = isc.progetti && isc.progetti.data_esame ? window.formatDataToItalian(isc.progetti.data_esame) : '-';
        const dataScad = window.formatDataToItalian(isc.data_scadenza);
        const flagged=window.SafetyEnrollmentStatus?.flagged(isc)||false;

        let dScad = new Date(isc.data_scadenza);
        let timeDiff = dScad.getTime() - oggi.getTime();
        let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        let statusBadge = '';
        if (daysDiff < 0) {
            statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-red-200">Scaduto da ${Math.abs(daysDiff)} gg</span>`;
        } else if (daysDiff <= 30) {
            statusBadge = `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-orange-200">Scade tra ${daysDiff} gg</span>`;
        } else if (daysDiff <= 60) {
            statusBadge = `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-amber-200">Scade tra ${daysDiff} gg</span>`;
        } else {
            statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-[9px] uppercase border border-emerald-200">Attivo</span>`;
        }

        if(flagged)statusBadge=`<span role="status" class="bg-rose-700 text-white px-2 py-1 rounded font-black text-[10px]">⚠ ${window.SafetyEnrollmentStatus.label(isc)} · Scadenza non valida</span>`;
        html += `
            <tr class="${flagged?'bg-rose-100 border-rose-500':'hover:bg-slate-50 border-slate-100'} border-b transition-colors text-xs">
                <td class="p-3 font-bold text-slate-800">${corsista}</td>
                <td class="p-3 ${flagged?'text-rose-900 font-black':'text-slate-600 font-semibold'} max-w-[200px]" title="${nomeCorso}">${nomeCorso}${flagged?' ⚠':''}</td>
                <td class="p-3 text-center text-slate-500 font-mono text-[10px]">${dataEsame}</td>
                <td class="p-3 text-center font-bold text-red-600 font-mono">${dataScad}<br><div class="mt-1">${statusBadge}</div></td>
                <td class="p-3 font-bold text-blue-900 text-[10px] uppercase">${azienda}</td>
                <td class="p-3 text-slate-500 text-[10px] italic">${contatti}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.refreshScadenze = async function() {
    window.allScadenzeList = [];
    await window.loadScadenzeTable();
};

// ==========================================
// DATA MIGRATION WIZARD (CSV / JSON ETL)
// ==========================================
window.migParsedData = [];
window.migHeaders = [];

window.DB_TARGETS = [
    { id: 'az_ragione', label: 'Azienda: Ragione Sociale', aliases: ['azienda', 'ragione sociale', 'impresa', 'cliente'] },
    { id: 'az_piva', label: 'Azienda: P.IVA / C.F.', aliases: ['piva', 'partita iva', 'cf azienda', 'c.f. azienda'] },
    { id: 'az_ind', label: 'Azienda: Indirizzo Sede', aliases: ['indirizzo', 'sede', 'indirizzo azienda'] },
    { id: 'cor_nome', label: 'Allievo: Nome e Cognome', aliases: ['nome', 'cognome', 'allievo', 'corsista', 'dipendente', 'lavoratore'] },
    { id: 'cor_cf', label: 'Allievo: Codice Fiscale', aliases: ['cf', 'codice fiscale', 'c.f.'] },
    { id: 'cor_nascita', label: 'Allievo: Luogo/Data Nascita', aliases: ['nascita', 'nato a', 'data di nascita', 'luogo di nascita'] },
    { id: 'cor_mans', label: 'Allievo: Mansione', aliases: ['mansione', 'qualifica', 'ruolo', 'lavoro'] },
    { id: 'doc_nome', label: 'Docente Formatore', aliases: ['docente', 'formatore', 'insegnante'] },
    { id: 'prg_codice', label: 'Corso: Codice Riferimento', aliases: ['codice', 'codice corso', 'id corso', 'rif'] },
    { id: 'prg_corso', label: 'Corso: Tipologia (es. RLS, Basso, ecc)', aliases: ['corso', 'tipo corso', 'titolo', 'tipologia'] },
    { id: 'prg_data', label: 'Corso: Data Esame / Fine', aliases: ['data', 'data esame', 'data fine', 'data attestato'] },
    { id: 'isc_cert', label: 'Attestato: ID Protocollo', aliases: ['certificato', 'numero attestato', 'id', 'protocollo'] },
    { id: 'isc_scad', label: 'Attestato: Data Scadenza', aliases: ['scadenza', 'data scadenza', 'valido fino'] }
];
