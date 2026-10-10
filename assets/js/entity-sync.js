import {validateSnapshot} from './store.js';
export const ENTITY_KINDS=['clients','quotes','jobs','invoices','expenses','tasks','activity'];
export function mergeRemoteRecords(local,rows){
 const next=structuredClone(validateSnapshot(local));
 for(const kind of ENTITY_KINDS)next[kind]=[];
 const seen=new Set();
 for(const row of rows){
  if(!ENTITY_KINDS.includes(row.kind)||typeof row.source_id!=='string'||!row.payload||row.payload.id!==row.source_id)throw Error('Registro remoto incompatible');
  const key=row.kind+':'+row.source_id;if(seen.has(key))throw Error('Duplicado remoto');seen.add(key);
  // El API devuelve también tumbas lógicas. Nunca restaurarlas como registros activos.
  if(row.deleted_at)continue;
  next[row.kind].push(row.payload);
 }
 return validateSnapshot(next);
}
export function computeEntityPlan(local,remote){
 validateSnapshot(local);
 const index=new Map();
 for(const row of remote){
  if(!ENTITY_KINDS.includes(row.kind)||!row.payload||row.source_id!==row.payload.id||!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('Registro remoto incompatible');
  const key=row.kind+':'+row.source_id;
  if(index.has(key))throw Error('Duplicado remoto');index.set(key,row);
 }
 const ops=[];
 for(const kind of ENTITY_KINDS){
  for(const item of local[kind]){
   const key=kind+':'+item.id;const old=index.get(key);index.delete(key);
   if(old?.deleted_at)throw Error('Conflicto: registro eliminado en servidor. No se puede recrear automáticamente: '+key);
   if(!old)ops.push({kind,action:'create',sourceId:item.id,expectedRevision:0,payload:item});
   else if(JSON.stringify(canonical(old.payload))!==JSON.stringify(canonical(item)))ops.push({kind,action:'update',sourceId:item.id,expectedRevision:old.revision,payload:item});
  }
 }
 // Do not infer deletions: deletion in production needs tombstones and an explicit confirmation workflow.
 return ops;
}
// Explicit deletion plan: only records present in the acknowledged baseline may be removed.
// A missing record in a newly loaded or stale local snapshot never authorizes deletion.
export function computeConfirmedDeletionPlan(local,remote,baseline){
 validateSnapshot(local);
 if(!baseline||!Array.isArray(baseline.items))throw Error('Falta la referencia remota confirmada para borrar.');
 assertRemoteUnchanged(baseline,{items:remote});
 const base=new Map(baseline.items.filter(r=>!r.deleted_at).map(r=>[r.kind+':'+r.source_id,r]));
 const active=new Set(ENTITY_KINDS.flatMap(kind=>local[kind].map(item=>kind+':'+item.id)));
 const ops=[];
 for(const [key,row] of base){
  if(!active.has(key))ops.push({kind:row.kind,action:'delete',sourceId:row.source_id,expectedRevision:row.revision});
 }
 return ops;
}
function canonical(obj){if(Array.isArray(obj))return obj.map(canonical);if(obj&&typeof obj==='object')return Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));return obj;}

// A baseline is necessary: fresh server revisions alone cannot prove that
// the local changes were made on top of the current remote data.
export function assertRemoteUnchanged(baseline,current){
 if(!baseline||!Array.isArray(baseline.items)||!current||!Array.isArray(current.items))throw Error('Compara primero los registros remotos.');
 const index=rows=>{
  const m=new Map();
  for(const r of rows){
   if(!ENTITY_KINDS.includes(r.kind)||typeof r.source_id!=='string'||!Number.isSafeInteger(r.revision)||r.revision<1)throw Error('Respuesta remota inválida');
   const key=r.kind+':'+r.source_id;if(m.has(key))throw Error('Respuesta remota duplicada');
   m.set(key,`${r.revision}:${Boolean(r.deleted_at)}`);
  }
  return m;
 };
 const before=index(baseline.items),now=index(current.items);
 if(before.size!==now.size||[...before].some(([k,v])=>now.get(k)!==v))throw Error('El servidor cambió desde la comparación. Recupera y revisa los datos antes de enviar.');
}
