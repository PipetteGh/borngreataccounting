import * as Yup from 'yup';

// Note: `customerNotes` is declared in the schema but unused by the form
// (the form uses `receiptMessage`). Preserved as-is during TS conversion.
const Schema = Yup.object().shape({
  termsConditions: Yup.string().optional(),
  customerNotes: Yup.string().optional(),
  receiptMessage: Yup.string().optional(),
  posShowLogo: Yup.boolean().optional(),
  posShowCompanyName: Yup.boolean().optional(),
  posShowCompanyAddress: Yup.boolean().optional(),
  posShowCompanyPhone: Yup.boolean().optional(),
  posShowCompanyTaxNumber: Yup.boolean().optional(),
  posShowCustomer: Yup.boolean().optional(),
  posShowPaymentMethod: Yup.boolean().optional(),
  posThankYouMessage: Yup.string().optional(),
  posFooterNote: Yup.string().optional(),
  posShowBarcode: Yup.boolean().optional(),
  posBarcodeValue: Yup.string().optional(),
  posPaperWidth: Yup.string().oneOf(['80mm', '58mm']).optional(),
});

export const PreferencesReceiptsFormSchema = Schema;
