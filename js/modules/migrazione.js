// Migrazione dati module
// Estratto da js/utils.js nello step 23 per ridurre il file principale.

window.initMigrazione = function() {
    window.migParsedData = [];
    window.migHeaders = [];
    document.getElementById('mig-step-2').classList.add('hidden');
    document.getElementById('mig-log').innerHTML = '[System] Modulo Migrazione Dati attivato. In attesa di file .csv o .json...';
};

window.logMig = function(msg, isError = false) {
    const logBox = document.getElementById('mig-log');
    if(!logBox) return;
    const color = isError ? 'text-red-400' : 'text-emerald-400';
    logBox.innerHTML += `<br><span class="${color}">> ${msg}</span>`;
    logBox.scrollTop = logBox.scrollHeight;
};

window.logMigDbError = function(context, error, rowNumber = null) {
    console.error(`Errore migrazione - ${context}:`, error);
    const where = rowNumber ? `riga ${rowNumber}` : 'operazione database';
    const details = [error?.message, error?.hint, error?.details].filter(Boolean).join(' · ');
    window.logMig(`${where} — ${context}: ${details || 'errore non specificato'}`, true);
};

window.handleFileSelect = function() {
    const fileInput = document.getElementById('mig-file');
    if (!fileInput.files.length) return alert("Seleziona un file prima di procedere.");
    
    const file = fileInput.files[0];
    window.logMig(`Lettura del file: ${file.name}...`);

    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                window.migParsedData = results.data;
                window.migHeaders = results.meta.fields;
                window.logMig(`Rilevate ${window.migParsedData.length} righe valide nel CSV.`);
                window.buildMappingUI();
            },
            error: function(err) {
                window.logMig(`Errore parsing CSV: ${err}`, true);
            }
        });
    } else if (file.name.endsWith('.json')) {
        reader.onload = function(e) {
            try {
                window.migParsedData = JSON.parse(e.target.result);
                if (!Array.isArray(window.migParsedData)) throw new Error("Il JSON deve essere un Array di oggetti.");
                if (window.migParsedData.length > 0) window.migHeaders = Object.keys(window.migParsedData[0]);
                window.logMig(`Rilevate ${window.migParsedData.length} righe nel JSON.`);
                window.buildMappingUI();
            } catch (err) {
                window.logMig(`Errore JSON: ${err.message}`, true);
            }
        };
        reader.readAsText(file);
    } else {
        window.logMig(`Formato file non supportato. Usare .csv o .json`, true);
    }
};

window.buildMappingUI = function() {
    const container = document.getElementById('mig-mapping-container');
    if(!container) return;
    let html = '';

    let optionsHtml = '<option value="">-- Ignora / Non Importare --</option>';
    window.migHeaders.forEach(h => {
        optionsHtml += `<option value="${h}">${h}</option>`;
    });

    window.DB_TARGETS.forEach(target => {
        let autoSelected = "";
        for (let h of window.migHeaders) {
            let hClean = h.toLowerCase().trim();
            if (target.aliases.some(alias => hClean.includes(alias))) {
                autoSelected = h;
                break;
            }
        }

        let dynamicOptions = optionsHtml.replace(`value="${autoSelected}"`, `value="${autoSelected}" selected`);

        html += `
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="w-1/2">
                <span class="text-[10px] font-bold text-slate-800 uppercase block">${target.label}</span>
            </div>
            <div class="w-1/2 pl-4">
                <select id="map_${target.id}" class="w-full text-xs p-1.5 border border-slate-300 rounded bg-slate-50 focus:border-blue-500 focus:bg-white transition outline-none">
                    ${dynamicOptions}
                </select>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    document.getElementById('mig-step-2').classList.remove('hidden');
    window.logMig("Interfaccia di Mappatura Colonne generata. Controlla e premi Avvia Importazione.");
};

window.startImportProcess = async function() {
    const btn = document.getElementById('btn-start-import');
    if(!btn) return;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Elaborazione in corso...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    let mapConfig = {};
    window.DB_TARGETS.forEach(t => {
        mapConfig[t.id] = document.getElementById(`map_${t.id}`).value;
    });

    window.logMig("Inizio procedura di elaborazione dati Relazionali (Upsert)...");

    try {
        const mapAziende = {}; 
        const mapDocenti = {}; 
        const mapCorsisti = {}; 
        const mapProgetti = {}; 

        const { data: exAz } = await supabaseClient.from('aziende').select('id, ragione_sociale');
        if(exAz) exAz.forEach(a => mapAziende[a.ragione_sociale.toLowerCase().trim()] = a.id);

        const { data: exDoc } = await supabaseClient.from('docenti').select('id, nome_cognome');
        if(exDoc) exDoc.forEach(d => mapDocenti[d.nome_cognome.toLowerCase().trim()] = d.id);

        const { data: exCor } = await supabaseClient.from('corsisti').select('id, cf');
        if(exCor) exCor.forEach(c => mapCorsisti[c.cf] = c.id);

        const { data: exProg } = await supabaseClient.from('progetti').select('id, codice');
        if(exProg) exProg.forEach(p => mapProgetti[p.codice] = p.id);

        let cAz = 0, cDoc = 0, cCor = 0, cPrg = 0, cIsc = 0, cErr = 0;

        for (const [rowIndex, row] of window.migParsedData.entries()) {
            const rowNumber = rowIndex + 2; // intestazione CSV/JSON esclusa
            const azName = mapConfig.az_ragione && row[mapConfig.az_ragione] ? row[mapConfig.az_ragione].trim() : "Privato";
            const azPiva = mapConfig.az_piva && row[mapConfig.az_piva] ? row[mapConfig.az_piva].trim() : "";
            const azInd = mapConfig.az_ind && row[mapConfig.az_ind] ? row[mapConfig.az_ind].trim() : "";

            const corNome = mapConfig.cor_nome && row[mapConfig.cor_nome] ? row[mapConfig.cor_nome].trim() : "";
            const corCf = mapConfig.cor_cf && row[mapConfig.cor_cf] ? row[mapConfig.cor_cf].trim().toUpperCase() : "";
            const corNascita = mapConfig.cor_nascita && row[mapConfig.cor_nascita] ? row[mapConfig.cor_nascita].trim() : "";
            const corMans = mapConfig.cor_mans && row[mapConfig.cor_mans] ? row[mapConfig.cor_mans].trim() : "";

            const docNome = mapConfig.doc_nome && row[mapConfig.doc_nome] ? row[mapConfig.doc_nome].trim() : "";

            const prgCod = mapConfig.prg_codice && row[mapConfig.prg_codice] ? row[mapConfig.prg_codice].trim() : "";
            const prgCorsoStr = mapConfig.prg_corso && row[mapConfig.prg_corso] ? row[mapConfig.prg_corso].toLowerCase().trim() : "";
            const prgDataRaw = mapConfig.prg_data && row[mapConfig.prg_data] ? row[mapConfig.prg_data].trim() : "";

            const iscCert = mapConfig.isc_cert && row[mapConfig.isc_cert] ? row[mapConfig.isc_cert].trim() : "";
            const iscScadRaw = mapConfig.isc_scad && row[mapConfig.isc_scad] ? row[mapConfig.isc_scad].trim() : "";

            if (!corCf) continue; 

            let azKey = azName.toLowerCase();
            if (azName !== "Privato" && !mapAziende[azKey]) {
                const { data, error } = await supabaseClient.from('aziende').insert([{ ragione_sociale: azName, piva_cf: azPiva, indirizzo: azInd }]).select();
                if (error) {
                    window.logMigDbError('creazione azienda', error, rowNumber);
                    cErr++;
                    continue;
                }
                if (data && data.length > 0) { mapAziende[azKey] = data[0].id; cAz++; }
            }

            if (docNome && !mapDocenti[docNome.toLowerCase()]) {
                const { data, error } = await supabaseClient.from('docenti').insert([{ nome_cognome: docNome, qualifica: "Formatore Qualificato (D.I. 6/3/2013)" }]).select();
                if (error) {
                    window.logMigDbError('creazione docente', error, rowNumber);
                    cErr++;
                    continue;
                }
                if (data && data.length > 0) { mapDocenti[docNome.toLowerCase()] = data[0].id; cDoc++; }
            }

            if (!mapCorsisti[corCf]) {
                const { data, error } = await supabaseClient.from('corsisti').insert([{
                    cf: corCf, nome_cognome: corNome, luogo_data_nascita: corNascita, mansione_storica: corMans, azienda_id: mapAziende[azKey] || null
                }]).select();
                if (error) {
                    window.logMigDbError('creazione corsista', error, rowNumber);
                    cErr++;
                    continue;
                }
                if (data && data.length > 0) { mapCorsisti[corCf] = data[0].id; cCor++; }
            }

            let finalProgId = null;
            if (prgCod) {
                if (!mapProgetti[prgCod]) {
                    let corsoId = 'lav_basso';
                    if (prgCorsoStr.includes('alto')) corsoId = 'lav_alto';
                    else if (prgCorsoStr.includes('medio')) corsoId = 'lav_medio';
                    else if (prgCorsoStr.includes('rls')) corsoId = 'rls';
                    else if (prgCorsoStr.includes('preposto')) corsoId = 'preposto';
                    else if (prgCorsoStr.includes('antincendio')) corsoId = 'antincendio_liv2';
                    else if (prgCorsoStr.includes('primo soccorso')) corsoId = 'primo_soccorso_12h';
                    else if (prgCorsoStr.includes('carrell') || prgCorsoStr.includes('mulett')) corsoId = 'attr_carrelli_ind';

                    let docJson = {};
                    if(docNome) docJson["UD1"] = mapDocenti[docNome.toLowerCase()] || "";

                    const { data, error } = await supabaseClient.from('progetti').insert([{
                        codice: prgCod,
                        azienda_id: mapAziende[azKey] || null,
                        corso_id: corsoId,
                        modalita: "In Presenza Fisica",
                        data_inizio: window.formatDataToISODate(prgDataRaw) || null,
                        data_esame: window.formatDataToISODate(prgDataRaw) || null,
                        ente_erogatore: "ente",
                        docente_principale: JSON.stringify(docJson)
                    }]).select();

                    if (error) {
                        window.logMigDbError('creazione progetto', error, rowNumber);
                        cErr++;
                        continue;
                    }

                    if (data && data.length > 0) { 
                        mapProgetti[prgCod] = data[0].id; 
                        finalProgId = data[0].id;
                        cPrg++; 
                    }
                } else {
                    finalProgId = mapProgetti[prgCod];
                }

                if (finalProgId && iscCert) {
                    const { data: exIsc } = await supabaseClient.from('iscrizioni').select('id').eq('id_certificato', iscCert);
                    if (!exIsc || exIsc.length === 0) {
                        const { error } = await supabaseClient.from('iscrizioni').insert([{
                            progetto_id: finalProgId,
                            corsista_id: mapCorsisti[corCf],
                            id_certificato: iscCert,
                            esito: "Idoneo",
                            data_scadenza: window.formatDataToISODate(iscScadRaw) || null
                        }]);
                        if (error) {
                            window.logMigDbError('creazione attestato/iscrizione', error, rowNumber);
                            cErr++;
                        } else {
                            cIsc++;
                        }
                    }
                }
            }
        }

        window.logMig(cErr ? `MIGRAZIONE COMPLETATA CON ${cErr} ERRORI SEGNALATI.` : `MIGRAZIONE COMPLETATA CON SUCCESSO!`, cErr > 0);
        window.logMig(`- Aziende generate: ${cAz}`);
        window.logMig(`- Docenti generati: ${cDoc}`);
        window.logMig(`- Corsisti importati: ${cCor}`);
        window.logMig(`- Progetti formativi ricreati: ${cPrg}`);
        window.logMig(`- Attestati e Scadenze registrate: ${cIsc}`);
        window.logMig(`- Righe/operazioni con errore: ${cErr}`, cErr > 0);
        
        if(typeof window.loadDashboardStats === 'function') window.loadDashboardStats();

    } catch (err) {
        window.logMig(`ERRORE CRITICO DB: ${err.message}`, true);
    } finally {
        btn.innerHTML = '<i data-lucide="play-circle" class="w-5 h-5"></i> Avvia Importazione';
        btn.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// ==========================================
// GENERATORE DEI TEST E CORRETTORE
// ==========================================
