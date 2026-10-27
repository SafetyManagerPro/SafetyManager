'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../js/modules/corsisti_fascicolo_archivio.js'),'utf8');

function part(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,'Funzione fascicolo individuata: '+start);
  return source.slice(a,b);
}
const newVersionSource=part('function newVersion(item){','function render(){');
const uploadSource=part('async function upload(){','// Interfaccia unica anche per documenti generati');
const openSource=part('async function open(doc){','async function updateStatus(doc){');
const elements=()=>({
  'cfasc-form-title':{textContent:''},
  'cfasc-version-info':{textContent:''},
  'cfasc-type':{value:''},
  'cfasc-title':{value:'Documento verifica'},
  'cfasc-enrollment':{value:''},
  'cfasc-doc-date':{value:''},
  'cfasc-status':{value:'bozza'},
  'cfasc-notes':{value:''},
  'cfasc-file':{value:'',files:[{size:32,name:'documento.pdf',type:'application/pdf',slice(){return {arrayBuffer:async()=>Buffer.from('%PDF-1.7')}}}]},
  'cfasc-cancel-version':{classList:{remove(){}}},
  'cfasc-form':{scrollIntoView(){}},
  'cfasc-upload':{disabled:false}
});

test('Nuova versione di documento definitivo parte sempre come bozza',()=>{
  const els=elements();
  const old={id:'old',gruppo_versioni:'family',versione:1,stato:'definitivo',tipo_documento:'attestato',titolo:'Attestato',iscrizione_id:null,note:'',data_documento:null};
  const newest={...old,id:'newest',versione:2};
  const state={docs:[old,newest],previous:null};
  vm.runInNewContext(newVersionSource,{state,el:id=>els[id],msg(){}});
  newVersionSource && assert.ok(true);
  const fn=vm.runInNewContext(newVersionSource+'\nnewVersion',{state,el:id=>els[id],msg(){}});
  fn(old);
  assert.equal(state.previous.id,'newest');
  assert.equal(els['cfasc-status'].value,'bozza');
  assert.match(els['cfasc-version-info'].textContent,/Versione 3/);
});

async function manualUpload(stato='bozza',confirmed=true){
  const els=elements();
  els['cfasc-status'].value=stato;
  const old={id:'old',corsista_id:'person',gruppo_versioni:'family',versione:1,stato:'definitivo'};
  const state={id:'person',person:{nome_cognome:'Esempio',cf:'TEST',azienda_id:null},docs:[old],enrollments:[],previous:old,busy:false};
  const calls={insert:[],updates:0,uploads:0,cleanup:0,confirms:0,messages:[]};
  const db=()=>({
    storage:{from(bucket){assert.equal(bucket,'corsisti-fascicolo-privato');return {
      upload:async()=>{calls.uploads++;return {error:null}},
      remove:async()=>{calls.cleanup++;return {error:null}}
    }}},
    from(table){
      assert.equal(table,'corsisti_documenti_archivio');
      return {
        insert:async p=>{calls.insert.push(p);return {error:null}},
        update(){calls.updates++;throw Error('Non modificare il documento storico durante il nuovo caricamento')}
      };
    }
  });
  const upload=vm.runInNewContext(uploadSource+'\nupload',{
    window:{aziendeList:[]},state,el:id=>els[id],db,TABLE:'corsisti_documenti_archivio',BUCKET:'corsisti-fascicolo-privato',
    MAX:15728640,TYPES:{attestato:'Attestato'},
    crypto:{randomUUID:()=>'generated-id'},TextDecoder,Buffer,
    confirm:()=>{calls.confirms++;return confirmed},
    msg:m=>calls.messages.push(String(m)),console:{error(){},warn(){}},
    refresh:async()=>{},resetVersion:()=>{}
  });
  els['cfasc-type'].value='attestato';
  await upload();
  return {calls,state};
}

test('Upload nuova bozza lascia il vecchio definitivo invariato',async()=>{
  const {calls,state}=await manualUpload();
  assert.equal(calls.insert.length,1);
  assert.equal(calls.insert[0].stato,'bozza');
  assert.equal(calls.insert[0].versione,2);
  assert.equal(calls.insert[0].precedente_id,'old');
  assert.equal(calls.updates,0);
  assert.equal(calls.uploads,1);
  assert.equal(calls.confirms,0);
  assert.equal(state.busy,false);
  assert.match(calls.messages.at(-1),/mantengono il loro stato/);
});

test('Anche nuovo definitivo esplicito non altera lo stato di documenti precedenti',async()=>{
  const {calls}=await manualUpload('definitivo',true);
  assert.equal(calls.confirms,1);
  assert.equal(calls.insert[0].stato,'definitivo');
  assert.equal(calls.updates,0);
});

test('Caricamento definitivo senza conferma non effettua scritture',async()=>{
  const {calls}=await manualUpload('definitivo',false);
  assert.equal(calls.confirms,1);
  assert.equal(calls.uploads,0);
  assert.equal(calls.insert.length,0);
  assert.equal(calls.updates,0);
});

test('Ristampa archivio usa solo percorso immutabile del PDF storico',async()=>{
  let requested=null,ttl=null,receivedUrl=null;
  const pop={opener:'old',document:{title:'',body:{textContent:''}},location:{replace(url){receivedUrl=url}},close(){throw Error('Non chiudere in successo')}};
  const target='person-id/documento-id/documento.pdf',url='https://storage.example.test/signed/specific-version';
  const db=()=>({storage:{from(bucket){assert.equal(bucket,'corsisti-fascicolo-privato');return {createSignedUrl:async(path,seconds)=>{
    requested=path;ttl=seconds;return {data:{signedUrl:url},error:null}
  }}}}});
  const open=vm.runInNewContext(openSource+'\nopen',{window:{open:()=>pop},db,BUCKET:'corsisti-fascicolo-privato',alert(){throw Error('No alert expected')}});
  await open({storage_path:target});
  assert.equal(requested,target);
  assert.equal(ttl,90);
  assert.equal(receivedUrl,url);
  assert.equal(pop.opener,null);
});

test('Errore apertura PDF storico chiude scheda temporanea senza alterare documento',async()=>{
  let closed=0,notice='';
  const popup={opener:null,document:{title:'',body:{textContent:''}},close(){closed++}};
  const db=()=>({storage:{from:()=>({createSignedUrl:async()=>({data:null,error:{message:'Non autorizzato'}})})}});
  const open=vm.runInNewContext(openSource+'\nopen',{window:{open:()=>popup},db,BUCKET:'corsisti-fascicolo-privato',alert:s=>notice=String(s)});
  await open({storage_path:'person/old-version/documento.pdf'});
  assert.equal(closed,1);
  assert.match(notice,/Non autorizzato/);
});
