import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createBrowserHistory, History } from 'history';
import { lazy, Suspense } from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import '@/style/App.scss';
import { SplashScreen, DashboardThemeProvider } from '../components';
import { queryConfig } from '../hooks/query/base';
import AppIntlLoader from './AppIntlLoader';
import { EnsureUserEmailNotVerified } from './Guards/EnsureUserEmailNotVerified';
import { EnsureAuthenticated } from '@/components/Guards/EnsureAuthenticated';
import { GlobalErrors } from '@/containers/GlobalErrors/GlobalErrors';
import { AppUpdateChecker } from '@/components/AppUpdateChecker';

const DashboardPrivatePages = lazy(
  () => import('@/components/Dashboard/PrivatePages'),
);
const AuthenticationPage = lazy(() =>
  import('@/containers/Authentication/AuthenticationPage').then((m) => ({
    default: m.AuthenticationPage,
  })),
);
const EmailConfirmation = lazy(() =>
  import('@/containers/Authentication/EmailConfirmation').then((m) => ({
    default: m.EmailConfirmation,
  })),
);
const RegisterVerify = lazy(() =>
  import('@/containers/Authentication/RegisterVerify').then((m) => ({
    default: m.RegisterVerify,
  })),
);
const PaymentPortalPage = lazy(() =>
  import('@/containers/PaymentPortal/PaymentPortalPage').then((m) => ({
    default: m.PaymentPortalPage,
  })),
);

/**
 * App inner.
 */
function AppInsider({ history }: { history: History }) {
  return (
    <div className="App">
      <DashboardThemeProvider>
        <Suspense fallback={'Loading...'}>
          <Router history={history}>
            <Switch>
              <Route path={'/auth/register/verify'}>
                <EnsureAuthenticated>
                  <EnsureUserEmailNotVerified>
                    <RegisterVerify />
                  </EnsureUserEmailNotVerified>
                </EnsureAuthenticated>
              </Route>

              <Route
                path={'/auth/email_confirmation'}
                children={<EmailConfirmation />}
              />
              <Route path={'/auth'} children={<AuthenticationPage />} />
              <Route
                path={'/payment/:linkId'}
                children={<PaymentPortalPage />}
              />
              <Route path={'/'} children={<DashboardPrivatePages />} />
            </Switch>
          </Router>
        </Suspense>

        <GlobalErrors />
        <AppUpdateChecker />
      </DashboardThemeProvider>
    </div>
  );
}

// Persistent QueryClient across App renders so cache is preserved.
const queryClient = new QueryClient(queryConfig);

/**
 * Core application.
 */
export default function App() {
  // Browser history.
  const history = createBrowserHistory();

  return (
    <QueryClientProvider client={queryClient}>
      <SplashScreen />

      <AppIntlLoader>
        <AppInsider history={history} />
      </AppIntlLoader>

      {import.meta.env.VITE_REACT_QUERY_DEVTOOLS !== 'false' &&
        !navigator.webdriver && <ReactQueryDevtools initialIsOpen />}
    </QueryClientProvider>
  );
}
