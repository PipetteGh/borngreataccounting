import { Intent, Button, Callout, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { flatten, unflatten } from 'flat';
import { Formik, Form, FormikHelpers } from 'formik';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { SMSIntegrationFormSchema } from './SMSIntegrationForm.schema';
import { useSMSIntegrationContext } from './SMSIntegrationProvider';
import type { SMSIntegrationFormValues, SmsProviderType } from './types';
import {
  AppToaster,
  CardFooterActions,
  FFormGroup,
  FInputGroup,
  FormattedMessage as T,
} from '@/components';
import { transformToForm } from '@/utils';

const defaultFormValues: SMSIntegrationFormValues = {
  smsIntegration: {
    smsProvider: 'twilio',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioFromNumber: '',
    hubtelClientId: '',
    hubtelClientSecret: '',
    hubtelSenderId: '',
    smsonlineghApiKey: '',
    smsonlineghSenderId: '',
    isEnvCredentialsActive: false,
  },
};

/**
 * SMS Integration form.
 */
export function SMSIntegrationForm(): React.ReactElement {
  const { allSettings, saveSettingMutate } = useSMSIntegrationContext();

  const allSettingsFlat = (allSettings ? flatten(allSettings) : {}) as Record<
    string,
    unknown
  >;
  const defaultFormValuesFlat = flatten(defaultFormValues) as Record<
    string,
    unknown
  >;
  const initialValues = unflatten({
    ...defaultFormValuesFlat,
    ...transformToForm(allSettingsFlat, defaultFormValuesFlat),
  }) as SMSIntegrationFormValues;

  const handleFormSubmit = (
    values: SMSIntegrationFormValues,
    { setSubmitting }: FormikHelpers<SMSIntegrationFormValues>,
  ) => {
    const options = [
      {
        group: 'sms-integration',
        key: 'sms_provider',
        value: values.smsIntegration.smsProvider ?? 'twilio',
      },
      {
        group: 'sms-integration',
        key: 'twilio_account_sid',
        value: values.smsIntegration.twilioAccountSid ?? '',
      },
      {
        group: 'sms-integration',
        key: 'twilio_auth_token',
        value: values.smsIntegration.twilioAuthToken ?? '',
      },
      {
        group: 'sms-integration',
        key: 'twilio_from_number',
        value: values.smsIntegration.twilioFromNumber ?? '',
      },
      {
        group: 'sms-integration',
        key: 'hubtel_client_id',
        value: values.smsIntegration.hubtelClientId ?? '',
      },
      {
        group: 'sms-integration',
        key: 'hubtel_client_secret',
        value: values.smsIntegration.hubtelClientSecret ?? '',
      },
      {
        group: 'sms-integration',
        key: 'hubtel_sender_id',
        value: values.smsIntegration.hubtelSenderId ?? '',
      },
      {
        group: 'sms-integration',
        key: 'smsonlinegh_api_key',
        value: values.smsIntegration.smsonlineghApiKey ?? '',
      },
      {
        group: 'sms-integration',
        key: 'smsonlinegh_sender_id',
        value: values.smsIntegration.smsonlineghSenderId ?? '',
      },
    ];
    setSubmitting(true);

    const onSuccess = () => {
      AppToaster.show({
        message: intl.get('sms_integration.saved_success_message'),
        intent: Intent.SUCCESS,
      });
      setSubmitting(false);
    };
    const onError = () => {
      setSubmitting(false);
    };
    saveSettingMutate({ options }).then(onSuccess).catch(onError);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={SMSIntegrationFormSchema}
      onSubmit={handleFormSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        const provider = (values.smsIntegration.smsProvider || 'twilio') as SmsProviderType;
        return (
        <FormRoot>
          {values.smsIntegration.isEnvCredentialsActive && (
            <Callout intent={Intent.SUCCESS}>
              <T id={'sms_integration.env_credentials_active'} />
            </Callout>
          )}

          <FormGroup label="SMS Provider">
            <HTMLSelect
              fill
              value={provider}
              onChange={(e) =>
                setFieldValue('smsIntegration.smsProvider', e.target.value)
              }
            >
              <option value="twilio">Twilio</option>
              <option value="hubtel">Hubtel SMS (Ghana)</option>
              <option value="smsonlinegh">SMSOnlineGH (Ghana)</option>
            </HTMLSelect>
          </FormGroup>

          {provider === 'twilio' && (
            <>
              <FFormGroup
                name={'smsIntegration.twilioAccountSid'}
                label={intl.get('sms_integration.twilio_account_sid')}
              >
                <FInputGroup name={'smsIntegration.twilioAccountSid'} />
              </FFormGroup>

              <FFormGroup
                name={'smsIntegration.twilioAuthToken'}
                label={intl.get('sms_integration.twilio_auth_token')}
              >
                <FInputGroup
                  name={'smsIntegration.twilioAuthToken'}
                  type={'password'}
                />
              </FFormGroup>

              <FFormGroup
                name={'smsIntegration.twilioFromNumber'}
                label={intl.get('sms_integration.twilio_from_number')}
              >
                <FInputGroup name={'smsIntegration.twilioFromNumber'} />
              </FFormGroup>
            </>
          )}

          {provider === 'hubtel' && (
            <>
              <FFormGroup
                name={'smsIntegration.hubtelClientId'}
                label="Hubtel Client ID"
              >
                <FInputGroup
                  name={'smsIntegration.hubtelClientId'}
                  placeholder="Enter Hubtel Client ID"
                />
              </FFormGroup>

              <FFormGroup
                name={'smsIntegration.hubtelClientSecret'}
                label="Hubtel Client Secret"
              >
                <FInputGroup
                  name={'smsIntegration.hubtelClientSecret'}
                  type={'password'}
                  placeholder="Enter Hubtel Client Secret"
                />
              </FFormGroup>

              <FFormGroup
                name={'smsIntegration.hubtelSenderId'}
                label="Hubtel Sender ID"
              >
                <FInputGroup
                  name={'smsIntegration.hubtelSenderId'}
                  placeholder="e.g. YourCompany (max 11 chars)"
                />
              </FFormGroup>
            </>
          )}

          {provider === 'smsonlinegh' && (
            <>
              <FFormGroup
                name={'smsIntegration.smsonlineghApiKey'}
                label="SMSOnlineGH API Key"
              >
                <FInputGroup
                  name={'smsIntegration.smsonlineghApiKey'}
                  type={'password'}
                  placeholder="Enter SMSOnlineGH API Key"
                />
              </FFormGroup>

              <FFormGroup
                name={'smsIntegration.smsonlineghSenderId'}
                label="SMSOnlineGH Sender ID"
              >
                <FInputGroup
                  name={'smsIntegration.smsonlineghSenderId'}
                  placeholder="Approved Sender Name (e.g. Borngreat)"
                />
              </FFormGroup>
            </>
          )}

          <CardFooterActions>
            <Button
              intent={Intent.PRIMARY}
              loading={isSubmitting}
              type="submit"
            >
              <T id={'save'} />
            </Button>
          </CardFooterActions>
        </FormRoot>
        );
      }}
    </Formik>
  );
}

const FormRoot = styled(Form)`
  padding: 25px;
`;
