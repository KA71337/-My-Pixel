import { promises as fs } from 'node:fs';
import path from 'node:path';
import { normalizeImage } from '../src/lib/uploads';
import { readCatalog,writeCatalog,saveImage } from '../src/lib/storage-core';
import { parseCSV,normalizeCSVRows,mergeOwnerRows } from '../src/lib/import-core';
// Authorized owner export import. Public shop captures are documented separately; no challenge bypass.
const file=process.argv[2],imageRoot=process.argv[3];
if(!file||!process.argv.includes('--owner-authorized'))throw new Error('Usage: npm run import -- owner.json ./owner-images --owner-authorized [--apply]. Supply only owned/licensed data.');
const raw=(await fs.readFile(file,'utf8')).replace(/^\uFEFF/,'');const rows:Record<string,unknown>[]=/\.csv$/i.test(file)?normalizeCSVRows(parseCSV(raw)):JSON.parse(raw);if(!Array.isArray(rows)||rows.length>5000)throw new Error('Expected up to 5000 rows');const snapshot=await readCatalog();
const cleaned:Record<string,unknown>[]=[];const errors:string[]=[];let photos=0;
for(const [i,row] of rows.entries()){try{const {imageFiles,...rest}=row;if(imageFiles!==undefined){if(!imageRoot||!Array.isArray(imageFiles)||imageFiles.length>20)throw new Error('imageFiles requires original image directory; max 20');const images:string[]=[];for(const relative of imageFiles){if(typeof relative!=='string'||path.isAbsolute(relative))throw new Error('Relative image path required');const root=await fs.realpath(imageRoot),resolved=await fs.realpath(path.resolve(root,relative));if(!resolved.startsWith(root+path.sep))throw new Error('Image escapes root');const normalized=await normalizeImage(await fs.readFile(resolved));const image=process.argv.includes('--apply')?await saveImage(normalized):'/media/'+(await import('../src/lib/storage-core')).digest(normalized)+'.webp';images.push(image);photos++;}rest.images=images;}cleaned.push(rest);}catch(e){errors.push(`Row ${i+1}: ${(e as Error).message}`);}}
const result=mergeOwnerRows(snapshot.data,cleaned);result.report.photos=photos;result.report.found=rows.length;result.report.errors.push(...errors);
await fs.mkdir('docs',{recursive:true});await fs.writeFile('docs/last-import-report.json',JSON.stringify({...result.report,applied:process.argv.includes('--apply')},null,2));if(process.argv.includes('--apply'))await writeCatalog(result.catalog,snapshot.revision);console.log(JSON.stringify({...result.report,applied:process.argv.includes('--apply')},null,2));
