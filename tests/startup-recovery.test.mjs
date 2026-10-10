import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../assets/js/store.js';
import {STORAGE_KEY,seedData} from '../assets/js/data.js';

test('Datos JSON dañados permanecen intactos hasta restauración explícita',()=>{
 const db=new Map([[STORAGE_KEY,'{malformed']]);let writes=0;
 const storage={getItem:k=>db.get(k)||null,setItem(k,v){writes++;db.set(k,v);}};
 const store=createStore(storage);
 assert.equal(store.isRecoveryRequired(),true);
 assert.equal(store.getDamagedOriginal(),'{malformed');
 store.addTask({title:'Temporal'});
 assert.equal(writes,0);
 assert.equal(db.get(STORAGE_KEY),'{malformed');
 store.restore(seedData());
 assert.equal(store.isRecoveryRequired(),false);
 assert.ok(writes>0);
 assert.notEqual(db.get(STORAGE_KEY),'{malformed');
});
test('Error leyendo storage bloquea escritura automática',()=>{
 let writes=0;
 const store=createStore({getItem(){throw Error('SecurityError')},setItem(){writes++;}});
 store.addTask({title:'Temporal'});
 assert.equal(writes,0);
 assert.match(store.getPersistenceError(),/SecurityError/);
});
