import { expect, test } from '@playwright/test';

test('interface is present and working', async ({ page }) => {
	await page.goto('http://localhost:5173/?price_lte=80');
	await expect(page.getByText('Max Price:')).toBeVisible();
	await expect(page.getByText('Sort (by price)')).toBeVisible();
	await expect(page.getByText('Total Products:')).toBeVisible();
	await expect(page.getByLabel('Max Price:')).toBeVisible();
	await expect(page.locator('#root')).toContainText('Total Products: 258');
});

test('increasing price limits adds products', async ({ page }) => {
	let numberOfInitialProducts = 0;
	let numberOfProductsAfterPriceChange = -1;
	await page.goto('http://localhost:5173/?price_lte=80');

	const totalProductsInitial = await page
		.getByText('Total Products: ')
		.textContent();

	test.fail(
		totalProductsInitial === null,
		'Total products label not found for initial count.',
	);

	numberOfInitialProducts = Number.parseInt(
		totalProductsInitial?.replace('Total Products:', '').trim(),
	);

	await page.getByLabel('Max Price:').fill('120');
	// removing these expect statements fails the test - it's too fast
	await expect(page.locator('#root')).not.toContainText(
		`Total Products: ${numberOfInitialProducts}`,
	);

	const totalProductsAfterPriceChange = await page
		.getByText('Total Products:')
		.textContent();

	test.fail(
		totalProductsAfterPriceChange === null,
		'Total products label not found after price change.',
	);

	numberOfProductsAfterPriceChange = Number.parseInt(
		totalProductsAfterPriceChange.replace('Total Products: ', '').trim(),
	);

	expect(numberOfProductsAfterPriceChange).toBeGreaterThan(
		numberOfInitialProducts,
	);
});

test('sorting changes the order of products', async ({ page }) => {
	await page.goto('http://localhost:5173/?price_lte=80');

	await expect(page.getByTestId('product').first()).toContainText('Blastoise');

	await page.getByLabel('Sort (by price)').check();

	console.log(await page.getByTestId('product').first());

	await expect(page.getByTestId('product').first()).toContainText('Weedle');

	await expect(
		page
			.locator('div')
			.filter({ hasText: /^Weedle£25$/ })
			.getByRole('paragraph'),
	).toBeVisible();

	await page.locator('#sortOrder').selectOption('desc');

	await expect(page.getByRole('heading', { name: 'Silcoon' })).toBeVisible();
	await expect(
		page
			.locator('div')
			.filter({ hasText: /^Silcoon£80$/ })
			.getByRole('paragraph'),
	).toBeVisible();
});

test('visual regressions', async ({ page }) => {
	await page.goto('http://localhost:5173/?price_lte=80');

	await expect(page).toHaveScreenshot('productFilter-with-price-80.png');
});

test.describe('page mobile (w-280) screenshot', () => {
	test.use({ viewport: { width: 280, height: 1200 } });

	test('mobile view about page screenshot', async ({ page }) => {
		await page.goto('http://localhost:5173/?price_lte=80');

		await expect(page).toHaveScreenshot(
			'mobile-280productFilter-with-price-80.png',
		);
	});
});
