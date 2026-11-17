import { SmsService } from './SmsService';

describe('SmsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends SMS via Hubtel with Basic Auth and E.164 Ghana number', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => '{}',
    });
    (global as any).fetch = fetchMock;

    const settings = {
      getCredentials: jest.fn().mockResolvedValue({
        provider: 'hubtel',
        clientId: 'my-client-id',
        clientSecret: 'my-client-secret',
        senderId: 'Borngreat',
      }),
    } as any;

    const service = new SmsService(settings);
    await service.send('0244123456', 'Test Hubtel SMS');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://smsc.hubtel.com/v1/messages/send');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from('my-client-id:my-client-secret').toString('base64')}`,
    );
    expect(JSON.parse(init.body)).toEqual({
      From: 'Borngreat',
      To: '+233244123456',
      Content: 'Test Hubtel SMS',
      RegisteredDelivery: true,
    });
  });

  it('sends SMS via SMSOnlineGH with key Authorization and destinations', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    (global as any).fetch = fetchMock;

    const settings = {
      getCredentials: jest.fn().mockResolvedValue({
        provider: 'smsonlinegh',
        apiKey: 'secret-api-key',
        senderId: 'Borngreat',
      }),
    } as any;

    const service = new SmsService(settings);
    await service.send('+233501234567', 'Test SMSOnlineGH');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.smsonlinegh.com/v5/message/sms/send');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('key secret-api-key');
    expect(JSON.parse(init.body)).toEqual({
      text: 'Test SMSOnlineGH',
      type: 0,
      sender: 'Borngreat',
      destinations: ['233501234567'],
    });
  });
});
