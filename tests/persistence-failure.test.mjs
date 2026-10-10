import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../assets/js/store.js';

test('No se oculta una escritura local fallida y se recupera el estado del error',()=>{
 let fail=true;
 const db=new Map();
 const store=createStore({getItem:k=>db.get(k)||null,setItem(k,v){if(fail)throw new Error('QuotaExceededError');db.set(k,v);}});
 store.addTask({title:'Ejemplo',priority:'Alta'});
 assert.match(store.getPersistenceError(),/QuotaExceededError/);
 fail=false;
 store.addTask({title:'Reintento',priority:'Media'});
 assert.equal(store.getPersistenceError(),null);
 assert.ok(db.size>0);
});
test('No intenta persistencia local durante modo remoto',()=>{
 let writes=0;
 const store=createStore({getItem:()=>null,setItem(){writes++;throw Error('blocked');}});
 store.setLocalPersistence(false);
 store.addTask({title:'Remota',priority:'Baja'});
 assert.equal(writes,0);
 assert.equal(store.getPersistenceError(),null);
});
