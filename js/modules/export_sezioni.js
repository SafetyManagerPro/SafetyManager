// Export XLSX/PDF sezioni module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.injectSectionExportToolbar = function(moduleId) {
    const label = window.SECTION_EXPORT_LABELS[moduleId];
    const container = document.getElementById('app-content');
    if (!label || !container || document.getElementById('section-export-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'section-export-toolbar';
    toolbar.className = 'section-export-toolbar';
    toolbar.innerHTML = `
        <div>
            <p class="section-export-title">Esportazione / stampa sezione</p>
            <p class="text-xs text-slate-400 mt-1">${window.dashEscape ? window.dashEscape(label) : label} · Salvataggio Excel e stampa PDF</p>
        </div>
        <div class="section-export-actions">
            <button type="button" onclick="window.esportaSezioneExcel('${moduleId}')" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Esporta XLSX
            </button>
            <button type="button" onclick="window.stampaSezionePdf('${moduleId}')" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                <i data-lucide="printer" class="w-4 h-4"></i> Stampa PDF
            </button>
        </div>`;

    const header = container.querySelector('.border-b-2');
    if (header) header.insertAdjacentElement('afterend', toolbar);
    else container.prepend(toolbar);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.exportDateStamp = function() {
    return new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
};

window.exportSafeFilename = function(name) {
    return String(name || 'export').replace(/[^a-z0-9_\-]+/gi, '_').replace(/_+/g, '_');
};

window.getCorsoExportLabel = function(corsoId) {
    const c = window.DB_CORSI && window.DB_CORSI[corsoId];
    return c ? `[${c.code || corsoId}] ${c.t}` : (corsoId || '');
};

window.getIscrizioniExportMap = async function(projects) {
    const ids = (projects || []).map(p => p.id).filter(Boolean);
    if (!ids.length) return {};
    if (window.getIscrizioniPerProgetti) return await window.getIscrizioniPerProgetti(ids);
    return await window.buildIscrizioniMapFallback(projects || []);
};

window.getSectionExportSheets = async function(moduleId) {
    const fmt = (v) => v ? (window.formatDataToItalian ? window.formatDataToItalian(v) : v) : '';

    if (moduleId === 'aziende') {
        const rows = (await window.getAziende()).map(a => ({
            'Ragione sociale': a.ragione_sociale || '',
            'P.IVA / C.F.': a.piva_cf || '',
            'Indirizzo': a.indirizzo || '',
            'ATECO': a.ateco || '',
            'Referente': a.referente || '',
            'Data creazione': fmt(a.created_at ? String(a.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Aziende', rows }];
    }

    if (moduleId === 'corsisti') {
        const rows = (await window.getCorsisti()).map(c => ({
            'Nome e cognome': c.nome_cognome || '',
            'Codice fiscale': c.cf || '',
            'Nascita': c.luogo_data_nascita || '',
            'Mansione': c.mansione_storica || '',
            'Azienda': c.aziende?.ragione_sociale || '',
            'P.IVA azienda': c.aziende?.piva_cf || '',
            'ATECO': c.aziende?.ateco || '',
            'Cittadinanza': c.cittadinanza || '',
            'Studi scolastici in Italia': c.studi_scolastici_italia === null || c.studi_scolastici_italia === undefined ? 'Da verificare' : (c.studi_scolastici_italia ? 'Sì' : 'No'),
            'Test lingua italiana': window.getLinguaTestStatusMeta ? window.getLinguaTestStatusMeta(c.lingua_test_stato || 'non_richiesto').label : (c.lingua_test_stato || ''),
            'Data test lingua': fmt(c.lingua_test_data),
            'Parte 1 /10': c.lingua_test_parte1 ?? '',
            'Parte 2 /10': c.lingua_test_parte2 ?? '',
            'Parte 3 /10': c.lingua_test_parte3 ?? '',
            'Valutatore lingua': c.lingua_test_valutatore || '',
            'Link test compilato': c.lingua_test_documento_url || '',
            'Data creazione': fmt(c.created_at ? String(c.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Corsisti', rows }];
    }

    if (moduleId === 'docenti') {
        const rows = (await window.getDocenti()).map(d => ({
            'Nome e cognome': d.nome_cognome || '',
            'Codice fiscale': d.cf || '',
            'Luogo e data di nascita': d.luogo_data_nascita || '',
            'Qualifica': d.qualifica || '',
            'Email': d.email || '',
            'Telefono': d.telefono || '',
            'Data creazione': fmt(d.created_at ? String(d.created_at).slice(0,10) : '')
        }));
        return [{ name: 'Docenti', rows }];
    }

    if (moduleId === 'progetti') {
        const projects = await window.getProgetti();
        const iscrizioniMap = await window.getIscrizioniExportMap(projects);
        const projectRows = projects.map(p => {
            const iscritti = iscrizioniMap[p.id] || [];
            return {
                'Codice progetto': p.codice || '',
                'Corso': window.getCorsoExportLabel(p.corso_id),
                'Azienda committente': p.aziende?.ragione_sociale || '',
                'Soggetto formatore': p.ente_erogatore === 'azienda' ? 'Datore di lavoro' : 'Ente / associazione',
                'Modalità': p.modalita || '',
                'Data inizio': fmt(p.data_inizio),
                'Data esame': fmt(p.data_esame),
                'Sede': p.sede || '',
                'Responsabile progetto': p.resp_progetto || '',
                'Responsabile corso': p.resp_corso || '',
                'Stato corso': p.stato_corso || 'aperto',
                'Chiuso il': fmt(p.chiuso_at),
                'Link documenti firmati': p.documenti_firmati_url || '',
                'Numero corsisti': iscritti.length
            };
        });
        const iscrittiRows = projects.flatMap(p => (iscrizioniMap[p.id] || []).map(i => ({
            'Codice progetto': p.codice || '',
            'Corso': window.getCorsoExportLabel(p.corso_id),
            'Azienda committente': p.aziende?.ragione_sociale || '',
            'Corsista': i.corsisti?.nome_cognome || '',
            'Codice fiscale': i.corsisti?.cf || '',
            'Mansione': i.mansione_storica || i.corsisti?.mansione_storica || '',
            'ID attestato': i.id_certificato || '',
            'Esito': i.esito || '',
            'Scadenza': fmt(i.data_scadenza),
            'Frequenza %': i.percentuale_frequenza ?? '',
            'Voto test': i.voto_test ?? '',
            'Esito pratica': i.esito_pratica || ''
        })));
        return [{ name: 'Progetti', rows: projectRows }, { name: 'Iscrizioni', rows: iscrittiRows }];
    }

    if (moduleId === 'archivio_corsi') {
        const projects = await window.getProgetti();
        const iscrizioniMap = await window.getIscrizioniExportMap(projects);
        const rows = [];
        projects.forEach(p => {
            const iscritti = iscrizioniMap[p.id] || [];
            if (!iscritti.length) {
                rows.push({
                    'Azienda / Ente': p.aziende?.ragione_sociale || '',
                    'Codice progetto': p.codice || '',
                    'Corso': window.getCorsoExportLabel(p.corso_id),
                    'Data esame': fmt(p.data_esame),
                    'Stato corso': p.stato_corso || 'aperto',
                    'Corsista': '',
                    'Codice fiscale': '',
                    'Mansione': '',
                    'ID attestato': '',
                    'Scadenza': '',
                    'Documenti firmati': p.documenti_firmati_url || ''
                });
            } else {
                iscritti.forEach(i => rows.push({
                    'Azienda / Ente': p.aziende?.ragione_sociale || '',
                    'Codice progetto': p.codice || '',
                    'Corso': window.getCorsoExportLabel(p.corso_id),
                    'Data esame': fmt(p.data_esame),
                    'Stato corso': p.stato_corso || 'aperto',
                    'Corsista': i.corsisti?.nome_cognome || '',
                    'Codice fiscale': i.corsisti?.cf || '',
                    'Mansione': i.mansione_storica || i.corsisti?.mansione_storica || '',
                    'ID attestato': i.id_certificato || '',
                    'Scadenza': fmt(i.data_scadenza),
                    'Documenti firmati': p.documenti_firmati_url || ''
                }));
            }
        });
        return [{ name: 'Archivio', rows }];
    }

    if (moduleId === 'scadenze') {
        const list = window.allScadenzeList && window.allScadenzeList.length ? window.allScadenzeList : await window.fetchScadenzeData();
        const today = new Date(); today.setHours(0,0,0,0);
        const rows = list.map(i => {
            const d = i.data_scadenza ? new Date(i.data_scadenza) : null;
            const days = d ? Math.ceil((d.getTime() - today.getTime()) / 86400000) : '';
            return {
                'Corsista': i.corsisti?.nome_cognome || '',
                'Azienda': i.corsisti?.aziende?.ragione_sociale || '',
                'Referente': i.corsisti?.aziende?.referente || '',
                'Corso': window.getCorsoExportLabel(i.progetti?.corso_id),
                'Data esame': fmt(i.progetti?.data_esame),
                'Data scadenza': fmt(i.data_scadenza),
                'Giorni alla scadenza': days,
                'ID attestato': i.id_certificato || ''
            };
        });
        return [{ name: 'Scadenze', rows }];
    }

    return [];
};

window.esportaSezioneExcel = async function(moduleId) {
    try {
        const label = window.SECTION_EXPORT_LABELS[moduleId] || moduleId || 'export';
        const sheets = await window.getSectionExportSheets(moduleId);
        if (!sheets.length || sheets.every(s => !s.rows || !s.rows.length)) return alert('Nessun dato da esportare.');

        if (typeof XLSX === 'undefined') {
            return alert('Libreria Excel non caricata. Verifica la connessione internet o ricarica la pagina.');
        }
        const wb = XLSX.utils.book_new();
        sheets.forEach(s => {
            const rows = s.rows && s.rows.length ? s.rows : [{ 'Nessun dato': '' }];
            const ws = XLSX.utils.json_to_sheet(rows);
            const headers = Object.keys(rows[0] || {});
            ws['!cols'] = headers.map(h => {
                const maxLen = Math.min(42, Math.max(String(h).length, ...rows.slice(0, 200).map(r => String(r[h] ?? '').length)) + 2);
                return { wch: maxLen };
            });
            XLSX.utils.book_append_sheet(wb, ws, (s.name || 'Dati').slice(0,31));
        });
        XLSX.writeFile(wb, `${window.exportSafeFilename(label)}_${window.exportDateStamp()}.xlsx`);
    } catch (e) {
        console.error(e);
        alert('Errore esportazione Excel: ' + (e.message || e));
    }
};

window.exportRowsToHtmlTable = function(rows) {
    if (!rows || !rows.length) return '<p>Nessun dato.</p>';
    const headers = Object.keys(rows[0]);
    return `<table><thead><tr>${headers.map(h => `<th>${window.dashEscape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${window.dashEscape(r[h] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

window.stampaSezionePdf = async function(moduleId) {
    try {
        const label = window.SECTION_EXPORT_LABELS[moduleId] || moduleId || 'sezione';
        const sheets = await window.getSectionExportSheets(moduleId);
        if (!sheets.length) return alert('Nessun dato da stampare.');
        const printArea = document.getElementById('print-area-temp');
        printArea.innerHTML = `
            <div class="export-print-page">
                <h1>${window.dashEscape(label)}</h1>
                <p style="font-size:8pt;color:#64748b;margin-bottom:6mm;">Esportazione generata il ${new Date().toLocaleString('it-IT')}</p>
                ${sheets.map(s => `<h2>${window.dashEscape(s.name || 'Dati')}</h2>${window.exportRowsToHtmlTable(s.rows || [])}`).join('')}
            </div>`;
        document.body.classList.add('is-printing-temp');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-temp');
            printArea.innerHTML = '';
        }, 500);
    } catch (e) {
        console.error(e);
        alert('Errore stampa PDF: ' + (e.message || e));
    }
};


// ==========================================
// COLLAUDO GENERALE SISTEMA
// ==========================================
window.collaudoReport = null;
