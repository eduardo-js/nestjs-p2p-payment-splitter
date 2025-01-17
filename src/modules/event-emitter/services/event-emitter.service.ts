import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventEmitterService } from '../interfaces';

@Injectable()
export default class EventEmitterService implements IEventEmitterService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: string, payload: any): void {
    this.eventEmitter.emit(event, payload);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
}
