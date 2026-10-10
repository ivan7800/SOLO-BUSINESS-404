// SOLO BUSINESS 404: integration tests against disposable, isolated PostgreSQL only.
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import assert from 'node:assert/strict';

if(!process.env.DATABASE_URL || process.env.CONFIRM_ISOLATED_TEST_DB!=='YES'){
 console.error('SKIP: configure DATABASE_URL pointing to a DISPOSABLE migrated database and CONFIRM_ISOLATED_TEST_DB=YES.');
 process.exit(2);
}
// Extra safety interlock: never use a database with a production-looking name.
let dbName='';
try { dbName=decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1)); }
catch { console.error('ERROR: DATABASE_URL no es una URL válida.'); process.exit(2); }
if (!/(^|[_-])(test|testing|e2e)([_-]|$)/i.test(dbName)) {
 console.error('ERROR: la base de datos debe llamarse claramente *_test, *_testing o *_e2e.');
 process.exit(2);
}
const port=Number(process.env.TEST_API_PORT||4189);
const origin='http://127.0.0.1:4173';const base=`http://127.0.0.1:${port}`;
let server;
function launch(){server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),APP_ORIGIN:origin},stdio:'ignore'});}
async function ready(){for(let i=0;i<70;i++){try{const r=await fetch(base+'/api/ready');if(r.ok)return;}catch{}await sleep(100);}throw Error('API not reachable');}
async function api(path,{method='GET',token,data}={}){
 const r=await fetch(base+path,{method,headers:{origin,'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
 const payload=await r.json();return {status:r.status,...payload};
}
async function register(name,email,password){assert.equal((await api('/api/register',{method:'POST',data:{business:name,email,password}})).status,201);const logged=await api('/api/login',{method:'POST',data:{email,password}});assert.equal(logged.status,200);return logged.token;}
function operation(action,id,revision,name){return {action,kind:'clients',sourceId:id,expectedRevision:revision,...(action==='delete'?{}:{payload:{id,name}})};}
let checks=0;
try{
 launch();await ready();
 const suffix=randomUUID();const pw='test-password-'+randomUUID();
 const a=await register('Empresa A '+suffix,`a-${suffix}@test.invalid`,pw);
 const b=await register('Empresa B '+suffix,`b-${suffix}@test.invalid`,pw);
 const aid='client-'+randomUUID();
 let r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('create',aid,0,'Cliente confidencial A')]}});
 assert.equal(r.status,200);assert.equal(r.results[0].revision,1);checks++;
 r=await api('/api/records-all',{token:b});assert.equal(r.status,200);assert.equal(r.items.some(x=>x.source_id===aid),false);checks++;
 r=await api('/api/records-batch',{method:'POST',token:b,data:{operations:[operation('update',aid,1,'Intento intruso')]}});assert.equal(r.status,409);checks++;
 r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('update',aid,1,'Actualizado A')]}});assert.equal(r.status,200);checks++;
 r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('update',aid,1,'Cambio obsoleto')]}});assert.equal(r.status,409);checks++;
 // Atomic rollback: a successful update followed by conflicting update on unknown row.
 const missing='client-'+randomUUID();
 r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('update',aid,2,'NO DEBE GUARDARSE'),operation('update',missing,1,'ausente')]}});assert.equal(r.status,409);
 r=await api('/api/records-all',{token:a});assert.equal(r.items.find(x=>x.source_id===aid).payload.name,'Actualizado A');checks++;
 r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('delete',aid,2)]}});assert.equal(r.status,200);checks++;
 r=await api('/api/records-batch',{method:'POST',token:a,data:{operations:[operation('create',aid,0,'resurrección')]}});assert.equal(r.status,409);checks++;
 r=await api('/api/records-all',{token:a});assert.ok(r.items.find(x=>x.source_id===aid).deleted_at);checks++;
 server.kill();await sleep(350);launch();await ready();
 r=await api('/api/records-all',{token:a});assert.equal(r.status,200);assert.ok(r.items.find(x=>x.source_id===aid).deleted_at);checks++;
 r=await api('/api/records-all',{token:b});assert.equal(r.items.some(x=>x.source_id===aid),false);checks++;
 console.log(`PASS: ${checks} PostgreSQL integration assertions (tenant isolation, version conflicts, rollback, tombstones, restart persistence).`);
}catch(err){console.error('FAIL:',err);process.exitCode=1;}finally{if(server)server.kill();}
