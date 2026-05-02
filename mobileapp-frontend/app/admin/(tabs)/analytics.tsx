import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { TrendingUp, Users, Star, Globe, BarChart2, UserCheck } from 'lucide-react-native';
import {
  getAnalyticsOverview, getTopArtisans,
  getTouristDemographics, getWorkshopPopularity, getActivityChart,
} from '../../../src/api/adminApi';

// ── Simple horizontal bar chart using View ──────────────────────────────────
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2;
  return (
    <View style={hb.track}>
      <View style={[hb.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const hb = StyleSheet.create({
  track: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});

// ── Vertical mini bar chart ─────────────────────────────────────────────────
function MiniBarChart({ data, color = '#2F5D50' }: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={mb.container}>
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, 4);
        return (
          <View key={i} style={mb.barCol}>
            <Text style={mb.barVal}>{d.value}</Text>
            <View style={mb.barTrack}>
              <View style={[mb.barFill, { height: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={mb.barLabel} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const mb = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barVal: { fontSize: 9, color: '#6B7280', fontWeight: '600', marginBottom: 3 },
  barTrack: { width: '80%', height: '70%', justifyContent: 'flex-end', backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 8, color: '#9CA3AF', marginTop: 4, textAlign: 'center', width: '100%' },
});

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: {
  label: string; value: string | number; color: string; icon: React.ReactNode;
}) {
  return (
    <View style={[sc.card, { borderTopColor: color }]}>
      <View style={[sc.icon, { backgroundColor: color + '18' }]}>{icon}</View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '900', color: '#1E1E1E' },
  label: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
});

const PERIOD_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
] as const;

export default function AnalyticsScreen() {
  const [overview, setOverview] = useState<any>(null);
  const [topArtisans, setTopArtisans] = useState<any[]>([]);
  const [workshopPop, setWorkshopPop] = useState<any[]>([]);
  const [touristCountries, setTouristCountries] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [overviewRes, topRes, popRes, demoRes, actRes] = await Promise.all([
        getAnalyticsOverview().catch(() => null),
        getTopArtisans().catch(() => null),
        getWorkshopPopularity().catch(() => null),
        getTouristDemographics().catch(() => null),
        getActivityChart(period).catch(() => null),
      ]);

      if (overviewRes?.data?.data) setOverview(overviewRes.data.data);

      setTopArtisans((topRes?.data?.data || []).slice(0, 5).map((a: any) => ({
        name: a.fullName || a.businessName,
        craft: a.craftType,
        rating: (a.rating || 0).toFixed(1),
        bookings: a.workshopsConducted || 0,
        initials: (a.fullName || 'A').split(' ').map((n: any) => n[0]).join('').slice(0, 2),
      })));

      setWorkshopPop((popRes?.data?.data || []).slice(0, 6).map((p: any) => ({
        name: p.name, bookings: p.bookings,
      })));

      const countries = demoRes?.data?.data || [];
      const total = countries.reduce((s: number, c: any) => s + c.count, 0);
      setTouristCountries(countries.slice(0, 5).map((c: any) => ({
        country: c.country, count: c.count,
        pct: total ? ((c.count / total) * 100).toFixed(1) : '0',
      })));

      setActivityData((actRes?.data?.data || []).slice(-7).map((d: any) => ({
        label: d.label || d.date || '',
        value: d.bookings || d.users || 0,
      })));

    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const maxBookings = Math.max(...workshopPop.map(w => w.bookings), 1);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Analytics & Reports</Text>
        <Text style={s.headerSub}>Platform performance insights</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#C9A227" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#C9A227']} />}
        >
          {/* KPI row */}
          {overview && (
            <>
              <View style={s.statRow}>
                <StatCard label="Artisans" value={overview.totalArtisans} color="#2F5D50" icon={<UserCheck size={16} color="#2F5D50" />} />
                <StatCard label="Tourists" value={overview.totalTourists} color="#C65D3B" icon={<Users size={16} color="#C65D3B" />} />
              </View>
              <View style={s.statRow}>
                <StatCard label="Workshops" value={overview.activeWorkshops} color="#C9A227" icon={<BarChart2 size={16} color="#C9A227" />} />
                <StatCard label="Pending" value={overview.pendingVerifications} color="#6366F1" icon={<TrendingUp size={16} color="#6366F1" />} />
              </View>
            </>
          )}

          {/* Activity Trend */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Activity Trend</Text>
              <View style={s.periodRow}>
                {PERIOD_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.periodBtn, period === opt.value && s.periodBtnActive]}
                    onPress={() => setPeriod(opt.value)}
                  >
                    <Text style={[s.periodBtnText, period === opt.value && s.periodBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {activityData.length > 0 ? (
              <MiniBarChart data={activityData} color="#2F5D50" />
            ) : (
              <Text style={s.noData}>No activity data available</Text>
            )}
          </View>

          {/* Workshop Popularity */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <TrendingUp size={16} color="#2F5D50" />
              <Text style={s.sectionTitle}>Workshop Popularity</Text>
            </View>
            {workshopPop.length === 0 ? (
              <Text style={s.noData}>No workshop data</Text>
            ) : (
              workshopPop.map((w, i) => (
                <View key={i} style={s.hbarRow}>
                  <Text style={s.hbarLabel} numberOfLines={1}>{w.name}</Text>
                  <HBar value={w.bookings} max={maxBookings} color="#C65D3B" />
                  <Text style={s.hbarVal}>{w.bookings}</Text>
                </View>
              ))
            )}
          </View>

          {/* Tourist Demographics */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Globe size={16} color="#2F5D50" />
              <Text style={s.sectionTitle}>Tourist Origins</Text>
            </View>
            {touristCountries.length === 0 ? (
              <Text style={s.noData}>No demographic data</Text>
            ) : (
              touristCountries.map((c, i) => (
                <View key={i} style={s.demoRow}>
                  <Text style={s.demoCountry}>{c.country}</Text>
                  <HBar value={c.count} max={Math.max(...touristCountries.map((x: any) => x.count), 1)} color="#2F5D50" />
                  <Text style={s.demoPct}>{c.pct}%</Text>
                </View>
              ))
            )}
          </View>

          {/* Top Artisans */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Star size={16} color="#C9A227" />
              <Text style={s.sectionTitle}>Top Performing Artisans</Text>
            </View>
            {topArtisans.length === 0 ? (
              <Text style={s.noData}>No artisan data</Text>
            ) : (
              topArtisans.map((art, i) => (
                <View key={i} style={s.artisanRow}>
                  <Text style={s.artisanRank}>#{i + 1}</Text>
                  <View style={s.artisanAvatar}>
                    <Text style={s.artisanAvatarText}>{art.initials}</Text>
                  </View>
                  <View style={s.artisanInfo}>
                    <Text style={s.artisanName} numberOfLines={1}>{art.name}</Text>
                    <Text style={s.artisanCraft}>{art.craft}</Text>
                  </View>
                  <View style={s.artisanStats}>
                    <Text style={s.artisanRating}>★ {art.rating}</Text>
                    <Text style={s.artisanBookings}>{art.bookings} workshops</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2F5D50', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  statRow: { flexDirection: 'row', gap: 10 },
  section: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E1E1E' },
  noData: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  periodRow: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F3F4F6' },
  periodBtnActive: { backgroundColor: '#E8F5E9' },
  periodBtnText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  periodBtnTextActive: { color: '#2F5D50', fontWeight: '700' },
  hbarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  hbarLabel: { fontSize: 12, color: '#374151', width: 100, fontWeight: '500' },
  hbarVal: { fontSize: 12, fontWeight: '700', color: '#374151', width: 28, textAlign: 'right' },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  demoCountry: { fontSize: 12, color: '#374151', width: 100, fontWeight: '500' },
  demoPct: { fontSize: 12, fontWeight: '700', color: '#374151', width: 38, textAlign: 'right' },
  artisanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  artisanRank: { fontSize: 13, fontWeight: '800', color: '#C9A227', width: 24 },
  artisanAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center' },
  artisanAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  artisanInfo: { flex: 1 },
  artisanName: { fontSize: 13, fontWeight: '700', color: '#1E1E1E' },
  artisanCraft: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  artisanStats: { alignItems: 'flex-end' },
  artisanRating: { fontSize: 13, fontWeight: '700', color: '#C9A227' },
  artisanBookings: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
});
