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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // ── Mock API routes ──
  mockApi(page, {
    // Boards list
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '', icon: null, postCount: 128, sortOrder: 1 },
        { id: 2, name: '技术交流', slug: 'tech', description: '', icon: null, postCount: 86, sortOrder: 2 },
        { id: 3, name: '项目反馈', slug: 'feedback', description: '', icon: null, postCount: 34, sortOrder: 3 },
        { id: 4, name: '资源分享', slug: 'resources', description: '', icon: null, postCount: 55, sortOrder: 4 },
        { id: 5, name: '站务公告', slug: 'announcements', description: '', icon: null, postCount: 12, sortOrder: 5 },
      ],
    },
  });

  // Board detail with tags
  const boardDetail = {
    data: {
      id: 1,
      name: '综合讨论',
      slug: 'general',
      description: '各类话题的综合讨论区，欢迎畅所欲言',
      icon: null,
      postCount: 128,
      sortOrder: 1,
      tags: [
        { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
        { id: 2, name: '求助', slug: 'help', sortOrder: 2 },
        { id: 3, name: '教程', slug: 'tutorial', sortOrder: 3 },
        { id: 4, name: '转载', slug: 'repost', sortOrder: 4 },
        { id: 5, name: '原创', slug: 'original', sortOrder: 5 },
      ],
    },
  };

  mockApi(page, {
    '**/api/boards/general': boardDetail,
    '**/api/boards/1': boardDetail,
  });

  // Board posts
  mockApi(page, {
    '**/api/boards/general/posts?**': {
      data: {
        items: [
          {
            id: 101, title: '欢迎来到综合讨论版块！', content: '这是第一条帖子，欢迎大家参与讨论。',
            contentSummary: '这是第一条帖子，欢迎大家参与讨论。',
            author: { id: 1, username: 'admin', avatar: null, level: 5 },
            board: { id: 1, name: '综合讨论', slug: 'general' },
            tags: [{ id: 1, name: '闲聊', slug: 'chat' }],
            likeCount: 42, replyCount: 18, collectCount: 5,
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            isPinned: true, isEssence: false,
          },
          {
            id: 102, title: '分享一个 React 性能优化技巧', content: '使用 React.memo 和 useMemo 可以显著提升性能...',
            contentSummary: '使用 React.memo 和 useMemo 可以显著提升性能...',
            coverImageUrl: null,
            author: { id: 2, username: 'react_fan', avatar: null, level: 3 },
            board: { id: 1, name: '综合讨论', slug: 'general' },
            tags: [{ id: 2, name: 'React', slug: 'react' }, { id: 3, name: 'TypeScript', slug: 'typescript' }],
            likeCount: 28, replyCount: 12, collectCount: 8,
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
            isPinned: false, isEssence: true,
          },
          {
            id: 103, title: '新人报到，请多关照', content: '大家好，我是新来的，请多多关照！',
            contentSummary: '大家好，我是新来的，请多多关照！',
            coverImageUrl: null,
            author: { id: 3, username: 'newbie', avatar: null, level: 1 },
            board: { id: 1, name: '综合讨论', slug: 'general' },
            tags: [{ id: 1, name: '闲聊', slug: 'chat' }],
            likeCount: 5, replyCount: 20, collectCount: 0,
            createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 128,
      },
    },
  });

  // Home feed (trending)
  mockApi(page, {
    '**/api/home/feed?tab=trending**': {
      data: {
        items: [
          {
            id: 201, title: '本周热门： Rust vs Go 性能对比', content: '在这篇文章中我们详细对比了 Rust 和 Go...',
            contentSummary: '在这篇文章中我们详细对比了 Rust 和 Go 的性能表现...',
            coverImageUrl: null,
            author: { id: 4, username: 'tech_writer', avatar: null, level: 4 },
            board: { id: 2, name: '技术交流', slug: 'tech' },
            tags: [{ id: 1, name: 'Rust', slug: 'rust' }, { id: 2, name: 'Go', slug: 'go' }],
            likeCount: 156, replyCount: 67, collectCount: 32,
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
          {
            id: 202, title: '前端框架 2026 趋势分析', content: 'React、Vue、Svelte 三大框架最新动态...',
            contentSummary: 'React、Vue、Svelte 三大框架最新动态...',
            coverImageUrl: null,
            author: { id: 5, username: 'frontend_guru', avatar: null, level: 3 },
            board: { id: 2, name: '技术交流', slug: 'tech' },
            tags: [{ id: 3, name: '前端', slug: 'frontend' }],
            likeCount: 89, replyCount: 34, collectCount: 15,
            createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
            isPinned: false, isEssence: true,
          },
          {
            id: 203, title: '开源项目推荐：轻量级 API 网关', content: '推荐一个自己写的轻量级 API 网关...',
            contentSummary: '推荐一个自己写的轻量级 API 网关...',
            coverImageUrl: null,
            author: { id: 6, username: 'oss_lover', avatar: null, level: 2 },
            board: { id: 4, name: '资源分享', slug: 'resources' },
            tags: [{ id: 3, name: '教程', slug: 'tutorial' }],
            likeCount: 45, replyCount: 12, collectCount: 28,
            createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 3,
      },
    },
  });

  // Empty feed for following tab
  mockApi(page, {
    '**/api/home/feed?tab=following**': {
      data: { items: [], total: 0 },
    },
  });

  // ── 1. HomePage — Trending Tab ──
  console.log('1. HomePage — Trending Tab');
  await page.goto(`${BASE}/?tab=trending`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'home-trending.png'), fullPage: true });
  console.log('   ✓ home-trending.png');

  // ── 2. HomePage — Following Tab (empty) ──
  console.log('2. HomePage — Following Tab (empty state)');
  // Mock auth to show logged-in state for following tab
  page.route('**/api/home/feed?tab=following**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { items: [], total: 0 } }),
    });
  });
  await page.goto(`${BASE}/?tab=following`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'home-following-empty.png'), fullPage: true });
  console.log('   ✓ home-following-empty.png');

  // ── 3. BoardPage with posts ──
  console.log('3. BoardPage — with posts');
  await page.goto(`${BASE}/board/general`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-with-posts.png'), fullPage: true });
  console.log('   ✓ board-with-posts.png');

  // ── 4. BoardPage empty state (no posts) ──
  console.log('4. BoardPage — empty state');
  mockApi(page, {
    '**/api/boards/general/posts?**': { data: { items: [], total: 0 } },
  });
  await page.goto(`${BASE}/board/general`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-empty.png'), fullPage: true });
  console.log('   ✓ board-empty.png');

  // ── 5. BoardPage 404 ──
  console.log('5. BoardPage — 404 not found');
  page.route('**/api/boards/nonexistent', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ errorCode: 'NOT_FOUND (30001)', message: '版块不存在' }),
    });
  });
  await page.goto(`${BASE}/board/nonexistent`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-404.png'), fullPage: true });
  console.log('   ✓ board-404.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
