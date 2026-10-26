import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { readCatalog,writeCatalog,StorageError } from '@/lib/storage';
import { catalogSchema } from '@/lib/schema';
import { jsonBody,failure } from '@/lib/api';
export async function GET(){try{await requireSession();return NextResponse.json(await readCatalog(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function PUT(r:Request){try{await requireSession(r);const b=await jsonBody(r);const data=catalogSchema.parse(b.data);if(typeof b.revision!=='string')throw new StorageError(428,'Revision required');const revision=await writeCatalog(data,b.revision);return NextResponse.json({data,revision},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
