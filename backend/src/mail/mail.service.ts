import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTransport, type Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import type { AppConfig } from '../config/configuration';
import { templates, type MailTemplate, type RenderedMail } from './mail.templates';

/**
 * Envoi des e-mails transactionnels (CDC §2.2).
 *
 * Deux modes, choisis automatiquement selon la configuration :
 *  - `smtp` : envoi réel dès que SMTP_HOST est renseigné ;
 *  - `file` : l'e-mail est écrit dans apps/api/var/mail/ et journalisé en base.
 *    Le parcours complet est donc vérifiable en local sans compte SMTP.
 *
 * Dans les deux cas l'envoi est journalisé (table EmailLog) et consultable en
 * back-office. Un échec d'envoi n'interrompt jamais l'action métier en cours.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly config: AppConfig['mail'];
  private readonly webOrigin: string;
  private transporter: Transporter | null = null;

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.config = configService.getOrThrow<AppConfig['mail']>('mail');
    this.webOrigin = configService.getOrThrow<string>('webOrigin');

    if (this.config.mode === 'smtp') {
      this.transporter = createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465,
        auth: this.config.user ? { user: this.config.user, pass: this.config.password } : undefined,
      });
      this.logger.log(`Envoi SMTP actif (${this.config.host}:${this.config.port})`);
    } else {
      this.logger.warn(
        'SMTP non configuré : les e-mails seront écrits dans var/mail/ et consultables en back-office.',
      );
    }
  }

  /** Construit une URL absolue du front — utilisée par les liens des e-mails. */
  url(path: string): string {
    return `${this.webOrigin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }

  /**
   * Rend et envoie un e-mail typé.
   * `send('applicationAccepted', email, { prenom, ... })`
   */
  async send<K extends MailTemplate>(
    template: K,
    to: string,
    params: Parameters<(typeof templates)[K]>[0],
  ): Promise<void> {
    // La signature des templates est hétérogène ; le typage est garanti à l'appel.
    const rendered = (templates[template] as (p: unknown) => RenderedMail)(params);
    await this.deliver(template, to, rendered);
  }

  private async deliver(template: string, to: string, mail: RenderedMail): Promise<void> {
    let error: string | null = null;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.config.from,
          to,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
      } else {
        await this.writeToDisk(to, mail);
      }
      this.logger.log(`E-mail « ${template} » → ${to}`);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec d'envoi « ${template} » → ${to} : ${error}`);
    }

    // Journalisation systématique : l'administratrice doit pouvoir vérifier
    // qu'un e-mail est bien parti, même en cas d'échec SMTP.
    try {
      await this.prisma.emailLog.create({
        data: { to, subject: mail.subject, template, body: mail.html, error },
      });
    } catch (err) {
      this.logger.error(`Journalisation e-mail impossible : ${(err as Error).message}`);
    }
  }

  private async writeToDisk(to: string, mail: RenderedMail): Promise<void> {
    await mkdir(this.config.outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTo = to.replace(/[^a-zA-Z0-9@._-]/g, '_');
    await writeFile(join(this.config.outDir, `${stamp}__${safeTo}.html`), mail.html, 'utf8');
  }
}
