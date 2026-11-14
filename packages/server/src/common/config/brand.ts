import { registerAs } from '@nestjs/config';

export const SERVER_BRAND_CONFIG = {
  productName: process.env.BRAND_NAME || 'BorngreatAccounting',
  shortName: process.env.BRAND_SHORT_NAME || 'BtAccounting',
  productCategory: 'Accounting and Financial Software',
  category: 'Accounting and Financial Software',
  tagline:
    process.env.BRAND_TAGLINE || 'Your Accounting. Your Servers. Your Control.',
  developer: 'Peter Borngreat-Mensah',
  developerName: 'Peter Borngreat-Mensah',
  publisher: 'Borngreat',
  publisherName: 'Borngreat',
  companyLegalName: 'Borngreat (Peter Borngreat-Mensah)',
  githubAccount: 'soluotech',
  githubOrg: 'soluotech',
  repositoryUrl:
    process.env.REPOSITORY_URL ||
    'https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative',
  version: process.env.APP_VERSION || '1.0.0',
  license: 'AGPL-3.0',
  upstreamAttribution:
    'Derived from the open-source Bigcapital project (https://github.com/bigcapitalhq/bigcapital)',
};

export const SERVER_BRAND = SERVER_BRAND_CONFIG;

export default registerAs('brand', () => SERVER_BRAND_CONFIG);
