import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventEmitterService } from '../interfaces';
import { EventRepository } from '../repository/event.repository';
import { randomUUID } from 'crypto';
import { EventStatus } from '../enums';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export default class EventEmitterService implements IEventEmitterService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: EventRepository

  ) { }

  async save(event: string, payload: any): Promise<void> {
    const id = randomUUID()
    await this.saveNewEvent(id, event, payload)
    this.processEvent(id)

  }

  private async saveNewEvent(
    id: string,
    type: string,
    payload: Record<string, any>,
  ): Promise<void> {
    await this.repo.saveEvent(id, type, payload);
  }

  async processEvent(id: string,
  ): Promise<void> {

    const event = await this.repo.findEventById(id);

    if (!event) {
      throw new Error(`Event ${id} not found`);
    }

    if (event.status === 'PROCESSED') {
      Logger.log(`Event ${id} already processed.`);
      return;
    }

    try {
      await this.eventEmitter.emitAsync(event.event_type, event.payload);
      await this.repo.updateEventStatus(id, EventStatus.PROCESSED);
    } catch (error) {
      Logger.error(`Error processing event ${id}:`, error);
      await this.repo.updateEventStatus(id, EventStatus.FAILED);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingEvents() {
    const pendingEvents = await this.repo.getPendingEvents();
    for (const event of pendingEvents) {
      this.processEvent(event.id);
    }
  }
}

