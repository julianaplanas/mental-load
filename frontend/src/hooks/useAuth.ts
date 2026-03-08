import { useState } from 'react';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/lib/storage';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(getStoredUser);

  const signIn = (id: string) => {
    setStoredUser(id);
    setUserId(id);
  };

  const signOut = () => {
    clearStoredUser();
    setUserId(null);
  };

  return { userId, signIn, signOut };
}
