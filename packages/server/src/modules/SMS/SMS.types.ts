export type SmsProvider = 'twilio' | 'hubtel' | 'smsonlinegh';

export interface SmsJobPayload {
  to: string;
  body: string;
  organizationId: string;
  userId: number;
}

export type SmsCredentials =
  | {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      fromNumber: string;
    }
  | {
      provider: 'hubtel';
      clientId: string;
      clientSecret: string;
      senderId: string;
    }
  | {
      provider: 'smsonlinegh';
      apiKey: string;
      senderId: string;
    };
