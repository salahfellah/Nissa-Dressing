import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { messageSchema, type ConversationDto, type MessageDto, type MessageInput } from '@nissa/shared';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { MessagesService } from './messages.service';

@MemberOnly()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  conversations(@CurrentUser() user: AuthUser): Promise<ConversationDto[]> {
    return this.messages.conversations(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.messages.unreadCount(user.id) };
  }

  @Get(':orderId')
  thread(@Param('orderId') orderId: string, @CurrentUser() user: AuthUser): Promise<MessageDto[]> {
    return this.messages.thread(orderId, user.id);
  }

  @Post(':orderId')
  send(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
    @Body(zodBody(messageSchema)) body: MessageInput,
  ): Promise<MessageDto> {
    return this.messages.send(orderId, user.id, body.body);
  }
}
