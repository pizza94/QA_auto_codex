import { expect, test } from '@playwright/test';

test('loads a browser and verifies page content', async ({ page }) => {
  await page.setContent(`
    <main>
      <h1>QA Auto Codex</h1>
      <button type="button">Run automation</button>
    </main>
  `);

  await expect(page.getByRole('heading', { name: 'QA Auto Codex' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run automation' })).toBeEnabled();
});
