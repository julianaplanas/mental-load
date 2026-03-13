import { useState } from 'react';
import { addComment } from '@/lib/api';
import type { Comment } from '@/types';

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const USER_COLOR: Record<string, string> = {
  juli: 'var(--juli)',
  gino: 'var(--gino)',
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
      <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
        Comments
      </p>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: '0 0 12px' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {sorted.map((c) => (
            <div key={c.id} style={{
              background: 'var(--surface)', borderRadius: 16, padding: '10px 14px',
              border: '2px solid var(--border)',
              borderLeft: `4px solid ${USER_COLOR[c.user_id] ?? 'var(--primary)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: USER_COLOR[c.user_id] ?? 'var(--primary)' }}>
                  {c.user_id === 'juli' ? 'Juli' : 'Gino'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--light-muted)' }}>{formatTime(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          style={{
            flex: 1, border: '2px solid var(--border)', borderRadius: 16, padding: '10px 14px',
            fontSize: 16, color: 'var(--text)', background: 'var(--surface)', resize: 'none',
            minHeight: 42, maxHeight: 100, fontFamily: 'inherit',
            transition: 'border-color 0.2s ease',
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--primary)'; }}
          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 50,
            padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            height: 42, opacity: (!text.trim() || sending) ? 0.4 : 1,
            fontFamily: 'var(--font-display)',
            boxShadow: '0 3px 0px #C45A30',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
