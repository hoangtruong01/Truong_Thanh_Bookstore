import { isDemoSeedSafeUri, isLocalMongoUri } from './seed-safety';

describe('TASK-006: seed target safety', () => {
  it.each([
    'mongodb://127.0.0.1:27017/truong_thanh_bookstore',
    'mongodb://admin:admin123456@127.0.0.1:27017/truong_thanh_bookstore?replicaSet=rs0&authSource=admin',
    'mongodb://localhost/truongthanh',
    'mongodb://admin:pw@mongodb:27017/truong_thanh_bookstore?replicaSet=rs0',
    'mongodb://[::1]:27017/db',
  ])('treats %s as local', (uri) => {
    expect(isLocalMongoUri(uri)).toBe(true);
    expect(isDemoSeedSafeUri(uri)).toBe(true);
  });

  it.each([
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh?retryWrites=true',
    'mongodb://user:pass@10.0.0.5:27017/truongthanh',
    // a remote host disguised after a local one must not pass
    'mongodb://127.0.0.1:27017,db.example.com:27017/truongthanh?replicaSet=rs0',
    // credentials containing "localhost" must not fool the host check
    'mongodb://localhost:secret@cluster0.mongodb.net/truongthanh',
    '',
    undefined,
    'not-a-uri',
  ])('refuses demo seeding on %s', (uri) => {
    expect(isLocalMongoUri(uri)).toBe(false);
    expect(isDemoSeedSafeUri(uri)).toBe(false);
  });

  it.each([
    // substring look-alikes of the markers are real production names
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/shop_latest',
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/contest',
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/demographics',
    // MongoDB's implicit default db, frequently the real production db
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/test?retryWrites=true',
    // no db name at all
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/',
  ])('does not mistake %s for a test database', (uri) => {
    expect(isDemoSeedSafeUri(uri)).toBe(false);
  });

  it.each([
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh_staging',
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh-e2e',
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh.demo',
    'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh_test',
  ])('accepts the explicitly named non-production database %s', (uri) => {
    expect(isDemoSeedSafeUri(uri)).toBe(true);
  });

  it('allows demo data on remote databases explicitly named for staging/test, but not default passwords', () => {
    const staging =
      'mongodb+srv://user:pass@cluster0.abcde.mongodb.net/truongthanh_staging';
    expect(isDemoSeedSafeUri(staging)).toBe(true);
    expect(isLocalMongoUri(staging)).toBe(false);
  });
});
