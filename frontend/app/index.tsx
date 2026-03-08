import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import type { UserId } from '@/types';

const USERS: { id: UserId; name: string; emoji: string; color: string }[] = [
  { id: 'juli', name: 'Juli', emoji: '🌸', color: '#D4845A' },
  { id: 'gino', name: 'Gino', emoji: '🌿', color: '#5A9E8A' },
];

export default function AuthScreen() {
  const { signIn } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>noi</Text>
        <Text style={styles.subtitle}>our shared mental load</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.question}>Who are you?</Text>

        {USERS.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[styles.userButton, { backgroundColor: user.color }]}
            onPress={() => signIn(user.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.userEmoji}>{user.emoji}</Text>
            <Text style={styles.userName}>I'm {user.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footnote}>
        Your choice is saved on this device.{'\n'}You won't be asked again.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EE',
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A7F77',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  body: {
    gap: 16,
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 8,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 28,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userEmoji: {
    fontSize: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  footnote: {
    textAlign: 'center',
    fontSize: 13,
    color: '#B0A8A0',
    lineHeight: 20,
  },
});
