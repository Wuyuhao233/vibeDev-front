import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = 'http://localhost:5175';

async function loginViaE2E(page, level = 5) {
  await page.waitForFunction(() => typeof window.__authStore !== 'undefined', { timeout: 10000 });
  await page.evaluate((lvl) => {
    window.__authStore.getState().login(
      { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: lvl },
      'fake-access-token',
      'fake-refresh-token',
    );
  }, level);
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Set up API mocks — use specific paths to avoid intercepting Vite source modules
  const mockUserProfile = { data: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, bio: 'Hello World', level: 5, points: 520, postCount: 15, replyCount: 42, createdAt: '2025-06-01T00:00:00Z' } };
  const mockBoards = { data: [{ id: 1, name: '综合讨论', slug: 'general', description: '综合话题', icon: null, postCount: 128, sortOrder: 1, tags: [{ id: 1, name: 'React', slug: 'react', sortOrder: 1 }] }] };
  const mockFolders = { data: [
    { id: 1, name: '技术文章', itemCount: 5, createdAt: '2026-03-01T00:00:00Z' },
    { id: 2, name: '设计资源', itemCount: 3, createdAt: '2026-04-01T00:00:00Z' },
    { id: 3, name: 'Go 进阶', itemCount: 2, createdAt: '2026-05-01T00:00:00Z' },
  ]};
  const mockCollectionItems = { data: { items: [
    { id: 1, title: 'React 19 新特性详解', boardName: '综合讨论', collectedAt: '2026-05-01T10:00:00Z' },
    { id: 2, title: 'TypeScript 5.8 类型体操', boardName: '综合讨论', collectedAt: '2026-04-28T14:30:00Z' },
    { id: 3, title: 'Vite 8 性能优化实践', boardName: '综合讨论', collectedAt: '2026-04-25T09:00:00Z' },
  ], total: 3 }};

  await page.route('**/api/users/testuser', async (route) => {
    if (route.request().url().includes('/posts') || route.request().url().includes('/replies') || route.request().url().includes('/collections')) {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUserProfile) });
  });
  await page.route('**/api/boards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBoards) });
  });
  await page.route('**/api/sensitive-words', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  await page.route('**/api/notifications/unread-count', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { count: 0 } }) });
  });
  await page.route('**/api/user/followed-tags', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  await page.route('**/api/users/testuser/posts*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [], total: 0 } }) });
  });
  await page.route('**/api/users/testuser/replies*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [], total: 0 } }) });
  });
  await page.route('**/api/users/testuser/collections*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCollectionItems) });
  });
  await page.route('**/api/collections', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFolders) });
  });

  // ── 1. FolderTabs — folder tabs on collection page ──
  console.log('1. FolderTabs — folder tabs on collection page');
  await page.goto(`${BASE}/u/testuser`, { waitUntil: 'networkidle' });
  await loginViaE2E(page, 5);

  // Click "我的收藏" tab
  const collectionsTab = page.locator('button', { hasText: '我的收藏' });
  await collectionsTab.click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, 'folder-tabs.png'), fullPage: false });
  console.log('   ✓ folder-tabs.png');

  // ── 2. Collection page — checkboxes visible for Lv.5 user ──
  console.log('2. Collection items with checkboxes (Lv.5)');
  // Checkboxes should be visible since level >= 3
  await page.screenshot({ path: path.join(OUT_DIR, 'collection-items-checkboxes.png'), fullPage: false });
  console.log('   ✓ collection-items-checkboxes.png');

  // ── 3. Select items → BatchMoveBar appears with folder dropdown ──
  console.log('3. BatchMoveBar — items selected with folder selector open');
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  console.log('   Found', count, 'checkboxes');
  if (count >= 2) {
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
  }
  await page.waitForTimeout(300);

  // Open folder selector
  const selectBtn = page.locator('.fixed.bottom-0 button', { hasText: '选择收藏夹' });
  if (await selectBtn.isVisible()) {
    await selectBtn.click();
  }
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(OUT_DIR, 'batch-move-bar-folder-selector.png'), fullPage: false });
  console.log('   ✓ batch-move-bar-folder-selector.png');

  // ── 4. Select target folder → confirm button enabled ──
  console.log('4. BatchMoveBar — folder selected, confirm enabled');
  // Click a folder in the dropdown
  const folderOption = page.locator('button', { hasText: 'Go 进阶' }).last();
  if (await folderOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await folderOption.click();
  }
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'batch-move-bar-confirm-enabled.png'), fullPage: false });
  console.log('   ✓ batch-move-bar-confirm-enabled.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
