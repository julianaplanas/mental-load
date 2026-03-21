import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards } from '@/hooks/useCards';
import { useAuth } from '@/hooks/useAuth';
import { requestAndRegister, notificationsSupported, notificationPermission } from '@/lib/notifications';
import CardItem from '@/components/CardItem';

function dateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase();
}

function greetingLine(userId: string | null): string {
  const name = userId === 'juli' ? 'Juli' : userId === 'gino' ? 'Gino' : '';
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 18) return `Hey, ${name}`;
  return `Good evening, ${name}`;
}

function greetingEmoji(userId: string | null): string {
  const h = new Date().getHours();
  if (userId === 'juli') return h < 18 ? '🌸' : '🌙';
  if (userId === 'gino') return h < 18 ? '🌿' : '🌙';
  return '✨';
}

export default function FeedPage() {
  const { cards, loading, refreshing, error, refresh } = useCards();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [notifDismissed, setNotifDismissed] = useState(false);
  const showNotifPrompt = notificationsSupported() && notificationPermission() === 'default' && !notifDismissed;

  const handleEnableNotifications = async () => {
    await requestAndRegister(userId!);
    setNotifDismissed(true);
  };

  const urgentCount = cards.filter((c) => c.priority === 'urgent' && c.status !== 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--light-muted)',
              letterSpacing: 1.2,
              margin: '0 0 4px',
              fontFamily: 'var(--font-body)',
            }}>
              {dateLabel()}
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 30,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}>
              {greetingLine(userId)}{' '}
              <span style={{ fontStyle: 'normal' }}>{greetingEmoji(userId)}</span>
            </h1>
          </div>

          <button
            onClick={() => navigate('/card/new')}
            style={{
              width: 48, height: 48,
              borderRadius: 24,
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              fontSize: 26,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: 'var(--shadow-btn)',
              fontWeight: 700,
              flexShrink: 0,
              marginLeft: 12,
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            +
          </button>
        </div>

        {/* Urgent banner */}
        {urgentCount > 0 && !loading && (
          <div style={{
            marginTop: 16,
            background: 'linear-gradient(135deg, #E07070, #C85080)',
            borderRadius: 18,
            padding: '13px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                {urgentCount} urgent task{urgentCount > 1 ? 's' : ''} need attention
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notification prompt */}
      {showNotifPrompt && (
        <div style={{
          background: 'var(--primary-light)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
          marginBottom: 2,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-soft)', fontStyle: 'italic' }}>
            🔔 Enable notifications to stay in sync
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleEnableNotifications}
              style={{
                background: 'var(--primary)',
                border: 'none',
                borderRadius: 50,
                padding: '5px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Enable
            </button>
            <button
              onClick={() => setNotifDismissed(true)}
              style={{ fontSize: 18, color: 'var(--light-muted)', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {refreshing && (
          <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 12, color: 'var(--light-muted)', fontStyle: 'italic' }}>
            Refreshing...
          </div>
        )}

        {loading && !refreshing ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 40, animation: 'float 3s ease-in-out infinite' }}>😕</span>
            <p style={{ fontSize: 15, color: 'var(--muted)', margin: 0 }}>{error}</p>
            <button onClick={refresh} className="btn-primary">Try again</button>
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 52, animation: 'float 3s ease-in-out infinite' }}>🎉</span>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 26,
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}>
              All caught up!
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
              No pending tasks. Add one with the + button.
            </p>
          </div>
        ) : (
          <div style={{ paddingBottom: 12 }}>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
