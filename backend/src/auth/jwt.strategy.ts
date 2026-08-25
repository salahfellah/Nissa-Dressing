import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { ACCESS_COOKIE, type JwtPayload } from './token.service';

const fromCookie = (req: Request): string | null => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[ACCESS_COOKIE] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<AppConfig['jwt']>('jwt').accessSecret,
    });
  }

  /**
   * Le statut et le rôle sont relus en base à chaque requête plutôt que pris dans
   * le jeton : quand l'administratrice valide une candidature ou promeut un compte,
   * l'effet est immédiat, sans attendre l'expiration du jeton ni forcer une
   * reconnexion.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, pseudo: true, role: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('Nous ne retrouvons pas ce compte.');
    }

    return user as AuthUser;
  }
}
