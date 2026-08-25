import type { MemberStatus, User } from '../types';

// Couche mock (Promise + setTimeout), remplaçable par des appels fetch() une fois le backend prêt.
const DELAY = 400;

const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY));

interface SignupPayload {
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  password: string;
  audioFile: string;
}

let mockUserSeq = 1;

export async function submitSignup(payload: SignupPayload): Promise<User> {
  const user: User = {
    id: `user-${mockUserSeq++}`,
    nom: payload.nom,
    prenom: payload.prenom,
    pseudo: payload.pseudo,
    email: payload.email,
    status: 'pending_review',
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
  return wait(user);
}

export async function login(_email: string, _password: string): Promise<User> {
  const user: User = {
    id: 'user-1',
    nom: 'Amina',
    prenom: 'Sœur',
    pseudo: 'amina.dressing',
    email: _email,
    status: 'member',
    isAdmin: false,
    createdAt: new Date().toISOString(),
  };
  return wait(user);
}

export async function requestPasswordReset(_email: string): Promise<void> {
  return wait(undefined);
}

export async function payAccessFee(_userId: string): Promise<{ status: MemberStatus }> {
  return wait({ status: 'payment_done' });
}

export async function completeOnboarding(_userId: string): Promise<{ status: MemberStatus }> {
  return wait({ status: 'member' });
}
