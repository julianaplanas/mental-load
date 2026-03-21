import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/tasks',     icon: '✓', label: 'Tasks' },
  { path: '/grocery',  icon: '🛒', label: 'Groceries' },
  { path: '/dashboard',icon: '◎',  label: 'Stats' },
];

export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            className={`tab-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="tab-item-icon" style={{
              fontSize: tab.icon === '✓' ? 24 : tab.icon === '◎' ? 20 : 22,
              fontWeight: 800,
            }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 11, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
