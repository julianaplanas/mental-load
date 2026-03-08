import { useState, useEffect, useCallback } from 'react';
import { getCards } from '@/lib/api';
import { getSocket, EVENTS } from '@/lib/socket';
import type { Card } from '@/types';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await getCards();
      setCards(data);
      setError(null);
    } catch {
      setError('Could not load tasks. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh(true).then(() => setLoading(false));

    const socket = getSocket();
    const onAny = () => refresh(true);
    socket.on(EVENTS.CARD_CREATED, onAny);
    socket.on(EVENTS.CARD_UPDATED, onAny);
    socket.on(EVENTS.CARD_DELETED, onAny);

    return () => {
      socket.off(EVENTS.CARD_CREATED, onAny);
      socket.off(EVENTS.CARD_UPDATED, onAny);
      socket.off(EVENTS.CARD_DELETED, onAny);
    };
  }, [refresh]);

  return { cards, loading, refreshing, error, refresh: () => refresh(false) };
}
