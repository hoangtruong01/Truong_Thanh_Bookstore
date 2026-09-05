import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createSign } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  DeviceToken,
  DeviceTokenDocument,
} from './schemas/device-token.schema';

type PushData = Record<string, string | number | boolean | null | undefined>;

@Injectable()
export class FcmPushService {
  private readonly logger = new Logger(FcmPushService.name);
  private accessToken?: { value: string; expiresAt: number };

  constructor(
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
    private readonly configService: ConfigService,
  ) {}

  async register(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web',
  ) {
    await this.deviceTokenModel
      .findOneAndUpdate(
        { token },
        { $set: { userId: new Types.ObjectId(userId), platform } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec();
    return { registered: true };
  }

  async unregister(userId: string, token: string) {
    await this.deviceTokenModel
      .deleteOne({ userId: new Types.ObjectId(userId), token })
      .exec();
    return { registered: false };
  }

  async sendToUser(
    userId: string,
    notification: { title: string; body: string },
    data: PushData = {},
  ): Promise<void> {
    if (!this.isEnabled()) return;
    const devices = await this.deviceTokenModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('+token')
      .lean()
      .exec();
    await Promise.allSettled(
      devices.map((device) =>
        this.send(device.token, notification, data).catch(async (error) => {
          if (this.isUnregisteredError(error)) {
            await this.deviceTokenModel
              .deleteOne({ token: device.token })
              .exec();
          }
          throw error;
        }),
      ),
    );
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('FCM_ENABLED') === 'true';
  }

  private async send(
    deviceToken: string,
    notification: { title: string; body: string },
    data: PushData,
  ): Promise<void> {
    const projectId = this.requiredConfig('FIREBASE_PROJECT_ID');
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification,
            data: Object.fromEntries(
              Object.entries(data)
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => [key, String(value)]),
            ),
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      const error = new Error(`FCM ${response.status}: ${detail}`);
      this.logger.warn(error.message);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.value;
    }
    const clientEmail = this.requiredConfig('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.requiredConfig('FIREBASE_PRIVATE_KEY').replace(
      /\\n/g,
      '\n',
    );
    const now = Math.floor(Date.now() / 1000);
    const header = this.base64Url({ alg: 'RS256', typ: 'JWT' });
    const claims = this.base64Url({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
    const input = `${header}.${claims}`;
    const signer = createSign('RSA-SHA256');
    signer.update(input);
    signer.end();
    const assertion = `${input}.${signer.sign(privateKey, 'base64url')}`;
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!response.ok) {
      throw new Error(`FCM OAuth ${response.status}: ${await response.text()}`);
    }
    const token = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!token.access_token)
      throw new Error('FCM OAuth response has no access token');
    this.accessToken = {
      value: token.access_token,
      expiresAt: Date.now() + (token.expires_in || 3600) * 1000,
    };
    return token.access_token;
  }

  private base64Url(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private requiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`${key} is required when FCM_ENABLED=true`);
    return value;
  }

  private isUnregisteredError(error: unknown): boolean {
    return (
      error instanceof Error &&
      /UNREGISTERED|registration-token-not-registered/i.test(error.message)
    );
  }
}
