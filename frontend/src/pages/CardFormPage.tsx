import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCard, getCard, updateCard, addSubtask } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { enqueueAction } from '@/lib/offlineQueue';
import { PRESET_TAGS } from '@/types';
import type { Timeline, AssignedTo, Priority, RecurringFrequency, Card } from '@/types';

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'custom', label: 'Custom date' },
];

const ASSIGNMENTS: { value: AssignedTo; label: string }[] = [
  { value: 'either', label: 'Either of us' },
  { value: 'juli', label: '🌸 Juli' },
  { value: 'gino', label: '🌿 Gino' },
  { value: 'together', label: '🤝 Together' },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: '🔥 Urgent' },
  { value: 'normal', label: '· Normal' },
  { value: 'low', label: '↓ Low' },
];

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 wks' },
  { value: 'monthly', label: 'Monthly' },
];

function Chips<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              border: `2px solid ${active ? 'var(--ink)' : 'var(--border-soft)'}`,
              background: active ? 'var(--primary)' : 'var(--surface)',
              color: active ? 'var(--ink)' : 'var(--muted)',
              fontWeight: 700,
              boxShadow: active ? '2px 2px 0 var(--ink)' : 'none',
              transition: 'all 0.1s ease',
              letterSpacing: 0.2,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '2px solid var(--ink)', borderRadius: 8, padding: 12,
  fontSize: 15, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'box-shadow 0.1s ease',
};

export default function CardFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const isEdit = Boolean(id);

  const [fetching, setFetching] = useState(isEdit);
  const [title, setTitle] = useState('');
  const [timeline, setTimeline] = useState<Timeline>('this_week');
  const [customDate, setCustomDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<AssignedTo>('either');
  const [tag, setTag] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [priority, setPriority] = useState<Priority>('normal');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('weekly');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => {
    if (!id) return;
    getCard(id)
      .then(({ data }: { data: Card }) => {
        setTitle(data.title);
        const tl = (data.original_timeline as Timeline) ?? data.timeline;
        setTimeline(tl);
        setCustomDate(data.custom_date ?? '');
        setAssignedTo(data.assigned_to);
        setTag(data.tag ?? null);
        setPriority(data.priority);
        setIsRecurring(data.is_recurring);
        setRecurringFrequency(data.recurring_frequency ?? 'weekly');
        setNotes(data.notes ?? '');
      })
      .catch(() => { alert('Could not load task.'); navigate(-1); })
      .finally(() => setFetching(false));
  }, [id]);

  const isCustomTag = tag !== null && !PRESET_TAGS.find((t) => t.name === tag);

  const handleConfirmCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed) setTag(trimmed);
    setShowCustomTagInput(false);
    setCustomTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('Please add a title for this task.'); return; }
    if (timeline === 'custom' && !customDate) { alert('Please enter a custom date (YYYY-MM-DD).'); return; }

    const cardData = {
      title: title.trim(), timeline,
      custom_date: timeline === 'custom' ? customDate : undefined,
      assigned_to: assignedTo, tag, priority,
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? recurringFrequency : undefined,
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateCard(id, { ...cardData, custom_date: timeline === 'custom' ? customDate : null, recurring_frequency: isRecurring ? recurringFrequency : null, current_user_id: userId });
      } else {
        try {
          const { data: created } = await createCard({ ...cardData, created_by: userId });
          if (pendingSubtasks.length > 0) {
            await Promise.all(pendingSubtasks.map((t) => addSubtask(created.id, { title: t, assigned_to: 'either' })));
          }
        } catch (err: any) {
          if (!err.response) {
            enqueueAction('createCard', { ...cardData, created_by: userId });
            alert("You're offline, but we've saved this task. It'll sync automatically when you reconnect.");
          } else {
            throw err;
          }
        }
      }
      navigate(-1);
    } catch {
      alert("Couldn't save this task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Nav */}
      <div className="nav-bar">
        <button onClick={() => navigate(-1)} style={{ fontSize: 14, color: 'var(--muted)', cursor: 'pointer', padding: 0, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>Cancel</button>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{isEdit ? 'Edit Task' : 'New Task'}</span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ background: 'var(--primary)', border: '2px solid var(--ink)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', opacity: submitting ? 0.5 : 1, boxShadow: '2px 2px 0 var(--ink)', textTransform: 'uppercase', letterSpacing: 0.3 }}
        >
          {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save' : 'Add')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Title */}
        <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--border-soft)', background: 'var(--surface)' }}>
          <textarea
            style={{ width: '100%', fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, minHeight: 60, border: 'none', outline: 'none', resize: 'none', background: 'transparent', boxSizing: 'border-box', letterSpacing: -0.3 }}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!isEdit}
            rows={2}
          />
        </div>

        {/* Timeline */}
        <FormSection label="When">
          <Chips options={TIMELINES} value={timeline} onChange={setTimeline} />
          {timeline === 'custom' && (
            <input type="date" style={{ ...inputStyle, marginTop: 4 }} value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          )}
        </FormSection>

        {/* Assigned to */}
        <FormSection label="Who">
          <Chips options={ASSIGNMENTS} value={assignedTo} onChange={setAssignedTo} />
        </FormSection>

        {/* Tag */}
        <FormSection label="Category">
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {PRESET_TAGS.map((t) => (
              <button
                key={t.name}
                onClick={() => { setTag(tag === t.name ? null : t.name); setShowCustomTagInput(false); }}
                style={{
                  padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 12,
                  border: `2px solid ${tag === t.name ? 'var(--ink)' : 'var(--border-soft)'}`,
                  background: tag === t.name ? 'var(--primary)' : 'var(--surface)',
                  color: tag === t.name ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: 700,
                  boxShadow: tag === t.name ? '2px 2px 0 var(--ink)' : 'none',
                  transition: 'all 0.1s ease',
                }}
              >
                {t.emoji} {t.name}
              </button>
            ))}
            {isCustomTag && (
              <button
                onClick={() => setTag(null)}
                style={{ padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 12, border: '2px solid var(--ink)', background: 'var(--primary)', color: 'var(--ink)', fontWeight: 700, boxShadow: '2px 2px 0 var(--ink)' }}
              >
                🏷️ {tag} ✕
              </button>
            )}
            {!isCustomTag && (
              <button
                onClick={() => { setTag(null); setShowCustomTagInput((v) => !v); }}
                style={{
                  padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 12,
                  border: `2px solid ${showCustomTagInput ? 'var(--ink)' : 'var(--border-soft)'}`,
                  background: showCustomTagInput ? 'var(--primary)' : 'var(--surface)',
                  color: showCustomTagInput ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: 700,
                  boxShadow: showCustomTagInput ? '2px 2px 0 var(--ink)' : 'none',
                }}
              >
                ＋ Custom
              </button>
            )}
          </div>
          {showCustomTagInput && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g. Garden, Car..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCustomTag(); }}
              />
              <button
                onClick={handleConfirmCustomTag}
                disabled={!customTagInput.trim()}
                style={{ background: 'var(--primary)', border: '2px solid var(--ink)', borderRadius: 8, padding: '0 16px', color: 'var(--ink)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: !customTagInput.trim() ? 0.4 : 1, fontFamily: 'var(--font-display)', boxShadow: '2px 2px 0 var(--ink)' }}
              >
                Add
              </button>
            </div>
          )}
        </FormSection>

        {/* Priority */}
        <FormSection label="Priority">
          <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
        </FormSection>

        {/* Recurring */}
        <FormSection label="Recurring">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Recurring task</span>
            <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: isRecurring ? 'var(--primary)' : 'var(--border-soft)',
                borderRadius: 4,
                border: `2px solid ${isRecurring ? 'var(--ink)' : 'var(--border-soft)'}`,
                transition: '0.2s ease',
              }} />
              <span style={{
                position: 'absolute', top: 3, left: isRecurring ? 24 : 3, width: 18, height: 18,
                background: isRecurring ? 'var(--ink)' : '#aaa',
                borderRadius: 2, transition: '0.2s ease',
              }} />
            </label>
          </div>
          {isRecurring && <Chips options={FREQUENCIES} value={recurringFrequency} onChange={setRecurringFrequency} />}
        </FormSection>

        {/* Notes */}
        <FormSection label="Notes (optional)">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', borderRadius: 8 }}
            placeholder="Any extra context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormSection>

        {/* Subtasks — only for new cards */}
        {!isEdit && (
          <FormSection label="Steps (optional)">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1, fontSize: 15 }}
                placeholder="Add a step..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const t = subtaskInput.trim();
                    if (t) { setPendingSubtasks((prev) => [...prev, t]); setSubtaskInput(''); }
                    e.preventDefault();
                  }
                }}
              />
              <button
                onClick={() => {
                  const t = subtaskInput.trim();
                  if (t) { setPendingSubtasks((prev) => [...prev, t]); setSubtaskInput(''); }
                }}
                disabled={!subtaskInput.trim()}
                style={{ background: 'var(--primary)', border: '2px solid var(--ink)', borderRadius: 8, padding: '0 18px', color: 'var(--ink)', fontWeight: 700, fontSize: 20, cursor: 'pointer', opacity: !subtaskInput.trim() ? 0.4 : 1, flexShrink: 0, fontFamily: 'var(--font-display)', boxShadow: '2px 2px 0 var(--ink)' }}
              >
                +
              </button>
            </div>
            {pendingSubtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {pendingSubtasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', border: '2px solid var(--border-soft)' }}>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{t}</span>
                    <button
                      onClick={() => setPendingSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{label}</p>
      {children}
    </div>
  );
}
