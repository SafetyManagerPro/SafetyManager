(function () {
    'use strict';

    const TEMPLATE_URL = 'assets/templates/Kit_attivazione_corso_nuova_azienda.xlsx';
    const PENDING_KEY = 'SafetyManager.step69.kitCliente.pending';
    const REQUIRED_SHEETS = ['Dati Azienda', 'Corsisti e Corsi'];
    let currentAnalysis = null;

    const text = value => String(value ?? '').trim();
    const norm = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normId = value => text(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const esc = value => typeof window.dashEscape === 'function'
        ? window.dashEscape(text(value))
        : text(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const todayIso = () => new Date().toISOString().slice(0, 10);

    function requestId() {
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `KIT-${stamp}-${random}`;
    }

    function toIsoDate(value) {
        if (!value) return '';
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
        if (typeof value === 'number' && window.XLSX?.SSF?.parse_date_code) {
            const parsed = window.XLSX.SSF.parse_date_code(value);
            if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
        const raw = text(value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        const ita = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
        if (ita) return `${ita[3]}-${ita[2].padStart(2, '0')}-${ita[1].padStart(2, '0')}`;
        return raw;
    }

    function getPending() {
        try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); }
        catch (_) { return null; }
    }

    function setPending(payload) {
        if (payload) localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
        else localStorage.removeItem(PENDING_KEY);
        renderPending();
    }

    function activeCourseEntries() {
        return typeof window.getActiveCorsiEntries === 'function'
            ? window.getActiveCorsiEntries()
            : Object.entries(window.DB_CORSI || {}).filter(([, course]) => !course?.deprecated);
    }

    function resolveCourse(value) {
        const raw = text(value);
        const bracket = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (bracket && window.DB_CORSI?.[bracket[1]] && !window.DB_CORSI[bracket[1]].deprecated) {
            return { id: bracket[1], title: window.DB_CORSI[bracket[1]].t || bracket[2] || bracket[1] };
        }
        const wanted = norm(raw);
        const hit = activeCourseEntries().find(([id, course]) => norm(course?.t) === wanted || norm(course?.code) === wanted || norm(id) === wanted);
        return hit ? { id: hit[0], title: hit[1]?.t || hit[0] } : null;
    }

    function setInlineCell(xml, reference, value) {
        const encoded = text(value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        const pattern = new RegExp(`<((?:\\w+:)?c)\\b([^>]*\\br="${reference}"[^>]*?)(?:\\s*\\/\\>|>[\\s\\S]*?<\\/\\1>)`);
        if (!pattern.test(xml)) return xml;
        return xml.replace(pattern, (_match, tagName, attrs) => {
            const cleanAttrs = attrs.replace(/\s+t="[^"]*"/g, '');
            const prefix = tagName.includes(':') ? tagName.split(':')[0] + ':' : '';
            return `<${tagName}${cleanAttrs} t="str"><${prefix}v>${encoded}</${prefix}v></${tagName}>`;
        });
    }

    function companyTemplateValues(company, mode, kitId) {
        return {
            B5: mode === 'existing' ? 'Azienda già presente' : 'Nuova azienda',
            B6: kitId,
            B7: company?.id || '',
            B8: company?.ragione_sociale || '',
            B10: company?.piva_cf || '',
            B11: company?.ateco || '',
            B13: company?.indirizzo || '',
            B14: company?.sede_operativa || '',
            B18: company?.referente || '',
            B38: todayIso(),
            B39: 'Da confermare'
        };
    }

    function safeFilePart(value) {
        return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'nuova_azienda';
    }

    window.syncKitCompanyMode = function () {
        const mode = document.getElementById('kit-company-mode')?.value || 'new';
        const box = document.getElementById('kit-company-select-box');
        if (box) box.classList.toggle('hidden', mode !== 'existing');
    };

    window.generaKitClienteXlsx = async function () {
        if (!window.JSZip) return alert('Libreria XLSX/ZIP non disponibile. Ricarica la pagina e riprova.');
        const mode = document.getElementById('kit-company-mode')?.value || 'new';
        const companyId = document.getElementById('kit-company-select')?.value || '';
        const company = mode === 'existing' ? (window.aziendeList || []).find(item => item.id === companyId) : null;
        if (mode === 'existing' && !company) return alert('Seleziona l’azienda da precompilare.');

        const kitId = document.getElementById('kit-request-id')?.value || requestId();
        try {
            const response = await fetch(TEMPLATE_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Modello non disponibile (HTTP ${response.status})`);
            const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
            const sheetPath = 'xl/worksheets/sheet1.xml';
            let xml = await zip.file(sheetPath).async('string');
            Object.entries(companyTemplateValues(company, mode, kitId)).forEach(([cell, value]) => { xml = setInlineCell(xml, cell, value); });
            zip.file(sheetPath, xml);
            const bytes = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 7 } });
            const href = URL.createObjectURL(bytes);
            const link = document.createElement('a');
            link.href = href;
            link.download = `Kit_attivazione_corso_${safeFilePart(company?.ragione_sociale)}_${kitId}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(href);
        } catch (error) {
            console.error('Generazione kit XLSX:', error);
            alert(`Impossibile generare il kit: ${error.message || error}`);
        }
    };

    function companyFieldsFromSheet(sheet) {
        const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        const fields = {};
        rows.slice(4).forEach(row => {
            const key = text(row[0]);
            if (key) fields[key] = row[1];
        });
        return fields;
    }

    function participantRowsFromSheet(sheet) {
        const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
        const headers = (rows[3] || []).map(header => norm(text(header).replace(/\*/g, '')));
        const index = name => headers.indexOf(norm(name));
        const result = [];
        rows.slice(4).forEach((row, rowIndex) => {
            const get = name => row[index(name)] ?? '';
            const item = {
                excelRow: rowIndex + 5,
                nome: text(get('Nome e cognome')),
                cf: normId(get('Codice fiscale')),
                nascita: text(get('Luogo e data di nascita')),
                mansione: text(get('Mansione')),
                sedeLavoro: text(get('Sede di lavoro')),
                corsoRaw: text(get('Corso da frequentare')),
                tipoPercorso: text(get('Tipo percorso')),
                attestatoPrecedente: text(get('Attestato precedente disponibile')),
                attestatoPrecedenteData: toIsoDate(get('Data attestato precedente')),
                attestatoPrecedenteScadenza: toIsoDate(get('Scadenza attestato')),
                attestatoPrecedenteEnte: text(get('Ente rilascio attestato')),
                lingua: text(get('Comprensione lingua italiana')),
                supportoLingua: text(get('Supporto linguistico necessario')),
                email: text(get('Email')),
                telefono: text(get('Telefono')),
                note: text(get('Note'))
            };
            if (item.nome || item.cf || item.mansione || item.corsoRaw) result.push(item);
        });
        return result;
    }

    function findCompany(fields, companies) {
        const id = text(fields['ID azienda SafetyManager']);
        const fiscal = normId(fields['Partita IVA / Codice fiscale']);
        const name = norm(fields['Ragione sociale']);
        return companies.find(item => id && item.id === id)
            || companies.find(item => fiscal && normId(item.piva_cf) === fiscal)
            || companies.find(item => name && norm(item.ragione_sociale) === name)
            || null;
    }

    function buildAnalysis(workbook, companies, participantsDb) {
        const issues = [];
        const warnings = [];
        const missingSheets = REQUIRED_SHEETS.filter(name => !workbook.Sheets[name]);
        if (missingSheets.length) issues.push(`Fogli mancanti o rinominati: ${missingSheets.join(', ')}.`);
        if (issues.length) return { valid: false, issues, warnings, fields: {}, participants: [], companyMatch: null, groups: [] };

        const fields = companyFieldsFromSheet(workbook.Sheets['Dati Azienda']);
        const participants = participantRowsFromSheet(workbook.Sheets['Corsisti e Corsi']);
        const type = norm(fields['Tipo richiesta']);
        const isExistingRequest = type.includes('gia presente');
        const companyMatch = findCompany(fields, companies);

        if (!type.includes('nuova azienda') && !isExistingRequest) issues.push('Tipo richiesta non valido.');
        if (!text(fields['Ragione sociale'])) issues.push('Ragione sociale mancante.');
        if (!text(fields['Partita IVA / Codice fiscale'])) issues.push('Partita IVA / Codice fiscale azienda mancante.');
        if (!text(fields['Codice ATECO'])) warnings.push('Codice ATECO non compilato.');
        if (!text(fields['Referente formazione / Legale rappresentante'])) warnings.push('Referente formazione / Legale rappresentante non compilato.');
        if (norm(fields['Dichiarazione correttezza dati']) !== 'si') issues.push('La dichiarazione di correttezza dati deve essere impostata su “Sì”.');
        if (isExistingRequest && !companyMatch) issues.push('L’azienda è indicata come già presente, ma non è stata riconosciuta nel database.');
        if (!isExistingRequest && companyMatch) warnings.push(`L’azienda risulta già presente come “${companyMatch.ragione_sociale}”: sarà riutilizzata senza creare un doppione.`);
        if (!participants.length) issues.push('Non risultano corsisti/corsi compilati nel secondo foglio.');

        const exactPairs = new Set();
        participants.forEach(item => {
            const prefix = `Riga ${item.excelRow}`;
            if (!item.nome) issues.push(`${prefix}: nome e cognome mancanti.`);
            if (!item.cf) issues.push(`${prefix}: codice fiscale mancante.`);
            else if (item.cf.length < 11) warnings.push(`${prefix}: verificare il codice fiscale “${item.cf}”.`);
            if (!item.mansione) issues.push(`${prefix}: mansione mancante.`);
            if (!item.corsoRaw) issues.push(`${prefix}: corso da frequentare mancante.`);
            item.course = resolveCourse(item.corsoRaw);
            if (item.corsoRaw && !item.course) issues.push(`${prefix}: corso non riconosciuto (“${item.corsoRaw}”).`);
            if (item.cf && item.course) {
                const pair = `${item.cf}|${item.course.id}`;
                if (exactPairs.has(pair)) issues.push(`${prefix}: stessa persona e stesso corso già indicati in un’altra riga.`);
                exactPairs.add(pair);
            }
            item.existing = participantsDb.find(person => normId(person.cf) === item.cf) || null;
            if (item.existing?.azienda_id && (!companyMatch || item.existing.azienda_id !== companyMatch.id)) {
                issues.push(`${prefix}: ${item.nome} è già associato a un’altra azienda. Correggi prima l’anagrafica in SafetyManager per evitare un collegamento errato.`);
            }
        });

        const groupMap = {};
        participants.filter(item => item.course).forEach(item => {
            const id = item.course.id;
            if (!groupMap[id]) groupMap[id] = { corsoId: id, titolo: item.course.title, rows: [] };
            groupMap[id].rows.push(item);
        });
        return { valid: issues.length === 0, issues, warnings, fields, participants, companyMatch, isExistingRequest, groups: Object.values(groupMap) };
    }

    function renderAnalysis(analysis) {
        const box = document.getElementById('kit-analysis-summary');
        const confirmBox = document.getElementById('kit-import-confirm-box');
        const confirm = document.getElementById('kit-import-confirm');
        if (!box) return;
        const companyName = analysis.companyMatch?.ragione_sociale || analysis.fields?.['Ragione sociale'] || '-';
        const issuesHtml = analysis.issues.length
            ? `<div class="rounded-lg border border-red-200 bg-red-50 p-3"><p class="font-black text-red-800 uppercase mb-1">Da correggere (${analysis.issues.length})</p><ul class="list-disc ml-5 space-y-1 text-red-800">${analysis.issues.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`
            : '<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 font-black text-emerald-800 uppercase">File valido per l’importazione</div>';
        const warningsHtml = analysis.warnings.length
            ? `<div class="rounded-lg border border-amber-200 bg-amber-50 p-3"><p class="font-black text-amber-900 uppercase mb-1">Avvisi (${analysis.warnings.length})</p><ul class="list-disc ml-5 space-y-1 text-amber-900">${analysis.warnings.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
        const groupsHtml = analysis.groups.map(group => `<div class="rounded-lg border border-slate-200 bg-white p-3"><p class="font-black text-slate-800">${esc(group.titolo)}</p><p class="text-[10px] text-slate-500 mt-1">${group.rows.length} partecipanti</p></div>`).join('');
        const newParticipants = analysis.participants.filter(item => !item.existing).length;
        box.innerHTML = `<div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div class="rounded-lg bg-slate-900 text-white p-3"><p class="text-[9px] uppercase text-slate-300">Azienda</p><p class="font-black text-xs mt-1">${esc(companyName)}</p><p class="text-[9px] text-cyan-300 mt-1">${analysis.companyMatch ? 'Già presente' : 'Da creare'}</p></div>
                <div class="rounded-lg bg-slate-900 text-white p-3"><p class="text-[9px] uppercase text-slate-300">Corsisti</p><p class="font-black text-xl mt-1">${analysis.participants.length}</p><p class="text-[9px] text-cyan-300">${newParticipants} nuovi · ${analysis.participants.length - newParticipants} già presenti</p></div>
            </div>
            ${issuesHtml}${warningsHtml}
            ${analysis.groups.length ? `<div><p class="font-black uppercase text-[10px] text-slate-600 mb-2">Corsi richiesti</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${groupsHtml}</div></div>` : ''}
        </div>`;
        if (confirmBox) {
            confirmBox.classList.toggle('hidden', !analysis.valid);
            confirmBox.classList.toggle('flex', analysis.valid);
        }
        if (confirm) confirm.checked = false;
        window.syncKitImportButton();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    window.analizzaKitClienteXlsx = async function () {
        const file = document.getElementById('kit-file-input')?.files?.[0];
        if (!file) return alert('Seleziona il file XLSX restituito dal cliente.');
        if (!window.XLSX) return alert('Libreria XLSX non disponibile. Ricarica la pagina e riprova.');
        try {
            const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
            const [companies, participantsDb] = await Promise.all([window.getAziende(), window.getCorsisti()]);
            window.aziendeList = companies;
            window.corsistiList = participantsDb;
            currentAnalysis = buildAnalysis(workbook, companies, participantsDb);
            window.kitClienteAnalysis = currentAnalysis;
            renderAnalysis(currentAnalysis);
        } catch (error) {
            console.error('Analisi kit XLSX:', error);
            currentAnalysis = null;
            alert(`File non leggibile o non conforme: ${error.message || error}`);
        }
    };

    window.syncKitImportButton = function () {
        const button = document.getElementById('kit-import-button');
        const confirmed = document.getElementById('kit-import-confirm')?.checked;
        if (button) button.disabled = !(currentAnalysis?.valid && confirmed);
    };

    function companyRecord(fields) {
        return {
            ragione_sociale: text(fields['Ragione sociale']),
            piva_cf: text(fields['Partita IVA / Codice fiscale']),
            indirizzo: text(fields['Sede legale']),
            sede_operativa: text(fields['Sede operativa interessata']),
            ateco: text(fields['Codice ATECO']),
            referente: text(fields['Referente formazione / Legale rappresentante'])
        };
    }

    function participantRecord(item, companyId) {
        return {
            nome_cognome: item.nome,
            cf: item.cf,
            luogo_data_nascita: item.nascita,
            mansione_storica: item.mansione,
            azienda_id: companyId
        };
    }

    window.importaKitClienteAnalizzato = async function () {
        if (!currentAnalysis?.valid) return alert('Analizza un file valido prima di importare.');
        if (!document.getElementById('kit-import-confirm')?.checked) return alert('Conferma di aver verificato i dati.');
        if (!confirm('Importare azienda e corsisti validati? I record già presenti non verranno sovrascritti.')) return;

        const button = document.getElementById('kit-import-button');
        if (button) { button.disabled = true; button.innerHTML = '<span class="animate-pulse">Importazione in corso...</span>'; }
        try {
            let company = currentAnalysis.companyMatch;
            if (!company) {
                const saved = await window.saveAzienda(companyRecord(currentAnalysis.fields));
                company = Array.isArray(saved) ? saved[0] : saved;
                if (!company?.id) throw new Error('Creazione azienda non riuscita.');
            }

            const participantsByCf = new Map((window.corsistiList || []).map(item => [normId(item.cf), item]));
            for (const item of currentAnalysis.participants) {
                if (participantsByCf.has(item.cf)) continue;
                const saved = await window.saveCorsistaData(participantRecord(item, company.id));
                const person = Array.isArray(saved) ? saved[0] : saved;
                if (!person?.id) throw new Error(`Creazione corsista non riuscita: ${item.nome}.`);
                participantsByCf.set(item.cf, person);
            }

            const fields = currentAnalysis.fields;
            const groups = currentAnalysis.groups.map(group => ({
                corsoId: group.corsoId,
                titolo: group.titolo,
                corsistaIds: [...new Set(group.rows.map(row => participantsByCf.get(row.cf)?.id).filter(Boolean))],
                tipoPercorso: group.rows[0]?.tipoPercorso || 'Da definire'
            }));
            const pending = {
                version: 1,
                importedAt: new Date().toISOString(),
                requestId: text(fields['ID richiesta SafetyManager']) || requestId(),
                aziendaId: company.id,
                aziendaNome: company.ragione_sociale,
                preferences: {
                    dataInizio: toIsoDate(fields['Data inizio preferita']),
                    dataFine: toIsoDate(fields['Data fine preferita']),
                    sede: text(fields['Sede corso proposta']) || text(fields['Sede operativa interessata']),
                    modalita: text(fields['Modalità preferita']),
                    esigenza: text(fields['Esigenza formativa / motivazione']),
                    attivita: text(fields['Descrizione attività']),
                    rischi: text(fields['Rischi aziendali pertinenti']),
                    disponibilita: text(fields['Giorni e orari disponibili']),
                    note: text(fields['Note'])
                },
                groups
            };
            window.aziendeList = await window.getAziende();
            window.corsistiList = await window.getCorsisti();
            setPending(pending);
            currentAnalysis = null;
            window.kitClienteAnalysis = null;
            document.getElementById('kit-file-input').value = '';
            document.getElementById('kit-import-confirm').checked = false;
            document.getElementById('kit-import-confirm-box').classList.add('hidden');
            document.getElementById('kit-analysis-summary').innerHTML = '<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><p class="font-black uppercase">Importazione completata</p><p class="mt-1">Azienda e corsisti sono stati collegati. Le richieste corso sono disponibili sotto come bozze operative.</p></div>';
            alert('Importazione completata. Ora apri ciascuna richiesta corso, completa il progetto e salvalo.');
        } catch (error) {
            console.error('Importazione kit:', error);
            alert(`Importazione interrotta: ${error.message || error}`);
        } finally {
            if (button) {
                button.innerHTML = '<i data-lucide="database-zap" class="w-4 h-4"></i> Importa dati validati';
                window.syncKitImportButton();
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    function renderPending() {
        const section = document.getElementById('kit-pending-section');
        const list = document.getElementById('kit-pending-list');
        if (!section || !list) return;
        const pending = getPending();
        if (!pending?.groups?.length) {
            section.classList.add('hidden');
            list.innerHTML = '';
            return;
        }
        section.classList.remove('hidden');
        list.innerHTML = pending.groups.map(group => `<article class="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p class="text-[9px] text-cyan-300 font-black uppercase">${esc(pending.requestId)}</p>
            <h3 class="text-white font-black text-sm mt-1 leading-tight">${esc(group.titolo)}</h3>
            <p class="text-[10px] text-slate-300 mt-2">${group.corsistaIds.length} corsisti · ${esc(group.tipoPercorso)}</p>
            <button type="button" onclick="window.apriBozzaProgettoKit('${esc(group.corsoId)}')" class="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2"><i data-lucide="external-link" class="w-4 h-4"></i> Completa progetto</button>
        </article>`).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function mapMode(value) {
        const key = norm(value);
        if (key.includes('videoconferenza')) return 'Videoconferenza Sincrona';
        if (key.includes('learning') || key.includes('asincrona')) return 'E-Learning (Asincrona)';
        if (key.includes('mista') || key.includes('blended')) return 'Mista (Blended)';
        return 'In Presenza Fisica';
    }

    window.apriBozzaProgettoKit = async function (courseId) {
        const pending = getPending();
        const group = pending?.groups?.find(item => item.corsoId === courseId);
        if (!pending || !group) return alert('Bozza richiesta non trovata.');
        await window.loadModule('progetti');
        const set = (id, value) => { const element = document.getElementById(id); if (element && value !== undefined && value !== null) element.value = value; };
        set('prog-azienda', pending.aziendaId);
        set('prog-corso', group.corsoId);
        set('prog-inizio', pending.preferences?.dataInizio || '');
        set('prog-sede', pending.preferences?.sede || '');
        set('prog-modalita', mapMode(pending.preferences?.modalita));
        if (typeof window.calcolaDettagliProgetto === 'function') window.calcolaDettagliProgetto();
        set('prog-compliance-note-free', [
            `Richiesta importata da kit ${pending.requestId}.`,
            `Tipo percorso: ${group.tipoPercorso}.`,
            pending.preferences?.disponibilita ? `Disponibilità: ${pending.preferences.disponibilita}.` : '',
            pending.preferences?.rischi ? `Rischi segnalati dal cliente: ${pending.preferences.rischi}.` : '',
            pending.preferences?.note || ''
        ].filter(Boolean).join('\n'));
        set('prog-fabbisogni-attivita', pending.preferences?.attivita || '');
        set('prog-fabbisogni-gap', pending.preferences?.esigenza || '');
        set('prog-fabbisogni-note', pending.preferences?.note || '');
        window.progettoDraftCorsistiIds = [...group.corsistaIds];
        if (typeof window.renderProgettoDraftCorsistiControls === 'function') window.renderProgettoDraftCorsistiControls();
        document.getElementById('form-progetto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alert('Bozza caricata. Completa i campi mancanti, assegna i docenti, verifica compliance e salva il progetto.');
    };

    window.cancellaBozzeKitCliente = function () {
        if (confirm('Eliminare le bozze operative importate? Azienda e corsisti già salvati non verranno cancellati.')) setPending(null);
    };

    window.apriKitClientePerAzienda = async function (companyId) {
        await window.loadModule('kit_cliente');
        const mode = document.getElementById('kit-company-mode');
        const select = document.getElementById('kit-company-select');
        if (mode) mode.value = 'existing';
        window.syncKitCompanyMode();
        if (select) select.value = companyId || '';
    };

    window.initKitCliente = async function () {
        const request = document.getElementById('kit-request-id');
        if (request) request.value = requestId();
        window.aziendeList = await window.getAziende();
        const select = document.getElementById('kit-company-select');
        if (select) select.innerHTML = '<option value="">-- Seleziona azienda --</option>' + (window.aziendeList || []).map(company => `<option value="${esc(company.id)}">${esc(company.ragione_sociale)}</option>`).join('');
        window.syncKitCompanyMode();
        renderPending();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
})();
