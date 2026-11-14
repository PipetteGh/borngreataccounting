/**
 * Centralized Product Identity and Branding Configuration
 * BorngreatAccounting (BtAccounting)
 * Copyright (C) 2026 Peter Borngreat-Mensah
 * Licensed under GNU AGPL-3.0
 */

export interface BrandConfig {
  productName: string;
  shortName: string;
  productCategory: string;
  tagline: string;
  developer: string;
  publisher: string;
  companyLegalName: string;
  githubAccount: string;
  repositoryUrl: string;
  docsUrl: string;
  communityUrl: string;
  supportEmail: string;
  version: string;
  license: string;
  licenseUrl: string;
  upstreamProjectName: string;
  upstreamRepositoryUrl: string;
  copyrightNotice: string;
  twoFactorIssuer: string;
  recoveryCodesFilename: string;
}

export const BRAND_CONFIG: BrandConfig = {
  productName: 'BorngreatAccounting',
  shortName: 'BtAccounting',
  productCategory: 'Accounting and Financial Software',
  tagline: 'Your Accounting. Your Servers. Your Control.',
  developer: 'Peter Borngreat-Mensah',
  publisher: 'Borngreat',
  companyLegalName: 'Borngreat (Peter Borngreat-Mensah)',
  githubAccount: 'soluotech',
  repositoryUrl:
    'https://github.com/PipetteGh/borngreataccounting',
  docsUrl:
    'https://github.com/PipetteGh/borngreataccounting/tree/main/docs',
  communityUrl:
    'https://github.com/PipetteGh/borngreataccounting/discussions',
  supportEmail: 'support@borngreat.com',
  version: '1.0.0',
  license: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
  licenseUrl:
    'https://github.com/PipetteGh/borngreataccounting/blob/main/LICENSE',
  upstreamProjectName: 'Bigcapital',
  upstreamRepositoryUrl: 'https://github.com/bigcapitalhq/bigcapital',
  copyrightNotice: '© 2026 Peter Borngreat-Mensah (Borngreat). Licensed under GNU AGPL-3.0.',
  twoFactorIssuer: 'BorngreatAccounting',
  recoveryCodesFilename: 'borngreataccounting-recovery-codes.txt',
};

export function getBrandConfig(overrides?: Partial<BrandConfig>): BrandConfig {
  return {
    ...BRAND_CONFIG,
    ...overrides,
  };
}
