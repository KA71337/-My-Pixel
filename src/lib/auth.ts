import 'server-only';
import { cookies } from 'next/headers';
import { equal,credentialsReady,validateOrigin } from './security-core';
import { StorageError } from './storage';
import { LocalAuthStore,issueSession,readSession,SESSION_TTL } from './auth-store';
const globalAuth=globalThis as unknown as {mpLocalAuth?:LocalAuthStore};
const store=globalAuth.mpLocalAuth??=new LocalAuthStore();
const isProduction=()=>process.env.NODE_ENV==='production'||!!process.env.VERCEL;

export async function getSession(){
 if(!credentialsReady())return null;
 const v=(await cookies()).get('mp_session')?.value;
 if(!v||store.isRevoked(v))return null;
 return readSession(v,process.env.SESSION_SECRET!);
}
export async function requireSession(request?:Request){const s=await getSession();if(!s)throw new StorageError(401,'Giriş tələb olunur');if(request&&(!validateOrigin(request)||!equal(request.headers.get('x-csrf-token')||'',s.csrf)))throw new StorageError(403,'Sorğu təsdiqlənmədi');return s;}
export async function login(password:string){
 if(!credentialsReady())throw new StorageError(503,'Admin credentials are not configured');
 if(!equal(password,process.env.ADMIN_PASSWORD!))throw new StorageError(401,'Şifrə yanlışdır');
 const {session,cookie}=issueSession(process.env.SESSION_SECRET!);
 (await cookies()).set('mp_session',cookie,{httpOnly:true,secure:isProduction(),sameSite:'strict',path:'/',maxAge:SESSION_TTL/1000});return session;
}
export async function logout(){
 const jar=await cookies(),v=jar.get('mp_session')?.value;
 // Clearing the browser cookie is reliable; replay denial is instance-local only.
 try{if(v&&credentialsReady()){const s=readSession(v,process.env.SESSION_SECRET!);if(s)store.revoke(v,s.expires);}}
 finally{jar.set('mp_session','',{httpOnly:true,secure:isProduction(),sameSite:'strict',path:'/',maxAge:0});}
}
export async function throttle(request:Request){
 // Trust forwarded addresses only on Vercel. Other hosts share a single bucket.
 const ip=process.env.VERCEL?(request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,128):'local';
 try{store.throttle(ip||'unknown');}
 catch(e){
  // Normalize internal store errors across Next.js server bundle/module boundaries.
  if(e instanceof Error&&'status' in e&&e.status===429)throw new StorageError(429,'Çox sayda cəhd. 15 dəqiqə sonra yenidən cəhd edin.');
  throw e;
 }
}
