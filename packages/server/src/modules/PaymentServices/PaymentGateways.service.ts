import { createHmac, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PaymentIntegration } from './models/PaymentIntegration.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

export type PaymentGatewayProvider = 'paystack' | 'flutterwave' | 'hubtel';

export interface GatewayConfigInput {
  paymentEnabled?: boolean;
  testMode?: boolean;
  publicKey?: string;
  secretKey?: string;
  encryptionKey?: string;
  webhookHash?: string;
  clientId?: string;
  clientSecret?: string;
  merchantAccountNumber?: string;
  bankAccountId?: number;
  clearingAccountId?: number;
}

export interface GatewayCheckoutInput {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  reference?: string;
  description?: string;
  callbackUrl?: string;
  returnUrl?: string;
  cancellationUrl?: string;
  metadata?: Record<string, any>;
}

const PROVIDER_META: Record<
  PaymentGatewayProvider,
  {
    serviceName: string;
    displayName: string;
    supportedCurrencies: string[];
  }
> = {
  paystack: {
    serviceName: 'Paystack',
    displayName: 'Paystack',
    supportedCurrencies: ['GHS', 'NGN', 'USD', 'ZAR', 'KES'],
  },
  flutterwave: {
    serviceName: 'Flutterwave',
    displayName: 'Flutterwave',
    supportedCurrencies: ['GHS', 'NGN', 'USD', 'EUR', 'GBP', 'KES', 'ZAR'],
  },
  hubtel: {
    serviceName: 'Hubtel',
    displayName: 'Hubtel (Mobile Money & Cards)',
    supportedCurrencies: ['GHS'],
  },
};

@Injectable()
export class PaymentGatewaysService {
  constructor(
    @Inject(PaymentIntegration.name)
    private readonly paymentIntegrationModel: TenantModelProxy<
      typeof PaymentIntegration
    >,
    private readonly cls: ClsService,
  ) {}

  private resolveProvider(provider: string): PaymentGatewayProvider {
    const normalized = (provider || '').toLowerCase() as PaymentGatewayProvider;
    if (!PROVIDER_META[normalized]) {
      throw new BadRequestException(`Unsupported payment gateway: ${provider}`);
    }
    return normalized;
  }

  private maskSecret(value?: string): string | null {
    if (!value) return null;
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
  }

  private isConfigured(
    provider: PaymentGatewayProvider,
    options: Record<string, any>,
  ): boolean {
    if (provider === 'paystack') {
      return Boolean(options.publicKey && options.secretKey);
    }
    if (provider === 'flutterwave') {
      return Boolean(options.publicKey && options.secretKey);
    }
    return Boolean(
      options.clientId && options.clientSecret && options.merchantAccountNumber,
    );
  }

  public async getGatewaysState() {
    const organizationId = this.cls.get<string>('organizationId') || 'default';
    const rows = await this.paymentIntegrationModel()
      .query()
      .whereIn(
        'service',
        Object.values(PROVIDER_META).map((m) => m.serviceName),
      );

    const byService = new Map<string, PaymentIntegration>();
    rows.forEach((row) => byService.set(row.service, row));

    return (Object.keys(PROVIDER_META) as PaymentGatewayProvider[]).map(
      (provider) => {
        const meta = PROVIDER_META[provider];
        const row = byService.get(meta.serviceName);
        const options = (row?.options || {}) as Record<string, any>;
        const configured = this.isConfigured(provider, options);

        return {
          provider,
          service: meta.serviceName,
          displayName: meta.displayName,
          supportedCurrencies: meta.supportedCurrencies,
          id: row?.id || null,
          configured,
          paymentEnabled: Boolean(row?.paymentEnabled && configured),
          testMode: Boolean(options.testMode),
          publicKey: options.publicKey || '',
          clientId: options.clientId || '',
          merchantAccountNumber: options.merchantAccountNumber || '',
          hasSecretKey: Boolean(options.secretKey || options.clientSecret),
          secretKeyMasked: this.maskSecret(
            options.secretKey || options.clientSecret,
          ),
          hasEncryptionKey: Boolean(options.encryptionKey),
          hasWebhookHash: Boolean(options.webhookHash),
          bankAccountId: options.bankAccountId ?? null,
          clearingAccountId: options.clearingAccountId ?? null,
          webhookUrl: `/api/payment-services/gateways/webhooks/${provider}/${organizationId}`,
        };
      },
    );
  }

  public async saveGatewayConfig(
    providerParam: string,
    input: GatewayConfigInput,
  ) {
    const provider = this.resolveProvider(providerParam);
    const meta = PROVIDER_META[provider];

    const existing = await this.paymentIntegrationModel()
      .query()
      .findOne({ service: meta.serviceName });

    const prevOptions = (existing?.options || {}) as Record<string, any>;
    const nextOptions: Record<string, any> = {
      ...prevOptions,
      testMode:
        input.testMode !== undefined
          ? Boolean(input.testMode)
          : Boolean(prevOptions.testMode),
      publicKey:
        input.publicKey !== undefined ? input.publicKey.trim() : prevOptions.publicKey,
      clientId:
        input.clientId !== undefined ? input.clientId.trim() : prevOptions.clientId,
      merchantAccountNumber:
        input.merchantAccountNumber !== undefined
          ? input.merchantAccountNumber.trim()
          : prevOptions.merchantAccountNumber,
      bankAccountId:
        input.bankAccountId !== undefined
          ? input.bankAccountId
          : prevOptions.bankAccountId,
      clearingAccountId:
        input.clearingAccountId !== undefined
          ? input.clearingAccountId
          : prevOptions.clearingAccountId,
    };

    if (input.secretKey && !input.secretKey.includes('••••')) {
      nextOptions.secretKey = input.secretKey.trim();
    }
    if (input.clientSecret && !input.clientSecret.includes('••••')) {
      nextOptions.clientSecret = input.clientSecret.trim();
    }
    if (input.encryptionKey && !input.encryptionKey.includes('••••')) {
      nextOptions.encryptionKey = input.encryptionKey.trim();
    }
    if (input.webhookHash && !input.webhookHash.includes('••••')) {
      nextOptions.webhookHash = input.webhookHash.trim();
    }

    const configured = this.isConfigured(provider, nextOptions);
    const paymentEnabled =
      input.paymentEnabled !== undefined
        ? Boolean(input.paymentEnabled && configured)
        : configured;

    if (existing) {
      await this.paymentIntegrationModel()
        .query()
        .findById(existing.id)
        .patch({
          name: meta.displayName,
          paymentEnabled,
          payoutEnabled: paymentEnabled,
          accountId:
            nextOptions.merchantAccountNumber ||
            nextOptions.publicKey ||
            nextOptions.clientId ||
            provider,
          options: nextOptions,
        });
    } else {
      await this.paymentIntegrationModel().query().insert({
        name: meta.displayName,
        service: meta.serviceName,
        paymentEnabled,
        payoutEnabled: paymentEnabled,
        accountId:
          nextOptions.merchantAccountNumber ||
          nextOptions.publicKey ||
          nextOptions.clientId ||
          provider,
        options: nextOptions,
      });
    }

    const all = await this.getGatewaysState();
    return all.find((g) => g.provider === provider);
  }

  public async deleteGatewayConfig(providerParam: string) {
    const provider = this.resolveProvider(providerParam);
    const meta = PROVIDER_META[provider];

    const existing = await this.paymentIntegrationModel()
      .query()
      .findOne({ service: meta.serviceName });

    if (!existing) {
      throw new NotFoundException(`${meta.displayName} is not configured.`);
    }

    await this.paymentIntegrationModel().query().deleteById(existing.id);
    return { deleted: true, provider };
  }

  public async initiateCheckout(
    providerParam: string,
    payload: GatewayCheckoutInput,
  ) {
    const provider = this.resolveProvider(providerParam);
    const meta = PROVIDER_META[provider];
    const row = await this.paymentIntegrationModel()
      .query()
      .findOne({ service: meta.serviceName });

    const options = (row?.options || {}) as Record<string, any>;
    if (!row?.paymentEnabled || !this.isConfigured(provider, options)) {
      throw new BadRequestException(
        `${meta.displayName} is not enabled or configured for this organization.`,
      );
    }

    const reference = payload.reference || `BGA-${randomUUID().slice(0, 12)}`;
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    if (provider === 'paystack') {
      const response = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: payload.customerEmail,
            amount: Math.round(amount * 100),
            currency: (payload.currency || 'GHS').toUpperCase(),
            reference,
            callback_url: payload.callbackUrl || payload.returnUrl,
            metadata: payload.metadata || {},
          }),
        },
      );
      const data: any = await response.json();
      if (!response.ok || !data?.status) {
        throw new BadRequestException(
          data?.message || 'Failed to initialize Paystack checkout.',
        );
      }
      return {
        provider,
        reference: data.data?.reference || reference,
        checkoutUrl: data.data?.authorization_url,
      };
    }

    if (provider === 'flutterwave') {
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount,
          currency: (payload.currency || 'GHS').toUpperCase(),
          redirect_url: payload.returnUrl || payload.callbackUrl,
          customer: {
            email: payload.customerEmail,
            name: payload.customerName || payload.customerEmail,
          },
          customizations: {
            title: payload.description || 'BorngreatAccounting Invoice Payment',
          },
          meta: payload.metadata || {},
        }),
      });
      const data: any = await response.json();
      if (!response.ok || data?.status !== 'success') {
        throw new BadRequestException(
          data?.message || 'Failed to initialize Flutterwave checkout.',
        );
      }
      return {
        provider,
        reference,
        checkoutUrl: data.data?.link,
      };
    }

    // Hubtel Online Checkout
    const basicAuth = Buffer.from(
      `${options.clientId}:${options.clientSecret}`,
    ).toString('base64');
    const response = await fetch(
      'https://payproxyapi.hubtel.com/items/initiate',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: amount,
          description:
            payload.description || 'BorngreatAccounting Invoice Payment',
          callbackUrl: payload.callbackUrl || payload.returnUrl,
          returnUrl: payload.returnUrl || payload.callbackUrl,
          cancellationUrl:
            payload.cancellationUrl || payload.returnUrl || payload.callbackUrl,
          merchantAccountNumber: options.merchantAccountNumber,
          clientReference: reference,
        }),
      },
    );
    const data: any = await response.json();
    if (!response.ok || data?.responseCode !== '0000') {
      throw new BadRequestException(
        data?.message || 'Failed to initialize Hubtel checkout.',
      );
    }
    return {
      provider,
      reference,
      checkoutUrl: data.data?.checkoutUrl || data.data?.checkoutDirectUrl,
    };
  }

  public async verifyWebhook(
    providerParam: string,
    headers: Record<string, any>,
    body: any,
  ) {
    const provider = this.resolveProvider(providerParam);
    const meta = PROVIDER_META[provider];
    const row = await this.paymentIntegrationModel()
      .query()
      .findOne({ service: meta.serviceName });

    const options = (row?.options || {}) as Record<string, any>;

    if (provider === 'paystack' && options.secretKey) {
      const signature = headers['x-paystack-signature'];
      const hash = createHmac('sha512', options.secretKey)
        .update(JSON.stringify(body || {}))
        .digest('hex');
      if (!signature || signature !== hash) {
        throw new BadRequestException('Invalid Paystack webhook signature.');
      }
    }

    if (provider === 'flutterwave' && options.webhookHash) {
      const verifHash = headers['verif-hash'];
      if (!verifHash || verifHash !== options.webhookHash) {
        throw new BadRequestException('Invalid Flutterwave webhook hash.');
      }
    }

    return {
      received: true,
      provider,
      event: body?.event || body?.Status || 'processed',
    };
  }
}
