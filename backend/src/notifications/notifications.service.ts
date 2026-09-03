import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationDto, NotificationKind, NotificationsResponseDto } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { AppConfig } from '../config/configuration';

export interface NotifyInput {
  kind: NotificationKind;
  title: string;
  message?: string;
  /** Chemin interne du site (ex. `/commande/${id}`), jamais d'URL externe. */
  link?: string;
}

/**
 * Notifications internes du site — CDC §2.2, « rappels ».
 *
 * Deux familles, deux traitements :
 * - les **événements** (ce qui s'est passé) sont enregistrés en base ;
 * - les **tâches** (ce qui reste à faire) ne sont **jamais stockées** : elles se
 *   recalculent à chaque lecture à partir de l'état réel du compte. Une
 *   commande expédiée fait ainsi disparaître le rappel de confirmation sans
 *   aucun nettoyage de table, et un rappel « oublié » ne pollue pas la base.
 *
 * Les notifications ne doivent jamais faire échouer l'opération qui a eu
 * lieu : un problème d'écriture est journalisé et ignoré.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly stripeBypassConnect: boolean;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.stripeBypassConnect =
      config.getOrThrow<AppConfig['stripe']>('stripe').bypassConnect;
  }

  async notify(userId: string, input: NotifyInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          kind: input.kind,
          title: input.title,
          message: input.message ?? null,
          link: input.link ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Notification non enregistrée pour ${userId} : ${(error as Error).message}`);
    }
  }

  private toDto(
    row: { id: string; kind: string; title: string; message: string | null; link: string | null; isRead: boolean; createdAt: Date },
  ): NotificationDto {
    return {
      id: row.id,
      kind: row.kind as NotificationDto['kind'],
      title: row.title,
      message: row.message,
      link: row.link,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(userId: string, role: string, status: string): Promise<NotificationsResponseDto> {
    const [events, todos] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.buildTodos(userId, role, status),
    ]);

    const unreadEvents = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      todos,
      events: events.map((row) => this.toDto(row)),
      unreadCount: unreadEvents + todos.length,
    };
  }

  async unreadCount(userId: string, role: string, status: string): Promise<number> {
    const [unreadEvents, todos] = await Promise.all([
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.buildTodos(userId, role, status),
    ]);
    return unreadEvents + todos.length;
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ————— Rappels « à faire », recalculés à la volée —————
  //
  // Chaque rappel remplit le même contrat : un libellé doux, un lien interne et
  // une date. Celle-ci vaut, quand elle existe, la date de l'événement qui a
  // ouvert le rappel (le paiement, l'expédition) : c'est elle qui permet de
  // présenter les rappels du plus récent au plus ancien. À défaut — les files
  // d'attente, qui n'ont pas d'événement unique — c'est l'heure de lecture, et
  // le rappel se lit comme « à jour ».

  private todo(
    kind: NotificationKind,
    title: string,
    message: string,
    link: string,
    key: string,
    at?: Date | null,
  ): NotificationDto {
    return {
      id: `todo-${key}`,
      kind,
      title,
      message,
      link,
      isRead: false,
      createdAt: (at ?? new Date()).toISOString(),
    };
  }

  private async buildTodos(
    userId: string,
    role: string,
    status: string,
  ): Promise<NotificationDto[]> {
    const todos: NotificationDto[] = [];

    // ————— La boîte de l'administratrice : files en attente —————
    if (role === 'ADMIN') {
      const [candidatures, annonces, litiges, reversements] = await Promise.all([
        this.prisma.user.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.returnRequest.count({ where: { status: 'PENDING_REVIEW' } }),
        // Réceptions confirmées mais fonds encore détenus par la plateforme.
        this.prisma.order.count({ where: { status: 'RECEIVED', stripeTransferId: null } }),
      ]);

      if (candidatures > 0) {
        todos.push(
          this.todo(
            'TODO_ADMIN_REVIEW',
            `${candidatures} candidature${candidatures > 1 ? 's' : ''} à valider`,
            'Écoute le serment et tranche dans le back-office.',
            '/admin/inscriptions',
            `admin-candidatures-${candidatures}`,
          ),
        );
      }
      if (annonces > 0) {
        todos.push(
          this.todo(
            'TODO_ADMIN_REVIEW',
            `${annonces} annonce${annonces > 1 ? 's' : ''} à modérer`,
            'Une annonce ne paraît qu’après votre accord.',
            '/admin/annonces',
            `admin-annonces-${annonces}`,
          ),
        );
      }
      if (litiges > 0) {
        todos.push(
          this.todo(
            'TODO_ADMIN_REVIEW',
            `${litiges} retour${litiges > 1 ? 's' : ''} à examiner`,
            'Une sœur attend que sa demande soit tranchée.',
            '/admin/litiges',
            `admin-litiges-${litiges}`,
          ),
        );
      }
      if (reversements > 0) {
        todos.push(
          this.todo(
            'TODO_ADMIN_REVIEW',
            `${reversements} reversement${reversements > 1 ? 's' : ''} à libérer`,
            'Les commandes reçues attendent leur transfert.',
            '/admin/commandes',
            `admin-reversements-${reversements}`,
          ),
        );
      }
    }

    // ————— Parcours d'inscription —————
    if (status === 'PENDING_REVIEW' || status === 'REJECTED') {
      return todos;
    }
    if (status === 'AWAITING_PAYMENT') {
      todos.push(
        this.todo(
          'TODO_ACCESS_FEE',
          'Règle vos frais d’accès',
          'Votre candidature a été acceptée : il ne reste que la participation de 5 €.',
          '/paiement',
          'acces',
        ),
      );
      return todos;
    }
    if (status === 'ONBOARDING' || status === 'PAYMENT_DONE') {
      todos.push(
        this.todo(
          'TODO_ONBOARDING',
          'Terminez la configuration de votre compte',
          'Votre adresse postale — et bientôt vos coordonnées bancaires — ouvrent la vente.',
          '/configuration-compte',
          'onboarding',
        ),
      );
      // Les autres rappels supposent un compte membre, ils ne s'appliquent pas encore.
      if (status === 'PAYMENT_DONE') return todos;
    }

    if (status !== 'MEMBER' && role !== 'ADMIN') {
      return todos;
    }

    // ————— Membres : commandes et annonces qui attendent un geste —————
    const [aExpedier, aConfirmer, enModeration, compte] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId: userId, status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 5,
        select: { id: true, paidAt: true, listing: { select: { title: true } } },
      }),
      this.prisma.order.findMany({
        where: { buyerId: userId, status: 'SHIPPED', autoConfirmedAt: null },
        orderBy: { shippedAt: 'desc' },
        take: 5,
        select: { id: true, shippedAt: true, listing: { select: { title: true } } },
      }),
      this.prisma.listing.count({ where: { sellerId: userId, status: 'PENDING_REVIEW' } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectStatus: true },
      }),
    ]);

    // Une sœur reconnaît son article à son nom, pas à la référence du bordereau :
    // c'est le titre de l'annonce qui est annoncé. Vendeuse et acheteuse lisent
    // ensuite leurs rappels comme un seul fil, du plus récent au plus ancien.
    const rappelsCommande = [
      ...aExpedier.map((order) => ({
        at: order.paidAt,
        todo: this.todo(
          'TODO_SHIP',
          `Expédiez « ${order.listing.title} »`,
          'Le paiement est confirmé : votre colis attend d’être envoyé.',
          `/commande/${order.id}`,
          `ship-${order.id}`,
          order.paidAt,
        ),
      })),
      ...aConfirmer.map((order) => ({
        at: order.shippedAt,
        todo: this.todo(
          'TODO_CONFIRM_RECEPTION',
          `Confirmez la réception de « ${order.listing.title} »`,
          'Dès que le colis est entre vos mains, dites-le : votre sœur récupère alors ses fonds.',
          `/commande/${order.id}`,
          `reception-${order.id}`,
          order.shippedAt,
        ),
      })),
    ];
    rappelsCommande.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
    todos.push(...rappelsCommande.map((rappel) => rappel.todo));

    if (enModeration > 0) {
      todos.push(
        this.todo(
          'TODO_LISTING_REVIEW',
          `${enModeration} annonce${enModeration > 1 ? 's' : ''} en attente de validation`,
          'L’administratrice passera bientôt la voir, in cha Allah.',
          '/mes-annonces',
          `moderation-${enModeration}`,
        ),
      );
    }

    if (!this.stripeBypassConnect && compte && compte.stripeConnectStatus !== 'COMPLETE') {
      const enCours = compte.stripeConnectStatus === 'PENDING';
      todos.push(
        this.todo(
          'TODO_STRIPE',
          enCours ? 'Terminez votre configuration Stripe' : 'Terminez vos coordonnées bancaires',
          enCours
            ? 'Stripe attend encore des informations avant d’activer vos reversements.'
            : 'C’est ce qui vous permettra d’être payée de vos ventes.',
          '/configuration-compte',
          'stripe',
        ),
      );
    }

    return todos;
  }
}
