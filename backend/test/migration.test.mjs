import test from 'node:test';import assert from 'node:assert/strict';import {migrationRows,ENTITY_KINDS} from '../migration.mjs';
const snapshot=()=>Object.fromEntries([['meta',{version:1}],...ENTITY_KINDS.map(k=>[k,[]])]);
test('seven collections',()=>assert.equal(migrationRows(snapshot()).length,0));
test('preserves original identifiers and all kinds',()=>{const p=snapshot();p.clients=[{id:'CL-1',name:'A'}];p.invoices=[{id:'SIM-1'}];assert.deepEqual(migrationRows(p).map(x=>x.sourceId),['CL-1','SIM-1'])});
test('reject duplicate identifiers in same collection',()=>{const p=snapshot();p.clients=[{id:'A'},{id:'A'}];assert.throws(()=>migrationRows(p),/duplicado/)});
test('reject missing collection',()=>{const p=snapshot();delete p.jobs;assert.throws(()=>migrationRows(p),/jobs/)});
test('reject oversized record',()=>{const p=snapshot();p.clients=[{id:'A',name:'x'.repeat(20000)}];assert.throws(()=>migrationRows(p),/grande/)});
test('reject oversized dataset',()=>{const p=snapshot();p.clients=Array.from({length:5000},(_,i)=>({id:'a'+i}));p.jobs=[{id:'j'}];assert.throws(()=>migrationRows(p),/Exceso/)});
