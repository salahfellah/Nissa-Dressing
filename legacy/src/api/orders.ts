import type { Order, ReturnRequest } from '../types';

const DELAY = 300;
const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY));

export async function fetchMyOrders(_userId: string): Promise<Order[]> {
  return wait([]);
}

export async function confirmReception(_orderId: string): Promise<void> {
  return wait(undefined);
}

export async function submitReturnRequest(
  payload: Omit<ReturnRequest, 'id' | 'status' | 'createdAt'>
): Promise<ReturnRequest> {
  const request: ReturnRequest = {
    ...payload,
    id: `return-${Date.now()}`,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
  return wait(request);
}
