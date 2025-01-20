import { IEventEmitterService } from "../interfaces";

export class MockEventEmitter implements IEventEmitterService {
  save(event: string, payload: any): void {
    console.log(`Event emitted: ${event}`, payload);
  }

  on(event: string, callback: Function): void {
    console.log(`Event listener added for: ${event}`);
  }

  off(event: string, callback: Function): void {
    console.log(`Event listener removed for: ${event}`);
  }
}
