import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Callout,
  Checkbox,
  FormGroup,
  InputGroup,
  Intent,
  NumericInput,
} from '@blueprintjs/core';
import { x } from '@xstyled/emotion';
import { AppToaster } from '@/components';
import { transformToCamelCase } from '@/utils';

interface SmtpSettingsFormProps {
  mode: 'wizard' | 'preferences';
  onSaved?: () => void;
  onSkip?: () => void;
}

export function SmtpSettingsForm({
  mode,
  onSaved,
  onSkip,
}: SmtpSettingsFormProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState<number>(587);
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [fromName, setFromName] = useState('BorngreatAccounting');
  const [fromAddress, setFromAddress] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    intent: Intent;
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organization_id');
    axios
      .get('/api/settings/smtp', {
        headers: {
          ...(token ? { 'x-access-token': token } : {}),
          ...(orgId ? { 'organization-id': orgId } : {}),
        },
      })
      .then((res) => {
        if (!active) return;
        const data: any = transformToCamelCase(res.data || {});
        if (data.host) setHost(data.host);
        if (data.port) setPort(Number(data.port) || 587);
        if (typeof data.secure === 'boolean') setSecure(data.secure);
        if (data.username) setUsername(data.username);
        if (data.hasPassword) setHasPassword(Boolean(data.hasPassword));
        if (data.fromName) setFromName(data.fromName);
        if (data.fromAddress) setFromAddress(data.fromAddress);
      })
      .catch(() => {
        // Ignore if not yet configured.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organization_id');
    return {
      ...(token ? { 'x-access-token': token } : {}),
      ...(orgId ? { 'organization-id': orgId } : {}),
    };
  };

  const buildPayload = () => ({
    host: host.trim(),
    port: port || 587,
    secure,
    username: username.trim(),
    password: password || undefined,
    from_name: fromName.trim() || 'BorngreatAccounting',
    from_address: fromAddress.trim() || username.trim(),
    ...(testEmail.trim() ? { test_email: testEmail.trim() } : {}),
  });

  const handleTest = async () => {
    if (!host.trim()) {
      setStatusMessage({
        intent: Intent.WARNING,
        text: 'Please enter your SMTP Host before testing.',
      });
      return;
    }
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await axios.post('/api/settings/smtp/test', buildPayload(), {
        headers: getAuthHeaders(),
      });
      const data: any = transformToCamelCase(res.data || {});
      const msg = data.message || 'SMTP connection verified successfully.';
      setStatusMessage({ intent: Intent.SUCCESS, text: msg });
      AppToaster.show({ intent: Intent.SUCCESS, message: msg });
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'SMTP connection test failed.';
      setStatusMessage({ intent: Intent.DANGER, text: String(errMsg) });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!host.trim()) {
      setStatusMessage({
        intent: Intent.WARNING,
        text: 'Please enter an SMTP Host, or click Skip for now.',
      });
      return;
    }
    setSaving(true);
    setStatusMessage(null);
    try {
      await axios.put('/api/settings/smtp', buildPayload(), {
        headers: getAuthHeaders(),
      });
      setHasPassword(Boolean(password || hasPassword));
      setPassword('');
      const msg = 'Email (SMTP) settings saved successfully.';
      setStatusMessage({ intent: Intent.SUCCESS, text: msg });
      AppToaster.show({ intent: Intent.SUCCESS, message: msg });
      onSaved?.();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save SMTP settings.';
      setStatusMessage({ intent: Intent.DANGER, text: String(errMsg) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      {statusMessage && (
        <Callout intent={statusMessage.intent} style={{ marginBottom: 16 }}>
          {statusMessage.text}
        </Callout>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 12,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <FormGroup
          label="SMTP Host"
          helperText="e.g. smtp.gmail.com, smtp.office365.com, mail.yourdomain.com"
        >
          <InputGroup
            large={mode === 'wizard'}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.gmail.com"
            data-testid="smtp-host-input"
          />
        </FormGroup>

        <FormGroup label="SMTP Port" helperText="587 (TLS) or 465 (SSL)">
          <NumericInput
            fill
            large={mode === 'wizard'}
            min={1}
            max={65535}
            value={port}
            onValueChange={(val) => {
              const nextPort = val || 587;
              setPort(nextPort);
              if (nextPort === 465) setSecure(true);
              if (nextPort === 587) setSecure(false);
            }}
          />
        </FormGroup>
      </div>

      <Checkbox
        checked={secure}
        label="Use SSL/TLS (port 465)"
        onChange={(e) => setSecure(e.currentTarget.checked)}
        style={{ marginBottom: 14 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormGroup label="SMTP Username / Email">
          <InputGroup
            large={mode === 'wizard'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="you@yourdomain.com"
            data-testid="smtp-username-input"
          />
        </FormGroup>

        <FormGroup label="SMTP Password / App Password">
          <InputGroup
            large={mode === 'wizard'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={hasPassword ? '•••••••• (saved)' : 'Enter password'}
            data-testid="smtp-password-input"
          />
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormGroup label="Sender Name">
          <InputGroup
            large={mode === 'wizard'}
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="BorngreatAccounting"
          />
        </FormGroup>

        <FormGroup label="Sender Email Address">
          <InputGroup
            large={mode === 'wizard'}
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="noreply@yourdomain.com"
            data-testid="smtp-from-input"
          />
        </FormGroup>
      </div>

      <FormGroup
        label="Test Recipient Email (optional)"
        helperText="Enter an email address to receive a test message when clicking Test Connection."
      >
        <InputGroup
          large={mode === 'wizard'}
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="test@yourdomain.com"
        />
      </FormGroup>

      <x.div display="flex" gap={10} mt={4} flexWrap="wrap">
        <Button
          type="button"
          icon="envelope"
          loading={testing}
          onClick={handleTest}
          large={mode === 'wizard'}
          data-testid="smtp-test-btn"
        >
          Test Connection
        </Button>

        <Button
          type="submit"
          intent={Intent.PRIMARY}
          loading={saving}
          large={mode === 'wizard'}
          data-testid="smtp-save-btn"
        >
          {mode === 'wizard' ? 'Save & Continue' : 'Save SMTP Settings'}
        </Button>

        {mode === 'wizard' && onSkip && (
          <Button
            type="button"
            minimal
            large
            onClick={onSkip}
            data-testid="smtp-skip-btn"
          >
            Skip for now
          </Button>
        )}
      </x.div>
    </form>
  );
}
