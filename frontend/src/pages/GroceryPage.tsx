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
        padding: '16px 20px 12px', borderBottom: '1px solid #EDE5DA', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>Groceries</h1>
        {hasChecked && (
          <button
            onClick={handleClearChecked}
            style={{ background: '#F5EDE4', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#D4845A', cursor: 'pointer' }}
          >
            Clear ✓
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #EDE5DA', borderTopColor: '#D4845A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : groups.length === 0 && !hasChecked ? (
          <div style={{ textAlign: 'center', paddingTop: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 48 }}>🛒</span>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#2C2C2C', margin: 0 }}>List is empty</p>
            <p style={{ fontSize: 14, color: '#8A7F77', margin: 0 }}>Add your first item below.</p>
          </div>
        ) : (
          <div style={{ paddingTop: 8, paddingBottom: 8 }}>
            {groups.map((group) => (
              <div key={group.key} style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F77', padding: '10px 20px', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
                  {group.emoji} {group.label}
                </p>
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            ))}
            {hasChecked && (
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#B0A8A0', padding: '10px 20px', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
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
      <div style={{ background: '#fff', borderTop: '1px solid #EDE5DA', flexShrink: 0 }}>
        {showExpanded && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F0E8DF', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Quantity (e.g. x2)"
              style={{ border: '1.5px solid #EDE5DA', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#2C2C2C', background: '#FDF6EE', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setNewCat(newCat === cat.key ? null : cat.key)}
                  style={{
                    padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap', cursor: 'pointer',
                    border: `1.5px solid ${newCat === cat.key ? '#D4845A' : '#EDE5DA'}`,
                    background: newCat === cat.key ? '#FDF0E8' : '#FDF6EE',
                    fontSize: 12, fontWeight: newCat === cat.key ? 600 : 500,
                    color: newCat === cat.key ? '#D4845A' : '#8A7F77',
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 8 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add an item..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, border: '1.5px solid #EDE5DA', borderRadius: 12, padding: '10px 14px', fontSize: 15, color: '#2C2C2C', background: '#FDF6EE', height: 44, boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <button
            onClick={() => setShowExpanded((v) => !v)}
            style={{ width: 36, height: 36, borderRadius: 18, background: '#F5EDE4', border: 'none', fontSize: 12, color: '#D4845A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {showExpanded ? '▼' : '▲'}
          </button>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            style={{ background: '#D4845A', color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px', height: 44, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (!newName.trim() || adding) ? 0.4 : 1 }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Undo toast */}
      {undoItem && (
        <div style={{
          position: 'fixed', bottom: 90, left: 20, right: 20,
          background: '#2C2C2C', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          <span style={{ color: '#fff', fontSize: 14, flex: 1 }}>"{undoItem.name}" removed</span>
          <button
            onClick={handleUndo}
            style={{ background: '#D4845A', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginLeft: 12 }}
          >
            Undo
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: (i: GroceryItem) => void; onDelete: (i: GroceryItem) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 16px',
      margin: '0 16px 4px', background: item.is_checked ? '#F8F4F0' : '#fff',
      borderRadius: 12, border: `1px solid ${item.is_checked ? '#F0E8DF' : '#EDE5DA'}`,
    }}>
      <button
        onClick={() => onToggle(item)}
        style={{
          width: 22, height: 22, borderRadius: 11, flexShrink: 0,
          border: `2px solid #D4845A`, background: item.is_checked ? '#D4845A' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginRight: 14,
        }}
      >
        {item.is_checked && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 16, color: item.is_checked ? '#B0A8A0' : '#2C2C2C', fontWeight: 500, margin: 0, textDecoration: item.is_checked ? 'line-through' : 'none' }}>
          {item.name}
        </p>
        {item.quantity && (
          <p style={{ fontSize: 13, color: item.is_checked ? '#C0B5AC' : '#8A7F77', margin: 0 }}>{item.quantity}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(item)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#C0B5AC', padding: 0, lineHeight: 1, marginLeft: 12 }}
      >
        ×
      </button>
    </div>
  );
}
