import fs from 'fs';
import path from 'path';
import { expect, Page, test } from '@playwright/test';
import {
  createCustomerViaApi,
  createDeliveredInvoiceViaApi,
  createExpenseViaApi,
  createItemViaApi,
  createManualJournalViaApi,
  createOpenedBillViaApi,
  createTaxRateViaApi,
  createVendorViaApi,
  fetchAccounts,
  findCustomerIdByName,
  findItemIdByName,
  findVendorIdByName,
  readApiAuth,
  waitForCostCompute,
} from './_api';

const ASSETS_SCREENSHOTS_DIR = path.resolve(__dirname, '../assets/screenshots');
const GIF_FRAMES_DIR = path.resolve(__dirname, '../test-results/gif-frames');

interface GifFrameMeta {
  file: string;
  label: string;
  durationMs: number;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

async function seedRichDemoData(apiBase: string) {
  const auth = readApiAuth();
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${auth.accessToken}`,
    'organization-id': auth.organizationId,
  };

  // Tax rate
  let taxRateId: number | undefined;
  try {
    const tr = await createTaxRateViaApi(apiBase, auth, {
      name: 'VAT 5%',
      code: 'VAT5',
      rate: 5,
    });
    taxRateId = tr?.id ?? tr?.data?.id;
  } catch {
    // ignore if already exists
  }

  // Opening balances so Balance Sheet Assets, Cash, and Equity are realistic
  const accounts = await fetchAccounts(apiBase, auth);
  const accountId = (name: string) => {
    const acc = accounts.find((a) => a.name === name);
    if (!acc) throw new Error(`[demo] Missing account "${name}"`);
    return acc.id;
  };
  const bankAccountId = accountId('Bank Account');
  const pettyCashId = accountId('Petty Cash');

  await createManualJournalViaApi(apiBase, auth, {
    date: isoDaysAgo(90),
    journalNumber: `MJ-${Date.now().toString().slice(-5)}`,
    referenceNo: 'OB-DEMO-01',
    description: 'Opening cash & capital balances',
    entries: [
      {
        accountId: bankAccountId,
        debit: 185000,
        note: 'Opening bank capital',
      },
      {
        accountId: pettyCashId,
        debit: 15000,
        note: 'Opening petty cash float',
      },
      {
        accountId: accountId('Opening Balance Equity'),
        credit: 200000,
        note: 'Owner capital injection',
      },
    ],
  });

  // Customers & Vendors
  const customerNames = [
    'Acme Corporation',
    'Globex Retail Ltd',
    'Stark Enterprises',
  ];
  const customerIds: number[] = [];
  for (const name of customerNames) {
    const res = await createCustomerViaApi(apiBase, auth, {
      displayName: name,
    });
    customerIds.push(
      res?.id ??
        res?.customer?.id ??
        (await findCustomerIdByName(apiBase, auth, name)),
    );
  }

  const vendorNames = ['Northwind Distributors', 'Jofanos Wholesale'];
  const vendorIds: number[] = [];
  for (const name of vendorNames) {
    const res = await createVendorViaApi(apiBase, auth, { displayName: name });
    vendorIds.push(
      res?.id ??
        res?.vendor?.id ??
        (await findVendorIdByName(apiBase, auth, name)),
    );
  }

  // Items (inventory + service for both Bills, Invoices, Automation & POS)
  const itemsSpec: Array<{
    name: string;
    type: 'inventory' | 'service';
    sellPrice: number;
    costPrice: number;
  }> = [
    {
      name: 'MacBook Pro 16"',
      type: 'inventory',
      sellPrice: 2450,
      costPrice: 1800,
    },
    {
      name: 'Wireless POS Barcode Scanner',
      type: 'inventory',
      sellPrice: 320,
      costPrice: 180,
    },
    {
      name: 'Thermal Receipt Printer 80mm',
      type: 'inventory',
      sellPrice: 540,
      costPrice: 330,
    },
    {
      name: 'Gari Fine Pack 5kg',
      type: 'inventory',
      sellPrice: 45,
      costPrice: 24,
    },
    {
      name: 'Annual Accounting Support Plan',
      type: 'service',
      sellPrice: 1200,
      costPrice: 200,
    },
  ];
  const itemIds: number[] = [];
  for (const spec of itemsSpec) {
    const res = await createItemViaApi(apiBase, auth, spec);
    itemIds.push(
      res?.id ?? res?.item?.id ?? (await findItemIdByName(apiBase, auth, spec.name)),
    );
  }

  // Opened Bills (seeds inventory stock IN lots + Accounts Payable)
  for (let i = 0; i < 4; i++) {
    const spec = itemsSpec[i];
    await createOpenedBillViaApi(apiBase, auth, {
      vendorId: vendorIds[i % vendorIds.length],
      itemId: itemIds[i],
      rate: spec.costPrice,
      quantity: 12 + i * 3,
      date: isoDaysAgo(18 - i * 3),
      billNumber: `BILL-${Date.now().toString().slice(-4)}-${i + 1}`,
      referenceNo: `PO-REF-${2001 + i}`,
      description: `Restock ${spec.name}`,
    });
  }

  // Delivered Invoices (Accrual Income + A/R Open Receivables)
  for (let i = 0; i < 4; i++) {
    const spec = itemsSpec[i];
    await createDeliveredInvoiceViaApi(apiBase, auth, {
      customerId: customerIds[i % customerIds.length],
      itemId: itemIds[i],
      rate: spec.sellPrice,
      quantity: 2 + (i % 2),
      date: isoDaysAgo(12 - i * 2),
      dueDate: isoDaysAgo(2 - i),
      taxRateId,
    });
  }

  // Closed Sale Receipts (feeds Cash Basis P&L Total Income + SalesByItems chart)
  const receipts = [
    { itemIdx: 0, qty: 2, daysAgo: 7 },
    { itemIdx: 1, qty: 5, daysAgo: 5 },
    { itemIdx: 2, qty: 3, daysAgo: 3 },
    { itemIdx: 3, qty: 10, daysAgo: 2 },
    { itemIdx: 4, qty: 2, daysAgo: 1 },
  ];
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    const spec = itemsSpec[r.itemIdx];
    const resp = await fetch(`${apiBase}/api/sale-receipts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId: customerIds[i % customerIds.length],
        depositAccountId: bankAccountId,
        receiptDate: isoDaysAgo(r.daysAgo),
        closed: true,
        referenceNo: `POS-SEED-${1001 + i}`,
        receiptMessage: 'Seeded POS Sale Receipt',
        entries: [
          {
            index: 1,
            itemId: itemIds[r.itemIdx],
            quantity: r.qty,
            rate: spec.sellPrice,
          },
        ],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`[demo] Seed sale receipt ${i} failed: ${resp.status} ${txt}`);
    }
  }

  // Paid Expenses (feeds Cash & Accrual P&L Operating Expenses + Expense Breakdown Donut)
  const expenses = [
    {
      referenceNo: `EXP-${Date.now().toString().slice(-4)}-1`,
      amount: 4200,
      description: 'Monthly Office Lease & Utilities',
      expenseAccountName: 'Rent',
      paymentAccountName: 'Bank Account',
      paymentDate: isoDaysAgo(10),
    },
    {
      referenceNo: `EXP-${Date.now().toString().slice(-4)}-2`,
      amount: 1350,
      description: 'Stationery, Printer Paper & Packaging',
      expenseAccountName: 'Office expenses',
      paymentAccountName: 'Petty Cash',
      paymentDate: isoDaysAgo(6),
    },
    {
      referenceNo: `EXP-${Date.now().toString().slice(-4)}-3`,
      amount: 480,
      description: 'Payment Gateway & Bank Processing Fees',
      expenseAccountName: 'Bank Fees and Charges',
      paymentAccountName: 'Bank Account',
      paymentDate: isoDaysAgo(3),
    },
  ];
  for (const exp of expenses) {
    await createExpenseViaApi(apiBase, auth, exp);
  }

  await waitForCostCompute(apiBase, auth);
}

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
        'background: rgba(30, 94, 255, 0.32)',
        'border: 2.5px solid #1E5EFF',
        'box-shadow: 0 0 12px rgba(30,94,255,0.6)',
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
          cursor.style.background = 'rgba(30, 94, 255, 0.32)';
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

async function smoothMoveTo(page: Page, x: number, y: number, steps = 16) {
  await page.mouse.move(x, y, { steps });
}

async function smoothClickLocator(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  const box = await loc.boundingBox();
  if (box) {
    await smoothMoveTo(page, box.x + box.width / 2, box.y + box.height / 2, 14);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await loc.click();
  }
}

async function settlePage(page: Page, waitMs = 900) {
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(waitMs);
}

test('Record BorngreatAccounting features walkthrough, live screenshots, and overview GIF frames', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const apiBase =
    baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4100';

  fs.mkdirSync(ASSETS_SCREENSHOTS_DIR, { recursive: true });
  fs.rmSync(GIF_FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(GIF_FRAMES_DIR, { recursive: true });

  await seedRichDemoData(apiBase);
  await installVisibleCursor(page);

  const gifFrames: GifFrameMeta[] = [];
  let frameCounter = 0;

  const snap = async (
    label: string,
    durationMs = 1900,
    assetFilename?: string,
  ) => {
    frameCounter += 1;
    const frameName = `frame-${String(frameCounter).padStart(3, '0')}.png`;
    const framePath = path.join(GIF_FRAMES_DIR, frameName);
    await page.screenshot({ path: framePath });
    gifFrames.push({ file: frameName, label, durationMs });
    if (assetFilename) {
      fs.copyFileSync(
        framePath,
        path.join(ASSETS_SCREENSHOTS_DIR, assetFilename),
      );
    }
  };

  // 1. Workspace Dashboard (Top KPIs + Entity Counts + Cash/Accrual Toggle + Charts)
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await expect(page.getByText('Total Income', { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect(
    page.getByText('Total Costs & Expenses', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Net Income (Profit)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Total Assets', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Inventory Items', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Customers', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Vendors', { exact: true }).first(),
  ).toBeVisible();

  await smoothMoveTo(page, 420, 260);
  await settlePage(page, 1200);
  await snap(
    'Workspace Dashboard — Live Reconciled KPIs, Entity Counts & Cash Basis',
    2400,
    'dashboard.png',
  );

  await smoothClickLocator(page, 'button:has-text("Accrual Basis")');
  await settlePage(page, 800);
  await snap('Workspace Dashboard — Accrual Basis Live Recalculation', 1700);

  await smoothClickLocator(page, 'button:has-text("Cash Basis")');
  await settlePage(page, 700);

  await page.mouse.wheel(0, 420);
  await smoothMoveTo(page, 680, 460);
  await settlePage(page, 800);
  await snap(
    'Dashboard Analytics — Profit & Loss, Balance Sheet & Top Selling Products',
    2100,
  );

  await page.mouse.wheel(0, 480);
  await smoothMoveTo(page, 920, 520);
  await settlePage(page, 800);
  await snap(
    'Financial Health Ratios, Low-Stock Reorder Alerts & Margin Calculator',
    2000,
  );

  // 2. Products & Inventory
  await page.goto('/items', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await expect(page.locator('.tbody .tr').first()).toBeVisible({
    timeout: 15000,
  });
  await smoothMoveTo(page, 102, 228);
  await settlePage(page, 800);
  await snap(
    'Products & Inventory — Multi-Warehouse Catalog & Live Stock Levels',
    1900,
    'products.png',
  );

  // 3. Point of Sale (POS) + F9 Instant Checkout & Thermal Receipt
  await page.goto('/pos', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  const macCard = page
    .locator('[data-testid="pos-workspace"]')
    .getByText(/MacBook Pro/)
    .first();
  await macCard.waitFor({ state: 'visible', timeout: 15000 });
  const macBox = await macCard.boundingBox();
  if (macBox) {
    await smoothMoveTo(page, macBox.x + macBox.width / 2, macBox.y + macBox.height / 2);
    await page.mouse.click(
      macBox.x + macBox.width / 2,
      macBox.y + macBox.height / 2,
    );
  } else {
    await macCard.click();
  }
  await page.waitForTimeout(350);

  const scannerCard = page
    .locator('[data-testid="pos-workspace"]')
    .getByText(/Barcode Scanner/)
    .first();
  if (await scannerCard.isVisible().catch(() => false)) {
    const sBox = await scannerCard.boundingBox();
    if (sBox) {
      await smoothMoveTo(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
      await page.mouse.click(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
    }
  }
  await settlePage(page, 700);
  await snap(
    'Point of Sale (POS) — Top 10 Products, Barcode Auto-Add & Live Cart',
    2100,
    'pos.png',
  );

  // Press F9 shortcut to complete sale & capture Thermal Receipt modal
  await page.keyboard.press('F9');
  await expect(
    page.locator('[data-testid="thermal-receipt-preview"]'),
  ).toBeVisible({ timeout: 15000 });
  await smoothMoveTo(page, 720, 420);
  await settlePage(page, 700);
  await snap(
    'Point of Sale (F9 Shortcut) — Instant Double-Entry Sale & Thermal Receipt',
    2300,
    'pos-receipt.png',
  );
  const newSaleBtn = page.locator('button:has-text("New Sale")');
  if (await newSaleBtn.isVisible().catch(() => false)) {
    await newSaleBtn.click();
  }

  // 4. BorngreatAutomation: Natural Language & 19 Quick Presets
  await page.goto('/automation', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothClickLocator(page, '[data-testid="automation-command-input"]');
  await page.fill(
    '[data-testid="automation-command-input"]',
    'update gari product with 20 quantity',
  );
  await smoothMoveTo(page, 820, 340);
  await settlePage(page, 800);
  await snap(
    'BorngreatAutomation — 19 Quick Presets & Natural-Language Inventory Commands',
    2100,
    'automation.png',
  );

  // 5. Sales & Invoices
  await page.goto('/invoices', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await expect(page.locator('.tbody .tr').first()).toBeVisible({
    timeout: 15000,
  });
  await smoothMoveTo(page, 102, 265);
  await settlePage(page, 800);
  await snap(
    'Sales & Invoices — Customer Billing, Taxes & Payment Tracking',
    1900,
    'sales-invoices.png',
  );

  // 6. Financial Reports: Profit & Loss Sheet with Charts
  await waitForCostCompute(apiBase, readApiAuth());
  await page.goto('/financial-reports/profit-loss-sheet', {
    waitUntil: 'networkidle',
  });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid^="profit-loss-row--"]').first(),
  ).toBeVisible({ timeout: 20000 });
  await smoothMoveTo(page, 520, 310);
  await settlePage(page, 1000);
  await snap(
    'Financial Reports — Profit & Loss Statement with Reconciled Charts',
    2200,
    'reports.png',
  );

  // 7. Financial Reports: Balance Sheet with Charts
  await page.goto('/financial-reports/balance-sheet', {
    waitUntil: 'networkidle',
  });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid^="balance-sheet-row--"]').first(),
  ).toBeVisible({ timeout: 20000 });
  await smoothMoveTo(page, 520, 310);
  await settlePage(page, 1000);
  await snap(
    'Financial Reports — Balance Sheet (Assets = Liabilities + Equity)',
    2200,
    'balance-sheet.png',
  );

  // 8. Payment Gateways (Stripe, Paystack, Flutterwave & Hubtel)
  await page.goto('/preferences/payment-methods', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothMoveTo(page, 540, 360);
  await settlePage(page, 900);
  await snap(
    'Payment Gateways — Stripe, Paystack, Flutterwave & Hubtel',
    1900,
    'payment-methods.png',
  );

  // 9. SMS Notifications (Twilio, Hubtel & SMSOnlineGH)
  await page.goto('/preferences/sms-message?tab=overview', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  const smsSelect = page.locator('select').first();
  if (await smsSelect.isVisible().catch(() => false)) {
    await smsSelect.selectOption('hubtel').catch(() => {});
  }
  await smoothMoveTo(page, 540, 320);
  await settlePage(page, 800);
  await snap(
    'SMS Notifications — Twilio, Hubtel & SMSOnlineGH Auto-Fallback',
    1900,
    'sms-integration.png',
  );

  // 10. Themes & Appearance
  await page.goto('/preferences/themes', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothMoveTo(page, 620, 340);
  await settlePage(page, 900);
  await snap(
    'Themes & Appearance — 12 Built-In Light & Dark Workspace Themes',
    1900,
    'themes.png',
  );

  // 11. Company Branding & Logo Upload
  await page.goto('/preferences/branding', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothMoveTo(page, 540, 340);
  await settlePage(page, 900);
  await snap(
    'White-Label Branding — Company Logo, Colors & PDF/Email Templates',
    1900,
    'branding.png',
  );

  // 12. Organization Settings & About / Auto-Updater
  await page.goto('/preferences/general', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothMoveTo(page, 540, 340);
  await settlePage(page, 900);
  await snap(
    'Organization Settings — Fiscal Year, Multi-Currency & Localization',
    1900,
    'settings.png',
  );

  await page.goto('/preferences/about', { waitUntil: 'networkidle' });
  await expect(
    page.getByText('Sorry about that! Something went wrong'),
  ).toHaveCount(0);
  await smoothMoveTo(page, 500, 380);
  await settlePage(page, 800);
  await snap(
    'About & Cross-Platform Auto-Updater — One-Click Version Check & Install',
    2000,
  );

  fs.writeFileSync(
    path.join(GIF_FRAMES_DIR, 'manifest.json'),
    JSON.stringify(gifFrames, null, 2),
  );
});
