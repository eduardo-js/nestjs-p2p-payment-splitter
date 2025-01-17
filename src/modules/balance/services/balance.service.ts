import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ExpenseGroupCreatedEvent } from '@/modules/expense-group/events';
import { ExpenseCreatedEvent } from '@/modules/expense/events';
import { SplitType } from '@/modules/expense/enums';
import { SettleDebtDto } from '../dtos';
import { BalanceSettledEvent } from '../events';
import { IGunService } from '@/modules/gun/interfaces';
import IExpenseGroupService from '@/modules/expense-group/interfaces/expense-group.interface';
import { IBalanceService } from '../interfaces';
import { IEventEmitterService } from '@/modules/event-emitter/interfaces';

@Injectable()
export default class BalanceService implements IBalanceService {
  private readonly scope = 'balances';
  private readonly expenseGroupScope = `expenseGroup`;
  constructor(
    @Inject('GunService') private readonly gunService: IGunService,
    @Inject('ExpenseGroupService')
    private readonly expensesGroupService: IExpenseGroupService,
    @Inject('EventEmitterService')
    private readonly eventEmitter: IEventEmitterService,
  ) { }

  @OnEvent('expenseGroup.created')
  async createWallets(data: ExpenseGroupCreatedEvent) {
    const expenseGroupNode = this.gunService.getNode(
      `${this.expenseGroupScope}/${data.expenseGroupId}`,
    );
    expenseGroupNode.put({ totalParticipants: data.participants.length });
    let index = 0;
    for (const participantA of data.participants) {
      expenseGroupNode
        .get('participants')
        .get(index.toString())
        .put(participantA);
      index++;
      const participantNode = expenseGroupNode.get(
        `balances/${participantA.name}`,
      );
      for (const participantB of data.participants) {
        if (participantA.name === participantB.name) continue;
        participantNode.get(participantB.name).put({ balance: 0 });
      }
    }
  }

  @OnEvent('expense.created')
  async updateWallets(data: ExpenseCreatedEvent) {
    const expenseGroup = await this.expensesGroupService.getExpenseGroup(
      data.expenseGroupId,
    );
    const participants =
      data.splitType === SplitType.EQUALLY
        ? expenseGroup.participants.map((el) => el.name)
        : data.splitBetween;

    const totalParticipants = participants.length;
    const splits = this.calculateProportionalSplit(
      data.amount,
      totalParticipants,
    );

    const transactions = participants
      .sort()
      .filter((participant) => participant !== data.paidBy)
      .map((participant, index) => {
        const amountOwed = splits[index];
        return {
          payer: data.paidBy,
          participant,
          amountOwed,
        };
      });

    await this.processMultipleTransactions({
      expenseGroupId: data.expenseGroupId,
      transactions,
    });
  }
  calculateProportionalSplit(totalAmount: number, participants: number): number[] {
    let lower = 0.01; 
    let upper = totalAmount / participants; 

    let baseSplit = 0;
    while (this.roundNumber(lower) < this.roundNumber(upper)) {
      const mid = this.roundNumber((lower + upper) / 2);

      const totalDistributed = this.roundNumber(mid * participants);

      if (totalDistributed <= totalAmount) {
        baseSplit = mid;
        lower = mid + 0.01; 
      } else {
        upper = mid - 0.01; 
      }
    }

    const splits = new Array(participants).fill(baseSplit);

    const totalDistributed = this.roundNumber(baseSplit * participants);
    let remainder = this.roundNumber(totalAmount - totalDistributed);

    let i = 0;
    while (remainder > 0 && i < participants) {
      const increment = this.roundNumber(Math.min(remainder, 0.01));
      splits[i] += increment;
      remainder -= increment;
      i++;
    }

    const totalSum = splits.reduce((sum, value) => sum + value, 0);
    const diff = this.roundNumber(totalSum) - totalAmount
    if (diff) {
      splits[0] = this.roundNumber(splits[0] + Math.abs(diff))
    }

    return splits;
  }



  roundNumber(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  async getGroupBalanceByID(id: string): Promise<Record<string, any>> {
    const group = await this.expensesGroupService.getExpenseGroup(id);
    if (!group) throw new NotFoundException('Expense group not found');

    const balances: Record<string, any> = {};

    const participants = await this.gunService.getData(
      `${this.expenseGroupScope}/${id}/participants`,
    );
    if (!participants)
      throw new NotFoundException('Participants not found in the group');

    for (const participant of group.participants) {
      const balancesNode = await this.gunService.getData(
        `${this.expenseGroupScope}/${id}/balances/${participant.name}`,
      );

      const participantBalances: Record<string, any> = {};
      for (const [key, value] of Object.entries(balancesNode)) {
        if (key === '_') continue;
        const { _, ...balanceData } = await this.gunService.getData(value['#']);
        participantBalances[key] = balanceData;
      }

      balances[participant.name] = participantBalances;
    }

    return { balances };
  }

  async processTransaction(data: {
    expenseGroupId: string;
    paidBy: string;
    participant: string;
    amountOwed: number;
  }) {
    const payerKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${data.paidBy}/${data.participant}`;
    const participantKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${data.participant}/${data.paidBy}`;

    const [payerNode, participantNode]: [any, any] = await Promise.all([
      new Promise((resolve, reject) =>
        this.gunService
          .getNode(payerKey)
          .once((data) =>
            data ? resolve(data) : reject(new Error('Payer node not found')),
          ),
      ),
      new Promise((resolve, reject) =>
        this.gunService
          .getNode(participantKey)
          .once((data) =>
            data
              ? resolve(data)
              : reject(new Error('Participant node not found')),
          ),
      ),
    ]);

    if (!payerNode || !participantNode) {
      throw new Error('Transaction failed: Missing node data');
    }

    const newPayerBalance = payerNode.balance + data.amountOwed;
    const newParticipantBalance = participantNode.balance - data.amountOwed;

    try {
      await Promise.all([
        new Promise((resolve, reject) =>
          this.gunService
            .getNode(payerKey)
            .put({ balance: newPayerBalance }, (ack: any) => {
              if (ack.err) reject(new Error('Failed to update payer node'));
              else resolve(ack);
            }),
        ),
        new Promise((resolve, reject) =>
          this.gunService
            .getNode(participantKey)
            .put({ balance: newParticipantBalance }, (ack: any) => {
              if (ack.err)
                reject(new Error('Failed to update participant node'));
              else resolve(ack);
            }),
        ),
      ]);
    } catch (error) {
      Logger.error(`Transaction failed: ${error.message}`);
    }
  }
  async processMultipleTransactions(data: {
    expenseGroupId: string;
    transactions: {
      payer: string;
      participant: string;
      amountOwed: number;
    }[];
  }) {
    const updates: { key: string; newBalance: number }[] = [];
    const currentBalances: Record<string, any> = {};

    await Promise.all(
      data.transactions.map(async (transaction) => {
        const { payer, participant } = transaction;
        const payerKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${payer}/${participant}`;
        const participantKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${participant}/${payer}`;

        if (!currentBalances[payerKey]) {
          currentBalances[payerKey] = await new Promise((resolve, _reject) =>
            this.gunService
              .getNode(payerKey)
              .once((data) => resolve(data || { balance: 0 })),
          );
        }

        if (!currentBalances[participantKey]) {
          currentBalances[participantKey] = await new Promise(
            (resolve, _reject) =>
              this.gunService
                .getNode(participantKey)
                .once((data) => resolve(data || { balance: 0 })),
          );
        }
      }),
    );

    for (const transaction of data.transactions) {
      const { payer, participant, amountOwed } = transaction;
      const payerKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${payer}/${participant}`;
      const participantKey = `${this.expenseGroupScope}/${data.expenseGroupId}/balances/${participant}/${payer}`;

      const currentPayer = currentBalances[payerKey];
      const currentParticipant = currentBalances[participantKey];

      updates.push(
        {
          key: payerKey,
          newBalance: (currentPayer.balance || 0) + amountOwed,
        },
        {
          key: participantKey,
          newBalance: (currentParticipant.balance || 0) - amountOwed,
        },
      );
    }

    try {
      await Promise.all(
        updates.map(
          ({ key, newBalance }) =>
            new Promise((resolve, reject) =>
              this.gunService
                .getNode(key)
                .put({ balance: newBalance }, (ack: any) => {
                  if (ack.err) reject(new Error(`Failed to update ${key}`));
                  else resolve(ack);
                }),
            ),
        ),
      );
    } catch (error) {
      Logger.error(`Transaction failed: ${error.message}`);
    }
  }

  async settleDebt(expenseGroupId: string, settleDebtDto: SettleDebtDto) {
    const group =
      await this.expensesGroupService.getExpenseGroup(expenseGroupId);
    if (!group) {
      throw new NotFoundException('Expense group not found');
    }
    const transactions = [
      {
        payer: settleDebtDto.payer,
        participant: settleDebtDto.payee,
        amountOwed: settleDebtDto.amount,
      },
      {
        payer: settleDebtDto.payee,
        participant: settleDebtDto.payer,
        amountOwed: -settleDebtDto.amount,
      },
    ];
    await this.processMultipleTransactions({ expenseGroupId, transactions });

    this.eventEmitter.emit(
      `${this.scope}.settled`,
      new BalanceSettledEvent(expenseGroupId, settleDebtDto),
    );
  }
}
