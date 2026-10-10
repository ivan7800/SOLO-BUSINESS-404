import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../assets/js/store.js';
import {STORAGE_KEY} from '../assets/js/data.js';

test('modo remoto no sobrescribe copia local y vuelve al modo local explícitamente',()=>{
 const data=new Map();let writes=0;
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{writes++;data.set(k,v)}};
 const store=createStore(storage);
 store.addTask({title:'Copia local',priority:'Media'});
 const persisted=data.get(STORAGE_KEY);
 store.setLocalPersistence(false);
 assert.equal(store.isLocalPersistenceEnabled(),false);
 store.addTask({title:'Solo en memoria remota',priority:'Alta'});
 assert.equal(data.get(STORAGE_KEY),persisted);
 const original=JSON.parse(persisted);
 store.restore(original);
 assert.equal(data.get(STORAGE_KEY),persisted);
 store.setLocalPersistence(true);
 store.addTask({title:'Nuevo dato local',priority:'Baja'});
 assert.ok(writes>=2);
 assert.notEqual(data.get(STORAGE_KEY),persisted);
});
