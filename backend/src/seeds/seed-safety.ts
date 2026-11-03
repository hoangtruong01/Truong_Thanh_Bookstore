/**
 * TASK-006 (BUG-003): guards that keep demo seed data and default passwords
 * out of real databases.
 */

// `mongodb` is the docker-compose service name of the local replica set.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mongodb']);
// Matched against whole name tokens (split on _ - .), never substrings: "shop_latest"
// or "contest" must not count. A db named exactly "test" is MongoDB's implicit default
// and is often the real production db, so it never counts on a remote host.
const NON_PRODUCTION_DB_TOKENS = new Set(['test', 'staging', 'e2e', 'demo']);

function isNonProductionDbName(dbName: string): boolean {
  const name = dbName.toLowerCase();
  if (name === 'test') return false;
  return name
    .split(/[_\-.]+/)
    .some((token) => NON_PRODUCTION_DB_TOKENS.has(token));
}

function parseMongoUri(
  uri?: string,
): { hosts: string[]; dbName: string } | null {
  const match = uri?.match(
    /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)(?:\/([^?]*))?/i,
  );
  if (!match) return null;
  const hosts = match[1].split(',').map((host) =>
    host
      .trim()
      .toLowerCase()
      .replace(/:\d+$/, '')
      .replace(/^\[(.*)\]$/, '$1'),
  );
  return { hosts, dbName: match[2] || '' };
}

/** Every host of the URI is on this machine / the local docker network. */
export function isLocalMongoUri(uri?: string): boolean {
  const parsed = parseMongoUri(uri);
  return !!parsed && parsed.hosts.every((host) => LOCAL_HOSTS.has(host));
}

/** Demo data may be written: local database, or a database explicitly named for test/staging. */
export function isDemoSeedSafeUri(uri?: string): boolean {
  const parsed = parseMongoUri(uri);
  if (!parsed) return false;
  return isLocalMongoUri(uri) || isNonProductionDbName(parsed.dbName);
}
