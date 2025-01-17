import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OnEvent } from '@nestjs/event-emitter';
import { ExpenseCreatedEvent } from '@/modules/expense/events';
import { BalanceSettledEvent } from '@/modules/balance/events';
import IExpenseGroupService from '@/modules/expense-group/interfaces/expense-group.interface';
import { IMailService } from '../interfaces';

@Injectable()
export class MailService implements IMailService {
  constructor(
    private readonly mailerService: MailerService,
    @Inject('ExpenseGroupService')
    private readonly expenseGroupService: IExpenseGroupService,
  ) {}

  async sendEmail(to: string, subject: string, text: string) {
    const info = await this.mailerService.sendMail({
      from: '"nestjs-p2p-payment-splitter" <no-reply@example.com>',
      to,
      subject,
      text,
    });
    Logger.log('Message sent: %s', info.messageId);
  }

  @OnEvent('expense.created')
  async handleExpenseCreatedEmailEvent(payload: ExpenseCreatedEvent) {
    const expenseGroup = await this.expenseGroupService.getExpenseGroup(
      payload.expenseGroupId,
    );
    const results = await Promise.allSettled(
      expenseGroup.participants.map((participant) => {
        if (participant.email) {
          return this.sendEmail(
            participant.email,
            'New Expense Created',
            JSON.stringify(payload),
          );
        }
      }),
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        Logger.error(
          `Failed to send email to ${expenseGroup.participants[index].email}:`,
          result.reason,
        );
      }
    });
  }
  @OnEvent('balances.settled')
  async handleBalanceSettledEmailEvent(payload: BalanceSettledEvent) {
    const expenseGroup = await this.expenseGroupService.getExpenseGroup(
      payload.expenseGroupId,
    );
    await Promise.allSettled(
      expenseGroup.participants.map(async (participant) => {
        if (participant.email) {
          await this.sendEmail(
            participant.email,
            'New Debt Settled',
            JSON.stringify(payload),
          );
        }
      }),
    );
  }
}
