import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = 'http://localhost:5173';

const MOCK_USER = { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: 3 };

const MOCK_PROFILE = {
  id: 1, username: 'testuser', email: 'test@test.com', avatar: null,
  bio: 'Hello world', level: 3, points: 450, postCount: 15, replyCount: 30,
  createdAt: '2025-06-01T10:00:00Z',
};

function mockApi(page, routes) {
  Object.entries(routes).forEach(([pattern, data]) => {
    page.route(pattern, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
  });
}

async function setAuth(page) {
  await page.evaluate(({ user }) => {
    const store = window.__authStore;
    if (store) store.getState().login(user, 'mock-at', 'mock-rt');
  }, { user: MOCK_USER });
}

// Common mock routes needed by all pages
const COMMON_MOCKS = {
  // Boards (LeftSidebar)
  '**/api/boards': { data: [
    { id: 1, name: '综合讨论', slug: 'general', description: '', icon: null, postCount: 42, sortOrder: 0 },
    { id: 2, name: '技术交流', slug: 'tech', description: '', icon: null, postCount: 28, sortOrder: 1 },
  ]},
  // Followed tags (LeftSidebar when authenticated)
  '**/api/tags/followed': { data: [] },
  // Notifications (Navbar NotificationDropdown)
  '**/api/notifications/unread-count': { data: { count: 0 } },
  '**/api/notifications**': { data: { items: [], total: 0, unreadCount: 0 } },
  // User profile (Navbar user menu)
  '**/api/users/me': { data: MOCK_PROFILE },
  // Home feed (HomePage)
  '**/api/home/feed**': { data: { items: [], total: 0 } },
  // Generic posts
  '**/api/posts**': { data: { items: [], total: 0 } },
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // ─── 1. Check-in button — unchecked state ───
  mockApi(page, {
    ...COMMON_MOCKS,
    '**/api/v1/users/testuser/sign-in': { data: { points: 5, consecutiveDays: 3 } },
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await setAuth(page);
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(OUT_DIR, 'checkin-unchecked.png'), fullPage: true });
  console.log('✓ checkin-unchecked.png');

  // ─── 2. Check-in button — checked in ───
  await page.evaluate(() => {
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem('vibeDev:checkin:' + today, 'true');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await setAuth(page);
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'checkin-checked.png'), fullPage: true });
  console.log('✓ checkin-checked.png');

  // ─── 3. Profile page — level progress bar ───
  await page.evaluate(() => sessionStorage.clear());

  mockApi(page, {
    ...COMMON_MOCKS,
    '**/api/users/testuser': { data: MOCK_PROFILE },
    '**/api/users/testuser/posts**': { data: { items: [], total: 0 } },
    '**/api/users/testuser/replies**': { data: { items: [], total: 0 } },
    '**/api/users/testuser/collections**': { data: { items: [], total: 0 } },
    '**/api/users/me/browse-history**': { data: { items: [], total: 0 } },
    '**/api/users/me/collections/folders**': { data: [] },
    '**/api/v1/users/testuser/points**': { data: { items: [], total: 0 } },
  });

  await page.goto(BASE + '/u/testuser', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await setAuth(page);
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'profile-level-progress.png'), fullPage: true });
  console.log('✓ profile-level-progress.png');

  // ─── 4. Profile page — points history tab ───
  mockApi(page, {
    ...COMMON_MOCKS,
    '**/api/users/testuser': { data: MOCK_PROFILE },
    '**/api/users/testuser/posts**': { data: { items: [], total: 0 } },
    '**/api/users/testuser/replies**': { data: { items: [], total: 0 } },
    '**/api/users/testuser/collections**': { data: { items: [], total: 0 } },
    '**/api/users/me/browse-history**': { data: { items: [], total: 0 } },
    '**/api/users/me/collections/folders**': { data: [] },
    '**/api/v1/users/testuser/points**': {
      data: {
        items: [
          { id: 1, description: '每日签到', points: 5, createdAt: '2026-05-07T08:00:00Z' },
          { id: 2, description: '发布帖子', points: 10, createdAt: '2026-05-06T15:30:00Z' },
          { id: 3, description: '帖子被设为精华', points: 50, createdAt: '2026-05-05T12:00:00Z' },
          { id: 4, description: '违规被扣积分', points: -20, createdAt: '2026-05-04T09:00:00Z' },
          { id: 5, description: '收到点赞', points: 2, createdAt: '2026-05-03T20:15:00Z' },
        ],
        total: 5,
      },
    },
  });

  await page.goto(BASE + '/u/testuser', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await setAuth(page);
  await page.waitForTimeout(500);

  // Click "积分记录" tab
  const pointsTab = page.locator('button', { hasText: '积分记录' });
  if (await pointsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pointsTab.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'profile-points-history.png'), fullPage: true });
  console.log('✓ profile-points-history.png');

  // ─── 5. Leaderboard — weekly ───
  mockApi(page, {
    ...COMMON_MOCKS,
    '**/api/v1/leaderboard**': {
      data: {
        items: [
          { rank: 1, userId: 10, username: '积分达人', avatar: null, points: 5000 },
          { rank: 2, userId: 11, username: '活跃用户', avatar: null, points: 4200 },
          { rank: 3, userId: 12, username: '数码玩家', avatar: null, points: 3800 },
          { rank: 4, userId: 13, username: '文艺青年', avatar: null, points: 3100 },
          { rank: 5, userId: 14, username: '科技先锋', avatar: null, points: 2800 },
          { rank: 6, userId: 1, username: 'testuser', avatar: null, points: 1500 },
          { rank: 7, userId: 15, username: '旅行者', avatar: null, points: 1200 },
          { rank: 8, userId: 16, username: '美食家', avatar: null, points: 900 },
        ],
        total: 20,
        currentUser: { rank: 6, points: 1500 },
      },
    },
  });

  await page.goto(BASE + '/leaderboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await setAuth(page);
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'leaderboard-weekly.png'), fullPage: true });
  console.log('✓ leaderboard-weekly.png');

  // ─── 6. Leaderboard — all-time tab ───
  const allTimeTab = page.locator('button', { hasText: '总榜' });
  if (await allTimeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await allTimeTab.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'leaderboard-alltime.png'), fullPage: true });
  console.log('✓ leaderboard-alltime.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
