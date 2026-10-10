import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRemoteUnchanged,computeEntityPlan} from '../assets/js/entity-sync.js';
const row=(rev=1,deleted=null)=>({kind:'clients',source_id:'c1',revision:rev,payload:{id:'c1'},deleted_at:deleted});
test('reject no baseline',()=>assert.throws(()=>assertRemoteUnchanged(null,{items:[]})));
test('allow unchanged revisions',()=>assert.doesNotThrow(()=>assertRemoteUnchanged({items:[row()]},{items:[row()]})));
test('reject updated remote record',()=>assert.throws(()=>assertRemoteUnchanged({items:[row()]},{items:[row(2)]})));
test('reject deleted remote record',()=>assert.throws(()=>assertRemoteUnchanged({items:[row()]},{items:[row(2,'2026-10-10')]})));
test('reject new record not in reviewed baseline',()=>assert.throws(()=>assertRemoteUnchanged({items:[]},{items:[row()]})));
