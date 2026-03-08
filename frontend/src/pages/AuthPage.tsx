import type { UserId } from '@/types';

const USERS: { id: UserId; name: string; emoji: string; color: string }[] = [
  { id: 'juli', name: 'Juli', emoji: '🌸', color: '#D4845A' },
  { id: 'gino', name: 'Gino', emoji: '🌿', color: '#5A9E8A' },
];

interface Props {
  onSignIn: (id: UserId) => void;
}

export default function AuthPage({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#FDF6EE', display: 'flex',
      flexDirection: 'column', justifyContent: 'space-between',
      padding: '60px 32px', boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 56, fontWeight: 700, color: '#2C2C2C', letterSpacing: -2, margin: 0 }}>noi</p>
        <p style={{ fontSize: 16, color: '#8A7F77', marginTop: 6, letterSpacing: 0.5 }}>our shared mental load</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 22, fontWeight: 600, color: '#2C2C2C', textAlign: 'center', margin: '0 0 8px' }}>
          Who are you?
        </p>
        {USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => onSignIn(user.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '22px 28px', borderRadius: 20, border: 'none',
              background: user.color, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: 32 }}>{user.emoji}</span>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#fff' }}>I'm {user.name}</span>
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#B0A8A0', lineHeight: 1.6, margin: 0 }}>
        Your choice is saved on this device.<br />You won't be asked again.
      </p>
    </div>
  );
}
