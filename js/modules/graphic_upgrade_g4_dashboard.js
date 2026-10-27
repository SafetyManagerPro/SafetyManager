/* SafetyManager Pro G4: grafici e calendario esclusivamente dai dati Dashboard già letti.
 * Nessuna fetch, query Supabase, scrittura o cambio di stato corsi.
 */
(function(){
'use strict';
if(window.__safetyGraphicG4Loaded)return;
window.__safetyGraphicG4Loaded=true;
const STYLE_ID='safety-g4-dashboard-style';
const CATEGORIES=[
 {key:'review',label:'Da verificare',color:'#e11d48',hint:'Dati mancanti o errori sostanziali'},
 {key:'complete',label:'Da completare',color:'#d97706',hint:'Attività e registrazioni in sospeso'},
 {key:'acquire',label:'Da acquisire',color:'#2563eb',hint:'Evidenze documentali da acquisire'},
 {key:'ready',label:'Pronti',color:'#0d9488',hint:'Pronti per stampe o archiviazione'},
 {key:'closed',label:'Chiusi',color:'#64748b',hint:'Progetti chiusi senza ulteriori rilievi'},
 {key:'other',label:'Altri stati',color:'#a78bfa',hint:'Stati non classificati'}
];
function el(id){return document.getElementById(id)}
function safe(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
})}
function category(key){
 if(key==='post_review'||key==='draft')return 'review';
 if(key==='post_complete'||key==='toclose')return 'complete';
 if(key==='post_acquire')return 'acquire';
 if(key==='ready'||key==='ready_archive')return 'ready';
 if(key==='closed')return 'closed';
 return 'other';
}
function distribution(statuses){
 const result=Object.fromEntries(CATEGORIES.map(function(c){return [c.key,0]}));
 (Array.isArray(statuses)?statuses:[]).forEach(function(row){
   result[category(row&&row.key)]++;
 });
 return result;
}
function safeDate(value){
 const str=String(value||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(str))return null;
 const d=new Date(str+'T00:00:00');
 if(Number.isNaN(d.getTime())||d.getFullYear()!==Number(str.slice(0,4))||
    d.getMonth()+1!==Number(str.slice(5,7))||d.getDate()!==Number(str.slice(8,10)))return null;
 return d;
}
function upcoming(projects,now){
 const today=new Date(now||new Date());today.setHours(0,0,0,0);
 const end=new Date(today);end.setDate(end.getDate()+30);
 return (Array.isArray(projects)?projects:[])
  .filter(function(p){return p&&p.stato_corso!=='chiuso'})
  .map(function(p){return {project:p,date:safeDate(p.data_esame)}})
  .filter(function(row){return row.date&&row.date>=today&&row.date<=end})
  .sort(function(a,b){return a.date-b.date||String(a.project.codice||'').localeCompare(String(b.project.codice||''))});
}
function style(){
 if(el(STYLE_ID))return;
 const node=document.createElement('style');node.id=STYLE_ID;
 node.textContent=[
 '#dash-g4-overview .safety-g4-chart-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap}',
 '#dash-g4-overview .safety-g4-ring{width:178px;height:178px;flex:none;border-radius:50%;display:grid;place-items:center;border:1px solid #e2e8f0}',
 '#dash-g4-overview .safety-g4-ring-center{width:116px;height:116px;background:#fff;border-radius:50%;display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:0 3px 15px rgba(15,23,42,.09)}',
 '#dash-g4-overview .safety-g4-ring-total{font-size:32px;line-height:1;font-weight:900;color:#0f172a}',
 '#dash-g4-overview .safety-g4-legend{flex:1 1 230px;min-width:0;display:grid;gap:8px}',
 '#dash-g4-overview .safety-g4-legend-row{display:grid;grid-template-columns:11px minmax(0,1fr) 35px;gap:9px;align-items:center;font-size:12px;color:#334155}',
 '#dash-g4-overview .safety-g4-dot{width:10px;height:10px;border-radius:4px}',
 '#dash-g4-overview .safety-g4-count{font-weight:900;color:#0f172a;text-align:right;font-variant-numeric:tabular-nums}',
 '#dash-g4-overview .safety-g4-track{height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:4px}',
 '#dash-g4-overview .safety-g4-fill{height:100%;border-radius:999px;min-width:0}',
 '#dash-g4-overview .safety-g4-date{flex:none;display:flex;align-items:center;justify-content:center;flex-direction:column;min-width:65px;padding:8px;background:#eff6ff;border-radius:12px;border:1px solid #dbeafe;color:#1e40af;font-weight:900}',
 '#dash-g4-overview .safety-g4-upcoming-item{display:flex;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:14px;padding:10px;background:#fff;min-width:0}',
 '#dash-g4-overview .safety-g4-upcoming-item button{min-height:42px;min-width:58px;border-radius:10px;border:1px solid #cbd5e1;padding:8px;font-size:11px;font-weight:800;color:#1e3a8a;background:#eff6ff}',
 '#dash-g4-overview .safety-g4-upcoming-item button:hover{background:#dbeafe}',
 '#dash-g4-overview .safety-g4-upcoming-item button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}',
 '#dash-g4-overview .safety-g4-upcoming-text{min-width:0;flex:1}',
 '#dash-g4-overview .safety-g4-empty{border:1px dashed #cbd5e1;background:#f8fafc;color:#475569;border-radius:14px;padding:26px;text-align:center;font-size:12px}',
 '#dash-g4-overview .safety-g4-footnote{font-size:11px;line-height:1.5;color:#64748b;margin-top:12px}',
 '@media(max-width:640px){#dash-g4-overview .safety-g4-chart-row{justify-content:center}#dash-g4-overview .safety-g4-ring{width:154px;height:154px}#dash-g4-overview .safety-g4-ring-center{width:103px;height:103px}#dash-g4-overview .safety-g4-upcoming-item{gap:8px}#dash-g4-overview .safety-g4-date{min-width:54px}}',
 '@media print{#dash-g4-overview .safety-g4-upcoming-item button{display:none!important}}'
 ].join('\n');
 document.head.appendChild(node);
}
function renderStatus(statuses,counts){
 const host=el('dash-g4-status');if(!host)return;
 const dist=distribution(statuses);
 const total=Object.values(dist).reduce(function(n,v){return n+v},0);
 if(!total){
   host.innerHTML='<div class="safety-g4-empty">Nessun progetto disponibile per il riepilogo grafico.</div>';
   return;
 }
 const slices=[];let current=0;
 CATEGORIES.forEach(function(c){
   const n=dist[c.key];if(n<=0)return;
   const next=current+(n/total)*100;
   slices.push(c.color+' '+current.toFixed(3)+'% '+next.toFixed(3)+'%');
   current=next;
 });
 const circle='conic-gradient('+slices.join(',')+')';
 const legend=CATEGORIES.filter(function(c){return dist[c.key]>0}).map(function(c){
   const num=dist[c.key],percentage=Math.round((num/total)*100);
   return '<div class="safety-g4-legend-row">'+
     '<span class="safety-g4-dot" style="background:'+c.color+'"></span>'+
     '<div><span title="'+safe(c.hint)+'">'+safe(c.label)+'</span>'+
     '<div class="safety-g4-track"><div class="safety-g4-fill" style="background:'+c.color+';width:'+percentage+'%"></div></div></div>'+
     '<span class="safety-g4-count">'+num+'</span></div>';
 }).join('');
 host.innerHTML='<div class="safety-g4-chart-row">'+
  '<div class="safety-g4-ring" aria-label="Distribuzione degli stati di '+total+' progetti" role="img">'+
  '<div class="safety-g4-ring-center"><span class="safety-g4-ring-total">'+total+'</span>'+
  '<span class="text-[10px] font-bold text-slate-500">progetti letti</span></div></div>'+
  '<div class="safety-g4-legend">'+legend+'</div></div>'+
  '<p class="safety-g4-footnote">Grafico sui '+total+' progetti caricati. Gli stati derivano dai controlli Dashboard/Step 67, non sostituiscono le verifiche documentali.</p>';
 const ring=host.querySelector('.safety-g4-ring');if(ring)ring.style.background=circle;
}
function renderUpcoming(projects,now){
 const host=el('dash-g4-upcoming');if(!host)return;
 const all=upcoming(projects,now);
 if(!all.length){
   host.innerHTML='<div class="safety-g4-empty">Nessuna data di verifica/fine corso nei prossimi 30 giorni fra i progetti aperti o svolti.</div>';
   return;
 }
 const fmt=new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short'});
 const rows=all.slice(0,5).map(function(item){
   const p=item.project,label=window.DB_CORSI&&window.DB_CORSI[p.corso_id]?
     window.DB_CORSI[p.corso_id].t:(p.corso_id||'Corso non indicato');
   const company=p.aziende&&p.aziende.ragione_sociale?p.aziende.ragione_sociale:'Azienda non specificata';
   return '<div class="safety-g4-upcoming-item">'+
     '<div class="safety-g4-date">'+safe(fmt.format(item.date))+'</div>'+
     '<div class="safety-g4-upcoming-text">'+
     '<p class="text-xs font-black text-slate-900 break-words">'+safe(p.codice||'Senza codice')+'</p>'+
     '<p class="text-[11px] text-slate-600 break-words">'+safe(label)+'</p>'+
     '<p class="text-[10px] text-slate-500 break-words">'+safe(company)+'</p></div>'+
     '<button type="button" data-safety-g4-project="'+safe(p.id||'')+'" aria-label="Apri progetto '+safe(p.codice||'senza codice')+'">Apri</button></div>';
 }).join('');
 host.innerHTML='<div class="space-y-2 text-left">'+rows+'</div>'+
  '<p class="safety-g4-footnote">'+all.length+' verifiche/fine corso nei prossimi 30 giorni'+(all.length>5?' · prime 5 mostrate':'')+
  '. Date dei progetti, non scadenze normative.</p>';
}
function render(model){
 if(!el('dash-g4-overview'))return false;
 style();
 renderStatus(model&&model.statuses,model&&model.counts);
 renderUpcoming(model&&model.projects,model&&model.now);
 return true;
}
function install(){
 const host=el('dash-g4-overview');if(!host||host.__safetyG4Bound)return;
 host.__safetyG4Bound=true;
 host.addEventListener('click',function(event){
   const btn=event.target.closest('[data-safety-g4-project]');
   if(!btn)return;
   const projectId=btn.getAttribute('data-safety-g4-project');
   if(!(window.SafetyGraphicG4.lastProjects||[]).some(function(p){return String(p.id)===projectId}))return;
   if(typeof window.dashboardOpenProject==='function')window.dashboardOpenProject(projectId);
   else if(typeof window.loadModule==='function')window.loadModule('progetti');
 });
}
window.SafetyGraphicG4={
 distribution:distribution,upcoming:upcoming,render:function(model){
   const ok=render(model);
   if(ok){window.SafetyGraphicG4.lastProjects=Array.isArray(model&&model.projects)?model.projects:[];install()}
   return ok;
 },lastProjects:[]
};
})();