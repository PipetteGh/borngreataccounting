import { Page, test } from '@playwright/test';

async function installVisibleCursor(page: Page) {
  await page.addInitScript(() => {
    const inject = () => {
      if (document.getElementById('__demo_cursor')) return;
      const cursor = document.createElement('div');
      cursor.id = '__demo_cursor';
      cursor.style.cssText = [
        'position: fixed',
        'left: -40px',
        'top: -40px',
        'width: 22px',
        'height: 22px',
        'border-radius: 50%',
        'background: rgba(30, 94, 255, 0.35)',
        'border: 2.5px solid #1E5EFF',
        'box-shadow: 0 0 12px rgba(30,94,255,0.65)',
        'pointer-events: none',
        'z-index: 2147483647',
        'transform: translate(-50%, -50%)',
        'transition: transform 0.08s ease-out',
      ].join(';');
      document.body.appendChild(cursor);

      window.addEventListener(
        'mousemove',
        (e) => {
          cursor.style.left = `${e.clientX}px`;
          cursor.style.top = `${e.clientY}px`;
        },
        true,
      );
      window.addEventListener(
        'mousedown',
        () => {
          cursor.style.transform = 'translate(-50%, -50%) scale(0.72)';
          cursor.style.background = 'rgba(16, 185, 129, 0.55)';
        },
        true,
      );
      window.addEventListener(
        'mouseup',
        () => {
          cursor.style.transform = 'translate(-50%, -50%) scale(1)';
          cursor.style.background = 'rgba(30, 94, 255, 0.35)';
        },
        true,
      );
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  });
}

async function smoothMoveTo(page: Page, x: number, y: number, steps = 20) {
  await page.mouse.move(x, y, { steps });
}

async function smoothClickLocator(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  const box = await loc.boundingBox();
  if (box) {
    await smoothMoveTo(page, box.x + box.width / 2, box.y + box.height / 2, 18);
    await page.waitForTimeout(250);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await loc.click();
  }
}

test('Record BorngreatAccounting features walkthrough with mouse movement', async ({
  page,
}) => {
  await installVisibleCursor(page);

  // 1. Home Page: KPIs, Visualization Charts, Ratios, Low-Stock, Margin Calculator
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await smoothMoveTo(page, 320, 260, 22);
  await page.waitForTimeout(400);
  await smoothMoveTo(page, 720, 420, 22);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(900);
  await smoothMoveTo(page, 1100, 560, 22);
  await page.waitForTimeout(800);

  // 2. Profit & Loss Report with Charts
  await page.goto('/financial-reports/profit-loss', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await smoothMoveTo(page, 460, 310, 20);
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, 280);
  await page.waitForTimeout(1000);

  // 3. Balance Sheet Report with Charts
  await page.goto('/financial-reports/balance-sheet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await smoothMoveTo(page, 520, 310, 20);
  await page.waitForTimeout(700);

  // 4. POS: Top 10 Most Purchased & Barcode Auto-Add
  await page.goto('/pos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await smoothMoveTo(page, 380, 220, 20);
  const firstCard = page.locator('[data-testid="pos-workspace"] .bp4-card, [data-testid="pos-workspace"] .bp3-card').nth(1);
  if (await firstCard.isVisible().catch(() => false)) {
    const box = await firstCard.boundingBox();
    if (box) {
      await smoothMoveTo(page, box.x + box.width / 2, box.y + box.height / 2, 18);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(600);
    }
  }
  await smoothMoveTo(page, 1180, 760, 22);
  await page.waitForTimeout(800);

  // 5. Automation: Natural Language & Multi-Item Matching
  await page.goto('/automation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await smoothClickLocator(page, '[data-testid="automation-command-input"]');
  await page.fill('[data-testid="automation-command-input"]', 'update gari product with 20 quantity');
  await page.waitForTimeout(1000);
  await smoothMoveTo(page, 1150, 260, 20);
  await page.waitForTimeout(600);

  // 6. Preferences -> SMS Integration (Twilio / Hubtel / SMSOnlineGH)
  await page.goto('/preferences/sms-integration', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const smsSelect = page.locator('select').first();
  if (await smsSelect.isVisible().catch(() => false)) {
    const box = await smsSelect.boundingBox();
    if (box) {
      await smoothMoveTo(page, box.x + box.width / 2, box.y + box.height / 2, 18);
    }
    await smsSelect.selectOption('hubtel');
    await page.waitForTimeout(700);
    await smsSelect.selectOption('smsonlinegh');
    await page.waitForTimeout(700);
  }

  // 7. Preferences -> About & Check for Updates
  await page.goto('/preferences/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  await smoothMoveTo(page, 420, 420, 20);
  await page.waitForTimeout(1000);
});
