// Step firme + stampe - risolutore unico firme e stabilizzazione PDF
// Regola utente: se la firma non è disponibile o il file non è caricabile, lo slot resta visibile e vuoto.
// Fix doppie firme: quando uno slot contiene più nominativi, le firme note vengono renderizzate affiancate.
// Fix ruolo: Berardino Pesce può firmare anche come Responsabile del Corso.
// Step stampe: prepara in modo centralizzato anteprime, PDF unico, attestati e pagine portrait/landscape.

(function() {
    if (window.__safetyUnifiedSignaturesLoaded) return;
    window.__safetyUnifiedSignaturesLoaded = true;

    const STATIC_SIGNATURES = [
        {
            src: 'assets/firme/firma_berardino_pesce.png',
            names: ['pesce berardino', 'berardino pesce'],
            roles: [
                'docente',
                'formatore',
                'docente formatore',
                'resp_progetto',
                'responsabile progetto',
                'responsabile progetto formativo',
                'resp_corso',
                'responsabile corso',
                'responsabile del corso',
                'legale',
                'legale_rappresentante',
                'legale rappresentante'
            ]
        },
        {
            src: 'assets/firme/firma_centrella_alberto.png',
            names: ['centrella alberto', 'alberto centrella'],
            roles: [
                'docente',
                'formatore',
                'docente formatore',
                'resp_corso',
                'responsabile corso',
                'responsabile del corso'
            ]
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
        tutor: 'Tutor',
        compilatore: 'Compilatore',
        approvatore: 'Approvatore'
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
        if (/^data:image\//i.test(s)) return true;
        if (/^blob:/i.test(s)) return true;
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
            if (matchedName) {
                uniquePush(out, {
                    src: item.src,
                    source: 'asset-statico',
                    name: matchedName,
                    role: roleKey(role)
                });
            }
        });
        return out;
    };

    const resolveDbDocenteSignatures = (names, role) => {
        const out = [];
        names.forEach(name => {
            const docente = findDocente(name);
            const docenteSrc = first(docente?.firma_docente_url, docente?.firma_url, docente?.firma);
            if (docente && isLoadableSignatureSrc(docenteSrc)) {
                uniquePush(out, {
                    src: docenteSrc,
                    source: 'docente-db',
                    name: docente?.nome_cognome || docente?.nome || name,
                    role: roleKey(role)
                });
            }
        });
        return out;
    };

    window.resolveSafetySignature = function({ name = '', role = '', documentName = '', slot = null } = {}) {
        const rk = roleKey(role);
        const signerName = first(name, fallbackNameForRole(rk));
        const signerParts = splitSignerNames(signerName);
        const searchTexts = [signerName, ...signerParts].filter(v => !isPlaceholder(v));
        const ente = getEnte();
        const signatures = [];

        if (rk === 'legale') {
            const legalSrc = first(
                ente.legale_firma_url,
                ente.firma_legale_url,
                appValue('ente-legale-firma-url', 'cfg-legale-firma-url', 'legale_firma_url')
            );
            if (isLoadableSignatureSrc(legalSrc)) {
                uniquePush(signatures, { src: legalSrc, source: 'ente-db', name: signerName, role: rk });
            }
        }

        resolveDbDocenteSignatures(signerParts.length ? signerParts : [signerName], rk).forEach(s => uniquePush(signatures, s));

        searchTexts.forEach(text => {
            resolveStaticSignatures(text, rk).forEach(s => uniquePush(signatures, s));
        });

        const firstSignature = signatures[0] || null;
        return {
            src: firstSignature?.src || '',
            signatures,
            source: firstSignature?.source || 'empty-slot',
            name: signerName,
            role: rk,
            documentName,
            multi: signatures.length > 1
        };
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
        return first(
            el?.textContent,
            el?.innerText,
            slot.getAttribute('data-signature-name'),
            fallbackNameForRole(slot.getAttribute('data-signature-role') || '')
        );
    };

    const renderEmptySignatureSlot = (slot, info = {}) => {
        const spacer = document.createElement('span');
        spacer.className = 'signature-empty-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.display = 'block';
        spacer.style.width = '42mm';
        spacer.style.height = '11mm';
        spacer.style.maxHeight = '11mm';
        spacer.style.pointerEvents = 'none';
        slot.appendChild(spacer);
        console.info('[Firme] slot vuoto mantenuto', info);
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
                signatures = signaturePath
                    .filter(isLoadableSignatureSrc)
                    .map(src => ({ src, name, role: rk, source: 'direct-array' }));
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
        slot.title = signatures.length
            ? `Firma ${name || label} caricata (${label})`
            : `Slot firma vuoto: ${label}${name ? ' - ' + name : ''}`;
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.gap = signatures.length > 1 ? '2.5mm' : '0';
        slot.style.minHeight = slot.style.minHeight || '12mm';
        slot.style.width = slot.style.width || '100%';

        if (!signatures.length) {
            renderEmptySignatureSlot(slot, { role: rk, label, name });
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
                    renderEmptySignatureSlot(slot, { role: rk, label, name, src: signature.src });
                }
                console.warn('[Firme] file firma non caricabile, slot lasciato vuoto se nessuna altra firma è valida', { role: rk, label, name, src: signature.src });
            };
            slot.appendChild(img);
        });
        console.info('[Firme] firma/e applicata/e', { role: rk, label, name, signatures });
    };

    window.applyResolvedSignaturesToContainer = function(root = document) {
        const container = root && root.querySelectorAll ? root : document;
        const slots = Array.from(container.querySelectorAll('.auto-signature-slot'));
        slots.forEach(slot => {
            const role = slot.getAttribute('data-signature-role') || '';
            const name = window.getSignatureNameForSlot(slot);
            const docPage = slot.closest('.doc-page');
            const documentName = docPage?.dataset?.printModule || docPage?.className || window.currentPrintModule || '';
            const resolved = window.resolveSafetySignature({ name, role, documentName, slot });
            window.renderAutoSignatureSlot(slot, resolved.src, resolved.name || name, {
                role,
                source: resolved.source,
                documentName,
                signatures: resolved.signatures
            });
        });
        return slots.length;
    };

    window.applyAutomaticSignatureImages = function(root = document) {
        return window.applyResolvedSignaturesToContainer(root);
    };

    const wrapRenderPrintModuleToTemp = () => {
        if (typeof window.renderPrintModuleToTemp !== 'function' || window.renderPrintModuleToTemp.__signaturesWrapped) return;
        const original = window.renderPrintModuleToTemp;
        const wrapped = async function(...args) {
            const pages = await original.apply(this, args);
            (pages || []).forEach(p => {
                window.applyResolvedSignaturesToContainer(p);
                if (typeof window.prepareSafetyPrintContainer === 'function') window.prepareSafetyPrintContainer(p);
            });
            return pages;
        };
        wrapped.__signaturesWrapped = true;
        window.renderPrintModuleToTemp = wrapped;
    };

    const wrapRenderAttestatiMultipli = () => {
        if (typeof window.renderAttestatiMultipli !== 'function' || window.renderAttestatiMultipli.__signaturesWrapped) return;
        const original = window.renderAttestatiMultipli;
        const wrapped = async function(container, options = {}) {
            const result = await original.apply(this, [container, options]);
            if (container) {
                window.applyResolvedSignaturesToContainer(container);
                if (typeof window.prepareSafetyPrintContainer === 'function') window.prepareSafetyPrintContainer(container);
            }
            return result;
        };
        wrapped.__signaturesWrapped = true;
        window.renderAttestatiMultipli = wrapped;
    };

    const wrapLoadPrintPreview = () => {
        if (typeof window.loadPrintPreview !== 'function' || window.loadPrintPreview.__signaturesWrapped) return;
        const original = window.loadPrintPreview;
        const wrapped = async function(...args) {
            const result = await original.apply(this, args);
            const preview = document.getElementById('print-preview-container');
            if (preview) {
                window.applyResolvedSignaturesToContainer(preview);
                if (typeof window.prepareSafetyPrintContainer === 'function') window.prepareSafetyPrintContainer(preview);
            }
            return result;
        };
        wrapped.__signaturesWrapped = true;
        window.loadPrintPreview = wrapped;
    };

    window.installSafetySignaturePatches = function() {
        wrapRenderPrintModuleToTemp();
        wrapRenderAttestatiMultipli();
        wrapLoadPrintPreview();
        window.applyResolvedSignaturesToContainer(document);
    };

    // ================================
    // STEP STAMPE / PDF - stabilizzatore
    // ================================

    const PRINT_STYLE_ID = 'safety-print-stabilizer-style';

    window.injectSafetyPrintCss = function() {
        if (document.getElementById(PRINT_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = PRINT_STYLE_ID;
        style.textContent = `
            @media print {
                @page { size: A4 portrait; margin: 0mm; }
                @page safetyPortraitPage { size: A4 portrait; margin: 0mm; }
                @page safetyLandscapePage { size: A4 landscape; margin: 0mm; }

                html, body {
                    width: 100% !important;
                    min-height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                body.is-printing-temp > *:not(#print-area-temp) {
                    visibility: hidden !important;
                }

                body.is-printing-temp #print-area-temp,
                body.is-printing-temp #print-area-temp * {
                    visibility: visible !important;
                }

                body.is-printing-temp #print-area-temp {
                    display: block !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    min-height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    overflow: visible !important;
                    z-index: 2147483647 !important;
                }

                body.is-printing-temp #print-area-temp .doc-page,
                body.is-printing-temp #print-area-temp .safety-print-page {
                    page: safetyPortraitPage !important;
                    display: block !important;
                    position: relative !important;
                    left: auto !important;
                    top: auto !important;
                    float: none !important;
                    clear: both !important;
                    transform: none !important;
                    rotate: 0deg !important;
                    scale: 1 !important;
                    zoom: 1 !important;
                    width: 210mm !important;
                    height: 297mm !important;
                    min-height: 297mm !important;
                    max-height: 297mm !important;
                    margin: 0 auto !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    background: #ffffff !important;
                    box-shadow: none !important;
                    border: 0 !important;
                    page-break-after: always !important;
                    break-after: page !important;
                }

                body.is-printing-temp #print-area-temp .doc-page.landscape,
                body.is-printing-temp #print-area-temp .doc-page.landscape-force,
                body.is-printing-temp #print-area-temp .doc-page.manual-test-page,
                body.is-printing-temp #print-area-temp .safety-landscape-page {
                    page: safetyLandscapePage !important;
                    width: 297mm !important;
                    height: 210mm !important;
                    min-height: 210mm !important;
                    max-height: 210mm !important;
                    padding: 0 !important;
                    transform: none !important;
                    rotate: 0deg !important;
                    scale: 1 !important;
                    zoom: 1 !important;
                }

                body.is-printing-temp #print-area-temp .manual-test-inner {
                    width: 297mm !important;
                    height: 210mm !important;
                    max-height: 210mm !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                }

                body.is-printing-temp #print-area-temp .manual-test-grid {
                    min-height: 0 !important;
                    overflow: hidden !important;
                }

                body.is-printing-temp #print-area-temp .scale-\\[0\\.8\\],
                body.is-printing-temp #print-area-temp .origin-top {
                    transform: none !important;
                }

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

    const ensurePrintArea = () => {
        let printArea = document.getElementById('print-area-temp');
        if (!printArea) {
            printArea = document.createElement('div');
            printArea.id = 'print-area-temp';
            printArea.style.display = 'none';
            document.body.appendChild(printArea);
        }
        return printArea;
    };

    const isLandscapePage = (page) => {
        if (!page || !page.classList) return false;
        const classText = String(page.className || '');
        return page.classList.contains('landscape') ||
            page.classList.contains('landscape-force') ||
            page.classList.contains('manual-test-page') ||
            page.dataset?.manualTestPage ||
            /landscape/i.test(classText);
    };

    const normalizePrintPage = (page) => {
        if (!page || !page.classList) return;
        page.classList.add('print-show', 'temp-page', 'safety-print-page');
        page.classList.remove('hidden', 'scale-[0.8]', 'origin-top');
        page.style.display = 'block';
        page.style.position = 'relative';
        page.style.left = 'auto';
        page.style.top = 'auto';
        page.style.transform = 'none';
        page.style.zoom = '1';
        page.style.scale = '1';
        page.style.float = 'none';
        page.style.clear = 'both';
        page.style.boxSizing = 'border-box';
        page.style.overflow = 'hidden';
        page.style.pageBreakAfter = 'always';
        page.style.breakAfter = 'page';

        if (isLandscapePage(page)) {
            page.classList.add('safety-landscape-page');
            page.style.width = '297mm';
            page.style.height = '210mm';
            page.style.minHeight = '210mm';
            page.style.maxHeight = '210mm';
        } else {
            page.style.width = '210mm';
            page.style.height = '297mm';
            page.style.minHeight = '297mm';
            page.style.maxHeight = '297mm';
        }
    };

    window.prepareSafetyPrintContainer = function(root = null) {
        window.injectSafetyPrintCss();
        const target = root || ensurePrintArea();
        if (typeof window.applyResolvedSignaturesToContainer === 'function') {
            try { window.applyResolvedSignaturesToContainer(target); } catch (error) { console.warn('[Stampe] firme non applicate in preparazione', error); }
        }
        const pages = Array.from(target.querySelectorAll ? target.querySelectorAll('.doc-page, .safety-print-page') : []);
        pages.forEach(normalizePrintPage);
        if (pages.length) {
            const last = pages[pages.length - 1];
            last.style.pageBreakAfter = 'auto';
            last.style.breakAfter = 'auto';
        }
        const stats = {
            pages: pages.length,
            portrait: pages.filter(p => !isLandscapePage(p)).length,
            landscape: pages.filter(isLandscapePage).length,
            signatures: target.querySelectorAll ? target.querySelectorAll('.auto-signature-slot').length : 0,
            resolvedSignatures: target.querySelectorAll ? target.querySelectorAll('.auto-signature-slot[data-signature-resolved="yes"]').length : 0
        };
        if (pages.length) console.info('[Stampe] contenitore preparato per PDF/stampa', stats);
        return stats;
    };

    const oldWaitForPrintImages = typeof window.waitForPrintImages === 'function' ? window.waitForPrintImages : null;
    window.waitForPrintImages = async function(root = document, timeoutMs = 2800) {
        const container = root || document;
        window.prepareSafetyPrintContainer(container);
        if (oldWaitForPrintImages && oldWaitForPrintImages !== window.waitForPrintImages) {
            try { await oldWaitForPrintImages(container); } catch (error) { console.warn('[Stampe] attesa immagini precedente non completata', error); }
        }
        const images = Array.from(container.querySelectorAll ? container.querySelectorAll('img') : [])
            .filter(img => img && img.src && !img.complete);
        if (!images.length) return true;
        await Promise.race([
            Promise.all(images.map(img => new Promise(resolve => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            }))),
            new Promise(resolve => setTimeout(resolve, Number(timeoutMs) || 2800))
        ]);
        return true;
    };

    const wrapBrowserPrint = () => {
        if (window.print?.__safetyPrintWrapped) return;
        const originalPrint = window.print.bind(window);
        const wrappedPrint = function(...args) {
            try {
                const printArea = document.getElementById('print-area-temp');
                if (printArea) window.prepareSafetyPrintContainer(printArea);
                document.body.classList.add('is-printing-temp');
            } catch (error) {
                console.warn('[Stampe] preparazione immediata pre-print non completata', error);
            }
            return originalPrint(...args);
        };
        wrappedPrint.__safetyPrintWrapped = true;
        window.print = wrappedPrint;
    };

    const wrapKnownPrintFunction = (name) => {
        const fn = window[name];
        if (typeof fn !== 'function' || fn.__safetyPrintStabilized) return;
        const wrapped = async function(...args) {
            window.injectSafetyPrintCss();
            const result = await fn.apply(this, args);
            const printArea = document.getElementById('print-area-temp');
            if (printArea) window.prepareSafetyPrintContainer(printArea);
            return result;
        };
        wrapped.__safetyPrintStabilized = true;
        window[name] = wrapped;
    };

    window.installSafetyPrintStabilizer = function() {
        window.injectSafetyPrintCss();
        wrapBrowserPrint();
        [
            'stampaFascicoloCompletoPDF',
            'stampaAttestatiProgetto',
            'stampaAttestatoCorsista',
            'stampaSoloAttestatiPDF',
            'stampaModuloProgettoRapido',
            'stampaProgettoFormativoDaProgetto'
        ].forEach(wrapKnownPrintFunction);
        const printArea = document.getElementById('print-area-temp');
        if (printArea) window.prepareSafetyPrintContainer(printArea);
    };

    window.auditSafetyPrint = function(root = document) {
        const target = root || document;
        const pages = Array.from(target.querySelectorAll ? target.querySelectorAll('.doc-page, .safety-print-page') : []);
        const report = {
            pages: pages.length,
            portrait: pages.filter(p => !isLandscapePage(p)).length,
            landscape: pages.filter(isLandscapePage).length,
            manualTests: pages.filter(p => p.dataset?.manualTestPage).length,
            signatures: target.querySelectorAll ? target.querySelectorAll('.auto-signature-slot').length : 0,
            resolvedSignatures: target.querySelectorAll ? target.querySelectorAll('.auto-signature-slot[data-signature-resolved="yes"]').length : 0,
            emptySignatureSlots: target.querySelectorAll ? target.querySelectorAll('.auto-signature-slot[data-signature-resolved="no"], .auto-signature-slot[data-signature-resolved="load-error"]').length : 0
        };
        console.info('[Stampe] audit', report);
        return report;
    };

    window.installSafetySignaturePatches();
    window.installSafetyPrintStabilizer();
    setTimeout(() => {
        window.installSafetySignaturePatches();
        window.installSafetyPrintStabilizer();
    }, 0);
    setTimeout(() => {
        window.installSafetySignaturePatches();
        window.installSafetyPrintStabilizer();
    }, 500);
    setTimeout(() => {
        window.installSafetySignaturePatches();
        window.installSafetyPrintStabilizer();
    }, 1500);
})();
