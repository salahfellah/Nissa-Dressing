import { randomBytes, randomUUID } from 'node:crypto';

/** Alphabet sans caractères ambigus (0/O, 1/I) — les références sont lues à voix haute. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const randomCode = (length: number): string => {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
};

/** Référence de commande imprimée sur le bordereau d'envoi (CDC §3.6). */
export const orderReference = (): string => `ND-${randomCode(4)}-${randomCode(4)}`;

export const secureToken = (): string => randomBytes(32).toString('base64url');

export const uuid = (): string => randomUUID();
