import React, { useMemo } from 'react';
import { FinancialReportBody } from '../FinancialReportPage';
import { useProfitLossSheetContext } from './ProfitLossProvider';
import { ProfitLossSheetTable } from './ProfitLossSheetTable';
import { FinancialSheetSkeleton } from '@/components';
import { BarChartCard, DonutChartCard } from '@/components/Charts/FinancialCharts';
import { extractProfitLossChartData } from '@/components/Charts/extractReportChartData';
import { useCurrentOrganizationBaseCurrency, useCurrentOrganizationName } from '@/hooks/query';

function ProfitLossBodyJSX() {
  const organizationName = useCurrentOrganizationName();
  const currencyCode = useCurrentOrganizationBaseCurrency() || '';
  const { isLoading, profitLossSheet } = useProfitLossSheetContext();

  const chartData = useMemo(
    () =>
      extractProfitLossChartData(
        profitLossSheet?.table?.rows ?? [],
        profitLossSheet?.table?.columns ?? [],
      ),
    [profitLossSheet],
  );

  // Shows the skeleton only on the initial load. Refetches (e.g. sorting)
  // keep the current report rendered while the request is in flight.
  const isInitialLoading = isLoading && !profitLossSheet;

  return (
    <FinancialReportBody>
      {isInitialLoading ? (
        <FinancialSheetSkeleton />
      ) : (
        <>
          {(chartData.totalIncome > 0 || chartData.totalExpenses > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <BarChartCard
                title="Profit & Loss Summary"
                subtitle={profitLossSheet?.meta?.formattedDateRange}
                data={chartData.summaryBars}
                primaryLabel="Amount"
                currencyCode={currencyCode}
                height={190}
              />
              <DonutChartCard
                title="Expense Breakdown"
                subtitle="Top operating expense categories"
                data={chartData.expenseBreakdown}
                currencyCode={currencyCode}
                centerLabel="Expenses"
              />
            </div>
          )}
          <ProfitLossSheetTable companyName={organizationName} />
        </>
      )}
    </FinancialReportBody>
  );
}

export const ProfitLossBody = ProfitLossBodyJSX;
