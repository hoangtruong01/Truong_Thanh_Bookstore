import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseHealthPayload, evaluateHealth } = require('./smoke-test.js');

test('smoke-test: parse direct raw health response', () => {
  const raw = {
    status: 'UP',
    database: { status: 'HEALTHY', state: 'CONNECTED' },
    release: 'abc1234',
  };
  const parsed = parseHealthPayload(raw);
  assert.equal(parsed.status, 'UP');
  assert.equal(parsed.database.status, 'HEALTHY');
  assert.equal(parsed.release, 'abc1234');
});

test('smoke-test: parse TransformInterceptor wrapped response', () => {
  const wrapped = {
    success: true,
    message: 'Thao tác thành công',
    data: {
      status: 'UP',
      database: { status: 'HEALTHY' },
      release: 'bf87e61',
    },
    meta: null,
    timestamp: '2026-11-03T00:00:00.000Z',
  };
  const parsed = parseHealthPayload(wrapped);
  assert.equal(parsed.status, 'UP');
  assert.equal(parsed.database.status, 'HEALTHY');
  assert.equal(parsed.release, 'bf87e61');
});

test('smoke-test: evaluateHealth passes when release matches and system healthy', () => {
  const wrapped = {
    data: {
      status: 'UP',
      database: { status: 'HEALTHY' },
      release: 'target-sha',
    },
  };
  const evalResult = evaluateHealth(200, wrapped, 'target-sha');
  assert.equal(evalResult.isPassed, true);
  assert.equal(evalResult.isUp, true);
  assert.equal(evalResult.isDbHealthy, true);
  assert.equal(evalResult.releaseMatches, true);
});

test('smoke-test: evaluateHealth fails when release mismatches despite healthy DB', () => {
  const wrapped = {
    data: {
      status: 'UP',
      database: { status: 'HEALTHY' },
      release: 'old-sha',
    },
  };
  const evalResult = evaluateHealth(200, wrapped, 'new-sha');
  assert.equal(evalResult.isPassed, false);
  assert.equal(evalResult.isUp, true);
  assert.equal(evalResult.isDbHealthy, true);
  assert.equal(evalResult.releaseMatches, false);
});

test('smoke-test: evaluateHealth fails when database is degraded', () => {
  const wrapped = {
    data: {
      status: 'DEGRADED',
      database: { status: 'UNHEALTHY' },
      release: 'target-sha',
    },
  };
  const evalResult = evaluateHealth(503, wrapped, 'target-sha');
  assert.equal(evalResult.isPassed, false);
  assert.equal(evalResult.isDbHealthy, false);
});

test('smoke-test: evaluateHealth matches 7-char short SHA with 40-char full SHA (OPS-P0-03)', () => {
  const fullSha = '121e99f5d3aeddba99b73dda17423cf3ea8a112f';
  const shortSha = '121e99f';

  // Case 1: Backend reports short, expected is full
  const evalResult1 = evaluateHealth(
    200,
    { data: { status: 'UP', database: { status: 'HEALTHY' }, release: shortSha } },
    fullSha,
  );
  assert.equal(evalResult1.isPassed, true);
  assert.equal(evalResult1.releaseMatches, true);

  // Case 2: Backend reports full, expected is short
  const evalResult2 = evaluateHealth(
    200,
    { data: { status: 'UP', database: { status: 'HEALTHY' }, release: fullSha } },
    shortSha,
  );
  assert.equal(evalResult2.isPassed, true);
  assert.equal(evalResult2.releaseMatches, true);
});

test('smoke-test (TASK-004): accepts any SHA from a comma-separated release list', () => {
  const body = { data: { status: 'UP', database: { status: 'HEALTHY' }, release: 'b7e2c91aaaa' } };
  assert.equal(evaluateHealth(200, body, 'a1b2c3d4eeee,b7e2c91aaaa').releaseMatches, true);
  assert.equal(evaluateHealth(200, body, 'a1b2c3d4eeee, b7e2c91').releaseMatches, true);
  assert.equal(evaluateHealth(200, body, 'a1b2c3d4eeee,c0ffee12aaaa').releaseMatches, false);
});
