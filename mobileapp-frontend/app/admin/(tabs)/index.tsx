import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  UserCheck, Users, Building2, AlertCircle,
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  MapPin, Activity, LogOut,
} from 'lucide-react-native';
import {
  getAnalyticsOverview, getRecentActivity,
  getArtisans, updateArtisanStatus,
} from '../../../src/api/adminApi';
import { useAuth } from '../../../src/context/AuthContext';

const COLORS = {
  forest: '#2F5D50', mustard: '#C9A227', terra: '#C65D3B',
  indigo: '#6366F1', bg: '#0F3D30',
};

function KpiCard({ title, value, desc, icon, color, trend }: {
  title: string; value: string; desc: string;
  icon: React.ReactNode; color: string; trend: 'up' | 'down';
}) {
  return (
    <View style={[k.card, { borderLeftColor: color }]}>
      <View style={k.top}>
        <View style={[k.iconBox, { backgroundColor: color + '20' }]}>{icon}</View>
        <View style={[k.trendBadge, { backgroundColor: trend === 'up' ? '#DCFCE7' : '#FEF2F2' }]}>
          {trend === 'up'
            ? <TrendingUp size={10} color="#16A34A" />
            : <TrendingDown size={10} color="#DC2626" />
          }
        </View>
      </View>
      <Text style={k.value}>{value}</Text>
      <Text style={k.title}>{title}</Text>
      <Text style={k.desc}>{desc}</Text>
    </View>
  );
}

const k = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, flex: 1,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendBadge: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '900', color: '#1E1E1E' },
  title: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 2 },
  desc: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
});

export default function AdminDashboardScreen() {
  const { admin, adminLogout } = useAuth();
  const router = useRouter();
  const [kpi, setKpi] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [overviewRes, activityRes, pendingRes] = await Promise.all([
        getAnalyticsOverview().catch(() => null),
        getRecentActivity().catch(() => null),
        getArtisans({ status: 'pending' }).catch(() => null),
      ]);
      if (overviewRes?.data?.data) setKpi(overviewRes.data.data);
      setActivity(activityRes?.data?.data || []);
      setPending((pendingRes?.data?.data || []).slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const handleApprove = async (id: string) => {
    try {
      await updateArtisanStatus(id, 'verified');
      setPending(prev => prev.filter(p => p._id !== id));
    } catch {
      Alert.alert('Error', 'Failed to approve artisan.');
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert('Reject Artisan', 'Are you sure you want to reject this artisan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try {
            await updateArtisanStatus(id, 'rejected');
            setPending(prev => prev.filter(p => p._id !== id));
          } catch {
            Alert.alert('Error', 'Failed to reject artisan.');
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { adminLogout(); router.replace('/'); } }
    ]);
  };

  const adminInitials = admin?.name
    ? admin.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{adminInitials}</Text>
          </View>
          <View>
            <Text style={s.headerGreeting}>Admin Panel</Text>
            <Text style={s.headerName}>{admin?.name || 'Administrator'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#C9A227" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#C9A227" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#C9A227']} />
          }
        >
          {/* KPI grid */}
          {kpi && (
            <>
              <View style={s.kpiRow}>
                <KpiCard
                  title="Total Artisans" value={String(kpi.totalArtisans || 0)}
                  desc="Registered artisans" color={COLORS.forest} trend="up"
                  icon={<UserCheck size={18} color={COLORS.forest} />}
                />
                <KpiCard
                  title="Total Tourists" value={String(kpi.totalTourists || 0)}
                  desc="Platform visitors" color={COLORS.terra} trend="up"
                  icon={<Users size={18} color={COLORS.terra} />}
                />
              </View>
              <View style={s.kpiRow}>
                <KpiCard
                  title="Active Workshops" value={String(kpi.activeWorkshops || 0)}
                  desc="Running this month" color={COLORS.mustard} trend="up"
                  icon={<Building2 size={18} color={COLORS.mustard} />}
                />
                <KpiCard
                  title="Pending Reviews" value={String(kpi.pendingVerifications || 0)}
                  desc="Awaiting verification" color={COLORS.indigo} trend="down"
                  icon={<AlertCircle size={18} color={COLORS.indigo} />}
                />
              </View>
            </>
          )}

          {/* Pending verifications */}
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Pending Verifications</Text>
              <TouchableOpacity onPress={() => router.push('/admin/(tabs)/artisans')}>
                <Text style={s.seeAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {pending.length === 0 ? (
              <View style={s.emptySection}>
                <CheckCircle size={32} color="#D1FAE5" />
                <Text style={s.emptyText}>All caught up! No pending requests.</Text>
              </View>
            ) : (
              pending.map(req => {
                const initials = (req.fullName || req.name || 'A')
                  .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <View key={req._id} style={s.pendingItem}>
                    <View style={[s.pendingAvatar, { backgroundColor: req.color || COLORS.forest }]}>
                      <Text style={s.pendingAvatarText}>{initials}</Text>
                    </View>
                    <View style={s.pendingInfo}>
                      <Text style={s.pendingName} numberOfLines={1}>{req.fullName || req.name}</Text>
                      <View style={s.pendingMeta}>
                        <Text style={s.pendingCraft}>{req.craftType || req.craft}</Text>
                        {(req.address?.city || req.region) && (
                          <>
                            <Text style={s.dot}>·</Text>
                            <MapPin size={10} color="#9CA3AF" />
                            <Text style={s.pendingRegion}>{req.address?.city || req.region}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={s.pendingActions}>
                      <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(req._id)}>
                        <CheckCircle size={14} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(req._id)}>
                        <XCircle size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Recent activity */}
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              <Activity size={14} color="#9CA3AF" />
            </View>
            {activity.length === 0 ? (
              <Text style={s.emptyText}>No recent activity</Text>
            ) : (
              activity.slice(0, 8).map((item, i) => (
                <View key={item._id || i} style={s.activityItem}>
                  <View style={[s.activityDot, { backgroundColor: item.color || COLORS.forest }]} />
                  <View style={s.activityInfo}>
                    <Text style={s.activityDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={s.activityUser}>{item.user}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Quick actions */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.quickGrid}>
              {[
                { label: 'Verify Artisans', color: '#10B981', route: '/admin/(tabs)/artisans' },
                { label: 'Manage Tourists', color: '#F59E0B', route: '/admin/(tabs)/tourists' },
                { label: 'Review Reports', color: '#6366F1', route: '/admin/(tabs)/reviews' },
                { label: 'View Analytics', color: '#2F5D50', route: '/admin/(tabs)/analytics' },
              ].map(q => (
                <TouchableOpacity
                  key={q.label}
                  style={[s.quickBtn, { backgroundColor: q.color }]}
                  onPress={() => router.push(q.route as any)}
                  activeOpacity={0.8}
                >
                  <Text style={s.quickBtnText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2F5D50', paddingHorizontal: 20, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#C9A227',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#2F5D50' },
  headerGreeting: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  logoutBtn: { padding: 8 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E1E1E' },
  seeAll: { fontSize: 12, fontWeight: '700', color: '#2F5D50' },
  emptySection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  pendingItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  pendingAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pendingAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pendingInfo: { flex: 1 },
  pendingName: { fontSize: 13, fontWeight: '700', color: '#1E1E1E' },
  pendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pendingCraft: { fontSize: 11, color: '#6B7280' },
  dot: { fontSize: 11, color: '#D1D5DB' },
  pendingRegion: { fontSize: 11, color: '#9CA3AF' },
  pendingActions: { flexDirection: 'row', gap: 6 },
  approveBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  activityInfo: { flex: 1 },
  activityDesc: { fontSize: 12, fontWeight: '600', color: '#374151', lineHeight: 17 },
  activityUser: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  quickBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
