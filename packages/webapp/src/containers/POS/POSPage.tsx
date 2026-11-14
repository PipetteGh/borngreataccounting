import {
  Button,
  Callout,
  Card,
  Dialog,
  Divider,
  FormGroup,
  HTMLSelect,
  Icon,
  InputGroup,
  Intent,
  NumericInput,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AppToaster } from '@/components';
import { useAuthOrganizationId, useAuthToken } from '@/hooks/state';
import { transformToCamelCase } from '@/utils';

interface PosItem {
  id: number;
  name: string;
  code?: string;
  type: string;
  sellPrice?: number;
  costPrice?: number;
  quantityOnHand?: number;
  category?: { id: number; name: string } | null;
  sellTaxRateId?: number | null;
  sellable?: boolean;
  active?: boolean;
}

interface PosCustomer {
  id: number;
  displayName: string;
  email?: string;
  phone?: string;
}

interface PosAccount {
  id: number;
  name: string;
  accountType?: string;
  slug?: string;
  currencyCode?: string;
}

interface PosTaxRate {
  id: number;
  name: string;
  rate: number;
}

interface PosGateway {
  provider: 'paystack' | 'flutterwave' | 'hubtel';
  displayName: string;
  configured: boolean;
  paymentEnabled: boolean;
}

interface CartLine {
  item: PosItem;
  quantity: number;
  unitPrice: number;
}

interface CompletedReceipt {
  id?: number;
  receiptNumber?: string;
  receiptDate: string;
  customerName: string;
  paymentMethodLabel: string;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountTendered: number;
  changeDue: number;
  checkoutUrl?: string;
}

function formatMoney(value: number, currency = 'GHS') {
  const num = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

function escapeHtml(str: string) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printThermalReceipt(
  receipt: CompletedReceipt,
  paperWidth: '80mm' | '58mm',
  currency: string,
  orgInfo: { name: string; phone?: string; address?: string },
) {
  const widthCss = paperWidth === '58mm' ? '54mm' : '74mm';
  const fontSize = paperWidth === '58mm' ? '10.5px' : '12px';
  const nowTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = receipt.lines
    .map((l) => {
      const lineTotal = formatMoney(l.quantity * l.unitPrice, currency);
      const unitPrice = formatMoney(l.unitPrice, currency);
      return `
        <div class="item-row">
          <div class="item-name">${escapeHtml(l.item.name)}</div>
          <div class="item-meta">
            <span>${l.quantity} x ${escapeHtml(unitPrice)}</span>
            <span>${escapeHtml(lineTotal)}</span>
          </div>
        </div>
      `;
    })
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(receipt.receiptNumber || '')}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 2mm;
    }
    * { box-sizing: border-box; }
    body {
      width: ${widthCss};
      margin: 0 auto;
      padding: 4px 2px 10px;
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .store-name { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .muted { font-size: 10.5px; }
    .dash { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; }
    .item-row { margin-bottom: 4px; }
    .item-name { font-weight: 600; word-break: break-word; }
    .item-meta { display: flex; justify-content: space-between; font-size: 11px; padding-left: 6px; }
    .total-row { font-size: 14px; font-weight: 700; margin-top: 2px; }
    .footer { text-align: center; margin-top: 10px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="store-name">${escapeHtml(orgInfo.name || 'BorngreatAccounting')}</div>
    ${orgInfo.address ? `<div class="muted">${escapeHtml(orgInfo.address)}</div>` : ''}
    ${orgInfo.phone ? `<div class="muted">Tel: ${escapeHtml(orgInfo.phone)}</div>` : ''}
    <div class="bold" style="margin-top:4px;">SALES RECEIPT</div>
  </div>
  <div class="dash"></div>
  <div class="row"><span>Receipt #:</span><span>${escapeHtml(receipt.receiptNumber || '-')}</span></div>
  <div class="row"><span>Date:</span><span>${escapeHtml(receipt.receiptDate)} ${escapeHtml(nowTime)}</span></div>
  <div class="row"><span>Customer:</span><span>${escapeHtml(receipt.customerName)}</span></div>
  <div class="row"><span>Payment:</span><span>${escapeHtml(receipt.paymentMethodLabel)}</span></div>
  <div class="dash"></div>
  ${rowsHtml}
  <div class="dash"></div>
  <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMoney(receipt.subtotal, currency))}</span></div>
  ${receipt.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${escapeHtml(formatMoney(receipt.discountAmount, currency))}</span></div>` : ''}
  ${receipt.taxAmount > 0 ? `<div class="row"><span>Tax</span><span>${escapeHtml(formatMoney(receipt.taxAmount, currency))}</span></div>` : ''}
  <div class="dash"></div>
  <div class="row total-row"><span>TOTAL</span><span>${escapeHtml(formatMoney(receipt.total, currency))}</span></div>
  <div class="row"><span>Tendered</span><span>${escapeHtml(formatMoney(receipt.amountTendered, currency))}</span></div>
  <div class="row"><span>Change Due</span><span>${escapeHtml(formatMoney(receipt.changeDue, currency))}</span></div>
  <div class="dash"></div>
  <div class="footer">
    <div class="bold">THANK YOU FOR YOUR BUSINESS!</div>
    <div class="muted">Powered by BorngreatAccounting POS</div>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  }, 150);
}

export function POSPage() {
  const history = useHistory();
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const api = useMemo(() => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (organizationId) headers['organization-id'] = organizationId;
    return axios.create({ baseURL: '/api', headers });
  }, [token, organizationId]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [items, setItems] = useState<PosItem[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [accounts, setAccounts] = useState<PosAccount[]>([]);
  const [taxRates, setTaxRates] = useState<PosTaxRate[]>([]);
  const [gateways, setGateways] = useState<PosGateway[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('GHS');
  const [orgInfo, setOrgInfo] = useState<{
    name: string;
    phone?: string;
    address?: string;
  }>({ name: 'BorngreatAccounting' });
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [depositAccountId, setDepositAccountId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'card' | 'mobile_money' | 'paystack' | 'flutterwave' | 'hubtel'
  >('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedTaxId, setSelectedTaxId] = useState<number | ''>('');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState('');

  const [completedReceipt, setCompletedReceipt] =
    useState<CompletedReceipt | null>(null);

  const loadPosData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        itemsRes,
        customersRes,
        accountsRes,
        taxRes,
        gatewaysRes,
        orgRes,
        branchesRes,
        warehousesRes,
      ] = await Promise.allSettled([
        api.get('/items', { params: { page_size: 250, page: 1 } }),
        api.get('/customers', { params: { page_size: 100, page: 1 } }),
        api.get('/accounts'),
        api.get('/tax_rates'),
        api.get('/payment-services/gateways'),
        api.get('/organization/current'),
        api.get('/branches'),
        api.get('/warehouses'),
      ]);

      if (branchesRes.status === 'fulfilled') {
        const raw = transformToCamelCase(branchesRes.value.data);
        const list = Array.isArray(raw?.branches)
          ? raw.branches
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        const primary = list.find((b: any) => b.primary) || list[0];
        if (primary?.id) setSelectedBranchId((prev) => prev || primary.id);
      }

      if (warehousesRes.status === 'fulfilled') {
        const raw = transformToCamelCase(warehousesRes.value.data);
        const list = Array.isArray(raw?.warehouses)
          ? raw.warehouses
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        const primary = list.find((w: any) => w.primary) || list[0];
        if (primary?.id) setSelectedWarehouseId((prev) => prev || primary.id);
      }

      if (itemsRes.status === 'fulfilled') {
        const raw = transformToCamelCase(itemsRes.value.data);
        const list = Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        setItems(
          list.filter(
            (it: PosItem) => it.active !== false && it.sellable !== false,
          ),
        );
      }

      if (customersRes.status === 'fulfilled') {
        const raw = transformToCamelCase(customersRes.value.data);
        const list = Array.isArray(raw?.customers)
          ? raw.customers
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId((prev) => prev || list[0].id);
        }
      }

      if (accountsRes.status === 'fulfilled') {
        const raw = transformToCamelCase(accountsRes.value.data);
        const list: PosAccount[] = Array.isArray(raw?.accounts)
          ? raw.accounts
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        const depositCandidates = list
          .filter((a) =>
            ['cash', 'bank', 'other-current-asset'].includes(
              (a.accountType || '').toLowerCase(),
            ),
          )
          .sort((a, b) => {
            const rank = (t?: string) =>
              t === 'cash' ? 0 : t === 'bank' ? 1 : 2;
            return rank(a.accountType?.toLowerCase()) - rank(b.accountType?.toLowerCase());
          });
        const usable = depositCandidates.length > 0 ? depositCandidates : list;
        setAccounts(usable);
        if (usable.length > 0) {
          setDepositAccountId((prev) => prev || usable[0].id);
        }
      }

      if (taxRes.status === 'fulfilled') {
        const raw = transformToCamelCase(taxRes.value.data);
        const list = Array.isArray(raw?.taxRates)
          ? raw.taxRates
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        setTaxRates(list);
      }

      if (gatewaysRes.status === 'fulfilled') {
        const raw = transformToCamelCase(gatewaysRes.value.data);
        if (Array.isArray(raw)) {
          setGateways(raw);
        }
      }

      if (orgRes.status === 'fulfilled') {
        const raw = transformToCamelCase(orgRes.value.data);
        if (raw?.baseCurrency) {
          setBaseCurrency(raw.baseCurrency);
        }
        if (raw?.name) {
          setOrgInfo({
            name: raw.name,
            phone: raw.phone || undefined,
            address: raw.address || raw.city || undefined,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (rootRef.current?.requestFullscreen) {
          await rootRef.current.requestFullscreen();
        }
      } catch {
        // CSS full-screen overlay stays active even if browser blocks native fullscreen
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
    }
  };

  const categories = useMemo(() => {
    const names = new Set<string>();
    items.forEach((it) => {
      if (it.category?.name) names.add(it.category.name);
    });
    return ['all', ...Array.from(names).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (inStockOnly && it.type === 'inventory' && (it.quantityOnHand ?? 0) <= 0) {
        return false;
      }
      if (
        selectedCategory !== 'all' &&
        (it.category?.name || '') !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (it.name || '').toLowerCase().includes(q) ||
        (it.code || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedCategory, inStockOnly]);

  const addToCart = (item: PosItem) => {
    const stock = Number(item.quantityOnHand ?? 0);
    if (item.type === 'inventory' && stock <= 0) {
      AppToaster.show({
        intent: Intent.WARNING,
        message: `${item.name} is currently out of stock.`,
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        if (item.type === 'inventory' && existing.quantity + 1 > stock) {
          AppToaster.show({
            intent: Intent.WARNING,
            message: `Only ${stock} unit(s) of ${item.name} available in inventory.`,
          });
          return prev;
        }
        return prev.map((line) =>
          line.item.id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          unitPrice: Number(item.sellPrice ?? 0),
        },
      ];
    });
  };

  const updateCartQty = (itemId: number, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((line) => line.item.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((line) => {
        if (line.item.id !== itemId) return line;
        const stock = Number(line.item.quantityOnHand ?? 0);
        if (line.item.type === 'inventory' && nextQty > stock) {
          AppToaster.show({
            intent: Intent.WARNING,
            message: `Maximum available stock for ${line.item.name} is ${stock}.`,
          });
          return line;
        }
        return { ...line, quantity: nextQty };
      }),
    );
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const exactMatch = items.find(
      (it) =>
        (it.code || '').toLowerCase() === q ||
        (it.name || '').toLowerCase() === q,
    );
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
    } else if (filteredItems.length === 1) {
      addToCart(filteredItems[0]);
      setSearchQuery('');
    }
  };

  const createWalkInCustomer = async () => {
    try {
      const res = await api.post('/customers', {
        customer_type: 'individual',
        display_name: 'Walk-in Customer',
        currency_code: baseCurrency || 'GHS',
      });
      const created = transformToCamelCase(res.data);
      const id = created?.id || created?.data?.id;
      await loadPosData();
      if (id) setSelectedCustomerId(id);
      AppToaster.show({
        intent: Intent.SUCCESS,
        message: 'Walk-in Customer created and selected.',
      });
    } catch (err: any) {
      AppToaster.show({
        intent: Intent.DANGER,
        message:
          err?.response?.data?.message || 'Could not create Walk-in Customer.',
      });
    }
  };

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [cart],
  );

  const discountAmount = useMemo(() => {
    const pct = Math.max(0, Math.min(100, discountPercent || 0));
    return (subtotal * pct) / 100;
  }, [subtotal, discountPercent]);

  const activeTaxRate = useMemo(
    () => taxRates.find((t) => t.id === Number(selectedTaxId)) || null,
    [taxRates, selectedTaxId],
  );

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - discountAmount);
    return activeTaxRate ? (taxable * Number(activeTaxRate.rate || 0)) / 100 : 0;
  }, [subtotal, discountAmount, activeTaxRate]);

  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount + taxAmount),
    [subtotal, discountAmount, taxAmount],
  );

  useEffect(() => {
    setAmountTendered(Number(grandTotal.toFixed(2)));
  }, [grandTotal]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, (amountTendered || 0) - grandTotal);
  }, [paymentMethod, amountTendered, grandTotal]);

  const selectedGateway = useMemo(
    () =>
      gateways.find((g) => g.provider === paymentMethod) || null,
    [gateways, paymentMethod],
  );

  const completeSale = async () => {
    if (cart.length === 0) {
      AppToaster.show({
        intent: Intent.WARNING,
        message: 'Add at least one product to the cart.',
      });
      return;
    }
    if (!selectedCustomerId) {
      AppToaster.show({
        intent: Intent.WARNING,
        message: 'Select a customer (or click + Walk-in Customer).',
      });
      return;
    }
    if (!depositAccountId) {
      AppToaster.show({
        intent: Intent.WARNING,
        message: 'Select a Cash/Bank deposit account.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const today = new Date().toISOString().slice(0, 10);
      const paymentLabels: Record<string, string> = {
        cash: 'Cash',
        card: 'Card / POS Terminal',
        mobile_money: 'Mobile Money (Manual)',
        paystack: 'Paystack',
        flutterwave: 'Flutterwave',
        hubtel: 'Hubtel Mobile Money & Cards',
      };

      const receiptPayload = {
        customer_id: Number(selectedCustomerId),
        deposit_account_id: Number(depositAccountId),
        ...(selectedBranchId ? { branch_id: Number(selectedBranchId) } : {}),
        ...(selectedWarehouseId ? { warehouse_id: Number(selectedWarehouseId) } : {}),
        receipt_date: today,
        closed: true,
        reference_no:
          referenceNo.trim() || `POS-${Date.now().toString().slice(-6)}`,
        receipt_message: `POS Sale (${paymentLabels[paymentMethod]})`,
        discount: discountPercent > 0 ? discountPercent : undefined,
        discount_type: discountPercent > 0 ? 'percentage' : undefined,
        entries: cart.map((line, idx) => ({
          index: idx + 1,
          item_id: line.item.id,
          quantity: line.quantity,
          rate: line.unitPrice,
          ...(selectedTaxId ? { tax_rate_id: Number(selectedTaxId) } : {}),
        })),
      };

      const res = await api.post('/sale-receipts', receiptPayload);
      const created = transformToCamelCase(res.data);

      let checkoutUrl: string | undefined;
      if (
        (paymentMethod === 'paystack' ||
          paymentMethod === 'flutterwave' ||
          paymentMethod === 'hubtel') &&
        selectedGateway?.configured
      ) {
        try {
          const customerObj = customers.find(
            (c) => c.id === Number(selectedCustomerId),
          );
          const gwRes = await api.post(
            `/payment-services/gateways/${paymentMethod}/checkout`,
            {
              amount: Number(grandTotal.toFixed(2)),
              currency: baseCurrency,
              customer_email: customerObj?.email || 'pos-customer@borngreat.local',
              customer_name: customerObj?.displayName || 'Walk-in Customer',
              reference: receiptPayload.reference_no,
              description: `POS Sale ${receiptPayload.reference_no}`,
            },
          );
          checkoutUrl = gwRes.data?.authorization_url || gwRes.data?.authorizationUrl;
        } catch {
          // Receipt was still recorded in accounting & inventory
        }
      }

      const customerName =
        customers.find((c) => c.id === Number(selectedCustomerId))
          ?.displayName || 'Customer';

      setCompletedReceipt({
        id: created?.id,
        receiptNumber: created?.receiptNumber || receiptPayload.reference_no,
        receiptDate: today,
        customerName,
        paymentMethodLabel: paymentLabels[paymentMethod],
        lines: [...cart],
        subtotal,
        discountAmount,
        taxAmount,
        total: grandTotal,
        amountTendered: paymentMethod === 'cash' ? amountTendered : grandTotal,
        changeDue,
        checkoutUrl,
      });

      setCart([]);
      setDiscountPercent(0);
      setReferenceNo('');
      await loadPosData();

      AppToaster.show({
        intent: Intent.SUCCESS,
        message: 'POS sale completed! Inventory and accounting updated.',
      });
    } catch (err: any) {
      AppToaster.show({
        intent: Intent.DANGER,
        message:
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.message ||
          'Failed to complete POS sale.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-testid="pos-workspace"
      style={{
        ...(isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              overflow: 'auto',
            }
          : {
              minHeight: 'calc(100vh - 56px)',
            }),
        background: 'var(--bg-canvas, #f4f6f9)',
        color: 'var(--text-primary, #1f2937)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top POS Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          background: 'var(--bg-surface, #ffffff)',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon icon="shop" size={20} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Point of Sale (POS)
          </span>
          <Tag minimal intent={Intent.PRIMARY}>
            {items.length} Products
          </Tag>
          {isFullscreen && (
            <Tag intent={Intent.SUCCESS} minimal>
              Full Screen Mode
            </Tag>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            small
            icon="refresh"
            text="Sync Inventory"
            onClick={loadPosData}
            loading={loading}
          />
          <Button
            small
            intent={isFullscreen ? Intent.WARNING : Intent.PRIMARY}
            icon={isFullscreen ? 'minimize' : 'fullscreen'}
            text={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            onClick={toggleFullscreen}
            data-testid="pos-fullscreen-btn"
          />
        </div>
      </div>

      {/* Main Split Register Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(340px, 1fr)',
          gap: 14,
          padding: 14,
          minHeight: 0,
        }}
      >
        {/* Left: Product Catalog */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 0,
          }}
        >
          <Card
            style={{
              padding: 12,
              background: 'var(--bg-surface, #ffffff)',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 240px' }}>
              <InputGroup
                inputRef={searchRef}
                leftIcon="search"
                placeholder="Search product name or scan SKU / barcode (Enter to add)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeEnter}
                rightElement={
                  searchQuery ? (
                    <Button
                      minimal
                      icon="cross"
                      onClick={() => setSearchQuery('')}
                    />
                  ) : undefined
                }
              />
            </div>
            <HTMLSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </HTMLSelect>
            <Button
              small
              active={inStockOnly}
              intent={inStockOnly ? Intent.PRIMARY : Intent.NONE}
              text="In Stock Only"
              onClick={() => setInStockOnly((v) => !v)}
            />
          </Card>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
              gap: 10,
              alignContent: 'start',
            }}
          >
            {loading ? (
              <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center' }}>
                <Spinner size={30} />
              </div>
            ) : filteredItems.length === 0 ? (
              <Card
                style={{
                  gridColumn: '1 / -1',
                  padding: 32,
                  textAlign: 'center',
                  background: 'var(--bg-surface, #ffffff)',
                }}
              >
                <p style={{ margin: '0 0 10px' }}>
                  No sellable products match your filter.
                </p>
                <Button
                  intent={Intent.PRIMARY}
                  icon="plus"
                  text="Create Inventory Item"
                  onClick={() => history.push('/items/new')}
                />
              </Card>
            ) : (
              filteredItems.map((item) => {
                const stock = Number(item.quantityOnHand ?? 0);
                const isInventory = item.type === 'inventory';
                const outOfStock = isInventory && stock <= 0;

                return (
                  <Card
                    key={item.id}
                    interactive={!outOfStock}
                    onClick={() => addToCart(item)}
                    style={{
                      padding: 12,
                      background: 'var(--bg-surface, #ffffff)',
                      opacity: outOfStock ? 0.55 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 8,
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          marginBottom: 4,
                        }}
                      >
                        {item.name}
                      </div>
                      {item.code && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--text-muted, #6b7280)',
                          }}
                        >
                          SKU: {item.code}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--accent-color, #2563eb)',
                        }}
                      >
                        {formatMoney(Number(item.sellPrice ?? 0), baseCurrency)}
                      </span>
                      <Tag
                        minimal
                        intent={
                          !isInventory
                            ? Intent.NONE
                            : stock > 5
                              ? Intent.SUCCESS
                              : stock > 0
                                ? Intent.WARNING
                                : Intent.DANGER
                        }
                      >
                        {isInventory ? `Stock: ${stock}` : 'Service'}
                      </Tag>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <Card
          style={{
            padding: 14,
            background: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 0,
          }}
        >
          {/* Customer & Deposit Account */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormGroup
              label="Customer"
              style={{ marginBottom: 0 }}
              labelInfo={
                <a
                  role="button"
                  tabIndex={0}
                  style={{
                    color: 'var(--accent-color, #2563eb)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 11.5,
                  }}
                  onClick={createWalkInCustomer}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') createWalkInCustomer();
                  }}
                >
                  + Walk-in
                </a>
              }
            >
              <HTMLSelect
                fill
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Deposit Account" style={{ marginBottom: 0 }}>
              <HTMLSelect
                fill
                value={depositAccountId}
                onChange={(e) => setDepositAccountId(Number(e.target.value))}
              >
                <option value="">Select account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 140 }}>
            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '28px 12px',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                <Icon icon="shopping-cart" size={28} style={{ opacity: 0.4 }} />
                <p style={{ marginTop: 8 }}>
                  Click any product on the left to add it to the register cart.
                </p>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {line.item.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted, #6b7280)',
                      }}
                    >
                      {formatMoney(line.unitPrice, baseCurrency)} each
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Button
                      small
                      minimal
                      icon="minus"
                      onClick={() =>
                        updateCartQty(line.item.id, line.quantity - 1)
                      }
                    />
                    <span
                      style={{
                        minWidth: 24,
                        textAlign: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {line.quantity}
                    </span>
                    <Button
                      small
                      minimal
                      icon="plus"
                      onClick={() =>
                        updateCartQty(line.item.id, line.quantity + 1)
                      }
                    />
                  </div>

                  <div
                    style={{
                      minWidth: 78,
                      textAlign: 'right',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {formatMoney(
                      line.quantity * line.unitPrice,
                      baseCurrency,
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* Discount, Tax & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormGroup label="Discount (%)" style={{ marginBottom: 0 }}>
              <NumericInput
                fill
                min={0}
                max={100}
                value={discountPercent}
                onValueChange={(v) => setDiscountPercent(Number.isFinite(v) ? v : 0)}
              />
            </FormGroup>

            <FormGroup label="Tax Rate" style={{ marginBottom: 0 }}>
              <HTMLSelect
                fill
                value={selectedTaxId}
                onChange={(e) =>
                  setSelectedTaxId(
                    e.target.value ? Number(e.target.value) : '',
                  )
                }
              >
                <option value="">No Tax</option>
                {taxRates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormGroup label="Payment Method" style={{ marginBottom: 0 }}>
              <HTMLSelect
                fill
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card / Bank POS</option>
                <option value="mobile_money">Mobile Money (Manual)</option>
                <option value="paystack">Paystack (Cards & MoMo)</option>
                <option value="flutterwave">Flutterwave (Africa & Global)</option>
                <option value="hubtel">Hubtel (Ghana MoMo & GhQR)</option>
              </HTMLSelect>
            </FormGroup>

            {paymentMethod === 'cash' ? (
              <FormGroup label="Cash Tendered" style={{ marginBottom: 0 }}>
                <NumericInput
                  fill
                  min={0}
                  value={amountTendered}
                  onValueChange={(v) =>
                    setAmountTendered(Number.isFinite(v) ? v : 0)
                  }
                />
              </FormGroup>
            ) : (
              <FormGroup label="Reference #" style={{ marginBottom: 0 }}>
                <InputGroup
                  placeholder="Optional ref / MoMo ID"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </FormGroup>
            )}
          </div>

          {selectedGateway && !selectedGateway.configured && (
            <Callout intent={Intent.WARNING} style={{ padding: '6px 10px' }}>
              <span>
                {selectedGateway.displayName} API keys are not configured yet.{' '}
              </span>
              <Button
                minimal
                small
                intent={Intent.PRIMARY}
                text="Setup in Payment Methods"
                onClick={() => history.push('/preferences/payment-methods')}
              />
            </Callout>
          )}

          {/* Totals Summary */}
          <div
            style={{
              background: 'var(--bg-canvas, #f4f6f9)',
              padding: 10,
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, baseCurrency)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatMoney(discountAmount, baseCurrency)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax</span>
                <span>{formatMoney(taxAmount, baseCurrency)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 16,
                paddingTop: 4,
                borderTop: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <span>Total</span>
              <span>{formatMoney(grandTotal, baseCurrency)}</span>
            </div>
            {paymentMethod === 'cash' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                <span>Change Due</span>
                <strong>{formatMoney(changeDue, baseCurrency)}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              minimal
              intent={Intent.DANGER}
              text="Clear"
              disabled={cart.length === 0 || submitting}
              onClick={() => setCart([])}
            />
            <Button
              fill
              large
              intent={Intent.SUCCESS}
              icon="tick-circle"
              loading={submitting}
              disabled={cart.length === 0}
              text={`Complete Sale (${formatMoney(grandTotal, baseCurrency)})`}
              onClick={completeSale}
              data-testid="pos-complete-sale-btn"
            />
          </div>
        </Card>
      </div>

      {/* Thermal Receipt Modal */}
      <Dialog
        isOpen={Boolean(completedReceipt)}
        onClose={() => setCompletedReceipt(null)}
        title="POS Sale Completed"
        icon="endorsed"
        style={{ width: 400 }}
      >
        {completedReceipt && (
          <div style={{ padding: 18 }}>
            <div
              data-testid="thermal-receipt-preview"
              style={{
                width: paperWidth === '58mm' ? 235 : 302,
                margin: '0 auto',
                padding: '14px 12px',
                background: '#ffffff',
                color: '#000000',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: paperWidth === '58mm' ? 11 : 12,
                lineHeight: 1.4,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: 'uppercase',
                  }}
                >
                  {orgInfo.name}
                </div>
                {orgInfo.address && (
                  <div style={{ fontSize: 10.5 }}>{orgInfo.address}</div>
                )}
                {orgInfo.phone && (
                  <div style={{ fontSize: 10.5 }}>Tel: {orgInfo.phone}</div>
                )}
                <div style={{ fontWeight: 700, marginTop: 4 }}>SALES RECEIPT</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Receipt #:</span>
                <span>{completedReceipt.receiptNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date:</span>
                <span>{completedReceipt.receiptDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer:</span>
                <span>{completedReceipt.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment:</span>
                <span>{completedReceipt.paymentMethodLabel}</span>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              {completedReceipt.lines.map((l) => (
                <div key={l.item.id} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600 }}>{l.item.name}</div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      paddingLeft: 6,
                    }}
                  >
                    <span>
                      {l.quantity} x {formatMoney(l.unitPrice, baseCurrency)}
                    </span>
                    <span>
                      {formatMoney(l.quantity * l.unitPrice, baseCurrency)}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatMoney(completedReceipt.subtotal, baseCurrency)}</span>
              </div>
              {completedReceipt.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Discount</span>
                  <span>
                    -{formatMoney(completedReceipt.discountAmount, baseCurrency)}
                  </span>
                </div>
              )}
              {completedReceipt.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax</span>
                  <span>{formatMoney(completedReceipt.taxAmount, baseCurrency)}</span>
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                <span>TOTAL</span>
                <span>{formatMoney(completedReceipt.total, baseCurrency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tendered</span>
                <span>
                  {formatMoney(completedReceipt.amountTendered, baseCurrency)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Change Due</span>
                <span>{formatMoney(completedReceipt.changeDue, baseCurrency)}</span>
              </div>

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11 }}>
                <div style={{ fontWeight: 700 }}>THANK YOU FOR YOUR BUSINESS!</div>
                <div style={{ fontSize: 10 }}>Powered by BorngreatAccounting POS</div>
              </div>
            </div>

            {completedReceipt.checkoutUrl && (
              <Callout intent={Intent.PRIMARY} style={{ marginTop: 12 }}>
                <a
                  href={completedReceipt.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Online Payment Link
                </a>
              </Callout>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
              }}
            >
              <HTMLSelect
                value={paperWidth}
                onChange={(e) =>
                  setPaperWidth(e.target.value as '80mm' | '58mm')
                }
              >
                <option value="80mm">80mm Thermal</option>
                <option value="58mm">58mm Thermal</option>
              </HTMLSelect>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon="print"
                  text="Print Receipt"
                  onClick={() =>
                    printThermalReceipt(
                      completedReceipt,
                      paperWidth,
                      baseCurrency,
                      orgInfo,
                    )
                  }
                />
                <Button
                  intent={Intent.PRIMARY}
                  text="New Sale"
                  onClick={() => setCompletedReceipt(null)}
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
