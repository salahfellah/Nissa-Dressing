import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListingDto } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UploadsService } from '../uploads/uploads.service';
import { toListingDto } from '../listings/listings.mapper';

/** Favoris — CDC §3.5. */
@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly uploads: UploadsService,
  ) {}

  async list(userId: string): Promise<ListingDto[]> {
    const [favorites, settings] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              seller: { select: { id: true, pseudo: true, createdAt: true } },
              _count: { select: { favorites: true } },
            },
          },
        },
      }),
      this.settings.get(),
    ]);

    return favorites.map((favorite) =>
      toListingDto(favorite.listing, { uploads: this.uploads, settings, isFavorite: true }),
    );
  }

  /** Bascule le favori et renvoie son nouvel état. */
  async toggle(userId: string, listingId: string): Promise<{ isFavorite: boolean; favoriteCount: number }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Nous ne retrouvons pas cette annonce.');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.favorite.create({ data: { userId, listingId } });
    }

    const favoriteCount = await this.prisma.favorite.count({ where: { listingId } });
    return { isFavorite: !existing, favoriteCount };
  }

  async ids(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return rows.map((row) => row.listingId);
  }
}
