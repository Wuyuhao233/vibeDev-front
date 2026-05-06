import { firefox } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:5173';
const PAGES = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'verify-email', path: '/verify-email' },
  { name: 'forgot-password', path: '/forgot-password' },
  { name: 'reset-password', path: '/reset-password' },
  { name: 'user-profile', path: '/u/testuser' },
  { name: 'settings', path: '/settings' },
];

async function main() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  for (const { name, path: route } of PAGES) {
    console.log(`Navigating to ${route}...`);
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    // Wait a bit for React to render
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`),
      fullPage: true,
    });
    console.log(`  -> Saved ${name}.png`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to e2e/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
