import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroceryLists, createGroceryList, deleteGroceryList } from '@/lib/api';
import { getSocket, EVENTS } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import type { GroceryList } from '@/types';

const EMOJI_OPTIONS = ['🛒', '🧺', '🏠', '🍽️', '🎉', '💊', '✈️', '🐾'];

export default function GroceryListsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🛒');
  const [creating, setCreating] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState<GroceryList | null>(null);

  const fetchLists = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getGroceryLists();
      setLists(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
    const socket = getSocket();
    const onListsUpdated = (updatedLists: GroceryList[]) => {
      setLists(updatedLists);
    };
    socket.on(EVENTS.GROCERY_LISTS_UPDATED, onListsUpdated);
    return () => {
      socket.off(EVENTS.GROCERY_LISTS_UPDATED, onListsUpdated);
    };
  }, [fetchLists]);

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      await createGroceryList({ name: newName.trim(), emoji: newEmoji, created_by: userId! });
      setNewName('');
      setNewEmoji('🛒');
      setShowCreate(false);
    } catch {
      alert('Could not create list.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (list: GroceryList) => {
    setShowDeleteSheet(null);
    try {
      await deleteGroceryList(list.id);
    } catch {
      alert('Could not delete list.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', borderBottom: '2px solid var(--ink)', flexShrink: 0,
        background: 'var(--bg)',
      }}>
        <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.5, textTransform: 'uppercase' }}>
          🛒 Groceries
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: 'var(--primary)', border: '2px solid var(--ink)', borderRadius: 8,
            padding: '6px 14px', fontSize: 18, fontWeight: 700, color: 'var(--ink)',
            cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)', lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div className="spinner" />
          </div>
        ) : lists.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 48, animation: 'float 3s ease-in-out infinite' }}>🛒</span>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.3, textTransform: 'uppercase' }}>
              No lists yet
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: 8, background: 'var(--primary)', border: '2px solid var(--ink)',
                borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700,
                color: 'var(--ink)', cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)',
                fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 0.5,
              }}
            >
              Create your first list
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => navigate(`/grocery/${list.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '14px 16px',
                  background: 'var(--surface)', borderRadius: 10,
                  border: '2px solid var(--ink)', boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer', transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(2px, 2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <span style={{ fontSize: 28, marginRight: 14, flexShrink: 0 }}>{list.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.3 }}>
                    {list.name}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0', fontWeight: 600 }}>
                    {list.unchecked_count === 0
                      ? (list.item_count === 0 ? 'No items' : 'All done!')
                      : `${list.unchecked_count} item${list.unchecked_count !== 1 ? 's' : ''} left`}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteSheet(list); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: 'var(--muted)', padding: '4px 8px',
                    lineHeight: 1, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create sheet */}
      {showCreate && (
        <div className="sheet-overlay" onClick={() => setShowCreate(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', letterSpacing: -0.5 }}>
              New list
            </p>

            {/* Emoji picker */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewEmoji(emoji)}
                  style={{
                    width: 42, height: 42, borderRadius: 8, fontSize: 22,
                    border: `2px solid ${newEmoji === emoji ? 'var(--ink)' : 'var(--border-soft)'}`,
                    background: newEmoji === emoji ? 'var(--primary)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: newEmoji === emoji ? '2px 2px 0 var(--ink)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Name input */}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="List name..."
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              style={{
                width: '100%', border: '2px solid var(--ink)', borderRadius: 8,
                padding: '10px 14px', fontSize: 16, fontWeight: 500, color: 'var(--text)',
                background: 'var(--bg)', boxSizing: 'border-box', fontFamily: 'inherit',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                Create
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation sheet */}
      {showDeleteSheet && (
        <div className="sheet-overlay" onClick={() => setShowDeleteSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: -0.5 }}>
              Delete "{showDeleteSheet.name}"?
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px', fontWeight: 500 }}>
              This will also delete all items in this list. This can't be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => handleDelete(showDeleteSheet)}
                style={{
                  width: '100%', background: 'var(--red)', border: '2px solid var(--ink)',
                  borderRadius: 8, padding: '14px 20px', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 15, color: '#fff', cursor: 'pointer',
                  boxShadow: 'var(--shadow-btn)',
                }}
              >
                Delete
              </button>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowDeleteSheet(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
