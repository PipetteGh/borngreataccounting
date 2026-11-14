import { Inject, Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs, existsSync } from 'fs';
import { PageProperties, PdfFormat } from '@/libs/chromiumly/_types';
import { UrlConverter } from '@/libs/chromiumly/UrlConvert';
import { Chromiumly } from '@/libs/chromiumly/Chromiumly';
import { getPdfFilePath, getPdfFilesStorageDir } from './utils';
import { Document } from './models/Document';
import { TenantModelProxy } from '../System/models/TenantBaseModel';

const execFileAsync = promisify(execFile);

function findLocalBrowserExecutable(): string | null {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/usr/bin/microsoft-edge',
          ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

@Injectable()
export class ChromiumlyHtmlConvert {
  private readonly logger = new Logger(ChromiumlyHtmlConvert.name);
  /**
   * @param {TenantModelProxy<typeof Document>} documentModel - Document model.
   */
  constructor(
    @Inject(Document.name)
    private documentModel: TenantModelProxy<typeof Document>,
  ) {}

  /**
   * Write HTML content to temporary file.
   * @param {string} content - HTML content.
   * @returns {Promise<[string, () => Promise<void>]>}
   */
  async writeTempHtmlFile(
    content: string,
  ): Promise<[string, () => Promise<void>]> {
    const filename = `document-print-${Date.now()}.html`;
    const filePath = getPdfFilePath(filename);

    await fs.writeFile(filePath, content);
    await this.documentModel()
      .query()
      .insert({ key: filename, mimeType: 'text/html' });

    const cleanup = async () => {
      await fs.unlink(filePath);
      await this.documentModel().query().where('key', filename).delete();
    };
    return [filename, cleanup];
  }

  private async convertWithLocalBrowser(
    html: string,
    localUrl: string,
    properties?: PageProperties,
  ): Promise<Buffer> {
    const browserExe = findLocalBrowserExecutable();
    if (!browserExe) {
      throw new Error(
        'PDF generation failed: Gotenberg is unreachable and no local Chrome/Edge/Chromium binary was found.',
      );
    }

    const outPdfPath = path.join(
      os.tmpdir(),
      `borngreat-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
    );
    const userDataDir = path.join(
      os.tmpdir(),
      `borngreat-chrome-profile-${process.pid}`,
    );

    // Inject @page landscape/margin hint when requested
    let targetUrl = localUrl;
    let tempHtmlFallback: string | null = null;
    if (properties?.landscape) {
      tempHtmlFallback = path.join(
        os.tmpdir(),
        `borngreat-html-${Date.now()}.html`,
      );
      const injected = html.replace(
        '</head>',
        '<style>@page { size: landscape; }</style></head>',
      );
      await fs.writeFile(tempHtmlFallback, injected, 'utf8');
      targetUrl = `file://${tempHtmlFallback.replace(/\\/g, '/')}`;
    }

    try {
      await execFileAsync(
        browserExe,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          `--user-data-dir=${userDataDir}`,
          '--no-pdf-header-footer',
          `--print-to-pdf=${outPdfPath}`,
          targetUrl,
        ],
        { timeout: 30000 },
      );
      return await fs.readFile(outPdfPath);
    } finally {
      await fs.unlink(outPdfPath).catch(() => {});
      if (tempHtmlFallback) {
        await fs.unlink(tempHtmlFallback).catch(() => {});
      }
    }
  }

  /**
   * Converts the given HTML content to PDF.
   * @param {string} html
   * @param {PageProperties} properties
   * @param {PdfFormat} pdfFormat
   * @returns {Promise<Buffer>}
   */
  async convert(
    html: string,
    properties?: PageProperties,
    pdfFormat?: PdfFormat,
  ): Promise<Buffer> {
    const [filename, cleanupTempFile] = await this.writeTempHtmlFile(html);
    const fileDir = getPdfFilesStorageDir(filename).replace(/\\/g, '/');

    const baseDocsEndpoint = (
      Chromiumly.GOTENBERG_DOCS_ENDPOINT ||
      `http://127.0.0.1:${process.env.PORT || 3000}/public/`
    ).replace(/\/+$/, '');
    const normalizedFileDir = fileDir.replace(/^\/+/, '');
    const url = `${baseDocsEndpoint}/${normalizedFileDir}`;
    const urlConverter = new UrlConverter();

    try {
      const buffer = await urlConverter.convert({
        url,
        properties,
        pdfFormat,
      });
      if (Buffer.isBuffer(buffer) && buffer.length > 0) {
        return buffer;
      }
      throw new Error('Empty PDF buffer from Gotenberg');
    } catch (err: any) {
      this.logger.warn(
        `Gotenberg unavailable (${err?.message || 'error'}); falling back to local headless browser PDF renderer.`,
      );
      const localHttpUrl = `http://127.0.0.1:${process.env.PORT || 3000}/public/${normalizedFileDir}`;
      return await this.convertWithLocalBrowser(html, localHttpUrl, properties);
    } finally {
      await cleanupTempFile().catch(() => {});
    }
  }
}
