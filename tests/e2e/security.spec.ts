import { test,expect } from '@playwright/test';
const origin='http://127.0.0.1:3100';
test('all admin paths and APIs deny anonymous access; signed cookies persist and local logout rejects replay in the test instance',async({page,browser,request})=>{
 for(const path of ['/admin','/admin/products','/admin/categories','/admin/services','/admin/settings','/admin/images','/admin/unknown/nested']){await page.goto(path);await expect(page).toHaveURL(/\/admin\/login$/);}
 expect((await request.get('/api/admin/catalog')).status()).toBe(401);
 for(const path of ['/api/admin/upload','/api/admin/logout'])expect((await request.post(path,{headers:{Origin:origin}})).status()).toBe(401);
 expect((await request.put('/api/admin/catalog',{headers:{Origin:origin},data:{}})).status()).toBe(401);
 await page.goto('/admin/login');await page.waitForFunction(()=>document.querySelector('form')?.getAttribute('data-hydrated')==='true');
 await page.getByLabel('Şifrə').fill(process.env.MP_TEST_PASSWORD!);await page.getByRole('button',{name:'Daxil ol'}).click();await expect(page).toHaveURL(/\/admin$/);
 const cookies=await page.context().cookies();const session=cookies.find(c=>c.name==='mp_session')!;expect(session.httpOnly).toBe(true);expect(session.sameSite).toBe('Strict');expect(session.expires).toBeGreaterThan(Date.now()/1000+28000);
 const second=await browser.newContext({storageState:await page.context().storageState()});const tab=await second.newPage();await tab.goto(origin+'/admin/products');await expect(tab).toHaveURL(/\/admin\/products$/);expect((await second.request.get(origin+'/api/admin/catalog')).status()).toBe(200);
 const csrf=await page.evaluate(()=>{for(const script of document.querySelectorAll('script')){const match=script.textContent?.match(/\\?"csrf\\?":\\?"([a-f0-9]{64})/);if(match)return match[1];}return null;});expect(csrf).toBeTruthy();
 for(const headers of [{Origin:origin,'x-csrf-token':'invalid'},{Origin:'https://evil.invalid','x-csrf-token':csrf!},{'x-csrf-token':csrf!}] as Record<string,string>[])expect((await page.request.post('/api/admin/logout',{headers})).status()).toBe(403);
 for(const value of ['null','[]','"invalid"'])expect((await page.request.put('/api/admin/catalog',{headers:{Origin:origin,'x-csrf-token':csrf!,'Content-Type':'application/json'},data:value})).status()).toBe(400);
 expect((await page.request.post('/api/admin/logout',{headers:{Origin:origin,'x-csrf-token':csrf!}})).status()).toBe(200);
 expect((await second.request.get(origin+'/api/admin/catalog')).status()).toBe(401);await tab.reload();await expect(tab).toHaveURL(/\/admin\/login$/);await second.close();
});
