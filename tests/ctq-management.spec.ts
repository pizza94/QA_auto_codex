import { expect, Page, test } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

const ctqPagePath = '/quality_woori/main#ctq';
const requiredLabels = ['CTQ명', 'CTQ 설명'];

function runSuffix() {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
}

function exactTextMatcher(text: string) {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

async function gotoCtqManagement(page: Page) {
  await loginToIruda(page);
  await page.goto(ctqPagePath);
  await expect(page).toHaveURL(/\/quality_woori\/main#ctq/, { timeout: 20_000 });
  await expect(page.locator('#ctqRegion')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#newCtqButton')).toBeVisible();
}

async function clickAndAcceptDialog(page: Page, action: () => Promise<void>, expectedMessage: string) {
  const dialogPromise = page.waitForEvent('dialog', { timeout: 15_000 });
  await action();
  const dialog = await dialogPromise;
  const message = dialog.message();
  expect(message).toContain(expectedMessage);
  await dialog.accept();
  return message;
}

async function saveCtq(page: Page) {
  return clickAndAcceptDialog(page, () => page.locator('#saveCtqButton').click(), '저장에 성공하였습니다.');
}

async function searchCtq(page: Page, ctqName: string) {
  await page.locator('.search-panel-wrapper input[name="ctqName"]').first().fill(ctqName);
  await page.locator('.search-panel-search-btn').click({ force: true });
  await page.waitForTimeout(2_000);
}

async function selectCtqRow(page: Page, ctqName: string) {
  await page.locator('#ctqManageGrid .slick-row').filter({ hasText: exactTextMatcher(`.*${ctqName}.*`) }).first().click({ force: true });
  await page.waitForTimeout(1_000);
}

async function ctqManageRows(page: Page) {
  return page.locator('#ctqManageGrid .slick-row').evaluateAll((rows) =>
    rows.map((row) => row.textContent?.trim().replace(/\s+/g, ' ') ?? '')
  );
}

async function ctqMappingRows(page: Page) {
  return page.locator('#ctqMappingInfoGrid .slick-row').evaluateAll((rows) =>
    rows.map((row) => row.textContent?.trim().replace(/\s+/g, ' ') ?? '')
  );
}

async function openMappingTab(page: Page) {
  await page.locator('a[href="#ctqMappingInfo"]').click({ force: true });
  await expect(page.locator('#ctqMappingInfoGrid')).toBeVisible();
}

async function deleteCtqIfPresent(page: Page, ctqName: string) {
  await page.goto(ctqPagePath);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2_000);
  await searchCtq(page, ctqName);

  const rows = await ctqManageRows(page);
  if (!rows.some((row) => row.includes(ctqName))) {
    return;
  }

  await selectCtqRow(page, ctqName);
  await page.locator('#ctqManageGrid .slick-row input[type="checkbox"]').first().check({ force: true }).catch(() => undefined);

  await clickAndAcceptDialog(page, () => page.locator('#deleteCtqButton').click({ force: true }), '선택한 항목을 삭제하시겠습니까?');

  const completeDialog = await page.waitForEvent('dialog', { timeout: 15_000 });
  expect(completeDialog.message()).toContain('삭제되었습니다.');
  await completeDialog.accept();
}

test.describe('QualityStream CTQ management', () => {
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run CTQ management tests');

  test('creates CTQ, manages mapped columns, exports report, and deletes CTQ', async ({ page }) => {
    const suffix = runSuffix();
    const ctqName = `AUTO_CTQ_${suffix}`;
    const ctqDesc = `AUTO CTQ 설명 ${suffix}`;

    await gotoCtqManagement(page);

    try {
      await test.step('new CTQ validates required fields', async () => {
        await page.locator('#newCtqButton').click({ force: true });
        await expect(page.locator('#ctqInfo')).toBeVisible();

        for (const label of requiredLabels) {
          const labelNode = page.locator('#ctqInfo .ds-table-label').filter({ hasText: exactTextMatcher(label) }).first();
          const marker = await labelNode.evaluate((element) => {
            const after = getComputedStyle(element, '::after');
            return {
              content: after.content,
              color: after.color
            };
          });

          expect(marker.content).toBe('"*"');
          expect(marker.color).toBe('rgb(217, 45, 32)');
        }

        await page.locator('#saveCtqButton').click({ force: true });
        await expect(page.getByText('필수 입력입니다.').first()).toBeVisible();
      });

      await test.step('create CTQ and verify lower detail values', async () => {
        await page.locator('#ctqInfo #ctqName').fill(ctqName);
        await page.locator('#ctqInfo #ctqDesc').fill(ctqDesc);
        await saveCtq(page);

        await searchCtq(page, ctqName);
        await selectCtqRow(page, ctqName);

        await expect(page.locator('#ctqInfo #ctqName')).toHaveValue(ctqName);
        await expect(page.locator('#ctqInfo #ctqDesc')).toHaveValue(ctqDesc);
        expect(await ctqManageRows(page)).toEqual(expect.arrayContaining([expect.stringContaining(ctqName)]));
      });

      await test.step('register columns in CTQ mapping tab', async () => {
        await openMappingTab(page);
        await page.locator('#showCtqColumnButton').click({ force: true });

        const popup = page.locator('.ui-dialog:visible').last();
        await expect(popup).toContainText('컬럼등록');
        await popup.locator('.search-panel-search-btn').click({ force: true });
        await expect(page.locator('#ctqColumnsGrid .slick-row').first()).toBeVisible({ timeout: 20_000 });

        await page.locator('#ctqColumnsGrid .slick-row').first().click({ force: true });
        await page.locator('#ctqColumnsGrid .slick-row input[type="checkbox"]').first().check({ force: true }).catch(() => undefined);

        const registerDialog = page.waitForEvent('dialog', { timeout: 15_000 });
        await popup.getByRole('button', { name: '확인' }).click({ force: true });
        const dialog = await registerDialog;
        expect(dialog.message()).toContain('등록이 완료되었습니다.');
        await dialog.accept();

        await page.waitForTimeout(2_000);
        const mappings = await ctqMappingRows(page);
        expect(mappings.length).toBeGreaterThan(0);
        expect(await ctqManageRows(page)).toEqual(expect.arrayContaining([expect.stringContaining(ctqName)]));
      });

      await test.step('download CTQ mapping report as XLSX', async () => {
        const downloadPopupPromise = page.waitForEvent('download', { timeout: 20_000 });

        await page.locator('#ctqMappingExcel').click({ force: true });
        const popup = page.locator('.ui-dialog:visible').last();
        await expect(popup).toContainText('다운로드형식');
        await popup.getByRole('button', { name: '확인' }).click({ force: true });

        const download = await downloadPopupPromise;
        expect(download.suggestedFilename()).toBe('CtqMappingColumnList.xlsx');

        const stream = await download.createReadStream();
        expect(stream).not.toBeNull();

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          stream!.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream!.on('end', resolve);
          stream!.on('error', reject);
        });

        const file = Buffer.concat(chunks);
        expect(file.length).toBeGreaterThan(0);
        expect(file.subarray(0, 4).toString('hex')).toBe('504b0304');
      });

      await test.step('delete mapped columns', async () => {
        const beforeCount = (await ctqMappingRows(page)).length;
        expect(beforeCount).toBeGreaterThan(0);

        await page.locator('#ctqMappingInfoGrid .slick-header input[type="checkbox"]').first().check({ force: true }).catch(async () => {
          await page.locator('#ctqMappingInfoGrid .slick-row input[type="checkbox"]').first().check({ force: true });
        });

        await clickAndAcceptDialog(page, () => page.locator('#ctqMappingInfoDeleteButton').click({ force: true }), '선택한 항목을 삭제하시겠습니까?');

        const completeDialog = await page.waitForEvent('dialog', { timeout: 15_000 });
        expect(completeDialog.message()).toContain('삭제되었습니다.');
        await completeDialog.accept();

        await page.waitForTimeout(2_000);
        expect((await ctqMappingRows(page)).length).toBeLessThan(beforeCount);
      });
    } finally {
      await deleteCtqIfPresent(page, ctqName);
    }

    await searchCtq(page, ctqName);
    expect(await ctqManageRows(page)).not.toEqual(expect.arrayContaining([expect.stringContaining(ctqName)]));
  });
});
