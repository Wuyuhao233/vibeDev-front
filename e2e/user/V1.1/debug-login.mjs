import { firefox } from 'playwright';

async function main() {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Log ALL console messages
  page.on('console', (msg) => console.log('  [console]', msg.type(), msg.text()));
  // Log failed requests
  page.on('requestfailed', (req) => console.log('  [FAIL]', req.url(), req.failure()?.errorText));

  // Mock login API
  await page.route('**/api/auth/login', async (route) => {
    console.log('  [MOCK] login API called!');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'test-at',
          refreshToken: 'test-rt',
          user: { id: 1, username: 'testuser', email: 'test@test.com', avatar: null, level: 3 },
        },
      }),
    });
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  console.log('Page title:', await page.title());

  // Check what inputs exist
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);

  // Fill and submit
  const userInput = page.locator('input[placeholder="请输入用户名或邮箱"]');
  const pwdInput = page.locator('input[placeholder="请输入密码"]');

  console.log('User input visible:', await userInput.isVisible());
  console.log('Pwd input visible:', await pwdInput.isVisible());

  await userInput.fill('testuser');
  await pwdInput.fill('password123');

  // Click submit
  const submitBtn = page.locator('button[type="submit"]');
  console.log('Submit visible:', await submitBtn.isVisible());
  console.log('Submit text:', await submitBtn.innerText());

  await submitBtn.click();

  // Wait for navigation
  await page.waitForTimeout(2000);
  console.log('URL after login:', page.url());
  console.log('Body text:', (await page.locator('body').innerText()).substring(0, 300));

  await browser.close();
}

main().catch((err) => console.error('Error:', err));
