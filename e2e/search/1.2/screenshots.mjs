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
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/wyh/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-audio-output'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Mock boards list
  mockApi(page, {
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1 },
        { id: 2, name: '技术分享', slug: 'tech', description: '技术经验分享', icon: null, postCount: 86, sortOrder: 2 },
        { id: 3, name: '问答求助', slug: 'qa', description: '技术问答和求助', icon: null, postCount: 64, sortOrder: 3 },
      ],
    },
  });

  // Mock trending searches
  mockApi(page, {
    '**/api/v1/search/suggestions': {
      data: [
        { keyword: 'React', count: 120 },
        { keyword: 'TypeScript', count: 80 },
        { keyword: 'Vue', count: 65 },
        { keyword: 'Node.js', count: 55 },
        { keyword: 'Python', count: 45 },
        { keyword: 'Docker', count: 38 },
        { keyword: 'Kubernetes', count: 30 },
        { keyword: 'GraphQL', count: 25 },
      ],
    },
  });

  // Mock search suggestions
  mockApi(page, {
    '**/api/v1/search/suggest**': {
      data: [
        { keyword: 'React Hooks', count: 45 },
        { keyword: 'React Router', count: 32 },
        { keyword: 'React Native', count: 28 },
        { keyword: 'React 状态管理', count: 18 },
        { keyword: 'React 面试题', count: 15 },
      ],
    },
  });

  // Mock search results — with searchTime for relevance indicator
  mockApi(page, {
    '**/api/v1/search?q=react**': {
      data: {
        items: [
          {
            id: 1,
            title: 'React 18 最佳实践总结',
            titleHighlighted: '<mark>React</mark> 18 最佳实践总结',
            contentExcerpt: '本文总结了 React 18 在实际项目中的最佳实践...',
            contentExcerptHighlighted: '本文总结了 <mark>React</mark> 18 在实际项目中的最佳实践...',
            author: { id: 1, username: 'react_master', avatar: null, level: 4 },
            board: { id: 2, name: '技术分享', slug: 'tech' },
            tags: [
              { id: 1, name: 'React', slug: 'react' },
              { id: 2, name: 'TypeScript', slug: 'ts' },
            ],
            likeCount: 42, replyCount: 8, collectCount: 15,
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            isPinned: false, isEssence: true,
          },
          {
            id: 2,
            title: '深入理解 React Hooks 原理',
            titleHighlighted: '深入理解 <mark>React</mark> Hooks 原理',
            contentExcerpt: 'React Hooks 是 React 16.8 引入的新特性...',
            contentExcerptHighlighted: '<mark>React</mark> Hooks 是 <mark>React</mark> 16.8 引入的新特性...',
            author: { id: 2, username: 'hook_expert', avatar: null, level: 3 },
            board: { id: 2, name: '技术分享', slug: 'tech' },
            tags: [
              { id: 1, name: 'React', slug: 'react' },
              { id: 3, name: 'Hooks', slug: 'hooks' },
            ],
            likeCount: 28, replyCount: 15, collectCount: 22,
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
            isPinned: true, isEssence: false,
          },
          {
            id: 3,
            title: 'React vs Vue 2024 全面对比',
            titleHighlighted: '<mark>React</mark> vs Vue 2024 全面对比',
            contentExcerpt: '对比 React 和 Vue 在 2024 年的生态、性能和学习曲线...',
            contentExcerptHighlighted: '对比 <mark>React</mark> 和 Vue 在 2024 年的生态、性能和学习曲线...',
            author: { id: 3, username: 'frontend_fan', avatar: null, level: 2 },
            board: { id: 1, name: '综合讨论', slug: 'general' },
            tags: [
              { id: 1, name: 'React', slug: 'react' },
              { id: 4, name: 'Vue', slug: 'vue' },
            ],
            likeCount: 15, replyCount: 32, collectCount: 8,
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
          {
            id: 4,
            title: '使用 React Router 构建 SPA',
            titleHighlighted: '使用 <mark>React</mark> Router 构建 SPA',
            contentExcerpt: '介绍如何使用 React Router v6 构建单页应用...',
            contentExcerptHighlighted: '介绍如何使用 <mark>React</mark> Router v6 构建单页应用的路由系统...',
            author: { id: 4, username: 'router_guy', avatar: null, level: 1 },
            board: { id: 2, name: '技术分享', slug: 'tech' },
            tags: [{ id: 1, name: 'React', slug: 'react' }],
            likeCount: 9, replyCount: 4, collectCount: 3,
            createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 42,
        page: 1,
        pageSize: 20,
        searchTime: '0.42s',
      },
    },
    '**/api/v1/search?q=vue**': {
      data: {
        items: [
          {
            id: 5,
            title: 'Vue 3 Composition API 入门',
            titleHighlighted: '<mark>Vue</mark> 3 Composition API 入门',
            contentExcerpt: 'Vue 3 引入的 Composition API 让逻辑复用更简单...',
            contentExcerptHighlighted: '<mark>Vue</mark> 3 引入的 Composition API 让逻辑复用更简单...',
            author: { id: 5, username: 'vue_dev', avatar: null, level: 3 },
            board: { id: 2, name: '技术分享', slug: 'tech' },
            tags: [{ id: 4, name: 'Vue', slug: 'vue' }],
            likeCount: 20, replyCount: 10, collectCount: 5,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 28,
        page: 1,
        pageSize: 20,
        searchTime: '0.18s',
      },
    },
  });

  // ── 1. Search suggestions dropdown while typing ──
  console.log('1. Search suggestions — dropdown while typing');
  await page.goto(`${BASE}/search`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  // Type into search box to trigger suggestions
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.fill('React');
  await page.waitForTimeout(600); // Wait for debounce + API mock
  await page.screenshot({ path: path.join(OUT_DIR, 'search-suggestions-dropdown.png'), fullPage: false });
  console.log('   OK search-suggestions-dropdown.png');

  // ── 2. Search results with relevance sort indicator + search time ──
  console.log('2. Search results — relevance indicator + search time');
  await page.goto(`${BASE}/search?q=react`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'search-relevance-indicator.png'), fullPage: true });
  console.log('   OK search-relevance-indicator.png');

  // ── 3. Trending sidebar on results page ──
  console.log('3. Trending sidebar on results page');
  await page.goto(`${BASE}/search?q=react`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  // Scroll to ensure sidebar is visible
  await page.screenshot({ path: path.join(OUT_DIR, 'search-trending-sidebar.png'), fullPage: true });
  console.log('   OK search-trending-sidebar.png');

  // ── 4. Client-side highlighted results (fallback highlight) ──
  console.log('4. Client-side keyword highlighting fallback');
  // Mock search results WITHOUT server-side highlights
  mockApi(page, {
    '**/api/v1/search?q=vue**': {
      data: {
        items: [
          {
            id: 5,
            title: 'Vue 3 Composition API 入门',
            titleHighlighted: undefined,
            contentExcerpt: 'Vue 3 引入的 Composition API 让逻辑复用更简单，新的 setup 语法糖让开发体验大幅提升。',
            contentExcerptHighlighted: undefined,
            author: { id: 5, username: 'vue_dev', avatar: null, level: 3 },
            board: { id: 2, name: '技术分享', slug: 'tech' },
            tags: [{ id: 4, name: 'Vue', slug: 'vue' }],
            likeCount: 20, replyCount: 10, collectCount: 5,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
          {
            id: 6,
            title: 'Vue vs React 技术选型指南',
            titleHighlighted: undefined,
            contentExcerpt: '从 Vue 的渐进式特性到 React 的函数式哲学，全面对比两个主流框架。',
            contentExcerptHighlighted: undefined,
            author: { id: 6, username: 'compare_dev', avatar: null, level: 2 },
            board: { id: 1, name: '综合讨论', slug: 'general' },
            tags: [
              { id: 4, name: 'Vue', slug: 'vue' },
              { id: 1, name: 'React', slug: 'react' },
            ],
            likeCount: 35, replyCount: 22, collectCount: 12,
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
            isPinned: false, isEssence: false,
          },
        ],
        total: 28,
        page: 1,
        pageSize: 20,
        searchTime: '0.18s',
      },
    },
  });
  await page.goto(`${BASE}/search?q=vue`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'search-client-highlight.png'), fullPage: true });
  console.log('   OK search-client-highlight.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
