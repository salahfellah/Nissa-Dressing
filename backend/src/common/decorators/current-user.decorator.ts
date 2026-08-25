import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { MemberStatus, Role } from '@nissa/shared';

export interface AuthUser {
  id: string;
  email: string;
  pseudo: string;
  role: Role;
  status: MemberStatus;
}

/** Injecte l'utilisatrice authentifiée résolue par JwtStrategy. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
