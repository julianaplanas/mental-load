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
  if (h < 12) return `Morning, ${name}`;
  if (h < 18) return `Hey, ${name}`;
  return `Evening, ${name}`;
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
      <div style={{
        padding: '24px 20px 16px',
        flexShrink: 0,
        borderBottom: '2px solid var(--ink)',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: 1.5,
              margin: '0 0 4px',
              textTransform: 'uppercase',
            }}>
              {dateLabel()}
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 32,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}>
              {greetingLine(userId)}{' '}
              <span>{greetingEmoji(userId)}</span>
            </h1>
          </div>

          <button
            onClick={() => navigate('/card/new')}
            style={{
              width: 48, height: 48,
              borderRadius: 10,
              background: 'var(--primary)',
              border: '2px solid var(--ink)',
              color: 'var(--ink)',
              fontSize: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: 'var(--shadow-btn)',
              fontWeight: 700,
              flexShrink: 0,
              marginLeft: 12,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(3px, 3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-btn)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-btn)';
            }}
          >
            +
          </button>
        </div>

        {/* Urgent banner */}
        {urgentCount > 0 && !loading && (
          <div style={{
            marginTop: 14,
            background: '#FF3D3D',
            borderRadius: 10,
            border: '2px solid var(--ink)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'var(--shadow-btn)',
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {urgentCount} urgent task{urgentCount > 1 ? 's' : ''} need attention
            </p>
          </div>
        )}
      </div>

      {/* Notification prompt */}
      {showNotifPrompt && (
        <div style={{
          background: 'var(--ink)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.3 }}>
            🔔 Enable notifications to stay in sync
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleEnableNotifications}
              style={{
                background: 'var(--primary)',
                border: '1.5px solid #0F0F0F',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: '#0F0F0F',
                cursor: 'pointer',
                boxShadow: '2px 2px 0 #0F0F0F',
              }}
            >
              Enable
            </button>
            <button
              onClick={() => setNotifDismissed(true)}
              style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {refreshing && (
          <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
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
            <p style={{ fontSize: 15, color: 'var(--muted)', margin: 0, fontWeight: 600 }}>{error}</p>
            <button onClick={refresh} className="btn-primary">Try again</button>
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 52, animation: 'float 3s ease-in-out infinite' }}>🎉</span>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: -0.5,
            }}>
              All caught up!
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, fontWeight: 600 }}>
              No pending tasks. Add one with the + button.
            </p>
          </div>
        ) : (
          <div style={{ paddingBottom: 12, paddingTop: 6 }}>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
