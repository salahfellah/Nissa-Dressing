import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { GLOBAL_THROTTLE } from './config/runtime';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { StripeModule } from './stripe/stripe.module';
import { PdfModule } from './pdf/pdf.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { ListingsModule } from './listings/listings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OrdersModule } from './orders/orders.module';
import { MessagesModule } from './messages/messages.module';
import { ReturnsModule } from './returns/returns.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ['.env'] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ...GLOBAL_THROTTLE }]),

    // Modules transverses (globaux)
    PrismaModule,
    SettingsModule,
    MailModule,
    StripeModule,
    PdfModule,
    UploadsModule,

    // Modules métier
    AuthModule,
    AccountModule,
    ListingsModule,
    FavoritesModule,
    OrdersModule,
    MessagesModule,
    ReturnsModule,
    SupportModule,
    AdminModule,
    PaymentsModule,
  ],
  providers: [
    // Authentification appliquée par défaut : une route est protégée sauf @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
