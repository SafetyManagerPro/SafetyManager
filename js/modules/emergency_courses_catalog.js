// SafetyManager PRO - Estensione catalogo Emergenze
// Completa Primo Soccorso, Antincendio e aggiunge un percorso aziendale interno
// per gestione emergenze/evacuazione. Non sovrascrive voci eventualmente definite in data.js.
(function(){
  'use strict';
  if(window.__emergencyCoursesCatalogLoaded) return;
  window.__emergencyCoursesCatalogLoaded=true;
  window.DB_CORSI=window.DB_CORSI||{};

  const ul=items=>`<ul class='syllabus-list list-outside list-disc ml-3 space-y-0.5 text-left'>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  const add=(id,data)=>{ if(!window.DB_CORSI[id]) window.DB_CORSI[id]=data; };

  add('primo_soccorso_a_16h',{
    t:'Addetto al Primo Soccorso (Gruppo A) - 16h',ore:16,scad:3,risk:'PS',code:'PS',
    norma:'D.Lgs. 81/08 art. 45, comma 2 e D.M. 388/2003',
    safety_family:'Emergenze',requires_presence:true,
    prog:[
      {ud:'UD1',ore:6,m:'Modulo A - Allertamento, riconoscimento e primo intervento',d:ul(['Allertare il sistema di soccorso e raccogliere le informazioni utili sull’infortunio.','Riconoscere l’emergenza sanitaria e valutare le condizioni dell’infortunato.','Conoscenze generali sui traumi e sulle patologie specifiche in ambiente di lavoro.'])},
      {ud:'UD2',ore:4,m:'Modulo B - Traumi e patologie specifiche',d:ul(['Approfondimenti sui traumi in ambiente di lavoro.','Approfondimenti sulle patologie specifiche e sulle principali emergenze sanitarie.','Principi di protezione dell’addetto e dell’infortunato in attesa dei soccorsi.'])},
      {ud:'UD3',ore:6,m:'Modulo C - Capacità di intervento pratico',d:ul(['Tecniche di comunicazione con il sistema di emergenza del SSN.','Tecniche di primo soccorso e rianimazione di base previste dal programma applicabile.','Esercitazioni pratiche su emorragie, traumi, mobilizzazione e scenari di intervento.'])}
    ]
  });

  add('agg_primo_soccorso_a_6h',{
    t:'Aggiornamento Primo Soccorso (Gruppo A) - 6h',ore:6,scad:3,risk:'AGG',code:'PS',
    norma:'D.Lgs. 81/08 art. 45, comma 2 e D.M. 388/2003',
    safety_family:'Emergenze',requires_presence:true,
    prog:[{ud:'UD1',ore:6,m:'Aggiornamento capacità di intervento pratico',d:ul(['Richiamo delle procedure di allertamento e autoprotezione.','Aggiornamento delle capacità di intervento pratico.','Esercitazioni su rianimazione di base, emorragie, traumi e scenari di primo soccorso.'])}]
  });

  add('antincendio_liv1',{
    t:'Addetto Antincendio - Livello 1 - 4h',ore:4,scad:5,risk:'AI',code:'AI',
    norma:'D.Lgs. 81/08 art. 46 e D.M. 2/9/2021, Allegato III',
    safety_family:'Emergenze',requires_presence:true,
    prog:[
      {ud:'UD1',ore:2,m:'Incendio, prevenzione e protezione',d:ul(['Principi della combustione e prodotti della combustione.','Sostanze estinguenti e misure di prevenzione.','Protezione antincendio e procedure da adottare in caso di incendio.'])},
      {ud:'UD2',ore:2,m:'Esercitazioni pratiche',d:ul(['Presa visione e chiarimenti sugli estintori portatili.','Esercitazioni sull’uso degli estintori portatili.','Sorveglianza di impianti, attrezzature e sistemi di sicurezza antincendio.'])}
    ]
  });

  add('agg_antincendio_liv1_2h',{
    t:'Aggiornamento Antincendio - Livello 1 - 2h',ore:2,scad:5,risk:'AGG',code:'AI',
    norma:'D.Lgs. 81/08 art. 46 e D.M. 2/9/2021, Allegato III',
    safety_family:'Emergenze',requires_presence:true,
    prog:[{ud:'UD1',ore:2,m:'Esercitazioni pratiche di aggiornamento',d:ul(['Sorveglianza delle misure di sicurezza antincendio.','Chiarimenti sugli estintori portatili.','Esercitazioni pratiche sull’uso degli estintori.'])}]
  });

  add('antincendio_liv3',{
    t:'Addetto Antincendio - Livello 3 - 16h',ore:16,scad:5,risk:'AI',code:'AI',
    norma:'D.Lgs. 81/08 art. 46 e D.M. 2/9/2021, Allegato III',
    safety_family:'Emergenze',requires_presence:true,
    prog:[
      {ud:'UD1',ore:4,m:'Incendio e prevenzione',d:ul(['Principi della combustione, sostanze estinguenti e principali cause di incendio.','Rischi alle persone e all’ambiente.','Misure di prevenzione e comportamento in esercizio.'])},
      {ud:'UD2',ore:4,m:'Protezione antincendio',d:ul(['Protezione passiva e attiva.','Vie di esodo, compartimentazione, rivelazione e allarme.','Impianti e attrezzature di controllo ed estinzione.'])},
      {ud:'UD3',ore:4,m:'Strategia e gestione dell’emergenza',d:ul(['Procedure da adottare in caso di incendio.','Piano di emergenza, evacuazione, chiamata dei soccorsi e assistenza alle persone.','Controlli, sorveglianza e organizzazione della gestione antincendio.'])},
      {ud:'UD4',ore:4,m:'Esercitazioni pratiche',d:ul(['Presa visione e sorveglianza di impianti, attrezzature e sistemi antincendio.','Uso degli estintori portatili.','Utilizzo di naspi e idranti e ulteriori esercitazioni previste dal programma applicabile.'])}
    ]
  });

  add('agg_antincendio_liv3_8h',{
    t:'Aggiornamento Antincendio - Livello 3 - 8h',ore:8,scad:5,risk:'AGG',code:'AI',
    norma:'D.Lgs. 81/08 art. 46 e D.M. 2/9/2021, Allegato III',
    safety_family:'Emergenze',requires_presence:true,
    prog:[
      {ud:'UD1',ore:5,m:'Aggiornamento teorico',d:ul(['Aggiornamento su incendio e prevenzione.','Protezione antincendio e procedure da adottare in emergenza.','Gestione della sicurezza antincendio e richiamo dei contenuti pertinenti del corso iniziale.'])},
      {ud:'UD2',ore:3,m:'Aggiornamento pratico',d:ul(['Sorveglianza di impianti e attrezzature.','Esercitazioni sull’uso degli estintori portatili.','Modalità di utilizzo di naspi e idranti.'])}
    ]
  });

  add('emergenze_evacuazione_2h',{
    t:'Gestione Emergenze ed Evacuazione - Percorso Aziendale Interno - 2h',ore:2,scad:99,risk:'EM',code:'EM',
    norma:'D.Lgs. 81/08 artt. 18, 43 e 44; piano di emergenza ove previsto. Percorso interno non sostitutivo della formazione obbligatoria degli addetti antincendio o primo soccorso.',
    safety_family:'Emergenze',internal_non_certifying:true,requires_presence:false,
    prog:[
      {ud:'UD1',ore:0.5,m:'Ruoli e organizzazione dell’emergenza',d:ul(['Ruoli aziendali e catena delle comunicazioni.','Rapporto con addetti antincendio, primo soccorso e responsabili della struttura.','Conoscenza del piano e delle procedure aziendali applicabili.'])},
      {ud:'UD2',ore:0.5,m:'Allarme e chiamata dei soccorsi',d:ul(['Modalità di segnalazione dell’emergenza.','Chiamata ai soccorsi e informazioni essenziali da comunicare.','Comportamenti da evitare e gestione delle comunicazioni interne.'])},
      {ud:'UD3',ore:0.5,m:'Evacuazione e assistenza alle persone',d:ul(['Vie di esodo, punti di raccolta e controllo delle presenze.','Assistenza a pubblico, visitatori e persone con esigenze specifiche.','Divieti, priorità e comportamento durante l’evacuazione.'])},
      {ud:'UD4',ore:0.5,m:'Applicazione al piano aziendale',d:ul(['Lettura guidata delle procedure dell’azienda.','Scenari e casi pratici organizzativi.','Il corso non sostituisce prove di evacuazione, esercitazioni antincendio o addestramenti richiesti separatamente.'])}
    ]
  });

  const mandatory=new Set(window.CORSI_PRESENZA_OBBLIGATORIA||[]);
  [
    'primo_soccorso_a_16h','agg_primo_soccorso_a_6h',
    'antincendio_liv1','agg_antincendio_liv1_2h',
    'antincendio_liv3','agg_antincendio_liv3_8h'
  ].forEach(id=>mandatory.add(id));
  window.CORSI_PRESENZA_OBBLIGATORIA=[...mandatory];
})();
