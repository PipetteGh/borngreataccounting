import { createTransport, Transporter } from 'nodemailer';
import { Mail } from './Mail';
import { Inject, Injectable } from '@nestjs/common';
import { MAIL_TRANSPORTER_PROVIDER } from './Mail.constants';

@Injectable()
export class MailTransporter {
  private cachedSignature: string = '';
  private dynamicTransporter: Transporter | null = null;

  constructor(
    @Inject(MAIL_TRANSPORTER_PROVIDER)
    private readonly transporter: Transporter,
  ) {}

  private getActiveTransporter(): Transporter {
    const host = (process.env.MAIL_HOST || '').trim();
    if (!host) {
      return this.transporter;
    }

    const port = Number(process.env.MAIL_PORT || 587) || 587;
    const secure = String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true';
    const username = (process.env.MAIL_USERNAME || '').trim();
    const password = process.env.MAIL_PASSWORD || '';
    const signature = `${host}|${port}|${secure}|${username}|${password}`;

    if (!this.dynamicTransporter || this.cachedSignature !== signature) {
      this.dynamicTransporter = createTransport({
        host,
        port,
        secure,
        ...(username ? { auth: { user: username, pass: password } } : {}),
      });
      this.cachedSignature = signature;
    }

    return this.dynamicTransporter;
  }

  send(mail: Mail) {
    const options = { ...mail.mailOptions };
    if (!options.from || String(options.from).includes('undefined')) {
      const fromName = (process.env.MAIL_FROM_NAME || 'BorngreatAccounting').trim();
      const fromAddress = (process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || '').trim();
      if (fromAddress) {
        options.from = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;
      }
    }
    return this.getActiveTransporter().sendMail(options);
  }
}
