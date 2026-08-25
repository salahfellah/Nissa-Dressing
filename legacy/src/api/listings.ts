import type { Listing } from '../types';

const DELAY = 300;
const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY));

export interface ListingFilters {
  categoryId?: string;
  subcategoryId?: string;
  size?: string;
  material?: string;
  color?: string;
  condition?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  query?: string;
}

let mockListingSeq = 1;

export async function fetchListings(_filters: ListingFilters = {}): Promise<Listing[]> {
  return wait([]);
}

export async function fetchListing(_id: string): Promise<Listing | null> {
  return wait(null);
}

export async function createListing(
  payload: Omit<Listing, 'id' | 'status' | 'isBoosted' | 'createdAt'>
): Promise<Listing> {
  const listing: Listing = {
    ...payload,
    id: `listing-${mockListingSeq++}`,
    status: 'pending_review',
    isBoosted: false,
    createdAt: new Date().toISOString(),
  };
  return wait(listing);
}

export async function fetchMyListings(_sellerId: string): Promise<Listing[]> {
  return wait([]);
}

export async function boostListing(_listingId: string): Promise<void> {
  return wait(undefined);
}
