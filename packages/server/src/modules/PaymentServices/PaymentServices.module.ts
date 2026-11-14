import { Module } from '@nestjs/common';
import { DeletePaymentMethodService } from './commands/DeletePaymentMethodService';
import { EditPaymentMethodService } from './commands/EditPaymentMethodService';
import { GetPaymentMethodService } from './queries/GetPaymentService';
import { GetPaymentServicesSpecificInvoice } from './queries/GetPaymentServicesSpecificInvoice';
import { GetPaymentMethodsStateService } from './queries/GetPaymentMethodsState';
import { PaymentServicesApplication } from './PaymentServicesApplication';
import { PaymentServicesController } from './PaymentServices.controller';
import { PaymentGatewaysService } from './PaymentGateways.service';
import { PaymentGatewaysController } from './PaymentGateways.controller';
import { RegisterTenancyModel } from '../Tenancy/TenancyModels/Tenancy.module';
import { PaymentIntegration } from './models/PaymentIntegration.model';
import { TransactionPaymentServiceEntry } from './models/TransactionPaymentServiceEntry.model';
import { StripePaymentModule } from '../StripePayment/StripePayment.module';

const models = [
  RegisterTenancyModel(PaymentIntegration),
  RegisterTenancyModel(TransactionPaymentServiceEntry),
];

@Module({
  imports: [...models, StripePaymentModule],
  exports: [...models],
  providers: [
    DeletePaymentMethodService,
    EditPaymentMethodService,
    GetPaymentMethodService,
    GetPaymentMethodsStateService,
    GetPaymentServicesSpecificInvoice,
    PaymentServicesApplication,
    PaymentGatewaysService,
  ],
  controllers: [PaymentGatewaysController, PaymentServicesController],
})
export class PaymentServicesModule {}
