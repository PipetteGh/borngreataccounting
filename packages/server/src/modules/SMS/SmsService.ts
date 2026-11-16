import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ServiceError } from '@/modules/Items/ServiceError';
import { SmsIntegrationSettingsService } from './SmsIntegrationSettings.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly smsIntegrationSettings: SmsIntegrationSettingsService,
  ) {}

  /**
   * Sends an SMS message through the configured SMS provider
   * (Twilio, Hubtel, or SMSOnlineGH).
   * @param {string} to - Destination phone number.
   * @param {string} body - SMS body.
   * @returns {Promise<void>}
   */
  public async send(to: string, body: string): Promise<void> {
    const credentials = await this.smsIntegrationSettings.getCredentials();

    if (!credentials) {
      throw new ServiceError(
        'SMS_CREDENTIALS_NOT_CONFIGURED',
        'SMS provider credentials are not configured.',
      );
    }

    const parsed =
      parsePhoneNumberFromString(to) ||
      (!to.trim().startsWith('+')
        ? parsePhoneNumberFromString(to, 'GH')
        : undefined);

    if (!parsed || !parsed.isValid()) {
      throw new ServiceError(
        'CUSTOMER_SMS_NOTIFY_PHONE_INVALID',
        'The personal phone number is invalid.',
      );
    }

    const e164 = parsed.format('E.164');

    if (credentials.provider === 'hubtel') {
      const basicAuth = Buffer.from(
        `${credentials.clientId}:${credentials.clientSecret}`,
      ).toString('base64');

      const res = await fetch('https://smsc.hubtel.com/v1/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          From: credentials.senderId,
          To: e164,
          Content: body,
          RegisteredDelivery: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new ServiceError(
          'HUBTEL_SMS_FAILED',
          `Hubtel SMS request failed (${res.status}): ${errText}`,
        );
      }
      return;
    }

    if (credentials.provider === 'smsonlinegh') {
      const res = await fetch(
        'https://api.smsonlinegh.com/v5/message/sms/send',
        {
          method: 'POST',
          headers: {
            Authorization: `key ${credentials.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            text: body,
            type: 0,
            sender: credentials.senderId,
            destinations: [e164.replace(/^\+/, '')],
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new ServiceError(
          'SMSONLINEGH_SMS_FAILED',
          `SMSOnlineGH SMS request failed (${res.status}): ${errText}`,
        );
      }
      return;
    }

    const client = new Twilio(credentials.accountSid, credentials.authToken);

    await client.messages.create({
      from: credentials.fromNumber,
      to: e164,
      body,
    });
  }
}
