export const eur = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(n)||0);
export const decimal = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(Number(n)||0);
export const fmtDate = str => str ? new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${str}T12:00:00`)) : '—';
export const today = () => new Date().toLocaleDateString('en-CA');
export const escapeHtml = str => String(str??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export const safeNum = (value,min=0,max=100000000)=> {const n=Number(value);return Number.isFinite(n) ? Math.max(min,Math.min(max,n)):min;};
export const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0,8).toUpperCase() || Math.random().toString(36).slice(2,10).toUpperCase()}`;
export const sum = (xs,fn=x=>x)=> xs.reduce((a,x)=>a+Number(fn(x)||0),0);
export const initials = str => String(str||'?').split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
export const round2 = n=>Math.round((Number(n)+Number.EPSILON)*100)/100;

export const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T12:00:00Z')) && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export const needDate = value => {if(!validDate(value))throw Error('Fecha incorrecta.');return value;};
export const needAmount = (value,max=100000000) => {const n=Number(value);if(value===''||value==null||!Number.isFinite(n)||n<0||n>max)throw Error('Importe fuera de rango.');return n;};
