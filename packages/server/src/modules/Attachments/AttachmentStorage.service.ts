import { createHmac, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AttachmentStorageService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns true when S3/Garage object storage credentials and bucket are configured
   * and local-only storage is not forced.
   */
  public isS3Configured(): boolean {
    if (process.env.STORAGE_DRIVER === 'local') {
      return false;
    }
    const s3 = this.configService.get('s3');
    return Boolean(s3?.bucket && s3?.accessKeyId && s3?.secretAccessKey);
  }

  /**
   * Checks whether the attachment exists in local disk storage.
   */
  public localFileExists(key: string): boolean {
    try {
      const filePath = this.resolveLocalFilePath(key);
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Saves a buffer to local disk storage under the given attachment key.
   */
  public async saveLocalFile(key: string, buffer: Buffer): Promise<string> {
    const filePath = this.resolveLocalFilePath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Resolves the local disk directory for attachment storage when S3 is not configured.
   */
  public getLocalStorageDir(): string {
    const configured = process.env.UPLOAD_STORAGE_DIR;
    const baseDir = configured
      ? path.resolve(configured)
      : path.resolve(__dirname, '../../../../storage/attachments');
    fs.mkdirSync(baseDir, { recursive: true });
    return baseDir;
  }

  /**
   * Resolves a safe local file path for the given attachment key.
   */
  public resolveLocalFilePath(key: string): string {
    const rootDir = this.getLocalStorageDir();
    const normalizedKey = key.replace(/^[/\\]+/, '');
    const targetPath = path.resolve(rootDir, normalizedKey);
    if (
      targetPath !== rootDir &&
      !targetPath.startsWith(`${rootDir}${path.sep}`)
    ) {
      throw new NotFoundException('Invalid attachment path.');
    }
    return targetPath;
  }

  private getSigningSecret(): string {
    return (
      this.configService.get<string>('jwt.secret') ||
      process.env.JWT_SECRET ||
      'borngreat-local-attachment-signing-key'
    );
  }

  /**
   * Generates a relative HMAC-signed URL so images/PDFs/downloads work in browsers
   * and Gotenberg without requiring Authorization headers.
   */
  public createSignedLocalUrl(
    key: string,
    mimeType?: string,
    expiresInSeconds = 86400,
  ): string {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expires}`;
    const sig = createHmac('sha256', this.getSigningSecret())
      .update(payload)
      .digest('hex');

    const params = new URLSearchParams({
      key,
      expires: String(expires),
      sig,
    });
    if (mimeType) {
      params.set('ct', mimeType);
    }
    return `/api/attachments/public/file?${params.toString()}`;
  }

  /**
   * Verifies an HMAC-signed local attachment URL.
   */
  public verifySignedLocalUrl(
    key: string,
    expires: string,
    sig: string,
  ): boolean {
    if (!key || !expires || !sig) return false;
    const expNum = Number(expires);
    if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const expected = createHmac('sha256', this.getSigningSecret())
      .update(`${key}:${expires}`)
      .digest('hex');

    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  }

  /**
   * Reads a locally stored attachment buffer.
   */
  public async readLocalFile(key: string): Promise<Buffer> {
    const filePath = this.resolveLocalFilePath(key);
    try {
      return await fs.promises.readFile(filePath);
    } catch {
      throw new NotFoundException('Attachment file not found.');
    }
  }

  /**
   * Deletes a locally stored attachment if present.
   */
  public async deleteLocalFile(key: string): Promise<void> {
    const filePath = this.resolveLocalFilePath(key);
    try {
      await fs.promises.unlink(filePath);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }
}
