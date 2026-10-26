import type { Metadata } from 'next';
import './globals.css';
import { headers } from 'next/headers';
export const metadata:Metadata={title:'My Pixel',description:'My Pixel — telefonlar, aksesuarlar, elektronika və öz servis xidməti. Bakı.',icons:{icon:'/icon.svg'}};
export default async function RootLayout({children}:{children:React.ReactNode}){const lang=(await headers()).get('x-mp-language')==='ru'?'ru':'az';return <html lang={lang} data-scroll-behavior="smooth"><body><a className="skip" href="#main">{lang==='ru'?'Перейти к содержимому':'Əsas məzmuna keç'}</a>{children}</body></html>;}
