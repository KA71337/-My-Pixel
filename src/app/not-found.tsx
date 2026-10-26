import Link from 'next/link';
import { Icon } from '@/components/icon';
export default function NotFound(){return <main id="main" className="empty"><span className="eyebrow">MY PIXEL / 404</span><h1>Səhifə tapılmadı</h1><Link className="button" href="/catalog">Kataloqa qayıt <Icon/></Link></main>;}
