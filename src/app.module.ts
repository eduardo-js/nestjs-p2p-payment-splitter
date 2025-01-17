import { Module } from '@nestjs/common';
import { ExpenseGroupController } from './modules/expense-group/controllers';
import { ExpenseController } from './modules/expense/controllers';
import { ExpenseService } from './modules/expense/services';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ExpenseGroupService } from './modules/expense-group/services';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './modules/mail/services/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { FileService, S3Service } from './modules/file/service';
import { BalanceController } from './modules/balance/controllers/';
import { BalanceService } from './modules/balance/services';
import { GunService } from './modules/gun/services';
import EventEmitterService from './modules/event-emitter/services/event-emitter.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAILER_HOST,
        secure: false,
        port: Number(process.env.MAILER_PORT ?? 1025),
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS,
        },
        ignoreTLS: true,
      },
    }),
  ],
  controllers: [ExpenseGroupController, ExpenseController, BalanceController],
  providers: [
    { provide: 'GunService', useClass: GunService },
    { provide: 'ExpenseGroupService', useClass: ExpenseGroupService },
    { provide: 'BalanceService', useClass: BalanceService },
    { provide: 'ExpenseService', useClass: ExpenseService },
    { provide: 'EmailService', useClass: MailService },
    { provide: 'FileService', useClass: FileService },
    { provide: 'S3Service', useClass: S3Service },
    { provide: 'EventEmitterService', useClass: EventEmitterService },
  ],
})
export class AppModule {}
