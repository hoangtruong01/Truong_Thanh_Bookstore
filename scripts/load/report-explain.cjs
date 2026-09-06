#!/usr/bin/env node
// Uses the compiled application's pipelines, without starting Nest or background jobs.
const fs = require('node:fs');
const { createConnection } = require('../../backend/node_modules/mongoose');
const { OrdersService } = require('../../backend/dist/modules/orders/orders.service');

async function capturePipelines(start, end) {
  const pipelines = [];
  const service = Object.create(OrdersService.prototype);
  service.orderModel = { aggregate: async pipeline => { pipelines.push(pipeline); return []; } };
  await service.getRevenueByDateRange(start, end);
  await service.getCategoryRevenue();
  return { revenueByDateRange: pipelines[0], categoryRevenue: pipelines[1] };
}

async function main() {
  const [mode, startArg, endArg, output] = process.argv.slice(2);
  const start = new Date(startArg);
  const end = new Date(endArg);
  if (!['--dry-run', '--execute'].includes(mode) || !Number.isFinite(+start) ||
      !Number.isFinite(+end) || start > end || !output) {
    throw new Error('Usage: node scripts/load/report-explain.cjs --dry-run|--execute START_ISO END_ISO OUTPUT.json');
  }
  const pipelines = await capturePipelines(start, end);
  const serviceSha256 = require('node:crypto').createHash('sha256')
    .update(fs.readFileSync(require.resolve('../../backend/dist/modules/orders/orders.service'))).digest('hex');
  const evidence = { timestamp: new Date().toISOString(), mode, serviceSha256, pipelines };
  if (mode === '--execute') {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB_NAME) {
      throw new Error('Set MONGODB_URI and MONGODB_DB_NAME explicitly; use a read-only database account.');
    }
    const connection = await createConnection(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME, serverSelectionTimeoutMS: 10000,
    }).asPromise();
    try {
      evidence.explain = {};
      for (const [name, pipeline] of Object.entries(pipelines)) {
        evidence.explain[name] = await connection.db.collection('orders')
          .aggregate(pipeline, { maxTimeMS: 60000 }).explain('executionStats');
      }
    } finally {
      await connection.close();
    }
  }
  fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
  console.log(mode === '--dry-run' ? 'Pipelines captured. No database queried; no performance verdict.' :
    'Execution statistics written. Assess data volume and query plans before accepting the staging gate.');
}

if (require.main === module) main().catch(() => {
  // Connection errors can contain credentials. Keep detailed secrets out of logs.
  console.error('Report explain failed. Check arguments, build, database access and output path.');
  process.exitCode = 1;
});
module.exports = { capturePipelines };
