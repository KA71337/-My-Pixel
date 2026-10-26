import {test, expect, type Page} from '@playwright/test';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('SVG arrows, catalog-only navigation and larger responsive hero', async ({page, request}) => {
  for (const lang of ['az', 'ru']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await page.goto('/?lang=' + lang);
      await expect(page.locator('header a[href^="/categories"], footer a[href^="/categories"]')).toHaveCount(0);
      expect(await page.locator('body').innerText()).not.toMatch(/[\u2197\u2192]/u);
      await expect(page.locator('.hero-actions svg')).toHaveCount(2);
      for (const icon of await page.locator('.hero-actions svg').all()) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
        await expect(icon).toHaveAttribute('focusable', 'false');
      }
      const sizes = await page.locator('.hero-copy').evaluate(element => ({
        width: element.getBoundingClientRect().width,
        heading: parseFloat(getComputedStyle(element.querySelector('h1')!).fontSize),
        paragraph: parseFloat(getComputedStyle(element.querySelector('p')!).fontSize),
        button: parseFloat(getComputedStyle(element.querySelector('.button')!).fontSize),
      }));
      expect(sizes.heading).toBeGreaterThanOrEqual(42);
      expect(sizes.paragraph).toBeGreaterThanOrEqual(17);
      expect(sizes.button).toBeGreaterThanOrEqual(15);
      const photo = await page.locator('.hero-photo').boundingBox();
      if (photo) {
        if (width > 600) expect(sizes.width).toBeGreaterThan(photo.width);
        else expect(photo.height).toBeLessThanOrEqual(230);
      }
      if (width < 850) {
        await page.getByRole('button', {name: lang === 'az' ? 'Menyu' : 'Меню'}).click();
        await expect(page.locator('#navigation')).toBeVisible();
        await expect(page.locator('#navigation a[href^="/categories"]')).toHaveCount(0);
      }
      await noOverflow(page);
    }
  }
  expect((await request.get('/categories')).status()).toBe(200);
});

test('category dropdown keyboard, pointer, all categories, query state and mobile', async ({page}) => {
  await page.goto('/admin/login');
  await page.waitForFunction(() => document.querySelector('form')?.getAttribute('data-hydrated') === 'true');
  await page.getByLabel('Şifrə').fill(process.env.MP_TEST_PASSWORD!);
  await page.getByRole('button', {name: 'Daxil ol'}).click();
  await expect(page).toHaveURL(/\/admin$/);
  const snapshot = await (await page.request.get('/api/admin/catalog')).json();
  const csrf = await page.evaluate(() => {
    for (const element of document.querySelectorAll('script')) {
      const match = element.textContent?.match(/\\?"csrf\\?":\\?"([a-f0-9]{64})/);
      if (match) return match[1];
    }
    return null;
  });
  expect(csrf).toBeTruthy();
  const headers = {Origin: 'http://127.0.0.1:3100', 'x-csrf-token': csrf!};
  const data = structuredClone(snapshot.data);
  data.categories.push({id: 'ui-empty', name: 'UI Empty', nameRu: 'UI Пустая'}, {id: 'ui-products', name: 'UI Phones', nameRu: 'UI Телефоны'});
  const now = new Date().toISOString();
  for (let index = 0; index < 13; index++) data.products.push({
    id: `ui-${index}`, slug: `ui-${index}`, name: `UI Phone ${index}`, description: '', price: 10 + index,
    currency: 'AZN', categoryId: 'ui-products', brand: 'UI', model: 'Phone', condition: '', availability: '',
    specifications: [], images: [], published: true, featured: false, sourceId: '', sourceUrl: '', createdAt: now, updatedAt: now,
  });
  const saved = await page.request.put('/api/admin/catalog', {headers, data: {data, revision: snapshot.revision}});
  expect(saved.status()).toBe(200);
  try {
    await page.goto('/catalog?lang=ru&q=UI&brand=UI&model=Phone&min=10&max=99&sort=low&page=2');
    const combo = page.getByRole('combobox', {name: /Категории/});
    await expect(page.locator('select[name="category"]')).toHaveCount(0);
    await combo.focus();
    await combo.press('ArrowDown');
    await expect(combo).toHaveAttribute('aria-expanded', 'true');
    await expect(combo).toBeFocused();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(data.categories.length + 1);
    await expect(page.getByRole('listbox').getByRole('option', {name: 'UI Пустая'})).toBeVisible();
    await combo.press('Home');
    await combo.press('ArrowUp');
    await expect(page.getByRole('listbox').getByRole('option', {name: 'UI Телефоны'})).toHaveClass('active');
    await combo.press('Home');
    await combo.press('u');
    await expect(page.getByRole('listbox').getByRole('option', {name: 'UI Пустая'})).toHaveClass('active');
    await combo.press('End');
    const active = await combo.getAttribute('aria-activedescendant');
    expect(await page.locator(`[id="${active}"]`).innerText()).toBe('UI Телефоны');
    await combo.press('Enter');
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
    await expect(combo).toBeFocused();
    await expect(page.locator('input[name="category"]')).toHaveValue('ui-products');
    await combo.click();
    await expect(page.getByRole('listbox').getByRole('option', {name: 'UI Телефоны'})).toHaveAttribute('aria-selected', 'true');
    await combo.press('Home');
    await combo.press('Escape');
    await expect(page.locator('input[name="category"]')).toHaveValue('ui-products');
    await combo.click();
    await page.locator('h1').click();
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
    await combo.focus();
    await combo.press('Space');
    await combo.press('Tab');
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
    await expect(combo).not.toBeFocused();
    await page.locator('.filters button[type="submit"], .filters > button.button').click();
    const query = new URL(page.url()).searchParams;
    for (const [key, value] of Object.entries({category:'ui-products', lang:'ru', q:'UI', brand:'UI', model:'Phone', min:'10', max:'99', sort:'low'})) expect(query.get(key)).toBe(value);
    expect(query.has('page')).toBe(false);
    await expect(page.locator('.product-card')).toHaveCount(12);
    await page.locator('.pagination a').last().click();
    expect(new URL(page.url()).searchParams.get('category')).toBe('ui-products');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await combo.click();
    await page.getByRole('listbox').getByRole('option', {name:'UI Пустая'}).click();
    await page.locator('.filters > button.button').click();
    await expect(page.locator('.product-card')).toHaveCount(0);
    for (const width of [320, 390, 600]) {
      await page.setViewportSize({width, height:844});
      await combo.click();
      await noOverflow(page);
      const option = page.getByRole('listbox').getByRole('option').first();
      expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await option.click();
      await expect(page.locator('input[name="category"]')).toHaveValue('');
      await expect(combo).toBeFocused();
    }
    await page.locator('.filters > button.button').click();
    expect(new URL(page.url()).searchParams.get('category')).toBe('');
    await page.locator('.filters > a').click();
    await expect(page.locator('input[name="category"]')).toHaveValue('');
    await expect(page.locator('input[name="q"]')).toHaveValue('');
  } finally {
    const current = await (await page.request.get('/api/admin/catalog')).json();
    expect((await page.request.put('/api/admin/catalog', {headers, data: {data:snapshot.data, revision:current.revision}})).status()).toBe(200);
  }
});
