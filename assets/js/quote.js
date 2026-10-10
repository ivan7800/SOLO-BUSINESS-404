import {round2} from './utils.js';
const allowed=[0,4,10,21];
export function normalizeLines(lines){
 if(!Array.isArray(lines)||!lines.length||lines.length>40)throw Error('Incluye entre 1 y 40 conceptos.');
 return lines.map((line,i)=>{
  const description=String(line.description||'').trim();
  const quantity=Number(line.quantity),price=Number(line.price),discount=Number(line.discount||0),tax=Number(line.tax);
  if(!description||description.length>170)throw Error(`Concepto ${i+1}: descripción obligatoria (máx. 170 caracteres).`);
  if(!Number.isFinite(quantity)||quantity<=0||quantity>100000)throw Error(`Concepto ${i+1}: cantidad inválida.`);
  if(!Number.isFinite(price)||price<0||price>10000000)throw Error(`Concepto ${i+1}: precio inválido.`);
  if(!Number.isFinite(discount)||discount<0||discount>100)throw Error(`Concepto ${i+1}: descuento inválido.`);
  if(!allowed.includes(tax))throw Error(`Concepto ${i+1}: IVA no permitido.`);
  return {description,quantity,price,discount,tax};
 });
}
export function quoteTotals(lines){
 const items=normalizeLines(lines).map(line=>{
  const base=round2(line.quantity*line.price*(1-line.discount/100));
  return {...line,base,vat:round2(base*line.tax/100),total:round2(base*(1+line.tax/100))};
 });
 return {items,base:round2(items.reduce((s,x)=>s+x.base,0)),vat:round2(items.reduce((s,x)=>s+x.vat,0)),total:round2(items.reduce((s,x)=>s+x.total,0))};
}
export function quoteLegacyLines(q){return q.lines?.length?q.lines:[{description:q.title,quantity:1,price:q.subtotal,discount:0,tax:q.tax}];}
