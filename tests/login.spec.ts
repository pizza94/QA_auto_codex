import { test } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

test.describe('IRUDA login', () => {
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run login tests');

  test('logs in with a valid user', async ({ page }) => {
    await loginToIruda(page);
  });
});