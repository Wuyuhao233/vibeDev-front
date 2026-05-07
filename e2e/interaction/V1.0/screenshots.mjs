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

async function loginViaE2E(page) {
  // Wait for authStore to be exposed
  await page.waitForFunction(() => !!window.__authStore, { timeout: 10000 });
  await page.evaluate(() => {
    const store = window.__authStore;
    store.getState().login(
      { id: 1, username: 'test_user', email: 'test@test.com', avatar: null, level: 3 },
      'fake-access-token',
      'fake-refresh-token',
    );
  });
  // Let React re-render
  await page.waitForTimeout(300);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ── Shared mocks ──
  mockApi(page, {
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [
          { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
        ]},
      ],
    },
    '**/api/sensitive-words': { data: [] },
  });

  const postBase = {
    id: 1,
    title: 'React 18 最佳实践总结',
    content: '这是一篇关于React 18最佳实践的文章。',
    contentMarkdown: '这是一篇关于React 18最佳实践的文章。',
    author: { id: 1, username: 'react_master', avatar: null, level: 4 },
    board: { id: 1, name: '综合讨论', slug: 'general' },
    tags: [{ id: 1, name: 'React', slug: 'react' }],
    likeCount: 42,
    replyCount: 2,
    collectCount: 15,
    viewCount: 356,
    isPinned: false,
    isEssence: true,
    version: 3,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    lastEditedAt: null,
  };

  const replies = {
    data: {
      items: [
        {
          id: 101, content: '写得很好！React 18 的 Concurrent Mode 确实改变了开发方式。',
          author: { id: 2, username: 'vue_fan', avatar: null, level: 3 },
          parentId: null, floorNumber: 1, likeCount: 12, isLiked: false,
          isDeleted: false, version: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 102, content: '感谢分享！',
          author: { id: 3, username: 'js_dev', avatar: null, level: 2 },
          parentId: null, floorNumber: 2, likeCount: 5, isLiked: true,
          isDeleted: false, version: 1,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      total: 2,
    },
  };

  // ── 1. Action bar — unliked + uncollected (authenticated) ──
  console.log('1. Action bar — unliked & uncollected');
  mockApi(page, {
    '**/api/posts/1': { data: { ...postBase, isLiked: false, isCollected: false } },
    '**/api/posts/1/view': { data: { success: true } },
    '**/api/posts/1/replies?**': replies,
  });
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  let bar = page.locator('.post-detail div.flex.items-center.gap-6').first();
  await bar.screenshot({ path: path.join(OUT_DIR, 'action-bar-unliked-uncollected.png') });
  console.log('   ✓ action-bar-unliked-uncollected.png');

  // ── 2. Action bar — liked + collected (authenticated) ──
  console.log('2. Action bar — liked & collected');
  mockApi(page, {
    '**/api/posts/2': { data: { ...postBase, id: 2, isLiked: true, isCollected: true, likeCount: 99, collectCount: 30 } },
    '**/api/posts/2/view': { data: { success: true } },
    '**/api/posts/2/replies?**': { data: { items: [], total: 0 } },
  });
  await page.goto(`${BASE}/post/2`, { waitUntil: 'networkidle' });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  bar = page.locator('.post-detail div.flex.items-center.gap-6').first();
  await bar.screenshot({ path: path.join(OUT_DIR, 'action-bar-liked-collected.png') });
  console.log('   ✓ action-bar-liked-collected.png');

  // ── 3. LikeButton — heart animation on click ──
  console.log('3. LikeButton — heart animation on click');
  mockApi(page, { '**/api/likes': { data: { success: true } } });
  mockApi(page, {
    '**/api/posts/3': { data: { ...postBase, id: 3, isLiked: false, isCollected: false, likeCount: 1, collectCount: 0 } },
    '**/api/posts/3/view': { data: { success: true } },
    '**/api/posts/3/replies?**': { data: { items: [], total: 0 } },
  });
  await page.goto(`${BASE}/post/3`, { waitUntil: 'networkidle' });
  await loginViaE2E(page);
  await page.waitForTimeout(500);

  // Click like button to trigger heart animation
  const likeBtn = page.locator('.post-detail div.flex.items-center.gap-6 button').first();
  await likeBtn.click();
  await page.waitForTimeout(80);

  bar = page.locator('.post-detail div.flex.items-center.gap-6').first();
  await bar.screenshot({ path: path.join(OUT_DIR, 'like-button-heart-animation.png') });
  console.log('   ✓ like-button-heart-animation.png');

  // ── 4. Reply items — LikeButton (unliked + liked) ──
  console.log('4. Reply items — LikeButton states');
  mockApi(page, {
    '**/api/posts/1': { data: { ...postBase, isLiked: false, isCollected: false } },
    '**/api/posts/1/view': { data: { success: true } },
    '**/api/posts/1/replies?**': replies,
  });
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  // Scroll to replies section
  await page.evaluate(() => {
    const el = document.querySelector('.reply-tree');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'reply-like-buttons.png'), fullPage: false });
  console.log('   ✓ reply-like-buttons.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
