# Local load checks

Run only against an isolated test database. The checkout script creates real
orders and consumes inventory; it does not cancel or delete them afterwards.

```sh
node --test scripts/load/load.test.js
node scripts/load/catalog-search.load.js http://127.0.0.1:3008 2 5 100
node scripts/load/concurrent-orders.load.js http://127.0.0.1:3008 10
```

Seed a dedicated active product with a known positive stock (e.g. 3 units for
10 checkout requests). The script uses the public order DTO and unique
idempotency keys. It requires at least one successful checkout, zero unexpected
responses, a successful final product read, and exact stock conservation.
Do not run unrelated writers against that product while measuring.

These are Node.js fetch scripts, not autocannon. The default order endpoint is
limited to 10 requests/minute per IP; HTTP 429 makes a load check fail. Wait for
the limit to expire between runs. Catalog p95 is measured on successful complete
responses only; zero successes and any throttling cannot yield a PASS.

On 2026-09-05 the isolated local run returned 92/92 catalog responses (p95 9ms)
and 3 successful orders + 7 stock rejections from 3 initial units, final stock 0.
This small local sample does not establish production capacity or a production SLA.

## Offline QA and evidence (2026-09-06)

Catalog now requires every configured route to have successful samples and p95
below 500ms, in addition to zero HTTP/network errors and throttling. Set
`LOAD_REPORT_PATH` to save JSON metrics, including per-route results. One sample
per route is only a harness sanity gate; representative staging volume is still required.

Build the current backend before capturing its actual reporting pipelines:

```sh
npm --prefix backend run build
node --test scripts/load/load.test.js scripts/load/report-explain.test.cjs
node scripts/load/report-explain.cjs --dry-run 2026-09-01T00:00:00Z 2026-09-06T23:59:59Z report-pipelines.json
```

Dry-run opens no database connection and provides no timing or accuracy verdict.
For a later staging run, set `MONGODB_URI` and `MONGODB_DB_NAME` locally using a
read-only database account, then replace `--dry-run` with `--execute`. This calls
`explain('executionStats')` on the application's date revenue and category revenue
pipelines with a 60-second limit per query. It starts no application/cron jobs and
performs no writes. Category revenue covers all dates, matching the application.
Review document counts, scans/indexes and timings against representative data;
the script deliberately does not declare the staging release gate passed.
Treat database execution plans as internal artifacts; do not publish credentials
or infrastructure details. Each artifact records the compiled service SHA-256.
