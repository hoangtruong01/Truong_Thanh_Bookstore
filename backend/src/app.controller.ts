import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Health check endpoint — kiểm tra trạng thái hoạt động của hệ thống và CSDL',
  })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  getHealth(@Res({ passthrough: true }) response: Response) {
    const isDbConnected = Number(this.connection.readyState) === 1;
    const dbStateMap: Record<number, string> = {
      0: 'DISCONNECTED',
      1: 'CONNECTED',
      2: 'CONNECTING',
      3: 'DISCONNECTING',
    };

    const memoryUsage = process.memoryUsage();
    response.status(isDbConnected ? 200 : 503);

    return {
      status: isDbConnected ? 'UP' : 'DEGRADED',
      database: {
        status: isDbConnected ? 'HEALTHY' : 'UNHEALTHY',
        state: dbStateMap[this.connection.readyState] || 'UNKNOWN',
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        memoryMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
      release:
        process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
