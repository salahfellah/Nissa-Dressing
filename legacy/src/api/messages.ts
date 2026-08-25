import type { Message } from '../types';

const DELAY = 200;
const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY));

export async function fetchConversation(_orderId: string): Promise<Message[]> {
  return wait([]);
}

export async function sendMessage(orderId: string, senderId: string, body: string): Promise<Message> {
  const message: Message = {
    id: `msg-${Date.now()}`,
    orderId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  };
  return wait(message);
}
