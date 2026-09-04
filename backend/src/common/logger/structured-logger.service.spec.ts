import { StructuredLoggerService } from './structured-logger.service';

describe('StructuredLoggerService', () => {
  let logger: StructuredLoggerService;
  let stdoutSpy: jest.SpyInstance<unknown, unknown[]>;
  let stderrSpy: jest.SpyInstance<unknown, unknown[]>;

  beforeEach(() => {
    logger = new StructuredLoggerService();
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    stderrSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('outputs structured JSON when JSON mode is enabled', () => {
    logger.setJsonMode(true);
    logger.log('Payment processed successfully', 'PaymentsService', {
      correlationId: 'test-cid-123',
      orderId: 'ORD-999',
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = String(stdoutSpy.mock.calls[0][0]);
    const parsed = JSON.parse(output) as Record<string, unknown>;

    expect(parsed.level).toBe('info');
    expect(parsed.context).toBe('PaymentsService');
    expect(parsed.message).toBe('Payment processed successfully');
    expect(parsed.correlationId).toBe('test-cid-123');
    expect(parsed.orderId).toBe('ORD-999');
    expect(parsed.timestamp).toBeDefined();
  });

  it('outputs error JSON to stderr when error is logged in JSON mode', () => {
    logger.setJsonMode(true);
    logger.error('Database connection timed out', 'MongoConnection', {
      correlationId: 'err-cid-456',
    });

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = String(stderrSpy.mock.calls[0][0]);
    const parsed = JSON.parse(output) as Record<string, unknown>;

    expect(parsed.level).toBe('error');
    expect(parsed.context).toBe('MongoConnection');
    expect(parsed.message).toBe('Database connection timed out');
    expect(parsed.correlationId).toBe('err-cid-456');
  });

  it('outputs human-readable text when JSON mode is disabled', () => {
    logger.setJsonMode(false);
    logger.log('Service started successfully', 'HealthCheck', {
      correlationId: 'info-cid-789',
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = String(stdoutSpy.mock.calls[0][0]);
    expect(output).toContain('[INFO]');
    expect(output).toContain('[HealthCheck]');
    expect(output).toContain('[info-cid-789]');
    expect(output).toContain('Service started successfully');
  });

  it('redacts nested credentials from message details and extra context', () => {
    logger.setJsonMode(true);
    logger.log(
      { message: 'Login failed', passwordConfirmation: 'never-log-me' },
      'AuthService',
      {
        authorization: 'Bearer raw-token',
        nested: { refresh_token: 'raw-refresh-token', safe: 'visible' },
      },
    );

    const output = String(stdoutSpy.mock.calls[0][0]);
    expect(output).not.toContain('never-log-me');
    expect(output).not.toContain('raw-token');
    expect(output).not.toContain('raw-refresh-token');
    expect(output).toContain('***REDACTED***');
    expect(output).toContain('visible');
  });
});
