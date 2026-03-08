import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getStatsByCategory,
  getStatsUpcoming,
  getStatsOverdueTrend,
  getStatsFairness,
  getStatsRecentCompleted,
} from '@/lib/api';
import { PRESET_TAGS } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryStat {
  tag: string;
  pending: number;
  done: number;
  total: number;
}

interface UpcomingCard {
  id: string;
  title: string;
  timeline: string;
  custom_date?: string | null;
  assigned_to: string;
  priority: string;
  tag?: string | null;
}

interface WeekStat {
  weeks_ago: number;
  pending: number;
  done: number;
  total: number;
}

interface FairnessStat {
  user_id: string;
  name: string;
  completed: number;
  on_it: number;
}

interface RecentCard {
  id: string;
  title: string;
  tag?: string | null;
  status_user_id: string;
  status_updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tagEmoji(tag: string): string {
  const preset = PRESET_TAGS.find((t) => t.name === tag);
  return preset?.emoji ?? '🏷️';
}

function upcomingDateLabel(card: UpcomingCard): string {
  if (card.timeline === 'today') return 'Today';
  if (card.timeline === 'this_week') return 'This week';
  if (card.timeline === 'custom' && card.custom_date) {
    return new Date(card.custom_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  }
  return '';
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CategoryBars({ data }: { data: CategoryStat[] }) {
  const { width } = useWindowDimensions();
  const barMaxWidth = width - 32 - 32 - 80; // panel margin + padding + label
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  if (data.length === 0) {
    return <Text style={styles.emptyNote}>No tasks yet — add some!</Text>;
  }

  return (
    <View style={styles.catList}>
      {data.map((row) => {
        const fullW = (row.total / maxTotal) * barMaxWidth;
        const doneW = row.total > 0 ? (row.done / row.total) * fullW : 0;
        const pendingW = fullW - doneW;
        return (
          <View key={row.tag} style={styles.catRow}>
            <Text style={styles.catLabel} numberOfLines={1}>
              {tagEmoji(row.tag)} {row.tag}
            </Text>
            <View style={styles.catBarArea}>
              <View style={styles.catBarTrack}>
                <View style={[styles.catBarDone, { width: doneW }]} />
                <View style={[styles.catBarPending, { width: pendingW }]} />
              </View>
              <Text style={styles.catCount}>{row.total}</Text>
            </View>
            <Text style={styles.catBreakdown}>
              {row.done} done · {row.pending} pending
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function FairnessPanel({ data }: { data: FairnessStat[] }) {
  const total = data.reduce((s, d) => s + d.completed, 0);
  const juliShare = total > 0 ? (data.find((d) => d.user_id === 'juli')?.completed ?? 0) / total : 0.5;

  return (
    <View>
      <Text style={styles.fairnessLabel}>How the load has been shared</Text>
      <View style={styles.fairnessCards}>
        {data.map((d) => (
          <View key={d.user_id} style={styles.fairnessCard}>
            <Text style={styles.fairnessName}>{d.name}</Text>
            <Text style={styles.fairnessStat}>
              <Text style={styles.fairnessNum}>{d.completed}</Text>
              {'  '}✅ completed
            </Text>
            <Text style={styles.fairnessStat}>
              <Text style={styles.fairnessNum}>{d.on_it}</Text>
              {'  '}💪 on it now
            </Text>
          </View>
        ))}
      </View>

      {total > 0 && (
        <View style={styles.balanceBarTrack}>
          <View style={[styles.balanceBarJuli, { flex: juliShare }]} />
          <View style={[styles.balanceBarGino, { flex: 1 - juliShare }]} />
        </View>
      )}

      {total > 0 && (
        <View style={styles.balanceLabels}>
          <Text style={styles.balanceLabelLeft}>
            Juli {Math.round(juliShare * 100)}%
          </Text>
          <Text style={styles.balanceLabelRight}>
            {Math.round((1 - juliShare) * 100)}% Gino
          </Text>
        </View>
      )}

      {total === 0 && (
        <Text style={styles.emptyNote}>No completed tasks yet this period.</Text>
      )}
    </View>
  );
}

function TrendBars({ data }: { data: WeekStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const BAR_HEIGHT = 80;

  if (data.every((d) => d.total === 0)) {
    return <Text style={styles.emptyNote}>No tasks in the past 4 weeks.</Text>;
  }

  return (
    <View style={styles.trendContainer}>
      {data.map((week) => {
        const barH = (week.total / maxTotal) * BAR_HEIGHT;
        const doneH = week.total > 0 ? (week.done / week.total) * barH : 0;
        const pendingH = barH - doneH;

        return (
          <View key={week.weeks_ago} style={styles.trendColumn}>
            <Text style={styles.trendValue}>{week.total > 0 ? week.total : ''}</Text>
            <View style={[styles.trendBarWrapper, { height: BAR_HEIGHT }]}>
              <View style={styles.trendBar}>
                <View style={[styles.trendBarPending, { height: pendingH }]} />
                <View style={[styles.trendBarDone, { height: doneH }]} />
              </View>
            </View>
            <Text style={styles.trendLabel}>{weekLabel(week.weeks_ago)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function UpcomingList({
  data,
  onPress,
}: {
  data: UpcomingCard[];
  onPress: (id: string) => void;
}) {
  if (data.length === 0) {
    return <Text style={styles.emptyNote}>Nothing due in the next 7 days 🌿</Text>;
  }
  return (
    <View style={styles.upcomingList}>
      {data.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.upcomingRow}
          onPress={() => onPress(card.id)}
          activeOpacity={0.75}
        >
          <View style={styles.upcomingLeft}>
            <Text style={styles.upcomingTitle} numberOfLines={1}>
              {card.title}
            </Text>
            {card.tag && (
              <Text style={styles.upcomingTag}>
                {tagEmoji(card.tag)} {card.tag}
              </Text>
            )}
          </View>
          <Text style={styles.upcomingDate}>{upcomingDateLabel(card)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RecentList({ data, onPress }: { data: RecentCard[]; onPress: (id: string) => void }) {
  if (data.length === 0) {
    return <Text style={styles.emptyNote}>No completed tasks yet.</Text>;
  }
  return (
    <View style={styles.recentList}>
      {data.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.recentRow}
          onPress={() => onPress(card.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.recentEmoji}>✅</Text>
          <View style={styles.recentInfo}>
            <Text style={styles.recentTitle} numberOfLines={1}>
              {card.title}
            </Text>
            <Text style={styles.recentMeta}>
              Done by {card.status_user_id === 'juli' ? 'Juli' : 'Gino'} ·{' '}
              {timeAgo(card.status_updated_at)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Period = 'month' | 'all';

export default function DashboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [fairnessStats, setFairnessStats] = useState<FairnessStat[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingCard[]>([]);
  const [trend, setTrend] = useState<WeekStat[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<RecentCard[]>([]);

  const fetchAll = useCallback(async (p: Period, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [catRes, fairRes, upRes, trendRes, recentRes] = await Promise.all([
        getStatsByCategory(p),
        getStatsFairness(p),
        getStatsUpcoming(),
        getStatsOverdueTrend(),
        getStatsRecentCompleted(),
      ]);
      setCategoryStats(catRes.data);
      setFairnessStats(fairRes.data);
      setUpcoming(upRes.data);
      setTrend(trendRes.data);
      setRecentCompleted(recentRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(period);
  }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    fetchAll(p, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll(period, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <View style={styles.toggle}>
          {(['month', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
              onPress={() => handlePeriodChange(p)}
            >
              <Text style={[styles.toggleLabel, period === p && styles.toggleLabelActive]}>
                {p === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4845A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScrollBeginDrag={() => {}}
          refreshing={refreshing}
          onStartShouldSetResponder={() => false}
        >
          {/* Tasks by Category */}
          <Panel title="📊 Tasks by Category">
            <CategoryBars data={categoryStats} />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#5A9E8A' }]} />
                <Text style={styles.legendLabel}>Done</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F4945A' }]} />
                <Text style={styles.legendLabel}>Pending</Text>
              </View>
            </View>
          </Panel>

          {/* Fairness */}
          <Panel title="⚖️ Fairness Overview">
            <FairnessPanel data={fairnessStats} />
          </Panel>

          {/* Upcoming */}
          <Panel title="📅 Upcoming — next 7 days">
            <UpcomingList data={upcoming} onPress={(id) => router.push(`/card/${id}`)} />
          </Panel>

          {/* Weekly Trend */}
          <Panel title="📈 Activity trend">
            <Text style={styles.trendSubtitle}>Tasks created per week (past 4 weeks)</Text>
            <TrendBars data={trend} />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#5A9E8A' }]} />
                <Text style={styles.legendLabel}>Done</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F4945A' }]} />
                <Text style={styles.legendLabel}>Pending</Text>
              </View>
            </View>
          </Panel>

          {/* Recently Completed */}
          <Panel title="✅ Recently completed">
            <RecentList
              data={recentCompleted}
              onPress={(id) => router.push(`/card/${id}`)}
            />
          </Panel>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EE' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5DA',
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#2C2C2C' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#EDE5DA',
    borderRadius: 10,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: '#8A7F77' },
  toggleLabelActive: { color: '#2C2C2C' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // Panel
  panel: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDE5DA',
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  panelTitle: { fontSize: 15, fontWeight: '700', color: '#2C2C2C' },
  emptyNote: { fontSize: 14, color: '#B0A8A0', fontStyle: 'italic' },

  // Category bars
  catList: { gap: 10 },
  catRow: { gap: 4 },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#5C4A38' },
  catBarArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBarTrack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', flex: 1 },
  catBarDone: { backgroundColor: '#5A9E8A', height: '100%' },
  catBarPending: { backgroundColor: '#F4945A', height: '100%' },
  catCount: { fontSize: 12, fontWeight: '700', color: '#2C2C2C', width: 24, textAlign: 'right' },
  catBreakdown: { fontSize: 11, color: '#B0A8A0' },

  // Legend
  legend: { flexDirection: 'row', gap: 14, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: '#8A7F77' },

  // Fairness
  fairnessLabel: { fontSize: 13, color: '#8A7F77', fontStyle: 'italic', marginBottom: 10 },
  fairnessCards: { flexDirection: 'row', gap: 10 },
  fairnessCard: {
    flex: 1,
    backgroundColor: '#FDF6EE',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDE5DA',
  },
  fairnessName: { fontSize: 16, fontWeight: '700', color: '#2C2C2C' },
  fairnessStat: { fontSize: 13, color: '#5C4A38' },
  fairnessNum: { fontWeight: '700', fontSize: 16, color: '#D4845A' },
  balanceBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  balanceBarJuli: { backgroundColor: '#D4845A' },
  balanceBarGino: { backgroundColor: '#5A9E8A' },
  balanceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceLabelLeft: { fontSize: 11, color: '#D4845A', fontWeight: '600' },
  balanceLabelRight: { fontSize: 11, color: '#5A9E8A', fontWeight: '600' },

  // Trend chart
  trendSubtitle: { fontSize: 12, color: '#8A7F77', marginTop: -6 },
  trendContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  trendColumn: { flex: 1, alignItems: 'center', gap: 4 },
  trendValue: { fontSize: 12, fontWeight: '600', color: '#2C2C2C', height: 16 },
  trendBarWrapper: { justifyContent: 'flex-end', width: '60%' },
  trendBar: { width: '100%', borderRadius: 4, overflow: 'hidden', flexDirection: 'column-reverse' },
  trendBarDone: { backgroundColor: '#5A9E8A' },
  trendBarPending: { backgroundColor: '#F4945A' },
  trendLabel: { fontSize: 11, color: '#B0A8A0', textAlign: 'center' },

  // Upcoming
  upcomingList: { gap: 2 },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
    gap: 8,
  },
  upcomingLeft: { flex: 1, gap: 2 },
  upcomingTitle: { fontSize: 14, fontWeight: '600', color: '#2C2C2C' },
  upcomingTag: { fontSize: 12, color: '#8A7F77' },
  upcomingDate: { fontSize: 12, color: '#D4845A', fontWeight: '600' },

  // Recent
  recentList: { gap: 2 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
    gap: 12,
  },
  recentEmoji: { fontSize: 18 },
  recentInfo: { flex: 1, gap: 2 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#2C2C2C' },
  recentMeta: { fontSize: 12, color: '#8A7F77' },
});
