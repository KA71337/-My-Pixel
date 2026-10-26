import Link from 'next/link';
import { context,metadata,type Search } from '@/lib/public';
import { language,href } from '@/lib/i18n';
import { Shell,Empty } from '@/components/site';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<Search>}){return metadata(language((await searchParams).lang)==='az'?'Kateqoriyalar':'Категории','/categories',language((await searchParams).lang));}
export default async function Categories({searchParams}:{searchParams:Promise<Search>}){const {data,lang,t}=await context(searchParams),categories=data.categories.filter(c=>data.products.some(p=>p.categoryId===c.id));return <Shell data={data} lang={lang}><section className="page-title"><span className="eyebrow">MY PIXEL / CATEGORIES</span><h1>{t.categories}</h1></section><section className="section">{categories.length?<div className="category-grid">{categories.map((c,i)=><Link key={c.id} href={href('/catalog?category='+c.id,lang)}><span>0{i+1}</span><h2>{lang==='ru'&&c.nameRu?c.nameRu:c.name}</h2><p>{data.products.filter(p=>p.categoryId===c.id).length} {t.results} ↗</p></Link>)}</div>:<Empty lang={lang}/>}</section></Shell>;}
