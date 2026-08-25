import { Body, Controller, Get, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import { createOrderSchema, type CreateOrderInput, type OrderDto } from '@nissa/shared';
import type { Response } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';

@MemberOnly()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body(zodBody(createOrderSchema)) body: CreateOrderInput) {
    return this.orders.create(user.id, body);
  }

  @Get()
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('role') role?: 'buyer' | 'seller' | 'all',
  ): Promise<OrderDto[]> {
    return this.orders.findMine(user.id, role ?? 'all');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<OrderDto> {
    return this.orders.findOne(id, { id: user.id, role: user.role });
  }

  /** Bordereau d'envoi PDF — CDC §3.6. */
  @Get(':id/bordereau')
  async waybill(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.orders.waybill(id, { id: user.id, role: user.role });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @HttpCode(200)
  @Post(':id/expedie')
  markShipped(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<OrderDto> {
    return this.orders.markShipped(id, user.id);
  }

  /** Confirmation de réception : libère le séquestre au profit de la vendeuse (CDC §3.6). */
  @HttpCode(200)
  @Post(':id/reception')
  confirmReception(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<OrderDto> {
    return this.orders.confirmReception(id, user.id);
  }
}
