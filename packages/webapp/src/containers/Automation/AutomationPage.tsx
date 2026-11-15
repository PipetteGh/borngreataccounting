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

type PresetCategory = 'All' | 'Sales' | 'Inventory & Purchases' | 'Accounting & Banking' | 'Contacts & Settings';

type PresetId =
  | 'inventory-adjustment'
  | 'create-receipt'
  | 'create-invoice'
  | 'create-estimate'
  | 'receive-payment'
  | 'send-email'
  | 'add-customer'
  | 'add-vendor'
  | 'add-item'
  | 'add-category'
  | 'add-warehouse'
  | 'warehouse-transfer'
  | 'create-expense'
  | 'create-bill'
  | 'pay-bill'
  | 'add-account'
  | 'create-journal'
  | 'add-tax-rate'
  | 'update-settings';

interface PresetDefinition {
  id: PresetId;
  category: Exclude<PresetCategory, 'All'>;
  title: string;
  subtitle: string;
  icon: any;
  example: string;
}

const PRESETS: PresetDefinition[] = [
  {
    id: 'inventory-adjustment',
    category: 'Inventory & Purchases',
    title: 'Update Inventory Stock',
    subtitle: 'Increase or decrease product stock quantity',
    icon: 'box',
    example: 'update inventory stock for belta malt with 45 quantities on today from jofanos vendor',
  },
  {
    id: 'create-receipt',
    category: 'Sales',
    title: 'Sell Item / Create Receipt',
    subtitle: 'Record an instant sale & payment receipt',
    icon: 'receipt',
    example: 'sell 5 belta malt to Walk-in Customer for 15',
  },
  {
    id: 'create-invoice',
    category: 'Sales',
    title: 'Create Sales Invoice',
    subtitle: 'Generate a customer invoice with line items',
    icon: 'document',
    example: 'create invoice for Walk-in Customer with 10 belta malt at 15',
  },
  {
    id: 'create-estimate',
    category: 'Sales',
    title: 'Create Estimate / Quote',
    subtitle: 'Create a sales estimate for a customer',
    icon: 'clipboard',
    example: 'create estimate for Walk-in Customer with 12 belta malt at 15',
  },
  {
    id: 'receive-payment',
    category: 'Sales',
    title: 'Receive Customer Payment',
    subtitle: 'Record a payment received against an invoice',
    icon: 'dollar',
    example: 'receive payment 150 from Walk-in Customer',
  },
  {
    id: 'send-email',
    category: 'Sales',
    title: 'Send Document Email',
    subtitle: 'Email an invoice, receipt, or estimate',
    icon: 'envelope',
    example: 'send email for invoice INV-0001 to customer@example.com',
  },
  {
    id: 'add-customer',
    category: 'Contacts & Settings',
    title: 'Add Customer',
    subtitle: 'Create a new customer profile',
    icon: 'new-person',
    example: 'add customer Ama Mensah email ama@example.com phone 0244123456',
  },
  {
    id: 'add-vendor',
    category: 'Contacts & Settings',
    title: 'Add Vendor',
    subtitle: 'Create a new supplier / vendor',
    icon: 'office',
    example: 'add vendor Jofanos Enterprises email info@jofanos.com phone 0244000000',
  },
  {
    id: 'add-item',
    category: 'Inventory & Purchases',
    title: 'Add Product / Service',
    subtitle: 'Create a new inventory or service item',
    icon: 'cube-add',
    example: 'add product Belta Malt price 15 cost 10 inventory',
  },
  {
    id: 'add-category',
    category: 'Inventory & Purchases',
    title: 'Add Product Category',
    subtitle: 'Create a new item category',
    icon: 'tag',
    example: 'add category Beverages',
  },
  {
    id: 'add-warehouse',
    category: 'Inventory & Purchases',
    title: 'Create Warehouse',
    subtitle: 'Add a new storage warehouse location',
    icon: 'home',
    example: 'add warehouse Accra Main Depot',
  },
  {
    id: 'warehouse-transfer',
    category: 'Inventory & Purchases',
    title: 'Transfer Warehouse Stock',
    subtitle: 'Move inventory between two warehouses',
    icon: 'exchange',
    example: 'transfer 10 belta malt between warehouses',
  },
  {
    id: 'create-expense',
    category: 'Accounting & Banking',
    title: 'Record Expense',
    subtitle: 'Log a business expense payment',
    icon: 'credit-card',
    example: 'record expense 250 for Fuel and Transport',
  },
  {
    id: 'create-bill',
    category: 'Inventory & Purchases',
    title: 'Create Vendor Bill',
    subtitle: 'Record a purchase bill from a vendor',
    icon: 'endorsed',
    example: 'create bill from jofanos vendor for 45 belta malt at 10',
  },
  {
    id: 'pay-bill',
    category: 'Accounting & Banking',
    title: 'Pay Vendor Bill',
    subtitle: 'Record a payment made to a vendor',
    icon: 'bank-account',
    example: 'pay bill 200 to jofanos vendor',
  },
  {
    id: 'add-account',
    category: 'Accounting & Banking',
    title: 'Add Ledger Account',
    subtitle: 'Create a chart-of-accounts ledger account',
    icon: 'book',
    example: 'add account MTN MoMo Business type cash',
  },
  {
    id: 'create-journal',
    category: 'Accounting & Banking',
    title: 'Create Manual Journal',
    subtitle: 'Post a balanced debit & credit journal entry',
    icon: 'calculator',
    example: 'create journal 500 for Petty Cash Top-up',
  },
  {
    id: 'add-tax-rate',
    category: 'Contacts & Settings',
    title: 'Add Tax Rate',
    subtitle: 'Create a new sales/purchase tax rate',
    icon: 'percentage',
    example: 'add tax rate VAT Standard 15%',
  },
  {
    id: 'update-settings',
    category: 'Contacts & Settings',
    title: 'Update Settings / Preferences',
    subtitle: 'Update invoice prefixes, notes, or system settings',
    icon: 'cog',
    example: 'update setting key next_number value 00100 group sales_invoices',
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

interface SimpleWarehouse {
  id: number;
  name: string;
  code?: string;
}

interface SimpleDoc {
  id: number;
  number: string;
  dueAmount?: number;
  customerId?: number;
  vendorId?: number;
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
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [invoices, setInvoices] = useState<SimpleDoc[]>([]);
  const [receipts, setReceipts] = useState<SimpleDoc[]>([]);
  const [estimates, setEstimates] = useState<SimpleDoc[]>([]);
  const [bills, setBills] = useState<SimpleDoc[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<PresetCategory>('All');
  const [commandText, setCommandText] = useState<string>(PRESETS[0].example);
  const [activePreset, setActivePreset] = useState<PresetId>('inventory-adjustment');

  // Structured automation parameters
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedVendorId, setSelectedVendorId] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState<number>(0);
  const [fromWarehouseId, setFromWarehouseId] = useState<number>(0);
  const [toWarehouseId, setToWarehouseId] = useState<number>(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number>(0);
  const [selectedBillId, setSelectedBillId] = useState<number>(0);

  const [quantity, setQuantity] = useState<number>(45);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'increment' | 'decrement'>('increment');
  const [actionDate, setActionDate] = useState<string>(todayIso());
  const [entityName, setEntityName] = useState<string>('');
  const [entityEmail, setEntityEmail] = useState<string>('');
  const [entityPhone, setEntityPhone] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'inventory' | 'service'>('inventory');
  const [newAccountType, setNewAccountType] = useState<string>('cash');
  const [taxRateValue, setTaxRateValue] = useState<number>(15);
  const [reasonOrDesc, setReasonOrDesc] = useState<string>('');
  const [emailDocType, setEmailDocType] = useState<'invoice' | 'receipt' | 'estimate'>('invoice');
  const [emailDocId, setEmailDocId] = useState<number>(0);

  // Settings update fields
  const [settingGroup, setSettingGroup] = useState<string>('sales_invoices');
  const [settingKey, setSettingKey] = useState<string>('next_number');
  const [settingValue, setSettingValue] = useState<string>('00100');

  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const fetchEntities = useCallback(async () => {
    setLoadingData(true);
    try {
      const [
        itemsRes,
        custRes,
        vendRes,
        accRes,
        whRes,
        invRes,
        recRes,
        estRes,
        billRes,
      ] = await Promise.allSettled([
        axios.get('/api/items?page=1&page_size=500', { headers }),
        axios.get('/api/customers?page=1&page_size=200', { headers }),
        axios.get('/api/vendors?page=1&page_size=200', { headers }),
        axios.get('/api/accounts', { headers }),
        axios.get('/api/warehouses', { headers }),
        axios.get('/api/sale-invoices?page=1&page_size=50', { headers }),
        axios.get('/api/sale-receipts?page=1&page_size=50', { headers }),
        axios.get('/api/sale-estimates?page=1&page_size=50', { headers }),
        axios.get('/api/bills?page=1&page_size=50', { headers }),
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

      if (whRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(whRes.value.data);
        const list: SimpleWarehouse[] = Array.isArray(raw?.warehouses)
          ? raw.warehouses
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];
        setWarehouses(list);
        if (list.length > 0 && !fromWarehouseId) setFromWarehouseId(list[0].id);
        if (list.length > 1 && !toWarehouseId) setToWarehouseId(list[1].id);
        else if (list.length > 0 && !toWarehouseId) setToWarehouseId(list[0].id);
      }

      if (invRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(invRes.value.data);
        const list = Array.isArray(raw?.salesInvoices) ? raw.salesInvoices : [];
        const mapped = list.map((d: any) => ({
          id: d.id,
          number: d.invoiceNo || `INV-${d.id}`,
          dueAmount: Number(d.dueAmount ?? d.balance ?? 0),
          customerId: d.customerId,
        }));
        setInvoices(mapped);
        if (mapped.length > 0 && !selectedInvoiceId) setSelectedInvoiceId(mapped[0].id);
      }

      if (recRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(recRes.value.data);
        const list = Array.isArray(raw?.salesReceipts) ? raw.salesReceipts : [];
        setReceipts(
          list.map((d: any) => ({
            id: d.id,
            number: d.receiptNumber || `REC-${d.id}`,
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
          })),
        );
      }

      if (billRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(billRes.value.data);
        const list = Array.isArray(raw?.bills) ? raw.bills : [];
        const mapped = list.map((d: any) => ({
          id: d.id,
          number: d.billNumber || `BILL-${d.id}`,
          dueAmount: Number(d.dueAmount ?? d.balance ?? 0),
          vendorId: d.vendorId,
        }));
        setBills(mapped);
        if (mapped.length > 0 && !selectedBillId) setSelectedBillId(mapped[0].id);
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

      let detected: PresetId = activePreset;
      if (lower.includes('setting') || lower.includes('preference')) {
        detected = 'update-settings';
      } else if (lower.includes('warehouse transfer') || (lower.includes('transfer') && lower.includes('warehouse'))) {
        detected = 'warehouse-transfer';
      } else if (lower.startsWith('add warehouse') || lower.includes('create warehouse')) {
        detected = 'add-warehouse';
      } else if (lower.startsWith('add category') || lower.includes('create category')) {
        detected = 'add-category';
      } else if (lower.includes('tax rate') || lower.includes('add tax')) {
        detected = 'add-tax-rate';
      } else if (lower.startsWith('add account') || lower.includes('create account')) {
        detected = 'add-account';
      } else if (lower.includes('journal')) {
        detected = 'create-journal';
      } else if (lower.includes('receive payment') || lower.includes('customer payment')) {
        detected = 'receive-payment';
      } else if (lower.includes('pay bill') || lower.includes('bill payment')) {
        detected = 'pay-bill';
      } else if (lower.includes('inventory') || lower.includes('stock') || lower.includes('adjust')) {
        detected = 'inventory-adjustment';
      } else if (lower.includes('send email') || (lower.includes('email ') && !lower.startsWith('add '))) {
        detected = 'send-email';
      } else if (lower.startsWith('add customer') || lower.includes('new customer') || lower.includes('create customer')) {
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

      const qtyMatch =
        text.match(/(?:with|qty|quantity|quantities|sell|transfer|pay|receive|journal|expense)\s+(\d+(?:\.\d+)?)\b/i) ||
        text.match(/\b(\d+(?:\.\d+)?)\s+(?:quantities|quantity|qty|pcs|units|pieces|bottles|packs|%)\b/i) ||
        text.match(/\b(\d+(?:\.\d+)?)\b/);
      if (qtyMatch) {
        const val = Number(qtyMatch[1]);
        setQuantity(val);
        if (detected === 'add-tax-rate') setTaxRateValue(val);
        if (detected === 'receive-payment' || detected === 'pay-bill' || detected === 'create-journal' || detected === 'create-expense') {
          setUnitPrice(val);
        }
      }

      const priceMatch = text.match(/(?:at|@|price|for)\s+(\d+(?:\.\d+)?)\b/i);
      if (priceMatch && (detected === 'add-item' || detected === 'create-expense' || detected === 'create-invoice' || detected === 'create-receipt' || detected === 'create-estimate' || detected === 'create-bill')) {
        setUnitPrice(Number(priceMatch[1]));
      }

      const costMatch = text.match(/cost\s+(\d+(?:\.\d+)?)/i);
      if (costMatch) setCostPrice(Number(costMatch[1]));

      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) setEntityEmail(emailMatch[0]);

      const phoneMatch = text.match(/(?:phone|tel|mobile)\s+([+\d\-\s]{7,18})/i);
      if (phoneMatch) setEntityPhone(phoneMatch[1].trim());

      if (detected === 'inventory-adjustment') {
        const dec = lower.includes('decrease') || lower.includes('reduce') || lower.includes('remove') || lower.includes('deduct');
        setAdjustmentType(dec ? 'decrement' : 'increment');
        const fromMatch = text.match(/from\s+([a-zA-Z0-9\s.&'-]+?)(?:\s+vendor|\s+on|\s*$)/i);
        const vendorLabel = matchedVendor ? matchedVendor.displayName : fromMatch ? fromMatch[1].trim() : '';
        setReasonOrDesc(vendorLabel ? `Stock update from vendor: ${vendorLabel}` : 'Automated inventory stock update');
      }

      if (detected === 'add-customer' || detected === 'add-vendor' || detected === 'add-item' || detected === 'add-category' || detected === 'add-warehouse' || detected === 'add-account' || detected === 'add-tax-rate') {
        const nameMatch = text.match(
          /(?:add|create|new)\s+(?:customer|vendor|product|item|category|warehouse|account|tax rate)\s+([a-zA-Z0-9\s.&'-]+?)(?=\s+(?:email|phone|price|cost|inventory|service|type|\d|$))/i,
        );
        if (nameMatch) setEntityName(nameMatch[1].trim());
        if (detected === 'add-item') setNewItemType(lower.includes('service') ? 'service' : 'inventory');
        const typeMatch = text.match(/type\s+([a-zA-Z0-9_-]+)/i);
        if (typeMatch && detected === 'add-account') setNewAccountType(typeMatch[1].toLowerCase());
      }

      if (detected === 'update-settings') {
        const keyMatch = text.match(/key\s+([a-zA-Z0-9_.-]+)/i);
        const valMatch = text.match(/value\s+([^\s]+(?:\s+[^\s]+)*?)(?=\s+group|\s*$)/i);
        const grpMatch = text.match(/group\s+([a-zA-Z0-9_.-]+)/i);
        if (keyMatch) setSettingKey(keyMatch[1].trim());
        if (valMatch) setSettingValue(valMatch[1].trim());
        if (grpMatch) setSettingGroup(grpMatch[1].trim());
      }

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
        const msg = `Updated stock (${adjustmentType} ${quantity}) for "${selectedItem?.name}"`;
        appendLog({ action: 'Update Inventory Stock', summary: msg, status: 'success', route: '/inventory-adjustments' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-receipt') {
        if (!selectedItemId || !selectedCustomerId) throw new Error('Select both a customer and a product.');
        const depAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
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
      } else if (activePreset === 'receive-payment') {
        const depAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
        const amt = unitPrice || quantity || 0;
        if (!selectedCustomerId || amt <= 0) throw new Error('Select customer and enter payment amount.');
        await axios.post(
          '/api/payments-received',
          {
            customer_id: selectedCustomerId,
            payment_date: actionDate,
            deposit_account_id: depAcc?.id,
            amount: amt,
            entries: selectedInvoiceId ? [{ invoice_id: selectedInvoiceId, payment_amount: amt }] : [],
          },
          { headers },
        );
        const msg = `Recorded payment received of ${amt} from "${selectedCust?.displayName}"`;
        appendLog({ action: 'Receive Payment', summary: msg, status: 'success', route: '/payment-receives' });
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
      } else if (activePreset === 'add-category') {
        if (!entityName.trim()) throw new Error('Enter a category name.');
        await axios.post('/api/item-categories', { name: entityName.trim() }, { headers });
        const msg = `Created product category "${entityName.trim()}"`;
        appendLog({ action: 'Add Category', summary: msg, status: 'success', route: '/items-categories' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-warehouse') {
        if (!entityName.trim()) throw new Error('Enter a warehouse name.');
        await axios.post(
          '/api/warehouses',
          { name: entityName.trim(), code: entityName.trim().slice(0, 6).toUpperCase().replace(/\s+/g, '') },
          { headers },
        );
        const msg = `Created warehouse "${entityName.trim()}"`;
        appendLog({ action: 'Create Warehouse', summary: msg, status: 'success', route: '/warehouses' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'warehouse-transfer') {
        if (!fromWarehouseId || !toWarehouseId || !selectedItemId) throw new Error('Select warehouses and product.');
        await axios.post(
          '/api/warehouse-transfers',
          {
            date: actionDate,
            from_warehouse_id: fromWarehouseId,
            to_warehouse_id: toWarehouseId,
            entries: [{ index: 1, item_id: selectedItemId, quantity }],
          },
          { headers },
        );
        const msg = `Transferred ${quantity} x "${selectedItem?.name}" between warehouses`;
        appendLog({ action: 'Warehouse Transfer', summary: msg, status: 'success', route: '/warehouses-transfers' });
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
      } else if (activePreset === 'pay-bill') {
        const payAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
        const amt = unitPrice || quantity || 0;
        if (!selectedVendorId || amt <= 0) throw new Error('Select vendor and enter payment amount.');
        await axios.post(
          '/api/bill-payments',
          {
            vendor_id: selectedVendorId,
            payment_date: actionDate,
            payment_account_id: payAcc?.id,
            amount: amt,
            entries: selectedBillId ? [{ bill_id: selectedBillId, payment_amount: amt }] : [],
          },
          { headers },
        );
        const msg = `Paid vendor "${selectedVend?.displayName}" amount ${amt}`;
        appendLog({ action: 'Pay Vendor Bill', summary: msg, status: 'success', route: '/payment-mades' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-account') {
        if (!entityName.trim()) throw new Error('Enter an account name.');
        await axios.post(
          '/api/accounts',
          {
            name: entityName.trim(),
            account_type: newAccountType,
            active: true,
          },
          { headers },
        );
        const msg = `Created ${newAccountType} account "${entityName.trim()}"`;
        appendLog({ action: 'Add Account', summary: msg, status: 'success', route: '/accounts' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'create-journal') {
        const debitAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
        const creditAcc = accounts.find((a) => a.id === selectedExpenseAccountId && a.id !== debitAcc?.id) || accounts[1] || accounts[0];
        const amt = unitPrice || quantity || 0;
        if (!debitAcc || !creditAcc || amt <= 0) throw new Error('Select debit/credit accounts and positive amount.');
        await axios.post(
          '/api/manual-journals',
          {
            date: actionDate,
            publish: true,
            description: reasonOrDesc || commandText,
            entries: [
              { index: 1, account_id: debitAcc.id, debit: amt, credit: 0 },
              { index: 2, account_id: creditAcc.id, debit: 0, credit: amt },
            ],
          },
          { headers },
        );
        const msg = `Posted manual journal entry of ${amt} (${debitAcc.name} → ${creditAcc.name})`;
        appendLog({ action: 'Create Manual Journal', summary: msg, status: 'success', route: '/manual-journals' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'add-tax-rate') {
        if (!entityName.trim()) throw new Error('Enter a tax rate name.');
        await axios.post(
          '/api/tax-rates',
          {
            name: entityName.trim(),
            code: entityName.trim().slice(0, 6).toUpperCase().replace(/\s+/g, ''),
            rate: taxRateValue,
            active: true,
          },
          { headers },
        );
        const msg = `Added tax rate "${entityName.trim()}" (${taxRateValue}%)`;
        appendLog({ action: 'Add Tax Rate', summary: msg, status: 'success', route: '/preferences/tax-rates' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      } else if (activePreset === 'update-settings') {
        if (!settingKey.trim() || !settingGroup.trim()) throw new Error('Specify setting group and key.');
        await axios.put(
          '/api/settings',
          {
            options: [{ group: settingGroup.trim(), key: settingKey.trim(), value: settingValue }],
          },
          { headers },
        );
        const msg = `Updated setting ${settingGroup}.${settingKey} = "${settingValue}"`;
        appendLog({ action: 'Update Settings', summary: msg, status: 'success', route: '/preferences/general' });
        AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      }

      await fetchEntities();
    } catch (err: any) {
      const raw =
        err?.response?.data?.errors?.[0]?.message ??
        err?.response?.data?.message ??
        err?.message ??
        'Automation failed.';
      const formatErr = (val: any): string => {
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) {
          return val
            .map((item) => {
              if (typeof item === 'string') return item;
              if (item?.constraints) return Object.values(item.constraints).join(', ');
              if (item?.message) return String(item.message);
              return JSON.stringify(item);
            })
            .filter(Boolean)
            .join('; ');
        }
        if (val && typeof val === 'object') {
          if (val.constraints) return Object.values(val.constraints).join(', ');
          if (val.message) return formatErr(val.message);
          return JSON.stringify(val);
        }
        return String(val || 'Automation failed.');
      };
      const msg = formatErr(raw) || 'Automation failed.';
      appendLog({ action: activePreset, summary: msg, status: 'error' });
      AppToaster.show({ intent: Intent.DANGER, message: msg });
    } finally {
      setExecuting(false);
    }
  };

  const visiblePresets =
    categoryFilter === 'All'
      ? PRESETS
      : PRESETS.filter((p) => p.category === categoryFilter);

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
            Type a command in plain English or pick any preset across Sales, Inventory, Accounting, and Settings.
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
          <Button icon="refresh" text="Parse Command" onClick={() => parseCommand(commandText)} />
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

      {/* Category Filter & Presets Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h4 style={{ margin: 0 }}>Presets ({visiblePresets.length})</h4>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['All', 'Sales', 'Inventory & Purchases', 'Accounting & Banking', 'Contacts & Settings'] as PresetCategory[]).map(
            (cat) => (
              <Button
                key={cat}
                small
                intent={categoryFilter === cat ? Intent.PRIMARY : Intent.NONE}
                minimal={categoryFilter !== cat}
                text={cat}
                onClick={() => setCategoryFilter(cat)}
              />
            ),
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {visiblePresets.map((p) => {
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
            activePreset === 'create-bill' ||
            activePreset === 'warehouse-transfer') && (
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
            activePreset === 'create-estimate' ||
            activePreset === 'receive-payment') && (
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

          {(activePreset === 'create-bill' || activePreset === 'pay-bill') && (
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

          {activePreset === 'receive-payment' && (
            <FormGroup label="Apply to Invoice (Optional)">
              <HTMLSelect
                fill
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
              >
                <option value={0}>-- Unapplied / Account Payment --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {activePreset === 'pay-bill' && (
            <FormGroup label="Apply to Bill (Optional)">
              <HTMLSelect
                fill
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(Number(e.target.value))}
              >
                <option value={0}>-- Unapplied Vendor Payment --</option>
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.number}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {activePreset === 'warehouse-transfer' && (
            <>
              <FormGroup label="From Warehouse">
                <HTMLSelect
                  fill
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(Number(e.target.value))}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="To Warehouse">
                <HTMLSelect
                  fill
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value))}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </HTMLSelect>
              </FormGroup>
            </>
          )}

          {(activePreset === 'create-receipt' ||
            activePreset === 'receive-payment' ||
            activePreset === 'create-expense' ||
            activePreset === 'pay-bill' ||
            activePreset === 'create-journal') && (
            <FormGroup label={activePreset === 'create-journal' ? 'Debit Account' : 'Deposit / Payment Account'}>
              <HTMLSelect
                fill
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.accountType})
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {(activePreset === 'create-expense' || activePreset === 'create-journal') && (
            <FormGroup label={activePreset === 'create-journal' ? 'Credit Account' : 'Expense Category Account'}>
              <HTMLSelect
                fill
                value={selectedExpenseAccountId}
                onChange={(e) => setSelectedExpenseAccountId(Number(e.target.value))}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.accountType})
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}

          {(activePreset === 'inventory-adjustment' ||
            activePreset === 'create-receipt' ||
            activePreset === 'create-invoice' ||
            activePreset === 'create-estimate' ||
            activePreset === 'create-bill' ||
            activePreset === 'warehouse-transfer') && (
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
            activePreset === 'receive-payment' ||
            activePreset === 'pay-bill' ||
            activePreset === 'add-item' ||
            activePreset === 'create-expense' ||
            activePreset === 'create-journal') && (
            <FormGroup
              label={
                activePreset === 'create-expense' ||
                activePreset === 'receive-payment' ||
                activePreset === 'pay-bill' ||
                activePreset === 'create-journal'
                  ? 'Amount'
                  : 'Unit Sell Price'
              }
            >
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
            activePreset === 'add-item' ||
            activePreset === 'add-category' ||
            activePreset === 'add-warehouse' ||
            activePreset === 'add-account' ||
            activePreset === 'add-tax-rate') && (
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

          {activePreset === 'add-account' && (
            <FormGroup label="Account Type">
              <HTMLSelect
                fill
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="other-current-asset">Other Current Asset</option>
                <option value="other-current-liability">Other Current Liability</option>
                <option value="equity">Equity</option>
              </HTMLSelect>
            </FormGroup>
          )}

          {activePreset === 'add-tax-rate' && (
            <FormGroup label="Tax Rate (%)">
              <NumericInput
                fill
                min={0}
                value={taxRateValue}
                onValueChange={(val) => setTaxRateValue(val || 0)}
              />
            </FormGroup>
          )}

          {activePreset === 'update-settings' && (
            <>
              <FormGroup label="Settings Group">
                <HTMLSelect
                  fill
                  value={settingGroup}
                  onChange={(e) => setSettingGroup(e.target.value)}
                >
                  <option value="sales_invoices">Sales Invoices (sales_invoices)</option>
                  <option value="sale_receipts">Sale Receipts (sale_receipts)</option>
                  <option value="sale_estimates">Sale Estimates (sale_estimates)</option>
                  <option value="organization">Organization (organization)</option>
                  <option value="items">Items / Inventory (items)</option>
                </HTMLSelect>
              </FormGroup>
              <FormGroup label="Setting Key">
                <InputGroup
                  fill
                  value={settingKey}
                  onChange={(e) => setSettingKey(e.target.value)}
                  placeholder="e.g. next_number, number_prefix, default_note"
                />
              </FormGroup>
              <FormGroup label="Setting Value">
                <InputGroup
                  fill
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  placeholder="New value..."
                />
              </FormGroup>
            </>
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
            activePreset === 'receive-payment' ||
            activePreset === 'create-expense' ||
            activePreset === 'create-bill' ||
            activePreset === 'pay-bill' ||
            activePreset === 'warehouse-transfer' ||
            activePreset === 'create-journal') && (
            <FormGroup label="Date">
              <InputGroup
                fill
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
              />
            </FormGroup>
          )}

          {(activePreset === 'inventory-adjustment' ||
            activePreset === 'create-expense' ||
            activePreset === 'create-journal') && (
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
            No automations executed yet in this session. Select any of the 19 presets or type a command above and click{' '}
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
