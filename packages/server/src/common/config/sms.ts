import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  provider: process.env.SMS_PROVIDER || 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_NUMBER,
  hubtelClientId: process.env.HUBTEL_CLIENT_ID,
  hubtelClientSecret: process.env.HUBTEL_CLIENT_SECRET,
  hubtelSenderId: process.env.HUBTEL_SENDER_ID,
  smsonlineghApiKey: process.env.SMSONLINEGH_API_KEY,
  smsonlineghSenderId: process.env.SMSONLINEGH_SENDER_ID,
}));
