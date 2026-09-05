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
