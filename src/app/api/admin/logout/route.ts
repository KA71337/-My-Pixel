import { NextResponse } from 'next/server';
import { requireSession,logout } from '@/lib/auth';
import { failure } from '@/lib/api';
export async function POST(r:Request){try{await requireSession(r);await logout();return NextResponse.json({ok:true});}catch(e){return failure(e);}}
