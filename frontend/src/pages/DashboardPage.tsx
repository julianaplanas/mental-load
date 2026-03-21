import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStatsByCategory, getStatsUpcoming, getStatsOverdueTrend,
  getStatsRecentCompleted, getStatsPersonal,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PRESET_TAGS } from '@/types';

interface CategoryStat { tag: string; pending: number; done: number; total: number; }
interface UpcomingCard { id: string; title: string; timeline: string; custom_date?: string | null; assigned_to: string; priority: string; tag?: string | null; }
interface WeekStat { weeks_ago: number; pending: number; done: number; total: number; }
interface PersonalStat { completed: number; on_it: number; completed_this_week: number; }
interface RecentCard { id: string; title: string; tag?: string | null; status_user_id: string; status_updated_at: string; }

type Period = 'month' | 'all';

function tagEmoji(tag: string): string {
  return PRESET_TAGS.find((t) => t.name === tag)?.emoji ?? '🏷️';
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function weekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'Now';
  if (weeksAgo === 1) return '1 wk';
  return `${weeksAgo} wks`;
}

const PANEL_COLORS = ['#C8FF00', '#FFB800', '#4D8FFF', '#FF6B8A', '#4DBFA0'];

function Panel({ title, children, index = 0 }: { title: string; children: React.ReactNode; index?: number }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 10,
      padding: 18,
      border: '2px solid var(--ink)',
      borderTop: `4px solid ${PANEL_COLORS[index % PANEL_COLORS.length]}`,
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 14,
      animation: `slideInUp 0.35s var(--ease-out) ${index * 0.06}s both`,
    }}>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</p>
      {children}
    </div>
  );
}

function CategoryBars({ data }: { data: CategoryStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  if (data.length === 0) return <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: 0 }}>No tasks yet — add some!</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((row) => {
        const pct = row.total / maxTotal;
        const donePct = row.total > 0 ? row.done / row.total : 0;
        return (
          <div key={row.tag} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tagEmoji(row.tag)} {row.tag}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 10, borderRadius: 3, overflow: 'hidden', background: 'var(--border-soft)', display: 'flex', border: '1.5px solid var(--ink)' }}>
                <div style={{ width: `${pct * donePct * 100}%`, background: 'var(--green)', height: '100%', transition: 'width 0.5s var(--ease-out)' }} />
                <div style={{ width: `${pct * (1 - donePct) * 100}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.5s var(--ease-out)' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', width: 22, textAlign: 'right' }}>{row.total}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{row.done} done · {row.pending} pending</span>
          </div>
        );
      })}
    </div>
  );
}

function PersonalAccomplishments({ data, userName }: { data: PersonalStat; userName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.completed_this_week > 0 && (
        <div style={{ background: 'var(--primary)', borderRadius: 8, padding: 14, border: '2px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🎉 {userName} completed {data.completed_this_week} task{data.completed_this_week !== 1 ? 's' : ''} this week!
          </p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--green-light)', borderRadius: 8, padding: 14, border: '2px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{data.completed}</span>
          <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>✅ completed</span>
        </div>
        <div style={{ flex: 1, background: 'var(--primary-light)', borderRadius: 8, padding: 14, border: '2px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{data.on_it}</span>
          <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>💪 on it now</span>
        </div>
      </div>
      {data.completed === 0 && data.on_it === 0 && (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: 0 }}>
          Nothing yet this period — you're all caught up! 🌿
        </p>
      )}
    </div>
  );
}

function TrendBars({ data }: { data: WeekStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const BAR_HEIGHT = 80;
  if (data.every((d) => d.total === 0)) return <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: 0 }}>No tasks in the past 4 weeks.</p>;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {data.map((week) => {
        const barH = (week.total / maxTotal) * BAR_HEIGHT;
        const doneH = week.total > 0 ? (week.done / week.total) * barH : 0;
        const pendingH = barH - doneH;
        return (
          <div key={week.weeks_ago} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', height: 16 }}>{week.total > 0 ? week.total : ''}</span>
            <div style={{ height: BAR_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '60%' }}>
              <div style={{ border: '2px solid var(--ink)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', boxShadow: '2px 2px 0 var(--ink)' }}>
                <div style={{ height: doneH, background: 'var(--green)', transition: 'height 0.5s var(--ease-out)' }} />
                <div style={{ height: pendingH, background: 'var(--primary)', transition: 'height 0.5s var(--ease-out)' }} />
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{weekLabel(week.weeks_ago)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
      {[{ color: 'var(--green)', label: 'Done' }, { color: 'var(--primary)', label: 'Pending' }].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, border: '1.5px solid var(--ink)' }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStat>({ completed: 0, on_it: 0, completed_this_week: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingCard[]>([]);
  const [trend, setTrend] = useState<WeekStat[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<RecentCard[]>([]);

  const fetchAll = useCallback(async (p: Period, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [catRes, personalRes, upRes, trendRes, recentRes] = await Promise.all([
        getStatsByCategory(p), getStatsPersonal(userId!, p), getStatsUpcoming(), getStatsOverdueTrend(), getStatsRecentCompleted(),
      ]);
      setCategoryStats(catRes.data);
      setPersonalStats(personalRes.data);
      setUpcoming(upRes.data);
      setTrend(trendRes.data);
      setRecentCompleted(recentRes.data);
    } catch { /* silently fail */ } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(period); }, []);

  const handlePeriodChange = (p: Period) => { setPeriod(p); fetchAll(p, true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '2px solid var(--ink)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: -0.5 }}>Stats</h1>
        <div style={{ display: 'flex', background: 'var(--ink)', borderRadius: 8, padding: 3, alignSelf: 'flex-start' }}>
          {(['month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: period === p ? 'var(--primary)' : 'transparent',
                fontSize: 12, fontWeight: 700,
                color: period === p ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <Panel title="📊 Tasks by Category" index={0}>
              <CategoryBars data={categoryStats} />
              <Legend />
            </Panel>

            <Panel title="⭐ Your Accomplishments" index={1}>
              <PersonalAccomplishments data={personalStats} userName={userId === 'juli' ? 'Juli' : 'Gino'} />
            </Panel>

            <Panel title="📅 Upcoming — next 7 days" index={2}>
              {upcoming.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: 0 }}>Nothing due in the next 7 days 🌿</p>
              ) : (
                <div>
                  {upcoming.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigate(`/card/${card.id}`)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 0', borderBottom: '1px solid var(--border-soft)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 8 }}
                    >
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{card.title}</p>
                        {card.tag && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontWeight: 600 }}>{tagEmoji(card.tag)} {card.tag}</p>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap', background: 'var(--primary)', padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--ink)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        {card.timeline === 'today' ? 'Today' : card.timeline === 'this_week' ? 'This week' : card.custom_date ? new Date(card.custom_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="📈 Activity trend" index={3}>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '-6px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tasks created per week (past 4 weeks)</p>
              <TrendBars data={trend} />
              <Legend />
            </Panel>

            <Panel title="✅ Recently completed" index={4}>
              {recentCompleted.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, margin: 0 }}>No completed tasks yet.</p>
              ) : (
                <div>
                  {recentCompleted.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigate(`/card/${card.id}`)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 0', borderBottom: '1px solid var(--border-soft)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--green)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>✓</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{card.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                          {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} · {timeAgo(card.status_updated_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <div style={{ height: 8 }} />
          </>
        )}
      </div>
    </div>
  );
}
