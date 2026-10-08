// Guardia identità firme: una firma automatica del legale rappresentante
// può essere usata solo se il nominativo stampato coincide con quello associato.
(function(){
  if(window.__safetySignatureIdentityGuardLoaded) return;
  window.__safetySignatureIdentityGuardLoaded=true;

  const norm=(value)=>String(value||'')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const nameKey=(value)=>norm(value).split(' ').filter(Boolean).sort().join(' ');
  const samePerson=(a,b)=>{
    const aa=nameKey(a), bb=nameKey(b);
    return !!aa && !!bb && aa===bb;
  };

  const getEnte=()=>{
    const candidates=[window.currentEnteData,window.enteData,window.enteCorrente,window.currentEnte,window.ente].filter(Boolean);
    return candidates[0]||{};
  };

  const appValue=(...keys)=>{
    for(const key of keys){
      const stateValue=window.AppState?.[key];
      if(String(stateValue||'').trim() && String(stateValue).trim()!=='---') return stateValue;
      const el=document.getElementById(key);
      const value=el?.value || el?.textContent;
      if(String(value||'').trim() && String(value).trim()!=='---') return value;
    }
    return '';
  };

  const configuredLegalName=()=>{
    const ente=getEnte();
    return ente.legale_nome || ente.legale_rappresentante || ente.legale_nome_cognome ||
      appValue('ente-legale-nome','cfg-legale-nome','legale_nome') || '';
  };

  const isLegalRole=(role)=>['legale','legale rappresentante','legale_rappresentante','rappresentante legale'].includes(norm(role));

  const patch=()=>{
    const original=window.resolveSafetySignature;
    if(typeof original!=='function') return false;
    if(original.__safetyIdentityGuardPatched) return true;

    const guarded=function(args={}){
      const result=original.call(this,args) || {};
      if(!isLegalRole(args.role || result.role)) return result;

      const printedName=String(args.name || result.name || '').trim();
      if(!printedName) return result;

      const legalName=configuredLegalName();
      const signatures=Array.isArray(result.signatures) ? result.signatures : [];
      const filtered=signatures.filter(signature=>{
        if(!signature?.src) return false;
        if(signature.source==='ente-db') return samePerson(printedName,legalName);
        if(signature.name) return samePerson(printedName,signature.name);
        return false;
      });
      const first=filtered[0] || null;

      return {
        ...result,
        src:first?.src || '',
        signatures:filtered,
        source:first?.source || 'empty-slot',
        multi:filtered.length>1
      };
    };

    guarded.__safetyIdentityGuardPatched=true;
    guarded.__safetyIdentityGuardOriginal=original;
    window.resolveSafetySignature=guarded;
    return true;
  };

  window.installSafetySignatureIdentityGuard=patch;

  if(!patch()){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts+=1;
      if(patch() || attempts>=100) clearInterval(timer);
    },100);
  }
})();
