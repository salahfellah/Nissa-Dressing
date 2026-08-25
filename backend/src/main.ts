import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';
import {
  AUTH_THROTTLE,
  CONTACT_THROTTLE,
  GLOBAL_THROTTLE,
  SIGNUP_THROTTLE,
} from './config/runtime';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Corps brut conservé pour la vérification de signature des webhooks Stripe.
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('port');
  const webOrigin = config.getOrThrow<string>('webOrigin');
  const uploads = config.getOrThrow<AppConfig['uploads']>('uploads');

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Le front est servi par Next sur une autre origine : les cookies de session
  // exigent `credentials` des deux côtés.
  app.enableCors({
    origin: [webOrigin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Seules les photos d'annonce sont publiques. L'audio de serment vit dans
  // var/uploads/audio et n'est accessible que par la route back-office dédiée.
  app.useStaticAssets(join(uploads.dir, 'photos'), {
    prefix: '/uploads/photos/',
    maxAge: '7d',
    index: false,
  });

  app.enableShutdownHooks();

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API Nissa Dressing démarrée sur http://localhost:${port}/api`);
  logger.log(`Front autorisé : ${webOrigin}`);
  // Les limites effectives sont journalisées : c'est la première chose à vérifier
  // quand des requêtes légitimes se font refuser en 429.
  logger.log(
    `Limites de débit — globale ${GLOBAL_THROTTLE.limit}/${GLOBAL_THROTTLE.ttl / 1000}s, ` +
      `authentification ${AUTH_THROTTLE.default.limit}, inscription ${SIGNUP_THROTTLE.default.limit}, ` +
      `contact ${CONTACT_THROTTLE.default.limit}`,
  );

  // Les tâches planifiées échouent en silence quand elles ne sont pas
  // enregistrées : on les énumère au démarrage pour que l'absence se voie.
  const planificateur = app.get(SchedulerRegistry);
  const taches = [...planificateur.getCronJobs().keys()];
  logger.log(
    taches.length
      ? `Tâches planifiées : ${taches.join(', ')}`
      : 'Aucune tâche planifiée enregistrée.',
  );
}

void bootstrap();
