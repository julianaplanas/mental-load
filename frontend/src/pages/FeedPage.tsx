import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards } from '@/hooks/useCards';
import { useAuth } from '@/hooks/useAuth';
import { requestAndRegister, notificationsSupported, notificationPermission } from '@/lib/notifications';
import CardItem from '@/components/CardItem';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function greeting(userId: string | null): string {
  const name = userId === 'juli' ? 'Juli' : userId === 'gino' ? 'Gino' : '';
  const h = new Date().getHours();
  if (h < 12) return `Good morning${name ? `, ${name}` : ''} ☀️`;
  if (h < 18) return `Hey${name ? ` ${name}` : ''} 👋`;
  return `Good evening${name ? `, ${name}` : ''} 🌙`;
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
        padding: '20px 20px 16px',
        flexShrink: 0,
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted)',
              margin: '0 0 2px',
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              {todayLabel()}
            </p>
            <h1 style={{
              fontSize: 26,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.1,
            }}>
              {greeting(userId)}
            </h1>
          </div>
          <button
            onClick={() => navigate('/card/new')}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
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
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              flexShrink: 0,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0px rgba(90,72,200,0.35)';
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
            background: 'linear-gradient(135deg, #F06565, #E8399A)',
            borderRadius: 16,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {urgentCount} urgent task{urgentCount > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}
      </div>

      {/* Notification prompt */}
      {showNotifPrompt && (
        <div style={{
          background: 'var(--primary-light)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>🔔 Enable notifications to stay in sync</span>
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
                fontFamily: 'var(--font-display)',
              }}
            >
              Enable
            </button>
            <button
              onClick={() => setNotifDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                color: 'var(--light-muted)',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        {refreshing && (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--light-muted)' }}>
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
            <span style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>🎉</span>
            <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              All caught up!
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
              No pending tasks. Add one with the + button.
            </p>
          </div>
        ) : (
          <div style={{ paddingBottom: 8 }}>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
