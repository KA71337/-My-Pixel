import 'server-only';
import { cookies } from 'next/headers';
import { token,hash,equal,credentialsReady,validateOrigin } from './security-core';
import { StorageError } from './storage';
import { redis,parseSession } from './auth-store';
type Session={csrf:string;expires:number};
const globalAuth=globalThis as unknown as {mpSessions?:Map<string,{value:string;expires:number}>;mpLimits?:Map<string,{count:number;until:number}>};
const memory=globalAuth.mpSessions??=new Map<string,{value:string;expires:number}>();
const isProduction=()=>process.env.NODE_ENV==='production'||!!process.env.VERCEL;

function sessionKey(v:string){return 'mypixel:session:'+hash(v+(process.env.SESSION_SECRET||''));}
export async function getSession(){if(!credentialsReady())return null;const v=(await cookies()).get('mp_session')?.value;if(!v||!/^[a-f0-9]{64}$/.test(v))return null;const key=sessionKey(v);let raw:string|null;if(process.env.UPSTASH_REDIS_REST_URL||isProduction())raw=await redis(['GET',key]);else{const entry=memory.get(key);raw=entry&&entry.expires>Date.now()?entry.value:null;}return raw?parseSession(raw):null;}
export async function requireSession(request?:Request){const s=await getSession();if(!s)throw new StorageError(401,'Giriş tələb olunur');if(request&&(!validateOrigin(request)||!equal(request.headers.get('x-csrf-token')||'',s.csrf)))throw new StorageError(403,'Sorğu təsdiqlənmədi');return s;}
export async function login(password:string){if(!credentialsReady())throw new StorageError(503,'Admin credentials are not configured');if(!equal(password,process.env.ADMIN_PASSWORD!))throw new StorageError(401,'Şifrə yanlışdır');const v=token(),session:Session={csrf:token(),expires:Date.now()+8*3600000};const key=sessionKey(v);if(process.env.UPSTASH_REDIS_REST_URL||isProduction())await redis(['SET',key,JSON.stringify(session),'EX',28800]);else memory.set(key,{value:JSON.stringify(session),expires:session.expires});(await cookies()).set('mp_session',v,{httpOnly:true,secure:isProduction(),sameSite:'strict',path:'/',maxAge:28800});return session;}
export async function logout(){const jar=await cookies(),v=jar.get('mp_session')?.value;if(v){if(process.env.UPSTASH_REDIS_REST_URL||isProduction())await redis(['DEL',sessionKey(v)]);else memory.delete(sessionKey(v));}jar.set('mp_session','',{httpOnly:true,secure:isProduction(),sameSite:'strict',path:'/',maxAge:0});}
const limits=globalAuth.mpLimits??=new Map<string,{count:number;until:number}>();
export async function throttle(request:Request){
 // Only trust Vercel's platform-populated forwarded address on Vercel; local uses one bucket.
 const ip=process.env.VERCEL?(request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim():'local';
 const keys=['mypixel:login:'+hash(ip),'mypixel:login:global'];
 for(const [i,key] of keys.entries()){let count:number;if(process.env.UPSTASH_REDIS_REST_URL||isProduction())count=await redis(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n",1,key]);else{const old=limits.get(key);const item=old&&old.until>Date.now()?old:{count:0,until:Date.now()+900000};count=++item.count;limits.set(key,item);}if(count>(i===0?10:100))throw new StorageError(429,'Çox sayda cəhd. 15 dəqiqə sonra yenidən cəhd edin.');}
}
