// Step firme + stampe - versione stabile
// Regola utente: se la firma non è disponibile o il file non è caricabile, lo slot resta visibile e vuoto.
// Obiettivo stampe: non bloccare mai window.print(); riempire A4 portrait/landscape con margini minimi e senza miniaturizzazione.

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
    // STAMPE: full A4 senza bloccare la finestra di stampa
    // ================================
    const PRINT_STYLE_ID = 'safety-print-fullpage-v2';

    const isAttestatoPage = (page) => {
        const txt = String(page?.className || '') + ' ' + String(page?.dataset?.printModule || '');
        return /attestato/i.test(txt) || page?.classList?.contains('attestato-front') || page?.classList?.contains('attestato-retro');
    };

    const isLandscapePage = (page) => {
        if (!page || !page.classList) return false;
        const txt = String(page.className || '') + ' ' + String(page.dataset?.printModule || '');
        return page.classList.contains('landscape') ||
            page.classList.contains('landscape-force') ||
            page.classList.contains('manual-test-page') ||
            page.dataset?.manualTestPage ||
            page.dataset?.registerDayPage ||
            /registro|landscape|manual-test/i.test(txt);
    };

    window.injectSafetyPrintCss = function() {
        if (document.getElementById(PRINT_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = PRINT_STYLE_ID;
        style.textContent = `
@media print {
    @page safetyPortraitFull { size: A4 portrait; margin: 0mm; }
    @page safetyLandscapeFull { size: A4 landscape; margin: 0mm; }

    body.is-printing-temp { margin: 0 !important; padding: 0 !important; background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body.is-printing-temp nav, body.is-printing-temp aside, body.is-printing-temp main { display: none !important; }
    body.is-printing-temp #print-area-temp { display: block !important; position: static !important; width: auto !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #fff !important; }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro),
    body.is-printing-temp #print-area-temp .safety-print-page:not(.attestato-front):not(.attestato-retro) {
        page: safetyPortraitFull !important;
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 auto !important;
        padding: 6mm !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        transform: none !important;
        zoom: 1 !important;
        scale: 1 !important;
        position: relative !important;
        box-shadow: none !important;
        border: 0 !important;
        background: #fff !important;
        page-break-after: always !important;
        break-after: page !important;
        font-size: 9.5pt !important;
        line-height: 1.22 !important;
    }

    body.is-printing-temp #print-area-temp .doc-page.landscape,
    body.is-printing-temp #print-area-temp .doc-page.landscape-force,
    body.is-printing-temp #print-area-temp .doc-page.manual-test-page,
    body.is-printing-temp #print-area-temp .doc-page.safety-landscape-page,
    body.is-printing-temp #print-area-temp .safety-landscape-page {
        page: safetyLandscapeFull !important;
        width: 297mm !important;
        height: 210mm !important;
        min-height: 210mm !important;
        max-height: 210mm !important;
        padding: 5mm !important;
        font-size: 8.6pt !important;
        line-height: 1.18 !important;
    }

    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[6px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[6\.5px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[7px\] { font-size: 7.6pt !important; line-height: 1.12 !important; }
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[7\.5px\],
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[8px\] { font-size: 8.2pt !important; line-height: 1.14 !important; }
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[9px\] { font-size: 8.8pt !important; line-height: 1.16 !important; }
    body.is-printing-temp #print-area-temp .doc-page:not(.attestato-front):not(.attestato-retro) .text-\[10px\] { font-size: 9.6pt !important; line-height: 1.16 !important; }

    body.is-printing-temp #print-area-temp table { width: 100% !important; border-collapse: collapse !important; }
    body.is-printing-temp #print-area-temp th,
    body.is-printing-temp #print-area-temp td { padding: 1.3mm !important; line-height: 1.13 !important; }

    body.is-printing-temp #print-area-temp .manual-test-inner { width: 287mm !important; height: 200mm !important; padding: 0 !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
    body.is-printing-temp #print-area-temp .manual-test-grid { flex: 1 1 auto !important; min-height: 0 !important; display: grid !important; grid-template-rows: repeat(10, 1fr) !important; grid-auto-flow: column !important; grid-auto-columns: 1fr !important; gap: 1.15mm 2.3mm !important; }

    body.is-printing-temp #print-area-temp .auto-signature-slot { display: flex !important; visibility: visible !important; min-height: 12mm !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    body.is-printing-temp #print-area-temp .auto-signature-img { display: block !important; max-width: 42mm !important; max-height: 13mm !important; object-fit: contain !important; visibility: visible !important; }

    body.is-printing-temp #print-area-temp .doc-page:last-child,
    body.is-printing-temp #print-area-temp .safety-print-page:last-child { page-break-after: auto !important; break-after: auto !important; }
}
        `;
        document.head.appendChild(style);
    };

    const normalizePrintPage = (page) => {
        if (!page || !page.classList) return;
        page.classList.add('print-show', 'temp-page', 'safety-print-page');
        page.classList.remove('hidden', 'scale-[0.8]', 'origin-top');
        page.style.transform = 'none';
        page.style.zoom = '1';
        page.style.scale = '1';
        page.style.position = 'relative';
        page.style.display = 'block';
        page.style.boxSizing = 'border-box';
        page.style.overflow = 'hidden';
        page.style.pageBreakAfter = 'always';
        page.style.breakAfter = 'page';

        if (isLandscapePage(page)) {
            page.classList.add('landscape-force', 'safety-landscape-page');
            page.style.width = '297mm';
            page.style.height = '210mm';
            page.style.minHeight = '210mm';
            page.style.maxHeight = '210mm';
            page.style.padding = page.classList.contains('manual-test-page') ? '0' : '5mm';
        } else if (!isAttestatoPage(page)) {
            page.style.width = '210mm';
            page.style.height = '297mm';
            page.style.minHeight = '297mm';
            page.style.maxHeight = '297mm';
            page.style.padding = '6mm';
        }
    };

    window.prepareSafetyPrintContainer = function(root = document) {
        window.injectSafetyPrintCss();
        const target = root && root.querySelectorAll ? root : document;
        try { window.applyResolvedSignaturesToContainer(target); } catch (error) { console.warn('[Stampe] firme non applicate', error); }
        const pages = Array.from(target.querySelectorAll('.doc-page, .safety-print-page'));
        pages.forEach(normalizePrintPage);
        if (pages.length) {
            const last = pages[pages.length - 1];
            last.style.pageBreakAfter = 'auto';
            last.style.breakAfter = 'auto';
        }
        return {
            pages: pages.length,
            portrait: pages.filter(p => !isLandscapePage(p)).length,
            landscape: pages.filter(isLandscapePage).length,
            signatures: target.querySelectorAll('.auto-signature-slot').length
        };
    };

    // La vecchia funzione di stampa chiama già waitForPrintImages(printArea) prima di window.print().
    // Qui ci limitiamo a preparare il layout e ad attendere poco le immagini: non sovrascriviamo mai window.print().
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
            portrait: pages.filter(p => !isLandscapePage(p)).length,
            landscape: pages.filter(isLandscapePage).length,
            signatures: target.querySelectorAll('.auto-signature-slot').length,
            resolvedSignatures: target.querySelectorAll('.auto-signature-slot[data-signature-resolved="yes"]').length,
            emptySignatureSlots: target.querySelectorAll('.auto-signature-slot[data-signature-resolved="no"], .auto-signature-slot[data-signature-resolved="load-error"]').length
        };
        console.info('[Stampe] audit', report);
        return report;
    };

    window.installSafetySignaturePatches();
    setTimeout(window.installSafetySignaturePatches, 0);
    setTimeout(window.installSafetySignaturePatches, 500);
    setTimeout(window.installSafetySignaturePatches, 1500);
})();
