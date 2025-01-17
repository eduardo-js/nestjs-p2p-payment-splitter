import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GunService } from './gun.service';

describe('P2P Synchronization (e2e)', () => {
  let appA: INestApplication;
  let appB: INestApplication;
  let gunServiceA: GunService;
  let gunServiceB: GunService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = 'test';
    const moduleFixtureA: TestingModule = await Test.createTestingModule({
      providers: [GunService],
    }).compile();

    process.env.PORT = '3000';
    appA = moduleFixtureA.createNestApplication();
    await appA.listen(3000);
    gunServiceA = appA.get<GunService>(GunService);

    const moduleFixtureB: TestingModule = await Test.createTestingModule({
      providers: [GunService],
    }).compile();

    process.env.PORT = '3001';
    appB = moduleFixtureB.createNestApplication();
    await appB.listen(3001);
    gunServiceB = appB.get<GunService>(GunService);
    await new Promise<void>((resolve, _) => {
      setTimeout(() => resolve(), 3000);
    });
  });

  afterAll(async () => {
    await appA.close();
    await appB.close();
    process.exit(0);
  });

  it('should synchronize data across peers', async () => {
    await gunServiceA.setData('expenseGroup/test', {
      name: 'Group A',
    });
    const fetchedData = await gunServiceB.getData('expenseGroup/test');
    expect(fetchedData).toHaveProperty('name', 'Group A');
  });
});
