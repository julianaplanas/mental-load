import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { registerForPushNotifications } from '@/lib/notifications';
import { getSocket } from '@/lib/socket';
import { getQueue, removeFromQueue } from '@/lib/offlineQueue';
import { createCard, updateCard, addGroceryItem, updateGroceryItem } from '@/lib/api';

async function processOfflineQueue() {
  const queue = await getQueue();
  for (const item of queue) {
    try {
      if (item.action === 'createCard') {
        await createCard(item.data);
      } else if (item.action === 'updateCard') {
        await updateCard(item.data.id, item.data.patch);
      } else if (item.action === 'addGroceryItem') {
        await addGroceryItem(item.data);
      } else if (item.action === 'updateGroceryItem') {
        await updateGroceryItem(item.data.id, item.data.patch);
      }
      await removeFromQueue(item.id);
    } catch {
      // Keep in queue if it fails again — will retry next reconnect
    }
  }
}

export default function RootLayout() {
  const { userId, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isOnline, setIsOnline] = useState(true);

  // Route guard: redirect based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inCardGroup = segments[0] === 'card';

    if (!userId && (inAuthGroup || inCardGroup)) {
      router.replace('/');
    } else if (userId && !inAuthGroup && !inCardGroup) {
      router.replace('/(tabs)');
    }
  }, [userId, loading, segments]);

  // Connect socket, register push token, and handle online/offline state
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    registerForPushNotifications(userId);

    const onConnect = async () => {
      setIsOnline(true);
      await processOfflineQueue();
    };
    const onDisconnect = () => setIsOnline(false);
    const onConnectError = () => setIsOnline(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Set initial state based on current socket status
    setIsOnline(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [userId]);

  return (
    <>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You're offline — changes will sync when you reconnect
          </Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="card/new" />
        <Stack.Screen name="card/edit" />
        <Stack.Screen name="card/[id]" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#7C6FCD',
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
