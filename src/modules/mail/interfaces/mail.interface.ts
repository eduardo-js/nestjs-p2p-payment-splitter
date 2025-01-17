import { BalanceSettledEvent } from '@/modules/balance/events';
import { ExpenseCreatedEvent } from '@/modules/expense/events';

export default interface IMailService {
  sendEmail(to: string, subject: string, text: string): Promise<void>;

  handleExpenseCreatedEmailEvent(payload: ExpenseCreatedEvent): Promise<void>;

  handleBalanceSettledEmailEvent(payload: BalanceSettledEvent): Promise<void>;
}
