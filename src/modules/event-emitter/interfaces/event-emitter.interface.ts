export default interface IEventEmitterService {
  emit(event: string, payload: any): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}
