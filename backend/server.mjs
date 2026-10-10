import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {hashToken,passwordHash,passwordValid,token,kinds} from './security.mjs';
import {RateLimiter, validateRecord, isAllowedOrigin} from './hardening.mjs';
import {migrationRows} from './migration.mjs';
import {validateOperations} from './record-operations.mjs';
if(!process.env.DATABASE_URL)throw Error('Configura DATABASE_URL');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10});
const port=Number(process.env.PORT||4174);
const allowedOrigin=process.env.APP_ORIGIN||'http://127.0.0.1:4173';
const loginLimiter=new RateLimiter({limit:8,windowMs:15*60*1000});
const registerLimiter=new RateLimiter({limit:4,windowMs:60*60*1000});
const clientIp=req=>req.socket.remoteAddress||'unknown';

const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':allowedOrigin,'Vary':'Origin','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'" });res.end(JSON.stringify(body))};
async function body(req){if(!['application/json','application/json; charset=utf-8'].includes(req.headers['content-type']))throw Object.assign(Error('Se requiere JSON'),{status:415});let s='';for await(const part of req){s+=part;if(Buffer.byteLength(s,'utf8')>65536)throw Object.assign(Error('Cuerpo demasiado grande'),{status:413})}try{return JSON.parse(s)}catch{throw Object.assign(Error('JSON inválido'),{status:400})}}
async function auth(req){const match=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'');if(!match)return null;const q=await pool.query('SELECT u.id,u.business_id,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hashToken(match[1])]);return q.rows[0]||null}
const server=http.createServer(async(req,res)=>{try{
const path=new URL(req.url,'http://localhost').pathname;
if(req.method==='OPTIONS'){const origin=req.headers.origin;if(origin!==allowedOrigin)return json(res,403,{error:'Origen no autorizado'});res.writeHead(204,{'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600','Vary':'Origin'});return res.end()}
if(req.headers.origin && !isAllowedOrigin(req.headers.origin,allowedOrigin))return json(res,403,{error:'Origen no autorizado'});
if(path==='/api/health'&&req.method==='GET')return json(res,200,{status:'ok',phase:'backend-beta-0.7.0'});
if(path==='/api/ready'&&req.method==='GET'){try{await pool.query('SELECT 1');return json(res,200,{status:'ready'});}catch{return json(res,503,{status:'unavailable'});}}
if(path==='/api/register'&&req.method==='POST'){
 if(!registerLimiter.consume(clientIp(req)))return json(res,429,{error:'Demasiadas solicitudes. Inténtalo más tarde'});
 const d=await body(req);if(typeof d.email!=='string'||!/^\S+@\S+\.\S+$/.test(d.email)||d.email.length>254||typeof d.business!=='string'||!d.business.trim()||d.business.length>120) return json(res,400,{error:'Datos inválidos'});
 if(typeof d.password!=='string'||d.password.length<12||d.password.length>1024)return json(res,400,{error:'Contraseña inválida: 12 a 1024 caracteres'});const p=passwordHash(d.password);const c=await pool.connect();try{await c.query('BEGIN');const bid=randomUUID(),uid=randomUUID();await c.query('INSERT INTO businesses(id,name) VALUES($1,$2)',[bid,d.business.trim()]);await c.query('INSERT INTO users(id,business_id,email,salt,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)',[uid,bid,d.email.trim().toLowerCase(),p.salt,p.hash,'owner']);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');if(e.code==='23505')return json(res,409,{error:'Email ya registrado'});throw e}finally{c.release()}return json(res,201,{created:true});
}
if(path==='/api/login'&&req.method==='POST'){
 if(!loginLimiter.consume(clientIp(req)))return json(res,429,{error:'Demasiados intentos. Inténtalo más tarde'});
 const d=await body(req);if(typeof d.email!=='string'||typeof d.password!=='string')return json(res,400,{error:'Credenciales inválidas'});
 const q=await pool.query('SELECT * FROM users WHERE email=$1',[d.email.trim().toLowerCase()]);const u=q.rows[0];if(!u||!passwordValid(d.password,u.salt,u.password_hash))return json(res,401,{error:'Credenciales inválidas'});
 loginLimiter.reset(clientIp(req));const t=token();await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[hashToken(t),u.id]);return json(res,200,{token:t,expiresInSeconds:28800});
}
const u=await auth(req);if(!u)return json(res,401,{error:'No autorizado'});
if(req.method==='POST'||req.method==='PUT'||req.method==='DELETE'){if(req.headers.origin && !isAllowedOrigin(req.headers.origin,allowedOrigin))return json(res,403,{error:'Origen no autorizado'});}
if(path==='/api/logout-all'&&req.method==='POST'){await pool.query('DELETE FROM sessions WHERE user_id=$1',[u.id]);return json(res,200,{ok:true})}
if(path==='/api/me'&&req.method==='GET')return json(res,200,{businessId:u.business_id,role:u.role});
if(path==='/api/snapshot'&&req.method==='GET'){const q=await pool.query('SELECT revision,payload,updated_at FROM snapshots WHERE business_id=$1',[u.business_id]);return json(res,200,q.rows[0]||{revision:0,payload:null});}
if(path==='/api/snapshot'&&req.method==='PUT'){
 if(u.role!=='owner')return json(res,403,{error:'Solo el propietario puede restaurar datos'});
 const d=await body(req);if(!Number.isSafeInteger(d?.expectedRevision)||d.expectedRevision<0||!d.payload||typeof d.payload!=='object'||Array.isArray(d.payload)||d.payload.meta?.version!==1)return json(res,400,{error:'Instantánea inválida'});
 const validKeys=['clients','quotes','jobs','invoices','expenses','tasks','activity'];
 if(validKeys.some(k=>!Array.isArray(d.payload[k])||d.payload[k].length>5000)||JSON.stringify(d.payload).length>60000)return json(res,400,{error:'Instantánea incompleta o demasiado grande'});
 const c=await pool.connect();try{await c.query('BEGIN');await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[u.business_id]);
 const old=await c.query('SELECT revision FROM snapshots WHERE business_id=$1',[u.business_id]);const revision=old.rows[0]?.revision||0;
 if(revision!==d.expectedRevision){await c.query('ROLLBACK');return json(res,409,{error:'Conflicto: se modificaron los datos remotos',revision});}
 const next=revision+1;await c.query(`INSERT INTO snapshots(business_id,revision,payload) VALUES($1,$2,$3) ON CONFLICT(business_id) DO UPDATE SET revision=EXCLUDED.revision,payload=EXCLUDED.payload,updated_at=now()`,[u.business_id,next,JSON.stringify(d.payload)]);await c.query('COMMIT');return json(res,200,{revision:next});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
if(path==='/api/migrate-records'&&req.method==='POST'){
 if(u.role!=='owner')return json(res,403,{error:'Solo el propietario puede migrar'});
 const d=await body(req);let rows;
 try{rows=migrationRows(d?.payload)}catch(e){return json(res,400,{error:e.message})}
 if(!Number.isSafeInteger(d?.expectedRevision)||d.expectedRevision<0)return json(res,400,{error:'Revisión inválida'});
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[u.business_id]);
  const snap=await c.query('SELECT revision FROM snapshots WHERE business_id=$1',[u.business_id]);
  const revision=snap.rows[0]?.revision||0;
  if(revision!==d.expectedRevision){await c.query('ROLLBACK');return json(res,409,{error:'Conflicto de revisión',revision})}
  const exists=await c.query('SELECT 1 FROM records WHERE business_id=$1 LIMIT 1',[u.business_id]);
  if(exists.rowCount){await c.query('ROLLBACK');return json(res,409,{error:'Ya existen registros individuales. No se sobrescribe nada.'})}
  for(const row of rows)await c.query('INSERT INTO records(business_id,kind,id,payload,source_id) VALUES($1,$2,$3,$4,$5)',[u.business_id,row.kind,randomUUID(),JSON.stringify(row.payload),row.sourceId]);
  await c.query('COMMIT');
  return json(res,201,{migrated:rows.length,counts:Object.fromEntries([...new Set(rows.map(x=>x.kind))].map(kind=>[kind,rows.filter(x=>x.kind===kind).length]))});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
if(path==='/api/migration-status'&&req.method==='GET'){
 const q=await pool.query('SELECT kind,count(*)::int AS count FROM records WHERE business_id=$1 AND deleted_at IS NULL GROUP BY kind ORDER BY kind',[u.business_id]);
 return json(res,200,{counts:Object.fromEntries(q.rows.map(r=>[r.kind,r.count])),total:q.rows.reduce((n,r)=>n+r.count,0)});
}
if(path==='/api/records-batch'&&req.method==='POST'){
 if(u.role!=='owner')return json(res,403,{error:'Permiso insuficiente'});
 const d=await body(req);let operations;
 try{operations=validateOperations(d)}catch(e){return json(res,400,{error:e.message})}
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query('SELECT id FROM businesses WHERE id=$1 FOR UPDATE',[u.business_id]);
  const result=[];
  for(const op of operations){
   let q;
   if(op.action==='create')q=await c.query('INSERT INTO records(business_id,kind,id,source_id,payload,revision) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT DO NOTHING RETURNING revision',[u.business_id,op.kind,randomUUID(),op.sourceId,JSON.stringify(op.payload)]);
   if(op.action==='update')q=await c.query('UPDATE records SET payload=$1,revision=revision+1,updated_at=now() WHERE business_id=$2 AND kind=$3 AND source_id=$4 AND revision=$5 AND deleted_at IS NULL RETURNING revision',[JSON.stringify(op.payload),u.business_id,op.kind,op.sourceId,op.expectedRevision]);
   if(op.action==='delete')q=await c.query('UPDATE records SET deleted_at=now(),revision=revision+1,updated_at=now() WHERE business_id=$1 AND kind=$2 AND source_id=$3 AND revision=$4 AND deleted_at IS NULL RETURNING revision',[u.business_id,op.kind,op.sourceId,op.expectedRevision]);
   if(q.rowCount!==1){await c.query('ROLLBACK');return json(res,409,{error:'Conflicto de revisión o registro inexistente',kind:op.kind,sourceId:op.sourceId});}
   result.push({kind:op.kind,sourceId:op.sourceId,revision:q.rows[0].revision,deleted:op.action==='delete'});
  }
  await c.query('COMMIT');return json(res,200,{results:result});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
if(path==='/api/records-all'&&req.method==='GET'){
 const q=await pool.query('SELECT kind,source_id,revision,payload,deleted_at FROM records WHERE business_id=$1 ORDER BY kind,source_id LIMIT 5001',[u.business_id]);
 if(q.rowCount>5000)return json(res,413,{error:'Demasiados registros para una sola consulta'});
 return json(res,200,{items:q.rows});
}
if(path==='/api/logout'&&req.method==='POST'){await pool.query('DELETE FROM sessions WHERE token_hash=$1',[hashToken(req.headers.authorization.slice(7))]);return json(res,200,{ok:true})}
const m=/^\/api\/records\/(clients|quotes|jobs|invoices|expenses|tasks|activity)(?:\/([a-f0-9-]{36}))?$/.exec(path);
if(!m||!kinds.has(m[1]))return json(res,404,{error:'Ruta no encontrada'});
const [,kind,id]=m;
if(req.method==='GET'&&!id){const q=await pool.query('SELECT id,payload,updated_at,revision FROM records WHERE business_id=$1 AND kind=$2 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500',[u.business_id,kind]);return json(res,200,{items:q.rows})}
// Rutas heredadas de escritura bloqueadas: carecen de revisión y de control de concurrencia.
// Todas las escrituras se realizan a través de /api/records-batch.
if(['POST','PUT','DELETE'].includes(req.method))return json(res,409,{error:'Ruta de escritura heredada deshabilitada. Utiliza /api/records-batch con expectedRevision.'});
return json(res,405,{error:'Método no permitido'});
}catch(e){if(e.code==='22P02')return json(res,400,{error:'Identificador inválido'});if(e.status)return json(res,e.status,{error:e.message});console.error(e);json(res,500,{error:'Error interno'})}});
server.listen(port,'127.0.0.1',()=>console.log(`API de desarrollo en http://127.0.0.1:${port}`));
