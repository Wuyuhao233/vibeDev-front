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
        { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [
          { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
          { id: 2, name: '求助', slug: 'help', sortOrder: 2 },
          { id: 3, name: '教程', slug: 'tutorial', sortOrder: 3 },
        ]},
      ],
    },
  });

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

  mockApi(page, {
    '**/api/posts/1': postDetail,
    '**/api/posts/1/view': { data: { success: true } },
    '**/api/posts/1/pin': { data: { success: true } },
    '**/api/posts/1/essence': { data: { success: true, isEssence: false } },
  });

  // Replies with nested structure
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
            content: '同意楼上！我们在项目中用 Suspense 之后体验非常好。',
            author: { id: 5, username: 'ts_lover', avatar: null, level: 2 },
            parentId: 101,
            floorNumber: 2,
            likeCount: 5,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 5000000).toISOString(),
            updatedAt: new Date(Date.now() - 5000000).toISOString(),
          },
          {
            id: 103,
            content: '对，特别是配合 ErrorBoundary 使用，错误处理也变得很优雅。',
            author: { id: 2, username: 'vue_fan', avatar: null, level: 3 },
            parentId: 102,
            floorNumber: 3,
            likeCount: 3,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 4600000).toISOString(),
            updatedAt: new Date(Date.now() - 4600000).toISOString(),
          },
          {
            id: 104,
            content: '补充一点：`useDeferredValue` 在处理大量数据渲染时也非常有用。\n\n```tsx\nconst deferredQuery = useDeferredValue(query);\n```',
            author: { id: 3, username: 'js_dev', avatar: null, level: 2 },
            parentId: null,
            floorNumber: 4,
            likeCount: 8,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 105,
            content: '好补充！useDeferredValue + Suspense 组合确实强大。',
            author: { id: 6, username: 'react_fan', avatar: null, level: 1 },
            parentId: 104,
            floorNumber: 5,
            likeCount: 2,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 3200000).toISOString(),
            updatedAt: new Date(Date.now() - 3200000).toISOString(),
          },
          {
            id: 106,
            content: '感谢分享，收藏了！',
            author: { id: 4, username: 'beginner', avatar: null, level: 1 },
            parentId: null,
            floorNumber: 6,
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
    '**/api/sensitive-words': { data: [] },
  });

  // ── 1. Post Detail with nested reply tree ──
  console.log('1. Post Detail — nested reply tree');
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-nested-replies.png'), fullPage: true });
  console.log('   ✓ post-nested-replies.png');

  // ── 2. Hash anchor — reply highlight ──
  console.log('2. Post Detail — hash anchor highlight');
  await page.goto(`${BASE}/post/1#reply-104`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
  // Scroll to the highlighted element to make it visible in the viewport
  await page.evaluate(() => {
    const el = document.getElementById('reply-104');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-reply-highlight.png'), fullPage: false });
  console.log('   ✓ post-reply-highlight.png');

  // ── 3. Reply-to indicator — reply banner above QuickReply ──
  console.log('3. Post Detail — reply-to indicator');
  // Navigate without hash, then simulate clicking the "回复" button on reply 101 via JS
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);

  // Click the first reply's "回复" button and then scroll to QuickReply
  await page.evaluate(() => {
    // Find all "引用" buttons and click the first one
    const buttons = Array.from(document.querySelectorAll('button'));
    const replyBtn = buttons.find(b => b.getAttribute('aria-label') === '回复');
    if (replyBtn) replyBtn.click();
  });
  await page.waitForTimeout(500);

  // Scroll to QuickReply area
  await page.evaluate(() => {
    const qr = document.querySelector('.quick-reply-container');
    if (qr) qr.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-reply-to-indicator.png'), fullPage: false });
  console.log('   ✓ post-reply-to-indicator.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
