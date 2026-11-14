import classNames from 'classnames';
import React from 'react';
import { BigcapitalAlt } from '@/components/Icons/BigcapitalAlt';
import { useIsDarkMode } from '@/hooks/useDarkMode';

import '@/style/components/BigcapitalLoading.scss';

interface BigcapitalLoadingProps {
  className?: string;
}

/**
 * BorngreatAccounting logo loading splash screen.
 */
export default function BigcapitalLoading({
  className,
}: BigcapitalLoadingProps) {
  const isDarkmode = useIsDarkMode();

  return (
    <div className={classNames('bigcapital-loading', className)}>
      <div className="center">
        {isDarkmode ? (
          <BigcapitalAlt
            height={42}
            width={260}
            color="#ffffff"
            className="bigcapital-logo"
          />
        ) : (
          <BigcapitalAlt height={42} width={260} className="bigcapital-logo" />
        )}
      </div>
    </div>
  );
}
