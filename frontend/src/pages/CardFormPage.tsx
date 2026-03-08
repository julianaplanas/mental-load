import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCard, getCard, updateCard } from '@/lib/api';
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
  { value: 'juli', label: 'Juli' },
  { value: 'gino', label: 'Gino' },
  { value: 'together', label: 'Together' },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'normal', label: '⚪ Normal' },
  { value: 'low', label: '🟢 Low' },
];

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

function Chips<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
            border: `1.5px solid ${value === opt.value ? '#D4845A' : '#EDE5DA'}`,
            background: value === opt.value ? '#FDF0E8' : '#fff',
            color: value === opt.value ? '#D4845A' : '#8A7F77',
            fontWeight: value === opt.value ? 600 : 500,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #EDE5DA', borderRadius: 12, padding: 12,
  fontSize: 15, color: '#2C2C2C', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
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
          await createCard({ ...cardData, created_by: userId });
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
        <div style={{ width: 32, height: 32, border: '3px solid #EDE5DA', borderTopColor: '#D4845A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Nav */}
      <div className="nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 16, color: '#8A7F77', cursor: 'pointer', padding: 0 }}>Cancel</button>
        <span style={{ fontSize: 17, fontWeight: 600, color: '#2C2C2C' }}>{isEdit ? 'Edit Task' : 'New Task'}</span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ background: '#D4845A', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}
        >
          {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save' : 'Add Task')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Title */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDE5DA' }}>
          <textarea
            style={{ width: '100%', fontSize: 22, fontWeight: 600, color: '#2C2C2C', lineHeight: 1.35, minHeight: 60, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
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
                  padding: '8px 12px', borderRadius: 10, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13,
                  border: `1.5px solid ${tag === t.name ? '#D4845A' : '#EDE5DA'}`,
                  background: tag === t.name ? '#FDF0E8' : '#fff',
                  color: tag === t.name ? '#D4845A' : '#8A7F77',
                  fontWeight: tag === t.name ? 600 : 500,
                }}
              >
                {t.emoji} {t.name}
              </button>
            ))}
            {isCustomTag && (
              <button
                onClick={() => setTag(null)}
                style={{ padding: '8px 12px', borderRadius: 10, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13, border: '1.5px solid #D4845A', background: '#FDF0E8', color: '#D4845A', fontWeight: 600 }}
              >
                🏷️ {tag} ✕
              </button>
            )}
            {!isCustomTag && (
              <button
                onClick={() => { setTag(null); setShowCustomTagInput((v) => !v); }}
                style={{
                  padding: '8px 12px', borderRadius: 10, whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13,
                  border: `1.5px solid ${showCustomTagInput ? '#D4845A' : '#EDE5DA'}`,
                  background: showCustomTagInput ? '#FDF0E8' : '#fff',
                  color: showCustomTagInput ? '#D4845A' : '#8A7F77',
                  fontWeight: showCustomTagInput ? 600 : 500,
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
                style={{ ...inputStyle, flex: 1, border: '1.5px solid #D4845A' }}
                placeholder="e.g. Garden, Car..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmCustomTag(); }}
              />
              <button
                onClick={handleConfirmCustomTag}
                disabled={!customTagInput.trim()}
                style={{ background: '#D4845A', border: 'none', borderRadius: 10, padding: '0 16px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: !customTagInput.trim() ? 0.4 : 1 }}
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
            <span style={{ fontSize: 15, color: '#2C2C2C' }}>Recurring task</span>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: isRecurring ? '#D4845A' : '#EDE5DA', borderRadius: 12, transition: '0.2s',
              }} />
              <span style={{
                position: 'absolute', top: 2, left: isRecurring ? 22 : 2, width: 20, height: 20,
                background: '#fff', borderRadius: 10, transition: '0.2s',
              }} />
            </label>
          </div>
          {isRecurring && <Chips options={FREQUENCIES} value={recurringFrequency} onChange={setRecurringFrequency} />}
        </FormSection>

        {/* Notes */}
        <FormSection label="Notes (optional)">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            placeholder="Any extra context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormSection>

        <div style={{ height: 40 }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDE5DA', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#8A7F77', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>{label}</p>
      {children}
    </div>
  );
}
