const KEY = 'noi:offline_queue';

export type QueuedAction = {
  id: string;
  action: 'createCard' | 'updateCard' | 'addGroceryItem' | 'updateGroceryItem';
  data: unknown;
};

function load(): QueuedAction[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

function save(queue: QueuedAction[]): void {
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function enqueueAction(action: QueuedAction['action'], data: unknown): void {
  const queue = load();
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, action, data });
  save(queue);
}

export function getQueue(): QueuedAction[] { return load(); }

export function removeFromQueue(id: string): void {
  save(load().filter((a) => a.id !== id));
}

export function clearQueue(): void { localStorage.removeItem(KEY); }
