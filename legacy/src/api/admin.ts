import type { Listing, User } from '../types';

const DELAY = 300;
const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY));

export async function fetchPendingSignups(): Promise<User[]> {
  return wait([]);
}

export async function reviewSignup(_userId: string, _accepted: boolean): Promise<void> {
  return wait(undefined);
}

export async function fetchPendingListings(): Promise<Listing[]> {
  return wait([]);
}

export async function reviewListing(_listingId: string, _accepted: boolean, _reason?: string): Promise<void> {
  return wait(undefined);
}
