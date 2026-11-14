export interface ITaxRatePresetItem {
  name: string;
  code: string;
  rate: number;
  description: string;
  isNonRecoverable: boolean;
}

export interface ICountryTaxPreset {
  countryCode: string;
  countryName: string;
  defaultCurrency: string;
  taxAuthority: string;
  rates: ITaxRatePresetItem[];
}

/**
 * Optional, multi-country tax localization presets for BorngreatAccounting.
 * Countries are strictly opt-in and never forced as the default jurisdiction.
 */
export const TAX_LOCALIZATION_PRESETS: Record<string, ICountryTaxPreset> = {
  GH: {
    countryCode: 'GH',
    countryName: 'Ghana',
    defaultCurrency: 'GHS',
    taxAuthority: 'Ghana Revenue Authority (GRA)',
    rates: [
      {
        name: 'Standard VAT (GRA)',
        code: 'GH-VAT-15',
        rate: 15,
        description: 'Ghana standard Value Added Tax (15%)',
        isNonRecoverable: false,
      },
      {
        name: 'NHIL (National Health Insurance Levy)',
        code: 'GH-NHIL-2.5',
        rate: 2.5,
        description: 'Ghana National Health Insurance Levy (2.5%)',
        isNonRecoverable: true,
      },
      {
        name: 'GETFund Levy',
        code: 'GH-GETFUND-2.5',
        rate: 2.5,
        description: 'Ghana Education Trust Fund Levy (2.5%)',
        isNonRecoverable: true,
      },
      {
        name: 'COVID-19 Health Recovery Levy',
        code: 'GH-CHRL-1',
        rate: 1,
        description: 'Ghana COVID-19 Health Recovery Levy (1%)',
        isNonRecoverable: true,
      },
      {
        name: 'VAT Flat Rate Scheme (VFRS)',
        code: 'GH-VFRS-3',
        rate: 3,
        description: 'Ghana VAT Flat Rate Scheme for eligible retailers (3%)',
        isNonRecoverable: false,
      },
      {
        name: 'Zero-Rated Supply (Export / Exempt)',
        code: 'GH-ZERO-0',
        rate: 0,
        description: 'Ghana Zero-Rated / Exempt supply (0%)',
        isNonRecoverable: false,
      },
    ],
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    defaultCurrency: 'GBP',
    taxAuthority: 'HM Revenue & Customs (HMRC)',
    rates: [
      {
        name: 'UK Standard VAT',
        code: 'GB-VAT-20',
        rate: 20,
        description: 'UK Standard Value Added Tax (20%)',
        isNonRecoverable: false,
      },
      {
        name: 'UK Reduced Rate VAT',
        code: 'GB-VAT-5',
        rate: 5,
        description: 'UK Reduced Value Added Tax (5%)',
        isNonRecoverable: false,
      },
      {
        name: 'UK Zero Rate VAT',
        code: 'GB-VAT-0',
        rate: 0,
        description: 'UK Zero-Rated VAT (0%)',
        isNonRecoverable: false,
      },
    ],
  },
  EU: {
    countryCode: 'EU',
    countryName: 'European Union (Standard Baseline)',
    defaultCurrency: 'EUR',
    taxAuthority: 'EU VAT Directive Baseline',
    rates: [
      {
        name: 'EU Standard VAT',
        code: 'EU-VAT-20',
        rate: 20,
        description: 'Standard EU VAT template (customizable per member state)',
        isNonRecoverable: false,
      },
      {
        name: 'EU Reduced VAT',
        code: 'EU-VAT-10',
        rate: 10,
        description: 'Reduced EU VAT template',
        isNonRecoverable: false,
      },
    ],
  },
  TR: {
    countryCode: 'TR',
    countryName: 'Türkiye',
    defaultCurrency: 'TRY',
    taxAuthority: 'Gelir İdaresi Başkanlığı (GİB)',
    rates: [
      {
        name: 'KDV Standard (20%)',
        code: 'TR-KDV-20',
        rate: 20,
        description: 'Türkiye Standard Katma Değer Vergisi (20%)',
        isNonRecoverable: false,
      },
      {
        name: 'KDV Reduced (10%)',
        code: 'TR-KDV-10',
        rate: 10,
        description: 'Türkiye Reduced Katma Değer Vergisi (10%)',
        isNonRecoverable: false,
      },
      {
        name: 'KDV Essential Goods (1%)',
        code: 'TR-KDV-1',
        rate: 1,
        description: 'Türkiye Essential Goods KDV (1%)',
        isNonRecoverable: false,
      },
    ],
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    defaultCurrency: 'USD',
    taxAuthority: 'State & Local Sales Tax',
    rates: [
      {
        name: 'Tax Exempt (0%)',
        code: 'US-EXEMPT-0',
        rate: 0,
        description: 'Tax-exempt sale or interstate service (0%)',
        isNonRecoverable: false,
      },
    ],
  },
};

export function listTaxLocalizationPresets(): ICountryTaxPreset[] {
  return Object.values(TAX_LOCALIZATION_PRESETS);
}

export function getTaxLocalizationPresetByCountry(
  countryCode: string,
): ICountryTaxPreset | null {
  if (!countryCode) {
    return null;
  }
  const normalized = countryCode.trim().toUpperCase();
  return TAX_LOCALIZATION_PRESETS[normalized] ?? null;
}
