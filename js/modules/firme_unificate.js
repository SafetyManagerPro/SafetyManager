// Step firme - risolutore unico firme e slot sempre presenti
// Regola utente: se la firma non è disponibile o il file non è caricabile, lo slot resta visibile e vuoto.
// Fix doppie firme: quando uno slot contiene più nominativi, le firme note vengono renderizzate affiancate.
// Fix ruolo: Berardino Pesce può firmare anche come Responsabile del Corso.

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
            roles: ['docente', 'formatore', 'resp_corso', 'responsabile corso', 'responsabile del corso']
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
            (pages || []).forEach(p => window.applyResolvedSignaturesToContainer(p));
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
            if (container) window.applyResolvedSignaturesToContainer(container);
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
            if (preview) window.applyResolvedSignaturesToContainer(preview);
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

    window.installSafetySignaturePatches();
    setTimeout(window.installSafetySignaturePatches, 0);
    setTimeout(window.installSafetySignaturePatches, 500);
})();
