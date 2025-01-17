import { IGunInstance, IGunChain } from 'gun';

export default interface IGunService {
  onModuleInit(): void;

  getGunInstance(): IGunInstance;

  setData(key: string, data: any): Promise<void>;

  getData(key: string): Promise<any>;

  getNode(key: string): IGunChain<any, any, any, any>;
}
