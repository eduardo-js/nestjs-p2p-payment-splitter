import { CreateExpenseGroupDto, ExpenseGroupParticipantDto } from '../dtos';

export default interface IExpenseGroupService {
  addExpenseGroup(
    expenseGroup: CreateExpenseGroupDto,
  ): Promise<{ message: { id: string } }>;
  getExpenseGroup(
    id: string,
  ): Promise<{ name: string; participants: ExpenseGroupParticipantDto[] }>;
}
