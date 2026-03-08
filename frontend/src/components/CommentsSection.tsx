import { useState } from 'react';
import { addComment } from '@/lib/api';
import type { Comment } from '@/types';

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

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
      <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
        Comments
      </p>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 14, color: '#B0A8A0', fontStyle: 'italic', margin: '0 0 12px' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {sorted.map((c) => (
            <div key={c.id} style={{
              background: '#fff', borderRadius: 12, padding: 12,
              border: '1px solid #EDE5DA',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D4845A' }}>
                  {c.user_id === 'juli' ? 'Juli' : 'Gino'}
                </span>
                <span style={{ fontSize: 12, color: '#B0A8A0' }}>{formatTime(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: '#2C2C2C', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          style={{
            flex: 1, border: '1.5px solid #EDE5DA', borderRadius: 12, padding: '10px 12px',
            fontSize: 14, color: '#2C2C2C', background: '#fff', resize: 'none',
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
            background: '#D4845A', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            height: 42, opacity: (!text.trim() || sending) ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
