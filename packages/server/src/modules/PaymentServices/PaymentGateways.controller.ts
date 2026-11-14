import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { PublicRoute } from '@/modules/Auth/guards/jwt.guard';
import { IgnoreTenantInitializedRoute } from '@/modules/Tenancy/EnsureTenantIsInitialized.guard';
import { IgnoreTenantSeededRoute } from '@/modules/Tenancy/EnsureTenantIsSeeded.guards';
import { IgnoreUserVerifiedRoute } from '@/modules/Auth/guards/EnsureUserVerified.guard';
import { SkipSubscriptionCheck } from '@/modules/Subscription/decorators/SkipSubscriptionCheck.decorator';
import {
  GatewayCheckoutInput,
  GatewayConfigInput,
  PaymentGatewaysService,
} from './PaymentGateways.service';

@ApiTags('Payment Gateways')
@ApiCommonHeaders()
@Controller('payment-services/gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGateways: PaymentGatewaysService) {}

  @Get('/')
  @ApiOperation({
    summary: 'List Paystack, Flutterwave, and Hubtel gateway configurations.',
  })
  async getGatewaysState() {
    return this.paymentGateways.getGatewaysState();
  }

  @Post('/:provider')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Save or update Paystack, Flutterwave, or Hubtel credentials.',
  })
  async saveGatewayConfig(
    @Param('provider') provider: string,
    @Body() body: GatewayConfigInput,
  ) {
    return this.paymentGateways.saveGatewayConfig(provider, body);
  }

  @Delete('/:provider')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Disconnect a Paystack, Flutterwave, or Hubtel integration.',
  })
  async deleteGatewayConfig(@Param('provider') provider: string) {
    return this.paymentGateways.deleteGatewayConfig(provider);
  }

  @Post('/:provider/checkout')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Initialize a hosted checkout session for Paystack, Flutterwave, or Hubtel.',
  })
  async initiateCheckout(
    @Param('provider') provider: string,
    @Body() body: GatewayCheckoutInput,
  ) {
    return this.paymentGateways.initiateCheckout(provider, body);
  }

  @Post('/webhooks/:provider/:organizationId')
  @HttpCode(200)
  @PublicRoute()
  @IgnoreTenantInitializedRoute()
  @IgnoreTenantSeededRoute()
  @IgnoreUserVerifiedRoute()
  @SkipSubscriptionCheck()
  @ApiOperation({
    summary: 'Handle webhook callbacks from Paystack, Flutterwave, or Hubtel.',
  })
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    return this.paymentGateways.verifyWebhook(provider, headers, body);
  }
}
