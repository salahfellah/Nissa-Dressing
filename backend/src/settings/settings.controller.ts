import { Body, Controller, Get, Put } from '@nestjs/common';
import { settingsSchema, type PlatformSettings, type SettingsInput } from '@nissa/shared';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /**
   * Paramètres visibles publiquement : le front en a besoin pour afficher les frais
   * de port et le prix du boost avant toute authentification.
   */
  @Public()
  @Get('settings/public')
  async publicSettings() {
    const s = await this.settings.get();
    return {
      accessFeeCents: s.accessFeeCents,
      freeBoostDays: s.freeBoostDays,
      boostPriceCents: s.boostPriceCents,
      commissionPercent: s.commissionPercent,
      commissionFixedCents: s.commissionFixedCents,
      commissionPayer: s.commissionPayer,
      shippingFeesCents: s.shippingFeesCents,
      supportEmail: s.supportEmail,
    };
  }

  @Roles('ADMIN')
  @Get('admin/settings')
  adminSettings(): Promise<PlatformSettings> {
    return this.settings.get();
  }

  @Roles('ADMIN')
  @Put('admin/settings')
  update(@Body(zodBody(settingsSchema)) body: SettingsInput): Promise<PlatformSettings> {
    return this.settings.update(body as PlatformSettings);
  }
}
