import test from 'node:test';import assert from 'node:assert/strict';import {normalizeDocument,documentTotals,demoDocumentTotal} from '../assets/js/document.js';
const base={title:'Servicio',due:'2026-12-01',lines:[{description:'Trabajo',quantity:2,price:100,discount:10,tax:21},{description:'Material',quantity:1,price:50,discount:0,tax:10}]};
test('totales multitramos',()=>{const t=documentTotals(base.lines);assert.equal(t.base,230);assert.equal(t.vat,42.8);assert.equal(t.total,272.8)});
test('normalización',()=>{const d=normalizeDocument(base);assert.equal(d.total,272.8);assert.equal(d.lines.length,2)});
test('no acepta descuento imposible',()=>assert.throws(()=>normalizeDocument({...base,lines:[{...base.lines[0],discount:101}]})));
test('no acepta vencimiento vacío',()=>assert.throws(()=>normalizeDocument({...base,due:''})));
test('compatible con registros SIM anteriores',()=>assert.equal(demoDocumentTotal({title:'X',subtotal:100,tax:21}),121));
