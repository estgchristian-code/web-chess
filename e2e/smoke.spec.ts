import { expect, test } from '@playwright/test';

test('exibe a tela inicial provisória', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dois jogadores');
  await expect(page.getByRole('button', { name: 'Nova partida' })).toBeDisabled();
});

test('não provoca rolagem horizontal', async ({ page }) => {
  await page.goto('/');

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );

  expect(hasHorizontalOverflow).toBe(false);
});
