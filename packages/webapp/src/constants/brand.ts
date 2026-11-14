/**
 * Webapp Centralized Branding Configuration
 * BorngreatAccounting (BtAccounting)
 * Copyright (C) 2026 Peter Borngreat-Mensah
 */

export const BRAND = {
  productName:
    (import.meta as any).env?.VITE_BRAND_NAME || 'BorngreatAccounting',
  shortName: (import.meta as any).env?.VITE_BRAND_SHORT_NAME || 'BtAccounting',
  productCategory: 'Accounting and Financial Software',
  category: 'Accounting and Financial Software',
  tagline:
    (import.meta as any).env?.VITE_BRAND_TAGLINE ||
    'Your Accounting. Your Servers. Your Control.',
  developer: 'Peter Borngreat-Mensah',
  developerName: 'Peter Borngreat-Mensah',
  publisher: 'Borngreat',
  publisherName: 'Borngreat',
  companyLegalName: 'Borngreat (Peter Borngreat-Mensah)',
  githubAccount: 'soluotech',
  githubOrg: 'soluotech',
  repositoryUrl:
    (import.meta as any).env?.VITE_REPOSITORY_URL ||
    'https://github.com/PipetteGh/borngreataccounting',
  docsUrl:
    (import.meta as any).env?.VITE_DOCS_URL ||
    'https://github.com/PipetteGh/borngreataccounting/tree/main/docs',
  communityUrl:
    (import.meta as any).env?.VITE_COMMUNITY_URL ||
    'https://github.com/PipetteGh/borngreataccounting/issues',
  supportUrl:
    (import.meta as any).env?.VITE_COMMUNITY_URL ||
    'https://github.com/PipetteGh/borngreataccounting/issues',
  releasesUrl:
    'https://github.com/PipetteGh/borngreataccounting/releases',
  version: (import.meta as any).env?.VITE_APP_VERSION || '1.0.0',
  license: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
  licenseUrl:
    'https://github.com/PipetteGh/borngreataccounting/blob/main/LICENSE',
  upstreamProjectName: 'Bigcapital',
  upstreamRepositoryUrl: 'https://github.com/bigcapitalhq/bigcapital',
  upstreamAttribution:
    'Derived from the open-source Bigcapital project (https://github.com/bigcapitalhq/bigcapital)',
  copyrightNotice:
    '© 2026 Peter Borngreat-Mensah (Borngreat). All rights reserved under GNU AGPL-3.0.',
  recoveryCodesFilename: 'borngreataccounting-recovery-codes.txt',
} as const;

export const BRAND_CONFIG = BRAND;
