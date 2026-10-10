import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const main = readFileSync(new URL('assets/js/main.js', root), 'utf8');
test('La etiqueta lateral y la guía coinciden con package.json', () => {
  assert.ok(main.includes(`EDICIÓN DE PRUEBA · ${pkg.version}`));
  assert.ok(main.includes(`versión ${pkg.version} de demostración`));
});
