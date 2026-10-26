import { getSession } from '@/lib/auth';
import { redirect,notFound } from 'next/navigation';
import { readCatalog } from '@/lib/storage';
import { Admin } from '@/components/admin';
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}){const session=await getSession();if(!session)redirect('/admin/login');const section=(await params).section?.join('/')||'dashboard';if(!['dashboard','products','categories','services','settings','images'].includes(section))notFound();const {data,revision}=await readCatalog();return <Admin initial={data} revision={revision} csrf={session.csrf} section={section}/>;}
