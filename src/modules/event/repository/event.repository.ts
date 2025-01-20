import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import EventEntity from '../entity/event.entity';
import { EventStatus } from '../enums';

@Injectable()
export class EventRepository {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventEntityRepository: Repository<EventEntity>,
  ) { }

  async saveEvent(
    id: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const event = this.eventEntityRepository.create({
      id,
      event_type: eventType,
      payload,
    });
    await this.eventEntityRepository.save(event);
  }

  async findEventById(id: string): Promise<EventEntity | null> {
    return this.eventEntityRepository.findOne({ where: { id } });
  }

  async updateEventStatus(
    id: string,
    status: EventStatus.PROCESSED | EventStatus.FAILED,
    processedAt?: Date,
  ): Promise<void> {
    await this.eventEntityRepository.update(id, {
      status,
      processed_at: processedAt || new Date(),
    });
  }

  async getPendingEvents(): Promise<EventEntity[]> {
    return this.eventEntityRepository.find({ where: { status: EventStatus.PENDING } });
  }
}
