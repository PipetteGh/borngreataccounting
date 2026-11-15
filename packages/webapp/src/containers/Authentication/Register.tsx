import { Callout, Intent } from '@blueprintjs/core';
import { Formik, FormikHelpers } from 'formik';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import {
  AuthFooterLinks,
  AuthFooterLink,
  AuthInsiderCard,
} from './_components';
import { useAuthMetaBoot } from './AuthMetaBoot';
import { GoogleAuthSection } from './GoogleAuthButton';
import { RegisterForm } from './RegisterForm';
import {
  RegisterSchema,
  RegisterValues,
  transformRegisterErrorsToForm,
  transformRegisterToastMessages,
} from './utils';
import type { ApiError } from 'openapi-typescript-fetch';
import { AppToaster, FormattedMessage as T } from '@/components';
import { AuthInsider } from '@/containers/Authentication/AuthInsider';
import { useAuthLogin, useAuthRegister } from '@/hooks/query/authentication';

const initialValues: RegisterValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

/**
 * Register form.
 */
export function RegisterUserForm() {
  const { mutateAsync: authLoginMutate } = useAuthLogin();
  const { mutateAsync: authRegisterMutate } = useAuthRegister();
  const { googleEnabled, needsSetup } = useAuthMetaBoot();

  const handleSubmit = (
    values: RegisterValues,
    { setSubmitting, setErrors }: FormikHelpers<RegisterValues>,
  ) => {
    authRegisterMutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
    })
      .then(() => {
        authLoginMutate({
          email: values.email,
          password: values.password,
        }).catch((loginErr: any) => {
          AppToaster.show({
            message:
              loginErr?.data?.message ||
              loginErr?.message ||
              intl.get('something_wentwrong'),
            intent: Intent.DANGER,
          });
          setSubmitting(false);
        });
      })
      .catch((response: ApiError) => {
        const errors =
          (response.data?.errors as Array<{ type?: string }> | undefined) ?? [];

        const formErrors = transformRegisterErrorsToForm(errors);
        const toastMessages = transformRegisterToastMessages(errors);

        if (toastMessages.length > 0) {
          toastMessages.forEach((toastMessage) => {
            AppToaster.show(toastMessage);
          });
        } else {
          AppToaster.show({
            message:
              (response.data as any)?.message ||
              (response as any)?.message ||
              intl.get('something_wentwrong'),
            intent: Intent.DANGER,
          });
        }
        setErrors(formErrors);
        setSubmitting(false);
      });
  };

  return (
    <AuthInsider>
      <AuthInsiderCard>
        {needsSetup && (
          <Callout
            intent={Intent.PRIMARY}
            title="First-Time Setup: Create Administrator Account"
            style={{ marginBottom: 16 }}
          >
            Welcome to BorngreatAccounting! Enter your name, email (username),
            and password below to create your admin login. Next, you&apos;ll set
            up your organization.
          </Callout>
        )}

        {googleEnabled && <GoogleAuthSection />}

        <Formik
          initialValues={initialValues}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
          component={RegisterForm}
        />
      </AuthInsiderCard>

      <RegisterFooterLinks />
    </AuthInsider>
  );
}

function RegisterFooterLinks() {
  return (
    <AuthFooterLinks>
      <AuthFooterLink>
        <T id={'return_to'} />{' '}
        <Link to={'/auth/login'}>
          <T id={'sign_in'} />
        </Link>
      </AuthFooterLink>

      <AuthFooterLink>
        <Link to={'/auth/send_reset_password'}>
          <T id={'forgot_my_password'} />
        </Link>
      </AuthFooterLink>
    </AuthFooterLinks>
  );
}
