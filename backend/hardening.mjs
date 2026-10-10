export class RateLimiter {
 constructor({limit=8,windowMs=900000,now=()=>Date.now()}={}){this.limit=limit;this.windowMs=windowMs;this.now=now;this.hits=new Map()}
 consume(key){const t=this.now();for(const [k,v] of this.hits){if(v.until<=t)this.hits.delete(k)}const v=this.hits.get(key);if(!v){this.hits.set(key,{count:1,until:t+this.windowMs});return true}if(v.count>=this.limit)return false;v.count++;return true}
 reset(key){this.hits.delete(key)}
}
export function validateRecord(d){if(!d||typeof d!=='object'||Array.isArray(d))return false;try{return JSON.stringify(d).length<=16000}catch{return false}}
export function isAllowedOrigin(origin,expected){return origin===expected}
