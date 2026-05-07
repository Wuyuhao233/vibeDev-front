import { firefox } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = 'http://localhost:5175';

async function loginViaE2E(page) {
  await page.waitForFunction(() => typeof window.__authStore !== 'undefined', { timeout: 10000 });
  await page.evaluate(() => {
    window.__authStore.getState().login(
      { id: 1, username: 'postAuthor', email: 'author@test.com', avatar: null, level: 4 },
      'fake-access-token',
      'fake-refresh-token',
    );
  });
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ── Mock common APIs ──
  const mockBoards = { data: [{ id: 1, name: '综合讨论', slug: 'general', description: '综合话题', icon: null, postCount: 128, sortOrder: 1, tags: [{ id: 1, name: 'React', slug: 'react', sortOrder: 1 }] }] };

  await page.route('**/api/boards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBoards) });
  });
  await page.route('**/api/notifications/unread-count', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { count: 0 } }) });
  });
  await page.route('**/api/user/followed-tags', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  await page.route('**/api/sensitive-words', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

  const mockReplies = { data: { items: [], total: 0 } };

  // Mock post view
  await page.route('**/api/posts/1/view', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { success: true } }) });
  });
  await page.route('**/api/posts/1/replies*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockReplies) });
  });

  // ── 1. PENDING audit status ──
  console.log('1. PENDING audit status — author view');
  const mockPending = { data: {
    id: 1, title: '这是一个待审核的帖子', content: '帖子正文内容，等待 AI 审核中。', contentMarkdown: '帖子正文内容，等待 AI 审核中。',
    coverImageUrl: null, author: { id: 1, username: 'postAuthor', avatar: null, level: 4 },
    board: { id: 1, name: '综合讨论', slug: 'general' }, tags: [{ id: 1, name: 'React', slug: 'react' }],
    likeCount: 0, replyCount: 0, collectCount: 0, viewCount: 10,
    isLiked: false, isCollected: false, isPinned: false, isEssence: false,
    auditStatus: 'PENDING', version: 1,
    createdAt: '2026-05-07T10:00:00Z', updatedAt: '2026-05-07T10:00:00Z',
  }};

  await page.route('**/api/posts/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPending) });
  });

  await page.goto(`${BASE}/post/1`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, 'audit-pending-author.png'), fullPage: false });
  console.log('   ✓ audit-pending-author.png');

  // ── 2. REJECTED audit status — author view ──
  console.log('2. REJECTED audit status — author view with reason and modify button');

  // Remove old route and add new one
  await page.unroute('**/api/posts/1');
  const mockRejected = { data: {
    id: 1, title: '这是一个被驳回的帖子', content: '违规内容示例，包含了不允许发布的广告信息。', contentMarkdown: '违规内容示例，包含了不允许发布的广告信息。',
    coverImageUrl: null, author: { id: 1, username: 'postAuthor', avatar: null, level: 4 },
    board: { id: 1, name: '综合讨论', slug: 'general' }, tags: [{ id: 1, name: 'React', slug: 'react' }],
    likeCount: 0, replyCount: 0, collectCount: 0, viewCount: 10,
    isLiked: false, isCollected: false, isPinned: false, isEssence: false,
    auditStatus: 'REJECTED', auditReason: '包含违规广告信息', version: 1,
    createdAt: '2026-05-07T09:00:00Z', updatedAt: '2026-05-07T09:30:00Z',
  }};

  await page.route('**/api/posts/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRejected) });
  });

  await page.goto(`${BASE}/post/1`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, 'audit-rejected-author.png'), fullPage: false });
  console.log('   ✓ audit-rejected-author.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
