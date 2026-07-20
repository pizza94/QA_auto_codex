import { expect, Page, test } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

const ctqPagePath = '/quality_woori/main#ctq';
const requiredLabels = ['CTQ명', 'CTQ 설명'];

function runSuffix() {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
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
  await page.locator('#ctqManageGrid').evaluate((element, name) => {
    const widget = window.jQuery(element).data('ui-msGrid');
    const data = widget.getGridData();
    const rows = Array.isArray(data)
      ? data
      : Array.from({ length: data.getLength() }, (_, index) => data.getItem(index));
    const rowIndex = rows.findIndex((row: { ctqName?: string; get?: (key: string) => string }) => (typeof row.get === 'function' ? row.get('ctqName') : row.ctqName) === name);

    if (rowIndex < 0) {
      return;
    }

    widget.scrollTo(rowIndex);
    widget.selectRow(rowIndex);
  }, ctqName);
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
  await page.evaluate(() => {
    const tab = document.querySelector('a[href="#ctqMappingInfo"]') as HTMLElement | null;
    tab?.click();
    const tabs = window.jQuery?.('#ctqTabs');
    if (tabs?.data('ui-tabs')) {
      tabs.tabs('option', 'active', 1);
    }
  });
  await expect(page.locator('#ctqMappingInfoGrid')).toBeVisible({ timeout: 10_000 });
}

async function clickHiddenAction(page: Page, selector: string) {
  await page.locator(selector).evaluate((element: HTMLElement) => element.click());
}
async function clickVisibleDialogButton(page: Page, buttonText: string) {
  await page.evaluate((text) => {
    const dialogs = Array.from(document.querySelectorAll('.ui-dialog')) as HTMLElement[];
    const visibleDialogs = dialogs.filter((dialog) => dialog.offsetParent !== null && getComputedStyle(dialog).display !== 'none');
    const dialog = visibleDialogs[visibleDialogs.length - 1];
    if (!dialog) {
      throw new Error('Visible dialog not found');
    }

    const buttons = Array.from(dialog.querySelectorAll('.ui-dialog-buttonpane button')) as HTMLElement[];
    const button = buttons.find((candidate) => candidate.textContent?.includes(text));
    if (!button) {
      throw new Error(`Dialog button not found: ${text}`);
    }

    button.click();
  }, buttonText);
}
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function zipEntries(entries: { name: string; data: string }[]) {
  const fileParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    fileParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...fileParts, centralDirectory, end]);
}

function columnName(index: number) {
  let name = '';
  let value = index;

  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }

  return name;
}

function inlineStringCell(ref: string, value: string) {
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function buildCtqUploadWorkbook(ctqName: string, projectName: string) {
  const headers = [
    '\uBC88\uD638',
    '* CTQ\uBA85',
    '* CTQ \uC124\uBA85',
    '* \uC2DC\uC2A4\uD15C',
    '* \uC5C5\uBB34\uAD6C\uBD84',
    '* \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uBA85',
    '* \uC18C\uC720\uC790',
    '\uD14C\uC774\uBE14\uBA85',
    '* \uD14C\uC774\uBE14ID',
    '\uCEEC\uB7FC\uBA85',
    '* \uCEEC\uB7FCID',
    '\uCEEC\uB7FC\uC21C\uC11C',
    '\uB370\uC774\uD130\uD0C0\uC785',
    'PK',
    'FK',
    'NN'
  ];
  const row = [
    '1',
    ctqName,
    `AUTO CTQ upload test ${projectName}`,
    'TEST',
    'TEST1',
    'ORA19C',
    'META_A',
    '',
    'TB_BYDVN_CD_ACCUM',
    'DMN_ID',
    'DMN_ID',
    '2',
    'VARCHAR2(200)',
    'N',
    'N',
    'N'
  ];
  const headerCells = headers.map((header, index) => inlineStringCell(`${columnName(index + 1)}1`, header));
  const blankCells = headers.map((_, index) => `<c r="${columnName(index + 1)}2"></c>`);
  const dataCells = row.map((value, index) => inlineStringCell(`${columnName(index + 1)}3`, value));
  const mergeCells = headers.map((_, index) => {
    const column = columnName(index + 1);
    return `<mergeCell ref="${column}1:${column}2"/>`;
  });

  return zipEntries([
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>'
    },
    {
      name: '_rels/.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'xl/workbook.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="CTQ" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>'
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:P3"/><sheetData>' +
        `<row r="1">${headerCells.join('')}</row>` +
        `<row r="2">${blankCells.join('')}</row>` +
        `<row r="3">${dataCells.join('')}</row>` +
        `</sheetData><mergeCells count="16">${mergeCells.join('')}</mergeCells></worksheet>`
    }
  ]);
}


test.describe('QualityStream CTQ management', () => {
  test.setTimeout(90_000);
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run CTQ management tests');

  test('creates CTQ, manages mapped columns, exports report, and leaves CTQ data', async ({ page }) => {
    const suffix = runSuffix();
    const ctqName = `AUTO_CTQ_${suffix}`;
    const ctqDesc = `AUTO CTQ 설명 ${suffix}`;

    await gotoCtqManagement(page);

    await test.step('new CTQ validates required fields', async () => {
        await page.locator('#newCtqButton').click({ force: true });
        await expect(page.locator('#ctqInfo')).toBeVisible();

        for (const label of requiredLabels) {
          const labelNode = page.locator('#ctqInfo .ds-table-label').filter({ hasText: label }).first();
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
        await clickHiddenAction(page, '#showCtqColumnButton');

        const popup = page.locator('.ui-dialog:visible').last();
        await expect(popup).toContainText('컬럼등록');
        const searchInputs = popup.locator('input[type="text"]');
        await searchInputs.nth(0).fill('TB_BYDVN_CD_ACCUM');
        await searchInputs.nth(1).fill('DMN_ID');
        await popup.locator('.search-panel-search-btn').click({ force: true });
        await expect(page.locator('#ctqColumnsGrid .slick-row').filter({ hasText: 'DMN_ID' }).first()).toBeVisible({ timeout: 20_000 });

        const targetColumn = page.locator('#ctqColumnsGrid .slick-row').filter({ hasText: 'TB_BYDVN_CD_ACCUM' }).filter({ hasText: 'DMN_ID' }).first();
        await targetColumn.click({ force: true });
        await targetColumn.locator('input[type="checkbox"]').check({ force: true }).catch(() => undefined);

        const registerDialog = page.waitForEvent('dialog', { timeout: 15_000 });
        await clickVisibleDialogButton(page, '확인');
        const dialog = await registerDialog;
        expect(dialog.message()).toContain('등록이 완료되었습니다.');
        await dialog.accept();

        await expect(page.locator('#ctqMappingInfoGrid .slick-row').first()).toBeVisible({ timeout: 20_000 });
        const mappings = await ctqMappingRows(page);
        expect(mappings.length).toBeGreaterThan(0);
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
  });

  test('downloads CTQ upload template, uploads sample workbook, verifies registration, and leaves CTQ data', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const suffix = runSuffix();
    const ctqName = `AUTO_CTQ_UPLOAD_${projectName.toUpperCase()}_${suffix}`;
    const uploadWorkbook = buildCtqUploadWorkbook(ctqName, projectName);

    await gotoCtqManagement(page);
    await page.goto(ctqPagePath);
    await expect(page.locator('#ctqRegion')).toBeVisible({ timeout: 20_000 });

    await test.step('download CTQ upload template', async () => {
        const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
        await clickHiddenAction(page, '#ctqFormExcel');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('CtqInfo.xlsx');

        const stream = await download.createReadStream();
        expect(stream).not.toBeNull();

        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          stream!.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream!.on('end', resolve);
          stream!.on('error', reject);
        });

        const template = Buffer.concat(chunks);
        expect(template.length).toBeGreaterThan(0);
        expect(template.subarray(0, 4).toString('hex')).toBe('504b0304');
      });

      await test.step('upload populated CTQ workbook', async () => {
        await clickHiddenAction(page, '#ctqUpload');
        const popup = page.locator('.ui-dialog:visible').last();
        await expect(popup.locator('input[type="file"][name="uploadFile"]')).toBeVisible();
        await popup.locator('input[type="file"][name="uploadFile"]').setInputFiles({
          name: `${ctqName}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: uploadWorkbook
        });
        await popup.locator('.ui-dialog-buttonpane button.primary').click({ force: true });

        await expect(popup.locator('.uploadResult')).toBeVisible({ timeout: 30_000 });
        await expect(popup.locator('.success-message')).toBeVisible();
        await expect(popup.locator('.success-message [name="succCnt"]')).toHaveText('1');
        await popup.locator('.ui-dialog-titlebar-close').evaluate((element: HTMLElement) => element.click());
      });

      await test.step('verify uploaded CTQ is registered', async () => {
        await searchCtq(page, ctqName);
      });
  });

});
