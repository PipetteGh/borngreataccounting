import { Module } from '@nestjs/common';
import { AttachmentsModule } from '../Attachments/Attachment.module';
import { ChromiumlyHtmlConvert } from './ChromiumlyHtmlConvert.service';
import { ChromiumlyTenancy } from './ChromiumlyTenancy.service';

@Module({
  imports: [AttachmentsModule],
  providers: [ChromiumlyHtmlConvert, ChromiumlyTenancy],
  exports: [ChromiumlyHtmlConvert, ChromiumlyTenancy],
})
export class ChromiumlyTenancyModule {}
