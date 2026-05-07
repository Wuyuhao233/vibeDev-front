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
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '', icon: null, postCount: 128, sortOrder: 1 },
        { id: 2, name: '技术交流', slug: 'tech', description: '', icon: null, postCount: 86, sortOrder: 2 },
        { id: 3, name: '项目反馈', slug: 'feedback', description: '', icon: null, postCount: 34, sortOrder: 3 },
        { id: 4, name: '资源分享', slug: 'resources', description: '', icon: null, postCount: 55, sortOrder: 4 },
        { id: 5, name: '站务公告', slug: 'announcements', description: '', icon: null, postCount: 12, sortOrder: 5 },
      ],
    },
    '**/api/user/followed-tags': {
      data: [
        { id: 1, name: 'React', slug: 'react' },
        { id: 2, name: 'TypeScript', slug: 'typescript' },
        { id: 3, name: '前端', slug: 'frontend' },
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

  // Home feed — recommend (V1.1 rule engine results)
  mockApi(page, {
    '**/api/home/feed?tab=recommend**': {
      data: {
        items: [
          {
            id: 301, title: '[推荐] 本周精选：Rust vs Go 性能对比', content: '在这篇文章中我们详细对比了 Rust 和 Go...',
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
            id: 302, title: '[推荐] 前端框架 2026 趋势分析', content: 'React、Vue、Svelte 三大框架最新动态...',
            contentSummary: 'React、Vue、Svelte 三大框架最新动态...',
            coverImageUrl: null,
            author: { id: 5, username: 'frontend_guru', avatar: null, level: 3 },
            board: { id: 2, name: '技术交流', slug: 'tech' },
            tags: [{ id: 3, name: '前端', slug: 'frontend' }],
            likeCount: 89, replyCount: 34, collectCount: 15,
            createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
            isPinned: false, isEssence: true,
          },
        ],
        total: 2,
      },
    },
    // Home feed — trending
    '**/api/home/feed?tab=trending**': {
      data: {
        items: [
          {
            id: 201, title: '本周热门：Rust vs Go 性能对比', content: '在这篇文章中我们详细对比了 Rust 和 Go...',
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
    // Home feed — following (with posts)
    '**/api/home/feed?tab=following**': {
      data: {
        items: [
          {
            id: 401, title: '关注推送：React 19 新特性速览', content: 'React 19 带来了许多令人兴奋的新特性...',
            contentSummary: 'React 19 带来了许多令人兴奋的新特性...',
            coverImageUrl: null,
            author: { id: 7, username: 'react_dev', avatar: null, level: 4 },
            board: { id: 2, name: '技术交流', slug: 'tech' },
            tags: [{ id: 1, name: 'React', slug: 'react' }],
            likeCount: 67, replyCount: 23, collectCount: 12,
            createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
          {
            id: 402, title: '关注推送：TypeScript 5.8 类型体操', content: 'TypeScript 5.8 引入了一些高级类型特性...',
            contentSummary: 'TypeScript 5.8 引入了一些高级类型特性...',
            coverImageUrl: null,
            author: { id: 8, username: 'ts_master', avatar: null, level: 5 },
            board: { id: 2, name: '技术交流', slug: 'tech' },
            tags: [{ id: 2, name: 'TypeScript', slug: 'typescript' }],
            likeCount: 42, replyCount: 15, collectCount: 9,
            createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 2,
      },
    },
  });

  function waitForRender() {
    return page.evaluate(async () => { await document.fonts.ready; });
  }

  // ── 1. HomePage — Recommend Tab (V1.1 rule engine, not degraded to trending) ──
  console.log('1. HomePage — Recommend Tab (V1.1 rule engine)');
  await page.goto(`${BASE}/?tab=recommend`, { waitUntil: 'networkidle' });
  await waitForRender();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'home-recommend.png'), fullPage: true });
  console.log('   ✓ home-recommend.png');

  // ── 2. HomePage — Trending Tab ──
  console.log('2. HomePage — Trending Tab');
  await page.goto(`${BASE}/?tab=trending`, { waitUntil: 'networkidle' });
  await waitForRender();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'home-trending-v11.png'), fullPage: true });
  console.log('   ✓ home-trending-v11.png');

  // ── 3. BoardPage — with trending sort option (V1.1: 热门/最新/热榜) ──
  console.log('3. BoardPage — trending sort visible (V1.1)');
  await page.goto(`${BASE}/board/general`, { waitUntil: 'networkidle' });
  await waitForRender();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-trending-sort.png'), fullPage: true });
  console.log('   ✓ board-trending-sort.png');

  // ── 4. BoardPage — tag filter hover reveals follow icon ──
  console.log('4. BoardPage — tag hover follow icon');
  const tagBtn = page.locator('.tag-filter__item', { hasText: '闲聊' });
  await tagBtn.hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-tag-hover-follow.png'), fullPage: true });
  console.log('   ✓ board-tag-hover-follow.png');

  // ── 5. BoardPage — followed tag with visible × unfollow icon ──
  console.log('5. BoardPage — followed tag (× visible)');
  // Mock followed tags to include the board's tags
  mockApi(page, {
    '**/api/user/followed-tags': {
      data: [
        { id: 1, name: '闲聊', slug: 'chat' },
        { id: 3, name: '教程', slug: 'tutorial' },
      ],
    },
  });
  await page.goto(`${BASE}/board/general`, { waitUntil: 'networkidle' });
  await waitForRender();
  // Hover over the first tag
  const firstTag = page.locator('.tag-filter__item', { hasText: '闲聊' });
  await firstTag.hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'board-tag-followed-visible.png'), fullPage: true });
  console.log('   ✓ board-tag-followed-visible.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
