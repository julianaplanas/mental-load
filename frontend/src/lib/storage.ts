const KEY = 'noi:current_user';

export function getStoredUser(): string | null {
  return localStorage.getItem(KEY);
}

export function setStoredUser(userId: string): void {
  localStorage.setItem(KEY, userId);
}

export function clearStoredUser(): void {
  localStorage.removeItem(KEY);
}
