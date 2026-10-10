import {test} from 'node:test';import {strict as assert} from 'node:assert';import {passwordHash,passwordValid,hashToken,token,kinds} from '../security.mjs';
test('contraseña y sal aleatoria',()=>{const a=passwordHash('contraseña-larga-123');const b=passwordHash('contraseña-larga-123');assert.notEqual(a.hash,b.hash);assert(passwordValid('contraseña-larga-123',a.salt,a.hash));assert(!passwordValid('incorrecta',a.salt,a.hash))});
test('rechazar contraseña débil',()=>assert.throws(()=>passwordHash('123')));
test('tokens aleatorios y hash',()=>{const a=token(),b=token();assert.notEqual(a,b);assert.equal(a.length,64);assert.equal(hashToken(a).length,64)});
test('tipos permitidos',()=>{assert(kinds.has('clients'));assert(!kinds.has('users'))});
