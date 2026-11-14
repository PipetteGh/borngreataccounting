import { SERVER_BRAND } from './brand';

describe('Centralized Branding Configuration (BorngreatAccounting)', () => {
  it('exposes the canonical BorngreatAccounting product identity', () => {
    expect(SERVER_BRAND.productName).toBe('BorngreatAccounting');
    expect(SERVER_BRAND.shortName).toBe('BtAccounting');
    expect(SERVER_BRAND.category).toBe('Accounting and Financial Software');
    expect(SERVER_BRAND.tagline).toBe(
      'Your Accounting. Your Servers. Your Control.',
    );
  });

  it('exposes developer, publisher, and AGPL-3.0 open-source attribution', () => {
    expect(SERVER_BRAND.developerName).toBe('Peter Borngreat-Mensah');
    expect(SERVER_BRAND.publisherName).toBe('Borngreat');
    expect(SERVER_BRAND.githubOrg).toBe('soluotech');
    expect(SERVER_BRAND.license).toBe('AGPL-3.0');
    expect(SERVER_BRAND.repositoryUrl).toContain(
      'Borngreat-Accounting---QuickBooks-Alternative',
    );
    expect(SERVER_BRAND.upstreamAttribution).toContain('Bigcapital');
  });
});
