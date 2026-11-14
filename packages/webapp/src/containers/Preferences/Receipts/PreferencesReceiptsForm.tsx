import { Button, Divider, HTMLSelect, Intent } from '@blueprintjs/core';
import { Field, Form } from 'formik';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import {
  FormattedMessage as T,
  FFormGroup,
  FInputGroup,
  FSwitch,
  FTextArea,
} from '@/components';

export interface PreferencesReceiptsFormProps {
  isSubmitting: boolean;
}

/**
 * Preferences general form.
 */
export function PreferencesReceiptsForm({
  isSubmitting,
}: PreferencesReceiptsFormProps) {
  const history = useHistory();

  // Handle close click.
  const handleCloseClick = () => {
    history.go(-1);
  };

  return (
    <Form>
      {/* ---------- Customer Notes ----------  */}
      <FFormGroup
        name={'receiptMessage'}
        label={intl.get('pref.receipts.receiptMessage.field')}
        fastField={true}
      >
        <FTextArea name={'receiptMessage'} fastField={true} fill={true} />
      </FFormGroup>

      {/* ---------- Terms & Conditions ----------  */}
      <FFormGroup
        name={'termsConditions'}
        label={intl.get('pref.receipts.termsConditions.field')}
        fastField={true}
      >
        <FTextArea name={'termsConditions'} fastField={true} fill={true} />
      </FFormGroup>

      <Divider style={{ margin: '24px 0' }} />

      <h3 style={{ fontWeight: 600, marginBottom: 6 }}>
        POS &amp; Terminal Receipt Settings
      </h3>
      <p style={{ color: '#5c7080', fontSize: 12.5, marginBottom: 18 }}>
        Choose which company details, footer text, and barcode appear on POS
        thermal receipts (80mm / 58mm).
      </p>

      <FFormGroup
        name={'posPaperWidth'}
        label={'Default Thermal Paper Width'}
      >
        <Field name={'posPaperWidth'}>
          {({ field }: any) => (
            <HTMLSelect {...field}>
              <option value="80mm">80mm Thermal Roll</option>
              <option value="58mm">58mm Thermal Roll</option>
            </HTMLSelect>
          )}
        </Field>
      </FFormGroup>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px 18px',
          maxWidth: 600,
          marginBottom: 18,
        }}
      >
        <FSwitch name={'posShowLogo'} labelElement={'Show Company Logo'} />
        <FSwitch
          name={'posShowCompanyName'}
          labelElement={'Show Company Name'}
        />
        <FSwitch
          name={'posShowCompanyAddress'}
          labelElement={'Show Company Address'}
        />
        <FSwitch
          name={'posShowCompanyPhone'}
          labelElement={'Show Company Phone'}
        />
        <FSwitch
          name={'posShowCompanyTaxNumber'}
          labelElement={'Show Tax / TIN Number'}
        />
        <FSwitch name={'posShowCustomer'} labelElement={'Show Customer Name'} />
        <FSwitch
          name={'posShowPaymentMethod'}
          labelElement={'Show Payment Method'}
        />
        <FSwitch
          name={'posShowBarcode'}
          labelElement={'Show Barcode After Thank You'}
        />
      </div>

      <FFormGroup name={'posThankYouMessage'} label={'Thank You Message'}>
        <FInputGroup
          name={'posThankYouMessage'}
          placeholder={'THANK YOU FOR YOUR BUSINESS!'}
        />
      </FFormGroup>

      <FFormGroup name={'posFooterNote'} label={'Footer Note'}>
        <FInputGroup
          name={'posFooterNote'}
          placeholder={'Powered by BorngreatAccounting POS'}
        />
      </FFormGroup>

      <FFormGroup
        name={'posBarcodeValue'}
        label={'Barcode Value (optional)'}
        helperText={
          'Leave blank to automatically encode each Receipt # (e.g. REC-00006), or enter a custom code/store ID.'
        }
      >
        <FInputGroup
          name={'posBarcodeValue'}
          placeholder={'Auto (Receipt Number)'}
        />
      </FFormGroup>

      <CardFooterActions>
        <Button loading={isSubmitting} intent={Intent.PRIMARY} type="submit">
          <T id={'save'} />
        </Button>
        <Button onClick={handleCloseClick}>
          <T id={'close'} />
        </Button>
      </CardFooterActions>
    </Form>
  );
}

const CardFooterActions = styled.div`
  --x-color-border: #e0e7ea;

  .bp4-dark & {
    --x-color-border: rgba(255, 255, 255, 0.15);
  }
  padding-top: 16px;
  border-top: 1px solid var(--x-color-border);
  margin-top: 30px;

  .bp4-button {
    min-width: 70px;

    + .bp4-button {
      margin-left: 10px;
    }
  }
`;
