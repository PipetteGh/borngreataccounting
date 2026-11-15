import {
  Button,
  Callout,
  Card,
  Divider,
  FormGroup,
  HTMLSelect,
  Icon,
  InputGroup,
  Intent,
  NumericInput,
  Spinner,
  Tag,
  TextArea,
} from '@blueprintjs/core';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AppToaster } from '@/components';
import { useAuthOrganizationId, useAuthToken } from '@/hooks/state';
import { transformToCamelCase } from '@/utils';

type PresetId =
  | 'inventory-adjustment'
  | 'create-receipt'
  | 'create-invoice'
  | 'create-estimate'
  | 'send-email'
  | 'add-customer'
  | 'add-vendor'
  | 'add-item'
  | 'create-expense'
  | 'create-bill';

interface PresetDefinition {
  id: PresetId;
  title: string;
  subtitle: string;
  icon: any;
  example: string;
}

const PRESETS: PresetDefinition[] = [
  {
    id: 'inventory-adjustment',
    title: 'Update Inventory Stock',
    subtitle: 'Increase or decrease product stock quantity',
    icon: 'box',
    example: 'update inventory stock for belta malt with 45 quantities on today from jofanos vendor',
  },
  {
    id: 'create-receipt',
    title: 'Sell Item / Create Receipt',
    subtitle: 'Record an instant sale & payment receipt',
    icon: 'receipt',
    example: 'sell 5 belta malt to Walk-in Customer for 15',
  },
  {
    id: 'create-invoice',
    title: 'Create Sales Invoice',
    subtitle: 'Generate a customer invoice with line items',
    icon: 'document',
    example: 'create invoice for Walk-in Customer with 10 belta malt at 15',
  },
  {
    id: 'create-estimate',
    title: 'Create Estimate / Quote',
    subtitle: 'Create a sales estimate for a customer',
    icon: 'clipboard',
    example: 'create estimate for Walk-in Customer with 12 belta malt at 15',
  },
  {
    id: 'send-email',
    title: 'Send Document Email',
    subtitle: 'Email an invoice, receipt, or estimate',
    icon: 'envelope',
    example: 'send email for invoice INV-0001 to customer@example.com',
  },
  {
    id: 'add-customer',
    title: 'Add Customer',
    subtitle: 'Create a new customer profile',
    icon: 'new-person',
    example: 'add customer Ama Mensah email ama@example.com phone 0244123456',
  },
  {
    id: 'add-vendor',
    title: 'Add Vendor',
    subtitle: 'Create a new supplier / vendor',
    icon: 'office',
    example: 'add vendor Jofanos Enterprises email info@jofanos.com phone 0244000000',
  },
  {
    id: 'add-item',
    title: 'Add Product / Service',
    subtitle: 'Create a new inventory or service item',
    icon: 'cube-add',
    example: 'add product Belta Malt price 15 cost 10 inventory',
  },
  {
    id: 'create-expense',
    title: 'Record Expense',
    subtitle: 'Log a business expense payment',
    icon: 'credit-card',
    example: 'record expense 250 for Fuel and Transport',
  },
  {
    id: 'create-bill',
    title: 'Create Vendor Bill',
    subtitle: 'Record a purchase bill from a vendor',
    icon: 'endorsed',
    example: 'create bill from jofanos vendor for 45 belta malt at 10',
  },
];

interface SimpleItem {
  id: number;
  name: string;
  code?: string;
  type: string;
  sellPrice?: number;
  costPrice?: number;
  quantityOnHand?: number;
}

interface SimpleContact {
  id: number;
  displayName: string;
  email?: string;
}

interface SimpleAccount {
  id: number;
  name: string;
  accountType?: string;
  slug?: string;
}

interface SimpleDoc {
  id: number;
  number: string;
  customerEmail?: string;
}

interface ExecutionLog {
  id: string;
  time: string;
  action: string;
  summary: string;
  status: 'success' | 'error';
  route?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function extractDateFromText(text: string): string {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];
  const slashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${m}-${d}`;
  }
  return todayIso();
}

export function AutomationPage() {
  const history = useHistory();
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'organization-id': organizationId,
    }),
    [token, organizationId],
  );

  const [loadingData, setLoadingData] = useState(true);
  const [executing, setExecuting] = useState(false);

  const [items, setItems] = useState<SimpleItem[]>([]);
  const [customers, setCustomers] = useState<SimpleContact[]>([]);
  const [vendors, setVendors] = useState<SimpleContact[]>([]);
  const [accounts, setAccounts] = useState<SimpleAccount[]>([]);
  const [invoices, setInvoices] = useState<SimpleDoc[]>([]);
  const [receipts, setReceipts] = useState<SimpleDoc[]>([]);
  const [estimates, setEstimates] = useState<SimpleDoc[]>([]);

  const [commandText, setCommandText] = useState<string>(PRESETS[0].example);
  const [activePreset, setActivePreset] = useState<PresetId>('inventory-adjustment');

  // Structured automation parameters (auto-filled by parser OR edited manually)
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedVendorId, setSelectedVendorId] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(45);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'increment' | 'decrement'>('increment');
  const [actionDate, setActionDate] = useState<string>(todayIso());
  const [entityName, setEntityName] = useState<string>('');
  const [entityEmail, setEntityEmail] = useState<string>('');
  const [entityPhone, setEntityPhone] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'inventory' | 'service'>('inventory');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [reasonOrDesc, setReasonOrDesc] = useState<string>('');
  const [emailDocType, setEmailDocType] = useState<'invoice' | 'receipt' | 'estimate'>('invoice');
  const [emailDocId, setEmailDocId] = useState<number>(0);

  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const fetchEntities = useCallback(async () => {
    setLoadingData(true);
    try {
      const [itemsRes, custRes, vendRes, accRes, invRes, recRes, estRes] =
        await Promise.allSettled([
          axios.get('/api/items?page=1&page_size=500', { headers }),
          axios.get('/api/customers?page=1&page_size=200', { headers }),
          axios.get('/api/vendors?page=1&page_size=200', { headers }),
          axios.get('/api/accounts', { headers }),
          axios.get('/api/sale-invoices?page=1&page_size=50', { headers }),
          axios.get('/api/sale-receipts?page=1&page_size=50', { headers }),
          axios.get('/api/sale-estimates?page=1&page_size=50', { headers }),
        ]);

      if (itemsRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(itemsRes.value.data);
        const list: SimpleItem[] = Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setItems(list);
        if (list.length > 0 && !selectedItemId) {
          setSelectedItemId(list[0].id);
          setUnitPrice(Number(list[0].sellPrice || 0));
          setCostPrice(Number(list[0].costPrice || 0));
        }
      }

      if (custRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(custRes.value.data);
        const list: SimpleContact[] = Array.isArray(raw?.customers)
          ? raw.customers
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setCustomers(list);
        if (list.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(list[0].id);
        }
      }

      if (vendRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(vendRes.value.data);
        const list: SimpleContact[] = Array.isArray(raw?.vendors)
          ? raw.vendors
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setVendors(list);
        if (list.length > 0 && !selectedVendorId) {
          setSelectedVendorId(list[0].id);
        }
      }

      if (accRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(accRes.value.data);
        const list: SimpleAccount[] = Array.isArray(raw?.accounts)
          ? raw.accounts
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setAccounts(list);
        const cashAcc =
          list.find((a) => a.accountType === 'cash' || a.accountType === 'bank') || list[0];
        const expAcc =
          list.find((a) => a.accountType === 'expense' || a.accountType === 'cost-of-goods-sold') ||
          list[0];
        if (cashAcc && !selectedAccountId) setSelectedAccountId(cashAcc.id);
        if (expAcc && !selectedExpenseAccountId) setSelectedExpenseAccountId(expAcc.id);
      }

      if (invRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(invRes.value.data);
        const list = Array.isArray(raw?.salesInvoices) ? raw.salesInvoices : [];
        setInvoices(
          list.map((d: any) => ({
            id: d.id,
            number: d.invoiceNo || `INV-${d.id}`,
            customerEmail: d.customer?.email,
          })),
        );
      }

      if (recRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(recRes.value.data);
        const list = Array.isArray(raw?.salesReceipts) ? raw.salesReceipts : [];
        setReceipts(
          list.map((d: any) => ({
            id: d.id,
            number: d.receiptNumber || `REC-${d.id}`,
            customerEmail: d.customer?.email,
          })),
        );
      }

      if (estRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(estRes.value.data);
        const list = Array.isArray(raw?.salesEstimates) ? raw.salesEstimates : [];
        setEstimates(
          list.map((d: any) => ({
            id: d.id,
            number: d.estimateNumber || `EST-${d.id}`,
            customerEmail: d.customer?.email,
          })),
        );
      }
    } finally {
      setLoadingData(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const parseCommand = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      const lower = text.toLowerCase();
      if (!text) return;

      // 1. Detect Preset / Intent
      let detected: PresetId = activePreset;
      if (
        lower.includes('inventory') ||
        lower.includes('stock') ||
        lower.includes('adjust')
      ) {
        detected = 'inventory-adjustment';
      } else if (lower.includes('send email') || lower.includes('email ') || lower.includes('mail ')) {
        if (!lower.startsWith('add customer') && !lower.startsWith('add vendor')) {
          detected = 'send-email';
        }
      }
      if (lower.startsWith('add customer') || lower.includes('new customer') || lower.includes('create customer')) {
        detected = 'add-customer';
      } else if (lower.startsWith('add vendor') || lower.includes('new vendor') || lower.includes('create vendor')) {
        detected = 'add-vendor';
      } else if (lower.startsWith('add product') || lower.startsWith('add item') || lower.includes('new product')) {
        detected = 'add-item';
      } else if (lower.includes('estimate') || lower.includes('quote')) {
        detected = 'create-estimate';
      } else if (lower.includes('invoice')) {
        detected = lower.includes('send email') ? 'send-email' : 'create-invoice';
      } else if (lower.includes('receipt') || lower.startsWith('sell ')) {
        detected = 'create-receipt';
      } else if (lower.includes('expense') || lower.includes('record expense')) {
        detected = 'create-expense';
      } else if (lower.includes('bill')) {
        detected = 'create-bill';
      }

      setActivePreset(detected);
      setActionDate(extractDateFromText(text));

      // 2. Match known item, customer, vendor
      const matchedItem = items.find((i) => lower.includes(i.name.toLowerCase()));
      if (matchedItem) {
        setSelectedItemId(matchedItem.id);
        setUnitPrice(Number(matchedItem.sellPrice || 0));
        setCostPrice(Number(matchedItem.costPrice || 0));
      }

      const matchedCust = customers.find((c) => lower.includes(c.displayName.toLowerCase()));
      if (matchedCust) setSelectedCustomerId(matchedCust.id);

      const matchedVendor = vendors.find((v) => lower.includes(v.displayName.toLowerCase()));
      if (matchedVendor) setSelectedVendorId(matchedVendor.id);

      // 3. Extract quantity / numbers
      const qtyMatch =
        text.match(/(?:with|qty|quantity|quantities|sell|for)\s+(\d+(?:\.\d+)?)\b/i) ||
        text.match(/\b(\d+(?:\.\d+)?)\s+(?:quantities|quantity|qty|pcs|units|pieces|bottles|packs)\b/i) ||
        text.match(/\b(\d+(?:\.\d+)?)\b/);
      if (qtyMatch) {
        setQuantity(Number(qtyMatch[1]));
      }

      const priceMatch = text.match(/(?:at|@|price|for)\s+(\d+(?:\.\d+)?)\b/i);
      if (priceMatch && (detected === 'add-item' || detected === 'create-expense' || detected === 'create-invoice' || detected === 'create-receipt' || detected === 'create-estimate' || detected === 'create-bill')) {
        setUnitPrice(Number(priceMatch[1]));
      }

      const costMatch = text.match(/cost\s+(\d+(?:\.\d+)?)/i);
      if (costMatch) setCostPrice(Number(costMatch[1]));

      // 4. Extract email & phone
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) setEntityEmail(emailMatch[0]);

      const phoneMatch = text.match(/(?:phone|tel|mobile)\s+([+\d\-\s]{7,18})/i);
      if (phoneMatch) setEntityPhone(phoneMatch[1].trim());

      // 5. Extract vendor / reason for stock adjustment
      if (detected === 'inventory-adjustment') {
        const dec = lower.includes('decrease') || lower.includes('reduce') || lower.includes('remove') || lower.includes('deduct');
        setAdjustmentType(dec ? 'decrement' : 'increment');
        const fromMatch = text.match(/from\s+([a-zA-Z0-9\s.&'-]+?)(?:\s+vendor|\s+on|\s*$)/i);
        const vendorLabel = matchedVendor
          ? matchedVendor.displayName
          : fromMatch
            ? fromMatch[1].trim()
            : '';
        setReasonOrDesc(
          vendorLabel
            ? `Stock update from vendor: ${vendorLabel}`
            : 'Automated inventory stock update',
        );
      }

      // 6. Extract name for add-customer / add-vendor / add-item
      if (detected === 'add-customer' || detected === 'add-vendor' || detected === 'add-item') {
        const nameMatch = text.match(
          /(?:add|create|new)\s+(?:customer|vendor|product|item)\s+([a-zA-Z0-9\s.&'-]+?)(?=\s+(?:email|phone|price|cost|inventory|service|$))/i,
        );
        if (nameMatch) setEntityName(nameMatch[1].trim());
        if (detected === 'add-item') {
          setNewItemType(lower.includes('service') ? 'service' : 'inventory');
        }
      }

      // 7. Extract document for send-email
      if (detected === 'send-email') {
        if (lower.includes('receipt')) setEmailDocType('receipt');
        else if (lower.includes('estimate')) setEmailDocType('estimate');
        else setEmailDocType('invoice');
      }
    },
    [activePreset, items, customers, vendors],
  );

  const selectPreset = (preset: PresetDefinition) => {
    setActivePreset(preset.id);
    setCommandText(preset.example);
    parseCommand(preset.example);
  };

  const appendLog = (entry: Omit<ExecutionLog, 'id' | 'time'>) => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        ...entry,
      },
      ...prev,
    ]);
  };

  const executeAutomation = async () => {
    setExecuting(true);
    try {
      const selectedItem = items.find((i) => i.id === selectedItemId);
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      const selectedVend = vendors.find((v) => v.id === selectedVendorId);

      if (activePreset === 'inventory-adjustment') {
        if (!selectedItemId) throw new Error('Select a product to update inventory stock.');
        const adjAcc =
          accounts.find((a) => a.slug === 'inventory-adjustment') ||
          accounts.find((a) => a.accountType === 'cost-of-goods-sold') ||
          accounts.find((a) => a.accountType === 'expense') ||
          accounts[0];
        if (!adjAcc) throw new Error('No adjustment account found.');

        await axios.post(
          '/api/inventory-adjustments/quick',
          {
            date: actionDate,
            type: adjustmentType,
            adjustment_account_id: adjAcc.id,
            reason: reasonOrDesc || 'Automated stock update',
            description: commandText,
            item_id: selectedItemId,
            quantity,
            cost: costPrice || selectedItem?.costPrice || 0,
            publish: true,
          },
          { headers },
        );
        const msg = `Updated stock (${adjustmentType} +${quantity}) for "${selectedItem?.name}"`;
        appendLog({ action: 'Update Inventory Stock', summary: msg, status: 'success', route: '/inventory-adjustments' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-receipt') {
        if (!selectedItemId || !selectedCustomerId) throw new Error('Select both a customer and a product.');
        const depAcc =
          accounts.find((a) => a.id === selectedAccountId) ||
          accounts.find((a) => a.accountType === 'cash' || a.accountType === 'bank') ||
          accounts[0];
        const price = unitPrice || selectedItem?.sellPrice || 0;
        await axios.post(
          '/api/sale-receipts',
          {
            customer_id: selectedCustomerId,
            receipt_date: actionDate,
            deposit_account_id: depAcc?.id,
            closed: true,
            entries: [{ index: 1, item_id: selectedItemId, quantity, rate: price }],
          },
          { headers },
        );
        const msg = `Created receipt for ${quantity} x "${selectedItem?.name}" (${selectedCust?.displayName})`;
        appendLog({ action: 'Create Receipt', summary: msg, status: 'success', route: '/receipts' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-invoice') {
        if (!selectedItemId || !selectedCustomerId) throw new Error('Select both a customer and a product.');
        const price = unitPrice || selectedItem?.sellPrice || 0;
        await axios.post(
          '/api/sale-invoices',
          {
            customer_id: selectedCustomerId,
            invoice_date: actionDate,
            due_date: addDaysIso(14),
            delivered: true,
            entries: [{ index: 1, item_id: selectedItemId, quantity, rate: price }],
          },
          { headers },
        );
        const msg = `Created invoice for ${quantity} x "${selectedItem?.name}" (${selectedCust?.displayName})`;
        appendLog({ action: 'Create Invoice', summary: msg, status: 'success', route: '/invoices' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-estimate') {
        if (!selectedItemId || !selectedCustomerId) throw new Error('Select both a customer and a product.');
        const price = unitPrice || selectedItem?.sellPrice || 0;
        await axios.post(
          '/api/sale-estimates',
          {
            customer_id: selectedCustomerId,
            estimate_date: actionDate,
            expiration_date: addDaysIso(14),
            delivered: true,
            entries: [{ index: 1, item_id: selectedItemId, quantity, rate: price }],
          },
          { headers },
        );
        const msg = `Created estimate for ${quantity} x "${selectedItem?.name}" (${selectedCust?.displayName})`;
        appendLog({ action: 'Create Estimate', summary: msg, status: 'success', route: '/estimates' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'send-email') {
        const docs = emailDocType === 'receipt' ? receipts : emailDocType === 'estimate' ? estimates : invoices;
        const targetId = emailDocId || docs[0]?.id;
        if (!targetId) throw new Error(`No ${emailDocType} found to email.`);
        if (!entityEmail) throw new Error('Enter a recipient email address.');
        const endpoint =
          emailDocType === 'receipt'
            ? `/api/sale-receipts/${targetId}/mail`
            : emailDocType === 'estimate'
              ? `/api/sale-estimates/${targetId}/mail`
              : `/api/sale-invoices/${targetId}/mail`;
        await axios.post(
          endpoint,
          {
            to: [entityEmail],
            subject: `Your ${emailDocType} from BorngreatAccounting`,
            body: 'Please find your document attached.',
            attach_invoice: true,
          },
          { headers },
        );
        const msg = `Sent ${emailDocType} #${targetId} to ${entityEmail}`;
        appendLog({ action: 'Send Email', summary: msg, status: 'success' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-customer') {
        if (!entityName.trim()) throw new Error('Enter a customer name.');
        await axios.post(
          '/api/customers',
          {
            customer_type: 'individual',
            display_name: entityName.trim(),
            email: entityEmail || undefined,
            personal_phone: entityPhone || undefined,
            active: true,
          },
          { headers },
        );
        const msg = `Added customer "${entityName.trim()}"`;
        appendLog({ action: 'Add Customer', summary: msg, status: 'success', route: '/customers' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-vendor') {
        if (!entityName.trim()) throw new Error('Enter a vendor name.');
        await axios.post(
          '/api/vendors',
          {
            vendor_type: 'business',
            display_name: entityName.trim(),
            email: entityEmail || undefined,
            personal_phone: entityPhone || undefined,
            active: true,
          },
          { headers },
        );
        const msg = `Added vendor "${entityName.trim()}"`;
        appendLog({ action: 'Add Vendor', summary: msg, status: 'success', route: '/vendors' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-item') {
        if (!entityName.trim()) throw new Error('Enter a product/service name.');
        const sellAcc = accounts.find((a) => a.accountType === 'income') || accounts[0];
        const costAcc = accounts.find((a) => a.accountType === 'cost-of-goods-sold' || a.accountType === 'expense') || accounts[0];
        const invAcc = accounts.find((a) => a.slug === 'inventory-asset' || a.accountType === 'inventory') || accounts[0];
        await axios.post(
          '/api/items',
          {
            name: entityName.trim(),
            type: newItemType,
            sellable: true,
            purchasable: true,
            sell_price: unitPrice || 0,
            cost_price: costPrice || 0,
            sell_account_id: sellAcc?.id,
            cost_account_id: costAcc?.id,
            inventory_account_id: newItemType === 'inventory' ? invAcc?.id : undefined,
            active: true,
          },
          { headers },
        );
        const msg = `Added ${newItemType} product "${entityName.trim()}"`;
        appendLog({ action: 'Add Product', summary: msg, status: 'success', route: '/items' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-expense') {
        const payAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
        const expAcc = accounts.find((a) => a.id === selectedExpenseAccountId) || accounts[0];
        await axios.post(
          '/api/expenses',
          {
            payment_account_id: payAcc?.id,
            payment_date: actionDate,
            publish: true,
            categories: [
              {
                index: 1,
                expense_account_id: expAcc?.id,
                amount: unitPrice || quantity || 0,
                description: reasonOrDesc || commandText,
              },
            ],
          },
          { headers },
        );
        const msg = `Recorded expense of ${unitPrice || quantity} (${reasonOrDesc || 'Expense'})`;
        appendLog({ action: 'Record Expense', summary: msg, status: 'success', route: '/expenses' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-bill') {
        if (!selectedVendorId || !selectedItemId) throw new Error('Select both a vendor and a product.');
        await axios.post(
          '/api/bills',
          {
            vendor_id: selectedVendorId,
            bill_date: actionDate,
            due_date: addDaysIso(14),
            open: true,
            entries: [
              {
                index: 1,
                item_id: selectedItemId,
                quantity,
                rate: costPrice || selectedItem?.costPrice || unitPrice || 0,
              },
            ],
          },
          { headers },
        );
        const msg = `Created vendor bill from "${selectedVend?.displayName}" for ${quantity} x "${selectedItem?.name}"`;
        appendLog({ action: 'Create Bill', summary: msg, status: 'success', route: '/bills' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      }

      await fetchEntities();
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Automation failed.';
      appendLog({ action: activePreset, summary: msg, status: 'error' });
      AppToaster.show({ intent: Intent.DANGER, message: msg });
    } finally {
      setExecuting(false);
    }
  };

  const docOptions =
    emailDocType === 'receipt' ? receipts : emailDocType === 'estimate' ? estimates : invoices;

  return (
    <div
      data-testid="automation-workspace"
      style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon icon="flash" intent={Intent.PRIMARY} iconSize={22} />
            BorngreatAutomation
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>
            Type a command in plain English or pick a preset below to perform any accounting action automatically.
          </p>
        </div>
        {loadingData && <Spinner size={22} />}
      </div>

      {/* Command Input Card */}
      <Card elevation={2} style={{ marginBottom: 20 }}>
        <FormGroup
          label="Command / Prompt"
          helperText="Example: update inventory stock for belta malt with 45 quantities on 2026-11-15 from jofanos vendor"
        >
          <TextArea
            fill
            rows={2}
            large
            data-testid="automation-command-input"
            value={commandText}
            onChange={(e) => {
              setCommandText(e.target.value);
              parseCommand(e.target.value);
            }}
            placeholder="Describe what you want BorngreatAccounting to do..."
          />
        </FormGroup>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button
            icon="refresh"
            text="Parse Command"
            onClick={() => parseCommand(commandText)}
          />
          <Button
            intent={Intent.PRIMARY}
            icon="play"
            large
            loading={executing}
            data-testid="automation-run-btn"
            text="Run Automation"
            onClick={executeAutomation}
          />
        </div>
      </Card>

      {/* Presets Grid */}
      <h4 style={{ margin: '0 0 10px' }}>Quick Presets (Click any preset, adjust fields, and run)</h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {PRESETS.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <Card
              key={p.id}
              interactive
              elevation={isSelected ? 2 : 0}
              onClick={() => selectPreset(p)}
              data-testid={`preset-${p.id}`}
              style={{
                padding: 12,
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Icon icon={p.icon} intent={isSelected ? Intent.PRIMARY : Intent.NONE} />
                <span>{p.title}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{p.subtitle}</div>
            </Card>
          );
        })}
      </div>

      {/* Parsed Action Configuration */}
      <Card elevation={1} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag intent={Intent.PRIMARY} large>
            Action: {PRESETS.find((p) => p.id === activePreset)?.title}
          </Tag>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            Review or tweak the fields below before running
          </span>
        </div>
        <Divider style={{ marginBottom: 14 }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {(activePreset === 'inventory-adjustment' ||
            activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate' ||
            activePreset === 'create-bill') && (
            <FormGroup label="Product / Item">
              <HTMLSelect
                fill
                value={selectedItemId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedItemId(id);
                  const found = items.find((i) => i.id === id);
                  if (found) {
                    setUnitPrice(Number(found.sellPrice || 0));
                    setCostPrice(Number(found.costPrice || 0));
                  }
                }}
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock: {item.quantityOnHand ?? 0})
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {(activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate') && (
            <FormGroup label="Customer">
              <HTMLSelect
                fill
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {activePreset === 'create-bill' && (
            <FormGroup label="Vendor">
              <HTMLSelect
                fill
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(Number(e.target.value))}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {(activePreset === 'inventory-adjustment' ||
            activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate' ||
            activePreset === 'create-bill') && (
            <FormGroup label="Quantity">
              <NumericInput
                fill
                min={1}
                value={quantity}
                onValueChange={(val) => setQuantity(val || 1)}
              />
            </FormGroup>
          )}

          {activePreset === 'inventory-adjustment' && (
            <FormGroup label="Adjustment Type">
              <HTMLSelect
                fill
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'increment' | 'decrement')}
              >
                <option value="increment">Increase Stock (+)</option>
                <option value="decrement">Decrease Stock (-)</option>
              </HTMLSelect>
            </FormGroup>
          )}

          {(activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate' ||
            activePreset === 'add-item' ||
            activePreset === 'create-expense') && (
            <FormGroup label={activePreset === 'create-expense' ? 'Amount' : 'Unit Sell Price'}>
              <NumericInput
                fill
                min={0}
                value={unitPrice}
                onValueChange={(val) => setUnitPrice(val || 0)}
              />
            </FormGroup>
          )}

          {(activePreset === 'add-item' || activePreset === 'create-bill') && (
            <FormGroup label="Unit Cost Price">
              <NumericInput
                fill
                min={0}
                value={costPrice}
                onValueChange={(val) => setCostPrice(val || 0)}
              />
            </FormGroup>
          )}

          {(activePreset === 'add-customer' ||
            activePreset === 'add-vendor' ||
            activePreset === 'add-item') && (
            <FormGroup label="Name">
              <InputGroup
                fill
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Enter name..."
              />
            </FormGroup>
          )}

          {activePreset === 'add-item' && (
            <FormGroup label="Product Type">
              <HTMLSelect
                fill
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as 'inventory' | 'service')}
              >
                <option value="inventory">Inventory</option>
                <option value="service">Service</option>
              </HTMLSelect>
            </FormGroup>
          )}

          {activePreset === 'send-email' && (
            <>
              <FormGroup label="Document Type">
                <HTMLSelect
                  fill
                  value={emailDocType}
                  onChange={(e) => setEmailDocType(e.target.value as any)}
                >
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="estimate">Estimate</option>
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="Document">
                <HTMLSelect
                  fill
                  value={emailDocId || docOptions[0]?.id || 0}
                  onChange={(e) => setEmailDocId(Number(e.target.value))}
                >
                  {docOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.number}
                    </option>
                  ))}
                </HTMLSelect>
              </FormGroup>
            </>
          )}

          {(activePreset === 'add-customer' ||
            activePreset === 'add-vendor' ||
            activePreset === 'send-email') && (
            <FormGroup label="Email">
              <InputGroup
                fill
                value={entityEmail}
                onChange={(e) => setEntityEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </FormGroup>
          )}

          {(activePreset === 'add-customer' || activePreset === 'add-vendor') && (
            <FormGroup label="Phone">
              <InputGroup
                fill
                value={entityPhone}
                onChange={(e) => setEntityPhone(e.target.value)}
                placeholder="Phone number..."
              />
            </FormGroup>
          )}

          {(activePreset === 'inventory-adjustment' ||
            activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate' ||
            activePreset === 'create-expense' ||
            activePreset === 'create-bill') && (
            <FormGroup label="Date">
              <InputGroup
                fill
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
              />
            </FormGroup>
          )}

          {(activePreset === 'inventory-adjustment' || activePreset === 'create-expense') && (
            <FormGroup label="Reason / Description">
              <InputGroup
                fill
                value={reasonOrDesc}
                onChange={(e) => setReasonOrDesc(e.target.value)}
                placeholder="Reason or vendor note..."
              />
            </FormGroup>
          )}
        </div>
      </Card>

      {/* Execution History */}
      <Card elevation={1}>
        <h4 style={{ margin: '0 0 10px' }}>Automation Activity Log</h4>
        {logs.length === 0 ? (
          <Callout intent={Intent.NONE}>
            No automations executed yet in this session. Select a preset or type a command above and click{' '}
            <strong>Run Automation</strong>.
          </Callout>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 4,
                  background: log.status === 'success' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${log.status === 'success' ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div>
                  <Tag intent={log.status === 'success' ? Intent.SUCCESS : Intent.DANGER} minimal>
                    {log.action}
                  </Tag>{' '}
                  <span style={{ fontWeight: 500, marginLeft: 6 }}>{log.summary}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{log.time}</span>
                </div>
                {log.route && (
                  <Button
                    small
                    minimal
                    intent={Intent.PRIMARY}
                    rightIcon="arrow-right"
                    text="View"
                    onClick={() => history.push(log.route!)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
