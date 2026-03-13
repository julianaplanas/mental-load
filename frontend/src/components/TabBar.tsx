import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/tasks', icon: '📋', label: 'Tasks' },
  { path: '/grocery', icon: '🛒', label: 'Groceries' },
  { path: '/dashboard', icon: '📊', label: 'Stats' },
];

export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.path}
          className={`tab-item ${pathname.startsWith(tab.path) ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-item-icon">{tab.icon}</span>
          <span style={{ fontFamily: 'var(--font-display)' }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
