'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/stampe_bundle.js'),'utf8');
const isolate=(start,end)=>{
  const a=source.indexOf(start);
  const b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Funzione da testare individuata: '+start);
  return source.slice(a,b);
};

const routes=[
  {name:'documento rapido',functionName:'stampaModuloProgettoRapido',start:'window.stampaModuloProgettoRapido = async function',end:'window.stampaProgettoFormativoDaProgetto = async function',args:['project-id','progetto_formativo','progetto formativo'],delay:900},
  {name:'attestati progetto',functionName:'stampaAttestatiProgetto',start:'window.stampaAttestatiProgetto = async function',end:'window.stampaAttestatoCorsista = async function',args:['project-id'],delay:1000},
  {name:'attestato corsista',functionName:'stampaAttestatoCorsista',start:'window.stampaAttestatoCorsista = async function',end:'window.stampaSoloAttestatiPDF = async function',args:['project-id','corsista-id'],delay:900}
];

async function printCase(route,errorMode=null){
  const scheduled=[], alerts=[], warnings=[], tokens=new Set(), area={innerHTML:'',dataset:{},appended:0,appendChild(){this.appended++;}};
  let printed=0, captured=0;
  const person={corsista_id:'corsista-id',nome:'Corsista Test'};
  const w={
    currentSessionCorsisti:[person],
    progettiList:[{id:'project-id',corso_id:'standard'}],
    DB_CORSI:{standard:{t:'Formazione'}},
    caricaDatiStampa:async()=>{},
    renderPrintModuleToTemp:async()=>[{id:'page'}],
    renderAttestatiMultipli:async(area)=>{area.appendChild({});},
    waitForPrintImages:async()=>{if(errorMode==='images')throw Error('Immagine non caricata')},
    print(){printed++;if(errorMode==='print')throw Error('Browser stampa non disponibile')},
    SafetyCorsistiAutoArchive:{capture(){captured++;if(errorMode==='archive')throw Error('Archivio non disponibile')}}
  };
  const d={
    getElementById(id){return id==='print-area-temp'?area:null},
    body:{classList:{add(x){tokens.add(x)},remove(x){tokens.delete(x)}}}
  };
  const sandbox={window:w,document:d,console:{error(){},warn(...parts){warnings.push(parts.join(' '))},info(){}},
    alert(message){alerts.push(String(message))},
    setTimeout(fn,delay){scheduled.push({fn,delay})}};
  vm.runInNewContext(isolate(route.start,route.end),sandbox);
  await w[route.functionName](...route.args);
  assert.equal(scheduled.length,1,'Solo una stampa pianificata');
  assert.equal(scheduled[0].delay,route.delay,'Ritardo precedente invariato');
  assert.equal(tokens.has('is-printing-temp'),true);
  area.innerHTML='<div>Pagina temporanea</div>';
  await scheduled[0].fn();
  return {alerts,warnings,tokens,area,printed,captured};
}

for(const route of routes){
  test(route.name+': stampa senza errori e pulizia area',async()=>{
    const r=await printCase(route);
    assert.equal(r.printed,1);
    assert.equal(r.tokens.has('is-printing-temp'),false);
    assert.equal(r.area.innerHTML,'');
  });
  for(const errorMode of ['images','print']){
    test(route.name+': fallimento '+errorMode+' non blocca la UI',async()=>{
      const r=await printCase(route,errorMode);
      assert.equal(r.printed,errorMode==='images'?0:1);
      assert.equal(r.tokens.has('is-printing-temp'),false);
      assert.equal(r.area.innerHTML,'');
      assert.ok(r.alerts.some(message=>/Impossibile aprire la stampa/.test(message)));
    });
  }
}

test('attestato singolo: archivio opzionale guasto non impedisce la stampa',async()=>{
  const r=await printCase(routes[2],'archive');
  assert.equal(r.captured,1);
  assert.equal(r.printed,1);
  assert.equal(r.tokens.has('is-printing-temp'),false);
  assert.equal(r.area.innerHTML,'');
  assert.ok(r.warnings.some(x=>/Archiviazione automatica facoltativa/.test(x)));
});

test('fallback rendering: su errore updateAll ripristina modulo e corsista ed elimina holder',async()=>{
  let removed=0;
  const holder={style:{},innerHTML:'',remove(){removed++}};
  const d={createElement(){return holder},body:{appendChild(){}}};
  const w={
    currentPrintModule:'modulo-precedente',
    currentSessionCorsisti:[{id:'persona-precedente'}],
    updateAll(){throw Error('Template malformato')}
  };
  const sandbox={window:w,document:d,fetch:async()=>({ok:true,text:async()=>'<div>esempio</div>'})};
  vm.runInNewContext(isolate('window.renderPrintModuleToTemp = async function','window.stampaFascicoloCompletoPDF = async function'),sandbox);
  await assert.rejects(w.renderPrintModuleToTemp('attestato',{id:'persona-nuova'}),/Template malformato/);
  assert.equal(w.currentPrintModule,'modulo-precedente');
  assert.equal(w.currentSessionCorsisti.length,1);
  assert.equal(w.currentSessionCorsisti[0].id,'persona-precedente');
  assert.equal(removed,1);
});

test('fallback rendering: percorso valido ripristina modulo e sessione dopo clonazione',async()=>{
  let removed=0;
  const page={classList:{remove(){},add(){}},cloneNode(){return {classList:{remove(){},add(){}}}}};
  const holder={style:{},innerHTML:'',querySelectorAll(){return [page]},remove(){removed++}};
  const d={createElement(){return holder},body:{appendChild(){}}};
  const w={currentPrintModule:'prima',currentSessionCorsisti:[{id:'originale'}],updateAll(){}};
  vm.runInNewContext(isolate('window.renderPrintModuleToTemp = async function','window.stampaFascicoloCompletoPDF = async function'),
    {window:w,document:d,fetch:async()=>({ok:true,text:async()=>'<div></div>'})});
  const pages=await w.renderPrintModuleToTemp('attestato',{id:'nuovo'});
  assert.equal(pages.length,1);
  assert.equal(w.currentPrintModule,'prima');
  assert.equal(w.currentSessionCorsisti[0].id,'originale');
  assert.equal(removed,1);
});
