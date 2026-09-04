import { Injectable, Logger } from '@nestjs/common';

export enum SecurityAuditEventType {
  AUTH_LOGIN_FAILED = 'AUTH_LOGIN_FAILED',
  AUTH_PASSWORD_CHANGED = 'AUTH_PASSWORD_CHANGED',
  USER_ROLE_ASSIGNED = 'USER_ROLE_ASSIGNED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
}

export interface SecurityAuditEvent {
  eventType: SecurityAuditEventType;
  timestamp: string;
  correlationId?: string;
  ip?: string;
  userId?: string;
  email?: string;
  actorId?: string;
  actorRole?: string;
  targetUserId?: string;
  newRole?: string;
  status?: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger('SecurityAudit');

  logEvent(event: Omit<SecurityAuditEvent, 'timestamp'>) {
    const fullEvent: SecurityAuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const auditJson = JSON.stringify({
      auditType: 'SECURITY_AUDIT',
      ...fullEvent,
    });

    this.logger.warn(`[AUDIT] ${fullEvent.eventType} | ${auditJson}`);
    return fullEvent;
  }

  logAuthFailure(params: {
    email?: string;
    ip?: string;
    reason: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      eventType: SecurityAuditEventType.AUTH_LOGIN_FAILED,
      email: params.email,
      ip: params.ip,
      reason: params.reason,
      correlationId: params.correlationId,
    });
  }

  logPasswordChanged(params: {
    userId: string;
    email?: string;
    ip?: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      eventType: SecurityAuditEventType.AUTH_PASSWORD_CHANGED,
      userId: params.userId,
      email: params.email,
      ip: params.ip,
      correlationId: params.correlationId,
    });
  }

  logRoleAssignment(params: {
    actorId?: string;
    actorRole?: string;
    targetUserId: string;
    newRole: string;
    ip?: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      eventType: SecurityAuditEventType.USER_ROLE_ASSIGNED,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      newRole: params.newRole,
      ip: params.ip,
      correlationId: params.correlationId,
    });
  }

  logAccountStatusChange(params: {
    actorId?: string;
    actorRole?: string;
    targetUserId: string;
    status: boolean;
    ip?: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      eventType: SecurityAuditEventType.USER_STATUS_CHANGED,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      status: params.status,
      reason: params.status ? 'UNLOCKED' : 'LOCKED',
      ip: params.ip,
      correlationId: params.correlationId,
    });
  }

  logTokenRevocation(params: {
    userId: string;
    reason: string;
    correlationId?: string;
  }) {
    return this.logEvent({
      eventType: SecurityAuditEventType.TOKEN_REVOKED,
      userId: params.userId,
      reason: params.reason,
      correlationId: params.correlationId,
    });
  }
}
