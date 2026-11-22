import {
  extractBalanceSheetChartData,
  extractCashFlowChartData,
  extractProfitLossChartData,
} from '../../../../../webapp/src/components/Charts/extractReportChartData';

describe('Financial Report & Dashboard Chart Data Reconciliation', () => {
  it('reconciles Profit & Loss: Total Income - (COGS + OpEx + OtherExp) === Net Income', () => {
    const rows = [
      {
        id: 'INCOME',
        rowTypes: ['ACCOUNTS'],
        cells: [
          { key: 'name', value: 'Income' },
          { key: 'total', value: 'GHS 15,000.00' },
        ],
        children: [
          {
            id: 4001,
            rowTypes: ['ACCOUNT'],
            cells: [
              { key: 'name', value: 'Sales' },
              { key: 'total', value: 'GHS 15,000.00' },
            ],
          },
          {
            id: 'INCOME',
            rowTypes: ['TOTAL'],
            cells: [
              { key: 'name', value: 'Total Income' },
              { key: 'total', value: 'GHS 15,000.00' },
            ],
          },
        ],
      },
      {
        id: 'COST_OF_SALES',
        rowTypes: ['ACCOUNTS'],
        cells: [
          { key: 'name', value: 'Cost of Goods Sold' },
          { key: 'total', value: 'GHS 6,000.00' },
        ],
        children: [
          {
            id: 5001,
            rowTypes: ['ACCOUNT'],
            cells: [
              { key: 'name', value: 'Cost of Goods Sold' },
              { key: 'total', value: 'GHS 6,000.00' },
            ],
          },
          {
            id: 'COST_OF_SALES',
            rowTypes: ['TOTAL'],
            cells: [
              { key: 'name', value: 'Total Cost of Goods Sold' },
              { key: 'total', value: 'GHS 6,000.00' },
            ],
          },
        ],
      },
      {
        id: 'GROSS_PROFIT',
        rowTypes: ['TOTAL'],
        cells: [
          { key: 'name', value: 'Gross Profit' },
          { key: 'total', value: 'GHS 9,000.00' },
        ],
      },
      {
        id: 'EXPENSES',
        rowTypes: ['ACCOUNTS'],
        cells: [
          { key: 'name', value: 'Expenses' },
          { key: 'total', value: 'GHS 2,500.00' },
        ],
        children: [
          {
            id: 6001,
            rowTypes: ['ACCOUNT'],
            cells: [
              { key: 'name', value: 'Rent Expense' },
              { key: 'total', value: 'GHS 2,500.00' },
            ],
          },
          {
            id: 'EXPENSES',
            rowTypes: ['TOTAL'],
            cells: [
              { key: 'name', value: 'Total Expenses' },
              { key: 'total', value: 'GHS 2,500.00' },
            ],
          },
        ],
      },
      {
        id: 'NET_INCOME',
        rowTypes: ['TOTAL'],
        cells: [
          { key: 'name', value: 'Net Income' },
          { key: 'total', value: 'GHS 6,500.00' },
        ],
      },
    ];

    const pl = extractProfitLossChartData(rows);
    expect(pl.totalIncome).toBe(15000);
    expect(pl.totalCogs).toBe(6000);
    expect(pl.grossProfit).toBe(9000);
    expect(pl.operatingExpenses).toBe(2500);
    // Total Costs & Expenses must include COGS + Operating Expenses so Income - Expenses == Net Income
    expect(pl.totalExpenses).toBe(8500);
    expect(pl.netIncome).toBe(6500);
    expect(pl.totalIncome - pl.totalExpenses).toBe(pl.netIncome);
  });

  it('reconciles Balance Sheet: Total Assets === Total Liabilities + Total Equity', () => {
    const rows = [
      {
        id: 'ASSETS',
        rowTypes: ['AGGREGATE'],
        cells: [
          { key: 'name', value: 'Assets' },
          { key: 'total', value: 'GHS 25,000.00' },
        ],
        children: [
          {
            id: 'CURRENT_ASSETS',
            rowTypes: ['AGGREGATE'],
            cells: [
              { key: 'name', value: 'Current Assets' },
              { key: 'total', value: 'GHS 25,000.00' },
            ],
            children: [
              {
                id: 'CASH_EQUIVALENTS',
                rowTypes: ['ACCOUNTS'],
                cells: [
                  { key: 'name', value: 'Cash and Cash Equivalents' },
                  { key: 'total', value: 'GHS 10,000.00' },
                ],
              },
              {
                id: 'INVENTORY',
                rowTypes: ['ACCOUNTS'],
                cells: [
                  { key: 'name', value: 'Inventory' },
                  { key: 'total', value: 'GHS 15,000.00' },
                ],
              },
            ],
          },
          {
            id: 'ASSETS',
            rowTypes: ['TOTAL'],
            cells: [
              { key: 'name', value: 'Total Assets' },
              { key: 'total', value: 'GHS 25,000.00' },
            ],
          },
        ],
      },
      {
        id: 'LIABILITY_EQUITY',
        rowTypes: ['AGGREGATE'],
        cells: [
          { key: 'name', value: 'Liabilities and Equity' },
          { key: 'total', value: 'GHS 25,000.00' },
        ],
        children: [
          {
            id: 'LIABILITY',
            rowTypes: ['AGGREGATE'],
            cells: [
              { key: 'name', value: 'Liabilities' },
              { key: 'total', value: 'GHS 8,000.00' },
            ],
          },
          {
            id: 'EQUITY',
            rowTypes: ['ACCOUNTS'],
            cells: [
              { key: 'name', value: 'Equity' },
              { key: 'total', value: 'GHS 17,000.00' },
            ],
          },
        ],
      },
    ];

    const bs = extractBalanceSheetChartData(rows);
    expect(bs.totalAssets).toBe(25000);
    expect(bs.totalLiabilities).toBe(8000);
    expect(bs.totalEquity).toBe(17000);
    expect(bs.cashBalance).toBe(10000);
    expect(bs.inventoryAssetValue).toBe(15000);
    expect(bs.totalLiabilities + bs.totalEquity).toBe(bs.totalAssets);
  });

  it('reconciles Cash Flow Statement sections when CashFlowTable appends TOTAL child without id', () => {
    const rows = [
      {
        id: 'OPERATING',
        rowTypes: ['AGGREGATE'],
        cells: [
          { key: 'name', value: 'Operating Activities' },
          { key: 'total', value: 'GHS 6,500.00' },
        ],
        children: [
          {
            rowTypes: ['TOTAL'],
            cells: [
              { key: 'name', value: 'Net cash provided by operating activities' },
              { key: 'total', value: 'GHS 6,500.00' },
            ],
          },
        ],
      },
      {
        id: 'INVESTMENT',
        rowTypes: ['ACCOUNTS'],
        cells: [
          { key: 'name', value: 'Investing Activities' },
          { key: 'total', value: '(GHS 1,500.00)' },
        ],
      },
      {
        id: 'FINANCIAL',
        rowTypes: ['ACCOUNTS'],
        cells: [
          { key: 'name', value: 'Financing Activities' },
          { key: 'total', value: 'GHS 0.00' },
        ],
      },
      {
        id: 'NET_CASH_INCREASE',
        rowTypes: ['TOTAL'],
        cells: [
          { key: 'name', value: 'Net cash increase for period' },
          { key: 'total', value: 'GHS 5,000.00' },
        ],
      },
      {
        id: 'CASH_END_PERIOD',
        rowTypes: ['TOTAL'],
        cells: [
          { key: 'name', value: 'Cash at end of period' },
          { key: 'total', value: 'GHS 10,000.00' },
        ],
      },
    ];

    const cf = extractCashFlowChartData(rows);
    expect(cf.operating).toBe(6500);
    expect(cf.investing).toBe(-1500);
    expect(cf.financing).toBe(0);
    expect(cf.netCash).toBe(5000);
    expect(cf.endingCash).toBe(10000);
    expect(cf.operating + cf.investing + cf.financing).toBe(cf.netCash);
  });
});
