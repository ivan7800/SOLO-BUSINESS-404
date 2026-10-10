import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,validateSnapshot} from '../assets/js/store.js';
import {jobTotals} from '../assets/js/work.js';
import {seedData} from '../assets/js/data.js';
const memory=()=>{let json;return {getItem:()=>json,setItem:(k,v)=>{json=v}}};
test('Horas y materiales: cálculo de costes y margen',()=>{
 const s=createStore(memory()),j=s.addJob({clientId:'CL-001',title:'Instalación',hours:10,rate:50});
 s.addWorkEntry(j.id,{kind:'hour',description:'Montaje',quantity:4,unitCost:24,date:'2026-10-10'});
 s.addWorkEntry(j.id,{kind:'material',description:'Cableado',quantity:3,unitCost:12,date:'2026-10-10'});
 assert.deepEqual(jobTotals(s.get().jobs[0]),{hours:4,labor:96,materials:36,cost:132,income:500,profit:368,margin:73.6});
 assert.doesNotThrow(()=>validateSnapshot(s.get()));
});
test('Edición, avance, cierre y reapertura de trabajo',()=>{
 const s=createStore(memory()),j=s.addJob({clientId:'CL-001',title:'Revisión',hours:2,rate:30});
 s.updateJob(j.id,{title:'Revisión ampliada',budget:200,hours:5,rate:40});
 s.setJobProgress(j.id,75);assert.equal(s.get().jobs[0].status,'En curso');
 s.setJobProgress(j.id,100);assert.equal(s.get().jobs[0].status,'Completado');
 assert.throws(()=>s.addWorkEntry(j.id,{kind:'hour',description:'Extra',quantity:1,unitCost:20,date:'2026-10-10'}),/Reabre/);
 s.setJobStatus(j.id,'En curso');assert.equal(s.get().jobs[0].progress,50);
 assert.equal(jobTotals(s.get().jobs[0]).income,200);
});
test('Eliminación de partes y validación estricta de importación',()=>{
 const s=createStore(memory()),j=s.addJob({clientId:'CL-001',title:'Revisión',hours:1,rate:50});
 const e=s.addWorkEntry(j.id,{kind:'material',description:'Pieza',quantity:1,unitCost:10,date:'2026-10-10'});
 s.removeWorkEntry(j.id,e.id);assert.equal(s.get().jobs[0].entries.length,0);
 assert.throws(()=>s.removeWorkEntry(j.id,e.id),/no encontrado/);
 assert.throws(()=>s.addWorkEntry(j.id,{kind:'hour',description:'Incorrecto',quantity:-2,unitCost:1,date:'2026-10-10'}),/fuera de rango/);
 const broken=seedData();broken.jobs[0].entries=[{id:'P-1',kind:'hour',description:'Falso',quantity:-10,unitCost:2,date:'2026-10-10'}];
 assert.throws(()=>validateSnapshot(broken),/fuera de rango/);
});
test('Snapshot heredado sin entries ni budget',()=>{const s=createStore(memory());assert.doesNotThrow(()=>validateSnapshot(s.get()));assert.ok(jobTotals(s.get().jobs[0]).income>=0);});
