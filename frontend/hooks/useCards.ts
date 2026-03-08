import { useState, useEffect, useCallback } from 'react';
import { getCards } from '@/lib/api';
import { getSocket, EVENTS } from '@/lib/socket';
import type { Card } from '@/types';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetch(true);
  }, [fetch]);

  useEffect(() => {
    fetch();

    const socket = getSocket();
    const refetch = () => fetch(true);

    socket.on(EVENTS.CARD_CREATED, refetch);
    socket.on(EVENTS.CARD_UPDATED, refetch);
    socket.on(EVENTS.CARD_DELETED, refetch);

    return () => {
      socket.off(EVENTS.CARD_CREATED, refetch);
      socket.off(EVENTS.CARD_UPDATED, refetch);
      socket.off(EVENTS.CARD_DELETED, refetch);
    };
  }, [fetch]);

  return { cards, loading, refreshing, error, refresh };
}
