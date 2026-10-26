import { StorageError } from './storage-core';
// Imported only by server authentication. The injectable transport is for unit tests.
export async function redis(command:(string|number)[],fetcher:typeof fetch=fetch){
 const url=process.env.UPSTASH_REDIS_REST_URL,key=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!key)throw new StorageError(503,'Durable session storage is required');
 try{
  if(new URL(url).protocol!=='https:')throw new Error('TLS required');
  const response=await fetcher(url,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(command),cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Unavailable');
  const body=await response.json();
  if(!body||body.error||!Object.hasOwn(body,'result'))throw new Error('Invalid response');
  const value=body.result,op=command[0];
  if(op==='SET'&&value!=='OK'||op==='GET'&&value!==null&&typeof value!=='string'||(op==='DEL'||op==='EVAL')&&(!Number.isSafeInteger(value)||value<0))throw new Error('Invalid result');
  return value;
 }catch{throw new StorageError(503,'Session service unavailable');}
}
export function parseSession(raw:string){try{const s=JSON.parse(raw);return s&&typeof s.csrf==='string'&&/^[a-f0-9]{64}$/.test(s.csrf)&&Number.isSafeInteger(s.expires)&&s.expires>Date.now()?{csrf:s.csrf as string,expires:s.expires as number}:null;}catch{return null;}}
