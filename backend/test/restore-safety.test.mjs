import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../restore.sh',import.meta.url),'utf8');
test('restauracion exige checksum',()=>assert.match(script,/sha256sum -c/));
test('restauracion rechaza destino no vacio',()=>assert.match(script,/existing.*== '0'/));
test('restauracion restringida a base test',()=>assert.match(script,/test\|testing\|e2e/));
test('restauracion transaccional',()=>assert.match(script,/--single-transaction/));
