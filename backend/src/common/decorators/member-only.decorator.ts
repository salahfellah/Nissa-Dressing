import { SetMetadata } from '@nestjs/common';

export const MEMBER_ONLY_KEY = 'memberOnly';

/**
 * Réserve la route aux membres ayant terminé le parcours d'inscription
 * (statut MEMBER — CDC §3.1). Les statuts intermédiaires reçoivent un 403
 * indiquant l'étape restante.
 */
export const MemberOnly = () => SetMetadata(MEMBER_ONLY_KEY, true);
