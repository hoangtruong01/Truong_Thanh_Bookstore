const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

async function run(t, script, scenario, args = ['3']) {
  let stock = 2;
  const server = createServer(async (req, res) => {
    let status = 200;
    let data;
    if (scenario === 'throttled') {
      status = 429; data = {};
    } else if (req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      // Match required DTO fields. A broken payload must fail this test.
      const valid = body.phone && body.items?.[0]?.name && body.items?.[0]?.price > 0 && body.idempotencyKey;
      if (!valid || scenario === 'all-invalid') {
        status = 400; data = { message: 'Invalid request' };
      } else if (stock > 0) {
        stock--; status = 201; data = { _id: `order-${stock}` };
      } else {
        status = 400; data = { message: 'Không đủ tồn kho cho sản phẩm' };
      }
    } else if (req.url.startsWith('/api/products?')) {
      data = scenario === 'empty' ? [] : [{ _id: '507f1f77bcf86cd799439011', name: 'Book', price: 1000000, stock }];
    } else if (scenario === 'missing-final-stock') {
      status = 404; data = {};
    } else {
      data = { stock };
    }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: status < 400, data }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const target = `http://127.0.0.1:${server.address().port}`;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script), target, ...args], { windowsHide: true });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, output }));
  });
}

for (const scenario of ['empty', 'all-invalid', 'missing-final-stock']) {
  test(`concurrency benchmark fails for ${scenario}`, async t => {
    const result = await run(t, 'concurrent-orders.load.js', scenario);
    assert.equal(result.code, 1, result.output);
  });
}

test('concurrency benchmark passes for valid DTOs and exact stock conservation', async t => {
  const result = await run(t, 'concurrent-orders.load.js', 'valid');
  assert.equal(result.code, 0, result.output);
});

test('catalog benchmark cannot pass on 100% HTTP 429', async t => {
  const result = await run(t, 'catalog-search.load.js', 'throttled', ['1', '0.1', '10']);
  assert.equal(result.code, 1, result.output);
});
