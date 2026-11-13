// QR code di verifica online sul retro dell'attestato (13 novembre 2026).
// Il QR contiene solo il link alla pagina pubblica verifica.html con il codice casuale
// dell'iscrizione (iscrizioni.verifica_token): i dati vengono letti dall'archivio al momento
// della verifica. Il riquadro è sovrapposto in basso a destra del retro, nello spazio libero
// sotto il programma del corso (position:absolute):
// l'impaginazione dell'attestato non cambia. Senza codice di verifica (SQL non ancora eseguito)
// o sulle bozze il QR non compare.
(function () {
    if (window.__attestatoQrLoaded) return;
    window.__attestatoQrLoaded = true;

    const DEFAULT_BASE = 'https://safety-manager-ultimate.vercel.app';
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    window.getAttestatoVerifyBaseUrl = function () {
        if (window.SAFETY_VERIFY_BASE_URL) return String(window.SAFETY_VERIFY_BASE_URL).replace(/\/+$/, '');
        const origin = String(window.location?.origin || '');
        if (/^https:\/\//.test(origin) && !/localhost|127\.0\.0\.1|\[::1\]/.test(origin)) return origin;
        return DEFAULT_BASE;
    };

    window.getAttestatoVerifyUrl = function (token) {
        const t = String(token || '').trim().toLowerCase();
        if (!UUID_RE.test(t)) return '';
        return `${window.getAttestatoVerifyBaseUrl()}/verifica.html?t=${t}`;
    };

    window.buildAttestatoQrSvg = function (text) {
        if (!text || typeof window.qrcode !== 'function') return '';
        const qr = window.qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
    };

    window.renderAttestatoVerificaQr = function (corsista, root = document) {
        const boxes = root.querySelectorAll('[data-attestato-qr]');
        const url = window.getAttestatoVerifyUrl(corsista?.verifica_token);
        const svg = url ? window.buildAttestatoQrSvg(url) : '';
        boxes.forEach(box => {
            const code = box.querySelector('.attestato-verifica-qr-code');
            if (!svg || !code) {
                box.style.display = 'none';
                box.removeAttribute('data-qr-url');
                if (code) code.innerHTML = '';
                return;
            }
            code.innerHTML = svg;
            box.dataset.qrUrl = url;
            box.style.display = 'block';
        });
    };
})();
