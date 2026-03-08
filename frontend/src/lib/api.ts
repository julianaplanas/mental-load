import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Users
export const getVapidKey = () => api.get('/users/vapid-key');
export const registerPushSubscription = (userId: string, subscription: PushSubscription) =>
  api.post(`/users/${userId}/push-subscription`, { subscription });

// Cards
export const getCards = () => api.get('/cards');
export const getCard = (id: string) => api.get(`/cards/${id}`);
export const createCard = (data: object) => api.post('/cards', data);
export const updateCard = (id: string, data: object) => api.patch(`/cards/${id}`, data);
export const deleteCard = (id: string) => api.delete(`/cards/${id}`);

// Subtasks
export const addSubtask = (cardId: string, data: { title: string; assigned_to: string }) =>
  api.post(`/cards/${cardId}/subtasks`, data);
export const updateSubtask = (cardId: string, subtaskId: string, data: object) =>
  api.patch(`/cards/${cardId}/subtasks/${subtaskId}`, data);
export const deleteSubtask = (cardId: string, subtaskId: string) =>
  api.delete(`/cards/${cardId}/subtasks/${subtaskId}`);

// Comments
export const addComment = (cardId: string, data: { user_id: string; text: string }) =>
  api.post(`/cards/${cardId}/comments`, data);

// Reactions
export const setReaction = (cardId: string, data: { user_id: string; emoji: string }) =>
  api.post(`/cards/${cardId}/reactions`, data);
export const removeReaction = (cardId: string, userId: string) =>
  api.delete(`/cards/${cardId}/reactions/${userId}`);

// Grocery
export const getGroceryItems = () => api.get('/grocery');
export const addGroceryItem = (data: object) => api.post('/grocery', data);
export const updateGroceryItem = (id: string, data: object) => api.patch(`/grocery/${id}`, data);
export const deleteGroceryItem = (id: string) => api.delete(`/grocery/${id}`);
export const clearCheckedGrocery = () => api.delete('/grocery/checked');

// Stats
export const getStatsByCategory = (period: 'month' | 'all') =>
  api.get(`/stats/by-category?period=${period}`);
export const getStatsUpcoming = () => api.get('/stats/upcoming');
export const getStatsOverdueTrend = () => api.get('/stats/overdue-trend');
export const getStatsFairness = (period: 'month' | 'all') =>
  api.get(`/stats/fairness?period=${period}`);
export const getStatsRecentCompleted = () => api.get('/stats/recent-completed');
