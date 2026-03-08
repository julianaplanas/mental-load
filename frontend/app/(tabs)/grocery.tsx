import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getGroceryItems,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  clearCheckedGrocery,
} from '@/lib/api';
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

export default function GroceryScreen() {
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
    try {
      await deleteGroceryItem(item.id);
    } catch { /* item was already removed from UI */ }

    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoItem(item);
    undoTimer.current = setTimeout(() => setUndoItem(null), 3500);
  };

  const handleUndo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (!undoItem) return;
    try {
      const { data } = await addGroceryItem({
        name: undoItem.name,
        quantity: undoItem.quantity,
        category: undoItem.category,
        added_by: undoItem.added_by,
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
        name: newName.trim(),
        quantity: newQty.trim() || null,
        category: newCat,
        added_by: userId,
      });
      setItems((prev) => [...prev, data]);
      setNewName('');
      setNewQty('');
      setNewCat(null);
      setShowExpanded(false);
    } catch {
      Alert.alert('Error', 'Could not add item.');
    } finally {
      setAdding(false);
    }
  };

  const handleClearChecked = () => {
    const count = items.filter((i) => i.is_checked).length;
    if (count === 0) return;
    Alert.alert(
      'Clear checked items?',
      `Remove all ${count} checked item${count !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setItems((prev) => prev.filter((i) => !i.is_checked));
            await clearCheckedGrocery();
          },
        },
      ]
    );
  };

  const { groups, checked } = buildGroups(items);
  const hasChecked = checked.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Groceries</Text>
        {hasChecked && (
          <TouchableOpacity onPress={handleClearChecked} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear ✓</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4845A" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            style={styles.list}
            contentContainerStyle={
              groups.length === 0 && !hasChecked ? styles.emptyContainer : styles.listContent
            }
            keyboardShouldPersistTaps="handled"
          >
            {groups.length === 0 && !hasChecked ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyTitle}>List is empty</Text>
                <Text style={styles.emptySub}>Add your first item below.</Text>
              </View>
            ) : (
              <>
                {groups.map((group) => (
                  <View key={group.key} style={styles.section}>
                    <Text style={styles.sectionHeader}>
                      {group.emoji} {group.label}
                    </Text>
                    {group.items.map((item) => (
                      <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                  </View>
                ))}

                {hasChecked && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionHeader, styles.sectionHeaderChecked]}>
                      ✓ In the basket
                    </Text>
                    {checked.map((item) => (
                      <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                  </View>
                )}
              </>
            )}
            <View style={{ height: showExpanded ? 220 : 80 }} />
          </ScrollView>

          {/* Add bar */}
          <View style={styles.addBar}>
            {showExpanded && (
              <View style={styles.expandedForm}>
                <TextInput
                  style={styles.expandedInput}
                  value={newQty}
                  onChangeText={setNewQty}
                  placeholder="Quantity (e.g. x2)"
                  placeholderTextColor="#C0B5AC"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.catRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.catChip, newCat === cat.key && styles.catChipSelected]}
                        onPress={() => setNewCat(newCat === cat.key ? null : cat.key)}
                      >
                        <Text style={[styles.catChipText, newCat === cat.key && styles.catChipTextSelected]}>
                          {cat.emoji} {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Add an item..."
                placeholderTextColor="#C0B5AC"
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowExpanded((v) => !v)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>{showExpanded ? '▼' : '▲'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, (!newName.trim() || adding) && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!newName.trim() || adding}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Undo toast */}
      {undoItem && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText} numberOfLines={1}>
            "{undoItem.name}" removed
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
}) {
  return (
    <View style={[styles.itemRow, item.is_checked && styles.itemRowChecked]}>
      <TouchableOpacity style={styles.checkboxArea} onPress={() => onToggle(item)}>
        <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
          {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        {item.quantity && (
          <Text style={[styles.itemQty, item.is_checked && styles.itemQtyChecked]}>
            {item.quantity}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={() => onDelete(item)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EE' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5DA',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#2C2C2C' },
  clearBtn: {
    backgroundColor: '#F5EDE4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#D4845A' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingTop: 8 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#2C2C2C' },
  emptySub: { fontSize: 14, color: '#8A7F77' },
  section: { marginBottom: 4 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7F77',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderChecked: { color: '#B0A8A0' },
  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    marginHorizontal: 16,
    marginBottom: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE5DA',
  },
  itemRowChecked: { backgroundColor: '#F8F4F0', borderColor: '#F0E8DF' },
  checkboxArea: { paddingHorizontal: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D4845A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#D4845A', borderColor: '#D4845A' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 16, color: '#2C2C2C', fontWeight: '500' },
  itemNameChecked: {
    color: '#B0A8A0',
    textDecorationLine: 'line-through',
    textDecorationColor: '#B0A8A0',
  },
  itemQty: { fontSize: 13, color: '#8A7F77' },
  itemQtyChecked: { color: '#C0B5AC' },
  deleteBtn: { paddingLeft: 12 },
  deleteIcon: { fontSize: 22, color: '#C0B5AC', lineHeight: 24 },
  // Add bar
  addBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EDE5DA',
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  expandedForm: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DF',
    paddingBottom: 10,
  },
  expandedInput: {
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2C2C2C',
    backgroundColor: '#FDF6EE',
  },
  catRow: { flexDirection: 'row', gap: 6 },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    backgroundColor: '#FDF6EE',
  },
  catChipSelected: { borderColor: '#D4845A', backgroundColor: '#FDF0E8' },
  catChipText: { fontSize: 12, color: '#8A7F77', fontWeight: '500' },
  catChipTextSelected: { color: '#D4845A', fontWeight: '600' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#EDE5DA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2C2C2C',
    backgroundColor: '#FDF6EE',
    height: 44,
  },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtnText: { fontSize: 12, color: '#D4845A' },
  addBtn: {
    backgroundColor: '#D4845A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Undo toast
  undoToast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#2C2C2C',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  undoText: { color: '#fff', fontSize: 14, flex: 1 },
  undoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#D4845A',
    marginLeft: 12,
  },
  undoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
