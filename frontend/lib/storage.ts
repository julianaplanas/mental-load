import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserId } from '@/types';

const CURRENT_USER_KEY = '@noi:current_user';

export async function getStoredUser(): Promise<UserId | null> {
  const value = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return (value as UserId) ?? null;
}

export async function setStoredUser(userId: UserId): Promise<void> {
  await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}
