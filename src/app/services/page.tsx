import Link from 'next/link';
import { context,metadata,type Search } from '@/lib/public';
import { language,href } from '@/lib/i18n';
import { Shell,ContactBlock } from '@/components/site';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<Search>}){return metadata(language((await searchParams).lang)==='az'?'Servis':'Сервис','/services',language((await searchParams).lang));}
export default async function Services({searchParams}:{searchParams:Promise<Search>}){const {data,lang,t}=await context(searchParams);return <Shell data={data} lang={lang}><section className="page-title"><span className="eyebrow">MY PIXEL / SERVICE</span><h1>{t.service}</h1><p>{t.serviceText}</p></section><section className="section service-grid">{data.services.length?data.services.map((s,i)=><article className="service-card" key={s.id}>{s.image?<img src={s.image} alt={s.name}/>:<span className="service-icon" aria-hidden="true">0{i+1} / +</span>}<h2>{lang==='ru'&&s.nameRu?s.nameRu:s.name}</h2><p>{lang==='ru'&&s.descriptionRu?s.descriptionRu:s.description}</p><Link className="text-link" href={href('/contacts',lang)}>{t.contacts} ↗</Link></article>):<p>{t.noServices}</p>}</section><ContactBlock settings={data.settings} lang={lang}/></Shell>;}
