// Controllo aggiuntivo non distruttivo: esiti negativi, prove non svolte e date mancanti
// non devono autorizzare la stampa di una nomina basata sulla formazione.
(function(){
  if(window.__safetyNomineCompletionGuard) return;
  window.__safetyNomineCompletionGuard=true;

  function negative(value){
    const text=String(value||'').normalize('NFKC').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
    return /\b(?:non\s+(?:idone[oa]|superat[oa]|abilitat[oa]|positiv[oa]|effettuat[oa]|svolt[oa]|eseguit[oa])|inidone[oa]|negativ[oa]|insufficient[ea]|respint[oa]|bocciat[oa]|assent[ea]|mancante|da\s+(?:svolgere|effettuare)|in\s+attesa)\b/.test(text);
  }

  function verify(history,original){
    if(!history?.project || !history?.enrollment) return false;
    const endDate=String(history.project.data_esame||'').slice(0,10);
    const now=new Date();
    const today=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate>today) return false;
    if(negative(history.enrollment.esito) || negative(history.enrollment.esito_pratica)) return false;
    const attendance=history.enrollment.percentuale_frequenza;
    if(attendance!==null && attendance!==undefined && attendance!==''){
      const value=Number(String(attendance).replace(',','.'));
      if(!Number.isFinite(value) || value<90 || value>100) return false;
    }
    return original(history)===true;
  }

  function patchDirectory(){
    const D=window.SafetyCompanyDocs;
    if(!D || D.__strictNomineCompletion || typeof D.isTrainingCompleted!=='function' || typeof D.loadDirectory!=='function') return;
    D.__strictNomineCompletion=true;
    const original=D.isTrainingCompleted;
    D.isTrainingCompleted=history=>verify(history,original);
    const refresh=D.loadDirectory;
    D.loadDirectory=async function(...args){
      const directory=await refresh.apply(this,args);
      if(directory?.histories instanceof Map){
        directory.histories.forEach(histories=>histories.forEach(h=>{h.completed=D.isTrainingCompleted(h);}));
      }
      return directory;
    };
    if(D.directoryCache?.histories instanceof Map){
      D.directoryCache.histories.forEach(histories=>histories.forEach(h=>{h.completed=D.isTrainingCompleted(h);}));
    }
  }

  document.addEventListener('load',event=>{
    if(String(event.target?.src||'').includes('documenti_azienda_lavoratore_directory.js')) patchDirectory();
  },true);
  patchDirectory();
})();
