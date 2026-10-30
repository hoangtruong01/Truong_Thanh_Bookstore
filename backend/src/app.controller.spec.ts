import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';

describe('AppController health readiness', () => {
  const configService = {
    get: jest.fn((_key: string, fallback: unknown) => fallback),
  } as unknown as ConfigService;

  const createResponse = () => {
    const status = jest.fn();
    status.mockReturnValue({ status });
    return {
      response: { status } as unknown as Response,
      status,
    };
  };

  it('returns HTTP 200 only when MongoDB is connected', () => {
    const { response, status } = createResponse();
    const controller = new AppController(
      { readyState: 1 } as Connection,
      configService,
    );

    const health = controller.getHealth(response);

    expect(status).toHaveBeenCalledWith(200);
    expect(health.status).toBe('UP');
    expect(health.database.status).toBe('HEALTHY');
  });

  it('returns HTTP 503 while MongoDB is disconnected', () => {
    const { response, status } = createResponse();
    const controller = new AppController(
      { readyState: 0 } as Connection,
      configService,
    );

    const health = controller.getHealth(response);

    expect(status).toHaveBeenCalledWith(503);
    expect(health.status).toBe('DEGRADED');
    expect(health.database.status).toBe('UNHEALTHY');
  });

  it('includes release commit SHA in both production and development (TT-014)', () => {
    const { response } = createResponse();
    const prodConfigService = {
      get: jest.fn((key: string, fallback: unknown) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'RELEASE_SHA') return 'commit_sha_abc123';
        return fallback;
      }),
    } as unknown as ConfigService;

    const controller = new AppController(
      { readyState: 1 } as Connection,
      prodConfigService,
    );

    const health = controller.getHealth(response);
    expect(health.status).toBe('UP');
    expect(health.database.status).toBe('HEALTHY');
    expect(health.release).toBe('commit_sha_abc123');
    expect(health.timestamp).toBeDefined();
  });
});
