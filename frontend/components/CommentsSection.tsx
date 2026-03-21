import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { addComment } from '@/lib/api';
import type { Comment, UserId } from '@/types';

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  cardId: string;
  comments: Comment[];
  currentUserId: UserId;
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
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comments</Text>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>No comments yet. Be the first!</Text>
      ) : (
        <View style={styles.list}>
          {sorted.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Text style={styles.author}>
                  {c.user_id === 'juli' ? 'Juli' : 'Gino'}
                </Text>
                <Text style={styles.timestamp}>{formatTime(c.created_at)}</Text>
              </View>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Add a comment..."
            placeholderTextColor="#B8B4CC"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9B96B0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  empty: { fontSize: 14, color: '#9B96B0', fontStyle: 'italic', marginBottom: 12 },
  list: { gap: 10, marginBottom: 14 },
  comment: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEAFF',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  author: { fontSize: 13, fontWeight: '700', color: '#7C6FCD' },
  timestamp: { fontSize: 12, color: '#9B96B0' },
  commentText: { fontSize: 14, color: '#1A1826', lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ECEAFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1826',
    backgroundColor: '#fff',
    minHeight: 42,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#7C6FCD',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 42,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
