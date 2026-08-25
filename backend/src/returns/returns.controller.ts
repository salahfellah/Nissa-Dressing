import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { returnRequestSchema, type ReturnRequestDto, type ReturnRequestInput } from '@nissa/shared';
import type { Response } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { ReturnsService } from './returns.service';

@MemberOnly()
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser): Promise<ReturnRequestDto[]> {
    return this.returns.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<ReturnRequestDto> {
    return this.returns.findOne(id, { id: user.id, role: user.role });
  }

  @Post('order/:orderId')
  create(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
    @Body(zodBody(returnRequestSchema)) body: ReturnRequestInput,
  ): Promise<ReturnRequestDto> {
    return this.returns.create(orderId, user.id, body);
  }

  @Get(':id/bordereau')
  async returnSlip(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.returns.returnSlip(id, { id: user.id, role: user.role });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}
