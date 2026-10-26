import { randomBytes,createHash,timingSafeEqual } from 'node:crypto';
export const token=()=>randomBytes(32).toString('hex');
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export function equal(a:string,b:string){return timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));}
export function validateOrigin(request:Request){try{const origin=request.headers.get('origin');const configured=process.env.NEXT_PUBLIC_SITE_URL;const production=process.env.NODE_ENV==='production'||!!process.env.VERCEL;if(production&&!configured)return false;const expected=new URL(configured||request.url);if(!/^https?:$/.test(expected.protocol)||(production&&expected.protocol!=='https:'))return false;return origin===expected.origin&&request.headers.get('sec-fetch-site')!=='cross-site';}catch{return false;}}
export function credentialsReady(){return (process.env.ADMIN_PASSWORD?.length||0)>=16&&(process.env.SESSION_SECRET?.length||0)>=32;}
