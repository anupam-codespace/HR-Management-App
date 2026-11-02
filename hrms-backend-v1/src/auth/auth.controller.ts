// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterWizardDto } from './dto/register-wizard.dto';
import { AuthGuard } from './auth.guard';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckRegistrationEmailDto } from './dto/check-registration-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterWizardDto) {
    // Calling our new massive wizard transaction!
    return this.authService.registerWizard(dto);
  }

  @Post('check-registration-email')
  async checkRegistrationEmail(@Body() dto: CheckRegistrationEmailDto) {
    return this.authService.checkRegistrationEmail(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub, req.user.companyId);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // req.user is populated by the AuthGuard using your JWT token
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfileAlias(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('me/permissions')
  async getPermissions(@Request() req) {
    return this.authService.getPermissions(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
