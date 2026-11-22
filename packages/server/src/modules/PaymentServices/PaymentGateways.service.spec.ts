import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { PaymentGatewaysService } from './PaymentGateways.service';

describe('PaymentGatewaysService (Paystack, Flutterwave, Hubtel)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createServiceWithRow(row: any) {
    const queryMock = {
      findOne: jest.fn().mockResolvedValue(row),
      whereIn: jest.fn().mockResolvedValue(row ? [row] : []),
    };
    const modelProxy = jest.fn(() => ({
      query: () => queryMock,
    }));
    const clsMock = {
      get: jest.fn().mockReturnValue('org_test_123'),
      set: jest.fn(),
    };
    const service = new PaymentGatewaysService(
      modelProxy as any,
      clsMock as any,
    );
    return { service, queryMock, clsMock };
  }

  it('initializes Paystack checkout session with amount in subunits (pesewas/kobo) and Bearer auth', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          reference: 'BGA-PAYSTACK-01',
          authorization_url: 'https://checkout.paystack.com/test123',
        },
      }),
    });
    (global as any).fetch = fetchMock;

    const { service } = createServiceWithRow({
      id: 1,
      service: 'Paystack',
      paymentEnabled: true,
      options: {
        publicKey: 'pk_test_1234567890',
        secretKey: 'sk_test_1234567890',
        testMode: true,
      },
    });

    const result = await service.initiateCheckout('paystack', {
      amount: 250.5,
      currency: 'GHS',
      customerEmail: 'customer@borngreat.com',
      reference: 'BGA-PAYSTACK-01',
      callbackUrl: 'https://app.borngreat.com/payment/callback',
    });

    expect(result).toEqual({
      provider: 'paystack',
      reference: 'BGA-PAYSTACK-01',
      checkoutUrl: 'https://checkout.paystack.com/test123',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.paystack.co/transaction/initialize');
    expect(init.headers.Authorization).toBe('Bearer sk_test_1234567890');
    expect(JSON.parse(init.body)).toMatchObject({
      email: 'customer@borngreat.com',
      amount: 25050,
      currency: 'GHS',
      reference: 'BGA-PAYSTACK-01',
    });
  });

  it('initializes Flutterwave v3 checkout session with Bearer auth and customer payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: {
          link: 'https://ravemodal-dev.herokuapp.com/v3/hosted/pay/flw123',
        },
      }),
    });
    (global as any).fetch = fetchMock;

    const { service } = createServiceWithRow({
      id: 2,
      service: 'Flutterwave',
      paymentEnabled: true,
      options: {
        publicKey: 'FLWPUBK_TEST-12345',
        secretKey: 'FLWSECK_TEST-67890',
        testMode: true,
      },
    });

    const result = await service.initiateCheckout('flutterwave', {
      amount: 420,
      currency: 'GHS',
      customerEmail: 'ama@borngreat.com',
      customerName: 'Ama Mensah',
      reference: 'BGA-FLW-01',
      returnUrl: 'https://app.borngreat.com/payment/return',
    });

    expect(result).toEqual({
      provider: 'flutterwave',
      reference: 'BGA-FLW-01',
      checkoutUrl: 'https://ravemodal-dev.herokuapp.com/v3/hosted/pay/flw123',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.flutterwave.com/v3/payments');
    expect(init.headers.Authorization).toBe('Bearer FLWSECK_TEST-67890');
    expect(JSON.parse(init.body)).toMatchObject({
      tx_ref: 'BGA-FLW-01',
      amount: 420,
      currency: 'GHS',
      customer: {
        email: 'ama@borngreat.com',
        name: 'Ama Mensah',
      },
    });
  });

  it('initializes Hubtel Online Checkout with Basic Auth and merchantAccountNumber', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        responseCode: '0000',
        data: {
          checkoutUrl: 'https://pay.hubtel.com/checkout/hub123',
        },
      }),
    });
    (global as any).fetch = fetchMock;

    const { service } = createServiceWithRow({
      id: 3,
      service: 'Hubtel',
      paymentEnabled: true,
      options: {
        clientId: 'hubtel_client_id',
        clientSecret: 'hubtel_client_secret',
        merchantAccountNumber: '2019999',
      },
    });

    const result = await service.initiateCheckout('hubtel', {
      amount: 100,
      currency: 'GHS',
      customerEmail: 'kofi@borngreat.com',
      reference: 'BGA-HUB-01',
      callbackUrl: 'https://app.borngreat.com/hubtel/callback',
    });

    expect(result).toEqual({
      provider: 'hubtel',
      reference: 'BGA-HUB-01',
      checkoutUrl: 'https://pay.hubtel.com/checkout/hub123',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://payproxyapi.hubtel.com/items/initiate');
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from('hubtel_client_id:hubtel_client_secret').toString('base64')}`,
    );
    expect(JSON.parse(init.body)).toMatchObject({
      totalAmount: 100,
      merchantAccountNumber: '2019999',
      clientReference: 'BGA-HUB-01',
    });
  });

  it('verifies Paystack HMAC-SHA512 webhook signature and propagates organizationId into CLS', async () => {
    const secretKey = 'sk_test_paystack_webhook_secret';
    const { service, clsMock } = createServiceWithRow({
      id: 1,
      service: 'Paystack',
      paymentEnabled: true,
      options: {
        publicKey: 'pk_test_1',
        secretKey,
      },
    });

    const payload = { event: 'charge.success', data: { reference: 'REF-1' } };
    const validSig = createHmac('sha512', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await service.verifyWebhook(
      'paystack',
      { 'x-paystack-signature': validSig },
      payload,
      'tenant_org_42',
    );

    expect(clsMock.set).toHaveBeenCalledWith('organizationId', 'tenant_org_42');
    expect(res).toEqual({
      received: true,
      provider: 'paystack',
      organizationId: 'tenant_org_42',
      event: 'charge.success',
    });

    await expect(
      service.verifyWebhook(
        'paystack',
        { 'x-paystack-signature': 'invalid_sig' },
        payload,
        'tenant_org_42',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('verifies Flutterwave verif-hash webhook header', async () => {
    const { service } = createServiceWithRow({
      id: 2,
      service: 'Flutterwave',
      paymentEnabled: true,
      options: {
        publicKey: 'FLWPUBK_TEST-1',
        secretKey: 'FLWSECK_TEST-1',
        webhookHash: 'my_flw_secret_hash',
      },
    });

    const res = await service.verifyWebhook(
      'flutterwave',
      { 'verif-hash': 'my_flw_secret_hash' },
      { event: 'charge.completed' },
      'tenant_org_42',
    );
    expect(res.received).toBe(true);
    expect(res.event).toBe('charge.completed');

    await expect(
      service.verifyWebhook(
        'flutterwave',
        { 'verif-hash': 'wrong_hash' },
        { event: 'charge.completed' },
        'tenant_org_42',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
