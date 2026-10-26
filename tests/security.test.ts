import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExpiryMap,LocalAuthStore,issueSession,readSession,SESSION_TTL,LOGIN_WINDOW } from '../src/lib/auth-store';
import { StorageError } from '../src/lib/storage-core';
import { validateOrigin,credentialsReady } from '../src/lib/security-core';
test('production origin fails closed when unset, invalid or HTTP',()=>{
 const before={VERCEL:process.env.VERCEL,NEXT_PUBLIC_SITE_URL:process.env.NEXT_PUBLIC_SITE_URL};
 process.env.VERCEL='1';
 try{const r=new Request('https://internal.invalid/api/admin/login',{headers:{Origin:'https://shop.invalid'}});
 for(const value of ['', 'invalid','http://shop.invalid']){process.env.NEXT_PUBLIC_SITE_URL=value;assert.equal(validateOrigin(r),false);}
 process.env.NEXT_PUBLIC_SITE_URL='https://shop.invalid';assert.equal(validateOrigin(r),true);
 assert.equal(validateOrigin(new Request(r,{headers:{Origin:'https://shop.invalid','sec-fetch-site':'cross-site'}})),false);
 }finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('production credentials and origin allow no-database setup but never weak-secret bypass',()=>{
 const keys=['VERCEL','ADMIN_PASSWORD','SESSION_SECRET','NEXT_PUBLIC_SITE_URL'];const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{process.env.VERCEL='1';process.env.ADMIN_PASSWORD='test-only-password-strong';process.env.SESSION_SECRET='test-only-session-secret-'.repeat(3);process.env.NEXT_PUBLIC_SITE_URL='https://shop.invalid';
 assert.equal(credentialsReady(),true);assert.equal(validateOrigin(new Request('https://internal.invalid/login',{headers:{Origin:'https://shop.invalid'}})),true);
 const {cookie}=issueSession(process.env.SESSION_SECRET);assert.ok(readSession(cookie,process.env.SESSION_SECRET));new LocalAuthStore().throttle('one');
 for(const key of ['ADMIN_PASSWORD','SESSION_SECRET']){const valid=process.env[key];process.env[key]='short';assert.equal(credentialsReady(),false);process.env[key]=valid;}
 }finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
const rateError=(e:unknown)=>e instanceof StorageError&&e.status===429;
test('signed sessions verify across independent instances, expire and reject tampering/rotation',()=>{
 const secret='test-only-session-secret-'.repeat(3),now=1000000;
 const {session,cookie}=issueSession(secret,now);
 assert.deepEqual(readSession(cookie,secret,now),session);
 assert.equal(readSession(cookie,secret,now+SESSION_TTL),null);
 assert.equal(readSession(cookie,secret+'rotated',now),null);
 const [payload,sig]=cookie.split('.');
 const altered=Buffer.from(JSON.stringify({...session,expires:session.expires+1000})).toString('base64url');
 for(const bad of ['', 'null','{}','invalid',cookie+'.extra',altered+'.'+sig,payload+'.'+'0'.repeat(64),'x'.repeat(1025)])assert.equal(readSession(bad,secret,now),null);
 assert.notEqual(issueSession(secret,now).cookie,cookie);
});
test('expiry maps prune expired entries and reject capacity without evicting live entries',()=>{
 let now=100;const map=new ExpiryMap<number>(2,()=>now);
 map.set('a',1,200);map.set('b',2,300);map.set('a',3,200);
 assert.throws(()=>map.set('c',4,400),rateError);assert.equal(map.get('a'),3);assert.equal(map.size,2);
 now=200;assert.equal(map.get('a'),undefined);map.set('c',4,400);assert.equal(map.size,2);
 now=400;assert.equal(map.size,0);
});
test('local throttling allows ten attempts, denies eleven and resets exactly at fixed expiry',()=>{
 let now=1000;const store=new LocalAuthStore(4096,()=>now);
 for(let i=0;i<10;i++)store.throttle('one');assert.throws(()=>store.throttle('one'),rateError);
 now+=LOGIN_WINDOW-1;assert.throws(()=>store.throttle('one'),rateError);
 now++;store.throttle('one');assert.equal(store.limits.size,2);
});
test('instance-wide budget limits rotated addresses and counts rejected attempts',()=>{
 const store=new LocalAuthStore();for(let i=0;i<100;i++)store.throttle('ip-'+i);
 assert.throws(()=>store.throttle('new-address'),rateError);
 const denied=new LocalAuthStore();for(let i=0;i<10;i++)denied.throttle('one');
 for(let i=0;i<90;i++)assert.throws(()=>denied.throttle('one'),rateError);
 assert.throws(()=>denied.throttle('other'),rateError);
});
test('local state remains bounded; logout replay denial expires and is not shared or durable',()=>{
 let now=1000;const store=new LocalAuthStore(2,()=>now);
 store.throttle('one');assert.throws(()=>store.throttle('two'),rateError);assert.equal(store.limits.size,2);
 store.revoke('cookie-a',2000);store.revoke('cookie-b',2000);assert.throws(()=>store.revoke('cookie-c',2000),rateError);
 assert.equal(store.isRevoked('cookie-a'),true);assert.equal(new LocalAuthStore().isRevoked('cookie-a'),false);
 now=2000;assert.equal(store.isRevoked('cookie-a'),false);assert.equal(store.revoked.size,0);
});
