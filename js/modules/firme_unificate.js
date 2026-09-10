// Step firme + stampe - versione stabile A4 5mm
// Regola utente: se la firma non è disponibile o il file non è caricabile, lo slot resta visibile e vuoto.
// Regola stampa: attestati invariati; tutti gli altri documenti usano A4 verticale con margini 0,5 cm.
// Test e registri: contenuto largo ruotato dentro pagina A4 verticale. Test manuali e correttori: 30 domande su 2 colonne.

(function() {
    if (window.__safetyUnifiedSignaturesLoaded) return;
    window.__safetyUnifiedSignaturesLoaded = true;

    const STATIC_SIGNATURES = [
        {
            src: 'assets/firme/firma_berardino_pesce.png',
            names: ['pesce berardino', 'berardino pesce'],
            roles: [
                'docente', 'formatore', 'docente formatore',
                'resp_progetto', 'responsabile progetto', 'responsabile progetto formativo',
                'resp_corso', 'responsabile corso', 'responsabile del corso',
                'legale', 'legale_rappresentante', 'legale rappresentante'
            ]
        },
        {
            src: 'assets/firme/firma_centrella_alberto.png',
            names: ['centrella alberto', 'alberto centrella'],
            roles: ['docente', 'formatore', 'docente formatore', 'resp_corso', 'responsabile corso', 'responsabile del corso']
        }
    ];

    const ROLE_LABELS = {
        docente: 'Docente / Formatore',
        formatore: 'Docente / Formatore',
        resp_progetto: 'Responsabile Progetto Formativo',
        'responsabile progetto': 'Responsabile Progetto Formativo',
        'responsabile progetto formativo': 'Responsabile Progetto Formativo',
        resp_corso: 'Responsabile del Corso',
        'responsabile corso': 'Responsabile del Corso',
        'responsabile del corso': 'Responsabile del Corso',
        legale: 'Legale Rappresentante',
        legale_rappresentante: 'Legale Rappresentante',
        'legale rappresentante': 'Legale Rappresentante',
        tutor: 'Tutor'
    };

    const norm = (value) => String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const roleKey = (value) => {
        const r = norm(value);
        if (['resp progetto', 'responsabile progetto', 'responsabile progetto formativo'].includes(r)) return 'resp_progetto';
        if (['resp corso', 'responsabile corso', 'responsabile del corso'].includes(r)) return 'resp_corso';
        if (['legale', 'legale rappresentante', 'rappresentante legale'].includes(r)) return 'legale';
        if (['docente', 'formatore', 'docente formatore'].includes(r)) return 'docente';
        return r || '';
    };

    const roleMatches = (candidateRole, requestedRole) => {
        const c = roleKey(candidateRole);
        const r = roleKey(requestedRole);
        return !r || c === r || norm(candidateRole) === norm(requestedRole);
    };

    const isPlaceholder = (value) => {
        const v = String(value || '').trim();
        return !v || v === '---' || /^[_\-\s/]+$/.test(v) || /non indicato/i.test(v);
    };

    const first = (...values) => values.find(v => !isPlaceholder(v)) || '';

    const appValue = (...keys) => {
        for (const key of keys) {
            if (window.AppState && !isPlaceholder(window.AppState[key])) return window.AppState[key];
            const el = document.getElementById(key);
            if (el && !isPlaceholder(el.value || el.textContent)) return el.value || el.textContent;
        }
        return '';
    };

    const isLoadableSignatureSrc = (src) => {
        const s = String(src || '').trim();
        if (!s) return false;
        if (/^data:image\//i.test(s) || /^blob:/i.test(s)) return true;
        if (/\.pdf($|[?#])/i.test(s)) return false;
        if (/^[a-z]:[\\/]/i.test(s) || /^file:\/\//i.test(s) || /^\\\\/.test(s)) return false;
        if (/^https?:\/\//i.test(s)) return true;
        if (/^(assets\/|\.\/|\.\.\/|\/)/i.test(s) && /\.(png|jpe?g|webp|gif|svg)($|[?#])/i.test(s)) return true;
        return false;
    };

    const uniquePush = (list, item) => {
        if (!item || !item.src) return;
        const key = `${norm(item.name)}::${roleKey(item.role)}::${item.src}`;
        if (list.some(existing => `${norm(existing.name)}::${roleKey(existing.role)}::${existing.src}` === key)) return;
        list.push(item);
    };

    const splitSignerNames = (value) => {
        const raw = String(value || '').trim();
        if (!raw || isPlaceholder(raw)) return [];
        return raw
            .replace(/\r?\n/g, ' | ')
            .replace(/\s+(?:e|ed|and|&)\s+/gi, ' | ')
            .replace(/[;,/+]\s*/g, ' | ')
            .split('|')
            .map(v => v.replace(/^(sig\.?|firma|firmato da|dott\.?|ing\.?|avv\.?|resp\.?\s*progetto\s*formativo|resp\.?\s*corso|responsabile\s+progetto\s+formativo|responsabile\s+del\s+corso|responsabile\s+corso)\s+/i, '').trim())
            .filter(v => !isPlaceholder(v));
    };

    const findDocente = (name) => {
        const n = norm(name);
        if (!n) return null;
        const lists = [window.docentiList, window.currentDocentiList, window.allDocenti, window.DOCENTI].filter(Array.isArray);
        for (const list of lists) {
            const found = list.find(d => norm(d?.nome_cognome || d?.nome || d?.name) === n);
            if (found) return found;
        }
        return null;
    };

    const getEnte = () => {
        const candidates = [window.currentEnteData, window.enteData, window.enteCorrente, window.currentEnte, window.ente].filter(Boolean);
        return candidates[0] || {};
    };

    const fallbackNameForRole = (role) => {
        const rk = roleKey(role);
        if (rk === 'resp_progetto') return appValue('cfg-resp-progetto', 'resp_progetto', 'progetto-resp-progetto');
        if (rk === 'resp_corso') return appValue('cfg-resp-corso', 'resp_corso', 'progetto-resp-corso');
        if (rk === 'legale') return first(getEnte().legale_nome, appValue('ente-legale-nome', 'cfg-legale-nome', 'legale_nome'));
        if (rk === 'docente') return appValue('cfg-docente', 'cfg-docente-principale', 'docente_principale');
        return '';
    };

    const resolveStaticSignatures = (text, role) => {
        const out = [];
        const source = norm(text);
        if (!source) return out;
        STATIC_SIGNATURES.forEach(item => {
            const roleOk = item.roles.some(r => roleMatches(r, role));
            if (!roleOk || !isLoadableSignatureSrc(item.src)) return;
            const matchedName = item.names.find(name => {
                const n = norm(name);
                return source === n || source.includes(n);
            });
            if (matchedName) uniquePush(out, { src: item.src, source: 'asset-statico', name: matchedName, role: roleKey(role) });
        });
        return out;
    };

    const resolveDbDocenteSignatures = (names, role) => {
        const out = [];
        names.forEach(name => {
            const docente = findDocente(name);
            const docenteSrc = first(docente?.firma_docente_url, docente?.firma_url, docente?.firma);
            if (docente && isLoadableSignatureSrc(docenteSrc)) {
                uniquePush(out, { src: docenteSrc, source: 'docente-db', name: docente?.nome_cognome || docente?.nome || name, role: roleKey(role) });
            }
        });
        return out;
    };

    window.resolveSafetySignature = function({ name = '', role = '', documentName = '' } = {}) {
        const rk = roleKey(role);
        const signerName = first(name, fallbackNameForRole(rk));
        const signerParts = splitSignerNames(signerName);
        const searchTexts = [signerName, ...signerParts].filter(v => !isPlaceholder(v));
        const signatures = [];

        if (rk === 'legale') {
            const ente = getEnte();
            const legalSrc = first(ente.legale_firma_url, ente.firma_legale_url, appValue('ente-legale-firma-url', 'cfg-legale-firma-url', 'legale_firma_url'));
            if (isLoadableSignatureSrc(legalSrc)) uniquePush(signatures, { src: legalSrc, source: 'ente-db', name: signerName, role: rk });
        }

        resolveDbDocenteSignatures(signerParts.length ? signerParts : [signerName], rk).forEach(s => uniquePush(signatures, s));
        searchTexts.forEach(text => resolveStaticSignatures(text, rk).forEach(s => uniquePush(signatures, s)));

        const firstSignature = signatures[0] || null;
        return { src: firstSignature?.src || '', signatures, source: firstSignature?.source || 'empty-slot', name: signerName, role: rk, documentName, multi: signatures.length > 1 };
    };

    window.getAutoSignaturePathByNameAndRole = function(name, role, context = {}) {
        return window.resolveSafetySignature({ name, role, documentName: context.documentName || '' }).src || '';
    };

    window.getSignatureNameForSlot = function(slot) {
        if (!slot) return '';
        const selector = slot.getAttribute('data-signature-name-selector') || '';
        const block = slot.closest('[data-signature-block]') || slot.parentElement || document;
        const page = slot.closest('.doc-page') || (block.closest ? block.closest('.doc-page') : null) || document;
        let el = selector ? block.querySelector(selector) : null;
        if (!el && selector && page?.querySelector) el = page.querySelector(selector);
        if (!el && selector) el = document.querySelector(selector);
        return first(el?.textContent, el?.innerText, slot.getAttribute('data-signature-name'), fallbackNameForRole(slot.getAttribute('data-signature-role') || ''));
    };

    const renderEmptySignatureSlot = (slot) => {
        const spacer = document.createElement('span');
        spacer.className = 'signature-empty-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.display = 'block';
        spacer.style.width = '42mm';
        spacer.style.height = '11mm';
        spacer.style.maxHeight = '11mm';
        spacer.style.pointerEvents = 'none';
        slot.appendChild(spacer);
    };

    window.renderAutoSignatureSlot = function(slot, signaturePath = '', signerName = '', meta = {}) {
        if (!slot) return;
        const role = slot.getAttribute('data-signature-role') || meta.role || '';
        const rk = roleKey(role);
        const label = slot.getAttribute('data-signature-label') || ROLE_LABELS[rk] || role || 'Firmatario';
        const name = first(signerName, window.getSignatureNameForSlot(slot));
        let signatures = Array.isArray(meta.signatures) ? meta.signatures.filter(s => isLoadableSignatureSrc(s?.src)) : [];
        if (!signatures.length) {
            if (Array.isArray(signaturePath)) {
                signatures = signaturePath.filter(isLoadableSignatureSrc).map(src => ({ src, name, role: rk, source: 'direct-array' }));
            } else if (isLoadableSignatureSrc(signaturePath)) {
                signatures = [{ src: signaturePath, name, role: rk, source: meta.source || 'direct' }];
            }
        }

        slot.classList.remove('hidden');
        slot.innerHTML = '';
        slot.dataset.signatureRole = rk;
        slot.dataset.signatureName = name || '';
        slot.dataset.signatureResolved = signatures.length ? 'yes' : 'no';
        slot.dataset.signatureCount = String(signatures.length);
        slot.title = signatures.length ? `Firma ${name || label} caricata (${label})` : `Slot firma vuoto: ${label}${name ? ' - ' + name : ''}`;
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.gap = signatures.length > 1 ? '2.5mm' : '0';
        slot.style.minHeight = slot.style.minHeight || '12mm';
        slot.style.width = slot.style.width || '100%';

        if (!signatures.length) {
            renderEmptySignatureSlot(slot);
            return;
        }

        signatures.forEach((signature, idx) => {
            const img = document.createElement('img');
            img.className = 'auto-signature-img';
            img.src = signature.src;
            img.alt = 'Firma ' + (signature.name || name || label);
            img.dataset.signatureIndex = String(idx + 1);
            img.dataset.signatureSource = signature.source || '';
            img.style.maxHeight = '12.5mm';
            img.style.objectFit = 'contain';
            img.style.display = 'block';
            img.style.flex = signatures.length > 1 ? '0 1 45%' : '0 1 auto';
            img.style.maxWidth = signatures.length > 1 ? '38mm' : '42mm';
            img.onerror = () => {
                img.remove();
                if (!slot.querySelector('img.auto-signature-img')) {
                    slot.dataset.signatureResolved = 'load-error';
                    renderEmptySignatureSlot(slot);
                }
            };
            slot.appendChild(img);
        });
    };

    window.applyResolvedSignaturesToContainer = function(root = document) {
        const container = root && root.querySelectorAll ? root : document;
        const slots = Array.from(container.querySelectorAll('.auto-signature-slot'));
        slots.forEach(slot => {
            const role = slot.getAttribute('data-signature-role') || '';
            const name = window.getSignatureNameForSlot(slot);
            const docPage = slot.closest('.doc-page');
            const documentName = docPage?.dataset?.printModule || docPage?.className || window.currentPrintModule || '';
            const resolved = window.resolveSafetySignature({ name, role, documentName });
            window.renderAutoSignatureSlot(slot, resolved.src, resolved.name || name, { role, source: resolved.source, documentName, signatures: resolved.signatures });
        });
        return slots.length;
    };

    window.applyAutomaticSignatureImages = function(root = document) {
        return window.applyResolvedSignaturesToContainer(root);
    };

    // ================================
    // STAMPE: A4 portrait 5 mm; registri/test ruotati dentro A4 verticale
    // ================================
    const PRINT_STYLE_ID = 'safety-print-a4-5mm-v4-two-columns';
    const A4_W = '210mm';
    const A4_H = '297mm';
    const PRINT_MARGIN = '5mm';
    const INNER_W = '200mm';
    const INNER_H = '287mm';
    const WIDE_W = '287mm';
    const WIDE_H = '200mm';

    const pageDescriptor = (page) => [
        page?.className || '',
        page?.dataset?.printModule || '',
        page?.dataset?.manualTestPage || '',
        page?.dataset?.registerDayPage || '',
        page?.dataset?.safetyWideKind || '',
        page?.textContent || ''
    ].join(' ');

    const isAttestatoPage = (page) => {
        const classText = String(page?.className || '');
        const moduleText = String(page?.dataset?.printModule || '');
        return /attestato/i.test(classText) || /attestato/i.test(moduleText) ||
            page?.classList?.contains('attestato-front') ||
            page?.classList?.contains('attestato-retro');
    };

    const isRegistroPage = (page) => {
        const txt = String(pageDescriptor(page));
        return !!(
            page?.dataset?.registerDayPage ||
            page?.dataset?.registerTemplatePage ||
            /registro\s+presenze|registro|r-rows/i.test(txt)
        );
    };

    const isManualTestPage = (page) => {
        const txt = String(pageDescriptor(page));
        return !!(
            page?.dataset?.manualTestPage ||
            page?.classList?.contains('manual-test-page') ||
            page?.querySelector?.('.manual-test-inner, .manual-test-grid') ||
            /test\s+manuale|manual-test|correttore/i.test(txt)
        );
    };

    const isWidePage = (page) => {
        if (!page || isAttestatoPage(page)) return false;
        return isRegistroPage(page) || isManualTestPage(page);
    };

    window.injectSafetyPrintCss = function() {
        if (document.getElementById(PRINT_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = PRINT_STYLE_ID;
        style.textContent = `
@media print {
    @page safetyA4Portrait5mm { size: A4 portrait; margin: 0mm; }

    html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    body.is-printing-temp nav,
    body.is-printing-temp aside,
    body.is-printing-temp main { display: none !important; }

    body.is-printing-temp #print-area-temp {
        display: block !important;
        position: static !important;
        left: auto !important;
        top: auto !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #fff !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro),
    body.is-printing-temp #print-area-temp .safety-print-page:not(.attestato-front):not(.attestato-retro) {
        page: safetyA4Portrait5mm !important;
        width: ${A4_W} !important;
        height: ${A4_H} !important;
        min-height: ${A4_H} !important;
        max-height: ${A4_H} !important;
        margin: 0 auto !important;
        padding: ${PRINT_MARGIN} !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        transform: none !important;
        rotate: 0deg !important;
        zoom: 1 !important;
        scale: 1 !important;
        position: relative !important;
        left: auto !important;
        top: auto !important;
        box-shadow: none !important;
        border: 0 !important;
        background: #fff !important;
        page-break-after: always !important;
        break-after: page !important;
        font-size: 8.8pt !important;
        line-height: 1.18 !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page,
    body.is-printing-temp #print-area-temp .doc-page.safety-wide-portrait-page,
    body.is-printing-temp #print-area-temp .doc-page.safety-wide-portrait-page.landscape,
    body.is-printing-temp #print-area-temp .doc-page.safety-wide-portrait-page.landscape-force,
    body.is-printing-temp #print-area-temp .doc-page.safety-wide-portrait-page.manual-test-page {
        page: safetyA4Portrait5mm !important;
        width: ${A4_W} !important;
        height: ${A4_H} !important;
        min-height: ${A4_H} !important;
        max-height: ${A4_H} !important;
        padding: 0 !important;
        margin: 0 auto !important;
        overflow: hidden !important;
        position: relative !important;
        transform: none !important;
        rotate: 0deg !important;
        zoom: 1 !important;
        scale: 1 !important;
        background: #fff !important;
        box-shadow: none !important;
        border: 0 !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-rotated-content {
        position: absolute !important;
        left: ${PRINT_MARGIN} !important;
        top: ${PRINT_MARGIN} !important;
        width: ${WIDE_W} !important;
        height: ${WIDE_H} !important;
        min-width: ${WIDE_W} !important;
        min-height: ${WIDE_H} !important;
        max-width: ${WIDE_W} !important;
        max-height: ${WIDE_H} !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        transform-origin: top left !important;
        transform: rotate(90deg) translateY(-${WIDE_H}) !important;
        background: #fff !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="registro"] .safety-wide-rotated-content {
        font-size: 7.6pt !important;
        line-height: 1.08 !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="registro"] table {
        width: 100% !important;
        height: auto !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        font-size: 7.1pt !important;
        line-height: 1.05 !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="registro"] th,
    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="registro"] td {
        padding: 0.65mm !important;
        line-height: 1.04 !important;
        vertical-align: middle !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="test"] .safety-wide-rotated-content {
        font-size: 7.4pt !important;
        line-height: 1.06 !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="test"] .manual-test-inner {
        width: ${WIDE_W} !important;
        height: ${WIDE_H} !important;
        max-height: ${WIDE_H} !important;
        padding: 3mm !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="test"] .manual-test-grid {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        display: grid !important;
        grid-template-rows: repeat(15, minmax(0, 1fr)) !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        grid-auto-flow: column !important;
        grid-auto-columns: minmax(0, 1fr) !important;
        gap: 0.7mm 2.2mm !important;
        overflow: hidden !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="test"] .manual-test-question {
        overflow: hidden !important;
        box-sizing: border-box !important;
        font-size: 6.35pt !important;
        line-height: 1.02 !important;
        padding: 0.55mm !important;
    }

    body.is-printing-temp #print-area-temp .safety-wide-portrait-page[data-safety-wide-kind="test"] .manual-test-question * {
        line-height: 1.02 !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro):not(.safety-wide-portrait-page) table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 8.1pt !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro):not(.safety-wide-portrait-page) th,
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro):not(.safety-wide-portrait-page) td {
        padding: 0.9mm !important;
        line-height: 1.08 !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[6px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[6\.5px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[7px\] { font-size: 6.9pt !important; line-height: 1.08 !important; }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[7\.5px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[8px\] { font-size: 7.4pt !important; line-height: 1.09 !important; }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[9px\] { font-size: 7.9pt !important; line-height: 1.1 !important; }
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[10px\] { font-size: 8.4pt !important; line-height: 1.1 !important; }

    body.is-printing-temp #print-area-temp .auto-signature-slot {
        display: flex !important;
        visibility: visible !important;
        min-height: 12mm !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }

    body.is-printing-temp #print-area-temp .auto-signature-img {
        display: block !important;
        max-width: 42mm !important;
        max-height: 13mm !important;
        object-fit: contain !important;
        visibility: visible !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:last-child,
    body.is-printing-temp #print-area-temp .safety-print-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
    }
}
        `;
        document.head.appendChild(style);
    };

    const applyPageBox = (page, width, height, padding) => {
        page.style.width = width;
        page.style.height = height;
        page.style.minHeight = height;
        page.style.maxHeight = height;
        page.style.maxWidth = width;
        page.style.padding = padding;
        page.style.margin = '0 auto';
        page.style.boxSizing = 'border-box';
        page.style.overflow = 'hidden';
        page.style.position = 'relative';
        page.style.display = 'block';
        page.style.left = 'auto';
        page.style.top = 'auto';
        page.style.transform = 'none';
        page.style.zoom = '1';
        page.style.scale = '1';
        page.style.pageBreakAfter = 'always';
        page.style.breakAfter = 'page';
    };

    const normalizeManualTestGrid = (root) => {
        const target = root && root.querySelectorAll ? root : document;
        target.querySelectorAll('.manual-test-inner').forEach(inner => {
            inner.style.width = WIDE_W;
            inner.style.height = WIDE_H;
            inner.style.maxHeight = WIDE_H;
            inner.style.padding = '3mm';
            inner.style.boxSizing = 'border-box';
            inner.style.display = 'flex';
            inner.style.flexDirection = 'column';
            inner.style.overflow = 'hidden';
        });
        target.querySelectorAll('.manual-test-grid').forEach(grid => {
            grid.style.flex = '1 1 auto';
            grid.style.minHeight = '0';
            grid.style.display = 'grid';
            grid.style.gridTemplateRows = 'repeat(15, minmax(0, 1fr))';
            grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
            grid.style.gridAutoFlow = 'column';
            grid.style.gridAutoColumns = 'minmax(0, 1fr)';
            grid.style.gap = '0.7mm 2.2mm';
            grid.style.overflow = 'hidden';
        });
        target.querySelectorAll('.manual-test-question').forEach(q => {
            q.style.overflow = 'hidden';
            q.style.boxSizing = 'border-box';
            q.style.fontSize = '6.35pt';
            q.style.lineHeight = '1.02';
            q.style.padding = '0.55mm';
        });
    };

    const ensureWideRotatedWrapper = (page) => {
        if (!page || !page.classList) return;
        const kind = isRegistroPage(page) ? 'registro' : 'test';
        let wrapper = page.querySelector(':scope > .safety-wide-rotated-content');

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'safety-wide-rotated-content';
            if (page.classList.contains('flex')) wrapper.classList.add('flex');
            if (page.classList.contains('flex-col')) wrapper.classList.add('flex-col');
            while (page.firstChild) wrapper.appendChild(page.firstChild);
            page.appendChild(wrapper);
        }

        page.classList.add('safety-print-page', 'safety-wide-portrait-page', 'print-show', 'temp-page');
        page.classList.remove('hidden', 'scale-[0.8]', 'origin-top');
        page.dataset.safetyWideKind = kind;
        applyPageBox(page, A4_W, A4_H, '0');

        wrapper.style.position = 'absolute';
        wrapper.style.left = PRINT_MARGIN;
        wrapper.style.top = PRINT_MARGIN;
        wrapper.style.width = WIDE_W;
        wrapper.style.height = WIDE_H;
        wrapper.style.minWidth = WIDE_W;
        wrapper.style.minHeight = WIDE_H;
        wrapper.style.maxWidth = WIDE_W;
        wrapper.style.maxHeight = WIDE_H;
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.overflow = 'hidden';
        wrapper.style.transformOrigin = 'top left';
        wrapper.style.transform = `rotate(90deg) translateY(-${WIDE_H})`;
        wrapper.style.background = '#fff';

        if (kind === 'registro') {
            wrapper.style.fontSize = '7.6pt';
            wrapper.style.lineHeight = '1.08';
        } else {
            wrapper.style.fontSize = '7.4pt';
            wrapper.style.lineHeight = '1.06';
            normalizeManualTestGrid(wrapper);
        }
    };

    const normalizePrintPage = (page) => {
        if (!page || !page.classList) return;
        page.classList.add('print-show', 'temp-page', 'safety-print-page');
        page.classList.remove('hidden', 'scale-[0.8]', 'origin-top');

        if (isAttestatoPage(page)) {
            return;
        }

        if (isWidePage(page)) {
            ensureWideRotatedWrapper(page);
            return;
        }

        page.classList.remove('safety-wide-portrait-page');
        delete page.dataset.safetyWideKind;
        applyPageBox(page, A4_W, A4_H, PRINT_MARGIN);
    };

    window.prepareSafetyPrintContainer = function(root = document) {
        window.injectSafetyPrintCss();
        const target = root && root.querySelectorAll ? root : document;
        try { window.applyResolvedSignaturesToContainer(target); } catch (error) { console.warn('[Stampe] firme non applicate', error); }
        const pages = Array.from(target.querySelectorAll('.doc-page, .safety-print-page'));
        pages.forEach(normalizePrintPage);
        normalizeManualTestGrid(target);
        if (pages.length) {
            const last = pages[pages.length - 1];
            last.style.pageBreakAfter = 'auto';
            last.style.breakAfter = 'auto';
        }
        const report = {
            pages: pages.length,
            a4Portrait: pages.filter(p => !isAttestatoPage(p)).length,
            rotatedWide: pages.filter(isWidePage).length,
            registri: pages.filter(isRegistroPage).length,
            test: pages.filter(isManualTestPage).length,
            attestatiUntouched: pages.filter(isAttestatoPage).length,
            signatures: target.querySelectorAll('.auto-signature-slot').length
        };
        if (pages.length) console.info('[Stampe] A4 5mm preparato - test 2 colonne', report);
        return report;
    };

    // La funzione originale chiama waitForPrintImages(printArea) prima di window.print(). Qui prepariamo soltanto il DOM.
    window.waitForPrintImages = async function(root = document, timeoutMs = 1200) {
        const container = root && root.querySelectorAll ? root : document;
        window.prepareSafetyPrintContainer(container);
        const images = Array.from(container.querySelectorAll('img')).filter(img => img && img.src && !img.complete);
        if (!images.length) return true;
        await Promise.race([
            Promise.all(images.map(img => new Promise(resolve => {
                const done = () => resolve(true);
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            }))),
            new Promise(resolve => setTimeout(resolve, Number(timeoutMs) || 1200))
        ]);
        return true;
    };

    const wrapRenderPrintModuleToTemp = () => {
        if (typeof window.renderPrintModuleToTemp !== 'function' || window.renderPrintModuleToTemp.__safetyStableWrapped) return;
        const original = window.renderPrintModuleToTemp;
        const wrapped = async function(...args) {
            const pages = await original.apply(this, args);
            (pages || []).forEach(p => {
                window.applyResolvedSignaturesToContainer(p);
                normalizePrintPage(p);
            });
            return pages;
        };
        wrapped.__safetyStableWrapped = true;
        window.renderPrintModuleToTemp = wrapped;
    };

    const wrapRenderAttestatiMultipli = () => {
        if (typeof window.renderAttestatiMultipli !== 'function' || window.renderAttestatiMultipli.__safetyStableWrapped) return;
        const original = window.renderAttestatiMultipli;
        const wrapped = async function(container, options = {}) {
            const result = await original.apply(this, [container, options]);
            if (container) window.applyResolvedSignaturesToContainer(container);
            return result;
        };
        wrapped.__safetyStableWrapped = true;
        window.renderAttestatiMultipli = wrapped;
    };

    const wrapLoadPrintPreview = () => {
        if (typeof window.loadPrintPreview !== 'function' || window.loadPrintPreview.__safetyStableWrapped) return;
        const original = window.loadPrintPreview;
        const wrapped = async function(...args) {
            const result = await original.apply(this, args);
            const preview = document.getElementById('print-preview-container');
            if (preview) {
                window.applyResolvedSignaturesToContainer(preview);
                Array.from(preview.querySelectorAll('.doc-page, .safety-print-page')).forEach(normalizePrintPage);
                normalizeManualTestGrid(preview);
            }
            return result;
        };
        wrapped.__safetyStableWrapped = true;
        window.loadPrintPreview = wrapped;
    };

    window.installSafetySignaturePatches = function() {
        window.injectSafetyPrintCss();
        wrapRenderPrintModuleToTemp();
        wrapRenderAttestatiMultipli();
        wrapLoadPrintPreview();
        window.applyResolvedSignaturesToContainer(document);
    };

    window.auditSafetyPrint = function(root = document) {
        const target = root && root.querySelectorAll ? root : document;
        const pages = Array.from(target.querySelectorAll('.doc-page, .safety-print-page'));
        const report = {
            pages: pages.length,
            a4Portrait: pages.filter(p => !isAttestatoPage(p)).length,
            rotatedWide: pages.filter(isWidePage).length,
            registri: pages.filter(isRegistroPage).length,
            test: pages.filter(isManualTestPage).length,
            attestatiUntouched: pages.filter(isAttestatoPage).length,
            testQuestions: target.querySelectorAll('.manual-test-question').length,
            testColumns: 2,
            testRows: 15,
            signatures: target.querySelectorAll('.auto-signature-slot').length,
            resolvedSignatures: target.querySelectorAll('.auto-signature-slot[data-signature-resolved="yes"]').length,
            emptySignatureSlots: target.querySelectorAll('.auto-signature-slot[data-signature-resolved="no"], .auto-signature-slot[data-signature-resolved="load-error"]').length
        };
        console.info('[Stampe] audit A4 5mm test 2 colonne', report);
        return report;
    };

    window.installSafetySignaturePatches();
    setTimeout(window.installSafetySignaturePatches, 0);
    setTimeout(window.installSafetySignaturePatches, 500);
    setTimeout(window.installSafetySignaturePatches, 1500);
})();
