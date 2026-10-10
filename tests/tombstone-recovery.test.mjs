import test from 'node:test';
import assert from 'node:assert/strict';
import {seedData} from '../assets/js/data.js';
import {mergeRemoteRecords,computeEntityPlan} from '../assets/js/entity-sync.js';

test('recuperación remota ignora borrados lógicos aunque API devuelva su payload',()=>{
 const base=seedData();const deleted=base.tasks[0];
 const out=mergeRemoteRecords(base,[{kind:'tasks',source_id:deleted.id,payload:deleted,revision:2,deleted_at:'2026-10-10T12:00:00Z'}]);
 assert.equal(out.tasks.some(x=>x.id===deleted.id),false);
});
test('una tumba lógica impide recrear por sincronización accidental',()=>{
 const base=seedData();const deleted=base.tasks[0];
 assert.throws(()=>computeEntityPlan(base,[{kind:'tasks',source_id:deleted.id,payload:deleted,revision:2,deleted_at:'2026-10-10T12:00:00Z'}]),/eliminado/);
});
test('borrado remoto combinado con otros registros conserva los activos',()=>{
 const base=seedData();const rows=base.tasks.map((payload,i)=>({kind:'tasks',source_id:payload.id,payload,revision:i+1,deleted_at:i===0?'2026-10-10T12:00:00Z':null}));
 const out=mergeRemoteRecords(base,rows);
 assert.equal(out.tasks.length,rows.length-1);
 assert.equal(out.tasks.some(x=>x.id===rows[0].source_id),false);
});
