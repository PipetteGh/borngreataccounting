import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { ENV_FILE_PATHS } from '@/common/config/env';

export interface SmtpSettingsDto {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  fromName?: string;
  fromAddress?: string;
  testEmail?: string;
}

export interface SmtpSettingsResponse {
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  fromName: string;
  fromAddress: string;
}

@Injectable()
export class SmtpSettingsService {
  /**
   * Returns current SMTP configuration without exposing the password.
   */
  getSmtpSettings(): SmtpSettingsResponse {
    const host = (process.env.MAIL_HOST || '').trim();
    const port = Number(process.env.MAIL_PORT || 587) || 587;
    const secure = String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true';
    const username = (process.env.MAIL_USERNAME || '').trim();
    const hasPassword = Boolean(process.env.MAIL_PASSWORD);
    const fromName = (process.env.MAIL_FROM_NAME || 'BorngreatAccounting').trim();
    const fromAddress = (process.env.MAIL_FROM_ADDRESS || '').trim();

    return {
      configured: Boolean(host),
      host,
      port,
      secure,
      username,
      hasPassword,
      fromName,
      fromAddress,
    };
  }

  /**
   * Updates SMTP configuration in runtime process.env and persists to .env if writable.
   */
  saveSmtpSettings(dto: SmtpSettingsDto): SmtpSettingsResponse {
    const host = (dto.host || '').trim();
    const port = Number(dto.port || 587) || 587;
    const secure = Boolean(dto.secure);
    const username = (dto.username || '').trim();
    const password =
      dto.password && dto.password.length > 0
        ? dto.password
        : process.env.MAIL_PASSWORD || '';
    const fromName = (dto.fromName || 'BorngreatAccounting').trim();
    const fromAddress = (dto.fromAddress || username || '').trim();

    const updates: Record<string, string> = {
      MAIL_HOST: host,
      MAIL_PORT: String(port),
      MAIL_SECURE: secure ? 'true' : 'false',
      MAIL_USERNAME: username,
      MAIL_PASSWORD: password,
      MAIL_FROM_NAME: fromName,
      MAIL_FROM_ADDRESS: fromAddress,
    };

    Object.entries(updates).forEach(([key, value]) => {
      process.env[key] = value;
    });

    this.persistToEnvFile(updates);

    return this.getSmtpSettings();
  }

  /**
   * Verifies SMTP connection and optionally sends a test email.
   */
  async testSmtpSettings(dto: SmtpSettingsDto): Promise<{ success: boolean; message: string }> {
    const host = (dto.host || process.env.MAIL_HOST || '').trim();
    const port = Number(dto.port || process.env.MAIL_PORT || 587) || 587;
    const secure =
      typeof dto.secure === 'boolean'
        ? dto.secure
        : String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true';
    const username = (dto.username ?? process.env.MAIL_USERNAME ?? '').trim();
    const password =
      dto.password && dto.password.length > 0
        ? dto.password
        : process.env.MAIL_PASSWORD || '';
    const fromName = (dto.fromName || process.env.MAIL_FROM_NAME || 'BorngreatAccounting').trim();
    const fromAddress = (dto.fromAddress || process.env.MAIL_FROM_ADDRESS || username || '').trim();

    if (!host) {
      throw new BadRequestException('SMTP Host is required to test the connection.');
    }

    const transporter = createTransport({
      host,
      port,
      secure,
      ...(username ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
      if (dto.testEmail && dto.testEmail.trim()) {
        const sender = fromAddress
          ? fromName
            ? `"${fromName}" <${fromAddress}>`
            : fromAddress
          : username;
        await transporter.sendMail({
          from: sender,
          to: dto.testEmail.trim(),
          subject: 'BorngreatAccounting SMTP Test Email',
          html: '<p>Your SMTP email configuration is working properly.</p>',
        });
        return {
          success: true,
          message: `SMTP connection verified and test email sent to ${dto.testEmail.trim()}.`,
        };
      }
      return {
        success: true,
        message: 'SMTP connection verified successfully.',
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to connect to SMTP server. Please check your settings.',
      );
    }
  }

  /**
   * Persists key=value pairs into the active .env file if available and writable.
   */
  private persistToEnvFile(updates: Record<string, string>): void {
    try {
      const targetPath =
        ENV_FILE_PATHS.find((envPath) => fs.existsSync(envPath)) ||
        ENV_FILE_PATHS[ENV_FILE_PATHS.length - 1];

      if (!targetPath) return;

      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) return;

      let content = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
      const lines = content ? content.split(/\r?\n/) : [];
      const seen = new Set<string>();

      const updatedLines = lines.map((line) => {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        if (match && Object.prototype.hasOwnProperty.call(updates, match[1])) {
          const key = match[1];
          seen.add(key);
          return `${key}=${this.formatEnvValue(updates[key])}`;
        }
        return line;
      });

      Object.entries(updates).forEach(([key, value]) => {
        if (!seen.has(key)) {
          updatedLines.push(`${key}=${this.formatEnvValue(value)}`);
        }
      });

      fs.writeFileSync(targetPath, updatedLines.join('\n'), 'utf8');
    } catch {
      // Ignore read-only filesystem errors (e.g. immutable container .env); runtime process.env is still updated.
    }
  }

  private formatEnvValue(val: string): string {
    if (/[\s#"']/.test(val)) {
      return `"${val.replace(/"/g, '\\"')}"`;
    }
    return val;
  }
}
