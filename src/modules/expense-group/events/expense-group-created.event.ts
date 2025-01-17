import { ExpenseGroupParticipantDto } from '../dtos';

export default class ExpenseGroupCreatedEvent {
  constructor(
    public readonly expenseGroupId: string,
    public readonly participants: ExpenseGroupParticipantDto[],
  ) {}
}
