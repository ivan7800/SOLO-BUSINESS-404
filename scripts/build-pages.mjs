import {rm,mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await copyFile(new URL('index.html',root),new URL('index.html',out));
await cp(new URL('assets/',root),new URL('assets/',out),{recursive:true});
await writeFile(new URL('.nojekyll',out),'');
console.log('Pages: index.html + assets; sin backend, pruebas ni copias de datos.');
