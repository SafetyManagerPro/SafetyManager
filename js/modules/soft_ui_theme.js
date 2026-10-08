// Tema chiaro più riposante: riduce il bianco esteso senza cambiare identità visiva.
(function(){
  if(window.__safetySoftUiThemeLoaded) return;
  window.__safetySoftUiThemeLoaded=true;
  const STYLE_ID='safety-soft-ui-theme-style';
  if(document.getElementById(STYLE_ID)) return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    :root{
      --safety-page-bg:#f4f5f2;
      --safety-soft-surface:#f7f8f5;
      --safety-soft-border:#e1e4df;
      --safety-soft-text:#1f2937;
    }
    html,body{background:var(--safety-page-bg)!important;color:var(--safety-soft-text)}
    body.bg-slate-50{background:var(--safety-page-bg)!important}
    #app-content{background:transparent!important}
    #app-content .bg-slate-50{background-color:var(--safety-soft-surface)!important}
    #app-content .border-slate-200{border-color:var(--safety-soft-border)!important}
    .safety-modal-normalized .bg-slate-50{background-color:var(--safety-soft-surface)!important}
    .safety-page-nav{background:rgba(255,255,255,.94)!important}
    #app-content table tbody tr:not([class*="bg-"]):nth-child(even){background-color:rgba(247,248,245,.72)}
    #app-content input:not([type="checkbox"]):not([type="radio"]),
    #app-content select,
    #app-content textarea{caret-color:#334155}
    @media print{
      html,body,#app-content{background:#fff!important}
      #app-content .bg-slate-50,.safety-modal-normalized .bg-slate-50{background:#fff!important}
    }
  `;
  document.head.appendChild(style);
})();
