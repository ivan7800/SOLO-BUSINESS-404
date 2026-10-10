import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,validateSnapshot} from '../assets/js/store.js';
import {validSpanishTaxId} from '../assets/js/taxid.js';
const mem=()=>({getItem:()=>null,setItem:()=>{}});
const client=(name='Prueba')=>({name,company:'',email:'prueba@example.test',phone:'',nif:'12345678Z',type:'Particular',tags:'VIP, Soporte',notes:'Nota',contacts:JSON.stringify([{name:'Contacto',email:'c@example.test',phone:'600000000'}])});
test('NIF y NIE con checksum; CIF de ejemplo y datos inválidos',()=>{
 assert.equal(validSpanishTaxId('12345678Z'),true);
 assert.equal(validSpanishTaxId('12345678A'),false);
 assert.equal(validSpanishTaxId('X1234567L'),true);
 assert.equal(validSpanishTaxId('XYZ'),false);
 assert.equal(validSpanishTaxId(''),true);
});
test('Alta y edición conservan identidad y relaciones',()=>{
 const s=createStore(mem());const c=s.addClient(client());
 assert.deepEqual(c.tags,['VIP','Soporte']);assert.equal(c.contacts.length,1);
 s.addQuote({clientId:c.id,title:'Prueba',subtotal:20,tax:21});
 s.updateClient(c.id,{...client('Nombre editado'),tags:'VIP',contacts:'[]'});
 assert.equal(s.get().clients.find(x=>x.id===c.id).name,'Nombre editado');
 assert.equal(s.get().quotes.find(x=>x.clientId===c.id).clientId,c.id);
 assert.throws(()=>s.deleteClient(c.id),/Archívalo/);
 s.setClientStatus(c.id,'Archivado');
 assert.throws(()=>s.addJob({clientId:c.id,title:'Trabajo',hours:1,rate:10}),/activo/);
 s.setClientStatus(c.id,'Activo');
 assert.doesNotThrow(()=>validateSnapshot(s.get()));
});
test('Borrado de clientes sin vínculos y entradas inválidas',()=>{
 const s=createStore(mem());const c=s.addClient(client());s.deleteClient(c.id);
 assert.equal(s.get().clients.some(x=>x.id===c.id),false);
 assert.throws(()=>s.addClient({...client(),nif:'12345678A'}),/NIF/);
 assert.throws(()=>s.addClient({...client(),contacts:'{"a":1}'}),/Contactos/);
 assert.throws(()=>s.addClient({...client(),tags:Array(14).fill('a').join(',')}),/etiquetas/);
});
test('Snapshots previos sin nuevos campos mantienen compatibilidad',()=>{
 const s=createStore(mem());const snap=JSON.parse(JSON.stringify(s.get()));
 assert.doesNotThrow(()=>validateSnapshot(snap));
});
