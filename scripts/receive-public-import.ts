// The one-time loopback browser capture receiver has been removed after import.
// This file now only verifies the delivered local catalog and media, with no writes or network listener.
import { promises as fs } from 'node:fs';
import { catalogSchema } from '../src/lib/schema';
import sharp from 'sharp';
const catalog=catalogSchema.parse(JSON.parse(await fs.readFile('data/catalog.json','utf8')));
const refs=new Set([...catalog.products.flatMap(p=>p.images),catalog.settings.logo].filter(Boolean));
for(const ref of refs){if(!/^\/media\/[a-f0-9]{64}\.webp$/.test(ref))throw new Error('Invalid local media reference');const file='data'+ref;const m=await sharp(await fs.readFile(file)).metadata();if(m.format!=='webp')throw new Error('Invalid media '+ref);}
const logo=await sharp('public/brand/my-pixel-logo.webp').stats();if(!logo.channels[3]||logo.channels[3].min!==0||logo.channels[3].max!==255)throw new Error('Logo must retain transparent and opaque pixels');
console.log({products:catalog.products.length,photos:catalog.products.reduce((n,p)=>n+p.images.length,0),verifiedMedia:refs.size,missingImages:catalog.products.filter(p=>!p.images.length).map(p=>p.sourceId),transparentLogo:true});
