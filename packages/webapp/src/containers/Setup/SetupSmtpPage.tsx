import React from 'react';
import { Classes } from '@blueprintjs/core';
import { x } from '@xstyled/emotion';
import { SmtpSettingsForm } from '@/components/SmtpSettingsForm';
import { useIsDarkMode } from '@/hooks/useDarkMode';

interface SetupSmtpPageProps {
  onComplete: () => void;
}

/**
 * First-time setup optional SMTP configuration step.
 */
export function SetupSmtpPage({ onComplete }: SetupSmtpPageProps) {
  const isDarkMode = useIsDarkMode();

  return (
    <x.div w="620px" maxW="100%" mx="auto" pt="30px" pb="40px">
      <x.h3
        color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#868f9f'}
        mb="0.75rem"
        fontWeight={600}
      >
        Email Server (SMTP) — Optional
      </x.h3>
      <x.p
        fontSize={14}
        mb="1.5rem"
        className={Classes.TEXT_MUTED}
      >
        Configure your SMTP server so BorngreatAccounting can send invoices,
        estimates, receipts, and user emails automatically. You can also skip
        this step and configure it later under Preferences → General.
      </x.p>

      <SmtpSettingsForm
        mode="wizard"
        onSaved={onComplete}
        onSkip={onComplete}
      />
    </x.div>
  );
}
