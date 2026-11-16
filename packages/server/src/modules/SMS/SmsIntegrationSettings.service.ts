import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SETTINGS_PROVIDER } from '@/modules/Settings/Settings.types';
import { SettingsStore } from '@/modules/Settings/SettingsStore';
import { SmsCredentials, SmsProvider } from './SMS.types';

@Injectable()
export class SmsIntegrationSettingsService {
  constructor(
    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,

    private readonly config: ConfigService,
  ) {}

  /**
   * Resolves the active SMS provider and its credentials.
   * Organization settings override global environment variables.
   * @returns {Promise<SmsCredentials | null>}
   */
  public async getCredentials(): Promise<SmsCredentials | null> {
    const store = await this.settingsStore();

    const rawProvider = (
      this.getSetting(store, 'sms-integration', 'sms_provider') ||
      this.config.get<string>('sms.provider') ||
      'twilio'
    ).toLowerCase() as SmsProvider;

    if (rawProvider === 'hubtel') {
      const clientId =
        this.getSetting(store, 'sms-integration', 'hubtel_client_id') ||
        this.config.get<string>('sms.hubtelClientId');
      const clientSecret =
        this.getSetting(store, 'sms-integration', 'hubtel_client_secret') ||
        this.config.get<string>('sms.hubtelClientSecret');
      const senderId =
        this.getSetting(store, 'sms-integration', 'hubtel_sender_id') ||
        this.config.get<string>('sms.hubtelSenderId');

      if (!clientId || !clientSecret || !senderId) {
        return null;
      }
      return { provider: 'hubtel', clientId, clientSecret, senderId };
    }

    if (rawProvider === 'smsonlinegh') {
      const apiKey =
        this.getSetting(store, 'sms-integration', 'smsonlinegh_api_key') ||
        this.config.get<string>('sms.smsonlineghApiKey');
      const senderId =
        this.getSetting(store, 'sms-integration', 'smsonlinegh_sender_id') ||
        this.config.get<string>('sms.smsonlineghSenderId');

      if (!apiKey || !senderId) {
        return null;
      }
      return { provider: 'smsonlinegh', apiKey, senderId };
    }

    const accountSid =
      this.getSetting(store, 'sms-integration', 'twilio_account_sid') ||
      this.config.get<string>('sms.accountSid');

    const authToken =
      this.getSetting(store, 'sms-integration', 'twilio_auth_token') ||
      this.config.get<string>('sms.authToken');

    const fromNumber =
      this.getSetting(store, 'sms-integration', 'twilio_from_number') ||
      this.config.get<string>('sms.fromNumber');

    if (!accountSid || !authToken || !fromNumber) {
      return null;
    }

    return { provider: 'twilio', accountSid, authToken, fromNumber };
  }

  /**
   * Retrieves a single setting value from the store.
   */
  private getSetting(
    store: SettingsStore,
    group: string,
    key: string,
  ): string | null {
    const value = store.get({ group, key });
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
