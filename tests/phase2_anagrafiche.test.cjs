'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const config=fs.readFileSync(path.join(root,'js/supabase_config.js'),'utf8');
const utils=fs.readFileSync(path.join(root,'js/utils.js'),'utf8');
const from=config.indexOf('window.normalizzaIdentificativoAzienda =');
const to=config.indexOf('// ==========================================\n// API DOCENTI',from);
assert.ok(from>=0&&to>from,'Blocco integrità aziende individuato');
const snippet=config.slice(from,to);
const normalize=(v)=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/^IT(?=[0-9]{11}$)/,'');

function setup(client){
  const sandbox={window:{},supabaseClient:client,console:{error(){},warn(){},log(){}},alert(){}};
  vm.runInNewContext(snippet,sandbox,{filename:'supabase_config.js:anagrafiche'});
  return sandbox.window;
}
function companyDB(records,fail=null){
  const calls=[];
  const client={
    from(table){
      calls.push({method:'from',table});
      return {
        select(){return this},
        order(){return this},
        range(a,b){
          calls.push({method:'range',table,a,b});
          return Promise.resolve({data:fail?null:records.slice(a,b+1),error:fail});
        },
        insert(){calls.push({method:'insert'});return {select:()=>Promise.resolve({data:[{}],error:null})}},
        update(){calls.push({method:'update'});return {eq:()=>({select:()=>Promise.resolve({data:[{}],error:null})})}}
      };
    }
  };
  return {client,calls};
}

test('normalizzazione fiscale coerente con trigger: IT + 11 cifre, spazi, segni',()=>{
  const {client}=companyDB([]);
  const w=setup(client);
  assert.equal(w.normalizzaIdentificativoAzienda(' IT 012-345-67890 '),'01234567890');
  assert.equal(w.normalizzaIdentificativoAzienda('01234567890'),'01234567890');
  assert.equal(w.normalizzaIdentificativoAzienda('ITRSSMRA00A00H501Z'),'ITRSSMRA00A00H501Z');
  assert.equal(w.normalizzaIdentificativoAzienda(''), '');
});

test('duplicato fiscale trovato senza toccare i dati e con esclusione ID in modifica',async()=>{
  const {client,calls}=companyDB([
    {id:'a',ragione_sociale:'Alfa',piva_cf:'IT 012 345 67890',ente_id:null},
    {id:'b',ragione_sociale:'Beta',piva_cf:'09321',ente_id:null}
  ]);
  const w=setup(client);
  const duplicate=await w.checkAziendaIdentificativoDuplicato('01234567890');
  assert.equal(duplicate.id,'a');
  assert.equal(await w.checkAziendaIdentificativoDuplicato('01234567890','a'),null);
  assert.equal(await w.checkAziendaIdentificativoDuplicato('IT01234567890','b'),duplicate);
  assert.equal(calls.filter(c=>c.method==='range').length,3);
});

test('errore di lettura non viene interpretato come assenza duplicati',async()=>{
  const {client}=companyDB([],{code:'42501',message:'Accesso negato'});
  const w=setup(client);
  await assert.rejects(w.checkAziendaIdentificativoDuplicato('01234567890'),err=>err?.code==='42501'&&err.message==='Accesso negato');
});

test('salvataggio impedito se PIVA/CF è già presente; mai doppia insert',async()=>{
  const {client,calls}=companyDB([{id:'a',ragione_sociale:'Alfa',piva_cf:'IT01234567890',ente_id:null}]);
  const w=setup(client);
  const result=await w.saveAzienda({ragione_sociale:'Nuova',piva_cf:'01234567890'});
  assert.equal(result,false);
  assert.match(w.getAziendaSaveErrorMessage(),/già associato/);
  assert.equal(calls.filter(c=>c.method==='insert').length,0);
});

function deletionDB(projectCount=0,readError=null){
  let deleted=0;
  const client={
    from(table){
      return {
        select(){
          return {eq(){
            return Promise.resolve({count:table==='progetti'?projectCount:0,error:readError});
          }};
        },
        delete(){
          return {eq(){deleted++;return Promise.resolve({error:null});}};
        }
      };
    }
  };
  return {client,getDeleted:()=>deleted};
}
test('nessuna eliminazione azienda se uno storico è collegato',async()=>{
  const {client,getDeleted}=deletionDB(2);
  const w=setup(client);
  assert.equal(await w.deleteAzienda('company-1'),false);
  assert.equal(getDeleted(),0);
  assert.match(w.lastAziendaDeleteError,/2 progetti/);
});
test('mancata verifica relazioni blocca eliminazione senza cancellazioni',async()=>{
  const {client,getDeleted}=deletionDB(0,{code:'42501',message:'Accesso negato'});
  const w=setup(client);
  assert.equal(await w.deleteAzienda('company-1'),false);
  assert.equal(getDeleted(),0);
  assert.match(w.lastAziendaDeleteError,/verificare/);
});
test('azienda senza riferimenti eliminabile dopo conferma esplicita UI',async()=>{
  const {client,getDeleted}=deletionDB(0);
  const w=setup(client);
  assert.equal(await w.deleteAzienda('company-1'),true);
  assert.equal(getDeleted(),1);
});

test('apertura corsista dal fascicolo azienda non dipende dalle prime 20 righe',()=>{
  const a=utils.indexOf('window.openCorsistaFromAziendaPopup = async function');
  const b=utils.indexOf('window.renderAziendaProjectCard = function',a);
  assert.ok(a>=0&&b>a);
  const func=utils.slice(a,b);
  assert.match(func,/\.eq\('id',corsistaId\)\.maybeSingle\(\)/);
  assert.match(func,/window\.loadModule\('corsisti'\)/);
  assert.match(func,/await window\.loadCorsistiTable\(\)/);
  assert.match(func,/window\.modificaCorsista\(corsistaId\)/);
});


test('inserimento rapido: preserva la paginazione solo in Anagrafica',()=>{
  const utils=fs.readFileSync(path.join(root,'js/utils.js'),'utf8');
  const role=fs.readFileSync(path.join(root,'js/modules/corsisti_ruolo_azienda.js'),'utf8');
  for(const source of [utils,role]){
    assert.match(source,/if\(document\.getElementById\('tabella-corsisti'\) && typeof window\.loadCorsistiTable==='function'\)/);
    assert.match(source,/await window\.loadCorsistiTable\(\)/);
    assert.match(source,/else window\.corsistiList = await window\.getCorsisti\(\)/);
  }
});
