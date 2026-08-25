import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Ouvre une route à un visiteur non authentifié. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
