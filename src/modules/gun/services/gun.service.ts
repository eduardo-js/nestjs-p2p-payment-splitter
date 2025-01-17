import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Gun, { IGunChain, IGunInstance } from 'gun';
import { IGunService } from '../interfaces';

@Injectable()
export default class GunService implements IGunService, OnModuleInit {
  private gun: IGunInstance;

  onModuleInit() {
    this.gun = Gun({
      file: `${process.env.NODE_ENV}_${process.env.PORT}`,
      peers: process.env.PEERS?.split(',')?.map((el) => el.trim()) ?? [],
    });
    Logger.log('Gun.js initialized!');
  }

  getGunInstance() {
    return this.gun;
  }

  async setData(key: string, data: any): Promise<void> {
    if (!this.gun) {
      throw new Error('Gun instance not initialized');
    }

    return new Promise((resolve, reject) => {
      const node = this.gun.get(key);
      node.put(data, (ack: any) => {
        if (ack.err) {
          return reject(ack.err);
        }
        resolve(ack);
      });
    });
  }

  async getData(key: string): Promise<any> {
    return this.gun.get(key);
  }
  getNode(key: string): IGunChain<any, any, any, any> {
    return this.gun.get(key);
  }
}
