import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { setReaction, removeReaction } from '@/lib/api';
import { REACTION_EMOJIS } from '@/types';
import type { Reaction, UserId } from '@/types';

interface Props {
  cardId: string;
  reactions: Reaction[];
  currentUserId: UserId;
  onUpdate: () => void;
}

export function ReactionsSection({ cardId, reactions, currentUserId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const myReaction = reactions.find((r) => r.user_id === currentUserId);
  const otherUserId: UserId = currentUserId === 'juli' ? 'gino' : 'juli';
  const otherReaction = reactions.find((r) => r.user_id === otherUserId);
  const otherName = otherUserId === 'juli' ? 'Juli' : 'Gino';

  const handleEmojiPress = async (emoji: string) => {
    if (loading) return;
    setLoading(true);
    try {
      if (myReaction?.emoji === emoji) {
        await removeReaction(cardId, currentUserId);
      } else {
        await setReaction(cardId, { user_id: currentUserId, emoji });
      }
      onUpdate();
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reactions</Text>

      <View style={styles.emojiRow}>
        {REACTION_EMOJIS.map((emoji) => {
          const isSelected = myReaction?.emoji === emoji;
          return (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiBtn, isSelected && styles.emojiBtnSelected]}
              onPress={() => handleEmojiPress(emoji)}
              disabled={loading}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {(myReaction || otherReaction) && (
        <View style={styles.currentReactions}>
          {myReaction && (
            <Text style={styles.reactionLabel}>
              You: {myReaction.emoji}
            </Text>
          )}
          {otherReaction && (
            <Text style={styles.reactionLabel}>
              {otherName}: {otherReaction.emoji}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9B96B0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emojiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSelected: {
    borderColor: '#7C6FCD',
    backgroundColor: '#EDE9FF',
  },
  emoji: { fontSize: 22 },
  currentReactions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  reactionLabel: { fontSize: 14, color: '#6B6585', fontWeight: '500' },
});
