import { context,metadata,type Search } from '@/lib/public';
import { language } from '@/lib/i18n';
import { Shell,ContactBlock } from '@/components/site';
export const dynamic='force-dynamic';
export async function generateMetadata({searchParams}:{searchParams:Promise<Search>}){return metadata(language((await searchParams).lang)==='az'?'Haqqımızda':'О нас','/about',language((await searchParams).lang));}
export default async function About({searchParams}:{searchParams:Promise<Search>}){const {data,lang,t}=await context(searchParams);return <Shell data={data} lang={lang}><section className="page-title"><span className="eyebrow">MY PIXEL / {data.settings.since}</span><h1>{t.about}</h1><p>{data.settings.slogan}</p></section><section className="section about-story"><div className="year">{data.settings.since}<span>BAKI / MY PIXEL</span></div><div><h2>{t.since}</h2><p>{t.aboutText}</p><p>{t.serviceText}</p></div></section><ContactBlock settings={data.settings} lang={lang}/></Shell>;}
