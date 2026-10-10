import test from 'node:test';import assert from 'node:assert/strict';
import {createStore,validateSnapshot} from '../assets/js/store.js';
import {normalizeDocument} from '../assets/js/document.js';import {cleanEntry} from '../assets/js/work.js';
const store=()=>createStore({getItem:()=>null,setItem(){}});
test('No admite fechas normalizadas al mes siguiente',()=>{const s=store();assert.throws(()=>s.addExpense({title:'Coste',amount:1,date:'2026-02-30'}));assert.throws(()=>s.addTask({title:'Tarea',date:'2026-02-30'}));assert.throws(()=>normalizeDocument({title:'SIM',due:'2026-02-30',lines:[]}));assert.throws(()=>cleanEntry({kind:'hour',description:'Soporte',quantity:1,unitCost:1,date:'2026-02-30'}));});
test('Importes inválidos no se convierten silenciosamente en cero',()=>{const s=store();for(const amount of ['abc',-1,Infinity,''])assert.throws(()=>s.addExpense({title:'Coste',amount}));assert.throws(()=>s.addJob({title:'Trabajo',clientId:'CL-001',hours:1e8,rate:1e8}));});
test('Registros creados siguen siendo restaurables',()=>{const s=store();s.addExpense({title:'Coste',amount:12,date:'2026-02-28'});s.addTask({title:'Revisión',date:'2026-02-28'});assert.doesNotThrow(()=>validateSnapshot(s.get()));});
