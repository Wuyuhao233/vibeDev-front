import { firefox } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;

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

    // Wait for Noto Sans SC font to be ready (loaded via index.html link)
    await page.evaluate(async () => {
      await document.fonts.ready;
      const fonts = [];
      document.fonts.forEach((f) => fonts.push(f.family));
      return fonts;
    }).then((fonts) => {
      const hasNoto = fonts.some((f) => f.includes('Noto'));
      if (!hasNoto) console.log('  ⚠ Noto Sans SC not loaded, trying fallback...');
    });

    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`),
      fullPage: true,
    });
    console.log(`  -> Saved ${name}.png`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to e2e/user/V1.0/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
