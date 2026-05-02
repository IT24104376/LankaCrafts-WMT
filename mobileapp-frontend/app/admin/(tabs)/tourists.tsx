import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Search, ShieldOff, ShieldCheck, Eye, MapPin, Mail, X, Users } from 'lucide-react-native';
import { getTourists, toggleTouristStatus } from '../../../src/api/adminApi';

type AccountStatus = 'all' | 'active' | 'suspended';

function StatusBadge({ status }: { status: 'active' | 'suspended' }) {
  const active = status === 'active';
  return (
    <View style={[sb.badge, { backgroundColor: active ? '#D1FAE5' : '#FEE2E2' }]}>
      <View style={[sb.dot, { backgroundColor: active ? '#10B981' : '#EF4444' }]} />
      <Text style={[sb.text, { color: active ? '#065F46' : '#7F1D1D' }]}>
        {active ? 'Active' : 'Suspended'}
      </Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

function DetailModal({ tourist, onClose, onToggle }: {
  tourist: any; onClose: () => void; onToggle: () => void;
}) {
  const initials = (tourist.fullName || tourist.name || 'T')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const isActive = tourist.status === 'active';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={[m.cover, { backgroundColor: tourist.color || '#C65D3B' }]}>
            <TouchableOpacity style={m.closeBtn} onPress={onClose}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={m.body} showsVerticalScrollIndicator={false}>
            <View style={m.avatarRow}>
              <View style={[m.avatar, { backgroundColor: tourist.color || '#C65D3B' }]}>
                <Text style={m.avatarText}>{initials}</Text>
              </View>
              <StatusBadge status={tourist.status || 'active'} />
            </View>
            <Text style={m.name}>{tourist.fullName || tourist.name}</Text>
            <Text style={m.country}>{tourist.country || 'Unknown Country'}</Text>

            <View style={m.grid}>
              {[
                { icon: <Mail size={14} color="#2F5D50" />, label: 'Email', val: tourist.email || 'N/A' },
                { icon: <MapPin size={14} color="#2F5D50" />, label: 'Country', val: tourist.country || 'N/A' },
              ].map(row => (
                <View key={row.label} style={m.gridItem}>
                  {row.icon}
                  <View>
                    <Text style={m.gridLabel}>{row.label}</Text>
                    <Text style={m.gridVal} numberOfLines={1}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[m.toggleBtn, { backgroundColor: isActive ? '#EF4444' : '#10B981' }]}
              onPress={() => { onToggle(); onClose(); }}
            >
              {isActive
                ? <><ShieldOff size={16} color="#fff" /><Text style={m.toggleBtnText}>Suspend Account</Text></>
                : <><ShieldCheck size={16} color="#fff" /><Text style={m.toggleBtnText}>Reactivate Account</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '75%', overflow: 'hidden' },
  cover: { height: 80 },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 40 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  country: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  grid: { gap: 10, marginBottom: 20 },
  gridItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  gridLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 1 },
  gridVal: { fontSize: 13, fontWeight: '600', color: '#1E1E1E' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  toggleBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default function TouristManagementScreen() {
  const [tourists, setTourists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus>('all');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try {
      const res = await getTourists();
      const list = (res.data?.data || res.data?.tourists || []).map((t: any) => ({
        ...t,
        fullName: t.fullName || t.name || '',
        status: t.status || 'active',
        initials: (t.fullName || t.name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      }));
      setTourists(list);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const handleToggle = async (id: string) => {
    try {
      await toggleTouristStatus(id);
      setTourists(prev => prev.map(t =>
        t._id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t
      ));
    } catch { Alert.alert('Error', 'Failed to update status.'); }
  };

  const filtered = tourists.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (t.fullName || '').toLowerCase().includes(q)
      || (t.email || '').toLowerCase().includes(q)
      || (t.country || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: tourists.length,
    active: tourists.filter(t => t.status === 'active').length,
    suspended: tourists.filter(t => t.status === 'suspended').length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Tourist Management</Text>
        <Text style={s.headerSub}>{counts.all} registered tourists</Text>
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        {[
          { label: 'Total', value: counts.all, color: '#2F5D50' },
          { label: 'Active', value: counts.active, color: '#10B981' },
          { label: 'Suspended', value: counts.suspended, color: '#EF4444' },
        ].map(st => (
          <View key={st.label} style={s.statItem}>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={15} color="#9CA3AF" />
          <TextInput
            style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search by name, email, country..." placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {(['all', 'active', 'suspended'] as AccountStatus[]).map(st => (
          <TouchableOpacity
            key={st}
            style={[s.filterTab, statusFilter === st && s.filterTabActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[s.filterTabText, statusFilter === st && s.filterTabTextActive]}>
              {st.charAt(0).toUpperCase() + st.slice(1)} ({counts[st]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#2F5D50']} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Users size={40} color="#D1D5DB" />
              <Text style={s.emptyText}>No tourists match your filters</Text>
            </View>
          ) : (
            filtered.map(tourist => {
              const initials = tourist.initials || (tourist.fullName || 'T')
                .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <View key={tourist._id} style={s.card}>
                  <View style={[s.avatar, { backgroundColor: tourist.color || '#C65D3B' }]}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.name} numberOfLines={1}>{tourist.fullName}</Text>
                    <Text style={s.email} numberOfLines={1}>{tourist.email}</Text>
                    <Text style={s.country}>{tourist.country || '—'}</Text>
                  </View>
                  <View style={s.cardRight}>
                    <StatusBadge status={tourist.status || 'active'} />
                    <View style={s.cardActions}>
                      <TouchableOpacity style={s.iconBtn} onPress={() => setSelected(tourist)}>
                        <Eye size={14} color="#2F5D50" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.iconBtn, tourist.status === 'active' ? s.redBtn : s.greenBtn]}
                        onPress={() => handleToggle(tourist._id)}
                      >
                        {tourist.status === 'active'
                          ? <ShieldOff size={14} color="#EF4444" />
                          : <ShieldCheck size={14} color="#10B981" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {selected && (
        <DetailModal
          tourist={selected}
          onClose={() => setSelected(null)}
          onToggle={() => handleToggle(selected._id)}
        />
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
  statsStrip: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 13, color: '#1E1E1E' },
  filterRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  filterTabActive: { backgroundColor: '#E8F5E9', borderColor: '#2F5D50' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#2F5D50', fontWeight: '700' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  email: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  country: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardActions: { flexDirection: 'row', gap: 5 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  greenBtn: { backgroundColor: '#F0FDF4' },
  redBtn: { backgroundColor: '#FEF2F2' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
