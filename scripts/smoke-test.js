#!/usr/bin/env node
/**
 * Trường Thành Bookstore — Cross-Platform Automated Smoke Test
 * Usage: node scripts/smoke-test.js [TARGET_URL]
 */

const targetUrl = process.argv[2] || 'http://localhost:3000';
const expectedRelease = process.argv[3] || '';
const healthEndpoint = `${targetUrl.replace(/\/+$/, '')}/api/health`;
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 15);
const waitMs = Number(process.env.WAIT_SECONDS || 3) * 1000;

console.log('======================================================================');
console.log(`🚀 Starting Automated Smoke Test against: ${healthEndpoint}`);
console.log('======================================================================');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSmokeTest() {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[${attempt}/${maxAttempts}] Pinging health endpoint: ${healthEndpoint}...`);
    try {
      const response = await fetch(healthEndpoint, { method: 'GET' });
      const statusCode = response.status;
      const data = await response.json().catch(() => null);

      const releaseMatches = !expectedRelease || data?.release === expectedRelease;
      if (statusCode === 200 && data && data.status === 'UP' && data.database?.status === 'HEALTHY' && releaseMatches) {
        console.log('  Status Code: 200 OK');
        console.log('  Payload validation: PASSED');
        console.log(`  Database Status: ${data.database.status} (${data.database.state})`);
        console.log(`  Uptime: ${Math.round(data.system?.uptime || 0)}s`);
        console.log('======================================================================');
        console.log('✅ SMOKE TEST PASSED: Backend is UP and Database is HEALTHY!');
        console.log('======================================================================');
        process.exit(0);
      } else {
        console.log(`  ⚠️ Status: ${statusCode}, Body:`, data);
      }
    } catch (err) {
      console.log(`  ⚠️ Connection failed: ${err.message}`);
    }

    if (attempt < maxAttempts) {
      console.log(`  Waiting ${waitMs / 1000}s before next retry...`);
      await sleep(waitMs);
    }
  }

  console.log('======================================================================');
  console.log(`❌ SMOKE TEST FAILED: Service did not become HEALTHY within ${ (maxAttempts * waitMs) / 1000 }s`);
  console.log('======================================================================');
  process.exit(1);
}

runSmokeTest();
