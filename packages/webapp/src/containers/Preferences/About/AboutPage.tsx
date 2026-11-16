import { Card, Elevation, Tag, Intent, Button } from '@blueprintjs/core';
import * as FF from 'fp-ts/function';
import React, { useEffect, useState } from 'react';
import type { WithDashboardActionsProps } from '@/containers/Dashboard/withDashboardActions';
import { Icon, Stack } from '@/components';
import { triggerAppUpdateCheck } from '@/components/AppUpdateChecker';
import { BRAND_CONFIG } from '@/constants/brand';
import { withDashboardActions } from '@/containers/Dashboard/withDashboardActions';

type AboutPageRootProps = Pick<
  WithDashboardActionsProps,
  'changePreferencesPageTitle'
>;

function AboutPageRoot({ changePreferencesPageTitle }: AboutPageRootProps) {
  const [installedVersion, setInstalledVersion] = useState<string>(
    BRAND_CONFIG.version,
  );

  useEffect(() => {
    changePreferencesPageTitle(`About ${BRAND_CONFIG.productName}`);
  }, [changePreferencesPageTitle]);

  useEffect(() => {
    let active = true;
    fetch('/api/system_db/update-check')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.currentVersion) {
          setInstalledVersion(String(data.currentVersion));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <Stack
      spacing={20}
      style={{
        padding: '24px 40px 40px',
        maxWidth: 860,
        width: '100%',
        flex: 1,
      }}
    >
      <Card
        elevation={Elevation.ONE}
        style={{
          borderRadius: 8,
          padding: 28,
          borderLeft: '4px solid #1E5EFF',
        }}
        data-testId="about-borngreataccounting-card"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Icon icon="bigcapital" iconSize={44} />
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                {BRAND_CONFIG.productName}{' '}
                <span
                  style={{ fontWeight: 500, color: '#64748b', fontSize: 16 }}
                >
                  ({BRAND_CONFIG.shortName})
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 14 }}>
                {BRAND_CONFIG.tagline}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tag intent={Intent.PRIMARY} large minimal>
              v{installedVersion}
            </Tag>
            <Tag intent={Intent.SUCCESS} large minimal>
              Self-Hosted Ready
            </Tag>
          </div>
        </div>

        <p style={{ color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
          <strong>{BRAND_CONFIG.productName}</strong> is a full-featured,
          self-hosted, multi-currency double-entry accounting and financial
          management platform for small, medium, and enterprise organizations.
          Deploy on your own servers, cloud instances, or Windows desktop
          workstations with complete data sovereignty.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            padding: '16px 0',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Developer &amp; Publisher
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>
              {BRAND_CONFIG.developerName} ({BRAND_CONFIG.publisherName})
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Product Category
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>
              {BRAND_CONFIG.category}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              GitHub Organization / Account
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>
              {BRAND_CONFIG.githubOrg}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Open-Source License
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>
              {BRAND_CONFIG.license}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>
            Open-Source Attribution
          </h4>
          <p
            style={{
              margin: 0,
              color: '#475569',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {BRAND_CONFIG.upstreamAttribution}. Modifications, rebranding,
            production Docker orchestration, Windows Desktop Runtime Manager,
            and global tax/currency presets are maintained by{' '}
            <strong>{BRAND_CONFIG.developerName}</strong> and released under the{' '}
            <strong>{BRAND_CONFIG.license}</strong> license.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            intent={Intent.SUCCESS}
            icon="cloud-download"
            text="Check for Updates"
            onClick={() => triggerAppUpdateCheck()}
          />
          <Button
            intent={Intent.PRIMARY}
            icon="git-repo"
            text="Official Source Repository"
            onClick={() => window.open(BRAND_CONFIG.repositoryUrl, '_blank')}
          />
          <Button
            icon="book"
            text="Documentation"
            onClick={() => window.open(BRAND_CONFIG.docsUrl, '_blank')}
          />
          <Button
            icon="lifesaver"
            text="Report Issue / Support"
            onClick={() => window.open(BRAND_CONFIG.supportUrl, '_blank')}
          />
        </div>
      </Card>
    </Stack>
  );
}

export const AboutPage = FF.pipe(AboutPageRoot, withDashboardActions);
