import { NextResponse } from 'next/server';
import { login,throttle } from '@/lib/auth';
import { validateOrigin } from '@/lib/security-core';
import { jsonBody,failure } from '@/lib/api';
import { StorageError } from '@/lib/storage';
export async function POST(r:Request){try{if(!validateOrigin(r))throw new StorageError(403,'Invalid origin');await throttle(r);const b=await jsonBody(r);if(typeof b.password!=='string'||b.password.length>256)throw new StorageError(400,'Invalid password');await login(b.password);return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
