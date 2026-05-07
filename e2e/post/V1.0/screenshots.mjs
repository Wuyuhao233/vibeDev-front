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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ── Mock boards list ──
  mockApi(page, {
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [
          { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
          { id: 2, name: '求助', slug: 'help', sortOrder: 2 },
          { id: 3, name: '教程', slug: 'tutorial', sortOrder: 3 },
        ]},
      ],
    },
  });

  // ── Mock post detail ──
  const postDetail = {
    data: {
      id: 1,
      title: 'React 18 最佳实践总结',
      content: `## 前言\n\nReact 18 带来了许多激动人心的新特性。本文将总结我们在实际项目中的**最佳实践**。\n\n### 1. 使用 Concurrent Features\n\n\`Suspense\` 和 \`useTransition\` 是 React 18 最重要的新增功能。\n\n\`\`\`tsx\nimport { Suspense, lazy } from 'react';\n\nconst HeavyComponent = lazy(() => import('./HeavyComponent'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Loading />}>\n      <HeavyComponent />\n    </Suspense>\n  );\n}\n\`\`\`\n\n### 2. Automatic Batching\n\nReact 18 自动批处理所有状态更新，无需手动优化。\n\n> 这是一个引用示例\n\n### 3. 使用 TypeScript\n\n- 强类型检查\n- 更好的 IDE 支持\n- 减少运行时错误\n\n了解更多请访问 [React 官方文档](https://react.dev)。`,
      contentMarkdown: `## 前言\n\nReact 18 带来了许多激动人心的新特性。本文将总结我们在实际项目中的**最佳实践**。\n\n### 1. 使用 Concurrent Features\n\n\`Suspense\` 和 \`useTransition\` 是 React 18 最重要的新增功能。\n\n\`\`\`tsx\nimport { Suspense, lazy } from 'react';\n\nconst HeavyComponent = lazy(() => import('./HeavyComponent'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Loading />}>\n      <HeavyComponent />\n    </Suspense>\n  );\n}\n\`\`\`\n\n### 2. Automatic Batching\n\nReact 18 自动批处理所有状态更新，无需手动优化。\n\n> 这是一个引用示例\n\n### 3. 使用 TypeScript\n\n- 强类型检查\n- 更好的 IDE 支持\n- 减少运行时错误\n\n了解更多请访问 [React 官方文档](https://react.dev)。`,
      author: { id: 1, username: 'react_master', avatar: null, level: 4 },
      board: { id: 1, name: '综合讨论', slug: 'general' },
      tags: [
        { id: 1, name: 'React', slug: 'react' },
        { id: 2, name: 'TypeScript', slug: 'typescript' },
      ],
      likeCount: 42,
      replyCount: 8,
      collectCount: 15,
      viewCount: 356,
      isLiked: false,
      isCollected: false,
      isPinned: false,
      isEssence: true,
      version: 3,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      lastEditedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  };

  // Post detail
  mockApi(page, {
    '**/api/posts/1': postDetail,
    '**/api/posts/1/view': { data: { success: true } },
    '**/api/posts/1/pin': { data: { success: true } },
    '**/api/posts/1/essence': { data: { success: true, isEssence: false } },
  });

  // Replies
  mockApi(page, {
    '**/api/posts/1/replies?**': {
      data: {
        items: [
          {
            id: 101,
            content: '写得很好！React 18 的 Concurrent Mode 确实改变了开发方式。',
            author: { id: 2, username: 'vue_fan', avatar: null, level: 3 },
            parentId: null,
            floorNumber: 1,
            likeCount: 12,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 5400000).toISOString(),
            updatedAt: new Date(Date.now() - 5400000).toISOString(),
          },
          {
            id: 102,
            content: '补充一点：`useDeferredValue` 在处理大量数据渲染时也非常有用。\n\n```tsx\nconst deferredQuery = useDeferredValue(query);\n```',
            author: { id: 3, username: 'js_dev', avatar: null, level: 2 },
            parentId: null,
            floorNumber: 2,
            likeCount: 8,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 103,
            content: '感谢分享，收藏了！',
            author: { id: 4, username: 'beginner', avatar: null, level: 1 },
            parentId: null,
            floorNumber: 3,
            likeCount: 3,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            updatedAt: new Date(Date.now() - 1800000).toISOString(),
          },
        ],
        total: 8,
      },
    },
  });

  // Sensitive words
  mockApi(page, {
    '**/api/sensitive-words': { data: ['敏感词1', '违规内容', '广告'] },
  });

  // ── 1. Post Detail Page — full view ──
  console.log('1. Post Detail — full page');
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-detail.png'), fullPage: true });
  console.log('   ✓ post-detail.png');

  // ── 2. Post Detail — 404 not found ──
  console.log('2. Post Detail — 404 not found');
  page.route('**/api/posts/999', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ errorCode: 'NOT_FOUND (30001)', message: '帖子不存在' }),
    });
  });
  mockApi(page, { '**/api/posts/999/replies?**': { data: { items: [], total: 0 } } });
  await page.goto(`${BASE}/post/999`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-404.png'), fullPage: true });
  console.log('   ✓ post-404.png');

  // ── 3. Post Detail — deleted post (author view) ──
  console.log('3. Post Detail — deleted (author view)');
  const deletedPost = {
    data: {
      ...postDetail.data,
      id: 2,
      title: '已删除的帖子',
      content: '这条帖子已被删除',
      contentMarkdown: '这条帖子已被删除',
      isDeleted: true,
      isEssence: false,
      author: { id: 1, username: 'test_user', avatar: null, level: 2 },
    },
  };
  mockApi(page, { '**/api/posts/2': deletedPost });
  mockApi(page, { '**/api/posts/2/replies?**': { data: { items: [], total: 0 } } });
  mockApi(page, { '**/api/posts/2/view': { data: { success: true } } });

  await page.goto(`${BASE}/post/2`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-deleted-author.png'), fullPage: true });
  console.log('   ✓ post-deleted-author.png');

  // ── 4. Post Detail — empty replies ──
  console.log('4. Post Detail — empty replies');
  mockApi(page, {
    '**/api/posts/1/replies?**': { data: { items: [], total: 0 } },
  });
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-no-replies.png'), fullPage: true });
  console.log('   ✓ post-no-replies.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
