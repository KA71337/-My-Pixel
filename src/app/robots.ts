import type { MetadataRoute } from 'next';
import { site } from '@/lib/public';
export default function robots():MetadataRoute.Robots {return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/']},...(site()?{sitemap:site()+'/sitemap.xml'}:{})};}
