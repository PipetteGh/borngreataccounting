import React, { useMemo } from 'react';
import { FinancialReportBody } from '../FinancialReportPage';
import { useCashFlowStatementContext } from './CashFlowStatementProvider';
import { CashFlowStatementTable } from './CashFlowStatementTable';
import { BarChartCard } from '@/components/Charts/FinancialCharts';
import { extractCashFlowChartData } from '@/components/Charts/extractReportChartData';
import { FinancialSheetSkeleton } from '@/components/FinancialSheet';
import { useCurrentOrganizationBaseCurrency, useCurrentOrganizationName } from '@/hooks/query';

function CashFlowStatementBodyJSX() {
  const organizationName = useCurrentOrganizationName();
  const currencyCode = useCurrentOrganizationBaseCurrency() || '';
  const { isCashFlowLoading, cashFlowStatement } = useCashFlowStatementContext();

  const chartData = useMemo(
    () =>
      extractCashFlowChartData(
        cashFlowStatement?.table?.rows ?? [],
        cashFlowStatement?.table?.columns ?? [],
      ),
    [cashFlowStatement],
  );

  return (
    <FinancialReportBody>
      {isCashFlowLoading ? (
        <FinancialSheetSkeleton />
      ) : (
        <>
          {chartData.bars.some((b) => Math.abs(b.value) > 0) && (
            <div style={{ marginBottom: 16 }}>
              <BarChartCard
                title="Cash Flow Activities"
                subtitle={cashFlowStatement?.meta?.formattedDateRange}
                data={chartData.bars}
                primaryLabel="Cash Flow"
                currencyCode={currencyCode}
                height={190}
              />
            </div>
          )}
          <CashFlowStatementTable companyName={organizationName} />
        </>
      )}
    </FinancialReportBody>
  );
}

export const CashFlowStatementBody = CashFlowStatementBodyJSX;
