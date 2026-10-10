import {computeEntityPlan,computeConfirmedDeletionPlan,mergeRemoteRecords,assertRemoteUnchanged} from './entity-sync.js';
import {validateSnapshot} from './store.js';
const API='http://127.0.0.1:4174';
let token=null,revision=0;
let syncEnabled=false, pending=false, inflight=false, blocked=false, changeTimer=null;
let remoteRecords=null;
let liveMode=false, liveBusy=false, liveDirty=false, liveMute=false, liveTimer=null;
let authoritative=false, authoritativeBusy=false, authoritativeBaseline=null, authoritativeRows=null, authoritativeLocked=false;
let localBeforeRemote=null;
const SYNC_DELAY=1500;

async function request(path,method='GET',payload){
 const res=await fetch(API+path,{method,headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
 const data=await res.json();if(!res.ok){const err=Error(data.error||`HTTP ${res.status}`);err.status=res.status;throw err;}return data;
}
export function initCloud(store){
 const app=document.getElementById('app');
 function lockUI(locked){if(app)app.inert=locked;authoritativeLocked=locked;}
 function stopAuthoritative(reason){
  authoritative=false;authoritativeBusy=false;
  if(localBeforeRemote){
   try{store.restore(localBeforeRemote)}catch{}
   localBeforeRemote=null;
  }
  store.setLocalPersistence(true);
  lockUI(false);
  if(reason)notice('Modo remoto detenido: '+reason+' Exporta una copia antes de reintentar.');
 }
 async function startAuthoritative(){
  if(!token)throw Error('Inicia sesión primero.');
  if(authoritativeBusy)throw Error('Existe un guardado en curso.');
  if(liveMode||syncEnabled)throw Error('Desactiva antes los otros modos de sincronización.');
  const remote=await request('/api/records-all');
  const base=validateSnapshot(store.get());
  const next=mergeRemoteRecords(base,remote.items.filter(x=>!x.deleted_at));
  if(!confirm('Se cargarán los registros del servidor y reemplazarán los del navegador. Exporta primero tus datos. ¿Activar modo remoto controlado?'))return;
  authoritativeBusy=true;lockUI(true);
  localBeforeRemote=structuredClone(base);
  store.setLocalPersistence(false);
  try{store.restore(next);authoritativeRows=remote;authoritativeBaseline=structuredClone(next);authoritative=true;}
  catch(err){
   store.setLocalPersistence(true);
   localBeforeRemote=null;
   throw err;
  }finally{authoritativeBusy=false;lockUI(false)}
  render();notice('Datos cargados desde PostgreSQL. Modo remoto controlado activo. Cada cambio se confirmará en la API.');
 }
 async function commitAuthoritative(){
  if(!authoritative||authoritativeBusy)return;
  authoritativeBusy=true;lockUI(true);
  const proposed=structuredClone(store.get());
  try{
   const current=await request('/api/records-all');
   assertRemoteUnchanged(authoritativeRows,current);
   const plan=computeEntityPlan(proposed,current.items);
   // Deletes are explicit, revision-checked, and based solely on acknowledged rows.
   plan.push(...computeConfirmedDeletionPlan(proposed,current.items,authoritativeRows));
   if(plan.length>100)throw Error('El lote supera 100 operaciones.');
   if(plan.length)await request('/api/records-batch','POST',{operations:plan});
   const confirmed=await request('/api/records-all');
   // Confirm the server outcome before accepting the new baseline.
   const committed=mergeRemoteRecords(proposed,confirmed.items.filter(x=>!x.deleted_at));
   if(computeEntityPlan(proposed,confirmed.items).length || computeConfirmedDeletionPlan(proposed,confirmed.items,confirmed).length)throw Error('Los datos confirmados no coinciden con los cambios enviados.');
   authoritativeRows=confirmed;authoritativeBaseline=structuredClone(committed);
   notice('Cambio confirmado en PostgreSQL ('+plan.length+' operaciones).');
  }catch(err){
   // Roll back the UI to the last server-acknowledged data. No silent retry.
   authoritative=false;
   try{store.restore(authoritativeBaseline)}catch{}
   // Keep the last confirmed remote state visible until the operator exits.
   // Local disk state remains untouched while the remote session is active.
   notice('Guardado NO confirmado: '+err.message+'. Se ha restaurado la última copia confirmada y detenido el modo remoto.');
   render();
  }finally{authoritativeBusy=false;lockUI(false)}
 }
 store.subscribe(()=>{if(authoritative&&!authoritativeBusy){void commitAuthoritative()}});

 const button=document.createElement('button');button.type='button';button.textContent='☁ Conexión segura (beta)';button.style.cssText='position:fixed;right:16px;bottom:16px;z-index:50;padding:12px 18px;border-radius:12px;background:#193a34;color:white;border:1px solid #74baae;cursor:pointer;box-shadow:0 8px 24px #0004';document.body.append(button);
 const shell=document.createElement('dialog');shell.style.cssText='border:1px solid #8aada5;border-radius:16px;padding:24px;color:#152923;background:#f6faf9;max-width:min(440px,95vw);width:100%;box-shadow:0 30px 90px #0005';document.body.append(shell);
 const notice=(msg)=>{const n=shell.querySelector('#cloud-notice');if(n)n.textContent=msg};
 async function push(){
  if(!token||!syncEnabled||blocked||inflight||!pending)return;
  inflight=true;pending=false;
  try{const result=await request('/api/snapshot','PUT',{expectedRevision:revision,payload:validateSnapshot(store.get())});revision=result.revision;notice('Sincronizado. Revisión '+revision)}
  catch(err){pending=true;syncEnabled=false;blocked=true;render();notice(err.status===409?'Conflicto remoto: sincronización detenida. Exporta y compara las copias antes de continuar.':'Sincronización detenida: '+err.message)}
  finally{inflight=false;if(syncEnabled&&pending)setTimeout(push,SYNC_DELAY)}
 }
 // Experimental write-through: every local edit is compared against an acknowledged
 // remote baseline before the transactional batch is submitted. Fail closed.
 async function flushLive(){
  if(!liveMode||liveBusy||!liveDirty||!token)return;
  liveBusy=true;liveDirty=false;
  try{
   const now=await request('/api/records-all');
   assertRemoteUnchanged(remoteRecords,now);
   const local=validateSnapshot(store.get());
   // Never infer deletion from a missing local item. Disallow it in live mode.
   for(const row of now.items){
    if(!row.deleted_at&&!local[row.kind].some(item=>item.id===row.source_id))throw Error('Eliminación local no sincronizable en modo servidor: '+row.kind+'/'+row.source_id);
   }
   const plan=computeEntityPlan(local,now.items);
   if(plan.length>100)throw Error('Lote demasiado grande (>100).');
   if(plan.length)await request('/api/records-batch','POST',{operations:plan});
   remoteRecords=await request('/api/records-all');
   notice('Modo servidor: '+plan.length+' cambios confirmados.');
  }catch(err){liveMode=false;liveDirty=false;render();notice('Modo servidor DETENIDO: '+err.message+'. Los cambios locales sin confirmar NO se han descartado; exporta una copia y revisa conflictos.');}
  finally{liveBusy=false;if(liveMode&&liveDirty)liveTimer=setTimeout(flushLive,350)}
 }
 store.subscribe(()=>{if(!liveMode||liveMute)return;liveDirty=true;clearTimeout(liveTimer);liveTimer=setTimeout(flushLive,350)});
 async function enableLive(){
  if(!token)throw Error('Inicia sesión primero.');
  const r=await request('/api/records-all');
  if(!r.items.length)throw Error('El servidor está vacío. Migra primero los registros desde una copia segura.');
  const local=validateSnapshot(store.get());
  const next=mergeRemoteRecords(local,r.items.filter(x=>!x.deleted_at));
  // Only enable on an identical data set. No implicit overwrite or merge.
  const kinds=['clients','quotes','jobs','invoices','expenses','tasks','activity'];
  const equivalent=kinds.every(k=>JSON.stringify([...local[k]].sort((a,b)=>a.id.localeCompare(b.id)))===JSON.stringify([...next[k]].sort((a,b)=>a.id.localeCompare(b.id))));
  if(!equivalent)throw Error('Los datos locales y remotos son diferentes. Exporta, revisa y recupera antes de activar.');
  remoteRecords=r;liveMode=true;liveDirty=false;render();notice('Modo servidor activado. Las modificaciones se envían tras cada operación; al fallar queda detenido.');
 }
 // Entity synchronization is manual in this beta; no automatic snapshot writes.
 function render(){shell.innerHTML=`<form method="dialog" style="text-align:right"><button aria-label="Cerrar">✕</button></form><h2>SOLO BUSINESS · Datos remotos (beta)</h2><p>Transferencia manual y sincronización opcional beta. No emite facturas legales.</p><p id="cloud-notice" role="status"></p>${token?`<p>Conectado · Revisión ${revision}</p><button id="cloud-upload">Subir copia local</button> <button id="cloud-download">Recuperar copia</button> <button id="cloud-migrate">Migrar entidades (beta)</button> <button id="cloud-status">Verificar entidades</button> <button id="cloud-compare">Comparar registros</button> <button id="cloud-push-records">Enviar cambios por entidad</button> <button id="cloud-pull-records">Recuperar entidades</button> <button id="cloud-authoritative">${authoritative?'Salir del modo remoto':'Cargar servidor y usar modo remoto (beta)'}</button> <button id="cloud-live">${liveMode?"Desactivar modo servidor":"Activar modo servidor (experimental)"}</button> <button id="cloud-logout">Salir</button><hr><p style="font-size:12px">Sincronización manual por entidad. Las copias completas anteriores están disponibles solo como operación explícita. Guarda un JSON antes de cambiar datos.</p>`:`<form id="cloud-auth"><label>Email <input name="email" type="email" autocomplete="username" required></label><br><label>Contraseña <input name="password" type="password" autocomplete="current-password" minlength="12" required></label><br><label>Nombre negocio (solo registro) <input name="business" maxlength="120"></label><br><button type="submit" name="mode" value="login">Entrar</button> <button type="submit" name="mode" value="register">Registrarse</button></form>`}<p style="font-size:12px">Solo para desarrollo local. No introducir datos de clientes reales.</p>`;
 shell.querySelector('#cloud-auth')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,mode=e.submitter?.value||'login',data=Object.fromEntries(new FormData(f));try{if(mode==='register')await request('/api/register','POST',data);const a=await request('/api/login','POST',data);token=a.token;const r=await request('/api/snapshot');revision=r.revision;blocked=false;syncEnabled=false;render();notice('Sesión iniciada. Decide cuándo transferir datos.')}catch(err){notice(err.message)}});
 shell.querySelector('#cloud-upload')?.addEventListener('click',async()=>{if(liveMode||authoritative){notice('Desactiva los modos remotos antes de esta operación.');return;}if(!confirm('¿Subir los datos locales y reemplazar la copia remota? Esta acción no se puede deshacer sin otra copia.'))return;try{const data=validateSnapshot(store.get());const result=await request('/api/snapshot','PUT',{expectedRevision:revision,payload:data});revision=result.revision;pending=false;blocked=false;render();notice('Copia guardada correctamente. Revisión '+revision)}catch(err){notice(err.message+'; recupera el estado remoto antes de reintentar.')}});
 shell.querySelector('#cloud-download')?.addEventListener('click',async()=>{if(liveMode||authoritative){notice('Desactiva los modos remotos antes de esta operación.');return;}try{const r=await request('/api/snapshot');if(!r.payload)throw Error('No hay copia remota');const data=validateSnapshot(r.payload);if(!confirm('Se sustituirán todos los datos del navegador. Exporta primero una copia JSON desde Ajustes. ¿Continuar?'))return;syncEnabled=false;pending=false;blocked=false;store.restore(data);revision=r.revision;render();notice('Datos restaurados, revisión '+revision)}catch(err){notice(err.message)}});
 shell.querySelector('#cloud-migrate')?.addEventListener('click',async()=>{if(liveMode||authoritative){notice('Desactiva los modos remotos antes de esta operación.');return;}
  if(syncEnabled){notice('Desactiva la sincronización antes de migrar.');return}
  if(!confirm('Migración beta de una sola dirección: crea entidades en el servidor VACÍO. No modifica datos locales. Exporta antes un JSON. ¿Continuar?'))return;
  try{const result=await request('/api/migrate-records','POST',{expectedRevision:revision,payload:validateSnapshot(store.get())});notice('Migrados '+result.migrated+' registros. Usa Verificar entidades para comprobar. No se ha activado sincronización.')}
  catch(err){notice('Migración cancelada: '+err.message)}
 });
 shell.querySelector('#cloud-status')?.addEventListener('click',async()=>{try{const result=await request('/api/migration-status');notice('Servidor: '+result.total+' registros ('+JSON.stringify(result.counts)+')')}catch(err){notice(err.message)}});

 shell.querySelector('#cloud-compare')?.addEventListener('click',async()=>{
  try{remoteRecords=await request('/api/records-all');const plan=computeEntityPlan(store.get(),remoteRecords.items);notice(`Comparación: ${plan.length} cambios locales. Debes confirmar antes del envío.`)}catch(err){notice(err.message)}
 });
 shell.querySelector('#cloud-push-records')?.addEventListener('click',async()=>{if(liveMode||authoritative){notice('Desactiva los modos remotos antes de esta operación.');return;}
  try{
   // Changes are only allowed against a previously reviewed server baseline.
   const r=await request('/api/records-all');assertRemoteUnchanged(remoteRecords,r);const plan=computeEntityPlan(store.get(),r.items);
   if(plan.length>100)throw Error('Más de 100 cambios: envío bloqueado para evitar operaciones parciales. Reduce el lote.');
   if(!plan.length){notice('Sin cambios por enviar.');return}
   if(!confirm(`Se enviarán ${plan.length} cambios al servidor. Los cambios remotos de otros usuarios pueden quedar en conflicto. ¿Continuar?`))return;
   await request('/api/records-batch','POST',{operations:plan});
   remoteRecords=await request('/api/records-all');notice(`${plan.length} operaciones confirmadas en una transacción.`);
  }catch(err){notice('No se ha completado el envío: '+err.message+'; vuelve a comparar antes de reintentar.')}
 });
 shell.querySelector('#cloud-pull-records')?.addEventListener('click',async()=>{if(liveMode||authoritative){notice('Desactiva los modos remotos antes de esta operación.');return;}
  try{const r=await request('/api/records-all');const next=mergeRemoteRecords(store.get(),r.items);
   if(!confirm('Se reemplazarán las entidades locales por las del servidor. Exporta antes un JSON. ¿Continuar?'))return;
   store.restore(next);remoteRecords=r;notice('Entidades recuperadas desde PostgreSQL. Metadatos de apariencia conservados localmente.');
  }catch(err){notice('No se pudo recuperar: '+err.message)}
 });
 shell.querySelector('#cloud-authoritative')?.addEventListener('click',async()=>{if(authoritative){stopAuthoritative();render();notice('Modo remoto desactivado.')}else{try{await startAuthoritative()}catch(err){notice(err.message)}}});
 shell.querySelector('#cloud-live')?.addEventListener('click',async()=>{if(liveMode){liveMode=false;clearTimeout(liveTimer);render();notice('Modo servidor desactivado.')}else{try{if(authoritative)throw Error('Desactiva antes el modo remoto.');await enableLive()}catch(e){notice(e.message)}}});
 shell.querySelector('#cloud-logout')?.addEventListener('click',async()=>{stopAuthoritative();try{await request('/api/logout','POST')}catch{}liveMode=false;clearTimeout(liveTimer);token=null;revision=0;remoteRecords=null;syncEnabled=false;blocked=false;pending=false;clearTimeout(changeTimer);render();notice('Sesión cerrada')});
 }
 button.addEventListener('click',()=>{render();shell.showModal()});
}
