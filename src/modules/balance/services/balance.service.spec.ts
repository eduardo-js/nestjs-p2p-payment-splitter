import { TestingModule, Test } from '@nestjs/testing';
import BalanceService from './balance.service';
import { ExpenseGroupService } from '@/modules/expense-group/services';
import { MockEventEmitter } from '@/modules/event-emitter/__mock__/event-emitter.mock';
import { MockGunService } from '@/modules/gun/__mock__/gun.service.mock';
import { SplitType } from '@/modules/expense/enums';

const mockExpenseGroupService = jest.mocked(ExpenseGroupService, { shallow: false })

jest.mock('@/modules/expense-group/services')

describe('BalanceService', () => {
  let balanceService: BalanceService;
  let gunService: MockGunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: 'GunService', useClass: MockGunService },
        { provide: 'ExpenseGroupService', useClass: mockExpenseGroupService as unknown as typeof ExpenseGroupService },
        { provide: 'EventEmitterService', useClass: MockEventEmitter },
      ],
    }).compile();

    balanceService = module.get<BalanceService>(BalanceService);
    gunService = module.get<MockGunService>('GunService');
  });

  it('should create wallets for expense group participants', async () => {
    const expenseGroupCreatedEvent = {
      expenseGroupId: 'group1',
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
    };

    await balanceService.createWallets(expenseGroupCreatedEvent);

    const expectedPath = 'expenseGroup/group1';
    const groupNode = gunService.getNode(expectedPath);
    expect(groupNode.put).toHaveBeenCalledWith({
      totalParticipants: expenseGroupCreatedEvent.participants.length,
    });
    expenseGroupCreatedEvent.participants.forEach((participant, index) => {
      const participantNode = groupNode
        .get('participants')
        .get(index.toString());
      expect(participantNode.put).toHaveBeenCalledWith(participant);
      const balanceNode = groupNode.get(`balances/${participant.name}`);
      expenseGroupCreatedEvent.participants.forEach((otherParticipant) => {
        if (participant.name !== otherParticipant.name) {
          const otherBalanceNode = balanceNode.get(otherParticipant.name);
          expect(otherBalanceNode.put).toHaveBeenCalledWith({ balance: 0 });
        }
      });
    });
  });

  it('should process transactions correctly with a EQUALLY split', async () => {
    const mockExpenseGroup = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
    };

    const eventPayload = {
      expenseGroupId: 'group1',
      expenseId: 'expense1',
      amount: 100,
      paidBy: 'Alice',
      splitType: SplitType.EQUALLY,
      splitBetween: [],
    };

    mockExpenseGroupService.prototype.getExpenseGroup.mockResolvedValue(mockExpenseGroup as any);
    jest
      .spyOn(balanceService, 'calculateProportionalSplit')
      .mockReturnValue([50, 50]);
    const processMultipleTransactionsSpy = jest.spyOn(
      balanceService,
      'processMultipleTransactions',
    ).mockResolvedValueOnce();

    await balanceService.updateWallets(eventPayload);

    expect(mockExpenseGroupService.prototype.getExpenseGroup).toHaveBeenCalledWith(
      eventPayload.expenseGroupId,
    );
    expect(balanceService.calculateProportionalSplit).toHaveBeenCalledWith(
      eventPayload.amount,
      mockExpenseGroup.participants.length,
    );
    expect(processMultipleTransactionsSpy).toHaveBeenCalledWith({
      expenseGroupId: eventPayload.expenseGroupId,
      transactions: [
        { payer: 'Alice', participant: 'Bob', amountOwed: 50 },
      ],
    });
  });
  it('should process transactions correctly with a PARTIAL_SPLIT split', async () => {
    const mockExpenseGroup = {
      participants: [{ name: 'Alice' }, { name: 'Bob' }],
    };

    const eventPayload = {
      expenseGroupId: 'group1',
      expenseId: 'expense1',
      amount: 100,
      paidBy: 'Alice',
      splitType: SplitType.PARTIAL_SPLIT,
      splitBetween: ['Bob', 'Peter'],
    };

    mockExpenseGroupService.prototype.getExpenseGroup.mockResolvedValue(mockExpenseGroup as any);
    jest
      .spyOn(balanceService, 'calculateProportionalSplit')
      .mockReturnValue([50, 50]);
    const processMultipleTransactionsSpy = jest.spyOn(
      balanceService,
      'processMultipleTransactions',
    ).mockResolvedValueOnce();

    await balanceService.updateWallets(eventPayload);

    expect(mockExpenseGroupService.prototype.getExpenseGroup).toHaveBeenCalledWith(
      eventPayload.expenseGroupId,
    );
    expect(balanceService.calculateProportionalSplit).toHaveBeenCalledWith(
      eventPayload.amount,
      mockExpenseGroup.participants.length,
    );
    expect(processMultipleTransactionsSpy).toHaveBeenCalledWith({
      expenseGroupId: eventPayload.expenseGroupId,
      transactions: [
        { payer: 'Alice', participant: 'Bob', amountOwed: 50 },
        { payer: 'Alice', participant: 'Peter', amountOwed: 50 },
      ],
    });
  });

  describe('calculateProportionalSplit', () => {

    it('should correctly distribute the amount among participants for small amounts and few participants', () => {
      const totalAmount = 100;
      const participants = 5;

      const splits = balanceService.calculateProportionalSplit(totalAmount, participants);

      const totalSplit = splits.reduce((sum, value) => sum + value, 0);
      expect(totalSplit).toEqual(balanceService.roundNumber(totalAmount));
      splits.some((split) => { expect(split).toBeGreaterThanOrEqual(0); });
      expect(splits.length).toBe(participants);
    });

    it('should ensure splits do not round to zero when there are large participants and a small amount', () => {
      const totalAmount = 1;
      const participants = 100000;

      const splits = balanceService.calculateProportionalSplit(totalAmount, participants);

      const totalSplit = splits.reduce((sum, value) => sum + value, 0);
      expect(totalSplit).toBeCloseTo(totalAmount)
    });

    it('should handle large numbers of participants correctly', () => {
      const totalAmount = 100;
      const participants = 500;

      const splits = balanceService.calculateProportionalSplit(totalAmount, participants);

      const totalSplit = splits.reduce((sum, value) => sum + value, 0);
      expect(totalSplit).toBeCloseTo(balanceService.roundNumber(totalAmount));
      splits.forEach((split) => {
        expect(split).toBeGreaterThanOrEqual(0);
      });
      expect(splits.length).toBe(participants);
    });

    it('should ensure all splits are non-negative', () => {
      const totalAmount = 100;
      const participants = 50000;

      const splits = balanceService.calculateProportionalSplit(totalAmount, participants);

      splits.forEach((split) => {
        expect(split).toBeGreaterThanOrEqual(0);
      });
    });
    it('should correctly split 51.33 among 2 to 513 participants', () => {
      const totalAmount = 51.33;
      for (let participants = 2; participants <= 513; participants++) {
        const splits = balanceService.calculateProportionalSplit(totalAmount, participants);

        const totalSplit = splits.reduce((sum, value) => sum + value, 0);

        expect(totalSplit).toBeCloseTo(balanceService.roundNumber(totalAmount));
        expect(splits.length).toBe(participants);
      }

    });
  });


});