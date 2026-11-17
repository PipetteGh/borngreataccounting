import type { ChartDatum } from './FinancialCharts';

export function parseNumericCell(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return 0;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') return 0;
  const isParenNeg = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[^0-9.-]/g, '');
  if (!cleaned || cleaned === '-') return 0;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return isParenNeg ? -Math.abs(num) : num;
}

export function getRowLabel(row: any): string {
  const firstCell = Array.isArray(row?.cells) ? row.cells[0] : null;
  if (firstCell && firstCell.value !== undefined && firstCell.value !== null) {
    return String(firstCell.value).trim();
  }
  return String(row?.name || '').trim();
}

/**
 * Resolves the "Total" (or primary numeric) cell index from table columns.
 * Handles both single-period (2 columns: name + total) and multi-period
 * comparison tables where "total" is the last column.
 */
export function resolveTotalColumnIndex(columns?: any[], row?: any): number {
  if (Array.isArray(columns) && columns.length > 1) {
    const totalIdx = columns.findIndex(
      (c) =>
        String(c?.key || '').toLowerCase() === 'total' ||
        String(c?.label || '').toLowerCase() === 'total',
    );
    if (totalIdx >= 1) return totalIdx;

    // Fallback: last column that isn't percentage/change
    for (let i = columns.length - 1; i >= 1; i--) {
      const k = String(columns[i]?.key || '').toLowerCase();
      if (!k.includes('percentage') && !k.includes('change')) {
        return i;
      }
    }
    return 1;
  }
  const cellCount = Array.isArray(row?.cells) ? row.cells.length : 2;
  return Math.max(1, cellCount - 1);
}

export function getRowAmount(
  row: any,
  columns?: any[],
  explicitIndex?: number,
): number {
  if (!row || !Array.isArray(row.cells) || row.cells.length < 2) return 0;
  const idx =
    explicitIndex !== undefined
      ? explicitIndex
      : resolveTotalColumnIndex(columns, row);
  const cell = row.cells[idx] ?? row.cells[row.cells.length - 1] ?? row.cells[1];
  return parseNumericCell(cell?.value);
}

function getRowTypes(row: any): string[] {
  return Array.isArray(row?.rowTypes)
    ? row.rowTypes.map((t: any) => String(t).toUpperCase())
    : [];
}

/**
 * Finds the exact row for a schema node ID, prioritizing TOTAL / EQUATION rows
 * over AGGREGATE section header rows (whose cells are blank/hidden when expanded).
 */
export function findRowById(
  rows: any[],
  targetIds: string[],
): any | null {
  if (!Array.isArray(rows)) return null;
  const upperTargets = targetIds.map((id) => id.toUpperCase());

  let totalMatch: any = null;
  let nonAggregateMatch: any = null;
  let fallbackMatch: any = null;

  const walk = (list: any[]) => {
    for (const row of list) {
      const id = String(row?.id || '').toUpperCase();
      const rowTypes = getRowTypes(row);

      if (upperTargets.includes(id)) {
        if (rowTypes.includes('TOTAL')) {
          totalMatch = row;
        } else if (!rowTypes.includes('AGGREGATE') && !nonAggregateMatch) {
          nonAggregateMatch = row;
        } else if (!fallbackMatch) {
          fallbackMatch = row;
        }
      }

      if (Array.isArray(row?.children) && row.children.length > 0) {
        walk(row.children);
      }
    }
  };

  walk(rows);
  return totalMatch || nonAggregateMatch || fallbackMatch;
}

/**
 * Fallback label search that also prioritizes TOTAL rows over AGGREGATE headers.
 */
export function findRowByLabel(rows: any[], patterns: string[]): any | null {
  if (!Array.isArray(rows)) return null;
  const lowerPatterns = patterns.map((p) => p.toLowerCase());

  let totalMatch: any = null;
  let nonAggregateMatch: any = null;

  const walk = (list: any[]) => {
    for (const row of list) {
      const label = getRowLabel(row).toLowerCase();
      const rowTypes = getRowTypes(row);

      if (lowerPatterns.some((p) => label.includes(p))) {
        if (rowTypes.includes('TOTAL')) {
          totalMatch = row;
        } else if (!rowTypes.includes('AGGREGATE') && !nonAggregateMatch) {
          nonAggregateMatch = row;
        }
      }

      if (Array.isArray(row?.children) && row.children.length > 0) {
        walk(row.children);
      }
    }
  };

  walk(rows);
  return totalMatch || nonAggregateMatch;
}

/**
 * Finds the AGGREGATE container row (which holds the `.children` accounts)
 * for a given schema node ID.
 */
export function findSectionContainerById(
  rows: any[],
  targetIds: string[],
): any | null {
  if (!Array.isArray(rows)) return null;
  const upperTargets = targetIds.map((id) => id.toUpperCase());

  for (const row of rows) {
    const id = String(row?.id || '').toUpperCase();
    if (
      upperTargets.includes(id) &&
      Array.isArray(row?.children) &&
      row.children.length > 0
    ) {
      return row;
    }
    if (Array.isArray(row?.children) && row.children.length > 0) {
      const found = findSectionContainerById(row.children, targetIds);
      if (found) return found;
    }
  }
  return null;
}

export function extractAccountChildren(
  sectionRow: any,
  columns?: any[],
  limit = 6,
): ChartDatum[] {
  if (!sectionRow || !Array.isArray(sectionRow.children)) return [];
  const collected: ChartDatum[] = [];

  const walkAccounts = (list: any[]) => {
    for (const child of list) {
      const rowTypes = getRowTypes(child);
      if (rowTypes.includes('TOTAL')) continue;

      if (Array.isArray(child?.children) && child.children.length > 0) {
        // Check if this sub-section has a TOTAL child row, or recurse into its accounts
        const subTotal = child.children.find(
          (c: any) =>
            String(c?.id || '').toUpperCase() ===
              String(child?.id || '').toUpperCase() &&
            getRowTypes(c).includes('TOTAL'),
        );
        if (subTotal) {
          const label = getRowLabel(child);
          const val = Math.abs(getRowAmount(subTotal, columns));
          if (label && val > 0) {
            collected.push({ label, value: val });
          }
          continue;
        }
        walkAccounts(child.children);
        continue;
      }

      const label = getRowLabel(child);
      const val = Math.abs(getRowAmount(child, columns));
      if (label && val > 0) {
        collected.push({ label, value: val });
      }
    }
  };

  walkAccounts(sectionRow.children);
  return collected.sort((a, b) => b.value - a.value).slice(0, limit);
}

export function extractProfitLossChartData(
  rows: any[],
  columns?: any[],
) {
  const incomeRow =
    findRowById(rows, ['INCOME']) ||
    findRowByLabel(rows, ['total income', 'total revenue']);
  const cogsRow =
    findRowById(rows, ['COST_OF_SALES']) ||
    findRowByLabel(rows, ['total cost of goods sold', 'total cost of sales']);
  const grossProfitRow =
    findRowById(rows, ['GROSS_PROFIT']) ||
    findRowByLabel(rows, ['gross profit']);
  const expenseRow =
    findRowById(rows, ['EXPENSES']) ||
    findRowByLabel(rows, ['total expenses', 'total operating expenses']);
  const otherIncomeRow =
    findRowById(rows, ['OTHER_INCOME']) ||
    findRowByLabel(rows, ['total other income']);
  const otherExpenseRow =
    findRowById(rows, ['OTHER_EXPENSES']) ||
    findRowByLabel(rows, ['total other expenses']);
  const netIncomeRow =
    findRowById(rows, ['NET_INCOME']) ||
    findRowByLabel(rows, ['net income', 'net profit']);

  const totalIncome =
    getRowAmount(incomeRow, columns) + getRowAmount(otherIncomeRow, columns);
  const totalCogs = getRowAmount(cogsRow, columns);
  const grossProfit = getRowAmount(grossProfitRow, columns);
  const totalExpenses =
    getRowAmount(expenseRow, columns) + getRowAmount(otherExpenseRow, columns);
  const netIncome = getRowAmount(netIncomeRow, columns);

  const summaryBars: ChartDatum[] = [
    { label: 'Income', value: totalIncome, color: '#10B981' },
    ...(totalCogs !== 0
      ? [{ label: 'COGS', value: totalCogs, color: '#F59E0B' }]
      : []),
    { label: 'Expenses', value: totalExpenses, color: '#EF4444' },
    {
      label: 'Net Profit',
      value: netIncome,
      color: netIncome >= 0 ? '#1E5EFF' : '#DC2626',
    },
  ];

  const expenseContainer =
    findSectionContainerById(rows, ['EXPENSES']) ||
    findRowByLabel(rows, ['expenses']);
  const expenseBreakdown = extractAccountChildren(expenseContainer, columns, 6);

  return {
    totalIncome,
    totalCogs,
    grossProfit,
    totalExpenses,
    netIncome,
    summaryBars,
    expenseBreakdown,
  };
}

export function extractBalanceSheetChartData(
  rows: any[],
  columns?: any[],
) {
  const assetsRow =
    findRowById(rows, ['ASSETS']) || findRowByLabel(rows, ['total assets']);
  const liabilitiesRow =
    findRowById(rows, ['LIABILITY']) ||
    findRowByLabel(rows, ['total liabilities']);
  const equityRow =
    findRowById(rows, ['EQUITY']) || findRowByLabel(rows, ['total equity']);
  const cashRow =
    findRowById(rows, ['CASH_EQUIVALENTS']) ||
    findRowByLabel(rows, ['cash and cash equivalents']);
  const arRow =
    findRowById(rows, ['ACCOUNTS_RECEIVABLE']) ||
    findRowByLabel(rows, ['accounts receivable']);
  const invRow =
    findRowById(rows, ['INVENTORY']) || findRowByLabel(rows, ['inventory']);

  const totalAssets = getRowAmount(assetsRow, columns);
  const totalLiabilities = getRowAmount(liabilitiesRow, columns);
  const totalEquity = getRowAmount(equityRow, columns);
  const cashBalance = getRowAmount(cashRow, columns);
  const accountsReceivable = getRowAmount(arRow, columns);
  const inventoryAssetValue = getRowAmount(invRow, columns);

  const mixData: ChartDatum[] = [
    { label: 'Assets', value: Math.abs(totalAssets), color: '#1E5EFF' },
    { label: 'Liabilities', value: Math.abs(totalLiabilities), color: '#F59E0B' },
    { label: 'Equity', value: Math.abs(totalEquity), color: '#10B981' },
  ].filter((d) => d.value > 0);

  const assetContainer =
    findSectionContainerById(rows, ['ASSETS']) ||
    findRowByLabel(rows, ['assets']);
  const topAssets = extractAccountChildren(assetContainer, columns, 6);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    cashBalance,
    accountsReceivable,
    inventoryAssetValue,
    mixData,
    topAssets,
  };
}

export function extractCashFlowChartData(
  rows: any[],
  columns?: any[],
) {
  const operatingRow =
    findRowById(rows, ['OPERATING']) ||
    findRowByLabel(rows, ['net cash provided by operating', 'operating']);
  const investingRow =
    findRowById(rows, ['INVESTMENT']) ||
    findRowByLabel(rows, ['net cash', 'investing']);
  const financingRow =
    findRowById(rows, ['FINANCIAL']) ||
    findRowByLabel(rows, ['financing']);
  const netCashRow =
    findRowById(rows, ['NET_CASH_INCREASE']) ||
    findRowByLabel(rows, ['net increase', 'net cash']);
  const endCashRow =
    findRowById(rows, ['CASH_END_PERIOD']) ||
    findRowByLabel(rows, ['cash at end', 'ending cash']);

  const operating = getRowAmount(operatingRow, columns);
  const investing = getRowAmount(investingRow, columns);
  const financing = getRowAmount(financingRow, columns);
  const netCash = getRowAmount(netCashRow, columns);
  const endingCash = getRowAmount(endCashRow, columns);

  const bars: ChartDatum[] = [
    { label: 'Operating', value: operating, color: '#10B981' },
    { label: 'Investing', value: investing, color: '#1E5EFF' },
    { label: 'Financing', value: financing, color: '#8B5CF6' },
    {
      label: 'Net Cash',
      value: netCash,
      color: netCash >= 0 ? '#06B6D4' : '#EF4444',
    },
  ];

  return { operating, investing, financing, netCash, endingCash, bars };
}
