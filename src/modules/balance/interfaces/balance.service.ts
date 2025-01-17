import { ExpenseCreatedEvent } from '@/modules/expense/events';
import { ExpenseGroupCreatedEvent } from '@/modules/expense-group/events';
import { SettleDebtDto } from '../dtos';

export default interface IBalanceService {
  createWallets(data: ExpenseGroupCreatedEvent): Promise<void>;

  updateWallets(data: ExpenseCreatedEvent): Promise<void>;

  calculateProportionalSplit(
    totalAmount: number,
    participants: number,
  ): number[];

  roundNumber(num: number): number;

  getGroupBalanceByID(id: string): Promise<Record<string, any>>;

  processTransaction(data: {
    expenseGroupId: string;
    paidBy: string;
    participant: string;
    amountOwed: number;
  }): Promise<void>;

  processMultipleTransactions(data: {
    expenseGroupId: string;
    transactions: {
      payer: string;
      participant: string;
      amountOwed: number;
    }[];
  }): Promise<void>;

  settleDebt(
    expenseGroupId: string,
    settleDebtDto: SettleDebtDto,
  ): Promise<void>;
}
