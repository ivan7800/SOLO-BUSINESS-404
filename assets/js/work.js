import {round2,needDate} from './utils.js';
const n=(v,max=1e7)=>{const x=Number(v);if(!Number.isFinite(x)||x<0||x>max)throw Error('Importe o cantidad fuera de rango.');return x;};
export function cleanEntry(data){
 const kind=data.kind==='material'?'material':data.kind==='hour'?'hour':null;
 if(!kind)throw Error('Tipo de registro inválido.');
 const description=String(data.description||'').trim();if(!description||description.length>180)throw Error('Describe el trabajo o material (máximo 180 caracteres).');
 const quantity=n(data.quantity,100000),unitCost=n(data.unitCost);if(quantity<=0)throw Error('La cantidad debe ser mayor que cero.');
 const date=String(data.date||'');needDate(date);
 return {kind,description,quantity,unitCost,date};
}
export function jobTotals(job){
 const entries=job.entries||[];const hours=round2(entries.filter(e=>e.kind==='hour').reduce((s,e)=>s+e.quantity,0));
 const labor=round2(entries.filter(e=>e.kind==='hour').reduce((s,e)=>s+e.quantity*e.unitCost,0));
 const materials=round2(entries.filter(e=>e.kind==='material').reduce((s,e)=>s+e.quantity*e.unitCost,0));
 const cost=round2(labor+materials);const income=round2(job.budget??job.hours*job.rate);const profit=round2(income-cost);
 return {hours,labor,materials,cost,income,profit,margin:income>0?round2(profit/income*100):0};
}
