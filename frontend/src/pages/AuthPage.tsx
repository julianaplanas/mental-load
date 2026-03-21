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
    bg: 'linear-gradient(135deg, #D4849A 0%, #C06080 100%)',
    shadow: '#A04060',
  },
  {
    id: 'gino',
    name: 'Gino',
    emoji: '🌿',
    bg: 'linear-gradient(135deg, #82B09A 0%, #5A9080 100%)',
    shadow: '#3A7060',
  },
];

interface Props {
  onSignIn: (id: UserId) => void;
}

export default function AuthPage({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #8B8FD4 0%, #A882C8 55%, #D4849A 100%)',
        padding: '72px 36px 56px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blob */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180,
          background: 'rgba(255,255,255,0.10)',
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, right: 40,
          width: 100, height: 100,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%',
        }} />

        <p style={{
          fontSize: 76,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#fff',
          letterSpacing: -3,
          margin: 0,
          lineHeight: 0.9,
          animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}>
          noi
        </p>
        <p style={{
          fontSize: 16,
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.80)',
          margin: 0,
          animation: 'fadeIn 0.5s ease 0.2s both',
          position: 'relative',
          fontWeight: 300,
        }}>
          our shared mental load
        </p>
      </div>

      {/* Selector */}
      <div style={{
        flex: 1,
        padding: '40px 28px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 600,
          fontStyle: 'italic',
          color: 'var(--text)',
          margin: '0 0 10px',
          animation: 'fadeIn 0.5s ease 0.25s both',
          lineHeight: 1.2,
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
              gap: 18,
              padding: '22px 28px',
              borderRadius: 22,
              border: 'none',
              background: user.bg,
              cursor: 'pointer',
              boxShadow: `0 6px 0px ${user.shadow}`,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              animation: `bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.35 + i * 0.12}s both`,
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(5px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 0px ${user.shadow}`;
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 0px ${user.shadow}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 0px ${user.shadow}`;
            }}
          >
            <span style={{ fontSize: 36 }}>{user.emoji}</span>
            <div>
              <p style={{
                fontSize: 22,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontStyle: 'italic',
                color: '#fff',
                margin: 0,
                lineHeight: 1,
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
          margin: '16px 0 0',
          fontStyle: 'italic',
          animation: 'fadeIn 0.5s ease 0.6s both',
        }}>
          Saved on this device — you won't be asked again.
        </p>
      </div>
    </div>
  );
}
