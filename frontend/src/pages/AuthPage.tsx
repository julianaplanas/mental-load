import type { UserId } from '@/types';

const USERS: { id: UserId; name: string; emoji: string; color: string; shadow: string; bg: string }[] = [
  { id: 'juli', name: 'Juli', emoji: '🌸', color: '#E06B8F', shadow: '#B8506F', bg: 'linear-gradient(135deg, #E06B8F 0%, #E8734A 100%)' },
  { id: 'gino', name: 'Gino', emoji: '🌿', color: '#3EB5A0', shadow: '#2E8A79', bg: 'linear-gradient(135deg, #3EB5A0 0%, #5B9BD5 100%)' },
];

interface Props {
  onSignIn: (id: UserId) => void;
}

export default function AuthPage({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)', display: 'flex',
      flexDirection: 'column', justifyContent: 'space-between',
      padding: '60px 32px', boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <p style={{
          fontSize: 64, fontFamily: 'var(--font-display)', fontWeight: 700,
          background: 'linear-gradient(135deg, #E8734A, #9B72CF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: -2, margin: 0,
        }}>
          noi
        </p>
        <p style={{ fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--muted)', marginTop: 6, letterSpacing: 0.5 }}>
          our shared mental load
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{
          fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600,
          color: 'var(--text)', textAlign: 'center', margin: '0 0 8px',
          animation: 'fadeIn 0.5s ease 0.2s both',
        }}>
          Who are you?
        </p>
        {USERS.map((user, i) => (
          <button
            key={user.id}
            onClick={() => onSignIn(user.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '22px 28px',
              borderRadius: 24,
              border: 'none',
              background: user.bg,
              cursor: 'pointer',
              boxShadow: `0 5px 0px ${user.shadow}`,
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              animation: `bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.3 + i * 0.12}s both`,
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 0px ${user.shadow}`;
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
            <span style={{ fontSize: 32 }}>{user.emoji}</span>
            <span style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
              I'm {user.name}
            </span>
          </button>
        ))}
      </div>

      <p style={{
        textAlign: 'center', fontSize: 13, color: 'var(--light-muted)', lineHeight: 1.6, margin: 0,
        animation: 'fadeIn 0.5s ease 0.5s both',
      }}>
        Your choice is saved on this device.<br />You won't be asked again.
      </p>
    </div>
  );
}
