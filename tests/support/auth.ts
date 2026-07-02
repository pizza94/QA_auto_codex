import { expect, Page } from '@playwright/test';

export const username = process.env.PLAYWRIGHT_USERNAME;
export const password = process.env.PLAYWRIGHT_PASSWORD;

export function skipWhenCredentialsMissing() {
  return !username || !password;
}

export async function loginToIruda(page: Page) {
  await page.goto('/iruda_woori/login');

  await page.locator('#usrId').fill(username!);
  await page.locator('#pswd').fill(password!);
  await page.locator('button.submit').click();

  await expect(page).not.toHaveURL(/\/iruda_woori\/login(?:$|[?#])/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Welcome to Data Portal/i })).toBeVisible({ timeout: 15_000 });
}