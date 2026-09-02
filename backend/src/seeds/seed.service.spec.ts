import { SeedService } from './seed.service';

describe('SeedService startup safety', () => {
  const makeService = (env: Record<string, string> = {}) => {
    const model = {
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    };
    const models = Array.from({ length: 8 }, () => ({ ...model }));
    const config = { get: jest.fn((key: string) => env[key]) };
    const service = new (SeedService as any)(...models, config) as SeedService;
    return { service, models };
  };

  it('does not inspect or mutate the database when automatic seeding is disabled', async () => {
    const { service, models } = makeService({ AUTO_SEED: 'false' });
    const clearSpy = jest.spyOn(service, 'clearDatabase');
    const seedSpy = jest.spyOn(service, 'seed');

    await service.onModuleInit();

    for (const model of models) expect(model.countDocuments).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it('refuses an explicit reset in production before touching the database', async () => {
    const { service, models } = makeService({
      AUTO_SEED: 'true',
      RESET_DATABASE_ON_SEED: 'true',
      NODE_ENV: 'production',
    });

    await expect(service.onModuleInit()).rejects.toThrow('forbidden in production');
    for (const model of models) expect(model.countDocuments).not.toHaveBeenCalled();
  });

  it('does not clear a partially populated database without an explicit reset', async () => {
    const { service } = makeService({ AUTO_SEED: 'true' });
    const clearSpy = jest.spyOn(service, 'clearDatabase');
    const seedSpy = jest.spyOn(service, 'seed');

    await service.onModuleInit();

    expect(clearSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
  });
});
