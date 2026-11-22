import { Card, Icon, Tag, Intent } from '@blueprintjs/core';
import React, { useState } from 'react';
import type { ChartDatum } from './extractReportChartData';

export type { ChartDatum };

const DEFAULT_PALETTE = [
  '#1E5EFF',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#64748B',
];

export function formatCompactCurrency(
  amount: number,
  currencyCode = '',
): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toFixed(2)}M`;
  } else if (abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(1)}K`;
  } else {
    formatted = abs.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return currencyCode ? `${sign}${currencyCode} ${formatted}` : `${sign}${formatted}`;
}

export function formatExactCurrency(amount: number, currencyCode = ''): string {
  const val = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currencyCode ? `${currencyCode} ${val}` : val;
}

export interface KpiMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: any;
  accentColor?: string;
  badgeText?: string;
  badgeIntent?: Intent;
}

export function KpiMetricCard({
  title,
  value,
  subtitle,
  icon = 'chart',
  accentColor = '#1E5EFF',
  badgeText,
  badgeIntent = Intent.PRIMARY,
}: KpiMetricCardProps) {
  return (
    <Card
      style={{
        padding: '16px 18px',
        borderRadius: 8,
        borderTop: `3px solid ${accentColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {title}
        </span>
        <Icon icon={icon} size={15} color={accentColor} />
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
      {(subtitle || badgeText) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 2,
          }}
        >
          {subtitle && (
            <span style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</span>
          )}
          {badgeText && (
            <Tag minimal intent={badgeIntent} style={{ fontSize: 11 }}>
              {badgeText}
            </Tag>
          )}
        </div>
      )}
    </Card>
  );
}

export interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currencyCode?: string;
  height?: number;
}

export function BarChartCard({
  title,
  subtitle,
  data,
  primaryLabel = 'Amount',
  secondaryLabel,
  primaryColor = '#1E5EFF',
  secondaryColor = '#EF4444',
  currencyCode = '',
  height = 220,
}: BarChartCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hasSecondary = Boolean(
    secondaryLabel && data.some((d) => d.secondaryValue !== undefined),
  );
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [
      Math.abs(d.value || 0),
      Math.abs(d.secondaryValue || 0),
    ]),
  );

  const svgWidth = Math.max(360, data.length * 64);
  const svgHeight = height;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const groupW = data.length > 0 ? plotW / data.length : plotW;

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Card style={{ padding: 18, borderRadius: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h4>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: primaryColor,
                display: 'inline-block',
              }}
            />
            {primaryLabel}
          </span>
          {hasSecondary && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: secondaryColor,
                  display: 'inline-block',
                }}
              />
              {secondaryLabel}
            </span>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          No data available for chart.
        </div>
      ) : (
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', minWidth: 320, height: 'auto', display: 'block' }}
          >
            {gridTicks.map((t) => {
              const y = padTop + plotH * (1 - t);
              const val = maxVal * t;
              return (
                <g key={t}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={t === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {formatCompactCurrency(val)}
                  </text>
                </g>
              );
            })}

            {data.map((d, idx) => {
              const gx = padLeft + idx * groupW;
              const barGap = 4;
              const barW = hasSecondary
                ? Math.min(22, Math.max(8, (groupW - 14 - barGap) / 2))
                : Math.min(34, Math.max(12, groupW - 18));
              const totalBarsW = hasSecondary ? barW * 2 + barGap : barW;
              const startX = gx + (groupW - totalBarsW) / 2;

              const v1 = Math.max(0, Math.abs(d.value || 0));
              const h1 = (v1 / maxVal) * plotH;
              const y1 = padTop + plotH - h1;

              const v2 = Math.max(0, Math.abs(d.secondaryValue || 0));
              const h2 = (v2 / maxVal) * plotH;
              const y2 = padTop + plotH - h2;

              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={d.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {isHovered && (
                    <rect
                      x={gx + 2}
                      y={padTop}
                      width={groupW - 4}
                      height={plotH}
                      fill="rgba(30,94,255,0.05)"
                      rx={4}
                    />
                  )}
                  <rect
                    x={startX}
                    y={y1}
                    width={barW}
                    height={Math.max(2, h1)}
                    fill={d.color || primaryColor}
                    rx={3}
                    opacity={hoveredIdx === null || isHovered ? 1 : 0.6}
                  >
                    <title>
                      {`${d.label} — ${primaryLabel}: ${formatExactCurrency(d.value, currencyCode)}`}
                    </title>
                  </rect>
                  {hasSecondary && (
                    <rect
                      x={startX + barW + barGap}
                      y={y2}
                      width={barW}
                      height={Math.max(2, h2)}
                      fill={secondaryColor}
                      rx={3}
                      opacity={hoveredIdx === null || isHovered ? 1 : 0.6}
                    >
                      <title>
                        {`${d.label} — ${secondaryLabel}: ${formatExactCurrency(d.secondaryValue || 0, currencyCode)}`}
                      </title>
                    </rect>
                  )}
                  <text
                    x={gx + groupW / 2}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="#475569"
                  >
                    {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 6,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: 12,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <strong>{data[hoveredIdx].label}</strong>
          <span>
            {primaryLabel}:{' '}
            <strong>
              {formatExactCurrency(data[hoveredIdx].value, currencyCode)}
            </strong>
            {hasSecondary && (
              <>
                {'  |  '}
                {secondaryLabel}:{' '}
                <strong>
                  {formatExactCurrency(
                    data[hoveredIdx].secondaryValue || 0,
                    currencyCode,
                  )}
                </strong>
              </>
            )}
          </span>
        </div>
      )}
    </Card>
  );
}

export interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  currencyCode?: string;
  centerLabel?: string;
}

export function DonutChartCard({
  title,
  subtitle,
  data,
  currencyCode = '',
  centerLabel = 'Total',
}: DonutChartCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const items = data.filter((d) => Math.abs(d.value) > 0);
  const total = items.reduce((sum, d) => sum + Math.abs(d.value), 0);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 58;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <Card style={{ padding: 18, borderRadius: 8 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h4>
      {subtitle && (
        <p style={{ margin: '2px 0 12px', fontSize: 12, color: '#64748b' }}>
          {subtitle}
        </p>
      )}

      {items.length === 0 ? (
        <div
          style={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          No data available for chart.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            marginTop: 8,
          }}
        >
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />
              {items.map((d, idx) => {
                const frac = total > 0 ? Math.abs(d.value) / total : 0;
                const dash = frac * circumference;
                const currentOffset = offset;
                offset += dash;
                const color =
                  d.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
                return (
                  <circle
                    key={d.label}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.15s' }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <title>
                      {`${d.label}: ${formatExactCurrency(d.value, currencyCode)} (${(frac * 100).toFixed(1)}%)`}
                    </title>
                  </circle>
                );
              })}
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                padding: 16,
              }}
            >
              <span style={{ fontSize: 10.5, color: '#64748b' }}>
                {hoveredIdx !== null && items[hoveredIdx]
                  ? items[hoveredIdx].label
                  : centerLabel}
              </span>
              <strong style={{ fontSize: 13 }}>
                {formatCompactCurrency(
                  hoveredIdx !== null && items[hoveredIdx]
                    ? items[hoveredIdx].value
                    : total,
                  currencyCode,
                )}
              </strong>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 160,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {items.map((d, idx) => {
              const pct = total > 0 ? (Math.abs(d.value) / total) * 100 : 0;
              const color =
                d.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
              return (
                <div
                  key={d.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4,
                    background:
                      hoveredIdx === idx ? 'rgba(30,94,255,0.06)' : 'transparent',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: color,
                        display: 'inline-block',
                      }}
                    />
                    <span>{d.label}</span>
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCompactCurrency(d.value, currencyCode)}{' '}
                    <span style={{ color: '#64748b', fontWeight: 400 }}>
                      ({pct.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

export interface HorizontalBarListCardProps {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  currencyCode?: string;
  isCurrency?: boolean;
}

export function HorizontalBarListCard({
  title,
  subtitle,
  data,
  currencyCode = '',
  isCurrency = true,
}: HorizontalBarListCardProps) {
  const maxVal = Math.max(1, ...data.map((d) => Math.abs(d.value || 0)));

  return (
    <Card style={{ padding: 18, borderRadius: 8 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h4>
      {subtitle && (
        <p style={{ margin: '2px 0 12px', fontSize: 12, color: '#64748b' }}>
          {subtitle}
        </p>
      )}

      {data.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: 13, padding: '16px 0' }}>
          No data available.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {data.map((d, idx) => {
            const pct = Math.min(100, (Math.abs(d.value || 0) / maxVal) * 100);
            const color =
              d.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
            return (
              <div key={d.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontWeight: 600 }}>
                    {isCurrency
                      ? formatExactCurrency(d.value, currencyCode)
                      : d.value.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    background: '#f1f5f9',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(3, pct)}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
