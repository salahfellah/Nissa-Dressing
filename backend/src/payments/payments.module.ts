import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { ListingsModule } from '../listings/listings.module';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [AccountModule, OrdersModule, ListingsModule, NotificationsModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
