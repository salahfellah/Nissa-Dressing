import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { NotificationsResponseDto } from '@nissa/shared';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

/**
 * Cloche du site : rappels « à faire » et fil de ce qui s'est passé.
 *
 * Accessible à toute utilisatrice connectée, y compris aux statuts
 * intermédiaires du parcours (une candidate acceptée doit voir « réglez vos
 * frais d'accès ») : pas de @MemberOnly() ici.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<NotificationsResponseDto> {
    return this.notifications.list(user.id, user.role, user.status);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.notifications.unreadCount(user.id, user.role, user.status) };
  }

  @HttpCode(200)
  @Post('read-all')
  async readAll(@CurrentUser() user: AuthUser) {
    await this.notifications.markAllRead(user.id);
    return { ok: true };
  }

  @HttpCode(200)
  @Post(':id/read')
  async read(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.notifications.markRead(id, user.id);
    return { ok: true };
  }
}
