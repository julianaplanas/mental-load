import type { UserId } from '@/types';

const USERS: {
  id: UserId;
  name: string;
  emoji: string;
  bg: string;
  shadow: string;
  label: string;
}[] = [
  {
    id: 'juli',
    name: 'Juli',
    emoji: '🌸',
    bg: 'linear-gradient(135deg, #E8709A 0%, #C850A0 100%)',
    shadow: '#A83678',
    label: "I'm Juli",
  },
  {
    id: 'gino',
    name: 'Gino',
    emoji: '🌿',
    bg: 'linear-gradient(135deg, #3EC8B8 0%, #2B9E90 100%)',
    shadow: '#1B7A6E',
    label: "I'm Gino",
  },
];

interface Props {
  onSignIn: (id: UserId) => void;
}

export default function AuthPage({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
    }}>

      {/* Top decorative band */}
      <div style={{
        background: 'linear-gradient(135deg, #7B68EE 0%, #9B72CF 100%)',
        padding: '60px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <p style={{
          fontSize: 72,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: -3,
          margin: 0,
          lineHeight: 1,
          animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          noi
        </p>
        <p style={{
          fontSize: 15,
          fontFamily: 'var(--font-body)',
          color: 'rgba(255,255,255,0.75)',
          margin: 0,
          letterSpacing: 0.5,
          animation: 'fadeIn 0.5s ease 0.2s both',
        }}>
          our shared mental load
        </p>
      </div>

      {/* User selection */}
      <div style={{
        padding: '0 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'fadeIn 0.5s ease 0.25s both',
      }}>
        <p style={{
          fontSize: 20,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color: '#1A1826',
          textAlign: 'center',
          margin: '0 0 4px',
        }}>
          Who are you?
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
              boxShadow: `0 5px 0px ${user.shadow}`,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              animation: `bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.35 + i * 0.12}s both`,
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 0px ${user.shadow}`;
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 5px 0px ${user.shadow}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 5px 0px ${user.shadow}`;
            }}
          >
            <span style={{ fontSize: 36 }}>{user.emoji}</span>
            <span style={{
              fontSize: 24,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 0.2,
            }}>
              {user.label}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        fontSize: 13,
        color: '#C4BFDA',
        lineHeight: 1.6,
        margin: '0 0 40px',
        padding: '0 32px',
        animation: 'fadeIn 0.5s ease 0.6s both',
      }}>
        Your choice is saved on this device.<br />You won't be asked again.
      </p>
    </div>
  );
}
