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
          >
            <span className="tab-item-icon" style={{
              fontSize: tab.icon === '✓' ? 22 : tab.icon === '◎' ? 18 : 20,
              fontWeight: 900,
            }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
