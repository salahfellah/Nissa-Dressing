import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { Response } from 'express';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from '../common/utils/dates';
import { secureToken } from '../common/utils/reference';

export const ACCESS_COOKIE = 'nd_access';
export const REFRESH_COOKIE = 'nd_refresh';

/**
 * Témoin de session, lisible par le navigateur.
 *
 * Les jetons sont httpOnly : le front ne peut pas savoir s'il existe une session
 * avant d'interroger l'API. Sans ce témoin, chaque visiteuse déclenche un appel
 * à /auth/me qui répond 401 — un échec réseau inutile, affiché en rouge dans la
 * console, à chaque première visite.
 *
 * Ce cookie ne contient aucun secret : juste « il y a peut-être une session
 * ici ». Il ne donne aucun accès et n'est jamais utilisé pour authentifier.
 */
export const SESSION_HINT_COOKIE = 'nd_session';

export interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
  role: string;
  status: string;
}

/**
 * Émission et rotation des jetons.
 *
 * Les jetons sont transportés par cookies httpOnly : jamais accessibles au
 * JavaScript de la page, donc non exfiltrables par une injection de script.
 * Le jeton de rafraîchissement est stocké haché en base et tourné à chaque usage —
 * un jeton rejoué est immédiatement détecté et révoqué.
 */
@Injectable()
export class TokenService {
  private readonly jwtCfg: AppConfig['jwt'];
  private readonly cookieSecure: boolean;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.jwtCfg = config.getOrThrow<AppConfig['jwt']>('jwt');
    this.cookieSecure = config.getOrThrow<boolean>('cookieSecure');
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(
    res: Response,
    user: { id: string; email: string; pseudo: string; role: string; status: string },
  ): Promise<void> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      pseudo: user.pseudo,
      role: user.role,
      status: user.status,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.jwtCfg.accessSecret,
      // `expiresIn` attend le format de la librairie `ms` ('15m', '1h'…) ;
      // la valeur vient de la configuration, d'où la conversion explicite.
      expiresIn: this.jwtCfg.accessTtl as JwtSignOptions['expiresIn'],
    });

    const refreshToken = secureToken();
    const expiresAt = addDays(new Date(), this.jwtCfg.refreshTtlDays);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hash(refreshToken), expiresAt },
    });

    const maxAge = 60 * 60 * 24 * this.jwtCfg.refreshTtlDays;
    this.setCookie(res, ACCESS_COOKIE, accessToken, maxAge);
    this.setCookie(res, REFRESH_COOKIE, refreshToken, maxAge);
    this.setCookie(res, SESSION_HINT_COOKIE, '1', maxAge, { httpOnly: false });
  }

  /** Vérifie le jeton de rafraîchissement, le révoque et en émet un nouveau. */
  async rotate(res: Response, refreshToken: string | undefined): Promise<string> {
    if (!refreshToken) {
      throw new UnauthorizedException('Ta session a expiré. Reconnecte-toi, ce sera rapide.');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Ta session a expiré. Reconnecte-toi, ce sera rapide.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await this.issue(res, stored.user);
    return stored.user.id;
  }

  async revoke(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Révoque toutes les sessions — après changement ou réinitialisation de mot de passe. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clear(res: Response): void {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
      res.clearCookie(name, { httpOnly: true, sameSite: 'lax', secure: this.cookieSecure, path: '/' });
    }
    res.clearCookie(SESSION_HINT_COOKIE, {
      httpOnly: false,
      sameSite: 'lax',
      secure: this.cookieSecure,
      path: '/',
    });
  }

  private setCookie(
    res: Response,
    name: string,
    value: string,
    maxAgeSeconds: number,
    options: { httpOnly?: boolean } = {},
  ): void {
    res.cookie(name, value, {
      httpOnly: options.httpOnly ?? true,
      sameSite: 'lax',
      secure: this.cookieSecure,
      maxAge: maxAgeSeconds * 1000,
      path: '/',
    });
  }
}
