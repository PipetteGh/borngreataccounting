import { InitialCurrencies } from '@/modules/Currencies/Currencies.constants';
import {
  getTaxLocalizationPresetByCountry,
  listTaxLocalizationPresets,
} from './TaxLocalizationPresets';

describe('Global Currencies & Tax Localization Presets', () => {
  it('pre-seeds major global currencies including USD, EUR, GBP, GHS, TRY, CAD, AUD', () => {
    expect(InitialCurrencies).toEqual(
      expect.arrayContaining(['USD', 'EUR', 'GBP', 'GHS', 'TRY', 'CAD', 'AUD']),
    );
  });

  it('lists multiple country tax presets without forcing a single jurisdiction', () => {
    const presets = listTaxLocalizationPresets();
    const countryCodes = presets.map((p) => p.countryCode);

    expect(countryCodes).toEqual(
      expect.arrayContaining(['GH', 'GB', 'EU', 'TR', 'US']),
    );
  });

  it('provides optional Ghana (GRA) VAT, NHIL, GETFund, and COVID-19 levy presets', () => {
    const ghPreset = getTaxLocalizationPresetByCountry('gh');
    expect(ghPreset).not.toBeNull();
    expect(ghPreset?.countryName).toBe('Ghana');
    expect(ghPreset?.defaultCurrency).toBe('GHS');

    const rateCodes = ghPreset?.rates.map((r) => r.code) ?? [];
    expect(rateCodes).toEqual(
      expect.arrayContaining([
        'GH-VAT-15',
        'GH-NHIL-2.5',
        'GH-GETFUND-2.5',
        'GH-CHRL-1',
        'GH-VFRS-3',
        'GH-ZERO-0',
      ]),
    );
  });

  it('returns null for unknown country codes', () => {
    expect(getTaxLocalizationPresetByCountry('ZZ')).toBeNull();
    expect(getTaxLocalizationPresetByCountry('')).toBeNull();
  });
});
