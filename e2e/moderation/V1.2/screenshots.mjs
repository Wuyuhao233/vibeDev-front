import { chromium } from 'playwright';
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
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/wyh/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  });
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

  // Mock appeal API
  await page.route('**/api/posts/1/appeal', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { success: true, status: 'PENDING' } }),
    });
  });

  // ── 1. Rejected post with appeal button ──
  console.log('1. REJECTED post — appeal button visible for author');

  const mockRejected = { data: {
    id: 1, title: '这是一个被驳回的帖子', content: '违规内容示例，包含了不允许发布的广告信息。', contentMarkdown: '违规内容示例，包含了不允许发布的广告信息。',
    coverImageUrl: null, author: { id: 1, username: 'postAuthor', avatar: null, level: 4 },
    board: { id: 1, name: '综合讨论', slug: 'general' }, tags: [{ id: 1, name: 'React', slug: 'react' }],
    likeCount: 0, replyCount: 0, collectCount: 0, viewCount: 10,
    isLiked: false, isCollected: false, isPinned: false, isEssence: false,
    auditStatus: 'REJECTED', auditReason: '包含违规广告信息', appealStatus: null, version: 1,
    createdAt: '2026-05-07T09:00:00Z', updatedAt: '2026-05-07T09:30:00Z',
  }};

  await page.route('**/api/posts/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRejected) });
  });

  await page.goto(`${BASE}/post/1`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-button-rejected.png'), fullPage: false });
  console.log('   ✓ appeal-button-rejected.png');

  // ── 2. Appeal dialog open ──
  console.log('2. Appeal dialog — reason textarea');

  // Click the appeal button
  const appealBtn = page.locator('button', { hasText: '申诉' });
  await appealBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-dialog-open.png'), fullPage: false });
  console.log('   ✓ appeal-dialog-open.png');

  // ── 3. Appeal dialog — filled reason ──
  console.log('3. Appeal dialog with reason filled in');

  const textarea = page.locator('textarea[placeholder*="审核结果有误"]');
  await textarea.fill('我认为该内容并未违反社区规范，请重新审核。这篇帖子讨论的是合法的技术话题。');
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-dialog-filled.png'), fullPage: false });
  console.log('   ✓ appeal-dialog-filled.png');

  // ── 4. Appeal status — pending review ──
  console.log('4. Appeal status — PENDING after successful submission');

  const submitBtn = page.locator('button', { hasText: '提交申诉' });
  await submitBtn.click();
  await page.waitForTimeout(800);

  // After submission, the dialog should show status
  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-status-pending.png'), fullPage: false });
  console.log('   ✓ appeal-status-pending.png');

  // ── 5. Rejected post with existing appeal (status already submitted) ──
  console.log('5. Already appealed — status display');

  const mockRejectedWithAppeal = { data: {
    id: 2, title: '另一个被驳回的帖子（已有申诉）', content: '此内容已被驳回且用户已提交申诉。', contentMarkdown: '此内容已被驳回且用户已提交申诉。',
    coverImageUrl: null, author: { id: 1, username: 'postAuthor', avatar: null, level: 4 },
    board: { id: 1, name: '综合讨论', slug: 'general' }, tags: [],
    likeCount: 0, replyCount: 0, collectCount: 0, viewCount: 5,
    isLiked: false, isCollected: false, isPinned: false, isEssence: false,
    auditStatus: 'REJECTED', auditReason: '包含违规内容', appealStatus: 'PENDING', version: 1,
    createdAt: '2026-05-06T10:00:00Z', updatedAt: '2026-05-06T11:00:00Z',
  }};

  await page.route('**/api/posts/2', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRejectedWithAppeal) });
  });

  await page.goto(`${BASE}/post/2`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await loginViaE2E(page);
  await page.waitForTimeout(800);

  // Click appeal button on this post
  const appealBtn2 = page.locator('button', { hasText: '申诉' });
  await appealBtn2.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'appeal-status-existing.png'), fullPage: false });
  console.log('   ✓ appeal-status-existing.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
