import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
export const hashToken=t=>createHash('sha256').update(t).digest('hex');
export function passwordHash(password,salt=randomBytes(16).toString('hex')){if(typeof password!=='string'||password.length<12||password.length>1024)throw Error('Contraseña: mínimo 12 caracteres.');return {salt,hash:scryptSync(password,salt,64).toString('hex')};}
export function passwordValid(password,salt,hash){try{const actual=scryptSync(password,salt,64);const expected=Buffer.from(hash,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected)}catch{return false}}
export function token(){return randomBytes(32).toString('hex')}
export const kinds=new Set(['clients','quotes','jobs','invoices','expenses','tasks','activity']);
