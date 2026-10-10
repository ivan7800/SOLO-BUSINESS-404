import {normalizeDocument,demoDocumentTotal} from './document.js';
import {cleanEntry,jobTotals} from './work.js';
import {normalizeLines,quoteTotals,quoteLegacyLines} from './quote.js';
import {STORAGE_KEY,seedData} from './data.js';
import {round2,sum,uid,safeNum,today,needDate,needAmount} from './utils.js';
import {validSpanishTaxId} from './taxid.js';
const collections=['clients','quotes','jobs','invoices','expenses','tasks','activity'];
export function validateSnapshot(d){
 if(!d || typeof d!=='object'||!d.meta||d.meta.version!==1) throw Error('Versión de datos no compatible.');
 const str=(v,max=200)=>typeof v==='string'&&v.length<=max;
 const num=(v,max=100000000)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 const date=v=>str(v,10)&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(new Date(`${v}T12:00:00`).getTime())&&new Date(`${v}T12:00:00`).toISOString().slice(0,10)===v;
 const one=(v,allowed)=>allowed.includes(v);
 if(!str(d.meta.company,120)||!str(d.meta.owner,120)||!one(d.meta.theme,['light','dark'])||!one(d.meta.accent,['mint','blue','amber']))throw Error('Metadatos no compatibles.');
 for(const name of collections){
  if(!Array.isArray(d[name])||d[name].length>5000)throw Error(`Colección incorrecta: ${name}`);
  const unique=new Set();
  for(const item of d[name]){
   if(!item||typeof item!=='object'||!str(item.id,90)||!item.id||unique.has(item.id))throw Error(`Identificador inválido o duplicado en ${name}`);
   unique.add(item.id);
  }
 }
 const clientIds=new Set(d.clients.map(c=>c.id));
 for(const c of d.clients)if(!str(c.name,150)||!str(c.company,150)||!str(c.email,200)||!str(c.phone,60)||!str(c.nif,30)||!one(c.type,['Empresa','Particular'])||!date(c.since)||!['Activo','Archivado'].includes(c.status||'Activo')||!str(c.notes||'',2000)||!Array.isArray(c.tags||[])||(c.tags||[]).length>12||!(c.tags||[]).every(x=>str(x,32))||!Array.isArray(c.contacts||[])||(c.contacts||[]).length>20||!(c.contacts||[]).every(x=>str(x.name,120)&&str(x.email||'',200)&&str(x.phone||'',60))||!validSpanishTaxId(c.nif))throw Error('Cliente importado inválido.');
 for(const name of ['quotes','jobs','invoices'])for(const row of d[name])if(!clientIds.has(row.clientId))throw Error(`Referencia de cliente desconocida en ${name}`);
 for(const q of d.quotes){
  if(!str(q.title,200)||!num(q.subtotal)||!num(q.tax,100)||!one(q.status,['Borrador','Enviado','Aceptado','Rechazado'])||!date(q.date))throw Error('Presupuesto importado inválido.');
  if(q.lines!==undefined){const t=quoteTotals(q.lines);if(Math.abs(t.base-q.subtotal)>0.011)throw Error('Totales inconsistentes del presupuesto.');}
  if(q.notes!==undefined&&!str(q.notes,2000))throw Error('Notas del presupuesto inválidas.');
  if(q.validUntil!==undefined&&q.validUntil!==''&&!date(q.validUntil))throw Error('Fecha de validez inválida.');
  if(q.jobId!==undefined&&q.jobId!==''&&!str(q.jobId,90))throw Error('Trabajo vinculado inválido.');
 }
 for(const j of d.jobs)if(!str(j.title,200)||!num(j.hours)||!num(j.rate)||!num(j.progress,100)||!one(j.status,['Pendiente','En curso','Completado'])||!date(j.date))throw Error('Trabajo importado inválido.');
 for(const j of d.jobs){
  if(j.budget!==undefined&&!num(j.budget))throw Error('Presupuesto económico del trabajo inválido.');
  if(j.entries!==undefined){
   if(!Array.isArray(j.entries)||j.entries.length>500)throw Error('Partes de trabajo inválidos.');
   const ids=new Set();for(const entry of j.entries){const cleaned=cleanEntry(entry);if(!str(entry.id,90)||ids.has(entry.id)||entry.kind!==cleaned.kind)throw Error('Parte duplicado o inválido.');ids.add(entry.id);}
  }
  if(j.quoteId&&(!d.quotes.some(q=>q.id===j.quoteId&&q.clientId===j.clientId)))throw Error('Vínculo de presupuesto inválido.');
 }
 for(const i of d.invoices)if(!str(i.title,200)||!num(i.subtotal)||!num(i.tax,100)||!num(i.paid)||!one(i.status,['Borrador','Pendiente','Pagado'])||!date(i.date)||!date(i.due)||(i.lines&&(!Array.isArray(i.lines)||i.lines.length>40||Math.abs(demoDocumentTotal(i)-i.total)>0.02))||i.paid>invoiceTotal(i)+0.001)throw Error('Documento SIM importado inválido.');
 for(const e of d.expenses)if(!str(e.title,200)||!str(e.supplier,150)||!num(e.amount)||!str(e.category,60)||!date(e.date))throw Error('Gasto importado inválido.');
 for(const t of d.tasks)if(!str(t.title,200)||!date(t.date)||!one(t.priority,['Alta','Media','Baja'])||typeof t.done!=='boolean')throw Error('Tarea importada inválida.');
 for(const a of d.activity)if(!str(a.title,200)||!str(a.detail,200)||!str(a.kind,50)||!date(a.date))throw Error('Actividad importada inválida.');
 return d;
}
export function createStore(storage=globalThis.localStorage){
 let state;
 let startupProblem=null;
 let damagedOriginal=null;
 try{
  const raw=storage?.getItem(STORAGE_KEY);
  if(raw){
   try{state=validateSnapshot(JSON.parse(raw));}
   catch(err){damagedOriginal=raw;startupProblem=`Datos almacenados no compatibles: ${err?.message||'error de lectura'}. Se ha bloqueado el guardado local para proteger la copia original.`;state=seedData();}
  }else state=seedData();
 }catch(err){startupProblem=`No se pudo leer el almacenamiento: ${err?.message||'error de acceso'}. Se ha bloqueado el guardado local.`;state=seedData();}
 const listeners=new Set();
 let localPersistence=true;
 let persistenceError=startupProblem;
 const notify=()=>{
  if(localPersistence && !startupProblem){
   try{
    if(!storage || typeof storage.setItem!=='function')throw Error('Almacenamiento del navegador no disponible.');
    storage.setItem(STORAGE_KEY,JSON.stringify(state));
    persistenceError=null;
   }catch(err){persistenceError=err?.message||'Error de almacenamiento';}
  }
  listeners.forEach(fn=>fn(state));
 };
 return {
  get:()=>state,
  setLocalPersistence(enabled){localPersistence=Boolean(enabled);},
  isLocalPersistenceEnabled:()=>localPersistence,
  getPersistenceError:()=>persistenceError,
  getDamagedOriginal:()=>damagedOriginal,
  isRecoveryRequired:()=>Boolean(startupProblem),
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  reset(){state=seedData();startupProblem=null;damagedOriginal=null;persistenceError=null;notify();},
  restore(data){const validated=validateSnapshot(data);state=JSON.parse(JSON.stringify(validated));startupProblem=null;damagedOriginal=null;persistenceError=null;notify();},
  updateMeta(patch){const next={...state.meta,...patch};validateSnapshot({...state,meta:next});state={...state,meta:next};notify();},
  addClient(data){
   const fields=normalizeClient(data);
   const client={id:uid('CL'),...fields,status:'Activo',since:today()};
   state={...state,clients:[client,...state.clients]};activity('Cliente añadido',client.name,'client');notify();return client;
  },
  updateClient(id,data){
   const current=state.clients.find(c=>c.id===id);if(!current)throw Error('Cliente no encontrado.');
   const fields=normalizeClient(data,id);
   state={...state,clients:state.clients.map(c=>c.id===id?{...c,...fields}:c)};
   activity('Cliente editado',fields.name,'client');notify();
  },
  setClientStatus(id,status){
   if(!['Activo','Archivado'].includes(status))throw Error('Estado incorrecto.');
   const client=state.clients.find(c=>c.id===id);if(!client)throw Error('Cliente no encontrado.');
   state={...state,clients:state.clients.map(c=>c.id===id?{...c,status}:c)};
   activity(status==='Archivado'?'Cliente archivado':'Cliente reactivado',client.name,'client');notify();
  },
  deleteClient(id){
   const client=state.clients.find(c=>c.id===id);if(!client)throw Error('Cliente no encontrado.');
   const linked=['quotes','jobs','invoices'].some(key=>state[key].some(x=>x.clientId===id));
   if(linked)throw Error('Este cliente tiene registros relacionados. Archívalo para conservar la trazabilidad.');
   state={...state,clients:state.clients.filter(c=>c.id!==id)};
   activity('Cliente eliminado',client.name,'client');notify();
  },
  addQuote(data){
   const client=getClient(data.clientId),title=needTitle(data.title);
   const lines=normalizeLines(data.lines||[{description:title,quantity:1,price:Number(data.subtotal),discount:0,tax:Number(data.tax)}]);
   const totals=quoteTotals(lines);needAmount(totals.base);
   const q={id:uid('PRE'),clientId:client.id,title,subtotal:totals.base,tax:lines[0].tax,lines,status:'Borrador',date:today(),validUntil:data.validUntil?needDate(String(data.validUntil)):'',notes:String(data.notes||'').trim().slice(0,2000),jobId:''};
   state={...state,quotes:[q,...state.quotes]};activity('Presupuesto creado',q.title,'quote');notify();return q;
  },
  updateQuote(id,data){
   const old=state.quotes.find(q=>q.id===id);
   if(!old)throw Error('Presupuesto no encontrado.');
   if(old.status!=='Borrador')throw Error('Solo puedes editar presupuestos en borrador.');
   const client=getClient(data.clientId),lines=normalizeLines(data.lines),total=quoteTotals(lines);
   const patch={clientId:client.id,title:needTitle(data.title),lines,subtotal:total.base,tax:lines[0].tax,notes:String(data.notes||'').trim().slice(0,2000),validUntil:data.validUntil?needDate(String(data.validUntil)):''};
   state={...state,quotes:state.quotes.map(q=>q.id===id?{...q,...patch}:q)};
   activity('Presupuesto editado',old.id,'quote');notify();
  },
  setQuoteStatus(id,status){
   const q=state.quotes.find(x=>x.id===id);if(!q)throw Error('Presupuesto no encontrado.');
   const transitions={Borrador:['Enviado'],Enviado:['Aceptado','Rechazado'],Aceptado:[],Rechazado:[]};
   if(!transitions[q.status].includes(status))throw Error('Estado no permitido: transición inválida.');
   state={...state,quotes:state.quotes.map(x=>x.id===id?{...x,status}:x)};
   activity('Presupuesto actualizado',`${q.id}: ${status}`,'quote');notify();
  },
  createJobFromQuote(id){
   const q=state.quotes.find(x=>x.id===id);
   if(!q||q.status!=='Aceptado')throw Error('El presupuesto debe estar aceptado.');
   if(q.jobId||state.jobs.some(j=>j.quoteId===id))throw Error('Ya existe un trabajo de este presupuesto.');
   const total=quoteTotals(quoteLegacyLines(q));
   const j={id:uid('TR'),quoteId:id,clientId:q.clientId,title:q.title,hours:1,rate:total.base,budget:total.base,entries:[],status:'Pendiente',progress:0,date:today()};
   state={...state,jobs:[j,...state.jobs],quotes:state.quotes.map(x=>x.id===id?{...x,jobId:j.id}:x)};
   activity('Trabajo creado desde presupuesto',q.id,'job');notify();return j;
  },
  addJob(data){const client=getClient(data.clientId);const j={id:uid('TR'),clientId:client.id,title:needTitle(data.title),hours:needAmount(data.hours),rate:needAmount(data.rate),budget:needAmount(round2(needAmount(data.hours)*needAmount(data.rate))),entries:[],status:'Pendiente',progress:0,date:today()};state={...state,jobs:[j,...state.jobs]};activity('Trabajo creado',j.title,'job');notify();return j;},
  setJobStatus(id,status){if(!['Pendiente','En curso','Completado'].includes(status))throw Error('Estado no permitido.');if(!state.jobs.some(j=>j.id===id))throw Error('Trabajo no encontrado.');state={...state,jobs:state.jobs.map(j=>j.id===id?{...j,status,progress:status==='Completado'?100:status==='En curso'?50:0}:j)};notify();},
  updateJob(id,data){
   const j=state.jobs.find(x=>x.id===id);if(!j)throw Error('Trabajo no encontrado.');
   if(j.status==='Completado')throw Error('Reabre el trabajo antes de editarlo.');
   const title=needTitle(data.title),budget=Number(data.budget),hours=Number(data.hours),rate=Number(data.rate);
   if([budget,hours,rate].some(x=>!Number.isFinite(x)||x<0||x>100000000))throw Error('Valores económicos inválidos.');
   state={...state,jobs:state.jobs.map(x=>x.id===id?{...x,title,budget:round2(budget),hours,rate}:x)};
   activity('Trabajo actualizado',j.id,'job');notify();
  },
  addWorkEntry(id,data){
   const j=state.jobs.find(x=>x.id===id);if(!j)throw Error('Trabajo no encontrado.');
   if(j.status==='Completado')throw Error('Reabre el trabajo para registrar costes.');
   if((j.entries||[]).length>=500)throw Error('Máximo 500 registros por trabajo.');
   const entry={id:uid('PAR'),...cleanEntry(data)};
   state={...state,jobs:state.jobs.map(x=>x.id===id?{...x,entries:[...(x.entries||[]),entry]}:x)};
   activity('Parte registrado',j.title,'job');notify();return entry;
  },
  removeWorkEntry(id,entryId){
   const j=state.jobs.find(x=>x.id===id);if(!j)throw Error('Trabajo no encontrado.');
   if(j.status==='Completado')throw Error('Reabre el trabajo antes de modificar partes.');
   if(!(j.entries||[]).some(e=>e.id===entryId))throw Error('Parte no encontrado.');
   state={...state,jobs:state.jobs.map(x=>x.id===id?{...x,entries:x.entries.filter(e=>e.id!==entryId)}:x)};
   activity('Parte eliminado',j.id,'job');notify();
  },
  setJobProgress(id,progress){
   const j=state.jobs.find(x=>x.id===id);if(!j)throw Error('Trabajo no encontrado.');
   const p=Number(progress);if(!Number.isInteger(p)||p<0||p>100)throw Error('Avance incorrecto.');
   if(j.status==='Completado'&&p!==100)throw Error('Reabre el trabajo para cambiar el avance.');
   const status=p===100?'Completado':p===0?'Pendiente':'En curso';
   state={...state,jobs:state.jobs.map(x=>x.id===id?{...x,progress:p,status}:x)};activity('Avance de trabajo',j.id+' · '+p+'%','job');notify();
  },
  addInvoiceDraft(data){const client=getClient(data.clientId);const doc=data.lines?normalizeDocument(data):{title:needTitle(data.title),subtotal:round2(needAmount(data.subtotal)),tax:needAmount(data.tax,100),due:needDate(String(data.due||today()))};const i={id:uid('SIM'),clientId:client.id,...doc,status:'Borrador',date:today(),paid:0};state={...state,invoices:[i,...state.invoices]};activity('Borrador de simulación creado',i.title,'invoice');notify();return i;},
  updateInvoiceDraft(id,data){const old=state.invoices.find(i=>i.id===id);if(!old||old.status!=='Borrador')throw Error('Solo se editan borradores SIM.');const client=getClient(data.clientId);const doc=normalizeDocument(data);state={...state,invoices:state.invoices.map(i=>i.id===id?{...i,...doc,clientId:client.id}:i)};activity('Borrador SIM editado',id,'invoice');notify();},
  addExpense(data){const e={id:uid('G'),title:needTitle(data.title),supplier:String(data.supplier||'').trim().slice(0,150),amount:round2(needAmount(data.amount)),category:String(data.category||'Otros').slice(0,60),date:needDate(String(data.date||today()))};state={...state,expenses:[e,...state.expenses]};activity('Gasto registrado',e.title,'expense');notify();return e;},
  addTask(data){const t={id:uid('TA'),title:needTitle(data.title),date:needDate(String(data.date||today())),priority:['Alta','Media','Baja'].includes(data.priority)?data.priority:'Media',done:false};state={...state,tasks:[t,...state.tasks]};notify();return t;},
  toggleTask(id){state={...state,tasks:state.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)};notify();},
  recordDemoPayment(id,amount){
   const inv=state.invoices.find(i=>i.id===id);if(!inv||inv.status==='Borrador')throw Error('Solo se pueden simular cobros de documentos pendientes.');
   const total=demoDocumentTotal(inv);const remaining=round2(total-inv.paid);
   if(!Number.isFinite(Number(amount))||Number(amount)<=0||Number(amount)>remaining+0.001)throw Error('El importe debe ser positivo y no superar el pendiente.');
   const paid=round2(inv.paid+Number(amount));state={...state,invoices:state.invoices.map(i=>i.id===id?{...i,paid,status:paid>=total?'Pagado':'Pendiente'}:i)};
   activity('Cobro simulado',`${inv.id}: ${round2(amount)} €`,'payment');notify();
  }
 };
 function getClient(id){const c=state.clients.find(c=>c.id===id&&c.status!=='Archivado');if(!c)throw Error('Selecciona un cliente activo válido.');return c;}
 function needTitle(v){const title=String(v||'').trim();if(!title||title.length>200)throw Error('Introduce un concepto de hasta 200 caracteres.');return title;}
 function activity(title,detail,kind){state.activity=[{id:uid('A'),title,detail,date:today(),kind},...state.activity].slice(0,35);}
}
export const invoiceTotal=invoice=>demoDocumentTotal(invoice);
export const kpis=state=>{
 const billed=sum(state.invoices.filter(i=>i.status!=='Borrador'),invoiceTotal);
 const collected=sum(state.invoices,i=>i.paid);
 const pending=round2(billed-collected);
 const expense=sum(state.expenses,e=>e.amount);
 const quotes=sum(state.quotes,q=>q.subtotal);
 return {billed:round2(billed),collected:round2(collected),pending,expense:round2(expense),quotes:round2(quotes),active:state.jobs.filter(j=>j.status!=='Completado').length,clients:state.clients.length};
};

function normalizeClient(data,editingId=''){
 const v=(name,max)=>String(data[name]??'').trim().slice(0,max);
 const name=v('name',150),company=v('company',150),email=v('email',200),phone=v('phone',60),nif=v('nif',30).replace(/[\s-]/g,'').toUpperCase();
 if(!name)throw Error('Introduce el nombre del cliente.');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Correo electrónico no válido.');
 if(nif&&!validSpanishTaxId(nif))throw Error('NIF, NIE o CIF no válido. Comprueba el dígito de control.');
 const tags=v('tags',500).split(',').map(x=>x.trim()).filter(Boolean);
 if(tags.length>12||tags.some(x=>x.length>32))throw Error('Máximo 12 etiquetas de 32 caracteres.');
 const notes=v('notes',2000);
 let contacts=[];
 try{contacts=JSON.parse(String(data.contacts||'[]'));}catch{throw Error('Formato de contactos inválido.');}
 if(!Array.isArray(contacts)||contacts.length>20||contacts.some(c=>!c||!String(c.name||'').trim()||String(c.name).length>120||String(c.email||'').length>200||String(c.phone||'').length>60))throw Error('Contactos secundarios inválidos (máximo 20).');
 contacts=contacts.map(c=>({name:String(c.name).trim(),email:String(c.email||'').trim(),phone:String(c.phone||'').trim()}));
 return {name,company,email,phone,nif,type:data.type==='Particular'?'Particular':'Empresa',tags,notes,contacts};
}
