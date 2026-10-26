import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login';
export default async function Login(){try{if(await getSession())redirect('/admin');}catch(e){if(e instanceof Error&&e.message.startsWith('NEXT_REDIRECT'))throw e;}return <main id="main" className="login-page"><a className="brand" href="/">my<span>pixel</span></a><div className="login-card"><span className="eyebrow">MY PIXEL / ADMIN</span><h1>İdarəetmə paneli</h1><LoginForm/></div></main>;}
