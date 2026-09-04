import {
  SecurityAuditService,
  SecurityAuditEventType,
} from './security-audit.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new SecurityAuditService();
    loggerSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('logs AUTH_LOGIN_FAILED event with proper metadata', () => {
    const event = service.logAuthFailure({
      email: 'attacker@evil.com',
      ip: '192.168.1.100',
      reason: 'INVALID_CREDENTIALS',
      correlationId: 'test-req-1',
    });

    expect(event.eventType).toBe(SecurityAuditEventType.AUTH_LOGIN_FAILED);
    expect(event.email).toBe('attacker@evil.com');
    expect(event.ip).toBe('192.168.1.100');
    expect(event.reason).toBe('INVALID_CREDENTIALS');
    expect(event.correlationId).toBe('test-req-1');
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy.mock.calls[0][0]).toContain('AUTH_LOGIN_FAILED');
  });

  it('logs USER_ROLE_ASSIGNED event', () => {
    const event = service.logRoleAssignment({
      actorId: 'admin-1',
      actorRole: 'SUPER_ADMIN',
      targetUserId: 'user-2',
      newRole: 'ADMIN',
      ip: '127.0.0.1',
      correlationId: 'test-req-2',
    });

    expect(event.eventType).toBe(SecurityAuditEventType.USER_ROLE_ASSIGNED);
    expect(event.actorId).toBe('admin-1');
    expect(event.targetUserId).toBe('user-2');
    expect(event.newRole).toBe('ADMIN');
    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });

  it('logs USER_STATUS_CHANGED event when account is locked', () => {
    const event = service.logAccountStatusChange({
      actorId: 'admin-1',
      actorRole: 'SUPER_ADMIN',
      targetUserId: 'user-3',
      status: false,
      ip: '127.0.0.1',
    });

    expect(event.eventType).toBe(SecurityAuditEventType.USER_STATUS_CHANGED);
    expect(event.status).toBe(false);
    expect(event.reason).toBe('LOCKED');
    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });
});
