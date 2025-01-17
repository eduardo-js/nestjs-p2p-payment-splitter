import { SplitType } from '../enums';

export default class ExpenseCreatedEvent {
  constructor(
    public readonly expenseId: string,
    public readonly expenseGroupId: string,
    public readonly amount: number,
    public readonly splitBetween: string[] | null,
    public readonly splitType: SplitType,
    public readonly paidBy: string,
  ) {}
}
