import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from '../dtos';
import { OnEvent } from '@nestjs/event-emitter';
import { ExpenseCreatedEvent } from '../events';
import { plainToClass } from 'class-transformer';
import * as csv from 'fast-csv';
import { validate } from 'class-validator';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';
import { IGunService } from '@/modules/gun/interfaces';
import IExpenseGroupService from '@/modules/expense-group/interfaces/expense-group.interface';
import { IFileService } from '@/modules/file/interfaces';
import { IExpenseService } from '../interfaces';
import { IEventEmitterService } from '@/modules/event/interfaces';

@Injectable()
export default class ExpenseService implements IExpenseService {
  scope = 'expense';
  expenseGroupScope = 'expenseGroup';
  constructor(
    @Inject('GunService') private readonly gunService: IGunService,
    @Inject('ExpenseGroupService')
    private readonly expenseGroupService: IExpenseGroupService,
    @Inject('FileService') private readonly fileService: IFileService,
    @Inject('EventEmitterService')
    private readonly eventEmitter: IEventEmitterService,
  ) {}

  async addExpense(expense: CreateExpenseDto) {
    const expenseGroup = await this.expenseGroupService.getExpenseGroup(
      expense.expenseGroupId,
    );

    if (!expenseGroup) {
      throw new ConflictException('Expense group not found');
    }
    if (!expenseGroup.participants.find((el) => el.name === expense.paidBy)) {
      throw new ConflictException('User not found in this expense group');
    }

    if (
      expense?.splitBetween?.find(
        (el) =>
          !expenseGroup.participants.some(
            (participant) => participant.name === el,
          ),
      )
    ) {
      throw new ConflictException(
        'Some user in the split does not exist in this expense group',
      );
    }

    this.gunService.setData(`${this.scope}/${expense.id}`, {
      amount: expense.amount,
      name: expense.name,
      paidBy: expense.paidBy,
      createdAt: expense.createdAt,
      splitType: expense.splitType,
      expenseGroupId: expense.expenseGroupId,
    });

    expense.splitBetween.forEach((el, index) =>
      this.gunService.setData(`${this.scope}/expense.id/participants`, {
        [index]: el,
      }),
    );

    this.eventEmitter.save(
      `${this.scope}.created`,
      new ExpenseCreatedEvent(
        expense.id,
        expense.expenseGroupId,
        expense.amount,
        expense.splitBetween,
        expense.splitType,
        expense.paidBy,
      ),
    );

    return { message: { id: expense.id } };
  }

  async getExpense(id: string) {
    return await this.gunService.getData(`${this.scope}/${id}`);
  }

  async processBatch(file: Express.Multer.File) {
    file.filename = nanoid();
    const url = await this.fileService.uploadFile(file, this.scope, 'AWS');
    this.eventEmitter.save(`${this.scope}.uploaded`, url.key);

    return { message: 'File being processed.' };
  }

  @OnEvent('expense.uploaded')
  async processFileContents(fileUrl: string) {
    const fileContent = await this.fileService.getFile(fileUrl, 'AWS');
    const stream = Readable.from(fileContent);
    const errors: { line: number; error: string }[] = [];
    let lineNumber = 1;

    const date = new Date().toISOString();

    const csvParser = csv.parse({ headers: true, delimiter: ';' });

    stream.pipe(csvParser).on('data', async (row) => {
      lineNumber++;
      row.splitBetween = JSON.parse(row.splitBetween);
      row.createdAt = date;
      row.amount = Number(row.amount ?? 0);
      const dto = plainToClass(CreateExpenseDto, row);
      const validationErrors = await validate(dto);

      if (validationErrors.length > 0) {
        errors.push({
          line: lineNumber,
          error: validationErrors
            .map((err) => Object.values(err.constraints || {}).join(', '))
            .join('; '),
        });
      } else {
        try {
          await this.addExpense(dto);
        } catch (e) {
          errors.push({
            line: lineNumber,
            error: e.message,
          });
        }
      }
    });
  }
}
