#!/usr/bin/env node
/**
 * Trường Thành Bookstore — Catalog & Search Load Benchmark
 * Usage: node scripts/load/catalog-search.load.js [TARGET_URL] [CONCURRENCY] [DURATION_SEC] [DELAY_MS]
 * Example: node scripts/load/catalog-search.load.js http://localhost:3000 5 5 10
 */

const targetUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const concurrency = Number(process.argv[3] || 5);
const durationSec = Number(process.argv[4] || 5);
const delayMs = Number(process.argv[5] || 0);
if (!Number.isSafeInteger(concurrency) || concurrency < 1 ||
    !Number.isFinite(durationSec) || durationSec <= 0 ||
    !Number.isFinite(delayMs) || delayMs < 0) {
  throw new Error('Require positive integer concurrency, positive duration and nonnegative delay');
}

const endpoints = [
  '/api/products?limit=12&page=1',
  '/api/products?limit=12&page=1&sort=price_asc',
  '/api/products?limit=12&page=1&sort=best_selling',
  '/api/products?q=s%C3%A1ch',
  '/api/products?q=b%C3%BAt',
  '/api/categories',
];

console.log('======================================================================');
console.log('🚀 Trường Thành Bookstore — Catalog & Search Load Benchmark');
console.log(`Target:      ${targetUrl}`);
console.log(`Concurrency: ${concurrency} workers`);
console.log(`Duration:    ${durationSec}s`);
console.log(`Delay:       ${delayMs}ms between requests/worker`);
console.log(`Endpoints:   ${endpoints.length} routes sampled`);
console.log('======================================================================\n');

const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

async function benchmark() {
  const latencies = [];
  let totalRequests = 0;
  let successfulRequests = 0;
  let throttledRequests = 0;
  let serverErrors = 0;
  let clientErrors = 0;
  const statusCounts = {};

  const startedAt = performance.now();
  const endTime = Date.now() + durationSec * 1000;

  async function worker(workerId) {
    let reqIndex = workerId % endpoints.length;
    while (Date.now() < endTime) {
      const path = endpoints[reqIndex % endpoints.length];
      reqIndex++;
      const url = `${targetUrl}${path}`;
      const start = performance.now();
      totalRequests++;

      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        });
        await res.arrayBuffer();
        const elapsed = performance.now() - start;

        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        if (res.ok) {
          successfulRequests++;
          latencies.push(elapsed);
        } else if (res.status === 429) {
          throttledRequests++;
        } else if (res.status >= 500) {
          serverErrors++;
        } else {
          clientErrors++;
        }
      } catch (err) {
        serverErrors++;
        statusCounts['NETWORK_ERROR'] = (statusCounts['NETWORK_ERROR'] || 0) + 1;
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  // Statistics calculation
  latencies.sort((a, b) => a - b);
  const totalDurationSec = (performance.now() - startedAt) / 1000;
  const rps = Math.round((totalRequests / totalDurationSec) * 10) / 10;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg =
    latencies.length > 0
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
      : 0;

  console.log('======================================================================');
  console.log('📊 BENCHMARK RESULTS');
  console.log('======================================================================');
  console.log(`Total Requests:          ${totalRequests.toLocaleString()}`);
  console.log(`Successful (2xx):        ${successfulRequests.toLocaleString()}`);
  console.log(`Throttled (429 RateLimit):${throttledRequests.toLocaleString()}`);
  console.log(`Client Errors (4xx excl 429): ${clientErrors.toLocaleString()}`);
  console.log(`Server / Net Errors (5xx): ${serverErrors.toLocaleString()}`);
  console.log(`Throughput:              ${rps} req/sec`);
  console.log('----------------------------------------------------------------------');
  console.log('Latency Percentiles:');
  console.log(`  Avg:                   ${avg.toFixed(1)} ms`);
  console.log(`  p50 (Median):          ${p50.toFixed(1)} ms`);
  console.log(`  p90:                   ${p90.toFixed(1)} ms`);
  console.log(`  p95:                   ${p95.toFixed(1)} ms`);
  console.log(`  p99:                   ${p99.toFixed(1)} ms`);
  console.log('----------------------------------------------------------------------');
  console.log('HTTP Status Breakdown:');
  for (const [code, count] of Object.entries(statusCounts)) {
    console.log(`  ${code}: ${count} (${Math.round((count / totalRequests) * 100)}%)`);
  }
  console.log('======================================================================');

  // SLA Assertions:
  // 1. Zero 5xx server errors
  // 2. Zero unexpected client errors (400, 404, etc.)
  // 3. Sub-500ms p95 latency for successful, fully consumed responses
  const hasServerError = serverErrors > 0;
  const hasClientError = clientErrors > 0;

  if (successfulRequests > 0 && throttledRequests === 0 && !hasServerError && !hasClientError && p95 < 500) {
    console.log('✅ BENCHMARK PASSED: 0 server errors, 0 invalid client requests, high performance!');
    process.exit(0);
  } else {
    console.error(`❌ BENCHMARK FAILED: ServerErrors=${serverErrors}, ClientErrors=${clientErrors}, p95=${p95.toFixed(1)}ms`);
    process.exit(1);
  }
}

benchmark().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
