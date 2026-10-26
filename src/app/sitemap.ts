import type { MetadataRoute } from 'next';
import { publicCatalog,site } from '@/lib/public';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const origin=site();if(!origin)return [];const c=await publicCatalog();return ['','/catalog','/categories','/services','/about','/contacts',...c.products.map(p=>'/product/'+p.slug)].map(path=>({url:origin+path,alternates:{languages:{az:origin+path,ru:origin+path+'?lang=ru'}}}));}
