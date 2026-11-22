export interface ChartDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

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
  return String(row?.name || row?.label || '').trim();
}

/**
 * Flatten leaf columns from potentially nested `table.columns` trees
 * (e.g. when comparison or percentage sub-columns are enabled).
 */
function flattenLeafColumns(columns?: any[]): any[] {
  if (!Array.isArray(columns)) return [];
  const leaves: any[] = [];
  const walk = (cols: any[]) => {
    for (const col of cols) {
      if (Array.isArray(col?.children) && col.children.length > 0) {
        walk(col.children);
      } else if (col) {
        leaves.push(col);
      }
    }
  };
  walk(columns);
  return leaves;
}

/**
 * Resolves the "Total" (or primary numeric) cell index from table columns.
 */
export function resolveTotalColumnIndex(columns?: any[], row?: any): number {
  // 1. Direct cell.key lookup on row.cells (Table.utils.ts sets key: 'total' on every total cell)
  if (Array.isArray(row?.cells)) {
    const directIdx = row.cells.findIndex(
      (c: any) => String(c?.key || '').toLowerCase() === 'total',
    );
    if (directIdx >= 1) return directIdx;
  }

  // 2. Leaf column lookup (respecting explicit cellIndex from FinancialTable.tableColumnsCellIndexing)
  const leaves = flattenLeafColumns(columns);
  if (leaves.length > 1) {
    const totalLeaf = leaves.find(
      (c) =>
        String(c?.key || '').toLowerCase() === 'total' ||
        String(c?.label || '').toLowerCase() === 'total',
    );
    if (totalLeaf) {
      if (
        typeof totalLeaf.cellIndex === 'number' &&
        totalLeaf.cellIndex >= 1
      ) {
        return totalLeaf.cellIndex;
      }
      const leafIdx = leaves.indexOf(totalLeaf);
      if (leafIdx >= 1) return leafIdx;
    }

    for (let i = leaves.length - 1; i >= 1; i--) {
      const k = String(leaves[i]?.key || '').toLowerCase();
      if (!k.includes('percentage') && !k.includes('change')) {
        return typeof leaves[i]?.cellIndex === 'number'
          ? leaves[i].cellIndex
          : i;
      }
    }
    return 1;
  }

  return 1;
}

export function getRowAmount(
  row: any,
  columns?: any[],
  explicitIndex?: number,
): number {
  if (!row || !Array.isArray(row.cells) || row.cells.length < 2) return 0;

  if (explicitIndex !== undefined) {
    return parseNumericCell(row.cells[explicitIndex]?.value);
  }

  // Direct lookup by cell.key === 'total'
  const directTotalCell = row.cells.find(
    (c: any) => String(c?.key || '').toLowerCase() === 'total',
  );
  if (
    directTotalCell &&
    directTotalCell.value !== '' &&
    directTotalCell.value !== undefined
  ) {
    return parseNumericCell(directTotalCell.value);
  }

  const idx = resolveTotalColumnIndex(columns, row);
  const cell =
    row.cells[idx] ?? row.cells[1] ?? row.cells[row.cells.length - 1];
  return parseNumericCell(cell?.value);
}

function getRowTypes(row: any): string[] {
  return Array.isArray(row?.rowTypes)
    ? row.rowTypes.map((t: any) => String(t).toUpperCase())
    : [];
}

function hasNonEmptyTotalCell(row: any, columns?: any[]): boolean {
  if (!row || !Array.isArray(row.cells) || row.cells.length < 2) return false;
  const direct = row.cells.find(
    (c: any) => String(c?.key || '').toLowerCase() === 'total',
  );
  if (direct && String(direct.value ?? '').trim() !== '') return true;
  const idx = resolveTotalColumnIndex(columns, row);
  const cell = row.cells[idx] ?? row.cells[1];
  return String(cell?.value ?? '').trim() !== '';
}

/**
 * Finds the exact row for a schema node ID:
 * 1. Matches `row.id` with `rowTypes.includes('TOTAL')`.
 * 2. Or if a section row (`id === targetId`) has an appended `TOTAL` child row
 *    (even when the child has no `id`, as in `CashFlowTable.ts`), uses that `TOTAL` child.
 * 3. Or uses the node itself (`tableRowMapper` populates `total.formattedAmount` on the node).
 */
export function findRowById(
  rows: any[],
  targetIds: string[],
  columns?: any[],
): any | null {
  if (!Array.isArray(rows)) return null;
  const upperTargets = targetIds.map((id) => id.toUpperCase());

  let totalMatch: any = null;
  let childTotalMatch: any = null;
  let nodeWithCellsMatch: any = null;
  let fallbackMatch: any = null;

  const walk = (list: any[]) => {
    for (const row of list) {
      const id = String(row?.id || '').toUpperCase();
      const rowTypes = getRowTypes(row);

      if (upperTargets.includes(id)) {
        if (rowTypes.includes('TOTAL') && hasNonEmptyTotalCell(row, columns)) {
          totalMatch = row;
        } else if (Array.isArray(row?.children) && row.children.length > 0) {
          // Check direct children for a TOTAL row for this section
          const directTotalChild = [...row.children]
            .reverse()
            .find(
              (c: any) =>
                getRowTypes(c).includes('TOTAL') &&
                (!c?.id ||
                  String(c.id).toUpperCase() === id) &&
                hasNonEmptyTotalCell(c, columns),
            );
          if (directTotalChild && !childTotalMatch) {
            childTotalMatch = directTotalChild;
          }
        }

        if (!nodeWithCellsMatch && hasNonEmptyTotalCell(row, columns)) {
          nodeWithCellsMatch = row;
        }
        if (!fallbackMatch) {
          fallbackMatch = row;
        }
      }

      if (Array.isArray(row?.children) && row.children.length > 0) {
        walk(row.children);
      }
    }
  };

  walk(rows);
  return totalMatch || childTotalMatch || nodeWithCellsMatch || fallbackMatch;
}

/**
 * Fallback label search prioritizing TOTAL rows.
 */
export function findRowByLabel(
  rows: any[],
  patterns: string[],
  columns?: any[],
): any | null {
  if (!Array.isArray(rows)) return null;
  const lowerPatterns = patterns.map((p) => p.toLowerCase());

  let totalMatch: any = null;
  let nonAggregateMatch: any = null;

  const walk = (list: any[]) => {
    for (const row of list) {
      const label = getRowLabel(row).toLowerCase();
      const rowTypes = getRowTypes(row);

      if (lowerPatterns.some((p) => label.includes(p))) {
        if (rowTypes.includes('TOTAL') && hasNonEmptyTotalCell(row, columns)) {
          totalMatch = row;
        } else if (
          !rowTypes.includes('AGGREGATE') &&
          !nonAggregateMatch &&
          hasNonEmptyTotalCell(row, columns)
        ) {
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
        const subTotal = [...child.children]
          .reverse()
          .find(
            (c: any) =>
              getRowTypes(c).includes('TOTAL') &&
              (!c?.id ||
                String(c.id).toUpperCase() ===
                  String(child?.id || '').toUpperCase()),
          );
        const targetNode = subTotal || child;
        const label = getRowLabel(child);
        const val = Math.abs(getRowAmount(targetNode, columns));
        if (label && val > 0) {
          collected.push({ label, value: val });
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

/**
 * Extracts Profit & Loss figures matching the exact server schema equations:
 * -GROSS_PROFIT = INCOME - COST_OF_SALES
 * -NET_OPERATING_INCOME = GROSS_PROFIT - EXPENSES
 * -NET_INCOME = NET_OPERATING_INCOME + OTHER_INCOME - OTHER_EXPENSES
 */
export function extractProfitLossChartData(rows: any[], columns?: any[]) {
  const incomeRow =
    findRowById(rows, ['INCOME'], columns) ||
    findRowByLabel(rows, ['total income', 'total revenue'], columns);
  const cogsRow =
    findRowById(rows, ['COST_OF_SALES'], columns) ||
    findRowByLabel(
      rows,
      ['total cost of goods sold', 'total cost of sales'],
      columns,
    );
  const grossProfitRow =
    findRowById(rows, ['GROSS_PROFIT'], columns) ||
    findRowByLabel(rows, ['gross profit'], columns);
  const expenseRow =
    findRowById(rows, ['EXPENSES'], columns) ||
    findRowByLabel(
      rows,
      ['total expenses', 'total operating expenses'],
      columns,
    );
  const netOperatingIncomeRow =
    findRowById(rows, ['NET_OPERATING_INCOME'], columns) ||
    findRowByLabel(rows, ['net operating income'], columns);
  const otherIncomeRow =
    findRowById(rows, ['OTHER_INCOME'], columns) ||
    findRowByLabel(rows, ['total other income'], columns);
  const otherExpenseRow =
    findRowById(rows, ['OTHER_EXPENSES'], columns) ||
    findRowByLabel(rows, ['total other expenses'], columns);
  const netIncomeRow =
    findRowById(rows, ['NET_INCOME'], columns) ||
    findRowByLabel(rows, ['net income', 'net profit'], columns);

  const operatingIncome = getRowAmount(incomeRow, columns);
  const otherIncome = getRowAmount(otherIncomeRow, columns);
  const totalIncome = operatingIncome + otherIncome;

  const totalCogs = getRowAmount(cogsRow, columns);
  const grossProfit = grossProfitRow
    ? getRowAmount(grossProfitRow, columns)
    : operatingIncome - totalCogs;

  const operatingExpenses = getRowAmount(expenseRow, columns);
  const otherExpenses = getRowAmount(otherExpenseRow, columns);
  // Total Costs & Expenses includes both Cost of Sales (COGS) and Operating/Other Expenses
  // so that Total Income - Total Costs & Expenses == Net Income always tallies!
  const totalExpenses = totalCogs + operatingExpenses + otherExpenses;

  const netOperatingIncome = netOperatingIncomeRow
    ? getRowAmount(netOperatingIncomeRow, columns)
    : grossProfit - operatingExpenses;

  const netIncome = netIncomeRow
    ? getRowAmount(netIncomeRow, columns)
    : netOperatingIncome + otherIncome - otherExpenses;

  const summaryBars: ChartDatum[] = [
    { label: 'Income', value: totalIncome, color: '#10B981' },
    { label: 'COGS', value: totalCogs, color: '#F59E0B' },
    { label: 'Gross Profit', value: grossProfit, color: '#06B6D4' },
    {
      label: 'Op. Expenses',
      value: operatingExpenses + otherExpenses,
      color: '#EF4444',
    },
    {
      label: 'Net Income',
      value: netIncome,
      color: netIncome >= 0 ? '#1E5EFF' : '#DC2626',
    },
  ];

  // Combine Cost of Sales and Operating Expense accounts for the breakdown donut
  const cogsContainer = findSectionContainerById(rows, ['COST_OF_SALES']);
  const expenseContainer =
    findSectionContainerById(rows, ['EXPENSES']) ||
    findRowByLabel(rows, ['expenses'], columns);

  const cogsChildren = extractAccountChildren(cogsContainer, columns, 6);
  const opExChildren = extractAccountChildren(expenseContainer, columns, 6);
  const expenseBreakdown = [...cogsChildren, ...opExChildren]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    operatingIncome,
    otherIncome,
    totalIncome,
    totalCogs,
    grossProfit,
    operatingExpenses,
    otherExpenses,
    totalExpenses,
    netOperatingIncome,
    netIncome,
    summaryBars,
    expenseBreakdown,
  };
}

/**
 * Extracts Balance Sheet figures matching the accounting equation:
 * ASSETS = LIABILITIES + EQUITY (LIABILITY_EQUITY)
 */
export function extractBalanceSheetChartData(rows: any[], columns?: any[]) {
  const assetsRow =
    findRowById(rows, ['ASSETS'], columns) ||
    findRowByLabel(rows, ['total assets'], columns);
  const currentAssetsRow =
    findRowById(rows, ['CURRENT_ASSETS'], columns) ||
    findRowByLabel(rows, ['total current assets'], columns);
  const fixedAssetsRow =
    findRowById(rows, ['FIXED_ASSET'], columns) ||
    findRowByLabel(rows, ['total fixed assets', 'fixed assets'], columns);
  const liabilitiesRow =
    findRowById(rows, ['LIABILITY'], columns) ||
    findRowByLabel(rows, ['total liabilities'], columns);
  const equityRow =
    findRowById(rows, ['EQUITY'], columns) ||
    findRowByLabel(rows, ['total equity'], columns);
  const liabilitiesAndEquityRow =
    findRowById(rows, ['LIABILITY_EQUITY'], columns) ||
    findRowByLabel(rows, ['total liabilities and equity'], columns);
  const cashRow =
    findRowById(rows, ['CASH_EQUIVALENTS'], columns) ||
    findRowByLabel(rows, ['cash and cash equivalents'], columns);
  const arRow =
    findRowById(rows, ['ACCOUNTS_RECEIVABLE'], columns) ||
    findRowByLabel(rows, ['accounts receivable'], columns);
  const invRow =
    findRowById(rows, ['INVENTORY'], columns) ||
    findRowByLabel(rows, ['inventory'], columns);
  const apRow =
    findRowById(rows, ['CURRENT_LIABILITY'], columns) ||
    findRowByLabel(rows, ['current liabilities', 'accounts payable'], columns);

  const totalAssets = getRowAmount(assetsRow, columns);
  const currentAssets = getRowAmount(currentAssetsRow, columns);
  const fixedAssets = getRowAmount(fixedAssetsRow, columns);
  const totalLiabilities = getRowAmount(liabilitiesRow, columns);
  const totalEquity = getRowAmount(equityRow, columns);
  const totalLiabilitiesAndEquity = liabilitiesAndEquityRow
    ? getRowAmount(liabilitiesAndEquityRow, columns)
    : totalLiabilities + totalEquity;
  const cashBalance = getRowAmount(cashRow, columns);
  const accountsReceivable = getRowAmount(arRow, columns);
  const inventoryAssetValue = getRowAmount(invRow, columns);
  const currentLiabilities = getRowAmount(apRow, columns);

  // Bar comparison: Assets vs Liabilities vs Equity (never summed into 2x Assets!)
  const mixData: ChartDatum[] = [
    { label: 'Total Assets', value: totalAssets, color: '#1E5EFF' },
    { label: 'Total Liabilities', value: totalLiabilities, color: '#F59E0B' },
    { label: 'Total Equity', value: totalEquity, color: '#10B981' },
  ];

  // Asset composition donut whose slices sum to Total Assets
  const assetContainer =
    findSectionContainerById(rows, ['ASSETS']) ||
    findRowByLabel(rows, ['assets'], columns);
  const topAssets = extractAccountChildren(assetContainer, columns, 6);

  return {
    totalAssets,
    currentAssets,
    fixedAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    cashBalance,
    accountsReceivable,
    inventoryAssetValue,
    currentLiabilities,
    mixData,
    topAssets,
  };
}

export function extractCashFlowChartData(rows: any[], columns?: any[]) {
  const operatingRow =
    findRowById(rows, ['OPERATING'], columns) ||
    findRowByLabel(rows, ['net cash provided by operating', 'operating'], columns);
  const investingRow =
    findRowById(rows, ['INVESTMENT'], columns) ||
    findRowByLabel(rows, ['net cash', 'investing'], columns);
  const financingRow =
    findRowById(rows, ['FINANCIAL'], columns) ||
    findRowByLabel(rows, ['financing'], columns);
  const beginCashRow =
    findRowById(rows, ['CASH_BEGINNING_PERIOD'], columns) ||
    findRowByLabel(rows, ['cash at beginning'], columns);
  const netCashRow =
    findRowById(rows, ['NET_CASH_INCREASE'], columns) ||
    findRowByLabel(rows, ['net increase', 'net cash'], columns);
  const endCashRow =
    findRowById(rows, ['CASH_END_PERIOD'], columns) ||
    findRowByLabel(rows, ['cash at end', 'ending cash'], columns);

  const operating = getRowAmount(operatingRow, columns);
  const investing = getRowAmount(investingRow, columns);
  const financing = getRowAmount(financingRow, columns);
  const beginningCash = getRowAmount(beginCashRow, columns);
  const netCash = getRowAmount(netCashRow, columns);
  const endingCash = getRowAmount(endCashRow, columns);

  const bars: ChartDatum[] = [
    { label: 'Operating', value: operating, color: '#10B981' },
    { label: 'Investing', value: investing, color: '#1E5EFF' },
    { label: 'Financing', value: financing, color: '#8B5CF6' },
    {
      label: 'Net Cash Change',
      value: netCash,
      color: netCash >= 0 ? '#06B6D4' : '#EF4444',
    },
    { label: 'Ending Cash', value: endingCash, color: '#0EA5E9' },
  ];

  return {
    operating,
    investing,
    financing,
    beginningCash,
    netCash,
    endingCash,
    bars,
  };
}
