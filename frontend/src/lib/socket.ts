import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export const EVENTS = {
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_DELETED: 'card:deleted',
  COMMENT_ADDED: 'comment:added',
  REACTION_UPDATED: 'reaction:updated',
  GROCERY_UPDATED: 'grocery:updated',
} as const;
