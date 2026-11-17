import type { ChartDatum } from './FinancialCharts';

export function parseNumericCell(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return 0;
  const trimmed = val.trim();
  if (!trimmed) return 0;
  const isParenNeg = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return isParenNeg ? -Math.abs(num) : num;
}

export function getRowLabel(row: any): string {
  const firstCell = Array.isArray(row?.cells) ? row.cells[0] : null;
  if (firstCell && typeof firstCell.value === 'string') {
    return firstCell.value.trim();
  }
  return String(row?.name || '').trim();
}

export function getRowAmount(row: any, cellIndex = 1): number {
  const cells = Array.isArray(row?.cells) ? row.cells : [];
  const cell = cells[cellIndex] ?? cells[cells.length - 1];
  return parseNumericCell(cell?.value);
}

export function findRowByLabel(rows: any[], patterns: string[]): any | null {
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    const label = getRowLabel(row).toLowerCase();
    if (patterns.some((p) => label.includes(p.toLowerCase()))) {
      return row;
    }
    if (Array.isArray(row?.children) && row.children.length > 0) {
      const found = findRowByLabel(row.children, patterns);
      if (found) return found;
    }
  }
  return null;
}

export function extractTopChildItems(
  sectionRow: any,
  limit = 6,
): ChartDatum[] {
  if (!sectionRow || !Array.isArray(sectionRow.children)) return [];
  const collected: ChartDatum[] = [];
  for (const child of sectionRow.children) {
    const rowTypes: string[] = Array.isArray(child?.rowTypes)
      ? child.rowTypes
      : [];
    if (rowTypes.includes('TOTAL')) continue;
    const label = getRowLabel(child);
    const val = Math.abs(getRowAmount(child));
    if (label && val > 0) {
      collected.push({ label, value: val });
    }
  }
  return collected
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function extractProfitLossChartData(rows: any[]) {
  const incomeRow = findRowByLabel(rows, ['total income', 'total revenue', 'income']);
  const cogsRow = findRowByLabel(rows, ['total cost of goods sold', 'cost of goods sold']);
  const grossProfitRow = findRowByLabel(rows, ['gross profit']);
  const expenseRow = findRowByLabel(rows, ['total expenses', 'total operating expenses', 'expenses']);
  const netIncomeRow = findRowByLabel(rows, ['net income', 'net profit']);

  const totalIncome = Math.abs(getRowAmount(incomeRow));
  const totalCogs = Math.abs(getRowAmount(cogsRow));
  const grossProfit = getRowAmount(grossProfitRow);
  const totalExpenses = Math.abs(getRowAmount(expenseRow));
  const netIncome = getRowAmount(netIncomeRow);

  const summaryBars: ChartDatum[] = [
    { label: 'Income', value: totalIncome, color: '#10B981' },
    ...(totalCogs > 0
      ? [{ label: 'COGS', value: totalCogs, color: '#F59E0B' }]
      : []),
    { label: 'Expenses', value: totalExpenses, color: '#EF4444' },
    {
      label: 'Net Profit',
      value: netIncome,
      color: netIncome >= 0 ? '#1E5EFF' : '#DC2626',
    },
  ];

  const expenseSection = findRowByLabel(rows, ['expenses', 'operating expenses']);
  const expenseBreakdown = extractTopChildItems(expenseSection, 6);

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

export function extractBalanceSheetChartData(rows: any[]) {
  const assetsRow = findRowByLabel(rows, ['total assets', 'assets']);
  const liabilitiesRow = findRowByLabel(rows, ['total liabilities', 'liabilities']);
  const equityRow = findRowByLabel(rows, ['total equity', 'equity']);

  const totalAssets = Math.abs(getRowAmount(assetsRow));
  const totalLiabilities = Math.abs(getRowAmount(liabilitiesRow));
  const totalEquity = Math.abs(getRowAmount(equityRow));

  const mixData: ChartDatum[] = [
    { label: 'Assets', value: totalAssets, color: '#1E5EFF' },
    { label: 'Liabilities', value: totalLiabilities, color: '#F59E0B' },
    { label: 'Equity', value: totalEquity, color: '#10B981' },
  ].filter((d) => d.value > 0);

  const assetSection = findRowByLabel(rows, ['assets']);
  const topAssets = extractTopChildItems(assetSection, 5);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    mixData,
    topAssets,
  };
}

export function extractCashFlowChartData(rows: any[]) {
  const operatingRow = findRowByLabel(rows, ['operating activities', 'cash flows from operating']);
  const investingRow = findRowByLabel(rows, ['investing activities', 'cash flows from investing']);
  const financingRow = findRowByLabel(rows, ['financing activities', 'cash flows from financing']);
  const netCashRow = findRowByLabel(rows, ['net increase', 'net cash', 'ending cash']);

  const operating = getRowAmount(operatingRow);
  const investing = getRowAmount(investingRow);
  const financing = getRowAmount(financingRow);
  const netCash = getRowAmount(netCashRow);

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

  return { operating, investing, financing, netCash, bars };
}
