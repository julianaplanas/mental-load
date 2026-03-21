import type { UserId } from '@/types';

const USERS: {
  id: UserId;
  name: string;
  emoji: string;
  bg: string;
  shadow: string;
}[] = [
  {
    id: 'juli',
    name: 'Juli',
    emoji: '🌸',
    bg: '#FF6B8A',
    shadow: '#C0003A',
  },
  {
    id: 'gino',
    name: 'Gino',
    emoji: '🌿',
    bg: '#C8FF00',
    shadow: '#7DB000',
  },
];

interface Props {
  onSignIn: (id: UserId) => void;
}

export default function AuthPage({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F2EC',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Hero */}
      <div style={{
        background: '#0F0F0F',
        padding: '64px 32px 56px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid #0F0F0F',
      }}>
        {/* Lime accent block */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 160, height: 160,
          background: '#C8FF00',
          borderRadius: 12,
          transform: 'rotate(15deg)',
          opacity: 0.15,
        }} />

        <p style={{
          fontSize: 88,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: '#C8FF00',
          letterSpacing: -5,
          margin: 0,
          lineHeight: 0.85,
          animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}>
          noi
        </p>
        <p style={{
          fontSize: 14,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          animation: 'fadeIn 0.5s ease 0.2s both',
          position: 'relative',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          our shared mental load
        </p>
      </div>

      {/* Selector */}
      <div style={{
        flex: 1,
        padding: '40px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: '#0F0F0F',
          margin: '0 0 8px',
          animation: 'fadeIn 0.5s ease 0.25s both',
          letterSpacing: -0.5,
          textTransform: 'uppercase',
        }}>
          Who's here?
        </p>

        {USERS.map((user, i) => (
          <button
            key={user.id}
            onClick={() => onSignIn(user.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '22px 28px',
              borderRadius: 12,
              border: '2px solid #0F0F0F',
              background: user.bg,
              cursor: 'pointer',
              boxShadow: `4px 4px 0px #0F0F0F`,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              animation: `bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.35 + i * 0.12}s both`,
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(4px, 4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0px #0F0F0F';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px #0F0F0F';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px #0F0F0F';
            }}
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(4px, 4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0px #0F0F0F';
            }}
            onTouchEnd={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px #0F0F0F';
            }}
          >
            <span style={{ fontSize: 40 }}>{user.emoji}</span>
            <div>
              <p style={{
                fontSize: 24,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: '#0F0F0F',
                margin: 0,
                lineHeight: 1,
                letterSpacing: -0.5,
              }}>
                I'm {user.name}
              </p>
            </div>
          </button>
        ))}

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--light-muted)',
          lineHeight: 1.7,
          margin: '8px 0 0',
          fontWeight: 600,
          letterSpacing: 0.3,
        }}>
          Saved on this device — you won't be asked again.
        </p>
      </div>
    </div>
  );
}
