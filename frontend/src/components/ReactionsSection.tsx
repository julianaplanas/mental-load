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
      <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
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
                width: 48, height: 48, borderRadius: 16,
                background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                fontSize: 24, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: isSelected ? '0 3px 0px var(--primary-soft)' : '0 3px 0px var(--border)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
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
            <span style={{ fontSize: 14, color: 'var(--text-soft)', fontWeight: 600 }}>
              You: {myReaction.emoji}
            </span>
          )}
          {otherReaction && (
            <span style={{ fontSize: 14, color: 'var(--text-soft)', fontWeight: 600 }}>
              {otherName}: {otherReaction.emoji}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
