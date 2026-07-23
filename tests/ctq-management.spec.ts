import { expect, Page, test, type APIRequestContext } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

const ctqPagePath = '/quality_woori/main#ctq';
const requiredLabels = ['CTQ명', 'CTQ 설명'];
const CTQ_PREFIX = 'QA_CTQ_004_';
const TARGET_TABLE_COUNT = 3;

type VerificationTarget = {
  rflcYn: boolean;
  upperBiz: string;
  biz: string;
  dbNm: string;
  usr: string;
  tabNm: string;
  tabId: string;
  colCnt: number;
  useYn?: boolean | string;
  useYnStr?: string;
};

type CtqColumn = {
  sys: string;
  biz: string;
  dbNm: string;
  owner: string;
  tableName: string;
  tableId: string;
  columnObjectId: number;
  columnSeq: string;
  columnName: string;
  columnId: string;
  dataType: string;
  pk: string;
  fk: string;
  nn: string;
};

type CtqRecord = {
  objectId: number;
  ctqName: string;
  columnCnt: number;
};


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

function qualityApiBase(page: Page) {
  return page.url().split('/quality_woori/')[0] + '/quality_woori/';
}

async function cleanupCtqData(request: APIRequestContext, apiBase: string, prefix: string) {
  for (const row of await findCtqData(request, apiBase, prefix)) {
    const response = await request.delete(`${apiBase}standardManage/ctqList/${row.objectId}`);
    expect(response.ok(), `delete stale CTQ ${row.ctqName}`).toBeTruthy();
  }
}

async function findCtqData(request: APIRequestContext, apiBase: string, prefix: string): Promise<CtqRecord[]> {
  const params = new URLSearchParams({ page: '1', pageSize: '1000', ctqName: prefix });
  const response = await request.get(`${apiBase}standardManage/ctqList?${params}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return (body.LIST ?? []).filter((row: CtqRecord) => row.ctqName?.startsWith(prefix));
}

async function findCtqByName(request: APIRequestContext, apiBase: string, ctqName: string) {
  const matches = await findCtqData(request, apiBase, ctqName);
  const ctq = matches.find((row) => row.ctqName === ctqName);
  expect(ctq, `CTQ not found: ${ctqName}`).toBeTruthy();
  return ctq!;
}

async function getReflectedCtqColumns(request: APIRequestContext, apiBase: string): Promise<CtqColumn[]> {
  const params = new URLSearchParams({
    PAGE_GUBUN: '1',
    PAGE_ROW: '1000',
    upperBiz: '',
    biz: '',
    tabNm: '',
    tableSearchOption: '1',
    extractTarget: '',
    rflcYn: 'true',
    startDate: '',
    endDate: new Date().toISOString().slice(0, 10),
    chgType: '',
    dbNm: '',
    usr: '',
    tableManagerId: '',
  });
  const response = await request.get(`${apiBase}datasource/entities?${params}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const targets = (body.LIST ?? [])
    .filter((target: VerificationTarget) => target.rflcYn === true && target.colCnt >= 3 && isOptionalUseYnEnabled(target) && hasNoEmptyValues([
      target.upperBiz,
      target.biz,
      target.dbNm,
      target.usr,
      target.tabNm,
      target.tabId,
    ]))
    .sort(() => Math.random() - 0.5);

  const usedColumnIds = new Set<string>();
  const columns: CtqColumn[] = [];

  for (const target of targets) {
    const column = await getFirstUsableColumn(request, apiBase, target, usedColumnIds);
    if (column) {
      usedColumnIds.add(column.columnId);
      columns.push(column);
    }
    if (columns.length === TARGET_TABLE_COUNT) break;
  }

  expect(columns, 'reflected target columns with non-empty test data').toHaveLength(TARGET_TABLE_COUNT);
  return columns;
}

async function getFirstUsableColumn(
  request: APIRequestContext,
  apiBase: string,
  target: VerificationTarget,
  usedColumnIds: Set<string>,
) {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '200',
    upperBiz: target.upperBiz,
    biz: target.biz,
    tableName: target.tabNm,
    tableNameSearchOption: '4',
  });
  const response = await request.get(`${apiBase}standardManage/ctqList/0/columns?${params}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return (body.LIST ?? []).find((column: CtqColumn) => !usedColumnIds.has(column.columnId) && hasNoEmptyValues(columnToRequiredValues(column)));
}

async function addCtqColumns(request: APIRequestContext, apiBase: string, ctqId: number, columns: CtqColumn[]) {
  const response = await request.put(`${apiBase}standardManage/ctqList/${ctqId}/mappingInfo`, {
    data: columns,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.ok()).toBeTruthy();
}

async function expectCtqMapping(request: APIRequestContext, apiBase: string, ctqId: number) {
  const response = await request.get(`${apiBase}standardManage/ctqList/${ctqId}/mappingInfo?page=1&pageSize=200`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const rows = body.LIST ?? [];
  expect(rows).toHaveLength(TARGET_TABLE_COUNT);
  expect(new Set(rows.map((row: CtqColumn) => row.tableId)).size).toBe(TARGET_TABLE_COUNT);
  assertNoEmptyRows(rows.map((row: CtqColumn) => [
    row.sys,
    row.biz,
    row.dbNm,
    row.owner,
    row.tableName,
    row.tableId,
    row.columnName,
    row.columnId,
    row.columnSeq,
    row.dataType,
    row.pk,
    row.fk,
    row.nn,
  ]), 'CTQ mapping rows');
}

function uploadRows(ctqName: string, ctqDesc: string, columns: CtqColumn[]) {
  return columns.map((column, index) => [
    String(index + 1),
    ctqName,
    ctqDesc,
    column.sys,
    column.biz,
    column.dbNm,
    column.owner,
    column.tableName,
    column.tableId,
    column.columnName,
    column.columnId,
    column.columnSeq,
    column.dataType,
    column.pk,
    column.fk,
    column.nn,
  ]);
}

function columnToRequiredValues(column: CtqColumn) {
  return [
    column.sys,
    column.biz,
    column.dbNm,
    column.owner,
    column.tableName,
    column.tableId,
    column.columnObjectId,
    column.columnSeq,
    column.columnName,
    column.columnId,
    column.dataType,
    column.pk,
    column.fk,
    column.nn,
  ];
}

function assertNoEmptyRows(rows: unknown[][], context: string) {
  for (const row of rows) {
    expect(hasNoEmptyValues(row), `${context} contains empty value: ${JSON.stringify(row)}`).toBe(true);
  }
}

function hasNoEmptyValues(values: unknown[]) {
  return values.every((value) => value !== null && value !== undefined && String(value).trim() !== '');
}

function isOptionalUseYnEnabled(target: VerificationTarget) {
  const value = target.useYn ?? target.useYnStr;
  return value === undefined || value === null || value === true || String(value).toUpperCase() === 'Y';
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

function buildCtqUploadWorkbook(rows: unknown[][]) {
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
  assertNoEmptyRows(rows, 'CTQ upload workbook rows');
  const headerCells = headers.map((header, index) => inlineStringCell(`${columnName(index + 1)}1`, header));
  const blankCells = headers.map((_, index) => `<c r="${columnName(index + 1)}2"></c>`);
  const dataRows = rows.map((row, rowIndex) => {
    const excelRow = rowIndex + 3;
    return `<row r="${excelRow}">${row.map((value, index) => inlineStringCell(`${columnName(index + 1)}${excelRow}`, String(value))).join('')}</row>`;
  });
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
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:P${rows.length + 2}"/><sheetData>` +
        `<row r="1">${headerCells.join('')}</row>` +
        `<row r="2">${blankCells.join('')}</row>` +
        dataRows.join('') +
        `</sheetData><mergeCells count="16">${mergeCells.join('')}</mergeCells></worksheet>`
    }
  ]);
}

test.describe('QualityStream CTQ management', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run CTQ management tests');

  test('creates CTQ, manages mapped columns, exports report, and leaves CTQ data', async ({ page }) => {
    const suffix = runSuffix();
    const ctqName = `${CTQ_PREFIX}NEW_${suffix}`;
    const ctqDesc = `QA CTQ new desc ${suffix}`;
    let targetColumns: CtqColumn[] = [];

    await gotoCtqManagement(page);
    const apiBase = qualityApiBase(page);
    await cleanupCtqData(page.request, apiBase, CTQ_PREFIX);
    targetColumns = await getReflectedCtqColumns(page.request, apiBase);

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


        const created = await findCtqByName(page.request, apiBase, ctqName);
        expect(created.columnCnt).toBe(0);
      });

      await test.step('register reflected target columns in CTQ mapping tab', async () => {
        const ctq = await findCtqByName(page.request, apiBase, ctqName);
        await addCtqColumns(page.request, apiBase, ctq.objectId, targetColumns);

        await expectCtqMapping(page.request, apiBase, ctq.objectId);
        const remaining = await findCtqData(page.request, apiBase, CTQ_PREFIX);
        const manual = remaining.find((row) => row.ctqName === ctqName);
        expect(manual?.columnCnt).toBe(TARGET_TABLE_COUNT);

        await searchCtq(page, ctqName);
        await selectCtqRow(page, ctqName);
        await openMappingTab(page);
      });

  });

  test('downloads CTQ upload template, uploads sample workbook, verifies registration, and leaves CTQ data', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const suffix = runSuffix();
    const ctqName = `${CTQ_PREFIX}UPLOAD_${projectName.toUpperCase()}_${suffix}`;
    const ctqDesc = `QA CTQ upload desc ${projectName} ${suffix}`;

    await gotoCtqManagement(page);
    await page.goto(ctqPagePath);
    await expect(page.locator('#ctqRegion')).toBeVisible({ timeout: 20_000 });

    const apiBase = qualityApiBase(page);
    const targetColumns = await getReflectedCtqColumns(page.request, apiBase);
    const uploadWorkbook = buildCtqUploadWorkbook(uploadRows(ctqName, ctqDesc, targetColumns));

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
        await expect(popup.locator('.success-message [name="succCnt"]')).toHaveText(String(TARGET_TABLE_COUNT));
        await popup.locator('.ui-dialog-titlebar-close').evaluate((element: HTMLElement) => element.click());
      });

      await test.step('verify uploaded CTQ is registered', async () => {
        await searchCtq(page, ctqName);
        const remaining = await findCtqData(page.request, apiBase, CTQ_PREFIX);
        const uploaded = remaining.find((row) => row.ctqName === ctqName);
        expect(uploaded?.columnCnt).toBe(TARGET_TABLE_COUNT);
        expect(remaining.map((row) => row.ctqName).sort()).toEqual(expect.arrayContaining([ctqName]));
      });
  });

});

