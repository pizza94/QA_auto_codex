import { expect, test } from '@playwright/test';

const username = process.env.PLAYWRIGHT_USERNAME;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe('IRUDA login', () => {
  test.skip(!username || !password, 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run login tests');

  test('logs in with a valid user', async ({ page }) => {
    await page.goto('/iruda_woori/login');

    await page.locator('#usrId').fill(username!);
    await page.locator('#pswd').fill(password!);
    await page.locator('button.submit').click();

    await expect(page).not.toHaveURL(/\/iruda_woori\/login(?:$|[?#])/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /Welcome to Data Portal/i })).toBeVisible({ timeout: 15_000 });
  });
});
