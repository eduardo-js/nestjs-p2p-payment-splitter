import { SettleDebtDto } from '../dtos';

export default class BalanceSettledEvent {
  constructor(
    public readonly expenseGroupId: string,
    public readonly settledDebt: SettleDebtDto,
  ) {}
}
