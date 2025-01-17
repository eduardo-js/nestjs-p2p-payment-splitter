import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateExpenseGroupDto } from '../dtos';
import { GenerateIDPipe } from '@/utils/pipes';
import IExpenseGroupService from '../interfaces/expense-group.interface';

@ApiTags('expense-group')
@Controller('expense-group')
export default class ExpensesGroupController {
  constructor(
    @Inject('ExpenseGroupService')
    private readonly expensesGroupService: IExpenseGroupService,
  ) {}

  @Post('')
  @ApiOperation({ summary: 'Add a new expense group' })
  @ApiResponse({
    status: 201,
    description: 'Expense group added successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  addExpense(@Body(new GenerateIDPipe()) expenseGroup: CreateExpenseGroupDto) {
    const res = this.expensesGroupService.addExpenseGroup(expenseGroup);
    return res;
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({
    status: 200,
    description: 'Expense group fetched successfully.',
  })
  @ApiResponse({ status: 404, description: 'Expense group not found.' })
  async getExpense(@Param('id') id: string) {
    return await this.expensesGroupService.getExpenseGroup(id);
  }
}
