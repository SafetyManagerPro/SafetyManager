// Backup e ripristino locale module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.backupLog = function(message) {
    const box = document.getElementById('backup-db-status');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML += `[${new Date().toLocaleTimeString('it-IT')}] ${window.dashEscape ? window.dashEscape(message) : message}<br>`;
    box.scrollTop = box.scrollHeight;
};

window.downloadBlobFile = function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
    }, 1000);
};

window.esportaBackupDatabaseLocale = async function() {
    if (!window.supabaseClient) return alert('Supabase non configurato.');
    const status = document.getElementById('backup-db-status');
    if (status) status.innerHTML = '';

    const tables = [
        'enti',
        'aziende',
        'docenti',
        'corsisti',
        'progetti',
        'iscrizioni',
        'firme_digitali',
        'test_digitali',
        'export_fascicoli',
        'ente'
    ];

    const backup = {
        meta: {
            app: 'SafetyManager PRO',
            version: 'ASR2025 step64',
            exported_at: new Date().toISOString(),
            source: 'Supabase client export',
            note: 'Backup locale JSON creato dal browser. Non contiene chiavi service_role.'
        },
        tables: {},
        errors: {}
    };

    window.backupLog('Avvio esportazione backup locale...');
    for (const table of tables) {
        try {
            window.backupLog(`Lettura tabella ${table}...`);
            const { data, error } = await window.supabaseClient
                .from(table)
                .select('*');
            if (error) throw error;
            backup.tables[table] = data || [];
            window.backupLog(`OK ${table}: ${(data || []).length} record.`);
        } catch (e) {
            backup.tables[table] = [];
            backup.errors[table] = e.message || String(e);
            window.backupLog(`SKIP ${table}: ${backup.errors[table]}`);
        }
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `SafetyManager_backup_${stamp}.zip`;

    try {
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            zip.file('backup_completo.json', JSON.stringify(backup, null, 2));
            zip.file('manifest.json', JSON.stringify(backup.meta, null, 2));
            const folder = zip.folder('tabelle');
            Object.entries(backup.tables).forEach(([table, rows]) => {
                folder.file(`${table}.json`, JSON.stringify(rows, null, 2));
            });
            if (Object.keys(backup.errors).length) {
                zip.file('ERRORI_EXPORT.json', JSON.stringify(backup.errors, null, 2));
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            window.downloadBlobFile(blob, filename);
        } else {
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            window.downloadBlobFile(blob, filename.replace('.zip', '.json'));
        }
        window.backupLog(`Backup creato: ${filename}`);
        alert('Backup database scaricato sul PC.');
    } catch (e) {
        console.error(e);
        alert('Errore nella creazione del backup: ' + (e.message || e));
        window.backupLog(`ERRORE: ${e.message || e}`);
    }
};


// ==========================================
// RIPRISTINO BACKUP LOCALE DATABASE
// ==========================================
window.restoreBackupParsed = null;

window.restoreLog = function(message) {
    const box = document.getElementById('restore-db-status');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML += `[${new Date().toLocaleTimeString('it-IT')}] ${window.dashEscape ? window.dashEscape(message) : message}<br>`;
    box.scrollTop = box.scrollHeight;
};

window.leggiFileBackupLocale = async function() {
    const input = document.getElementById('restore-backup-file');
    const file = input?.files?.[0];
    if (!file) throw new Error('Seleziona un file backup .zip o .json.');

    const name = file.name.toLowerCase();
    if (name.endsWith('.zip')) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip non disponibile: impossibile leggere backup ZIP.');
        const zip = await JSZip.loadAsync(file);
        let content = null;
        if (zip.file('backup_completo.json')) {
            content = await zip.file('backup_completo.json').async('string');
        } else if (zip.file('manifest.json')) {
            // Backup separato: ricostruisce dalle tabelle JSON.
            const tables = {};
            const entries = Object.keys(zip.files).filter(k => k.startsWith('tabelle/') && k.endsWith('.json'));
            for (const key of entries) {
                const table = key.split('/').pop().replace(/\.json$/,'');
                tables[table] = JSON.parse(await zip.file(key).async('string'));
            }
            return { meta: { source: 'Ricostruito da ZIP tabelle' }, tables, errors: {} };
        } else {
            throw new Error('Backup ZIP non valido: manca backup_completo.json o cartella tabelle/.');
        }
        return JSON.parse(content);
    }

    if (name.endsWith('.json')) {
        return JSON.parse(await file.text());
    }

    throw new Error('Formato non supportato. Usa .zip o .json.');
};

window.normalizzaBackupSafetyManager = function(raw) {
    if (!raw) throw new Error('Backup vuoto.');
    if (raw.tables && typeof raw.tables === 'object') return raw;
    // Supporto backup singola tabella o vecchi export array.
    if (Array.isArray(raw)) return { meta: { source: 'Array JSON generico' }, tables: { import_generico: raw }, errors: {} };
    throw new Error('Struttura backup non riconosciuta.');
};

window.analizzaBackupDaRipristinare = async function() {
    const box = document.getElementById('restore-db-status');
    if (box) box.innerHTML = '';
    try {
        window.restoreLog('Lettura file backup...');
        const raw = await window.leggiFileBackupLocale();
        const backup = window.normalizzaBackupSafetyManager(raw);
        window.restoreBackupParsed = backup;

        const tables = Object.entries(backup.tables || {});
        if (!tables.length) throw new Error('Nessuna tabella trovata nel backup.');

        window.restoreLog(`Backup letto. Tabelle trovate: ${tables.length}.`);
        tables.forEach(([table, rows]) => window.restoreLog(`${table}: ${Array.isArray(rows) ? rows.length : 0} record.`));
        if (backup.meta?.exported_at) window.restoreLog(`Data backup: ${backup.meta.exported_at}`);
        alert('Backup analizzato correttamente. Controlla il log prima di ripristinare.');
    } catch (e) {
        console.error(e);
        window.restoreLog(`ERRORE ANALISI: ${e.message || e}`);
        alert('Errore analisi backup: ' + (e.message || e));
    }
};

window.ripristinaBackupDatabaseLocale = async function() {
    if (!window.supabaseClient) return alert('Supabase non configurato.');
    try {
        if (!window.restoreBackupParsed) {
            await window.analizzaBackupDaRipristinare();
        }
        const backup = window.restoreBackupParsed;
        if (!backup || !backup.tables) throw new Error('Backup non caricato.');

        const tablesOrder = [
            'enti',
            'ente',
            'aziende',
            'docenti',
            'corsisti',
            'progetti',
            'iscrizioni',
            'firme_digitali',
            'test_digitali',
            'export_fascicoli'
        ];

        const present = Object.keys(backup.tables);
        const ordered = [
            ...tablesOrder.filter(t => present.includes(t)),
            ...present.filter(t => !tablesOrder.includes(t) && t !== 'import_generico')
        ];

        if (!ordered.length) throw new Error('Nessuna tabella ripristinabile trovata.');
        const msg = `Ripristino conservativo di ${ordered.length} tabelle. I record con stesso ID verranno aggiornati/inseriti. Continuare?`;
        if (!confirm(msg)) return;

        window.restoreLog('Avvio ripristino conservativo...');
        for (const table of ordered) {
            const rows = backup.tables[table];
            if (!Array.isArray(rows) || !rows.length) {
                window.restoreLog(`SKIP ${table}: nessun record.`);
                continue;
            }

            window.restoreLog(`Ripristino ${table}: ${rows.length} record...`);
            const chunkSize = 200;
            let done = 0;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize).map(row => {
                    const clean = { ...row };
                    // Evita colonne virtuali/join eventualmente finite nel backup.
                    Object.keys(clean).forEach(k => {
                        if (clean[k] && typeof clean[k] === 'object' && !Array.isArray(clean[k]) && ['aziende','corsisti'].includes(k)) {
                            delete clean[k];
                        }
                    });
                    return clean;
                });

                const { error } = await window.supabaseClient
                    .from(table)
                    .upsert(chunk, { onConflict: 'id' });
                if (error) throw new Error(`${table}: ${error.message}`);
                done += chunk.length;
                window.restoreLog(`${table}: ${done}/${rows.length}`);
            }
            window.restoreLog(`OK ${table}.`);
        }

        window.restoreLog('Ripristino completato.');
        alert('Ripristino backup completato. Ricarica le schermate per vedere i dati aggiornati.');
    } catch (e) {
        console.error(e);
        window.restoreLog(`ERRORE RIPRISTINO: ${e.message || e}`);
        alert('Errore ripristino backup: ' + (e.message || e));
    }
};


// ==========================================
// EXPORT / STAMPA PDF SEZIONI OPERATIVE
// ==========================================
window.SECTION_EXPORT_LABELS = {
    aziende: 'Aziende',
    corsisti: 'Corsisti',
    docenti: 'Docenti',
    progetti: 'Progetti',
    archivio_corsi: 'Archivio',
    scadenze: 'Scadenze'
};
