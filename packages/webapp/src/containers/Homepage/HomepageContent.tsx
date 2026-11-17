import React from 'react';
import { AccountsPayableSection } from './AccountsPayableSection';
import { AccountsReceivableSection } from './AccountsReceivableSection';
import { FinancialAccountingSection } from './FinancialAccountingSection';
import { HomepageInsights } from './HomepageInsights';
import { ProductsServicesSection } from './ProductsServicesSection';
import '@/style/pages/HomePage/HomePage.scss';

export function HomepageContent() {
  return (
    <div className="financial-reports">
      <HomepageInsights />
      <AccountsReceivableSection />
      <AccountsPayableSection />
      <FinancialAccountingSection />
      <ProductsServicesSection />
    </div>
  );
}
