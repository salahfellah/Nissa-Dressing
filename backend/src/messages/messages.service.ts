import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ConversationDto, MessageDto } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

/**
 * Messagerie liée à la commande — CDC §2.2.
 *
 * Il n'existe pas de messagerie libre entre membres : une conversation naît d'une
 * commande et n'est accessible qu'à l'acheteuse et à la vendeuse concernées.
 */
@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  private async requireParticipant(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: { select: { title: true, photos: true } },
        buyer: { select: { id: true, pseudo: true } },
        seller: { select: { id: true, pseudo: true } },
      },
    });

    if (!order) throw new NotFoundException('Nous ne retrouvons pas cette commande.');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Cette conversation ne t’est pas destinée.');
    }

    return order;
  }

  /** Liste des conversations de l'utilisatrice, la plus récemment active en tête. */
  async conversations(userId: string): Promise<ConversationDto[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { not: 'PENDING_PAYMENT' },
      },
      include: {
        listing: { select: { title: true, photos: true } },
        buyer: { select: { id: true, pseudo: true } },
        seller: { select: { id: true, pseudo: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: { messages: { where: { senderId: { not: userId }, readAt: null } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return orders
      .map((order) => {
        const last = order.messages[0];
        return {
          orderId: order.id,
          reference: order.reference,
          otherPartyPseudo: order.buyerId === userId ? order.seller.pseudo : order.buyer.pseudo,
          listingTitle: order.listing.title,
          listingPhoto: order.listing.photos[0]
            ? this.uploads.publicPhotoUrl(order.listing.photos[0])
            : null,
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.createdAt.toISOString() ?? null,
          unreadCount: order._count.messages,
          orderStatus: order.status,
        };
      })
      .sort((a, b) => {
        // Les conversations actives passent devant les commandes sans échange.
        if (a.lastMessageAt && b.lastMessageAt) {
          return b.lastMessageAt.localeCompare(a.lastMessageAt);
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return 0;
      });
  }

  /** Fil de discussion. La lecture marque les messages reçus comme lus. */
  async thread(orderId: string, userId: string): Promise<MessageDto[]> {
    await this.requireParticipant(orderId, userId);

    const messages = await this.prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { pseudo: true } } },
    });

    await this.prisma.message.updateMany({
      where: { orderId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return messages.map((message) => ({
      id: message.id,
      orderId: message.orderId,
      senderId: message.senderId,
      senderPseudo: message.sender.pseudo,
      body: message.body,
      isMine: message.senderId === userId,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async send(orderId: string, userId: string, body: string): Promise<MessageDto> {
    await this.requireParticipant(orderId, userId);

    const message = await this.prisma.message.create({
      data: { orderId, senderId: userId, body: body.trim() },
      include: { sender: { select: { pseudo: true } } },
    });

    // Fait remonter la conversation en tête de liste.
    await this.prisma.order.update({ where: { id: orderId }, data: { updatedAt: new Date() } });

    return {
      id: message.id,
      orderId: message.orderId,
      senderId: message.senderId,
      senderPseudo: message.sender.pseudo,
      body: message.body,
      isMine: true,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        order: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      },
    });
  }
}
