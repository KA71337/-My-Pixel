import 'server-only';
import { readCatalog } from './storage';
import { language,dictionaries,type Lang } from './i18n';
import type { Metadata } from 'next';
export const site=()=>{const v=process.env.NEXT_PUBLIC_SITE_URL;if(!v)return undefined;try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.origin:undefined;}catch{return undefined;}};
export async function publicCatalog(){const c=(await readCatalog()).data;return {...c,products:c.products.filter(p=>p.published),services:c.services.filter(s=>s.published)};}
export type Search=Record<string,string|string[]|undefined>;
export async function context(searchParams?:Promise<Search>){const query=await searchParams||{};const lang=language(query.lang);return {query,lang,t:dictionaries[lang],data:await publicCatalog()};}
export function metadata(title:string,path:string,lang:Lang='az',description?:string):Metadata{const origin=site();const canonical=origin?origin+path+(lang==='ru'?'?lang=ru':''):undefined;return {title:title+' | My Pixel',description:description||dictionaries[lang].intro,alternates:origin?{canonical,languages:{az:origin+path,ru:origin+path+'?lang=ru'}}:undefined,openGraph:{title:title+' | My Pixel',description:description||dictionaries[lang].intro,type:'website',locale:lang==='az'?'az_AZ':'ru_RU',...(canonical?{url:canonical}:{})}};}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
