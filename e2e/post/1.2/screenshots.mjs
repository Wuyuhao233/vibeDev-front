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

  // Mock boards
  mockApi(page, {
    '**/api/boards': {
      data: [
        { id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [
          { id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 },
          { id: 2, name: 'React', slug: 'react', sortOrder: 2 },
          { id: 3, name: 'TypeScript', slug: 'typescript', sortOrder: 3 },
        ]},
      ],
    },
  });

  const postDetail = {
    data: {
      id: 1,
      title: 'React 18 最佳实践总结',
      content: `## 前言\n\nReact 18 带来了许多激动人心的新特性。本文将总结我们在实际项目中的**最佳实践**。\n\n### 1. 使用 Concurrent Features\n\n\`Suspense\` 和 \`useTransition\` 是 React 18 最重要的新增功能。\n\n### 2. Automatic Batching\n\nReact 18 自动批处理所有状态更新，无需手动优化。\n\n### 3. 使用 TypeScript\n\n- 强类型检查\n- 更好的 IDE 支持`,
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
    },
  };

  mockApi(page, {
    '**/api/posts/1': postDetail,
    '**/api/posts/1/view': { data: { success: true } },
    '**/api/sensitive-words': { data: [] },
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
            content: '补充一点：`useDeferredValue` 在处理大量数据渲染时也非常有用。',
            author: { id: 3, username: 'js_dev', avatar: null, level: 2 },
            parentId: null,
            floorNumber: 3,
            likeCount: 8,
            isLiked: false,
            isDeleted: false,
            version: 1,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        total: 8,
      },
    },
  });

  // ── 1. Reply with share button ──
  console.log('1. Reply with share button');
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });
  await page.waitForTimeout(800);
  // Scroll to the reply area to show reply action bar with share button
  await page.evaluate(() => {
    const el = document.getElementById('reply-101');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-reply-share.png'), fullPage: false });
  console.log('   ✓ post-reply-share.png');

  // ── 2. Reply share "已复制" state ──
  console.log('2. Reply share "已复制" state');
  // Click the "分享" button on reply 101
  await page.evaluate(() => {
    // Find the "分享" button in the first reply's action bar
    const replyActions = document.querySelectorAll('[id^="reply-"]');
    if (replyActions.length > 0) {
      const firstReply = replyActions[0];
      const buttons = firstReply.querySelectorAll('button');
      const shareBtn = Array.from(buttons).find(b => b.getAttribute('aria-label') === '分享' || b.textContent?.includes('分享'));
      if (shareBtn) shareBtn.click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'post-reply-share-copied.png'), fullPage: false });
  console.log('   ✓ post-reply-share-copied.png');

  // ── 3. Folder selector on CollectButton ──
  console.log('3. Folder selector on collect click');
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });
  await page.waitForTimeout(500);

  // Mock collections API
  mockApi(page, {
    '**/api/collections': {
      data: [
        { id: 1, name: '技术文章', itemCount: 5, createdAt: '2026-01-01' },
        { id: 2, name: '设计资源', itemCount: 3, createdAt: '2026-02-01' },
      ],
    },
  });

  // Click the CollectButton (star icon button)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const collectBtn = buttons.find(b => b.getAttribute('aria-label')?.includes('收藏'));
    if (collectBtn) (collectBtn).click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'collection-folder-selector.png'), fullPage: false });
  console.log('   ✓ collection-folder-selector.png');

  // ── 4. Share panel dropdown with card generation option ──
  console.log('4. Share panel dropdown');
  // Reload to reset state
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });
  await page.waitForTimeout(500);

  // Scroll to the action bar area
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const shareBtn = buttons.find(b => b.getAttribute('aria-label') === '分享' && b.querySelector('svg + span'));
    if (shareBtn) {
      (shareBtn).click();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'share-panel-dropdown.png'), fullPage: false });
  console.log('   ✓ share-panel-dropdown.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
