import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
import { registerIfPermitted } from '@/lib/notifications';
import { getQueue, removeFromQueue } from '@/lib/offlineQueue';
import { createCard, updateCard, addGroceryItem, updateGroceryItem } from '@/lib/api';
import TabBar from '@/components/TabBar';
import AuthPage from '@/pages/AuthPage';
import FeedPage from '@/pages/FeedPage';
import GroceryPage from '@/pages/GroceryPage';
import DashboardPage from '@/pages/DashboardPage';
import CardDetailPage from '@/pages/CardDetailPage';
import CardFormPage from '@/pages/CardFormPage';

async function processOfflineQueue() {
  const queue = getQueue();
  for (const item of queue) {
    try {
      if (item.action === 'createCard') await createCard(item.data as object);
      else if (item.action === 'updateCard') {
        const d = item.data as { id: string; patch: object };
        await updateCard(d.id, d.patch);
      } else if (item.action === 'addGroceryItem') await addGroceryItem(item.data as object);
      else if (item.action === 'updateGroceryItem') {
        const d = item.data as { id: string; patch: object };
        await updateGroceryItem(d.id, d.patch);
      }
      removeFromQueue(item.id);
    } catch { /* keep in queue */ }
  }
}

const TAB_ROUTES = ['/tasks', '/grocery', '/dashboard'];

export default function App() {
  const { userId, signIn } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true);

  const isTabRoute = TAB_ROUTES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    registerIfPermitted(userId);

    const onConnect = async () => {
      setIsOnline(true);
      await processOfflineQueue();
    };
    const onDisconnect = () => setIsOnline(false);
    const onError = () => setIsOnline(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    setIsOnline(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, [userId]);

  if (!userId) {
    return <AuthPage onSignIn={signIn} />;
  }

  return (
    <div className="app-shell">
      {!isOnline && (
        <div className="offline-banner">
          You're offline — changes will sync when you reconnect
        </div>
      )}

      {isTabRoute ? (
        <>
          <div className="page-scroll">
            <Routes>
              <Route path="/tasks" element={<FeedPage />} />
              <Route path="/grocery" element={<GroceryPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </div>
          <TabBar />
        </>
      ) : (
        <div className="page-scroll-notab" style={{ display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/card/new" element={<CardFormPage />} />
            <Route path="/card/:id/edit" element={<CardFormPage />} />
            <Route path="/card/:id" element={<CardDetailPage />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
