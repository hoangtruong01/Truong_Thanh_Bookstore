const { test } = require('node:test');
const assert = require('node:assert/strict');
const { capturePipelines } = require('./report-explain.cjs');

test('Offline capture uses actual revenue filters and category snapshot pipeline', async () => {
  const start = new Date('2026-09-01T00:00:00Z');
  const end = new Date('2026-09-06T23:59:59Z');
  const pipelines = await capturePipelines(start, end);
  for (const pipeline of Object.values(pipelines)) {
    assert.deepEqual(pipeline[0].$match.orderStatus.$nin, ['CANCELLED', 'RETURNED']);
    assert.ok(pipeline.every(stage => !stage.$out && !stage.$merge));
  }
  const dateMatch = pipelines.revenueByDateRange[0].$match.$and[0];
  assert.deepEqual(dateMatch.$or[0].revenueRecognizedAt, { $gte: start, $lte: end });
  const group = pipelines.categoryRevenue.find(stage => stage.$group).$group;
  assert.deepEqual(group.revenue.$sum.$multiply, ['$items.price', '$items.quantity']);
});
