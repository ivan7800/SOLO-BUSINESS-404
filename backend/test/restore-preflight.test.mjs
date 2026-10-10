import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('restore rejects unset connection URL',()=>{
 const r=spawnSync('bash',['restore.sh','nonexistent.dump'],{cwd:new URL('..',import.meta.url),env:{PATH:process.env.PATH,CONFIRM_RESTORE:'RESTORE_TO_EMPTY_DATABASE'},encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/RESTORE_DATABASE_URL/);
});
test('restore rejects missing confirmation',()=>{
 const r=spawnSync('bash',['restore.sh','nonexistent.dump'],{cwd:new URL('..',import.meta.url),env:{PATH:process.env.PATH,RESTORE_DATABASE_URL:'postgresql://localhost/something'},encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/CONFIRM_RESTORE/);
});
