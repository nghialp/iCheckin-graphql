import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
@Module({
  providers: [MailService],
  exports: [MailService], // để inject vào các module khác
})
export class MailModule {}