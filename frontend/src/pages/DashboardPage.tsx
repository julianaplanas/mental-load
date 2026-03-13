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

const PANEL_ACCENTS = ['var(--primary)', 'var(--accent)', 'var(--blue)', 'var(--gino)', 'var(--green)'];

function Panel({ title, children, index = 0 }: { title: string; children: React.ReactNode; index?: number }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 20, padding: 18,
      border: '2px solid var(--border)', borderLeft: `4px solid ${PANEL_ACCENTS[index % PANEL_ACCENTS.length]}`,
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 12,
      animation: `slideInUp 0.35s var(--ease-out) ${index * 0.06}s both`,
    }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</p>
      {children}
    </div>
  );
}

function CategoryBars({ data }: { data: CategoryStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  if (data.length === 0) return <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: 0 }}>No tasks yet — add some!</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((row) => {
        const pct = row.total / maxTotal;
        const donePct = row.total > 0 ? row.done / row.total : 0;
        return (
          <div key={row.tag} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-soft)' }}>{tagEmoji(row.tag)} {row.tag}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--border-soft)', display: 'flex' }}>
                <div style={{ width: `${pct * donePct * 100}%`, background: 'var(--green)', height: '100%', borderRadius: '6px 0 0 6px', transition: 'width 0.5s var(--ease-out)' }} />
                <div style={{ width: `${pct * (1 - donePct) * 100}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.5s var(--ease-out)' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', width: 24, textAlign: 'right', fontFamily: 'var(--font-display)' }}>{row.total}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--light-muted)' }}>{row.done} done · {row.pending} pending</span>
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
        <div style={{ background: 'var(--green-light)', borderRadius: 16, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', margin: 0 }}>
            🎉 {userName} completed {data.completed_this_week} task{data.completed_this_week !== 1 ? 's' : ''} this week!
          </p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--green-light)', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>{data.completed}</span>
          <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✅ completed</span>
        </div>
        <div style={{ flex: 1, background: 'var(--primary-light)', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{data.on_it}</span>
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>💪 on it now</span>
        </div>
      </div>
      {data.completed === 0 && data.on_it === 0 && (
        <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: 0 }}>
          Nothing yet this period — you're all caught up! 🌿
        </p>
      )}
    </div>
  );
}

function TrendBars({ data }: { data: WeekStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const BAR_HEIGHT = 80;
  if (data.every((d) => d.total === 0)) return <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: 0 }}>No tasks in the past 4 weeks.</p>;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {data.map((week) => {
        const barH = (week.total / maxTotal) * BAR_HEIGHT;
        const doneH = week.total > 0 ? (week.done / week.total) * barH : 0;
        const pendingH = barH - doneH;
        return (
          <div key={week.weeks_ago} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', height: 16, fontFamily: 'var(--font-display)' }}>{week.total > 0 ? week.total : ''}</span>
            <div style={{ height: BAR_HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '60%' }}>
              <div style={{ borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                <div style={{ height: doneH, background: 'var(--green)', transition: 'height 0.5s var(--ease-out)' }} />
                <div style={{ height: pendingH, background: 'var(--primary)', transition: 'height 0.5s var(--ease-out)' }} />
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--light-muted)', fontWeight: 600 }}>{weekLabel(week.weeks_ago)}</span>
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
          <div style={{ width: 10, height: 10, borderRadius: 5, background: color }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
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
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Stats</h1>
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 50, padding: 3, alignSelf: 'flex-start' }}>
          {(['month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: '6px 16px', borderRadius: 50, border: 'none', cursor: 'pointer',
                background: period === p ? 'var(--surface)' : 'transparent',
                fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: period === p ? 'var(--text)' : 'var(--muted)',
                boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)',
              }}
            >
              {p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: 0 }}>Nothing due in the next 7 days 🌿</p>
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
                        {card.tag && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{tagEmoji(card.tag)} {card.tag}</p>}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 50 }}>
                        {card.timeline === 'today' ? 'Today' : card.timeline === 'this_week' ? 'This week' : card.custom_date ? new Date(card.custom_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="📈 Activity trend" index={3}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '-6px 0 0' }}>Tasks created per week (past 4 weeks)</p>
              <TrendBars data={trend} />
              <Legend />
            </Panel>

            <Panel title="✅ Recently completed" index={4}>
              {recentCompleted.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--light-muted)', fontStyle: 'italic', margin: 0 }}>No completed tasks yet.</p>
              ) : (
                <div>
                  {recentCompleted.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigate(`/card/${card.id}`)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 0', borderBottom: '1px solid var(--border-soft)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
                    >
                      <span style={{ fontSize: 18 }}>✅</span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{card.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                          Done by {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} · {timeAgo(card.status_updated_at)}
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
