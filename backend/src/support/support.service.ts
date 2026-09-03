import { Injectable } from '@nestjs/common';
import type { ContactInput } from '@nissa/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

/** Formulaire de contact de la page d'aide — CDC §3.8. */
@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  async contact(input: ContactInput): Promise<{ message: string }> {
    await this.prisma.contactRequest.create({
      data: { email: input.email, pseudo: input.pseudo.trim(), message: input.message.trim() },
    });

    const settings = await this.settings.get();
    await this.mail.send('contactToAdmin', settings.supportEmail, {
      email: input.email,
      pseudo: input.pseudo.trim(),
      message: input.message.trim(),
    });

    return {
      message:
        'Votre message a bien été transmis. Nous vous répondrons par e-mail dans les meilleurs délais, in cha Allah.',
    };
  }
}
