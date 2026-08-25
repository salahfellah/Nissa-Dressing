import { SetMetadata } from '@nestjs/common';
import type { Role } from '@nissa/shared';

export const ROLES_KEY = 'roles';

/** Restreint une route à certains rôles (back-office : `@Roles('ADMIN')`). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
