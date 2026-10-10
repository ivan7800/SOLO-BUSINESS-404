import {needDate} from './utils.js';
import {quoteTotals,normalizeLines} from './quote.js';
export function documentTotals(lines){return quoteTotals(lines);}
export function normalizeDocument(data){
 const title=String(data.title||'').trim();if(!title||title.length>170)throw Error('Concepto obligatorio (máximo 170 caracteres).');
 const due=String(data.due||'');needDate(due);
 const lines=normalizeLines(data.lines);const totals=documentTotals(lines);
 return {title,due,lines,subtotal:totals.base,tax:0,vat:totals.vat,total:totals.total};
}
export function legacyDocumentLines(i){return i.lines?.length?i.lines:[{description:i.title,quantity:1,price:i.subtotal,discount:0,tax:i.tax}];}
export function demoDocumentTotal(i){return documentTotals(legacyDocumentLines(i)).total;}
