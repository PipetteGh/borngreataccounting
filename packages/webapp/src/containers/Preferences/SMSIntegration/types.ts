export type SmsProviderType = 'twilio' | 'hubtel' | 'smsonlinegh';

export interface SMSIntegrationFormValues {
  smsIntegration: {
    smsProvider: SmsProviderType;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioFromNumber: string;
    hubtelClientId: string;
    hubtelClientSecret: string;
    hubtelSenderId: string;
    smsonlineghApiKey: string;
    smsonlineghSenderId: string;
    isEnvCredentialsActive?: boolean;
  };
}
