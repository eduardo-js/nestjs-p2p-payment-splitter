import { CreateExpenseDto } from '../dtos';

export default interface IExpenseService {
  addExpense(expense: CreateExpenseDto): Promise<{ message: { id: string } }>;
  getExpense(id: string): Promise<any>;
  processBatch(file: Express.Multer.File): Promise<{ message: string }>;
  processFileContents(fileUrl: string): Promise<void>;
}
