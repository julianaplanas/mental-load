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
        padding: '16px 20px 12px', borderBottom: '1px solid #EDE5DA', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>Tasks</h1>
        <button
          onClick={() => navigate('/card/new')}
          style={{
            width: 40, height: 40, borderRadius: 20, background: '#D4845A',
            border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Notification prompt */}
      {showNotifPrompt && (
        <div style={{ background: '#FDF0E8', borderBottom: '1px solid #EDE5DA', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: '#5C4A38' }}>🔔 Enable notifications to stay in sync</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleEnableNotifications} style={{ background: '#D4845A', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Enable</button>
            <button onClick={() => setNotifDismissed(true)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#B0A8A0', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {refreshing && (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: '#B0A8A0' }}>
            Refreshing...
          </div>
        )}

        {loading && !refreshing ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div style={{
              width: 32, height: 32, border: '3px solid #EDE5DA',
              borderTopColor: '#D4845A', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 40 }}>😕</span>
            <p style={{ fontSize: 15, color: '#8A7F77', margin: 0 }}>{error}</p>
            <button onClick={refresh} className="btn-primary">Try again</button>
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 48 }}>🎉</span>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#2C2C2C', margin: 0 }}>You're all caught up!</p>
            <p style={{ fontSize: 14, color: '#8A7F77', margin: 0 }}>No pending tasks. Add one with the + button.</p>
          </div>
        ) : (
          <div>
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
