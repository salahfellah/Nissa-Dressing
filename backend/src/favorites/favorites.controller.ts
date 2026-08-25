import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { ListingDto } from '@nissa/shared';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { FavoritesService } from './favorites.service';

@MemberOnly()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<ListingDto[]> {
    return this.favorites.list(user.id);
  }

  @Get('ids')
  ids(@CurrentUser() user: AuthUser): Promise<string[]> {
    return this.favorites.ids(user.id);
  }

  @HttpCode(200)
  @Post(':listingId')
  toggle(@Param('listingId') listingId: string, @CurrentUser() user: AuthUser) {
    return this.favorites.toggle(user.id, listingId);
  }
}
