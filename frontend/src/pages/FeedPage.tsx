import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCards } from '@/hooks/useCards';
import { useAuth } from '@/hooks/useAuth';
import { requestAndRegister, notificationsSupported, notificationPermission } from '@/lib/notifications';
import CardItem from '@/components/CardItem';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Tasks</h1>
        <button
          onClick={() => navigate('/card/new')}
          style={{
            width: 44, height: 44, borderRadius: 22, background: 'var(--primary)',
            border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            boxShadow: '0 4px 0px #C45A30', fontFamily: 'var(--font-display)', fontWeight: 700,
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0px #C45A30';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          +
        </button>
      </div>

      {/* Notification prompt */}
      {showNotifPrompt && (
        <div style={{ background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>🔔 Enable notifications to stay in sync</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleEnableNotifications} style={{ background: 'var(--primary)', border: 'none', borderRadius: 50, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Enable</button>
            <button onClick={() => setNotifDismissed(true)} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--light-muted)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
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
            <span style={{ fontSize: 48, animation: 'float 3s ease-in-out infinite' }}>🎉</span>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>You're all caught up!</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>No pending tasks. Add one with the + button.</p>
          </div>
        ) : (
          <div>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
