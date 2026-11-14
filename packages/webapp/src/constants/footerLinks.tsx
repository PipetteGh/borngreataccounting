import intl from 'react-intl-universal';
import { BRAND } from './brand';

export const getFooterLinks = (): Array<{ title: string; link: string }> => [
  {
    title: intl.get('docs') || 'Documentation',
    link: BRAND.docsUrl,
  },
  {
    title: intl.get('community') || 'Community',
    link: BRAND.communityUrl,
  },
  {
    title: intl.get('support') || 'Support',
    link: BRAND.communityUrl,
  },
  {
    title: BRAND.productName,
    link: BRAND.repositoryUrl,
  },
];
