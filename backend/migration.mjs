// Pure validation for a one-way, explicit local -> records migration.
export const ENTITY_KINDS=Object.freeze(['clients','quotes','jobs','invoices','expenses','tasks','activity']);
export function migrationRows(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.meta?.version!==1)throw Error('Formato de datos incompatible');
 const rows=[];
 for(const kind of ENTITY_KINDS){
  const items=payload[kind];
  if(!Array.isArray(items)||items.length>5000)throw Error('Colección inválida: '+kind);
  const ids=new Set();
  for(const item of items){
   if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||!item.id||item.id.length>90||ids.has(item.id))throw Error('ID inválido o duplicado: '+kind);
   ids.add(item.id);
   const raw=JSON.stringify(item);
   if(!raw||Buffer.byteLength(raw,'utf8')>16000)throw Error('Registro demasiado grande: '+kind);
   rows.push({kind,sourceId:item.id,payload:item});
  }
 }
 if(rows.length>5000)throw Error('Exceso de registros');
 return rows;
}
