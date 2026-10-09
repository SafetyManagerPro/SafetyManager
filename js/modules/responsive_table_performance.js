// Ottimizzazione compatibile delle card responsive definite in utils.js.
// Evita di rileggere l'intero tbody a ogni mutazione globale e aggiorna solo le tabelle realmente cambiate.
(function(){
  if(window.__safetyResponsiveTablePerformanceLoaded) return;
  window.__safetyResponsiveTablePerformanceLoaded=true;

  const mobileQuery=window.matchMedia?.('(max-width: 768px)')||{matches:true,addEventListener:()=>{}};
  const pendingTables=new Set();
  const pendingRoots=new Set();
  let tableFrame=false;
  let bindFrame=false;

  function renderCards(table){
    if(!table?.isConnected) return false;
    const cardsId=table.dataset?.responsiveCards;
    const cards=cardsId?document.getElementById(cardsId):null;
    const tbody=table.tBodies?.[0];
    if(!cards||!tbody) return false;

    // Le card sono una vista mobile: su desktop evitiamo completamente serializzazioni e rebuild.
    if(!mobileQuery.matches){
      table.dataset.responsiveCardsDirty='1';
      return false;
    }

    const headers=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim());
    const rows=Array.from(tbody.rows).filter(row=>row.style.display!=='none'&&!row.classList.contains('hidden'));

    if(!rows.length){
      const html='<div class="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs font-bold text-slate-500">Nessun elemento da mostrare.</div>';
      if(cards.innerHTML!==html) cards.innerHTML=html;
      table.dataset.responsiveCardsDirty='0';
      return true;
    }

    const html=rows.map(row=>{
      const cells=Array.from(row.cells);
      if(cells.length===1&&Number(cells[0].colSpan||1)>1){
        return '<div class="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">'+cells[0].innerHTML+'</div>';
      }
      const first=cells[0];
      const details=[];
      let actions='';
      cells.forEach((cell,index)=>{
        const label=headers[index]||('Dato '+(index+1));
        const value=cell.innerHTML.trim();
        if(!value) return;
        if(/azion|azione/i.test(label)){actions=value;return;}
        if(index===0) return;
        details.push(
          '<div class="grid grid-cols-[minmax(90px,0.38fr)_minmax(0,0.62fr)] gap-3 py-2 border-t border-slate-100">'+
            '<div class="text-[9px] font-black uppercase tracking-wider text-slate-400">'+label+'</div>'+
            '<div class="min-w-0 text-[11px] text-slate-700 break-words text-right">'+value+'</div>'+
          '</div>'
        );
      });
      return '<article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">'+
        '<div class="min-w-0 text-sm text-slate-900 break-words">'+(first?first.innerHTML:'')+'</div>'+
        '<div class="mt-3">'+details.join('')+'</div>'+
        (actions?'<div class="mt-3 pt-3 border-t border-slate-200 flex flex-wrap justify-end gap-2">'+actions+'</div>':'')+
      '</article>';
    }).join('');

    if(cards.innerHTML!==html) cards.innerHTML=html;
    table.dataset.responsiveCardsDirty='0';
    return true;
  }

  function flushTables(){
    tableFrame=false;
    const tables=[...pendingTables];
    pendingTables.clear();
    let rendered=false;
    tables.forEach(table=>{if(renderCards(table)) rendered=true;});
    // Una sola scansione Lucide per frame e solo quando abbiamo davvero ricostruito card mobili.
    if(rendered&&window.lucide) window.lucide.createIcons();
  }

  function scheduleTable(table){
    if(!table) return;
    pendingTables.add(table);
    if(tableFrame) return;
    tableFrame=true;
    requestAnimationFrame(flushTables);
  }

  function bindTable(table){
    if(!table||table.dataset.responsiveCardsPerfBound==='1'){
      if(table&&table.dataset.responsiveCardsDirty==='1') scheduleTable(table);
      return;
    }
    table.dataset.responsiveCardsPerfBound='1';
    // Manteniamo anche il flag storico: l'observer legacy non ne crea un secondo.
    table.dataset.responsiveCardsBound='1';
    const tbody=table.tBodies?.[0];
    if(tbody&&typeof MutationObserver!=='undefined'){
      const observer=new MutationObserver(()=>scheduleTable(table));
      observer.observe(tbody,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
      table.__safetyResponsiveCardsObserver=observer;
    }
    scheduleTable(table);
  }

  function scanRoot(root){
    if(!root?.querySelectorAll) return;
    if(root.matches?.('table[data-responsive-cards]')) bindTable(root);
    // Cerchiamo solo tabelle non ancora ottimizzate, non risincronizziamo tutte quelle esistenti.
    root.querySelectorAll('table[data-responsive-cards]:not([data-responsive-cards-perf-bound="1"])').forEach(bindTable);
  }

  function flushRoots(){
    bindFrame=false;
    const roots=[...pendingRoots];
    pendingRoots.clear();
    roots.forEach(scanRoot);
  }

  function bindResponsive(root=document){
    pendingRoots.add(root||document);
    if(bindFrame) return;
    bindFrame=true;
    requestAnimationFrame(flushRoots);
  }

  // Sostituiamo le funzioni richiamate dagli observer legacy: gli observer già creati diventano economici.
  window.syncResponsiveTableCards=scheduleTable;
  window.bindResponsiveTableCards=bindResponsive;

  const refreshBreakpoint=()=>{
    document.querySelectorAll('table[data-responsive-cards]').forEach(table=>{
      if(mobileQuery.matches||table.dataset.responsiveCardsDirty==='1') scheduleTable(table);
    });
  };
  mobileQuery.addEventListener?.('change',refreshBreakpoint);
  window.addEventListener('orientationchange',refreshBreakpoint,{passive:true});

  bindResponsive(document);
  window.SafetyResponsiveTablePerformance={bind:bindResponsive,sync:scheduleTable,refresh:refreshBreakpoint};
})();
