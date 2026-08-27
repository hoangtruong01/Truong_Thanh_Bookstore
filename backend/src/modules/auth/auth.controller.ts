import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Res,
  Headers,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private extractAccessToken(req: ExpressRequest, authHeader?: string): string | undefined {
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (req.headers.cookie) {
      const cookie = req.headers.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('access_token='));
      if (cookie) {
        return decodeURIComponent(cookie.substring('access_token='.length));
      }
    }
    return undefined;
  }

  private extractRefreshToken(req: ExpressRequest, bodyRefreshToken?: string): string | undefined {
    if (bodyRefreshToken) return bodyRefreshToken;
    if (req.headers.cookie) {
      const cookie = req.headers.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('refresh_token='));
      if (cookie) {
        return decodeURIComponent(cookie.substring('refresh_token='.length));
      }
    }
    return undefined;
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken?: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const configuredSameSite = this.configService.get<string>('COOKIE_SAME_SITE')?.toLowerCase();
    const sameSite = configuredSameSite === 'none'
      ? 'none'
      : configuredSameSite === 'strict'
        ? 'strict'
        : 'lax';

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction || sameSite === 'none',
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (refreshToken) {
      response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction || sameSite === 'none',
        sameSite,
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
  }

  private finishBrowserOrMobileAuth(
    result: any,
    response: Response,
    clientPlatform?: string,
  ) {
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    if (clientPlatform?.toLowerCase() === 'mobile') return result;
    const { accessToken: _accessToken, ...browserSafeResult } = result;
    return browserSafeResult;
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-client-platform') clientPlatform: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(registerDto);
    return this.finishBrowserOrMobileAuth(result, response, clientPlatform);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-client-platform') clientPlatform: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    return this.finishBrowserOrMobileAuth(result, response, clientPlatform);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access and refresh token pair (Token Rotation)' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: ExpressRequest,
    @Headers('authorization') authHeader: string | undefined,
    @Headers('x-client-platform') clientPlatform: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.extractRefreshToken(req, dto?.refreshToken);
    const rawAccessToken = this.extractAccessToken(req, authHeader);

    const result = await this.authService.refreshToken(token || '', rawAccessToken);
    return this.finishBrowserOrMobileAuth(result, response, clientPlatform);
  }

  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Clear the authentication session and revoke tokens' })
  @ApiResponse({ status: 200, description: 'Session cleared and tokens revoked' })
  async logout(
    @Req() req: any,
    @Body() dto: RefreshTokenDto,
    @Headers('authorization') authHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawAccessToken = this.extractAccessToken(req, authHeader);
    const rawRefreshToken = this.extractRefreshToken(req, dto?.refreshToken);
    const userId = req.user?._id?.toString();

    await this.authService.logout(userId, rawAccessToken, rawRefreshToken);
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
    return { success: true, message: 'Đăng xuất thành công' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user._id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile info' })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user._id, updateProfileDto);
  }

  @Put('change-password')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password and revoke other sessions' })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
    @Headers('authorization') authHeader: string | undefined,
  ) {
    const rawAccessToken = this.extractAccessToken(req, authHeader);
    return this.authService.changePassword(
      req.user._id,
      dto.currentPassword,
      dto.newPassword,
      rawAccessToken,
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request OTP for forgot password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password with OTP or resetToken' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
