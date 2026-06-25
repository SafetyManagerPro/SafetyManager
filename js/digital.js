// js/digital.js
// Step 3: firme tablet/smartphone, test digitale e fascicolo corso esportabile.
(function () {
  const SIGN_KEY = 'SafetyManager.digitalSignatures.v1';
  const TEST_KEY = 'SafetyManager.digitalTests.v1';
  const EXPORT_DOCS = ['progetto_formativo','dichiarazione_docenza','autocert','richiesta_organismo_paritetico','dichiarazione_attrezzature','registro','verbale','fascicolo_corso'];
  window.digitalProcedureState = { progetto:null, iscritti:[], canvas:null, ctx:null, drawing:false, hasInk:false, last:null, activeSignature:null, activeTest:null, pendingTestSignature:null };

  const parse = (v,f)=>{try{return JSON.parse(v||'')}catch(e){return f}};
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug = v => String(v||'fascicolo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').substring(0,90) || 'fascicolo';
  const signs = () => parse(localStorage.getItem(SIGN_KEY), []);
  const tests = () => parse(localStorage.getItem(TEST_KEY), []);
  const saveSigns = list => localStorage.setItem(SIGN_KEY, JSON.stringify(list));
  const saveTests = list => localStorage.setItem(TEST_KEY, JSON.stringify(list));
  const keyOf = (p,i,d,c) => [p||'no-project', i||'no-iscrizione', d||'documento', c||'firma'].join('::');

  async function sha256(text){
    if(!crypto?.subtle) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function dataUrlToBytes(url){ const b=atob(String(url).split(',')[1]||''); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i); return a; }
  window.getSignatureDataUrl = (p,i,d,c) => (signs().find(s => s.key === keyOf(p,i,d,c)) || {}).data_url || '';

  async function saveSignatureRemote(r){
    if(!window.supabaseClient) return false;
    try{
      const payload = { progetto_id:r.progetto_id||null, iscrizione_id:r.iscrizione_id||null, corsista_id:r.corsista_id||null, documento:r.documento, campo_firma:r.campo_firma, firmatario_nome:r.firmatario_nome, firmatario_ruolo:r.firmatario_ruolo, data_url:r.data_url, hash_sha256:r.hash_sha256, metadata:r.metadata, signed_at:r.signed_at };
      const { error } = await supabaseClient.from('firme_digitali').upsert(payload, { onConflict:'progetto_id,iscrizione_id,documento,campo_firma' });
      if(error) throw error;
      return true;
    } catch(e){ console.warn('Firma salvata localmente; Supabase non pronto:', e.message || e); return false; }
  }
  async function saveTestRemote(r){
    if(!window.supabaseClient) return false;
    try{
      const { error } = await supabaseClient.from('test_digitali').upsert({ progetto_id:r.progetto_id, iscrizione_id:r.iscrizione_id, corsista_id:r.corsista_id, domande:r.domande, risposte:r.risposte, punteggio:r.punteggio, percentuale:r.percentuale, esito:r.esito, firma_hash:r.firma_hash, metadata:r.metadata, completed_at:r.completed_at }, { onConflict:'progetto_id,iscrizione_id' });
      if(error) throw error;
      await supabaseClient.from('iscrizioni').update({ voto_test:`${r.punteggio} / ${r.totale}`, esito:r.esito, note_verifica:`Test digitale ${r.percentuale}% - ${r.completed_at}` }).eq('id', r.iscrizione_id);
      return true;
    } catch(e){ console.warn('Test salvato localmente; Supabase non pronto:', e.message || e); return false; }
  }

  function pool(courseId){
    let p=[...(window.POOL_GENERALE||[])]; const id=courseId||'';
    if(id.includes('basso')) p=p.concat(window.POOL_BASSO||[]);
    else if(id.includes('alto')||id.includes('medio')) p=p.concat(window.POOL_ALTO||[]);
    else if(id.includes('dirigente')||id.includes('preposto')||id.includes('dl_')) p=p.concat(window.POOL_DIRIGENTI||[]);
    else if(id.includes('cantieri')||id.includes('costruzioni')) p=p.concat(window.POOL_CANTIERI||[]);
    else if(id.includes('attr_')) p=p.concat(window.POOL_ATTREZZATURE||[]);
    else if(id.includes('soccorso')) p=p.concat(window.POOL_PS||[]);
    else if(id.includes('antincendio')) p=p.concat(window.POOL_AI||[]);
    return p;
  }
  function seededQuestions(courseId, seedText){
    let seed=0; for(const ch of seedText) seed=(seed*31+ch.charCodeAt(0))>>>0;
    return pool(courseId).map((q,i)=>({q,sort:Math.sin(seed+i*9999)})).sort((a,b)=>a.sort-b.sort).slice(0,30).map(x=>x.q);
  }

  window.initProcedureDigitali = async function(){
    if(!window.progettiList?.length) window.progettiList = await window.getProgetti();
    const filter=document.getElementById('procedure-filter-corso');
    if(filter){ filter.innerHTML='<option value="">-- Mostra tutti i corsi --</option>'+Object.keys(window.DB_CORSI||{}).map(k=>`<option value="${esc(k)}">[${esc(DB_CORSI[k].code)}] ${esc(DB_CORSI[k].t)}</option>`).join(''); }
    window.filtraProcedureProgetti();
    if(typeof lucide!=='undefined') lucide.createIcons();
  };
  window.filtraProcedureProgetti = function(){
    const sel=document.getElementById('procedure-progetto'); if(!sel) return;
    const f=document.getElementById('procedure-filter-corso')?.value||'';
    sel.innerHTML='<option value="">-- Seleziona un progetto --</option>'+(window.progettiList||[]).filter(p=>!f||p.corso_id===f).map(p=>`<option value="${esc(p.id)}">${esc(p.codice)} - ${esc(p.aziende?.ragione_sociale||'Privato')} (${esc(window.formatDataToItalian(p.data_esame))})</option>`).join('');
  };
  window.caricaProcedureProgetto = async function(){
    const id=document.getElementById('procedure-progetto')?.value; if(!id) return;
    const p=(window.progettiList||[]).find(x=>x.id===id); if(!p) return;
    const iscritti=await window.getIscrizioni(id);
    Object.assign(window.digitalProcedureState,{progetto:p,iscritti});
    document.getElementById('procedure-project-box')?.classList.remove('hidden');
    document.getElementById('procedure-project-title').innerText = `${p.codice} - ${(window.DB_CORSI[p.corso_id]||{}).t || p.corso_id}`;
    document.getElementById('procedure-project-azienda').innerText = p.aziende?.ragione_sociale || 'Privato';
    document.getElementById('procedure-project-data').innerText = window.formatDataToItalian(p.data_esame);
    document.getElementById('procedure-project-count').innerText = iscritti.length;
    window.renderProcedureRegistro(); window.renderProcedureTestSelectors(); window.renderProcedureExtraSignatures();
    if(typeof lucide!=='undefined') lucide.createIcons();
  };
  function signButton(isc, field){
    const p=window.digitalProcedureState.progetto; const url=window.getSignatureDataUrl(p?.id, isc.id, 'registro', field);
    return url ? `<button onclick="window.apriFirmaRegistro('${esc(isc.id)}','${field}')" class="w-full min-w-[120px] h-14 rounded-lg border border-emerald-200 bg-emerald-50 overflow-hidden"><img src="${url}" class="max-h-12 max-w-full object-contain mx-auto" alt="Firma"></button>` : `<button onclick="window.apriFirmaRegistro('${esc(isc.id)}','${field}')" class="w-full min-w-[120px] h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-500 hover:text-emerald-700 font-black uppercase text-[9px]">Firma</button>`;
  }
  window.renderProcedureRegistro = function(){
    const tb=document.getElementById('procedure-registro-rows'); if(!tb) return;
    const iscritti=window.digitalProcedureState.iscritti||[];
    if(!iscritti.length){ tb.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-400 font-bold uppercase">Nessun allievo iscritto</td></tr>'; return; }
    tb.innerHTML=iscritti.map(isc=>`<tr class="hover:bg-slate-50"><td class="p-3"><p class="font-black text-slate-900 uppercase">${esc(isc.corsisti?.nome_cognome)}</p><p class="font-mono text-[10px] text-slate-500">${esc(isc.corsisti?.cf)} · ${esc(isc.mansione_storica||isc.corsisti?.mansione_storica||'')}</p></td><td class="p-3 text-center">${signButton(isc,'entrata_mattina')}</td><td class="p-3 text-center">${signButton(isc,'uscita_mattina')}</td><td class="p-3 text-center">${signButton(isc,'entrata_pomeriggio')}</td><td class="p-3 text-center">${signButton(isc,'uscita_pomeriggio')}</td></tr>`).join('');
  };
  window.renderProcedureTestSelectors = function(){
    const sel=document.getElementById('procedure-test-corsista'); if(!sel) return;
    const p=window.digitalProcedureState.progetto;
    sel.innerHTML='<option value="">-- Seleziona allievo --</option>'+(window.digitalProcedureState.iscritti||[]).map(isc=>`<option value="${esc(isc.id)}">${esc(isc.corsisti?.nome_cognome)} (${esc(isc.corsisti?.cf)})</option>`).join('');
    const ts=tests().filter(t=>t.progetto_id===p?.id);
    document.getElementById('procedure-test-status').innerText = ts.length ? `${ts.length} test salvati localmente.` : 'Nessun test salvato per questo progetto.';
    document.getElementById('procedure-test-results').innerHTML = ts.map(t=>`<div class="border border-slate-200 rounded-xl p-3 bg-slate-50"><p class="font-black text-slate-900 uppercase">${esc(t.corsista_nome)}</p><p class="text-slate-500 mt-1">Punteggio: <span class="font-black ${t.esito==='Idoneo'?'text-emerald-700':'text-red-700'}">${t.punteggio} / ${t.totale} (${t.percentuale}%) - ${esc(t.esito)}</span></p><p class="text-[10px] text-slate-400 mt-1">${esc(new Date(t.completed_at).toLocaleString('it-IT'))}</p></div>`).join('');
  };
  window.renderProcedureExtraSignatures = function(){
    const box=document.getElementById('procedure-extra-signatures'); if(!box) return;
    const p=window.digitalProcedureState.progetto; const list=signs().filter(s=>s.progetto_id===p?.id && s.documento!=='registro' && s.documento!=='test_digitale');
    box.innerHTML = list.length ? list.map(s=>`<div class="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-3"><img src="${s.data_url}" class="w-32 h-14 object-contain bg-white rounded border border-slate-200"><div><p class="font-black text-slate-900 uppercase">${esc(s.firmatario_nome||s.firmatario_ruolo)}</p><p class="text-slate-500">${esc(s.documento)} · ${esc(s.firmatario_ruolo)}</p><p class="text-[10px] text-slate-400">${esc(new Date(s.signed_at).toLocaleString('it-IT'))}</p></div></div>`).join('') : '<div class="text-slate-400 font-bold uppercase text-xs">Nessuna firma extra ancora acquisita.</div>';
  };

  window.apriFirmaRegistro = function(iscrizioneId, field){
    const p=window.digitalProcedureState.progetto; const isc=(window.digitalProcedureState.iscritti||[]).find(x=>x.id===iscrizioneId); if(!p||!isc) return alert('Seleziona un progetto/allievo valido.');
    window.apriFirmaCanvas({progetto_id:p.id,iscrizione_id:isc.id,corsista_id:isc.corsista_id,documento:'registro',campo_firma:field,firmatario_nome:isc.corsisti?.nome_cognome||'Allievo',firmatario_ruolo:'allievo',title:`Firma registro - ${isc.corsisti?.nome_cognome||'Allievo'}`,subtitle:field.replaceAll('_',' ')});
  };
  window.apriFirmaManualeDocumento = function(){
    const p=window.digitalProcedureState.progetto; if(!p) return alert('Seleziona prima un progetto.');
    const nome=document.getElementById('manual-sign-nome')?.value.trim(); if(!nome) return alert('Inserisci il nome del firmatario.');
    const ruolo=document.getElementById('manual-sign-ruolo')?.value||'altro'; const doc=document.getElementById('manual-sign-doc')?.value||'documento';
    window.apriFirmaCanvas({progetto_id:p.id,iscrizione_id:null,corsista_id:null,documento:doc,campo_firma:ruolo,firmatario_nome:nome,firmatario_ruolo:ruolo,title:`Firma ${doc.replaceAll('_',' ')}`,subtitle:`${nome} · ${ruolo.replaceAll('_',' ')}`});
  };
  window.apriFirmaCanvas = function(ctx){
    window.digitalProcedureState.activeSignature=ctx; document.getElementById('signature-modal-title').innerText=ctx.title||'Firma documento'; document.getElementById('signature-modal-subtitle').innerText=ctx.subtitle||'Usa dito/Pencil.'; document.getElementById('signature-note').value=''; document.getElementById('signature-modal')?.classList.remove('hidden'); setTimeout(()=>setupCanvas(document.getElementById('signature-canvas')),50); if(typeof lucide!=='undefined') lucide.createIcons();
  };
  function setupCanvas(canvas){
    if(!canvas) return; const r=canvas.getBoundingClientRect(); const ratio=Math.max(devicePixelRatio||1,1); canvas.width=Math.floor(r.width*ratio)||1; canvas.height=Math.floor(r.height*ratio)||1; const ctx=canvas.getContext('2d'); ctx.setTransform(ratio,0,0,ratio,0,0); ctx.fillStyle='#fff'; ctx.fillRect(0,0,r.width,r.height); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0f172a'; ctx.lineWidth=2.4; Object.assign(window.digitalProcedureState,{canvas,ctx,hasInk:false,drawing:false,last:null}); canvas.onpointerdown=e=>{e.preventDefault(); const st=window.digitalProcedureState; st.drawing=true; st.last=pos(e); canvas.setPointerCapture?.(e.pointerId);}; canvas.onpointermove=e=>{const st=window.digitalProcedureState;if(!st.drawing)return;e.preventDefault();const p=pos(e); st.ctx.lineWidth=Math.max(1.6,Math.min(4.2,1.8+(e.pressure||.5)*2)); st.ctx.beginPath(); st.ctx.moveTo(st.last.x,st.last.y); st.ctx.lineTo(p.x,p.y); st.ctx.stroke(); st.last=p; st.hasInk=true;}; canvas.onpointerup=canvas.onpointercancel=canvas.onpointerleave=e=>{window.digitalProcedureState.drawing=false; try{canvas.releasePointerCapture?.(e.pointerId)}catch(_){}};
  }
  function pos(e){const r=window.digitalProcedureState.canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top};}
  window.pulisciFirmaCanvas = ()=>setupCanvas(window.digitalProcedureState.canvas);
  window.chiudiFirmaCanvas = ()=>{document.getElementById('signature-modal')?.classList.add('hidden'); window.digitalProcedureState.activeSignature=null;};
  window.confermaFirmaCanvas = async function(){
    const st=window.digitalProcedureState; if(!st.canvas||!st.activeSignature) return; if(!st.hasInk) return alert('La firma è vuota.');
    const data_url=st.canvas.toDataURL('image/png'); const metadata={user_agent:navigator.userAgent,platform:navigator.platform,note:document.getElementById('signature-note')?.value||'',app_version:'ASR2025-step3-digital'}; const hash_sha256=await sha256(JSON.stringify(st.activeSignature)+data_url+JSON.stringify(metadata));
    const rec={...st.activeSignature,key:keyOf(st.activeSignature.progetto_id,st.activeSignature.iscrizione_id,st.activeSignature.documento,st.activeSignature.campo_firma),data_url,hash_sha256,metadata,signed_at:new Date().toISOString(),synced:false};
    saveSigns([...signs().filter(s=>s.key!==rec.key),rec]); await saveSignatureRemote(rec);
    if(rec.documento==='test_digitale'){ window.digitalProcedureState.pendingTestSignature=rec; document.getElementById('test-digitale-firma-status').innerHTML=`<span class="text-emerald-700">Firma allievo acquisita: ${esc(rec.firmatario_nome)}</span>`; }
    window.chiudiFirmaCanvas(); window.renderProcedureRegistro?.(); window.renderProcedureExtraSignatures?.();
  };

  window.apriTestDigitaleSelezionato = function(){
    const p=window.digitalProcedureState.progetto; const id=document.getElementById('procedure-test-corsista')?.value; if(!p||!id) return alert('Seleziona progetto e allievo.');
    const isc=window.digitalProcedureState.iscritti.find(x=>x.id===id); const qs=seededQuestions(p.corso_id, `${p.id}-${id}-${isc.corsisti?.cf||''}`); if(!qs.length) return alert('Nessuna domanda disponibile.');
    window.digitalProcedureState.activeTest={progetto:p,iscrizione:isc,questions:qs}; window.digitalProcedureState.pendingTestSignature=null;
    document.getElementById('test-modal-title').innerText=`Test digitale - ${isc.corsisti?.nome_cognome||'Allievo'}`; document.getElementById('test-modal-subtitle').innerText=`${p.codice} · ${(DB_CORSI[p.corso_id]||{}).t||p.corso_id}`; document.getElementById('test-digitale-firma-status').innerText='Firma allievo non ancora acquisita.';
    document.getElementById('test-digitale-form').innerHTML=qs.map((q,qi)=>`<fieldset class="border border-slate-200 rounded-xl p-4 bg-slate-50"><legend class="font-black text-slate-900 text-xs uppercase px-1">Domanda ${qi+1}</legend><p class="font-bold text-slate-800 mt-1 mb-3">${esc(q.q)}</p><div class="grid grid-cols-1 md:grid-cols-2 gap-2">${(q.a||[]).map((a,ai)=>`<label class="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3 text-xs cursor-pointer hover:border-rose-300"><input type="radio" name="q_${qi}" value="${ai}" class="mt-0.5"><span>${esc(a)}</span></label>`).join('')}</div></fieldset>`).join('');
    document.getElementById('test-modal')?.classList.remove('hidden'); if(typeof lucide!=='undefined') lucide.createIcons();
  };
  window.chiudiTestDigitale = ()=>{document.getElementById('test-modal')?.classList.add('hidden'); window.digitalProcedureState.activeTest=null; window.digitalProcedureState.pendingTestSignature=null;};
  window.apriFirmaTestDigitale = function(){ const t=window.digitalProcedureState.activeTest; if(!t) return alert('Apri prima un test.'); const i=t.iscrizione; window.apriFirmaCanvas({progetto_id:t.progetto.id,iscrizione_id:i.id,corsista_id:i.corsista_id,documento:'test_digitale',campo_firma:'firma_allievo',firmatario_nome:i.corsisti?.nome_cognome||'Allievo',firmatario_ruolo:'allievo',title:`Firma test - ${i.corsisti?.nome_cognome||'Allievo'}`,subtitle:'Conferma compilazione test digitale'}); };
  window.salvaTestDigitale = async function(){
    const t=window.digitalProcedureState.activeTest; if(!t) return alert('Nessun test aperto.'); if(!window.digitalProcedureState.pendingTestSignature) return alert('Acquisisci prima la firma dell’allievo.');
    const form=document.getElementById('test-digitale-form'); const risposte=[]; let score=0; t.questions.forEach((q,i)=>{const el=form.querySelector(`input[name="q_${i}"]:checked`); const v=el?Number(el.value):null; risposte.push(v); if(v===q.correct)score++;}); if(risposte.some(v=>v===null)) return alert('Compila tutte le domande.');
    const totale=t.questions.length, percentuale=Math.round(score/totale*100), esito=percentuale>=70?'Idoneo':'Non idoneo'; const rec={key:`${t.progetto.id}::${t.iscrizione.id}`,progetto_id:t.progetto.id,iscrizione_id:t.iscrizione.id,corsista_id:t.iscrizione.corsista_id,corsista_nome:t.iscrizione.corsisti?.nome_cognome||'',domande:t.questions.map(q=>({q:q.q,a:q.a,correct:q.correct})),risposte,punteggio:score,totale,percentuale,esito,firma_hash:window.digitalProcedureState.pendingTestSignature.hash_sha256,metadata:{user_agent:navigator.userAgent,app_version:'ASR2025-step3-digital'},completed_at:new Date().toISOString()};
    saveTests([...tests().filter(x=>x.key!==rec.key),rec]); await saveTestRemote(rec); alert(`Test salvato: ${score}/${totale} (${percentuale}%) - ${esito}`); window.chiudiTestDigitale(); window.renderProcedureTestSelectors();
  };
  window.sincronizzaProcedureDigitali = async function(){ const p=window.digitalProcedureState.progetto; if(!p)return alert('Seleziona un progetto.'); const fs=signs().filter(s=>s.progetto_id===p.id), ts=tests().filter(t=>t.progetto_id===p.id); let okF=0,okT=0; for(const f of fs) if(await saveSignatureRemote(f)) okF++; for(const t of ts) if(await saveTestRemote(t)) okT++; alert(`Sincronizzazione: firme ${okF}/${fs.length}, test ${okT}/${ts.length}.`); };

  async function preparePrintState(p,iscritti){
    if(!window.docentiList.length) window.docentiList=await window.getDocenti();
    window.currentProgettoStampaId=p.id; Object.assign(window.AppState, {'cfg-corso':p.corso_id,'cfg-codice':p.codice,'cfg-modalita':p.modalita,'cfg-data-inizio':p.data_inizio,'cfg-data-esame':p.data_esame,'cfg-sede-corso':p.sede,'cfg-azienda':p.aziende?.ragione_sociale||'','cfg-ateco':p.aziende?.ateco||'','cfg-azienda-indirizzo':p.aziende?.indirizzo||'','cfg-azienda-referente':p.aziende?.referente||'','cfg-ente-erogatore':p.ente_erogatore||'ente','cfg-docenti-ud':JSON.stringify(window.parseJSONSafe(p.docenti_ud||p.docente_principale||'{}',{})),'cfg-calendario':p.calendario||'','cfg-resp-progetto':p.resp_progetto||'','cfg-resp-corso':p.resp_corso||'','cfg-op-invio':p.richiesta_op_inviata_at||'','cfg-op-risposta':p.risposta_op_at||'','cfg-op-esito':p.esito_richiesta_op||'','cfg-compliance-note-free':p.compliance_note||'','cfg-omogeneita-aula':p.omogeneita_aula===false?'NO':'SI'});
    window.currentSessionCorsisti=iscritti.map(isc=>({iscrizione_id:isc.id,corsista_id:isc.corsista_id,nome:isc.corsisti?.nome_cognome,cf:isc.corsisti?.cf,nascita:isc.corsisti?.luogo_data_nascita,mansione:isc.mansione_storica||isc.corsisti?.mansione_storica||'N/D',id_certificato:isc.id_certificato,data_scadenza:isc.data_scadenza,ore_frequentate:isc.ore_frequentate,percentuale_frequenza:isc.percentuale_frequenza,voto_test:isc.voto_test,esito_pratica:isc.esito_pratica,note_verifica:isc.note_verifica,esito:isc.esito||'Idoneo'}));
  }
  async function renderDoc(moduleId, one){
    const resp=await fetch(`modules/${moduleId}.html`); if(!resp.ok) throw new Error(`Modulo non trovato: ${moduleId}`); const html=await resp.text(); const root=document.getElementById('print-area-temp'); const oldM=window.currentPrintModule, oldS=[...(window.currentSessionCorsisti||[])]; root.innerHTML=html; window.currentPrintModule=moduleId; if(one) window.currentSessionCorsisti=[one]; window.updateAll?.(); root.querySelectorAll('.doc-page').forEach(el=>el.classList.remove('scale-[0.8]','origin-top','landscape-force')); const out=`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${moduleId}</title><script src="https://cdn.tailwindcss.com"><\/script></head><body>${root.innerHTML}</body></html>`; root.innerHTML=''; window.currentPrintModule=oldM; window.currentSessionCorsisti=oldS; return out;
  }
  async function buildZip(){
    const p=window.digitalProcedureState.progetto; if(!p) throw new Error('Seleziona un progetto.'); const iscritti=window.digitalProcedureState.iscritti.length?window.digitalProcedureState.iscritti:await window.getIscrizioni(p.id); if(!window.JSZip) throw new Error('JSZip non caricato.'); await preparePrintState(p,iscritti);
    const zip=new JSZip(), folderName=slug(`${p.codice}_${p.aziende?.ragione_sociale||'azienda'}_${(DB_CORSI[p.corso_id]||{}).code||'corso'}`), root=zip.folder(folderName), fs=signs().filter(s=>s.progetto_id===p.id), ts=tests().filter(t=>t.progetto_id===p.id);
    root.file('README_FASCICOLO.txt',`Fascicolo corso ${p.codice}\nGenerato: ${new Date().toISOString()}\nContiene dati progetto, iscritti, firme PNG, test digitali e documenti HTML.`); root.file('manifest.json',JSON.stringify({generated_at:new Date().toISOString(),app_version:'SafetyManager ASR2025 step3 digital',progetto:p,corso:DB_CORSI[p.corso_id]||null,iscritti_count:iscritti.length,firme_count:fs.length,test_count:ts.length,conservazione_minima_anni:ASR2025_POLICY?.conservazioneFascicoloAnni||10},null,2));
    root.folder('dati').file('progetto.json',JSON.stringify(p,null,2)); root.folder('dati').file('iscritti.json',JSON.stringify(iscritti,null,2)); root.folder('dati').file('firme.json',JSON.stringify(fs.map(f=>({...f,data_url:'[vedi firme_png]'})),null,2)); root.folder('dati').file('test_digitali.json',JSON.stringify(ts,null,2));
    const ff=root.folder('firme_png'); fs.forEach((f,i)=>ff.file(`${String(i+1).padStart(3,'0')}_${slug(f.documento)}_${slug(f.campo_firma)}_${slug(f.firmatario_nome)}.png`,dataUrlToBytes(f.data_url)));
    const df=root.folder('documenti_html'); for(const m of EXPORT_DOCS){ try{df.file(`${m}.html`,await renderDoc(m,null));}catch(e){df.file(`${m}_ERRORE.txt`,String(e.message||e));} }
    const af=root.folder('attestati_html'); for(const c of window.currentSessionCorsisti){ try{af.file(`attestato_${slug(c.nome)}_${slug(c.cf)}.html`,await renderDoc('attestato',c));}catch(e){af.file(`attestato_${slug(c.nome)}_ERRORE.txt`,String(e.message||e));} }
    return {zip,folderName};
  }
  async function writeDir(zip,folderName){
    if(!window.showDirectoryPicker) throw new Error('Il browser non supporta il salvataggio diretto in cartella.'); const handle=await showDirectoryPicker({mode:'readwrite'}); const root=await handle.getDirectoryHandle(folderName,{create:true}); const files=Object.values(zip.files).filter(f=>!f.dir);
    for(const f of files){ let parts=f.name.split('/').filter(Boolean); if(parts[0]===folderName) parts.shift(); let dir=root; while(parts.length>1) dir=await dir.getDirectoryHandle(parts.shift(),{create:true}); const h=await dir.getFileHandle(parts[0],{create:true}); const w=await h.createWritable(); await w.write(await f.async('blob')); await w.close(); }
  }
  window.salvaFascicoloCorsoLocale = async function(mode){
    try{ const {zip,folderName}=await buildZip(); if(mode==='folder'){ try{ await writeDir(zip,folderName); alert('Cartella fascicolo salvata sul PC.'); return; } catch(e){ alert((e.message||e)+'\nProcedo con download ZIP.'); } } const blob=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${folderName}.zip`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); } catch(e){ console.error(e); alert('Errore export fascicolo: '+(e.message||e)); }
  };
})();
