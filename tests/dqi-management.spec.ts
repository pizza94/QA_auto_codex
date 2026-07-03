import { expect, Page, test } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

const dqiPagePath = '/quality_woori/main#dqi';

const requiredLabels = [
  'DQI대분류',
  'DQI소분류',
  'DQI 대분류 설명',
  'DQI 소분류 설명',
  '목표수준'
];

function runSuffix() {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
}

function exactTextMatcher(text: string) {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

async function gotoDqiManagement(page: Page) {
  await loginToIruda(page);
  await page.goto(dqiPagePath);
  await expect(page).toHaveURL(/\/quality_woori\/main#dqi/, { timeout: 20_000 });
  await expect(page.locator('#dqiRegion')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#newNodeButton')).toBeVisible();
}

async function setVisibleField(page: Page, name: string, value: string) {
  await page.evaluate(({ name, value }) => {
    const field = Array.from(document.querySelectorAll(`#dqiRegion [name="${name}"]`)).find(
      (element) => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ) as HTMLInputElement | HTMLTextAreaElement | undefined;

    if (!field) {
      throw new Error(`Field not found: ${name}`);
    }

    if (!(field.offsetWidth || field.offsetHeight || field.getClientRects().length)) {
      throw new Error(`Field is not visible: ${name}`);
    }

    if (field.readOnly) {
      throw new Error(`Field is readonly: ${name}`);
    }

    field.focus();
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.blur();
  }, { name, value });
}

async function visibleFieldValue(page: Page, name: string) {
  return page.evaluate((name) => {
    const field = Array.from(document.querySelectorAll(`#dqiRegion [name="${name}"]`)).find(
      (element) => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    ) as HTMLInputElement | HTMLTextAreaElement | undefined;

    if (!field) {
      return null;
    }

    return {
      value: field.value,
      readonly: field.readOnly
    };
  }, name);
}

async function clickAndAcceptDialog(page: Page, action: () => Promise<void>, expectedMessage: string) {
  const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 });
  await action();
  const dialog = await dialogPromise;
  const message = dialog.message();
  expect(message).toContain(expectedMessage);
  await dialog.accept();
  return message;
}

async function saveDqi(page: Page) {
  return clickAndAcceptDialog(page, () => page.locator('#dqiSaveButton').click(), '저장에 성공하였습니다.');
}

async function openAllTree(page: Page) {
  await page.locator('#allOpenButton').click();
  await page.waitForTimeout(1_000);
}

async function treeTexts(page: Page) {
  return page.locator('#dqiTree .jstree-anchor').evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.textContent?.trim() ?? '').filter(Boolean)
  );
}

async function selectTreeNode(page: Page, text: string) {
  await page.locator('#dqiTree .jstree-anchor').filter({ hasText: exactTextMatcher(text) }).first().click({ force: true });
  await expect(page.locator('#dqiTree .jstree-clicked')).toHaveText(text);
}

async function clickTreeContextAction(page: Page, nodeText: string, actionText: string) {
  const node = page.locator('#dqiTree .jstree-anchor').filter({ hasText: exactTextMatcher(nodeText) }).first();
  await node.click({ force: true });
  await node.click({ button: 'right', force: true });
  await page.locator('.vakata-context:visible a').filter({ hasText: exactTextMatcher(actionText) }).first().click({ force: true });
}

async function deleteTreeNodeIfPresent(page: Page, nodeText: string) {
  await page.goto(dqiPagePath);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2_000);
  await openAllTree(page);

  const nodes = await treeTexts(page);
  if (!nodes.includes(nodeText)) {
    return;
  }

  await clickTreeContextAction(page, nodeText, '삭제');

  const confirmDialog = await page.waitForEvent('dialog', { timeout: 10_000 });
  expect(confirmDialog.message()).toContain('선택한 항목을 삭제하시겠습니까?');
  await confirmDialog.accept();

  const completeDialog = await page.waitForEvent('dialog', { timeout: 10_000 });
  expect(completeDialog.message()).toContain('삭제가 완료되었습니다.');
  await completeDialog.accept();
}

test.describe('QualityStream DQI management', () => {
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run DQI management tests');

  test('creates, validates, searches, edits, and deletes a DQI classification', async ({ page }) => {
    const suffix = runSuffix();
    const parentName = `AUTO_DQI_BIG_${suffix}`;
    const parentDesc = `AUTO DQI 대분류 설명 ${suffix}`;
    const childName = `AUTO_DQI_SUB_${suffix}`;
    const childDesc = `AUTO DQI 소분류 설명 ${suffix}`;
    const editedChildName = `${childName}_EDIT`;
    const editedChildDesc = `${childDesc} EDIT`;

    await gotoDqiManagement(page);

    try {
      await test.step('required labels display a red asterisk', async () => {
        await page.locator('#newNodeButton').click();

        for (const label of requiredLabels) {
          const labelNode = page.locator('#dqiRegion .ds-table-label').filter({ hasText: exactTextMatcher(label) }).first();
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
      });

      await test.step('blank required fields block save', async () => {
        await page.locator('#dqiSaveButton').click();
        await expect(page.getByText('필수 입력입니다.').first()).toBeVisible();
      });

      await test.step('create DQI parent classification from top new button', async () => {
        await setVisibleField(page, 'dqiName', parentName);
        await setVisibleField(page, 'dqiDesc', parentDesc);
        await saveDqi(page);

        await expect(page.locator('#dqiTree .jstree-clicked')).toHaveText(parentName);
        expect(await visibleFieldValue(page, 'dqiName')).toMatchObject({ value: parentName, readonly: false });
        expect(await visibleFieldValue(page, 'dqiDesc')).toMatchObject({ value: parentDesc, readonly: false });
      });

      await test.step('create DQI child classification from parent context menu', async () => {
        await clickTreeContextAction(page, parentName, '신규');
        await expect(page.locator('#dqiTree .jstree-clicked')).toHaveText('새DQI');

        expect(await visibleFieldValue(page, 'subDqiName')).toMatchObject({ readonly: false });
        expect(await visibleFieldValue(page, 'subDqiDesc')).toMatchObject({ readonly: false });
        expect(await visibleFieldValue(page, 'desiredQuality')).toMatchObject({ readonly: false });

        await setVisibleField(page, 'subDqiName', childName);
        await setVisibleField(page, 'subDqiDesc', childDesc);
        await setVisibleField(page, 'desiredQuality', '95');
        await saveDqi(page);

        await expect(page.locator('#dqiTree .jstree-clicked')).toHaveText(childName);
        expect(await visibleFieldValue(page, 'dqiName')).toMatchObject({ value: parentName, readonly: true });
        expect(await visibleFieldValue(page, 'subDqiName')).toMatchObject({ value: childName, readonly: false });
        expect(await visibleFieldValue(page, 'subDqiDesc')).toMatchObject({ value: childDesc, readonly: false });
        expect(await visibleFieldValue(page, 'desiredQuality')).toMatchObject({ value: '95', readonly: false });
      });

      await test.step('tree open and close buttons toggle tree visibility state', async () => {
        await openAllTree(page);
        await expect(page.locator('#dqiTree .jstree-anchor').filter({ hasText: childName })).toBeVisible();

        await page.locator('#allOpenButton').click();
        await page.waitForTimeout(1_000);
        await expect(page.locator('#dqiTree').getByText(parentName, { exact: true })).toBeVisible();
      });

      await test.step('search returns DQI by exact and partial input', async () => {
        const search = page.locator('#dqiTree #tableTreeSearch');

        await search.fill(childName);
        await search.press('Enter');
        await page.waitForTimeout(1_000);
        expect(await treeTexts(page)).toEqual(expect.arrayContaining([parentName, childName]));

        await search.fill('AUTO_DQI_SUB');
        await search.press('Enter');
        await page.waitForTimeout(1_000);
        expect(await treeTexts(page)).toEqual(expect.arrayContaining([parentName, childName]));

        await search.fill('NO_SUCH_DQI_999999');
        await search.press('Enter');
        await page.waitForTimeout(1_000);
        await expect(search).toHaveValue('NO_SUCH_DQI_999999');
      });

      await test.step('edit child DQI and verify values after reload', async () => {
        await page.locator('#dqiTree #tableTreeSearch').fill('');
        await openAllTree(page);
        await selectTreeNode(page, childName);

        await setVisibleField(page, 'subDqiName', editedChildName);
        await setVisibleField(page, 'subDqiDesc', editedChildDesc);
        await setVisibleField(page, 'desiredQuality', '96');
        await saveDqi(page);

        await page.goto(dqiPagePath);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2_000);
        await openAllTree(page);
        await selectTreeNode(page, editedChildName);

        expect(await treeTexts(page)).toContain(editedChildName);
        expect(await treeTexts(page)).not.toContain(childName);
        expect(await visibleFieldValue(page, 'subDqiName')).toMatchObject({ value: editedChildName });
        expect(await visibleFieldValue(page, 'subDqiDesc')).toMatchObject({ value: editedChildDesc });
        expect(await visibleFieldValue(page, 'desiredQuality')).toMatchObject({ value: '96' });
      });

      await test.step('BR detail and BR report show guidance when no related BR row is selected', async () => {
        await selectTreeNode(page, editedChildName);

        await clickAndAcceptDialog(
          page,
          () => page.locator('#brDetailInfo').click(),
          '연관 BR정보를 선택해 주세요.'
        );

        await clickAndAcceptDialog(
          page,
          () => page.locator('#brReport').click(),
          '출력할 검색 결과가 없습니다.'
        );
      });
    } finally {
      await deleteTreeNodeIfPresent(page, editedChildName).catch(async () => {
        await deleteTreeNodeIfPresent(page, childName);
      });
      await deleteTreeNodeIfPresent(page, parentName);
    }
  });
});
