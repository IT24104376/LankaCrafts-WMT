import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Search, CheckCircle, XCircle, Eye, MapPin,
  Mail, Phone, X, Filter,
} from 'lucide-react-native';
import { getArtisans, updateArtisanStatus } from '../../../src/api/adminApi';

type Status = 'all' | 'pending' | 'verified' | 'rejected';

const STATUS_CONFIG = {
  pending: { label: 'Pending', backgroundColor: '#FEF3C7', textColor: '#92400E', dotColor: '#F59E0B' },
  verified: { label: 'Verified', backgroundColor: '#D1FAE5', textColor: '#065F46', dotColor: '#10B981' },
  rejected: { label: 'Rejected', backgroundColor: '#FEE2E2', textColor: '#7F1D1D', dotColor: '#EF4444' },
};

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || 'pending').toLowerCase() as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[normalized] || STATUS_CONFIG.pending;
  return (
    <View style={[sb.badge, { backgroundColor: cfg.backgroundColor }]}>
      <View style={[sb.dot, { backgroundColor: cfg.dotColor }]} />
      <Text style={[sb.text, { color: cfg.textColor }]}>{cfg.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

function DetailModal({ artisan, onClose, onApprove, onReject }: {
  artisan: any; onClose: () => void;
  onApprove: () => void; onReject: () => void;
}) {
  const initials = (artisan.fullName || artisan.name || 'A')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          {/* Modal header with color */}
          <View style={[m.cover, { backgroundColor: artisan.color || '#2F5D50' }]}>
            <TouchableOpacity style={m.closeBtn} onPress={onClose}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={m.body} showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <View style={m.avatarRow}>
              <View style={[m.avatar, { backgroundColor: artisan.color || '#2F5D50' }]}>
                <Text style={m.avatarText}>{initials}</Text>
              </View>
              <StatusBadge status={artisan.status || 'pending'} />
            </View>

            <Text style={m.name}>{artisan.fullName || artisan.name}</Text>
            <Text style={m.craft}>{artisan.craftType || artisan.craft}</Text>
            {artisan.bio ? <Text style={m.bio}>{artisan.bio}</Text> : null}

            <View style={m.grid}>
              {[
                { icon: <MapPin size={14} color="#2F5D50" />, label: 'Region', val: artisan.address?.city || artisan.region || 'N/A' },
                { icon: <Mail size={14} color="#2F5D50" />, label: 'Email', val: artisan.email || 'N/A' },
                { icon: <Phone size={14} color="#2F5D50" />, label: 'Phone', val: artisan.phone || 'N/A' },
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

            {/* Actions */}
            <View style={m.actions}>
              {artisan.status !== 'verified' && (
                <TouchableOpacity style={m.approveBtn} onPress={onApprove}>
                  <CheckCircle size={16} color="#fff" />
                  <Text style={m.approveBtnText}>Approve</Text>
                </TouchableOpacity>
              )}
              {artisan.status !== 'rejected' && (
                <TouchableOpacity style={m.rejectBtn} onPress={onReject}>
                  <XCircle size={16} color="#fff" />
                  <Text style={m.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', overflow: 'hidden' },
  cover: { height: 80 },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 40 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  craft: { fontSize: 14, fontWeight: '600', color: '#2F5D50', marginBottom: 10 },
  bio: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  grid: { gap: 10, marginBottom: 20 },
  gridItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  gridLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 1 },
  gridVal: { fontSize: 13, fontWeight: '600', color: '#1E1E1E' },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14 },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 14 },
  rejectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default function ArtisanVerificationScreen() {
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try {
      const res = await getArtisans();
      const list = (res.data?.data || []).map((a: any) => ({
        ...a,
        status: (a.status || 'pending').toLowerCase(),
        fullName: a.fullName || a.name || '',
        initials: (a.fullName || a.name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      }));
      setArtisans(list);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const handleApprove = async (id: string) => {
    try {
      await updateArtisanStatus(id, 'verified');
      setArtisans(prev => prev.map(a => a._id === id ? { ...a, status: 'verified' } : a));
      setSelected((prev: any) => prev?._id === id ? { ...prev, status: 'verified' } : prev);
    } catch { Alert.alert('Error', 'Failed to approve.'); }
  };

  const handleReject = async (id: string) => {
    try {
      await updateArtisanStatus(id, 'rejected');
      setArtisans(prev => prev.map(a => a._id === id ? { ...a, status: 'rejected' } : a));
      setSelected((prev: any) => prev?._id === id ? { ...prev, status: 'rejected' } : prev);
    } catch { Alert.alert('Error', 'Failed to reject.'); }
  };

  const filtered = artisans.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (a.fullName || '').toLowerCase().includes(q)
      || (a.craftType || '').toLowerCase().includes(q)
      || (a.email || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: artisans.length,
    pending: artisans.filter(a => a.status === 'pending').length,
    verified: artisans.filter(a => a.status === 'verified').length,
    rejected: artisans.filter(a => a.status === 'rejected').length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Artisan Verification</Text>
        <Text style={s.headerSub}>{counts.pending} pending review</Text>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={15} color="#9CA3AF" />
          <TextInput
            style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search by name, craft, email..." placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {(['all', 'pending', 'verified', 'rejected'] as Status[]).map(st => (
          <TouchableOpacity
            key={st}
            style={[s.filterTab, statusFilter === st && s.filterTabActive]}
            onPress={() => setStatusFilter(st)}
          >
            {st !== 'all' && <View style={[s.filterDot, { backgroundColor: STATUS_CONFIG[st].dotColor }]} />}
            <Text style={[s.filterTabText, statusFilter === st && s.filterTabTextActive]}>
              {st === 'all' ? 'All' : STATUS_CONFIG[st].label} ({counts[st]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Filter size={40} color="#D1D5DB" />
              <Text style={s.emptyText}>No artisans match your filters</Text>
            </View>
          ) : (
            filtered.map(artisan => (
              <View key={artisan._id} style={s.card}>
                <View style={s.cardLeft}>
                  <View style={[s.avatar, { backgroundColor: artisan.color || '#2F5D50' }]}>
                    <Text style={s.avatarText}>{artisan.initials}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.name} numberOfLines={1}>{artisan.fullName}</Text>
                    <Text style={s.craft}>{artisan.craftType || artisan.craft || '—'}</Text>
                    <View style={s.locationRow}>
                      <MapPin size={10} color="#9CA3AF" />
                      <Text style={s.location}>{artisan.address?.city || artisan.region || 'Unknown'}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.cardRight}>
                  <StatusBadge status={artisan.status} />
                  <View style={s.actions}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => setSelected(artisan)}>
                      <Eye size={14} color="#2F5D50" />
                    </TouchableOpacity>
                    {artisan.status !== 'verified' && (
                      <TouchableOpacity style={[s.iconBtn, s.greenBtn]} onPress={() => handleApprove(artisan._id)}>
                        <CheckCircle size={14} color="#10B981" />
                      </TouchableOpacity>
                    )}
                    {artisan.status !== 'rejected' && (
                      <TouchableOpacity style={[s.iconBtn, s.redBtn]} onPress={() => handleReject(artisan._id)}>
                        <XCircle size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {selected && (
        <DetailModal
          artisan={selected}
          onClose={() => setSelected(null)}
          onApprove={() => { handleApprove(selected._id); }}
          onReject={() => { handleReject(selected._id); }}
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
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 13, color: '#1E1E1E' },
  filterScroll: { backgroundColor: '#fff' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  filterTabActive: { backgroundColor: '#E8F5E9', borderColor: '#2F5D50' },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#2F5D50', fontWeight: '700' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  craft: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  location: { fontSize: 10, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  actions: { flexDirection: 'row', gap: 5 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  greenBtn: { backgroundColor: '#F0FDF4' },
  redBtn: { backgroundColor: '#FEF2F2' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
