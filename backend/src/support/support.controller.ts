import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CONTACT_THROTTLE } from '../config/runtime';
import { contactSchema, type ContactInput } from '@nissa/shared';
import { Public } from '../common/decorators/public.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Public()
  @Throttle(CONTACT_THROTTLE)
  @HttpCode(200)
  @Post('contact')
  contact(@Body(zodBody(contactSchema)) body: ContactInput) {
    return this.support.contact(body);
  }
}
