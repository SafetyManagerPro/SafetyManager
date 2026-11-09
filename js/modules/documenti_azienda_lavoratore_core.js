// Core modelli stampa azienda/lavoratore
(function(){
  if(window.SafetyCompanyDocs) return;
  const D={};
  D.types=new Set(['verbale_consegna_dpi','registro_consegna_dpi','lettera_incarico_sicurezza','dichiarazione_dl_diretta']);
  D.esc=v=>window.dashEscape?window.dashEscape(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  D.fmt=v=>!v?'':(window.formatDataToItalian?window.formatDataToItalian(v):v);
  D.today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  D.getProject=async()=>{
    const id=document.getElementById('stampa-progetto')?.value||window.currentProgettoStampaId||'';
    if(!id) return null;
    let p=(window.progettiList||[]).find(x=>String(x.id)===String(id));
    if(!p&&typeof window.getProgetti==='function'){
      window.progettiList=await window.getProgetti();
      p=(window.progettiList||[]).find(x=>String(x.id)===String(id));
    }
    return p||null;
  };
  // Datore di lavoro (scelta del 9/11/2026): la persona dell'azienda registrata con ruolo
  // "Datore di lavoro"; se non c'e', il campo "Referente" dell'azienda. Vale per tutti i documenti.
  D.employerNameFor=companyId=>{
    const id=String(companyId||'');
    if(!id) return '';
    const fromCache=(D.directoryCache?.people||[]).find(p=>String(p.azienda_id)===id&&p.ruolo_aziendale==='datore_lavoro');
    if(fromCache?.nome) return fromCache.nome;
    const fromList=(window.corsistiList||[]).find(p=>String(p.azienda_id||'')===id&&String(p.ruolo_aziendale||'')==='datore_lavoro'&&!p.archived_at);
    return fromList?.nome_cognome||'';
  };
  D.companyFromRow=a=>({
    id:String(a?.id||''),
    nome:a?.ragione_sociale||'',
    piva:a?.piva_cf||'',
    indirizzo:a?.indirizzo||'',
    sede:a?.sede_operativa||'',
    ateco:a?.ateco||'',
    datore:D.employerNameFor(a?.id)||a?.referente||''
  });
  D.companyFrom=p=>{
    const a=p?.aziende||{};
    return {
      id:String(a.id||p?.azienda_id||''),
      nome:a.ragione_sociale||window.AppState?.['cfg-azienda']||'',
      piva:a.piva_cf||window.AppState?.['cfg-azienda-piva']||'',
      indirizzo:a.indirizzo||window.AppState?.['cfg-azienda-indirizzo']||'',
      sede:a.sede_operativa||window.AppState?.['cfg-azienda-sede-operativa']||'',
      ateco:a.ateco||window.AppState?.['cfg-ateco']||'',
      datore:D.employerNameFor(a.id||p?.azienda_id)||a.referente||window.AppState?.['cfg-azienda-referente']||''
    };
  };
  D.courseFrom=p=>{const c=window.DB_CORSI?.[p?.corso_id]||{};return{id:p?.corso_id||'',titolo:c.t||p?.corso_id||'',codice:p?.codice||'',inizio:p?.data_inizio||'',fine:p?.data_esame||''};};
  D.workersFromSession=()=> (window.currentSessionCorsisti||[]).map(c=>({
    id:String(c.corsista_id||c.id||''),nome:c.nome||c.nome_cognome||'',cf:c.cf||'',nascita:c.nascita||'',mansione:c.mansione||'',certificato:c.id_certificato||'',azienda_id:String(c.azienda_id||'')
  })).filter(x=>x.id);
  D.enrichWorkersWithCompanies=async(project,workers)=>{
    let corsisti=Array.isArray(window.corsistiList)&&window.corsistiList.length?window.corsistiList:[];
    let aziende=Array.isArray(window.aziendeList)&&window.aziendeList.length?window.aziendeList:[];
    try{if(!corsisti.length&&typeof window.getCorsisti==='function')corsisti=await window.getCorsisti();}catch(e){console.warn('Modelli azienda/lavoratore: corsisti non ricaricati',e);}
    try{if(!aziende.length&&typeof window.getAziende==='function')aziende=await window.getAziende();}catch(e){console.warn('Modelli azienda/lavoratore: aziende non ricaricate',e);}
    if(corsisti.length) window.corsistiList=corsisti;
    if(aziende.length) window.aziendeList=aziende;
    const corsistiById=new Map(corsisti.map(c=>[String(c.id),c]));
    const aziendeById=new Map(aziende.map(a=>[String(a.id),a]));
    const projectCompany=D.companyFrom(project);
    return workers.map(w=>{
      const c=corsistiById.get(String(w.id))||{};
      const aid=String(c.azienda_id||w.azienda_id||project?.azienda_id||'');
      const a=aziendeById.get(aid)||null;
      return {...w,azienda_id:aid,mansione:w.mansione||c.mansione_storica||'',company:a?D.companyFromRow(a):projectCompany};
    });
  };
  D.inferRole=id=>{
    id=String(id||'');
    if(id==='preposto'||id==='agg_prep') return 'preposto';
    if(id.includes('primo_soccorso')) return 'primo_soccorso';
    if(id.includes('antincendio')) return 'antincendio';
    if(id.startsWith('attr_')||id.startsWith('agg_attr_')) return 'attrezzatura';
    if(id==='lav_quota') return 'quota';
    if(id==='amb_confinati') return 'confinati';
    if(id.startsWith('dl_spp')||id==='agg_dl_spp') return 'dl_rspp';
    return 'incarico_generico';
  };
  D.roleMeta=(role,courseTitle='')=>({
    preposto:{title:'DESIGNAZIONE / INDIVIDUAZIONE DEL PREPOSTO',refs:'D.Lgs. 81/2008, artt. 18, comma 1, lett. b-bis, e 19',verb:'designa e individua',duties:'sovrintendere e vigilare sul rispetto delle disposizioni aziendali di sicurezza, intervenire sui comportamenti non conformi, segnalare condizioni di pericolo e, quando necessario, interrompere temporaneamente l’attività nei limiti delle attribuzioni previste dalla legge.'},
    primo_soccorso:{title:'DESIGNAZIONE ADDETTO AL PRIMO SOCCORSO',refs:'D.Lgs. 81/2008, artt. 18, comma 1, lett. b, 43 e 45',verb:'designa',duties:'attuare le misure di primo soccorso secondo la formazione ricevuta, il piano e le procedure aziendali, segnalando tempestivamente criticità e necessità di reintegro dei presidi.'},
    antincendio:{title:'DESIGNAZIONE ADDETTO ANTINCENDIO ED EVACUAZIONE',refs:'D.Lgs. 81/2008, artt. 18, comma 1, lett. b, 43 e 46',verb:'designa',duties:'attuare le misure di prevenzione incendi, lotta antincendio, evacuazione e gestione dell’emergenza secondo la formazione posseduta e le procedure aziendali.'},
    attrezzatura:{title:'INCARICO E AUTORIZZAZIONE INTERNA ALL’USO DI ATTREZZATURE',refs:'D.Lgs. 81/2008, artt. 18, 71 e 73; formazione/abilitazione prevista dalla normativa vigente',verb:'incarica e autorizza',duties:`utilizzare esclusivamente le attrezzature per le quali risultano soddisfatti i requisiti di formazione, addestramento e, quando prevista, abilitazione. Riferimento formativo: ${courseTitle||'corso specifico'}.`},
    quota:{title:'INCARICO PER LAVORI IN QUOTA E UTILIZZO DPI',refs:'D.Lgs. 81/2008, artt. 74-79 e ulteriori disposizioni applicabili ai lavori in quota',verb:'incarica',duties:'svolgere le attività in quota esclusivamente secondo le procedure aziendali, utilizzando correttamente i DPI previsti e rispettando i limiti della formazione e dell’addestramento ricevuti.'},
    confinati:{title:'INCARICO OPERATIVO PER AMBIENTI CONFINATI / SOSPETTI DI INQUINAMENTO',refs:'D.Lgs. 81/2008 e DPR 177/2011, ove applicabili',verb:'incarica',duties:'operare esclusivamente nell’ambito di procedure, organizzazione, vigilanza e requisiti aziendali conformi alla normativa applicabile; la sola formazione non costituisce autorizzazione generalizzata ad accedere a qualunque ambiente confinato.'},
    incarico_generico:{title:'LETTERA DI INCARICO OPERATIVO',refs:'D.Lgs. 81/2008, artt. 18, 20, 36 e 37, ove applicabili',verb:'incarica',duties:`svolgere le attività coerenti con la mansione, le istruzioni aziendali e la formazione ricevuta, senza oltrepassare competenze, abilitazioni e autorizzazioni richieste. Riferimento formativo: ${courseTitle||'corso effettuato'}.`},
    dl_rspp:{title:'DICHIARAZIONE DI SVOLGIMENTO DIRETTO DEI COMPITI DEL SPP',refs:'D.Lgs. 81/2008, art. 34, nei casi e limiti consentiti',verb:'dichiara',duties:'di svolgere direttamente i compiti del Servizio di Prevenzione e Protezione, previa verifica che ricorrano tutte le condizioni di legge, che non sussistano cause di esclusione e che siano soddisfatti i requisiti formativi e organizzativi richiesti.'},
    dl_primo_soccorso:{title:'DICHIARAZIONE DEL DATORE DI LAVORO – PRIMO SOCCORSO',refs:'D.Lgs. 81/2008, artt. 34, 43 e 45, nei casi consentiti',verb:'dichiara',duties:'di svolgere direttamente i compiti di primo soccorso nei casi consentiti, sulla base della formazione specifica posseduta e delle procedure aziendali.'},
    dl_antincendio:{title:'DICHIARAZIONE DEL DATORE DI LAVORO – ANTINCENDIO / EVACUAZIONE',refs:'D.Lgs. 81/2008, artt. 34, 43 e 46, nei casi consentiti',verb:'dichiara',duties:'di svolgere direttamente i compiti di prevenzione incendi, evacuazione e gestione dell’emergenza nei casi consentiti e secondo la formazione specifica posseduta.'}
  }[role]||D.roleMeta('incarico_generico',courseTitle));
  D.injectStyle=()=>{
    if(document.getElementById('safety-company-doc-style')) return;
    const s=document.createElement('style');s.id='safety-company-doc-style';s.textContent=`
      .safety-company-doc-page{width:210mm;min-height:297mm;box-sizing:border-box;background:#fff;color:#111827;padding:14mm 15mm 13mm;font:10.5pt/1.38 Arial,Helvetica,sans-serif;position:relative;page-break-after:always}
      .safety-company-doc-page h1{font-size:15pt;line-height:1.15;text-align:center;margin:0}.safety-company-doc-page h2{font-size:11.5pt;margin:12px 0 4px}
      .safety-company-doc-page table{width:100%;border-collapse:collapse}.safety-company-doc-page th,.safety-company-doc-page td{border:1px solid #94a3b8;padding:5px 6px;vertical-align:top}.safety-company-doc-page th{background:#f1f5f9;font-size:8pt;text-transform:uppercase}
      .safety-company-doc-page .box{border:1px solid #cbd5e1;border-radius:6px;padding:8px 10px}.safety-company-doc-page .small{font-size:8.5pt;color:#475569}
      #safety-company-doc-modal label{display:block;font-size:10px;font-weight:900;text-transform:uppercase;color:#475569;margin-bottom:4px}
      #safety-company-doc-modal input,#safety-company-doc-modal select,#safety-company-doc-modal textarea{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;background:#fff;font-size:12px}
    `;document.head.appendChild(s);
  };
  D.header=c=>`<div style="border-bottom:2px solid #0f172a;padding-bottom:7px;margin-bottom:14px;display:flex;justify-content:space-between;gap:14px"><div><div style="font-weight:800;font-size:13pt">${D.esc(c.nome||'AZIENDA')}</div><div class="small">${D.esc(c.indirizzo||'')}${c.sede?'<br>Sede operativa: '+D.esc(c.sede):''}</div></div><div class="small" style="text-align:right">${c.piva?'<div><b>P.IVA/C.F.</b> '+D.esc(c.piva)+'</div>':''}${c.ateco?'<div><b>ATECO</b> '+D.esc(c.ateco)+'</div>':''}</div></div>`;
  D.footer=refs=>`<div style="position:absolute;left:15mm;right:15mm;bottom:8mm;border-top:1px solid #cbd5e1;padding-top:4px" class="small">Riferimenti: ${D.esc(refs)}. Modello gestionale da verificare rispetto al caso concreto e alle procedure aziendali.</div>`;
  D.signatures=(l,ln,r,rn)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;text-align:center"><div><div style="height:34px"></div><div style="border-top:1px solid #475569;padding-top:5px"><b>${D.esc(l)}</b><br>${D.esc(ln||'')}</div></div><div><div style="height:34px"></div><div style="border-top:1px solid #475569;padding-top:5px"><b>${D.esc(r)}</b><br>${D.esc(rn||'')}</div></div></div>`;
  window.SafetyCompanyDocs=D;
})();