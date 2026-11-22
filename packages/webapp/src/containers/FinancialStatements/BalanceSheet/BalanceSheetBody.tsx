import React, { useMemo } from 'react';
import { FinancialReportBody } from '../FinancialReportPage';
import { useBalanceSheetContext } from './BalanceSheetProvider';
import { BalanceSheetTable } from './BalanceSheetTable';
import { FinancialSheetSkeleton } from '@/components';
import {
  BarChartCard,
  HorizontalBarListCard,
} from '@/components/Charts/FinancialCharts';
import { extractBalanceSheetChartData } from '@/components/Charts/extractReportChartData';
import { useCurrentOrganizationBaseCurrency, useCurrentOrganizationName } from '@/hooks/query';

function BalanceSheetBodyJSX() {
  const organizationName = useCurrentOrganizationName();
  const currencyCode = useCurrentOrganizationBaseCurrency() || '';
  const { isLoading, balanceSheet } = useBalanceSheetContext();

  const chartData = useMemo(
    () =>
      extractBalanceSheetChartData(
        balanceSheet?.table?.rows ?? [],
        balanceSheet?.table?.columns ?? [],
      ),
    [balanceSheet],
  );

  // Shows the skeleton only on the initial load. Refetches (e.g. sorting)
  // keep the current report rendered while the request is in flight.
  const isInitialLoading = isLoading && !balanceSheet;

  return (
    <FinancialReportBody>
      {isInitialLoading ? (
        <FinancialSheetSkeleton />
      ) : (
        <>
          {chartData.mixData.some((d) => Math.abs(d.value) > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <BarChartCard
                title="Balance Sheet Position (Assets = Liabilities + Equity)"
                subtitle={
                  balanceSheet?.meta?.formattedDateRange ??
                  balanceSheet?.meta?.formattedAsDate
                }
                data={chartData.mixData}
                primaryLabel="Balance"
                currencyCode={currencyCode}
                height={190}
              />
              <HorizontalBarListCard
                title="Asset Distribution"
                subtitle="Major asset groups"
                data={chartData.topAssets}
                currencyCode={currencyCode}
              />
            </div>
          )}
          <BalanceSheetTable companyName={organizationName} />
        </>
      )}
    </FinancialReportBody>
  );
}

export const BalanceSheetBody = BalanceSheetBodyJSX;
