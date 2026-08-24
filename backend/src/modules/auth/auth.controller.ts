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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
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
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-client-platform') clientPlatform: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    return this.finishBrowserOrMobileAuth(result, response, clientPlatform);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh token pair' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: ExpressRequest,
    @Headers('x-client-platform') clientPlatform: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    let token = dto?.refreshToken;
    if (!token && req.headers.cookie) {
      const cookie = req.headers.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('refresh_token='));
      if (cookie) {
        token = decodeURIComponent(cookie.substring('refresh_token='.length));
      }
    }

    const result = await this.authService.refreshToken(token || '');
    return this.finishBrowserOrMobileAuth(result, response, clientPlatform);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the authentication session' })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = req.user?._id;
    await this.authService.logout(userId);
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user._id, dto.currentPassword, dto.newPassword);
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
