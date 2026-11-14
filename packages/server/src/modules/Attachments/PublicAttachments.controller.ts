import * as fs from 'node:fs';
import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PublicRoute } from '@/modules/Auth/guards/jwt.guard';
import { IgnoreTenantInitializedRoute } from '@/modules/Tenancy/EnsureTenantIsInitialized.guard';
import { IgnoreTenantSeededRoute } from '@/modules/Tenancy/EnsureTenantIsSeeded.guards';
import { IgnoreTenantModelsInitialize } from '@/modules/Tenancy/TenancyInitializeModels.guard';
import { IgnoreUserVerifiedRoute } from '@/modules/Auth/guards/EnsureUserVerified.guard';
import { SkipSubscriptionCheck } from '@/modules/Subscription/decorators/SkipSubscriptionCheck.decorator';
import { AttachmentStorageService } from './AttachmentStorage.service';

@ApiExcludeController()
@Controller('/attachments/public')
@PublicRoute()
@IgnoreTenantInitializedRoute()
@IgnoreTenantSeededRoute()
@IgnoreTenantModelsInitialize()
@IgnoreUserVerifiedRoute()
@SkipSubscriptionCheck()
export class PublicAttachmentsController {
  constructor(private readonly storageService: AttachmentStorageService) {}

  @Get('/file')
  async getPublicSignedFile(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('sig') sig: string,
    @Query('ct') contentType: string | undefined,
    @Res() res: Response,
  ) {
    if (!this.storageService.verifySignedLocalUrl(key, expires, sig)) {
      throw new ForbiddenException('Invalid or expired attachment signature.');
    }
    const filePath = this.storageService.resolveLocalFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new ForbiddenException('Attachment file not found.');
    }
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(filePath);
  }
}
