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
      { id: 2, username: 'reporter', email: 'reporter@test.com', avatar: null, level: 3 },
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

  // ── Mock API routes ──
  const mockPost = { data: { id: 1, title: '这是一个测试帖子', content: '帖子正文内容，用于 E2E 截图测试。这里包含一些 Markdown 格式的文本。', contentMarkdown: '帖子正文内容，用于 E2E 截图测试。', coverImageUrl: null, author: { id: 1, username: 'postAuthor', avatar: null, level: 4 }, board: { id: 1, name: '综合讨论', slug: 'general' }, tags: [{ id: 1, name: 'React', slug: 'react' }], likeCount: 15, replyCount: 8, collectCount: 3, viewCount: 256, isLiked: false, isCollected: false, isPinned: false, isEssence: true, auditStatus: 'APPROVED', version: 1, createdAt: '2026-05-05T10:00:00Z', updatedAt: '2026-05-05T10:00:00Z' } };
  const mockReplies = { data: { items: [
    { id: 10, content: '这是一条测试回复', author: { id: 3, username: 'replyUser', avatar: null, level: 2 }, parentId: null, floorNumber: 1, likeCount: 2, isLiked: false, createdAt: '2026-05-05T11:00:00Z', updatedAt: '2026-05-05T11:00:00Z' },
  ], total: 1 } };
  const mockBoards = { data: [{ id: 1, name: '综合讨论', slug: 'general', description: '综合话题', icon: null, postCount: 128, sortOrder: 1, tags: [{ id: 1, name: 'React', slug: 'react', sortOrder: 1 }] }] };
  const mockSensitiveWords = { data: ['敏感词1', '违规', '禁止'] };

  await page.route('**/api/feed/home*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [], total: 0 } }) });
  });
  await page.route('**/api/boards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBoards) });
  });
  await page.route('**/api/sensitive-words', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSensitiveWords) });
  });
  await page.route('**/api/notifications/unread-count', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { count: 0 } }) });
  });
  await page.route('**/api/user/followed-tags', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  await page.route('**/api/posts/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPost) });
  });
  await page.route('**/api/posts/1/replies*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockReplies) });
  });
  await page.route('**/api/posts/1/view', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { success: true } }) });
  });
  await page.route('**/api/reports', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { success: true } }) });
  });

  // ── 1. ReportDialog on PostPage ──
  console.log('1. ReportDialog on PostPage — dialog open');
  await page.goto(`${BASE}/post/1`, { waitUntil: 'networkidle' });
  await loginViaE2E(page);

  // Click "举报" button on post action bar
  const reportBtn = page.locator('button', { hasText: '举报' }).first();
  if (await reportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await reportBtn.click();
  }
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'report-dialog-post.png'), fullPage: false });
  console.log('   ✓ report-dialog-post.png');

  // Select a different report type for variety
  const sexualOption = page.locator('label', { hasText: '色情低俗' });
  if (await sexualOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sexualOption.click();
  }
  await page.waitForTimeout(200);

  await page.screenshot({ path: path.join(OUT_DIR, 'report-dialog-type-selected.png'), fullPage: false });
  console.log('   ✓ report-dialog-type-selected.png');

  // Close dialog
  const cancelBtn = page.locator('button', { hasText: '取消' });
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click();
  }
  await page.waitForTimeout(300);

  // ── 2. ReportDialog on reply ──
  console.log('2. ReportDialog on reply — dialog open');
  const replyReportBtn = page.locator('.reply-item button', { hasText: '举报' });
  if (await replyReportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await replyReportBtn.click();
  }
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUT_DIR, 'report-dialog-reply.png'), fullPage: false });
  console.log('   ✓ report-dialog-reply.png');

  // Submit report to show success toast
  const submitBtn = page.locator('button', { hasText: '提交举报' });
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
  }
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, 'report-toast-success.png'), fullPage: false });
  console.log('   ✓ report-toast-success.png');

  // ── 3. Sensitive word detection on NewPostPage ──
  console.log('3. Sensitive word detection — editor with sensitive words');
  // Login first via the public login page, then navigate to post/new
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await loginViaE2E(page);
  // Now navigate to new post page (AuthGuard will see authenticated user)
  await page.goto(`${BASE}/post/new`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1000);

  // See if we can find the board select or if we got redirected
  const selectLocator = page.locator('select');
  if (await selectLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    await selectLocator.selectOption('1');
    await page.waitForTimeout(500);
  }

  // Type a title with a sensitive word
  const titleInput = page.locator('input[placeholder*="标题"]');
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.fill('包含违规词汇的标题');
    await page.waitForTimeout(500);
  }

  // Type content with another sensitive word
  const contentArea = page.locator('textarea[placeholder*="Markdown"]');
  if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await contentArea.fill('内容包含敏感词1，这应该被检测到');
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: path.join(OUT_DIR, 'sensitive-word-detection.png'), fullPage: false });
  console.log('   ✓ sensitive-word-detection.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + OUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
