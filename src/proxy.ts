import { NextRequest,NextResponse } from 'next/server';
export function proxy(request:NextRequest){const headers=new Headers(request.headers);headers.set('x-mp-language',request.nextUrl.pathname.startsWith('/admin')?'az':request.nextUrl.searchParams.get('lang')==='ru'?'ru':'az');return NextResponse.next({request:{headers}});}
export const config={matcher:['/((?!api|_next|media|icon.svg|robots.txt|sitemap.xml).*)']};
