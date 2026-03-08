import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@noi:offline_queue';

export type QueuedAction = {
  id: string;
  action: 'createCard' | 'updateCard' | 'addGroceryItem' | 'updateGroceryItem';
  data: any;
};

export async function enqueueAction(
  action: QueuedAction['action'],
  data: any
): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedAction[] = raw ? JSON.parse(raw) : [];
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, action, data });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedAction[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((a) => a.id !== id)));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
