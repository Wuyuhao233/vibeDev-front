import { firefox } from 'playwright';
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

async function loginViaE2E(page) {
  await page.waitForFunction(() => !!window.__authStore, { timeout: 10000 });
  await page.evaluate(() => {
    const store = window.__authStore;
    store.getState().login(
      { id: 1, username: 'test_user', email: 'test@test.com', avatar: null, level: 3 },
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

const baseMocks = {
  '**/api/boards': {
    data: [
      { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [] },
    ],
  },
  '**/api/sensitive-words': { data: [] },
  '**/api/tags/followed': { data: { tags: [] } },
  '**/api/home/feed**': {
    data: {
      items: [
        {
          id: 1, title: '测试帖子', content: '这是测试帖子的内容摘要。',
          contentSummary: '这是测试帖子的内容摘要。', coverImageUrl: null,
          author: { id: 1, username: 'test_user', avatar: null, level: 3 },
          board: { id: 1, name: '综合讨论', slug: 'general' },
          tags: [], likeCount: 10, replyCount: 3, collectCount: 2,
          createdAt: ago(60), isPinned: false, isEssence: false,
        },
      ],
      total: 1,
    },
  },
};

const notificationsMock = {
  data: {
    items: [
      { id: 1, type: 'reply', message: 'react_master 回复了你的帖子《React 18 最佳实践》', targetId: 10, isRead: false, createdAt: ago(3) },
      { id: 2, type: 'like', message: 'js_dev 赞了你的回复', targetId: 10, isRead: false, createdAt: ago(15) },
      { id: 3, type: 'collect', message: 'vue_fan 收藏了你的帖子《Vue vs React 全面对比》', targetId: 20, isRead: false, createdAt: ago(45) },
      { id: 4, type: 'system', message: '你的帖子《TypeScript 高级用法》已被设为精华', targetId: 30, isRead: true, createdAt: ago(120) },
      { id: 5, type: 'like', message: 'node_dev 赞了你的帖子', targetId: 40, isRead: true, createdAt: ago(180) },
      { id: 6, type: 'reply', message: 'deno_fan 回复了你的帖子', targetId: 50, isRead: true, createdAt: ago(240) },
      { id: 7, type: 'system', message: '欢迎来到 vibeDev 社区！', targetId: null, isRead: false, createdAt: ago(480) },
    ],
    total: 7,
    unreadCount: 4,
  },
};

const emptyNotificationsMock = {
  data: { items: [], total: 0, unreadCount: 0 },
};

async function goToNotifications(page) {
  // Navigate to notifications page via client-side routing (bell → "查看全部")
  await page.click('[aria-label="通知"]');
  await page.waitForTimeout(500);
  await page.click('text=查看全部');
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ══════════════════════════════════════════════
  // 1. Navbar — Notification bell with badge
  // ══════════════════════════════════════════════
  console.log('1. Navbar — bell with unread badge');
  mockApi(page, {
    ...baseMocks,
    '**/api/notifications/unread-count': { data: { count: 4 } },
    '**/api/notifications?**': notificationsMock,
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  const navbar = page.locator('header');
  await navbar.screenshot({ path: path.join(OUT_DIR, 'navbar-bell-badge.png') });
  console.log('   ✓ navbar-bell-badge.png');

  // ══════════════════════════════════════════════
  // 2. NotificationDropdown — open
  // ══════════════════════════════════════════════
  console.log('2. NotificationDropdown — open with grouped notifications');
  await page.click('[aria-label="通知"]');
  await page.waitForTimeout(600);

  let dropdown = page.locator('.animate-fade-in').first();
  await dropdown.screenshot({ path: path.join(OUT_DIR, 'notification-dropdown-open.png') });
  console.log('   ✓ notification-dropdown-open.png');

  await page.click('body', { position: { x: 10, y: 10 } });
  await page.waitForTimeout(300);

  // ══════════════════════════════════════════════
  // 3. NotificationDropdown — empty state
  // ══════════════════════════════════════════════
  console.log('3. NotificationDropdown — empty state');
  mockApi(page, {
    ...baseMocks,
    '**/api/notifications/unread-count': { data: { count: 0 } },
    '**/api/notifications?**': emptyNotificationsMock,
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  await page.click('[aria-label="通知"]');
  await page.waitForTimeout(300);

  dropdown = page.locator('.animate-fade-in').first();
  await dropdown.screenshot({ path: path.join(OUT_DIR, 'notification-dropdown-empty.png') });
  console.log('   ✓ notification-dropdown-empty.png');

  // ══════════════════════════════════════════════
  // 4. NotificationPage — all notifications
  // ══════════════════════════════════════════════
  console.log('4. NotificationPage — all notifications');
  // Go back to home with notifications mock
  mockApi(page, {
    ...baseMocks,
    '**/api/notifications/unread-count': { data: { count: 4 } },
    '**/api/notifications?**': notificationsMock,
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  await goToNotifications(page);

  await page.screenshot({ path: path.join(OUT_DIR, 'notification-page-all.png') });
  console.log('   ✓ notification-page-all.png');

  // ══════════════════════════════════════════════
  // 5. NotificationPage — filtered by "被点赞"
  // ══════════════════════════════════════════════
  console.log('5. NotificationPage — filtered by "被点赞"');
  // Click the "被点赞" tab (second button with this text, first is the tab)
  const allLikeBtns = page.locator('button:has-text("被点赞")');
  const count = await allLikeBtns.count();
  console.log(`   Found ${count} "被点赞" buttons`);
  await allLikeBtns.first().click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(OUT_DIR, 'notification-page-filtered.png') });
  console.log('   ✓ notification-page-filtered.png');

  // ══════════════════════════════════════════════
  // 6. NotificationPage — empty state
  // ══════════════════════════════════════════════
  console.log('6. NotificationPage — empty state');
  mockApi(page, {
    ...baseMocks,
    '**/api/notifications/unread-count': { data: { count: 0 } },
    '**/api/notifications?**': emptyNotificationsMock,
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 15000 });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  await goToNotifications(page);

  await page.screenshot({ path: path.join(OUT_DIR, 'notification-page-empty.png') });
  console.log('   ✓ notification-page-empty.png');

  await browser.close();
  console.log('\nDone! All screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
