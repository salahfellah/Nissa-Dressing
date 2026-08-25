import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { MEMBER_ONLY_KEY } from '../decorators/member-only.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';
import type { Role } from '@nissa/shared';

/**
 * Garde globale : authentification JWT, puis contrôle de rôle et de statut.
 *
 * Une route `@Public()` reste ouverte, mais le token est tout de même décodé
 * quand il est présent — le catalogue a besoin de savoir qui regarde pour
 * marquer les favoris.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      await super.canActivate(context);
    } catch (error) {
      if (isPublic) return true;
      throw error;
    }

    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) {
      if (isPublic) return true;
      throw new UnauthorizedException('Connecte-toi pour accéder à cet espace.');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Cet espace est réservé à l’administratrice.');
    }

    const memberOnly = this.reflector.getAllAndOverride<boolean>(MEMBER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // L'administratrice traverse les gardes de statut : son compte n'a pas vocation
    // à parcourir le tunnel d'inscription des membres.
    if (memberOnly && user.status !== 'MEMBER' && user.role !== 'ADMIN') {
      throw new ForbiddenException({
        message: 'Ton inscription n’est pas encore tout à fait terminée.',
        memberStatus: user.status,
      });
    }

    return true;
  }

  handleRequest<TUser = AuthUser>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException('Connecte-toi pour accéder à cet espace.');
    }
    return user;
  }
}
