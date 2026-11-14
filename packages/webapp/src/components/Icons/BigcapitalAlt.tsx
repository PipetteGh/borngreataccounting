import React from 'react';
import { BRAND } from '@/constants/brand';

interface BigcapitalAltProps extends React.SVGProps<SVGSVGElement> {
  monochrome?: boolean;
}

/**
 * BorngreatAccounting (BtAccounting) primary vector wordmark + mark component.
 * Preserves the BigcapitalAlt export name for compatibility across existing imports.
 */
export function BigcapitalAlt({
  monochrome = false,
  color,
  ...props
}: BigcapitalAltProps) {
  const primaryFill = monochrome && color ? color : color || '#004dd0';
  const accentFill = monochrome && color ? color : '#2d95fd';

  return (
    <svg
      data-icon="bigcapital-alt"
      width="240"
      height="37"
      viewBox="0 0 360 44"
      {...props}
    >
      <desc>{BRAND.productName}</desc>
      <path
        fill={primaryFill}
        d="M6 4 L22 4 C28.6 4 33 7.8 33 13.2 C33 16.8 30.8 19.6 27.4 20.8 C31.6 22 34 25.2 34 29.5 C34 35.6 29.2 40 22 40 L6 40 Z M14 10.5 L14 18.5 L20.8 18.5 C23.6 18.5 25.4 16.9 25.4 14.5 C25.4 12.1 23.6 10.5 20.8 10.5 Z M14 24.5 L14 33.5 L21.5 33.5 C24.6 33.5 26.5 31.8 26.5 29 C26.5 26.2 24.6 24.5 21.5 24.5 Z"
        fillRule="evenodd"
      />
      <path
        fill={accentFill}
        d="M36 6 L56 6 L56 26 L49 26 L49 17.9 L35.9 31 L31 26.1 L44.1 13 L36 13 Z"
        fillRule="evenodd"
      />
      <text
        x="66"
        y="30"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif"
        fontSize="24.5"
        fontWeight="800"
        fill={primaryFill}
        letterSpacing="-0.5"
      >
        Borngreat
        <tspan fill={accentFill} fontWeight="600">
          Accounting
        </tspan>
      </text>
    </svg>
  );
}

export const BorngreatLogo = BigcapitalAlt;
