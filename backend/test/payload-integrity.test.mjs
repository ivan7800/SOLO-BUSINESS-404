import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOperations} from '../record-operations.mjs';
test('reject mismatched source identifiers',()=>assert.throws(()=>validateOperations({operations:[{kind:'clients',action:'create',sourceId:'c1',expectedRevision:0,payload:{id:'c2'}}]})));
test('accept matching source identifiers',()=>assert.equal(validateOperations({operations:[{kind:'clients',action:'create',sourceId:'c1',expectedRevision:0,payload:{id:'c1'}}]}).length,1));
