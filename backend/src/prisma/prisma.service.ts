import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma partagé.
 *
 * Prisma 7 supprime le moteur Rust : la connexion passe par un driver adapter
 * (`@prisma/adapter-pg`) construit à partir de DATABASE_URL.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('databaseUrl');
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL est absent. Copie apps/api/.env.example vers apps/api/.env et renseigne la connexion PostgreSQL.',
      );
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connecté à PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
