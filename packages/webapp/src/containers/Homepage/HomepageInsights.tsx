import {
  Button,
  ButtonGroup,
  Card,
  FormGroup,
  Icon,
  Intent,
  NumericInput,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import axios from 'axios';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  BarChartCard,
  HorizontalBarListCard,
  KpiMetricCard,
  formatCompactCurrency,
  formatExactCurrency,
} from '@/components/Charts/FinancialCharts';
import {
  extractBalanceSheetChartData,
  extractProfitLossChartData,
  parseNumericCell,
} from '@/components/Charts/extractReportChartData';
import { transformFilterFormToQuery } from '@/containers/FinancialStatements/common';
import { getDefaultBalanceSheetQuery } from '@/containers/FinancialStatements/BalanceSheet/utils';
import { getDefaultProfitLossQuery } from '@/containers/FinancialStatements/ProfitLossSheet/utils';
import {
  useBalanceSheet,
  useCurrentOrganizationBaseCurrency,
  useProfitLossSheet,
  useSalesByItems,
} from '@/hooks/query';
import { useAuthOrganizationId, useAuthToken } from '@/hooks/state';
import { transformToCamelCase } from '@/utils';

class InsightsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[HomepageInsights] Render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function extractListFromResponse(raw: any, namedKey?: string): any[] {
  if (Array.isArray(raw)) return raw;
  if (namedKey && Array.isArray(raw?.[namedKey])) return raw[namedKey];
  if (Array.isArray(raw?.data)) return raw.data;
  if (namedKey && Array.isArray(raw?.data?.[namedKey])) {
    return raw.data[namedKey];
  }
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function HomepageInsightsInner() {
  const history = useHistory();
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();
  const currencyCode = useCurrentOrganizationBaseCurrency() || '';

  // Match the default accounting basis ('cash') and YTD date range used by
  // Profit & Loss (/financial-reports/profit-loss) and Balance Sheet (/financial-reports/balance-sheet),
  // while allowing the user to toggle Cash vs Accrual directly on the dashboard.
  const [basis, setBasis] = useState<'cash' | 'accrual'>('cash');

  const plHttpQuery = useMemo(
    () =>
      transformFilterFormToQuery({
        ...getDefaultProfitLossQuery(),
        basis,
      }) as any,
    [basis],
  );

  const bsHttpQuery = useMemo(
    () =>
      transformFilterFormToQuery({
        ...getDefaultBalanceSheetQuery(),
        basis,
      }) as any,
    [basis],
  );

  const salesByItemsQuery = useMemo(
    () =>
      ({
        from_date: moment().startOf('year').format('YYYY-MM-DD'),
        to_date: moment().format('YYYY-MM-DD'),
        none_transactions: true,
      }) as any,
    [],
  );

  const { data: profitLoss, isLoading: plLoading } =
    useProfitLossSheet(plHttpQuery);
  const { data: balanceSheet, isLoading: bsLoading } =
    useBalanceSheet(bsHttpQuery);
  const { data: salesByItems } = useSalesByItems(salesByItemsQuery);

  const [openReceivables, setOpenReceivables] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [openPayables, setOpenPayables] = useState(0);
  const [entityCounts, setEntityCounts] = useState({
    items: 0,
    inventoryItems: 0,
    serviceItems: 0,
    customers: 0,
    vendors: 0,
    invoices: 0,
    bills: 0,
    accounts: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<
    Array<{ id: number; name: string; quantityOnHand: number }>
  >([]);

  // Quick Margin & Tax Calculator state
  const [calcCost, setCalcCost] = useState<number>(100);
  const [calcPrice, setCalcPrice] = useState<number>(150);
  const [calcTaxPct, setCalcTaxPct] = useState<number>(15);

  useEffect(() => {
    if (!token || !organizationId) return;
    let active = true;
    const headers = {
      Authorization: `Bearer ${token}`,
      'organization-id': organizationId,
    };
    Promise.allSettled([
      axios.get('/api/sale-invoices?page=1&page_size=200', { headers }),
      axios.get('/api/bills?page=1&page_size=200', { headers }),
      axios.get('/api/items?page=1&page_size=2000', { headers }),
      axios.get('/api/customers?page=1&page_size=1', { headers }),
      axios.get('/api/vendors?page=1&page_size=1', { headers }),
      axios.get('/api/accounts', { headers }),
    ]).then(([invRes, billRes, itemRes, custRes, vendRes, accRes]) => {
      if (!active) return;
      let totalInvoices = 0;
      let totalBills = 0;
      let totalItems = 0;
      let totalInventoryItems = 0;
      let totalServiceItems = 0;
      let totalCustomers = 0;
      let totalVendors = 0;
      let totalAccounts = 0;

      if (invRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(invRes.value.data);
        const list = extractListFromResponse(raw, 'salesInvoices');
        totalInvoices =
          Number(
            raw?.pagination?.total ??
              raw?.filterMeta?.pagination?.total ??
              list.length,
          ) || list.length;
        let arTotal = 0;
        let overdue = 0;
        const today = new Date().toISOString().slice(0, 10);
        for (const inv of list) {
          const due = Number(inv.dueAmount ?? inv.balance ?? 0);
          if (due > 0) {
            arTotal += due;
            if (inv.dueDate && String(inv.dueDate).slice(0, 10) < today) {
              overdue++;
            }
          }
        }
        setOpenReceivables(arTotal);
        setOverdueCount(overdue);
      }

      if (billRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(billRes.value.data);
        const list = extractListFromResponse(raw, 'bills');
        totalBills =
          Number(
            raw?.pagination?.total ??
              raw?.filterMeta?.pagination?.total ??
              list.length,
          ) || list.length;
        const apTotal = list.reduce(
          (sum: number, b: any) =>
            sum + Math.max(0, Number(b.dueAmount ?? b.balance ?? 0)),
          0,
        );
        setOpenPayables(apTotal);
      }

      if (itemRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(itemRes.value.data);
        const list = extractListFromResponse(raw, 'items');
        totalItems =
          Number(
            raw?.pagination?.total ??
              raw?.filterMeta?.pagination?.total ??
              list.length,
          ) || list.length;
        totalInventoryItems = list.filter(
          (it: any) => it.type === 'inventory',
        ).length;
        totalServiceItems = list.filter(
          (it: any) => it.type !== 'inventory',
        ).length;
        const low = list
          .filter(
            (it: any) =>
              it.type === 'inventory' &&
              it.active !== false &&
              Number(it.quantityOnHand ?? 0) <= 5,
          )
          .sort(
            (a: any, b: any) =>
              Number(a.quantityOnHand ?? 0) - Number(b.quantityOnHand ?? 0),
          )
          .slice(0, 5)
          .map((it: any) => ({
            id: it.id,
            name: it.name,
            quantityOnHand: Number(it.quantityOnHand ?? 0),
          }));
        setLowStockItems(low);
      }

      if (custRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(custRes.value.data);
        const list = extractListFromResponse(raw, 'customers');
        totalCustomers =
          Number(
            raw?.pagination?.total ??
              raw?.filterMeta?.pagination?.total ??
              list.length,
          ) || list.length;
      }

      if (vendRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(vendRes.value.data);
        const list = extractListFromResponse(raw, 'vendors');
        totalVendors =
          Number(
            raw?.pagination?.total ??
              raw?.filterMeta?.pagination?.total ??
              list.length,
          ) || list.length;
      }

      if (accRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(accRes.value.data);
        const list = extractListFromResponse(raw, 'accounts');
        totalAccounts =
          Number(raw?.pagination?.total ?? list.length) || list.length;
      }

      setEntityCounts({
        items: totalItems,
        inventoryItems: totalInventoryItems,
        serviceItems: totalServiceItems,
        customers: totalCustomers,
        vendors: totalVendors,
        invoices: totalInvoices,
        bills: totalBills,
        accounts: totalAccounts,
      });
    });
    return () => {
      active = false;
    };
  }, [token, organizationId]);

  const plData = useMemo(
    () =>
      extractProfitLossChartData(
        profitLoss?.table?.rows ?? [],
        profitLoss?.table?.columns ?? [],
      ),
    [profitLoss],
  );

  const bsData = useMemo(
    () =>
      extractBalanceSheetChartData(
        balanceSheet?.table?.rows ?? [],
        balanceSheet?.table?.columns ?? [],
      ),
    [balanceSheet],
  );

  const topSellingItems = useMemo(() => {
    const sbi: any = salesByItems;
    const rawItems: any[] = Array.isArray(sbi?.data?.items)
      ? sbi.data.items
      : Array.isArray(sbi?.items)
        ? sbi.items
        : Array.isArray(sbi?.data)
          ? sbi.data
          : Array.isArray(sbi)
            ? sbi
            : [];

    return rawItems
      .map((item: any) => {
        const qty = Number(item?.quantitySold ?? item?.quantity ?? 0) || 0;
        // ISalesByItemsItem stores revenue in `soldCost` (and `soldCostFormatted`),
        // while SalesByItemDto stores `{ total: { amount, formattedAmount } }`.
        const revenue =
          typeof item?.soldCost === 'number'
            ? item.soldCost
            : typeof item?.total?.amount === 'number'
              ? item.total.amount
              : item?.soldCostFormatted
                ? parseNumericCell(item.soldCostFormatted)
                : item?.total?.formattedAmount
                  ? parseNumericCell(item.total.formattedAmount)
                  : typeof item?.amount === 'number'
                    ? item.amount
                    : 0;
        const baseName = String(item?.name || item?.itemName || 'Item');
        const label = qty > 0 ? `${baseName} (${qty} sold)` : baseName;
        return {
          label,
          value: Number(revenue) || 0,
        };
      })
      .filter((d) => Number.isFinite(d.value) && d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [salesByItems]);

  const profitMargin =
    plData.totalIncome > 0
      ? ((plData.netIncome / plData.totalIncome) * 100).toFixed(1)
      : '0.0';

  const dateRangeLabel =
    profitLoss?.meta?.formattedDateRange ||
    `${moment().startOf('year').format('YYYY-MM-DD')} – ${moment().format('YYYY-MM-DD')}`;

  const isLoading = plLoading || bsLoading;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header & Quick Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Financial Overview &amp; Analytics
            </h2>
            <ButtonGroup minimal={false}>
              <Button
                small
                active={basis === 'cash'}
                intent={basis === 'cash' ? Intent.PRIMARY : Intent.NONE}
                text="Cash Basis"
                onClick={() => setBasis('cash')}
              />
              <Button
                small
                active={basis === 'accrual'}
                intent={basis === 'accrual' ? Intent.PRIMARY : Intent.NONE}
                text="Accrual Basis"
                onClick={() => setBasis('accrual')}
              />
            </ButtonGroup>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Synchronized with Profit &amp; Loss and Balance Sheet reports ({dateRangeLabel},{' '}
            <strong>{basis === 'cash' ? 'Cash' : 'Accrual'} Basis</strong>)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            intent={Intent.PRIMARY}
            icon="shop"
            text="Open POS"
            onClick={() => history.push('/pos')}
          />
          <Button
            icon="document"
            text="New Invoice"
            onClick={() => history.push('/invoices/new')}
          />
          <Button
            icon="credit-card"
            text="Record Expense"
            onClick={() => history.push('/expenses/new')}
          />
          <Button
            icon="lightning"
            text="Automation"
            onClick={() => history.push('/automation')}
          />
        </div>
      </div>

      {isLoading && !profitLoss && !balanceSheet ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {/* KPI Cards — Exact Exact Currency & Mathematically Reconciled */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <KpiMetricCard
              title="Total Income"
              value={formatExactCurrency(plData.totalIncome, currencyCode)}
              subtitle={`Gross Profit: ${formatExactCurrency(plData.grossProfit, currencyCode)}`}
              icon="trending-up"
              accentColor="#10B981"
            />
            <KpiMetricCard
              title="Total Costs & Expenses"
              value={formatExactCurrency(plData.totalExpenses, currencyCode)}
              subtitle={`COGS: ${formatCompactCurrency(plData.totalCogs, currencyCode)} | OpEx: ${formatCompactCurrency(plData.operatingExpenses + plData.otherExpenses, currencyCode)}`}
              icon="trending-down"
              accentColor="#EF4444"
            />
            <KpiMetricCard
              title="Net Income (Profit)"
              value={formatExactCurrency(plData.netIncome, currencyCode)}
              subtitle="Income minus COGS & Expenses"
              icon="dollar"
              accentColor={plData.netIncome >= 0 ? '#1E5EFF' : '#DC2626'}
              badgeText={`${profitMargin}% margin`}
              badgeIntent={
                plData.netIncome >= 0 ? Intent.SUCCESS : Intent.DANGER
              }
            />
            <KpiMetricCard
              title="Total Assets"
              value={formatExactCurrency(bsData.totalAssets, currencyCode)}
              subtitle={`Liab: ${formatCompactCurrency(bsData.totalLiabilities, currencyCode)} | Equity: ${formatCompactCurrency(bsData.totalEquity, currencyCode)}`}
              icon="bank-account"
              accentColor="#8B5CF6"
            />
          </div>

          {/* Business Entity Statistics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Inventory Items
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.inventoryItems.toLocaleString()}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: '#64748b',
                    marginLeft: 6,
                  }}
                >
                  ({entityCounts.items.toLocaleString()} total)
                </span>
              </div>
            </Card>
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Customers
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.customers.toLocaleString()}
              </div>
            </Card>
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Vendors
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.vendors.toLocaleString()}
              </div>
            </Card>
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Sales Invoices
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.invoices.toLocaleString()}
              </div>
            </Card>
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Vendor Bills
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.bills.toLocaleString()}
              </div>
            </Card>
            <Card style={{ padding: '12px 14px', borderRadius: 8 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Ledger Accounts
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {entityCounts.accounts.toLocaleString()}
              </div>
            </Card>
          </div>

          {/* Visualization Charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <BarChartCard
              title="Profit & Loss Breakdown"
              subtitle={`Income, COGS, Gross Profit, OpEx & Net Income (${basis} basis)`}
              data={plData.summaryBars}
              primaryLabel="Amount"
              currencyCode={currencyCode}
              height={210}
            />
            <BarChartCard
              title="Balance Sheet Position"
              subtitle="Assets = Liabilities + Equity"
              data={bsData.mixData}
              primaryLabel="Balance"
              currencyCode={currencyCode}
              height={210}
            />
            <HorizontalBarListCard
              title="Top Selling Products (YTD)"
              subtitle="By sales revenue from Sales by Items report"
              data={topSellingItems}
              currencyCode={currencyCode}
            />
          </div>

          {/* Financial Health Ratios, Receivables/Payables & Low-Stock Alerts, Quick Calculator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            <Card style={{ padding: 16, borderRadius: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Financial Position &amp; Ratios
                </h4>
                <Icon icon="pulse" color="#1E5EFF" />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Cash &amp; Bank Balance</span>
                  <strong>
                    {formatExactCurrency(bsData.cashBalance, currencyCode)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Inventory Asset Value</span>
                  <strong>
                    {formatExactCurrency(
                      bsData.inventoryAssetValue,
                      currencyCode,
                    )}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Gross Profit Margin</span>
                  <strong>
                    {plData.totalIncome > 0
                      ? `${((plData.grossProfit / plData.totalIncome) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>
                    Accounts Receivable (Unpaid Invoices)
                  </span>
                  <strong>
                    {formatExactCurrency(
                      openReceivables || bsData.accountsReceivable,
                      currencyCode,
                    )}{' '}
                    {overdueCount > 0 && (
                      <Tag
                        minimal
                        intent={Intent.DANGER}
                        style={{ marginLeft: 4 }}
                      >
                        {overdueCount} overdue
                      </Tag>
                    )}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>
                    Accounts Payable (Unpaid Bills)
                  </span>
                  <strong>
                    {formatExactCurrency(
                      openPayables || bsData.currentLiabilities,
                      currencyCode,
                    )}
                  </strong>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 16, borderRadius: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Low-Stock Inventory Alerts
                </h4>
                <Button
                  minimal
                  small
                  intent={Intent.PRIMARY}
                  text="Restock"
                  onClick={() => history.push('/automation')}
                />
              </div>
              {lowStockItems.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: '#10B981' }}>
                  All inventory items are well stocked (&gt; 5 units).
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  {lowStockItems.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{it.name}</span>
                      <Tag
                        minimal
                        intent={
                          it.quantityOnHand <= 0
                            ? Intent.DANGER
                            : Intent.WARNING
                        }
                      >
                        {it.quantityOnHand} left
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ padding: 16, borderRadius: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Quick Margin &amp; Tax Calculator
                </h4>
                <Icon icon="calculator" color="#10B981" />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                }}
              >
                <FormGroup label="Cost" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcCost}
                    onValueChange={(v) =>
                      setCalcCost(Number.isFinite(v) ? v : 0)
                    }
                  />
                </FormGroup>
                <FormGroup label="Sell Price" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcPrice}
                    onValueChange={(v) =>
                      setCalcPrice(Number.isFinite(v) ? v : 0)
                    }
                  />
                </FormGroup>
                <FormGroup label="Tax %" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcTaxPct}
                    onValueChange={(v) =>
                      setCalcTaxPct(Number.isFinite(v) ? v : 0)
                    }
                  />
                </FormGroup>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  paddingTop: 6,
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <span>
                  Margin:{' '}
                  <strong>
                    {calcPrice > 0
                      ? `${(((calcPrice - calcCost) / calcPrice) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </strong>
                </span>
                <span>
                  Tax-Incl:{' '}
                  <strong>
                    {formatExactCurrency(
                      calcPrice * (1 + calcTaxPct / 100),
                      currencyCode,
                    )}
                  </strong>
                </span>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export function HomepageInsights() {
  return (
    <InsightsErrorBoundary>
      <HomepageInsightsInner />
    </InsightsErrorBoundary>
  );
}
