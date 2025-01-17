import { Injectable, Body, NotFoundException, Inject } from '@nestjs/common';
import { CreateExpenseGroupDto, ExpenseGroupParticipantDto } from '../dtos';
import { ExpenseGroupCreatedEvent } from '../events';
import { IGunService } from '@/modules/gun/interfaces';
import { IExpenseGroupService } from '../interfaces';
import { IEventEmitterService } from '@/modules/event-emitter/interfaces';

@Injectable()
export default class ExpenseGroupService implements IExpenseGroupService {
  private readonly scope = 'expenseGroup';
  constructor(
    @Inject('GunService') private readonly gunService: IGunService,
    @Inject('EventEmitterService')
    private readonly eventEmitter: IEventEmitterService,
  ) {}

  async addExpenseGroup(@Body() expenseGroup: CreateExpenseGroupDto) {
    const { participants, ...rest } = expenseGroup;
    expenseGroup.participants = null;

    this.gunService.setData(`${this.scope}/${expenseGroup.id}`, rest);

    this.eventEmitter.emit(
      `${this.scope}.created`,
      new ExpenseGroupCreatedEvent(expenseGroup.id, participants),
    );
    return { message: { id: expenseGroup.id } };
  }

  async getExpenseGroup(
    id: string,
  ): Promise<{ name: string; participants: ExpenseGroupParticipantDto[] }> {
    const expenseGroup = await this.gunService.getData(`${this.scope}/${id}`);
    if (!expenseGroup) {
      throw new NotFoundException(`Expense group with ID ${id} not found.`);
    }

    const participants: ExpenseGroupParticipantDto[] = [];
    const expenseGroupParticipants = (await this.gunService.getData(
      `${this.scope}/${id}/participants`,
    )) as any;
    for (const participant of Object.keys(expenseGroupParticipants)) {
      if (participant === '_') continue;
      const participantData = (await this.gunService.getData(
        `${this.scope}/${id}/participants/${participant}`,
      )) as any;
      participants.push({
        email: participantData.email,
        name: participantData.name,
      });
    }

    return {
      name: expenseGroup.name,
      participants,
    };
  }
}
