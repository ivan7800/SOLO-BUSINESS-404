import test from 'node:test';import assert from 'node:assert/strict';import {validateOperations} from '../record-operations.mjs';
const a={operations:[{action:'create',kind:'clients',sourceId:'c1',expectedRevision:0,payload:{id:'c1',name:'Cliente'}}]};
test('acepta alta validada',()=>assert.equal(validateOperations(a).length,1));
test('rechaza duplicados',()=>assert.throws(()=>validateOperations({operations:[a.operations[0],a.operations[0]]}))); 
test('requiere revision para actualizacion',()=>assert.throws(()=>validateOperations({operations:[{...a.operations[0],action:'update'}]})));
test('rechaza entidades desconocidas',()=>assert.throws(()=>validateOperations({operations:[{...a.operations[0],kind:'users'}]})));
test('requiere carga en altas',()=>assert.throws(()=>validateOperations({operations:[{...a.operations[0],payload:null}]})));
test('limita lote',()=>assert.throws(()=>validateOperations({operations:Array(101).fill(a.operations[0])})));
