import { useState } from 'react';
import { setReaction, removeReaction } from '@/lib/api';
import { REACTION_EMOJIS } from '@/types';
import type { Reaction } from '@/types';

interface Props {
  cardId: string;
  reactions: Reaction[];
  currentUserId: string;
  onUpdate: () => void;
}

export function ReactionsSection({ cardId, reactions, currentUserId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const myReaction = reactions.find((r) => r.user_id === currentUserId);
  const otherUserId = currentUserId === 'juli' ? 'gino' : 'juli';
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
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
        Reactions
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {REACTION_EMOJIS.map((emoji) => {
          const isSelected = myReaction?.emoji === emoji;
          return (
            <button
              key={emoji}
              onClick={() => handleEmojiPress(emoji)}
              disabled={loading}
              style={{
                width: 44, height: 44, borderRadius: 22,
                background: isSelected ? '#FDF0E8' : '#fff',
                border: `1.5px solid ${isSelected ? '#D4845A' : '#EDE5DA'}`,
                fontSize: 22, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {(myReaction || otherReaction) && (
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {myReaction && (
            <span style={{ fontSize: 14, color: '#5C4A38', fontWeight: 500 }}>
              You: {myReaction.emoji}
            </span>
          )}
          {otherReaction && (
            <span style={{ fontSize: 14, color: '#5C4A38', fontWeight: 500 }}>
              {otherName}: {otherReaction.emoji}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
