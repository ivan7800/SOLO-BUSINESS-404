import test from 'node:test';
import assert from 'node:assert/strict';
import {computeConfirmedDeletionPlan} from '../assets/js/entity-sync.js';
import {seedData} from '../assets/js/data.js';
const snapshot=()=>structuredClone(seedData());
const baseline=(data)=>({items:data.tasks.map(c=>({kind:'tasks',source_id:c.id,payload:c,revision:3,deleted_at:null}))});
test('no implicit deletes against an empty acknowledged baseline',()=>{
 const d=snapshot();assert.deepEqual(computeConfirmedDeletionPlan(d,[],{items:[]}),[]);
});
test('delete requires the exact acknowledged revision',()=>{
 const d=snapshot();const b=baseline(d);const chosen=b.items[0];d.tasks=d.tasks.filter(c=>c.id!==chosen.source_id);
 const ops=computeConfirmedDeletionPlan(d,b.items,b);assert.deepEqual(ops,[{kind:'tasks',action:'delete',sourceId:chosen.source_id,expectedRevision:3}]);
});
test('changed remote revision prevents deletion',()=>{
 const d=snapshot();const b=baseline(d);d.tasks=[];
 const remote=structuredClone(b.items);remote[0].revision=4;
 assert.throws(()=>computeConfirmedDeletionPlan(d,remote,b),/cambió/);
});
test('tombstones cannot trigger new deletion',()=>{
 const d=snapshot();const b=baseline(d);const chosen=b.items[0];chosen.deleted_at='2026-10-10T10:00:00Z';d.tasks=d.tasks.filter(t=>t.id!==chosen.source_id);
 assert.deepEqual(computeConfirmedDeletionPlan(d,b.items,b),[]);
});
