import { useState, useEffect } from 'react';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/lib/storage';
import type { UserId } from '@/types';

export function useAuth() {
  const [userId, setUserId] = useState<UserId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser()
      .then(setUserId)
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (id: UserId) => {
    await setStoredUser(id);
    setUserId(id);
  };

  const signOut = async () => {
    await clearStoredUser();
    setUserId(null);
  };

  return { userId, loading, signIn, signOut };
}
