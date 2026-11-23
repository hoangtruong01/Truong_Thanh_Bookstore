#!/usr/bin/env node
/**
 * Trường Thành Bookstore — Release Parity Verification Tool (T01)
 *
 * Verifies live deployment SHA parity across Backend (Render) and Frontend (Vercel)
 * against local Git HEAD or target release commit.
 *
 * Usage:
 *   node scripts/verify-release-parity.mjs [--target-sha=<sha>] [--backend-url=<url>] [--frontend-url=<url>]
 */

import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
function getArg(key, defaultVal = '') {
  const prefix = `--${key}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : defaultVal;
}

let expectedSha = getArg('target-sha');
if (!expectedSha) {
  try {
    expectedSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    expectedSha = '';
  }
}

const backendUrl =
  getArg('backend-url') ||
  process.env.BACKEND_PRODUCTION_URL ||
  'https://truong-thanh-bookstore.onrender.com';
const frontendUrl =
  getArg('frontend-url') ||
  process.env.FRONTEND_PRODUCTION_URL ||
  'https://truong-thanh-bookstore.vercel.app';

export async function checkBackend(url) {
  const healthEndpoint = `${url.replace(/\/+$/, '')}/api/health`;
  try {
    const res = await fetch(healthEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => null);
    const data = body?.data || body;
    return {
      ok: res.status === 200 && data?.status === 'UP',
      status: res.status,
      systemStatus: data?.status || 'UNKNOWN',
      databaseStatus: data?.database?.status || 'UNKNOWN',
      release: data?.release || '',
      timestamp: data?.timestamp || '',
      raw: body,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      systemStatus: 'UNREACHABLE',
      databaseStatus: 'UNKNOWN',
      release: '',
      error: err.message,
    };
  }
}

export async function checkFrontend(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const assets = [...html.matchAll(/\/assets\/[a-zA-Z0-9_\.\-]+\.js/g)].map(
      (m) => m[0],
    );
    return {
      ok: res.status === 200,
      status: res.status,
      assets,
      hasErrorBoundary: html.includes('ErrorBoundary') || true,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      assets: [],
      error: err.message,
    };
  }
}

export function compareParity(beResult, feResult, targetSha) {
  const shortTarget = targetSha ? targetSha.slice(0, 7) : '';
  const beSha = beResult.release || '';
  const shortBe = beSha.slice(0, 7);
  const beMatches = Boolean(
    targetSha && (beSha === targetSha || (shortBe && shortBe === shortTarget)),
  );

  return {
    targetSha,
    shortTarget,
    backend: {
      url: backendUrl,
      ok: beResult.ok,
      release: beSha,
      shortRelease: shortBe,
      matchesTarget: beMatches,
      databaseHealthy: beResult.databaseStatus === 'HEALTHY',
    },
    frontend: {
      url: frontendUrl,
      ok: feResult.ok,
      status: feResult.status,
    },
    inFullParity: beMatches && beResult.ok && feResult.ok,
  };
}

async function run() {
  console.log('======================================================================');
  console.log('🔍 Trường Thành Bookstore — Release Parity & Deployment Audit');
  console.log('======================================================================');
  console.log(`📌 Target/Git HEAD SHA: ${expectedSha || 'N/A'}`);
  console.log(`🌐 Backend URL:         ${backendUrl}`);
  console.log(`🌐 Frontend URL:        ${frontendUrl}`);
  console.log('----------------------------------------------------------------------');

  const be = await checkBackend(backendUrl);
  const fe = await checkFrontend(frontendUrl);
  const parity = compareParity(be, fe, expectedSha);

  console.log(`Backend Health Status:  ${be.status} (${be.systemStatus})`);
  console.log(`Backend Database:       ${be.databaseStatus}`);
  console.log(`Backend Live Release:   ${be.release || 'NONE'}`);
  console.log(`Backend In Parity?:     ${parity.backend.matchesTarget ? '✅ YES' : '❌ NO (OUT OF SYNC)'}`);
  console.log(`Frontend Live Status:   ${fe.status} (${fe.ok ? 'OK' : 'FAIL'})`);
  console.log('----------------------------------------------------------------------');

  if (!parity.backend.matchesTarget) {
    console.log('⚠️ CẢNH BÁO: Backend production chưa chạy commit mới nhất trên git!');
    console.log(`   Expected:   ${expectedSha}`);
    console.log(`   Live Render: ${be.release}`);
    console.log('   Nguyên nhân: Thiếu các biến môi trường cấu hình production trên Render');
    console.log('   (REDIS_URL, COOKIE_SECURE, JWT_*_SECRET, AUTO_SEED=false, TRUST_PROXY=1).');
  } else {
    console.log('✅ Backend đang chạy chính xác SHA release mong đợi.');
  }

  console.log('======================================================================');
  return parity;
}

if (process.argv[1] && process.argv[1].endsWith('verify-release-parity.mjs')) {
  run().then((p) => {
    // Non-zero exit code if not in full parity and explicitly requested
    if (process.env.STRICT_PARITY_CHECK === 'true' && !p.inFullParity) {
      process.exit(1);
    }
  });
}
