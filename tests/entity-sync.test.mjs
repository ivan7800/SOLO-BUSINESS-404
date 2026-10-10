import test from 'node:test';
import assert from 'node:assert/strict';
import {seedData} from '../assets/js/data.js';
import {computeEntityPlan,mergeRemoteRecords} from '../assets/js/entity-sync.js';
test('empty server creates all rows',()=>{const s=seedData();assert.equal(computeEntityPlan(s,[]).length,['clients','quotes','jobs','invoices','expenses','tasks','activity'].reduce((n,k)=>n+s[k].length,0))});
test('same server rows produce no actions',()=>{const s=seedData();const rows=Object.entries(s).filter(([k])=>['clients','quotes','jobs','invoices','expenses','tasks','activity'].includes(k)).flatMap(([kind,a])=>a.map(payload=>({kind,source_id:payload.id,revision:1,payload})));assert.equal(computeEntityPlan(s,rows).length,0);assert.deepEqual(mergeRemoteRecords(s,rows),s)});
test('changed record receives optimistic revision',()=>{const s=seedData(),c=s.clients[0];const remote=[{kind:'clients',source_id:c.id,revision:9,payload:{...c,name:'Antes'}}];const op=computeEntityPlan(s,remote).find(x=>x.sourceId===c.id);assert.equal(op.action,'update');assert.equal(op.expectedRevision,9)});
test('malformed remote record rejected',()=>{const s=seedData();assert.throws(()=>mergeRemoteRecords(s,[{kind:'clients',source_id:'a',payload:{id:'b'}}]))});
