import { Button, Intent, Spinner } from '@blueprintjs/core';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  BarChartCard,
  DonutChartCard,
  HorizontalBarListCard,
  KpiMetricCard,
  formatCompactCurrency,
} from '@/components/Charts/FinancialCharts';
import {
  extractBalanceSheetChartData,
  extractProfitLossChartData,
} from '@/components/Charts/extractReportChartData';
import {
  useBalanceSheet,
  useCurrentOrganization,
  useProfitLossSheet,
  useSalesByItems,
} from '@/hooks/query';

export function HomepageInsights() {
  const history = useHistory();
  const { data: org } = useCurrentOrganization();
  const currencyCode = (org as any)?.baseCurrency || '';

  const { data: profitLoss, isLoading: plLoading } = useProfitLossSheet({});
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet({});
  const { data: salesByItems } = useSalesByItems({});

  const plData = useMemo(
    () => extractProfitLossChartData(profitLoss?.table?.rows ?? []),
    [profitLoss],
  );

  const bsData = useMemo(
    () => extractBalanceSheetChartData(balanceSheet?.table?.rows ?? []),
    [balanceSheet],
  );

  const topSellingItems = useMemo(() => {
    const rawItems: any[] =
      (salesByItems as any)?.items ||
      (salesByItems as any)?.data ||
      (Array.isArray(salesByItems) ? salesByItems : []);

    return rawItems
      .map((item: any) => ({
        label: item.name || item.itemName || 'Item',
        value: Number(
          item.amount ?? item.total ?? item.totalAmount ?? item.quantitySold ?? 0,
        ),
      }))
      .filter((d) => d.value > 0)
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
        </>
      )}
    </div>
  );
}
