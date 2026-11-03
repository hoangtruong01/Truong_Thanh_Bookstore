import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { applyTrustProxy, resolveTrustProxy } from './trust-proxy';

describe('resolveTrustProxy (BUG-011)', () => {
  it('defaults to 1 hop when cloud hosted and TRUST_PROXY is unset', () => {
    expect(resolveTrustProxy(undefined, true)).toBe(1);
    expect(resolveTrustProxy('', true)).toBe(1);
    expect(resolveTrustProxy('   ', true)).toBe(1);
  });

  it('disables trust proxy locally when TRUST_PROXY is unset', () => {
    expect(resolveTrustProxy(undefined, false)).toBe(false);
    expect(resolveTrustProxy('', false)).toBe(false);
  });

  it('honours an explicit false even when cloud hosted', () => {
    expect(resolveTrustProxy('false', true)).toBe(false);
    expect(resolveTrustProxy('FALSE', false)).toBe(false);
  });

  it('parses hop counts between 0 and 10', () => {
    expect(resolveTrustProxy('0', true)).toBe(0);
    expect(resolveTrustProxy('1', false)).toBe(1);
    expect(resolveTrustProxy(' 2 ', true)).toBe(2);
    expect(resolveTrustProxy('10', true)).toBe(10);
  });

  it.each(['11', '99', '-1', '1.5', '1e1'])(
    'rejects out-of-range or non-integer hop count %s',
    (raw) => {
      expect(() => resolveTrustProxy(raw, true)).toThrow(/TRUST_PROXY/);
    },
  );

  it.each(['true', 'TRUE', ' True '])(
    'rejects %s because it trusts client-controlled X-Forwarded-For',
    (raw) => {
      expect(() => resolveTrustProxy(raw, true)).toThrow(
        /TRUST_PROXY=true không an toàn/,
      );
      expect(() => resolveTrustProxy(raw, false)).toThrow(
        /TRUST_PROXY=true không an toàn/,
      );
    },
  );

  it('passes through named subnets and IP/CIDR lists as a string', () => {
    expect(resolveTrustProxy('loopback', true)).toBe('loopback');
    expect(resolveTrustProxy('uniquelocal', false)).toBe('uniquelocal');
    expect(resolveTrustProxy('loopback, 10.0.0.0/8', true)).toBe(
      'loopback,10.0.0.0/8',
    );
    expect(resolveTrustProxy('10.0.0.1,192.168.0.0/16,fc00::/7', true)).toBe(
      '10.0.0.1,192.168.0.0/16,fc00::/7',
    );
  });

  it.each([
    'yes',
    'anything',
    '10.0.0.0/33',
    '10.0.0.0/8/1',
    '999.1.1.1',
    'loopback,,10.0.0.1',
    'fc00::/129',
  ])('rejects malformed value %s', (raw) => {
    expect(() => resolveTrustProxy(raw, true)).toThrow(
      /TRUST_PROXY không hợp lệ/,
    );
  });

  it('applyTrustProxy sets the resolved value on the Express app', () => {
    const set = jest.fn();
    const app = { set } as unknown as NestExpressApplication;

    expect(applyTrustProxy(app, undefined, true)).toBe(1);
    expect(set).toHaveBeenCalledWith('trust proxy', 1);
    expect(() => applyTrustProxy(app, 'true', true)).toThrow();
    expect(set).toHaveBeenCalledTimes(1);
  });
});

@Controller('throttled')
class ThrottledTestController {
  @Get()
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  ping() {
    return { ok: true };
  }
}

describe('Trust proxy + ThrottlerGuard integration (BUG-011)', () => {
  let app: INestApplication;

  const createApp = async (rawTrustProxy: string) => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ limit: 100, ttl: 60000 }])],
      controllers: [ThrottledTestController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    const nestApp = moduleRef.createNestApplication<NestExpressApplication>();
    applyTrustProxy(nestApp, rawTrustProxy, true);
    await nestApp.init();
    return nestApp;
  };

  const hit = (forwardedFor: string) =>
    request(app.getHttpServer())
      .get('/throttled')
      .set('X-Forwarded-For', forwardedFor);

  afterEach(async () => {
    await app?.close();
  });

  it('rate-limits each client IP separately behind one trusted proxy hop', async () => {
    app = await createApp('1');

    expect((await hit('1.1.1.1')).status).toBe(200);
    expect((await hit('1.1.1.1')).status).toBe(200);
    expect((await hit('1.1.1.1')).status).toBe(429);

    // A different end user behind the same proxy keeps its own bucket.
    expect((await hit('2.2.2.2')).status).toBe(200);

    // A client prepending a fake hop cannot escape: the proxy-appended
    // (rightmost) entry is what Express reports as req.ip.
    expect((await hit('9.9.9.9, 1.1.1.1')).status).toBe(429);
  });

  it('puts every client in one bucket when trust proxy is disabled', async () => {
    app = await createApp('false');

    expect((await hit('1.1.1.1')).status).toBe(200);
    expect((await hit('2.2.2.2')).status).toBe(200);
    // Without trust proxy the tracker is the socket peer, so a third distinct
    // X-Forwarded-For value is still throttled together with the others.
    expect((await hit('3.3.3.3')).status).toBe(429);
  });
});
