import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import BalanceService from '../services/balance.service';
import { SettleDebtDto } from '../dtos';

@ApiTags('balance')
@Controller('balance')
export default class BalanceController {
  constructor(
    @Inject('BalanceService') private readonly balanceService: BalanceService,
  ) {}
  @Get(':id')
  @ApiOperation({ summary: 'Get wallet by expense group ID' })
  @ApiResponse({ status: 200, description: 'Wallet fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Wallet group not found.' })
  async getBalanceByExpenseGroupID(@Param('id') id: string) {
    return await this.balanceService.getGroupBalanceByID(id);
  }
  @Post(':expenseGroupId/settle')
  @ApiOperation({
    summary: 'Settle debts between users in the specified expense group.',
  })
  @ApiResponse({ status: 200, description: 'Debt settled successfully.' })
  @ApiResponse({ status: 404, description: 'Expense group not found.' })
  async settleDebt(
    @Param('expenseGroupId') expenseGroupId: string,
    @Body() settleDebtDto: SettleDebtDto,
  ) {
    return await this.balanceService.settleDebt(expenseGroupId, settleDebtDto);
  }
}
