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
      <p style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
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
                width: 48, height: 48, borderRadius: 8,
                background: isSelected ? 'var(--primary)' : 'var(--surface)',
                border: `2px solid var(--ink)`,
                fontSize: 22, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: isSelected ? '3px 3px 0 var(--ink)' : '2px 2px 0 var(--ink)',
                transition: 'all 0.1s ease',
                transform: isSelected ? 'translate(-1px, -1px)' : 'none',
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {(myReaction || otherReaction) && (
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {myReaction && (
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700, background: 'var(--primary-light)', border: '1.5px solid var(--ink)', borderRadius: 6, padding: '2px 8px' }}>
              You: {myReaction.emoji}
            </span>
          )}
          {otherReaction && (
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700, background: 'var(--border-soft)', border: '1.5px solid var(--ink)', borderRadius: 6, padding: '2px 8px' }}>
              {otherName}: {otherReaction.emoji}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
