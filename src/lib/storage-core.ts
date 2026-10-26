import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { catalogSchema, type Catalog } from './schema';
export class StorageError extends Error {constructor(public status:number,message:string){super(message);}}
export const digest=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
export function safeRepoPath(value:string){if(!/^[a-zA-Z0-9_./-]+$/.test(value)||value.split('/').some(p=>!p||p==='.'||p==='..'))throw new StorageError(503,'Invalid storage path');return value;}
export function githubConfig(){const owner=process.env.GITHUB_OWNER||'KA71337',repo=process.env.GITHUB_REPO||'-My-Pixel';if(!/^[\w-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))throw new StorageError(503,'Invalid repository');return {owner,repo,branch:process.env.GITHUB_BRANCH||'main',file:safeRepoPath(process.env.GITHUB_CATALOG_PATH||'data/catalog.json')};}
export async function githubRequest(file:string,init:RequestInit={},fetcher:typeof fetch=fetch){
 const c=githubConfig();if(!process.env.GITHUB_TOKEN)throw new StorageError(503,'GitHub storage is not configured');
 const r=await fetcher(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${safeRepoPath(file).split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(c.branch)}`,{...init,cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json',...init.headers}});
 if(!r.ok)throw new StorageError(r.status===409||r.status===422?409:r.status===404?404:503,r.status===409||r.status===422?'Storage changed. Reload before saving.':'Storage request failed');return r.json();
}
const localDir=()=>path.resolve(/* turbopackIgnore: true */ process.env.LOCAL_DATA_DIR||'.local');
let queue:Promise<unknown>=Promise.resolve();
async function serialized<T>(fn:()=>Promise<T>):Promise<T>{const p=queue.then(fn,fn);queue=p.catch(()=>{});return p;}
export function mode(){const m=process.env.STORAGE_MODE||'local';if(!['local','github'].includes(m))throw new StorageError(503,'Invalid storage mode');if(process.env.VERCEL&&m!=='github')throw new StorageError(503,'Use GitHub storage in production');return m;}
export async function readCatalog(fetcher:typeof fetch=fetch):Promise<{data:Catalog;revision:string}>{
 if(mode()==='github'){const r=await githubRequest(githubConfig().file,{},fetcher);if(r.encoding!=='base64'||typeof r.content!=='string')throw new StorageError(503,'Unsupported storage response');return {data:catalogSchema.parse(JSON.parse(Buffer.from(r.content,'base64').toString('utf8'))),revision:r.sha};}
 let raw:string;try{raw=await fs.readFile(path.join(localDir(),'catalog.json'),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;raw=await fs.readFile(path.resolve('data/catalog.json'),'utf8');}return {data:catalogSchema.parse(JSON.parse(raw)),revision:digest(raw)};
}
export async function writeCatalog(data:Catalog,revision:string,fetcher:typeof fetch=fetch){
 catalogSchema.parse(data);if(!revision)throw new StorageError(428,'Revision required');const raw=JSON.stringify(data,null,2)+'\n';if(Buffer.byteLength(raw)>900000)throw new StorageError(413,'Catalog exceeds 900 KB storage limit');
 if(mode()==='github'){const r=await githubRequest(githubConfig().file,{method:'PUT',body:JSON.stringify({message:'Update My Pixel catalog',branch:githubConfig().branch,sha:revision,content:Buffer.from(raw).toString('base64')})},fetcher);return r.content.sha as string;}
 return serialized(async()=>{const current=await readCatalog();if(current.revision!==revision)throw new StorageError(409,'Storage changed. Reload before saving.');await fs.mkdir(localDir(),{recursive:true});const tmp=path.join(localDir(),randomUUID()+'.tmp');await fs.writeFile(tmp,raw);await fs.rename(tmp,path.join(localDir(),'catalog.json'));return digest(raw);});
}
export async function saveImage(buffer:Buffer){const hash=digest(buffer),name=hash+'.webp';if(mode()==='github'){const file='data/media/'+name;try{await githubRequest(file);return '/media/'+name;}catch(e){if(!(e instanceof StorageError)||e.status!==404)throw e;}await githubRequest(file,{method:'PUT',body:JSON.stringify({message:'Upload My Pixel image',branch:githubConfig().branch,content:buffer.toString('base64')})});}else{await fs.mkdir(path.join(localDir(),'media'),{recursive:true});await fs.writeFile(path.join(localDir(),'media',name),buffer);}return '/media/'+name;}
export async function readImage(name:string){if(!/^[a-f0-9]{64}\.webp$/.test(name))throw new StorageError(404,'Not found');if(mode()==='github'){const r=await githubRequest('data/media/'+name);return Buffer.from(r.content,'base64');}try{return await fs.readFile(path.join(localDir(),'media',name));}catch{try{return await fs.readFile(path.resolve('data/media',name));}catch{throw new StorageError(404,'Not found');}}}
