import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway';
import { UsersService } from '../users/users.service';
import { TokenBlacklistService } from '../auth/token-blacklist.service';
import { StaffPermission, UserRole } from '../../common/enums';

describe('Notification socket authentication and permissions', () => {
  const claims = {
    sub: 'user-1',
    type: 'access',
    jti: 'token-1',
    tokenVersion: 2,
  };
  let jwt: { verifyAsync: jest.Mock };
  let users: { findById: jest.Mock };
  let gateway: NotificationsGateway;
  let socket: {
    handshake: { auth: { token: string }; headers: object };
    data: object;
    join: jest.Mock;
    disconnect: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn().mockResolvedValue(claims) };
    users = {
      findById: jest.fn().mockResolvedValue({
        _id: 'user-1',
        status: true,
        tokenVersion: 2,
        role: UserRole.CUSTOMER,
      }),
    };
    const blacklist = {
      isJtiBlacklisted: jest.fn().mockResolvedValue(false),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };
    gateway = new NotificationsGateway(
      jwt as unknown as JwtService,
      users as unknown as UsersService,
      blacklist as unknown as TokenBlacklistService,
    );
    socket = {
      handshake: { auth: { token: 'signed-token' }, headers: {} },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
    };
  });

  it.each([
    { type: 'refresh' },
    { type: 'reset' },
    { jti: undefined },
    { tokenVersion: undefined },
    { tokenVersion: 1 },
    { tokenVersion: 3 },
  ])('rejects invalid token claims %j', async (override) => {
    jwt.verifyAsync.mockResolvedValue({ ...claims, ...override });
    await gateway.handleConnection(socket as unknown as Socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('keeps a customer out of internal rooms', async () => {
    await gateway.handleConnection(socket as unknown as Socket);
    expect(socket.join.mock.calls).toEqual([['user:user-1']]);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('gives inventory staff only inventory alerts', async () => {
    users.findById.mockResolvedValue({
      _id: 'user-1',
      status: true,
      tokenVersion: 2,
      role: UserRole.STAFF,
      permissions: [StaffPermission.MANAGE_INVENTORY],
    });
    await gateway.handleConnection(socket as unknown as Socket);
    expect(socket.join).toHaveBeenCalledWith('admin:inventory');
    expect(socket.join).not.toHaveBeenCalledWith('admin:orders');
  });

  it('disconnects an existing socket before delivering data after token revocation', async () => {
    await gateway.handleConnection(socket as unknown as Socket);
    jwt.verifyAsync.mockRejectedValue(new Error('Token expired'));
    await gateway.sendNotificationToUser('user-1', { message: 'private' });
    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('blocks an already connected account after suspension or password change', async () => {
    await gateway.handleConnection(socket as unknown as Socket);
    users.findById.mockResolvedValue({
      _id: 'user-1',
      status: false,
      tokenVersion: 3,
    });
    await gateway.broadcastNotification({ message: 'broadcast' });
    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('uses current staff permissions rather than old room membership', async () => {
    users.findById.mockResolvedValue({
      _id: 'user-1',
      status: true,
      tokenVersion: 2,
      role: UserRole.STAFF,
      permissions: [StaffPermission.MANAGE_INVENTORY],
    });
    await gateway.handleConnection(socket as unknown as Socket);
    await gateway.sendAlertToAdmins({ type: 'stock' });
    expect(socket.emit).toHaveBeenCalledTimes(2);
    socket.emit.mockClear();
    users.findById.mockResolvedValue({
      _id: 'user-1',
      status: true,
      tokenVersion: 2,
      role: UserRole.STAFF,
      permissions: [],
    });
    await gateway.sendAlertToAdmins({ type: 'stock' });
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('removes disconnected clients and never delivers another user notification', async () => {
    await gateway.handleConnection(socket as unknown as Socket);
    await gateway.sendNotificationToUser('user-2', { message: 'private' });
    expect(socket.emit).not.toHaveBeenCalled();
    gateway.handleDisconnect(socket as unknown as Socket);
    await gateway.broadcastNotification({ message: 'public' });
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
