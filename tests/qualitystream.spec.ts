import { expect, test } from '@playwright/test';
import { loginToIruda, skipWhenCredentialsMissing } from './support/auth';

const expectedTopMenus = [
  '검증기준관리',
  '검증대상관리',
  '구조품질',
  '프로파일링설정',
  '프로파일링',
  '품질진단관리',
  '작업관리',
  '작업결과',
  '개선관리',
  '품질현황',
  '승인관리',
  '설정'
];

const expectedSubMenus = [
  { text: '데이터품질지표(DQI)관리', href: '/quality_woori/standardManage/standardManageMain#dqi' },
  { text: '데이터품질핵심정보(CTQ)관리', href: '/quality_woori/standardManage/standardManageMain#ctq' },
  { text: '검증대상관리', href: '/quality_woori/datasource/dataModelMain#dataModel' },
  { text: '테이블', href: '/quality_wooriprofilingSettings/tableProfilingMain#tableProfiling' },
  { text: '컬럼분석', href: '/quality_woori/profiling/profilingMain#columnAnalysis' },
  { text: 'BR관리', href: '/quality_woori/businessrule/businessRuleMain#businessRule' },
  { text: '점검작업관리', href: '/quality_woori/job/jobMain#manage' },
  { text: '업무별검증결과', href: '/quality_woori/vrfcResults/vrfcResultMain#bizResults' },
  { text: '원인분석관리', href: '/quality_woori/improvement/improvementMain#analysis' },
  { text: '통합품질현황', href: '/quality_woori/statistics/statisticsMain#integrationStatistics' },
  { text: 'BR승인관리', href: '/quality_woori/approval/approvalMain#brApproval' },
  { text: '기본설정', href: '/quality_woori/settings/basicSettingMain#basicSettings' }
];

test.describe('QualityStream navigation', () => {
  test.skip(skipWhenCredentialsMissing(), 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run QualityStream tests');

  test('opens QualityStream dashboard and displays TC-mapped menus', async ({ page }) => {
    await loginToIruda(page);

    await page.locator('.page-item').filter({ hasText: '품질관리' }).click();

    await expect(page).toHaveURL(/\/quality_woori\/main#dashboard$/, { timeout: 20_000 });
    await expect(page).toHaveTitle(/QualityStream 4\.3/);
    await expect(page.locator('a.logo.text.quality')).toContainText('QualityStream');
    await expect(page.getByText('대시보드', { exact: true })).toBeVisible();

    await expect(page.locator('a.menu-item')).toHaveText(expectedTopMenus);

    for (const menu of expectedSubMenus) {
      const link = page.locator(`a[href="${menu.href}"]`).filter({ hasText: menu.text });
      await expect(link, `${menu.text} 메뉴 링크`).toHaveCount(1);
    }
  });
});