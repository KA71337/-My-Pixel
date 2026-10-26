import { createHmac } from 'node:crypto';
import { StorageError } from './storage-core';
import { token,hash,equal } from './security-core';
export const SESSION_TTL=8*3600000;
export const LOGIN_WINDOW=15*60000;
export type Session={id:string;csrf:string;expires:number};

// Per-process only. Prune lazily on every operation; never evict live safeguards.
export class ExpiryMap<T> {
 private entries=new Map<string,{value:T;expires:number}>();
 constructor(readonly capacity:number,private now=Date.now){if(!Number.isSafeInteger(capacity)||capacity<1)throw new Error('Invalid capacity');}
 private prune(){const now=this.now();for(const [key,item] of this.entries)if(item.expires<=now)this.entries.delete(key);}
 get size(){this.prune();return this.entries.size;}
 get(key:string){this.prune();return this.entries.get(key)?.value;}
 set(key:string,value:T,expires:number){this.prune();if(expires<=this.now())return;if(!this.entries.has(key)&&this.entries.size>=this.capacity)throw new StorageError(429,'Çox sayda cəhd. Daha sonra yenidən cəhd edin.');this.entries.set(key,{value,expires});}
}
export class LocalAuthStore {
 readonly limits:ExpiryMap<{count:number;until:number}>;
 readonly revoked:ExpiryMap<boolean>;
 constructor(capacity=4096,private now=Date.now){this.limits=new ExpiryMap(capacity,now);this.revoked=new ExpiryMap(capacity,now);}
 throttle(address:string){
  const now=this.now();
  // Always charge the instance-wide bucket, including attempts blocked by the IP bucket.
  for(const [key,max] of [['global',100],['ip:'+hash(address),10]] as const){
   const item=this.limits.get(key)??{count:0,until:now+LOGIN_WINDOW};
   item.count=Math.min(item.count+1,max+1);this.limits.set(key,item,item.until);
   if(item.count>max)throw new StorageError(429,'Çox sayda cəhd. 15 dəqiqə sonra yenidən cəhd edin.');
  }
 }
 revoke(cookie:string,expires:number){this.revoked.set(hash(cookie),true,expires);}
 isRevoked(cookie:string){return this.revoked.get(hash(cookie))===true;}
}
const signature=(payload:string,secret:string)=>createHmac('sha256',secret).update('mypixel-session-v1.'+payload).digest('hex');
export function issueSession(secret:string,now=Date.now()){
 const session:Session={id:token(),csrf:token(),expires:now+SESSION_TTL};
 const payload=Buffer.from(JSON.stringify(session)).toString('base64url');
 return {session,cookie:payload+'.'+signature(payload,secret)};
}
export function readSession(cookie:string,secret:string,now=Date.now()):Session|null{
 try{
  if(cookie.length>1024)return null;
  const parts=cookie.split('.');if(parts.length!==2||! /^[A-Za-z0-9_-]+$/.test(parts[0])||! /^[a-f0-9]{64}$/.test(parts[1])||!equal(parts[1],signature(parts[0],secret)))return null;
  const s=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  return s&&typeof s.id==='string'&&/^[a-f0-9]{64}$/.test(s.id)&&typeof s.csrf==='string'&&/^[a-f0-9]{64}$/.test(s.csrf)&&Number.isSafeInteger(s.expires)&&s.expires>now&&s.expires<=now+SESSION_TTL?{id:s.id,csrf:s.csrf,expires:s.expires}:null;
 }catch{return null;}
}
