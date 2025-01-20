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
import { EventEmitterService } from './modules/event/services/';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRepository } from './modules/event/repository/event.repository';
import { EventEntity } from './modules/event/entity/';

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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT ?? 5432),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      entities: [EventEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([EventEntity]),
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
    EventRepository,
  ],
})
export class AppModule { }
