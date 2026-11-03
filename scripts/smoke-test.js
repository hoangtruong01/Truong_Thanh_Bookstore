#!/usr/bin/env node
/**
 * Trường Thành Bookstore — Cross-Platform Automated Smoke Test
 * Usage: node scripts/smoke-test.js [TARGET_URL] [EXPECTED_RELEASE]
 */

const targetUrl = process.argv[2] || 'http://localhost:3000';
const expectedRelease = process.argv[3] || '';
const healthEndpoint = `${targetUrl.replace(/\/+$/, '')}/api/health`;
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 15);
const waitMs = Number(process.env.WAIT_SECONDS || 3) * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes both direct health responses and TransformInterceptor wrapped responses ({ success: true, data: { ... } })
 */
function parseHealthPayload(rawBody) {
  if (!rawBody || typeof rawBody !== 'object') return null;
  if (rawBody.data && typeof rawBody.data === 'object' && !Array.isArray(rawBody.data)) {
    return rawBody.data;
  }
  return rawBody;
}

/**
 * Pure evaluation function for health checks and release matching
 */
function evaluateHealth(statusCode, rawBody, expectedRel = '') {
  const payload = parseHealthPayload(rawBody);
  const isUp = payload?.status === 'UP';
  const isDbHealthy = payload?.database?.status === 'HEALTHY';
  const currentRelease = payload?.release || '';
  const releaseMatches =
    !expectedRel ||
    currentRelease === expectedRel ||
    (expectedRel.length >= 7 &&
      currentRelease.length >= 7 &&
      (currentRelease.startsWith(expectedRel.slice(0, 7)) ||
        expectedRel.startsWith(currentRelease.slice(0, 7))));

  return {
    isPassed: statusCode === 200 && isUp && isDbHealthy && releaseMatches,
    isUp,
    isDbHealthy,
    currentRelease,
    releaseMatches,
    payload,
  };
}

async function runSmokeTest() {
  console.log('======================================================================');
  console.log(`🚀 Starting Automated Smoke Test against: ${healthEndpoint}`);
  if (expectedRelease) {
    console.log(`🎯 Expected Release SHA: ${expectedRelease}`);
  }
  console.log('======================================================================');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[${attempt}/${maxAttempts}] Pinging health endpoint: ${healthEndpoint}...`);
    try {
      const response = await fetch(healthEndpoint, { method: 'GET' });
      const statusCode = response.status;
      const rawBody = await response.json().catch(() => null);

      const evaluation = evaluateHealth(statusCode, rawBody, expectedRelease);

      if (evaluation.isPassed) {
        console.log('  Status Code: 200 OK');
        console.log('  Payload validation: PASSED');
        console.log(`  Database Status: ${evaluation.payload.database.status} (${evaluation.payload.database.state || 'CONNECTED'})`);
        if (evaluation.payload.system?.uptime !== undefined) {
          console.log(`  Uptime: ${Math.round(evaluation.payload.system.uptime)}s`);
        }
        if (evaluation.currentRelease) {
          console.log(`  Release SHA: ${evaluation.currentRelease}`);
        }
        console.log('======================================================================');
        console.log('✅ SMOKE TEST PASSED: Backend is UP, Database is HEALTHY, and Release matches!');
        console.log('======================================================================');
        process.exit(0);
      } else {
        if (evaluation.isUp && evaluation.isDbHealthy && !evaluation.releaseMatches) {
          console.log(`  ⏳ Release mismatch: expected "${expectedRelease}", currently deployed "${evaluation.currentRelease}". Render deployment may still be rolling out.`);
        } else if (!evaluation.isDbHealthy) {
          console.log(`  ⚠️ Database is not HEALTHY: status=${evaluation.payload?.database?.status}`);
        } else if (!evaluation.isUp) {
          console.log(`  ⚠️ System status is not UP: status=${evaluation.payload?.status}`);
        } else {
          console.log(`  ⚠️ Status: ${statusCode}, Body:`, rawBody);
        }
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
  console.log(`❌ SMOKE TEST FAILED: Service did not satisfy health & release requirements within ${(maxAttempts * waitMs) / 1000}s`);
  console.log('======================================================================');
  process.exit(1);
}

// Allow importing module in tests
module.exports = { parseHealthPayload, evaluateHealth };

// Execute if run directly
if (require.main === module) {
  runSmokeTest();
}
