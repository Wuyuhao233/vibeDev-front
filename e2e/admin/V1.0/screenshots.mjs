import { firefox } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = 'http://localhost:5173';

// Mock data
const mockStats = {
  todayNewUsers: 12,
  todayNewPosts: 45,
  todayNewReplies: 89,
  totalUsers: 1234,
  totalPosts: 5678,
  totalReplies: 9012,
  pendingReports: 3,
};

const mockTrend = [
  { date: '2026-04-30', users: 5, posts: 10, replies: 20 },
  { date: '2026-05-01', users: 8, posts: 15, replies: 25 },
  { date: '2026-05-02', users: 6, posts: 12, replies: 18 },
  { date: '2026-05-03', users: 10, posts: 22, replies: 35 },
  { date: '2026-05-04', users: 7, posts: 18, replies: 28 },
  { date: '2026-05-05', users: 12, posts: 28, replies: 42 },
  { date: '2026-05-06', users: 9, posts: 20, replies: 31 },
];

const mockBoards = [
  { id: 1, name: '综合讨论', slug: 'general', description: '综合讨论版', icon: '📋', postCount: 100, sortOrder: 1, status: 'active' },
  { id: 2, name: '技术交流', slug: 'tech', description: '技术版', icon: '💻', postCount: 50, sortOrder: 2, status: 'active' },
  { id: 3, name: '站务管理', slug: 'site', description: '站务', icon: '⚙️', postCount: 10, sortOrder: 3, status: 'archived' },
];

const mockUsers = [
  { id: 1, username: 'alice', email: 'alice@test.com', avatar: null, role: 'admin', level: 5, points: 1000, status: 'active', bannedUntil: null, createdAt: '2026-01-01' },
  { id: 2, username: 'bob', email: 'bob@test.com', avatar: null, role: 'user', level: 2, points: 200, status: 'active', bannedUntil: null, createdAt: '2026-02-01' },
  { id: 3, username: 'charlie', email: 'charlie@test.com', avatar: null, role: 'user', level: 1, points: 50, status: 'muted', bannedUntil: '2026-06-01', createdAt: '2026-03-01' },
];

const mockPosts = [
  { id: 1, title: '测试帖子一', author: { id: 1, username: 'alice', avatar: null }, board: { id: 1, name: '综合讨论' }, status: 'published', isPinned: true, isEssence: false, createdAt: '2026-05-01' },
  { id: 2, title: '测试帖子二', author: { id: 2, username: 'bob', avatar: null }, board: { id: 2, name: '技术交流' }, status: 'published', isPinned: false, isEssence: true, createdAt: '2026-05-02' },
  { id: 3, title: '测试帖子三', author: { id: 3, username: 'charlie', avatar: null }, board: null, status: 'deleted', isPinned: false, isEssence: false, createdAt: '2026-05-03' },
];

const mockReports = [
  { id: 1, type: 'post', targetId: 10, reason: '违规内容', description: '内容不适当', reporter: { id: 5, username: 'reporter' }, targetContent: '违规内容...', status: 'pending', boardId: 1, boardName: '综合讨论', createdAt: '2026-05-01' },
  { id: 2, type: 'reply', targetId: 20, reason: '垃圾广告', description: '', reporter: { id: 6, username: 'user2' }, targetContent: '广告...', status: 'handled', boardId: null, boardName: null, createdAt: '2026-05-02' },
];

const mockSensitiveWords = [
  { id: 1, word: '敏感词A', category: '通用', enabled: true, createdAt: '2026-01-01' },
  { id: 2, word: '敏感词B', category: '广告', enabled: true, createdAt: '2026-02-01' },
  { id: 3, word: '敏感词C', category: '辱骂', enabled: false, createdAt: '2026-03-01' },
];

const mockSettings = [
  { key: 'site.name', value: 'vibeDev Forum', description: '站点名称' },
  { key: 'site.description', value: '一个社区论坛', description: '站点描述' },
  { key: 'post.max_length', value: '10000', description: '帖子最大长度（字）' },
  { key: 'user.default_level', value: '1', description: '新用户默认等级' },
];

async function loginViaE2E(page) {
  await page.waitForFunction(() => typeof window.__authStore !== 'undefined', { timeout: 10000 });
  await page.evaluate(() => {
    window.__authStore.getState().login(
      { id: 1, username: 'admin', email: 'admin@vibedev.com', avatar: null, level: 5, role: 'admin' },
      'fake-access-token',
      'fake-refresh-token',
    );
  });
  await page.waitForTimeout(500);
}

async function setupMocks(page) {
  await page.route('**/api/admin/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockStats }) });
  });
  await page.route('**/api/admin/stats/trend*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockTrend }) });
  });
  await page.route('**/api/admin/boards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockBoards }) });
  });
  await page.route('**/api/admin/users*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: mockUsers, total: 3 } }) });
  });
  await page.route('**/api/admin/posts*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: mockPosts, total: 3 } }) });
  });
  await page.route('**/api/admin/reports*', async (route) => {
    const url = route.request().url();
    if (url.match(/\/admin\/reports\/\d+$/)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockReports[0] }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: mockReports, total: 2 } }) });
    }
  });
  await page.route('**/api/admin/sensitive-words*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: mockSensitiveWords, total: 3 } }) });
  });
  await page.route('**/api/admin/settings*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: mockSettings, total: 4 } }) });
  });
  await page.route('**/api/boards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: mockBoards }) });
  });
}

async function screenshot(page, name, fullPage = true) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  console.log('Starting admin E2E screenshots...\n');

  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await loginViaE2E(page);
    await setupMocks(page);

    // 1. Dashboard
    console.log('Dashboard...');
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await screenshot(page, '01-dashboard');

    // 2. Boards
    console.log('Boards...');
    await page.goto(`${BASE}/admin/boards`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '02-boards');

    // 3. Users
    console.log('Users...');
    await page.goto(`${BASE}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '03-users');

    // 4. Posts
    console.log('Posts...');
    await page.goto(`${BASE}/admin/posts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '04-posts');

    // 5. Reports
    console.log('Reports...');
    await page.goto(`${BASE}/admin/reports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '05-reports');

    // 6. Sensitive words
    console.log('Sensitive words...');
    await page.goto(`${BASE}/admin/sensitive-words`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '06-sensitive-words');

    // 7. Settings
    console.log('Settings...');
    await page.goto(`${BASE}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await screenshot(page, '07-settings');

    console.log('\nAll screenshots captured successfully!');
  } catch (err) {
    console.error('E2E error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
