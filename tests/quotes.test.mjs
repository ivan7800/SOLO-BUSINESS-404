import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,validateSnapshot} from '../assets/js/store.js';
import {quoteTotals} from '../assets/js/quote.js';
const storage=()=>({getItem(){return null},setItem(){}});
test('Cálculo de descuentos e IVA por línea',()=>{const t=quoteTotals([{description:'Soporte',quantity:2,price:100,discount:10,tax:21},{description:'Consultoría',quantity:1,price:50,discount:0,tax:10}]);assert.equal(t.base,230);assert.equal(t.vat,42.8);assert.equal(t.total,272.8);});
test('Rechaza importes inválidos y líneas vacías',()=>{assert.throws(()=>quoteTotals([]));assert.throws(()=>quoteTotals([{description:'A',quantity:-1,price:20,tax:21}]));});
test('Alta, edición, transición y conversión única en trabajo',()=>{const s=createStore(storage());const clientId=s.get().clients[0].id;const lines=[{description:'Desarrollo',quantity:2,price:100,discount:10,tax:21}];const q=s.addQuote({clientId,title:'Web',lines});assert.equal(q.subtotal,180);s.updateQuote(q.id,{clientId,title:'Web 2',lines,notes:'Prueba'});s.setQuoteStatus(q.id,'Enviado');assert.throws(()=>s.updateQuote(q.id,{clientId,title:'Otro',lines}));s.setQuoteStatus(q.id,'Aceptado');const j=s.createJobFromQuote(q.id);assert.equal(s.get().quotes.find(x=>x.id===q.id).jobId,j.id);assert.throws(()=>s.createJobFromQuote(q.id));assert.equal(s.get().jobs.filter(x=>x.quoteId===q.id).length,1);validateSnapshot(s.get());});
