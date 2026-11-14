import { BRAND } from './brand';

export const App = {
  app_name: BRAND.productName,
  app_version: BRAND.version,
} as const;
