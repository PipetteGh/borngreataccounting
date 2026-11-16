import * as Yup from 'yup';

const Schema = Yup.object().shape({
  smsIntegration: Yup.object({
    smsProvider: Yup.string().oneOf(['twilio', 'hubtel', 'smsonlinegh']).nullable(),
    twilioAccountSid: Yup.string().nullable(),
    twilioAuthToken: Yup.string().nullable(),
    twilioFromNumber: Yup.string().nullable(),
    hubtelClientId: Yup.string().nullable(),
    hubtelClientSecret: Yup.string().nullable(),
    hubtelSenderId: Yup.string().nullable(),
    smsonlineghApiKey: Yup.string().nullable(),
    smsonlineghSenderId: Yup.string().nullable(),
  }),
});

export const SMSIntegrationFormSchema = Schema;
