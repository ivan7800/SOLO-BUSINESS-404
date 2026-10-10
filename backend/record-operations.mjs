export const KINDS=new Set(['clients','quotes','jobs','invoices','expenses','tasks','activity']);
export function validateOperations(d){
 if(!d||typeof d!=='object'||!Array.isArray(d.operations)||d.operations.length<1||d.operations.length>100)throw Error('Operaciones: 1 a 100');
 const seen=new Set();
 return d.operations.map(op=>{
  if(!op||!KINDS.has(op.kind)||!['create','update','delete'].includes(op.action))throw Error('Operación inválida');
  if(typeof op.sourceId!=='string'||op.sourceId.length<1||op.sourceId.length>160)throw Error('sourceId inválido');
  const key=op.kind+':'+op.sourceId;if(seen.has(key))throw Error('Operación duplicada');seen.add(key);
  if(op.action==='create'){
   if(op.expectedRevision!==0||!op.payload||typeof op.payload!=='object'||Array.isArray(op.payload))throw Error('Alta inválida');
  }else if(!Number.isSafeInteger(op.expectedRevision)||op.expectedRevision<1)throw Error('Revisión obligatoria');
  if(op.action==='update'&&(!op.payload||typeof op.payload!=='object'||Array.isArray(op.payload)))throw Error('Actualización inválida');
  if(op.action!=='delete'&&op.payload.id!==op.sourceId)throw Error('Identificador del payload distinto de sourceId');
  if(op.action!=='delete'&&JSON.stringify(op.payload).length>12000)throw Error('Registro excesivo');
  return op;
 });
}
