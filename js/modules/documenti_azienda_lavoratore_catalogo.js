// Catalogo documenti azienda / lavoratore — D.Lgs. 81/2008 s.m.i. e Accordo Stato-Regioni 17/04/2025.
// Aggiunto il 9/11/2026. Si aggancia al modulo esistente (core/ui/print/directory) senza modificarne
// i 4 modelli storici: gestisce solo i tipi elencati qui sotto e la "stampa unica".
// Corsi, progetti e attestati sono solo LETTI (es. candidati RLS formati, formazione del preposto).
(function(){
  const D=window.SafetyCompanyDocs;
  if(!D||window.__safetyCompanyDocsCatalogLoaded) return;
  window.__safetyCompanyDocsCatalogLoaded=true;

  const esc=v=>D.esc(v);
  const fmt=v=>D.fmt(v);
  const line=(v,n=26)=>v?esc(v):'_'.repeat(n);
  const tick=on=>on?'&#9746;':'&#9744;';
  const today=()=>D.today();
  const BUNDLE='stampa_unica_81';
  const RLS_COURSES=new Set(['rls','agg_rls_4h','agg_rls_8h']);
  const PREPOSTO_COURSES=new Set(['preposto','agg_prep']);

  // ---------- blocchi comuni di impaginazione ----------
  const page=(id,c,title,refs,body)=>`<section class="doc-page safety-company-doc-page" data-company-doc="${esc(id)}">${D.header(c.company)}<h1>${esc(title)}</h1><p class="small" style="text-align:center;margin:6px 0 14px">${esc(refs)}</p>${body}<div class="small" style="margin-top:14px;border-top:1px solid #cbd5e1;padding-top:4px">Riferimenti: ${esc(refs)}. Modello da verificare rispetto al caso concreto, al DVR e alle procedure aziendali.</div></section>`;
  const parties=(c,w)=>`<div class="box"><b>Azienda:</b> ${esc(c.company.nome||'—')}${c.company.piva?' — P.IVA/C.F. '+esc(c.company.piva):''}<br><b>Datore di lavoro:</b> ${line(c.datore)}${w?`<br><b>Lavoratore:</b> ${line(w.nome)}${w.cf?' — C.F. '+esc(w.cf):''}${w.nascita?'<br><b>Luogo e data di nascita:</b> '+esc(w.nascita):''}<br><b>Mansione:</b> ${line(w.mansione,20)}`:''}</div>`;
  const placeDate=c=>`<p style="margin-top:14px"><b>Luogo e data:</b> ${line(c.place,22)}, ${line(fmt(c.date),12)}</p>`;
  const signGrid=list=>`<div style="display:grid;grid-template-columns:repeat(${Math.min(list.length,3)},1fr);gap:20px;margin-top:22px;text-align:center">${list.map(([role,name])=>`<div><div style="height:30px"></div><div style="border-top:1px solid #475569;padding-top:5px"><b>${esc(role)}</b><br>${esc(name||'')}</div></div>`).join('')}</div>`;
  const checklist=items=>`<ul style="list-style:none;padding:0;margin:6px 0">${items.map(([on,text])=>`<li style="margin:3px 0">${tick(on)} ${text}</li>`).join('')}</ul>`;
  const occasions=v=>checklist([
    [v.occ_assunzione,'assunzione / inizio dell’utilizzo (anche in somministrazione)'],
    [v.occ_mansione,'trasferimento o cambiamento di mansioni'],
    [v.occ_nuove,'introduzione di nuove attrezzature, tecnologie, sostanze o miscele pericolose'],
    [v.occ_periodico,'ripetizione periodica / aggiornamento']
  ]);
  const outcome=()=>`<p><b>Esito della prova pratica:</b> &#9744; positivo &nbsp;&nbsp; &#9744; da ripetere &nbsp;&nbsp; Note: ${'_'.repeat(30)}</p>`;
  const lines=(text,n=3)=>text?`<div class="box" style="white-space:pre-wrap">${esc(text)}</div>`:Array.from({length:n},()=>`<div style="border-bottom:1px solid #94a3b8;height:20px"></div>`).join('');

  // ---------- campi delle schede ----------
  const occFields=[
    {id:'occ_assunzione',label:'Occasione: assunzione / inizio utilizzo',type:'check',def:true},
    {id:'occ_mansione',label:'Occasione: cambio mansione',type:'check'},
    {id:'occ_nuove',label:'Occasione: nuove attrezzature / sostanze',type:'check'},
    {id:'occ_periodico',label:'Occasione: ripetizione periodica',type:'check'}
  ];
  const trainerFields=[
    {id:'addestratore',label:'Persona esperta che effettua l’addestramento',type:'text'},
    {id:'addestratore_qualifica',label:'Qualifica / esperienza dell’addestratore',type:'text'},
    {id:'durata',label:'Durata (ore)',type:'text',placeholder:'Es. 2'},
    {id:'luogo_add',label:'Luogo di lavoro / reparto',type:'text'}
  ];
  const RISKS=[
    ['r_vdt','Videoterminali','D.Lgs. 81/2008, Titolo VII, art. 177'],
    ['r_mmc','Movimentazione manuale dei carichi','Titolo VI, art. 169'],
    ['r_rumore','Rumore','Titolo VIII, Capo II, art. 195'],
    ['r_vibrazioni','Vibrazioni meccaniche','Titolo VIII, Capo III, art. 184'],
    ['r_chimico','Agenti chimici','Titolo IX, Capo I, art. 227'],
    ['r_biologico','Agenti biologici','Titolo X, art. 278'],
    ['r_segnaletica','Segnaletica di salute e sicurezza','Titolo V, art. 164']
  ];

  // ---------- catalogo ----------
  const CATALOG=[
    {id:'info_art36',label:'Verbale di informazione (art. 36)',group:'Informazione',scope:'person',title:'VERBALE DI INFORMAZIONE AL LAVORATORE',refs:'D.Lgs. 81/2008, art. 36',
     fields:[
       {id:'rspp',label:'RSPP (nominativo)',type:'text'},
       {id:'medico',label:'Medico competente (nominativo)',type:'text'},
       {id:'addetti_ps',label:'Addetti primo soccorso',type:'text'},
       {id:'addetti_ai',label:'Addetti antincendio / evacuazione',type:'text'},
       {id:'rischi_mansione',label:'Rischi specifici della mansione e misure adottate',type:'area'},
       {id:'materiale',label:'Materiale consegnato',type:'text',placeholder:'Es. opuscolo informativo, estratto procedure'}
     ],
     render:(c,w,v)=>page('info_art36',c,'VERBALE DI INFORMAZIONE AL LAVORATORE','D.Lgs. 81/2008, art. 36',
       `${parties(c,w)}<p>Il datore di lavoro dichiara di aver fornito al lavoratore sopra indicato, in modo facilmente comprensibile, un’adeguata informazione su:</p>${checklist([
         [true,'i rischi per la salute e sicurezza sul lavoro connessi all’attività dell’impresa in generale;'],
         [true,'le procedure di primo soccorso, lotta antincendio ed evacuazione dei luoghi di lavoro;'],
         [true,`i nominativi degli addetti al primo soccorso (${line(v.addetti_ps,18)}) e antincendio/evacuazione (${line(v.addetti_ai,18)});`],
         [true,`i nominativi del RSPP (${line(v.rspp,18)}) e del medico competente (${line(v.medico,18)});`],
         [true,'i rischi specifici cui è esposto in relazione all’attività svolta, le normative di sicurezza e le disposizioni aziendali;'],
         [true,'i pericoli connessi all’uso delle sostanze e delle miscele pericolose, sulla base delle schede dei dati di sicurezza;'],
         [true,'le misure e le attività di protezione e prevenzione adottate.']
       ])}<h2>Rischi specifici della mansione e misure adottate</h2>${lines(v.rischi_mansione,3)}<p><b>Materiale consegnato:</b> ${line(v.materiale,40)}</p><p>Il lavoratore dichiara di aver ricevuto l’informazione, di averne compreso i contenuti e di aver potuto porre domande e ricevere chiarimenti.</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['Il lavoratore',w.nome]])}`)},

    {id:'info_rischi_specifici',label:'Informazione rischi specifici',group:'Informazione',scope:'person',title:'INFORMAZIONE SUI RISCHI SPECIFICI',refs:'D.Lgs. 81/2008, artt. 36, 164, 169, 177, 184, 195, 227 e 278',
     fields:[...RISKS.map(([id,label])=>({id,label:'Rischio: '+label,type:'check'})),{id:'altri_rischi',label:'Altri rischi / note',type:'text'},{id:'misure',label:'Misure di prevenzione e DPI previsti',type:'area'}],
     render:(c,w,v)=>page('info_rischi_specifici',c,'INFORMAZIONE SUI RISCHI SPECIFICI DELLA MANSIONE','D.Lgs. 81/2008, artt. 36, 164, 169, 177, 184, 195, 227 e 278',
       `${parties(c,w)}<p>In base alla valutazione dei rischi, il datore di lavoro ha informato il lavoratore sui seguenti rischi specifici, sulle misure di prevenzione e protezione adottate e sul corretto comportamento da tenere:</p><table><thead><tr><th style="width:8%"></th><th>Rischio</th><th>Riferimento</th></tr></thead><tbody>${RISKS.map(([id,label,ref])=>`<tr><td style="text-align:center">${tick(v[id])}</td><td>${esc(label)}</td><td class="small">${esc(ref)}</td></tr>`).join('')}<tr><td style="text-align:center">${tick(!!v.altri_rischi)}</td><td colspan="2">Altro: ${line(v.altri_rischi,40)}</td></tr></tbody></table><h2>Misure di prevenzione e DPI previsti</h2>${lines(v.misure,3)}<p>Il lavoratore dichiara di aver ricevuto e compreso l’informazione.</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['Il lavoratore',w.nome]])}`)},

    {id:'presa_visione_emergenza',label:'Presa visione piano di emergenza',group:'Informazione',scope:'person',title:'PRESA VISIONE DEL PIANO DI EMERGENZA ED EVACUAZIONE',refs:'D.Lgs. 81/2008, artt. 36, 43 e 46; D.M. 2 settembre 2021',
     fields:[{id:'piano',label:'Piano di emergenza (revisione e data)',type:'text'},{id:'raccolta',label:'Punto di raccolta',type:'text'},{id:'addetti',label:'Addetti alla gestione delle emergenze',type:'text'}],
     render:(c,w,v)=>page('presa_visione_emergenza',c,'PRESA VISIONE DEL PIANO DI EMERGENZA ED EVACUAZIONE','D.Lgs. 81/2008, artt. 36, 43 e 46; D.M. 2 settembre 2021',
       `${parties(c,w)}<p>Il lavoratore dichiara di aver preso visione del piano di emergenza ed evacuazione <b>${line(v.piano,28)}</b> e di essere stato informato su:</p>${checklist([
         [true,'segnale di allarme e modalità di attivazione dell’emergenza;'],
         [true,'vie di esodo, uscite di emergenza e planimetrie esposte;'],
         [true,`punto di raccolta (${line(v.raccolta,24)});`],
         [true,'ubicazione dei presidi antincendio e della cassetta/pacchetto di primo soccorso;'],
         [true,`nominativi degli addetti alla gestione delle emergenze (${line(v.addetti,24)});`],
         [true,'comportamenti da tenere in caso di incendio, infortunio, malore o evacuazione e numeri di emergenza (112).']
       ])}${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['Il lavoratore',w.nome]])}`)},

    {id:'addestramento_generale',label:'Addestramento procedure di lavoro',group:'Addestramento',scope:'person',title:'SCHEDA DI ADDESTRAMENTO — PROCEDURE DI LAVORO SICURE',refs:'D.Lgs. 81/2008, art. 37, commi 4 e 5',
     fields:[...trainerFields,{id:'argomenti',label:'Procedure / attività oggetto di addestramento',type:'area'},{id:'mod_pratica',label:'Modalità: prova pratica',type:'check',def:true},{id:'mod_esercitazione',label:'Modalità: esercitazione applicata',type:'check'},{id:'mod_simulazione',label:'Modalità: simulazione (ambiente reale o virtuale)',type:'check'},...occFields],
     render:(c,w,v)=>page('addestramento_generale',c,'SCHEDA DI ADDESTRAMENTO — PROCEDURE DI LAVORO SICURE','D.Lgs. 81/2008, art. 37, commi 4 e 5',
       `${parties(c,w)}<p>Addestramento effettuato da persona esperta e sul luogo di lavoro, ai sensi dell’art. 37, comma 5.</p><table><tbody><tr><th style="width:32%">Persona esperta</th><td>${line(v.addestratore)} ${v.addestratore_qualifica?'— '+esc(v.addestratore_qualifica):''}</td></tr><tr><th>Luogo / reparto</th><td>${line(v.luogo_add)}</td></tr><tr><th>Durata</th><td>${v.durata?esc(v.durata)+' ore':line('',10)}</td></tr><tr><th>Modalità</th><td>${tick(v.mod_pratica)} prova pratica &nbsp; ${tick(v.mod_esercitazione)} esercitazione &nbsp; ${tick(v.mod_simulazione)} simulazione</td></tr></tbody></table><h2>Occasione</h2>${occasions(v)}<h2>Procedure / attività oggetto di addestramento</h2>${lines(v.argomenti,4)}${outcome()}<p class="small">L’intervento va riportato anche nel registro dell’addestramento (art. 37, comma 5).</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['La persona esperta',v.addestratore],['Il lavoratore',w.nome]])}`)},

    {id:'addestramento_attrezzatura',label:'Addestramento uso attrezzatura',group:'Addestramento',scope:'person',title:'SCHEDA DI ADDESTRAMENTO ALL’USO DI ATTREZZATURA',refs:'D.Lgs. 81/2008, artt. 37 c. 5, 71 c. 7 e 73',
     fields:[{id:'attrezzatura',label:'Attrezzatura / macchina',type:'text'},{id:'modello',label:'Marca e modello',type:'text'},{id:'matricola',label:'Matricola / n. di serie',type:'text'},{id:'libretto',label:'Istruzioni d’uso del fabbricante illustrate',type:'check',def:true},{id:'abilitazione',label:'Formazione/abilitazione posseduta (dai corsi)',type:'select',source:'equipment'},...trainerFields,{id:'argomenti',label:'Contenuti dell’addestramento',type:'area',placeholder:'Comandi, dispositivi di sicurezza, controlli prima dell’uso, manovre, situazioni anomale'},...occFields],
     render:(c,w,v)=>page('addestramento_attrezzatura',c,'SCHEDA DI ADDESTRAMENTO ALL’USO DI ATTREZZATURA','D.Lgs. 81/2008, artt. 37 c. 5, 71 c. 7 e 73',
       `${parties(c,w)}<table><tbody><tr><th style="width:32%">Attrezzatura</th><td>${line(v.attrezzatura)}</td></tr><tr><th>Marca e modello</th><td>${line(v.modello)}</td></tr><tr><th>Matricola</th><td>${line(v.matricola)}</td></tr><tr><th>Istruzioni del fabbricante</th><td>${tick(v.libretto)} illustrate al lavoratore</td></tr><tr><th>Formazione / abilitazione</th><td>${line(v.abilitazione,30)}</td></tr><tr><th>Persona esperta</th><td>${line(v.addestratore)} ${v.addestratore_qualifica?'— '+esc(v.addestratore_qualifica):''}</td></tr><tr><th>Luogo / durata</th><td>${line(v.luogo_add,16)} — ${v.durata?esc(v.durata)+' ore':line('',6)}</td></tr></tbody></table><h2>Occasione</h2>${occasions(v)}<h2>Contenuti dell’addestramento</h2>${lines(v.argomenti,3)}${outcome()}<p class="small">Per le attrezzature per cui l’art. 73, comma 5, richiede una specifica abilitazione, l’addestramento aziendale non la sostituisce. L’intervento va riportato nel registro dell’addestramento.</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['La persona esperta',v.addestratore],['Il lavoratore',w.nome]])}`)},

    {id:'consegna_addestramento_dpi',label:'Consegna e addestramento DPI',group:'DPI',scope:'person',title:'VERBALE DI CONSEGNA E ADDESTRAMENTO DPI',refs:'D.Lgs. 81/2008, artt. 18, 77 e 78',
     fields:[{id:'dpi',label:'DPI consegnati — una riga per DPI: DPI | marca/modello/taglia | categoria (I, II, III) | quantità',type:'area',placeholder:'Imbracatura anticaduta | modello/taglia | III | 1\nGuanti | modello/taglia | II | 2 paia'},{id:'add_data',label:'Data addestramento (DPI III cat. e udito)',type:'date'},{id:'addestratore',label:'Persona che effettua l’addestramento',type:'text'},{id:'durata',label:'Durata addestramento (ore)',type:'text'}],
     render:(c,w,v)=>{
       const rows=String(v.dpi||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(l=>{const [tipo='',modello='',cat='',qta='']=l.split('|').map(x=>x.trim());return{tipo,modello,cat,qta};});
       const list=rows.length?rows:Array.from({length:6},()=>({tipo:'',modello:'',cat:'',qta:''}));
       return page('consegna_addestramento_dpi',c,'VERBALE DI CONSEGNA E ADDESTRAMENTO DEI DPI','D.Lgs. 81/2008, artt. 18, 77 e 78',
       `${parties(c,w)}<p>Il datore di lavoro consegna al lavoratore i seguenti dispositivi di protezione individuale, individuati in base alla valutazione dei rischi:</p><table><thead><tr><th>DPI</th><th>Marca / modello / taglia</th><th>Cat.</th><th>Q.tà</th></tr></thead><tbody>${list.map(r=>`<tr style="height:24px"><td>${esc(r.tipo)}</td><td>${esc(r.modello)}</td><td>${esc(r.cat)}</td><td>${esc(r.qta)}</td></tr>`).join('')}</tbody></table><h2>Informazione e addestramento</h2>${checklist([[true,'il lavoratore è stato informato sui rischi dai quali i DPI lo proteggono e sul loro corretto utilizzo;'],[true,'sono state rese disponibili le istruzioni del fabbricante;'],[false,'per i DPI di III categoria e per i dispositivi di protezione dell’udito è stato effettuato l’addestramento (art. 77, comma 5)']])}<p><b>Addestramento:</b> data ${line(fmt(v.add_data),12)} — durata ${v.durata?esc(v.durata)+' ore':line('',6)} — a cura di ${line(v.addestratore,22)}</p><h2>Impegni del lavoratore (art. 78)</h2><p>Il lavoratore si impegna a utilizzare i DPI conformemente all’informazione, alla formazione e all’addestramento ricevuti; ad averne cura e non apportarvi modifiche di propria iniziativa; a seguire le procedure aziendali per la riconsegna; a segnalare subito difetti o inconvenienti.</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['L’addestratore',v.addestratore],['Il lavoratore',w.nome]])}`);
     }},

    {id:'nomina_preposto',label:'Nomina preposto',group:'Nomine e rappresentanza',scope:'person',title:'INDIVIDUAZIONE E NOMINA DEL PREPOSTO',refs:'D.Lgs. 81/2008, artt. 18 c. 1 lett. b-bis, 19 e 37 c. 7',
     fields:[{id:'decorrenza',label:'Decorrenza',type:'date'},{id:'ambito',label:'Ambito di vigilanza (reparto, squadra, cantiere)',type:'text'},{id:'formazione',label:'Formazione preposto (dai corsi)',type:'select',source:'preposto'}],
     render:(c,w,v)=>{
       const m=D.roleMeta('preposto','');
       return page('nomina_preposto',c,'INDIVIDUAZIONE E NOMINA DEL PREPOSTO','D.Lgs. 81/2008, artt. 18 c. 1 lett. b-bis, 19 e 37 c. 7',
       `${parties(c,w)}<p>Il datore di lavoro, ai sensi dell’art. 18, comma 1, lettera b-bis, individua il lavoratore sopra indicato quale <b>PREPOSTO</b> per l’ambito: <b>${line(v.ambito,30)}</b>, con decorrenza dal <b>${line(fmt(v.decorrenza),12)}</b>.</p><h2>Compiti (art. 19)</h2><div class="box">Il preposto deve ${esc(m.duties)}</div><p><b>Formazione specifica (art. 37, comma 7):</b> ${line(v.formazione,40)}</p><p>Il preposto dichiara di accettare l’incarico, di conoscerne i compiti e di partecipare all’aggiornamento periodico previsto.</p>${placeDate(c)}${signGrid([['Il datore di lavoro',c.datore],['Il preposto, per accettazione',w.nome]])}`);
     }},

    {id:'verbale_elezione_rls',label:'Verbale elezione RLS',group:'Nomine e rappresentanza',scope:'company',title:'VERBALE DI ELEZIONE DEL RAPPRESENTANTE DEI LAVORATORI PER LA SICUREZZA',refs:'D.Lgs. 81/2008, artt. 47, 18 c. 1 lett. aa) e 37 cc. 10-11',
     fields:[{id:'ora',label:'Ora inizio / fine',type:'text',placeholder:'Es. 9:00 – 10:00'},{id:'aventi',label:'Lavoratori aventi diritto al voto',type:'text'},{id:'votanti',label:'Votanti',type:'text'},{id:'presidente',label:'Presidente dell’assemblea / seggio',type:'text'},{id:'segretario',label:'Segretario',type:'text'},{id:'eletto',label:'RLS eletto',type:'select',source:'rls'}],
     render:(c,_w,v,x)=>{
       const cand=(x.rlsCandidates||[]);
       const rows=cand.length?cand:Array.from({length:3},()=>({nome:'',cf:'',corso:''}));
       return page('verbale_elezione_rls',c,'VERBALE DI ELEZIONE DEL RLS','D.Lgs. 81/2008, artt. 47, 18 c. 1 lett. aa) e 37 cc. 10-11',
       `${parties(c,null)}<p>In data ${line(fmt(c.date),12)}, dalle ore ${line(v.ora,14)}, presso ${line(c.place,24)}, si sono riuniti i lavoratori di <b>${esc(c.company.nome||'—')}</b> per l’elezione del Rappresentante dei Lavoratori per la Sicurezza (RLS).</p><p><b>Presidente:</b> ${line(v.presidente,22)} &nbsp; <b>Segretario:</b> ${line(v.segretario,22)}<br><b>Lavoratori aventi diritto:</b> ${line(v.aventi,6)} &nbsp; <b>Votanti:</b> ${line(v.votanti,6)}</p><h2>Candidati</h2><table><thead><tr><th>N.</th><th>Lavoratore / C.F.</th><th>Formazione RLS</th><th>Voti</th></tr></thead><tbody>${rows.map((r,i)=>`<tr style="height:24px"><td>${i+1}</td><td>${esc(r.nome)}${r.cf?'<br><span class="small">'+esc(r.cf)+'</span>':''}</td><td class="small">${esc(r.corso)}</td><td></td></tr>`).join('')}</tbody></table><p>Schede bianche: ${line('',4)} &nbsp; Schede nulle: ${line('',4)}</p><div class="box">Risulta eletto/a RLS: <b>${line(v.eletto,28)}</b>, che dichiara di accettare l’incarico.</div><p class="small">Fino a 15 lavoratori il RLS è eletto direttamente dai lavoratori al loro interno; oltre i 15, nell’ambito delle rappresentanze sindacali in azienda (art. 47). Il datore di lavoro comunica all’INAIL il nominativo del RLS (art. 18, comma 1, lett. aa) e ne garantisce la formazione (art. 37, commi 10-11).</p>${signGrid([['Il presidente',v.presidente],['Il segretario',v.segretario],['L’RLS eletto, per accettazione',v.eletto]])}${signGrid([['Il datore di lavoro, per presa visione',c.datore]])}`);
     }},

    {id:'registro_addestramento',label:'Registro dell’addestramento',group:'Registri aziendali',scope:'company',title:'REGISTRO DELL’ADDESTRAMENTO',refs:'D.Lgs. 81/2008, art. 37, comma 5',
     fields:[{id:'con_nomi',label:'Precompila con i lavoratori dell’azienda',type:'check',def:true}],
     render:(c,_w,v,x)=>{
       const people=v.con_nomi?(x.workers||[]):[];
       const rows=people.length?people:Array.from({length:12},()=>({nome:'',cf:'',mansione:''}));
       const pages=[];
       for(let i=0;i<rows.length;i+=12){
         pages.push(page('registro_addestramento',c,'REGISTRO DELL’ADDESTRAMENTO','D.Lgs. 81/2008, art. 37, comma 5',
           `${parties(c,null)}<p class="small">Addestramento effettuato da persona esperta e sul luogo di lavoro: una riga per ogni intervento.</p><table><thead><tr><th>N.</th><th>Lavoratore / C.F.</th><th>Data</th><th>Attrezzatura / procedura</th><th>Ore</th><th>Persona esperta</th><th>Firma esperto</th><th>Firma lavoratore</th></tr></thead><tbody>${rows.slice(i,i+12).map((w,k)=>`<tr style="height:34px"><td>${i+k+1}</td><td>${esc(w.nome)}${w.cf?'<br><span class="small">'+esc(w.cf)+'</span>':''}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}</tbody></table>${signGrid([['Il datore di lavoro',c.datore]])}`));
       }
       return pages.join('');
     }}
  ];
  const BY_ID=new Map(CATALOG.map(d=>[d.id,d]));
  CATALOG.forEach(d=>D.types.add(d.id));
  D.types.add(BUNDLE);
  D.catalog=CATALOG;

  // ---------- dati da anagrafiche e corsi (sola lettura) ----------
  const people=companyId=>(D.directoryCache?.people||[]).filter(p=>String(p.azienda_id)===String(companyId||''));
  const company=companyId=>{const a=(D.directoryCache?.companies||[]).find(x=>String(x.id)===String(companyId));return a?D.companyFromRow(a):null;};
  const histories=pid=>D.directoryCache?.histories?.get(String(pid||''))||[];
  const completed=h=>typeof D.isTrainingCompleted==='function'?D.isTrainingCompleted(h)===true:h.completed===true;
  const courseLine=h=>`${h.course?.titolo||''}${h.project?.data_esame?' — '+fmt(h.project.data_esame):''}`;
  // Datore di lavoro: persona dell'azienda con ruolo "Datore di lavoro", altrimenti il referente dell'azienda.
  const employerOf=companyId=>company(companyId)?.datore||''; // stessa regola dei modelli esistenti (D.employerNameFor)
  const workersOf=companyId=>people(companyId).filter(p=>p.ruolo_aziendale!=='datore_lavoro').sort((a,b)=>a.nome.localeCompare(b.nome,'it'));
  const rlsCandidates=companyId=>people(companyId).map(p=>{const h=histories(p.id).find(x=>RLS_COURSES.has(String(x.course?.id||''))&&completed(x));return h?{nome:p.nome,cf:p.cf,corso:courseLine(h)}:null;}).filter(Boolean);
  const optionsFor=(source,companyId,personId)=>{
    if(source==='rls') return rlsCandidates(companyId).map(c=>c.nome);
    const list=histories(personId).filter(completed);
    if(source==='preposto') return list.filter(h=>PREPOSTO_COURSES.has(String(h.course?.id||''))).map(courseLine);
    if(source==='equipment') return list.filter(h=>/^(agg_)?attr_/.test(String(h.course?.id||''))).map(courseLine);
    return [];
  };

  // ---------- finestra di compilazione ----------
  const fieldHtml=(f,companyId,personId)=>{
    const id='scd-f-'+f.id;
    if(f.type==='check') return `<label class="!normal-case flex items-center gap-2 text-xs"><input id="${id}" type="checkbox" ${f.def?'checked':''} style="width:auto"> ${esc(f.label)}</label>`;
    if(f.type==='area') return `<div class="md:col-span-2"><label>${esc(f.label)}</label><textarea id="${id}" rows="3" placeholder="${esc(f.placeholder||'')}"></textarea></div>`;
    if(f.type==='select'){
      const opts=optionsFor(f.source,companyId,personId);
      const hint=f.source==='rls'?(opts.length?`${opts.length} lavoratori con formazione RLS completata`:'Nessun lavoratore con formazione RLS completata: il verbale resterà da compilare a mano'):(opts.length?'Dai corsi completati':'Nessun corso corrispondente completato');
      // Formazione: proposta la più recente tra quelle completate. RLS eletto: mai precompilato (esito del voto).
      const pre=f.source==='rls'?'':(opts[0]||'');
      return `<div><label>${esc(f.label)}</label><select id="${id}"><option value="">— da compilare a mano —</option>${opts.map(o=>`<option value="${esc(o)}" ${o===pre?'selected':''}>${esc(o)}</option>`).join('')}</select><p class="text-[10px] text-slate-500 mt-1">${esc(hint)}</p></div>`;
    }
    return `<div><label>${esc(f.label)}</label><input id="${id}" type="${f.type==='date'?'date':'text'}" placeholder="${esc(f.placeholder||'')}"></div>`;
  };
  const readFields=fields=>{const v={};(fields||[]).forEach(f=>{const el=document.getElementById('scd-f-'+f.id);if(!el)return;v[f.id]=f.type==='check'?!!el.checked:String(el.value||'').trim();});return v;};
  const commonHtml=(comp,datore,target)=>`<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4"><div class="md:col-span-2"><label>Azienda</label><input value="${esc(comp.nome)}" readonly></div><div class="md:col-span-2"><label>Destinatario</label><input value="${esc(target)}" readonly></div><div class="md:col-span-2"><label>Datore di lavoro</label><input id="scd-datore" value="${esc(datore)}"></div><div><label>Data documento</label><input id="scd-date" type="date" value="${esc(today())}"></div><div><label>Luogo</label><input id="scd-place" value="${esc(comp.sede||comp.indirizzo||'')}"></div></div>`;
  const targetLabel=(doc,companyId,personId)=>{
    if(doc&&doc.scope==='company') return 'Documento aziendale';
    if(personId&&personId!=='__all__'){const p=people(companyId).find(x=>x.id===personId);return p?p.nome:'';}
    return `Tutti i lavoratori dell’azienda (${workersOf(companyId).length}) — un documento per persona`;
  };

  async function openCatalogDoc(type){
    await D.refreshDirectoryLauncher?.(false);
    const companyId=document.getElementById('scd-launch-company')?.value||'';
    const personId=document.getElementById('scd-launch-person')?.value||'__all__';
    const comp=company(companyId);
    if(!comp) return alert('Seleziona prima un’azienda.');
    const isBundle=type===BUNDLE;
    const doc=BY_ID.get(type);
    window.__safetyCompanyDocState={type,catalog:true,companyId,personId,company:comp,course:{id:'',titolo:'',codice:'',inizio:'',fine:''}};
    D.ensureModal();
    const m=document.getElementById('safety-company-doc-modal');
    m.classList.remove('hidden');m.classList.add('flex');
    document.getElementById('safety-company-doc-title').textContent=isBundle?'Stampa unica documenti':doc.title;
    let body=commonHtml(comp,employerOf(companyId),isBundle?targetLabel(null,companyId,personId):targetLabel(doc,companyId,personId));
    if(isBundle){
      const groups=[...new Set(CATALOG.map(d=>d.group))];
      body+=`<p class="text-xs text-slate-600 mb-3">Scegli i documenti da stampare insieme. I campi specifici di ogni documento restano da compilare a mano sul foglio; i documenti individuali vengono generati per ${personId&&personId!=='__all__'?'la persona scelta':'ogni lavoratore dell’azienda'}, quelli aziendali una volta sola.</p><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${groups.map(g=>`<div class="rounded-xl border border-slate-200 p-3"><p class="text-[10px] font-black uppercase text-slate-500 mb-2">${esc(g)}</p>${CATALOG.filter(d=>d.group===g).map(d=>`<label class="!normal-case flex items-start gap-2 text-xs mb-1"><input type="checkbox" data-scd-bundle="${esc(d.id)}" style="width:auto;margin-top:2px"> ${esc(d.label)}</label>`).join('')}</div>`).join('')}<div class="rounded-xl border border-slate-200 p-3"><p class="text-[10px] font-black uppercase text-slate-500 mb-2">DPI (modello esistente)</p><label class="!normal-case flex items-start gap-2 text-xs"><input type="checkbox" data-scd-bundle="registro_consegna_dpi" style="width:auto;margin-top:2px"> Registro consegna DPI dell’azienda</label></div></div>`;
    } else {
      body+=`<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${doc.fields.map(f=>fieldHtml(f,companyId,personId)).join('')}</div>`;
      if(doc.scope==='person'&&personId&&personId!=='__all__'){
        const p=people(companyId).find(x=>x.id===personId);
        if(p&&p.ruolo_aziendale==='datore_lavoro') body+=`<p class="mt-3 text-xs font-bold text-amber-800">La persona scelta è registrata come datore di lavoro: verifica che sia il destinatario corretto.</p>`;
      }
    }
    document.getElementById('safety-company-doc-body').innerHTML=body;
    if(typeof lucide!=='undefined') lucide.createIcons();
  }

  function ctxFrom(state){
    return {company:state.company,datore:document.getElementById('scd-datore')?.value?.trim()||'',date:document.getElementById('scd-date')?.value||today(),place:document.getElementById('scd-place')?.value?.trim()||state.company.sede||state.company.indirizzo||''};
  }
  function renderDoc(doc,c,state,values,personTargets){
    const extra={workers:workersOf(state.companyId),rlsCandidates:rlsCandidates(state.companyId)};
    if(doc.scope==='company') return doc.render(c,null,values,extra);
    return personTargets.map(w=>doc.render(c,w,values,extra)).join('');
  }
  function personTargets(state){
    if(state.personId&&state.personId!=='__all__'){const p=people(state.companyId).find(x=>x.id===state.personId);return p?[p]:[];}
    return workersOf(state.companyId);
  }

  function generateCatalog(){
    const s=window.__safetyCompanyDocState;
    const container=document.getElementById('print-preview-container');
    if(!container) return alert('Anteprima non disponibile. Apri il Centro Stampe.');
    const c=ctxFrom(s);
    const targets=personTargets(s);
    let html='';
    if(s.type===BUNDLE){
      const chosen=[...document.querySelectorAll('[data-scd-bundle]')].filter(x=>x.checked).map(x=>x.dataset.scdBundle);
      if(!chosen.length) return alert('Scegli almeno un documento.');
      const personDocs=CATALOG.filter(d=>d.scope==='person'&&chosen.includes(d.id));
      const companyDocs=CATALOG.filter(d=>d.scope==='company'&&chosen.includes(d.id));
      if(personDocs.length&&!targets.length) return alert('Nessun lavoratore disponibile per i documenti individuali.');
      const extra={workers:workersOf(s.companyId),rlsCandidates:rlsCandidates(s.companyId)};
      // Ordine: per ogni lavoratore tutti i suoi documenti, poi i documenti aziendali.
      targets.forEach(w=>personDocs.forEach(d=>{html+=d.render(c,w,{},extra);}));
      companyDocs.forEach(d=>{html+=d.render(c,null,d.id==='registro_addestramento'?{con_nomi:true}:{},extra);});
      if(chosen.includes('registro_consegna_dpi')){
        const ws=workersOf(s.companyId);
        const list=ws.length?ws:[{nome:'________________',cf:'',mansione:''}];
        for(let i=0;i<list.length;i+=14) html+=D.registerPage({...c,commonDpi:''},list.slice(i,i+14));
      }
    } else {
      const doc=BY_ID.get(s.type);
      if(doc.scope==='person'&&!targets.length) return alert('Nessun lavoratore disponibile in questa azienda.');
      html=renderDoc(doc,c,s,readFields(doc.fields),targets);
    }
    window.currentPrintModule=s.type;
    container.innerHTML=html;
    container.style.width='210mm';container.style.maxWidth='210mm';container.style.display='block';
    window.closeSafetyCompanyDoc();
    const n=(html.match(/class="doc-page safety-company-doc-page"/g)||[]).length;
    if(typeof window.showSafetyToast==='function') window.showSafetyToast(`${n} ${n===1?'pagina pronta':'pagine pronte'}: controlla l’anteprima; per stampare o inviare usa “Ristampa documento visualizzato” o “Condividi PDF”.`,{title:'Documenti generati',type:'ok',icon:'file-check-2'});
  }

  // ---------- aggancio alle funzioni esistenti (i 4 modelli storici restano invariati) ----------
  const originalOpen=window.openSafetyCompanyDoc;
  window.openSafetyCompanyDoc=async function(type,...args){
    if(BY_ID.has(type)||type===BUNDLE) return openCatalogDoc(type);
    return originalOpen?.call(this,type,...args);
  };
  const originalGenerate=window.generateSafetyCompanyDoc;
  window.generateSafetyCompanyDoc=async function(...args){
    if(window.__safetyCompanyDocState?.catalog) return generateCatalog();
    return originalGenerate?.apply(this,args);
  };

  // ---------- pulsanti nel Centro Stampe ----------
  function sectionHtml(){
    const groups=[...new Set(CATALOG.map(d=>d.group))];
    return `<div id="scd-catalog" class="mt-4 p-3 border-2 border-emerald-200 rounded-xl bg-emerald-50 space-y-2"><p class="text-[10px] font-black uppercase text-emerald-900">Documenti D.Lgs. 81/08 — datore di lavoro e lavoratore</p><p id="scd-catalog-hint" class="text-[10px] font-bold text-emerald-800"></p>${groups.map(g=>`<p class="text-[9px] font-black uppercase text-emerald-700 pt-1">${esc(g)}</p>${CATALOG.filter(d=>d.group===g).map(d=>`<button type="button" data-scd-catalog="${esc(d.id)}" onclick="window.openSafetyCompanyDoc('${esc(d.id)}')" class="w-full text-left px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed">${esc(d.label)}</button>`).join('')}`).join('')}<button type="button" data-scd-catalog="${BUNDLE}" onclick="window.openSafetyCompanyDoc('${BUNDLE}')" class="w-full mt-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black px-3 py-2.5 text-[10px] uppercase disabled:opacity-40 disabled:cursor-not-allowed">Stampa unica di più documenti</button></div>`;
  }
  function updateState(){
    const companyId=document.getElementById('scd-launch-company')?.value||'';
    const personId=document.getElementById('scd-launch-person')?.value||'__all__';
    document.querySelectorAll('[data-scd-catalog]').forEach(b=>{b.disabled=!companyId;});
    const hint=document.getElementById('scd-catalog-hint');
    if(hint) hint.textContent=!companyId?'Seleziona un’azienda.':(personId==='__all__'?`Tutta l’azienda: i documenti individuali vengono generati per ${workersOf(companyId).length} lavoratori.`:'Documenti intestati alla persona scelta; quelli aziendali valgono per tutta l’azienda.');
  }
  function inject(){
    const box=document.getElementById('safety-company-doc-buttons');
    const cs=document.getElementById('scd-launch-company');
    if(!box||!cs||box.querySelector('#scd-catalog')) return;
    box.insertAdjacentHTML('beforeend',sectionHtml());
    cs.addEventListener('change',updateState);
    document.getElementById('scd-launch-person')?.addEventListener('change',updateState);
    updateState();
  }
  const root=document.getElementById('app-content')||document.body;
  new MutationObserver(()=>{if(document.getElementById('scd-launch-company')&&!document.getElementById('scd-catalog'))inject();}).observe(root,{childList:true,subtree:true});
  inject();
  window.SafetyCompanyDocsCatalog={catalog:CATALOG,open:openCatalogDoc,generate:generateCatalog,rlsCandidates,employerOf};
})();
