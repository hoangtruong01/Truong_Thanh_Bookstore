import { SeedService } from './seed.service';

describe('SeedService startup safety', () => {
  const makeService = (env: Record<string, string> = {}) => {
    const model = {
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
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

    for (const model of models)
      expect(model.countDocuments).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it('refuses an explicit reset in production before touching the database', async () => {
    const { service, models } = makeService({
      AUTO_SEED: 'true',
      RESET_DATABASE_ON_SEED: 'true',
      NODE_ENV: 'production',
    });

    await expect(service.onModuleInit()).rejects.toThrow(
      'forbidden in production',
    );
    for (const model of models)
      expect(model.countDocuments).not.toHaveBeenCalled();
  });

  const ATLAS_URI =
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh';

  it('TASK-006: refuses to write demo data into a production/remote database', async () => {
    const { service, models } = makeService({ MONGODB_URI: ATLAS_URI });
    const deleteMany = jest.fn();
    (models[0] as any).deleteMany = deleteMany;

    await expect(service.seed()).rejects.toThrow('Demo seed refused');
    await expect(service.clearDatabase()).rejects.toThrow(
      'Database reset refused',
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('TASK-006: refuses public default passwords on a remote staging database', async () => {
    const { service, models } = makeService({
      MONGODB_URI:
        'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh_staging',
    });
    (models[0] as any).findOne = jest.fn();

    await expect(service.seed()).rejects.toThrow(
      'SEED_SUPER_ADMIN_PASSWORD is required',
    );
    expect((models[0] as any).findOne).not.toHaveBeenCalled();
  });

  const LOCAL_URI = 'mongodb://localhost:27017/truongthanh';

  it('does not clear a partially populated database without an explicit reset', async () => {
    const { service, models } = makeService({
      AUTO_SEED: 'true',
      MONGODB_URI: LOCAL_URI,
    });
    const clearSpy = jest.spyOn(service, 'clearDatabase');
    const seedSpy = jest.spyOn(service, 'seed');

    await service.onModuleInit();

    // The populated-database branch was actually reached (not an early return).
    expect(models[0].countDocuments).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it('AUTO_SEED on a remote production database logs and skips instead of crashing startup', async () => {
    const { service, models } = makeService({
      AUTO_SEED: 'true',
      MONGODB_URI: ATLAS_URI,
    });
    const clearSpy = jest.spyOn(service, 'clearDatabase');
    const seedSpy = jest.spyOn(service, 'seed');
    const errorSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    for (const model of models)
      for (const method of Object.values(model))
        expect(method).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('AUTO_SEED=true was ignored'),
    );
  });

  it('AUTO_SEED with a missing MONGODB_URI also skips without touching the database', async () => {
    const { service, models } = makeService({ AUTO_SEED: 'true' });
    const seedSpy = jest.spyOn(service, 'seed');
    jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    for (const model of models)
      expect(model.countDocuments).not.toHaveBeenCalled();
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it('AUTO_SEED on a local empty database runs the seed', async () => {
    const { service, models } = makeService({
      AUTO_SEED: 'true',
      MONGODB_URI: LOCAL_URI,
    });
    for (const model of models)
      model.countDocuments = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
    const clearSpy = jest.spyOn(service, 'clearDatabase');
    const seedSpy = jest.spyOn(service, 'seed').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(seedSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).not.toHaveBeenCalled();
  });
});
