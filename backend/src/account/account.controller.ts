import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import {
  addressSchema,
  changePasswordSchema,
  profileSchema,
  type AddressInput,
  type ChangePasswordInput,
  type MeDto,
  type ProfileInput,
} from '@nissa/shared';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { AuthService } from '../auth/auth.service';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(
    private readonly account: AccountService,
    private readonly auth: AuthService,
  ) {}

  @Put('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(zodBody(profileSchema)) body: ProfileInput,
  ): Promise<MeDto> {
    return this.account.updateProfile(user.id, body);
  }

  @Put('address')
  updateAddress(
    @CurrentUser() user: AuthUser,
    @Body(zodBody(addressSchema)) body: AddressInput,
  ): Promise<MeDto> {
    return this.account.updateAddress(user.id, body);
  }

  @HttpCode(200)
  @Post('password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body(zodBody(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    await this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
    return { message: 'Mot de passe modifié. Reconnecte-toi avec le nouveau.' };
  }

  // ————— Frais d'accès (CDC §3.1) —————

  @HttpCode(200)
  @Post('access-fee/checkout')
  createAccessFeeCheckout(@CurrentUser() user: AuthUser) {
    return this.account.createAccessFeeCheckout(user.id);
  }

  // ————— Stripe Connect (CDC §3.2) —————

  @HttpCode(200)
  @Post('stripe/onboarding')
  startOnboarding(@CurrentUser() user: AuthUser) {
    return this.account.startStripeOnboarding(user.id);
  }

  @HttpCode(200)
  @Post('stripe/refresh')
  refreshStripe(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.account.refreshStripeStatus(user.id);
  }

  @Get('stripe/dashboard')
  stripeDashboard(@CurrentUser() user: AuthUser) {
    return this.account.stripeDashboardLink(user.id);
  }

  @HttpCode(200)
  @Post('onboarding/complete')
  completeOnboarding(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.account.completeOnboarding(user.id);
  }
}
