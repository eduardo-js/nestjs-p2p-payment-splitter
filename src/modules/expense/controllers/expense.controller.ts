import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Inject,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateExpenseDto } from '../dtos';
import { GenerateIDPipe } from '@/utils/pipes';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileFormatValidation } from '@/utils/validators';
import { IExpenseService } from '../interfaces';

@ApiTags('expense')
@Controller('expense')
export default class ExpenseController {
  constructor(
    @Inject('ExpenseService') private readonly expenseService: IExpenseService,
  ) {}

  @Post('')
  @ApiOperation({ summary: 'Add a new expense' })
  @ApiResponse({ status: 201, description: 'Expense added successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  addExpense(@Body(new GenerateIDPipe()) expense: CreateExpenseDto) {
    const res = this.expenseService.addExpense(expense);
    return res;
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async getExpense(@Param('id') id: string) {
    return await this.expenseService.getExpense(id);
  }

  @Post(':expenseGroupId/batch')
  @ApiResponse({
    status: 200,
    description: 'Expense batch processed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid file.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing batch expense data',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async processBatch(
    @UploadedFile(new FileFormatValidation(['text/csv']))
    file: Express.Multer.File,
  ) {
    return await this.expenseService.processBatch(file);
  }
}
