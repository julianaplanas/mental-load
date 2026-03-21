import { useState } from 'react';
import { addComment } from '@/lib/api';
import type { Comment } from '@/types';

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const USER_BG: Record<string, string> = {
  juli: '#FFE5EE',
  gino: '#E5F8F4',
};
const USER_ACCENT: Record<string, string> = {
  juli: '#FF6B8A',
  gino: '#4DBFA0',
};

interface Props {
  cardId: string;
  comments: Comment[];
  currentUserId: string;
  onUpdate: () => void;
}

export function CommentsSection({ cardId, comments, currentUserId, onUpdate }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await addComment(cardId, { user_id: currentUserId, text: trimmed });
      setText('');
      onUpdate();
    } catch {
      // silently ignore — user can retry
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
        Comments
      </p>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: '0 0 12px' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {sorted.map((c) => (
            <div key={c.id} style={{
              background: USER_BG[c.user_id] ?? '#F5F2EC',
              borderRadius: 8,
              padding: '10px 14px',
              border: '2px solid var(--ink)',
              borderLeft: `4px solid ${USER_ACCENT[c.user_id] ?? 'var(--ink)'}`,
              boxShadow: '2px 2px 0 var(--ink)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {c.user_id === 'juli' ? 'Juli' : 'Gino'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{formatTime(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          style={{
            flex: 1, border: '2px solid var(--ink)', borderRadius: 8, padding: '10px 14px',
            fontSize: 15, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', resize: 'none',
            minHeight: 42, maxHeight: 100, fontFamily: 'inherit',
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            background: 'var(--primary)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 8,
            padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            height: 44, opacity: (!text.trim() || sending) ? 0.4 : 1,
            fontFamily: 'var(--font-display)',
            boxShadow: '2px 2px 0 var(--ink)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
