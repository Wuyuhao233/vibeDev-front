import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = 'http://localhost:5173';

function mockApi(page, routes) {
  Object.entries(routes).forEach(([pattern, data]) => {
    page.route(pattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  });
}

async function loginAsAdmin(page) {
  await page.waitForFunction(() => !!window.__authStore, { timeout: 10000 });
  await page.evaluate(() => {
    const store = window.__authStore;
    store.getState().login(
      { id: 1, username: 'admin', email: 'admin@vibedev.com', avatar: null, level: 5, role: 'admin' },
      'fake-access-token',
      'fake-refresh-token',
    );
  });
  await page.waitForTimeout(300);
}

const now = Date.now();
function ago(minutes) {
  return new Date(now - minutes * 60000).toISOString();
}

// ══════════════════════════════════════════════
// Appeal Queue Mocks
// ══════════════════════════════════════════════
const appealPendingMock = {
  data: {
    items: [
      {
        id: 'appeal-001',
        reportId: 'report-501',
        appellantId: 'user-10',
        reason: '我的帖子内容正常讨论技术话题，不存在违规行为，请管理员复审并恢复帖子',
        status: 'pending',
        handlerId: null,
        handlerNote: null,
        createdAt: ago(20),
        processedAt: null,
      },
      {
        id: 'appeal-002',
        reportId: 'report-502',
        appellantId: 'user-11',
        reason: '禁言7天处罚过重，我承认发言有些激烈但并非人身攻击，申请提前解除禁言',
        status: 'pending',
        handlerId: null,
        handlerNote: null,
        createdAt: ago(60),
        processedAt: null,
      },
      {
        id: 'appeal-003',
        reportId: 'report-503',
        appellantId: 'user-12',
        reason: '被误判为广告的帖子实际是开源项目分享，附带的链接是GitHub仓库地址',
        status: 'pending',
        handlerId: null,
        handlerNote: null,
        createdAt: ago(120),
        processedAt: null,
      },
    ],
    total: 3,
    page: 1,
    pageSize: 20,
  },
};

const appealApprovedMock = {
  data: {
    items: [
      {
        id: 'appeal-004',
        reportId: 'report-401',
        appellantId: 'user-5',
        reason: '帖子被判定违规删除，但内容为正常学术讨论，请求恢复',
        status: 'approved',
        handlerId: 'admin-1',
        handlerNote: '经复审确认内容正常，已恢复帖子',
        createdAt: ago(1440),
        processedAt: ago(1200),
      },
      {
        id: 'appeal-005',
        reportId: 'report-402',
        appellantId: 'user-6',
        reason: '禁言原因不充分，申请复审',
        status: 'approved',
        handlerId: 'admin-1',
        handlerNote: '原判过重，已解除禁言',
        createdAt: ago(2880),
        processedAt: ago(2700),
      },
    ],
    total: 2,
    page: 1,
    pageSize: 20,
  },
};

const appealRejectedMock = {
  data: {
    items: [
      {
        id: 'appeal-006',
        reportId: 'report-403',
        appellantId: 'user-7',
        reason: '我认为处罚不合理，要求重新审查',
        status: 'rejected',
        handlerId: 'admin-2',
        handlerNote: '申诉理由不充分，原处理无误，维持原判',
        createdAt: ago(1500),
        processedAt: ago(1300),
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  },
};

// ══════════════════════════════════════════════
// Settings Mocks
// ══════════════════════════════════════════════
const settingsMock = {
  data: {
    items: [
      { key: 'site.name', value: 'vibeDev', description: '站点名称' },
      { key: 'site.description', value: '开发者社区', description: '站点描述' },
      { key: 'recommendation.tag_weight', value: '0.40', description: '推荐算法标签匹配权重' },
      { key: 'recommendation.hot_weight', value: '0.30', description: '推荐算法热度权重' },
      { key: 'recommendation.freshness_weight', value: '0.20', description: '推荐算法新鲜度权重' },
      { key: 'recommendation.quality_weight', value: '0.10', description: '推荐算法质量权重' },
      { key: 'ai.high_risk_threshold', value: '85', description: 'AI审核高风险阈值' },
      { key: 'ai.low_risk_threshold', value: '50', description: 'AI审核低风险阈值' },
    ],
    total: 8,
  },
};

const baseMocks = {
  '**/api/boards': {
    data: [
      { id: 1, name: '前端', slug: 'frontend', description: '', icon: null, postCount: 156, sortOrder: 1, tags: [] },
      { id: 2, name: '后端', slug: 'backend', description: '', icon: null, postCount: 89, sortOrder: 2, tags: [] },
      { id: 3, name: 'AI', slug: 'ai', description: '', icon: null, postCount: 234, sortOrder: 3, tags: [] },
      { id: 4, name: '综合', slug: 'general', description: '', icon: null, postCount: 120, sortOrder: 4, tags: [] },
    ],
  },
};

async function navigateToAdmin(page, path, apiMocks) {
  mockApi(page, { ...baseMocks, ...apiMocks });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await loginAsAdmin(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await loginAsAdmin(page);
  await page.waitForTimeout(1500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ══════════════════════════════════════════════
  // 1. Appeal Queue — pending items
  // ══════════════════════════════════════════════
  console.log('1. Appeal Queue — pending appeals list');
  await navigateToAdmin(page, '/admin/appeals', {
    '**/api/admin/appeals**': appealPendingMock,
  });

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-queue-pending.png'), fullPage: true });
  console.log('   ✓ appeal-queue-pending.png');

  // ══════════════════════════════════════════════
  // 2. Appeal Queue — reject modal
  // ══════════════════════════════════════════════
  console.log('2. Appeal Queue — reject modal open');
  const rejectBtns = page.locator('button:has-text("驳回")');
  await rejectBtns.first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-queue-reject-modal.png') });
  console.log('   ✓ appeal-queue-reject-modal.png');

  // ══════════════════════════════════════════════
  // 3. Appeal Queue — approved items
  // ══════════════════════════════════════════════
  console.log('3. Appeal Queue — approved appeals list');
  await navigateToAdmin(page, '/admin/appeals', {
    '**/api/admin/appeals**': appealApprovedMock,
  });
  // Click "已通过" tab
  const approvedTab = page.locator('button:has-text("已通过")');
  await approvedTab.click();
  // Re-mock for the approved filter
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  mockApi(page, { ...baseMocks, '**/api/admin/appeals**': appealApprovedMock });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-queue-approved.png'), fullPage: true });
  console.log('   ✓ appeal-queue-approved.png');

  // ══════════════════════════════════════════════
  // 4. Appeal Queue — rejected items
  // ══════════════════════════════════════════════
  console.log('4. Appeal Queue — rejected appeals list');
  await navigateToAdmin(page, '/admin/appeals', {
    '**/api/admin/appeals**': appealRejectedMock,
  });
  const rejectedTab = page.locator('button:has-text("已驳回")');
  await rejectedTab.click();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  mockApi(page, { ...baseMocks, '**/api/admin/appeals**': appealRejectedMock });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-queue-rejected.png'), fullPage: true });
  console.log('   ✓ appeal-queue-rejected.png');

  // ══════════════════════════════════════════════
  // 5. Settings — recalculate points button
  // ══════════════════════════════════════════════
  console.log('5. Settings — points recalculation section');
  await navigateToAdmin(page, '/admin/settings', {
    '**/api/admin/settings**': settingsMock,
  });

  await page.screenshot({ path: path.join(OUT_DIR, 'settings-recalculate.png'), fullPage: true });
  console.log('   ✓ settings-recalculate.png');

  await browser.close();
  console.log('\nDone! All screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
