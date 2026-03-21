import { useEffect, useState, useRef, useCallback } from 'react';
import { getGroceryItems, addGroceryItem, updateGroceryItem, deleteGroceryItem, clearCheckedGrocery } from '@/lib/api';
import { getSocket, EVENTS } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import type { GroceryItem, GroceryCategory } from '@/types';

const CATEGORIES: { key: GroceryCategory; label: string; emoji: string }[] = [
  { key: 'produce', label: 'Produce', emoji: '🥦' },
  { key: 'dairy', label: 'Dairy', emoji: '🥛' },
  { key: 'meat', label: 'Meat', emoji: '🥩' },
  { key: 'pantry', label: 'Pantry', emoji: '🍝' },
  { key: 'frozen', label: 'Frozen', emoji: '🧊' },
  { key: 'drinks', label: 'Drinks', emoji: '🧃' },
  { key: 'other', label: 'Other', emoji: '📦' },
];
const CAT_ORDER = CATEGORIES.map((c) => c.key);

function getCatInfo(key: string | null | undefined) {
  return CATEGORIES.find((c) => c.key === key) ?? { label: 'Other items', emoji: '🛍️' };
}

function buildGroups(items: GroceryItem[]) {
  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);
  const byCategory: Record<string, GroceryItem[]> = {};
  for (const item of unchecked) {
    const k = item.category ?? '__none__';
    if (!byCategory[k]) byCategory[k] = [];
    byCategory[k].push(item);
  }
  const groups: { key: string; label: string; emoji: string; items: GroceryItem[] }[] = [];
  for (const cat of CAT_ORDER) {
    if (byCategory[cat]) {
      const info = getCatInfo(cat);
      groups.push({ key: cat, label: info.label, emoji: info.emoji, items: byCategory[cat] });
    }
  }
  if (byCategory['__none__']) {
    groups.push({ key: '__none__', label: 'Other items', emoji: '🛍️', items: byCategory['__none__'] });
  }
  return { groups, checked };
}

export default function GroceryPage() {
  const { userId } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCat, setNewCat] = useState<GroceryCategory | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [undoItem, setUndoItem] = useState<GroceryItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getGroceryItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const socket = getSocket();
    const refetch = () => fetchItems(true);
    socket.on(EVENTS.GROCERY_UPDATED, refetch);
    return () => { socket.off(EVENTS.GROCERY_UPDATED, refetch); };
  }, [fetchItems]);

  const handleToggle = async (item: GroceryItem) => {
    const updated = { ...item, is_checked: !item.is_checked };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    try {
      await updateGroceryItem(item.id, { is_checked: !item.is_checked });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    }
  };

  const handleDelete = async (item: GroceryItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try { await deleteGroceryItem(item.id); } catch { /* already removed from UI */ }
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoItem(item);
    undoTimer.current = setTimeout(() => setUndoItem(null), 3500);
  };

  const handleUndo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (!undoItem) return;
    try {
      const { data } = await addGroceryItem({
        name: undoItem.name, quantity: undoItem.quantity,
        category: undoItem.category, added_by: undoItem.added_by,
      });
      setItems((prev) => [data, ...prev]);
    } catch { /* silently fail */ }
    setUndoItem(null);
  };

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      const { data } = await addGroceryItem({
        name: newName.trim(), quantity: newQty.trim() || null,
        category: newCat, added_by: userId,
      });
      setItems((prev) => [...prev, data]);
      setNewName(''); setNewQty(''); setNewCat(null); setShowExpanded(false);
    } catch {
      alert('Could not add item.');
    } finally {
      setAdding(false);
    }
  };

  const handleClearChecked = async () => {
    const count = items.filter((i) => i.is_checked).length;
    if (count === 0) return;
    if (!confirm(`Remove all ${count} checked item${count !== 1 ? 's' : ''}?`)) return;
    setItems((prev) => prev.filter((i) => !i.is_checked));
    await clearCheckedGrocery();
  };

  const { groups, checked } = buildGroups(items);
  const hasChecked = checked.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Groceries</h1>
        {hasChecked && (
          <button
            onClick={handleClearChecked}
            style={{ background: 'var(--primary-light)', border: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}
          >
            Clear ✓
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div className="spinner" />
          </div>
        ) : groups.length === 0 && !hasChecked ? (
          <div style={{ textAlign: 'center', paddingTop: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 48, animation: 'float 3s ease-in-out infinite' }}>🛒</span>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>List is empty</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Add your first item below.</p>
          </div>
        ) : (
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            {groups.map((group) => (
              <div key={group.key} style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', padding: '10px 20px', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
                  {group.emoji} {group.label}
                </p>
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            ))}
            {hasChecked && (
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--light-muted)', padding: '10px 20px', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
                  ✓ In the basket
                </p>
                {checked.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add bar */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {/* Category chips — always visible */}
        <div style={{ padding: '10px 12px 6px', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setNewCat(newCat === cat.key ? null : cat.key)}
              style={{
                padding: '6px 13px', borderRadius: 50, whiteSpace: 'nowrap', cursor: 'pointer',
                border: `1.5px solid ${newCat === cat.key ? 'var(--primary)' : 'var(--border)'}`,
                background: newCat === cat.key ? 'var(--primary-light)' : 'transparent',
                fontSize: 12, fontWeight: newCat === cat.key ? 700 : 500,
                color: newCat === cat.key ? 'var(--primary)' : 'var(--muted)',
                transition: 'all 0.2s var(--ease-spring)',
                flexShrink: 0,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Quantity field — still toggled */}
        {showExpanded && (
          <div style={{ padding: '0 12px 8px' }}>
            <input
              type="text"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Quantity (e.g. x2)"
              style={{ border: '1.5px solid var(--border)', borderRadius: 50, padding: '8px 14px', fontSize: 15, color: 'var(--text)', background: 'var(--bg)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px 10px', gap: 8, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add an item..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 50, padding: '10px 16px', fontSize: 16, color: 'var(--text)', background: 'var(--bg)', height: 44, boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <button
            onClick={() => setShowExpanded((v) => !v)}
            style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--primary-light)', border: 'none', fontSize: 13, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
          >
            {showExpanded ? '▼' : '▲'}
          </button>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 50, padding: '0 18px', height: 44, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (!newName.trim() || adding) ? 0.4 : 1, fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-btn)' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Undo toast */}
      {undoItem && (
        <div className="toast">
          <span>"{undoItem.name}" removed</span>
          <button className="toast-action" onClick={handleUndo}>Undo</button>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: (i: GroceryItem) => void; onDelete: (i: GroceryItem) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '13px 16px',
      margin: '0 16px 4px',
      background: item.is_checked ? 'var(--surface-warm)' : 'var(--surface)',
      borderRadius: 18,
      boxShadow: item.is_checked ? 'none' : 'var(--shadow-card)',
      transition: 'all 0.2s ease',
      opacity: item.is_checked ? 0.65 : 1,
    }}>
      <button
        onClick={() => onToggle(item)}
        style={{
          width: 26, height: 26, borderRadius: 13, flexShrink: 0,
          border: `2px solid ${item.is_checked ? 'var(--sage)' : 'var(--primary)'}`,
          background: item.is_checked ? 'var(--sage)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginRight: 14,
          transition: 'all 0.2s var(--ease-spring)',
        }}
      >
        {item.is_checked && (
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, animation: 'checkBounce 0.3s var(--ease-spring)' }}>✓</span>
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 16, fontWeight: 600,
          color: item.is_checked ? 'var(--muted)' : 'var(--text)',
          margin: 0,
          textDecoration: item.is_checked ? 'line-through' : 'none',
          textDecorationColor: 'var(--light-muted)',
        }}>
          {item.name}
        </p>
        {item.quantity && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
            {item.quantity}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(item)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--light-muted)', padding: 0, lineHeight: 1, marginLeft: 12, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}
