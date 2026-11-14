import {
  Button,
  Card,
  Classes,
  Dialog,
  FormGroup,
  InputGroup,
  Intent,
  Spinner,
  Switch,
  Tag,
  Text,
} from '@blueprintjs/core';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppToaster } from '@/components';
import { useAuthOrganizationId, useAuthToken } from '@/hooks/state';
import { transformToCamelCase } from '@/utils';

type GatewayProvider = 'paystack' | 'flutterwave' | 'hubtel';

interface GatewayItem {
  provider: GatewayProvider;
  service: string;
  displayName: string;
  supportedCurrencies: string[];
  id: number | null;
  configured: boolean;
  paymentEnabled: boolean;
  testMode: boolean;
  publicKey: string;
  clientId: string;
  merchantAccountNumber: string;
  hasSecretKey: boolean;
  secretKeyMasked: string | null;
  hasEncryptionKey: boolean;
  hasWebhookHash: boolean;
  webhookUrl: string;
}

interface GatewayFormState {
  paymentEnabled: boolean;
  testMode: boolean;
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  webhookHash: string;
  clientId: string;
  clientSecret: string;
  merchantAccountNumber: string;
}

const GATEWAY_META: Record<
  GatewayProvider,
  { tagline: string; color: string }
> = {
  paystack: {
    tagline:
      'Accept Cards, Mobile Money (MTN, Telecel, AT), and Bank Transfers across Ghana, Nigeria, South Africa & Kenya.',
    color: '#00C3F7',
  },
  flutterwave: {
    tagline:
      'Accept global Cards, Mobile Money, USSD, and multi-currency payouts across Africa, UK, EU & US.',
    color: '#F5A623',
  },
  hubtel: {
    tagline:
      'Accept Ghana Mobile Money (MTN MoMo, Telecel Cash, AT Money), GhQR, and Visa/Mastercard via Hubtel.',
    color: '#00A859',
  },
};

export function RegionalPaymentGateways() {
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();
  const apiRequest = useMemo(() => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (organizationId) {
      headers['organization-id'] = organizationId;
    }
    return axios.create({ baseURL: '/api', headers });
  }, [token, organizationId]);
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<GatewayItem | null>(null);
  const [form, setForm] = useState<GatewayFormState>({
    paymentEnabled: true,
    testMode: true,
    publicKey: '',
    secretKey: '',
    encryptionKey: '',
    webhookHash: '',
    clientId: '',
    clientSecret: '',
    merchantAccountNumber: '',
  });

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get('/payment-services/gateways');
      const items = transformToCamelCase(res.data) as GatewayItem[];
      setGateways(Array.isArray(items) ? items : []);
    } catch {
      setGateways([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const openEditor = (item: GatewayItem) => {
    setEditing(item);
    setForm({
      paymentEnabled: item.configured ? item.paymentEnabled : true,
      testMode: item.testMode,
      publicKey: item.publicKey || '',
      secretKey: '',
      encryptionKey: '',
      webhookHash: '',
      clientId: item.clientId || '',
      clientSecret: '',
      merchantAccountNumber: item.merchantAccountNumber || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      setSaving(true);
      const payload: Record<string, any> = {
        paymentEnabled: form.paymentEnabled,
        testMode: form.testMode,
      };
      if (editing.provider === 'hubtel') {
        payload.clientId = form.clientId;
        payload.merchantAccountNumber = form.merchantAccountNumber;
        if (form.clientSecret) payload.clientSecret = form.clientSecret;
      } else {
        payload.publicKey = form.publicKey;
        if (form.secretKey) payload.secretKey = form.secretKey;
        if (editing.provider === 'flutterwave') {
          if (form.encryptionKey) payload.encryptionKey = form.encryptionKey;
          if (form.webhookHash) payload.webhookHash = form.webhookHash;
        }
      }

      await apiRequest.post(
        `/payment-services/gateways/${editing.provider}`,
        payload,
      );
      AppToaster.show({
        intent: Intent.SUCCESS,
        message: `${editing.displayName} configuration saved.`,
      });
      setEditing(null);
      await loadGateways();
    } catch (err: any) {
      AppToaster.show({
        intent: Intent.DANGER,
        message:
          err?.response?.data?.message ||
          `Failed to save ${editing.displayName} configuration.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (item: GatewayItem) => {
    try {
      await apiRequest.delete(`/payment-services/gateways/${item.provider}`);
      AppToaster.show({
        intent: Intent.PRIMARY,
        message: `${item.displayName} disconnected.`,
      });
      await loadGateways();
    } catch {
      AppToaster.show({
        intent: Intent.DANGER,
        message: `Failed to disconnect ${item.displayName}.`,
      });
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 20 }}>
        <Spinner size={20} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 6 }}>
        African &amp; Mobile Money Gateways (Paystack, Flutterwave &amp; Hubtel)
      </h4>
      <Text className={Classes.TEXT_MUTED} style={{ marginBottom: 14, display: 'block' }}>
        Connect regional card and Mobile Money payment providers to accept online invoice payments.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {gateways.map((item) => {
          const meta = GATEWAY_META[item.provider];
          return (
            <Card key={item.provider} elevation={1} style={{ padding: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: meta.color,
                        display: 'inline-block',
                      }}
                    />
                    <strong style={{ fontSize: 15 }}>{item.displayName}</strong>
                    {item.paymentEnabled ? (
                      <Tag intent={Intent.SUCCESS} minimal>
                        Connected
                      </Tag>
                    ) : item.configured ? (
                      <Tag intent={Intent.WARNING} minimal>
                        Paused
                      </Tag>
                    ) : (
                      <Tag minimal>Not Configured</Tag>
                    )}
                    {item.configured && item.testMode && (
                      <Tag intent={Intent.PRIMARY} minimal>
                        Test Mode
                      </Tag>
                    )}
                  </div>
                  <Text className={Classes.TEXT_MUTED} style={{ display: 'block', marginBottom: 8 }}>
                    {meta.tagline}
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {item.supportedCurrencies.map((cur) => (
                      <Tag key={cur} minimal round>
                        {cur}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    intent={item.configured ? Intent.NONE : Intent.PRIMARY}
                    text={item.configured ? 'Configure' : 'Connect'}
                    onClick={() => openEditor(item)}
                  />
                  {item.configured && (
                    <Button
                      intent={Intent.DANGER}
                      minimal
                      text="Disconnect"
                      onClick={() => handleDisconnect(item)}
                    />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Configure ${editing.displayName}` : 'Configure Gateway'}
      >
        {editing && (
          <form onSubmit={handleSave}>
            <div className={Classes.DIALOG_BODY}>
              <Switch
                label="Enable online invoice payments for this gateway"
                checked={form.paymentEnabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentEnabled: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
              <Switch
                label="Sandbox / Test Mode"
                checked={form.testMode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    testMode: (e.target as HTMLInputElement).checked,
                  }))
                }
              />

              {editing.provider === 'hubtel' ? (
                <>
                  <FormGroup label="Hubtel Client ID (API ID)" labelFor="hubtel-client-id">
                    <InputGroup
                      id="hubtel-client-id"
                      required
                      value={form.clientId}
                      placeholder="Enter Hubtel Client ID"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, clientId: e.target.value }))
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    label={`Hubtel Client Secret${editing.hasSecretKey ? ` (saved: ${editing.secretKeyMasked})` : ''}`}
                    labelFor="hubtel-client-secret"
                  >
                    <InputGroup
                      id="hubtel-client-secret"
                      type="password"
                      required={!editing.hasSecretKey}
                      value={form.clientSecret}
                      placeholder={
                        editing.hasSecretKey
                          ? 'Leave blank to keep existing secret'
                          : 'Enter Hubtel Client Secret'
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, clientSecret: e.target.value }))
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    label="Merchant Account Number (POS Sales ID)"
                    labelFor="hubtel-merchant-account"
                  >
                    <InputGroup
                      id="hubtel-merchant-account"
                      required
                      value={form.merchantAccountNumber}
                      placeholder="e.g. 2012345"
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          merchantAccountNumber: e.target.value,
                        }))
                      }
                    />
                  </FormGroup>
                </>
              ) : (
                <>
                  <FormGroup label="Public Key" labelFor="gw-public-key">
                    <InputGroup
                      id="gw-public-key"
                      required
                      value={form.publicKey}
                      placeholder={
                        editing.provider === 'paystack'
                          ? 'pk_live_... or pk_test_...'
                          : 'FLWPUBK-...'
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, publicKey: e.target.value }))
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    label={`Secret Key${editing.hasSecretKey ? ` (saved: ${editing.secretKeyMasked})` : ''}`}
                    labelFor="gw-secret-key"
                  >
                    <InputGroup
                      id="gw-secret-key"
                      type="password"
                      required={!editing.hasSecretKey}
                      value={form.secretKey}
                      placeholder={
                        editing.hasSecretKey
                          ? 'Leave blank to keep existing secret'
                          : editing.provider === 'paystack'
                            ? 'sk_live_... or sk_test_...'
                            : 'FLWSECK-...'
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, secretKey: e.target.value }))
                      }
                    />
                  </FormGroup>

                  {editing.provider === 'flutterwave' && (
                    <>
                      <FormGroup
                        label={`Encryption Key${editing.hasEncryptionKey ? ' (saved)' : ''}`}
                        labelFor="flw-enc-key"
                      >
                        <InputGroup
                          id="flw-enc-key"
                          type="password"
                          value={form.encryptionKey}
                          placeholder="Optional Flutterwave encryption key"
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              encryptionKey: e.target.value,
                            }))
                          }
                        />
                      </FormGroup>
                      <FormGroup
                        label={`Webhook Secret Hash (verif-hash)${editing.hasWebhookHash ? ' (saved)' : ''}`}
                        labelFor="flw-webhook-hash"
                      >
                        <InputGroup
                          id="flw-webhook-hash"
                          type="password"
                          value={form.webhookHash}
                          placeholder="Optional verif-hash for webhook verification"
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              webhookHash: e.target.value,
                            }))
                          }
                        />
                      </FormGroup>
                    </>
                  )}
                </>
              )}

              <FormGroup
                label="Webhook Callback Path"
                helperText="Configure this URL in your provider dashboard to receive real-time payment notifications."
              >
                <InputGroup readOnly value={editing.webhookUrl} />
              </FormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button text="Cancel" onClick={() => setEditing(null)} />
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  loading={saving}
                  text="Save Gateway"
                />
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
