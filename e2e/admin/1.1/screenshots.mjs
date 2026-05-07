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
// Review Queue Mocks
// ══════════════════════════════════════════════
const reviewQueueMock = {
  data: {
    items: [
      {
        id: 'rq-001', targetType: 'post', targetId: '101', targetTitle: '如何看待人工智能的快速发展？',
        contentExcerpt: '最近AI技术发展太快了，GPT-5已经能通过图灵测试，大家对此有什么看法？这会对就业市场产生什么影响？',
        author: { id: '10', username: 'tech_watcher', avatarUrl: null },
        boardName: 'AI', aiScore: 72, aiCategory: 'political', aiDegraded: false,
        status: 'pending', priority: 1, createdAt: ago(15),
      },
      {
        id: 'rq-002', targetType: 'post', targetId: '102', targetTitle: '全栈工程师的成长之路',
        contentExcerpt: '作为一名全栈工程师，我想分享一下我的学习经验和职业发展路径...',
        author: { id: '11', username: 'fullstack_dev', avatarUrl: null },
        boardName: '前端', aiScore: 35, aiCategory: 'normal', aiDegraded: false,
        status: 'pending', priority: 3, createdAt: ago(30),
      },
      {
        id: 'rq-003', targetType: 'reply', targetId: '201', targetTitle: 'Re: 低价代购名牌包',
        contentExcerpt: '加我微信 xxx123456，原厂直供，价格低到你不信！质量保证，支持专柜验货...',
        author: { id: '12', username: 'spam_bot', avatarUrl: null },
        boardName: '综合', aiScore: 85, aiCategory: 'spam', aiDegraded: true,
        status: 'pending', priority: 2, createdAt: ago(10),
      },
      {
        id: 'rq-004', targetType: 'reply', targetId: '202', targetTitle: 'Re: 前端框架对比',
        contentExcerpt: '你这种不懂技术的人就别瞎评论了，写的代码跟屎一样还在这装大牛...',
        author: { id: '13', username: 'angry_user', avatarUrl: null },
        boardName: '前端', aiScore: 78, aiCategory: 'abuse', aiDegraded: false,
        status: 'pending', priority: 1, createdAt: ago(45),
      },
      {
        id: 'rq-005', targetType: 'post', targetId: '103', targetTitle: '深夜福利，速看',
        contentExcerpt: '各种资源合集，懂的来，链接在评论区...',
        author: { id: '14', username: 'shady_poster', avatarUrl: null },
        boardName: '综合', aiScore: 90, aiCategory: 'adult', aiDegraded: true,
        status: 'pending', priority: 1, createdAt: ago(5),
      },
    ],
    stats: { pendingCount: 5, todayApproved: 42, todayRejected: 8 },
    total: 5, page: 1, pageSize: 20,
  },
};

// ══════════════════════════════════════════════
// Review Stats Mocks
// ══════════════════════════════════════════════
const reviewStatsMock = {
  data: {
    queue: { pendingCount: 15, appealCount: 3, todayApproved: 42, todayRejected: 8 },
    reports: { pendingCount: 7, todayResolved: 12 },
    quality: {
      passRate: 0.84, blockRate: 0.12, manualPassRate: 0.04,
      falsePositiveRate: 0.06, missRate: 0.03,
    },
    cost: {
      monthlyBudget: 500.00, monthlyCost: 187.50,
      dailyApiCalls: 1567, isBudgetExceeded: false,
    },
  },
};

// ══════════════════════════════════════════════
// Moderator Assignment Mocks
// ══════════════════════════════════════════════
const moderatorListMock = {
  data: {
    items: [
      { id: '20', username: 'mod_fred', email: 'fred@vibedev.com', avatarUrl: null, role: 'moderator', level: 4 },
      { id: '21', username: 'mod_george', email: 'george@vibedev.com', avatarUrl: null, role: 'moderator', level: 3 },
      { id: '22', username: 'mod_hannah', email: 'hannah@vibedev.com', avatarUrl: null, role: 'moderator', level: 3 },
    ],
    total: 3,
  },
};

const activeBoardsMock = {
  data: [
    { id: 1, name: '前端', slug: 'frontend', description: '前端技术讨论', icon: null, postCount: 156, sortOrder: 1, status: 'active' },
    { id: 2, name: '后端', slug: 'backend', description: '后端技术讨论', icon: null, postCount: 89, sortOrder: 2, status: 'active' },
    { id: 3, name: 'AI', slug: 'ai', description: '人工智能讨论', icon: null, postCount: 234, sortOrder: 3, status: 'active' },
    { id: 4, name: '综合', slug: 'general', description: '综合讨论', icon: null, postCount: 120, sortOrder: 4, status: 'active' },
    { id: 5, name: '水区', slug: 'water', description: '', icon: null, postCount: 10, sortOrder: 5, status: 'archived' },
  ],
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
  // Reload the page after login so the auth state takes effect for API calls
  await page.reload({ waitUntil: 'domcontentloaded' });
  await loginAsAdmin(page);
  await page.waitForTimeout(1500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ══════════════════════════════════════════════
  // 1. AI Review Queue — pending items
  // ══════════════════════════════════════════════
  console.log('1. AI Review Queue — pending items with AI scores');
  await navigateToAdmin(page, '/admin/review-queue', {
    '**/api/admin/review-queue**': reviewQueueMock,
  });

  await page.screenshot({ path: path.join(OUT_DIR, 'review-queue-pending.png'), fullPage: true });
  console.log('   ✓ review-queue-pending.png');

  // ══════════════════════════════════════════════
  // 2. AI Review Queue — reject modal
  // ══════════════════════════════════════════════
  console.log('2. AI Review Queue — reject modal open');
  const rejectBtns = page.locator('button:has-text("驳回")');
  await rejectBtns.first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'review-queue-reject-modal.png') });
  console.log('   ✓ review-queue-reject-modal.png');

  // ══════════════════════════════════════════════
  // 3. Review Stats — full dashboard
  // ══════════════════════════════════════════════
  console.log('3. Review Stats — full dashboard');
  await navigateToAdmin(page, '/admin/review-stats', {
    '**/api/admin/review-stats': reviewStatsMock,
  });

  await page.screenshot({ path: path.join(OUT_DIR, 'review-stats-dashboard.png'), fullPage: true });
  console.log('   ✓ review-stats-dashboard.png');

  // ══════════════════════════════════════════════
  // 4. Moderator Assignment — moderator list
  // ══════════════════════════════════════════════
  console.log('4. Moderator Assignment — list with moderators');
  await navigateToAdmin(page, '/admin/moderator-assignment', {
    '**/api/admin/users?**': moderatorListMock,
    '**/api/admin/boards': activeBoardsMock,
  });

  await page.screenshot({ path: path.join(OUT_DIR, 'moderator-assignment-list.png'), fullPage: true });
  console.log('   ✓ moderator-assignment-list.png');

  // ══════════════════════════════════════════════
  // 5. Moderator Assignment — board assignment modal
  // ══════════════════════════════════════════════
  console.log('5. Moderator Assignment — board assignment modal');
  const assignBtns = page.locator('button:has-text("分配版块")');
  await assignBtns.first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'moderator-assignment-modal.png') });
  console.log('   ✓ moderator-assignment-modal.png');

  await browser.close();
  console.log('\nDone! All screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
