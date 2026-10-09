// Riferimenti documentali universali: web, file locale, server/rete e percorsi manuali.
(function(){
  if(window.__safetyUniversalDocumentReferenceLoaded) return;
  window.__safetyUniversalDocumentReferenceLoaded=true;

  const SELECTOR=[
    '#az-legale-doc-url',
    '#doc-doc-identita-url',
    '#doc-doc-cf-url',
    '#cor-doc-identita-url',
    '#cor-doc-cf-url',
    '#cor-lingua-documento-url'
  ].join(',');

  const toast=(message,type='info')=>{
    if(typeof window.showSafetyToast==='function') window.showSafetyToast(message,{title:'Riferimento documento',type});
    else alert(message);
  };

  function setField(field,value){
    if(!field) return;
    field.value=String(value??'');
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
    refreshField(field);
  }

  async function chooseLocal(field){
    if(!field) return;
    if(window.SafetyLocalEvidence?.chooseForField){
      await window.SafetyLocalEvidence.chooseForField(field);
      refreshField(field);
      return;
    }
    toast('Selettore file locale non disponibile in questo browser. Incolla un percorso o un URL nel campo.','warning');
  }

  function insertReference(field){
    if(!field) return;
    const current=String(field.value||'').trim();
    const value=window.prompt(
      'Incolla un riferimento documentale.\n\nEsempi:\nhttps://server/documento.pdf\nhttp://intranet/documento.pdf\nC:\\Documenti\\file.pdf\n\\\\SERVER\\Cartella\\file.pdf\nsmb://server/cartella/file.pdf\nfile:///C:/Documenti/file.pdf',
      current
    );
    if(value===null) return;
    setField(field,value.trim());
  }

  async function copyReference(field){
    const value=String(field?.value||'').trim();
    if(!value){toast('Nessun riferimento da copiare.','info');return;}
    try{
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const t=document.createElement('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();
      }
      toast('Riferimento copiato.','ok');
    }catch(_e){toast('Copia non riuscita: seleziona il testo manualmente.','warning');}
  }

  function openReference(field){
    const value=String(field?.value||'').trim();
    if(!value){toast('Nessun riferimento indicato.','info');return;}
    if(window.SafetyDocumentLinks?.open){
      window.SafetyDocumentLinks.open(value,field.dataset.safetyDocumentLabel||'Documento');
      return;
    }
    window.open(value,'_blank','noopener');
  }

  function kindLabel(value){
    const info=window.SafetyDocumentLinks?.classify?.(value);
    if(!info) return String(value||'').trim()?'Riferimento manuale':'Nessun riferimento';
    const labels={
      empty:'Nessun riferimento',
      local:'File locale',
      'legacy-local':'Vecchio file locale',
      'web-secure':'HTTPS',
      'web-insecure':'HTTP',
      file:'Percorso file',
      network:'Server / rete',
      blob:'File temporaneo browser',
      data:'Dato incorporato',
      custom:'Protocollo esterno',
      manual:'Percorso / riferimento manuale'
    };
    return labels[info.kind]||'Riferimento';
  }

  function refreshField(field){
    const tools=field?.parentElement?.querySelector?.('.safety-document-reference-tools');
    if(!tools) return;
    const status=tools.querySelector('[data-document-reference-status]');
    const has=!!String(field.value||'').trim();
    if(status) status.textContent=kindLabel(field.value);
    const open=tools.querySelector('[data-document-reference-open]');
    const copy=tools.querySelector('[data-document-reference-copy]');
    if(open) open.disabled=!has;
    if(copy) copy.disabled=!has;
  }

  function labelForField(field){
    const label=field.closest('div')?.querySelector('label');
    return String(label?.textContent||'Documento').trim().replace(/^Link\s+/i,'').slice(0,80)||'Documento';
  }

  function hideLegacyPicker(field){
    const wrap=field.parentElement;
    if(!wrap) return;
    const file=wrap.querySelector('input[type="file"]');
    if(file){
      const row=file.parentElement;
      if(row&&row!==wrap) row.style.display='none';
      else file.style.display='none';
    }
  }

  function decorateField(field){
    if(!field||field.dataset.safetyUniversalDocumentReference==='1') return false;
    field.dataset.safetyUniversalDocumentReference='1';
    field.dataset.safetyDocumentLabel=labelForField(field);

    // type=url impedisce C:\\, UNC, smb:// e altri riferimenti validi per l'archivio.
    if(String(field.type||'').toLowerCase()==='url') field.type='text';
    field.autocomplete='off';
    field.spellcheck=false;
    if(!field.placeholder||/^https:\/\/\.\.\.$/i.test(field.placeholder)){
      field.placeholder='https://… · http://… · C:\\… · \\\\SERVER\\… · smb://…';
    }

    hideLegacyPicker(field);

    const tools=document.createElement('div');
    tools.className='safety-document-reference-tools mt-2 flex flex-wrap items-center gap-2';
    tools.innerHTML=`
      <button type="button" data-document-reference-local class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>File locale</button>
      <button type="button" data-document-reference-insert class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="network" class="w-3.5 h-3.5"></i>URL / server</button>
      <button type="button" data-document-reference-open class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="folder-open" class="w-3.5 h-3.5"></i>Apri</button>
      <button type="button" data-document-reference-copy class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-black uppercase inline-flex items-center gap-1"><i data-lucide="copy" class="w-3.5 h-3.5"></i>Copia</button>
      <span data-document-reference-status class="text-[9px] font-bold text-slate-500 normal-case"></span>
      <span class="basis-full text-[9px] text-slate-400">Accetta HTTPS, HTTP, file locale, percorsi PC, NAS/rete e URI server.</span>`;
    field.insertAdjacentElement('afterend',tools);

    tools.querySelector('[data-document-reference-local]').onclick=()=>chooseLocal(field);
    tools.querySelector('[data-document-reference-insert]').onclick=()=>insertReference(field);
    tools.querySelector('[data-document-reference-open]').onclick=()=>openReference(field);
    tools.querySelector('[data-document-reference-copy]').onclick=()=>copyReference(field);
    field.addEventListener('input',()=>refreshField(field));
    refreshField(field);
    if(window.lucide) window.lucide.createIcons({attrs:{'aria-hidden':'true'}});
    return true;
  }

  function fields(root=document){
    const list=[];
    if(root?.matches?.(SELECTOR)) list.push(root);
    root?.querySelectorAll?.(SELECTOR).forEach(el=>list.push(el));
    return [...new Set(list)];
  }

  function decorate(root=document){
    let count=0;
    fields(root).forEach(field=>{if(decorateField(field)) count++;});
    return count;
  }

  // Compatibilità con i vecchi pulsanti inline "Collega": ora aprono il selettore locale persistente.
  window.uploadDocumentoArchivio=async function(_entityType,_docType,_fileInputId,targetInputId){
    const field=document.getElementById(targetInputId);
    if(!field){toast('Campo documento non trovato.','error');return '';}
    await chooseLocal(field);
    return field.value||'';
  };

  decorate(document);
  window.SafetyDocumentReferences={decorate,chooseLocal,insertReference,openReference,copyReference,refreshField,selector:SELECTOR};
})();
