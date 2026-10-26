import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { normalizeImage } from '@/lib/uploads';
import { saveImage,StorageError } from '@/lib/storage';
import { failure } from '@/lib/api';
export async function POST(r:Request){try{await requireSession(r);if(!r.headers.get('content-type')?.startsWith('image/'))throw new StorageError(415,'Send an image');const reader=r.body?.getReader();if(!reader)throw new StorageError(400,'Image required');const chunks:Buffer[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024){await reader.cancel();throw new StorageError(413,'Maximum 4 MB');}chunks.push(Buffer.from(value));}const normalized=await normalizeImage(Buffer.concat(chunks));return NextResponse.json({path:await saveImage(normalized)});}catch(e){return failure(e);}}
