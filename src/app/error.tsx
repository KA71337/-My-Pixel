'use client';
import { dictionaries,language } from '@/lib/i18n';
export default function ErrorPage({reset}:{reset:()=>void}){const lang=typeof window!=='undefined'?language(new URLSearchParams(window.location.search).get('lang')||undefined):'az',t=dictionaries[lang];return <main id="main" className="empty"><h1>{t.error}</h1><button className="button" onClick={reset}>{t.retry}</button></main>;}
