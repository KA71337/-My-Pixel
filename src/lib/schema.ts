import { z } from 'zod';
const text = z.string().trim().max(500);
export const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export const imagePath = z.string().regex(/^\/media\/[a-f0-9]{64}\.webp$/);
export const productSchema = z.object({
  id, slug: id, name: text.min(1), description: z.string().max(20000).default(''),
  price: z.number().finite().nonnegative().max(10000000).nullable().default(null), currency: z.literal('AZN').default('AZN'),
  categoryId: z.string().max(100).default(''), brand: text.default(''), model: text.default(''), condition: text.default(''), availability: text.default(''),
  specifications: z.array(z.object({key:text.min(1), value:text.min(1)})).max(100).default([]),
  images: z.array(imagePath).max(20).default([]), published:z.boolean().default(false), featured:z.boolean().default(false),
  sourceId:z.string().regex(/^\d*$/).default(''), sourceUrl:z.string().max(1000).refine(v=>!v||/^https:\/\/tap\.az\/elanlar\/[a-z0-9/-]+$/.test(v)).default(''),
  createdAt:z.string().datetime(), updatedAt:z.string().datetime()
}).strict();
export const categorySchema = z.object({id,name:text.min(1),nameRu:text.default('')}).strict();
export const serviceSchema = z.object({id,name:text.min(1),nameRu:text.default(''),description:z.string().max(5000),descriptionRu:z.string().max(5000).default(''),image:z.union([imagePath,z.literal('')]).default(''),published:z.boolean().default(true)}).strict();
const link=z.string().max(1000).refine(v=>!v||/^https:\/\//.test(v));
export const settingsSchema=z.object({name:z.literal('My Pixel'),slogan:text,address:text,phones:z.array(z.string().regex(/^[+()\d -]{7,30}$/)).max(5),hours:text,hoursRu:text,whatsapp:z.string().regex(/^\+?\d{7,15}$|^$/),socials:z.array(z.object({name:text,url:link})).max(10),latitude:z.number().min(-90).max(90).nullable(),longitude:z.number().min(-180).max(180).nullable(),since:z.number().int().min(1900).max(2100),logo:z.union([imagePath,z.literal('')]),cover:z.union([imagePath,z.literal('')])}).strict();
export const catalogSchema=z.object({version:z.literal(1),products:z.array(productSchema).max(5000),categories:z.array(categorySchema).max(200),services:z.array(serviceSchema).max(200),settings:settingsSchema}).strict().superRefine((c,ctx)=>{
  for(const kind of ['products','categories','services'] as const){const ids=c[kind].map(x=>x.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Duplicate IDs',path:[kind]});}
  const slugs=c.products.map(x=>x.slug);if(new Set(slugs).size!==slugs.length)ctx.addIssue({code:'custom',message:'Duplicate slugs',path:['products']});
  const sources=c.products.map(x=>x.sourceId).filter(Boolean);if(new Set(sources).size!==sources.length)ctx.addIssue({code:'custom',message:'Duplicate source IDs',path:['products']});
  for(const p of c.products)if(p.categoryId&&!c.categories.some(x=>x.id===p.categoryId))ctx.addIssue({code:'custom',message:'Unknown category',path:['products']});
});
export type Product=z.infer<typeof productSchema>;
export type Catalog=z.infer<typeof catalogSchema>;
export type Settings=Catalog['settings'];
export type Collection='products'|'categories'|'services';
