// Informativa privacy (art. 13 Reg. UE 2016/679) e foglio unico di presa visione dei partecipanti.
// Il modello e in modules/informativa_privacy.html; renderPrintModulePages chiama
// window.expandPrivacyPages dopo aver compilato i campi comuni (corso, azienda, date).
// Allegata in automatico al Fascicolo del corso e inserita nel Pacchetto corso.
// Sola lettura: nessuna modifica a corsi, progetti, attestati o database.
(function () {
    if (window.__informativaPrivacyLoaded) return;
    window.__informativaPrivacyLoaded = true;

    const ROWS_PER_PAGE = 20;
    let enteCache = null;

    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const val = id => String((typeof window.getVal === 'function' ? window.getVal(id) : window.AppState?.[id]) || '').trim();

    async function loadEnte() {
        if (enteCache) return enteCache;
        try {
            enteCache = typeof window.getEnte === 'function' ? (await window.getEnte()) || {} : {};
        } catch (_) {
            enteCache = {};
        }
        return enteCache;
    }

    // Titolare del trattamento = soggetto formatore del progetto:
    // l'ente erogatore oppure l'azienda quando il datore di lavoro e soggetto formatore.
    window.getPrivacyController = async function () {
        const isAzienda = val('cfg-ente-erogatore') === 'azienda';
        if (isAzienda) {
            const piva = val('cfg-azienda-piva');
            return {
                tipo: 'azienda',
                nome: val('cfg-azienda') || '---',
                sede: val('cfg-azienda-indirizzo') || '---',
                ids: piva ? `P.IVA/C.F. ${piva}` : '',
                contatti: '________________________________'
            };
        }
        const ente = await loadEnte();
        const preset = window.CNA_AVELLINO_PRESET || {};
        const nome = val('cfg-ente') || ente.ragione_sociale || preset.ragione_sociale || '---';
        const isCna = typeof window.isCnaName === 'function' && window.isCnaName(nome);
        return {
            tipo: 'ente',
            nome,
            sede: val('cfg-ente-indirizzo') || ente.indirizzo || (isCna ? preset.indirizzo : '') || '---',
            ids: val('cfg-ente-piva') || ente.piva_cf || (isCna ? preset.piva_cf : '') || '',
            contatti: val('cfg-ente-contatti') || ente.contatti || (isCna ? preset.contatti : '') || '________________________________'
        };
    };

    const setText = (root, selector, text) => root.querySelectorAll(selector).forEach(el => { el.textContent = text; });

    function fillController(page, controller) {
        setText(page, '.val-privacy-titolare', controller.nome);
        setText(page, '.val-privacy-titolare-sede', controller.sede);
        setText(page, '.val-privacy-titolare-ids', controller.ids);
        setText(page, '.val-privacy-titolare-contatti', controller.contatti);
        page.querySelectorAll('.val-privacy-titolare-ids').forEach(el => { el.style.display = controller.ids ? '' : 'none'; });
        page.dataset.privacyTitolare = controller.tipo;
    }

    function ackRows(people, offset) {
        let html = '';
        for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const person = people[i];
            const n = offset + i + 1;
            html += '<tr style="height:9mm">' +
                `<td class="border border-slate-800 px-1 text-center font-bold">${n}</td>` +
                `<td class="border border-slate-800 px-1 font-bold uppercase">${person ? esc(person.nome) : '&nbsp;'}</td>` +
                `<td class="border border-slate-800 px-1 text-center font-mono">${person ? esc(person.cf) : '&nbsp;'}</td>` +
                '<td class="border border-slate-800 px-1">&nbsp;</td>' +
                '<td class="border border-slate-800 px-1">&nbsp;</td>' +
                '</tr>';
        }
        return html;
    }

    // Una pagina di informativa + il foglio unico di presa visione (20 righe per pagina,
    // righe libere in fondo per chi si aggiunge). Nessuna firma o data precompilata.
    window.expandPrivacyPages = async function (pages, options = {}) {
        const controller = await window.getPrivacyController();
        const session = (options.session || window.currentSessionCorsisti || [])
            .filter(c => c && (c.nome || c.cf))
            .map(c => ({ nome: String(c.nome || '').trim(), cf: String(c.cf || '').trim() }));
        const out = [];
        pages.forEach(page => {
            if (page.matches?.('[data-privacy-ack-page]')) {
                const chunks = Math.max(1, Math.ceil(session.length / ROWS_PER_PAGE));
                for (let k = 0; k < chunks; k++) {
                    const sheet = k === 0 ? page : page.cloneNode(true);
                    fillController(sheet, controller);
                    const people = session.slice(k * ROWS_PER_PAGE, (k + 1) * ROWS_PER_PAGE);
                    sheet.querySelectorAll('.privacy-ack-rows').forEach(tbody => { tbody.innerHTML = ackRows(people, k * ROWS_PER_PAGE); });
                    setText(sheet, '.val-privacy-ack-pagina', chunks > 1 ? `· foglio ${k + 1} di ${chunks}` : '');
                    sheet.dataset.privacyAckSheet = String(k + 1);
                    out.push(sheet);
                }
            } else {
                fillController(page, controller);
                out.push(page);
            }
        });
        return out;
    };

    window.renderInformativaPrivacyPages = async function (options = {}) {
        if (typeof window.renderPrintModulePages !== 'function') return [];
        return await window.renderPrintModulePages('informativa_privacy', null, {
            preview: !!options.preview,
            session: options.session
        });
    };
})();
