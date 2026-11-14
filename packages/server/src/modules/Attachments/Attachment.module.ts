import { Module, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ClsService } from 'nestjs-cls';
import { S3_CLIENT, S3Module } from '../S3/S3.module';
import { AttachmentStorageService } from './AttachmentStorage.service';
import { PublicAttachmentsController } from './PublicAttachments.controller';
import { DeleteAttachment } from './DeleteAttachment';
import { GetAttachment } from './GetAttachment';
import { GetAttachmentPresignedUrl } from './GetAttachmentPresignedUrl';
import { LinkAttachment } from './LinkAttachment';
import { UnlinkAttachment } from './UnlinkAttachment';
import { ValidateAttachments } from './ValidateAttachments';
import { AttachmentsOnBillPayments } from './events/AttachmentsOnPaymentsMade';
import { AttachmentsOnBills } from './events/AttachmentsOnBills';
import { AttachmentsOnCreditNote } from './events/AttachmentsOnCreditNote';
import { AttachmentsOnExpenses } from './events/AttachmentsOnExpenses';
import { AttachmentsOnPaymentsReceived } from './events/AttachmentsOnPaymentsReceived';
import { AttachmentsOnManualJournals } from './events/AttachmentsOnManualJournals';
import { AttachmentsOnVendorCredits } from './events/AttachmentsOnVendorCredits';
import { AttachmentsOnSaleInvoiceCreated } from './events/AttachmentsOnSaleInvoice';
import { AttachmentsOnSaleReceipt } from './events/AttachmentsOnSaleReceipts';
import { AttachmentsOnSaleEstimates } from './events/AttachmentsOnSaleEstimates';
import { AttachmentsController } from './Attachments.controller';
import { RegisterTenancyModel } from '../Tenancy/TenancyModels/Tenancy.module';
import { DocumentModel } from './models/Document.model';
import { DocumentLinkModel } from './models/DocumentLink.model';
import { AttachmentsApplication } from './AttachmentsApplication';
import { UploadDocument } from './UploadDocument';
import { AttachmentUploadPipeline } from './S3UploadPipeline';
import { MULTER_MODULE_OPTIONS } from '@/common/constants/files.constants';
import { ConfigService } from '@nestjs/config';

const models = [
  RegisterTenancyModel(DocumentModel),
  RegisterTenancyModel(DocumentLinkModel),
];

@Module({
  imports: [S3Module, ...models],
  exports: [...models, GetAttachmentPresignedUrl, AttachmentStorageService],
  controllers: [AttachmentsController, PublicAttachmentsController],
  providers: [
    AttachmentStorageService,
    DeleteAttachment,
    GetAttachment,
    GetAttachmentPresignedUrl,
    LinkAttachment,
    UnlinkAttachment,
    ValidateAttachments,
    AttachmentsOnBillPayments,
    AttachmentsOnBills,
    AttachmentsOnCreditNote,
    AttachmentsOnExpenses,
    AttachmentsOnPaymentsReceived,
    AttachmentsOnManualJournals,
    AttachmentsOnVendorCredits,
    AttachmentsOnSaleInvoiceCreated,
    AttachmentsOnSaleReceipt,
    AttachmentsOnSaleEstimates,
    AttachmentsApplication,
    UploadDocument,
    AttachmentUploadPipeline,
    {
      provide: MULTER_MODULE_OPTIONS,
      inject: [ConfigService, S3_CLIENT, ClsService, AttachmentStorageService],
      useFactory: (
        configService: ConfigService,
        s3: S3Client,
        cls: ClsService,
        storageService: AttachmentStorageService,
      ) => {
        const logger = new Logger('AttachmentsModule');

        return {
          storage: {
            _handleFile(
              req: any,
              file: any,
              cb: (error: any, info?: any) => void,
            ) {
              const chunks: Buffer[] = [];
              file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
              file.stream.on('error', (err: any) => cb(err));
              file.stream.on('end', async () => {
                try {
                  const buffer = Buffer.concat(chunks);
                  const organizationId =
                    cls.get<string>('organizationId') || 'default';
                  const key = `${organizationId}/${randomUUID()}`;

                  let storedInS3 = false;
                  if (storageService.isS3Configured()) {
                    try {
                      await s3.send(
                        new PutObjectCommand({
                          Bucket: configService.get('s3.bucket'),
                          Key: key,
                          Body: buffer,
                          ContentType: file.mimetype,
                          ACL: 'public-read',
                        }),
                      );
                      storedInS3 = true;
                    } catch (s3Err: any) {
                      logger.warn(
                        `S3 upload failed (${s3Err?.code || s3Err?.message}); falling back to local disk storage.`,
                      );
                    }
                  }

                  if (!storedInS3) {
                    await storageService.saveLocalFile(key, buffer);
                  }

                  cb(null, {
                    key,
                    size: buffer.length,
                    mimetype: file.mimetype,
                    filename: key,
                  });
                } catch (err) {
                  cb(err);
                }
              });
            },
            _removeFile(
              req: any,
              file: any,
              cb: (error: Error | null) => void,
            ) {
              if (file?.key) {
                storageService
                  .deleteLocalFile(file.key)
                  .then(() => cb(null))
                  .catch((err) => cb(err));
              } else {
                cb(null);
              }
            },
          },
        };
      },
    },
  ],
})
export class AttachmentsModule {}
