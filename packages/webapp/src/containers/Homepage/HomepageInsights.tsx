import {
  Button,
  Card,
  FormGroup,
  Icon,
  Intent,
  NumericInput,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  BarChartCard,
  DonutChartCard,
  HorizontalBarListCard,
  KpiMetricCard,
  formatCompactCurrency,
  formatExactCurrency,
} from '@/components/Charts/FinancialCharts';
import {
  extractBalanceSheetChartData,
  extractProfitLossChartData,
} from '@/components/Charts/extractReportChartData';
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

function HomepageInsightsInner() {
  const history = useHistory();
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();
  const currencyCode = useCurrentOrganizationBaseCurrency() || '';

  const { data: profitLoss, isLoading: plLoading } = useProfitLossSheet({});
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet({});
  const { data: salesByItems } = useSalesByItems({});

  const [openReceivables, setOpenReceivables] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [openPayables, setOpenPayables] = useState(0);
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
      axios.get('/api/sale-invoices?page=1&page_size=50', { headers }),
      axios.get('/api/bills?page=1&page_size=50', { headers }),
      axios.get('/api/items?page=1&page_size=150', { headers }),
    ]).then(([invRes, billRes, itemRes]) => {
      if (!active) return;
      if (invRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(invRes.value.data);
        const list = Array.isArray(raw?.salesInvoices) ? raw.salesInvoices : [];
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
        const list = Array.isArray(raw?.bills) ? raw.bills : [];
        const apTotal = list.reduce(
          (sum: number, b: any) => sum + Math.max(0, Number(b.dueAmount ?? b.balance ?? 0)),
          0,
        );
        setOpenPayables(apTotal);
      }
      if (itemRes.status === 'fulfilled') {
        const raw: any = transformToCamelCase(itemRes.value.data);
        const list = Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
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
    });
    return () => {
      active = false;
    };
  }, [token, organizationId]);

  const plData = useMemo(
    () => extractProfitLossChartData(profitLoss?.table?.rows ?? []),
    [profitLoss],
  );

  const bsData = useMemo(
    () => extractBalanceSheetChartData(balanceSheet?.table?.rows ?? []),
    [balanceSheet],
  );

  const topSellingItems = useMemo(() => {
    const sbi: any = salesByItems;
    const rawItems: any[] = Array.isArray(sbi?.items)
      ? sbi.items
      : Array.isArray(sbi?.data)
        ? sbi.data
        : Array.isArray(sbi?.data?.items)
          ? sbi.data.items
          : Array.isArray(sbi)
            ? sbi
            : [];

    return rawItems
      .map((item: any) => ({
        label: String(item?.name || item?.itemName || 'Item'),
        value: Number(
          item?.amount ?? item?.total ?? item?.totalAmount ?? item?.quantitySold ?? 0,
        ) || 0,
      }))
      .filter((d) => Number.isFinite(d.value) && d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [salesByItems]);

  const profitMargin =
    plData.totalIncome > 0
      ? ((plData.netIncome / plData.totalIncome) * 100).toFixed(1)
      : '0.0';

  const isLoading = plLoading || bsLoading;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Quick Actions Bar */}
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Financial Overview &amp; Analytics
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Real-time performance metrics, profit summary, and top products
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
          {/* KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <KpiMetricCard
              title="Total Income"
              value={formatCompactCurrency(plData.totalIncome, currencyCode)}
              subtitle="Accrual revenue"
              icon="trending-up"
              accentColor="#10B981"
            />
            <KpiMetricCard
              title="Total Expenses"
              value={formatCompactCurrency(plData.totalExpenses, currencyCode)}
              subtitle={`COGS: ${formatCompactCurrency(plData.totalCogs, currencyCode)}`}
              icon="trending-down"
              accentColor="#EF4444"
            />
            <KpiMetricCard
              title="Net Profit"
              value={formatCompactCurrency(plData.netIncome, currencyCode)}
              subtitle="After expenses"
              icon="dollar"
              accentColor={plData.netIncome >= 0 ? '#1E5EFF' : '#DC2626'}
              badgeText={`${profitMargin}% margin`}
              badgeIntent={
                plData.netIncome >= 0 ? Intent.SUCCESS : Intent.DANGER
              }
            />
            <KpiMetricCard
              title="Total Assets"
              value={formatCompactCurrency(bsData.totalAssets, currencyCode)}
              subtitle={`Equity: ${formatCompactCurrency(bsData.totalEquity, currencyCode)}`}
              icon="bank-account"
              accentColor="#8B5CF6"
            />
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
              title="Revenue, Expenses & Net Profit"
              subtitle="Live summary from Profit & Loss"
              data={plData.summaryBars}
              primaryLabel="Amount"
              currencyCode={currencyCode}
              height={210}
            />
            <DonutChartCard
              title="Balance Sheet Mix"
              subtitle="Assets vs Liabilities vs Equity"
              data={bsData.mixData}
              currencyCode={currencyCode}
              centerLabel="Total"
            />
            <HorizontalBarListCard
              title="Top Selling Products"
              subtitle="By sales revenue"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Financial Health &amp; Ratios
                </h4>
                <Icon icon="pulse" color="#1E5EFF" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Gross Margin</span>
                  <strong>
                    {plData.totalIncome > 0
                      ? `${(((plData.totalIncome - plData.totalCogs) / plData.totalIncome) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Net Profit Margin</span>
                  <strong>{profitMargin}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Open Receivables (AR)</span>
                  <strong>
                    {formatExactCurrency(openReceivables, currencyCode)}{' '}
                    {overdueCount > 0 && (
                      <Tag minimal intent={Intent.DANGER} style={{ marginLeft: 4 }}>
                        {overdueCount} overdue
                      </Tag>
                    )}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Open Payables (AP)</span>
                  <strong>{formatExactCurrency(openPayables, currencyCode)}</strong>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
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
                        intent={it.quantityOnHand <= 0 ? Intent.DANGER : Intent.WARNING}
                      >
                        {it.quantityOnHand} left
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
                  Quick Margin &amp; Tax Calculator
                </h4>
                <Icon icon="calculator" color="#10B981" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <FormGroup label="Cost" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcCost}
                    onValueChange={(v) => setCalcCost(Number.isFinite(v) ? v : 0)}
                  />
                </FormGroup>
                <FormGroup label="Sell Price" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcPrice}
                    onValueChange={(v) => setCalcPrice(Number.isFinite(v) ? v : 0)}
                  />
                </FormGroup>
                <FormGroup label="Tax %" style={{ marginBottom: 6 }}>
                  <NumericInput
                    fill
                    small
                    buttonPosition="none"
                    value={calcTaxPct}
                    onValueChange={(v) => setCalcTaxPct(Number.isFinite(v) ? v : 0)}
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
