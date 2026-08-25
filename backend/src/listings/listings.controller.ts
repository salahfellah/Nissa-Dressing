import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  listingFiltersSchema,
  listingSchema,
  type CatalogueFacetsDto,
  type ListingDto,
  type ListingFilters,
  type ListingInput,
  type PaginatedDto,
} from '@nissa/shared';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { Public } from '../common/decorators/public.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  /**
   * Catalogue — CDC §3.5.
   * Ouvert aux visiteuses : une candidate doit pouvoir voir ce qu'elle rejoint.
   * Le favori n'est marqué que si une session est présente.
   */
  @Public()
  @Get()
  search(
    @Query(zodBody(listingFiltersSchema)) filters: ListingFilters,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedDto<ListingDto>> {
    return this.listings.search(filters, user?.id);
  }

  /**
   * Compteurs des cases du catalogue.
   *
   * Déclarée avant `@Get(':id')`, sans quoi Nest lirait « facets » comme un
   * identifiant d'annonce.
   */
  @Public()
  @Get('facets')
  facets(): Promise<CatalogueFacetsDto> {
    return this.listings.facets();
  }

  @MemberOnly()
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser, @Query('status') status?: string): Promise<ListingDto[]> {
    return this.listings.findMine(user.id, status);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser): Promise<ListingDto> {
    return this.listings.findOne(id, user ? { id: user.id, role: user.role } : undefined);
  }

  @MemberOnly()
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(zodBody(listingSchema)) body: ListingInput,
  ): Promise<ListingDto> {
    return this.listings.create(user.id, body);
  }

  @MemberOnly()
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(zodBody(listingSchema)) body: ListingInput,
  ): Promise<ListingDto> {
    return this.listings.update(id, user.id, body);
  }

  @MemberOnly()
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.listings.remove(id, user.id);
  }

  // ————— Mise en avant (CDC §3.5) —————

  @MemberOnly()
  @HttpCode(200)
  @Post(':id/boost/free')
  useFreeBoost(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<ListingDto> {
    return this.listings.useFreeBoost(id, user.id);
  }

  @MemberOnly()
  @HttpCode(200)
  @Post(':id/boost/checkout')
  boostCheckout(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.listings.createBoostCheckout(id, user.id);
  }

  @MemberOnly()
  @HttpCode(200)
  @Post(':id/boost/cancel')
  cancelBoost(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.listings.cancelBoost(id, user.id);
  }
}
