import { Body, Controller, Get, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import { moderationSchema, type ModerationInput } from '@nissa/shared';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from '../orders/orders.service';
import { ReturnsService } from '../returns/returns.service';
import { AdminService } from './admin.service';

/** Back-office — CDC §3.9. Toutes les routes sont réservées à l'administratrice. */
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly returns: ReturnsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // ————— Inscriptions —————

  @Get('applications')
  applications() {
    return this.admin.pendingApplications();
  }

  /** Diffusion de l'audio de serment — jamais servi statiquement (donnée sensible). */
  @Get('applications/:id/audio')
  async audio(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const path = await this.admin.applicationAudioPath(id);

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Cache-Control', 'private, no-store');
    createReadStream(path).pipe(res);
  }

  @HttpCode(200)
  @Post('applications/:id/review')
  reviewApplication(
    @Param('id') id: string,
    @Body(zodBody(moderationSchema)) body: ModerationInput,
  ) {
    return this.admin.reviewApplication(id, body.accepted, body.reason || undefined);
  }

  // ————— Annonces —————

  @Get('listings')
  pendingListings() {
    return this.admin.pendingListings();
  }

  @HttpCode(200)
  @Post('listings/:id/review')
  reviewListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(zodBody(moderationSchema)) body: ModerationInput,
  ) {
    return this.admin.reviewListing(id, user.id, body.accepted, body.reason || undefined);
  }

  @HttpCode(200)
  @Post('listings/:id/unpublish')
  unpublish(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('reason') reason: string,
  ) {
    return this.admin.unpublishListing(id, user.id, reason ?? 'Annonce non conforme à la charte.');
  }

  // ————— Membres & commandes —————

  @Get('members')
  members(@Query('q') q?: string, @Query('status') status?: string) {
    return this.admin.members(q, status);
  }

  @Get('orders')
  orders(@Query('status') status?: string) {
    return this.admin.orders(status);
  }

  // ————— Litiges / retours (CDC §3.7) —————

  /**
   * Reverse à la vendeuse les fonds gardés en séquestre.
   *
   * C'est l'administratrice qui décide : la confirmation de réception par
   * l'acheteuse ne déclenche plus le transfert.
   */
  @HttpCode(200)
  @Post('orders/:id/payout')
  releasePayout(@Param('id') id: string) {
    return this.ordersService.releasePayout(id);
  }

  @Get('returns')
  returnsList(@Query('status') status?: string) {
    return this.admin.returnRequests(status);
  }

  @HttpCode(200)
  @Post('returns/:id/review')
  reviewReturn(@Param('id') id: string, @Body(zodBody(moderationSchema)) body: ModerationInput) {
    return this.returns.review(id, body.accepted, body.reason || undefined);
  }

  @HttpCode(200)
  @Post('returns/:id/refund')
  refundReturn(@Param('id') id: string) {
    return this.returns.refund(id);
  }

  // ————— Support —————

  @Get('contact-requests')
  contactRequests() {
    return this.admin.contactRequests();
  }

  @HttpCode(200)
  @Post('contact-requests/:id/handled')
  markHandled(@Param('id') id: string) {
    return this.admin.markContactHandled(id);
  }

  // ————— Journal des e-mails —————

  @Get('emails')
  emails() {
    return this.admin.emailLogs();
  }

  @Get('emails/:id')
  async emailBody(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const body = await this.admin.emailBody(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(body);
  }
}
