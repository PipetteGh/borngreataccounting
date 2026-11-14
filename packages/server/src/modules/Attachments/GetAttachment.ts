import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3_CLIENT } from '../S3/S3.module';
import { TenantModelProxy } from '../System/models/TenantBaseModel';
import { DocumentModel } from './models/Document.model';
import { AttachmentStorageService } from './AttachmentStorage.service';

@Injectable()
export class GetAttachment {
  constructor(
    private readonly configService: ConfigService,

    @Inject(S3_CLIENT)
    private readonly s3: S3Client,

    @Inject(DocumentModel.name)
    private readonly documentModel: TenantModelProxy<typeof DocumentModel>,

    private readonly storageService: AttachmentStorageService,
  ) {}

  /**
   * Retrieves data of the given document key.
   * @param {string} filekey
   */
  async getAttachment(filekey: string) {
    const doc = await this.documentModel()
      .query()
      .findOne('key', filekey)
      .throwIfNotFound();

    if (
      this.storageService.localFileExists(filekey) ||
      !this.storageService.isS3Configured()
    ) {
      const buffer = await this.storageService.readLocalFile(filekey);
      return {
        ContentType: doc.mimeType || 'application/octet-stream',
        Body: {
          transformToByteArray: async () => new Uint8Array(buffer),
        },
      };
    }

    const params = {
      Bucket: this.configService.get('s3.bucket'),
      Key: filekey,
    };
    const data = await this.s3.send(new GetObjectCommand(params));

    return data;
  }
}
