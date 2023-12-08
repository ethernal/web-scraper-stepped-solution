import { expect, test } from '@playwright/test';

test('interface is present and working', async ({ page }) => {

  await page.goto('http://localhost:5173/?price_lte=80');

  await expect(page.getByText('Max Price:')).toBeVisible();

  await expect(page.getByText('Sort (by price)')).toBeVisible();

  await expect(page.getByText('Total Products:')).toBeVisible();

  await expect(page.getByLabel('Max Price:')).toBeVisible();

  await expect(page.locator('#root')).toContainText('Total Products: 258');

});


test('filtering limits or adds products', async ({ page }) => {

  await page.goto('http://localhost:5173/?price_lte=80');

  await expect(page.locator('#root')).toContainText('Total Products: 258');

  await page.getByLabel('Max Price:').fill('120');

  await expect(page.locator('#root')).toContainText('Total Products: 405');

});


test('sorting changes the order of products', async ({ page }) => {

  await page.goto('http://localhost:5173/?price_lte=80');

  await expect(page.getByTestId('product').first()).toContainText('Blastoise');

  await page.getByLabel('Sort (by price)').check();

  console.log(await page.getByTestId('product').first());

  await expect(page.getByTestId('product').first()).toContainText('Weedle');

  await expect(page.locator('div').filter({ hasText: /^Weedle£25$/ }).getByRole('paragraph')).toBeVisible();

  await page.locator('#sortOrder').selectOption('desc');

  await expect(page.getByRole('heading', { name: 'Silcoon' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Silcoon£80$/ }).getByRole('paragraph')).toBeVisible();
});

test('visual regressions', async ({ page }) => {

  await page.goto('http://localhost:5173/?price_lte=80');

	await expect(page).toHaveScreenshot('productFilter-with-price-80.png');

});


 test.describe('page mobile (w-280) screenshot', () => {

	test.use({ viewport: { width: 280, height: 1200 } });


	test('mobile view about page screenshot', async ({ page }) => {

		await page.goto('http://localhost:5173/?price_lte=80');

		await expect(page).toHaveScreenshot('mobile-280productFilter-with-price-80.png');

	});

});
