import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsMiddleware } from 'nestjs-cls';
import * as path from 'path';
import * as zlib from 'zlib';
import './utils/moment-mysql';
import { AppModule } from './modules/App/App.module';
import { NestExpressApplication } from '@nestjs/platform-express';

global.__public_dirname = path.join(__dirname, '..', 'public');
global.__static_dirname = path.join(__dirname, '../static');
global.__views_dirname = path.join(global.__static_dirname, '/views');
global.__images_dirname = path.join(global.__static_dirname, '/images');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.set('query parser', 'extended');
  app.setGlobalPrefix('/api');

  // create and mount the middleware manually here
  app.use(new ClsMiddleware({}).use);

  // Lightweight gzip compression for JSON & text API responses (> 1 KB)
  app.use((req: any, res: any, next: () => void) => {
    const acceptEncoding = String(req.headers?.['accept-encoding'] || '');
    if (!/\bgzip\b/i.test(acceptEncoding)) {
      return next();
    }
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        const raw = Buffer.from(JSON.stringify(body), 'utf8');
        if (raw.length < 1024 || res.headersSent) {
          return origJson(body);
        }
        const gz = zlib.gzipSync(raw);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length');
        return res.send(gz);
      } catch {
        return origJson(body);
      }
    };
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('BorngreatAccounting')
    .setDescription(
      'BorngreatAccounting (BtAccounting) — Your Accounting. Your Servers. Your Control.',
    )
    .setVersion(process.env.APP_VERSION || '1.0.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
