class MockGunChain {
  private data: any = {};
  private children: Record<string, MockGunChain> = {};

  constructor(private readonly key: string) { }

  put = jest.fn((data: any) => {
    this.data = { ...this.data, ...data };
  });

  once(callback: Function) {
    callback(this.data);
  }

  get(subKey: string) {
    if (!this.children[subKey]) {
      this.children[subKey] = new MockGunChain(`${this.key}/${subKey}`);
    }
    return this.children[subKey];
  }
}

export class MockGunService {
  private nodes: Record<string, MockGunChain> = {};

  onModuleInit() {
    console.log('MockGunService initialized');
  }

  getGunInstance(): any {
    return { instance: 'mock-gun-instance' };
  }

  getNode(key: string) {
    if (!this.nodes[key]) {
      this.nodes[key] = new MockGunChain(key);
    }
    return this.nodes[key];
  }
}
