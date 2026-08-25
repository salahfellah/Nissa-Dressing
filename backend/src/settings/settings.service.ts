import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type PlatformSettings } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Paramètres de plateforme (CDC §3.9) — commission, boost, frais de port, frais d'accès.
 *
 * Les quatre points « à définir » du CDC §6 sont ici : ils sont modifiables en
 * back-office sans redéploiement. Un cache mémoire évite d'interroger la base à
 * chaque calcul de prix ; il est invalidé à chaque écriture.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache: PlatformSettings | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.get();
    } catch (error) {
      // La base peut ne pas être encore migrée au premier démarrage.
      this.logger.warn(
        `Paramètres non chargés au démarrage (${(error as Error).message}). Valeurs par défaut utilisées.`,
      );
    }
  }

  async get(): Promise<PlatformSettings> {
    if (this.cache) return this.cache;

    const row = await this.prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) {
      this.cache = DEFAULT_SETTINGS;
      return this.cache;
    }

    // Fusion avec les valeurs par défaut : un paramètre ajouté après coup ne casse
    // pas une base déjà en place.
    this.cache = {
      ...DEFAULT_SETTINGS,
      ...(row.value as Partial<PlatformSettings>),
      shippingFeesCents: {
        ...DEFAULT_SETTINGS.shippingFeesCents,
        ...((row.value as Partial<PlatformSettings>).shippingFeesCents ?? {}),
      },
    };
    return this.cache;
  }

  async update(settings: PlatformSettings): Promise<PlatformSettings> {
    await this.prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: settings as unknown as object },
      update: { value: settings as unknown as object },
    });

    this.cache = settings;
    this.logger.log('Paramètres de plateforme mis à jour');
    return settings;
  }

  invalidate(): void {
    this.cache = null;
  }
}
