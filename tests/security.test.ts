import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redis,parseSession } from '../src/lib/auth-store';
import { StorageError } from '../src/lib/storage-core';
import { validateOrigin } from '../src/lib/security-core';
test('production origin fails closed when unset, invalid or HTTP',()=>{
 const before={VERCEL:process.env.VERCEL,NEXT_PUBLIC_SITE_URL:process.env.NEXT_PUBLIC_SITE_URL};
 process.env.VERCEL='1';
 try{const r=new Request('https://internal.invalid/api/admin/login',{headers:{Origin:'https://shop.invalid'}});
 for(const value of ['', 'invalid','http://shop.invalid']){process.env.NEXT_PUBLIC_SITE_URL=value;assert.equal(validateOrigin(r),false);}
 process.env.NEXT_PUBLIC_SITE_URL='https://shop.invalid';assert.equal(validateOrigin(r),true);
 assert.equal(validateOrigin(new Request(r,{headers:{Origin:'https://shop.invalid','sec-fetch-site':'cross-site'}})),false);
 }finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('Redis transport persists session with TTL and validates results; outage fails closed (mock only)',async()=>{
 const before={UPSTASH_REDIS_REST_URL:process.env.UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN:process.env.UPSTASH_REDIS_REST_TOKEN};
 process.env.UPSTASH_REDIS_REST_URL='https://redis.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test-only';
 const state=new Map<string,string>();let ttl=0;
 const mock=(async(_url,init)=>{assert.equal(init?.cache,'no-store');const c=JSON.parse(String(init?.body));let result:unknown=null;
 if(c[0]==='SET'){state.set(c[1],c[2]);ttl=c[4];result='OK';}if(c[0]==='GET')result=state.get(c[1])??null;if(c[0]==='DEL'){result=state.delete(c[1])?1:0;}
 return Response.json({result});}) as typeof fetch;
 try{const raw=JSON.stringify({csrf:'a'.repeat(64),expires:Date.now()+28800000});await redis(['SET','key',raw,'EX',28800],mock);assert.equal(ttl,28800);
 assert.equal(await redis(['GET','key'],mock),raw);assert.ok(parseSession(raw));await redis(['DEL','key'],mock);assert.equal(await redis(['GET','key'],mock),null);
 for(const [op,result] of [['SET',null],['EVAL',null],['EVAL','11'],['GET',{}],['DEL',-1]])await assert.rejects(redis([String(op)],(async()=>Response.json({result})) as typeof fetch),e=>e instanceof StorageError&&e.status===503);
 await assert.rejects(redis(['GET','key'],(async()=>{throw new Error('test outage');}) as typeof fetch),e=>e instanceof StorageError&&e.status===503);
 }finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('malformed, expired or invalid session data cannot authenticate',()=>{for(const raw of ['null','{}','invalid',JSON.stringify({csrf:'wrong',expires:Date.now()+10000}),JSON.stringify({csrf:'a'.repeat(64),expires:1})])assert.equal(parseSession(raw),null);});
