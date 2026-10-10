// Validación sintáctica y de control de documentos españoles habituales (no verifica identidad ni vigencia).
export function validSpanishTaxId(input){
 const x=String(input||'').replace(/[\s-]/g,'').toUpperCase();if(!x)return true;
 const letters='TRWAGMYFPDXBNJZSQVHLCKE';
 if(/^\d{8}[A-Z]$/.test(x))return letters[Number(x.slice(0,8))%23]===x[8];
 if(/^[XYZ]\d{7}[A-Z]$/.test(x))return letters[Number('XYZ'.indexOf(x[0])+x.slice(1,8))%23]===x[8];
 if(/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(x)){
  const d=x.slice(1,8).split('').map(Number);let sum=0;
  for(let i=0;i<7;i++){let v=d[i]*(i%2===0?2:1);sum+=Math.floor(v/10)+v%10;}
  const c=(10-sum%10)%10;const digit=String(c),letter='JABCDEFGHI'[c];
  return /^[ABEH]$/.test(x[0])?x[8]===digit:/^[NPQRSW]$/.test(x[0])?x[8]===letter:x[8]===digit||x[8]===letter;
 }
 return false;
}
