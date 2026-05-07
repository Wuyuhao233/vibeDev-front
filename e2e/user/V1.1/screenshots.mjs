import { firefox } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = __dirname;

function mockApi(page, routes) {
  for (const [pattern, data] of Object.entries(routes)) {
    page.route(pattern, async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }
}

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // ─── 1. Login page — CAS login button ───
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-cas-button.png'), fullPage: true });
  console.log('✓ login-cas-button.png');

  // ─── 2. CAS loading state ───
  await page.route('**/api/auth/cas-login*', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        data: { accessToken: 'at', refreshToken: 'rt', user: { id: 1, username: 'test', email: 't@t.com', avatar: null, level: 1 } },
      }),
    });
  });
  await page.goto('http://localhost:5173/login?ticket=ST-12345&service=https://example.com/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login-cas-loading.png'), fullPage: true });
  console.log('✓ login-cas-loading.png');

  // ─── 3. Set auth state via evaluate, then navigate to settings — CAS unbound ───
  mockApi(page, {
    '**/api/users/me/cas-binding**': { data: { is_bound: false, cas_username: null, bound_at: null } },
    '**/api/users/me/login-history**': { data: { items: [], total: 0 } },
    '**/api/users/me/notifications/preferences**': { data: [] },
    '**/api/boards**': { data: [] },
    '**/api/posts**': { data: { items: [], total: 0 } },
  });
  // Narrower match for users/me (exact, no suffix) to avoid capturing sub-paths
  page.route('**/api/users/me', async (route) => {
    if (route.request().url().endsWith('/api/users/me')) {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, bio: 'Hello world', level: 3, points: 100, postCount: 5, replyCount: 10, createdAt: '2025-01-01T00:00:00Z' },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Set auth state by calling the Zustand store directly
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    // Access Zustand store through the global hook
    const key = Object.keys((window as any).__ZUSTAND_STORE__ || {}).find(k => k.includes('auth'));
    // Fallback: set auth via the API client module
    (window as any).__MOCK_AUTH__ = true;
  });

  await page.goto('http://localhost:5173/settings?tab=security', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const body1 = await page.locator('body').innerText();
  console.log('Step3 body:', body1.substring(0, 200));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-cas-unbound.png'), fullPage: true });
  console.log('✓ settings-cas-unbound.png');

  // ─── 4. CAS bound state ───
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  mockApi(page, {
    '**/api/users/me/cas-binding**': { data: { is_bound: true, cas_username: 'cas_user_2023', bound_at: '2026-01-15T10:30:00Z' } },
    '**/api/users/me/login-history**': { data: { items: [], total: 0 } },
    '**/api/boards**': { data: [] },
    '**/api/posts**': { data: { items: [], total: 0 } },
  });
  page.route('**/api/users/me', async (route) => {
    if (route.request().url().endsWith('/api/users/me')) {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, bio: 'Hello', level: 3, points: 100, postCount: 5, replyCount: 10, createdAt: '2025-01-01T00:00:00Z' },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('http://localhost:5173/settings?tab=security', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const body2 = await page.locator('body').innerText();
  console.log('Step4 body:', body2.substring(0, 300));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-cas-bound.png'), fullPage: true });
  console.log('✓ settings-cas-bound.png');

  // ─── 5. Unbind dialog ───
  const unbindBtn = page.locator('button', { hasText: '解绑' });
  if (await unbindBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await unbindBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-cas-unbind-dialog.png'), fullPage: true });
    console.log('✓ settings-cas-unbind-dialog.png');
  } else {
    console.log('⚠ unbind not found');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-debug.png'), fullPage: true });
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to ' + SCREENSHOT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
